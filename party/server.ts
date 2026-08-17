import type * as Party from "partykit/server";
import {
  emptySquad,
  isSquadComplete,
  pickPlayer,
  slotsFilled,
  startingBudget,
  unpickPosition,
} from "../src/event/draft";
import {
  DRAFT_DURATION_MS,
  IDENTIFY_TIMEOUT_MS,
  MAX_EVENT_FANS,
  PRESENCE_GRACE_MS,
  normalizeNick,
  parseClientMessage,
  type ErrorCode,
  type EventFan,
  type EventPhase,
  type FanYou,
  type ServerMessage,
} from "../src/event/protocol";
import type { Position, Squad } from "../src/types";

type ConnState =
  | { role: "unidentified" }
  | { role: "host" }
  | { role: "fan"; playerId: string }
  | { role: "eliminated"; playerId: string };

type FanRecord = {
  id: string;
  nick: string;
  connected: boolean;
  connectionId: string | null;
  squad: Squad;
  budget: number;
};

export default class EventRoom implements Party.Server {
  readonly options = { hibernate: false };

  hostToken: string | null = null;
  hostConnectionId: string | null = null;
  fans = new Map<string, FanRecord>();
  fanOrder: string[] = [];
  eliminated = new Set<string>();
  phase: EventPhase = "lobby";
  round = 0;
  draftEndsAt: number | null = null;
  identifyTimers = new Map<string, ReturnType<typeof setTimeout>>();
  presenceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  draftTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(connection: Party.Connection) {
    connection.setState({ role: "unidentified" } satisfies ConnState);
    const timer = setTimeout(() => {
      const state = getState(connection);
      if (state.role === "unidentified") connection.close(4000, "identify-timeout");
    }, IDENTIFY_TIMEOUT_MS);
    this.identifyTimers.set(connection.id, timer);
  }

  onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    this.maybeFinishDraft();
    const parsed = parseClientMessage(message);
    if (!parsed) {
      this.sendError(sender, "BAD_MESSAGE", "Непонятное сообщение.");
      return;
    }
    if (parsed.type === "claim-host") this.claimHost(sender, parsed.token);
    else if (parsed.type === "join") this.joinFan(sender, parsed.playerId, parsed.nick);
    else if (parsed.type === "leave") this.leaveFan(sender);
    else if (parsed.type === "start-draft") this.startDraft(sender);
    else if (parsed.type === "pick") this.pick(sender, parsed.playerId);
    else if (parsed.type === "unpick") this.unpick(sender, parsed.position);
  }

  onClose(connection: Party.Connection) {
    this.clearIdentifyTimer(connection.id);
    const state = getState(connection);
    if (state.role === "host") {
      if (this.hostConnectionId === connection.id) {
        this.hostConnectionId = null;
        this.broadcastToAll();
      }
      return;
    }
    if (state.role === "fan") this.disconnectFan(state.playerId, connection.id);
  }

  onError(connection: Party.Connection) {
    this.onClose(connection);
  }

  private claimHost(connection: Party.Connection, token: string) {
    this.clearIdentifyTimer(connection.id);
    if (this.hostToken && this.hostToken !== token) {
      this.sendError(connection, "HOST_TAKEN", "Этой комнатой уже управляет другой ведущий.");
      connection.close(4001, "host-taken");
      return;
    }
    this.hostToken = token;
    this.hostConnectionId = connection.id;
    connection.setState({ role: "host" } satisfies ConnState);
    this.send(connection, this.hostSnapshot());
  }

  private joinFan(connection: Party.Connection, playerId: string, rawNick: string) {
    this.clearIdentifyTimer(connection.id);
    if (this.eliminated.has(playerId)) {
      this.markEliminated(connection, playerId);
      return;
    }
    if (!this.hostToken) {
      this.sendError(connection, "NO_HOST", "Комната не найдена. Ведущий должен открыть пульт первым.");
      connection.close(4002, "no-host");
      return;
    }
    const nick = normalizeNick(rawNick);
    if (!nick) {
      this.sendError(connection, "BAD_NICK", "Введите ник.");
      return;
    }

    const existing = this.fans.get(playerId);
    if (!existing && this.fans.size >= MAX_EVENT_FANS) {
      this.sendError(connection, "ROOM_FULL", `Комната заполнена (${MAX_EVENT_FANS}).`);
      connection.close(4003, "room-full");
      return;
    }

    this.clearPresenceTimer(playerId);
    if (existing) {
      existing.nick = nick;
      existing.connected = true;
      existing.connectionId = connection.id;
    } else {
      this.fans.set(playerId, {
        id: playerId,
        nick,
        connected: true,
        connectionId: connection.id,
        squad: emptySquad(),
        budget: startingBudget(),
      });
      this.fanOrder.push(playerId);
    }
    connection.setState({ role: "fan", playerId } satisfies ConnState);
    this.broadcastToAll();
  }

  private leaveFan(connection: Party.Connection) {
    const state = getState(connection);
    if (state.role === "eliminated") {
      connection.setState({ role: "unidentified" } satisfies ConnState);
      connection.close(1000, "left");
      return;
    }
    if (state.role !== "fan") return;
    this.removeFan(state.playerId);
    connection.setState({ role: "unidentified" } satisfies ConnState);
    connection.close(1000, "left");
  }

  private startDraft(connection: Party.Connection) {
    if (getState(connection).role !== "host") {
      this.sendError(connection, "NOT_HOST", "Только ведущий запускает драфт.");
      return;
    }
    if (this.phase === "draft") {
      this.sendError(connection, "WRONG_PHASE", "Драфт уже идёт.");
      return;
    }
    for (const fan of this.fans.values()) {
      fan.squad = emptySquad();
      fan.budget = startingBudget();
      this.clearPresenceTimer(fan.id);
    }
    this.round += 1;
    this.phase = "draft";
    this.draftEndsAt = Date.now() + DRAFT_DURATION_MS;
    this.clearDraftTimer();
    this.draftTimer = setTimeout(() => this.finishDraft(), DRAFT_DURATION_MS);
    this.broadcastToAll();
  }

  private pick(connection: Party.Connection, playerId: string) {
    const fan = this.requireDraftingFan(connection);
    if (!fan) return;
    const result = pickPlayer(fan.squad, fan.budget, playerId);
    if (!result.ok) {
      const message =
        result.reason === "budget"
          ? "Не хватает бюджета."
          : result.reason === "slot"
            ? "Эта позиция уже занята."
            : "Этого футболиста нет на рынке.";
      this.sendError(connection, "BAD_PICK", message);
      return;
    }
    fan.squad = result.squad;
    fan.budget = result.budget;
    this.broadcastToAll();
  }

  private unpick(connection: Party.Connection, position: Position) {
    const fan = this.requireDraftingFan(connection);
    if (!fan) return;
    const result = unpickPosition(fan.squad, fan.budget, position);
    if (!result.ok) {
      this.sendError(connection, "BAD_PICK", "На этой позиции никого нет.");
      return;
    }
    fan.squad = result.squad;
    fan.budget = result.budget;
    this.broadcastToAll();
  }

  private requireDraftingFan(connection: Party.Connection): FanRecord | null {
    this.maybeFinishDraft();
    const state = getState(connection);
    if (state.role !== "fan") {
      this.sendError(connection, "NOT_DRAFT", "Состав набирает только болельщик.");
      return null;
    }
    if (this.phase !== "draft" || (this.draftEndsAt != null && Date.now() >= this.draftEndsAt)) {
      this.sendError(connection, "NOT_DRAFT", "Драфт сейчас закрыт.");
      return null;
    }
    const fan = this.fans.get(state.playerId);
    if (!fan) {
      this.sendError(connection, "NOT_DRAFT", "Тебя нет в турнире.");
      return null;
    }
    return fan;
  }

  private maybeFinishDraft() {
    if (this.phase === "draft" && this.draftEndsAt != null && Date.now() >= this.draftEndsAt) {
      this.finishDraft();
    }
  }

  private finishDraft() {
    if (this.phase !== "draft") return;
    this.clearDraftTimer();
    this.phase = "ready";
    this.draftEndsAt = null;
    const incomplete = this.fanOrder.filter((id) => {
      const fan = this.fans.get(id);
      return fan ? !isSquadComplete(fan.squad) : false;
    });
    for (const playerId of incomplete) {
      this.eliminateFan(playerId);
    }
    this.broadcastToAll();
  }

  private eliminateFan(playerId: string) {
    const fan = this.fans.get(playerId);
    if (!fan) return;
    this.eliminated.add(playerId);
    if (fan.connectionId) {
      for (const connection of this.room.getConnections()) {
        if (connection.id === fan.connectionId) {
          connection.setState({ role: "eliminated", playerId } satisfies ConnState);
          this.send(connection, { type: "eliminated", reason: "no-squad" });
          break;
        }
      }
    }
    this.clearPresenceTimer(playerId);
    this.fans.delete(playerId);
    this.fanOrder = this.fanOrder.filter((id) => id !== playerId);
  }

  private markEliminated(connection: Party.Connection, playerId: string) {
    connection.setState({ role: "eliminated", playerId } satisfies ConnState);
    this.send(connection, { type: "eliminated", reason: "no-squad" });
    this.sendError(connection, "ELIMINATED", "Дисквалификация: не успел набрать состав.");
  }

  private disconnectFan(playerId: string, connectionId: string) {
    const fan = this.fans.get(playerId);
    if (!fan || fan.connectionId !== connectionId) return;
    fan.connected = false;
    fan.connectionId = null;
    this.broadcastToAll();
    if (this.phase !== "lobby") return;
    this.clearPresenceTimer(playerId);
    const timer = setTimeout(() => {
      if (this.phase !== "lobby") return;
      const current = this.fans.get(playerId);
      if (current && !current.connected) this.removeFan(playerId);
    }, PRESENCE_GRACE_MS);
    this.presenceTimers.set(playerId, timer);
  }

  private removeFan(playerId: string) {
    this.clearPresenceTimer(playerId);
    if (!this.fans.delete(playerId)) return;
    this.fanOrder = this.fanOrder.filter((id) => id !== playerId);
    this.broadcastToAll();
  }

  private publicFans(): EventFan[] {
    return this.fanOrder
      .map((id) => this.fans.get(id))
      .filter((fan): fan is FanRecord => Boolean(fan))
      .map((fan) => ({
        id: fan.id,
        nick: fan.nick,
        connected: fan.connected,
        slotsFilled: slotsFilled(fan.squad),
        squadComplete: isSquadComplete(fan.squad),
      }));
  }

  private fanYou(playerId: string): FanYou {
    const fan = this.fans.get(playerId);
    return {
      role: "fan",
      playerId,
      budget: fan?.budget ?? startingBudget(),
      squad: fan?.squad ?? emptySquad(),
    };
  }

  private hostSnapshot(): Extract<ServerMessage, { type: "snapshot" }> {
    return {
      type: "snapshot",
      code: this.room.id.toUpperCase(),
      hasHost: Boolean(this.hostConnectionId),
      phase: this.phase,
      round: this.round,
      draftEndsAt: this.draftEndsAt,
      serverNow: Date.now(),
      eliminatedCount: this.eliminated.size,
      fans: this.publicFans(),
      you: { role: "host" },
    };
  }

  private broadcastToAll() {
    const base = this.hostSnapshot();
    for (const connection of this.room.getConnections()) {
      const state = getState(connection);
      if (state.role === "host") {
        this.send(connection, { ...base, you: { role: "host" } });
      } else if (state.role === "fan") {
        this.send(connection, { ...base, you: this.fanYou(state.playerId) });
      }
    }
  }

  private sendError(connection: Party.Connection, code: ErrorCode, message: string) {
    this.send(connection, { type: "error", code, message });
  }

  private send(connection: Party.Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message));
  }

  private clearIdentifyTimer(connectionId: string) {
    const timer = this.identifyTimers.get(connectionId);
    if (timer) clearTimeout(timer);
    this.identifyTimers.delete(connectionId);
  }

  private clearPresenceTimer(playerId: string) {
    const timer = this.presenceTimers.get(playerId);
    if (timer) clearTimeout(timer);
    this.presenceTimers.delete(playerId);
  }

  private clearDraftTimer() {
    if (this.draftTimer) clearTimeout(this.draftTimer);
    this.draftTimer = null;
  }
}

function getState(connection: Party.Connection): ConnState {
  return (connection.state as ConnState | undefined) ?? { role: "unidentified" };
}

EventRoom satisfies Party.Worker;
