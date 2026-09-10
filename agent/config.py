"""
Configuration module for the local AI Agent.
Connects strictly to local Ollama inference without external or paid APIs.
"""

import os
from typing import Dict, Any

# Ollama local environment configuration
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
OLLAMA_REQUEST_TIMEOUT: int = int(os.getenv("OLLAMA_REQUEST_TIMEOUT", "120"))

# Generation defaults
DEFAULT_TEMPERATURE: float = float(os.getenv("DEFAULT_TEMPERATURE", "0.7"))
DEFAULT_TOP_P: float = float(os.getenv("DEFAULT_TOP_P", "0.9"))


def get_config() -> Dict[str, Any]:
    """Returns the active configuration dictionary."""
    return {
        "base_url": OLLAMA_BASE_URL,
        "model": OLLAMA_MODEL,
        "request_timeout": OLLAMA_REQUEST_TIMEOUT,
        "temperature": DEFAULT_TEMPERATURE,
        "top_p": DEFAULT_TOP_P,
    }


def get_generate_url() -> str:
    """Returns the Ollama generate API endpoint."""
    return f"{OLLAMA_BASE_URL}/api/generate"


def get_chat_url() -> str:
    """Returns the Ollama chat API endpoint."""
    return f"{OLLAMA_BASE_URL}/api/chat"


def get_tags_url() -> str:
    """Returns the Ollama tags (installed models) API endpoint."""
    return f"{OLLAMA_BASE_URL}/api/tags"
