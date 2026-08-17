import type { ReactNode } from "react";
import { Leaderboard, RankLine } from "./Leaderboard";
import { DiceRoll } from "../match/DiceRoll";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatCountdown } from "../../event/useCountdown";
import type { EventFan, FanYou, SharedMatch } from "../../event/protocol";

type Props = {
  nick: string;
  code: string;
  you: FanYou;
  match: SharedMatch;
  remainingMs: number | null;
  fans?: EventFan[];
  onAnswer: (choiceIndex: number) => void;
  onLeave: () => void;
  phase: "match" | "result" | "match_over";
};

export function MatchPlay({ nick, code, you, match, remainingMs, fans, onAnswer, onLeave, phase }: Props) {
  const score = `${you.playerScore}:${you.opponentScore}`;
  const situation = match.situation;
  const timer = remainingMs != null ? formatCountdown(remainingMs) : null;

  if (!you.inMatch) {
    return (
      <Shell nick={nick} code={code} score={score} rank={you.rank} fieldSize={you.fieldSize} points={you.points} onLeave={onLeave}>
        <p className="text-sm text-amber-300">Ты зашёл после драфта и в этот матч не попал. Жди следующий раунд.</p>
      </Shell>
    );
  }

  if (phase === "match_over") {
    return (
      <Shell nick={nick} code={code} score={score} rank={you.rank} fieldSize={you.fieldSize} points={you.points} onLeave={onLeave}>
        <h2 className="text-xl font-bold">Матч закончен</h2>
        <p className="mt-2 text-3xl font-black text-orange-400">{score}</p>
        <p className="mt-2 text-sm text-gray-400">Ждём новый драфт или подиум от ведущего. Состав не переносится.</p>
        {you.lastOutcome ? <p className="mt-3 text-sm text-gray-300">{you.lastOutcome.description}</p> : null}
        {fans && fans.length > 0 ? (
          <div className="mt-4">
            <Leaderboard fans={fans} highlightId={you.playerId} compact />
          </div>
        ) : null}
      </Shell>
    );
  }

  if (you.sittingOut && phase === "match") {
    return (
      <Shell nick={nick} code={code} score={score} rank={you.rank} fieldSize={you.fieldSize} points={you.points} onLeave={onLeave}>
        <p className="text-sm text-amber-300">
          Время вышло — недоигранное в пользу соперника. Ты остаёшься в турнире и ждёшь конец матча.
        </p>
        <p className="mt-3 text-3xl font-black text-orange-400">{score}</p>
      </Shell>
    );
  }

  return (
    <Shell nick={nick} code={code} score={score} rank={you.rank} fieldSize={you.fieldSize} points={you.points} onLeave={onLeave}>
      <p className="text-xs text-gray-400">
        vs {match.opponentName} · ситуация {match.situationIndex + 1}/{match.situationCount}
      </p>
      {timer ? (
        <p className={`mt-1 font-mono text-4xl font-black ${remainingMs != null && remainingMs <= 5_000 ? "text-red-400" : "text-orange-400"}`}>
          {timer}
        </p>
      ) : null}

      {phase === "match" && situation ? (
        <Card className="mt-4 space-y-3">
          <h2 className="text-lg font-bold">{situation.title}</h2>
          <p className="text-sm text-gray-300">{situation.description}</p>
          {you.answered ? (
            <p className="text-sm text-emerald-400">Ответ принят. Ждём остальных.</p>
          ) : (
            <div className="space-y-2">
              {situation.choices.map((choice, index) => (
                <Button key={choice} variant="secondary" full onClick={() => onAnswer(index)}>
                  {choice}
                </Button>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {phase === "result" && you.lastOutcome ? (
        <Card className="mt-4 space-y-2">
          <p className="text-sm text-gray-200">{you.lastOutcome.description}</p>
          <DiceRoll player={you.lastOutcome.playerRoll} ai={you.lastOutcome.aiRoll} />
          <p className="text-sm text-gray-400">Счёт {score}. Дальше автоматически.</p>
        </Card>
      ) : null}
    </Shell>
  );
}

function Shell({
  nick,
  code,
  score,
  rank,
  fieldSize,
  points,
  onLeave,
  children,
}: {
  nick: string;
  code: string;
  score: string;
  rank: number;
  fieldSize: number;
  points: number;
  onLeave: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-8 text-white">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Матч · {nick}</p>
          <p className="text-sm text-gray-500">
            Комната <span className="tracking-widest text-orange-400">{code}</span>
          </p>
          <RankLine rank={rank} fieldSize={fieldSize} points={points} />
        </div>
        <p className="text-3xl font-black">{score}</p>
      </div>
      <div className="mt-4 flex-1">{children}</div>
      <Button variant="secondary" className="mt-6" onClick={onLeave}>
        Выйти
      </Button>
    </div>
  );
}
