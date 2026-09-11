#!/usr/bin/env python3
"""Extrait les votes nominatifs (noms par groupe et par position) depuis les pages
officielles du Sénat et écrit un fichier par scrutin : app/public/votes/{id}.json

Format : {"id": "...", "groups": {"LR": {"pour": "Mme X, MM. Y", "contre": "", "abstention": "", "nonVotants": ""}}}
Les noms sont des chaînes séparées par « , » (moins volumineux que des tableaux).
"""

import html as htmllib
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
PAGES = OPENDATA / "pages"
OUT = ROOT / "app" / "public" / "votes"

ACCORDION_TO_GROUP = {"UMP": "LR", "SOC": "SER", "UC": "UC", "RTLI": "LIRT", "LREM": "RDPI", "CRC": "CRCE", "RDSE": "RDSE", "GEST": "GEST", "NI": "NI"}
def pos_key(label: str) -> str:
    low = label.lower()
    if "pour" in low and "part" not in low:
        return "pour"
    if "contre" in low:
        return "contre"
    if "abstention" in low:
        return "abstention"
    if "part" in low and "vote" in low:
        return "nonVotants"
    return ""
HONORIFIC = re.compile(r"^(?:MM?\.|Mmes?|Mlles?|Mme|M\.)\s*", re.I)


def clean(text: str) -> str:
    text = htmllib.unescape(text)
    text = text.replace("\\'", "'")
    text = re.sub(r"<br\s*/?>", " ", text)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


ANNOTATION = re.compile(r"pr[eé]sid|gouvernement|s[eé]ance|qui votait|par d[eé]l[eé]gation", re.I)


def clean_names(chunk: str) -> str:
    names = []
    for raw in chunk.split(","):
        name = HONORIFIC.sub("", clean(raw)).replace("*", "").strip(" .;:")
        if name and len(name) > 1 and not ANNOTATION.search(name):
            names.append(name)
    return ", ".join(names)


def fetch_page(scrutin_id: str, url: str) -> str:
    PAGES.mkdir(parents=True, exist_ok=True)
    cache = PAGES / f"{scrutin_id}.html"
    if cache.exists() and cache.stat().st_size > 8000:
        return cache.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; scrutins-citoyens/1.0)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    cache.write_text(raw, encoding="utf-8")
    return raw


def parse_named_votes(raw: str) -> dict:
    groups = {}
    for block in re.split(r'<div class="accordion-item">', raw)[1:]:
        gm = re.search(r'id="accordion-scrutin-([A-Z]+)"', block)
        body = re.search(r'<div class="accordion-body">(.*?)(?:</div>\s*</div>\s*</div>|<div class="accordion-item">|$)', block, re.S)
        if not gm or not body:
            continue
        key = ACCORDION_TO_GROUP.get(gm.group(1), gm.group(1))
        entry = {"pour": "", "contre": "", "abstention": "", "nonVotants": ""}
        for li in re.findall(r'<li class="mb-2">(.*?)</li>', body.group(1), re.S):
            m = re.match(r"\s*<b>([^<]+)</b>\s*:?\s*(.*)$", li, re.S)
            if not m:
                continue
            pos = pos_key(clean(m.group(1)))
            if pos:
                entry[pos] = clean_names(m.group(2))
        groups[key] = entry
    return groups


def work(item):
    sid, url = item
    raw = fetch_page(sid, url)
    groups = parse_named_votes(raw)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{sid}.json").write_text(json.dumps({"id": sid, "groups": groups}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    total = sum((g["pour"] + ", " + g["contre"] + ", " + g["abstention"] + ", " + g["nonVotants"]).count(", ") for g in groups.values())
    return sid, len(groups), total


def main() -> None:
    sessions = json.loads((OPENDATA / "session_scrutins.json").read_text(encoding="utf-8"))
    items = [(d["id"], d["url"]) for d in sessions]
    only = sys.argv[1:]
    if only:
        items = [i for i in items if i[0] in only]
    ok = 0
    with ThreadPoolExecutor(max_workers=8) as pool:
        for sid, ngroups, names in pool.map(work, items):
            ok += 1
            if only:
                print(f"  {sid}: {ngroups} groupes, {names} noms")
    print(f"{ok} fichiers écrits dans {OUT}")


if __name__ == "__main__":
    main()
