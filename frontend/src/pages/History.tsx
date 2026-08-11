import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import { getHistory, friendlyErrorMessage } from "../lib/api";
import type { Conversation } from "../types/api";
import { EmptyState } from "../components/common/EmptyState";

export function History() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getHistory();
        const sorted = [...data.conversations].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setConversations(sorted);
      } catch (err) {
        setError(friendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="h-screen overflow-y-auto">
      <header className="border-b border-line dark:border-line-dark px-5 py-3.5">
        <h1 className="font-display text-lg leading-tight">Conversation History</h1>
        <p className="text-xs text-ink-soft dark:text-ink-soft-dark">Every chat is saved locally by the backend</p>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-ink-soft dark:text-ink-soft-dark">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading conversations...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg bg-rose-soft border border-rose/20 px-4 py-3 text-sm text-rose">{error}</div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <EmptyState
            icon={HistoryIcon}
            title="No conversations yet"
            description="Start a chat and it'll show up here automatically."
            action={
              <Link
                to="/chat"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal text-white text-sm font-medium px-4 py-2 hover:bg-teal-deep transition-colors"
              >
                Start chatting <ArrowRight size={14} />
              </Link>
            }
          />
        )}

        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.conversation_id}>
              <Link
                to={`/chat?conversation=${c.conversation_id}`}
                className="flex items-center gap-3 rounded-xl border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-4 py-3 hover:border-teal/40 transition-colors group"
              >
                <div className="h-8 w-8 rounded-full bg-teal-soft dark:bg-paper-dim flex items-center justify-center shrink-0">
                  <MessageSquare size={14} className="text-teal" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{c.title}</p>
                  <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
                    {c.turns.length} messages · {new Date(c.updated_at).toLocaleString()}
                  </p>
                </div>
                <ArrowRight
                  size={15}
                  className="text-ink-soft dark:text-ink-soft-dark group-hover:text-teal group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
