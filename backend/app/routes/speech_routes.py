from flask import Blueprint, request, jsonify, Response

from app.services.speech_service import query_speech, DEFAULT_QUESTION
from app.services.wellbeing_service import extract_wellbeing_scores
from app.services.task_extraction_service import extract_tasks_from_transcript
from app.services.tts_service import synthesize_speech

speech_bp = Blueprint("speech", __name__)


@speech_bp.route("/tts", methods=["POST"])
def tts():
    """Generate speech audio (MP3) from text using a neural TTS backend."""
    data = request.get_json() or {}
    text = data.get("text")
    mode = data.get("mode", "calm")
    voice = data.get("voice")

    result = synthesize_speech(text=text, mode=mode, voice=voice)

    if "error" in result:
        message = result["error"]
        if "required" in message or "cannot be empty" in message:
            return jsonify(result), 400
        return jsonify(result), 502

    return Response(
        result["audio"],
        mimetype="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )


@speech_bp.route("/", methods=["POST"])
def query():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    text = data.get("text")
    if text is None:
        return jsonify({"error": "text is required."}), 400

    question = data.get("question") or data.get("prompt")

    result = query_speech(text=text, question=question)

    if "error" in result:
        if "not configured" in result["error"]:
            return jsonify(result), 503
        if "required" in result["error"] or "cannot be empty" in result["error"]:
            return jsonify(result), 400
        return jsonify(result), 502

    return jsonify(result), 200


@speech_bp.route("/analyze", methods=["POST"])
def analyze():
    """Return answer (todo summary), wellbeing scores, and extracted tasks from one transcript."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    text = data.get("text")
    if text is None:
        return jsonify({"error": "text is required."}), 400

    userId = data.get("userId")
    if not userId:
        return jsonify({"error": "userId is required."}), 400

    payload = {}

    result = query_speech(text=text, question=DEFAULT_QUESTION)
    if "error" in result:
        payload["answer"] = None
        payload["answerError"] = result["error"]
    else:
        payload["answer"] = result.get("answer")

    wellbeing_result = extract_wellbeing_scores(text)
    if "error" in wellbeing_result:
        payload["wellbeing"] = {"error": wellbeing_result["error"]}
    else:
        payload["wellbeing"] = wellbeing_result.get("wellbeing", {})

    tasks_result = extract_tasks_from_transcript(text, userId)
    if "error" in tasks_result:
        payload["extractedTasks"] = []
        payload["extractedTasksError"] = tasks_result["error"]
    else:
        payload["extractedTasks"] = tasks_result.get("extractedTasks", [])

    return jsonify(payload), 200
