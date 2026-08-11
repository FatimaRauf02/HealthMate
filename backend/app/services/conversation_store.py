"""
Conversation persistence layer.

Currently backed by a local JSON file. The `ConversationStore` interface is
the seam for swapping in Azure Cosmos DB or Azure SQL later without touching
routers or the orchestrator.
"""

from __future__ import annotations

import json
import logging
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List, Optional

from app.models.schemas import Conversation, ConversationTurn
from app.config import get_settings

logger = logging.getLogger("healthmate.conversation_store")


class ConversationStore(ABC):
    @abstractmethod
    def get(self, conversation_id: str) -> Optional[Conversation]:
        ...

    @abstractmethod
    def list_all(self) -> List[Conversation]:
        ...

    @abstractmethod
    def save(self, conversation: Conversation) -> None:
        ...

    @abstractmethod
    def create(self, title: str) -> Conversation:
        ...


class JsonConversationStore(ConversationStore):
    """Simple JSON-file-backed store. Swap for CosmosConversationStore later."""

    def __init__(self, path: Optional[str] = None):
        settings = get_settings()
        self.path = Path(path or settings.conversation_store_path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text(json.dumps({"conversations": []}, indent=2))

    def _read_all(self) -> dict:
        return json.loads(self.path.read_text() or '{"conversations": []}')

    def _write_all(self, data: dict) -> None:
        self.path.write_text(json.dumps(data, indent=2, default=str))

    def get(self, conversation_id: str) -> Optional[Conversation]:
        data = self._read_all()
        for c in data.get("conversations", []):
            if c["conversation_id"] == conversation_id:
                return Conversation(**c)
        return None

    def list_all(self) -> List[Conversation]:
        data = self._read_all()
        return [Conversation(**c) for c in data.get("conversations", [])]

    def save(self, conversation: Conversation) -> None:
        data = self._read_all()
        conversations = data.get("conversations", [])
        for i, c in enumerate(conversations):
            if c["conversation_id"] == conversation.conversation_id:
                conversations[i] = json.loads(conversation.model_dump_json())
                break
        else:
            conversations.append(json.loads(conversation.model_dump_json()))
        data["conversations"] = conversations
        self._write_all(data)

    def create(self, title: str) -> Conversation:
        conversation = Conversation(conversation_id=str(uuid.uuid4()), title=title, turns=[])
        self.save(conversation)
        return conversation


_store_instance: Optional[ConversationStore] = None


def get_conversation_store() -> ConversationStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = JsonConversationStore()
    return _store_instance
