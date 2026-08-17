import { LEAGUE_LABEL } from "../../types";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useGameStore } from "../../store/gameStore";

export function SeasonSummaryCard() {
  const summary = useGameStore((s) => s.seasonSummary);
  const continueAfterSeason = useGameStore((s) => s.continueAfterSeason);
  if (!summary) return null;
  const won = summary.league === 1 && summary.place === 1;
  return (
    <Card className="border-orange-500/40 text-center">
      <h2 className="text-lg font-bold text-white">Сезон завершён!</h2>
      <p className="mt-1 text-sm text-gray-300">
        {LEAGUE_LABEL[summary.league]} — ваше место:{" "}
        <b className="text-orange-400">{summary.place}</b>
      </p>
      <p className="mt-1 text-sm text-gray-300">
        Награда: <b className="text-orange-400">+{summary.reward} очк.</b>
      </p>
      {won ? (
        <p className="mt-3 font-semibold text-orange-300">Чемпионство! Вы выиграли игру.</p>
      ) : (
        <p className="mt-3 text-sm text-gray-400">
          {summary.promoted ? "Повышение в лигу выше." : "Остаётесь в этой лиге."}
        </p>
      )}
      <Button className="mt-4" full onClick={continueAfterSeason}>
        {won ? "Отлично" : "Продолжить"}
      </Button>
    </Card>
  );
}
