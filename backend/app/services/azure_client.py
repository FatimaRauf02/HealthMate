"""
Thin wrapper around the Azure AI Agents SDK.

This module owns the single AgentsClient used by the whole app and
exposes helpers to create agents, run threads, and retrieve responses,
so that individual agent modules don't repeat SDK boilerplate.

Real SDK objects used (NOT mocked):
    azure.ai.agents.AgentsClient
    azure.identity.DefaultAzureCredential

NOTE on SDK version: azure-ai-agents==1.0.0b3 exposes create_agent,
threads, messages, and runs directly on a standalone AgentsClient
(from azure.ai.agents import AgentsClient) constructed with
endpoint+credential. Going through AIProjectClient(...).agents in this
version returns a slimmer AgentsOperations object WITHOUT create_agent,
so we bypass AIProjectClient entirely and talk to AgentsClient directly.
If you upgrade azure-ai-agents later, re-verify with:
    python -c "from azure.ai.agents import AgentsClient; print([m for m in dir(AgentsClient) if not m.startswith('_')])"
"""

from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from typing import Optional

from azure.identity import DefaultAzureCredential
from azure.ai.agents import AgentsClient
from azure.ai.agents.models import MessageRole

from app.config import get_settings

logger = logging.getLogger("healthmate.azure_client")


class AzureAgentClient:
    """
    Owns the AgentsClient connection and provides create/run/cleanup
    helpers for Azure AI Agents. One instance is shared across the app
    (see get_azure_agent_client()).
    """

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.azure_project_connection_string:
            raise RuntimeError(
                "AZURE_PROJECT_CONNECTION_STRING is not set. "
                "Set it in your .env file to your Azure AI Foundry project endpoint."
            )

        # DefaultAzureCredential supports: az login (local dev), Managed Identity
        # (App Service/Container Apps), and environment-variable service principals.
        self._credential = DefaultAzureCredential()
        self.agents_client = AgentsClient(
            endpoint=settings.azure_project_connection_string,
            credential=self._credential,
        )
        self.model_deployment = settings.azure_openai_model
        self._agent_cache: dict[str, str] = {}  # agent_key -> agent_id

    def get_or_create_agent(self, agent_key: str, name: str, instructions: str, tools: Optional[list] = None):
        """
        Create an Azure AI Agent once per process and cache its id.
        Reusing the same agent_id avoids re-creating agents on every request.
        """
        if agent_key in self._agent_cache:
            return self._agent_cache[agent_key]

        agent = self.agents_client.create_agent(
            model=self.model_deployment,
            name=name,
            instructions=instructions,
            tools=tools or [],
        )
        self._agent_cache[agent_key] = agent.id
        logger.info("Created Azure AI Agent '%s' (id=%s)", name, agent.id)
        return agent.id

    async def run_agent(self, agent_key: str, name: str, instructions: str, user_prompt: str,
                         tools: Optional[list] = None) -> str:
        """
        Run one turn against a dedicated agent+thread and return the assistant's
        final text output. Each call creates a fresh thread so agents stay
        stateless per orchestration request (mirrors the "separate thread
        handling" requirement).
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, self._run_agent_sync, agent_key, name, instructions, user_prompt, tools
        )

    def _run_agent_sync(self, agent_key: str, name: str, instructions: str, user_prompt: str,
                         tools: Optional[list]) -> str:
        agent_id = self.get_or_create_agent(agent_key, name, instructions, tools)

        thread = self.agents_client.threads.create()
        self.agents_client.messages.create(
            thread_id=thread.id,
            role=MessageRole.USER,
            content=user_prompt,
        )

        run = self.agents_client.runs.create_and_process(
            thread_id=thread.id,
            agent_id=agent_id,
        )

        if run.status == "failed":
            logger.error("Agent run failed for %s: %s", name, run.last_error)
            raise RuntimeError(f"Agent '{name}' run failed: {run.last_error}")

        messages = self.agents_client.messages.list(thread_id=thread.id)
        for message in messages:
            if message.role == MessageRole.AGENT and message.text_messages:
                return message.text_messages[-1].text.value

        return ""

    def close(self) -> None:
        try:
            self.agents_client.close()
        except Exception:  # pragma: no cover
            logger.warning("Error closing AgentsClient", exc_info=True)


@lru_cache
def get_azure_agent_client() -> AzureAgentClient:
    """Singleton accessor used via FastAPI dependency injection."""
    return AzureAgentClient()
