"""Central configuration: paths, label maps and constants."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # .../ml
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"                          # put IndicGuard train/valid/test JSON here
SAMPLE_DIR = DATA_DIR / "sample"                    # stratified samples written here
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"
FIGURE_DIR = REPORT_DIR / "figures"
LOG_DIR = ROOT / "logs"

RANDOM_SEED = 42

# Rows sampled per language from each split (12 languages)
SAMPLE_PER_LANGUAGE = {"train": 4000, "valid": 1000, "test": 1500}

# Columns kept from the raw records (raw response text is dropped - not needed
# for prompt moderation and it keeps the sample small)
KEEP_COLUMNS = ["id", "language", "prompt", "prompt_label", "response_label",
                "violated_categories", "tag", "prompt_label_source"]

# The raw data spells the same language in different ways
LANGUAGE_MAP = {
    "english": "English", "gujrati": "Gujarati", "gujarati": "Gujarati",
    "punajbi": "Punjabi", "punjabi": "Punjabi", "bengali": "Bengali",
    "hindi": "Hindi", "kannada": "Kannada", "malayalam": "Malayalam",
    "marathi": "Marathi", "odia": "Odia", "tamil": "Tamil",
    "telugu": "Telugu", "urdu": "Urdu",
}

# 7 raw spellings -> 3 prompt types
TAG_MAP = {
    "generic": "Generic",
    "jailbreaking": "Jailbreak", "jail breaking": "Jailbreak",
    "culture_adaptive": "Culture-adaptive", "culture adaptive": "Culture-adaptive",
}

LABELS = {"safe": 0, "unsafe": 1}
