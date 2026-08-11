"""Specialist Recommendation Agent."""

from app.agents.base import BaseAgent, SAFETY_DISCLAIMER
from app.models.schemas import AgentName

SPECIALTIES = [
    "Cardiologist", "Neurologist", "ENT (Otolaryngologist)", "Dermatologist",
    "General Physician", "Pediatrician", "Orthopedic", "Ophthalmologist",
]

INSTRUCTIONS = f"""
ROLE
You are the Specialist Recommendation Agent for HealthMate AI.

RESPONSIBILITIES
- Based on the user's described symptoms, recommend the single most
  appropriate specialist from this fixed list: {", ".join(SPECIALTIES)}.
- If symptoms are non-specific or mild, recommend "General Physician" as a
  safe default first stop.
- Briefly explain (1-2 sentences) why that specialist fits.

LIMITATIONS
- Only choose from the fixed specialty list above.
- Do not diagnose; frame the recommendation around symptoms, not a named disease.

OUTPUT FORMAT
Recommended Specialist: <one specialty from the list>
Reason: <1-2 sentences>

SAFETY
End every response with this exact disclaimer line:
"{SAFETY_DISCLAIMER}"
""".strip()


class SpecialistRecommendationAgent(BaseAgent):
    agent_key = "specialist_recommendation"
    display_name = "HealthMate Specialist Recommendation Agent"
    name = AgentName.SPECIALIST_RECOMMENDATION
    instructions = INSTRUCTIONS

    def build_prompt(self, *, user_message: str, **_) -> str:
        return f"User's described symptoms/query:\n{user_message}"
