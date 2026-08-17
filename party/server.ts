import type * as Party from "partykit/server";
import {
  IDENTIFY_TIMEOUT_MS,
  MAX_EVENT_FANS,
  PRESENCE_GRACE_MS,
  normalizeNick,
  parseClientMessage,
  type ErrorCode,
  type EventFan,
  type ServerMessage,
} from "../src/event/protocol";

type ConnState =
  | { role: "unidentified" }
  | { role: "host" }
  | { role: "fan"; playerId: string };

type FanRecord = EventFan & {
  connectionId: string | null;
};

export default class EventRoom implements Party.Server {
  readonly options = { hibernate: false };

  hostToken: string | null = null;
  hostConnectionId: string | null = null;
  fans = new Map<string, FanRecord>();
  fanOrder: string[] = [];
  identifyTimers = new Map<string, ReturnType<typeof setTimeout>>();
  presenceTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    const parsed = parseClientMessage(message);
    if (!parsed) {
      this.sendError(sender, "BAD_MESSAGE", "Непонятное сообщение.");
      return;
    }
    if (parsed.type === "claim-host") this.claimHost(sender, parsed.token);
    else if (parsed.type === "join") this.joinFan(sender, parsed.playerId, parsed.nick);
    else if (parsed.type === "leave") this.leaveFan(sender, true);
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
    this.send(connection, this.snapshotFor("host"));
  }

  private joinFan(connection: Party.Connection, playerId: string, rawNick: string) {
    this.clearIdentifyTimer(connection.id);
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
      });
      this.fanOrder.push(playerId);
    }
    connection.setState({ role: "fan", playerId } satisfies ConnState);
    this.broadcastToAll();
  }

  private leaveFan(connection: Party.Connection, immediate: boolean) {
    const state = getState(connection);
    if (state.role !== "fan") return;
    if (immediate) {
      this.removeFan(state.playerId);
      connection.setState({ role: "unidentified" } satisfies ConnState);
      connection.close(1000, "left");
      return;
    }
    this.disconnectFan(state.playerId, connection.id);
  }

  private disconnectFan(playerId: string, connectionId: string) {
    const fan = this.fans.get(playerId);
    if (!fan || fan.connectionId !== connectionId) return;
    fan.connected = false;
    fan.connectionId = null;
    this.broadcastToAll();
    this.clearPresenceTimer(playerId);
    const timer = setTimeout(() => {
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
      .map(({ id, nick, connected }) => ({ id, nick, connected }));
  }

  private snapshotFor(role: "host"): Extract<ServerMessage, { type: "snapshot" }>;
  private snapshotFor(role: "fan", playerId: string): Extract<ServerMessage, { type: "snapshot" }>;
  private snapshotFor(role: "host" | "fan", playerId?: string): Extract<ServerMessage, { type: "snapshot" }> {
    return {
      type: "snapshot",
      code: this.room.id.toUpperCase(),
      hasHost: Boolean(this.hostConnectionId),
      fans: this.publicFans(),
      you: role === "host" ? { role: "host" } : { role: "fan", playerId: playerId ?? "" },
    };
  }

  private broadcastToAll() {
    const fans = this.publicFans();
    for (const connection of this.room.getConnections()) {
      const state = getState(connection);
      if (state.role === "host") {
        this.send(connection, {
          type: "snapshot",
          code: this.room.id.toUpperCase(),
          hasHost: Boolean(this.hostConnectionId),
          fans,
          you: { role: "host" },
        });
      } else if (state.role === "fan") {
        this.send(connection, {
          type: "snapshot",
          code: this.room.id.toUpperCase(),
          hasHost: Boolean(this.hostConnectionId),
          fans,
          you: { role: "fan", playerId: state.playerId },
        });
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
}

function getState(connection: Party.Connection): ConnState {
  return (connection.state as ConnState | undefined) ?? { role: "unidentified" };
}

EventRoom satisfies Party.Worker;
