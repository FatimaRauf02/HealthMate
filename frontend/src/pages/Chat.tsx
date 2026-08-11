import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sendChat, getConversation, friendlyErrorMessage } from "../lib/api";
import type { ChatResponse } from "../types/api";
import { UserBubble, AssistantBubble, PendingBubble, ErrorBubble } from "../components/chat/MessageBubble";
import { ChatInput } from "../components/chat/ChatInput";
import { EmptyState } from "../components/common/EmptyState";
import { MessageSquareText } from "lucide-react";

type Turn =
  | { kind: "user"; text: string }
  | { kind: "assistant"; response: ChatResponse }
  | { kind: "pending" }
  | { kind: "error"; message: string };

const GENERIC_PENDING_STEPS = [
  "Coordinator",
  "Triage",
  "Medical Information",
  "Specialist Recommendation",
  "Lifestyle",
  "Summary",
];

export function Chat() {
  const [searchParams] = useSearchParams();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, sending]);

  useEffect(() => {
    const existingId = searchParams.get("conversation");
    if (!existingId) return;
    (async () => {
      try {
        const conversation = await getConversation(existingId);
        setConversationId(conversation.conversation_id);
        const loaded: Turn[] = conversation.turns.map((t) =>
          t.role === "user"
            ? { kind: "user", text: t.content }
            : {
                kind: "assistant",
                response: {
                  conversation_id: conversation.conversation_id,
                  summary: t.content,
                  urgency: null,
                  educational_information: null,
                  lifestyle_advice: null,
                  recommended_specialist: null,
                  appointment_suggestions: null,
                  safety_disclaimer:
                    "This information is educational only and is not a medical diagnosis. Always consult a qualified healthcare professional.",
                  agent_trace: [],
                  raw_final_text: t.content,
                },
              }
        );
        setTurns(loaded);
      } catch {
        // conversation not found — start fresh silently
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSend = async (message: string) => {
    setTurns((prev) => [...prev, { kind: "user", text: message }, { kind: "pending" }]);
    setSending(true);
    try {
      const response = await sendChat({ message, conversation_id: conversationId });
      setConversationId(response.conversation_id);
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { kind: "assistant", response };
        return next;
      });
    } catch (err) {
      setTurns((prev) => {
        const next = [...prev];
        next[next.length - 1] = { kind: "error", message: friendlyErrorMessage(err) };
        return next;
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setTurns([]);
    setConversationId(undefined);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-line dark:border-line-dark px-5 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-lg leading-tight">Chat</h1>
          <p className="text-xs text-ink-soft dark:text-ink-soft-dark">
            Coordinator routes your question to specialist agents
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-3xl mx-auto space-y-5">
          {turns.length === 0 && (
            <EmptyState
              icon={MessageSquareText}
              title="Ask HealthMate anything"
              description={`Try: "I've had a fever and sore throat for three days. What precautions should I take?"`}
            />
          )}
          {turns.map((turn, i) => {
            if (turn.kind === "user") return <UserBubble key={i} text={turn.text} />;
            if (turn.kind === "assistant") return <AssistantBubble key={i} response={turn.response} />;
            if (turn.kind === "error") return <ErrorBubble key={i} message={turn.message} />;
            return (
              <PendingBubble
                key={i}
                steps={[{ agent: "coordinator", status: "running", output: null, started_at: null, completed_at: null, latency_ms: null, error: null }]}
                pendingKeys={GENERIC_PENDING_STEPS.slice(1)}
              />
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      <ChatInput onSend={handleSend} onClear={handleClear} disabled={sending} hasMessages={turns.length > 0} />
    </div>
  );
}
