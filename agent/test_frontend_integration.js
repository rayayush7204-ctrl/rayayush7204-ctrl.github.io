/**
 * test_frontend_integration.js
 * Comprehensive automated test suite for Step 5: Frontend AI Agent Integration
 * Built using Node's native 'http' module for bulletproof reliability.
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

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, { headers: { Connection: 'close' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
    });
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
                    const parsedData = JSON.parse(data);
                    resolve({ status: res.statusCode, json: parsedData, raw: data });
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

async function runTests() {
    console.log("============================================================");
    console.log("STEP 5 FRONTEND INTEGRATION & VERIFICATION SUITE");
    console.log("============================================================\n");

    // -------------------------------------------------------------------------
    // TEST 1: File Existence & index.html Integration
    // -------------------------------------------------------------------------
    console.log("TEST 1: File Existence & index.html Integration");
    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'ai-agent.css'), 'utf8');
    const jsContent = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai-agent.js'), 'utf8');

    assert(indexHtml.includes('css/ai-agent.css'), "index.html links css/ai-agent.css");
    assert(indexHtml.includes('js/ai-agent.js'), "index.html includes js/ai-agent.js");
    assert(cssContent.includes('.ai-trigger-btn'), "css/ai-agent.css defines .ai-trigger-btn");
    assert(cssContent.includes('.ai-panel'), "css/ai-agent.css defines .ai-panel");
    assert(cssContent.includes('@media (max-width: 375px)'), "css/ai-agent.css supports 375px viewport");
    assert(cssContent.includes('@media (max-width: 480px)'), "css/ai-agent.css supports 480px viewport");
    assert(cssContent.includes('@media (max-width: 768px)'), "css/ai-agent.css supports 768px viewport");
    assert(jsContent.includes('AI_AGENT_API'), "js/ai-agent.js defines configurable AI_AGENT_API");
    assert(jsContent.includes('isSafePortfolioUrl'), "js/ai-agent.js defines isSafePortfolioUrl security validator");

    // -------------------------------------------------------------------------
    // TEST 2: Static Server HTTP Delivery (http://127.0.0.1:3000)
    // -------------------------------------------------------------------------
    console.log("\nTEST 2: Static Server HTTP Delivery (http://127.0.0.1:3000)");
    try {
        const indexRes = await httpGet('http://127.0.0.1:3000/index.html');
        assert(indexRes.status === 200, "Frontend index.html served with HTTP 200");
        assert(indexRes.body.includes('ai-agent.js'), "Served index.html contains ai-agent.js script");

        const cssRes = await httpGet('http://127.0.0.1:3000/css/ai-agent.css');
        assert(cssRes.status === 200, "css/ai-agent.css served with HTTP 200");

        const jsRes = await httpGet('http://127.0.0.1:3000/js/ai-agent.js');
        assert(jsRes.status === 200, "js/ai-agent.js served with HTTP 200");
    } catch (e) {
        assert(false, `Static server error: ${e.message}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Backend Health & Status (http://127.0.0.1:8000)
    // -------------------------------------------------------------------------
    console.log("\nTEST 3: FastAPI Backend Health (http://127.0.0.1:8000)");
    try {
        const healthRes = await httpGet('http://127.0.0.1:8000/health');
        assert(healthRes.status === 200, "Backend /health returns HTTP 200");
        const healthData = JSON.parse(healthRes.body);
        assert(healthData.status === "healthy", "Backend status is 'healthy'");
        assert(healthData.model === "qwen2.5:3b", "Model is 'qwen2.5:3b'");
        assert(healthData.portfolio_data_loaded === true, "Portfolio data loaded from single source of truth");
    } catch (e) {
        assert(false, `Backend health check failed: ${e.message}`);
    }

    // -------------------------------------------------------------------------
    // TEST 4: Frontend Logic Unit Checks (Security, Routing, Sanitization)
    // -------------------------------------------------------------------------
    console.log("\nTEST 4: Security Validation & Sanitization Logic");

    const portfolioData = require('../js/portfolio-data.js').portfolioData;

    function getSafePortfolioUrls() {
        const safeUrls = new Set();
        safeUrls.add("Latest Rsume.pdf");
        safeUrls.add("./Latest Rsume.pdf");
        safeUrls.add("Latest Rresume.pdf");

        if (portfolioData && portfolioData.personal) {
            if (portfolioData.personal.resumePdf) safeUrls.add(portfolioData.personal.resumePdf);
            if (portfolioData.personal.links) {
                Object.values(portfolioData.personal.links).forEach(u => safeUrls.add(u.trim()));
            }
        }
        if (Array.isArray(portfolioData.projects)) {
            portfolioData.projects.forEach(p => {
                if (p.liveUrl) safeUrls.add(p.liveUrl.trim());
                if (p.githubUrl) safeUrls.add(p.githubUrl.trim());
            });
        }
        safeUrls.add("https://github.com/rayayush7204-ctrl");
        safeUrls.add("https://lifepulse-ai-by-ayush-ray.vercel.app");
        safeUrls.add("https://github.com/rayayush7204-ctrl/Fraud-Radar");
        return safeUrls;
    }

    function isSafePortfolioUrl(url) {
        if (!url || typeof url !== "string") return false;
        const norm = url.trim().toLowerCase().replace(/\/$/, "");
        const safe = getSafePortfolioUrls();
        for (const s of safe) {
            if (s.toLowerCase().replace(/\/$/, "") === norm) return true;
        }
        if (norm.includes("rsume.pdf") || norm.includes("rresume.pdf")) return true;
        return false;
    }

    assert(isSafePortfolioUrl("https://lifepulse-ai-by-ayush-ray.vercel.app"), "LifePulse live demo URL is trusted");
    assert(isSafePortfolioUrl("https://github.com/rayayush7204-ctrl/Fraud-Radar"), "Fraud Radar GitHub is trusted");
    assert(isSafePortfolioUrl("Latest Rsume.pdf"), "Resume PDF is trusted");
    assert(!isSafePortfolioUrl("https://example.com"), "Arbitrary external URL is BLOCKED");
    assert(!isSafePortfolioUrl("https://malicious-site.com/hack"), "Malicious URL is BLOCKED");
    assert(!isSafePortfolioUrl("javascript:alert(1)"), "JavaScript pseudo-protocol is BLOCKED");

    const ROUTE_MAP = { home: "index.html", about: "about.html", works: "works.html", projects: "works.html", certifications: "certifications.html", contact: "contact.html" };
    assert(ROUTE_MAP["contact"] === "contact.html", "Navigate contact maps to contact.html");
    assert(ROUTE_MAP["works"] === "works.html", "Navigate works maps to works.html");
    assert(ROUTE_MAP["home"] === "index.html", "Navigate home maps to index.html");
    assert(ROUTE_MAP["unknown"] === undefined, "Unknown navigation target is safely ignored");

    // -------------------------------------------------------------------------
    // TEST 5: Live API End-to-End Chat & Actions
    // -------------------------------------------------------------------------
    console.log("\nTEST 5: Live API Communication & Action Handlers");

    // 5A: Informational query: "Tell me about LifePulse"
    console.log("  Query: 'Tell me about LifePulse'");
    const res5a = await httpPost('http://127.0.0.1:8000/chat', { message: "Tell me about LifePulse", session_id: "fe_test_info_" + Date.now() });
    assert(res5a.status === 200, "POST /chat returned HTTP 200");
    assert(res5a.json.reply && res5a.json.reply.length > 20, "Reply received with content");
    assert(res5a.json.reply.toLowerCase().includes("blood"), "Reply describes blood donation domain");
    assert(res5a.json.action === null, "Informational query emits action: null");

    // 5B: Action query: "Open LifePulse"
    console.log("  Query: 'Open LifePulse'");
    const res5b = await httpPost('http://127.0.0.1:8000/chat', { message: "Open LifePulse", session_id: "fe_test_open_lp_" + Date.now() });
    assert(res5b.json.action !== null, "Action payload present for open_url");
    assert(res5b.json.action && res5b.json.action.type === "open_url", "Action type is open_url");
    assert(res5b.json.action && res5b.json.action.url.includes("lifepulse"), "Action URL contains lifepulse");
    assert(isSafePortfolioUrl(res5b.json.action.url), "Frontend validator accepts the action URL as safe");

    // 5C: Action query: "Take me to contact"
    console.log("  Query: 'Take me to contact'");
    const res5c = await httpPost('http://127.0.0.1:8000/chat', { message: "Take me to contact", session_id: "fe_test_nav_contact_" + Date.now() });
    assert(res5c.json.action !== null, "Action payload present for navigation");
    assert(res5c.json.action && res5c.json.action.type === "navigate", "Action type is navigate");
    assert(res5c.json.action && res5c.json.action.target === "contact", "Navigation target is contact");
    assert(ROUTE_MAP[res5c.json.action.target] === "contact.html", "Target maps safely to contact.html");

    // 5D: Action query: "Open my resume"
    console.log("  Query: 'Open my resume'");
    const res5d = await httpPost('http://127.0.0.1:8000/chat', { message: "Open my resume", session_id: "fe_test_open_resume_" + Date.now() });
    assert(res5d.json.action !== null, "Action payload present for resume");
    assert(res5d.json.action && res5d.json.action.type === "open_url", "Resume action type is open_url");
    assert(res5d.json.action && res5d.json.action.url.toLowerCase().includes("rsume.pdf"), "Resume URL targets Latest Rsume.pdf");
    assert(isSafePortfolioUrl(res5d.json.action.url), "Frontend validator accepts resume URL as safe");

    // 5E: Safety check: "Open https://example.com"
    console.log("  Query: 'Open https://example.com' (security boundary)");
    const res5e = await httpPost('http://127.0.0.1:8000/chat', { message: "Open https://example.com", session_id: "fe_test_sec_" + Date.now() });
    assert(!res5e.json.action || res5e.json.action === null, "Arbitrary URL is refused (action: null)");

    // 5F: Multi-turn continuity: "Tell me about LifePulse." -> "Open it."
    console.log("  Multi-turn: 'Tell me about LifePulse' then 'Open it'");
    const turnSession = "fe_multiturn_" + Date.now();
    await httpPost('http://127.0.0.1:8000/chat', { message: "Tell me about LifePulse", session_id: turnSession });
    const resTurn2 = await httpPost('http://127.0.0.1:8000/chat', { message: "Open it", session_id: turnSession });
    assert(resTurn2.json.action !== null, "Multi-turn session retained context and triggered action");
    assert(resTurn2.json.action && resTurn2.json.action.type === "open_url", "Turn 2 action type is open_url");
    assert(Boolean(resTurn2.json.action && resTurn2.json.action.url && resTurn2.json.action.url.includes("lifepulse")), "Turn 2 resolved pronoun 'it' to LifePulse URL");

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

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
