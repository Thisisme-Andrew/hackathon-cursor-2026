# Aria

## Tech stack
- Python + Flask (backend routing)
- MongoDB
- Jinja templates (instead of EJS)
- Tailwind CSS + daisyUI (frontend styling)
- Whisper, OpenAI API, and other models (planned)

Note: FastAPI is listed in the stack, but this repo currently runs with Flask routing.

## Where routing is handled
- Entry point: backend/run.py
- App factory and route registration: backend/app/__init__.py
- Route modules: backend/app/routes/

## Quick start
1. Backend setup and run

Windows (PowerShell):

cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py

2. Frontend CSS setup (new terminal)

cd frontend
npm install
npm run watch:css

That is it:
- Flask server runs from backend/run.py
- Jinja templates are in frontend/templates
- Built CSS file is frontend/static/css/output.css

## Test run (friends)
- Start backend with python run.py inside backend/
- Keep npm run watch:css running inside frontend/ while editing UI
- Open the Flask URL printed in terminal (usually http://127.0.0.1:5000)
