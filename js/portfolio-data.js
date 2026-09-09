/**
 * Ayush Kumar Ray - Centralized Dynamic Portfolio Data & Renderer
 * Single Source of Truth for Portfolio Frontend & Future AI Agent Backend
 *
 * Conforms to verified credentials, verified GitHub (rayayush7204-ctrl), and verified LinkedIn.
 * Strict UI/UX Preservation: Consumes existing CSS classes and DOM structures without altering styles.
 */

const portfolioData = {
    personal: {
        name: "Ayush Kumar Ray",
        headline: "Software Engineer | Java | C++ | DSA | Software Architecture | IoT",
        title: "Software Engineer · AI/ML · Full-Stack Developer",
        subHeadline: "Distributed Systems & Intelligent Applications",
        shortBio: "Software Engineer specializing in Java, C++, DSA, Software Architecture, Distributed Systems, and IoT.",
        fullBio: "I'm Ayush Kumar Ray, a CSE student at Parul University (2023–2027) with hands-on expertise in Software Engineering, Distributed Systems, Real-Time Backends, and AI/ML. I have built fault-tolerant backend architectures (FastAPI, PostgreSQL/PostGIS, Redis, Firebase) and an IoT accident-detection pipeline (Arduino/Raspberry Pi, MQTT). Strong foundation in Object-Oriented Design, Software Architecture, Digital Systems, and Operating Systems, with hands-on experience translating requirements into modular, production-ready code.",
        email: "rayayush7204@gmail.com",
        phone: "+91 7488435400",
        location: "Vadodara, Gujarat, India",
        availability: "Open to relocation and full-time/in-office roles",
        resumePdf: "Latest Rsume.pdf",
        links: {
            github: "https://github.com/rayayush7204-ctrl",
            linkedin: "https://www.linkedin.com/in/ayush-kumar-ray-990399219/",
            email: "mailto:rayayush7204@gmail.com",
            lifepulseLive: "https://lifepulse-ai-by-ayush-ray.vercel.app",
            fraudRadarLive: "https://anand-singh-git-hub-fraud-radar-appmain-b2fgwv.streamlit.app/"
        },
        stats: {
            dsaSolved: "250+",
            restApisBuilt: "20+",
            certificationsCount: "7+"
        }
    },

    education: [
        {
            institution: "Parul University",
            degree: "Bachelor of Technology (B.Tech) in Computer Science and Engineering",
            location: "Vadodara, Gujarat",
            dates: "2023–2027",
            cgpa: "7.80 / 10",
            coursework: [
                "Data Structures & Algorithms",
                "Object-Oriented Programming",
                "Operating Systems",
                "Computer Networks",
                "Digital Systems",
                "Software Engineering",
                "Distributed Systems",
                "Database Management Systems",
                "System Design Fundamentals"
            ]
        }
    ],

    // STRICT PROJECT ORDER:
    // 1. LifePulse AI – Smart Blood Donation Network
    // 2. Emergency Response & Hospital Coordination Platform
    // 3. Credit Card Fraud Detection / Fraud Radar
    projects: [
        {
            id: "lifepulse-ai",
            priority: 1,
            year: "2026",
            title: "LifePulse AI – Smart Blood Donation Network",
            category: "Emergency Healthcare / Real-Time Systems / Intelligent Geospatial Routing",
            tagline: "AI-Powered Smart Blood Donor Matching & Real-Time Tracking Network",
            whatBuilt: "Built and deployed a full-stack emergency blood donation platform that matches eligible nearby donors with urgent requests using blood-group compatibility, donor eligibility, availability, geographic proximity, and ring-based escalation.",
            techImplementation: "Designed a geospatial distance and blood-type scoring algorithm for emergency donor-ranking. Implemented real-time push notifications via Firebase Cloud Messaging and live GPS donor tracking using Browser Geolocation API and WebSockets. Integrated road-based ETA via OSRM, normalized database schemas with spatial PostGIS indexing, and tuned Redis caching for sub-second responses under load while strictly enforcing a 56-day donor recovery period.",
            importantResult: "Sub-second donor dispatch latency and 100% reliable real-time tracking across WebSockets and Firebase fallbacks.",
            workflow: [
                "Emergency Request",
                "Eligible Donor Matching",
                "Donor Dispatch",
                "Donor Accepts",
                "Live GPS Tracking",
                "Arrival",
                "Donation",
                "Completion"
            ],
            technologies: [
                "FastAPI",
                "React",
                "PostgreSQL/PostGIS",
                "Redis",
                "WebSockets",
                "Firebase Cloud Messaging",
                "OSRM"
            ],
            links: {
                live: "https://lifepulse-ai-by-ayush-ray.vercel.app",
                github: "https://github.com/rayayush7204-ctrl/LifePulse-AI"
            },
            image: "images/projects/lifepulse/Screenshot_28-8-2026_205113_lifepulse-ai-by-ayush-ray.vercel.app.jpeg"
        },
        {
            id: "emergency-response",
            priority: 2,
            year: "2026",
            title: "Emergency Response & Hospital Coordination Platform",
            category: "IoT / Distributed Systems / Fault-Tolerant Backend",
            tagline: "Automated Accident-Detection & Fault-Tolerant Hospital Coordination",
            whatBuilt: "An IoT accident-detection system using Arduino/Raspberry Pi airbag-crash sensors that streams sensor data to the backend through MQTT/HTTP with zero manual reporting delay.",
            techImplementation: "Architected a fault-tolerant hospital coordination backend across 20+ decoupled REST API endpoints using FastAPI, PostgreSQL/PostGIS for geospatial queries, and WebSockets/Firebase for real-time synchronization. Sustained correct hospital matching during partial outages, achieving zero incorrect routing in failure simulations. Applied modular object-oriented design and comprehensive pytest unit and integration test suites.",
            importantResult: "Achieved zero incorrect routing in failure simulations, utilizing PostgreSQL/PostGIS indexing to optimize geospatial query performance.",
            workflow: [
                "Crash Sensor Trigger",
                "MQTT / HTTP Telemetry",
                "Fault-Tolerant Routing",
                "Hospital Bed Matching",
                "Real-Time WebSocket Sync",
                "Emergency Dispatch"
            ],
            technologies: [
                "FastAPI",
                "PostgreSQL/PostGIS",
                "Redis",
                "WebSockets",
                "Firebase",
                "Arduino",
                "Raspberry Pi",
                "MQTT",
                "pytest"
            ],
            links: {
                github: "https://github.com/rayayush7204-ctrl"
            },
            image: "images/projects/emergency-response.jpg"
        },
        {
            id: "fraud-radar",
            priority: 3,
            year: "2024–2025",
            title: "Credit Card Fraud Detection / Fraud Radar",
            category: "Machine Learning / Deep Learning / Explainable AI",
            tagline: "Hybrid Deep Learning Autoencoder & Random Forest with SHAP Explainability",
            whatBuilt: "A production-grade hybrid fraud detection system tackling severe class imbalance across 284,807 Kaggle credit card transactions (0.17% fraud rate), featuring instant fraud scoring and full transparency via SHAP feature attributions.",
            techImplementation: "Engineered a deep neural Autoencoder compressing 30 numerical features down to 12 latent representations, concatenating latent features and reconstruction errors into a 43-dimensional vector. Trained an optimized Random Forest classifier achieving 0.977 ROC-AUC, 0.817 PR-AUC, and 0.80 F1-Score (Precision 0.78, Recall 0.83, MCC 0.802). Integrated TreeExplainer SHAP plots for real-time local decision attribution and batch evaluation.",
            importantResult: "0.977 ROC-AUC and 0.80 F1-score with interpretable SHAP explanations for regulatory compliance.",
            workflow: [
                "Transaction Ingestion",
                "StandardScaler Normalization",
                "Autoencoder Compression",
                "43-Dim Feature Vector",
                "Random Forest Prediction",
                "SHAP TreeExplainer Attribution"
            ],
            technologies: [
                "Python",
                "Streamlit",
                "Scikit-learn",
                "TensorFlow/Keras",
                "SHAP",
                "Docker",
                "Pandas",
                "NumPy"
            ],
            links: {
                live: "https://anand-singh-git-hub-fraud-radar-appmain-b2fgwv.streamlit.app/",
                github: "https://github.com/rayayush7204-ctrl/Fraud-Radar"
            },
            image: "images/projects/fraud-radar.jpg"
        }
    ],

    // Centralized skills map grouped by category
    skills: {
        "Languages": [
            "Java",
            "C++",
            "Python",
            "JavaScript",
            "TypeScript",
            "SQL"
        ],
        "Systems & Architecture": [
            "Object-Oriented Design",
            "Software Architecture",
            "Distributed Systems",
            "Fault-Tolerant Design",
            "SDLC",
            "Design Patterns",
            "Clean Architecture"
        ],
        "Backend & APIs": [
            "RESTful APIs",
            "WebSockets",
            "Event-Driven Architecture",
            "FastAPI",
            "SQLAlchemy",
            "Pydantic",
            "JWT Auth",
            "Concurrent/Async Processing"
        ],
        "Data & Cloud": [
            "PostgreSQL/PostGIS",
            "MySQL",
            "Redis",
            "AWS EC2",
            "AWS S3",
            "AWS RDS",
            "Docker",
            "CI/CD"
        ],
        "AI / ML": [
            "Deep Learning Autoencoders",
            "Random Forest",
            "Scikit-learn",
            "TensorFlow/Keras",
            "SHAP",
            "Pandas",
            "NumPy",
            "Model Evaluation",
            "ROC-AUC",
            "PR-AUC"
        ],
        "IoT & Embedded": [
            "Arduino",
            "Raspberry Pi",
            "MQTT",
            "Sensor Integration",
            "Digital Systems"
        ],
        "Testing & QA": [
            "Test Plan Development",
            "System Testing",
            "Unit Testing",
            "Integration Testing",
            "pytest",
            "Load Testing",
            "Code Review"
        ],
        "Web": [
            "React.js",
            "Next.js",
            "HTML5",
            "CSS3",
            "Tailwind CSS"
        ],
        "Developer Tools": [
            "Git",
            "GitHub",
            "Visual Studio IDE",
            "MS Office"
        ]
    },

    // Strict Certifications List (Verified 7 Certifications in exact order)
    certifications: [
        {
            id: "aws-cloud-foundations",
            title: "AWS Academy Graduate – Cloud Foundations",
            issuer: "Amazon Web Services (AWS)",
            image: "images/certs/AWS.png",
            credentialUrl: "images/certs/AWS.png"
        },
        {
            id: "ibm-ai-fundamentals",
            title: "Artificial Intelligence Fundamentals",
            issuer: "IBM SkillsBuild",
            image: "images/certs/IBM.png",
            credentialUrl: "images/certs/IBM.png"
        },
        {
            id: "servicenow-csa",
            title: "ServiceNow Certified System Administrator (CSA)",
            issuer: "ServiceNow",
            image: "images/certs/ServiceNow CSA.png",
            credentialUrl: "images/certs/ServiceNow CSA.png"
        },
        {
            id: "servicenow-cad",
            title: "ServiceNow Certified Application Developer (CAD)",
            issuer: "ServiceNow",
            image: "images/certs/ServiceNow CAD.png",
            credentialUrl: "images/certs/ServiceNow CAD.png"
        },
        {
            id: "nvidia-agentic-ai",
            title: "Building Agentic AI Applications with LLMs",
            issuer: "NVIDIA",
            image: "images/certs/Building Agentic Ai with LLMs.png",
            credentialUrl: "images/certs/Building Agentic Ai with LLMs.png"
        },
        {
            id: "nvidia-rag-agents",
            title: "Building RAG Agents with LLMs",
            issuer: "NVIDIA",
            image: "images/certs/Building Rag Agent with LLMs.png",
            credentialUrl: "images/certs/Building Rag Agent with LLMs.png"
        },
        {
            id: "smart-coder-bronze",
            title: "Smart Coder (Bronze)",
            issuer: "Smart Interviews",
            image: "images/certs/SmartInterviews.png",
            credentialUrl: "images/certs/SmartInterviews.png"
        }
    ],

    // Strict Achievements (Verified 4 Achievements)
    achievements: [
        {
            year: "2024–2026",
            title: "250+ DSA problems solved in Java/C++",
            issuer: "LeetCode • CodeChef • HackerRank • Smart Interviews",
            description: "Solved 250+ Data Structures & Algorithms problems with deep focus on Trees, Graphs, Dynamic Programming, Greedy, Heaps, Hashing, Recursion, Backtracking, Binary Search, and Complexity Analysis."
        },
        {
            year: "2025–2026",
            title: "20+ REST APIs built",
            issuer: "FastAPI • PostgreSQL • PostGIS • Redis",
            description: "Architected fault-tolerant, scalable RESTful microservices and backend endpoints with real-time WebSocket synchronization, GIS indexing, and caching."
        },
        {
            year: "2024",
            title: "Smart Coder (Bronze)",
            issuer: "Smart Interviews",
            description: "Certified for algorithmic problem solving and data structures mastery through rigorous timed programming assessments."
        },
        {
            year: "2024–2026",
            title: "7+ industry certifications",
            issuer: "AWS • ServiceNow • NVIDIA • IBM • Smart Interviews",
            description: "Verified certifications spanning Cloud Computing (AWS), Enterprise Systems (ServiceNow CSA & CAD), Generative AI & Agentic Systems (NVIDIA), and AI Fundamentals (IBM)."
        }
    ],

    // Centralized Links
    links: {
        linkedin: "https://www.linkedin.com/in/ayush-kumar-ray-990399219/",
        github: "https://github.com/rayayush7204-ctrl",
        email: "mailto:rayayush7204@gmail.com",
        lifepulseLive: "https://lifepulse-ai-by-ayush-ray.vercel.app",
        fraudRadarLive: "https://anand-singh-git-hub-fraud-radar-appmain-b2fgwv.streamlit.app/",
        resume: "Latest Rsume.pdf"
    },

    // Experience timeline (maintains about.html hands-on timeline)
    experience: [
        {
            year: "2026",
            title: "LifePulse AI – Smart Blood Donation Network",
            role: "Full-Stack & Systems Engineer",
            category: "Emergency Healthcare / Real-Time Systems / Intelligent Geospatial Routing",
            description: "Built and deployed a full-stack emergency blood donation platform that matches eligible nearby donors with urgent requests using blood-group compatibility, donor eligibility, availability, geographic proximity, and ring-based escalation. Implemented real-time emergency notifications via Firebase, live GPS tracking, road-based ETA via OSRM, and end-to-end donation lifecycle management. Enforces a strict 56-day donor recovery period.",
            badges: ["FastAPI", "React", "PostgreSQL/PostGIS", "Redis", "WebSockets", "Firebase Cloud Messaging", "OSRM"],
            links: {
                live: "https://lifepulse-ai-by-ayush-ray.vercel.app",
                github: "https://github.com/rayayush7204-ctrl/LifePulse-AI"
            }
        },
        {
            year: "2026",
            title: "Emergency Response & Hospital Coordination Platform",
            role: "Backend & IoT Systems Engineer",
            category: "IoT / Distributed Systems / Fault-Tolerant Backend",
            description: "An IoT accident-detection system using Arduino/Raspberry Pi airbag-crash sensors that streams sensor data to the backend through MQTT/HTTP. Designed a fault-tolerant hospital coordination backend across 20+ decoupled API endpoints. Achieved zero incorrect routing in failure simulations, utilizing PostgreSQL/PostGIS indexing to optimize geospatial query performance.",
            badges: ["FastAPI", "PostgreSQL/PostGIS", "Redis", "WebSockets", "Firebase", "Arduino", "Raspberry Pi", "MQTT", "pytest"],
            links: {
                github: "https://github.com/rayayush7204-ctrl"
            }
        },
        {
            year: "2024–2025",
            title: "Credit Card Fraud Detection / Fraud Radar",
            role: "Machine Learning Engineer",
            category: "Machine Learning / Deep Learning / Explainable AI",
            description: "Developed a hybrid fraud detection model combining a deep learning autoencoder with Random Forest on 284,807 transactions (0.17% fraud rate). Tuned decision threshold achieving 0.977 ROC-AUC, 0.817 PR-AUC, and 0.80 F1-Score. Integrated SHAP TreeExplainer for transparent feature attribution in fintech compliance.",
            badges: ["Python", "Streamlit", "Scikit-learn", "TensorFlow/Keras", "SHAP", "Docker", "Pandas", "NumPy"],
            links: {
                live: "https://anand-singh-git-hub-fraud-radar-appmain-b2fgwv.streamlit.app/",
                github: "https://github.com/rayayush7204-ctrl/Fraud-Radar"
            }
        }
    ]
};

