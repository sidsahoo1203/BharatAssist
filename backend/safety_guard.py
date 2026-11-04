"""ML safety guard for BharatAssist AI.

Loads the two models trained in ml/ on the IndicGuard dataset:
* language_model.pkl - detects the language of a message (12 Indian languages)
* safety_model.pkl   - scores how likely a message is unsafe (Linear SVM)

Policy (thresholds from ml/models/safety_config.json, calibrated in notebook 03):
    score >= block_threshold     -> "block"   (polite refusal)
    score >  decision_threshold  -> "review"  (answered, flagged)
    otherwise                    -> "allow"
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parents[1] / "ml"
sys.path.insert(0, str(ML_DIR / "src"))

from bharatassist.models import BaseTextClassifier  # noqa: E402
from bharatassist.preprocessing import TextCleaner  # noqa: E402


class SafetyGuard:
    def __init__(self, model_dir: Path = ML_DIR / "models"):
        self._safety = BaseTextClassifier.load(model_dir / "safety_model.pkl")
        self._language = BaseTextClassifier.load(model_dir / "language_model.pkl")
        config = json.loads((model_dir / "safety_config.json").read_text())
        self.decision_threshold = float(config["decision_threshold"])
        self.block_threshold = float(config["block_threshold"])
        self._cleaner = TextCleaner()

    def check(self, text: str) -> dict:
        cleaned = self._cleaner.clean_strict(text)          # raises EmptyInputError on blank text
        score = float(self._safety.decision_scores([cleaned])[0])
        if score >= self.block_threshold:
            action = "block"
        elif score > self.decision_threshold:
            action = "review"
        else:
            action = "allow"
        return {"language": str(self._language.predict([cleaned])[0]), "score": round(score, 3), "action": action}


_guard: SafetyGuard | None = None


def get_guard() -> SafetyGuard:
    """Load the models once, on first use."""
    global _guard
    if _guard is None:
        _guard = SafetyGuard()
    return _guard
