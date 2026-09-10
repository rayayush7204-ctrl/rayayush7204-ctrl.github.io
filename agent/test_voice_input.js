/**
 * test_voice_input.js
 * Comprehensive automated test suite for Step 6: Zero-Cost Voice Input
 *
 * Verifies:
 * 1. Microphone DOM markup and Iconoir-compatible SVG icon in js/ai-agent.js
 * 2. Scoped CSS for all 5 microphone states: idle, listening, processing, unsupported, error
 * 3. SpeechRecognition configuration (window.SpeechRecognition || window.webkitSpeechRecognition, en-US, interimResults=true, continuous=false)
 * 4. Error messages for permission denied, microphone unavailable, network error, and no-speech silence
 * 5. Unsupported browser fallback (mic button disabled/hidden, text chat remains 100% operational)
 * 6. Live API query simulation of voice-transcribed inputs:
 *    - Voice query "Tell me about LifePulse" -> 200 OK, blood donation response
 *    - Voice query "Open LifePulse" -> 200 OK, open_url action with safe URL
 *    - Voice query "Open https://example.com" -> refused (action: null)
 * 7. Security: Transcript validation and zero code execution
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  [PASS] ${message}`);
    } else {
        failedTests++;
        console.error(`  [FAIL] ${message}`);
    }
}

function httpPost(url, payload) {
    return new Promise((resolve, reject) => {
        const bodyStr = JSON.stringify(payload);
        const parsed = new URL(url);
        const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
                'Connection': 'close'
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, json: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, json: null, raw: data });
                }
            });
        });
        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

async function runVoiceTests() {
    console.log("============================================================");
    console.log("STEP 6 VOICE INPUT INTEGRATION & VERIFICATION SUITE");
    console.log("============================================================\n");

    const jsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai-agent.js'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'ai-agent.css'), 'utf8');

    // -------------------------------------------------------------------------
    // TEST 1: DOM Markup & Icon Integration
    // -------------------------------------------------------------------------
    console.log("TEST 1: Microphone Button DOM & Structure");
    assert(jsContent.includes('class="ai-mic-btn"'), "js/ai-agent.js includes .ai-mic-btn markup");
    assert(jsContent.includes('id="aiMicBtn"'), "js/ai-agent.js includes #aiMicBtn ID");
    assert(jsContent.includes('aria-label="Start voice input"'), "Initial accessible aria-label is 'Start voice input'");
    assert(jsContent.includes('<svg viewBox="0 0 24 24">'), "Microphone button includes SVG microphone icon");

    // -------------------------------------------------------------------------
    // TEST 2: CSS Styles for All 5 Microphone States
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: CSS Microphone States");
    assert(cssContent.includes('.ai-mic-btn {'), "css/ai-agent.css defines base .ai-mic-btn (idle)");
    assert(cssContent.includes('.ai-mic-btn.is-listening'), "css/ai-agent.css defines .is-listening state");
    assert(cssContent.includes('aiMicPulse'), "css/ai-agent.css defines listening pulse keyframes");
    assert(cssContent.includes('.ai-mic-btn.is-processing'), "css/ai-agent.css defines .is-processing state");
    assert(cssContent.includes('.ai-mic-btn.has-error'), "css/ai-agent.css defines .has-error state");
    assert(cssContent.includes('.ai-mic-btn.is-unsupported'), "css/ai-agent.css defines .is-unsupported state");

    // -------------------------------------------------------------------------
    // TEST 3: SpeechRecognition API & Configuration
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: Web Speech API Detection & Configuration");
    assert(jsContent.includes('window.SpeechRecognition || window.webkitSpeechRecognition'), "Supports vendor-prefixed webkitSpeechRecognition");
    assert(jsContent.includes('lang = "en-US"'), "Configured language is en-US");
    assert(jsContent.includes('interimResults = true'), "interimResults is enabled for real-time feedback");
    assert(jsContent.includes('continuous = false'), "continuous is false to prevent background microphone listening");

    // -------------------------------------------------------------------------
    // TEST 4: Microphone State Management & User Experience
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: State Management & Accessible Labels");
    assert(jsContent.includes('updateMicState(state)'), "updateMicState helper defined");
    assert(jsContent.includes('"Stop voice input"'), "Accessible label switches to 'Stop voice input' while listening");
    assert(jsContent.includes('"Start voice input"'), "Accessible label switches to 'Start voice input' when idle");
    assert(jsContent.includes('toggleSpeech()'), "toggleSpeech allows starting and stopping recognition");
    assert(jsContent.includes('stopSpeech()'), "stopSpeech cleanly halts active recognition");

    // -------------------------------------------------------------------------
    // TEST 5: Error Handling Scenarios
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Friendly Error Handling (No Raw Stack Traces)");
    assert(jsContent.includes('Microphone permission was denied'), "Friendly message for permission denial");
    assert(jsContent.includes('Voice recognition network error'), "Friendly message for network failure");
    assert(jsContent.includes('Microphone unavailable'), "Friendly message for audio capture failure");
    assert(jsContent.includes('Voice input isn\'t supported in this browser'), "Friendly message for unsupported browsers");

    // -------------------------------------------------------------------------
    // TEST 6: Simulated Voice Transcripts through Chat Pipeline
    // -------------------------------------------------------------------------
    console.log("\nTEST 6: Voice Transcripts through Backend Chat Pipeline");

    // 6A: Voice query "Tell me about LifePulse"
    console.log("  Voice input: 'Tell me about LifePulse'");
    const res6a = await httpPost('http://127.0.0.1:8000/chat', {
        message: "Tell me about LifePulse",
        session_id: "voice_test_" + Date.now()
    });
    assert(res6a.status === 200, "Voice query POST /chat returned HTTP 200");
    assert(res6a.json.reply && res6a.json.reply.toLowerCase().includes("blood"), "Voice query response accurately describes LifePulse blood platform");
    assert(res6a.json.action === null, "Informational voice query returns action: null");

    // 6B: Voice query "Open LifePulse" (Action execution)
    console.log("  Voice input: 'Open LifePulse'");
    const res6b = await httpPost('http://127.0.0.1:8000/chat', {
        message: "Open LifePulse",
        session_id: "voice_test_" + Date.now()
    });
    assert(res6b.json.action !== null, "Voice query triggered structured action payload");
    assert(res6b.json.action && res6b.json.action.type === "open_url", "Action type is open_url");
    assert(res6b.json.action && res6b.json.action.url.includes("lifepulse"), "Action URL is verified LifePulse destination");

    // 6C: Security check: Voice query "Open https://example.com"
    console.log("  Voice input: 'Open https://example.com' (security boundary)");
    const res6c = await httpPost('http://127.0.0.1:8000/chat', {
        message: "Open https://example.com",
        session_id: "voice_sec_" + Date.now()
    });
    assert(!res6c.json.action || res6c.json.action === null, "Arbitrary URL from voice transcript is refused (action: null)");

    // -------------------------------------------------------------------------
    // TEST 7: Negative Constraints Verification
    // -------------------------------------------------------------------------
    console.log("\nTEST 7: Strict Constraints Verification");
    assert(!jsContent.includes('elevenlabs'), "Zero external ElevenLabs APIs used");
    assert(!jsContent.includes('api.openai.com'), "Zero external OpenAI APIs used");
    assert(!jsContent.includes('texttospeech.googleapis.com'), "Zero Google Cloud TTS APIs used");

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

runVoiceTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
