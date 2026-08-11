"""Chat endpoint: runs the full multi-agent pipeline for a user message."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import ChatRequest, ChatResponse, ConversationTurn
from app.services.azure_client import AzureAgentClient, get_azure_agent_client
from app.services.conversation_store import ConversationStore, get_conversation_store
from app.services.orchestrator import Orchestrator

logger = logging.getLogger("healthmate.routers.chat")
router = APIRouter(prefix="/chat", tags=["chat"])


def get_orchestrator(client: AzureAgentClient = Depends(get_azure_agent_client)) -> Orchestrator:
    return Orchestrator(client)


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    orchestrator: Orchestrator = Depends(get_orchestrator),
    store: ConversationStore = Depends(get_conversation_store),
) -> ChatResponse:
    try:
        conversation = (
            store.get(request.conversation_id) if request.conversation_id else None
        ) or store.create(title=request.message[:60])

        conversation.turns.append(ConversationTurn(role="user", content=request.message))

        response = await orchestrator.handle_chat(
            conversation_id=conversation.conversation_id,
            user_message=request.message,
            report_context=request.report_context,
        )

        conversation.turns.append(
            ConversationTurn(role="assistant", content=response.raw_final_text or response.summary)
        )
        store.save(conversation)

        return response
    except RuntimeError as exc:
        # e.g. missing Azure config
        logger.error("Configuration error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error in /chat")
        raise HTTPException(status_code=500, detail="Internal error processing chat request") from exc
