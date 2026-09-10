"""
main.py - FastAPI Application for Ayush Kumar Ray's Portfolio AI Agent

Exposes:
- GET  /health: Health check verifying Ollama connection & portfolio loader.
- POST /chat: Tool-using agent powered by LangGraph + local Ollama (qwen2.5:3b).

Returns structured responses with optional action payloads for the frontend.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import requests
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agent.config import OLLAMA_BASE_URL, OLLAMA_MODEL, get_tags_url
from agent.portfolio_loader import get_about, get_portfolio_data
from agent.graph import run_agent

# Initialize FastAPI app
app = FastAPI(
    title="Ayush Kumar Ray - Portfolio AI Agent",
    description="Local AI Agent powered by LangGraph and Ollama (qwen2.5:3b), grounded in portfolio-data.js.",
    version="2.0.0"
)

# Enable CORS for local testing and future UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# REQUEST / RESPONSE MODELS
# =============================================================================

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User query or message.")
    session_id: Optional[str] = Field("default", description="Conversation session/thread identifier.")


class ActionPayload(BaseModel):
    type: str = Field(..., description="Action type: 'open_url' or 'navigate'.")
    url: Optional[str] = Field(None, description="URL to open (for open_url actions).")
    target: Optional[str] = Field(None, description="Navigation target (for navigate actions).")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Grounded response from the agent.")
    action: Optional[ActionPayload] = Field(None, description="Structured action for the frontend to execute.")
    session_id: str = Field(..., description="Session identifier.")
    model: str = Field(..., description="Active local LLM model name.")
    status: str = Field("success", description="Response status.")


# =============================================================================
# HELPERS
# =============================================================================

def check_ollama_status() -> Dict[str, Any]:
    """Checks if the local Ollama daemon is reachable and model is available."""
    try:
        resp = requests.get(get_tags_url(), timeout=3)
        if resp.status_code == 200:
            models_data = resp.json()
            models_list = [m.get("name") for m in models_data.get("models", [])]
            has_model = any(OLLAMA_MODEL in m for m in models_list)
            return {
                "reachable": True,
                "model_available": has_model,
                "installed_models": models_list
            }
        return {"reachable": False, "model_available": False, "error": f"Status code {resp.status_code}"}
    except Exception as exc:
        return {"reachable": False, "model_available": False, "error": str(exc)}


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
def root():
    """Root endpoint welcoming visitors."""
    return {
        "agent": "Ayush Kumar Ray Portfolio AI Agent",
        "model": OLLAMA_MODEL,
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "chat": "POST /chat"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint validating Ollama connectivity and portfolio data."""
    ollama_info = check_ollama_status()
    try:
        about = get_about()
        portfolio_loaded = bool(about and about.get("name"))
    except Exception:
        portfolio_loaded = False

    is_healthy = ollama_info.get("reachable") and portfolio_loaded

    return {
        "status": "healthy" if is_healthy else "degraded",
        "model": OLLAMA_MODEL,
        "ollama": ollama_info,
        "portfolio_data_loaded": portfolio_loaded
    }


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):
    """
    POST /chat:
    Receives user message, runs the LangGraph tool-using workflow grounded
    in portfolio-data.js, and returns the response with optional action payload.
    """
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    # Verify Ollama connectivity prior to processing
    ollama_info = check_ollama_status()
    if not ollama_info.get("reachable"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local Ollama service unreachable at {OLLAMA_BASE_URL}. Ensure Ollama is running."
        )

    try:
        result = run_agent(user_msg, session_id=payload.session_id)

        # Build action payload if present
        action_payload = None
        raw_action = result.get("action")
        if raw_action and isinstance(raw_action, dict):
            action_payload = ActionPayload(
                type=raw_action.get("type", "unknown"),
                url=raw_action.get("url"),
                target=raw_action.get("target"),
            )

        return ChatResponse(
            reply=result.get("reply", "No response generated."),
            action=action_payload,
            session_id=result.get("session_id", payload.session_id or "default"),
            model=result.get("model", OLLAMA_MODEL),
            status="success"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow execution failed: {str(exc)}"
        )


if __name__ == "__main__":
    import uvicorn
    print(f"Starting Portfolio AI Agent server on http://127.0.0.1:8000 (Model: {OLLAMA_MODEL})...")
    uvicorn.run("agent.main:app", host="127.0.0.1", port=8000, reload=False)
