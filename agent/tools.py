"""
tools.py - Portfolio Agent Tools

Defines read-only information tools and action tools for Ayush Kumar Ray's portfolio.
All data is sourced from js/portfolio-data.js via portfolio_loader (single source of truth).

Tools return JSON-serializable dicts. Action tools return structured action payloads
that the future frontend will execute — the backend never performs browser actions.

SECURITY: Only predefined portfolio URLs/routes are allowed. Arbitrary URLs are rejected.
"""

import json
from typing import Optional
from langchain_core.tools import tool

from agent.portfolio_loader import (
    get_about as _get_about,
    get_projects as _get_projects,
    get_project as _get_project,
    get_skills as _get_skills,
    get_certifications as _get_certifications,
    get_education as _get_education,
    get_achievements as _get_achievements,
)


# =============================================================================
# ALLOWED NAVIGATION TARGETS (whitelisted portfolio routes)
# =============================================================================
ALLOWED_NAV_TARGETS = {
    "contact": "contact.html",
    "about": "about.html",
    "works": "works.html",
    "projects": "works.html",
    "certifications": "certifications.html",
    "home": "index.html",
    "index": "index.html",
    "blogs": "blogs.html",
    "youtube": "youtube.html",
    "reports": "reports.html",
}


# =============================================================================
# READ-ONLY INFORMATION TOOLS
# =============================================================================

@tool
def get_about() -> str:
    """Get Ayush Kumar Ray's personal bio, contact info, location, headline, links, and key stats. Use this when the user asks about who Ayush is, his background, contact details, email, phone, GitHub, LinkedIn, or availability."""
    data = _get_about()
    return json.dumps(data, ensure_ascii=False, indent=2)


@tool
def get_projects() -> str:
    """Get the full list of all portfolio projects with titles, technologies, descriptions, and links. Use this when the user asks about Ayush's projects in general, or wants to see all projects."""
    projects = _get_projects()
    summary = []
    for p in projects:
        summary.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "year": p.get("year"),
            "category": p.get("category"),
            "tagline": p.get("tagline"),
            "technologies": p.get("technologies", []),
            "links": p.get("links", {}),
        })
    return json.dumps(summary, ensure_ascii=False, indent=2)


@tool
def get_project(project_name: str) -> str:
    """Get detailed information about a specific project by name. Use this when the user asks about a particular project like LifePulse AI, Emergency Response, or Fraud Radar. Supports natural variations like 'LifePulse', 'blood donation', 'fraud radar', 'IoT project', etc."""
    proj = _get_project(project_name)
    if proj:
        return json.dumps(proj, ensure_ascii=False, indent=2)
    return json.dumps({"error": f"No project found matching '{project_name}'. Available projects: LifePulse AI, Emergency Response & Hospital Coordination Platform, Credit Card Fraud Detection / Fraud Radar."})


@tool
def get_skills() -> str:
    """Get Ayush's categorized skills and technical stack (languages, backend, cloud, AI/ML, IoT, etc.). Use this when the user asks about Ayush's skills, technologies, or technical expertise."""
    data = _get_skills()
    return json.dumps(data, ensure_ascii=False, indent=2)


@tool
def get_certifications() -> str:
    """Get the list of all verified certifications with titles and issuing organizations. Use this when the user asks about Ayush's certifications or credentials."""
    data = _get_certifications()
    return json.dumps(data, ensure_ascii=False, indent=2)


@tool
def get_education() -> str:
    """Get Ayush's education details including degree, university, CGPA, dates, and coursework. Use this when the user asks about Ayush's education, university, degree, or CGPA."""
    data = _get_education()
    return json.dumps(data, ensure_ascii=False, indent=2)


@tool
def get_achievements() -> str:
    """Get Ayush's key achievements including DSA problems solved, APIs built, and certifications earned. Use this when the user asks about Ayush's accomplishments or achievements."""
    data = _get_achievements()
    return json.dumps(data, ensure_ascii=False, indent=2)


# =============================================================================
# ACTION TOOLS — return structured action payloads for the frontend
# =============================================================================

