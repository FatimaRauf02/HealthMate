export type UrgencyLevel = "Emergency" | "Urgent" | "Routine" | "Home Care";

export type AgentName =
  | "coordinator"
  | "triage"
  | "medical_information"
  | "specialist_recommendation"
  | "lifestyle"
  | "appointment"
  | "medical_report"
  | "summary";

export type AgentStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface AgentStepResult {
  agent: AgentName;
  status: AgentStatus;
  output: string | null;
  started_at: string | null;
  completed_at: string | null;
  latency_ms: number | null;
  error: string | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  report_context?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  summary: string;
  urgency: UrgencyLevel | null;
  educational_information: string | null;
  lifestyle_advice: string | null;
  recommended_specialist: string | null;
  appointment_suggestions: string | null;
  safety_disclaimer: string;
  agent_trace: AgentStepResult[];
  raw_final_text: string | null;
}

export interface UploadResponse {
  file_id: string;
  filename: string;
  extracted_text_preview: string;
  summary: string;
  abnormal_findings: string[];
  terminology_explained: Record<string, string>;
  safety_disclaimer: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface Conversation {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  turns: ConversationTurn[];
}

export interface HistoryResponse {
  conversations: Conversation[];
}

export const AGENT_LABELS: Record<AgentName, string> = {
  coordinator: "Coordinator",
  triage: "Triage",
  medical_information: "Medical Information",
  specialist_recommendation: "Specialist Recommendation",
  lifestyle: "Lifestyle",
  appointment: "Appointment",
  medical_report: "Medical Report",
  summary: "Summary",
};

export const URGENCY_STYLES: Record<UrgencyLevel, { bg: string; fg: string; label: string }> = {
  Emergency: { bg: "bg-rose-soft", fg: "text-rose", label: "Emergency" },
  Urgent: { bg: "bg-amber-soft", fg: "text-amber", label: "Urgent" },
  Routine: { bg: "bg-mist-soft", fg: "text-mist", label: "Routine" },
  "Home Care": { bg: "bg-teal-soft", fg: "text-teal", label: "Home Care" },
};
