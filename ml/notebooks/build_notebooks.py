"""Generates and executes the two Review-1 notebooks.

    python notebooks/build_notebooks.py          # build + run both
"""
import sys
from pathlib import Path

import nbformat as nbf
from nbclient import NotebookClient

HERE = Path(__file__).resolve().parent


def md(s):
    return nbf.v4.new_markdown_cell(s.strip())


def code(s):
    return nbf.v4.new_code_cell(s.strip())


SETUP = code("""
import sys, json, warnings
from pathlib import Path
ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
sys.path.insert(0, str(ROOT / "src"))
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from IPython.display import display
pd.set_option("display.max_columns", 20)
pd.set_option("display.width", 140)

from bharatassist.config import SAMPLE_DIR, FIGURE_DIR, MODEL_DIR, REPORT_DIR
""")

# ---------------------------------------------------------------------------
nb1 = nbf.v4.new_notebook()
nb1.cells = [
    md("""
# 01 · Dataset analysis and preprocessing
**Project:** BharatAssist AI – ML language and safety guard for a multilingual government-scheme assistant
**Dataset:** IndicGuard – multilingual prompt-safety dataset (12 Indian languages, human-labelled)

This notebook covers **Unit 4 (data science with NumPy/pandas)** and uses the package code from
**Units 1–2** (classes, ABC, custom exceptions, file handling, functional programming, multiprocessing).

> **Content note:** the dataset contains harmful prompts. This notebook never prints raw *unsafe*
> prompt text – only counts, charts and safe examples.
"""),
    SETUP,
    md("""
## 1. The raw dataset (full files)
The raw train file is **2.1 GB** – too big to load with `json.load()`. `scripts/sample_data.py`
streams every record with `ijson`, collects statistics, and keeps a random sample per language
(**reservoir sampling**). The three splits are processed **in parallel processes**
(`ProcessPoolExecutor`) with a shared `Lock` guarding the common log file.
"""),
    code("""
with open(SAMPLE_DIR / "raw_stats.json", encoding="utf-8") as fh:
    raw = json.load(fh)

overview = pd.DataFrame({
    split: {
        "Rows": s["rows"],
        "Exact duplicate rows": s["exact_duplicates"],
        "Duplicate %": round(100 * s["exact_duplicates"] / s["rows"], 1),
        "Unique rows": s["rows"] - s["exact_duplicates"],
        "Missing prompt_label": s["missing_prompt_label"],
        "Empty prompt": s["empty_prompt"],
        "Languages": len(s["languages"]),
    } for split, s in raw.items()
}).T
overview.style.format("{:,.0f}").format("{:.1f}", subset=["Duplicate %"])
"""),
    md("""
**Finding 1 – massive duplication.** About **60 %** of every split is exact duplicate rows
(same language, prompt and label). Training on duplicates over-weights some prompts and inflates
scores, so they must be removed.
"""),
    code("""
print("Raw spellings of 'tag' (prompt type):")
display(pd.Series(raw["train"]["tags"]).sort_values(ascending=False).to_frame("rows"))
print("Raw spellings of 'language':", sorted(raw["train"]["languages"]))
print("Raw values of 'response_label':", raw["train"]["response_label"])
"""),
    md("""
**Finding 2 – inconsistent labels.** `tag` has **7 spellings for 3 values**; language names are
misspelt (`Gujrati`, `Punajbi`) or lower-case (`english`); a missing `response_label` appears both
as `null` and as an empty string `''`.
"""),
    code("""
cats = pd.Series(raw["train"]["categories"]).sort_values(ascending=True).tail(12)
from bharatassist.evaluation import bar_h
bar_h(cats / 1000, "Most common harm categories (train, raw)", xlabel="rows (thousands)",
    fmt="{:,.0f}k", path=FIGURE_DIR / "harm_categories.png", figsize=(7.5, 4.6))
plt.show()
"""),
    md("""
**Finding 3 – multi-label column.** `violated_categories` is a comma-separated string with
**23 distinct harm categories**; one prompt can violate several. It needs splitting and multi-hot encoding.

## 2. Load the stratified samples
| Split | Sampled per language | Total |
|---|---|---|
| train | 4,000 | 48,000 |
| valid | 1,000 | 12,000 |
| test  | 1,500 | 18,000 |

The **official splits are kept**: every prompt exists in all 12 languages under the same `id`,
so a random split would leak translations of test prompts into training.
"""),
    code("""
from bharatassist.preprocessing import check_leakage
samples = {s: pd.read_csv(SAMPLE_DIR / f"{s}_sample.csv.gz") for s in ("train", "valid", "test")}
for s, df in samples.items():
    print(f"{s:5s}: {df.shape[0]:,} rows x {df.shape[1]} columns")
print("\\nColumns:", list(samples["train"].columns))
print("Shared prompt ids  train-test:", check_leakage(samples["train"], samples["test"]),
      "| train-valid:", check_leakage(samples["train"], samples["valid"]))
samples["train"].drop(columns=["prompt"]).head()
"""),
    code("""
print("Missing values per column (train sample):")
samples["train"].isna().sum().to_frame("missing")
"""),
    md("""
## 3. Preprocessing pipeline
`DataPreprocessor.run()` chains six steps with `functools.reduce` and records how many rows each
step removed:

1. **Normalise** language names, tags and the empty `response_label`
2. **Drop** rows without a `prompt_label` (the target)
3. **Clean text** – Unicode NFC normalisation, remove zero-width characters, replace URLs, collapse whitespace, lower-case Latin script
4. **Drop** prompts that are empty after cleaning
5. **Drop** exact duplicates
6. **Feature engineering** – character length, word count, label encoding (`safe=0`, `unsafe=1`), split categories
"""),
    code("""
from bharatassist.preprocessing import DataPreprocessor, category_matrix

clean, reports = {}, {}
for split, df in samples.items():
    prep = DataPreprocessor()
    clean[split] = prep.run(df)
    reports[split] = prep.report_frame()

reports["train"]
"""),
    code("""
print("Tag values before:", samples["train"]["tag"].nunique(), "-> after:", clean["train"]["tag"].nunique())
print("Language values after:", sorted(clean["train"]["language"].unique()))
clean["train"]["tag"].value_counts().to_frame("rows")
"""),
    code("""
# One safe example, before and after cleaning
safe_en = clean["train"].query("prompt_label == 'safe' and language == 'English'")
changed = safe_en[(safe_en["prompt"].str.len() < 160) & (safe_en["prompt"].str.strip().str.lower() != safe_en["clean_prompt"])]
ex = changed.iloc[0]
print("RAW  :", repr(ex["prompt"][:200]))
print("CLEAN:", repr(ex["clean_prompt"][:200]))
"""),
    code("""
cat_onehot = category_matrix(clean["train"])
print("Multi-hot category matrix:", cat_onehot.shape)
print("Unsafe prompts violating >1 category:",
      f"{(clean['train'].query('label == 1')['n_categories'] > 1).mean():.0%}")
cat_onehot.sum().sort_values(ascending=False).head(8).to_frame("unsafe prompts")
"""),
    md("## 4. Exploratory analysis of the cleaned training data"),
    code("""
from bharatassist.evaluation import label_split_chart, bar_h, BLUE, ORANGE
tr = clean["train"]
label_split_chart(tr["prompt_label"].value_counts(), "Class balance – train (after cleaning)",
                  path=FIGURE_DIR / "class_balance.png")
plt.show()
print(tr["prompt_label"].value_counts(normalize=True).round(3).to_dict())
"""),
    md("""
**Finding 4 – class imbalance.** About 57 % unsafe vs 43 % safe. A model that always says
"unsafe" already scores 57 % accuracy, so **accuracy alone is misleading** – we use
**F1 / macro-F1** and train with `class_weight="balanced"`.
"""),
    code("""
lang_counts = tr["language"].value_counts().sort_values()
bar_h(lang_counts, "Training rows per language (after cleaning)", xlabel="rows",
      path=FIGURE_DIR / "rows_per_language.png")
plt.show()
"""),
    code("""
by_lang = (tr.groupby("language")["label"].mean().sort_values() * 100)
bar_h(by_lang, "Share of unsafe prompts per language", xlabel="% unsafe", fmt="{:.0f}%",
      xlim=(0, 100), path=FIGURE_DIR / "unsafe_share_language.png")
plt.show()
"""),
    code("""
stats = tr.groupby("prompt_label")[["char_len", "word_count"]].describe().T
display(stats.round(0))
fig, ax = plt.subplots(figsize=(7, 3.6))
bins = np.linspace(0, 1500, 50)
ax.hist(tr.loc[tr.label == 0, "char_len"].clip(upper=1500), bins=bins, alpha=0.75, color=BLUE, label="safe")
ax.hist(tr.loc[tr.label == 1, "char_len"].clip(upper=1500), bins=bins, alpha=0.6, color=ORANGE, label="unsafe")
ax.set_title("Prompt length in characters", loc="left"); ax.set_xlabel("characters (clipped at 1,500)")
ax.legend(frameon=False); ax.tick_params(length=0)
fig.savefig(FIGURE_DIR / "prompt_length.png", facecolor="white", bbox_inches="tight"); plt.show()
"""),
    code("""
tag_tab = pd.crosstab(tr["tag"], tr["prompt_label"], normalize="index").round(3) * 100
tag_tab["rows"] = tr["tag"].value_counts()
tag_tab
"""),
    md("""
**Finding 5 – prompt type matters.** Culture-adaptive prompts are unsafe most often (~72 %),
jailbreak prompts ~62 %, while generic prompts are an even 50/50 mix – the hardest group for a model.

## 5. Save the cleaned data
"""),
    code("""
out_dir = SAMPLE_DIR.parent / "clean"
out_dir.mkdir(exist_ok=True)
cols = ["split", "id", "language", "tag", "clean_prompt", "label", "char_len", "word_count", "n_categories"]
for split, df in clean.items():
    df[cols].to_csv(out_dir / f"{split}_clean.csv.gz", index=False, compression="gzip")
    print(f"{split:5s}: {len(df):,} rows -> {out_dir.name}/{split}_clean.csv.gz")
"""),
    md("""
## Summary
| Problem found | Fix |
|---|---|
| ~60 % exact duplicate rows | Deduplicated while streaming and again after cleaning |
| 7 spellings of 3 tags, misspelt language names | Mapping dictionaries (`config.py`) |
| Missing labels; `null` vs `''` | Dropped rows without target; unified missing marker |
| Mixed scripts, invisible characters, URLs | Unicode NFC + regex cleaning |
| Multi-label category string | Split + multi-hot encoding |
| Class imbalance (57/43) | Macro-F1 metric + balanced class weights |
| Translations share an `id` | Official splits kept; leakage check = 0 shared ids |
"""),
]

