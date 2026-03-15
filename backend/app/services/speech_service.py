from typing import Optional

from openai import OpenAI
from config import Config

DEFAULT_QUESTION = "Summarize and note key points from this speech."


def query_speech(text: str, question: Optional[str] = None) -> dict:
    """
    Send transcript text to OpenAI and return an answer (or error dict).
    """
    if not Config.OPENAI_API_KEY:
        return {"error": "OpenAI API key is not configured. Set OPENAI_API_KEY."}

    if not text or not text.strip():
        return {"error": "text is required and cannot be empty."}

    prompt = question.strip() if question and question.strip() else DEFAULT_QUESTION

    try:
        client = OpenAI(api_key=Config.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
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
        return {"error": f"OpenAI API error: {str(e)}"}