// ==========================================
// ACCESSOR METHODS FOR AGENT TOOLS & MODULES
// ==========================================

function getAbout() {
    return {
        name: portfolioData.personal.name,
        headline: portfolioData.personal.headline,
        bio: portfolioData.personal.fullBio || portfolioData.personal.shortBio,
        location: portfolioData.personal.location,
        availability: portfolioData.personal.availability,
        email: portfolioData.personal.email,
        phone: portfolioData.personal.phone,
        links: portfolioData.links,
        stats: portfolioData.personal.stats
    };
}

function getProjects() {
    return portfolioData.projects;
}

function getProject(name) {
    if (!name) return null;
    const query = String(name).toLowerCase().trim();
    return portfolioData.projects.find(p =>
        (p.id && p.id.toLowerCase() === query) ||
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.tagline && p.tagline.toLowerCase().includes(query))
    ) || null;
}

function getSkills() {
    return portfolioData.skills;
}

function getCertifications() {
    return portfolioData.certifications;
}

function getEducation() {
    return portfolioData.education;
}

function getAchievements() {
    return portfolioData.achievements;
}

// Bind accessors directly to portfolioData
portfolioData.getAbout = getAbout;
portfolioData.getProjects = getProjects;
portfolioData.getProject = getProject;
portfolioData.getSkills = getSkills;
portfolioData.getCertifications = getCertifications;
portfolioData.getEducation = getEducation;
portfolioData.getAchievements = getAchievements;

