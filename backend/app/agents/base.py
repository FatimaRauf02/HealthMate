"""Base class for all HealthMate specialist agents."""

from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime

from app.models.schemas import AgentName, AgentStatus, AgentStepResult
from app.services.azure_client import AzureAgentClient

logger = logging.getLogger("healthmate.agents")

SAFETY_DISCLAIMER = (
    "This information is educational only and is not a medical diagnosis. "
    "Always consult a qualified healthcare professional for medical advice, "
    "diagnosis, or treatment. If this is a medical emergency, call your local "
    "emergency number immediately."
)


class BaseAgent(ABC):
    """
    Common contract for every specialist agent.

    Subclasses define `agent_key`, `display_name`, `name` (AgentName enum),
    and `instructions` (the Azure AI Agent system prompt), then implement
    `build_prompt()` to shape the per-request user message.
    """

    agent_key: str
    display_name: str
    name: AgentName
    instructions: str

    def __init__(self, client: AzureAgentClient):
        self.client = client

    @abstractmethod
    def build_prompt(self, **kwargs) -> str:
        """Construct the user-turn prompt sent to this agent's thread."""
        raise NotImplementedError

    async def run(self, **kwargs) -> AgentStepResult:
        started = datetime.utcnow()
        t0 = time.perf_counter()
        try:
            prompt = self.build_prompt(**kwargs)
            output = await self.client.run_agent(
                agent_key=self.agent_key,
                name=self.display_name,
                instructions=self.instructions,
                user_prompt=prompt,
            )
            latency_ms = (time.perf_counter() - t0) * 1000
            return AgentStepResult(
                agent=self.name,
                status=AgentStatus.COMPLETED,
                output=output,
                started_at=started,
                completed_at=datetime.utcnow(),
                latency_ms=latency_ms,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("Agent %s failed", self.display_name)
            return AgentStepResult(
                agent=self.name,
                status=AgentStatus.FAILED,
                started_at=started,
                completed_at=datetime.utcnow(),
                latency_ms=(time.perf_counter() - t0) * 1000,
                error=str(exc),
            )
