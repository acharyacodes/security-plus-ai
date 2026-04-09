# Security+ SY0-701 AI Practice Test & Study Platform

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An adaptive, AI-powered **CompTIA Security+ (SY0-701) practice test** platform that generates unlimited, scenario-based exam questions across all 5 official domains — tailored to your weak spots and tracked entirely offline.

---

## Why This Tool Exists

Static question banks get memorized fast. Once you've seen the same 500 questions a few times, you stop learning and start pattern-matching — which won't cut it on exam day.

This platform uses **Google Gemini AI** to generate fresh, contextual Security+ practice questions on demand, pulling directly from the official CompTIA SY0-701 exam objectives PDF. Every question is new. Every session adapts to what you actually need to work on.

- **Aligned to the official syllabus** — parses the real CompTIA SY0-701 objectives PDF, not a third-party interpretation.
- **Adaptive difficulty** — shifts between definition recall, scenario-based application, and multi-select triage based on your performance history.
- **Weakness targeting** — build custom drills focused on the specific subtopics where your scores are lowest.
- **Fully private** — your API key, answers, and analytics stay in a local SQLite database. Nothing is stored in the cloud except the AI generation request itself.

> The platform gets smarter as you use it. Your first few sessions build the baseline — after that, the question engine starts targeting your real gaps.

---

## How It Works

```text
Start a Study Session or Custom Drill
              │
              ▼
    ┌─────────────────────────┐
    │      Adaptive Queue     │
    │  Identifies mastery     │
    │  gaps & picks a target  │
    │  subtopic for you       │
    └────────────┬────────────┘
                 │
    ┌────────────▼────────────┐
    │   AI Question Engine    │
    │  Sends your mistake     │
    │  history + the exact    │
    │  PDF syllabus to Gemini │
    └────────────┬────────────┘
                 │
         ┌───────┼───────┐
         ▼       ▼       ▼
     Questions  UI   Analytics
   (SQLite DB)       Cache
```

---

## Exam Coverage

All five SY0-701 domains are covered, weighted to match the real exam:

| Domain | Topics | Exam Weight |
|--------|--------|-------------|
| 1.0 General Security Concepts | CIA triad, cryptography, PKI, Zero Trust, physical security | 12% |
| 2.0 Threats, Vulnerabilities & Mitigations | Malware, social engineering, attack vectors, hardening | 22% |
| 3.0 Security Architecture | Cloud models, network infrastructure, resilience, data protection | 18% |
| 4.0 Security Operations | IAM, vulnerability management, incident response, SIEM, automation | 28% |
| 5.0 Security Program Management & Oversight | Governance, risk management, compliance, audits, awareness | 20% |

---

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A free [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/security-plus-ai.git
cd security-plus-ai

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### First-Time Setup

The local database (`study.db`) is excluded from version control to protect your privacy. You'll initialize it on first run.

```bash
# Terminal 1 — start the backend
node backend/server.js

# Terminal 2 — start the frontend
cd frontend && npm run dev
```

1. Open **http://localhost:5173** in your browser.
2. The app will detect no database and redirect you to the `/setup` wizard.
3. Upload your official CompTIA SY0-701 Objectives PDF.
4. Go to **Settings** and paste in your Gemini API key.

That's it. You're ready to start your first practice session.

---

## Features

### Adaptive Study Sessions
The engine tracks every question you've seen and every answer you've given. Over time, it deprioritizes topics you've mastered and increases pressure on your weaker domains — automatically.

### Custom Drills
Select specific subtopics (e.g., "PKI and Certificate Management" or "Incident Response Process") to run targeted practice sets. Useful for cramming right before exam day.

### Performance Analytics
Review your accuracy by domain and subtopic at any time. The dashboard shows you where your time is best spent without requiring you to do the analysis yourself.

### Question Variety
The AI generates three question types based on your mastery level:
- **Definition/recall** — foundational knowledge for new topics
- **Scenario-based** — applied reasoning, closest to real exam format
- **Multi-select triage** — challenges you to identify multiple correct answers under pressure

---

## Project Structure

```text
security-plus-ai/
├── backend/
│   ├── data/             # Local SQLite DB & seeded JSON (gitignored)
│   ├── routes/           # Express API endpoints
│   ├── services/         # Core logic: AI generation, PDF parsing, adaptive queue
│   └── server.js         # Entry point
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI: ProgressBar, QuestionCard, DomainBadge
│       ├── pages/        # Main views: Dashboard, StudySession, CustomDrill, Settings
│       └── index.css     # Global styles
├── docs/
│   ├── SETUP.md          # Detailed initialization walkthrough
│   └── ARCHITECTURE.md   # How the adaptive queue works under the hood
└── .gitignore
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite), Axios, Lucide React |
| Backend | Node.js, Express |
| Database | SQLite3 via `better-sqlite3` |
| AI | Google Gemini via `@google/generative-ai` |

---

## Documentation

- [SETUP.md](./docs/SETUP.md) — Deep dive into first-time configuration and PDF parsing.
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — How the adaptive queue selects questions and tracks mastery.

---

## Disclaimer

This is an open-source, local tool. All data and API keys remain on your machine. Questions are AI-generated interpretations of official CompTIA objectives and are intended to supplement — not replace — certified training materials and official practice exams.

CompTIA Security+ and SY0-701 are trademarks of CompTIA, Inc. This project is not affiliated with or endorsed by CompTIA.

---

## License

MIT — free to use, modify, and distribute.
