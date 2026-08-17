import { POSITION_LABEL, type Player } from "../../types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { PlayerPhoto } from "./PlayerPhoto";

type Props = {
  player: Player;
  actionLabel?: string;
  onAction?: () => void;
  disabled?: boolean;
  assigned?: boolean;
};

export function PlayerCard({ player, actionLabel, onAction, disabled, assigned }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-gray-800/70 p-3">
      <PlayerPhoto id={player.id} name={player.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{player.name}</p>
          {player.secret ? <Badge className="bg-orange-500/20 text-orange-300">Secret</Badge> : null}
        </div>
        <p className="truncate text-xs text-gray-400">{player.club}</p>
        <div className="mt-1 flex items-center gap-2">
          <Badge>{POSITION_LABEL[player.position]}</Badge>
          <span className="text-xs text-gray-400">FIFA {player.fifa}</span>
          <span className="text-xs font-semibold text-orange-400">{player.cost} очк.</span>
        </div>
      </div>
      {onAction && actionLabel ? (
        <Button variant={assigned ? "secondary" : "primary"} disabled={disabled} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
