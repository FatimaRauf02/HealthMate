import { Check, X, Loader2, Circle } from "lucide-react";
import type { AgentStepResult } from "../../types/api";
import { AGENT_LABELS } from "../../types/api";
import { cn, formatLatency } from "../../lib/utils";

interface AgentPipelineProps {
  steps: AgentStepResult[];
  /** Keys of agents still to come, shown as pending nodes below the real trace */
  pendingKeys?: string[];
}

export function AgentPipeline({ steps, pendingKeys = [] }: AgentPipelineProps) {
  return (
    <div className="rounded-xl border border-line dark:border-line-dark bg-white/60 dark:bg-paper-dim-dark/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-soft dark:text-ink-soft-dark font-mono-data mb-2.5">
        Agent pipeline
      </p>
      <ol className="relative pl-1">
        {steps.map((step, i) => (
          <PipelineNode
            key={`${step.agent}-${i}`}
            label={AGENT_LABELS[step.agent]}
            status={step.status}
            latency={step.latency_ms}
            error={step.error}
            isLast={i === steps.length - 1 && pendingKeys.length === 0}
          />
        ))}
        {pendingKeys.map((key, i) => (
          <PipelineNode
            key={`pending-${key}`}
            label={key}
            status="pending"
            isLast={i === pendingKeys.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function PipelineNode({
  label,
  status,
  latency,
  error,
  isLast,
}: {
  label: string;
  status: AgentStepResult["status"];
  latency?: number | null;
  error?: string | null;
  isLast: boolean;
}) {
  return (
    <li className="relative pl-6 pb-3.5 last:pb-0">
      {!isLast && (
        <span className="absolute left-[7px] top-4 bottom-0 w-px bg-line dark:bg-line-dark" aria-hidden />
      )}
      <span
        className={cn(
          "absolute left-0 top-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center",
          status === "completed" && "bg-teal",
          status === "failed" && "bg-rose",
          status === "running" && "bg-amber pulse-node",
          status === "pending" && "bg-line dark:bg-line-dark"
        )}
      >
        {status === "completed" && <Check size={9} className="text-white" strokeWidth={3} />}
        {status === "failed" && <X size={9} className="text-white" strokeWidth={3} />}
        {status === "running" && <Loader2 size={9} className="text-white animate-spin" strokeWidth={3} />}
        {status === "pending" && <Circle size={5} className="text-ink-soft dark:text-ink-soft-dark" fill="currentColor" />}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-sm",
            status === "pending" ? "text-ink-soft dark:text-ink-soft-dark" : "font-medium"
          )}
        >
          {status === "running" ? `Executing ${label}...` : label}
        </span>
        {latency !== null && latency !== undefined && status === "completed" && (
          <span className="font-mono-data text-[11px] text-ink-soft dark:text-ink-soft-dark shrink-0">
            {formatLatency(latency)}
          </span>
        )}
      </div>
      {status === "failed" && error && (
        <p className="text-xs text-rose mt-0.5 max-w-md">{error}</p>
      )}
    </li>
  );
}
