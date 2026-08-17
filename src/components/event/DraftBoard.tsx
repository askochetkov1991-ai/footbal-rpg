import { useMemo, useState } from "react";
import { getPlayer } from "../../data/players";
import { eventCatalog } from "../../event/draft";
import { formatCountdown } from "../../event/useCountdown";
import { POSITIONS, POSITION_LABEL, type Position, type Squad } from "../../types";
import { PlayerCard } from "../player/PlayerCard";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type Props = {
  nick: string;
  code: string;
  budget: number;
  squad: Squad;
  remainingMs: number;
  onPick: (playerId: string) => void;
  onUnpick: (position: Position) => void;
  onLeave: () => void;
};

export function DraftBoard({ nick, code, budget, squad, remainingMs, onPick, onUnpick, onLeave }: Props) {
  const [position, setPosition] = useState<Position | "all">("all");
  const [affordable, setAffordable] = useState(false);
  const catalog = useMemo(() => eventCatalog(), []);

  const list = catalog.filter((player) => {
    if (position !== "all" && player.position !== position) return false;
    if (affordable && player.cost > budget) return false;
    return true;
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-6 text-white">
      <div className="sticky top-0 z-10 -mx-4 space-y-3 border-b border-white/10 bg-[#0B0F19] px-4 pb-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Драфт · {nick}</p>
            <p className="text-sm text-gray-500">
              Комната <span className="tracking-widest text-orange-400">{code}</span>
            </p>
          </div>
          <p className={`font-mono text-4xl font-black ${remainingMs <= 10_000 ? "text-red-400" : "text-orange-400"}`}>
            {formatCountdown(remainingMs)}
          </p>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <p>
            Бюджет <span className="text-lg font-bold text-white">{budget}</span>
          </p>
          <p className="text-gray-400">4 слота, дубликаты между людьми можно</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {POSITIONS.map((pos) => {
            const assigned = squad[pos] ? getPlayer(squad[pos]!) : undefined;
            return (
              <button
                key={pos}
                type="button"
                onClick={() => assigned && onUnpick(pos)}
                className={`rounded-xl border px-2 py-2 text-left ${
                  assigned
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{POSITION_LABEL[pos]}</p>
                <p className="truncate text-xs font-semibold">{assigned ? assigned.name : "пусто"}</p>
                {assigned ? <p className="text-[10px] text-gray-500">убрать</p> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="mt-3 space-y-2">
        {list.map((player) => {
          const taken = Boolean(squad[player.position]);
          const selected = squad[player.position] === player.id;
          return (
            <PlayerCard
              key={player.id}
              player={player}
              assigned={selected}
              actionLabel={selected ? "В слоте" : taken ? "Занято" : "Взять"}
              disabled={selected || taken || player.cost > budget}
              onAction={() => onPick(player.id)}
            />
          );
        })}
      </div>

      <Button variant="secondary" className="mt-6" onClick={onLeave}>
        Выйти
      </Button>
    </div>
  );
}

export function LockedSquad({
  nick,
  code,
  squad,
  lateJoin,
  onLeave,
}: {
  nick: string;
  code: string;
  squad: Squad;
  lateJoin: boolean;
  onLeave: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Турнир болельщиков</p>
      <h1 className="mt-1 text-2xl font-bold">{lateJoin ? "Раунд уже идёт" : "Состав зафиксирован"}</h1>
      <Card className="mt-6 space-y-3">
        <p className="text-lg font-semibold">{nick}</p>
        <p className="text-sm text-gray-400">
          Комната <span className="tracking-widest text-orange-400">{code}</span>
        </p>
        {lateJoin ? (
          <p className="text-sm text-amber-300">Ты зашёл после драфта. Жди следующий раунд — состав не переносится.</p>
        ) : (
          <ul className="space-y-2">
            {POSITIONS.map((pos) => {
              const player = squad[pos] ? getPlayer(squad[pos]!) : undefined;
              return (
                <li key={pos} className="flex justify-between gap-2 text-sm">
                  <span className="text-gray-400">{POSITION_LABEL[pos]}</span>
                  <span className="font-semibold">{player?.name ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-sm text-gray-400">Матч стартует с пульта ведущего (P3).</p>
        <Button variant="secondary" full onClick={onLeave}>
          Выйти
        </Button>
      </Card>
    </div>
  );
}
