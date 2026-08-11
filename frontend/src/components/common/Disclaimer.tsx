import { ShieldAlert } from "lucide-react";

export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex gap-2.5 rounded-lg bg-mist-soft dark:bg-paper-dim-dark border border-line dark:border-line-dark px-3.5 py-3 text-xs text-ink-soft dark:text-ink-soft-dark">
      <ShieldAlert size={16} className="text-mist shrink-0 mt-0.5" />
      <p>{text}</p>
    </div>
  );
}
