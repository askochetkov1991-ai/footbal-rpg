import { sortStandings } from "../../engine/season";
import type { StandingRow } from "../../types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const sorted = sortStandings(rows);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/30 text-xs uppercase text-gray-400">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Клуб</th>
            <th className="px-3 py-2 text-right">И</th>
            <th className="px-3 py-2 text-right">О</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr
              key={row.name}
              className={row.isPlayer ? "bg-orange-500/10 text-orange-200" : "text-gray-200"}
            >
              <td className="px-3 py-2">{index + 1}</td>
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2 text-right">{row.played}</td>
              <td className="px-3 py-2 text-right font-semibold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
