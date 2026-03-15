import json
import re

from groq import Groq
from config import Config
from app.services.task_services import get_all_tasks

TASK_EXTRACTION_SYSTEM_PROMPT = """You are a task-extraction assistant. The user is speaking or writing about todo items they want to add.
Extract one or more tasks from the transcript. For each task provide:
- title (string, required): short task name
- description (string, can be empty)
- urgency (integer 1-10): how time-sensitive
- effort (integer 1-10): how much effort required
- importance (integer 1-10): how important
- estimatedTimeToComplete (integer minutes, or null if unknown)
- isOpenLoop (boolean): true if captured quickly / not fully defined
- nextAction (object): { "text": "smallest concrete next step", "estimateMins": number }
- dueAt (ISO date-time string or null)

Estimate urgency, effort, importance when the user does not state them. Return ONLY a valid JSON array of task objects, no explanation.
Example: [{"title": "Ship dashboard", "description": "", "urgency": 7, "effort": 5, "importance": 8, "estimatedTimeToComplete": 120, "isOpenLoop": false, "nextAction": {"text": "Open the repo", "estimateMins": 2}, "dueAt": "2025-04-15T17:00:00Z"}]"""

TASK_RESOLUTION_SYSTEM_PROMPT = """You are a task-matching assistant. The user said something that was interpreted as a task with a title and optional description.
You are given that predicted title and description, and a list of existing tasks (each with taskId, title, description).
Decide whether the user was referring to one of these existing tasks (e.g. rephrasing, updating, or mentioning the same thing).
If yes, return ONLY the taskId of that existing task. If no match, return only the word: null.
Return nothing else: no explanation, no markdown, no quotes around taskId."""


def _normalize_title(s: str) -> str:
    """Normalize title for comparison: lower, strip, collapse spaces."""
    if not s or not isinstance(s, str):
        return ""
    return " ".join(re.split(r"\s+", s.strip().lower()))


def _title_words(s: str) -> set:
    """Return set of non-empty words from normalized title (min 2 chars to skip trivial words)."""
    normalized = _normalize_title(s)
    return {w for w in re.split(r"\s+", normalized) if len(w) >= 2}


def _find_candidates_by_title(extracted_title: str, existing_tasks: list) -> list:
    """
    Find existing tasks that might match the extracted title.
    Returns list of task dicts (with taskId, title, description) that are candidates.
    """
    if not extracted_title or not existing_tasks:
        return []
    ext_norm = _normalize_title(extracted_title)
    ext_words = _title_words(extracted_title)
    candidates = []
    for t in existing_tasks:
        if not isinstance(t, dict) or not t.get("taskId") or not t.get("title"):
            continue
        existing_norm = _normalize_title(t["title"])
        if ext_norm == existing_norm:
            candidates.append(t)
            continue
        if ext_norm in existing_norm or existing_norm in ext_norm:
            candidates.append(t)
            continue
        existing_words = _title_words(t["title"])
        overlap = ext_words & existing_words
        if len(overlap) >= 2:
            candidates.append(t)
        elif len(ext_words) >= 1 and len(overlap) >= 1 and len(overlap) >= len(ext_words) / 2:
            candidates.append(t)
    return candidates


def _resolve_existing_task_id(
    extracted_title: str,
    extracted_description: str,
    candidates: list,
    client: Groq,
) -> str | None:
    """
    Ask Groq which existing task (if any) the user was referring to.
    Returns taskId string or None.
    """
    if not candidates or not client:
        return None
    tasks_blob = "\n".join(
        f"- taskId: {t.get('taskId')}, title: {t.get('title', '')}, description: {t.get('description', '')}"
        for t in candidates
    )
    user_content = f"""Predicted from user's utterance:
Title: {extracted_title}
Description: {extracted_description or '(none)'}

Existing tasks:
{tasks_blob}

Which existing task was the user referring to? Return only that task's taskId, or null if none."""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": TASK_RESOLUTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        )
        raw = response.choices[0].message.content.strip()
        raw = raw.strip().lower()
        if raw == "null" or not raw:
            return None
        # Remove quotes if present
        if raw.startswith('"') and raw.endswith('"'):
            raw = raw[1:-1]
        if raw.startswith("'") and raw.endswith("'"):
            raw = raw[1:-1]
        for t in candidates:
            if t.get("taskId") and str(t["taskId"]).lower() == raw:
                return t["taskId"]
        # Allow raw to be returned if it matches any taskId (e.g. UUID)
        for t in candidates:
            if t.get("taskId") and raw in str(t["taskId"]).lower():
                return t["taskId"]
        return None
    except Exception:
        return None


