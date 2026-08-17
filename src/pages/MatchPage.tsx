import { SITUATIONS_BY_ID } from "../data/situations";
import { DiceRoll } from "../components/match/DiceRoll";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useGameStore } from "../store/gameStore";

export function MatchPage() {
  const match = useGameStore((s) => s.activeMatch);
  const chooseAction = useGameStore((s) => s.chooseAction);
  const advanceSituation = useGameStore((s) => s.advanceSituation);
  const finishMatch = useGameStore((s) => s.finishMatch);
  const startNextMatch = useGameStore((s) => s.startNextMatch);
  const squadComplete = useGameStore((s) => s.squadComplete());

  if (!match) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">Матч ещё не начат.</p>
        <Button full disabled={!squadComplete} onClick={startNextMatch}>
          Играть матч
        </Button>
      </div>
    );
  }

  const situation = SITUATIONS_BY_ID[match.situationIds[match.situationIndex]];
  const outcome = match.lastOutcome;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs text-gray-400">vs {match.opponentName}</p>
        <p className="text-3xl font-bold text-white">
          {match.playerScore}:{match.opponentScore}
        </p>
        <p className="text-xs text-gray-500">
          Ситуация {match.situationIndex + 1}/{match.situationIds.length}
        </p>
      </Card>

      {match.phase === "choice" && situation ? (
        <Card>
          <h2 className="text-lg font-bold">{situation.title}</h2>
          <p className="mt-2 text-sm text-gray-300">{situation.description}</p>
          <div className="mt-4 space-y-2">
            {situation.choices.map((choice, index) => (
              <Button key={choice} variant="secondary" full onClick={() => chooseAction(index)}>
                {choice}
              </Button>
            ))}
          </div>
        </Card>
      ) : null}

      {(match.phase === "result" || match.phase === "final") && outcome ? (
        <Card>
          <p className="text-sm text-gray-200">{outcome.description}</p>
          <DiceRoll player={outcome.playerRoll} ai={outcome.aiRoll} />
          {match.phase === "result" ? (
            <Button className="mt-4" full onClick={advanceSituation}>
              Дальше
            </Button>
          ) : (
            <Button className="mt-4" full onClick={finishMatch}>
              Завершить матч {match.playerScore}:{match.opponentScore}
            </Button>
          )}
        </Card>
      ) : null}
    </div>
  );
}
