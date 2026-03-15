"""
Test cases for POST /speech/analyze: structure and semantic assertions.

Run from backend/ (or set PYTHONPATH to backend/). Requires GROQ_API_KEY.

Usage:
  # Call services directly (no server):
  python tests/speech/test_analyze.py

  # Call HTTP API (server must be running: python run.py):
  python tests/speech/test_analyze.py --api

  # Print full response JSON for each case:
  python tests/speech/test_analyze.py --verbose   # or -v
"""
import argparse
import json
import os
import sys

# Ensure backend root is on path when run as script
_BACKEND = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

DEFAULT_BASE_URL = "http://127.0.0.1:5000"
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"

WELLBEING_KEYS = ("stressAnxiousArousal", "fatigueSleepiness", "cognitiveLoad", "decisionParalysis")

# Test user with existing tasks in DB (Review quarterly goals, Schedule team standup, etc.)
EXISTING_TASK_TEST_USER_ID = "528f1389-3e8b-478f-ba28-83522ef5e9d0"

# Test cases: id, transcript, expected_min_tasks, expected_title_keywords (at least one must appear in some task title)
# Optional: wellbeing_ranges = { key: (min, max) } to assert score ranges
# Optional: userId = override TEST_USER_ID for this case
# Optional: expect_task_id_for_title = "Exact saved title" to assert at least one task has this title and has taskId (integration: needs DB + Groq match)
ANALYZE_TEST_CASES = [
    {
        "id": "paralyzed_decision",
        "transcript": "I need to renew my license and book the vet for the dog. I've had both on my list for ages. I just... I don't know which one to do first. Every time I sit down to do one I end up doing neither. I'm not even that busy, I just can't pick one and start.",
        "expected_min_tasks": 2,
        "expected_title_keywords": ["license", "vet"],
        "wellbeing_ranges": {
            "stressAnxiousArousal": (2, 6),
            "fatigueSleepiness": (2, 4),
            "cognitiveLoad": (2, 4),
            "decisionParalysis": (8, 10),
        },
    },
    {
        "id": "existing_task_match",
        "userId": EXISTING_TASK_TEST_USER_ID,
        "transcript": "I need to review my quarterly goals and make sure we're on track.",
        "expected_min_tasks": 1,
        "expected_title_keywords": ["quarterly", "goals"],
        "wellbeing_ranges": None,
        "expect_task_id_for_title": "Review quarterly goals",
    },
    # {
    #     "id": "call_sister",
    #     "transcript": "um... i've been really meaning to call my sister lately but haven't called in a few weeks",
    #     "expected_min_tasks": 1,
    #     "expected_title_keywords": ["sister", "call"],
    #     "wellbeing_ranges": None,
    # },
    # {
    #     "id": "overwhelmed_multiple",
    #     "transcript": (
    #         "I have so much to do, I don't even know where to start. The report is due Friday, "
    #         "I need to fix the bug in the login page, and my mom's birthday is tomorrow and I didn't get a gift. "
    #         "I've been up all night worrying."
    #     ),
    #     "expected_min_tasks": 3,
    #     "expected_title_keywords": ["report", "login", "bug", "mom", "birthday", "gift"],
    #     "wellbeing_ranges": None,  # optional: all high for this case
    # },
    # {
    #     "id": "clear_single_milk",
    #     "transcript": "I need to pick up milk from the store on my way home.",
    #     "expected_min_tasks": 1,
    #     "expected_title_keywords": ["milk", "store", "pick up"],
    #     "wellbeing_ranges": None,
    # },
    # {
    #     "id": "vague_insurance",
    #     "transcript": "Something about the insurance... I gotta deal with that.",
    #     "expected_min_tasks": 1,
    #     "expected_title_keywords": ["insurance"],
    #     "wellbeing_ranges": None,
    # },
    # {
    #     "id": "tired_email_john",
    #     "transcript": "I'm so tired. I just need to send that email to John about the meeting. Can't think straight.",
    #     "expected_min_tasks": 1,
    #     "expected_title_keywords": ["email", "John", "meeting"],
    #     "wellbeing_ranges": None,
    # },
    # {
    #     "id": "multiple_disfluency",
    #     "transcript": "Okay so... buy groceries, and uh return the Amazon package, and I need to schedule the dentist. Yeah.",
    #     "expected_min_tasks": 3,
    #     "expected_title_keywords": ["groceries", "Amazon", "package", "dentist"],
    #     "wellbeing_ranges": None,
    # },
]


