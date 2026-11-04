"""Logging to console and logs/pipeline.log (Unit 2: file handling)."""
import logging

from .config import LOG_DIR


def get_logger(name: str = "bharatassist") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:                      # already configured
        return logger
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)s | %(message)s")
    file_handler = logging.FileHandler(LOG_DIR / "pipeline.log", encoding="utf-8")
    file_handler.setFormatter(fmt)
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logger.addHandler(file_handler)
    logger.addHandler(console)
    logger.setLevel(logging.INFO)
    return logger
