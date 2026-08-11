import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-teal-soft dark:bg-paper-dim-dark flex items-center justify-center mb-4">
        <Icon size={22} className="text-teal" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-lg mb-1">{title}</h3>
      <p className="text-sm text-ink-soft dark:text-ink-soft-dark max-w-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
