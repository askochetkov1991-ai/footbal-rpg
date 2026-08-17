import { podiumFans } from "../../event/board";
import { PODIUM_SIZE, type EventFan } from "../../event/protocol";
import { Card } from "../ui/card";

type Props = {
  fans: EventFan[];
  round: number;
};

export function Podium({ fans, round }: Props) {
  const top = podiumFans(fans, PODIUM_SIZE);
  const first = top.find((fan) => fan.rank === 1) ?? top[0];
  const second = top.find((fan) => fan.rank === 2) ?? top[1];
  const third = top.find((fan) => fan.rank === 3) ?? top[2];

  return (
    <div className="text-center">
      <p className="text-sm uppercase tracking-wide text-orange-400">Финал</p>
      <h2 className="mt-1 text-4xl font-black">Подиум</h2>
      {round > 0 ? <p className="mt-1 text-sm text-gray-400">Раунд {round}</p> : null}

      {top.length === 0 ? (
        <p className="mt-8 text-gray-400">Никто не доиграл матч — призов нет.</p>
      ) : (
        <div className="mt-8 flex items-end justify-center gap-3 sm:gap-6">
          <PodiumStep fan={second} place={2} className="h-36 sm:h-44" tone="bg-gray-500/30 border-gray-300/40" />
          <PodiumStep fan={first} place={1} className="h-48 sm:h-60" tone="bg-amber-400/20 border-amber-300/60" featured />
          <PodiumStep fan={third} place={3} className="h-32 sm:h-40" tone="bg-orange-500/20 border-orange-400/40" />
        </div>
      )}

      <p className="mt-8 text-sm text-gray-500">DQ и те, кто не сыграл матч, вне призов.</p>
    </div>
  );
}

export function FanPodium({
  playerId,
  nick,
  fans,
  rank,
  fieldSize,
  points,
}: {
  playerId: string;
  nick: string;
  fans: EventFan[];
  rank: number;
  fieldSize: number;
  points: number;
}) {
  const top = podiumFans(fans, PODIUM_SIZE);
  const onPodium = top.some((fan) => fan.id === playerId);

  return (
    <Card className="space-y-3 text-center">
      {onPodium ? (
        <>
          <p className="text-sm uppercase tracking-wide text-amber-300">Ты на подиуме</p>
          <p className="text-5xl font-black text-orange-400">{rank}</p>
          <p className="text-lg font-semibold">{nick}</p>
          <p className="text-sm text-gray-400">{points} оч. · {fieldSize} в турнире</p>
        </>
      ) : (
        <>
          <p className="text-sm uppercase tracking-wide text-gray-400">Турнир окончен</p>
          <p className="text-lg font-semibold">{nick}</p>
          <p className="text-3xl font-black">
            {rank} <span className="text-lg font-semibold text-gray-400">из {fieldSize}</span>
          </p>
          <p className="text-sm text-gray-400">{points} оч. Призы у топ-{PODIUM_SIZE}.</p>
        </>
      )}
    </Card>
  );
}

function PodiumStep({
  fan,
  place,
  className,
  tone,
  featured = false,
}: {
  fan?: EventFan;
  place: number;
  className: string;
  tone: string;
  featured?: boolean;
}) {
  return (
    <div className={`flex w-24 flex-col items-center sm:w-36 ${fan ? "" : "opacity-30"}`}>
      <p className={`truncate font-bold ${featured ? "text-xl sm:text-2xl" : "text-sm sm:text-lg"}`}>
        {fan?.nick ?? "—"}
      </p>
      {fan ? (
        <p className="text-xs text-gray-400">
          {fan.points} оч. · {fan.playerScore}:{fan.opponentScore}
        </p>
      ) : (
        <p className="text-xs text-gray-600">пусто</p>
      )}
      <div className={`mt-3 flex w-full items-end justify-center rounded-t-2xl border ${tone} ${className}`}>
        <span className={`mb-3 font-black ${featured ? "text-5xl text-amber-300" : "text-3xl text-white"}`}>{place}</span>
      </div>
    </div>
  );
}
