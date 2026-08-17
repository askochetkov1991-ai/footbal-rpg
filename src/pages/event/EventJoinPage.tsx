import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export function EventJoinPage() {
  const [nick, setNick] = useState("");
  const [code, setCode] = useState("");
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
          />
        </label>
        <label className="block text-sm text-gray-300">
          Код комнаты
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white tracking-widest"
            placeholder="ABCD"
            maxLength={4}
          />
        </label>
        <Button full disabled={!nick.trim() || code.length < 4}>
          Войти (P1)
        </Button>
        <p className="text-xs text-gray-500">
          Мультиплеер подключается в P1. Сейчас это экран-заглушка: ник и код уже есть, комнаты ещё нет.
        </p>
      </Card>
      <Link to="/" className="mt-6 text-center text-sm text-gray-400 underline">
        На главную
      </Link>
    </div>
  );
}
