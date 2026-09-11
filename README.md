# Sénat·Vote — les votes du Sénat et de l'Assemblée, sujet par sujet

Site statique (HTML/CSS/JS, sans dépendance) qui présente les **scrutins publics du Sénat** croisés avec les
**votes de l'Assemblée nationale** sur les mêmes textes, classés par **sujets de préoccupation des Français**,
avec la position de chaque **groupe politique** et le **sens du vote** par rapport à un objectif affiché.

## Fonctionnalités

- **7 grands sujets** classés par leur poids dans l'opinion (Elabe, rentrée 2026 ; comparaison Ipsos, juillet 2026) :
  pouvoir d'achat, sécurité, dette, santé, immigration, climat, inégalités.
- **Qualification de chaque vote** : chaque texte est qualifié *en faveur*, *en défaveur* ou *neutre* vis-à-vis
  de l'objectif de référence du sujet, avec une note documentée ; le résultat (adopté/rejeté) est combiné pour
  indiquer si l'issue du vote fait progresser l'objectif.
- **Résultat de l'Assemblée nationale** pour chaque scrutin du Sénat lorsque le vote existe (22 sur 31),
  avec totaux et ventilation par groupe AN, et le motif lorsque aucun vote public n'est recensé.
- **Graphiques par groupe** : part des voix en faveur / contre l'objectif, abstentions incluses ou exclues.
- **Pages** : sujets, détail par sujet, tous les votes (filtres), comparer deux groupes, groupes, méthode.
- Design éditorial clair, mobile first, aucune erreur console ni débordement (QA automatisée).

## Principe éditorial

- Les sujets sont classés d'après deux enquêtes publiées (Elabe, Ipsos) ; les sources sont liées.
- Chaque sujet affiche un **objectif de référence** (ex. « réduire la dette et les déficits publics ») ;
  les qualifications sont des lectures documentées, notées vote par vote, et discutables.
- Le site **ne note pas les partis et ne recommande aucun vote**.

## Structure

```
site/
  index.html        # coquille de l'application
  data.js           # données générées (ne pas éditer à la main)
  data.json         # mêmes données en JSON
  assets/style.css  # design éditorial clair, mobile first
  assets/app.js     # routage par hash + rendu + interactions
pipeline/
  config.json         # sujets, scrutins, objectifs, groupes (Sénat et AN)
  qualifications.json # qualification documentée de chaque vote + note
  an_mapping.json     # correspondance scrutin Sénat → scrutin Assemblée (vérifiée)
  match_an.py         # aide au rapprochement automatique des textes (curation)
  parse_sessions.py   # liste des scrutins des sessions sénatoriales (senat.fr)
  build_data.py       # téléchargement, parsing, validation, génération de data.js
  smoke_test.js       # rendu de toutes les routes (DOM simulé, Node)
opendata/
  session-*.html, session_scrutins.json   # liste consolidée des scrutins Sénat
  pages/                                  # pages officielles des scrutins analysés
  senateurs.json, deputes.json            # annuaires (groupes et effectifs)
  scrutins_senat.json                     # open data de contrôle
  an16/, an17/                            # dumps officiels des scrutins AN (16e et 17e législatures)
  amo30/                                  # annuaire des organes (libellés des groupes AN)
```

## Utilisation

Ouvrir `site/index.html` (fonctionne en `file://`) ou servir le dossier :

```bash
cd site && python3 -m http.server 8000
```

## Régénérer les données

```bash
python3 pipeline/fetch_an.py          # télécharge les dumps officiels AN (16e/17e législatures + organes)
python3 pipeline/parse_sessions.py   # (optionnel) met à jour la liste des scrutins Sénat
python3 pipeline/match_an.py         # (aide) affiche les candidats AN pour chaque scrutin
python3 pipeline/build_data.py       # parse, valide et écrit site/data.js
node pipeline/smoke_test.js          # vérifie le rendu de toutes les routes
```

`build_data.py` **bloque la publication** en cas d'incohérence : somme des groupes ≠ totaux (Sénat ou
Assemblée), effectifs incohérents, résultat différent de la liste officielle, qualification manquante, etc.

## Sources

- Scrutins du Sénat : https://www.senat.fr/scrutin-public/scr2025.html (Licence Ouverte 2.0 / Etalab)
- Scrutins de l'Assemblée nationale : https://data.assemblee-nationale.fr/travaux-parlementaires/votes (Licence Ouverte 2.0)
- Baromètres : Elabe (https://elabe.fr/rentree-2026/) et Ipsos (juillet 2026)

Période couverte : octobre 2023 → juillet 2026.

## Indépendance

Projet citoyen indépendant, sans affiliation avec le Sénat, l'Assemblée nationale, Elabe, Ipsos ou un parti.
Aucun cookie, aucun traceur, aucune donnée personnelle.
