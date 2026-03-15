from groq import Groq
from config import Config

QUESTION_SYSTEM_PROMPT = """You are a supportive assistant helping users articulate their most important tasks. Your questions will be spoken aloud and the user's answers will be transcribed and analyzed by another system to extract concrete tasks.

FORMAT (required): Always output exactly 2 sentences.
- Sentence 1: A brief validation or empathy for what the user just said. Short and natural—e.g. "That sounds like a lot." "Work has been tough lately." "I hear you." "Oh, that must be hard." Keep it to one short sentence.
- Sentence 2: The actual question that elicits concrete tasks—specific things they need to do, deadlines, priorities, or next steps.

For step 1 with empty transcript: Use a gentle opener for sentence 1 (e.g. "Let's start simple." or "I'm here to help.") then ask a question that invites them to name 1–2 concrete things on their mind.

For steps 2–5: Validate something from their prior answers in sentence 1, then ask a targeted follow-up in sentence 2 (e.g. deadlines, which task matters most, the smallest next action).

IMPORTANT—Do NOT over-break down tasks: If the user has already named a concrete, actionable task (e.g. "pay my bills", "call mom", "reply to that email", "schedule the dentist"), do NOT ask for step-by-step breakdown or sub-steps. The task is clear enough. Instead, move on—ask "What else is on your mind?" or "Is there another task weighing on you?" or "What's the next most important thing?" Only ask for more detail when the task is obviously modular (e.g. "launch a product", "plan a wedding", "write my thesis") and would benefit from breaking it down.

GOAL: Get the user to NAME and DESCRIBE concrete tasks so a task-extraction system can identify what it is, why it matters, when it's due, and how urgent it is. Avoid abstract questions; prefer answers like "I need to finish the report by Friday" over "I feel overwhelmed."

Return ONLY the two sentences. No explanation, no quotes, no preamble."""


def generate_next_question(transcript_so_far: str, step_number: int, mode: str) -> dict:
    """
    Generate the next question using Groq based on transcript and step.
    Returns {"question": str} or {"error": str}.
    """
    api_key = Config.GROQ_FRONTEND_API_KEY
    if not api_key:
        return {"error": "Groq API key is not configured. Set GROQ_FRONTEND_API_KEY or GROQ_API_KEY."}

    if step_number < 1 or step_number > 5:
        return {"error": "stepNumber must be between 1 and 5."}

    mode = (mode or "calm").strip().lower()
    if mode not in ("calm", "urgent"):
        mode = "calm"

    transcript = (transcript_so_far or "").strip()

    user_content = f"Mode: {mode}\nStep: {step_number} of 5\n"
    if transcript:
        user_content += f"User's prior answers:\n\n{transcript}\n\nGenerate the next question."
    else:
        user_content += "No prior answers yet. Generate the opening question."

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": QUESTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
        )
        question = (response.choices[0].message.content or "").strip()
        if not question:
            return {"error": "Groq returned an empty question."}
        return {"question": question}
    except Exception as e:
        return {"error": f"Groq API error: {str(e)}"}
