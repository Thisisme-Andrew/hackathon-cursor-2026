from pymongo import MongoClient
from config import Config
# changes

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

users_collection = db["users"]
