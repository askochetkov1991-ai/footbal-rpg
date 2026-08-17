import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function HostPage() {
  const [code] = useState(() => randomCode());
  const [phase, setPhase] = useState<"lobby" | "draft" | "match">("lobby");
  const joinUrl = useMemo(() => `${window.location.origin}/event?code=${code}`, [code]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col bg-[#0B0F19] px-6 py-8 text-white">
      <p className="text-xs uppercase tracking-wide text-gray-400">Экран ведущего</p>
      <h1 className="mt-1 text-3xl font-bold">Ивент {code}</h1>
      <Card className="mt-6">
        <p className="text-sm text-gray-400">QR и realtime появятся в P1. Пока код комнаты:</p>
        <p className="mt-2 text-5xl font-black tracking-[0.3em] text-orange-400">{code}</p>
        <p className="mt-3 break-all text-sm text-gray-500">{joinUrl}</p>
      </Card>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button variant={phase === "lobby" ? "primary" : "secondary"} onClick={() => setPhase("lobby")}>
          Лобби
        </Button>
        <Button
          variant={phase === "draft" ? "primary" : "secondary"}
          onClick={() => setPhase("draft")}
        >
          Старт драфта
        </Button>
        <Button
          variant={phase === "match" ? "primary" : "secondary"}
          onClick={() => setPhase("match")}
        >
          Старт матча
        </Button>
      </div>
      <p className="mt-4 text-sm text-gray-400">
        Таймер стартует только по клику. Сейчас кнопки локальные — без сервера фазы не
        синхронизируются с телефонами.
      </p>
      <Link to="/" className="mt-8 text-sm text-gray-400 underline">
        На главную
      </Link>
    </div>
  );
}
