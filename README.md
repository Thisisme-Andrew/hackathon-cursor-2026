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

## When to run each command
- `npm install`: only once (or when `package.json` changes)
- `npm run setup:py`: first time setup, and again only when `requirements.txt` changes
- `npm run dev`: every time you want to start the app locally

## One command option
If you want setup + run together:

```bash
npm run dev:setup
```

This runs Python dependency install first, then starts the app.

## What runs
- backend/run.py starts Flask routes
- frontend/templates/ contains Jinja templates
- frontend/static/css/output.css is generated automatically

## Python dependencies installed by setup:py
- Flask
- pymongo
- python-dotenv
- and other backend packages from requirements.txt
