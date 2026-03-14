from flask import Blueprint, request, jsonify
from app.services.user_service import create_user, get_all_users

user_bp = Blueprint("users", __name__)

@user_bp.route("/", methods=["POST"])
def add_user():
    data = request.get_json()
    result = create_user(data)
    return jsonify(result)

@user_bp.route("/", methods=["GET"])
def fetch_users():
    result = get_all_users()
    return jsonify(result)
