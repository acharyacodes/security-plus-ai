# Security+ AI Local Learning App

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An adaptive, AI-powered study platform specifically designed for the **CompTIA Security+ (SY0-701)** exam. Parse official objectives, generate dynamic questions across 5 core domains, and track mastery completely locally.

## What Is This?

Traditional exam practice relies on static question banks that are easily memorized. This platform acts as a command center for active learning by utilizing **Google Gemini AI** to generate highly contextual, never-before-seen questions tailored strictly to the official CompTIA Syllabus.

- **Objective-Driven**: Parses the *actual* CompTIA PDF to build its database syllabus.
- **Adaptive Questioning**: Determines if you need definitions, scenario-based applied knowledge, or multi-select triage questions based on your attempt history.
- **Custom Test Architect**: Allows you to curate elite "mixed-bag" drills by selecting specific subtopics where you are statistically weakest.
- **Data Privacy**: Your API key, your study progress, and your analytics are stored in a fully offline SQLite database. Nothing touches the cloud except the raw API generation request.

*Important:* The system will initially seem "raw." As you answer questions, the local SQLite database profiles your strengths and weaknesses. The more you use it, the smarter the subsequent AI question generations become.

## How It Works

```text
You start a Study Session or Custom Drill
     │
     ▼
┌─────────────────────────────────┐
│        Adaptive Queue           │
│ Defines mastery gaps & selects  │
│      the target subtopic        │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│     AI Question Generator       │
│ Prompts Gemini with historical  │
│  mistakes & exact PDF syllabus  │    
└───────────────┬─────────────────┘
                │
          ┌─────┼─────┐
          ▼     ▼     ▼
     Questions  UI   Analytics
   (SQLite DB)       Cache
```

## Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/security-plus-ai.git
cd security-plus-ai

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. First-Time Setup
Because the database (`study.db`) is strictly excluded from version control for your privacy, you must initialize the content yourself.

```bash
# Start the backend server
node backend/server.js

# In a separate terminal, start the frontend
cd frontend
npm run dev
```
1. Open `http://localhost:5173` in your browser.
2. The system will detect a missing database and redirect you to the **`/setup`** wizard.
3. Upload your official CompTIA SY0-701 Objectives PDF.
4. Go to **Settings** and securely paste your Gemini AI API Key.

## Project Structure

```text
security-plus-ai/
├── backend/
│   ├── data/             # Your local SQLite DB & seeded JSON (gitignored)
│   ├── routes/           # Express API endpoints
│   ├── services/         # Core logic (AI Generation, PDF Parsing)
│   └── server.js         # Entry point
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/   # Reusable UI elements (ProgressBar, Cards)
│   │   ├── pages/        # Main views (Dashboard, StudySession)
│   │   └── index.css     # Global styling
├── docs/                 # Detailed documentation
└── .gitignore            # Security blacklist
```

## Tech Stack
- **Frontend**: React (Vite), Axios, Lucide-React
- **Backend**: Node.js, Express
- **Database**: SQLite3 (`better-sqlite3`)
- **AI Integration**: `@google/generative-ai`

## Documentation
- [SETUP.md](./docs/SETUP.md) — Deep dive into the initialization process.
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Learn how the Adaptive Queue works under the hood.

## Disclaimer
This is a local, open-source tool. You control your data and API keys. The generated questions are AI interpretations of official objectives and should be used to supplement, not replace, certified training materials.

## License
MIT
