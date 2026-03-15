from datetime import datetime
import uuid

def user_model(data):
    """
    Create a normalized user document to be inserted into MongoDB.

    This function takes input data (usually from a POST request body),
    extracts the expected fields, applies defaults where necessary,
    and returns a properly structured dictionary that matches the
    Users collection schema.

    """

    return {
        # Generate a unique UUID for the user
        "userId": str(uuid.uuid4()),

        # Basic user identity fields provided by the client
        "email": data.get("email"),
        "passwordHash": data.get("passwordHash"),
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),

        # Default timezone if not provided
        "timezone": data.get("timezone", "UTC"),

        "createdAt": datetime.utcnow(),

        # Default overwhelm score (initial state)
        "overwhelmScore": data.get("overwhelmScore", 0),

        # Optional relationship to another user
        "accountabilityPartnerId": data.get("accountabilityPartnerId"),

        # Optional domain preference 
        "preferredDomain": data.get("preferredDomain"),

        # Nested user settings
        "settings": {
            "categoryWeights": {

                # Each category weight defaults to 0 if not provided

                "work": data.get("settings", {}).get("categoryWeights", {}).get("work", 0),
                "health": data.get("settings", {}).get("categoryWeights", {}).get("health", 0),
                "relationships": data.get("settings", {}).get("categoryWeights", {}).get("relationships", 0),
                "finance": data.get("settings", {}).get("categoryWeights", {}).get("finance", 0),
                "personalGrowth": data.get("settings", {}).get("categoryWeights", {}).get("personalGrowth", 0),
                "spirituality": data.get("settings", {}).get("categoryWeights", {}).get("spirituality", 0),
                "family": data.get("settings", {}).get("categoryWeights", {}).get("family", 0)
            }
        }
    }