import { LEAGUE_LABEL } from "../../types";
import { useGameStore } from "../../store/gameStore";

export function Header() {
  const league = useGameStore((s) => s.league);
  const budget = useGameStore((s) => s.budget);
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">Football RPG</p>
        <h1 className="text-base font-bold text-white">{LEAGUE_LABEL[league]}</h1>
      </div>
      <div className="rounded-xl bg-orange-500/15 px-3 py-1.5 text-sm font-semibold text-orange-400">
        {budget} очк.
      </div>
    </header>
  );
}