def _normalize_task(raw: dict) -> dict:
    """Ensure a single task dict has the shape expected by create_task (without userId)."""
    title = raw.get("title") or ""
    if isinstance(title, str):
        title = title.strip()
    if not title:
        return None
    urgency = raw.get("urgency", 5)
    effort = raw.get("effort", 5)
    importance = raw.get("importance", 5)
    for val, name in [(urgency, "urgency"), (effort, "effort"), (importance, "importance")]:
        try:
            n = int(val)
            if not (1 <= n <= 10):
                return None
        except (TypeError, ValueError):
            return None
    task = {
        "title": title,
        "description": str(raw.get("description") or "").strip(),
        "urgency": int(urgency),
        "effort": int(effort),
        "importance": int(importance),
        "estimatedTimeToComplete": raw.get("estimatedTimeToComplete"),
        "isOpenLoop": bool(raw.get("isOpenLoop", False)),
        "dueAt": raw.get("dueAt"),
        "nextAction": None,
    }
    na = raw.get("nextAction")
    if na and isinstance(na, dict):
        task["nextAction"] = {
            "text": str(na.get("text") or "").strip(),
            "estimateMins": int(na.get("estimateMins", 0)) if na.get("estimateMins") is not None else 0,
        }
    if task["estimatedTimeToComplete"] is not None:
        try:
            task["estimatedTimeToComplete"] = int(task["estimatedTimeToComplete"])
        except (TypeError, ValueError):
            task["estimatedTimeToComplete"] = None
    return task


def extract_tasks_from_transcript(text: str, userId: str) -> dict:
    """
    Extract task-like dicts from transcript text using Groq.
    Matches against the user's existing tasks (by userId); when the user referred to an existing task,
    the returned item includes taskId and the saved title; other fields (urgency, isOpenLoop, etc.) come from the utterance.
    Returns {"extractedTasks": [ ... ]} with items ready for create_task (caller adds userId) or PATCH by taskId, or {"error": "..."}.
    """
    if not Config.GROQ_API_KEY:
        return {"error": "Groq API key is not configured. Set GROQ_API_KEY."}

    if not text or not text.strip():
        return {"error": "text is required and cannot be empty."}

    if not userId or not str(userId).strip():
        return {"error": "userId is required."}

    try:
        client = Groq(api_key=Config.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": TASK_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n\n{text}"},
            ],
        )
        raw = response.choices[0].message.content.strip()
        # Extract JSON array (may be inside markdown)
        start = raw.find("[")
        if start == -1:
            return {"extractedTasks": []}
        depth = 0
        end = -1
        for i in range(start, len(raw)):
            if raw[i] == "[":
                depth += 1
            elif raw[i] == "]":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end == -1:
            return {"extractedTasks": []}
        arr = json.loads(raw[start:end])
        if not isinstance(arr, list):
            return {"extractedTasks": []}
        tasks = []
        for item in arr:
            if not isinstance(item, dict):
                continue
            normalized = _normalize_task(item)
            if normalized:
                tasks.append(normalized)

        # Match to existing user tasks: fetch and resolve
        existing_result = get_all_tasks(userId)
        existing_tasks = []
        if isinstance(existing_result, list):
            existing_tasks = existing_result
        for task in tasks:
            candidates = _find_candidates_by_title(task["title"], existing_tasks)
            if not candidates:
                continue
            task_id = _resolve_existing_task_id(
                task["title"],
                task.get("description") or "",
                candidates,
                client,
            )
            if task_id:
                for t in existing_tasks:
                    if isinstance(t, dict) and t.get("taskId") == task_id:
                        task["taskId"] = t["taskId"]
                        task["title"] = t["title"]
                        break

        return {"extractedTasks": tasks}
    except json.JSONDecodeError as e:
        return {"error": f"Task extraction parse error: {str(e)}"}
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}
