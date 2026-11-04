"""Loading the IndicGuard JSON files.

The train file is ~2.1 GB, which is too large to json.load() on a laptop, so it
is *streamed* record by record with ijson and sampled with reservoir sampling.
The three splits are processed in parallel with multiprocessing, and a shared
Lock protects the common progress log (Unit 2: file handling, concurrency).
"""
from __future__ import annotations

import hashlib
import json
import random
from collections import Counter, defaultdict
from concurrent.futures import ProcessPoolExecutor
from multiprocessing import Manager
from pathlib import Path
from typing import Iterator

import pandas as pd

from .config import KEEP_COLUMNS, LOG_DIR, RANDOM_SEED
from .exceptions import DatasetNotFoundError, InvalidRecordError


def stream_records(path: str | Path) -> Iterator[dict]:
    """Yield records one at a time from a JSON array file (generator)."""
    path = Path(path)
    if not path.exists():
        raise DatasetNotFoundError(path)
    try:
        import ijson
    except ImportError:                       # small files can fall back to json
        with open(path, encoding="utf-8") as fh:
            yield from json.load(fh)
        return
    with open(path, "rb") as fh:              # context manager closes the file
        yield from ijson.items(fh, "item")


class ReservoirSampler:
    """Keeps a uniform random sample of k records per language.

    Reservoir sampling (Algorithm R) needs a single pass and O(k) memory, so it
    works on files far bigger than RAM.
    """

    def __init__(self, k: int, seed: int = RANDOM_SEED):
        self._k = k                                   # encapsulated state
        self._rng = random.Random(seed)
        self._seen = Counter()
        self._reservoir: dict[str, list[dict]] = defaultdict(list)

    @property
    def k(self) -> int:
        return self._k

    def add(self, group: str, record: dict) -> None:
        self._seen[group] += 1
        bucket = self._reservoir[group]
        if len(bucket) < self._k:
            bucket.append(record)
        else:
            j = self._rng.randrange(self._seen[group])
            if j < self._k:
                bucket[j] = record

    def records(self) -> list[dict]:
        return [r for bucket in self._reservoir.values() for r in bucket]


def _fingerprint(record: dict) -> str:
    text = f"{record.get('language')}|{record.get('prompt')}|{record.get('prompt_label')}"
    return hashlib.md5(text.encode("utf-8")).hexdigest()


def sample_split(split: str, path: str | Path, k: int, lock=None,
                 seed: int = RANDOM_SEED) -> tuple[pd.DataFrame, dict]:
    """Stream one split, collect raw statistics and a per-language sample.

    Rows are kept *raw* (no cleaning) so preprocessing can be shown separately.
    Exact duplicates are skipped so the sample has no repeated rows.
    """
    sampler = ReservoirSampler(k, seed)
    stats = {"split": split, "rows": 0, "exact_duplicates": 0, "missing_prompt_label": 0,
             "empty_prompt": 0, "languages": Counter(), "tags": Counter(),
             "prompt_label": Counter(), "response_label": Counter(), "categories": Counter()}
    seen_hashes: set[str] = set()

    for rec in stream_records(path):
        if "prompt" not in rec or "language" not in rec:
            raise InvalidRecordError(f"Record without prompt/language in {split}")
        stats["rows"] += 1
        stats["languages"][rec["language"]] += 1
        stats["tags"][rec.get("tag")] += 1
        stats["prompt_label"][str(rec.get("prompt_label"))] += 1
        stats["response_label"][repr(rec.get("response_label"))] += 1
        if rec.get("prompt_label") is None:
            stats["missing_prompt_label"] += 1
        if not (rec.get("prompt") or "").strip():
            stats["empty_prompt"] += 1
        for cat in (rec.get("violated_categories") or "").split(","):
            if cat.strip():
                stats["categories"][cat.strip()] += 1

        fp = _fingerprint(rec)
        if fp in seen_hashes:
            stats["exact_duplicates"] += 1
            continue
        seen_hashes.add(fp)
        sampler.add(rec["language"], {c: rec.get(c) for c in KEEP_COLUMNS})

    df = pd.DataFrame(sampler.records(), columns=KEEP_COLUMNS)
    df.insert(0, "split", split)
    stats = {key: dict(val) if isinstance(val, Counter) else val for key, val in stats.items()}

    if lock is not None:                      # shared log written by several processes
        with lock:
            LOG_DIR.mkdir(parents=True, exist_ok=True)
            with open(LOG_DIR / "sampling.log", "a", encoding="utf-8") as log:
                log.write(f"{split}: streamed {stats['rows']:,} rows, "
                          f"{stats['exact_duplicates']:,} duplicates, sampled {len(df):,}\n")
    return df, stats


def sample_all_splits(paths: dict[str, Path], k_per_split: dict[str, int],
                      workers: int = 3) -> tuple[dict[str, pd.DataFrame], dict]:
    """Sample train/valid/test in parallel processes (one process per split)."""
    with Manager() as manager:
        lock = manager.Lock()
        with ProcessPoolExecutor(max_workers=workers) as pool:
            futures = {split: pool.submit(sample_split, split, path, k_per_split[split], lock)
                       for split, path in paths.items()}
            results = {split: fut.result() for split, fut in futures.items()}
    frames = {split: res[0] for split, res in results.items()}
    stats = {split: res[1] for split, res in results.items()}
    return frames, stats
