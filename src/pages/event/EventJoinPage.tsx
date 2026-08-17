import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DraftBoard, LockedSquad } from "../../components/event/DraftBoard";
import { MatchPlay } from "../../components/event/MatchPlay";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { isSquadComplete } from "../../event/draft";
import { useCountdown } from "../../event/useCountdown";
import { useEventSocket } from "../../event/useEventSocket";
import {
  generateToken,
  isValidCode,
  normalizeCode,
  normalizeNick,
  ROOM_CODE_LENGTH,
  type EventPhase,
  type FanYou,
  type SharedMatch,
  type SnapshotMessage,
} from "../../event/protocol";
import {
  clearFanSession,
  loadFanSession,
  saveFanSession,
  type FanSession,
} from "../../event/session";

export function EventJoinPage() {
  const [params] = useSearchParams();
  const codeFromUrl = normalizeCode(params.get("code") ?? "");
  const existing = loadFanSession();
  const [session, setSession] = useState<FanSession | null>(() => {
    if (existing && isValidCode(existing.code)) return existing;
    return null;
  });

  if (session) {
    return (
      <FanLobby
        session={session}
        onLeave={() => {
          clearFanSession();
          setSession(null);
        }}
      />
    );
  }

  return (
    <JoinForm
      initialCode={isValidCode(codeFromUrl) ? codeFromUrl : existing?.code ?? ""}
      initialNick={existing?.nick ?? ""}
      onJoin={(next) => {
        saveFanSession(next);
        setSession(next);
      }}
    />
  );
}

function JoinForm({
  initialCode,
  initialNick,
  onJoin,
}: {
  initialCode: string;
  initialNick: string;
  onJoin: (session: FanSession) => void;
}) {
  const [nick, setNick] = useState(initialNick);
  const [code, setCode] = useState(initialCode);
  const ready = Boolean(normalizeNick(nick) && isValidCode(normalizeCode(code)));

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Турнир болельщиков</p>
      <h1 className="mt-1 text-2xl font-bold">Войти в ивент</h1>
      <Card className="mt-6 space-y-3">
        <label className="block text-sm text-gray-300">
          Ник
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
            placeholder="Как вас представить"
            maxLength={20}
            autoComplete="nickname"
          />
        </label>
        <label className="block text-sm text-gray-300">
          Код комнаты
          <input
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white tracking-widest"
            placeholder="ABCD"
            maxLength={ROOM_CODE_LENGTH}
            autoCapitalize="characters"
            autoCorrect="off"
          />
        </label>
        <Button
          full
          disabled={!ready}
          onClick={() => {
            const nextNick = normalizeNick(nick);
            const nextCode = normalizeCode(code);
            if (!nextNick || !isValidCode(nextCode)) return;
            onJoin({
              code: nextCode,
              nick: nextNick,
              playerId: existingPlayerId(nextCode) ?? generateToken(),
            });
          }}
        >
          Войти
        </Button>
        <p className="text-xs text-gray-500">Без аккаунта. Если ведущий ещё не открыл пульт — комната не найдётся.</p>
      </Card>
      <Link to="/" className="mt-6 text-center text-sm text-gray-400 underline">
        На главную
      </Link>
    </div>
  );
}

function existingPlayerId(code: string): string | null {
  const stored = loadFanSession();
  return stored?.code === code ? stored.playerId : null;
}

