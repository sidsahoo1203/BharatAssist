"""Scheme scraper (Unit 3: web scraping with requests + BeautifulSoup).

Downloads a web page that lists government schemes, pulls scheme names out of
its HTML tables or lists, and saves them to data/domain/schemes.csv. Those
names are used to generate safe, in-domain example questions for the safety
model (see domain_data.py).

Usage:
    python -m bharatassist.scraper "<url of a page listing schemes>"
    python -m bharatassist.scraper --file saved_page.html
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

import pandas as pd

from .config import DATA_DIR
from .exceptions import BharatAssistError
from .logger import get_logger

SCHEMES_CSV = DATA_DIR / "domain" / "schemes.csv"
HEADERS = {"User-Agent": "Mozilla/5.0 (BharatAssist student project; scheme list scraper)"}

# words that mark a line as a scheme name
_SCHEME_WORDS = re.compile(r"\b(yojana|scheme|mission|abhiyan|programme|program|card|bima|nidhi|pension)\b",
                           re.IGNORECASE)
_NOISE = re.compile(r"\[\d+\]|\(\s*\)|\s+")


class ScrapeError(BharatAssistError):
    """Raised when a page cannot be fetched or contains no scheme names."""


def fetch_html(url: str, timeout: int = 20) -> str:
    import requests

    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout)
        response.raise_for_status()
    except requests.RequestException as err:
        raise ScrapeError(f"Could not download {url}: {err}") from err
    return response.text


def clean_name(text: str) -> str:
    text = _NOISE.sub(" ", text).strip(" -–:• ")
    return text


def parse_scheme_names(html: str) -> list[str]:
    """Return unique scheme names found in table cells and list items."""
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer"]):
        tag.decompose()

    candidates = []
    for table in soup.find_all("table"):                 # first column of every table row
        for row in table.find_all("tr"):
            cells = row.find_all("td")                    # skip header (th) cells
            if cells:
                candidates.append(cells[0].get_text(" ", strip=True))
    for item in soup.find_all(["li", "h2", "h3", "h4"]):  # list items and headings
        candidates.append(item.get_text(" ", strip=True))

    names, seen = [], set()
    for raw in candidates:
        name = clean_name(raw)
        if 4 <= len(name) <= 80 and len(name.split()) >= 2 and _SCHEME_WORDS.search(name) and name.lower() not in seen:
            seen.add(name.lower())
            names.append(name)
    if not names:
        raise ScrapeError("No scheme names found on the page.")
    return names


def update_catalogue(names: list[str], category: str = "Scraped", path: Path = SCHEMES_CSV) -> pd.DataFrame:
    """Merge newly scraped names into the scheme catalogue CSV (no duplicates)."""
    old = pd.read_csv(path) if path.exists() else pd.DataFrame(columns=["name", "category"])
    new = pd.DataFrame({"name": names, "category": category})
    merged = pd.concat([old, new]).drop_duplicates(subset="name", keep="first", ignore_index=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    merged.to_csv(path, index=False)
    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape scheme names into data/domain/schemes.csv")
    parser.add_argument("url", nargs="?")
    parser.add_argument("--file", type=Path, help="parse a saved HTML file instead of downloading")
    args = parser.parse_args()
    log = get_logger("scraper")

    html = args.file.read_text(encoding="utf-8") if args.file else fetch_html(args.url)
    names = parse_scheme_names(html)
    merged = update_catalogue(names)
    log.info("Found %d scheme names; catalogue now has %d schemes", len(names), len(merged))


if __name__ == "__main__":
    main()
