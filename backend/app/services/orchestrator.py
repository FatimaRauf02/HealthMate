"""
Orchestrator: runs the full HealthMate multi-agent pipeline.

Flow:
  Coordinator -> {Triage, Medical Info, Specialist, Lifestyle, Appointment,
                  Medical Report (subset chosen dynamically)} -> Summary
"""

from __future__ import annotations

import asyncio
import logging

from app.agents.appointment import AppointmentAgent
from app.agents.coordinator import CoordinatorAgent
from app.agents.lifestyle import LifestyleAgent
from app.agents.medical import MedicalInformationAgent
from app.agents.report import MedicalReportAgent
from app.agents.specialist import SpecialistRecommendationAgent
from app.agents.summary import SummaryAgent
from app.agents.triage import TriageAgent
from app.models.schemas import AgentStatus, AgentStepResult, ChatResponse, UrgencyLevel
from app.services.azure_client import AzureAgentClient

logger = logging.getLogger("healthmate.orchestrator")


class Orchestrator:
    def __init__(self, client: AzureAgentClient):
        self.client = client
        self.coordinator = CoordinatorAgent(client)
        self.triage = TriageAgent(client)
        self.medical = MedicalInformationAgent(client)
        self.specialist = SpecialistRecommendationAgent(client)
        self.lifestyle = LifestyleAgent(client)
        self.appointment = AppointmentAgent(client)
        self.report = MedicalReportAgent(client)
        self.summary = SummaryAgent(client)

    async def handle_chat(
        self, *, conversation_id: str, user_message: str, report_context: str | None = None
    ) -> ChatResponse:
        trace: list[AgentStepResult] = []
        has_report = bool(report_context)

        # 1) Coordinator decides routing
        route = await self.coordinator.decide_route(user_message=user_message, has_report=has_report)
        logger.info("Coordinator route: %s", route)

        # 2) Run selected specialist agents concurrently where possible.
        outputs: dict[str, str] = {}
        specialist_output_text = ""

        tasks = {}
        if "triage" in route:
            tasks["triage"] = self.triage.run(user_message=user_message)
        if "medical_information" in route:
            tasks["medical_information"] = self.medical.run(user_message=user_message)
        if "specialist_recommendation" in route:
            tasks["specialist_recommendation"] = self.specialist.run(user_message=user_message)
        if "lifestyle" in route:
            tasks["lifestyle"] = self.lifestyle.run(user_message=user_message)
        if "medical_report" in route and report_context:
            tasks["medical_report"] = self.report.run(report_text=report_context)

        results = await asyncio.gather(*tasks.values())
        for key, result in zip(tasks.keys(), results):
            trace.append(result)
            if result.status == AgentStatus.COMPLETED:
                outputs[key] = result.output or ""
                if key == "specialist_recommendation":
                    specialist_output_text = result.output or ""

        # 3) Appointment Agent runs after specialist recommendation (needs its output)
        if "appointment" in route or "specialist_recommendation" in outputs:
            specialty = self._extract_specialty(specialist_output_text) or "General Physician"
            appointment_result = await self.appointment.run(specialty=specialty)
            trace.append(appointment_result)
            if appointment_result.status == AgentStatus.COMPLETED:
                outputs["appointment"] = appointment_result.output or ""

        # 4) Summary Agent combines everything
        summary_result = await self.summary.run(agent_outputs=outputs)
        trace.append(summary_result)
        final_text = summary_result.output or "Unable to generate a summary at this time."

        return ChatResponse(
            conversation_id=conversation_id,
            summary=self._extract_section(final_text, "Summary") or final_text,
            urgency=self._extract_urgency(outputs.get("triage", "")),
            educational_information=outputs.get("medical_information"),
            lifestyle_advice=outputs.get("lifestyle"),
            recommended_specialist=specialist_output_text or None,
            appointment_suggestions=outputs.get("appointment"),
            safety_disclaimer=(
                "This information is educational only and is not a medical diagnosis. "
                "Always consult a qualified healthcare professional for medical advice, "
                "diagnosis, or treatment. If this is a medical emergency, call your local "
                "emergency number immediately."
            ),
            agent_trace=trace,
            raw_final_text=final_text,
        )

    @staticmethod
    def _extract_specialty(specialist_text: str) -> str | None:
        for line in specialist_text.splitlines():
            if line.lower().startswith("recommended specialist:"):
                return line.split(":", 1)[1].strip()
        return None

    @staticmethod
    def _extract_urgency(triage_text: str) -> UrgencyLevel | None:
        for line in triage_text.splitlines():
            if line.lower().startswith("urgency:"):
                value = line.split(":", 1)[1].strip()
                try:
                    return UrgencyLevel(value)
                except ValueError:
                    return None
        return None

    @staticmethod
    def _extract_section(text: str, header: str) -> str | None:
        marker = f"## {header}"
        if marker not in text:
            return None
        after = text.split(marker, 1)[1]
        next_header_idx = after.find("\n## ")
        section = after if next_header_idx == -1 else after[:next_header_idx]
        return section.strip()
