"""
Centralized application configuration.

All Azure and app-level settings are loaded from environment variables
(via a local .env file in development). Never hardcode secrets here.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly typed application settings, loaded from environment/.env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Azure AI Foundry project ---
    azure_project_connection_string: str = ""

    # --- Azure OpenAI ---
    azure_openai_endpoint: str = ""
    azure_openai_key: str = ""
    azure_openai_model: str = "gpt-4.1-mini"
    azure_openai_api_version: str = "2024-08-01-preview"

    # --- Optional: Azure AI Search ---
    azure_ai_search_endpoint: str = ""
    azure_ai_search_key: str = ""
    azure_ai_search_index: str = ""

    # --- Optional: Azure Blob Storage ---
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "medical-reports"

    # --- Optional: Azure Document Intelligence ---
    azure_doc_intelligence_endpoint: str = ""
    azure_doc_intelligence_key: str = ""

    # --- App-level ---
    app_env: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:5173"
    conversation_store_path: str = "./data/conversations.json"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (loaded once per process)."""
    return Settings()
