from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.db.mongo import users_collection
from app.models.user_model import user_model


def signup_user(data):
    """
    Register a new user.

    This function:
    - validates signup input
    - checks if the email already exists
    - hashes the plain password
    - injects passwordHash into a copy of the incoming data
    - reuses the existing user_model(data)
    - stores the user in MongoDB
    """

    if not data:
        return {"error": "No data provided"}, 400

    required_fields = ["email", "password", "firstName", "lastName"]
    for field in required_fields:
        if not data.get(field):
            return {"error": f"{field} is required"}, 400

    existing_user = users_collection.find_one({"email": data["email"]})
    if existing_user:
        return {"error": "Email already exists"}, 409

    # Hash the plain password sent by the client
    password_hash = generate_password_hash(data["password"])

    # Make a copy so we don't mutate the original request data directly
    user_data = dict(data)

    # Inject the hashed password into the structure expected by user_model
    user_data["passwordHash"] = password_hash

    # Build the final MongoDB document using the existing user model
    new_user = user_model(user_data)

    users_collection.insert_one(new_user)

    return {
        "message": "User registered successfully",
        "userId": new_user["userId"]
    }, 201


def login_user(data):
    """
    Log in a user and return a JWT access token.

    This function:
    - validates login input
    - finds the user by email
    - compares the incoming plain password to the stored password hash
    - returns a JWT token if authentication succeeds
    """

    if not data:
        return {"error": "No data provided"}, 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "email and password are required"}, 400

    user = users_collection.find_one({"email": email})

    if not user:
        return {"error": "Invalid email or password"}, 401

    if not check_password_hash(user["passwordHash"], password):
        return {"error": "Invalid email or password"}, 401

    access_token = create_access_token(identity=user["userId"])

    return {
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "userId": user.get("userId"),
            "email": user.get("email"),
            "firstName": user.get("firstName"),
            "lastName": user.get("lastName")
        }
    }, 200