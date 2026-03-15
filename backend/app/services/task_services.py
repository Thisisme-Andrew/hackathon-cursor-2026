from datetime import datetime
from app.db.mongo import tasks_collection
from app.models.task_model import task_model


def _parse_dt(value):
    """Parse ISO datetime string to datetime, or return None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def create_task(data):
    if tasks_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    if not data:
        return {"error": "No data provided"}

    userId = data.get("userId")
    title = data.get("title")

    if not userId or not title:
        return {"error": "userId and title are required"}

    urgency = data.get("urgency", 5)
    effort = data.get("effort", 5)
    importance = data.get("importance", 5)
    if not (1 <= urgency <= 10 and 1 <= effort <= 10 and 1 <= importance <= 10):
        return {"error": "urgency, effort, and importance must be between 1 and 10"}

    task = task_model(
        userId=userId,
        title=title,
        description=data.get("description", ""),
        urgency=urgency,
        effort=effort,
        importance=importance,
        status=data.get("status", False),
        estimatedTimeToComplete=data.get("estimatedTimeToComplete"),
        isOpenLoop=data.get("isOpenLoop", False),
        dueAt=_parse_dt(data.get("dueAt")),
        completedAt=_parse_dt(data.get("completedAt")),
        nextAction=data.get("nextAction"),
    )
    tasks_collection.insert_one(task)
    return {"message": "Task created successfully", "taskId": task["taskId"]}


def get_all_tasks(userId=None):
    if tasks_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    query = {}
    if userId:
        query["userId"] = userId

    tasks = []
    for task in tasks_collection.find(query):
        tasks.append(_task_to_response(task))
    return tasks


def _serialize_dt(dt):
    """Serialize datetime for JSON response."""
    return dt.isoformat() + "Z" if dt else None


def _task_to_response(task):
    """Convert MongoDB task document to API response format."""
    doc = {
        "taskId": task["taskId"],
        "userId": task["userId"],
        "title": task["title"],
        "description": task.get("description", ""),
        "urgency": task["urgency"],
        "effort": task["effort"],
        "importance": task["importance"],
        "status": task["status"],
        "isOpenLoop": task.get("isOpenLoop", False),
        "createdAt": _serialize_dt(task.get("createdAt")),
        "dueAt": _serialize_dt(task.get("dueAt")),
        "completedAt": _serialize_dt(task.get("completedAt")),
    }
    if "estimatedTimeToComplete" in task:
        doc["estimatedTimeToComplete"] = task["estimatedTimeToComplete"]
    if "nextAction" in task:
        doc["nextAction"] = task["nextAction"]
    return doc
