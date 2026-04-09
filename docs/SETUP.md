# Setup Guide

Because Security+ AI uses a local SQLite database and relies on your personal API key, cloning the repository requires a small setup phase to initialize your personal study environment.

## 1. Acquiring an API Key

This application supports multiple AI providers. You can choose any of the following based on your preference or existing accounts:

- **OpenAI**: Get a key from [platform.openai.com](https://platform.openai.com/api-keys).
- **Anthropic Claude**: Get a key from [console.anthropic.com](https://console.anthropic.com/settings/keys).
- **Google Gemini**: Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

Copy your chosen key; you will need it during the app configuration.

## 2. Acquiring the Syllabus
The application builds its internal database structure by parsing the official syllabus.
1. Download the official **CompTIA Security+ SY0-701 Exam Objectives** PDF from the CompTIA website.
2. Keep this PDF handy; you will upload it via the UI.

## 3. Initialization Walkthrough

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
3. Upload the SY0-701 PDF. The backend will parse it, extract the 5 major Domains and all subtopics, and write this hierarchy into your new local database.
4. Once completed, navigate to the **Settings** page via the sidebar.
5. Select your AI provider, enter your desired model name (e.g. `claude-3-5-sonnet-latest`), paste your API key, and click Save.

Your study environment is now fully active, private, and ready for use.
