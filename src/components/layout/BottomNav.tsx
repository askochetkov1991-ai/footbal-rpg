import { useGameStore } from "../../store/gameStore";
import type { Tab } from "../../types";
import { cn } from "../../lib/utils";

const items: { id: Tab; label: string }[] = [
  { id: "home", label: "Главная" },
  { id: "squad", label: "Состав" },
  { id: "transfers", label: "Трансферы" },
  { id: "match", label: "Матч" },
  { id: "table", label: "Таблица" },
];

export function BottomNav() {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  return (
    <nav className="sticky bottom-0 grid grid-cols-5 border-t border-white/10 bg-[#0B0F19]/95 px-1 py-2 backdrop-blur">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={cn(
            "rounded-lg py-2 text-[11px] font-semibold",
            activeTab === item.id ? "text-orange-400" : "text-gray-400",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
