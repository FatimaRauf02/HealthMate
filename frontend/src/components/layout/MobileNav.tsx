import { NavLink } from "react-router-dom";
import { HeartPulse, MessageSquareText, FileUp, History } from "lucide-react";
import { cn } from "../../lib/utils";

const ITEMS = [
  { to: "/", label: "Home", icon: HeartPulse, end: true },
  { to: "/chat", label: "Chat", icon: MessageSquareText, end: false },
  { to: "/upload", label: "Upload", icon: FileUp, end: false },
  { to: "/history", label: "History", icon: History, end: false },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-paper/95 dark:bg-paper-dark/95 backdrop-blur border-t border-line dark:border-line-dark">
      <div className="grid grid-cols-4">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                isActive ? "text-teal dark:text-teal" : "text-ink-soft dark:text-ink-soft-dark"
              )
            }
          >
            <Icon size={19} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
