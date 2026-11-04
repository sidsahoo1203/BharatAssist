"""Step 1 - stream the raw IndicGuard files and write stratified samples.

Usage (from the ml/ folder):
    python scripts/sample_data.py --raw data/raw

Expects data/raw/train.json, valid.json, test.json (the IndicGuard
all-lang-train-test-valid files). Writes data/sample/{split}_sample.csv.gz
and data/sample/raw_stats.json.
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from bharatassist.config import RAW_DIR, SAMPLE_DIR, SAMPLE_PER_LANGUAGE
from bharatassist.data_loader import sample_all_splits
from bharatassist.exceptions import DatasetNotFoundError
from bharatassist.logger import get_logger


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw", type=Path, default=RAW_DIR)
    parser.add_argument("--out", type=Path, default=SAMPLE_DIR)
    args = parser.parse_args()
    log = get_logger("sample_data")

    paths = {split: args.raw / f"{split}.json" for split in ("train", "valid", "test")}
    missing = [p for p in paths.values() if not p.exists()]
    if missing:
        log.error("Missing raw files: %s", ", ".join(map(str, missing)))
        raise DatasetNotFoundError(missing[0])

    start = time.perf_counter()
    frames, stats = sample_all_splits(paths, SAMPLE_PER_LANGUAGE)
    args.out.mkdir(parents=True, exist_ok=True)
    for split, df in frames.items():
        out = args.out / f"{split}_sample.csv.gz"
        df.to_csv(out, index=False, compression="gzip")
        log.info("%s: %s rows streamed -> %s sampled -> %s",
                 split, f"{stats[split]['rows']:,}", f"{len(df):,}", out.name)
    with open(args.out / "raw_stats.json", "w", encoding="utf-8") as fh:
        json.dump(stats, fh, ensure_ascii=False, indent=2)
    log.info("Done in %.0f s", time.perf_counter() - start)
    return 0


if __name__ == "__main__":
    sys.exit(main())
