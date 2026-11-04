"""Deep-learning models with TensorFlow / Keras (Unit 4: deep learning).

Both classes inherit from BaseTextClassifier, so the comparison code treats
them exactly like the scikit-learn models (polymorphism). TensorFlow is
imported only inside this module: the deployed API uses the lighter
scikit-learn model and never needs TensorFlow.

* KerasMLPModel     - character n-gram TF-IDF -> chi-squared feature selection -> 2-layer neural network
* KerasCharCNNModel - raw characters -> embedding -> 1-D convolution -> max-pooling -> dense
"""
from __future__ import annotations

import pickle
import time
from pathlib import Path

import numpy as np
from sklearn.feature_selection import SelectKBest, chi2
from sklearn.utils.class_weight import compute_class_weight

from .config import RANDOM_SEED
from .models import BaseTextClassifier, make_vectorizer


def _class_weights(labels) -> dict:
    labels = np.asarray(labels)
    weights = compute_class_weight("balanced", classes=np.array([0, 1]), y=labels)
    return {0: float(weights[0]), 1: float(weights[1])}


class _KerasBase(BaseTextClassifier):
    """Shared fit / predict / save logic for the Keras models (binary safety task)."""

    def __init__(self, name: str, epochs: int = 6, batch_size: int = 256, **kw):
        super().__init__(name, **kw)
        self.epochs, self.batch_size = epochs, batch_size
        self._model = None
        self.history: dict = {}

    def build_estimator(self):                    # required by the ABC; Keras builds its own network
        return self._build_network()

    # subclasses provide these three
    def _build_network(self):
        raise NotImplementedError

    def _prepare(self, texts, fit: bool = False, labels=None):
        raise NotImplementedError

    def _dataset(self, X, labels=None, shuffle=False):
        raise NotImplementedError

    @property
    def is_trained(self) -> bool:
        return self._model is not None

    def fit(self, texts, labels, valid_texts=None, valid_labels=None) -> "_KerasBase":
        import keras

        keras.utils.set_random_seed(RANDOM_SEED)
        start = time.perf_counter()
        labels = np.asarray(labels, dtype="float32")
        X = self._prepare(texts, fit=True, labels=labels)
        model = self._build_network()
        callbacks, validation = [], None
        if valid_texts is not None:
            validation = self._dataset(self._prepare(valid_texts), np.asarray(valid_labels, dtype="float32"))
            callbacks.append(keras.callbacks.EarlyStopping(monitor="val_loss", patience=2,
                                                           restore_best_weights=True))
        hist = model.fit(self._dataset(X, labels, shuffle=True), validation_data=validation,
                         epochs=self.epochs, class_weight=_class_weights(labels),
                         callbacks=callbacks, verbose=2)
        self._model, self.history = model, hist.history
        self._train_seconds = time.perf_counter() - start
        return self

    def decision_scores(self, texts) -> np.ndarray:
        self._require_trained()
        return self._model.predict(self._dataset(self._prepare(texts)), verbose=0).ravel()

    def predict(self, texts) -> np.ndarray:
        return (self.decision_scores(texts) > 0.5).astype(int)

    def count_params(self) -> int:
        self._require_trained()
        return int(self._model.count_params())


