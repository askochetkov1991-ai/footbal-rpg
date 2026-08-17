import { cn } from "../../lib/utils";
import { formatPlace, isOnBoard } from "../../event/board";
import { BOARD_TOP, type EventFan } from "../../event/protocol";

type Props = {
  fans: EventFan[];
  limit?: number;
  highlightId?: string;
  compact?: boolean;
};

export function Leaderboard({ fans, limit = BOARD_TOP, highlightId, compact = false }: Props) {
  const rows = fans.slice(0, limit);
  const rest = Math.max(0, fans.length - rows.length);

  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">Табло появится, как только начнутся ответы.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left">
        <thead className="bg-black/30 text-[10px] uppercase tracking-wide text-gray-400">
          <tr>
            <th className={cn("py-2 pr-2", compact ? "pl-2" : "pl-3")}>#</th>
            <th className="px-2 py-2">Ник</th>
            <th className="px-2 py-2 text-right">Матч</th>
            <th className={cn("py-2 pl-2 text-right", compact ? "pr-2" : "pr-3")}>О</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((fan) => {
            const mine = fan.id === highlightId;
            return (
              <tr
                key={fan.id}
                className={cn(
                  "border-t border-white/5",
                  mine ? "bg-orange-500/15 text-orange-100" : "text-white",
                  !fan.connected && "opacity-50",
                )}
              >
                <td className={cn("py-2 font-black tabular-nums", compact ? "pl-2 pr-2 text-sm" : "pl-3 pr-2 text-lg")}>
                  <span className={rankTone(fan.rank)}>{fan.rank}</span>
                </td>
                <td className={cn("px-2 py-2 font-semibold", compact ? "text-sm" : "text-base")}>
                  <span className="block truncate">{fan.nick}</span>
                  {!isOnBoard(fan) ? <span className="text-[10px] font-normal text-gray-500">ещё не играл</span> : null}
                </td>
                <td className={cn("px-2 py-2 text-right tabular-nums text-gray-300", compact ? "text-sm" : "text-base")}>
                  {fan.inMatch || fan.played > 0 ? `${fan.playerScore}:${fan.opponentScore}` : "—"}
                </td>
                <td className={cn("py-2 pl-2 text-right font-bold tabular-nums", compact ? "pr-2 text-sm" : "pr-3 text-lg")}>
                  {fan.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rest > 0 ? (
        <p className="border-t border-white/10 px-3 py-2 text-xs text-gray-500">ещё {rest} за топ-{limit}</p>
      ) : null}
    </div>
  );
}

export function RankLine({
  rank,
  fieldSize,
  points,
}: {
  rank: number;
  fieldSize: number;
  points: number;
}) {
  if (fieldSize <= 0) return null;
  return (
    <p className="text-sm text-gray-300">
      Место <span className={cn("font-black", rankTone(rank))}>{formatPlace(rank, fieldSize)}</span>
      <span className="ml-2 text-gray-500">{points} оч.</span>
    </p>
  );
}

function rankTone(rank: number): string {
  if (rank === 1) return "text-amber-300";
  if (rank === 2) return "text-gray-200";
  if (rank === 3) return "text-orange-400";
  return "text-white";
}
