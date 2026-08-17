import type { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col bg-[#0B0F19] text-white">
      <Header />
      <main className="flex-1 px-4 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
