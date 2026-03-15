from app.db.mongo import users_collection
from app.models.user_model import user_model


def create_user(data):
    if users_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    if not data:
        return {"error": "No data provided"}

    required_fields = ["email", "passwordHash", "firstName", "lastName"]

    for field in required_fields:
        if not data.get(field):
            return {"error": f"{field} is required"}

     # Prevent duplicate users by email
    existing_user = users_collection.find_one({"email": data.get("email")})
    if existing_user:
        return {"error": "Email already exists"}
    
    new_user = user_model(data)
    result = users_collection.insert_one(new_user)

    return {
        "message": "User created successfully",
        "user_id": new_user["userId"],
        "mongoId": str(result.inserted_id)
    }


def get_all_users():
    if users_collection is None:
        return {"error": "Database is not configured. Set MONGO_URI and DB_NAME."}

    users = []
    for user in users_collection.find():
        users.append({
            "userId": user.get("userId"),
            "email": user.get("email"),
            "firstName": user.get("firstName"),
            "lastName": user.get("lastName"),
            "timezone": user.get("timezone"),
            "createdAt": user.get("createdAt"),
            "overwhelmScore": user.get("overwhelmScore"),
            "accountabilityPartnerId": user.get("accountabilityPartnerId"),
            "preferredDomain": user.get("preferredDomain"),
            "settings": user.get("settings", {})
        })
    return users

def update_user(user_id, data):
    """
    Update an existing user by userId.

    Parameters
    ----------
    user_id : str
        The custom UUID-style userId stored in the document.
    data : dict
        The fields the client wants to update.

    Returns
    -------
    dict
        Success or error message.
    """

    if not data:
        return {"error": "No data provided"}

        # 1. Protect immutable fields
    forbidden = ["_id", "userId", "createdAt"]
    for field in forbidden:
        data.pop(field, None)

    # 2. Check for email duplicates
    if "email" in data:
        if users_collection.find_one({"email": data["email"], "userId": {"$ne": user_id}}):
            return {"error": "Email already exists"}

    update_query = {}
    if "settings" in data:
        settings = data.pop("settings")
        for key, value in settings.get("categoryWeights", {}).items():
            update_query[f"settings.categoryWeights.{key}"] = value

    for key, value in data.items():
        update_query[key] = value

    result = users_collection.update_one(
        {"userId": user_id},
        {"$set": update_query}
    )

    if result.matched_count == 0:
        return {"error": "User not found"}

    return {"message": "User updated successfully"}

def delete_user(user_id):
    """
    Delete a user by userId.

    Parameters
    ----------
    user_id : str
        The custom UUID-style userId stored in the document.

    Returns
    -------
    dict
        Success or error message.
    """

    result = users_collection.delete_one({"userId": user_id})

    if result.deleted_count == 0:
        return {"error": "User not found"}

    return {"message": "User deleted successfully"}