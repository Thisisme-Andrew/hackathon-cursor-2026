from flask import Blueprint, request, jsonify
from app.services.user_service import create_user, get_all_users, update_user, delete_user, login_user, reset_password

user_bp = Blueprint("users", __name__)


@user_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    result = login_user(
        email=data.get("email"),
        password=data.get("password"),
    )
    if "error" in result:
        return jsonify(result), 401
    return jsonify(result), 200


@user_bp.route("/reset-password", methods=["POST"])
def reset():
    data = request.get_json() or {}
    result = reset_password(
        email=data.get("email"),
        new_password=data.get("newPassword"),
    )
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result), 200


@user_bp.route("/", methods=["POST"])
def add_user():
    data = request.get_json()
    result = create_user(data)
    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 201

@user_bp.route("/", methods=["GET"])
def fetch_users():
    result = get_all_users()
    return jsonify(result)

@user_bp.route("/<user_id>", methods=["PUT"])
def edit_user(user_id):
    """
    Update an existing user by userId.
    """
    data = request.get_json()
    result = update_user(user_id, data)

    if "error" in result:
        if result["error"] == "User not found":
            return jsonify(result), 404
        return jsonify(result), 400

    return jsonify(result), 200


@user_bp.route("/<user_id>", methods=["DELETE"])
def remove_user(user_id):
    """
    Delete a user by userId.
    """
    result = delete_user(user_id)

    if "error" in result:
        return jsonify(result), 404

    return jsonify(result), 200
