"""Train and save the deployed models (used by Docker and CI).

    python scripts/train.py                 # uses data/clean (output of notebook 01)
    python scripts/train.py --from-sample   # cleans data/sample first

Saves:
    models/safety_model.pkl     Linear SVM trained on IndicGuard + in-domain scheme questions
    models/language_model.pkl   Linear SVM language detector (12 languages)
    models/safety_config.json   decision and block thresholds (calibrated in notebook 03)
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import numpy as np
import pandas as pd

from bharatassist.config import DATA_DIR, MODEL_DIR, SAMPLE_DIR
from bharatassist.domain_data import build_domain_data
from bharatassist.evaluation import binary_metrics, multiclass_metrics
from bharatassist.exceptions import DatasetNotFoundError
from bharatassist.logger import get_logger
from bharatassist.models import LinearSVMModel
from bharatassist.preprocessing import DataPreprocessor, TextCleaner

DEFAULT_CONFIG = {"decision_threshold": -0.1, "block_threshold": 0.5}


def load(split: str, from_sample: bool) -> pd.DataFrame:
    if from_sample:
        path = SAMPLE_DIR / f"{split}_sample.csv.gz"
        if not path.exists():
            raise DatasetNotFoundError(path)
        return DataPreprocessor().run(pd.read_csv(path))
    path = DATA_DIR / "clean" / f"{split}_clean.csv.gz"
    if not path.exists():
        raise DatasetNotFoundError(path)
    return pd.read_csv(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--from-sample", action="store_true")
    parser.add_argument("--C", type=float, default=0.25)
    args = parser.parse_args()
    log = get_logger("train")
    cleaner = TextCleaner()

    train, test = load("train", args.from_sample), load("test", args.from_sample)
    domain = build_domain_data()
    dom_train = domain["train"].assign(clean_prompt=lambda d: d["prompt"].map(cleaner))
    dom_test = domain["test"].assign(clean_prompt=lambda d: d["prompt"].map(cleaner))
    log.info("train = %d IndicGuard + %d in-domain rows", len(train), len(dom_train))

    X = pd.concat([train["clean_prompt"], dom_train["clean_prompt"]], ignore_index=True)
    y = np.r_[train["label"].values, dom_train["label"].values]
    safety = LinearSVMModel(C=args.C).fit(X, y)
    for name, df in (("IndicGuard test", test), ("in-domain test", dom_test)):
        m = binary_metrics(df["label"], safety.predict(df["clean_prompt"]))
        log.info("Safety  %-16s macro-F1=%.3f  recall(unsafe)=%.3f", name, m["Macro F1"], m["Recall (unsafe)"])

    language = LinearSVMModel(C=0.5, balanced=False).fit(train["clean_prompt"], train["language"])
    acc = multiclass_metrics(test["language"], language.predict(test["clean_prompt"]))["Accuracy"]
    log.info("Language test accuracy=%.4f", acc)

    safety.save(MODEL_DIR / "safety_model.pkl")
    language.save(MODEL_DIR / "language_model.pkl")
    config_path = MODEL_DIR / "safety_config.json"
    if not config_path.exists():
        config_path.write_text(json.dumps(DEFAULT_CONFIG, indent=2))
    log.info("Models saved to %s", MODEL_DIR)
    return 0


if __name__ == "__main__":
    sys.exit(main())