def _assert_structure(payload: dict) -> list[str]:
    """Return list of structure assertion failure messages (empty if all pass)."""
    errors = []

    # answer: allow null if answerError present; otherwise expect non-empty string
    if "answerError" in payload and payload["answerError"]:
        pass  # partial failure ok
    elif payload.get("answer") is None or not str(payload.get("answer", "")).strip():
        errors.append("answer: missing or empty (and no answerError)")

    # wellbeing: no error and four keys, each 1-10
    wellbeing = payload.get("wellbeing")
    if wellbeing is None:
        errors.append("wellbeing: missing")
    elif isinstance(wellbeing, dict) and "error" in wellbeing:
        errors.append(f"wellbeing: error from service: {wellbeing.get('error', '')}")
    elif isinstance(wellbeing, dict):
        for key in WELLBEING_KEYS:
            if key not in wellbeing:
                errors.append(f"wellbeing: missing key '{key}'")
            else:
                try:
                    v = int(wellbeing[key])
                    if not (1 <= v <= 10):
                        errors.append(f"wellbeing: '{key}'={v} not in 1-10")
                except (TypeError, ValueError):
                    errors.append(f"wellbeing: '{key}' not an integer 1-10")
    else:
        errors.append("wellbeing: not a dict")

    # extractedTasks: list; each task has title, urgency, effort, importance in 1-10
    tasks = payload.get("extractedTasks")
    if "extractedTasksError" in payload and payload["extractedTasksError"]:
        errors.append(f"extractedTasks: error from service: {payload['extractedTasksError']}")
    elif tasks is None:
        errors.append("extractedTasks: missing")
    elif not isinstance(tasks, list):
        errors.append("extractedTasks: not a list")
    else:
        required_task_keys = ("title", "urgency", "effort", "importance")
        for i, task in enumerate(tasks):
            if not isinstance(task, dict):
                errors.append(f"extractedTasks[{i}]: not a dict")
                continue
            for k in required_task_keys:
                if k not in task:
                    errors.append(f"extractedTasks[{i}]: missing '{k}'")
            if "title" in task and not str(task["title"]).strip():
                errors.append(f"extractedTasks[{i}]: title empty")
            for num_key in ("urgency", "effort", "importance"):
                if num_key in task and task.get(num_key) is not None:
                    try:
                        n = int(task[num_key])
                        if not (1 <= n <= 10):
                            errors.append(f"extractedTasks[{i}].{num_key}={n} not in 1-10")
                    except (TypeError, ValueError):
                        errors.append(f"extractedTasks[{i}].{num_key} not int 1-10")

            # Full shape: optional fields must have expected types when present
            if "description" in task and task["description"] is not None:
                if not isinstance(task["description"], str):
                    errors.append(f"extractedTasks[{i}].description must be str, got {type(task['description']).__name__}")
            if "estimatedTimeToComplete" in task and task["estimatedTimeToComplete"] is not None:
                try:
                    etc = int(task["estimatedTimeToComplete"])
                    if etc < 0:
                        errors.append(f"extractedTasks[{i}].estimatedTimeToComplete must be non-negative int")
                except (TypeError, ValueError):
                    errors.append(f"extractedTasks[{i}].estimatedTimeToComplete must be int or null")
            if "isOpenLoop" in task and task["isOpenLoop"] is not None:
                if not isinstance(task["isOpenLoop"], bool):
                    errors.append(f"extractedTasks[{i}].isOpenLoop must be bool, got {type(task['isOpenLoop']).__name__}")
            if "dueAt" in task and task["dueAt"] is not None:
                if not isinstance(task["dueAt"], str):
                    errors.append(f"extractedTasks[{i}].dueAt must be str (ISO) or null, got {type(task['dueAt']).__name__}")
            if "nextAction" in task and task["nextAction"] is not None:
                na = task["nextAction"]
                if not isinstance(na, dict):
                    errors.append(f"extractedTasks[{i}].nextAction must be dict or null, got {type(na).__name__}")
                else:
                    if "text" not in na:
                        errors.append(f"extractedTasks[{i}].nextAction must have 'text'")
                    elif not isinstance(na.get("text"), str):
                        errors.append(f"extractedTasks[{i}].nextAction.text must be str")
                    if "estimateMins" in na and na["estimateMins"] is not None:
                        try:
                            em = int(na["estimateMins"])
                            if em < 0:
                                errors.append(f"extractedTasks[{i}].nextAction.estimateMins must be non-negative int")
                        except (TypeError, ValueError):
                            errors.append(f"extractedTasks[{i}].nextAction.estimateMins must be int")
            if "taskId" in task and task["taskId"] is not None:
                if not isinstance(task["taskId"], str) or not str(task["taskId"]).strip():
                    errors.append(f"extractedTasks[{i}].taskId when present must be non-empty string")

    return errors


