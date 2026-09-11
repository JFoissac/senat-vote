#!/usr/bin/env python3
"""Télécharge et extrait les dumps officiels de l'Assemblée nationale nécessaires au pipeline.

Sources (data.assemblee-nationale.fr, Licence Ouverte 2.0) :
  - scrutins publics des 16e et 17e législatures ;
  - annuaire des organes (libellés des groupes politiques).

Les archives sont extraites dans opendata/an16, opendata/an17 et opendata/amo30.
Relancer ce script est sans effet si les dossiers existent déjà.
"""

import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OPENDATA = ROOT / "opendata"

DATASETS = [
    ("https://data.assemblee-nationale.fr/static/openData/repository/16/loi/scrutins/Scrutins.json.zip", "an16"),
    ("https://data.assemblee-nationale.fr/static/openData/repository/17/loi/scrutins/Scrutins.json.zip", "an17"),
    ("https://data.assemblee-nationale.fr/static/openData/repository/17/amo/tous_acteurs_mandats_organes_xi_legislature/AMO30_tous_acteurs_tous_mandats_tous_organes_historique.json.zip", "amo30"),
]


def main() -> None:
    for url, folder in DATASETS:
        target = OPENDATA / folder
        marker = target / "json"
        if marker.exists() and any(marker.iterdir()):
            print(f"déjà présent : {folder}")
            continue
        target.mkdir(parents=True, exist_ok=True)
        archive = OPENDATA / (folder + ".zip")
        print(f"téléchargement : {url}")
        cmd = ["curl", "-fsSL", "--retry", "3", "-o", str(archive), url]
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print("  vérification du certificat impossible (CDN) ; nouvelle tentative avec -k")
            subprocess.run(cmd[:1] + ["-k"] + cmd[1:], check=True)
        print(f"extraction vers opendata/{folder} …")
        with zipfile.ZipFile(archive) as z:
            z.extractall(target)
        archive.unlink()
        print("  ok")
    print("\nDumps prêts. Vous pouvez lancer : python3 pipeline/build_data.py")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        sys.exit(f"ERREUR téléchargement : {exc}")
