"""
portfolio_loader.py - Single Source of Truth Adapter

Dynamically loads portfolio data directly from 'js/portfolio-data.js'.
Does NOT duplicate or hardcode portfolio data in Python.
Exposes the exact accessor functions:
- get_about()
- get_projects()
- get_project(name)
- get_skills()
- get_certifications()
- get_education()
- get_achievements()
- get_experience()
"""

import json
import os
import subprocess
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

# Locate js/portfolio-data.js relative to project root
BASE_DIR = Path(__file__).resolve().parent.parent
JS_DATA_PATH = BASE_DIR / "js" / "portfolio-data.js"

_cache_lock = threading.Lock()
_cached_data: Optional[Dict[str, Any]] = None
_cached_mtime: float = 0.0


def _load_from_js() -> Dict[str, Any]:
    """
    Executes a sandboxed Node VM script to load and evaluate js/portfolio-data.js,
    returning the raw portfolioData object and invoking its accessors.
    """
    if not JS_DATA_PATH.exists():
        raise FileNotFoundError(f"Single source of truth not found at: {JS_DATA_PATH}")

    # Node script to evaluate portfolio-data.js safely and extract structured data
    node_script = """
    const fs = require('fs');
    const vm = require('vm');
    const filePath = process.argv[1];
    const code = fs.readFileSync(filePath, 'utf8');

    const fakeDocument = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };

    const ctx = {
        console,
        document: fakeDocument,
        window: {},
        process: { env: {} }
    };

    vm.createContext(ctx);
    vm.runInContext(code, ctx);

    const data = ctx.portfolioData || ctx.PortfolioData || {};
    const result = {
        personal: data.personal || {},
        education: data.education || [],
        projects: data.projects || [],
        skills: data.skills || {},
        certifications: data.certifications || [],
        achievements: data.achievements || [],
        experience: data.experience || [],
        links: data.links || (data.personal ? data.personal.links : {}) || {},
        about: typeof ctx.getAbout === 'function' ? ctx.getAbout() : data.personal,
        allSkills: typeof ctx.getSkills === 'function' ? ctx.getSkills() : data.skills,
        allProjects: typeof ctx.getProjects === 'function' ? ctx.getProjects() : data.projects,
        allCertifications: typeof ctx.getCertifications === 'function' ? ctx.getCertifications() : data.certifications,
        allEducation: typeof ctx.getEducation === 'function' ? ctx.getEducation() : data.education,
        allAchievements: typeof ctx.getAchievements === 'function' ? ctx.getAchievements() : data.achievements
    };

    process.stdout.write(JSON.stringify(result));
    """

    cmd = ["node", "-e", node_script, str(JS_DATA_PATH)]
    try:
        proc = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
            encoding="utf-8"
        )
        return json.loads(proc.stdout)
    except Exception as e:
        raise RuntimeError(f"Failed to execute Node loader on {JS_DATA_PATH}: {e}")


def get_portfolio_data(force_reload: bool = False) -> Dict[str, Any]:
    """
    Returns the loaded portfolio data, cached by file modification time.
    """
    global _cached_data, _cached_mtime
    with _cache_lock:
        if not JS_DATA_PATH.exists():
            raise FileNotFoundError(f"Portfolio data file missing: {JS_DATA_PATH}")

        current_mtime = os.path.getmtime(JS_DATA_PATH)
        if force_reload or _cached_data is None or current_mtime > _cached_mtime:
            _cached_data = _load_from_js()
            _cached_mtime = current_mtime
        return _cached_data


def get_about() -> Dict[str, Any]:
    """Returns personal bio, contact, location, and headline."""
    data = get_portfolio_data()
    return data.get("about") or data.get("personal", {})


def get_projects() -> List[Dict[str, Any]]:
    """Returns the ordered list of portfolio projects."""
    data = get_portfolio_data()
    return data.get("allProjects") or data.get("projects", [])


def get_project(name: str) -> Optional[Dict[str, Any]]:
    """
    Finds a specific project by id, title, or natural aliases.
    Returns None if no matching project is found.
    """
    if not name:
        return None
    q = name.strip().lower()

    # Normalization of natural query aliases
    alias_map = {
        "lifepulse": "lifepulse-ai",
        "life pulse": "lifepulse-ai",
        "blood donation": "lifepulse-ai",
        "blood donation network": "lifepulse-ai",
        "smart blood donation network": "lifepulse-ai",
        "emergency response": "emergency-response",
        "hospital coordination": "emergency-response",
        "emergency response & hospital coordination platform": "emergency-response",
        "emergency response platform": "emergency-response",
        "emergency project": "emergency-response",
        "iot project": "emergency-response",
        "accident detection": "emergency-response",
        "fraud radar": "fraud-radar",
        "credit card fraud": "fraud-radar",
        "credit card fraud detection": "fraud-radar",
        "fraud detection": "fraud-radar",
        "credit card fraud detection / fraud radar": "fraud-radar",
    }

    target_id = None
    for alias_key, mapped_id in alias_map.items():
        if alias_key in q or q in alias_key:
            target_id = mapped_id
            break

    for proj in get_projects():
        pid = str(proj.get("id", "")).lower()
        title = str(proj.get("title", "")).lower()
        tagline = str(proj.get("tagline", "")).lower()

        if target_id and pid == target_id:
            return proj
        if q == pid or q in title or q in tagline:
            return proj

    return None