// Compatible uppercase reference
const PortfolioData = portfolioData;

// ==========================================
// DYNAMIC DOM RENDERERS (Strict UI/UX Preservation)
// ==========================================

PortfolioData.renderProjects = function () {
    const projectsContainer = document.getElementById("dynamic-projects-container");
    if (!projectsContainer || !PortfolioData.projects) return;

    projectsContainer.innerHTML = PortfolioData.projects.map((proj, idx) => {
        const isReverse = idx % 2 === 1 ? "reverse" : "";
        const techPills = (proj.technologies || []).map(t => `<span class="tech-pill">${t}</span>`).join("\n");

        let workflowHtml = "";
        if (proj.workflow && proj.workflow.length > 0) {
            const steps = proj.workflow.map(w => `<div class="workflow-step">${w}</div>`).join('<div class="workflow-arrow">→</div>');
            workflowHtml = `
                <div class="proj-workflow">
                    ${steps}
                </div>
            `;
        }

        let actionBtns = "";
        if (proj.links && proj.links.live) {
            actionBtns += `
                <a href="${proj.links.live}" target="_blank" class="proj-btn">
                    <i class="iconoir-globe"></i> Live Demo
                </a>
            `;
        }
        if (proj.links && proj.links.github) {
            actionBtns += `
                <a href="${proj.links.github}" target="_blank" class="proj-btn proj-btn-outline">
                    <i class="iconoir-github"></i> GitHub
                </a>
            `;
        }

        return `
            <div class="proj-card ${isReverse}" data-aos="fade-up">
                <div class="proj-content">
                    <div class="proj-year">${proj.year}</div>
                    <div class="proj-title">${proj.title}</div>
                    <div class="proj-cat">${proj.category}</div>

                    <div class="proj-desc">
                        <strong>WHAT I BUILT</strong><br>
                        ${proj.whatBuilt}<br><br>

                        <strong>KEY TECHNICAL IMPLEMENTATION</strong><br>
                        ${proj.techImplementation}<br><br>

                        <strong>IMPORTANT RESULT</strong><br>
                        ${proj.importantResult}

                        ${workflowHtml}
                    </div>

                    <div class="proj-tech">
                        ${techPills}
                    </div>

                    <div class="proj-actions">
                        ${actionBtns}
                    </div>
                </div>
                <div class="proj-image-wrapper">
                    <img src="${proj.image}" alt="${proj.title}">
                </div>
            </div>
        `;
    }).join("\n");
};

