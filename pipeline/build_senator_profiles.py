#!/usr/bin/env python3
"""Génère un profil par sénateur : ses votes nominatifs et quelques indicateurs.

Entrées : app/public/data.json (scrutins + annuaire des sénateurs) et app/public/votes/{id}.json.
Sortie  : app/public/senateurs/{slug}.json
Format  : {"slug","name","votes":[{"i":id,"p":"P|C|A|N","g":"LR","a":true}],"stats":{"n","p","c","a","nv","ecarts"}}
Les votes sont triés du plus récent au plus ancien ; « a » indique que la position du sénateur
correspond à la position majoritaire de son groupe sur ce scrutin.
"""

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app" / "public"
VOTES = APP / "votes"
OUT = APP / "senateurs"
POS_LETTER = {"pour": "P", "contre": "C", "abstention": "A", "nonVotants": "N"}


def nin(name: str) -> str:
    t = unicodedata.normalize("NFKD", (name or "").lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"^(?:mm?\.|mme|mmes?|mlles?)\s+", "", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def majority(groups):
    out = {}
    for g in groups:
        pour, contre, abs_ = g.get("pour", 0), g.get("contre", 0), g.get("abstention", 0)
        if pour >= contre and pour >= abs_:
            out[g["key"]] = "pour"
        elif contre >= pour and contre >= abs_:
            out[g["key"]] = "contre"
        else:
            out[g["key"]] = "abstention"
    return out


def main() -> None:
    data = json.loads((APP / "data.json").read_text(encoding="utf-8"))
    scrutins = data["scrutins"]
    by_name = {}
    for entry in data.get("senators", {}).values():
        key = nin(entry.get("name"))
        if key and key not in by_name:
            by_name[key] = entry

    profiles = {}
    for path in sorted(VOTES.glob("*.json")):
        sid = path.stem
        meta = scrutins.get(sid)
        if not meta:
            continue
        maj = majority(meta["groups"])
        doc = json.loads(path.read_text(encoding="utf-8"))
        for gkey, positions in doc.get("groups", {}).items():
            for pos, names in positions.items():
                letter = POS_LETTER.get(pos)
                if not letter or not names:
                    continue
                for name in names.split(", "):
                    entry = by_name.get(nin(name))
                    if not entry or not entry.get("slug"):
                        continue
                    p = profiles.setdefault(
                        entry["slug"],
                        {"slug": entry["slug"], "name": entry.get("name") or name, "votes": [], "stats": {"n": 0, "p": 0, "c": 0, "a": 0, "nv": 0, "ecarts": 0}},
                    )
                    pos_name = {"P": "pour", "C": "contre", "A": "abstention", "N": "nonVotants"}[letter]
                    aligned = pos_name != "nonVotants" and maj.get(gkey) == pos_name
                    p["votes"].append({"i": sid, "p": letter, "g": gkey, "a": aligned})
                    st = p["stats"]
                    st["n"] += 1
                    if letter == "P":
                        st["p"] += 1
                    elif letter == "C":
                        st["c"] += 1
                    elif letter == "A":
                        st["a"] += 1
                    else:
                        st["nv"] += 1
                    if letter in ("P", "C", "A") and not aligned:
                        st["ecarts"] += 1

    OUT.mkdir(parents=True, exist_ok=True)
    for slug, profile in profiles.items():
        profile["votes"].sort(key=lambda v: scrutins.get(v["i"], {}).get("date", ""), reverse=True)
        (OUT / f"{slug}.json").write_text(json.dumps(profile, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    total = sum(len(p["votes"]) for p in profiles.values())
    size = sum(f.stat().st_size for f in OUT.glob("*.json"))
    print(f"{len(profiles)} profils, {total} positions nominatives, {size/1024/1024:.1f} Mo dans {OUT}")


if __name__ == "__main__":
    main()
