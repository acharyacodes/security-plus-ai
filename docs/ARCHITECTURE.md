# Architecture & Logic

This document details how the Security+ AI application processes study sessions, determines mastery, and leverages the Gemini API.

## Data Schema

The foundation of the application is a deeply integrated SQLite schema representing the CompTIA hierarchy:
- **Subsections**: The top-level domains (e.g., Domain 1.0 General Security Concepts).
- **Topics**: The major bullet points within a domain (e.g., 1.1 Compare and contrast...).
- **Subtopics**: The granular individual terms (e.g., Risk Register, Key Escrow).

All tracking is done at the **Subtopic** level.

## The Adaptive Queue System

When a user selects a Domain to study (e.g., Domain 1.0), the application initializes the `AdaptiveQueue`.

1. **Weakness Targeting**: The queue queries the SQLite database for any `subtopics` within that Domain that lack a `mastery_status` of "mastered".
2. **Prioritization**: It prioritizes subtopics with a history of wrong answers or "hard" ratings.
3. **Paging**: It establishes a "current subtopic" and tells the AI to generate a question *only* for that subtopic.

## Artificial Intelligence Generation (`questionGenerator.js`)

Unlike static question banks, we use generative AI to ensure questions cannot be exhausted or memorized.

### The System Prompt
The prompt injected to Gemini is highly structured. It enforces:
- Strictly multiple-choice formatting.
- Strict mapping to CompTIA SY0-701 standards.
- Output strictly in valid JSON format.

### The Historical Context
Before prompting Gemini, the backend queries the `attempts` table. It pulls the last 10 attempts the user made for this specific subtopic and feeds them to the AI.
- If the user keeps failing questions about "Phishing" because they confuse it with "Spear Phishing", that mistake is passed to the AI.
- The AI is instructed to generate a new question that specifically highlights and tests that exact misconception.

## Custom Test Architect

The `CustomBuilder` flow bypasses the standard Domain-level queue.
1. The user manually searches for and selects granular topic IDs across multiple domains.
2. The UI sends an array of topic IDs to `/api/custom/create`.
3. The backend spins up a unique `custom_session_state` table row.
4. The generation loop isolates its focus to only the chosen array of IDs, creating a highly specific, curated drill.

## Deployment & Persistence

The application is designed to be fully self-contained and run locally on the user's machines.

### Local Mode
- **Frontend**: React served via Vite.
- **Backend**: Node.js Express server.
- **Storage**: SQLite file located at `backend/data/study.db`.

### Docker Mode (Recommended)
- **Architecture**: Multi-stage Docker build that bundles the frontend and backend into a single image.
- **Isolation**: Runs as a non-privileged `node` user.
- **Persistence**: Uses Docker Volumes to map `backend/data` and `uploads/` to persistent storage on the host machine, ensuring study history is not lost across container rebuilds.