PortfolioData.renderCertifications = function () {
    const certsContainer = document.getElementById("dynamic-certs-container");
    if (!certsContainer || !PortfolioData.certifications) return;

    certsContainer.innerHTML = PortfolioData.certifications.map(cert => `
        <div data-aos="zoom-in" class="flex-1">
            <div class="project-item shadow-box">
                <a class="overlay-link" href="${cert.credentialUrl}" target="_blank"></a>
                <img src="images/extras/bg1.png" alt="BG" class="bg-img">
                <div class="project-img">
                    <img src="${cert.image}" alt="${cert.title}">
                </div>
                <div class="d-flex align-items-center justify-content-between">
                    <div class="project-info">
                        <p>${cert.issuer}</p>
                        <h1>${cert.title}</h1>
                    </div>
                    <a href="${cert.credentialUrl}" class="project-btn" target="_blank">
                        <img src="images/extras/icon.svg" alt="Button">
                    </a>
                </div>
            </div>
        </div>
    `).join("\n");
};

PortfolioData.renderExperience = function () {
    const expContainer = document.getElementById("dynamic-experience-container");
    if (!expContainer || !PortfolioData.experience) return;

    expContainer.innerHTML = PortfolioData.experience.map(exp => {
        let linksHtml = "";
        if (exp.links) {
            const btns = [];
            if (exp.links.live) {
                btns.push(`<a href="${exp.links.live}" target="_blank" class="badge" style="background: var(--neon-blue); color: black; font-weight: 600; text-decoration: none; padding: 6px 14px; font-size: 0.8rem;">🌐 Live Demo</a>`);
            }
            if (exp.links.github) {
                btns.push(`<a href="${exp.links.github}" target="_blank" class="badge" style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.3); color: white; text-decoration: none; padding: 6px 14px; font-size: 0.8rem;">🐙 GitHub Repo</a>`);
            }
            if (btns.length > 0) {
                linksHtml = `<div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">${btns.join("\n")}</div>`;
            }
        }

        return `
        <div class="exp-card" data-aos="fade-right">
            <h4>${exp.year}</h4>
            <h3><span class="icon">💻</span>${exp.title}</h3>
            <h5>${exp.category}</h5>
            <p>${exp.description}</p>
            <div class="badge-box">
                ${(exp.badges || []).map(b => `<span class="badge">${b}</span>`).join("\n")}
            </div>
            ${linksHtml}
        </div>
        `;
    }).join("\n");
};

