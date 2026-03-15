from datetime import datetime
from app.db.mongo import tasks_collection
from app.models.task_model import task_model, TASK_CATEGORIES, TASK_PRIORITIES


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

    category = data.get("category", "Work")
    if category not in TASK_CATEGORIES:
        return {"error": f"category must be one of: {', '.join(sorted(TASK_CATEGORIES))}"}

    priority = data.get("priority", "MED")
    if priority not in TASK_PRIORITIES:
        return {"error": f"priority must be one of: {', '.join(sorted(TASK_PRIORITIES))}"}

    task = task_model(
        userId=userId,
        title=title,
        description=data.get("description", ""),
        urgency=urgency,
        effort=effort,
        importance=importance,
        status=data.get("status", False),
        category=category,
        priority=priority,
        estimatedTimeToComplete=data.get("estimatedTimeToComplete"),
        isOpenLoop=data.get("isOpenLoop", False),
        dueAt=_parse_dt(data.get("dueAt")),
        completedAt=_parse_dt(data.get("completedAt")),
        nextAction=data.get("nextAction"),
    )
    tasks_collection.insert_one(task)
    return {"message": "Task created successfully", "taskId": task["taskId"]}


def update_task(taskId, data):
    if tasks_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    if not data:
        return {"error": "No data provided"}

    # Build update dict from provided fields only (partial update)
    updatable = (
        "title", "description", "urgency", "effort", "importance",
        "status", "category", "priority", "estimatedTimeToComplete", "isOpenLoop", "dueAt",
        "completedAt", "nextAction",
    )
    update = {}
    for key in updatable:
        if key in data:
            val = data[key]
            if key in ("dueAt", "completedAt"):
                val = _parse_dt(val)
            if key in ("urgency", "effort", "importance") and val is not None:
                if not (1 <= val <= 10):
                    return {"error": f"{key} must be between 1 and 10"}
            if key == "category":
                if val is None:
                    continue  # Skip invalid category; keep existing value
                if val not in TASK_CATEGORIES:
                    return {"error": f"category must be one of: {', '.join(sorted(TASK_CATEGORIES))}"}
            if key == "priority":
                if val is None:
                    continue
                if val not in TASK_PRIORITIES:
                    return {"error": f"priority must be one of: {', '.join(sorted(TASK_PRIORITIES))}"}
            update[key] = val

    if not update:
        return {"error": "No valid fields to update"}

    # Auto-set completedAt when status becomes true
    if update.get("status") is True and "completedAt" not in update:
        update["completedAt"] = datetime.utcnow()

    result = tasks_collection.update_one(
        {"taskId": taskId},
        {"$set": update},
    )
    if result.matched_count == 0:
        return {"error": "Task not found"}
    return {"message": "Task updated successfully"}


def delete_task(taskId):
    if tasks_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    result = tasks_collection.delete_one({"taskId": taskId})
    if result.deleted_count == 0:
        return {"error": "Task not found"}
    return {"message": "Task deleted successfully"}


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
        "category": task.get("category", "Work"),
        "priority": task.get("priority", "MED"),
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
