#!/usr/bin/env python3
"""Construit les données du site :

  - scrutins du Sénat : pages officielles senat.fr (totaux + ventilation par groupe) ;
  - vote correspondant de l'Assemblée nationale : dumps officiels data.assemblee-nationale.fr ;
  - qualification éditoriale de chaque texte (pipeline/qualifications.json) ;
  - validation stricte de toutes les sommes ; génération de site/data.js et site/data.json.
"""

import csv
import glob
import html as htmllib
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
PAGES = OPENDATA / "pages"
SITE = ROOT / "site"

ACCORDION_TO_GROUP = {
    "UMP": "LR",
    "SOC": "SER",
    "UC": "UC",
    "RTLI": "LIRT",
    "LREM": "RDPI",
    "CRC": "CRCE",
    "RDSE": "RDSE",
    "GEST": "GEST",
    "NI": "NI",
}

AN_STAGES = [
    (r"\(texte de la commission mixte paritaire\)", "Texte de la CMP"),
    (r"\(lecture définitive\)", "Lecture définitive"),
    (r"\(nouvelle lecture\)", "Nouvelle lecture"),
    (r"\(deuxième lecture\)", "2ᵉ lecture"),
    (r"\(première lecture\)", "1ʳᵉ lecture"),
    (r"\(seconde délibération\)", "2ᵈᵉ délibération"),
]


def clean_text(text: str) -> str:
    text = htmllib.unescape(text)
    text = text.replace("\\'", "'")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def fetch_page(scrutin_id: str, url: str) -> str:
    PAGES.mkdir(parents=True, exist_ok=True)
    cache = PAGES / f"{scrutin_id}.html"
    if cache.exists() and cache.stat().st_size > 10000:
        return cache.read_text(encoding="utf-8", errors="replace")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; scrutins-citoyens/1.0)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    cache.write_text(raw, encoding="utf-8")
    return raw


def parse_scrutin_page(raw: str) -> dict:
    totals = {}
    for value, label in re.findall(
        r'<strong class="display-4 ff-alt[^"]*">(\d+)</strong>\s*(votants|suffrages exprim[^<]*|pour|contre)',
        raw,
    ):
        key = label.strip()
        if key.startswith("suffrages"):
            key = "exprimes"
        totals[key] = int(value)

    m = re.search(r"Abstention\s*(?:&nbsp;|&#160;|&amp;nbsp;|\s)*:\s*<span class=\"fw-semibold\">(\d+)</span>", raw)
    abstention = int(m.group(1)) if m else 0
    m = re.search(
        r"N[^<:]{0,60}part au vote\s*(?:&nbsp;|&#160;|&amp;nbsp;|\s)*:\s*<span class=\"fw-semibold\">(\d+)</span>",
        raw,
        re.S,
    )
    non_votants = int(m.group(1)) if m else 0

    result_raw = None
    m = re.search(r"<h2 class=\"card-title\">R(?:&eacute;|é)sultat du scrutin</h2>\s*<p>(.*?)</p>", raw, re.S)
    if m:
        result_raw = clean_text(m.group(1))
    if result_raw:
        low = result_raw.lower()
        if "n'a pas adopt" in low or "pas adopt" in low or "rejet" in low:
            result = "Rejet"
        elif "adopt" in low:
            result = "Adoption"
        else:
            result = result_raw
    else:
        result = "?"

    dossier = None
    m = re.search(r'href="(/dossier-legislatif/[^"]+\.html)"', raw)
    if m:
        dossier = "https://www.senat.fr" + m.group(1)

    groups = []
    for block in re.split(r'<div class="accordion-item">', raw)[1:]:
        gm = re.search(r'id="accordion-scrutin-([A-Z]+)"', block)
        lm = re.search(r'accordion-title fs-5">(.*?)</h3>', block, re.S)
        if not gm or not lm:
            continue
        label = clean_text(lm.group(1))
        sm = re.search(r":\s*(\d+)\s*s[eé]nateurs", label)
        size = int(sm.group(1)) if sm else None
        counts = {"pour": 0, "contre": 0, "abstention": 0, "nonVotants": 0}
        for pos_label, value in re.findall(
            r">((?:Pour|Contre|Abstention|N[^<:]{0,60}part au vote))[^<]*?:\s*<span class=\"ms-1 fw-semibold\">(\d+)</span>",
            block,
            re.S,
        ):
            pl = pos_label.lower()
            if "pour" in pl and "part" not in pl:
                counts["pour"] = int(value)
            elif "contre" in pl:
                counts["contre"] = int(value)
            elif "abstention" in pl:
                counts["abstention"] = int(value)
            elif "part au vote" in pl:
                counts["nonVotants"] = int(value)
        label_short = re.sub(r"\s*:\s*\d+\s*s[eé]nateurs\s*$", "", label).strip()
        groups.append({"key": ACCORDION_TO_GROUP.get(gm.group(1), gm.group(1)), "label": label_short, "size": size, **counts})

    return {
        "resultDetail": result_raw,
        "result": result,
        "dossierUrl": dossier,
        "totals": {
            "votants": totals.get("votants"),
            "exprimes": totals.get("exprimes"),
            "pour": totals.get("pour"),
            "contre": totals.get("contre"),
            "abstention": abstention,
            "nonVotants": non_votants,
        },
        "groups": groups,
    }


