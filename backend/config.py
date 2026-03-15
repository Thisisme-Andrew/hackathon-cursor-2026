import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory (works when run via npm run dev from project root)
backend_dir = Path(__file__).resolve().parent
load_dotenv(backend_dir / ".env")

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    # Shared demo user – session and dashboard use this so saved tasks appear on the board
    DEMO_USER_ID = "demo-user-123"
    DEMO_USER = {
        "id": "demo-user-123",
        "name": "Demo User",
        "email": "demo@orion.app",
    }
