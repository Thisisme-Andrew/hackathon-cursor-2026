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
