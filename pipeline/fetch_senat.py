#!/usr/bin/env python3
"""Télécharge les listes de scrutins publics du Sénat par session.

Entrée  : pages officielles https://www.senat.fr/scrutin-public/scr{année}.html
Sortie  : opendata/session-{année}.html (cache versionné, lu par parse_sessions.py)

Usage :
    python3 pipeline/fetch_senat.py            # toutes les sessions (2023 → 2026)
    python3 pipeline/fetch_senat.py 2026       # une seule session

Le fichier n'est réécrit que si la page a changé ; le script affiche le nombre de
scrutins listés avant/après pour rendre le delta visible.
"""

import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
BASE = "https://www.senat.fr/scrutin-public/scr{year}.html"
USER_AGENT = "Mozilla/5.0 (compatible; scrutins-citoyens/1.0)"

LINK_RX = re.compile(r'href="\d{4}/scr(\d{4})-(\d+)\.html"')


def count_links(raw: str) -> int:
    return len(LINK_RX.findall(raw))


def fetch(year: int) -> None:
    url = BASE.format(year=year)
    out = OPENDATA / f"session-{year}.html"
    before = out.read_text(encoding="utf-8", errors="replace") if out.exists() else ""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    if count_links(raw) == 0:
        sys.exit(f"ERREUR : aucun scrutin trouvé dans {url} — page inattendue, rien n'est écrit.")
    changed = raw != before
    if changed:
        out.write_text(raw, encoding="utf-8")
    print(
        f"session {year}: {count_links(before)} → {count_links(raw)} scrutins listés"
        f" ({'mise à jour' if changed else 'déjà à jour'}) → {out}"
    )


def main() -> None:
    years = [int(a) for a in sys.argv[1:]] or [2023, 2024, 2025, 2026]
    for year in years:
        fetch(year)


if __name__ == "__main__":
    main()
