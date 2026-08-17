import { getPlayer } from "../data/players";
import { POSITIONS, POSITION_LABEL } from "../types";
import { PlayerCard } from "../components/player/PlayerCard";
import { useGameStore } from "../store/gameStore";

export function SquadPage() {
  const ownedPlayerIds = useGameStore((s) => s.ownedPlayerIds);
  const squad = useGameStore((s) => s.squad);
  const assignPlayer = useGameStore((s) => s.assignPlayer);
  const sellPlayer = useGameStore((s) => s.sellPlayer);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Состав</h2>
      {POSITIONS.map((pos) => {
        const assignedId = squad[pos];
        const assigned = assignedId ? getPlayer(assignedId) : undefined;
        const candidates = ownedPlayerIds
          .map((id) => getPlayer(id))
          .filter((p) => p && p.position === pos);
        return (
          <section key={pos} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300">{POSITION_LABEL[pos]}</h3>
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500">Нет игроков на эту позицию. Купите на рынке.</p>
            ) : (
              candidates.map((player) =>
                player ? (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    assigned={assigned?.id === player.id}
                    actionLabel={assigned?.id === player.id ? "В основе" : "В старт"}
                    onAction={() => assignPlayer(player.id)}
                    disabled={assigned?.id === player.id}
                  />
                ) : null,
              )
            )}
            {assigned ? (
              <button
                className="text-xs text-gray-500 underline"
                onClick={() => sellPlayer(assigned.id)}
              >
                Продать {assigned.name} (100% стоимости)
              </button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
