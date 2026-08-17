import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "../../components/event/QrCode";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { formatCountdown, useCountdown } from "../../event/useCountdown";
import { useEventSocket } from "../../event/useEventSocket";
import {
  DRAFT_DURATION_MS,
  SITUATION_DURATION_MS,
  generateRoomCode,
  generateToken,
  type EventFan,
  type EventPhase,
  type SharedMatch,
  type SnapshotMessage,
} from "../../event/protocol";
import {
  clearHostSession,
  loadHostSession,
  saveHostSession,
  type HostSession,
} from "../../event/session";

function createHostSession(): HostSession {
  const session = { code: generateRoomCode(), token: generateToken() };
  saveHostSession(session);
  return session;
}

export function HostPage() {
  const [session, setSession] = useState<HostSession>(() => loadHostSession() ?? createHostSession());

  const startNewRoom = () => {
    clearHostSession();
    setSession(createHostSession());
  };

  const rotateCode = useCallback(() => {
    const next = { ...session, code: generateRoomCode() };
    saveHostSession(next);
    setSession(next);
  }, [session]);

  return (
    <HostRoom
      key={session.code}
      session={session}
      onNewRoom={startNewRoom}
      onHostTaken={rotateCode}
    />
  );
}

function HostRoom({
  session,
  onNewRoom,
  onHostTaken,
}: {
  session: HostSession;
  onNewRoom: () => void;
  onHostTaken: () => void;
}) {
  const [fans, setFans] = useState<EventFan[]>([]);
  const [hasHost, setHasHost] = useState(false);
  const [linkUp, setLinkUp] = useState(false);
  const [status, setStatus] = useState("Подключаем комнату…");
  const [phase, setPhase] = useState<EventPhase>("lobby");
  const [round, setRound] = useState(0);
  const [draftEndsAt, setDraftEndsAt] = useState<number | null>(null);
  const [serverNow, setServerNow] = useState<number | null>(null);
  const [eliminatedCount, setEliminatedCount] = useState(0);
  const [match, setMatch] = useState<SharedMatch | null>(null);

  const applySnapshot = (message: SnapshotMessage) => {
    setFans(message.fans);
    setHasHost(message.hasHost);
    setPhase(message.phase);
    setRound(message.round);
    setDraftEndsAt(message.draftEndsAt);
    setServerNow(message.serverNow);
    setEliminatedCount(message.eliminatedCount);
    setMatch(message.match);
    if (message.phase === "draft") setStatus("Идёт драфт");
    else if (message.phase === "ready") setStatus("Составы зафиксированы");
    else if (message.phase === "match") setStatus("Идёт матч");
    else if (message.phase === "result") setStatus("Результат ситуации");
    else if (message.phase === "match_over") setStatus("Матч закончен");
    else setStatus(message.hasHost ? "Комната открыта" : "Ждём ведущего");
  };

  const { send } = useEventSocket({
    code: session.code,
    hello: { type: "claim-host", token: session.token },
    onOpen() {
      setLinkUp(true);
      setStatus("Комната открыта");
    },
    onClose() {
      setLinkUp(false);
      setHasHost(false);
      setStatus("Нет связи — переподключаемся");
    },
    onMessage(message) {
      if (message.type === "snapshot") {
        applySnapshot(message);
        return;
      }
      if (message.type === "eliminated") return;
      if (message.code === "HOST_TAKEN") {
        onHostTaken();
        return;
      }
      setStatus(message.message);
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
  const joinUrl = useMemo(() => `${window.location.origin}/event?code=${session.code}`, [session.code]);
  const online = fans.filter((fan) => fan.connected).length;
  const complete = fans.filter((fan) => fan.squadComplete).length;
  const inMatch = fans.filter((fan) => fan.inMatch).length;
  const answered = fans.filter((fan) => fan.inMatch && (fan.answered || fan.sittingOut)).length;
  const livePhase = phase === "match" || phase === "result";
  const canStartDraft = linkUp && hasHost && phase !== "draft" && phase !== "match" && phase !== "result";
  const canStartMatch = linkUp && hasHost && phase === "ready" && complete > 0;
  const draftLabel =
    phase === "draft" ? "Идёт драфт" : phase === "match_over" || phase === "ready" ? "Новый драфт" : "Старт драфта";
  const matchLabel = phase === "match" || phase === "result" ? "Идёт матч" : phase === "match_over" ? "Матч сыгран" : "Старт матча";

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-[#0B0F19] px-6 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Экран ведущего</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Ивент {session.code}</h1>
        <p className={`text-sm ${linkUp && hasHost ? "text-emerald-400" : "text-amber-400"}`}>{status}</p>
      </div>

      {phase === "draft" && remainingMs != null ? (
        <Card className="mt-6 text-center">
          {round > 0 ? <p className="text-sm text-gray-400">Раунд {round}</p> : null}
          <p className="text-sm text-gray-400">До конца драфта</p>
          <p className={`mt-2 font-mono text-7xl font-black ${remainingMs <= 10_000 ? "text-red-400" : "text-orange-400"}`}>
            {formatCountdown(remainingMs)}
          </p>
          <p className="mt-3 text-sm text-gray-400">
            Состав набран: <span className="text-white">{complete}</span> из {fans.length}
          </p>
        </Card>
      ) : livePhase && match ? (
        <Card className="mt-6 text-center">
          {round > 0 ? <p className="text-sm text-gray-400">Раунд {round} · vs {match.opponentName}</p> : null}
          <p className="text-sm text-gray-400">
            {phase === "result" ? "Пауза перед следующей" : `Ситуация ${match.situationIndex + 1}/${match.situationCount}`}
          </p>
          {remainingMs != null ? (
            <p className={`mt-2 font-mono text-7xl font-black ${remainingMs <= 5_000 ? "text-red-400" : "text-orange-400"}`}>
              {formatCountdown(remainingMs)}
            </p>
          ) : null}
          {match.situation ? (
            <div className="mt-4">
              <h2 className="text-2xl font-bold">{match.situation.title}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-300">{match.situation.description}</p>
            </div>
          ) : null}
          <p className="mt-3 text-sm text-gray-400">
            Ответили: <span className="text-white">{answered}</span> из {inMatch}
          </p>
        </Card>
      ) : phase === "match_over" && match ? (
        <Card className="mt-6 text-center">
          <p className="text-sm text-gray-400">Раунд {round} · vs {match.opponentName}</p>
          <h2 className="mt-2 text-3xl font-black">Матч закончен</h2>
          <p className="mt-2 text-sm text-gray-400">Новый драфт сбросит составы. Счёт на чипах ниже.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
          <Card className="flex flex-col justify-center">
            <p className="text-sm text-gray-400">Код для телефонов</p>
            <p className="mt-2 text-6xl font-black tracking-[0.28em] text-orange-400 sm:text-7xl">{session.code}</p>
            <p className="mt-4 break-all text-sm text-gray-500">{joinUrl}</p>
            {round > 0 ? <p className="mt-3 text-sm text-gray-400">Раунд {round} · составы не переносятся</p> : null}
          </Card>
          <Card className="flex flex-col items-center justify-center">
            <QrCode value={joinUrl} />
            <p className="mt-3 text-center text-xs text-gray-400">Сканируй и вводи ник</p>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{phase === "lobby" ? "Лобби" : "Турнир"}</h2>
          <p className="text-sm text-gray-400">
            <span className="text-2xl font-bold text-white">{online}</span>
            {" "}в комнате
            {fans.length > online ? <span className="ml-2 text-gray-500">· {fans.length - online} офлайн</span> : null}
            {eliminatedCount > 0 ? <span className="ml-2 text-red-400">· выбыло {eliminatedCount}</span> : null}
          </p>
        </div>
        {fans.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">
            Пока никого. Болельщики открывают /event, вводят ник и этот код.
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {fans.map((fan) => (
              <li
                key={fan.id}
                className={`rounded-full border px-3 py-1 text-sm ${fanChipClass(fan, phase)}`}
              >
                <span
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${fan.connected ? "bg-emerald-400" : "bg-gray-500"}`}
                />
                {fan.nick}
                {phase === "draft" || phase === "ready" ? (
                  <span className="ml-2 text-xs text-gray-400">{fan.slotsFilled}/4</span>
                ) : null}
                {phase === "match" || phase === "result" || phase === "match_over" ? (
                  <span className="ml-2 text-xs text-gray-400">
                    {fan.inMatch ? `${fan.playerScore}:${fan.opponentScore}` : "зритель"}
                    {phase === "match" && fan.inMatch ? (fan.sittingOut ? " · таймаут" : fan.answered ? " · ок" : "") : ""}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant={phase === "lobby" ? "primary" : "secondary"} disabled>
          Лобби
        </Button>
        <Button
          variant={phase === "draft" ? "secondary" : "primary"}
          disabled={!canStartDraft}
          onClick={() => send({ type: "start-draft" })}
        >
          {draftLabel}
        </Button>
        <Button
          variant={phase === "match" || phase === "result" ? "primary" : "secondary"}
          disabled={!canStartMatch}
          onClick={() => send({ type: "start-match" })}
        >
          {matchLabel}
        </Button>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Драфт {Math.round(DRAFT_DURATION_MS / 1000)} сек, ситуация {Math.round(SITUATION_DURATION_MS / 1000)} сек — только по клику ведущего.
        Нет четвёрки к концу драфта — DQ. Нет ответа в матче — 0:3 на недоигранное, в турнире остаёшься.
        {phase === "ready" ? " Можно стартовать матч или новый драфт." : null}
        {phase === "match_over" ? " Новый драфт сбросит составы." : null}
      </p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <button type="button" onClick={onNewRoom} className="text-orange-400 underline">
          Новая комната
        </button>
        <Link to="/" className="text-gray-400 underline">
          На главную
        </Link>
      </div>
    </div>
  );
}

function fanChipClass(fan: EventFan, phase: EventPhase): string {
  if (!fan.connected) return "border-white/10 bg-white/5 text-gray-500";
  if ((phase === "match" || phase === "result") && fan.sittingOut) return "border-amber-400/40 bg-amber-400/10 text-white";
  if ((phase === "match" || phase === "result") && fan.answered) return "border-emerald-400/40 bg-emerald-400/10 text-white";
  if (phase !== "lobby" && fan.squadComplete) return "border-emerald-400/40 bg-emerald-400/10 text-white";
  if (phase === "draft") return "border-amber-400/40 bg-amber-400/10 text-white";
  return "border-emerald-400/40 bg-emerald-400/10 text-white";
}
