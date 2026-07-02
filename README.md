# Orion AI

<a name="top"></a>

[![Hackathon](https://img.shields.io/badge/Hackathon-Cursor%20x%20ZOO%20x%20Tech%20Start%20UCalgary-334772)](#overview)
[![Placement](https://img.shields.io/badge/Placement-4th%20Place-7ccfa9)](#overview)
[![Backend](https://img.shields.io/badge/Backend-Flask%20%2B%20Python-4d6892)](#tech-stack)
[![Frontend](https://img.shields.io/badge/Frontend-Jinja%20%2B%20Tailwind%20CSS-6d84ac)](#tech-stack)
[![AI](https://img.shields.io/badge/AI-Groq%20LLMs%20%2B%20TTS-8aa0c4)](#ai-workflow)
[![Database](https://img.shields.io/badge/Database-MongoDB-4d6892)](#tech-stack)

**Orion** is an AI-assisted productivity app designed for people who feel overwhelmed and stuck in decision paralysis.  
Built during a software development hackathon sponsored by Cursor and hosted by The Electrical & Software Engineering Students' Society (ZOO), Tech Start UCalgary, and Cursor, Orion placed **4th overall**.

The hackathon challenge was to build something that helps people stay productive when they feel overwhelmed. Our team focused on a common failure mode: when cognitive load is high, even small tasks can feel impossible to prioritize. Orion responds by turning a conversation into a structured, personalized action plan.

## Table of Contents
- [Overview](#overview)
- [Why This Project Stands Out](#why-this-project-stands-out)
- [How It Works](#how-it-works)
- [AI Workflow](#ai-workflow)
- [Tech Stack](#tech-stack)
- [Architecture Notes](#architecture-notes)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

## Overview
Orion guides a user through a short calming or urgent session where they can either **speak** or **type** what is on their mind. The app then:

- identifies concrete tasks hidden inside a messy stream of thoughts
- estimates urgency, effort, importance, and next actions
- adjusts prioritization using the user's own value weights
- lets the user review, edit, and save tasks to a personal dashboard
- provides a focused board designed to reduce friction and help the user act

This project combines product thinking, full-stack engineering, and applied AI. It is not just a chatbot UI; it is a workflow that translates emotional overload into actionable task management.

## Why This Project Stands Out
- **Clear problem framing**: the app targets overwhelm and decision paralysis rather than generic task management.
- **Human-centered AI design**: the conversation flow is supportive, short, and intentionally designed to extract useful action items without increasing mental load.
- **Personalized prioritization**: task importance is influenced by user-defined category weights such as work, health, relationships, finance, and family.
- **Multi-model / multi-service workflow**: the app uses LLM-powered question generation and task extraction, browser speech recognition, and server-side text-to-speech.
- **Hackathon execution speed**: the team designed, built, and polished a working end-to-end product under hackathon time constraints using Cursor, Figma, and Groq for agentic and LLM-driven workflows.

## How It Works
1. The user starts a guided session in either **Calm** or **Urgent** mode.
2. Orion asks short follow-up questions designed to surface concrete responsibilities.
3. The user responds with voice or text.
4. The transcript is analyzed to extract structured tasks.
5. Tasks are categorized, scored, and lightly personalized using the user's saved priorities.
6. The user reviews the generated plan and saves selected tasks to their dashboard.
7. The dashboard supports quick-add, completion tracking, focus mode, and priority tuning.

## AI Workflow
Orion uses AI as part of a broader product workflow rather than as a single prompt.

### 1. Guided questioning
The backend generates follow-up questions with Groq to help the user name specific, actionable tasks instead of staying in abstract emotional language.

### 2. Task extraction
After the session, Orion sends the full transcript through an extraction pipeline that returns structured task objects with fields such as:

- `title`
- `description`
- `category`
- `urgency`
- `effort`
- `importance`
- `estimatedTimeToComplete`
- `nextAction`
- `dueAt`

### 3. Personalization
Extracted tasks are adjusted using the user's stored category weights so prioritization better reflects individual values instead of a one-size-fits-all scoring model.

### 4. Voice experience
The frontend uses browser speech recognition for voice capture, while the backend uses neural text-to-speech to read prompts aloud and make the session feel more guided and calming.

## Tech Stack

### Application stack
- **Backend:** Python, Flask, Flask-JWT-Extended, Flask-CORS
- **Frontend:** Jinja templates, vanilla JavaScript, Tailwind CSS, daisyUI
- **Database:** MongoDB with `pymongo`
- **Authentication:** JWT-based auth flow

### AI / voice stack
- **LLM services:** Groq
- **Models used in code:** `llama-3.3-70b-versatile`
- **Text-to-speech:** `edge-tts`
- **Speech input:** Browser `SpeechRecognition` / `webkitSpeechRecognition`

### Product / build workflow
- **Agentic development:** Cursor
- **UI / product design:** Figma
- **Package tooling:** npm for frontend tooling, pip for Python dependencies

## Architecture Notes
- The Flask app serves both API routes and Jinja-rendered pages.
- The main user-facing routes are:
  - `/` landing page
  - `/demo` public demo flow
  - `/session` logged-in guided session
  - `/dashboard` task board
- Speech and AI capabilities are exposed under `/speech`.
- User, auth, and task CRUD functionality are split into separate backend services and route modules.
- The app is designed to stay bootable even when optional services like MongoDB or Groq are not configured, which makes local UI iteration easier.

## Running Locally
From the repo root:

```bash
npm install
npm run setup:py
npm run dev
```

Open `http://127.0.0.1:3000`

### When to run each command
- `npm install`: only once, or when `package.json` changes
- `npm run setup:py`: first-time Python setup, and again when `requirements.txt` changes
- `npm run dev`: every time you want to start the app locally

### One-command setup + run
```bash
npm run dev:setup
```

This installs Python dependencies and starts the local development workflow.

### What runs
- `backend/run.py` starts the Flask app
- `frontend/templates/` contains the Jinja templates
- `frontend/static/css/output.css` is generated automatically by Tailwind

### Python dependencies installed by `setup:py`
- Flask
- pymongo
- python-dotenv
- groq
- edge-tts
- and other backend packages from `requirements.txt`

## Environment Variables
The backend reads environment variables from the project-level `.env` first, then `backend/.env` as a fallback.

Common values used by the app:

```env
MONGO_URI=...
DB_NAME=...
GROQ_API_KEY=...
SECRET_KEY=...
JWT_SECRET_KEY=...
```

### Notes
- `GROQ_API_KEY` enables dynamic question generation and transcript-to-task extraction.
- `MONGO_URI` and `DB_NAME` are required for persistent users and saved tasks.
- Without database or AI credentials, parts of the app may degrade gracefully, but some features will be unavailable.

## Project Structure
```text
backend/
  app/
    routes/       Flask blueprints for auth, tasks, users, and speech
    services/     AI, speech, task, and user business logic
    models/       task and user document shaping
  run.py          local Flask entrypoint

frontend/
  templates/      Jinja page templates
  static/
    js/           dashboard, session, and landing page behavior
    css/          page styling and generated Tailwind output
```

## Portfolio Summary
If you are reviewing this project as a recruiter, teammate, or engineering manager, the most valuable signal is that Orion demonstrates the ability to:

- identify a meaningful user problem and frame a sharp product hypothesis
- ship a polished full-stack application quickly under hackathon constraints
- integrate AI into a workflow where model output drives real application behavior
- balance UX, backend design, and practical AI orchestration in a single product

[Back to top](#top)
