import { Copy, Check, User, Sparkles } from "lucide-react";
import { useState } from "react";
import { MarkdownMessage } from "./MarkdownMessage";
import { AgentPipeline } from "./AgentPipeline";
import { Disclaimer } from "../common/Disclaimer";
import type { ChatResponse } from "../../types/api";
import { URGENCY_STYLES } from "../../types/api";
import { cn } from "../../lib/utils";

export function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end rise-in">
      <div className="flex gap-2.5 max-w-[80%] items-start">
        <div className="rounded-2xl rounded-tr-sm bg-teal text-white px-4 py-2.5 text-sm leading-relaxed">
          {text}
        </div>
        <div className="h-7 w-7 rounded-full bg-teal-soft dark:bg-paper-dim-dark flex items-center justify-center shrink-0 mt-0.5">
          <User size={14} className="text-teal" />
        </div>
      </div>
    </div>
  );
}

export function PendingBubble({ steps, pendingKeys }: { steps: any[]; pendingKeys: string[] }) {
  return (
    <div className="flex gap-2.5 max-w-[85%] rise-in">
      <div className="h-7 w-7 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <AgentPipeline steps={steps} pendingKeys={pendingKeys} />
      </div>
    </div>
  );
}

export function AssistantBubble({ response }: { response: ChatResponse }) {
  const [copied, setCopied] = useState(false);
  const urgency = response.urgency ? URGENCY_STYLES[response.urgency] : null;

  const fullText = response.raw_final_text || response.summary;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex gap-2.5 max-w-[85%] rise-in">
      <div className="h-7 w-7 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <AgentPipeline steps={response.agent_trace} />

        <div className="rounded-2xl rounded-tl-sm border border-line dark:border-line-dark bg-white dark:bg-paper-dim-dark px-4 py-3.5">
          <div className="flex items-center justify-between mb-2">
            {urgency ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  urgency.bg,
                  urgency.fg
                )}
              >
                {urgency.label}
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 text-xs text-ink-soft dark:text-ink-soft-dark hover:text-teal transition-colors",
                copied && "text-teal"
              )}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <MarkdownMessage content={fullText} />
        </div>

        <Disclaimer text={response.safety_disclaimer} />
      </div>
    </div>
  );
}

export function ErrorBubble({ message }: { message: string }) {
  return (
    <div className="flex gap-2.5 max-w-[85%] rise-in">
      <div className="h-7 w-7 rounded-full bg-rose-soft flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-rose" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-rose/30 bg-rose-soft dark:bg-paper-dim-dark px-4 py-3 text-sm text-rose">
        {message}
      </div>
    </div>
  );
}
