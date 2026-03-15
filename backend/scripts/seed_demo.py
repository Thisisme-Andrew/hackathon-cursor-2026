"""
Seed a demo user and 7 tasks for dashboard testing.
Run from project root: python -m backend.scripts.seed_demo
Or from backend/: python -m scripts.seed_demo
"""
import sys
from pathlib import Path

# Ensure backend is on path (app lives in backend/app)
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timezone

from config import Config

DEMO_USER_ID = Config.DEMO_USER_ID
DEMO_EMAIL = Config.DEMO_USER["email"]

DEMO_TASKS = [
    {"title": "Review project proposal", "category": "Work", "priority": "HIGH", "duration": "30 min"},
    {"title": "Morning meditation", "category": "Health", "priority": "MED", "duration": "15 min"},
    {"title": "Call mom", "category": "Family", "priority": "HIGH", "duration": "20 min"},
    {"title": "Update budget spreadsheet", "category": "Finance", "priority": "MED", "duration": "45 min"},
    {"title": "Read 20 pages", "category": "Personal Growth", "priority": "LOW", "duration": "25 min"},
    {"title": "Team standup prep", "category": "Work", "priority": "HIGH", "duration": "10 min"},
    {"title": "Evening gratitude journal", "category": "Spirituality", "priority": "LOW", "duration": "10 min"},
]


def seed():
    from app.db.mongo import users_collection, tasks_collection
    from app.models.task_model import task_model

    if users_collection is None or tasks_collection is None:
        print("ERROR: Database not configured. Set MONGO_URI and DB_NAME in .env")
        return False

    # Upsert demo user
    demo_user = {
        "userId": DEMO_USER_ID,
        "email": DEMO_EMAIL,
        "passwordHash": "demo-password-hash",
        "firstName": "Demo",
        "lastName": "User",
        "timezone": "UTC",
        "createdAt": datetime.now(timezone.utc),
        "overwhelmScore": 0,
        "settings": {
            "categoryWeights": {
                "work": 3,
                "health": 3,
                "relationships": 3,
                "finance": 3,
                "personalGrowth": 2,
                "spirituality": 2,
                "family": 3,
            }
        },
    }
    users_collection.update_one(
        {"userId": DEMO_USER_ID},
        {"$set": demo_user},
        upsert=True,
    )
    print(f"Seeded demo user: {DEMO_USER_ID} ({DEMO_EMAIL})")

    # Delete existing tasks for this user (idempotent re-seed)
    tasks_collection.delete_many({"userId": DEMO_USER_ID})

    # Insert 7 tasks
    for t in DEMO_TASKS:
        task = task_model(
            userId=DEMO_USER_ID,
            title=t["title"],
            description="",
            urgency=5,
            effort=5,
            importance=5,
            status=False,
            category=t["category"],
            priority=t["priority"],
            estimatedTimeToComplete=t["duration"],
        )
        tasks_collection.insert_one(task)
        print(f"  - {t['title']} ({t['category']}, {t['priority']})")

    print("Done. Dashboard will show 7 tasks for demo user.")
    return True


if __name__ == "__main__":
    # Load config
    from config import Config
    if not Config.MONGO_URI or not Config.DB_NAME:
        print("ERROR: MONGO_URI and DB_NAME must be set in backend/.env")
        sys.exit(1)
    success = seed()
    sys.exit(0 if success else 1)
