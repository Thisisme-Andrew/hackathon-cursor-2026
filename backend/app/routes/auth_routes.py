from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.auth_service import signup_user, login_user
from app.db.mongo import users_collection

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Handle user registration.
    """
    data = request.get_json()
    result, status_code = signup_user(data)
    return jsonify(result), status_code


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Handle user login.
    """
    data = request.get_json()
    result, status_code = login_user(data)
    return jsonify(result), status_code


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """
    Return the currently authenticated user's profile.
    """
    current_user_id = get_jwt_identity()

    user = users_collection.find_one({"userId": current_user_id})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "userId": user.get("userId"),
        "email": user.get("email"),
        "firstName": user.get("firstName"),
        "lastName": user.get("lastName"),
        "timezone": user.get("timezone"),
        "overwhelmScore": user.get("overwhelmScore"),
        "preferredDomain": user.get("preferredDomain"),
        "settings": user.get("settings", {})
    }), 200