#!/usr/bin/env python3
"""Construit les données du site à partir de TOUS les scrutins publics du Sénat
de la période couverte, croisés (au niveau du texte) avec l'Assemblée nationale.

Étapes :
  1. liste complète des scrutins (opendata/session_scrutins.json) ;
  2. téléchargement/parsing des pages officielles (cache opendata/pages) en parallèle ;
  3. validation stricte (sommes) — les scrutins incohérents sont écartés et signalés ;
  4. regroupement par texte (dossier législatif), affectation à un sujet, type de vote ;
  5. correspondance AN : fiche détaillée pour les votes « ensemble » vérifiés (an_mapping.json)
     + liste des votes de l'Assemblée sur le même texte ;
  6. écriture de app/public/data.json (application Vue active) et de site/data.json + site/data.js (archive).
"""

import glob
import html as htmllib
import json
import os
import re
import sys
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"
PAGES = OPENDATA / "pages"
SITE = ROOT / "site"
APP_PUBLIC = ROOT / "app" / "public"

ACCORDION_TO_GROUP = {"UMP": "LR", "SOC": "SER", "UC": "UC", "RTLI": "LIRT", "LREM": "RDPI", "CRC": "CRCE", "RDSE": "RDSE", "GEST": "GEST", "NI": "NI"}

AN_STAGES = [
    (r"\(texte de la commission mixte paritaire\)", "Texte de la CMP"),
    (r"\(lecture définitive\)", "Lecture définitive"),
    (r"\(nouvelle lecture\)", "Nouvelle lecture"),
    (r"\(deuxième lecture\)", "2ᵉ lecture"),
    (r"\(première lecture\)", "1ʳᵉ lecture"),
    (r"\(seconde délibération\)", "2ᵈᵉ délibération"),
]

THEME_PATTERNS = [
    ("environnement", r"climat|environnement|écologie|ecologie|énergie|energie|nucléaire|nucleaire|renouvelable|biodiversité|biodiversite|pollution|déchets|dechets|montagne|eau\b|assainissement|forêt|foret|chasse|pêche|peche|inondation|mobilités? durables|véhicules? électriques|nature|paysage"),
    ("alimentation", r"alimentation|agricole|agriculture|élevage|elevage|agriculteurs|souveraineté alimentaire|pêche|peche|vigne|viticul|cultures?|élevage|bien-être animal"),
    ("logement", r"logement|habitat|locatif|hébergement|hebergement|construction|bail\b|foncier|loyer|copropriété|copropriete"),
    ("ecole", r"école|ecole|scolaire|professeur|université|universite|enseignement|étudiant|etudiant|laïcité|laicite|recherche|vie scolaire|lycée|college|collège"),
    ("travail", r"emploi|travail|salari|chômage|chomage|apprentissage|dialogue social|plein emploi|travailleurs|seniors|laboratoire|convention collective|assurance chômage|sécurité sociale des travailleurs"),
    ("securite", r"sécurité|securite|délinquance|delinquance|criminalit|criminelle|narcotrafic|stupéfiant|stupefiant|police|gendarmerie|ordre public|terroris|délinquants|delinquants|violences|justice pénale|sécurité civile|cybersécurité|cybercriminalité|victimes"),
    ("sante", r"santé|sante|soins|médical|medical|hôpital|hopital|médecin|medecin|maladie|vaccin|médicament|medicament|palliatif|aide à mourir|aide a mourir|psychiatri|handicap|cancer|sclérose|sclerose|protection de l'enfance"),
    ("solidarite", r"retraite|pension|grand âge|grand age|autonomie|dépendance|dependance|prestations sociales|minima sociaux|aide sociale|famille|enfance|jeunesse|bénéficiaires|beneficiaires|allocation|vieillesse"),
    ("immigration", r"immigration|intégration|integration|asile|étrangers|etrangers|nationalité|nationalite|rétention|retention|titre de séjour|visa|apatridie|frontière"),
    ("finances", r"finances|budget|financi|fiscal|impôt|impot|taxe|déficit|deficit|dette|comptes|fraude|dépense|depense|douane|trésor|tresor"),
    ("pouvoir-achat", r"pouvoir d'achat|prix|inflation|pouvoir d'achat|tarif|énergie|energie|consommation|concurrence|partage de la valeur|salaires|smic|aide alimentaire|chèques|cheques"),
]
THEME_OVERRIDES = {
    "projet de loi de finances": "finances",
    "projet de loi de financement": "sante",
    "projet de loi de programmation des finances publiques": "finances",
    "projet de loi de finances de fin de gestion": "finances",
    "projet de loi d'orientation pour la souveraineté alimentaire": "alimentation",
    "projet de loi d'urgence pour la protection et la souveraineté agricoles": "alimentation",
    "projet de loi pour le plein emploi": "travail",
    "projet de loi portant transposition des accords nationaux interprofessionnels": "travail",
}


