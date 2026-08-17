import type { DiceResult } from "../../types";

export function DiceRoll({ player, ai }: { player?: DiceResult; ai?: DiceResult }) {
  if (!player || !ai) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-center text-sm">
      <div className="rounded-xl bg-black/30 p-3">
        <p className="text-xs text-gray-400">Вы</p>
        <p className="mt-1 font-mono text-lg text-orange-400">{player.rolls.join(" + ")}</p>
        <p className="text-white font-bold">{player.total}</p>
      </div>
      <div className="rounded-xl bg-black/30 p-3">
        <p className="text-xs text-gray-400">Соперник</p>
        <p className="mt-1 font-mono text-lg text-gray-200">{ai.rolls.join(" + ")}</p>
        <p className="text-white font-bold">{ai.total}</p>
      </div>
    </div>
  );
}
