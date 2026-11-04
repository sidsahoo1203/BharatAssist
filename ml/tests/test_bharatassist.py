"""Unit tests (pytest) - these will run in the CI pipeline for Review-2."""
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from bharatassist.data_loader import ReservoirSampler, stream_records
from bharatassist.exceptions import DatasetNotFoundError, EmptyInputError, ModelNotTrainedError
from bharatassist.models import BaseTextClassifier, LinearSVMModel, NaiveBayesModel, all_models
from bharatassist.preprocessing import (DataPreprocessor, TextCleaner, normalize_language,
                                       normalize_tag, split_categories)


@pytest.mark.parametrize("raw,expected", [("Gujrati", "Gujarati"), ("Punajbi", "Punjabi"),
                                          ("english", "English"), (" Hindi ", "Hindi")])
def test_normalize_language(raw, expected):
    assert normalize_language(raw) == expected


@pytest.mark.parametrize("raw,expected", [("Jail breaking", "Jailbreak"), ("jailbreaking", "Jailbreak"),
                                          ("Culture Adaptive", "Culture-adaptive"),
                                          ("Culture_adaptive", "Culture-adaptive"), ("generic", "Generic")])
def test_normalize_tag(raw, expected):
    assert normalize_tag(raw) == expected


def test_cleaner_whitespace_url_case_and_nan():
    c = TextCleaner()
    assert c.clean("  Visit   HTTPS://x.com  NOW ") == "visit <url> now"
    assert c.clean(None) == "" and c.clean(float("nan")) == ""
    with pytest.raises(EmptyInputError):
        c.clean_strict("   ")


def test_cleaner_keeps_indic_text():
    assert TextCleaner().clean("पीएम  किसान") == "पीएम किसान"


def test_split_categories():
    assert split_categories("Violence, Hate/Identity Hate,") == ["Violence", "Hate/Identity Hate"]
    assert split_categories(np.nan) == []


def _toy_frame():
    return pd.DataFrame({
        "id": list("abcde"), "language": ["Gujrati", "english", "english", "Hindi", "Hindi"],
        "prompt": ["hello", "Hi  there", "Hi there", "नमस्ते", None],
        "prompt_label": ["safe", "unsafe", "unsafe", None, "safe"],
        "response_label": ["", None, "safe", "safe", ""],
        "violated_categories": [None, "Violence", "Violence", None, None],
        "tag": ["generic", "Jail breaking", "Jailbreaking", "Generic", "generic"],
    })


def test_preprocessor_steps():
    prep = DataPreprocessor()
    out = prep.run(_toy_frame())
    # duplicate (case/space variant) removed, missing label removed, empty prompt removed
    assert len(out) == 2
    assert set(out["language"]) == {"Gujarati", "English"}
    assert set(out["label"]) == {0, 1}
    assert prep.report_frame()["removed"].sum() == 3


def test_reservoir_sampler_caps_each_group():
    s = ReservoirSampler(k=5, seed=1)
    for i in range(100):
        s.add("A" if i % 2 else "B", {"i": i})
    assert len(s.records()) == 10


def test_missing_dataset_raises():
    with pytest.raises(DatasetNotFoundError):
        next(stream_records("does/not/exist.json"))


def test_untrained_model_raises():
    with pytest.raises(ModelNotTrainedError):
        LinearSVMModel().predict(["hi"])


def test_all_models_share_interface():
    for m in all_models():
        assert isinstance(m, BaseTextClassifier) and not m.is_trained


def test_train_predict_save_load(tmp_path):
    texts = ["how to apply for scheme", "scheme eligibility please", "how to make a weapon",
             "hurt someone badly", "pension scheme form", "steal a car tonight"] * 5
    labels = [0, 0, 1, 1, 0, 1] * 5
    model = NaiveBayesModel(max_features=500).fit(texts, labels)
    path = model.save(tmp_path / "m.pkl")
    loaded = BaseTextClassifier.load(path)
    assert list(loaded.predict(["apply for pension scheme"])) == [0]


# ---------------------------------------------------------------- Day 1 additions
from bharatassist.domain_data import TEMPLATES, TEMPLATE_SPLITS, build_domain_data
from bharatassist.scraper import parse_scheme_names, ScrapeError

FIXTURE = Path(__file__).parent / "fixtures" / "schemes_page.html"


def test_templates_cover_all_languages_and_keys():
    assert len(TEMPLATES) == 12
    keys = {k for split in TEMPLATE_SPLITS.values() for k in split}
    for lang, templates in TEMPLATES.items():
        assert set(templates) == keys, lang
        assert all("{s}" in t for t in templates.values()), lang


def test_domain_splits_share_no_scheme_or_template():
    d = build_domain_data()
    assert not set(d["train"].scheme) & set(d["test"].scheme)
    assert not set(d["train"].scheme) & set(d["valid"].scheme)
    assert not set(d["train"].template) & set(d["test"].template)
    assert set(d["test"].label) == {0, 1}


def test_scraper_parses_fixture():
    names = parse_scheme_names(FIXTURE.read_text(encoding="utf-8"))
    assert "Pradhan Mantri Fasal Bima Yojana" in names
    assert "PM-KISAN Samman Nidhi" in names            # footnote [1] removed
    assert names.count("Atal Pension Yojana") == 1     # duplicate removed
    assert "Scheme" not in names and "Contact us" not in names
    assert not any("Fake" in n for n in names)          # script content ignored


def test_scraper_rejects_page_without_schemes():
    with pytest.raises(ScrapeError):
        parse_scheme_names("<html><body><p>Hello</p></body></html>")
