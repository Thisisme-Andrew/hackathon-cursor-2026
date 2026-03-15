"""Test MongoDB connection. Run standalone: python -m app.db.checkconnection"""
from app.db.mongo import client
from config import Config


def check_connection():
    """Verify MongoDB connection and print status. Returns True if connected."""
    if client is None:
        print("✗ Database connection failed: MONGO_URI and DB_NAME must be set.")
        return False
    try:
        client.admin.command("ping")
        print("✓ Database connected")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    print("Testing MongoDB connection...")
    print(f"DB_NAME: {Config.DB_NAME}")
    check_connection()