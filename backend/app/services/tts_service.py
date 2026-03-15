import io

try:
    from kokoro import KPipeline
    import soundfile as sf
except Exception:
    KPipeline = None

KOKORO_VOICE = "af_heart"  # US HEART (default)


def synthesize_speech(text: str, mode: str = "calm", voice: str | None = None) -> dict:
    """Return {'audio': bytes} or {'error': str} for demo question voiceover."""
    if KPipeline is None:
        return {
            "error": "TTS backend unavailable. Install kokoro and soundfile in Python dependencies."
        }
    if not text or not str(text).strip():
        return {"error": "text is required and cannot be empty."}
    selected_voice = (
        "af_bella"  # Use af_bella (soothing, high-quality, less espeak dependency)
    )
    try:
        pipeline = KPipeline(lang_code="a")
        generator = pipeline(str(text).strip(), voice=selected_voice)
        audio_bytes = b""
        for i, (gs, ps, audio) in enumerate(generator):
            buf = io.BytesIO()
            sf.write(buf, audio, 24000, format="WAV")
            audio_bytes += buf.getvalue()
        if not audio_bytes:
            return {"error": "TTS generation returned empty audio."}
        return {"audio": audio_bytes, "voice": selected_voice}
    except Exception as e:
        return {"error": f"TTS generation failed: {str(e)}"}
