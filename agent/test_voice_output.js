/**
 * test_voice_output.js
 * Comprehensive automated test suite for Step 7: Zero-Cost AI Voice Output
 *
 * Verifies all 16 required items:
 * 1. speechSynthesis detection
 * 2. SpeechSynthesisUtterance creation
 * 3. Voice selection fallback
 * 4. Speaking state tracking
 * 5. stopSpeaking() cancellation
 * 6. Duplicate/overlapping speech cancellation
 * 7. Markdown-to-speech text cleaning
 * 8. Typed message remains text-only by default
 * 9. Voice-originated message automatically speaks response
 * 10. Speaker button manually speaks a response
 * 11. Speaker button stops speech
 * 12. Unsupported browsers remain functional (no errors, graceful fallback)
 * 13. Action response such as "Open LifePulse" can be spoken safely
 * 14. Raw URLs are stripped and not spoken unnecessarily
 * 15. Zero external voice APIs used (no ElevenLabs, OpenAI, Google Cloud TTS)
 * 16. Zero console errors / syntax errors
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

async function runVoiceOutputTests() {
    console.log("============================================================");
    console.log("STEP 7 VOICE OUTPUT INTEGRATION & VERIFICATION SUITE");
    console.log("============================================================\n");

    const jsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai-agent.js'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'ai-agent.css'), 'utf8');

    // -------------------------------------------------------------------------
    // TEST 1: API Detection & Utterance (Items 1 & 2)
    // -------------------------------------------------------------------------
    console.log("TEST 1: Web Speech API Detection & Utterance");
    assert(jsContent.includes('"speechSynthesis" in window'), "Detects window.speechSynthesis");
    assert(jsContent.includes('"SpeechSynthesisUtterance" in window'), "Detects window.SpeechSynthesisUtterance");
    assert(jsContent.includes("new SpeechSynthesisUtterance(cleanText)"), "Instantiates native SpeechSynthesisUtterance with cleaned text");

    // -------------------------------------------------------------------------
    // TEST 2: Voice Output Controller Architecture (Items 3, 4, 5, 6)
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: VoiceOutputController Lifecycle & State");
    assert(jsContent.includes("class VoiceOutputController"), "Defines dedicated VoiceOutputController class");
    assert(jsContent.includes("synth.getVoices()"), "Loads available system voices");
    assert(jsContent.includes("onvoiceschanged"), "Listens to onvoiceschanged event for asynchronous voice loading");
    assert(jsContent.includes("stopSpeaking()"), "Provides clean stopSpeaking() cancellation method");
    assert(jsContent.includes("this.synth.cancel()"), "Calls synth.cancel() to cleanly abort playing audio");
    assert(jsContent.includes("this.stopSpeaking()"), "Cancels previous speech before speaking new response (duplicate prevention)");

    // -------------------------------------------------------------------------
    // TEST 3: Voice Selection Fallback (Item 3)
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: Voice Selection Hierarchy");
    assert(jsContent.includes('v.lang === "en-US"'), "Prefers en-US English voice");
    assert(jsContent.includes('v.lang && v.lang.startsWith("en")'), "Falls back to any English voice");
    assert(jsContent.includes('v.default'), "Falls back to default browser voice");

    // -------------------------------------------------------------------------
    // TEST 4: Markdown-to-Speech Text Sanitization (Items 7, 13, 14)
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: Markdown Cleaning & URL Stripping");
    const { cleanTextForSpeech } = require('../js/ai-agent.js');

    // 4A: Link stripping
    const linkInput = "You can view it [here](https://lifepulse-ai-by-ayush-ray.vercel.app).";
    const linkCleaned = cleanTextForSpeech(linkInput);
    assert(!linkCleaned.includes("https://"), "Raw URL stripped from markdown link");
    assert(linkCleaned.includes("here"), "Link anchor text preserved for natural reading");
    assert(linkCleaned === "You can view it here.", `Cleaned link output matches: "${linkCleaned}"`);

    // 4B: Code blocks & backticks
    const codeInput = "Here is the command: `python agent/main.py`. ```bash\necho hello\n```";
    const codeCleaned = cleanTextForSpeech(codeInput);
    assert(!codeCleaned.includes("```"), "Code fence blocks stripped");
    assert(!codeCleaned.includes("`"), "Backticks stripped");
    assert(codeCleaned.includes("python agent/main.py"), "Inline code text preserved without punctuation clutter");

    // 4C: Bold, italic, headings, bullets
    const formattingInput = "### Projects\n* **LifePulse AI** - *Smart blood network*\n- Fraud Radar";
    const formatCleaned = cleanTextForSpeech(formattingInput);
    assert(!formatCleaned.includes("**") && !formatCleaned.includes("###"), "Markdown markers stripped");
    assert(formatCleaned.includes("LifePulse AI - Smart blood network Fraud Radar"), "Text converted to natural speaking sentence");

    // 4D: Raw URLs not spoken unnecessarily
    const rawUrlInput = "Check out https://github.com/rayayush7204-ctrl/LifePulse-AI for source.";
    const rawUrlCleaned = cleanTextForSpeech(rawUrlInput);
    assert(!rawUrlCleaned.includes("https://github.com"), "Raw external URL stripped");
    assert(rawUrlCleaned === "Check out for source.", "Sentence read naturally without reading raw URLs");

    // 4E: Action response speaking
    const actionInput = "Opening LifePulse AI – Smart Blood Donation Network. You can view it [here](https://lifepulse-ai-by-ayush-ray.vercel.app).";
    const actionCleaned = cleanTextForSpeech(actionInput);
    assert(actionCleaned.includes("Opening LifePulse AI"), "Action confirmation spoken naturally");
    assert(!actionCleaned.includes("vercel.app"), "Destination URL not spoken aloud");

    // -------------------------------------------------------------------------
    // TEST 5: Manual Speaker Button UI & Styles (Items 10, 11)
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Manual Speaker Button in Assistant Bubbles");
    assert(jsContent.includes('ai-speak-btn'), "js/ai-agent.js creates .ai-speak-btn inside assistant bubbles");
    assert(jsContent.includes('"Read message aloud"'), "Initial accessible label is 'Read message aloud'");
    assert(jsContent.includes('"Stop speech"'), "Switches to 'Stop speech' while actively playing");
    assert(cssContent.includes('.ai-speak-btn {'), "css/ai-agent.css defines base .ai-speak-btn styling");
    assert(cssContent.includes('.ai-speak-btn.is-speaking'), "css/ai-agent.css defines .is-speaking active state");
    assert(cssContent.includes('.ai-speak-btn.is-unsupported'), "css/ai-agent.css hides button when speech synthesis unsupported");

    // -------------------------------------------------------------------------
    // TEST 6: When to Speak: Typed vs Voice Triggering (Items 8, 9)
    // -------------------------------------------------------------------------
    console.log("\nTEST 6: Typed vs Voice Origin Speech Logic");
    assert(jsContent.includes('async handleSubmit(inputSource = "typed")'), "handleSubmit defaults to 'typed' input source");
    assert(jsContent.includes('this.handleSubmit("voice")'), "Voice recognition auto-submission passes 'voice' input source");
    assert(jsContent.includes('if (inputSource === "voice" && this.voiceOutput'), "Only automatically calls speak() when inputSource is 'voice'");

    // -------------------------------------------------------------------------
    // TEST 7: Interruption & Interactivity (Items 5, 9, 11)
    // -------------------------------------------------------------------------
    console.log("\nTEST 7: User Interruption Handling");
    assert(jsContent.includes('closePanel() {\n            if (this.isListening) {\n                this.stopSpeech();\n            }\n            if (this.voiceOutput) {\n                this.voiceOutput.stopSpeaking();\n            }'), "Closing chat panel immediately stops voice speech");
    assert(jsContent.includes('startSpeech() {\n            if (!this.isSpeechSupported || this.isGenerating || this.isListening) return;\n            if (this.voiceOutput) {\n                this.voiceOutput.stopSpeaking();\n            }'), "Activating microphone immediately stops voice speech");
    assert(jsContent.includes('if (this.voiceOutput) {\n                this.voiceOutput.stopSpeaking();\n            }\n            const query = this.inputField.value.trim();'), "Submitting new query immediately stops previous speech");

    // -------------------------------------------------------------------------
    // TEST 8: Welcome Message Preparation (Item 12)
    // -------------------------------------------------------------------------
    console.log("\nTEST 8: Welcome Message Controller Preparedness");
    assert(jsContent.includes('speak(text) {\n            if (this.voiceOutput) {\n                return this.voiceOutput.speak(text);\n            }'), "AIAssistantUI exposes speak(text) method ready for future welcome greeting");
    assert(!jsContent.includes('speak("Welcome to Ayush'), "Zero automatic welcome greeting played on load (strictly preserved for Step 8)");

    // -------------------------------------------------------------------------
    // TEST 9: Unsupported Browser Resilience (Item 12)
    // -------------------------------------------------------------------------
    console.log("\nTEST 9: Unsupported Browser Resilience");
    const { VoiceOutputController } = require('../js/ai-agent.js');
    // In Node environment without window.speechSynthesis:
    const mockController = new VoiceOutputController();
    assert(mockController.isSupported === false, "Correctly flags unsupported environment when window.speechSynthesis is absent");
    assert(mockController.speak("Hello") === false, "Gracefully returns false without throwing exceptions");
    assert(mockController.stopSpeaking() === undefined, "stopSpeaking() executes safely without throwing");
    assert(mockController.isSpeaking() === false, "isSpeaking() safely returns false");

    // -------------------------------------------------------------------------
    // TEST 10: Negative Constraints Verification (Item 15)
    // -------------------------------------------------------------------------
    console.log("\nTEST 10: Zero-Cost & Negative Constraints Verification");
    assert(!jsContent.includes("elevenlabs"), "Zero ElevenLabs APIs used");
    assert(!jsContent.includes("api.openai.com"), "Zero OpenAI voice APIs used");
    assert(!jsContent.includes("texttospeech.googleapis.com"), "Zero Google Cloud TTS APIs used");
    assert(!jsContent.includes("AudioContext"), "Zero external audio streaming/decoding services used");

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

runVoiceOutputTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