def validate_scrutin(scrutin: dict) -> list:
    problems = []
    t = scrutin["totals"]
    if None in (t["votants"], t["exprimes"], t["pour"], t["contre"]):
        problems.append("totaux incomplets")
        return problems
    if t["votants"] != t["pour"] + t["contre"] + t["abstention"]:
        problems.append("votants != pour+contre+abstention")
    if t["exprimes"] != t["pour"] + t["contre"]:
        problems.append("exprimés != pour+contre")
    if not scrutin["groups"]:
        problems.append("aucun groupe parsé")
        return problems
    seats = sum(g["size"] or 0 for g in scrutin["groups"])
    if seats not in range(340, 349):
        problems.append(f"sièges par groupe = {seats} (hors plage)")
    for g in scrutin["groups"]:
        if g["size"] is None:
            problems.append(f"groupe {g['key']} sans effectif")
        elif g["pour"] + g["contre"] + g["abstention"] + g["nonVotants"] != g["size"]:
            problems.append(f"groupe {g['key']} : somme != effectif")
    for pos in ("pour", "contre", "abstention", "nonVotants"):
        if sum(g[pos] for g in scrutin["groups"]) != t[pos]:
            problems.append(f"somme {pos} par groupe != total")
    return problems


def load_an_group_labels() -> dict:
    cache = OPENDATA / "an_group_labels.json"
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    labels = {}
    for f in glob.glob(str(OPENDATA / "amo30" / "json" / "organe" / "*.json")):
        o = json.load(open(f)).get("organe")
        if o and o.get("codeType") == "GP":
            labels[o["uid"]] = {"abbr": o.get("libelleAbrege") or o.get("libelle"), "label": o.get("libelle")}
    cache.write_text(json.dumps(labels, ensure_ascii=False), encoding="utf-8")
    return labels


def stage_of(title: str) -> str:
    for pattern, label in AN_STAGES:
        if re.search(pattern, title):
            return label
    return "Vote public"


def parse_an_scrutin(uid: str, labels: dict, colors: dict, an_labels: dict, normalize: dict) -> dict:
    leg = re.search(r"VTANR5L(\d+)V", uid).group(1)
    path = OPENDATA / f"an{leg}" / "json" / f"{uid}.json"
    if not path.exists():
        sys.exit(
            f"ERREUR : dump AN introuvable ({path}).\n"
            "Lancez d'abord : python3 pipeline/fetch_an.py"
        )
    s = json.loads(path.read_text(encoding="utf-8"))["scrutin"]
    dec = s["syntheseVote"]["decompte"]
    totals = {
        "votants": int(s["syntheseVote"]["nombreVotants"]),
        "exprimes": int(s["syntheseVote"]["suffragesExprimes"]),
        "pour": int(dec["pour"]),
        "contre": int(dec["contre"]),
        "abstention": int(dec.get("abstentions") or 0),
        "nonVotants": int(dec.get("nonVotants") or 0),
    }
    groups = []
    for g in s["ventilationVotes"]["organe"]["groupes"]["groupe"]:
        info = labels.get(g["organeRef"], {})
        raw_abbr = info.get("abbr") or g["organeRef"]
        abbr = normalize.get(raw_abbr, raw_abbr)
        dv = g["vote"].get("decompteVoix") or {}
        groups.append({
            "key": abbr,
            "label": an_labels.get(abbr, info.get("label") or abbr),
            "short": abbr,
            "color": colors.get(abbr, "#8B95A9"),
            "size": int(g.get("nombreMembresGroupe") or 0),
            "pour": int(dv.get("pour") or 0),
            "contre": int(dv.get("contre") or 0),
            "abstention": int(dv.get("abstentions") or 0),
            "nonVotants": int(dv.get("nonVotants") or 0),
        })
    result = "Adoption" if s["sort"]["code"] == "adopté" else "Rejet"
    return {
        "uid": uid,
        "legislature": int(leg),
        "numero": int(s["numero"]),
        "date": s["dateScrutin"],
        "title": clean_text(s["titre"]),
        "stage": stage_of(s["titre"]),
        "result": result,
        "resultLabel": clean_text(s["sort"].get("libelle") or ""),
        "url": f"https://www.assemblee-nationale.fr/dyn/{leg}/scrutins/{s['numero']}",
        "totals": totals,
        "groups": groups,
    }


