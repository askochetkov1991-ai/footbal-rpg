import { SeasonSummaryCard } from "../components/league/SeasonSummary";
import { StandingsTable } from "../components/league/StandingsTable";
import { useGameStore } from "../store/gameStore";

export function TablePage() {
  const standings = useGameStore((s) => s.standings);
  const phase = useGameStore((s) => s.phase);
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Таблица</h2>
      {phase === "season_end" || phase === "game_won" ? <SeasonSummaryCard /> : null}
      <StandingsTable rows={standings} />
    </div>
  );
}
