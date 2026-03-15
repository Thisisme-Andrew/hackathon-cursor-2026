# Backend speech services

Documentation for the speech / NLP processing backend (Groq). Kept here to avoid merge conflicts with other backend areas.

## What’s included

- **Routes:** `app/routes/speech_routes.py` — POST `/speech/`
- **Service:** `app/services/speech_service.py` — `query_speech(text, question=None)`
- **Manual tests:** this folder — `test_speech.py`

## API contract (for frontend)

| Item | Details |
|------|--------|
| **Endpoint** | `POST /speech/` (or `POST /speech`) |
| **Request body** | JSON: `{ "text": "<transcript>", "question": "<optional>" }` |
| **Success** | `200` → `{ "answer": "<Groq response>" }` |
| **Errors** | `400` / `502` / `503` → `{ "error": "<message>" }` |

If `question` (or `prompt`) is omitted, the service uses a default: “Summarize and note key points from this speech.”

## Environment

Set in `.env` or the environment:

- `GROQ_API_KEY` — required for the speech endpoint to work.

## Running the manual tests

From the **backend** directory:

```bash
# Service only (no server; needs GROQ_API_KEY)
python tests/speech/test_speech.py

# HTTP API (server must be running: python run.py)
python tests/speech/test_speech.py --api
```

Optional: `--base-url http://localhost:5000` when using `--api` if the app runs elsewhere.
