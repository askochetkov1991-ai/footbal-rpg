import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "../../components/event/QrCode";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { formatCountdown, useCountdown } from "../../event/useCountdown";
import { useEventSocket } from "../../event/useEventSocket";
import {
  DRAFT_DURATION_MS,
  generateRoomCode,
  generateToken,
  type EventFan,
  type EventPhase,
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

  const applySnapshot = (message: SnapshotMessage) => {
    setFans(message.fans);
    setHasHost(message.hasHost);
    setPhase(message.phase);
    setRound(message.round);
    setDraftEndsAt(message.draftEndsAt);
    setServerNow(message.serverNow);
    setEliminatedCount(message.eliminatedCount);
    if (message.phase === "draft") setStatus("Идёт драфт");
    else if (message.phase === "ready") setStatus("Составы зафиксированы");
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

  const remainingMs = useCountdown(phase === "draft" ? draftEndsAt : null, serverNow);
  const joinUrl = useMemo(() => `${window.location.origin}/event?code=${session.code}`, [session.code]);
  const online = fans.filter((fan) => fan.connected).length;
  const complete = fans.filter((fan) => fan.squadComplete).length;
  const canStartDraft = linkUp && hasHost && phase !== "draft";
  const draftLabel =
    phase === "draft" ? "Идёт драфт" : phase === "ready" ? "Новый драфт" : "Старт драфта";

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
                {phase !== "lobby" ? (
                  <span className="ml-2 text-xs text-gray-400">{fan.slotsFilled}/4</span>
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
        <Button variant="secondary" disabled title="Появится в P3">
          Старт матча (P3)
        </Button>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Таймер {Math.round(DRAFT_DURATION_MS / 1000)} сек стартует только по этой кнопке. Нет четвёрки к концу — DQ.
        {phase === "ready" ? " Новый драфт сбросит составы оставшихся." : null}
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
  if (phase !== "lobby" && fan.squadComplete) return "border-emerald-400/40 bg-emerald-400/10 text-white";
  if (phase === "draft") return "border-amber-400/40 bg-amber-400/10 text-white";
  return "border-emerald-400/40 bg-emerald-400/10 text-white";
}
