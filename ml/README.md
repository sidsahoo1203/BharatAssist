# ML Safety Guard for LinguaVerse AI

Machine-learning work behind the LinguaVerse safety guard: a **language detector** (12 Indian languages)
and a **safe / unsafe classifier** for chat messages. The trained models in `models/` are loaded by
`../backend/safety_guard.py`.

## Dataset
* **IndicGuard** – L3Cube Pune, Hugging Face, CC-BY-4.0: https://huggingface.co/datasets/l3cube-pune/IndicGuard
  (1,135,176 train / 67,512 valid / 83,256 test rows; 12 languages; human safe/unsafe labels; 23 harm categories).
  About 60 % of rows are exact duplicates and are removed in preprocessing.
* `data/sample/` – stratified samples (4,000 / 1,000 / 1,500 rows per language) streamed from the raw files.
* `data/domain/` – government-scheme catalogue and in-domain test questions (fixes the domain shift found in Review-1).

## Results

| Model | IndicGuard test F1 | In-domain test F1 | Natural test F1 |
|---|---|---|---|
| Linear SVM – IndicGuard only (Review-1) | 0.727 | 0.768 | 0.619 |
| **Linear SVM – + in-domain data (deployed)** | **0.725** | **0.928** | **0.725** |
| Keras MLP (TF-IDF) – + in-domain | 0.707 | 0.982 | 0.619 |
| Keras char-CNN – + in-domain | 0.663 | 0.905 | 0.675 |

Language detection: 99.86 % accuracy (Linear SVM).

## Layout
```
src/bharatassist/     Python package (the package name comes from an earlier draft of this work)
    config.py, exceptions.py, logger.py
    data_loader.py    streaming JSON reader, reservoir sampling, multiprocessing + Lock
    preprocessing.py  TextCleaner, DataPreprocessor (reduce / map / filter / lambda)
    models.py         BaseTextClassifier (ABC) + Naive Bayes / Logistic Regression / SVM / Random Forest
    deep.py           Keras MLP and char-CNN
    domain_data.py    multilingual scheme questions (safe + fraud)
    scraper.py        requests + BeautifulSoup scheme-list scraper
    evaluation.py     metrics, charts, Excel report (openpyxl)
notebooks/            01 data + preprocessing, 02 model comparison, 03 domain fix + deep learning
scripts/              sample_data.py (stream raw files), train.py (retrain deployed models)
models/               safety_model.pkl, language_model.pkl, safety_config.json
reports/              charts and Excel results
tests/                pytest unit tests
```

## Run
```bash
pip install -r requirements-dev.txt
pytest -q
python scripts/train.py        # retrain the models
jupyter notebook notebooks/    # 01 -> 02 -> 03
```