# ---------------------------------------------------------------------------
nb2 = nbf.v4.new_notebook()
nb2.cells = [
    md("""
# 02 · Model training and comparison
Two tasks for the BharatAssist guard layer:
1. **Safety classification** – is a user prompt *safe* or *unsafe*? (binary)
2. **Language identification** – which of 12 languages is it in? (multi-class)

**Features:** character n-gram TF-IDF (2–4 characters). Character n-grams work across all 12
scripts without a separate tokenizer for each language.

**Models** (all subclasses of the abstract `BaseTextClassifier`): majority baseline, Multinomial
Naive Bayes, Logistic Regression, Linear SVM, Random Forest.

**Protocol:** train on *train*, choose models and settings on *valid*, report final numbers once on *test*.
"""),
    SETUP,
    code("""
data = {s: pd.read_csv(SAMPLE_DIR.parent / "clean" / f"{s}_clean.csv.gz") for s in ("train", "valid", "test")}
tr, va, te = data["train"], data["valid"], data["test"]
Xtr, Xva, Xte = tr["clean_prompt"], va["clean_prompt"], te["clean_prompt"]
print({s: len(d) for s, d in data.items()})
"""),
    md("## Task 1 · Safety classification – compare models on the validation set"),
    code("""
from bharatassist.models import all_models
from bharatassist.evaluation import binary_metrics

models, rows = {}, []
for model in all_models():          # polymorphism: same calls for every model
    model.fit(Xtr, tr["label"])
    pred = model.predict(Xva)
    metrics = binary_metrics(va["label"], pred, model.decision_scores(Xva))
    rows.append({"Model": model.name, **metrics, "Train time (s)": model.train_seconds})
    models[model.name] = model
    print(f"{model.name:20s} macro-F1 = {metrics['Macro F1']:.3f}")

val_table = pd.DataFrame(rows).set_index("Model").round(3)
val_table
"""),
    code("""
from bharatassist.evaluation import grouped_metric_chart
grouped_metric_chart(val_table, ["Accuracy", "Macro F1", "Recall (unsafe)"],
                     "Safety models – validation set", path=FIGURE_DIR / "safety_model_comparison.png")
plt.show()
"""),
    md("""
The **majority baseline** shows why accuracy misleads: about 60 % accuracy but macro-F1 of only
0.375, because it never predicts "safe".

### Tuning the regularisation strength *C* (validation set)
"""),
    code("""
from bharatassist.models import LinearSVMModel, LogisticRegressionModel
tuning = []
for C in (0.1, 0.25, 0.5, 1.0):
    m = LinearSVMModel(C=C).fit(Xtr, tr["label"])
    tuning.append({"Model": "Linear SVM", "C": C, "Macro F1": binary_metrics(va["label"], m.predict(Xva))["Macro F1"]})
tuning = pd.DataFrame(tuning).round(4)
display(tuning)
best_C = float(tuning.loc[tuning["Macro F1"].idxmax(), "C"])
print("Best C for Linear SVM:", best_C)
"""),
    md("### Over-fitting check – train vs validation"),
    code("""
fit_rows = []
for name in ("Naive Bayes", "Logistic Regression", "Linear SVM", "Random Forest"):
    m = models[name]
    fit_rows.append({"Model": name,
                     "Train macro-F1": binary_metrics(tr["label"], m.predict(Xtr))["Macro F1"],
                     "Valid macro-F1": val_table.loc[name, "Macro F1"]})
fit_table = pd.DataFrame(fit_rows).set_index("Model")
fit_table["Gap"] = fit_table["Train macro-F1"] - fit_table["Valid macro-F1"]
fit_table.round(3)
"""),
    md("""
All models score higher on training data than on validation data. The Random Forest has the
largest gap (it memorises the training set). Linear models generalise best.

### Final safety model – evaluated once on the test set
"""),
    code("""
best = LinearSVMModel(C=best_C).fit(Xtr, tr["label"])
test_pred = best.predict(Xte)
test_metrics = pd.Series(binary_metrics(te["label"], test_pred, best.decision_scores(Xte))).round(3)
test_metrics.to_frame("Linear SVM – test")
"""),
    code("""
from bharatassist.evaluation import confusion_chart
confusion_chart(te["label"].values, test_pred, ["safe", "unsafe"], "Safety – confusion matrix (test)",
                label_values=[0, 1], path=FIGURE_DIR / "safety_confusion.png")
plt.show()
"""),
    code("""
from bharatassist.evaluation import per_group_f1, bar_h
lang_f1 = per_group_f1(te, test_pred, "language")
bar_h(lang_f1, "Safety model macro-F1 by language (test)", fmt="{:.2f}", xlim=(0, 1),
      highlight=lang_f1.idxmax(), path=FIGURE_DIR / "safety_f1_by_language.png")
plt.show()
tag_f1 = per_group_f1(te, test_pred, "tag")
tag_f1.round(3).to_frame("macro-F1 (test)")
"""),
    md("## Task 2 · Language identification (12 classes)"),
    code("""
from bharatassist.models import NaiveBayesModel
from bharatassist.evaluation import multiclass_metrics
lang_rows, lang_models = [], {}
for model in (NaiveBayesModel(), LinearSVMModel(C=0.5, balanced=False)):
    model.fit(Xtr, tr["language"])
    pred = model.predict(Xva)
    lang_rows.append({"Model": model.name, **multiclass_metrics(va["language"], pred),
                      "Train time (s)": model.train_seconds})
    lang_models[model.name] = model
lang_table = pd.DataFrame(lang_rows).set_index("Model").round(4)
lang_table
"""),
    code("""
lang_best = lang_models["Linear SVM"]
lang_test_pred = lang_best.predict(Xte)
print("Test accuracy:", round(multiclass_metrics(te["language"], lang_test_pred)["Accuracy"], 4))
names = sorted(te["language"].unique())
confusion_chart(te["language"].values, lang_test_pred, names, "Language ID – confusion matrix (test)",
                normalize=True, figsize=(6.5, 5.8), path=FIGURE_DIR / "language_confusion.png")
plt.show()
errors = te.assign(pred=lang_test_pred).query("language != pred")
print("Most common confusions:")
errors.groupby(["language", "pred"]).size().sort_values(ascending=False).head(5).to_frame("count")
"""),
    md("## Save models and export the Excel report"),
    code("""
from bharatassist.evaluation import export_excel
p1 = best.save(MODEL_DIR / "safety_model.pkl")
p2 = lang_best.save(MODEL_DIR / "language_model.pkl")
for p in (p1, p2):
    print(f"{p.name}: {p.stat().st_size / 1e6:.1f} MB")

xlsx = export_excel({
    "Safety - validation": val_table,
    "Safety - C tuning": tuning.set_index("Model"),
    "Safety - overfitting": fit_table.round(3),
    "Safety - test": test_metrics.to_frame("Linear SVM"),
    "Safety - by language": lang_f1.round(3).to_frame("macro F1"),
    "Language ID": lang_table,
}, REPORT_DIR / "model_comparison.xlsx")
print("Excel report:", xlsx.name)
"""),
    md("""
### Threshold analysis
The SVM flags a prompt as unsafe when its score is above 0. Raising the threshold blocks fewer
safe prompts (higher precision) but lets more unsafe ones through (lower recall).
"""),
    code("""
from sklearn.metrics import precision_score, recall_score, f1_score
scores = best.decision_scores(Xte)
thr_rows = []
for t in (-0.5, -0.25, 0.0, 0.25, 0.5, 0.75):
    p = (scores > t).astype(int)
    thr_rows.append({"Threshold": t, "Precision (unsafe)": precision_score(te["label"], p),
                     "Recall (unsafe)": recall_score(te["label"], p),
                     "Macro F1": f1_score(te["label"], p, average="macro"),
                     "% prompts blocked": p.mean() * 100})
thr_table = pd.DataFrame(thr_rows).set_index("Threshold").round(3)
thr_table
"""),
    md("""
### Error analysis – domain-shift test on BharatAssist-style questions
The real app receives questions about government schemes. Let us check how the model scores
harmless in-domain questions.
"""),
    code("""
from bharatassist.models import BaseTextClassifier
from bharatassist.preprocessing import TextCleaner
safety = BaseTextClassifier.load(MODEL_DIR / "safety_model.pkl")
language = BaseTextClassifier.load(MODEL_DIR / "language_model.pkl")
cleaner = TextCleaner()

in_domain = [
    "How do I apply for the PM-KISAN scheme?",
    "What documents do I need for Ayushman Bharat?",
    "Can you help me fill my pension form?",
    "पीएम किसान योजना के लिए आवेदन कैसे करें?",
    "ஆயுஷ்மான் பாரத் அட்டை எப்படி பெறுவது?",
    "Hello",
    "How can I hack into my neighbour's WiFi?",
]
cleaned = [cleaner.clean_strict(t) for t in in_domain]
scores_d = safety.decision_scores(cleaned)
pd.DataFrame({"prompt": in_domain, "language": language.predict(cleaned),
              "score": scores_d.round(2), "verdict": np.where(scores_d > 0, "unsafe", "safe")})
"""),
    code("""
eng = tr[tr["language"] == "English"]
gov = eng[eng["clean_prompt"].str.contains("scheme|yojana|government", regex=True)]
print(f"English training prompts mentioning scheme/yojana/government: {len(gov)}")
print(f"Share labelled unsafe: {gov['label'].mean():.0%}   (all English prompts: {eng['label'].mean():.0%})")
"""),
    md("""
**Finding 6 – domain shift.** In IndicGuard, prompts that mention schemes or the government are
mostly unsafe (hate, misinformation and manipulation prompts *about* government). The model has
therefore learnt that scheme vocabulary is risky, and it **wrongly blocks some harmless scheme
questions** – exactly the questions BharatAssist users ask. The last row (a real unsafe request)
is correctly blocked.

**Planned fix (Review-2):**
1. Collect real, safe in-domain questions – scrape scheme FAQs from official portals with
   `requests` + `BeautifulSoup` (Unit 3) – and add them to training.
2. Build a small in-domain validation set and **calibrate the threshold** on it.
3. Compare against a Keras neural network (Unit 4).

## Summary
| Task | Best model | Test result |
|---|---|---|
| Safety (safe vs unsafe) | Linear SVM, char n-gram TF-IDF | see test table above |
| Language ID (12 classes) | Linear SVM | ~99.9 % accuracy |

* Linear models beat Naive Bayes and Random Forest; Random Forest over-fits the most.
* Jailbreak prompts are the hardest prompt type for the safety model.
* Out-of-domain false positives on scheme questions must be fixed before deployment.
"""),
]


def run(nb, name):
    path = HERE / name
    NotebookClient(nb, timeout=1800, kernel_name="python3",
                   resources={"metadata": {"path": str(HERE)}}).execute()
    nbf.write(nb, path)
    print("wrote", path)


if __name__ == "__main__":
    which = sys.argv[1:] or ["1", "2"]
    if "1" in which:
        run(nb1, "01_eda_preprocessing.ipynb")
    if "2" in which:
        run(nb2, "02_model_comparison.ipynb")