def clean_text(text: str) -> str:
    text = htmllib.unescape(text)
    text = text.replace("\\'", "'")
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def norm(text: str) -> str:
    t = unicodedata.normalize("NFKD", (text or "").lower()).replace("’", "'").replace("œ", "oe")
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9' ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def tokens(s: str):
    return [w for w in s.split() if len(w) > 2]


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


def parse_scrutin_page(raw: str) -> dict:
    totals = {}
    for value, label in re.findall(r'<strong class="display-4 ff-alt[^"]*">(\d+)</strong>\s*(votants|suffrages exprim[^<]*|pour|contre)', raw):
        key = "exprimes" if label.strip().startswith("suffrages") else label.strip()
        totals[key] = int(value)
    m = re.search(r"Abstention\s*(?:&nbsp;|&#160;|&amp;nbsp;|\s)*:\s*<span class=\"fw-semibold\">(\d+)</span>", raw)
    abstention = int(m.group(1)) if m else 0
    m = re.search(r"N[^<:]{0,60}part au vote\s*(?:&nbsp;|&#160;|&amp;nbsp;|\s)*:\s*<span class=\"fw-semibold\">(\d+)</span>", raw, re.S)
    non_votants = int(m.group(1)) if m else 0

    result = "?"
    m = re.search(r"<h2 class=\"card-title\">R(?:&eacute;|é)sultat du scrutin</h2>\s*<p>(.*?)</p>", raw, re.S)
    if m:
        low = clean_text(m.group(1)).lower()
        result = "Rejet" if ("n'a pas adopt" in low or "pas adopt" in low or "rejet" in low) else ("Adoption" if "adopt" in low else "?")

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
        for pos_label, value in re.findall(r">((?:Pour|Contre|Abstention|N[^<:]{0,60}part au vote))[^<]*?:\s*<span class=\"ms-1 fw-semibold\">(\d+)</span>", block, re.S):
            pl = pos_label.lower()
            if "pour" in pl and "part" not in pl:
                counts["pour"] = int(value)
            elif "contre" in pl:
                counts["contre"] = int(value)
            elif "abstention" in pl:
                counts["abstention"] = int(value)
            elif "part au vote" in pl:
                counts["nonVotants"] = int(value)
        groups.append({"key": ACCORDION_TO_GROUP.get(gm.group(1), gm.group(1)), "size": size, **counts})

    return {
        "result": result,
        "dossierUrl": dossier,
        "totals": {"votants": totals.get("votants"), "exprimes": totals.get("exprimes"), "pour": totals.get("pour"), "contre": totals.get("contre"), "abstention": abstention, "nonVotants": non_votants},
        "groups": groups,
    }


