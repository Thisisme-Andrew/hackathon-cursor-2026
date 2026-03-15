from flask import Blueprint, request, jsonify
from app.services.task_services import create_task, get_all_tasks, update_task

task_bp = Blueprint("tasks", __name__)


@task_bp.route("/", methods=["POST"])
def add_task():
    data = request.get_json()
    result = create_task(data)
    return jsonify(result)


@task_bp.route("/", methods=["GET"])
def fetch_tasks():
    userId = request.args.get("userId")
    result = get_all_tasks(userId=userId)
    return jsonify(result)


@task_bp.route("/<taskId>", methods=["PATCH"])
def patch_task(taskId):
    data = request.get_json() or {}
    result = update_task(taskId, data)
    return jsonify(result)
