from typing import Optional

from groq import Groq
from config import Config

DEFAULT_QUESTION = "Summarize and note key points from this speech."


def query_speech(text: str, question: Optional[str] = None) -> dict:
    """
    Send transcript text to Groq and return an answer (or error dict).
    """
    if not Config.GROQ_API_KEY:
        return {"error": "Groq API key is not configured. Set GROQ_API_KEY."}

    if not text or not text.strip():
        return {"error": "text is required and cannot be empty."}

    prompt = question.strip() if question and question.strip() else DEFAULT_QUESTION

    try:
        client = Groq(api_key=Config.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer based only on the user's provided transcript.",
                },
                {
                    "role": "user",
                    "content": f"Transcript:\n\n{text}\n\nQuestion: {prompt}",
                },
            ],
        )
        answer = response.choices[0].message.content
        return {"answer": answer}
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}
