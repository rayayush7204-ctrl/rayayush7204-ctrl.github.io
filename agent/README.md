# Local AI Agent Foundation (Ollama + Qwen 2.5)

This module forms the **local LLM foundation** for Ayush Kumar Ray's portfolio AI agent. It operates strictly locally with **zero paid external APIs**, **no cloud dependencies**, and **no API keys required**.

---

## 1. Prerequisites & Hardware Requirements

- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Python:** Python 3.10+ (tested with Python 3.14.6)
- **GPU (Recommended):** NVIDIA GPU with 4GB+ VRAM (e.g., RTX 3050 Laptop GPU or higher) for accelerated inference.
- **RAM:** 8GB minimum (16GB recommended if running on CPU or low-VRAM configurations).
- **Disk Space:** ~5GB free disk space for the `qwen2.5:7b` model weights.

---

## 2. Installing Ollama on Windows

### Option A: Via winget (Command Line)
Open PowerShell and run:
```powershell
winget install --id Ollama.Ollama --exact
```

### Option B: Official Manual Installer
1. Download `OllamaSetup.exe` from [https://ollama.com/download](https://ollama.com/download).
2. Run the installer and follow the on-screen instructions.
3. Once completed, Ollama will run in the Windows system tray and listen on port `11434`.

---

## 3. Starting Ollama

If Ollama is not already running in the background/system tray:

```powershell
ollama serve
```

Verify that the local daemon is reachable by visiting or pinging:
```powershell
curl http://localhost:11434/api/tags
```
Expected response: `{"models": [...]}`

---

## 4. Downloading the Model

Pull the Qwen 2.5 7B model:

```powershell
ollama pull qwen2.5:7b
```

To list all models currently installed locally:
```powershell
ollama list
```

---

## 5. Running and Verifying the Model

### A. Quick CLI Test
```powershell
ollama run qwen2.5:7b "Say hello to Ayush."
```

### B. Python Automated Verification Script
Run the included standalone verification script (requires only Python standard library):

```powershell
python agent/test_ollama.py
```

The script runs three standard baseline validation prompts:
1. `"Who are you?"`
2. `"Explain REST APIs in one sentence."`
3. `"Say hello to Ayush."`

---

## 6. Running the FastAPI + LangGraph Agent

### Architecture
```
js/portfolio-data.js (Single Source of Truth)
        ↓
agent/portfolio_loader.py (Read-Only Dynamic Loader)
        ↓
agent/graph.py (LangGraph StateGraph + MemorySaver)
        ↓
Local Ollama (`qwen2.5:3b` at http://localhost:11434)
        ↓
agent/main.py (FastAPI POST /chat & GET /health)
```

### Starting the Server
```powershell
python agent/main.py
```
Or via uvicorn directly:
```powershell
uvicorn agent.main:app --host 127.0.0.1 --port 8000
```

### Testing POST /chat
Run the automated test suite across all 8 portfolio queries:
```powershell
python agent/test_chat_api.py
```

Example `curl` test:
```powershell
curl.exe -X POST http://127.0.0.1:8000/chat `
  -H "Content-Type: application/json" `
  -d '{"message": "Who is Ayush Kumar Ray?", "session_id": "demo"}'
```

---

## 7. Configuration

Environment variables can be configured in `.env` or set in your environment:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama daemon local endpoint |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Name of the local Ollama model |
| `OLLAMA_REQUEST_TIMEOUT` | `120` | Request timeout in seconds |
| `DEFAULT_TEMPERATURE` | `0.1` | Sampling temperature |

---

## 8. Troubleshooting

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| `Cannot connect to Ollama at http://localhost:11434` | Ollama service is stopped | Launch Ollama from the Windows Start menu or run `ollama serve` in a terminal. |
| `model 'qwen2.5:3b' not found` | Model hasn't been pulled yet | Run `ollama pull qwen2.5:3b`. |
| Port 8000 in use | Another service is using port 8000 | Specify a custom port: `uvicorn agent.main:app --port 8001`. |

---

## 9. Privacy & Zero-Cost Guarantee

- **No external paid APIs** (No OpenAI, Anthropic, Gemini, or third-party LLM endpoints).
- **Zero API keys required.**
- All queries, grounding, and future agent interactions remain strictly on your local device.
