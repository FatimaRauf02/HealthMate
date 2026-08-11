"""Upload endpoint: accepts PDF/DOCX/TXT medical reports and summarizes them."""

from __future__ import annotations

import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from app.agents.report import MedicalReportAgent, extract_text_from_file
from app.models.schemas import AgentStatus, UploadResponse
from app.services.azure_client import AzureAgentClient, get_azure_agent_client

logger = logging.getLogger("healthmate.routers.upload")
router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("", response_model=UploadResponse)
async def upload_report(
    file: UploadFile = File(...),
    client: AzureAgentClient = Depends(get_azure_agent_client),
) -> UploadResponse:
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Use PDF, DOCX, or TXT.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")

    try:
        extracted_text = extract_text_from_file(file.filename, contents)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from this file.")

    agent = MedicalReportAgent(client)
    result = await agent.run(report_text=extracted_text)
    if result.status != AgentStatus.COMPLETED:
        raise HTTPException(status_code=500, detail=f"Report analysis failed: {result.error}")

    output = result.output or ""
    findings = _extract_bullets(output, "Findings Worth Discussing With Your Doctor")
    terminology = _extract_terms(output, "Terminology Explained")

    return UploadResponse(
        file_id=str(uuid.uuid4()),
        filename=file.filename,
        extracted_text_preview=extracted_text[:500],
        summary=_extract_section(output, "Summary") or output,
        abnormal_findings=findings,
        terminology_explained=terminology,
        safety_disclaimer=(
            "This information is educational only and is not a medical diagnosis. "
            "Always consult a qualified healthcare professional."
        ),
    )


def _extract_section(text: str, header: str) -> str | None:
    match = re.search(rf"{re.escape(header)}:\s*(.*?)(?:\n[A-Z][a-zA-Z ]+:|$)", text, re.DOTALL)
    return match.group(1).strip() if match else None


def _extract_bullets(text: str, header: str) -> list[str]:
    section = _extract_section(text, header) or ""
    return [line.strip("-* ").strip() for line in section.splitlines() if line.strip().startswith(("-", "*"))]


def _extract_terms(text: str, header: str) -> dict[str, str]:
    section = _extract_section(text, header) or ""
    terms = {}
    for line in section.splitlines():
        line = line.strip("-* ").strip()
        if ":" in line:
            term, explanation = line.split(":", 1)
            terms[term.strip()] = explanation.strip()
    return terms