class KerasMLPModel(_KerasBase):
    """Feed-forward neural network on the same TF-IDF features as the SVM."""

    def __init__(self, k_best: int = 20_000, hidden: int = 256, dropout: float = 0.4, **kw):
        super().__init__("Keras MLP (TF-IDF)", **kw)
        self.k_best, self.hidden, self.dropout = k_best, hidden, dropout
        self._vectorizer = None
        self._selector = None

    def _prepare(self, texts, fit=False, labels=None):
        if fit:
            self._vectorizer = make_vectorizer(self._max_features)
            X = self._vectorizer.fit_transform(texts)
            self._selector = SelectKBest(chi2, k=min(self.k_best, X.shape[1]))
            return self._selector.fit_transform(X, labels).astype("float32")
        return self._selector.transform(self._vectorizer.transform(texts)).astype("float32")

    def _dataset(self, X, labels=None, shuffle=False):
        import keras

        batch, n = self.batch_size, X.shape[0]

        class SparseBatches(keras.utils.PyDataset):     # turns sparse rows into dense batches
            def __init__(self):
                super().__init__()
                self.order = np.random.default_rng(RANDOM_SEED).permutation(n) if shuffle else np.arange(n)

            def __len__(self):
                return int(np.ceil(n / batch))

            def __getitem__(self, i):
                idx = self.order[i * batch:(i + 1) * batch]
                xb = X[idx].toarray()
                return (xb, labels[idx]) if labels is not None else xb

        return SparseBatches()

    def _build_network(self):
        import keras
        from keras import layers

        n_features = self._selector.k if self._selector is not None else self.k_best
        model = keras.Sequential([
            keras.Input(shape=(n_features,)),
            layers.Dense(self.hidden, activation="relu"),
            layers.Dropout(self.dropout),
            layers.Dense(64, activation="relu"),
            layers.Dropout(self.dropout),
            layers.Dense(1, activation="sigmoid"),
        ], name="tfidf_mlp")
        model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="binary_crossentropy",
                      metrics=["accuracy", keras.metrics.AUC(name="auc")])
        return model

    def save(self, path) -> Path:
        self._require_trained()
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        self._model.save(path / "network.keras")
        with open(path / "features.pkl", "wb") as fh:
            pickle.dump({"vectorizer": self._vectorizer, "selector": self._selector}, fh)
        return path


class KerasCharCNNModel(_KerasBase):
    """1-D convolutional network that reads the raw characters of the prompt."""

    def __init__(self, max_chars: int = 300, vocab: int = 4000, embed: int = 64, filters: int = 128, **kw):
        super().__init__("Keras char-CNN", **kw)
        self.max_chars, self.vocab, self.embed, self.filters = max_chars, vocab, embed, filters
        self._vectorize = None

    def _prepare(self, texts, fit=False, labels=None):
        import tensorflow as tf
        from keras import layers

        # the network only reads the first max_chars characters, so cut longer prompts first
        texts = np.array([str(t)[:self.max_chars] for t in texts], dtype=object)
        if fit:
            self._vectorize = layers.TextVectorization(max_tokens=self.vocab, split="character",
                                                       standardize=None,
                                                       output_sequence_length=self.max_chars)
            self._vectorize.adapt(tf.constant(texts))
        return self._vectorize(tf.constant(texts)).numpy()

    def _dataset(self, X, labels=None, shuffle=False):
        import tensorflow as tf

        data = tf.data.Dataset.from_tensor_slices((X, labels) if labels is not None else X)
        if shuffle:
            data = data.shuffle(len(X), seed=RANDOM_SEED)
        return data.batch(self.batch_size)

    def _build_network(self):
        import keras
        from keras import layers

        model = keras.Sequential([
            keras.Input(shape=(self.max_chars,), dtype="int64"),
            layers.Embedding(self.vocab, self.embed),
            layers.Conv1D(self.filters, 5, activation="relu"),
            layers.MaxPooling1D(3),
            layers.Conv1D(self.filters, 5, activation="relu"),
            layers.GlobalMaxPooling1D(),
            layers.Dropout(0.4),
            layers.Dense(64, activation="relu"),
            layers.Dense(1, activation="sigmoid"),
        ], name="char_cnn")
        model.compile(optimizer=keras.optimizers.Adam(1e-3), loss="binary_crossentropy",
                      metrics=["accuracy", keras.metrics.AUC(name="auc")])
        return model

    def save(self, path) -> Path:
        self._require_trained()
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        self._model.save(path / "network.keras")
        with open(path / "vocabulary.pkl", "wb") as fh:
            pickle.dump(self._vectorize.get_vocabulary(), fh)
        return path
