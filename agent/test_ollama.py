"""
Standalone validation script for local Ollama LLM.
Runs without third-party dependencies using standard library urllib.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Add parent directory to path so config can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from agent.config import OLLAMA_BASE_URL, OLLAMA_MODEL, get_generate_url, get_tags_url
except ImportError:
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    get_generate_url = lambda: f"{OLLAMA_BASE_URL}/api/generate"
    get_tags_url = lambda: f"{OLLAMA_BASE_URL}/api/tags"


def check_ollama_reachable() -> bool:
    """Verifies that the local Ollama daemon is running and reachable."""
    try:
        req = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/tags", headers={"User-Agent": "agent-test"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[ERROR] Cannot connect to Ollama at {OLLAMA_BASE_URL}: {e}")
        return False


def list_local_models() -> list:
    """Returns list of models installed locally in Ollama."""
    try:
        req = urllib.request.Request(get_tags_url(), headers={"User-Agent": "agent-test"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("models", [])
    except Exception as e:
        print(f"[ERROR] Failed to fetch installed models: {e}")
        return []


def query_ollama(prompt: str, model: str = None) -> dict:
    """Sends a generate request to Ollama and returns the parsed JSON response."""
    target_model = model or OLLAMA_MODEL
    url = get_generate_url()
    payload = {
        "model": target_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
        }
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "agent-test"},
        method="POST"
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            elapsed = time.time() - start_time
            result = json.loads(resp.read().decode("utf-8"))
            result["_elapsed_seconds"] = round(elapsed, 2)
            return result
    except Exception as e:
        return {"error": str(e), "_elapsed_seconds": round(time.time() - start_time, 2)}


def run_tests():
    print("=" * 60)
    print(f"Ollama Local LLM Connectivity Test")
    print(f"Target Base URL: {OLLAMA_BASE_URL}")
    print(f"Target Model:    {OLLAMA_MODEL}")
    print("=" * 60)

    # 1. Connectivity Check
    print("\n[1/4] Checking Ollama server reachability...")
    if not check_ollama_reachable():
        print("[-] Ollama is NOT reachable. Please ensure Ollama is running.")
        sys.exit(1)
    print("[+] Ollama daemon is reachable on " + OLLAMA_BASE_URL)

    # 2. Model List Check
    print("\n[2/4] Inspecting local models...")
    models = list_local_models()
    model_names = [m.get("name") for m in models]
    print(f"[+] Found {len(models)} local model(s): {model_names}")

    exact_or_matched = any(OLLAMA_MODEL in m for m in model_names)
    if not exact_or_matched:
        print(f"[!] Target model '{OLLAMA_MODEL}' not found in installed models.")
        print(f"    Run: ollama pull {OLLAMA_MODEL}")
        sys.exit(2)
    print(f"[+] Target model '{OLLAMA_MODEL}' is installed and ready.")

    # 3. Test Prompts
    test_prompts = [
        "Who are you?",
        "Explain REST APIs in one sentence.",
        "Say hello to Ayush."
    ]

    print("\n[3/4] Running inference tests...")
    all_passed = True
    for idx, prompt in enumerate(test_prompts, start=1):
        print(f"\n--- Test Prompt {idx}: '{prompt}' ---")
        res = query_ollama(prompt)
        if "error" in res:
            print(f"[-] Inference failed: {res['error']}")
            all_passed = False
        else:
            response_text = res.get("response", "").strip()
            elapsed = res.get("_elapsed_seconds")
            print(f"[+] Response ({elapsed}s):\n{response_text}")

    # 4. Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("[SUCCESS] All local Ollama inference tests passed successfully!")
    else:
        print("[FAILURE] One or more tests failed.")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
