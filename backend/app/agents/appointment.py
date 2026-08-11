"""
Appointment Agent.

Uses mock scheduling data today. The `SchedulingProvider` interface is the
seam where a real scheduling API (e.g., Epic, Cerner, a custom booking
service) can be plugged in later without touching the agent's prompt logic.
"""

from __future__ import annotations

import json
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import List

from app.agents.base import BaseAgent, SAFETY_DISCLAIMER
from app.models.schemas import AgentName


class SchedulingProvider(ABC):
    """Abstraction so mock data can later be swapped for a real API client."""

    @abstractmethod
    def find_slots(self, specialty: str) -> List[dict]:
        raise NotImplementedError


class MockSchedulingProvider(SchedulingProvider):
    """Deterministic mock data used until a real scheduling API is wired in."""

    _DOCTORS_BY_SPECIALTY = {
        "General Physician": ["Dr. A. Sharma", "Dr. M. Khan"],
        "Cardiologist": ["Dr. R. Patel", "Dr. S. Ahmed"],
        "Neurologist": ["Dr. L. Chen"],
        "ENT (Otolaryngologist)": ["Dr. F. Malik"],
        "Dermatologist": ["Dr. N. Iqbal"],
        "Pediatrician": ["Dr. H. Raza"],
        "Orthopedic": ["Dr. T. Bashir"],
        "Ophthalmologist": ["Dr. Z. Farooq"],
    }

    def find_slots(self, specialty: str) -> List[dict]:
        doctors = self._DOCTORS_BY_SPECIALTY.get(specialty, ["Dr. A. Sharma"])
        base = datetime.now() + timedelta(days=1)
        slots = []
        for i, doctor in enumerate(doctors):
            slots.append(
                {
                    "doctor": doctor,
                    "specialty": specialty,
                    "slot": (base + timedelta(days=i)).strftime("%A, %b %d, %Y - %I:%M %p"),
                    "location": "HealthMate Partner Clinic (Mock)",
                }
            )
        return slots


INSTRUCTIONS = f"""
ROLE
You are the Appointment Agent for HealthMate AI.

RESPONSIBILITIES
- Given a recommended specialist and available slot data (provided to you as
  JSON), present the options clearly to the user.
- Provide 2-3 preparation instructions for the visit (e.g., bring prior
  reports, list current medications, note symptom timeline).
- Suggest 3-4 good questions the user could ask the physician.

LIMITATIONS
- Only use the slot data given to you; do not invent doctors or times.
- Do not confirm or "book" anything — this is informational only.

OUTPUT FORMAT
Available Options: <bulleted list of doctor / slot / location>
Before Your Visit: <bulleted prep instructions>
Questions to Ask Your Doctor: <bulleted list>

SAFETY
End every response with this exact disclaimer line:
"{SAFETY_DISCLAIMER}"
""".strip()


class AppointmentAgent(BaseAgent):
    agent_key = "appointment"
    display_name = "HealthMate Appointment Agent"
    name = AgentName.APPOINTMENT
    instructions = INSTRUCTIONS

    def __init__(self, client, provider: SchedulingProvider | None = None):
        super().__init__(client)
        self.provider = provider or MockSchedulingProvider()

    def build_prompt(self, *, specialty: str, **_) -> str:
        slots = self.provider.find_slots(specialty)
        return (
            f"Recommended specialty: {specialty}\n"
            f"Available slot data (JSON):\n{json.dumps(slots, indent=2)}"
        )