def get_skills() -> Dict[str, List[str]]:
    """Returns categorized skills matrix."""
    data = get_portfolio_data()
    return data.get("allSkills") or data.get("skills", {})


def get_certifications() -> List[Dict[str, Any]]:
    """Returns list of verified certifications."""
    data = get_portfolio_data()
    return data.get("allCertifications") or data.get("certifications", [])


def get_education() -> List[Dict[str, Any]]:
    """Returns education history."""
    data = get_portfolio_data()
    return data.get("allEducation") or data.get("education", [])


def get_achievements() -> List[Dict[str, Any]]:
    """Returns key achievements and metrics."""
    data = get_portfolio_data()
    return data.get("allAchievements") or data.get("achievements", [])


def get_experience() -> List[Dict[str, Any]]:
    """Returns experience timeline."""
    data = get_portfolio_data()
    return data.get("experience", [])


def build_grounded_context() -> str:
    """
    Constructs a comprehensive, highly-structured context text directly
    from js/portfolio-data.js for grounding the LLM.
    """
    about = get_about()
    projects = get_projects()
    skills = get_skills()
    certs = get_certifications()
    edu = get_education()
    achievements = get_achievements()

    parts = []

    # Personal / About
    parts.append("=== PERSONAL PROFILE & IDENTITY ===")
    parts.append(f"Name: {about.get('name', 'Ayush Kumar Ray')}")
    parts.append(f"Headline: {about.get('headline', '')}")
    parts.append(f"Bio: {about.get('bio', '')}")
    parts.append(f"Location: {about.get('location', '')}")
    parts.append(f"Availability: {about.get('availability', '')}")
    parts.append(f"Email: {about.get('email', '')}")
    parts.append(f"Phone: {about.get('phone', '')}")
    links = about.get("links", {})
    parts.append(f"GitHub: {links.get('github', 'https://github.com/rayayush7204-ctrl')}")
    parts.append(f"LinkedIn: {links.get('linkedin', '')}")
    parts.append(f"Live Project Links: LifePulse AI ({links.get('lifepulseLive', '')}), Fraud Radar ({links.get('fraudRadarLive', '')})")
    stats = about.get("stats", {})
    parts.append(f"Key Stats: DSA Solved: {stats.get('dsaSolved', '250+')}, REST APIs Built: {stats.get('restApisBuilt', '20+')}, Certifications: {stats.get('certificationsCount', '7+')}")

    # Education
    parts.append("\n=== EDUCATION ===")
    for e in edu:
        parts.append(f"Degree: {e.get('degree', '')}")
        parts.append(f"Institution: {e.get('institution', '')}, {e.get('location', '')}")
        parts.append(f"Dates: {e.get('dates', '')}")
        parts.append(f"CGPA: {e.get('cgpa', '')}")
        if e.get("coursework"):
            parts.append(f"Coursework: {', '.join(e['coursework'])}")

    # Projects
    parts.append("\n=== PROJECTS (STRICT ORDER) ===")
    for p in projects:
        parts.append(f"Project Priority {p.get('priority', '')}: {p.get('title', '')}")
        parts.append(f"  Year: {p.get('year', '')}")
        parts.append(f"  Category: {p.get('category', '')}")
        parts.append(f"  Tagline: {p.get('tagline', '')}")
        parts.append(f"  What Built: {p.get('whatBuilt', '')}")
        parts.append(f"  Technical Implementation: {p.get('techImplementation', '')}")
        parts.append(f"  Important Result: {p.get('importantResult', '')}")
        parts.append(f"  Technologies: {', '.join(p.get('technologies', []))}")
        plinks = p.get("links", {})
        if plinks:
            link_str = ", ".join([f"{k}: {v}" for k, v in plinks.items()])
            parts.append(f"  Links: {link_str}")

    # Skills
    parts.append("\n=== SKILLS & TECHNICAL STACK ===")
    for cat, sk_list in skills.items():
        parts.append(f"{cat}: {', '.join(sk_list)}")

    # Certifications
    parts.append("\n=== VERIFIED CERTIFICATIONS (7 TOTAL) ===")
    for idx, c in enumerate(certs, 1):
        parts.append(f"{idx}. {c.get('title', '')} (Issued by {c.get('issuer', '')})")

    # Achievements
    parts.append("\n=== ACHIEVEMENTS ===")
    for a in achievements:
        parts.append(f"- {a.get('title', '')} ({a.get('issuer', '')}) [{a.get('year', '')}]: {a.get('description', '')}")

    return "\n".join(parts)


if __name__ == "__main__":
    print("Testing portfolio loader directly from js/portfolio-data.js:")
    about_info = get_about()
    print(f"Loaded Profile: {about_info.get('name')} | Email: {about_info.get('email')}")
    projs = get_projects()
    print(f"Loaded {len(projs)} projects:")
    for pr in projs:
        print(f" - {pr.get('title')}")
    print(f"Loaded {len(get_certifications())} certifications.")
    print("Grounding context sample length:", len(build_grounded_context()))
