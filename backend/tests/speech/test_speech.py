"""
Manual test for speech processing (no frontend required).

Run from backend/ (or set PYTHONPATH to backend/).

Usage:
  # Test the service directly (no server; needs OPENAI_API_KEY in .env or env):
  python tests/speech/test_speech.py

  # Test the HTTP API (server must be running: python run.py):
  python tests/speech/test_speech.py --api
"""
import argparse
import json
import os
import sys

# Ensure backend root is on path when run as script
_BACKEND = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

SAMPLE_TRANSCRIPT = (
    "Hello everyone. Today I want to talk about our goals for the quarter. "
    "We need to ship the new dashboard by April and improve our test coverage."
)
DEFAULT_BASE_URL = "http://127.0.0.1:5000"


def test_service_direct():
    """Call the speech service directly (no Flask server)."""
    from app.services.speech_service import query_speech

    print("Testing speech service directly (no server)...")
    print(f"Transcript: {SAMPLE_TRANSCRIPT[:60]}...")
    result = query_speech(SAMPLE_TRANSCRIPT, question=None)
    if "error" in result:
        print(f"Error: {result['error']}")
        return 1
    print(f"Answer: {result.get('answer', '')[:300]}...")
    return 0


def test_api_http(base_url: str):
    """POST to /speech and print response."""
    from urllib.request import Request, urlopen
    from urllib.error import HTTPError, URLError

    url = f"{base_url.rstrip('/')}/speech/"
    payload = json.dumps({"text": SAMPLE_TRANSCRIPT, "question": "What are the main action items?"})
    req = Request(url, data=payload.encode("utf-8"), method="POST")
    req.add_header("Content-Type", "application/json")

    print(f"Testing HTTP API at {url}...")
    print(f"Payload: text + question")
    try:
        with urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            if "error" in data:
                print(f"Error: {data['error']}")
                return 1
            print(f"Answer: {data.get('answer', '')[:300]}...")
            return 0
    except HTTPError as e:
        body = e.read().decode("utf-8") if e.fp else ""
        try:
            data = json.loads(body)
            print(f"HTTP {e.code}: {data.get('error', body)}")
        except Exception:
            print(f"HTTP {e.code}: {body}")
        return 1
    except URLError as e:
        print(f"Connection error: {e.reason}. Is the server running? Try: python run.py")
        return 1


def main():
    parser = argparse.ArgumentParser(description="Test speech processing (service or API).")
    parser.add_argument(
        "--api",
        action="store_true",
        help="Test the HTTP API (POST /speech). Server must be running.",
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help="Base URL when using --api (default: %(default)s)",
    )
    args = parser.parse_args()

    if args.api:
        return test_api_http(args.base_url)
    return test_service_direct()


if __name__ == "__main__":
    sys.exit(main())
