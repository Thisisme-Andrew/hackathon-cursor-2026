import uuid
from datetime import datetime


def task_model(
    userId,
    title,
    description,
    urgency,
    effort,
    importance,
    status=False,
    estimatedTimeToComplete=None,
    isOpenLoop=False,
    dueAt=None,
    completedAt=None,
    nextAction=None,
):
    """Build a task document matching the Tasks schema."""
    now = datetime.utcnow()
    task = {
        "taskId": str(uuid.uuid4()),
        "userId": userId,
        "title": title,
        "description": description or "",
        "urgency": urgency,
        "effort": effort,
        "importance": importance,
        "status": status,
        "isOpenLoop": isOpenLoop,
        "createdAt": now,
        "dueAt": dueAt,
        "completedAt": completedAt,
    }
    if estimatedTimeToComplete is not None:
        task["estimatedTimeToComplete"] = estimatedTimeToComplete
    if nextAction:
        task["nextAction"] = {
            "text": nextAction.get("text", ""),
            "estimateMins": nextAction.get("estimateMins", 0),
        }
    return task
