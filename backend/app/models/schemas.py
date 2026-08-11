"""Pydantic request/response models shared across routers and agents."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class UrgencyLevel(str, Enum):
    EMERGENCY = "Emergency"
    URGENT = "Urgent"
    ROUTINE = "Routine"
    HOME_CARE = "Home Care"


class AgentName(str, Enum):
    COORDINATOR = "coordinator"
    TRIAGE = "triage"
    MEDICAL_INFORMATION = "medical_information"
    SPECIALIST_RECOMMENDATION = "specialist_recommendation"
    LIFESTYLE = "lifestyle"
    APPOINTMENT = "appointment"
    MEDICAL_REPORT = "medical_report"
    SUMMARY = "summary"


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's natural language query")
    conversation_id: Optional[str] = Field(None, description="Existing conversation to append to")
    report_context: Optional[str] = Field(
        None, description="Optional extracted text from a previously uploaded report"
    )


class AgentStepResult(BaseModel):
    """Represents the output and metadata of a single agent's execution."""

    agent: AgentName
    status: AgentStatus
    output: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    summary: str
    urgency: Optional[UrgencyLevel] = None
    educational_information: Optional[str] = None
    lifestyle_advice: Optional[str] = None
    recommended_specialist: Optional[str] = None
    appointment_suggestions: Optional[str] = None
    safety_disclaimer: str
    agent_trace: List[AgentStepResult] = Field(default_factory=list)
    raw_final_text: Optional[str] = None


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    extracted_text_preview: str
    summary: str
    abnormal_findings: List[str] = Field(default_factory=list)
    terminology_explained: Dict[str, str] = Field(default_factory=dict)
    safety_disclaimer: str


class ConversationTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Conversation(BaseModel):
    conversation_id: str
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    turns: List[ConversationTurn] = Field(default_factory=list)


class HistoryResponse(BaseModel):
    conversations: List[Conversation]
