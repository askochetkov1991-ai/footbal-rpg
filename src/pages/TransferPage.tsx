import { useMemo, useState } from "react";
import { PLAYERS } from "../data/players";
import { POSITIONS, POSITION_LABEL, type Position } from "../types";
import { PlayerCard } from "../components/player/PlayerCard";
import { Button } from "../components/ui/button";
import { useGameStore } from "../store/gameStore";

export function TransferPage() {
  const budget = useGameStore((s) => s.budget);
  const league = useGameStore((s) => s.league);
  const ownedPlayerIds = useGameStore((s) => s.ownedPlayerIds);
  const buyPlayer = useGameStore((s) => s.buyPlayer);
  const sellPlayer = useGameStore((s) => s.sellPlayer);
  const [position, setPosition] = useState<Position | "all">("all");
  const [affordable, setAffordable] = useState(false);

  const list = useMemo(() => {
    return PLAYERS.filter((player) => {
      if (player.secret && player.leagueRestricted && league > player.leagueRestricted) return false;
      if (position !== "all" && player.position !== position) return false;
      if (affordable && player.cost > budget) return false;
      return true;
    });
  }, [position, affordable, budget, league]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant={position === "all" ? "primary" : "secondary"} onClick={() => setPosition("all")}>
          Все
        </Button>
        {POSITIONS.map((pos) => (
          <Button
            key={pos}
            variant={position === pos ? "primary" : "secondary"}
            onClick={() => setPosition(pos)}
          >
            {POSITION_LABEL[pos]}
          </Button>
        ))}
        <Button variant={affordable ? "primary" : "secondary"} onClick={() => setAffordable((v) => !v)}>
          По бюджету
        </Button>
      </div>
      {list.map((player) => {
        const owned = ownedPlayerIds.includes(player.id);
        return (
          <PlayerCard
            key={player.id}
            player={player}
            actionLabel={owned ? "Продать" : "Купить"}
            disabled={!owned && budget < player.cost}
            onAction={() => (owned ? sellPlayer(player.id) : buyPlayer(player.id))}
          />
        );
      })}
    </div>
  );
}
