import asyncio
import io

import edge_tts

# Warm, calm neural voice — ideal for an anti-overwhelm app
VOICE = "en-US-AriaNeural"
RATE = "-8%"  # Slightly slower for a more soothing delivery


async def _synthesize(text: str) -> bytes:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    return buf.getvalue()


def synthesize_speech(text: str, mode: str = "calm", voice: str | None = None) -> dict:
    """Return {'audio': bytes} or {'error': str} for TTS voiceover."""
    if not text or not str(text).strip():
        return {"error": "text is required and cannot be empty."}
    try:
        audio_bytes = asyncio.run(_synthesize(str(text).strip()))
        if not audio_bytes:
            return {"error": "TTS generation returned empty audio."}
        return {"audio": audio_bytes, "voice": VOICE}
    except Exception as e:
        return {"error": f"TTS generation failed: {str(e)}"}
