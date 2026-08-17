import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center bg-[#0B0F19] px-4 py-10 text-white">
      <p className="text-xs uppercase tracking-wide text-orange-400">Football RPG</p>
      <h1 className="mt-2 text-3xl font-black">Карьера и турнир болельщиков</h1>
      <p className="mt-3 text-sm text-gray-400">
        Одиночная карьера уже играется в браузере. Турнир на 50+ телефонов собираем поверх того же
        движка: драфт → общие ситуации → лидерборд.
      </p>
      <div className="mt-8 grid gap-3">
        <Card>
          <h2 className="font-semibold">Тренировка</h2>
          <p className="mt-1 text-sm text-gray-400">От третьей лиги до чемпионства. Состав из 4, рынок, кубики.</p>
          <Link to="/play">
            <Button className="mt-4" full>
              Играть карьеру
            </Button>
          </Link>
        </Card>
        <Card>
          <h2 className="font-semibold">Ивент</h2>
          <p className="mt-1 text-sm text-gray-400">Телефон болельщика. Ник, код, драфт 90 сек по клику ведущего.</p>
          <Link to="/event">
            <Button className="mt-4" full>
              Войти в ивент
            </Button>
          </Link>
        </Card>
        <Card>
          <h2 className="font-semibold">Ведущий</h2>
          <p className="mt-1 text-sm text-gray-400">Экран на ТВ. Код, QR, счётчик и старт драфта. Матч — в P3.</p>
          <Link to="/host">
            <Button className="mt-4" variant="secondary" full>
              Открыть пульт
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
