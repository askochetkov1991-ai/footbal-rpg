import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./pages/HomePage";
import { MatchPage } from "./pages/MatchPage";
import { SquadPage } from "./pages/SquadPage";
import { TablePage } from "./pages/TablePage";
import { TransferPage } from "./pages/TransferPage";
import { useGameStore } from "./store/gameStore";

export function CareerApp() {
  const tab = useGameStore((s) => s.activeTab);
  return (
    <AppShell>
      {tab === "home" ? <HomePage /> : null}
      {tab === "squad" ? <SquadPage /> : null}
      {tab === "transfers" ? <TransferPage /> : null}
      {tab === "match" ? <MatchPage /> : null}
      {tab === "table" ? <TablePage /> : null}
    </AppShell>
  );
}
