"""Text cleaning and dataframe preprocessing.

Covers Unit 1 (string processing, classes), Unit 2 (lambda / map / filter /
reduce) and Unit 4 (pandas cleaning, missing values, encoding, feature creation).
"""
from __future__ import annotations

import re
import unicodedata
from functools import reduce
from typing import Callable

import numpy as np
import pandas as pd

from .config import LABELS, LANGUAGE_MAP, TAG_MAP
from .exceptions import EmptyInputError

_URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
_WS_RE = re.compile(r"\s+")
_ZERO_WIDTH = dict.fromkeys(map(ord, "​‎‏﻿"), None)  # keep ZWJ/ZWNJ: Indic scripts need them


class TextCleaner:
    """Normalises raw prompt text so all 12 scripts are treated consistently."""

    def __init__(self, lowercase: bool = True, replace_urls: bool = True):
        self._lowercase = lowercase
        self._replace_urls = replace_urls

    def clean(self, text: str | None) -> str:
        if text is None or (isinstance(text, float) and np.isnan(text)):   # pandas NaN
            return ""
        text = unicodedata.normalize("NFC", str(text))   # one code-point form per character
        text = text.translate(_ZERO_WIDTH)
        if self._replace_urls:
            text = _URL_RE.sub(" <url> ", text)
        if self._lowercase:
            text = text.lower()                         # affects Latin script only
        return _WS_RE.sub(" ", text).strip()

    def clean_strict(self, text: str | None) -> str:
        """Like clean() but refuses empty input (used by the prediction API)."""
        cleaned = self.clean(text)
        if not cleaned:
            raise EmptyInputError("Input text is empty after cleaning.")
        return cleaned

    __call__ = clean


def normalize_language(value) -> str | float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return np.nan
    key = str(value).strip().lower()
    return LANGUAGE_MAP.get(key, str(value).strip().title())


def normalize_tag(value) -> str | float:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return np.nan
    return TAG_MAP.get(str(value).strip().lower(), "Other")


def split_categories(value) -> list[str]:
    """'Violence, Hate/Identity Hate' -> ['Violence', 'Hate/Identity Hate']"""
    if not isinstance(value, str):
        return []
    return list(filter(None, map(str.strip, value.split(","))))


class DataPreprocessor:
    """Runs the cleaning steps in order and records what each step changed."""

    def __init__(self, cleaner: TextCleaner | None = None):
        self.cleaner = cleaner or TextCleaner()
        self.report: list[dict] = []

    # --- individual steps -------------------------------------------------
    def normalize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["language"] = df["language"].map(normalize_language)
        df["tag"] = df["tag"].map(normalize_tag)
        # null and "" both mean "no response label" -> one missing marker
        df["response_label"] = df["response_label"].replace("", np.nan)
        return df

    def drop_missing_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        return df[df["prompt_label"].isin(LABELS.keys())]

    def clean_text(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["clean_prompt"] = df["prompt"].map(self.cleaner)
        return df

    def drop_empty(self, df: pd.DataFrame) -> pd.DataFrame:
        return df[df["clean_prompt"].str.len() > 0]

    def drop_duplicates(self, df: pd.DataFrame) -> pd.DataFrame:
        return df.drop_duplicates(subset=["language", "clean_prompt", "prompt_label"])

    def add_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df["char_len"] = df["clean_prompt"].str.len()
        df["word_count"] = df["clean_prompt"].map(lambda t: len(t.split()))
        df["label"] = df["prompt_label"].map(LABELS).astype(int)       # label encoding
        df["categories"] = df["violated_categories"].map(split_categories)
        df["n_categories"] = df["categories"].map(len)
        return df

    # --- pipeline -----------------------------------------------------------
    @property
    def steps(self) -> list[tuple[str, Callable]]:
        return [
            ("Normalise language / tag / response_label", self.normalize_columns),
            ("Drop rows with missing prompt_label", self.drop_missing_labels),
            ("Clean text (NFC, URLs, whitespace, case)", self.clean_text),
            ("Drop empty prompts", self.drop_empty),
            ("Drop exact duplicates", self.drop_duplicates),
            ("Add features + encode label", self.add_features),
        ]

    def run(self, df: pd.DataFrame) -> pd.DataFrame:
        self.report = []

        def apply(frame: pd.DataFrame, step: tuple[str, Callable]) -> pd.DataFrame:
            name, func = step
            out = func(frame)
            self.report.append({"step": name, "rows_before": len(frame),
                                "rows_after": len(out), "removed": len(frame) - len(out)})
            return out

        # functools.reduce chains every step: f6(...f2(f1(df)))
        return reduce(apply, self.steps, df).reset_index(drop=True)

    def report_frame(self) -> pd.DataFrame:
        return pd.DataFrame(self.report)


def category_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Multi-hot encode the violated categories (one column per category)."""
    return df["categories"].str.join("|").str.get_dummies(sep="|")


def check_leakage(a: pd.DataFrame, b: pd.DataFrame, key: str = "id") -> int:
    """Number of prompt ids present in both splits (should be 0)."""
    return len(set(a[key]) & set(b[key]))
