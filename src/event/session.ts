const HOST_KEY = "football-rpg-event-host";
const FAN_KEY = "football-rpg-event-fan";

export type HostSession = {
  code: string;
  token: string;
};

export type FanSession = {
  code: string;
  playerId: string;
  nick: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadHostSession(): HostSession | null {
  const session = readJson<HostSession>(HOST_KEY);
  if (!session?.code || !session?.token) return null;
  return session;
}

export function saveHostSession(session: HostSession): void {
  sessionStorage.setItem(HOST_KEY, JSON.stringify(session));
}

export function clearHostSession(): void {
  sessionStorage.removeItem(HOST_KEY);
}

export function loadFanSession(): FanSession | null {
  const session = readJson<FanSession>(FAN_KEY);
  if (!session?.code || !session?.playerId || !session?.nick) return null;
  return session;
}

export function saveFanSession(session: FanSession): void {
  sessionStorage.setItem(FAN_KEY, JSON.stringify(session));
}

export function clearFanSession(): void {
  sessionStorage.removeItem(FAN_KEY);
}