def validate_scrutin(scrutin: dict) -> list:
    problems = []
    t = scrutin["totals"]
    if None in (t["votants"], t["exprimes"], t["pour"], t["contre"]):
        return ["totaux incomplets"]
    if t["votants"] != t["pour"] + t["contre"] + t["abstention"]:
        problems.append("votants != pour+contre+abstention")
    if t["exprimes"] != t["pour"] + t["contre"]:
        problems.append("exprimés != pour+contre")
    if not scrutin["groups"]:
        problems.append("aucun groupe")
        return problems
    seats = sum(g["size"] or 0 for g in scrutin["groups"])
    if seats not in range(330, 349):
        problems.append(f"sièges={seats}")
    for g in scrutin["groups"]:
        if g["size"] is None or g["pour"] + g["contre"] + g["abstention"] + g["nonVotants"] != g["size"]:
            problems.append(f"groupe {g['key']} incohérent")
    for pos in ("pour", "contre", "abstention", "nonVotants"):
        if sum(g[pos] for g in scrutin["groups"]) != t[pos]:
            problems.append(f"somme {pos} != total")
    return problems


def text_of(title: str) -> str:
    t = re.sub(r"^sur\s+", "", title, flags=re.I)
    t = re.sub(r"\s*-\s*consulter le dossier.*$", "", t, flags=re.I)
    t = re.sub(r"\s*\((premi[eè]re|deuxi[eè]me|nouvelle|lecture d[ée]finitive|texte de la commission mixte paritaire)[^)]*\)", "", t, flags=re.I)
    last = None
    for m in re.finditer(r"(projet de loi|proposition de loi|proposition de r[ée]solution)", t, re.I):
        last = m
    if not last:
        return t.strip(" .,;:")[:180]
    after = re.sub(r"\s*-\s*consulter.*$", "", t[last.end():], flags=re.I).strip(" .,;:")
    return (last.group(1) + " " + after).strip(" .,;:")[:190]



AMEND_RX = re.compile(r"((?:sous-)?amendements? (?:identiques )?(?:n[°o]\s*[0-9A-Za-z\-]+(?: rectifi[eé](?: bis| ter| quater)?)?))", re.I)
AUTHOR_RX = re.compile(r"pr[eé]sent[eé]e?s? par (?:M\.|MM\.|Mme|Mmes) ([^,]+?)(?: et les membres| et plusieurs|,|$)", re.I)
ARTICLE_RX = re.compile(r"((?:avant |apr[eè]s )?l'article (?:unique|premier|1er|[0-9]+(?: bis| ter| quater)?(?:\s+(?-i:[A-Z]{1,2})\b)?))", re.I)


def subject_of(title: str) -> str:
    t = re.sub(r"^sur\s+", "", title, flags=re.I)
    t = re.sub(r"\s*-\s*consulter le dossier.*$", "", t, flags=re.I)
    t = re.sub(r"\s*\((premi[eè]re|deuxi[eè]me|nouvelle|lecture d[ée]finitive|texte de la commission mixte paritaire)[^)]*\)\s*$", "", t, flags=re.I)
    last = None
    for m in re.finditer(r"(projet de loi|proposition de loi|proposition de r[ée]solution)", t, re.I):
        last = m
    prefix = t[: last.start()] if last else t
    low = prefix.lower()
    if "commission mixte paritaire" in low:
        return "Ensemble du texte · texte de la CMP"
    if "motion" in low:
        if "rejet pr" in low:
            return "Motion de rejet préalable"
        if "renvoi en commission" in low:
            return "Motion de renvoi en commission"
        if "question pr" in low:
            return "Question préalable"
        if "irrecevabilit" in low:
            return "Exception d'irrecevabilité"
        return "Motion de procédure"
    if "l'ensemble" in low and "amendement" not in low and "article" not in low:
        return "Ensemble du texte"
    if "l'ensemble" in low and "article" in low and "amendement" not in low:
        art = ARTICLE_RX.search(prefix)
        if art:
            lab = re.sub(r"^l'", "", art.group(1).strip())
            return "Ensemble du texte · " + lab
        return "Ensemble du texte"
    am = AMEND_RX.search(prefix)
    if am:
        label = re.sub(r"\s+", " ", am.group(1)).strip()
        label = label[0].upper() + label[1:]
        author = AUTHOR_RX.search(prefix)
        art = ARTICLE_RX.search(prefix)
        parts = [label]
        if author:
            parts.append(author.group(1).strip())
        if art:
            parts.append(re.sub(r"^l'", "", art.group(1).strip()))
        return " · ".join(parts)
    art = ARTICLE_RX.search(prefix)
    if art:
        label = re.sub(r"^l'", "", art.group(1).strip())
        return label[0].upper() + label[1:]
    return re.sub(r"\s+", " ", prefix).strip(" .,;:")[:80] or "Scrutin"


