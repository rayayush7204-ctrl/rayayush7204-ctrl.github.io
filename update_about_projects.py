import re

def update_about():
    file_path = "D:/Ayush Portfolio/irainsec.github.io-main/about.html"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_timeline = """<div class="timeline">

        <!-- PROJECT EXPERIENCE 1 -->
        <div class="exp-card" data-aos="fade-right">
            <h4>2026</h4>
            <h3><span class="icon">💻</span>Emergency Response & Hospital Coordination Platform</h3>
            <h5>IoT • Distributed Systems • Emergency Response</h5>
            <p>An IoT accident-detection system using Arduino/Raspberry Pi airbag-crash sensors that streams sensor data to the backend through MQTT/HTTP. Designed a fault-tolerant hospital coordination backend across 20+ decoupled API endpoints. Achieved zero incorrect routing in failure simulations, utilizing PostgreSQL/PostGIS indexing to optimize geospatial query performance.</p>

            <div class="badge-box">
                <span class="badge">FastAPI</span>
                <span class="badge">PostgreSQL</span>
                <span class="badge">PostGIS</span>
                <span class="badge">Redis</span>
                <span class="badge">WebSockets</span>
                <span class="badge">Firebase</span>
                <span class="badge">Arduino</span>
                <span class="badge">MQTT</span>
                <span class="badge">pytest</span>
            </div>
        </div>

        <!-- PROJECT EXPERIENCE 2 -->
        <div class="exp-card" data-aos="fade-right">
            <h4>2026</h4>
            <h3><span class="icon">💻</span>LifePulse AI – Smart Blood Donation Network</h3>
            <h5>Emergency Healthcare • Full-Stack • Intelligent Donor Matching</h5>
            <p>Built and deployed a full-stack emergency blood donation platform that matches eligible nearby donors with urgent requests using blood-group compatibility, donor eligibility, availability, geographic proximity, and ring-based escalation. Implemented real-time emergency notifications via Firebase, live GPS tracking, road-based ETA via OSRM, and end-to-end donation lifecycle management. Enforces a strict 56-day donor recovery period.</p>

            <div class="badge-box">
                <span class="badge">React</span>
                <span class="badge">FastAPI</span>
                <span class="badge">PostgreSQL</span>
                <span class="badge">PostGIS</span>
                <span class="badge">Redis</span>
                <span class="badge">WebSockets</span>
                <span class="badge">Firebase</span>
                <span class="badge">OSRM</span>
                <span class="badge">Alembic</span>
            </div>
        </div>

    </div>"""

    # Replace old timeline
    pattern = r'<div class="timeline">.*?</div>\s*</section>'
    replacement = new_timeline + '\n</section>'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    # In about section text, also change "My featured project LifePulse is an AI-powered emergency blood donation platform with multi-agent triage and geospatial hospital matching."
    # to correct terminology without false AI claims.
    old_intro = "My featured project <strong style=\"color:#00ffaa;\">LifePulse</strong> is an AI-powered emergency blood donation platform with multi-agent triage and geospatial hospital matching."
    new_intro = "My featured project <strong style=\"color:#00ffaa;\">LifePulse</strong> is a smart emergency blood donation platform that matches eligible donors with urgent requests using intelligent geographic routing, ring-based escalation, and real-time GPS tracking."
    content = content.replace(old_intro, new_intro)
    
    old_intro2 = "I've built LLM-powered multi-agent systems using <strong style=\"color:#00ffaa;\">LangChain and LangGraph</strong>, end-to-end ML pipelines achieving 93% F1-score on 284K+ transactions, and production-grade applications with Django, FastAPI, React, and AWS."
    new_intro2 = "I specialize in building intelligent distributed systems, IoT integrations, and full-stack platforms using <strong style=\"color:#00ffaa;\">FastAPI, React, PostgreSQL/PostGIS, and WebSockets</strong>. I have experience developing robust APIs, real-time tracking systems, and intelligent geospatial routing solutions."
    content = content.replace(old_intro2, new_intro2)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

update_about()
