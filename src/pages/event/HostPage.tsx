import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QrCode } from "../../components/event/QrCode";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useEventSocket } from "../../event/useEventSocket";
import { generateRoomCode, generateToken, type EventFan } from "../../event/protocol";
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

  useEventSocket({
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
        setFans(message.fans);
        setHasHost(message.hasHost);
        setStatus(message.hasHost ? "Комната открыта" : "Ждём ведущего");
        return;
      }
      if (message.code === "HOST_TAKEN") {
        onHostTaken();
        return;
      }
      setStatus(message.message);
    },
  });

  const joinUrl = useMemo(() => `${window.location.origin}/event?code=${session.code}`, [session.code]);
  const online = fans.filter((fan) => fan.connected).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col bg-[#0B0F19] px-6 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Экран ведущего</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">Ивент {session.code}</h1>
        <p className={`text-sm ${linkUp && hasHost ? "text-emerald-400" : "text-amber-400"}`}>{status}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card className="flex flex-col justify-center">
          <p className="text-sm text-gray-400">Код для телефонов</p>
          <p className="mt-2 text-6xl font-black tracking-[0.28em] text-orange-400 sm:text-7xl">{session.code}</p>
          <p className="mt-4 break-all text-sm text-gray-500">{joinUrl}</p>
        </Card>
        <Card className="flex flex-col items-center justify-center">
          <QrCode value={joinUrl} />
          <p className="mt-3 text-center text-xs text-gray-400">Сканируй и вводи ник</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">Лобби</h2>
          <p className="text-sm text-gray-400">
            <span className="text-2xl font-bold text-white">{online}</span>
            {" "}в комнате
            {fans.length > online ? <span className="ml-2 text-gray-500">· {fans.length - online} офлайн</span> : null}
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
                className={`rounded-full border px-3 py-1 text-sm ${
                  fan.connected
                    ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                    : "border-white/10 bg-white/5 text-gray-500"
                }`}
              >
                <span
                  className={`mr-2 inline-block h-2 w-2 rounded-full ${fan.connected ? "bg-emerald-400" : "bg-gray-500"}`}
                />
                {fan.nick}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant="primary">Лобби</Button>
        <Button variant="secondary" disabled title="Появится в P2">
          Старт драфта (P2)
        </Button>
        <Button variant="secondary" disabled title="Появится в P3">
          Старт матча (P3)
        </Button>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Таймер по-прежнему только по клику ведущего — в P1 синхронизируется только лобби.
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
