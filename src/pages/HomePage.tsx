import { MATCHES_PER_SEASON, POSITION_LABEL, POSITIONS } from "../types";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useGameStore } from "../store/gameStore";

export function HomePage() {
  const matchIndex = useGameStore((s) => s.matchIndex);
  const phase = useGameStore((s) => s.phase);
  const squad = useGameStore((s) => s.squad);
  const startNextMatch = useGameStore((s) => s.startNextMatch);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const resetGame = useGameStore((s) => s.resetGame);
  const opponent = useGameStore((s) => s.getCurrentOpponentName());
  const missing = POSITIONS.filter((pos) => !squad[pos]).map((pos) => POSITION_LABEL[pos]);
  const ready = missing.length === 0 && phase !== "season_end" && phase !== "game_won";

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs uppercase text-gray-400">Прогресс сезона</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {Math.min(matchIndex, MATCHES_PER_SEASON)}/{MATCHES_PER_SEASON} матчей
        </p>
        {phase !== "season_end" && phase !== "game_won" ? (
          <p className="mt-2 text-sm text-gray-300">Следующий соперник: {opponent}</p>
        ) : null}
      </Card>

      {missing.length > 0 ? (
        <p className="text-sm text-gray-400">
          Для матча нужен полный состав. Не хватает: {missing.join(", ")}.
        </p>
      ) : null}

      <Button full disabled={!ready} onClick={startNextMatch}>
        Играть матч
      </Button>
      <Button variant="secondary" full onClick={() => setActiveTab("transfers")}>
        На трансферный рынок
      </Button>
      <Button variant="ghost" full onClick={resetGame}>
        Сбросить прогресс
      </Button>
    </div>
  );
}
