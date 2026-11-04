"""Model classes.

`BaseTextClassifier` is an abstract base class (Unit 1: ABC, encapsulation).
Each concrete model only decides *which estimator* to use; fitting, predicting
and saving are inherited, so every model can be used interchangeably
(Unit 1: inheritance and polymorphism). The estimators come from scikit-learn
(Unit 4) and models are saved with pickle (Units 2 and 5).
"""
from __future__ import annotations

import pickle
import time
from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC

from .config import RANDOM_SEED
from .exceptions import ModelNotTrainedError


def make_vectorizer(max_features: int = 100_000, min_df: int = 2) -> TfidfVectorizer:
    """Character n-gram TF-IDF: works for all 12 scripts with no tokenizer."""
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4),
                           max_features=max_features, sublinear_tf=True, min_df=min_df)


class BaseTextClassifier(ABC):
    """Common behaviour for every text classifier in the project."""

    def __init__(self, name: str, max_features: int = 100_000):
        self._name = name
        self._max_features = max_features
        self._pipeline: Pipeline | None = None
        self._train_seconds: float | None = None

    # -- the one thing subclasses must provide -----------------------------
    @abstractmethod
    def build_estimator(self):
        """Return an unfitted scikit-learn estimator."""

    # -- read-only properties (encapsulation) --------------------------------
    @property
    def name(self) -> str:
        return self._name

    @property
    def is_trained(self) -> bool:
        return self._pipeline is not None

    @property
    def train_seconds(self) -> float | None:
        return self._train_seconds

    @property
    def classes_(self) -> np.ndarray:
        self._require_trained()
        return self._pipeline.classes_

    # -- shared behaviour --------------------------------------------------
    def _steps(self) -> list:
        return [("tfidf", make_vectorizer(self._max_features)), ("clf", self.build_estimator())]

    def fit(self, texts, labels) -> "BaseTextClassifier":
        start = time.perf_counter()
        pipeline = Pipeline(self._steps())
        pipeline.fit(texts, labels)
        self._pipeline = pipeline
        self._train_seconds = time.perf_counter() - start
        return self

    def predict(self, texts) -> np.ndarray:
        self._require_trained()
        return self._pipeline.predict(texts)

    def decision_scores(self, texts) -> np.ndarray:
        """Probability (or margin) of the positive class, for ranking metrics."""
        self._require_trained()
        if hasattr(self._pipeline, "predict_proba"):
            return self._pipeline.predict_proba(texts)[:, 1]
        return self._pipeline.decision_function(texts)

    def save(self, path: str | Path) -> Path:
        self._require_trained()
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as fh:
            pickle.dump(self, fh)
        return path

    @staticmethod
    def load(path: str | Path) -> "BaseTextClassifier":
        with open(path, "rb") as fh:
            return pickle.load(fh)

    def _require_trained(self) -> None:
        if not self.is_trained:
            raise ModelNotTrainedError(self._name)

    def __repr__(self) -> str:
        status = "trained" if self.is_trained else "untrained"
        return f"<{type(self).__name__} '{self._name}' ({status})>"


# ---------------------------------------------------------------------------
# Concrete models (each overrides build_estimator -> polymorphism)
# ---------------------------------------------------------------------------
class MajorityBaseline(BaseTextClassifier):
    """Always predicts the most common class - the floor every model must beat."""

    def __init__(self):
        super().__init__("Majority baseline")

    def build_estimator(self):
        return DummyClassifier(strategy="most_frequent")


class NaiveBayesModel(BaseTextClassifier):
    def __init__(self, alpha: float = 0.1, **kw):
        super().__init__("Naive Bayes", **kw)
        self.alpha = alpha

    def build_estimator(self):
        return MultinomialNB(alpha=self.alpha)


class LogisticRegressionModel(BaseTextClassifier):
    def __init__(self, C: float = 2.0, balanced: bool = True, **kw):
        super().__init__("Logistic Regression", **kw)
        self.C, self.balanced = C, balanced

    def build_estimator(self):
        return LogisticRegression(C=self.C, max_iter=2000,
                                  class_weight="balanced" if self.balanced else None)


class LinearSVMModel(BaseTextClassifier):
    def __init__(self, C: float = 0.5, balanced: bool = True, **kw):
        super().__init__("Linear SVM", **kw)
        self.C, self.balanced = C, balanced

    def build_estimator(self):
        return LinearSVC(C=self.C, class_weight="balanced" if self.balanced else None,
                         random_state=RANDOM_SEED)


class RandomForestModel(BaseTextClassifier):
    """Random forest on the 20k most informative n-grams (chi-squared selection)."""

    def __init__(self, n_estimators: int = 100, k_best: int = 20_000, **kw):
        super().__init__("Random Forest", **kw)
        self.n_estimators, self.k_best = n_estimators, k_best

    def _steps(self) -> list:
        return [("tfidf", make_vectorizer(self._max_features)),
                ("select", SelectKBest(chi2, k=self.k_best)),
                ("clf", self.build_estimator())]

    def build_estimator(self):
        return RandomForestClassifier(n_estimators=self.n_estimators, n_jobs=-1,
                                      class_weight="balanced_subsample",
                                      min_samples_leaf=2, random_state=RANDOM_SEED)


def all_models() -> list[BaseTextClassifier]:
    return [MajorityBaseline(), NaiveBayesModel(), LogisticRegressionModel(),
            LinearSVMModel(), RandomForestModel()]
