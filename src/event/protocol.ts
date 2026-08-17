export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_EVENT_FANS = 80;
export const NICK_MAX_LENGTH = 20;
export const PRESENCE_GRACE_MS = 10_000;
export const IDENTIFY_TIMEOUT_MS = 8_000;

export type EventFan = {
  id: string;
  nick: string;
  connected: boolean;
};

export type ClaimHostMessage = { type: "claim-host"; token: string };
export type JoinMessage = { type: "join"; playerId: string; nick: string };
export type LeaveMessage = { type: "leave" };

export type ClientMessage = ClaimHostMessage | JoinMessage | LeaveMessage;

export type SnapshotMessage = {
  type: "snapshot";
  code: string;
  hasHost: boolean;
  fans: EventFan[];
  you: { role: "host" } | { role: "fan"; playerId: string };
};

export type ErrorCode = "NO_HOST" | "ROOM_FULL" | "BAD_NICK" | "HOST_TAKEN" | "BAD_MESSAGE";

export type ErrorMessage = {
  type: "error";
  code: ErrorCode;
  message: string;
};

export type ServerMessage = SnapshotMessage | ErrorMessage;

export function generateRoomCode(random: () => number = Math.random): string {
  return Array.from({ length: ROOM_CODE_LENGTH }, () => {
    return ROOM_CODE_ALPHABET[Math.floor(random() * ROOM_CODE_ALPHABET.length)];
  }).join("");
}

export function generateToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidCode(code: string): boolean {
  return (
    code.length === ROOM_CODE_LENGTH &&
    [...code].every((char) => ROOM_CODE_ALPHABET.includes(char))
  );
}

export function normalizeNick(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, NICK_MAX_LENGTH);
}

export function parseClientMessage(raw: string | ArrayBuffer): ClientMessage | null {
  if (typeof raw !== "string") return null;
  try {
    const data = JSON.parse(raw) as Partial<ClientMessage>;
    if (!data || typeof data !== "object" || typeof data.type !== "string") return null;
    if (data.type === "claim-host" && typeof data.token === "string" && data.token.length > 0) {
      return { type: "claim-host", token: data.token };
    }
    if (
      data.type === "join" &&
      typeof data.playerId === "string" &&
      data.playerId.length > 0 &&
      typeof data.nick === "string"
    ) {
      return { type: "join", playerId: data.playerId, nick: data.nick };
    }
    if (data.type === "leave") return { type: "leave" };
    return null;
  } catch {
    return null;
  }
}

export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const data = JSON.parse(raw) as Partial<ServerMessage>;
    if (!data || typeof data !== "object" || typeof data.type !== "string") return null;
    if (data.type === "snapshot" && Array.isArray(data.fans) && data.you) {
      return data as SnapshotMessage;
    }
    if (data.type === "error" && typeof data.code === "string" && typeof data.message === "string") {
      return data as ErrorMessage;
    }
    return null;
  } catch {
    return null;
  }
}
