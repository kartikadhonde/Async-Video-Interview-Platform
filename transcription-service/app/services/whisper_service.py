import os
import shutil
import whisper

_model = None


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


def get_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "base")
        print(f"Loading Whisper model: {model_name}")
        _model = whisper.load_model(model_name)
        print("Whisper model loaded")
    return _model


def transcribe(file_path: str) -> dict:
    ffmpeg_bin = _resolve_ffmpeg()
    print(f"Using ffmpeg: {ffmpeg_bin}")
    model = get_model()
    result = model.transcribe(file_path)
    return result
