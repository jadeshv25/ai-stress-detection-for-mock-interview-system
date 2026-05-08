import whisper
import subprocess
from pathlib import Path

model = whisper.load_model("small")

def convert_audio_to_text(file_path: str) -> str:
    try:
        source = Path(file_path)
        wav_path = source.with_suffix(".wav")

        if not source.exists() or source.stat().st_size == 0:
            return "Audio not clear"

        process = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", str(source),
                "-ar", "16000",
                "-ac", "1",
                "-af", "highpass=f=100, lowpass=f=4000, dynaudnorm",
                "-vn",
                str(wav_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        if process.returncode != 0 or not wav_path.exists():
            return "Audio not clear"

        result = model.transcribe(
            str(wav_path),
            temperature=0,
            beam_size=5,
            best_of=5,
            fp16=False,
        )

        text = result.get("text", "").strip()
        text = " ".join(text.split())

        return text if text else "Audio not clear"

    except Exception as e:
        print("Error:", e)
        return "Audio not clear"