def vote_type(title: str) -> str:
    t = title.lower()
    if "motion" in t and ("rejet" in t or "préalable" in t or "renvoi" in t or "irrecevabilité" in t or "question préalable" in t or "exception" in t):
        return "Motion de procédure"
    if "sous-amendement" in t or "amendement" in t:
        return "Amendement"
    if "constituant l'ensemble" in t or "sur l'ensemble" in t:
        return "Ensemble du texte"
    if re.search(r"l'article\b", t):
        return "Article"
    return "Autre"


def theme_of(text: str) -> str:
    nt = norm(text)
    for key, val in THEME_OVERRIDES.items():
        if norm(key) in nt:
            return val
    best, best_score = None, 0
    for key, pattern in THEME_PATTERNS:
        score = len(re.findall(pattern, nt, re.I))
        if score > best_score:
            best, best_score = key, score
    return best or "autres"


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


def an_scrutin_brief(uid: str, labels: dict, normalize: dict, full: bool = False) -> dict:
    leg = re.search(r"VTANR5L(\d+)V", uid).group(1)
    path = OPENDATA / f"an{leg}" / "json" / f"{uid}.json"
    if not path.exists():
        sys.exit(f"ERREUR : dump AN introuvable ({path}). Lancez : python3 pipeline/fetch_an.py")
    s = json.loads(path.read_text(encoding="utf-8"))["scrutin"]
    dec = s["syntheseVote"]["decompte"]
    brief = {
        "uid": uid, "legislature": int(leg), "date": s["dateScrutin"], "stage": stage_of(s["titre"]),
        "result": "Adoption" if s["sort"]["code"] == "adopté" else "Rejet",
        "title": clean_text(s["titre"]),
        "url": f"https://www.assemblee-nationale.fr/dyn/{leg}/scrutins/{s['numero']}",
        "totals": {"pour": int(dec["pour"]), "contre": int(dec["contre"]), "abstention": int(dec.get("abstentions") or 0)},
    }
    if full:
        groups = []
        for g in s["ventilationVotes"]["organe"]["groupes"]["groupe"]:
            info = labels.get(g["organeRef"], {})
            raw = info.get("abbr") or g["organeRef"]
            key = normalize.get(raw, raw)
            dv = g["vote"].get("decompteVoix") or {}
            groups.append({"key": key, "size": int(g.get("nombreMembresGroupe") or 0), "pour": int(dv.get("pour") or 0),
                           "contre": int(dv.get("contre") or 0), "abstention": int(dv.get("abstentions") or 0), "nonVotants": int(dv.get("nonVotants") or 0)})
        brief["groups"] = groups
        brief["totals"] = {"votants": int(s["syntheseVote"]["nombreVotants"]), "exprimes": int(s["syntheseVote"]["suffragesExprimes"]),
                           "pour": int(dec["pour"]), "contre": int(dec["contre"]), "abstention": int(dec.get("abstentions") or 0), "nonVotants": int(dec.get("nonVotants") or 0)}
        brief["resultLabel"] = clean_text(s["sort"].get("libelle") or "")
    return brief


