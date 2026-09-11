#!/usr/bin/env python3
"""Construit un annuaire des sénateurs (nom normalisé → département, groupe, activité)
et l'injecte dans app/public/data.json (et site/data.json) sous la clé « senators ».

Sert à enrichir la liste des votants d'un scrutin : département, région et groupe.
Les noms des votes nominatifs sont fournis sans civilité ; la clé est le nom normalisé.
"""

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"


def nin(name: str) -> str:
    t = unicodedata.normalize("NFKD", (name or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"^(?:mm?\.|mme|mmes?|mlles?)\s+", "", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def build_map() -> dict:
    senators = json.loads((OPENDATA / "senateurs.json").read_text(encoding="utf-8"))
    out = {}
    for s in senators:
        key = nin(s["full_name"])
        if not key:
            continue
        existing = out.get(key)
        # priorité aux sénateurs actifs en cas de doublon
        if existing and existing.get("active") and not s.get("active"):
            continue
        out[key] = {
            "name": s["full_name"],
            "department": s.get("department_label") or "",
            "dept": s.get("department_code") or "",
            "group": s.get("group_short") or "",
            "active": bool(s.get("active")),
        }
    return out


def main() -> None:
    mapping = build_map()
    for path in (ROOT / "app" / "public" / "data.json", ROOT / "site" / "data.json"):
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        data["senators"] = mapping
        if "site" in path.parts:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        else:
            path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"{path} : {len(mapping)} sénateurs")


if __name__ == "__main__":
    main()
