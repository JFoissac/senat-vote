#!/usr/bin/env python3
"""Rapproche chaque scrutin du Sénat (sélection du site) des scrutins de l'Assemblée nationale
portant sur le même texte. Affiche les meilleurs candidats pour curation manuelle.

Sources : dumps officiels data.assemblee-nationale.fr (16e et 17e législatures) — cache an16/, an17/.
Sortie indicative : mapping proposé (à relire) sur stdout.
"""

import glob
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", text.lower())
    text = text.replace("’", "'").replace("œ", "oe")
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9' ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def text_key(title: str) -> str:
    t = norm(title)
    t = re.sub(r"^sur ", "", t)
    patterns = [
        r"l'ensemble du texte elabore par la commission mixte paritaire sur (.*)$",
        r"l'ensemble du texte elabore par la commission mixte paritaire (.*)$",
        r"l'ensemble (?:du|de la|de l'|des) (.*)$",
        r"l'article .*? constituant l'ensemble (?:du|de la|de l'|des) (.*)$",
    ]
    for p in patterns:
        m = re.search(p, t)
        if m:
            t = m.group(1)
            break
    t = re.sub(r"\((?:nouvelle lecture|deuxieme lecture|relecture)\)", "", t)
    t = re.sub(r"\(.*?\)", "", t)
    t = re.sub(r"\b(nouvelle|deuxieme|premiere|lecture|relecture|definitive)\b", " ", t)
    t = re.sub(r"\s+", " ", t).strip(" .,;:")
    return t


def tokens(s: str):
    return [w for w in s.split() if len(w) > 2]


def load_an():
    scr = []
    for leg, folder in (("16", "an16"), ("17", "an17")):
        for f in glob.glob(str(OPENDATA / folder / "json" / "*.json")):
            s = json.load(open(f)).get("scrutin")
            if s:
                scr.append(s)
    return scr


def load_group_labels():
    labels = {}
    for f in glob.glob(str(OPENDATA / "amo30" / "json" / "organe" / "*.json")):
        o = json.load(open(f)).get("organe")
        if o and o.get("codeType") == "GP":
            labels[o["uid"]] = o.get("libelleAbrege") or o.get("libelle")
    return labels


def score(an_norm: str, key_tokens, stage_pref: str, an_date: str, sen_date: str):
    an_tokens = set(tokens(an_norm))
    if not key_tokens:
        return 0
    covered = sum(1 for t in key_tokens if t in an_tokens)
    base = covered / len(key_tokens)
    bonus = 0
    if "ensemble" in an_norm:
        bonus += 0.25
    if stage_pref and stage_pref in an_norm:
        bonus += 0.15
    if "commission mixte paritaire" in an_norm and stage_pref == "cmp":
        bonus += 0.15
    if an_date == sen_date:
        bonus += 0.1
    return base + bonus


def main():
    config = json.loads((ROOT / "pipeline" / "config.json").read_text(encoding="utf-8"))
    sessions = {d["id"]: d for d in json.loads((OPENDATA / "session_scrutins.json").read_text(encoding="utf-8"))}
    an_scrutins = load_an()
    an_index = []
    for s in an_scrutins:
        an_index.append((s, norm(s.get("titre", ""))))

    for theme in config["themes"]:
        for sid in theme["scrutins"]:
            meta = sessions[sid]
            key = text_key(meta["title"])
            kt = tokens(key)
            stage_pref = ""
            if "commission mixte paritaire" in norm(meta["title"]):
                stage_pref = "commission mixte paritaire"
            elif "nouvelle lecture" in norm(meta["title"]):
                stage_pref = "nouvelle lecture"
            cands = []
            for s, an_norm in an_index:
                sc = score(an_norm, kt, stage_pref, s.get("dateScrutin", ""), meta["date"] or "")
                if sc >= 0.7:
                    cands.append((sc, s))
            cands.sort(key=lambda x: -x[0])
            print("=" * 110)
            print(f"{sid} {meta['date']} [{meta['result']}] {meta['title'][:110]}")
            print(f"   clé: {key[:100]}")
            for sc, s in cands[:4]:
                dec = s.get("syntheseVote", {}).get("decompte", {})
                print(
                    f"   {sc:.2f} {s['uid']} {s.get('dateScrutin')} "
                    f"[{s.get('sort', {}).get('code')}] {s.get('titre', '')[:110]}"
                )
                print(f"        voix: pour={dec.get('pour')} contre={dec.get('contre')} abst={dec.get('abstentions')} nv={dec.get('nonVotants')}")
            if not cands:
                print("   (aucun candidat)")


if __name__ == "__main__":
    main()