PortfolioData.renderSkills = function () {
    const skillsContainer = document.getElementById("dynamic-skills-container");
    if (!skillsContainer || !PortfolioData.skills) return;

    let entries = [];
    if (Array.isArray(PortfolioData.skills)) {
        entries = PortfolioData.skills.map(s => [s.category, Array.isArray(s.items) ? s.items.join(", ") : s.items]);
    } else if (typeof PortfolioData.skills === "object") {
        entries = Object.entries(PortfolioData.skills).map(([cat, items]) => [
            cat,
            Array.isArray(items) ? items.join(", ") : String(items)
        ]);
    }

    skillsContainer.innerHTML = entries.map(([category, itemsStr]) => `
        <div class="skill-box" data-aos="zoom-in">
            <span class="percent">${itemsStr}</span>
            <h3>${category}</h3>
        </div>
    `).join("\n");
};

PortfolioData.renderEducation = function () {
    const eduContainer = document.getElementById("dynamic-education-container");
    if (!eduContainer || !PortfolioData.education) return;

    eduContainer.innerHTML = PortfolioData.education.map(edu => {
        const courseworkStr = Array.isArray(edu.coursework) ? edu.coursework.join(", ") : (edu.coursework || "");
        return `
        <div class="edu-card" data-aos="zoom-in">
            <h4>${edu.dates}</h4>
            <h3>${edu.degree}</h3>
            <h5>${edu.institution}, ${edu.location} — CGPA: ${edu.cgpa}</h5>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 8px;">Relevant Coursework: ${courseworkStr}</p>
        </div>
        `;
    }).join("\n");
};

PortfolioData.renderAwards = function () {
    const awardsContainer = document.getElementById("dynamic-awards-container");
    if (!awardsContainer || !PortfolioData.achievements) return;

    awardsContainer.innerHTML = PortfolioData.achievements.map((aw, i) => `
        <div class="awards-box" data-aos="zoom-in" style="${i > 0 ? 'margin-top: 15px;' : ''}">
            <span>${aw.year || ''}</span>
            <h3>${aw.title}${aw.issuer ? ' — ' + aw.issuer : ''}</h3>
            <p>${aw.description || aw.detail || ''}</p>
        </div>
    `).join("\n");
};

PortfolioData.renderAll = function () {
    PortfolioData.renderProjects();
    PortfolioData.renderCertifications();
    PortfolioData.renderExperience();
    PortfolioData.renderSkills();
    PortfolioData.renderEducation();
    PortfolioData.renderAwards();

    if (typeof AOS !== "undefined" && AOS.refresh) {
        AOS.refresh();
    }
};

// Helper methods for dynamic data extension
PortfolioData.addProject = function (project) {
    PortfolioData.projects.push(project);
    PortfolioData.renderProjects();
    if (typeof AOS !== "undefined" && AOS.refresh) AOS.refresh();
};

PortfolioData.addCertification = function (cert) {
    PortfolioData.certifications.push(cert);
    PortfolioData.renderCertifications();
    if (typeof AOS !== "undefined" && AOS.refresh) AOS.refresh();
};

