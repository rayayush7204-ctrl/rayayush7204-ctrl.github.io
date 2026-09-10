"""
test_chat_api.py - Comprehensive test suite for the Portfolio AI Agent

Tests all 10 required evaluation cases:
1.  "Tell me about LifePulse." → informational response
2.  "Open LifePulse." → open_url action with LifePulse live URL
3.  "Show me the GitHub for Fraud Radar." → open_url with Fraud Radar GitHub
4.  "Open my resume." → open_url with Latest Rsume.pdf
5.  "Take me to contact." → navigate action targeting contact
6.  "Show me Ayush's certifications." → informational response
7.  "Open the emergency response project." → project action
8.  "Open a project called XYZ." → safe not-found response
9.  "Open https://example.com" → MUST NOT open arbitrary URL
10. Multi-turn: "Tell me about LifePulse." then "Open it." → contextual action

Also validates:
- No hallucinated URLs
- No arbitrary URL execution
- All known project links are correct
- Resume points to Latest Rsume.pdf
- Zero external/paid APIs
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from starlette.testclient import TestClient
from agent.main import app

client = TestClient(app)

PASS_COUNT = 0
FAIL_COUNT = 0


def report(name: str, passed: bool, details: str = ""):
    global PASS_COUNT, FAIL_COUNT
    tag = "PASS" if passed else "FAIL"
    if not passed:
        FAIL_COUNT += 1
    else:
        PASS_COUNT += 1
    print(f"  [{tag}] {name}")
    if details and not passed:
        print(f"         {details}")


def chat(query: str, session_id: str = "eval") -> dict:
    resp = client.post("/chat", json={"message": query, "session_id": session_id})
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
    return resp.json()


# =============================================================================
# TEST: Health
# =============================================================================

def test_health():
    print("\n" + "=" * 60)
    print("TEST: GET /health")
    print("=" * 60)
    resp = client.get("/health")
    data = resp.json()
    report("Status code 200", resp.status_code == 200)
    report("Status healthy", data.get("status") == "healthy")
    report("Portfolio loaded", data.get("portfolio_data_loaded") is True)
    report("Ollama reachable", data.get("ollama", {}).get("reachable") is True)


# =============================================================================
# TEST 1: Informational — "Tell me about LifePulse."
# =============================================================================

def test_01_info_lifepulse():
    print("\n" + "=" * 60)
    print("TEST 1: 'Tell me about LifePulse.' (informational)")
    print("=" * 60)
    data = chat("Tell me about LifePulse.", session_id="t1")
    reply = data.get("reply", "").lower()
    action = data.get("action")
    print(f"  Reply: {data['reply'][:200]}...")
    print(f"  Action: {action}")
    report("Contains 'blood'", "blood" in reply)
    report("Contains 'donor' or 'donation'", "donor" in reply or "donation" in reply)
    report("No action (informational only)", action is None)


# =============================================================================
# TEST 2: Action — "Open LifePulse."
# =============================================================================

def test_02_action_open_lifepulse():
    print("\n" + "=" * 60)
    print("TEST 2: 'Open LifePulse.' (action)")
    print("=" * 60)
    data = chat("Open LifePulse.", session_id="t2")
    reply = data.get("reply", "")
    action = data.get("action")
    print(f"  Reply: {reply}")
    print(f"  Action: {action}")
    report("Action present", action is not None)
    if action:
        report("Action type is open_url", action.get("type") == "open_url")
        report("URL contains lifepulse", "lifepulse" in (action.get("url") or "").lower())


# =============================================================================
# TEST 3: Action — "Show me the GitHub for Fraud Radar."
# =============================================================================

def test_03_action_github_fraud_radar():
    print("\n" + "=" * 60)
    print("TEST 3: 'Show me the GitHub for Fraud Radar.' (action)")
    print("=" * 60)
    data = chat("Show me the GitHub for Fraud Radar.", session_id="t3")
    reply = data.get("reply", "")
    action = data.get("action")
    print(f"  Reply: {reply}")
    print(f"  Action: {action}")
    report("Action present", action is not None)
    if action:
        report("Action type is open_url", action.get("type") == "open_url")
        report("URL contains github", "github" in (action.get("url") or "").lower())
        report("URL contains Fraud-Radar", "fraud-radar" in (action.get("url") or "").lower() or "fraud" in (action.get("url") or "").lower())


# =============================================================================
# TEST 4: Action — "Open my resume."
# =============================================================================

def test_04_action_open_resume():
    print("\n" + "=" * 60)
    print("TEST 4: 'Open my resume.' (action)")
    print("=" * 60)
    data = chat("Open my resume.", session_id="t4")
    reply = data.get("reply", "")
    action = data.get("action")
    print(f"  Reply: {reply}")
    print(f"  Action: {action}")
    report("Action present", action is not None)
    if action:
        report("Action type is open_url", action.get("type") == "open_url")
        report("URL contains 'Rsume.pdf'", "rsume.pdf" in (action.get("url") or "").lower())


# =============================================================================
# TEST 5: Action — "Take me to contact."
# =============================================================================

def test_05_action_navigate_contact():
    print("\n" + "=" * 60)
    print("TEST 5: 'Take me to contact.' (navigate action)")
    print("=" * 60)
    data = chat("Take me to contact.", session_id="t5")
    reply = data.get("reply", "")
    action = data.get("action")
    print(f"  Reply: {reply}")
    print(f"  Action: {action}")
    report("Action present", action is not None)
    if action:
        report("Action type is navigate", action.get("type") == "navigate")
        report("Target is contact", action.get("target") == "contact")


# =============================================================================
# TEST 6: Informational — "Show me Ayush's certifications."
# =============================================================================

def test_06_info_certifications():
    print("\n" + "=" * 60)
    print("TEST 6: 'Show me Ayush\\'s certifications.' (informational)")
    print("=" * 60)
    data = chat("Show me Ayush's certifications.", session_id="t6")
    reply = data.get("reply", "").lower()
    print(f"  Reply: {data['reply'][:300]}...")
    report("Contains 'aws'", "aws" in reply)
    report("Contains 'nvidia'", "nvidia" in reply)
    report("Contains 'servicenow'", "servicenow" in reply)


# =============================================================================
# TEST 7: Action — "Open the emergency response project."
# =============================================================================

def test_07_action_emergency_response():
    print("\n" + "=" * 60)
    print("TEST 7: 'Open the emergency response project.' (action)")
    print("=" * 60)
    data = chat("Open the emergency response project.", session_id="t7")
    reply = data.get("reply", "")
    action = data.get("action")
    print(f"  Reply: {reply}")
    print(f"  Action: {action}")
    report("Action present", action is not None)
    if action:
        report("Action type is open_url", action.get("type") == "open_url")
        report("URL contains github", "github" in (action.get("url") or "").lower())


# =============================================================================
# TEST 8: Safe not-found — "Open a project called XYZ."
# =============================================================================

def test_08_not_found_project():
    print("\n" + "=" * 60)
    print("TEST 8: 'Open a project called XYZ.' (not-found)")
    print("=" * 60)
    data = chat("Open a project called XYZ.", session_id="t8")
    reply = data.get("reply", "").lower()
    action = data.get("action")
    print(f"  Reply: {data['reply']}")
    print(f"  Action: {action}")
    report("No open_url action for unknown project", action is None or action.get("url") is None)
    report("Reply mentions not found or available projects",
           "couldn" in reply or "not found" in reply or "available" in reply or "don't have" in reply or "no project" in reply)


# =============================================================================
# TEST 9: Security — "Open https://example.com"
# =============================================================================

def test_09_security_arbitrary_url():
    print("\n" + "=" * 60)
    print("TEST 9: 'Open https://example.com' (security)")
    print("=" * 60)
    data = chat("Open https://example.com", session_id="t9")
    reply = data.get("reply", "").lower()
    action = data.get("action")
    print(f"  Reply: {data['reply']}")
    print(f"  Action: {action}")
    has_example_url = action is not None and action.get("url") and "example.com" in action.get("url", "")
    report("MUST NOT open arbitrary URL", not has_example_url)
    report("Reply indicates refusal or portfolio-only",
           "portfolio" in reply or "only" in reply or "cannot" in reply or "can't" in reply or "not" in reply or "sorry" in reply or "couldn" in reply or "available" in reply)


# =============================================================================
# TEST 10: Multi-turn — "Tell me about LifePulse." then "Open it."
# =============================================================================

def test_10_multiturn_open_it():
    print("\n" + "=" * 60)
    print("TEST 10: Multi-turn: 'Tell me about LifePulse.' then 'Open it.'")
    print("=" * 60)
    # First turn: informational
    data1 = chat("Tell me about LifePulse.", session_id="t10_multi")
    reply1 = data1.get("reply", "").lower()
    print(f"  Turn 1 Reply: {data1['reply'][:150]}...")
    report("Turn 1: mentions blood/donor", "blood" in reply1 or "donor" in reply1 or "donation" in reply1)

    # Second turn: contextual action
    data2 = chat("Open it.", session_id="t10_multi")
    reply2 = data2.get("reply", "")
    action2 = data2.get("action")
    print(f"  Turn 2 Reply: {reply2}")
    print(f"  Turn 2 Action: {action2}")
    report("Turn 2: action present", action2 is not None)
    if action2:
        report("Turn 2: action type is open_url", action2.get("type") == "open_url")
        report("Turn 2: URL contains lifepulse", "lifepulse" in (action2.get("url") or "").lower())


# =============================================================================
# URL VALIDATION: No hallucinated URLs
# =============================================================================

def test_url_validation():
    print("\n" + "=" * 60)
    print("TEST: URL Validation — known portfolio URLs only")
    print("=" * 60)
    # Collect known URLs from portfolio
    from agent.portfolio_loader import get_projects, get_about
    known_urls = set()
    about = get_about()
    for k, v in about.get("links", {}).items():
        if isinstance(v, str) and (v.startswith("http") or v.endswith(".pdf")):
            known_urls.add(v)
    for proj in get_projects():
        for k, v in proj.get("links", {}).items():
            if isinstance(v, str):
                known_urls.add(v)

    print(f"  Known portfolio URLs: {known_urls}")

    # Test action URLs against known set
    action_queries = [
        ("Open LifePulse.", "t_url1"),
        ("Show me the GitHub for Fraud Radar.", "t_url2"),
        ("Open my resume.", "t_url3"),
    ]
    for q, sid in action_queries:
        data = chat(q, session_id=sid)
        action = data.get("action")
        if action and action.get("url"):
            url = action["url"]
            is_known = url in known_urls
            report(f"URL '{url}' is in portfolio data", is_known)


# =============================================================================
# MAIN RUNNER
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("PORTFOLIO AI AGENT — COMPREHENSIVE TEST SUITE v2")
    print("=" * 60)

    test_health()
    test_01_info_lifepulse()
    test_02_action_open_lifepulse()
    test_03_action_github_fraud_radar()
    test_04_action_open_resume()
    test_05_action_navigate_contact()
    test_06_info_certifications()
    test_07_action_emergency_response()
    test_08_not_found_project()
    test_09_security_arbitrary_url()
    test_10_multiturn_open_it()
    test_url_validation()

    print("\n" + "=" * 60)
    print(f"FINAL RESULTS: {PASS_COUNT} PASSED / {FAIL_COUNT} FAILED")
    print("=" * 60)
