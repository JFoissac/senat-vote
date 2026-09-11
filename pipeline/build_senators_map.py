#!/usr/bin/env python3
"""Construit l'annuaire des sénateurs et l'injecte dans app/public/data.json.

Source principale : API officielle du Sénat (https://www.senat.fr/api-senat/senateurs.json) —
fournit photo (urlAvatar), page officielle, groupe et circonscription des 348 sénateurs en exercice.
Complément : annuaire historique (opendata/senateurs.json) pour les sénateurs qui ne sont plus en
exercice mais apparaissent dans les scrutins de la période.
"""

import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
API_URL = "https://www.senat.fr/api-senat/senateurs.json"
API_CACHE = OPENDATA / "senateurs_api.json"


def nin(name: str) -> str:
    t = unicodedata.normalize("NFKD", (name or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"^(?:mm?\.|mme|mmes?|mlles?)\s+", "", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def load_api() -> list:
    if not API_CACHE.exists() or API_CACHE.stat().st_size < 10000:
        subprocess.run(["curl", "-fsSL", "--retry", "3", "-o", str(API_CACHE), API_URL], check=True)
    return json.loads(API_CACHE.read_text(encoding="utf-8"))


def build_map() -> dict:
    out = {}

    # 1) sénateurs en exercice (API officielle)
    for s in load_api():
        full = f"{s.get('prenom', '')} {s.get('nom', '')}".strip()
        circ = s.get("circonscription") or {}
        grp = s.get("groupe") or {}
        entry = {
            "name": full,
            "department": circ.get("libelle") or "",
            "dept": circ.get("code") or "",
            "group": grp.get("libelleCourt") or grp.get("code") or "",
            "groupLabel": grp.get("libelle") or "",
            "photo": ("https://www.senat.fr" + s["urlAvatar"]) if s.get("urlAvatar") else "",
            "page": ("https://www.senat.fr" + s["url"]) if s.get("url") else "",
            "active": True,
        }
        for form in (full, f"{s.get('nom', '')} {s.get('prenom', '')}"):
            key = nin(form)
            if key:
                out[key] = entry

    # 2) complément historique (sénateurs qui ne siègent plus)
    hist = json.loads((OPENDATA / "senateurs.json").read_text(encoding="utf-8"))
    for s in hist:
        key = nin(s.get("full_name") or "")
        if not key or key in out:
            continue
        out[key] = {
            "name": s.get("full_name") or "",
            "department": s.get("department_label") or "",
            "dept": s.get("department_code") or "",
            "group": s.get("group_short") or "",
            "groupLabel": s.get("group_label") or "",
            "photo": "",
            "page": "",
            "active": bool(s.get("active")),
        }
    return out


def main() -> None:
    mapping = build_map()
    path = ROOT / "app" / "public" / "data.json"
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        data["senators"] = mapping
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{path} : {len(mapping)} entrées")
    with_photo = sum(1 for v in mapping.values() if v["photo"])
    print(f"dont {with_photo} avec photo et page officielle")


if __name__ == "__main__":
    main()
