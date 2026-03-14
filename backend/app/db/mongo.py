from urllib.parse import quote_plus
import certifi
from pymongo import MongoClient
from config import Config


def _encode_mongo_uri(uri: str) -> str:
    """URL-encode username and password in MongoDB URI (RFC 3986)."""
    if not uri or "://" not in uri:
        return uri
    scheme, rest = uri.split("://", 1)
    if "@" not in rest:
        return uri
    auth, host_part = rest.rsplit("@", 1)
    if ":" not in auth:
        return uri
    username, password = auth.split(":", 1)
    encoded = f"{scheme}://{quote_plus(username)}:{quote_plus(password)}@{host_part}"
    return encoded


client = MongoClient(
    _encode_mongo_uri(Config.MONGO_URI),
    tlsCAFile=certifi.where(),
)
db = client[Config.DB_NAME]

users_collection = db["users"]