def validate_an(scrutin: dict) -> list:
    problems = []
    t = scrutin["totals"]
    if t["votants"] != t["pour"] + t["contre"] + t["abstention"]:
        problems.append(f"AN {scrutin['uid']} : votants != pour+contre+abstention")
    if t["exprimes"] != t["pour"] + t["contre"]:
        problems.append(f"AN {scrutin['uid']} : exprimés != pour+contre")
    seats = sum(g["size"] for g in scrutin["groups"])
    if not 550 <= seats <= 578:
        problems.append(f"AN {scrutin['uid']} : total sièges = {seats} (hors plage)")
    for pos in ("pour", "contre", "abstention", "nonVotants"):
        if sum(g[pos] for g in scrutin["groups"]) != t[pos]:
            problems.append(f"AN {scrutin['uid']} : somme {pos} par groupe != total")
    return problems


def origin_of(title: str) -> str:
    t = title.lower()
    if "projet de loi" in t:
        return "Gouvernement"
    if "proposition de loi" in t:
        return "Parlementaire"
    if "proposition de résolution" in t:
        return "Résolution"
    return "—"


def main() -> None:
    config = json.loads((ROOT / "pipeline" / "config.json").read_text(encoding="utf-8"))
    resumes = json.loads((ROOT / "pipeline" / "resumes.json").read_text(encoding="utf-8"))
    an_mapping = json.loads((ROOT / "pipeline" / "an_mapping.json").read_text(encoding="utf-8"))
    sessions = {d["id"]: d for d in json.loads((OPENDATA / "session_scrutins.json").read_text(encoding="utf-8"))}
    senators = json.loads((OPENDATA / "senateurs.json").read_text(encoding="utf-8"))
    deputes = json.loads((OPENDATA / "deputes.json").read_text(encoding="utf-8"))

    an_labels = load_an_group_labels()
    an_colors = config["anGroupColors"]
    an_short = config["anGroupLabels"]
    an_normalize = config.get("anGroupNormalize", {})

    # --- groupes Sénat (effectifs actuels + membres) ---
    active = [s for s in senators if s["active"]]
    members_by_group = {}
    for s in active:
        key = config["senatorGroupMapping"].get(s["group_short"])
        if not key:
            sys.exit(f"ERREUR : groupe inconnu pour {s['full_name']} : {s['group_short']}")
        members_by_group.setdefault(key, []).append({"name": s["full_name"], "department": s["department_label"] or "—"})
    for key in members_by_group:
        members_by_group[key].sort(key=lambda m: m["name"])

    # --- scrutins ---
    scrutins_out = {}
    an_cache = {}
    for theme in config["themes"]:
        for sid in theme["scrutins"]:
            if sid in scrutins_out:
                continue
            meta = sessions.get(sid)
            if not meta:
                sys.exit(f"ERREUR : scrutin {sid} absent de session_scrutins.json")
            parsed = parse_scrutin_page(fetch_page(sid, meta["url"]))
            problems = validate_scrutin({**parsed, "id": sid})
            if problems:
                sys.exit(f"ERREUR validation Sénat {sid} : " + " ; ".join(problems))
            if meta["result"] and parsed["result"] not in (meta["result"], "?"):
                sys.exit(f"ERREUR {sid} : résultat page ({parsed['result']}) != liste ({meta['result']})")

            resume = resumes.get(sid)
            if not resume:
                sys.exit(f"ERREUR : aucun résumé pour {sid}")

            an_uid = an_mapping["map"].get(sid)
            an = None
            if an_uid:
                if an_uid not in an_cache:
                    an_cache[an_uid] = parse_an_scrutin(an_uid, an_labels, an_colors, an_short, an_normalize)
                    problems = validate_an(an_cache[an_uid])
                    if problems:
                        sys.exit("ERREUR validation AN : " + " ; ".join(problems))
                an = an_cache[an_uid]

            scrutins_out[sid] = {
                "id": sid,
                "date": meta["date"],
                "title": meta["title"],
                "url": meta["url"],
                "theme": theme["id"],
                "result": parsed["result"],
                "dossierUrl": parsed["dossierUrl"],
                "totals": parsed["totals"],
                "groups": parsed["groups"],
                "origin": origin_of(meta["title"]),
                "resume": resume,
                "an": an,
                "anNote": an_mapping.get("notes", {}).get(sid),
            }
            flag = f"AN {an_uid}" if an_uid else "AN —"
            print(f"  ok {sid}  {parsed['result']:>8}  [{origin_of(meta['title']):>12}]  {flag}")

    # --- profils agrégés Sénat ---
    profiles = {}
    for g in config["groups"]:
        key = g["key"]
        tot = {"pour": 0, "contre": 0, "abstention": 0, "exprimes": 0, "votants": 0, "possible": 0}
        for scrutiny in scrutins_out.values():
            gr = next((x for x in scrutiny["groups"] if x["key"] == key), None)
            if not gr or not gr["size"]:
                continue
            tot["pour"] += gr["pour"]; tot["contre"] += gr["contre"]; tot["abstention"] += gr["abstention"]
            tot["exprimes"] += gr["pour"] + gr["contre"]
            tot["votants"] += gr["pour"] + gr["contre"] + gr["abstention"]
            tot["possible"] += gr["size"]
        expr = tot["exprimes"] or 1
        profiles[key] = {
            "presencePct": round(100 * tot["votants"] / tot["possible"], 1) if tot["possible"] else None,
            "pourPct": round(100 * tot["pour"] / expr, 1),
            "contrePct": round(100 * tot["contre"] / expr, 1),
            "nbVotes": tot["exprimes"],
        }

    # --- groupes AN actuels (17e législature) ---
    depute_norm = config.get("anDeputeGroupNormalize", {})
    an_groups_count = {}
    for d in deputes:
        if d.get("active"):
            k = depute_norm.get(d["group_short"], d["group_short"])
            an_groups_count[k] = an_groups_count.get(k, 0) + 1
    an_groups = [
        {"key": k, "short": k, "label": an_short.get(k, k), "color": an_colors.get(k, "#8B95A9"), "seats": v}
        for k, v in sorted(an_groups_count.items(), key=lambda x: -x[1])
    ]

    dates = sorted(s["date"] for s in scrutins_out.values() if s["date"])
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "period": {"from": dates[0], "to": dates[-1]},
        "senatorCount": len(active),
        "deputeCount": sum(an_groups_count.values()),
        "opinion": config["opinion"],
        "anSource": config["anSource"],
        "groups": [
            {
                "key": g["key"], "short": g["short"], "label": g["label"], "color": g["color"],
                "seats": len(members_by_group.get(g["key"], [])),
                "members": members_by_group.get(g["key"], []),
                "profile": profiles[g["key"]],
            }
            for g in config["groups"]
        ],
        "anGroups": an_groups,
        "themes": [
            {
                "id": t["id"], "order": t.get("order", 99), "name": t["name"], "icon": t["icon"],
                "pastel": t["pastel"], "description": t["description"], "concern": t.get("concern"),
                "scrutins": t["scrutins"],
            }
            for t in config["themes"]
        ],
        "scrutins": scrutins_out,
    }

    SITE.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (SITE / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (SITE / "data.js").write_text("window.SENAT_DATA=" + payload + ";\n", encoding="utf-8")
    with_an = sum(1 for s in scrutins_out.values() if s["an"])
    print(f"\nOK : {len(scrutins_out)} scrutins dont {with_an} avec vote AN · période {data['period']['from']} → {data['period']['to']}")
    print(f"     {SITE / 'data.js'} ({len(payload) / 1024:.0f} Ko)")


if __name__ == "__main__":
    main()
