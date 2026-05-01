import os
from functools import lru_cache
from pathlib import Path
from typing import cast
import subprocess
import whisper


@lru_cache(maxsize=1)
def _get_model():
    model_name = os.getenv("WHISPER_MODEL", "medium")
    try:
        return whisper.load_model(model_name)
    except MemoryError:
        if model_name != "tiny":
            return whisper.load_model("tiny")
        raise


def convert_audio_to_text(file_path):
    try:
        model = _get_model()
        source_path = Path(file_path)
        wav_path = source_path.with_suffix(".wav")

        conversion = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(source_path),
                "-ar",
                "16000",
                "-ac",
                "1",
                "-af",
                "volume=1.5",
                str(wav_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        if conversion.returncode != 0:
            print("FFmpeg Error:", conversion.stderr.decode())
            return "Audio conversion failed"

        if not wav_path.exists() or wav_path.stat().st_size == 0:
            print("WAV file issue")
            return "Audio conversion failed"

        result = model.transcribe(
            str(wav_path),
            language="en",
            task="transcribe",
            temperature=0,
            best_of=3,
            beam_size=3,
            fp16=False,
        )

        text = cast(str, result.get("text", "")).strip()

        print("Recognized Text:", text)

        if not text or len(text.split()) < 2:
            return "Audio not clear"

        return text

    except Exception as e:
        print("Speech Error:", str(e))
        return "Audio processing failed"
    #  PRELOAD MODEL AT STARTUP
print("Loading Whisper model...")
_get_model()
print("Whisper model loaded ✅")