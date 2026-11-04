"""Generates and runs notebooks/03_domain_fix_and_deep_learning.ipynb

    python notebooks/build_notebook03.py
"""
from pathlib import Path

import nbformat as nbf
from nbclient import NotebookClient

HERE = Path(__file__).resolve().parent


def md(s):
    return nbf.v4.new_markdown_cell(s.strip())


def code(s):
    return nbf.v4.new_code_cell(s.strip())


nb = nbf.v4.new_notebook()
nb.cells = [
    md("""
# 03 · Domain-shift fix and deep learning
Continues from notebook 02, which found two open problems:

1. **Domain shift.** The safety model blocked harmless scheme questions such as
   *"How do I apply for PM-KISAN?"*, because most government-related prompts in IndicGuard are unsafe.
2. **Deep learning.** Only classical models had been compared. The syllabus (Unit 4) needs a neural network.

This notebook fixes (1) with **in-domain data** and **threshold calibration**, and adds
**two Keras neural networks** for (2).

> Content note: only harmless questions and mild fraud-request templates are printed. No raw
> IndicGuard unsafe prompts are shown.
"""),
    code("""
import sys, json, warnings, os
from pathlib import Path
ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
sys.path.insert(0, str(ROOT / "src"))
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from IPython.display import display
pd.set_option("display.max_columns", 20)
pd.set_option("display.width", 160)
pd.set_option("display.max_colwidth", 70)

from bharatassist.config import DATA_DIR, FIGURE_DIR, MODEL_DIR, REPORT_DIR
from bharatassist.preprocessing import TextCleaner
cleaner = TextCleaner()
"""),
    md("""
## 1. Data
* **IndicGuard** cleaned splits from notebook 01 (general safety data, 12 languages)
* **Scheme catalogue**: `data/domain/schemes.csv`, 45 central government schemes.
  `bharatassist/scraper.py` (requests + BeautifulSoup, Unit 3) can refresh it from any web page
  that lists schemes.
* **In-domain questions** generated from the catalogue in all 12 languages:
  * 8 *safe* templates (apply, documents, eligibility, amount, status, age limit, form, online)
  * 4 *unsafe* templates (fake documents, someone else's Aadhaar, bribery, claiming twice).
    These stop the model from learning the shortcut "scheme name = safe".
* **Natural test set**: 40 hand-written questions (`data/domain/natural_eval.csv`) that do not
  follow any template. This is the hardest and most realistic check.
"""),
    code("""
ig = {s: pd.read_csv(DATA_DIR / "clean" / f"{s}_clean.csv.gz") for s in ("train", "valid", "test")}

from bharatassist.domain_data import build_domain_data, TEMPLATE_SPLITS, TEMPLATES
dom = build_domain_data()
nat = pd.read_csv(DATA_DIR / "domain" / "natural_eval.csv")
for df in list(dom.values()) + [nat]:
    df["clean_prompt"] = df["prompt"].map(cleaner)

schemes = pd.read_csv(DATA_DIR / "domain" / "schemes.csv")
print("Schemes in catalogue:", len(schemes))
display(schemes["category"].value_counts().to_frame("schemes").T)
summary = pd.DataFrame({s: {"rows": len(d), "safe": int((d.label == 0).sum()), "unsafe": int((d.label == 1).sum()),
                            "schemes": d.scheme.nunique(), "templates": ", ".join(TEMPLATE_SPLITS[s])}
                        for s, d in dom.items()}).T
summary
"""),
    code("""
# Leakage check: no scheme and no sentence template is shared between the splits
print("Schemes shared train-test :", len(set(dom["train"].scheme) & set(dom["test"].scheme)))
print("Schemes shared train-valid:", len(set(dom["train"].scheme) & set(dom["valid"].scheme)))
print("Test schemes:", sorted(dom["test"].scheme.unique()))
print()
# one scheme, one template, in several languages
ex = dom["test"].query("scheme == @dom['test'].scheme.iloc[0]")
ex[["language", "template", "prompt", "label"]].drop_duplicates("language").head(12)
"""),
    md("## 2. Before the fix: Review-1 model on in-domain questions"),
    code("""
from bharatassist.models import LinearSVMModel
from bharatassist.evaluation import binary_metrics

def evaluate(model, name, threshold=None):
    \"\"\"Macro-F1 on all three test sets + how often safe questions are wrongly blocked.\"\"\"
    row = {"Model": name}
    for label, df in (("IndicGuard test", ig["test"]), ("In-domain test", dom["test"]), ("Natural test", nat)):
        scores = model.decision_scores(df["clean_prompt"])
        pred = model.predict(df["clean_prompt"]) if threshold is None else (scores > threshold).astype(int)
        row[f"{label} F1"] = binary_metrics(df["label"], pred)["Macro F1"]
        if label != "IndicGuard test":
            y = df["label"].values
            row[f"{label}: safe wrongly blocked"] = (pred[y == 0] == 1).mean()
            row[f"{label}: unsafe caught"] = (pred[y == 1] == 1).mean()
    return row

old = LinearSVMModel(C=0.25).fit(ig["train"]["clean_prompt"], ig["train"]["label"])
results = [evaluate(old, "Linear SVM – IndicGuard only (Review-1)")]
pd.DataFrame(results).set_index("Model").T.round(3)
"""),
    md("""
The Review-1 model wrongly blocks **a quarter of harmless template questions** and **more than half
of the natural ones**.

## 3. The fix: add in-domain training data
"""),
    code("""
X_train = pd.concat([ig["train"]["clean_prompt"], dom["train"]["clean_prompt"]], ignore_index=True)
y_train = np.r_[ig["train"]["label"].values, dom["train"]["label"].values]
print(f"Training rows: {len(ig['train']):,} IndicGuard + {len(dom['train']):,} in-domain = {len(X_train):,}")

svm = LinearSVMModel(C=0.25).fit(X_train, y_train)
results.append(evaluate(svm, "Linear SVM – + in-domain data"))
pd.DataFrame(results).set_index("Model").T.round(3)
"""),
    md("""
## 4. Deep learning with Keras
Two different neural-network designs, both subclasses of the same abstract `BaseTextClassifier`:

| Model | Input | Layers |
|---|---|---|
| **Keras MLP** | the same char n-gram TF-IDF as the SVM, best 20,000 features (chi-squared) | Dense 256 → Dropout → Dense 64 → Dropout → sigmoid |
| **Keras char-CNN** | raw characters (first 300) | Embedding 64 → Conv1D 128 → MaxPool → Conv1D 128 → GlobalMaxPool → Dense 64 → sigmoid |

Both use the Adam optimiser, binary cross-entropy, balanced class weights and **early stopping**
on the IndicGuard validation loss (patience 2, best weights restored).
"""),
    code("""
import keras
from bharatassist.deep import KerasMLPModel, KerasCharCNNModel

mlp = KerasMLPModel(epochs=8).fit(X_train, y_train, ig["valid"]["clean_prompt"], ig["valid"]["label"])
mlp._model.summary()
print(f"Trained in {mlp.train_seconds:.0f} s, {mlp.count_params():,} parameters")
results.append(evaluate(mlp, "Keras MLP (TF-IDF) – + in-domain"))
"""),
    code("""
cnn = KerasCharCNNModel(epochs=8).fit(X_train, y_train, ig["valid"]["clean_prompt"], ig["valid"]["label"])
cnn._model.summary()
print(f"Trained in {cnn.train_seconds:.0f} s, {cnn.count_params():,} parameters")
results.append(evaluate(cnn, "Keras char-CNN – + in-domain"))
"""),
    code("""
from matplotlib.ticker import MaxNLocator
from bharatassist.evaluation import BLUE, ORANGE, GRID, INK_2
fig, axes = plt.subplots(1, 2, figsize=(11, 3.6), sharey=True)
for ax, m in zip(axes, (mlp, cnn)):
    h = m.history
    epochs = range(1, len(h["loss"]) + 1)
    ax.plot(epochs, h["loss"], color=BLUE, lw=2, marker="o", label="train loss")
    ax.plot(epochs, h["val_loss"], color=ORANGE, lw=2, marker="o", label="validation loss")
    best = int(np.argmin(h["val_loss"])) + 1
    ax.axvline(best, color=GRID, lw=1.5, ls="--")
    ax.annotate(f"best epoch {best}", xy=(best, 1.0), xycoords=("data", "axes fraction"),
                xytext=(4, -4), textcoords="offset points", color=INK_2, fontsize=9, va="top")
    ax.xaxis.set_major_locator(MaxNLocator(integer=True))
    ax.set_title(m.name, loc="left"); ax.set_xlabel("epoch"); ax.tick_params(length=0)
axes[0].set_ylabel("binary cross-entropy"); axes[0].legend(frameon=False, loc="lower left")
fig.savefig(FIGURE_DIR / "keras_training_curves.png", facecolor="white", bbox_inches="tight")
plt.show()
"""),
    md("""
Training loss keeps falling while validation loss turns up after a couple of epochs: the networks
start to **over-fit**. Early stopping keeps the weights from the best epoch.

## 5. Final comparison of all models
"""),
    code("""
table = pd.DataFrame(results).set_index("Model")
display(table.round(3))

from bharatassist.evaluation import grouped_metric_chart
grouped_metric_chart(table[["IndicGuard test F1", "In-domain test F1", "Natural test F1"]]
                     .rename(index=lambda s: s.replace(" – ", "\\n")),
                     ["IndicGuard test F1", "In-domain test F1", "Natural test F1"],
                     "Safety models – macro-F1 on three test sets", path=FIGURE_DIR / "final_model_comparison.png")
plt.show()
"""),
    md("""
**Reading the table**

* Adding in-domain data **fixes the template questions** (F1 0.77 → 0.93, wrongly blocked 25 % → 0 %)
  **without hurting** general safety (IndicGuard F1 stays ≈ 0.73).
* The **Keras MLP** is best on template questions but worse on IndicGuard and on natural questions:
  it fits the templates too closely.
* The **char-CNN** is the weakest on IndicGuard: learning from raw characters needs far more than ~50k
  examples.
* **Linear SVM + in-domain data is the most balanced model, and also the smallest and fastest,
  so it is the one deployed.** With this amount of data, a linear model on good features beats small
  neural networks.

## 6. Threshold calibration (validation data only)
"""),
    code("""
from sklearn.metrics import f1_score, precision_score
s_ig = svm.decision_scores(ig["valid"]["clean_prompt"])
s_dom = svm.decision_scores(dom["valid"]["clean_prompt"])
rows = []
for t in np.round(np.arange(-0.3, 0.61, 0.1), 2):
    f_ig = f1_score(ig["valid"]["label"], s_ig > t, average="macro")
    f_dom = f1_score(dom["valid"]["label"], s_dom > t, average="macro")
    rows.append({"threshold": t, "IndicGuard valid F1": f_ig, "In-domain valid F1": f_dom,
                 "average": (f_ig + f_dom) / 2,
                 "IndicGuard precision (unsafe)": precision_score(ig["valid"]["label"], s_ig > t)})
thr = pd.DataFrame(rows).set_index("threshold")
display(thr.round(3))
BEST_T = float(thr["average"].idxmax())
BLOCK_T = 0.5
print(f"Decision threshold (best average F1): {BEST_T}")
print(f"Block threshold: {BLOCK_T} -> {thr.loc[BLOCK_T, 'IndicGuard precision (unsafe)']:.0%} of blocked prompts are truly unsafe")
"""),
    md("""
**Policy used by the BharatAssist API**

| SVM score | Action |
|---|---|
| below the decision threshold | **allow**: the assistant answers |
| between the decision threshold and 0.5 | **review**: the assistant answers, and the message is logged in MongoDB for review |
| 0.5 or above | **block**: polite refusal, logged |

This works because the BharatAssist answer engine is rule-based scheme matching, which cannot
produce harmful text. The guard only has to refuse confident cases and record uncertain ones.
"""),
    code("""
results.append(evaluate(svm, f"Linear SVM – + in-domain, threshold {BEST_T}", threshold=BEST_T))
final = pd.DataFrame(results).set_index("Model")
final.round(3)
"""),
    md("## 7. Before and after on real app questions"),
    code("""
demo = [
    "How do I apply for the PM-KISAN scheme?",
    "What documents do I need for Ayushman Bharat?",
    "पीएम किसान योजना के लिए आवेदन कैसे करें?",
    "ஆயுஷ்மான் பாரத் அட்டை எப்படி பெறுவது?",
    "I lost my ration card. How do I get a new one?",
    "How can I hack into my neighbour's WiFi?",
    "How do I make a fake ration card?",
]
cleaned = [cleaner.clean_strict(t) for t in demo]

def action(score):
    return "block" if score >= BLOCK_T else ("review" if score > BEST_T else "allow")

before, after = old.decision_scores(cleaned), svm.decision_scores(cleaned)
pd.DataFrame({"prompt": demo,
              "Review-1 score": before.round(2), "Review-1": ["block" if s > 0 else "allow" for s in before],
              "new score": after.round(2), "new action": [action(s) for s in after]})
"""),
    md("## 8. Save the deployed model, its thresholds and the results"),
    code("""
from bharatassist.evaluation import export_excel
svm.save(MODEL_DIR / "safety_model.pkl")
config = {"decision_threshold": BEST_T, "block_threshold": BLOCK_T,
          "model": "Linear SVM, char 2-4 gram TF-IDF, IndicGuard + in-domain data"}
(MODEL_DIR / "safety_config.json").write_text(json.dumps(config, indent=2))
print(json.dumps(config, indent=2))

export_excel({"Final comparison": final.round(3), "Threshold calibration": thr.round(3)},
             REPORT_DIR / "domain_fix_and_deep_learning.xlsx")
print("Saved models/safety_model.pkl, models/safety_config.json, reports/domain_fix_and_deep_learning.xlsx")
"""),
    md("""
## Summary
| Question | Answer |
|---|---|
| Did the domain fix work? | Yes on held-out schemes and templates: harmless questions wrongly blocked fell from 25 % to 0 %, with no loss on IndicGuard. Natural questions improved but remain the hardest case. |
| Did deep learning beat the SVM? | No. The MLP over-fits the templates and the char-CNN needs more data. |
| Which model is deployed? | Linear SVM + in-domain data, with a calibrated threshold and a three-level allow / review / block policy. |
| Limitation | Natural, free-form questions are still sometimes flagged. The review band and MongoDB logs collect these for the next round of training. |
"""),
]
nb.metadata = {"kernelspec": {"name": "python3", "display_name": "Python 3"}, "language_info": {"name": "python"}}

if __name__ == "__main__":
    NotebookClient(nb, timeout=3600, kernel_name="python3", resources={"metadata": {"path": str(HERE)}}).execute()
    out = HERE / "03_domain_fix_and_deep_learning.ipynb"
    nbf.write(nb, out)
    print("wrote", out)
