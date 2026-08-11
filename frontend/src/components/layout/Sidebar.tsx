import { NavLink } from "react-router-dom";
import {
  HeartPulse,
  MessageSquareText,
  FileUp,
  History,
  Info,
} from "lucide-react";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: HeartPulse, end: true },
  { to: "/chat", label: "Chat", icon: MessageSquareText, end: false },
  { to: "/upload", label: "Report Upload", icon: FileUp, end: false },
  { to: "/history", label: "History", icon: History, end: false },
  { to: "/about", label: "About", icon: Info, end: false },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 border-r border-line dark:border-line-dark bg-paper dark:bg-paper-dark">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal flex items-center justify-center">
            <HeartPulse size={18} className="text-paper" strokeWidth={2.25} />
          </div>
          <span className="font-display text-lg tracking-tight">HealthMate</span>
        </div>
        <p className="mt-1 text-xs text-ink-soft dark:text-ink-soft-dark pl-10">
          Multi-agent AI assistant
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-teal-soft text-teal-deep font-medium dark:bg-paper-dim-dark dark:text-ink-dark"
                  : "text-ink-soft hover:bg-paper-dim dark:text-ink-soft-dark dark:hover:bg-paper-dim-dark"
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}