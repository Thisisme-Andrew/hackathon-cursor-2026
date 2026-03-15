from app.db.mongo import users_collection
from app.models.user_model import user_model


def create_user(data):
    if users_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    if not data:
        return {"error": "No data provided"}

    name = data.get("name")
    email = data.get("email")

    if not name or not email:
        return {"error": "name and email are required"}

    user = user_model(name, email)
    users_collection.insert_one(user)

    return {"message": "User created successfully"}


def get_all_users():
    if users_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    users = []
    for user in users_collection.find():
        users.append(
            {"id": str(user["_id"]), "name": user["name"], "email": user["email"]}
        )
    return users