PortfolioData.addExperience = function (exp) {
    PortfolioData.experience.push(exp);
    PortfolioData.renderExperience();
    if (typeof AOS !== "undefined" && AOS.refresh) AOS.refresh();
};

PortfolioData.addSkill = function (category, items) {
    if (typeof PortfolioData.skills === "object" && !Array.isArray(PortfolioData.skills)) {
        PortfolioData.skills[category] = items;
    }
    PortfolioData.renderSkills();
    if (typeof AOS !== "undefined" && AOS.refresh) AOS.refresh();
};

// Auto-run in browser environment
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            PortfolioData.renderAll();
        });
    } else {
        PortfolioData.renderAll();
    }
}

// Global exposure for browser
if (typeof window !== "undefined") {
    window.portfolioData = portfolioData;
    window.PortfolioData = portfolioData;
    window.getAbout = getAbout;
    window.getProjects = getProjects;
    window.getProject = getProject;
    window.getSkills = getSkills;
    window.getCertifications = getCertifications;
    window.getEducation = getEducation;
    window.getAchievements = getAchievements;
}

// Global exposure for CommonJS / Node / agent tools
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        portfolioData,
        PortfolioData,
        getAbout,
        getProjects,
        getProject,
        getSkills,
        getCertifications,
        getEducation,
        getAchievements
    };
}
