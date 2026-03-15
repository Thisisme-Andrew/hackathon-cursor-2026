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

## Kokoro TTS Voice Setup (for all contributors)

Kokoro TTS (for demo voiceover) uses the `af_bella` voice by default, which is soothing and does NOT require espeak-ng for best quality.

- Python 3.10, 3.11, or 3.12 (Kokoro does NOT support 3.13+)
- `kokoro` (see requirements.txt)
- `soundfile` (see requirements.txt)
- `misaki[en]` (see requirements.txt)

> **Note:** You do NOT need to install espeak-ng for the default af_bella voice. If you want to experiment with other voices, see the Kokoro docs for espeak-ng instructions.

### Python version
Kokoro >=0.9.2 requires Python >=3.10 and <3.13. If you use Python 3.13, Kokoro will NOT install or work.

### Troubleshooting
- If TTS sounds robotic or not like the demo, check that your Python version is correct and that misaki[en] is installed.
- If you get pip errors about kokoro version, check your Python version (must be <3.13).
