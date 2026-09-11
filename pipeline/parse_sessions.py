#!/usr/bin/env python3
"""Parse les listes de scrutins publics des sessions du Sénat (2023-2024, 2024-2025, 2025-2026).

Entrée  : opendata/session-{2023,2024,2025}.html (pages officielles senat.fr)
Sortie  : opendata/session_scrutins.json
"""

import html as htmllib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"

MONTHS = {
    "janvier": 1, "février": 2, "mars": 3, "avril": 4, "mai": 5, "juin": 6,
    "juillet": 7, "août": 8, "septembre": 9, "octobre": 10, "novembre": 11, "décembre": 12,
}


def clean(text: str) -> str:
    text = htmllib.unescape(text)
    text = text.replace("\\'", "'").replace("\\", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fr_date_to_iso(label: str):
    m = re.match(r"^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$", clean(label).lower())
    if not m:
        return None
    day, month_name, year = int(m.group(1)), m.group(2), int(m.group(3))
    month = MONTHS.get(month_name)
    if not month:
        return None
    return f"{year:04d}-{month:02d}-{day:02d}"


def parse_session(year: int):
    path = OPENDATA / f"session-{year}.html"
    raw = path.read_text(encoding="utf-8", errors="replace")
    items = []
    for li in re.findall(r'<li class="list-group-item list-group-flush">(.*?)</li>', raw, re.S):
        date_div = re.search(r'<div class="list-group-subtitle">(.*?)</div>', li, re.S)
        date_iso = fr_date_to_iso(date_div.group(1)) if date_div else None
        for p in re.findall(r"<p class=\"my-2\">(.*?)</p>", li, re.S):
            link = re.search(r'href="(\d{4})/scr(\d{4})-(\d+)\.html">Scrutin N&deg;(\d+)</a>', p)
            if not link:
                continue
            badge = re.search(r'<span class="badge[^"]*">([^<]+)</span>', p)
            text = re.sub(r"<[^>]+>", " ", p)
            text = clean(text)
            text = re.sub(r"^Scrutin N°\d+\s*:\s*", "", text)
            text = re.sub(r"\s*-\s*consulter le dossier législatif\.?\s*", "", text)
            text = re.sub(r"\s*(Adoption|Rejet)\s*$", "", text)
            items.append({
                "id": f"{link.group(2)}-{int(link.group(3))}",
                "date": date_iso,
                "title": text,
                "result": clean(badge.group(1)) if badge else None,
                "url": f"https://www.senat.fr/scrutin-public/{link.group(1)}/scr{link.group(2)}-{int(link.group(3))}.html",
            })
    return items


def main():
    all_items = []
    for year in (2023, 2024, 2025):
        items = parse_session(year)
        all_items.extend(items)
        print(f"session {year}: {len(items)} scrutins")

    seen = {}
    for item in all_items:
        seen[item["id"]] = item
    ordered = sorted(seen.values(), key=lambda x: (x["id"].split("-")[0], int(x["id"].split("-")[1])))
    out = OPENDATA / "session_scrutins.json"
    out.write_text(json.dumps(ordered, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"total unique: {len(ordered)} -> {out}")

    # aperçu
    for item in ordered[-5:]:
        print(item["id"], item["date"], item["title"][:90])


if __name__ == "__main__":
    main()
