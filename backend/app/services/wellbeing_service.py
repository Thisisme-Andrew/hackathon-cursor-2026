import json
import re

from groq import Groq
from config import Config

WELLBEING_SYSTEM_PROMPT = """You are an expert at assessing psychological state from spoken or written transcript text.
From the given transcript, score the following four dimensions from 1 (low/none) to 10 (high/severe). Return ONLY a valid JSON object with exactly these keys and integer values.

- stressAnxiousArousal: acute sympathetic activation, worry tone, agitation
- fatigueSleepiness: reduced alertness, psychomotor slowing, sleep loss
- cognitiveLoad: working-memory strain, reduced fluency, higher disfluency
- decisionParalysis: difficulty committing to a next action; stress + uncertainty + overload

Respond with nothing but the JSON object, no explanation. Example: {"stressAnxiousArousal": 3, "fatigueSleepiness": 2, "cognitiveLoad": 5, "decisionParalysis": 4}"""


def extract_wellbeing_scores(text: str) -> dict:
    """
    Extract overwhelm-related scores (1-10) from transcript text using Groq.
    Returns {"wellbeing": { stressAnxiousArousal, fatigueSleepiness, cognitiveLoad, decisionParalysis }} or {"error": "..."}.
    """
    if not Config.GROQ_API_KEY:
        return {"error": "Groq API key is not configured. Set GROQ_API_KEY."}

    if not text or not text.strip():
        return {"error": "text is required and cannot be empty."}

    try:
        client = Groq(api_key=Config.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": WELLBEING_SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n\n{text}"},
            ],
        )
        raw = response.choices[0].message.content.strip()
        # Allow JSON inside markdown code block
        match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
        if match:
            raw = match.group(0)
        data = json.loads(raw)
        # Normalize keys and ensure 1-10 integers
        required = ("stressAnxiousArousal", "fatigueSleepiness", "cognitiveLoad", "decisionParalysis")
        wellbeing = {}
        for key in required:
            val = data.get(key)
            if val is None:
                wellbeing[key] = 5  # default mid
            else:
                try:
                    n = int(val)
                    wellbeing[key] = max(1, min(10, n))
                except (TypeError, ValueError):
                    wellbeing[key] = 5
        return {"wellbeing": wellbeing}
    except json.JSONDecodeError as e:
        return {"error": f"Wellbeing response parse error: {str(e)}"}
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}
