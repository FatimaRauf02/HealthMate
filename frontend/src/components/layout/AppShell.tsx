import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-paper dark:bg-paper-dark text-ink dark:text-ink-dark">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
