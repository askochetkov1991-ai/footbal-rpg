import type { DiceResult } from "../types";

export function rollD6(count: number): DiceResult {
  const n = Math.max(1, count);
  const rolls = Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1);
  return { rolls, total: rolls.reduce((sum, die) => sum + die, 0) };
}

export function aiDiceCount(fixedStrength: number): number {
  return Math.floor(fixedStrength / 4);
}
