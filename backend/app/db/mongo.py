from pymongo import MongoClient
from config import Config

client = None
db = None
users_collection = None

# Only create a Mongo client when required env vars are provided.
if Config.MONGO_URI and Config.DB_NAME:
    client = MongoClient(Config.MONGO_URI)
    db = client[Config.DB_NAME]
    users_collection = db["users"]
