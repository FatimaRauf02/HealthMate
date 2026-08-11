"""
Coordinator Agent.

Decides which specialist agents should run for a given user request.
This agent NEVER answers medical questions itself — it only returns a
routing decision, which the Orchestrator then executes.
"""

from __future__ import annotations

import json
import logging

from app.agents.base import BaseAgent
from app.models.schemas import AgentName
from app.services.azure_client import AzureAgentClient

logger = logging.getLogger("healthmate.coordinator")

VALID_AGENTS = [
    "triage",
    "medical_information",
    "specialist_recommendation",
    "lifestyle",
    "appointment",
    "medical_report",
]

INSTRUCTIONS = f"""
ROLE
You are the Coordinator Agent for HealthMate AI. You route requests — you do
not answer medical questions yourself.

RESPONSIBILITIES
- Read the user's message (and whether a report was uploaded).
- Decide which of these agents should run: {", ".join(VALID_AGENTS)}.
- Typical patterns:
  - Symptom description -> triage, medical_information, specialist_recommendation, lifestyle
  - "Which doctor should I see" -> specialist_recommendation, appointment
  - "Summarize my report" / report_context present -> medical_report, medical_information
  - General wellness question (no symptoms) -> lifestyle, medical_information
- The Summary Agent always runs last and is NOT part of your list (it is
  invoked automatically by the system).

LIMITATIONS
- NEVER produce medical advice, urgency levels, or explanations yourself.
- Only output the JSON routing object described below — nothing else.

OUTPUT FORMAT
Return ONLY valid JSON, no prose, no markdown fences:
{{"agents": ["<subset of the valid agent keys, in execution order>"]}}
""".strip()


class CoordinatorAgent(BaseAgent):
    agent_key = "coordinator"
    display_name = "HealthMate Coordinator Agent"
    name = AgentName.COORDINATOR
    instructions = INSTRUCTIONS

    def build_prompt(self, *, user_message: str, has_report: bool = False, **_) -> str:
        return (
            f"User message: {user_message}\n"
            f"Report uploaded/present: {has_report}\n"
            "Return the JSON routing object now."
        )

    async def decide_route(self, *, user_message: str, has_report: bool = False) -> list[str]:
        """Run the coordinator and parse its JSON routing decision safely."""
        result = await self.run(user_message=user_message, has_report=has_report)
        if result.status.value != "completed" or not result.output:
            logger.warning("Coordinator failed, falling back to default route")
            return self._fallback_route(has_report)

        try:
            cleaned = result.output.strip().strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
            parsed = json.loads(cleaned)
            agents = [a for a in parsed.get("agents", []) if a in VALID_AGENTS]
            return agents or self._fallback_route(has_report)
        except (json.JSONDecodeError, AttributeError):
            logger.warning("Could not parse coordinator output as JSON: %s", result.output)
            return self._fallback_route(has_report)

    @staticmethod
    def _fallback_route(has_report: bool) -> list[str]:
        if has_report:
            return ["medical_report", "medical_information"]
        return ["triage", "medical_information", "specialist_recommendation", "lifestyle"]
