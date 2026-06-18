# Purpose: Provide reusable service/business logic.

import os
import shutil
import whisper

# Main flow: Execute core operations and return results.

_model = None


# Function: _resolve_ffmpeg - Handles resolve ffmpeg.
def _resolve_ffmpeg() -> str:
    """Ensure ffmpeg is discoverable for Whisper's subprocess call."""
    configured = os.getenv("FFMPEG_PATH", "").strip()
    if configured:
        ffmpeg_dir = configured
        if os.path.isfile(configured):
            ffmpeg_dir = os.path.dirname(configured)
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        raise RuntimeError(
            "ffmpeg not found. Install ffmpeg and ensure it is in PATH, "
            "or set FFMPEG_PATH in transcription-service/.env to the ffmpeg folder "
            "(or full ffmpeg.exe path)."
        )

    return ffmpeg_bin


# Function: get_model - Returns model.
def get_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "base")
        _model = whisper.load_model(model_name)
    return _model


# Function: transcribe - Handles transcribe.
def transcribe(file_path: str) -> dict:
    _resolve_ffmpeg()
    model = get_model()
    result = model.transcribe(file_path)
    return result
