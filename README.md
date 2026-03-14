# Aria

## Stack
- Python + Flask
- MongoDB
- Jinja (not EJS)
- Tailwind CSS + daisyUI

## Run (from repo root)
```bash
npm install
npm run setup:py
npm run dev
```

Open http://127.0.0.1:5000

## What runs
- backend/run.py starts Flask routes
- frontend/templates/ contains Jinja templates
- frontend/static/css/output.css is generated automatically

## Python dependencies installed by setup:py
- Flask
- pymongo
- python-dotenv
- and other backend packages from requirements.txt
