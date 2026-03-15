# Backend speech services

Documentation for the speech / NLP processing backend (Groq). Kept here to avoid merge conflicts with other backend areas.

## What’s included

- **Routes:** `app/routes/speech_routes.py` — POST `/speech/`, POST `/speech/analyze`
- **Services:** `app/services/speech_service.py` — `query_speech(text, question=None)`; `wellbeing_service.py` — `extract_wellbeing_scores(text)`; `task_extraction_service.py` — `extract_tasks_from_transcript(text, userId)` (uses `userId` to fetch the user’s saved tasks and match extracted tasks to them when the utterance refers to an existing task; also loads the user’s `settings.categoryWeights` and nudges each task’s importance by the weight for that task’s category, Likert 0–5)
- **Manual tests:** this folder — `test_speech.py`, `test_analyze.py` (analyze endpoint cases)

## API contract (for frontend)

### POST /speech/

| Item | Details |
|------|--------|
| **Endpoint** | `POST /speech/` (or `POST /speech`) |
| **Request body** | JSON: `{ "text": "<transcript>", "question": "<optional>" }` |
| **Success** | `200` → `{ "answer": "<Groq response>" }` |
| **Errors** | `400` / `502` / `503` → `{ "error": "<message>" }` |

If `question` (or `prompt`) is omitted, the service uses a default: “Summarize and note key points from this speech.”

### POST /speech/analyze

Returns todo summary, wellbeing scores, and extracted tasks from one transcript. No tasks are created automatically; the frontend may PATCH by `taskId` or call POST `/tasks/` (with `userId`) after the user confirms.

| Item | Details |
|------|--------|
| **Endpoint** | `POST /speech/analyze` |
| **Request body** | JSON: `{ "text": "<transcript>", "userId": "<uuid>" }` |
| **Success** | `200` with `answer`, `wellbeing` (scores 1-10), `extractedTasks` (array of task objects). Partial errors may appear as `answerError`, `wellbeing`: `{ "error": "..." }`, or `extractedTasksError`. |
| **Errors** | `400` when `text` or `userId` is missing. |

`extractedTasks` items match the shape expected by POST `/tasks/` (title, category, urgency, effort, importance, description, etc.). Each task has a **category** (e.g. Work, Finance, Health). **Importance** is estimated by the model and then nudged using the user’s `settings.categoryWeights` (0–5 per category) when the user exists in the DB. When the utterance refers to an existing task for that user, the item includes **taskId** and the **saved title**; other fields (e.g. urgency, isOpenLoop) reflect the utterance. The frontend should PATCH by `taskId` when present, or POST with `userId` when absent.

**Wellbeing** is an object with four scores (1–10) used to tailor interventions (e.g. paced breathing for stress, micro-break for fatigue, next-action scaffold for decision paralysis): `stressAnxiousArousal`, `fatigueSleepiness`, `cognitiveLoad`, `decisionParalysis`.

## Environment

Set in `.env` or the environment:

- `GROQ_API_KEY` — required for the speech endpoint to work.
- `MONGO_URI`, `DB_NAME` — optional for task extraction; when set, the service fetches the user by `userId` to (1) match extracted tasks to the user’s saved tasks and (2) read `settings.categoryWeights` to nudge task importance. The existing-task match test case may require the seed test user and tasks in the DB to pass the `taskId` assertion.

## Running the manual tests

From the **backend** directory:

```bash
# Service only (no server; needs GROQ_API_KEY)
python tests/speech/test_speech.py

# HTTP API (server must be running: python run.py)
python tests/speech/test_speech.py --api
```

Optional: `--base-url http://localhost:5000` when using `--api` if the app runs elsewhere.

### Analyze endpoint tests (`test_analyze.py`)

Predefined test cases run against the analyze flow (answer + wellbeing + extracted tasks). Each case has a sample transcript, expected minimum task count, and expected title keywords (each keyword must appear in at least one extracted task title); optionally `wellbeing_ranges` (e.g. `{"decisionParalysis": (8, 10)}`) to assert score ranges. Cases can override `userId`; the optional `expect_task_id_for_title` asserts that a task with that exact title has a `taskId` (existing-task match; may require MongoDB and the seed test user/tasks). Enable or disable cases in `ANALYZE_TEST_CASES` in the script.

There are wellbeing-focused cases for each dimension (stress/anxiety, fatigue/sleepiness, cognitive load, decision paralysis) plus a calm baseline; these validate that scores are in expected ranges so interventions can be chosen correctly.

```bash
# Call services directly (no server; needs GROQ_API_KEY)
python tests/speech/test_analyze.py

# Call POST /speech/analyze (server must be running)
python tests/speech/test_analyze.py --api

# Print full response JSON for each case (inspect answer, wellbeing, extractedTasks)
python tests/speech/test_analyze.py --verbose   # or -v
```

Optional: `--base-url http://localhost:5000` when using `--api` if the app runs elsewhere.

**Interpreting failures:** The runner prints either `structure` or `semantics` for each failure. Use that to decide what to fix:

- **Structure:** Missing or wrong-typed fields (e.g. `wellbeing` missing a key, task missing `urgency` or values outside 1–10, task `description` null/empty, `category` not in allowed set, `isOpenLoop` missing or non-bool, or invalid `createdAt`/`dueAt`/`completedAt` when present). Fix normalization in [wellbeing_service.py](../../app/services/wellbeing_service.py) or [task_extraction_service.py](../../app/services/task_extraction_service.py), or response building in the route.
- **Semantics:** Task count too low, not every expected title keyword found in task titles, or a wellbeing score outside its expected range for that case. Usually a prompt or parsing issue in the extraction/wellbeing services (e.g. LLM not returning the right shape or content).
- **Request failed:** Network/connection when using `--api`, or missing GROQ_API_KEY when running without server.
