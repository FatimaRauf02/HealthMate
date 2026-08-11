import { useState, type KeyboardEvent } from "react";
import { SendHorizontal, Trash2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onClear: () => void;
  disabled: boolean;
  hasMessages: boolean;
}

export function ChatInput({ onSend, onClear, disabled, hasMessages }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-line dark:border-line-dark bg-paper dark:bg-paper-dark px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        {hasMessages && (
          <button
            onClick={onClear}
            title="Clear chat"
            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-ink-soft dark:text-ink-soft-dark hover:bg-paper-dim dark:hover:bg-paper-dim-dark transition-colors"
          >
            <Trash2 size={17} />
          </button>
        )}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Describe your symptoms or ask a health question..."
          className="flex-1 resize-none rounded-xl border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-3.5 py-2.5 text-sm leading-relaxed max-h-32 focus:outline-none focus:ring-2 focus:ring-teal/40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="h-10 w-10 shrink-0 rounded-lg bg-teal text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-deep transition-colors"
        >
          <SendHorizontal size={17} />
        </button>
      </div>
      <p className="max-w-3xl mx-auto text-[11px] text-ink-soft dark:text-ink-soft-dark mt-1.5 pl-0.5">
        Educational guidance only — not a substitute for professional medical advice.
      </p>
    </div>
  );
}