def _assert_semantics(payload: dict, case: dict) -> list[str]:
    """Return list of semantic assertion failure messages (empty if all pass)."""
    errors = []
    tasks = payload.get("extractedTasks") or []
    expected_min = case.get("expected_min_tasks", 0)
    keywords = case.get("expected_title_keywords") or []

    if len(tasks) < expected_min:
        errors.append(f"extractedTasks: expected at least {expected_min} tasks, got {len(tasks)}")

    if keywords:
        titles = [str(t.get("title", "")).lower() for t in tasks]
        found = any(any(kw.lower() in t for kw in keywords) for t in titles)
        if not found:
            errors.append(f"extractedTasks: no task title contained any of {keywords}; titles={titles}")

    # Optional: assert that a task with the given exact title exists and has taskId (integration / existing-task match)
    expect_title = case.get("expect_task_id_for_title")
    if expect_title and isinstance(expect_title, str):
        expect_norm = expect_title.strip().lower()
        matching = [t for t in tasks if isinstance(t, dict) and str(t.get("title", "")).strip().lower() == expect_norm]
        if not matching:
            errors.append(f"extractedTasks: no task with title '{expect_title}' (for taskId assertion); titles={[t.get('title') for t in tasks]}")
        else:
            for t in matching:
                if not t.get("taskId"):
                    errors.append(f"extractedTasks: task with title '{expect_title}' should have taskId when matching existing task (response may still be correct if DB has no such user/task)")

    wellbeing = payload.get("wellbeing")
    ranges = case.get("wellbeing_ranges")
    if ranges and isinstance(wellbeing, dict) and "error" not in wellbeing:
        for key, (lo, hi) in ranges.items():
            if key in wellbeing:
                try:
                    v = int(wellbeing[key])
                    if not (lo <= v <= hi):
                        errors.append(f"wellbeing: {key}={v} not in range [{lo},{hi}]")
                except (TypeError, ValueError):
                    pass

    return errors


def _call_analyze_via_services(transcript: str, userId: str) -> dict:
    """Call the three services directly and return combined payload (no HTTP)."""
    from app.services.speech_service import query_speech, DEFAULT_QUESTION
    from app.services.wellbeing_service import extract_wellbeing_scores
    from app.services.task_extraction_service import extract_tasks_from_transcript

    payload = {}
    result = query_speech(text=transcript, question=DEFAULT_QUESTION)
    if "error" in result:
        payload["answer"] = None
        payload["answerError"] = result["error"]
    else:
        payload["answer"] = result.get("answer")

    wellbeing_result = extract_wellbeing_scores(transcript)
    if "error" in wellbeing_result:
        payload["wellbeing"] = {"error": wellbeing_result["error"]}
    else:
        payload["wellbeing"] = wellbeing_result.get("wellbeing", {})

    tasks_result = extract_tasks_from_transcript(transcript, userId)
    if "error" in tasks_result:
        payload["extractedTasks"] = []
        payload["extractedTasksError"] = tasks_result["error"]
    else:
        payload["extractedTasks"] = tasks_result.get("extractedTasks", [])

    return payload


def _call_analyze_via_http(base_url: str, transcript: str, userId: str) -> dict:
    """POST /speech/analyze and return JSON payload. Raises on HTTP error."""
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError, URLError

    url = f"{base_url.rstrip('/')}/speech/analyze"
    payload = json.dumps({"text": transcript, "userId": userId})
    req = Request(url, data=payload.encode("utf-8"), method="POST")
    req.add_header("Content-Type", "application/json")
    with urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body)


def run_one_case(case: dict, use_api: bool, base_url: str, verbose: bool = False) -> tuple[bool, list[str]]:
    """Run one test case. Return (passed, list of failure messages)."""
    transcript = case["transcript"]
    userId = case.get("userId", TEST_USER_ID)
    try:
        if use_api:
            payload = _call_analyze_via_http(base_url, transcript, userId)
        else:
            payload = _call_analyze_via_services(transcript, userId)
    except Exception as e:
        return False, [f"Request failed: {e}"]

    if verbose:
        print(f"\n--- response for case {case.get('id', '?')} ---")
        print(json.dumps(payload, indent=2))
        print("---\n")

    failures = _assert_structure(payload)
    if failures:
        return False, ["structure: " + f for f in failures]
    failures = _assert_semantics(payload, case)
    if failures:
        return False, ["semantics: " + f for f in failures]
    return True, []


def main():
    parser = argparse.ArgumentParser(description="Test POST /speech/analyze with predefined cases.")
    parser.add_argument(
        "--api",
        action="store_true",
        help="Test via HTTP (POST /speech/analyze). Server must be running.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base URL when using --api (default: %(default)s)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Print full response JSON for each case.",
    )
    args = parser.parse_args()

    mode = "HTTP API" if args.api else "services (direct)"
    print(f"Running analyze tests via {mode} ({len(ANALYZE_TEST_CASES)} cases)...")
    if args.api:
        print(f"Base URL: {args.base_url}")

    failed = 0
    for case in ANALYZE_TEST_CASES:
        case_id = case["id"]
        passed, messages = run_one_case(case, use_api=args.api, base_url=args.base_url, verbose=args.verbose)
        if passed:
            print(f"  PASS  {case_id}")
        else:
            failed += 1
            print(f"  FAIL  {case_id}")
            for m in messages:
                print(f"         {m}")

    print()
    if failed == 0:
        print("All analyze tests passed.")
        return 0
    print(f"{failed} of {len(ANALYZE_TEST_CASES)} cases failed. Check structure (keys, types) vs semantics (counts, keywords) to decide what to fix.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
