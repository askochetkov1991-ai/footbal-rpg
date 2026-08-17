import { PLAYERS, getPlayer } from "../data/players";
import { POSITIONS, type Position, type Squad } from "../types";
import { EVENT_BUDGET } from "./protocol";

export function emptySquad(): Squad {
  return { GK: null, DEF: null, MID: null, FWD: null };
}

export function eventCatalog() {
  return PLAYERS.filter((player) => !player.secret);
}

export function slotsFilled(squad: Squad): number {
  return POSITIONS.filter((pos) => Boolean(squad[pos])).length;
}

export function isSquadComplete(squad: Squad): boolean {
  return POSITIONS.every((pos) => Boolean(squad[pos]));
}

export function startingBudget(): number {
  return EVENT_BUDGET;
}

export function pickPlayer(
  squad: Squad,
  budget: number,
  playerId: string,
): { ok: true; squad: Squad; budget: number } | { ok: false; reason: "unknown" | "slot" | "budget" } {
  const player = getPlayer(playerId);
  if (!player || player.secret) return { ok: false, reason: "unknown" };
  if (squad[player.position]) return { ok: false, reason: "slot" };
  if (player.cost > budget) return { ok: false, reason: "budget" };
  return {
    ok: true,
    squad: { ...squad, [player.position]: player.id },
    budget: budget - player.cost,
  };
}

export function unpickPosition(
  squad: Squad,
  budget: number,
  position: Position,
): { ok: true; squad: Squad; budget: number } | { ok: false } {
  const id = squad[position];
  if (!id) return { ok: false };
  const player = getPlayer(id);
  return {
    ok: true,
    squad: { ...squad, [position]: null },
    budget: budget + (player?.cost ?? 0),
  };
}
