import os
import whisper

_model = None


def get_model():
    global _model
    if _model is None:
        model_name = os.getenv("WHISPER_MODEL", "base")
        print(f"Loading Whisper model: {model_name}")
        _model = whisper.load_model(model_name)
        print("Whisper model loaded")
    return _model


def transcribe(file_path: str) -> dict:
    model = get_model()
    result = model.transcribe(file_path)
    return result
