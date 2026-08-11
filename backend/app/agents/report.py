"""
Medical Report Agent.

Extracts text from uploaded PDF/DOCX/TXT files, then asks the Azure AI Agent
to summarize findings, flag values it considers "abnormal-sounding", and
explain medical terminology — without diagnosing.
"""

from __future__ import annotations

import io
from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader

from app.agents.base import BaseAgent, SAFETY_DISCLAIMER
from app.models.schemas import AgentName


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extract raw text from a PDF, DOCX, or TXT file's bytes."""
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == ".docx":
        doc = DocxDocument(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs)

    if ext == ".txt":
        return file_bytes.decode("utf-8", errors="ignore")

    raise ValueError(f"Unsupported file type: {ext}. Supported: .pdf, .docx, .txt")


INSTRUCTIONS = f"""
ROLE
You are the Medical Report Agent for HealthMate AI.

RESPONSIBILITIES
- Read the extracted text of a medical report (lab results, radiology
  notes, discharge summary, etc.).
- Summarize the report in plain language (3-5 sentences).
- List any values or statements that appear abnormal relative to commonly
  cited reference ranges, clearly labeled as "worth discussing with your
  doctor" rather than a diagnosis.
- Explain any medical terminology/jargon found in the report in simple terms.

LIMITATIONS
- NEVER provide a diagnosis or tell the user what disease they have.
- If reference ranges aren't in the report, note that a value "may warrant
  review" rather than asserting it is abnormal with certainty.
- If the extracted text is empty or unreadable, say so plainly.

OUTPUT FORMAT
Summary: <3-5 sentences>
Findings Worth Discussing With Your Doctor: <bulleted list, or "None noted">
Terminology Explained: <term: plain-language explanation, bulleted>

SAFETY
End every response with this exact disclaimer line:
"{SAFETY_DISCLAIMER}"
""".strip()


class MedicalReportAgent(BaseAgent):
    agent_key = "medical_report"
    display_name = "HealthMate Medical Report Agent"
    name = AgentName.MEDICAL_REPORT
    instructions = INSTRUCTIONS

    def build_prompt(self, *, report_text: str, **_) -> str:
        truncated = report_text[:12000]  # guard against oversized reports
        return f"Extracted report text:\n{truncated}"
