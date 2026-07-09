# Xasread AI - Medical Consultation Platform

Xasread is an AI-powered medical consultation assistant and medical imaging viewer. The system is designed to help patients and healthcare professionals understand symptoms, analyze medical files (images, PDFs), and generate formatted clinical assessments.

---

## Architecture Overview

The project is structured as a monorepo containing two main parts:
- **Frontend**: A React web application built with Vite and TypeScript. It features a modern user interface with dark/light themes and interactive medical imaging visualizers.
- **Backend**: A FastAPI REST service built with Python. It handles database operations, authentication, session state, and queries Groq API models for AI responses.

The deployment layout is defined in vercel.json, routing api requests to the backend service and client page loads to the frontend service.

---

## Key Features

- **Multi-Mode AI Conversations**: Users can interact with the AI assistant using multiple modes: simple, standard, advanced, concise, and detailed.
- **Response Rephrasing**: Allows rephrasing generated assistant messages to match different comprehension levels (simple, standard, advanced) on-the-fly.
- **Medical Scan Viewer**: Interactive SVG-based image annotator with mouse/touch controls to zoom, pan, and view bounding boxes representing detected scan findings.
- **Clinical Assessment Dashboard**: Side-by-side or tabbed reports containing:
  - ICD-10 diagnostic codes
  - Severity level gauge
  - Differential diagnoses listings (Confirmed, High, Moderate, Low)
  - Vital signs summary (heart rate, blood pressure, etc.)
  - Simplified instructions and next steps for patient readability
- **Flexible Authentication**: Supports secure Google OAuth logins (with JSON Web Tokens) alongside a guest mode that operates using local browser storage.
- **Dynamic Interface**: Custom Vanilla CSS with HSL color tokens for smooth dark/light mode toggles and responsive layouts.

---

## Directory Structure

- **backend/**
  - auth.py: User validation and Google OAuth Callback.
  - chat.py: Core AI response routing with fallback logic across Groq models.
  - config.py: BaseSettings and configuration parser.
  - database.py: Database connection engine and session pool.
  - main.py: API entrypoint and CORS middleware setup.
  - messages.py: Message creation and query logic.
  - models.py: SQLAlchemy database tables (User, Conversation, Message, UserSettings).
  - schemas.py: Pydantic schemas for request validation.
- **frontend/**
  - src/components/: Modular interface components (ChatArea, Sidebar, AnalysisPanel, InputArea).
  - src/context/: App contexts for managing active themes and auth sessions.
  - src/types.ts: TypeScript type definitions.
  - src/App.tsx: Root layout controller.
  - index.html: HTML container.
  - vite.config.js: Dev server proxy options routing requests to the backend server.

---

## Model Selection and Fallback

For high-availability intelligence, the chat service cycles through multiple Large Language Models:
1. llama-3.3-70b-versatile
2. mixtral-8x7b-32768
3. gemma2-9b-it

If a model rate-limit or failure occurs, the backend falls back to the next available one.

---

## Setup and Installation

### Running the Backend

1. Navigate to the backend directory:
   cd backend
2. Create and run a python virtual environment:
   python -m venv venv
   venv/Scripts/activate
3. Install the dependencies:
   pip install -r requirements.txt
4. Configure environment settings in a dot-env file (.env):
   Create a .env file with DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, and GROQ_API_KEY.
5. Start the server:
   uvicorn main:app --reload

The API dashboard will be online at http://localhost:8000/docs.

### Running the Frontend

1. Navigate to the frontend directory:
   cd frontend
2. Install node dependencies:
   npm install
3. Launch the hot-reloading dev environment:
   npm run dev

The UI will be accessible at http://localhost:5173.
