import json
import re

from groq import Groq
from config import Config

# Lightweight transcript cues from literature: disfluency and hedging correlate with
# cognitive load and decision paralysis; word count/sentence structure can inform stress/load.
FILLER_PATTERN = re.compile(
    r"\b(um|uh|er|ah|hmm|hm)\b|(\bI mean\b|\byou know\b)|(\blike\b)",
    re.IGNORECASE
)
HEDGING_PATTERN = re.compile(
    r"\b(I don't know|dunno|don't know|maybe|perhaps|not sure|should I|I guess|"
    r"kind of|kinda|sort of|sorta|might be|could be|I think|I feel like|whether to|"
    r"can't decide|don't know what to|stuck|unsure)\b",
    re.IGNORECASE
)


def _transcript_cues(text: str) -> str:
    """Compute research-grounded transcript cues (disfluency, hedging, length) for the LLM."""
    if not text or not text.strip():
        return ""
    t = text.strip()
    words = t.split()
    word_count = len(words)
    # Simple sentence split; count clauses/sentences
    sentences = [s.strip() for s in re.split(r"[.!?]+", t) if s.strip()]
    sentence_count = max(1, len(sentences))
    avg_words_per_sentence = round(word_count / sentence_count, 1) if word_count else 0
    filler_matches = len(FILLER_PATTERN.findall(t))
    hedging_matches = len(HEDGING_PATTERN.findall(t))
    filler_rate = round(filler_matches / word_count, 3) if word_count else 0
    hedging_rate = round(hedging_matches / word_count, 3) if word_count else 0
    short_sentences = sum(1 for s in sentences if len(s.split()) <= 4)
    return (
        f"word_count={word_count} sentence_count={sentence_count} "
        f"avg_words_per_sentence={avg_words_per_sentence} "
        f"filler_count={filler_matches} filler_rate_per_word={filler_rate} "
        f"hedging_count={hedging_matches} hedging_rate_per_word={hedging_rate} "
        f"short_sentences_leq_4_words={short_sentences}"
    )

WELLBEING_SYSTEM_PROMPT = """You are an expert at assessing psychological state from spoken or written transcript text.
Your task is to infer probabilistic SIGNALS from language only—these are not diagnoses. Score conservatively; when evidence is weak, prefer mid-range (4-6).

From the transcript (and any observed transcript cues if provided), score these four dimensions from 1 (low/none) to 10 (high/severe). Return ONLY a valid JSON object with exactly these keys and integer values.

- stressAnxiousArousal: acute stress, worry tone, agitation. Look for: negative emotion words, anxious or agitated wording, expressions of worry or fear.
- fatigueSleepiness: reduced alertness, psychomotor slowing, sleep loss. Look for: mentions of tiredness, exhaustion, sleep, low energy, or language suggesting slowness or difficulty focusing.
- cognitiveLoad: working-memory strain, reduced fluency, higher disfluency. Look for: fillers (um, uh, like as filler), repetitions, self-corrections, fragmented or run-on sentences, shorter/simpler utterances, language that suggests mental effort or overload.
- decisionParalysis: difficulty committing to a next action; stress + uncertainty + overload. Look for: hedging ("I don't know", "maybe", "perhaps", "not sure", "should I", "I guess"), repeated option comparison, difficulty choosing or committing, expressions of being stuck or unable to decide.

Note: Some research associates higher anxiety with speaking less (lower word count); very short transcripts with negative tone may indicate elevated stress. Use the observed cues (filler count, hedging count, word/sentence stats) if provided to inform cognitiveLoad and decisionParalysis.

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
        cues = _transcript_cues(text)
        user_content = f"Transcript:\n\n{text}"
        if cues:
            user_content += f"\n\nObserved transcript cues: {cues}"
        client = Groq(api_key=Config.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": WELLBEING_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
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
