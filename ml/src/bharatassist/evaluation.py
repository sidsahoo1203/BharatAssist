"""Metrics, comparison tables, figures and the Excel report.

Unit 4: evaluation metrics and model comparison.
Unit 3: data automation - results exported to a formatted Excel workbook (openpyxl).
"""
from __future__ import annotations

import sys
from pathlib import Path

import matplotlib
if "ipykernel" not in sys.modules:      # scripts/CI: no screen; notebooks keep inline charts
    matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)

# Chart styling: one accent hue for the hero series, muted grey for the rest
BLUE, ORANGE, GREY = "#2a78d6", "#eb6834", "#b9b8b2"
INK, INK_2, GRID = "#0b0b0b", "#52514e", "#e6e5e0"

plt.rcParams.update({
    "figure.dpi": 110, "savefig.dpi": 200, "savefig.bbox": "tight",
    "font.size": 11, "axes.edgecolor": GRID, "axes.labelcolor": INK_2,
    "xtick.color": INK_2, "ytick.color": INK_2, "axes.titleweight": "bold",
    "axes.titlesize": 13, "axes.titlecolor": INK, "axes.spines.top": False,
    "axes.spines.right": False, "axes.grid": False,
})


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
def binary_metrics(y_true, y_pred, scores=None) -> dict:
    out = {
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision (unsafe)": precision_score(y_true, y_pred, zero_division=0),
        "Recall (unsafe)": recall_score(y_true, y_pred, zero_division=0),
        "F1 (unsafe)": f1_score(y_true, y_pred, zero_division=0),
        "Macro F1": f1_score(y_true, y_pred, average="macro", zero_division=0),
    }
    if scores is not None and len(np.unique(scores)) > 1:
        out["ROC-AUC"] = roc_auc_score(y_true, scores)
    else:
        out["ROC-AUC"] = 0.5
    return out


def multiclass_metrics(y_true, y_pred) -> dict:
    return {
        "Accuracy": accuracy_score(y_true, y_pred),
        "Macro precision": precision_score(y_true, y_pred, average="macro", zero_division=0),
        "Macro recall": recall_score(y_true, y_pred, average="macro", zero_division=0),
        "Macro F1": f1_score(y_true, y_pred, average="macro", zero_division=0),
    }


def per_group_f1(df: pd.DataFrame, y_pred, group: str = "language") -> pd.Series:
    """Macro F1 of the safety model within each language."""
    tmp = df.assign(pred=y_pred)
    return (tmp.groupby(group)
               .apply(lambda g: f1_score(g["label"], g["pred"], average="macro"), include_groups=False)
               .sort_values())


# ---------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------
def _finish(ax, fig, path):
    ax.tick_params(length=0)
    if path:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(path, facecolor="white")
    return fig


def bar_h(values: pd.Series, title: str, xlabel: str = "", highlight=None,
          fmt: str = "{:,.0f}", path=None, xlim=None, color=BLUE, figsize=(7, 4.2)):
    """Horizontal bar chart; one bar can be highlighted, the rest muted."""
    fig, ax = plt.subplots(figsize=figsize)
    colors = [color if (highlight is None or idx == highlight) else GREY for idx in values.index]
    ax.barh(values.index.astype(str), values.values, color=colors, height=0.62)
    span = (xlim[1] if xlim else values.max())
    for i, v in enumerate(values.values):
        ax.text(v + span * 0.01, i, fmt.format(v), va="center", fontsize=9.5, color=INK_2)
    ax.set_title(title, loc="left")
    ax.set_xlabel(xlabel)
    if xlim:
        ax.set_xlim(*xlim)
    ax.xaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.spines["left"].set_visible(False)
    return _finish(ax, fig, path)


def label_split_chart(counts: pd.Series, title: str, path=None):
    """Two-segment horizontal bar for safe vs unsafe share."""
    fig, ax = plt.subplots(figsize=(7, 1.7))
    total = counts.sum()
    left = 0
    for label, color in (("safe", BLUE), ("unsafe", ORANGE)):
        v = counts.get(label, 0)
        ax.barh([0], [v], left=left, color=color, height=0.5, edgecolor="white", linewidth=2)
        ax.text(left + v / 2, 0, f"{label}  {v / total:.0%}", ha="center", va="center",
                color="white", fontsize=11, fontweight="bold")
        left += v
    ax.set_xlim(0, total)
    ax.axis("off")
    ax.set_title(title, loc="left")
    return _finish(ax, fig, path)


def grouped_metric_chart(table: pd.DataFrame, metrics: list[str], title: str, path=None):
    """Models on the y-axis, one bar per metric (max 3 metrics)."""
    palette = [BLUE, ORANGE, "#1baf7a"]
    fig, ax = plt.subplots(figsize=(8, 4.6))
    n = len(metrics)
    y = np.arange(len(table))
    h = 0.8 / n
    for i, m in enumerate(metrics):
        ax.barh(y + (i - (n - 1) / 2) * h, table[m].values, height=h * 0.92,
                color=palette[i], label=m)
        for j, v in enumerate(table[m].values):
            ax.text(v + 0.005, y[j] + (i - (n - 1) / 2) * h, f"{v:.2f}", va="center",
                    fontsize=8.5, color=INK_2)
    ax.set_yticks(y, table.index)
    ax.set_xlim(0, 1.08)
    ax.invert_yaxis()
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.07), ncol=n, frameon=False, fontsize=9.5)
    ax.set_title(title, loc="left")
    ax.xaxis.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.spines["left"].set_visible(False)
    return _finish(ax, fig, path)


def confusion_chart(y_true, y_pred, labels, title: str, path=None, normalize=False,
                    figsize=(4.6, 4), label_values=None):
    """labels = names shown on the axes; label_values = the values used in y (default: same)."""
    cm = confusion_matrix(y_true, y_pred, labels=label_values if label_values is not None else labels)
    shown = cm / cm.sum(axis=1, keepdims=True) if normalize else cm
    fig, ax = plt.subplots(figsize=figsize)
    ax.imshow(shown, cmap="Blues")
    ax.set_xticks(range(len(labels)), labels, rotation=45 if len(labels) > 3 else 0, ha="right" if len(labels) > 3 else "center")
    ax.set_yticks(range(len(labels)), labels)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    if len(labels) <= 4:
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                txt = f"{cm[i, j]:,}\n({cm[i, j] / cm[i].sum():.0%})"
                ax.text(j, i, txt, ha="center", va="center", fontsize=11,
                        color="white" if shown[i, j] > shown.max() / 2 else INK)
    ax.set_title(title, loc="left")
    for s in ax.spines.values():
        s.set_visible(False)
    return _finish(ax, fig, path)


# ---------------------------------------------------------------------------
# Excel report (openpyxl)
# ---------------------------------------------------------------------------
def export_excel(sheets: dict[str, pd.DataFrame], path: str | Path) -> Path:
    from openpyxl.styles import Alignment, Font, PatternFill

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        for name, frame in sheets.items():
            frame.to_excel(writer, sheet_name=name[:31])
            ws = writer.sheets[name[:31]]
            for cell in ws[1]:
                cell.font = Font(bold=True, color="FFFFFF")
                cell.fill = PatternFill("solid", fgColor="2A78D6")
                cell.alignment = Alignment(horizontal="center", wrap_text=True)
            for col in ws.columns:
                width = max(len(str(c.value)) if c.value is not None else 0 for c in col)
                ws.column_dimensions[col[0].column_letter].width = min(max(width + 2, 10), 45)
                for c in col[1:]:
                    if isinstance(c.value, float):
                        c.number_format = "0.000"
            ws.freeze_panes = "B2"
    return path
