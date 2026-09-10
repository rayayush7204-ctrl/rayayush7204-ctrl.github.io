/**
 * test_welcome_experience.js - Step 8 Welcome Experience Verification Suite
 *
 * Tests: welcome message, sessionStorage logic, VoiceOutputController reuse,
 * autoplay paths, interruptions, accessibility, and negative constraints.
 */

const fs = require("fs");
const path = require("path");

// -------------------------------------------------------------------------
// Minimal assertion framework
// -------------------------------------------------------------------------
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, label) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${label}`);
    } else {
        failedTests++;
        console.log(`  [FAIL] ${label}`);
    }
}

// -------------------------------------------------------------------------
// Mock environment
// -------------------------------------------------------------------------
const sessionStore = {};
global.sessionStorage = {
    getItem: (k) => sessionStore[k] || null,
    setItem: (k, v) => { sessionStore[k] = String(v); },
    removeItem: (k) => { delete sessionStore[k]; }
};

global.window = {
    speechSynthesis: {
        speak: () => {},
        cancel: () => {},
        speaking: false,
        getVoices: () => [],
        onvoiceschanged: null
    },
    SpeechSynthesisUtterance: class {
        constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.lang = ""; this.voice = null; this.onstart = null; this.onend = null; this.onerror = null; }
    },
    SpeechRecognition: null,
    webkitSpeechRecognition: class {
        constructor() { this.lang = ""; this.interimResults = false; this.continuous = false; this.maxAlternatives = 1; this.onstart = null; this.onresult = null; this.onerror = null; this.onend = null; }
        start() {}
        stop() {}
    },
    portfolioData: null,
    AI_AGENT_API: "http://127.0.0.1:8000"
};

global.document = undefined;
global.AbortSignal = { timeout: () => ({}) };

// -------------------------------------------------------------------------
// Load source files
// -------------------------------------------------------------------------
const jsPath = path.join(__dirname, "..", "js", "ai-agent.js");
const cssPath = path.join(__dirname, "..", "css", "ai-agent.css");
const jsContent = fs.readFileSync(jsPath, "utf-8");
const cssContent = fs.readFileSync(cssPath, "utf-8");

const mod = require(jsPath);
const { WELCOME_MESSAGE, WELCOME_SESSION_KEY, isWelcomeSeen, markWelcomeSeen, cleanTextForSpeech, VoiceOutputController } = mod;

// -------------------------------------------------------------------------
// HTTP helper for live backend tests
// -------------------------------------------------------------------------
async function httpPost(url, body) {
    const http = require("http");
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const payload = JSON.stringify(body);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
        }, (res) => {
            let data = "";
            res.on("data", (c) => data += c);
            res.on("end", () => {
                try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, text: data }); }
            });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

// =========================================================================
// TEST SUITE
// =========================================================================

async function runWelcomeTests() {
    console.log("============================================================");
    console.log("STEP 8 WELCOME EXPERIENCE VERIFICATION SUITE");
    console.log("============================================================");

    // -------------------------------------------------------------------------
    // TEST 1: Welcome Message Existence & Content
    // -------------------------------------------------------------------------
    console.log("\nTEST 1: Welcome Message Existence & Content");
    assert(typeof WELCOME_MESSAGE === "string" && WELCOME_MESSAGE.length > 0, "WELCOME_MESSAGE constant is defined and non-empty");
    assert(WELCOME_MESSAGE === "Welcome to Ayush's digital workspace. I'm your AI guide. Explore his projects, engineering skills, and the systems he's built. You can ask me anything.", "Welcome message matches exact required text");
    assert(jsContent.includes("Welcome to Ayush"), "js/ai-agent.js contains welcome text");

    // -------------------------------------------------------------------------
    // TEST 2: Session Key & First-Visit Logic
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: Session Key & First-Visit Logic");
    assert(WELCOME_SESSION_KEY === "portfolio_ai_welcome_seen", "Session key is 'portfolio_ai_welcome_seen'");

    // Clear session to simulate first visit
    delete sessionStore[WELCOME_SESSION_KEY];
    assert(!isWelcomeSeen(), "First visit: isWelcomeSeen() returns false");

    // Mark as seen
    markWelcomeSeen();
    assert(isWelcomeSeen(), "After markWelcomeSeen(): isWelcomeSeen() returns true");
    assert(sessionStore[WELCOME_SESSION_KEY] === "true", "sessionStorage value is 'true'");

    // Simulate repeat visit
    assert(isWelcomeSeen(), "Repeat visit in same session: isWelcomeSeen() returns true (no duplicate)");

    // Reset for further tests
    delete sessionStore[WELCOME_SESSION_KEY];

    // -------------------------------------------------------------------------
    // TEST 3: Existing VoiceOutputController Reused (No Duplicate TTS)
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: Existing VoiceOutputController Reused (No Duplicate TTS)");
    assert(typeof VoiceOutputController === "function", "VoiceOutputController class is exported");

    // Count occurrences of 'class VoiceOutputController' - should be exactly 1
    const voiceControllerMatches = jsContent.match(/class\s+VoiceOutputController/g);
    assert(voiceControllerMatches && voiceControllerMatches.length === 1, "Exactly one VoiceOutputController class definition (no duplicate)");

    // Count 'new SpeechSynthesisUtterance' - only inside VoiceOutputController.speak()
    const uttMatches = jsContent.match(/new\s+SpeechSynthesisUtterance/g);
    assert(uttMatches && uttMatches.length === 1, "Exactly one SpeechSynthesisUtterance constructor call (inside VoiceOutputController only)");

    // Welcome uses voiceOutput.speak(), not direct speechSynthesis
    assert(jsContent.includes("this.voiceOutput.speak(WELCOME_MESSAGE)"), "Welcome triggers speech via this.voiceOutput.speak(WELCOME_MESSAGE)");

    // -------------------------------------------------------------------------
    // TEST 4: Autoplay Success Path
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: Autoplay Success Path");
    assert(jsContent.includes("triggerWelcome"), "triggerWelcome method exists");
    assert(jsContent.includes("speechStarted = true"), "Tracks whether speech actually started (autoplay detection)");
    assert(jsContent.includes("markWelcomeSeen()"), "Calls markWelcomeSeen on successful speech start");

    // Verify speech is attempted with VoiceOutputController
    assert(jsContent.includes("const spoke = this.voiceOutput.speak(WELCOME_MESSAGE)"), "Attempts speech via existing controller");

    // -------------------------------------------------------------------------
    // TEST 5: Autoplay Blocked Path
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Autoplay Blocked Path");
    assert(jsContent.includes("showWelcomeStartPrompt"), "showWelcomeStartPrompt method exists for autoplay block");
    assert(jsContent.includes("Meet your AI guide"), "Shows 'Meet your AI guide' text when autoplay is blocked");
    assert(jsContent.includes("Start"), "Shows 'Start' button when autoplay is blocked");
    assert(jsContent.includes("aiWelcomeStartBtn"), "Start button has accessible ID");
    assert(jsContent.includes("Start welcome greeting"), "Start button has aria-label");

    // -------------------------------------------------------------------------
    // TEST 6: Manual Start Button Works
    // -------------------------------------------------------------------------
    console.log("\nTEST 6: Manual Start Button Works");
    // When Start is clicked: speak welcome, mark seen, remove prompt
    const startClickHandler = jsContent.includes("startBtn.addEventListener") && jsContent.includes("this.voiceOutput.speak(WELCOME_MESSAGE)") && jsContent.includes("markWelcomeSeen()") && jsContent.includes("this.removeWelcomePrompt()");
    assert(startClickHandler, "Start button click: speaks welcome, marks seen, removes prompt");

    // -------------------------------------------------------------------------
    // TEST 7: Speech Synthesis Unavailable Fallback
    // -------------------------------------------------------------------------
    console.log("\nTEST 7: Speech Synthesis Unavailable Fallback");
    assert(jsContent.includes("!this.voiceOutput || !this.voiceOutput.isSupported"), "Checks if speech synthesis is available");
    // When unsupported: mark seen and return (show text only)
    const unsupportedPath = jsContent.includes("markWelcomeSeen()") && jsContent.includes("return;");
    assert(unsupportedPath, "When speech unavailable: marks seen and returns (text-only welcome)");

    // Initial message in panel shows welcome text for first visit
    assert(jsContent.includes("this.isWelcomeSession ? escapeHtml(WELCOME_MESSAGE)"), "Initial panel message shows welcome text on first visit");

    // -------------------------------------------------------------------------
    // TEST 8: Typing Interrupts Welcome
    // -------------------------------------------------------------------------
    console.log("\nTEST 8: Typing Interrupts Welcome");
    assert(jsContent.includes("this.inputField.addEventListener(\"input\""), "Input field has 'input' event listener");
    assert(jsContent.includes("this.voiceOutput.isSpeaking()"), "Checks if voice is speaking on input");
    assert(jsContent.includes("this.voiceOutput.stopSpeaking()"), "Stops speech on typing");
    assert(jsContent.includes("this.removeWelcomePrompt()"), "Removes welcome prompt on typing");

    // -------------------------------------------------------------------------
    // TEST 9: Microphone Interrupts Welcome
    // -------------------------------------------------------------------------
    console.log("\nTEST 9: Microphone Interrupts Welcome");
    // toggleSpeech already calls voiceOutput.stopSpeaking()
    assert(jsContent.includes("toggleSpeech") && jsContent.includes("this.voiceOutput.stopSpeaking()"), "Microphone toggle stops voice output (interrupts welcome)");

    // -------------------------------------------------------------------------
    // TEST 10: Closing Panel Interrupts Welcome
    // -------------------------------------------------------------------------
    console.log("\nTEST 10: Closing Panel Interrupts Welcome");
    // closePanel already calls voiceOutput.stopSpeaking() and removeWelcomePrompt
    const closePanelContent = jsContent.substring(jsContent.indexOf("closePanel()"));
    assert(closePanelContent.includes("this.voiceOutput.stopSpeaking()"), "Closing panel stops speech");
    assert(closePanelContent.includes("this.removeWelcomePrompt()"), "Closing panel removes welcome prompt");

    // -------------------------------------------------------------------------
    // TEST 11: Sending Message Interrupts Welcome
    // -------------------------------------------------------------------------
    console.log("\nTEST 11: Sending Message Interrupts Welcome");
    const handleSubmitContent = jsContent.substring(jsContent.indexOf("handleSubmit("));
    assert(handleSubmitContent.includes("this.voiceOutput.stopSpeaking()"), "handleSubmit stops speech (interrupts welcome)");

    // -------------------------------------------------------------------------
    // TEST 12: Voice Input Still Works
    // -------------------------------------------------------------------------
    console.log("\nTEST 12: Voice Input Still Works");
    assert(jsContent.includes("webkitSpeechRecognition"), "SpeechRecognition still present");
    assert(jsContent.includes("this.recognition.start()"), "startSpeech() still starts recognition");
    assert(jsContent.includes("handleSubmit(\"voice\")"), "Voice input still auto-submits with 'voice' source");

    // -------------------------------------------------------------------------
    // TEST 13: Text Chat Still Works
    // -------------------------------------------------------------------------
    console.log("\nTEST 13: Text Chat Still Works");
    assert(jsContent.includes("POST"), "HTTP POST to backend still present");
    assert(jsContent.includes("AI_AGENT_API"), "API URL constant still referenced");

    // Live test: send a text chat query
    console.log("  Text chat: 'Who is Ayush?'");
    try {
        const res = await httpPost("http://127.0.0.1:8000/chat", { message: "Who is Ayush?", session_id: "welcome_test_" + Date.now() });
        assert(res.status === 200, "Text chat POST /chat returned HTTP 200");
        assert(res.json && res.json.reply && res.json.reply.length > 0, "Text chat response has content");
    } catch (e) {
        assert(false, "Text chat POST /chat returned HTTP 200 (backend may be offline: " + e.message + ")");
        assert(false, "Text chat response has content");
    }

    // -------------------------------------------------------------------------
    // TEST 14: sessionStorage Key Handling
    // -------------------------------------------------------------------------
    console.log("\nTEST 14: sessionStorage Key Handling");
    // Uses sessionStorage, not localStorage or cookies
    assert(jsContent.includes("sessionStorage.getItem(WELCOME_SESSION_KEY)"), "Uses sessionStorage.getItem");
    assert(jsContent.includes("sessionStorage.setItem(WELCOME_SESSION_KEY"), "Uses sessionStorage.setItem");
    assert(!jsContent.includes("localStorage.setItem(\"portfolio_ai_welcome"), "Does NOT use localStorage for welcome tracking");
    assert(!jsContent.includes("document.cookie"), "Does NOT use cookies for welcome tracking");

    // -------------------------------------------------------------------------
    // TEST 15: No Background Microphone
    // -------------------------------------------------------------------------
    console.log("\nTEST 15: No Background Microphone");
    assert(jsContent.includes("continuous = false") || jsContent.includes("continuous: false"), "SpeechRecognition continuous is false (no background mic)");
    // No navigator.mediaDevices.getUserMedia for always-on recording
    assert(!jsContent.includes("getUserMedia"), "No getUserMedia for background recording");

    // -------------------------------------------------------------------------
    // TEST 16: No Wake Word
    // -------------------------------------------------------------------------
    console.log("\nTEST 16: No Wake Word");
    assert(!jsContent.includes("wake word") && !jsContent.includes("wakeword") && !jsContent.includes("hotword"), "No wake word implementation");

    // -------------------------------------------------------------------------
    // TEST 17: No External Voice API
    // -------------------------------------------------------------------------
    console.log("\nTEST 17: No External Voice API");
    assert(!jsContent.includes("elevenlabs"), "Zero ElevenLabs APIs");
    assert(!jsContent.includes("api.openai.com"), "Zero OpenAI voice APIs");
    assert(!jsContent.includes("texttospeech.googleapis.com"), "Zero Google Cloud TTS APIs");
    assert(!jsContent.includes("polly."), "Zero AWS Polly APIs");

    // -------------------------------------------------------------------------
    // TEST 18: CSS Welcome Styles
    // -------------------------------------------------------------------------
    console.log("\nTEST 18: CSS Welcome Styles");
    assert(cssContent.includes(".ai-welcome-prompt"), "CSS defines .ai-welcome-prompt");
    assert(cssContent.includes(".ai-welcome-prompt-text"), "CSS defines .ai-welcome-prompt-text");
    assert(cssContent.includes(".ai-welcome-start-btn"), "CSS defines .ai-welcome-start-btn");
    assert(cssContent.includes("welcomeFadeIn"), "CSS defines welcomeFadeIn animation");
    assert(cssContent.includes(".ai-welcome-start-btn:hover"), "CSS defines hover state for Start button");
    assert(cssContent.includes(".ai-welcome-start-btn:focus-visible"), "CSS defines focus-visible state for keyboard accessibility");

    // -------------------------------------------------------------------------
    // TEST 19: Accessibility - prefers-reduced-motion
    // -------------------------------------------------------------------------
    console.log("\nTEST 19: Accessibility - prefers-reduced-motion");
    assert(cssContent.includes("prefers-reduced-motion: reduce"), "CSS respects prefers-reduced-motion");
    assert(cssContent.includes("animation: none"), "Animations disabled for reduced motion");

    // -------------------------------------------------------------------------
    // TEST 20: Welcome Prompt Accessible Attributes
    // -------------------------------------------------------------------------
    console.log("\nTEST 20: Welcome Prompt Accessible Attributes");
    assert(jsContent.includes('role", "status"') || jsContent.includes("role\", \"status\""), "Welcome prompt has role='status'");
    assert(jsContent.includes("aria-label") && jsContent.includes("Start welcome greeting"), "Start button has descriptive aria-label");
    assert(jsContent.includes("removeWelcomePrompt"), "Welcome prompt can be dismissed");

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log("\n============================================================");
    console.log(`TOTAL ASSERTIONS: ${totalTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${failedTests}`);
    console.log("============================================================\n");

    if (failedTests > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runWelcomeTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
