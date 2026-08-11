"""History endpoint: retrieve stored conversations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.models.schemas import Conversation, HistoryResponse
from app.services.conversation_store import ConversationStore, get_conversation_store

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryResponse)
async def get_history(store: ConversationStore = Depends(get_conversation_store)) -> HistoryResponse:
    return HistoryResponse(conversations=store.list_all())


@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str, store: ConversationStore = Depends(get_conversation_store)
) -> Conversation:
    conversation = store.get(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation
