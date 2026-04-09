"""
Módulo de transcripción de audio a texto.
Usa faster-whisper (CTranslate2 + int8) como backend principal — 4-8x más rápido que openai-whisper en CPU.
Fallback a openai-whisper si faster-whisper no está disponible.
"""
import os
import tempfile
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Intentar faster-whisper primero ──────────────────────────────────────────
try:
    from faster_whisper import WhisperModel as FasterWhisperModel
    FASTER_WHISPER_AVAILABLE = True
    logger.info("faster-whisper disponible — usando backend rápido (int8 CPU)")
except ImportError:
    FASTER_WHISPER_AVAILABLE = False
    logger.warning("faster-whisper no encontrado, probando openai-whisper...")

# ── Fallback: openai-whisper ──────────────────────────────────────────────────
WHISPER_AVAILABLE = False
if not FASTER_WHISPER_AVAILABLE:
    try:
        import whisper as openai_whisper
        WHISPER_AVAILABLE = True
        logger.info("openai-whisper disponible como fallback")
    except ImportError:
        logger.warning("Ningún backend de Whisper está instalado.")
else:
    WHISPER_AVAILABLE = True  # faster-whisper cuenta como disponible

DEFAULT_MODEL = "base"

# ── Singleton de modelo ───────────────────────────────────────────────────────
_faster_model: Optional[FasterWhisperModel] = None  # type: ignore
_faster_model_size: Optional[str] = None

_openai_model = None
_openai_model_size: Optional[str] = None


def _get_faster_model(model_size: str = DEFAULT_MODEL) -> "FasterWhisperModel":
    global _faster_model, _faster_model_size
    if _faster_model is None or _faster_model_size != model_size:
        logger.info(f"Cargando faster-whisper modelo '{model_size}' en CPU int8...")
        _faster_model = FasterWhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",   # quantización int8 → 4-8x más rápido
        )
        _faster_model_size = model_size
        logger.info(f"Modelo faster-whisper '{model_size}' listo")
    return _faster_model


def _get_openai_model(model_size: str = DEFAULT_MODEL):
    global _openai_model, _openai_model_size
    if _openai_model is None or _openai_model_size != model_size:
        logger.info(f"Cargando openai-whisper modelo '{model_size}'...")
        _openai_model = openai_whisper.load_model(model_size)  # type: ignore
        _openai_model_size = model_size
    return _openai_model


def _transcribe_with_faster(audio_path: str, language: str, model_size: str) -> dict:
    """Transcribe usando faster-whisper. Retorna dict compatible con openai-whisper."""
    model = _get_faster_model(model_size)
    segments_gen, info = model.transcribe(
        audio_path,
        language=language if language else None,
        beam_size=5,
        vad_filter=True,           # filtra silencios → más rápido
        vad_parameters=dict(min_silence_duration_ms=500),
    )
    segments = list(segments_gen)
    full_text = " ".join(s.text.strip() for s in segments)
    return {
        "text": full_text,
        "language": info.language,
        "duration": info.duration,
        "segments": [{"start": s.start, "end": s.end, "text": s.text} for s in segments],
    }


def _transcribe_with_openai(audio_path: str, language: str, model_size: str) -> dict:
    """Transcribe usando openai-whisper como fallback."""
    model = _get_openai_model(model_size)
    result = model.transcribe(audio_path, language=language, fp16=False)
    return result


# ── API pública ───────────────────────────────────────────────────────────────

def transcribe_audio_bytes(
    audio_bytes: bytes,
    file_extension: str = ".wav",
    language: str = "es",
    model_size: str = DEFAULT_MODEL,
) -> dict:
    """
    Transcribe audio desde bytes. Usa faster-whisper si está disponible,
    si no, cae a openai-whisper.

    Returns: {"text": str, "language": str, "duration": float, "segments": list}
    """
    if not WHISPER_AVAILABLE:
        raise RuntimeError("Ningún backend de Whisper está instalado.")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name

        if FASTER_WHISPER_AVAILABLE:
            return _transcribe_with_faster(tmp_path, language, model_size)
        else:
            return _transcribe_with_openai(tmp_path, language, model_size)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


def is_whisper_available() -> bool:
    """Retorna True si hay algún backend de Whisper disponible."""
    return WHISPER_AVAILABLE
