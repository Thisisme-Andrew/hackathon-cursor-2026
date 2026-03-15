from flask import Blueprint, request, jsonify

from app.services.speech_service import query_speech

speech_bp = Blueprint("speech", __name__)


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