@tool
def open_project(project_name: str) -> str:
    """Open the live demo page for a specific project. Use this when the user says 'open', 'show me', 'launch', or 'go to' a specific project. This opens the live demo URL if available, otherwise the GitHub page."""
    proj = _get_project(project_name)
    if not proj:
        return json.dumps({
            "response": f"I couldn't find a project called '{project_name}'. Available projects are: LifePulse AI, Emergency Response & Hospital Coordination Platform, and Credit Card Fraud Detection / Fraud Radar.",
            "action": None
        })
    links = proj.get("links", {})
    url = links.get("live") or links.get("github")
    title = proj.get("title", project_name)
    if url:
        return json.dumps({
            "response": f"Opening {title}.",
            "action": {"type": "open_url", "url": url}
        })
    return json.dumps({
        "response": f"No live demo or link available for {title}.",
        "action": None
    })


@tool
def open_github(project_name: str) -> str:
    """Open the GitHub repository page for a specific project. Use this when the user asks to see the GitHub repo, source code, or code repository for a project."""
    proj = _get_project(project_name)
    if not proj:
        return json.dumps({
            "response": f"I couldn't find a project called '{project_name}'. Available projects are: LifePulse AI, Emergency Response & Hospital Coordination Platform, and Credit Card Fraud Detection / Fraud Radar.",
            "action": None
        })
    links = proj.get("links", {})
    url = links.get("github")
    title = proj.get("title", project_name)
    if url:
        return json.dumps({
            "response": f"Opening the GitHub repository for {title}.",
            "action": {"type": "open_url", "url": url}
        })
    return json.dumps({
        "response": f"No GitHub link available for {title}.",
        "action": None
    })


@tool
def open_live_demo(project_name: str) -> str:
    """Open the live demo for a specific project. Use this when the user explicitly asks to see the live demo, deployed version, or live site of a project."""
    proj = _get_project(project_name)
    if not proj:
        return json.dumps({
            "response": f"I couldn't find a project called '{project_name}'. Available projects are: LifePulse AI, Emergency Response & Hospital Coordination Platform, and Credit Card Fraud Detection / Fraud Radar.",
            "action": None
        })
    links = proj.get("links", {})
    url = links.get("live")
    title = proj.get("title", project_name)
    if url:
        return json.dumps({
            "response": f"Opening the live demo for {title}.",
            "action": {"type": "open_url", "url": url}
        })
    return json.dumps({
        "response": f"No live demo is available for {title}. It may only have a GitHub repository.",
        "action": None
    })


@tool
def open_resume() -> str:
    """Open Ayush's resume/CV PDF. Use this when the user asks to see, open, view, or download the resume or CV."""
    about = _get_about()
    links = about.get("links", {})
    resume_path = links.get("resume", "Latest Rsume.pdf")
    return json.dumps({
        "response": "Opening Ayush's resume.",
        "action": {"type": "open_url", "url": resume_path}
    })


@tool
def go_to_contact() -> str:
    """Navigate to the Contact page of the portfolio. Use this when the user says 'take me to contact', 'go to contact', 'contact page', or wants to reach out."""
    return json.dumps({
        "response": "Taking you to the contact page.",
        "action": {"type": "navigate", "target": "contact"}
    })


@tool
def go_to_about() -> str:
    """Navigate to the About page of the portfolio. Use this when the user says 'take me to about', 'go to about', or 'show about page'."""
    return json.dumps({
        "response": "Taking you to the about page.",
        "action": {"type": "navigate", "target": "about"}
    })


@tool
def go_to_works() -> str:
    """Navigate to the Projects/Works page of the portfolio. Use this when the user says 'show projects', 'go to works', 'take me to projects', or similar."""
    return json.dumps({
        "response": "Taking you to the projects page.",
        "action": {"type": "navigate", "target": "works"}
    })


@tool
def go_to_certifications() -> str:
    """Navigate to the Certifications page of the portfolio. Use this when the user says 'go to certifications', 'show certifications page', or 'take me to certs'."""
    return json.dumps({
        "response": "Taking you to the certifications page.",
        "action": {"type": "navigate", "target": "certifications"}
    })


# =============================================================================
# TOOL REGISTRY
# =============================================================================

ALL_TOOLS = [
    # Read-only information tools
    get_about,
    get_projects,
    get_project,
    get_skills,
    get_certifications,
    get_education,
    get_achievements,
    # Action tools
    open_project,
    open_github,
    open_live_demo,
    open_resume,
    go_to_contact,
    go_to_about,
    go_to_works,
    go_to_certifications,
]

TOOL_MAP = {t.name: t for t in ALL_TOOLS}