function FanLobby({ session, onLeave }: { session: FanSession; onLeave: () => void }) {
  const [status, setStatus] = useState("Подключаемся…");
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(0);
  const [hasHost, setHasHost] = useState(false);
  const [left, setLeft] = useState(false);
  const [eliminated, setEliminated] = useState(false);
  const [phase, setPhase] = useState<EventPhase>("lobby");
  const [you, setYou] = useState<FanYou | null>(null);
  const [draftEndsAt, setDraftEndsAt] = useState<number | null>(null);
  const [serverNow, setServerNow] = useState<number | null>(null);
  const [match, setMatch] = useState<SharedMatch | null>(null);

  const applySnapshot = (message: SnapshotMessage) => {
    setOnline(message.fans.filter((fan) => fan.connected).length);
    setHasHost(message.hasHost);
    setPhase(message.phase);
    setDraftEndsAt(message.draftEndsAt);
    setServerNow(message.serverNow);
    setMatch(message.match);
    if (message.you.role === "fan") setYou(message.you);
    if (message.phase === "draft") setStatus("Набери 4 слота до конца таймера");
    else if (message.phase === "ready") setStatus("Состав зафиксирован. Ждём матч");
    else if (message.phase === "match") setStatus("Выбери действие");
    else if (message.phase === "result") setStatus("Результат ситуации");
    else if (message.phase === "match_over") setStatus("Матч закончен. Ждём новый драфт");
    else setStatus(message.hasHost ? "Ждём старт от ведущего" : "Ведущий переподключается");
  };

  const { send } = useEventSocket({
    code: session.code,
    hello: { type: "join", playerId: session.playerId, nick: session.nick },
    onOpen() {
      if (left) return;
      setError(null);
    },
    onClose() {
      if (left || eliminated) return;
      setHasHost(false);
      setStatus("Нет связи — переподключаемся");
    },
    onMessage(message) {
      if (left) return;
      if (message.type === "eliminated" || (message.type === "error" && message.code === "ELIMINATED")) {
        setEliminated(true);
        setError(null);
        return;
      }
      if (message.type === "snapshot") {
        setError(null);
        applySnapshot(message);
        return;
      }
      setError(message.message);
      if (message.code === "NO_HOST" || message.code === "ROOM_FULL") {
        setTimeout(() => onLeave(), 1200);
      }
    },
  });

  const remainingMs = useCountdown(
    phase === "draft"
      ? draftEndsAt
      : phase === "match"
        ? (match?.choiceEndsAt ?? null)
        : phase === "result"
          ? (match?.resultEndsAt ?? null)
          : null,
    serverNow,
  );

  const leave = () => {
    setLeft(true);
    send({ type: "leave" });
    onLeave();
  };

  const subtitle = useMemo(() => {
    if (error) return error;
    if (!hasHost) return status;
    return `${status}. Сейчас ${online} ${pluralPeople(online)}.`;
  }, [error, hasHost, online, status]);

  if (eliminated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-8 text-white">
        <p className="text-xs uppercase tracking-wide text-red-400">Дисквалификация</p>
        <h1 className="mt-1 text-2xl font-bold">Не успел набрать состав</h1>
        <Card className="mt-6 space-y-3">
          <p className="text-lg font-semibold">{session.nick}</p>
          <p className="text-sm text-gray-300">
            К концу драфта нужны GK, DEF, MID и FWD. Без четвёрки ты выбываешь из турнира.
          </p>
          <Button variant="secondary" full onClick={leave}>
            Выйти
          </Button>
        </Card>
      </div>
    );
  }

  if ((phase === "match" || phase === "result" || phase === "match_over") && you && match) {
    return (
      <MatchPlay
        nick={session.nick}
        code={session.code}
        you={you}
        match={match}
        remainingMs={remainingMs}
        phase={phase}
        onAnswer={(choiceIndex) => send({ type: "answer", choiceIndex })}
        onLeave={leave}
      />
    );
  }

  if (phase === "draft" && you) {
    return (
      <DraftBoard
        nick={session.nick}
        code={session.code}
        budget={you.budget}
        squad={you.squad}
        remainingMs={remainingMs ?? 0}
        onPick={(playerId) => send({ type: "pick", playerId })}
        onUnpick={(position) => send({ type: "unpick", position })}
        onLeave={leave}
      />
    );
  }

  if (phase === "ready" && you) {
    return (
      <LockedSquad
        nick={session.nick}
        code={session.code}
        squad={you.squad}
        lateJoin={!isSquadComplete(you.squad)}
        onLeave={leave}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] px-4 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Турнир болельщиков</p>
      <h1 className="mt-1 text-2xl font-bold">Ты в лобби</h1>
      <Card className="mt-6 space-y-3">
        <p className="text-lg font-semibold">{session.nick}</p>
        <p className="text-sm text-gray-400">
          Комната <span className="tracking-widest text-orange-400">{session.code}</span>
        </p>
        <p className={`text-sm ${error ? "text-amber-400" : "text-gray-300"}`}>{subtitle}</p>
        <Button variant="secondary" full onClick={leave}>
          Выйти
        </Button>
      </Card>
      <Link to="/" className="mt-6 text-center text-sm text-gray-400 underline">
        На главную
      </Link>
    </div>
  );
}

function pluralPeople(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "человек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "человека";
  return "человек";
}
