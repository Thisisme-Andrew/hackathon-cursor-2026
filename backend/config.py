import os
from pathlib import Path
from dotenv import load_dotenv

# Load project-level .env first, then backend/.env as fallback.
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
load_dotenv(project_root / ".env")
load_dotenv(backend_dir / ".env")


class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")

    # Shared demo user – session and dashboard use this so saved tasks appear on the board
    DEMO_USER_ID = "demo-user-123"
    DEMO_USER = {
        "id": "demo-user-123",
        "name": "Demo User",
        "email": "demo@orion.app",
    }
