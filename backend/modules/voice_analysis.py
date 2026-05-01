import librosa
import numpy as np


def analyze_voice(file_path):
    try:
        # Load audio from video file
        y, sr = librosa.load(file_path, sr=None)

        # Energy (loudness)
        energy = np.mean(librosa.feature.rms(y=y))

        # Pitch (approx)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch = np.mean(pitches[pitches > 0]) if np.any(pitches > 0) else 0

        # Simple confidence logic
        confidence_score = int(min(100, (energy * 1000 + pitch / 50)))

        return {
            "energy": float(energy),
            "pitch": float(pitch),
            "confidence_score": confidence_score
        }

    except Exception as e:
        return {
            "error": str(e),
            "confidence_score": 50
        }