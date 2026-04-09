# Setup Guide

Because Security+ AI uses a local SQLite database and relies on your personal API key, cloning the repository requires a small setup phase to initialize your personal study environment.

## 1. Acquiring an API Key

This application supports multiple AI providers. You can choose any of the following based on your preference or existing accounts:

- **OpenAI**: Get a key from [platform.openai.com](https://platform.openai.com/api-keys).
- **Anthropic Claude**: Get a key from [console.anthropic.com](https://console.anthropic.com/settings/keys).
- **Google Gemini**: Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Copy your chosen key; you will need it during the app configuration.

## 2. Setting up the Syllabus
The application builds its internal database structure from the official SY0-701 objectives. You have two options:
- **Quick Start (Recommended)**: Use the verified `objectives.json` file included in the repo. It's perfectly formatted and works instantly.
- **PDF Upload**: Upload the official CompTIA PDF objectives if you have them. Note: PDF parsing can sometimes be imperfect depending on your OS.

## 3. Setup with Docker (Recommended)

Docker handles all dependencies and environment configuration for you.

1. Ensure you have [Docker](https://www/docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.
2. Initialize your environment file:
   ```bash
   cp .env.example .env
   ```
3. (Optional) Open `.env` and enter your API keys.
4. Launch the application:
   ```bash
   docker-compose up --build -d
   ```
5. Navigate to `http://localhost:3000`.
6. Proceed to the **Setup Wizard** as described below.

## 4. Manual Initialization Walkthrough

Once you have run `npm install` in both the root and `frontend/` directories, start the application:

```bash
# Terminal 1
node backend/server.js

# Terminal 2
cd frontend
npm run dev
```

1. Navigate to `http://localhost:5173`.
2. The UI will detect that the `study.db` file does not exist, or that it is empty, and will redirect you to the Setup Wizard.
3. Click **"Quick Start (Recommended)"**. The backend will instantly seed the 5 major Domains and all subtopics into your local database using the verified syllabus file.
4. Once completed, navigate to the **Settings** page via the sidebar.
5. Select your AI provider, enter your desired model name (e.g. `claude-3-5-sonnet-latest`), paste your API key, and click Save.

Your study environment is now fully active, private, and ready for use.
