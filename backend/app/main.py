"""HealthMate AI - FastAPI application entrypoint."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import chat, history, upload

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("healthmate.main")

app = FastAPI(
    title="HealthMate AI",
    description=(
        "Multi-agent healthcare assistant built on Azure AI Foundry and the "
        "Azure AI Agents SDK. Educational use only — not a substitute for "
        "professional medical advice."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(upload.router)
app.include_router(history.router)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok", "service": "HealthMate AI", "env": settings.app_env}


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("HealthMate AI backend starting up (env=%s)", settings.app_env)
    if not settings.azure_project_connection_string:
        logger.warning(
            "AZURE_PROJECT_CONNECTION_STRING is not set — agent calls will fail "
            "until Azure AI Foundry is configured. See README for setup steps."
        )
