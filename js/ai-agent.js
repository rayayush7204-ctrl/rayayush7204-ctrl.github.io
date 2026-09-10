/**
 * ai-agent.js - Frontend Client & UI Controller for Ayush AI Assistant
 *
 * Responsibilities:
 * - Connects to local FastAPI backend (/chat, /health)
 * - Manages session_id across turns
 * - Executes verified portfolio actions (open_url, navigate)
 * - Strictly validates URLs against portfolio-data.js (Zero arbitrary URL execution)
 * - Safe DOM rendering (Zero eval, Zero new Function, Zero raw HTML injection)
 * - Preserves existing website visual identity
 */

(function () {
    "use strict";

    // 1. Configurable Backend URL
    const AI_AGENT_API = typeof window !== "undefined" ? (window.AI_AGENT_API || "http://127.0.0.1:8000") : "http://127.0.0.1:8000";

    // 2. Session Management
    const SESSION_STORAGE_KEY = "ayush_ai_session_id";
    function getOrCreateSessionId() {
        let sid = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SESSION_STORAGE_KEY) : null;
        if (!sid) {
            sid = "session_" + Math.random().toString(36).substring(2, 10);
            if (typeof sessionStorage !== "undefined") {
                sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
            }
        }
        return sid;
    }

    // 3. Known Safe Route Mappings
    const ROUTE_MAP = {
        home: "index.html",
        about: "about.html",
        works: "works.html",
        projects: "works.html",
        certifications: "certifications.html",
        contact: "contact.html"
    };

    // 4. Extract Safe URL Set dynamically from portfolio-data.js (window.portfolioData)
    function getSafePortfolioUrls() {
        const safeUrls = new Set();

        // Standard known relative documents
        safeUrls.add("Latest Rsume.pdf");
        safeUrls.add("./Latest Rsume.pdf");
        safeUrls.add("Latest Rresume.pdf");

        if (typeof window.portfolioData === "object" && window.portfolioData !== null) {
            const data = window.portfolioData;

            // Personal links
            if (data.personal) {
                if (data.personal.resumePdf) safeUrls.add(data.personal.resumePdf);
                if (data.personal.links) {
                    Object.values(data.personal.links).forEach(url => {
                        if (typeof url === "string" && url.trim()) safeUrls.add(url.trim());
                    });
                }
            }

            // Projects URLs
            if (Array.isArray(data.projects)) {
                data.projects.forEach(p => {
                    if (p.liveUrl) safeUrls.add(p.liveUrl.trim());
                    if (p.githubUrl) safeUrls.add(p.githubUrl.trim());
                });
            }

            // Certifications URLs
            if (Array.isArray(data.certifications)) {
                data.certifications.forEach(c => {
                    if (c.credentialUrl) safeUrls.add(c.credentialUrl.trim());
                });
            }
        }

        // Hardened fallback whitelist of Ayush's verified domains / URLs
        safeUrls.add("https://github.com/rayayush7204-ctrl");
        safeUrls.add("https://github.com/rayayush7204-ctrl/LifePulse-AI");
        safeUrls.add("https://lifepulse-ai-by-ayush-ray.vercel.app");
        safeUrls.add("https://lifepulse-ai-by-ayush-ray.vercel.app/");
        safeUrls.add("https://github.com/rayayush7204-ctrl/Fraud-Radar");
        safeUrls.add("https://anand-singh-git-hub-fraud-radar-appmain-b2fgwv.streamlit.app/");
        safeUrls.add("https://www.linkedin.com/in/ayush-kumar-ray-990399219/");

        return safeUrls;
    }

    // Normalize URL for strict matching
    function normalizeUrl(url) {
        if (!url) return "";
        let clean = url.trim();
        // Remove trailing slash for comparison
        if (clean.endsWith("/") && clean.length > 1 && !clean.endsWith("://")) {
            clean = clean.slice(0, -1);
        }
        return clean.toLowerCase();
    }

    function isSafePortfolioUrl(targetUrl) {
        if (!targetUrl || typeof targetUrl !== "string") return false;
        const normalizedTarget = normalizeUrl(targetUrl);
        const safeUrls = getSafePortfolioUrls();

        for (const safe of safeUrls) {
            if (normalizeUrl(safe) === normalizedTarget) {
                return true;
            }
        }

        // Check if it's the resume file
        if (normalizedTarget.includes("rsume.pdf") || normalizedTarget.includes("rresume.pdf")) {
            return true;
        }

        return false;
    }

    // 5. HTML Entity Sanitization & Safe Formatter
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatAssistantMessage(rawText) {
        if (!rawText) return "";
        let text = escapeHtml(rawText);

        // Bold formatting: **text** -> <strong>text</strong>
        text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Italic: *text* or _text_ -> <em>text</em>
        text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");

        // Safe Markdown links: [label](url)
        // Strictly validate protocol or local resume
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (match, label, url) {
            const cleanUrl = url.trim();
            // Block javascript: or unsafe schemes
            if (/^(https?:\/\/|mailto:|Latest Rsume\.pdf)/i.test(cleanUrl)) {
                return '<a href="' + cleanUrl + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
            }
            return label;
        });

        // Convert bullet lines
        const lines = text.split("\n");
        let inList = false;
        let htmlOut = "";

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^[-*•]\s+(.+)/.test(line)) {
                if (!inList) {
                    htmlOut += "<ul>";
                    inList = true;
                }
                htmlOut += "<li>" + line.replace(/^[-*•]\s+/, "") + "</li>";
            } else if (/^\d+\.\s+(.+)/.test(line)) {
                if (!inList) {
                    htmlOut += "<ol>";
                    inList = true;
                }
                htmlOut += "<li>" + line.replace(/^\d+\.\s+/, "") + "</li>";
            } else {
                if (inList) {
                    htmlOut += htmlOut.endsWith("</li>") ? "</ul>" : "</ol>";
                    inList = false;
                }
                if (line) {
                    htmlOut += "<p>" + line + "</p>";
                }
            }
        }
        if (inList) {
            htmlOut += "</ul>";
        }

        return htmlOut || "<p>" + text + "</p>";
    }

    // 6. Speech Text Sanitizer (Step 7)
    function cleanTextForSpeech(raw) {
        if (!raw || typeof raw !== "string") return "";
        let s = raw;

        // Convert markdown links: [Label](url) -> Label
        s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

        // Remove code blocks
        s = s.replace(/```[\s\S]*?```/g, "");

        // Remove inline code: `code` -> code
        s = s.replace(/`([^`]+)`/g, "$1");

        // Remove images: ![alt](url) -> ""
        s = s.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

        // Remove header markers: #, ##, ###
        s = s.replace(/^#+\s+/gm, "");

        // Remove bullet/number list markers at line starts FIRST (before italic asterisks)
        s = s.replace(/^[-*•]\s+/gm, "");
        s = s.replace(/^\d+\.\s+/gm, "");

        // Remove bold / italic markers: **text** -> text, *text* -> text
        s = s.replace(/(\*\*|__)(.*?)\1/g, "$2");
        s = s.replace(/(\*|_)(.*?)\1/g, "$2");

        // Remove raw URLs: https://... or http://...
        s = s.replace(/https?:\/\/[^\s]+/gi, "");

        // Remove decorative symbols / emojis that cause robotic pronunciations
        s = s.replace(/[✦★⭐🌞]/g, "");

        // Clean up multiple spaces, line breaks, and excessive punctuation
        s = s.replace(/\n+/g, " ");
        s = s.replace(/\s{2,}/g, " ");

        return s.trim();
    }

    // 7. Voice Output Controller (Step 7: Web Speech Synthesis)
    class VoiceOutputController {
        constructor() {
            this.isSupported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
            this.synth = this.isSupported ? window.speechSynthesis : null;
            this.currentUtterance = null;
            this.activeSpeakButton = null;
            this.voices = [];
            this.preferredVoice = null;

            // Natural conversational defaults
            this.settings = {
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
                lang: "en-US"
            };

            if (this.isSupported) {
                this.loadVoices();
                if (typeof this.synth.onvoiceschanged !== "undefined") {
                    this.synth.onvoiceschanged = () => this.loadVoices();
                }
            }
        }

        loadVoices() {
            if (!this.isSupported || !this.synth) return;
            try {
                this.voices = this.synth.getVoices() || [];
                // Preference:
                // 1. Natural/Online en-US voice (Google US English, Microsoft Jenny, Samantha)
                // 2. Any en-US voice
                // 3. Any English voice (en-*)
                // 4. Default browser voice
                this.preferredVoice =
                    this.voices.find(v => v.lang === "en-US" && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))) ||
                    this.voices.find(v => v.lang === "en-US") ||
                    this.voices.find(v => v.lang && v.lang.startsWith("en")) ||
                    this.voices.find(v => v.default) ||
                    this.voices[0] ||
                    null;
            } catch (e) {
                this.preferredVoice = null;
            }
        }

        isSpeaking() {
            return this.isSupported && this.synth ? this.synth.speaking : false;
        }

        stopSpeaking() {
            if (!this.isSupported || !this.synth) return;
            try {
                this.synth.cancel();
            } catch (e) {}
            this.currentUtterance = null;
            if (this.activeSpeakButton) {
                this.setButtonState(this.activeSpeakButton, "idle");
                this.activeSpeakButton = null;
            }
        }

        speak(rawText, sourceButton = null) {
            if (!this.isSupported || !this.synth) return false;

            const cleanText = cleanTextForSpeech(rawText);
            if (!cleanText) return false;

            // Stop any currently playing speech to prevent overlap
            this.stopSpeaking();

            try {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = this.settings.rate;
                utterance.pitch = this.settings.pitch;
                utterance.volume = this.settings.volume;
                utterance.lang = this.settings.lang;

                if (this.preferredVoice) {
                    utterance.voice = this.preferredVoice;
                }

                if (sourceButton) {
                    this.activeSpeakButton = sourceButton;
                    this.setButtonState(sourceButton, "speaking");
                }

                utterance.onstart = () => {
                    if (sourceButton) {
                        this.setButtonState(sourceButton, "speaking");
                    }
                };

                utterance.onend = () => {
                    this.currentUtterance = null;
                    if (sourceButton) {
                        this.setButtonState(sourceButton, "idle");
                    }
                    if (this.activeSpeakButton === sourceButton) {
                        this.activeSpeakButton = null;
                    }
                };

                utterance.onerror = () => {
                    this.currentUtterance = null;
                    if (sourceButton) {
                        this.setButtonState(sourceButton, "idle");
                    }
                    if (this.activeSpeakButton === sourceButton) {
                        this.activeSpeakButton = null;
                    }
                };

                this.currentUtterance = utterance;
                this.synth.speak(utterance);
                return true;
            } catch (err) {
                console.warn("[Voice Output Speak Error]", err);
                return false;
            }
        }

        setButtonState(btn, state) {
            if (!btn) return;
            const iconContainer = btn.querySelector(".ai-speak-icon");
            const labelContainer = btn.querySelector(".ai-speak-label");

            if (state === "speaking") {
                btn.classList.add("is-speaking");
                btn.setAttribute("aria-label", "Stop speech");
                btn.setAttribute("title", "Stop speaking");
                if (iconContainer) {
                    iconContainer.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>';
                }
                if (labelContainer) {
                    labelContainer.textContent = "Stop";
                }
            } else {
                btn.classList.remove("is-speaking");
                btn.setAttribute("aria-label", "Read message aloud");
                btn.setAttribute("title", "Listen to this response");
                if (iconContainer) {
                    iconContainer.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
                }
                if (labelContainer) {
                    labelContainer.textContent = "Listen";
                }
            }
        }
    }

    // 8. Quick Prompts List
    const QUICK_PROMPTS = [
        "Who is Ayush?",
        "Tell me about LifePulse",
        "What are Ayush's strongest backend skills?",
        "Show me the top projects",
        "How can I contact Ayush?"
    ];

    // 9. UI Controller Class
    class AIAssistantUI {
        constructor() {
            this.isOpen = false;
            this.isGenerating = false;
            this.isListening = false;
            this.isSpeechSupported = false;
            this.recognizedTranscript = "";
            this.sessionId = getOrCreateSessionId();
            this.voiceOutput = new VoiceOutputController();
            this.initDOM();
            this.initSpeechRecognition();
            this.bindEvents();
            this.checkBackendHealth();
        }

        initDOM() {
            // Trigger Button
            this.triggerBtn = document.createElement("button");
            this.triggerBtn.className = "ai-trigger-btn";
            this.triggerBtn.id = "aiTriggerBtn";
            this.triggerBtn.setAttribute("aria-label", "Open Ayush AI Assistant");
            this.triggerBtn.setAttribute("aria-expanded", "false");
            this.triggerBtn.innerHTML = '<span class="ai-sparkle">✦</span> Ask Ayush AI';
            document.body.appendChild(this.triggerBtn);

            // Panel Container
            this.panel = document.createElement("div");
            this.panel.className = "ai-panel";
            this.panel.id = "aiPanel";
            this.panel.setAttribute("role", "dialog");
            this.panel.setAttribute("aria-labelledby", "aiPanelTitle");

            this.panel.innerHTML = `
                <div class="ai-panel-header">
                    <div class="ai-panel-header-info">
                        <div class="ai-status-indicator" id="aiStatusIndicator" title="Ollama qwen2.5:3b Connected"></div>
                        <div>
                            <h3 class="ai-panel-title" id="aiPanelTitle">✦ Ayush AI</h3>
                            <p class="ai-panel-subtitle">Portfolio Intelligence · Local Ollama</p>
                        </div>
                    </div>
                    <button class="ai-panel-close-btn" id="aiCloseBtn" aria-label="Close chat panel">✕</button>
                </div>
                <div class="ai-messages-wrap" id="aiMessagesWrap">
                    <div class="ai-msg assistant">
                        <div class="ai-msg-bubble">
                            <p>Hi! I'm Ayush's portfolio assistant powered by local AI. Ask me about projects, backend skills, education, or let me open demos for you.</p>
                        </div>
                    </div>
                </div>
                <div class="ai-quick-prompts" id="aiQuickPrompts"></div>
                <form class="ai-input-form" id="aiInputForm">
                    <input type="text" class="ai-input-field" id="aiInputField" placeholder="Ask about projects, skills, contact..." autocomplete="off" />
                    <button type="button" class="ai-mic-btn" id="aiMicBtn" aria-label="Start voice input" title="Start voice input">
                        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                    </button>
                    <button type="submit" class="ai-send-btn" id="aiSendBtn" aria-label="Send Message">
                        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                    </button>
                </form>
            `;

            document.body.appendChild(this.panel);

            // Select child elements
            this.messagesWrap = this.panel.querySelector("#aiMessagesWrap");
            this.quickPromptsWrap = this.panel.querySelector("#aiQuickPrompts");
            this.inputForm = this.panel.querySelector("#aiInputForm");
            this.inputField = this.panel.querySelector("#aiInputField");
            this.micBtn = this.panel.querySelector("#aiMicBtn");
            this.sendBtn = this.panel.querySelector("#aiSendBtn");
            this.closeBtn = this.panel.querySelector("#aiCloseBtn");
            this.statusIndicator = this.panel.querySelector("#aiStatusIndicator");

            // Render Quick Prompts
            this.renderQuickPrompts();
        }

        renderQuickPrompts() {
            this.quickPromptsWrap.innerHTML = "";
            QUICK_PROMPTS.forEach(promptText => {
                const chip = document.createElement("button");
                chip.type = "button";
                chip.className = "ai-prompt-chip";
                chip.textContent = promptText;
                chip.addEventListener("click", () => {
                    this.inputField.value = promptText;
                    this.handleSubmit();
                });
                this.quickPromptsWrap.appendChild(chip);
            });
        }

        bindEvents() {
            // Toggle panel
            this.triggerBtn.addEventListener("click", () => this.togglePanel());
            this.closeBtn.addEventListener("click", () => this.closePanel());

            // Microphone button
            if (this.micBtn) {
                this.micBtn.addEventListener("click", () => this.toggleSpeech());
            }

            // Close on Escape key
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && this.isOpen) {
                    this.closePanel();
                }
            });

            // Submit message
            this.inputForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        togglePanel() {
            if (this.isOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        }

        openPanel() {
            this.isOpen = true;
            this.panel.classList.add("is-open");
            this.triggerBtn.classList.add("is-active");
            this.triggerBtn.setAttribute("aria-expanded", "true");
            setTimeout(() => this.inputField.focus(), 150);
            this.scrollToBottom();
        }

        closePanel() {
            if (this.isListening) {
                this.stopSpeech();
            }
            if (this.voiceOutput) {
                this.voiceOutput.stopSpeaking();
            }
            this.isOpen = false;
            this.panel.classList.remove("is-open");
            this.triggerBtn.classList.remove("is-active");
            this.triggerBtn.setAttribute("aria-expanded", "false");
            this.triggerBtn.focus();
        }

        // Voice Recognition (Step 6)
        initSpeechRecognition() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                this.isSpeechSupported = false;
                this.updateMicState("unsupported");
                return;
            }

            this.isSpeechSupported = true;
            try {
                this.recognition = new SpeechRec();
                this.recognition.lang = "en-US";
                this.recognition.interimResults = true;
                this.recognition.continuous = false;
                this.recognition.maxAlternatives = 1;

                this.recognition.onstart = () => {
                    this.isListening = true;
                    this.updateMicState("listening");
                    this.inputField.placeholder = "Listening... speak now";
                };

                this.recognition.onresult = (event) => {
                    let interim = "";
                    let finalChunk = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalChunk += transcript;
                        } else {
                            interim += transcript;
                        }
                    }

                    if (finalChunk) {
                        this.recognizedTranscript = (this.recognizedTranscript ? this.recognizedTranscript + " " : "") + finalChunk;
                        this.inputField.value = this.recognizedTranscript;
                    } else if (interim) {
                        this.inputField.value = (this.recognizedTranscript ? this.recognizedTranscript + " " : "") + interim;
                    }
                };

                this.recognition.onerror = (event) => {
                    const err = event.error;
                    if (err === "not-allowed" || err === "permission-denied") {
                        this.appendErrorMessage("Microphone permission was denied. Please allow microphone access or use text input.");
                    } else if (err === "network") {
                        this.appendErrorMessage("Voice recognition network error. Please try again or type your question.");
                    } else if (err === "audio-capture") {
                        this.appendErrorMessage("Microphone unavailable. Please check your audio settings.");
                    }
                    this.updateMicState("error");
                    this.isListening = false;
                    setTimeout(() => {
                        this.updateMicState(this.isSpeechSupported ? "idle" : "unsupported");
                    }, 2200);
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    this.updateMicState("idle");
                    this.inputField.placeholder = "Ask about projects, skills, contact...";

                    // If final speech transcript exists, auto-submit safely through chat pipeline with 'voice' source
                    if (this.recognizedTranscript && this.recognizedTranscript.trim()) {
                        const query = this.recognizedTranscript.trim();
                        this.recognizedTranscript = "";
                        this.inputField.value = query;
                        this.handleSubmit("voice");
                    }
                };

                this.updateMicState("idle");
            } catch (err) {
                console.warn("[Voice Recognition Init Error]", err);
                this.isSpeechSupported = false;
                this.updateMicState("unsupported");
            }
        }

        toggleSpeech() {
            if (this.voiceOutput) {
                this.voiceOutput.stopSpeaking();
            }
            if (!this.isSpeechSupported) {
                this.appendErrorMessage("Voice input isn't supported in this browser. You can still type your question.");
                return;
            }
            if (this.isListening) {
                this.stopSpeech();
            } else {
                this.startSpeech();
            }
        }

        startSpeech() {
            if (!this.isSpeechSupported || this.isGenerating || this.isListening) return;
            if (this.voiceOutput) {
                this.voiceOutput.stopSpeaking();
            }
            this.recognizedTranscript = "";
            this.inputField.value = "";
            try {
                this.recognition.start();
            } catch (e) {
                console.warn("[Voice Recognition Start Error]", e);
                this.isListening = false;
                this.updateMicState("idle");
            }
        }

        stopSpeech() {
            if (!this.isSpeechSupported || !this.isListening) return;
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore if already stopped
            }
            this.isListening = false;
            this.updateMicState("idle");
            this.inputField.placeholder = "Ask about projects, skills, contact...";
        }

        updateMicState(state) {
            if (!this.micBtn) return;
            this.micBtn.classList.remove("is-listening", "is-processing", "has-error", "is-unsupported");

            if (state === "listening") {
                this.micBtn.classList.add("is-listening");
                this.micBtn.setAttribute("aria-label", "Stop voice input");
                this.micBtn.setAttribute("title", "Stop voice input (Listening...)");
            } else if (state === "processing") {
                this.micBtn.classList.add("is-processing");
                this.micBtn.setAttribute("aria-label", "Processing voice input...");
                this.micBtn.setAttribute("title", "Processing voice input...");
            } else if (state === "error") {
                this.micBtn.classList.add("has-error");
                this.micBtn.setAttribute("aria-label", "Voice input error");
                this.micBtn.setAttribute("title", "Voice input error");
            } else if (state === "unsupported") {
                this.micBtn.classList.add("is-unsupported");
                this.micBtn.setAttribute("aria-label", "Voice input unsupported");
                this.micBtn.setAttribute("title", "Voice input isn't supported in this browser. You can still type your question.");
                this.micBtn.disabled = true;
            } else {
                // idle
                this.micBtn.setAttribute("aria-label", "Start voice input");
                this.micBtn.setAttribute("title", "Start voice input");
                this.micBtn.disabled = !this.isSpeechSupported || this.isGenerating;
            }
        }

        scrollToBottom() {
            this.messagesWrap.scrollTop = this.messagesWrap.scrollHeight;
        }

        async checkBackendHealth() {
            try {
                const res = await fetch(`${AI_AGENT_API}/health`, { method: "GET", signal: AbortSignal.timeout(4000) });
                if (res.ok) {
                    this.statusIndicator.style.background = "#34D399";
                    this.statusIndicator.title = "Backend & Ollama Connected";
                } else {
                    this.statusIndicator.style.background = "#F59E0B";
                    this.statusIndicator.title = "Backend Degraded";
                }
            } catch (err) {
                this.statusIndicator.style.background = "#EF4444";
                this.statusIndicator.title = "AI Backend Offline (Run agent/main.py)";
            }
        }

        appendUserMessage(text) {
            const msgEl = document.createElement("div");
            msgEl.className = "ai-msg user";
            const bubble = document.createElement("div");
            bubble.className = "ai-msg-bubble";
            bubble.textContent = text;
            msgEl.appendChild(bubble);
            this.messagesWrap.appendChild(msgEl);
            this.scrollToBottom();
        }

        appendAssistantMessage(rawText, actionPayload = null) {
            const msgEl = document.createElement("div");
            msgEl.className = "ai-msg assistant";
            const bubble = document.createElement("div");
            bubble.className = "ai-msg-bubble";
            bubble.innerHTML = formatAssistantMessage(rawText);

            // If action was returned, render action notification chip
            if (actionPayload) {
                const actionBadge = this.createActionBadge(actionPayload);
                if (actionBadge) {
                    bubble.appendChild(actionBadge);
                }
            }

            // Manual Speaker Button (Step 7: Speech Synthesis)
            let speakBtn = null;
            if (this.voiceOutput && this.voiceOutput.isSupported) {
                speakBtn = document.createElement("button");
                speakBtn.type = "button";
                speakBtn.className = "ai-speak-btn";
                speakBtn.setAttribute("aria-label", "Read message aloud");
                speakBtn.setAttribute("title", "Listen to this response");
                speakBtn.innerHTML = `
                    <span class="ai-speak-icon">
                        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                    </span>
                    <span class="ai-speak-label">Listen</span>
                `;

                speakBtn.addEventListener("click", () => {
                    if (this.voiceOutput.activeSpeakButton === speakBtn && this.voiceOutput.isSpeaking()) {
                        this.voiceOutput.stopSpeaking();
                    } else {
                        this.voiceOutput.speak(rawText, speakBtn);
                    }
                });

                bubble.appendChild(speakBtn);
            }

            msgEl.appendChild(bubble);
            this.messagesWrap.appendChild(msgEl);
            this.scrollToBottom();
            return speakBtn;
        }

        createActionBadge(action) {
            if (!action || !action.type) return null;
            const badge = document.createElement("div");
            badge.className = "ai-action-badge";

            if (action.type === "open_url" && action.url) {
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3m-2 16H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/></svg>
                    <span>Action: Opening destination</span>
                `;
            } else if (action.type === "navigate" && action.target) {
                badge.innerHTML = `
                    <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    <span>Action: Navigating to ${escapeHtml(action.target)}</span>
                `;
            } else {
                return null;
            }
            return badge;
        }

        appendErrorMessage(errorText) {
            const msgEl = document.createElement("div");
            msgEl.className = "ai-msg assistant error";
            const bubble = document.createElement("div");
            bubble.className = "ai-msg-bubble";
            bubble.textContent = errorText;
            msgEl.appendChild(bubble);
            this.messagesWrap.appendChild(msgEl);
            this.scrollToBottom();
        }

        showLoadingIndicator() {
            this.loadingEl = document.createElement("div");
            this.loadingEl.className = "ai-msg assistant";
            this.loadingEl.innerHTML = `
                <div class="ai-loading-bubble">
                    <span class="ai-dot"></span>
                    <span class="ai-dot"></span>
                    <span class="ai-dot"></span>
                </div>
            `;
            this.messagesWrap.appendChild(this.loadingEl);
            this.scrollToBottom();
        }

        hideLoadingIndicator() {
            if (this.loadingEl && this.loadingEl.parentNode) {
                this.loadingEl.parentNode.removeChild(this.loadingEl);
                this.loadingEl = null;
            }
        }

        // 8. Action Execution & Strict Security Validation
        executeAction(action) {
            if (!action || typeof action !== "object") return;
            const actionType = action.type;

            if (actionType === "open_url") {
                const targetUrl = action.url;
                if (!targetUrl || typeof targetUrl !== "string") {
                    console.warn("[AI Security] Invalid open_url target:", targetUrl);
                    return;
                }

                // Security Check: strictly verified against portfolio data
                if (isSafePortfolioUrl(targetUrl)) {
                    console.log("[AI Action] Executing safe open_url:", targetUrl);
                    // Safe execution without eval
                    setTimeout(() => {
                        window.open(targetUrl, "_blank", "noopener,noreferrer");
                    }, 500);
                } else {
                    console.warn("[AI Security Refusal] Blocked unauthorized URL:", targetUrl);
                }
            } else if (actionType === "navigate") {
                const rawTarget = (action.target || "").toLowerCase().trim();
                const destination = ROUTE_MAP[rawTarget];

                if (destination) {
                    console.log("[AI Action] Executing safe navigation to:", destination);
                    // If we're not already on the destination page, navigate
                    const currentPath = window.location.pathname;
                    if (!currentPath.endsWith(destination)) {
                        setTimeout(() => {
                            window.location.href = destination;
                        }, 600);
                    }
                } else {
                    console.warn("[AI Security Refusal] Ignored unknown navigation target:", rawTarget);
                }
            } else {
                console.warn("[AI Security] Unsupported action type ignored:", actionType);
            }
        }

        // 9. Send Message to FastAPI Backend
        async handleSubmit(inputSource = "typed") {
            if (this.isListening) {
                this.stopSpeech();
            }
            if (this.voiceOutput) {
                this.voiceOutput.stopSpeaking();
            }
            const query = this.inputField.value.trim();
            if (!query || this.isGenerating) return;

            // Clear input and append user bubble
            this.inputField.value = "";
            this.appendUserMessage(query);

            // Set loading state
            this.isGenerating = true;
            this.sendBtn.disabled = true;
            this.inputField.disabled = true;
            if (this.micBtn) this.micBtn.disabled = true;
            this.showLoadingIndicator();

            try {
                // Send with 45-second timeout (accommodates local Ollama inference)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 45000);

                const response = await fetch(`${AI_AGENT_API}/chat`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: query,
                        session_id: this.sessionId
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Server returned HTTP ${response.status}`);
                }

                const data = await response.json();
                this.hideLoadingIndicator();

                // Save session id if returned
                if (data.session_id) {
                    this.sessionId = data.session_id;
                    sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
                }

                // Render assistant response & get speaker button
                const replyText = data.reply || "I didn't receive a response. Please try asking again.";
                const speakBtn = this.appendAssistantMessage(replyText, data.action);

                // Execute action if provided
                if (data.action) {
                    this.executeAction(data.action);
                }

                // If message originated from voice input, automatically speak the response
                if (inputSource === "voice" && this.voiceOutput && this.voiceOutput.isSupported) {
                    this.voiceOutput.speak(replyText, speakBtn);
                }

            } catch (err) {
                this.hideLoadingIndicator();
                let userMsg = "Sorry, I couldn't reach the AI backend. Please make sure the local agent is running on port 8000.";
                if (err.name === "AbortError") {
                    userMsg = "Request timed out while waiting for local Ollama response. Please try again.";
                }
                this.appendErrorMessage(userMsg);
                console.error("[Ayush AI Error]", err);
            } finally {
                this.isGenerating = false;
                this.sendBtn.disabled = false;
                this.inputField.disabled = false;
                if (this.micBtn) this.micBtn.disabled = !this.isSpeechSupported;
                this.inputField.focus();
            }
        }

        speak(text) {
            if (this.voiceOutput) {
                return this.voiceOutput.speak(text);
            }
            return false;
        }

        stopSpeaking() {
            if (this.voiceOutput) {
                this.voiceOutput.stopSpeaking();
            }
        }
    }

    // Initialize once DOM is ready
    if (typeof document !== "undefined") {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                window.ayushAI = new AIAssistantUI();
            });
        } else {
            window.ayushAI = new AIAssistantUI();
        }
    }

    // Global & Node/CommonJS exposure for testing and future welcome greeting
    if (typeof window !== "undefined") {
        window.cleanTextForSpeech = cleanTextForSpeech;
        window.VoiceOutputController = VoiceOutputController;
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = {
            cleanTextForSpeech,
            VoiceOutputController,
            isSafePortfolioUrl,
            normalizeUrl,
            escapeHtml,
            formatAssistantMessage,
            ROUTE_MAP
        };
    }

})();
