"""
graph.py - LangGraph Tool-Using Agent for Ayush Kumar Ray's Portfolio

Architecture:
  START → agent_node → (should_continue?) → tool_node → agent_node → ... → END

Single agent using native tool calling with qwen2.5:3b via Ollama.
Strictly grounded in portfolio data from js/portfolio-data.js.
Supports session memory via MemorySaver for multi-turn conversations.

Action tools return structured payloads (open_url / navigate) that the
future frontend will execute. The backend never performs browser actions.
"""

import sys
import json
from pathlib import Path
from typing import Optional, Dict, Any, List, Literal

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from langchain_core.messages import (
    SystemMessage, HumanMessage, AIMessage, ToolMessage, BaseMessage
)
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END, MessagesState
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode

from agent.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_REQUEST_TIMEOUT
from agent.portfolio_loader import build_grounded_context
from agent.tools import ALL_TOOLS, TOOL_MAP


def create_system_prompt() -> str:
    """
    Constructs the system prompt with strict grounding instructions,
    tool usage guidance, and real-time context from js/portfolio-data.js.
    """
    grounded_context = build_grounded_context()

    return f"""You are the official, professional AI Assistant for Ayush Kumar Ray's portfolio.
Your role is to represent Ayush accurately and assist recruiters, collaborators, and visitors.

You have access to portfolio tools. Use them to answer questions and perform actions.

=== TOOL USAGE RULES ===
1. For INFORMATION requests (who is Ayush, what skills, tell me about a project, etc.):
   Call the appropriate read-only tool (get_about, get_projects, get_project, get_skills, get_certifications, get_education, get_achievements) to retrieve accurate data, then compose your answer based on the tool result.

2. For ACTION requests (open a project, show GitHub, open resume, go to contact, etc.):
   Call the appropriate action tool (open_project, open_github, open_live_demo, open_resume, go_to_contact, go_to_about, go_to_works, go_to_certifications).
   The tool will return a JSON with "response" and "action" fields. Relay the "response" text back to the user.

3. For FOLLOW-UP requests like "open it" or "show me" after discussing a project:
   Use the conversation context to determine which project was discussed, then call the appropriate action tool with that project name.

4. SECURITY: NEVER open arbitrary URLs. Only use URLs that come from the portfolio tools. If a user asks to open an external URL like "open https://example.com", refuse politely and explain you can only open portfolio-related links.

=== VERIFIED PORTFOLIO DATA (SINGLE SOURCE OF TRUTH) ===
{grounded_context}
=========================================================

CRITICAL GROUNDING RULES:
1. ALWAYS base your answers strictly on the portfolio data and tool results.
2. IDENTITY: Ayush Kumar Ray is a Software Engineer and B.Tech CSE student at Parul University (2023-2027).
3. UNKNOWN OR UNRELATED CLAIMS: If asked about things not in the portfolio (e.g. film critic), explicitly state the portfolio contains NO such information. NEVER fabricate.
4. HONESTY: If details are unavailable, say so politely.
5. CERTIFICATIONS: Always include the issuing organization (NVIDIA, AWS, ServiceNow, IBM, Smart Interviews).
6. STYLE: Be concise, clear, structured, and professional.
"""


def create_llm():
    """Returns a ChatOllama instance configured with local model and bound to tools."""
    return ChatOllama(
        model=OLLAMA_MODEL,
        base_url=OLLAMA_BASE_URL,
        timeout=OLLAMA_REQUEST_TIMEOUT,
        temperature=0.1,
    )


# =============================================================================
# GRAPH NODES
# =============================================================================

def agent_node(state: MessagesState) -> Dict[str, Any]:
    """
    The agent node: invokes the LLM (with tools bound) given the current messages.
    The LLM decides whether to respond directly or call a tool.
    """
    llm = create_llm()
    llm_with_tools = llm.bind_tools(ALL_TOOLS)
    system_prompt = create_system_prompt()

    # Prepend system prompt to conversation
    messages = [SystemMessage(content=system_prompt)] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


# Prebuilt ToolNode handles executing tools and returning ToolMessages
tool_node = ToolNode(ALL_TOOLS)


def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    """
    Routing function: if the last message has tool_calls, route to the tool node.
    Otherwise, route to END.
    """
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "__end__"


# =============================================================================
# BUILD THE GRAPH
# =============================================================================

workflow = StateGraph(MessagesState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)

# Entry point
workflow.add_edge(START, "agent")

# After agent: conditionally go to tools or end
workflow.add_conditional_edges("agent", should_continue)

# After tools: always go back to agent for final response
workflow.add_edge("tools", "agent")

# Compile with memory checkpointer
memory_checkpointer = MemorySaver()
agent_graph = workflow.compile(checkpointer=memory_checkpointer)


# =============================================================================
# PUBLIC API
# =============================================================================

def _extract_action_from_messages(messages: List[BaseMessage]) -> Optional[Dict[str, Any]]:
    """
    Scans tool messages in the conversation for structured action payloads.
    Returns the last action found, or None.
    """
    action = None
    for msg in messages:
        if isinstance(msg, ToolMessage):
            try:
                data = json.loads(msg.content)
                if isinstance(data, dict) and data.get("action"):
                    action = data["action"]
            except (json.JSONDecodeError, TypeError):
                pass
    return action


def run_agent(message: str, session_id: Optional[str] = "default") -> Dict[str, Any]:
    """
    Executes the agent workflow with the given user message and session id.

    Returns:
        {
            "reply": str,           # The agent's textual response
            "action": dict | None,  # Structured action for frontend (open_url, navigate, etc.)
            "session_id": str,
            "model": str
        }
    """
    sid = session_id or "default"
    config = {"configurable": {"thread_id": sid}}
    input_state = {"messages": [HumanMessage(content=message)]}

    output_state = agent_graph.invoke(input_state, config=config)
    messages = output_state.get("messages", [])

    # Extract the final AI reply
    reply = "No response generated."
    if messages:
        last_msg = messages[-1]
        reply = str(last_msg.content) if last_msg.content else ""

    # Extract structured action from tool messages
    action = _extract_action_from_messages(messages)

    # If the reply is empty but we have an action, build a reply from the action
    if not reply.strip() and action:
        tool_messages = [m for m in messages if isinstance(m, ToolMessage)]
        for tm in reversed(tool_messages):
            try:
                data = json.loads(tm.content)
                if isinstance(data, dict) and data.get("response"):
                    reply = data["response"]
                    break
            except (json.JSONDecodeError, TypeError):
                pass

    return {
        "reply": reply,
        "action": action,
        "session_id": sid,
        "model": OLLAMA_MODEL,
    }


if __name__ == "__main__":
    print("Testing LangGraph tool-using agent with Ollama...")

    tests = [
        ("Who is Ayush Kumar Ray?", "info_test"),
        ("Open LifePulse.", "action_test"),
        ("Who is Ayush Kumar Ray the film critic?", "grounding_test"),
    ]

    for q, sid in tests:
        print(f"\nUser: {q}")
        result = run_agent(q, session_id=sid)
        print(f"Reply: {result['reply']}")
        print(f"Action: {result['action']}")
        print("-" * 40)