def main() -> None:
    config = json.loads((ROOT / "pipeline" / "config.json").read_text(encoding="utf-8"))
    resumes = json.loads((ROOT / "pipeline" / "resumes.json").read_text(encoding="utf-8"))
    an_mapping = json.loads((ROOT / "pipeline" / "an_mapping.json").read_text(encoding="utf-8"))
    sessions = {d["id"]: d for d in json.loads((OPENDATA / "session_scrutins.json").read_text(encoding="utf-8"))}
    senators = json.loads((OPENDATA / "senateurs.json").read_text(encoding="utf-8"))
    deputes = json.loads((OPENDATA / "deputes.json").read_text(encoding="utf-8"))
    an_labels = load_an_group_labels()

    ordered_ids = sorted(sessions.keys(), key=lambda k: (k.split("-")[0], int(k.split("-")[1])))

    def work(sid):
        meta = sessions[sid]
        try:
            parsed = parse_scrutin_page(fetch_page(sid, meta["url"]))
        except Exception as exc:  # noqa: BLE001
            return sid, None, [f"téléchargement/parse: {exc}"]
        problems = validate_scrutin(parsed)
        return sid, parsed, problems

    scrutins_out, rejects = {}, []
    with ThreadPoolExecutor(max_workers=8) as pool:
        for sid, parsed, problems in pool.map(work, ordered_ids):
            if parsed is None or problems:
                rejects.append((sid, problems[:2]))
                continue
            meta = sessions[sid]
            text = text_of(meta["title"])
            an_uid = an_mapping["map"].get(sid)
            scrutins_out[sid] = {
                "id": sid, "date": meta["date"], "title": meta["title"],
                "url": meta["url"], "dossierUrl": parsed["dossierUrl"], "text": text, "subject": subject_of(meta["title"]),
                "type": vote_type(meta["title"]), "theme": theme_of(text), "result": parsed["result"],
                "origin": "Gouvernement" if "projet de loi" in norm(meta["title"]) else ("Parlementaire" if "proposition de loi" in norm(meta["title"]) else "Autre"),
                "totals": parsed["totals"], "groups": [{"key": g["key"], "size": g["size"], "pour": g["pour"], "contre": g["contre"], "abstention": g["abstention"], "nonVotants": g["nonVotants"]} for g in parsed["groups"]],
            }
            if sid in resumes:
                scrutins_out[sid]["resume"] = resumes[sid]
            if an_uid:
                scrutins_out[sid]["an"] = an_scrutin_brief(an_uid, an_labels, config.get("anGroupNormalize", {}), full=True)
                note = an_mapping.get("notes", {}).get(sid)
                if note:
                    scrutins_out[sid]["anNote"] = note

    print(f"Scrutins parsés/validés : {len(scrutins_out)} / {len(ordered_ids)}")
    if rejects:
        print(f"Scrutins écartés : {len(rejects)}")
        for sid, p in rejects[:8]:
            print("   ", sid, p)

    # --- correspondance AN au niveau du texte (votes « ensemble » de l'Assemblée) ---
    an_docs = []
    for folder in ("an16", "an17"):
        for f in glob.glob(str(OPENDATA / folder / "json" / "*.json")):
            s = json.loads(Path(f).read_text(encoding="utf-8")).get("scrutin")
            if s:
                an_docs.append((s["uid"], norm(s.get("titre", ""))))
    by_text = {}
    for s in scrutins_out.values():
        by_text.setdefault(s["text"], []).append(s)
    an_by_text = {}
    for text, items in by_text.items():
        kt = tokens(norm(text))
        if len(kt) < 4:
            continue
        matches = []
        for uid, an_norm in an_docs:
            if "ensemble" not in an_norm:
                continue
            if sum(1 for t in kt if t in set(tokens(an_norm))) / len(kt) >= 0.85:
                matches.append(uid)
        if matches:
            matches = sorted(set(matches), key=lambda u: an_scrutin_brief(u, an_labels, config.get("anGroupNormalize", {}))["date"])[:4]
            an_by_text[text] = [an_scrutin_brief(u, an_labels, config.get("anGroupNormalize", {}), full=True) for u in matches]

    # --- groupes Sénat ---
    active = [s for s in senators if s["active"]]
    members_by_group = {}
    for s in active:
        key = config["senatorGroupMapping"].get(s["group_short"])
        if not key:
            continue
        members_by_group.setdefault(key, []).append({"name": s["full_name"], "department": s["department_label"] or "—"})
    for key in members_by_group:
        members_by_group[key].sort(key=lambda m: m["name"])

    profiles = {}
    for g in config["groups"]:
        key = g["key"]
        tot = {"pour": 0, "contre": 0, "abstention": 0, "exprimes": 0, "votants": 0, "possible": 0}
        for s in scrutins_out.values():
            gr = next((x for x in s["groups"] if x["key"] == key), None)
            if not gr or not gr["size"]:
                continue
            tot["pour"] += gr["pour"]; tot["contre"] += gr["contre"]; tot["abstention"] += gr["abstention"]
            tot["exprimes"] += gr["pour"] + gr["contre"]
            tot["votants"] += gr["pour"] + gr["contre"] + gr["abstention"]
            tot["possible"] += gr["size"]
        expr = tot["exprimes"] or 1
        profiles[key] = {"presencePct": round(100 * tot["votants"] / tot["possible"], 1) if tot["possible"] else None,
                         "pourPct": round(100 * tot["pour"] / expr, 1), "contrePct": round(100 * tot["contre"] / expr, 1),
                         "nbVotes": tot["exprimes"]}

    depute_norm = config.get("anDeputeGroupNormalize", {})
    an_groups_count = {}
    for d in deputes:
        if d.get("active"):
            k = depute_norm.get(d["group_short"], d["group_short"])
            an_groups_count[k] = an_groups_count.get(k, 0) + 1
    an_groups = [{"key": k, "short": k, "label": config["anGroupLabels"].get(k, k), "color": config["anGroupColors"].get(k, "#8B95A9"), "seats": v} for k, v in sorted(an_groups_count.items(), key=lambda x: -x[1])]

    themes_cfg = [t for t in sorted(config["themes"], key=lambda x: x.get("order", 99))]
    themes_cfg.append({"id": "autres", "order": 99, "name": "Autres textes votés", "icon": "book", "pastel": "#ECEEF1",
                       "description": "Textes votés ne relevant pas des dix sujets principaux.", "concern": None})

    dates = sorted(s["date"] for s in scrutins_out.values() if s["date"])
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "period": {"from": dates[0], "to": dates[-1]},
        "senatorCount": len(active), "deputeCount": sum(an_groups_count.values()),
        "opinion": config["opinion"], "anSource": config["anSource"],
        "groups": [{"key": g["key"], "short": g["short"], "label": g["label"], "color": g["color"], "seats": len(members_by_group.get(g["key"], [])), "members": members_by_group.get(g["key"], []), "profile": profiles[g["key"]]} for g in config["groups"]],
        "anGroups": an_groups,
        "anGroupColors": config["anGroupColors"], "anGroupLabels": config["anGroupLabels"],
        "themes": [{"id": t["id"], "order": t.get("order", 99), "name": t["name"], "icon": t["icon"], "pastel": t["pastel"], "description": t["description"], "concern": t.get("concern")} for t in themes_cfg],
        "scrutins": scrutins_out,
        "anByText": an_by_text,
        "textSummaries": json.loads((ROOT / "pipeline" / "text_summaries.json").read_text(encoding="utf-8")) if (ROOT / "pipeline" / "text_summaries.json").exists() else {},
        "senators": __import__("pipeline.build_senators_map", fromlist=["build_map"]).build_map() if (ROOT / "pipeline" / "build_senators_map.py").exists() else {},
        "groupMapping": config.get("senatToAnGroups", {}),
    }

    SITE.mkdir(parents=True, exist_ok=True)
    APP_PUBLIC.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    (SITE / "data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (SITE / "data.js").write_text("window.SENAT_DATA=" + payload + ";\n", encoding="utf-8")
    (APP_PUBLIC / "data.json").write_text(payload, encoding="utf-8")
    print(f"OK : {len(scrutins_out)} scrutins · {len(by_text)} textes · {len(an_by_text)} textes avec votes AN · période {data['period']['from']} → {data['period']['to']}")
    print(f"     {SITE / 'data.js'} ({len(payload)/1024/1024:.2f} Mo)")
    print(f"     {APP_PUBLIC / 'data.json'} ({(APP_PUBLIC / 'data.json').stat().st_size/1024/1024:.2f} Mo)")

    if os.environ.get("KEEP_PAGES") != "1" and PAGES.exists():
        for f in PAGES.glob("*.html"):
            f.unlink()


if __name__ == "__main__":
    main()
