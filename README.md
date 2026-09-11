# Sénat·Vote — les votes du Sénat et de l'Assemblée, sujet par sujet

Site statique (HTML/CSS/JS, sans dépendance) qui présente **tous les scrutins publics du Sénat** de la période,
regroupés par **texte** et classés par **sujets de la vie quotidienne**, avec la position de chaque **groupe
politique** et, au niveau du texte, les **votes de l'Assemblée nationale**. Présentation strictement factuelle.

## Ce que montre le site

- **12 sujets** : pouvoir d'achat, santé, école, logement, travail, sécurité et ordre public, écologie/climat/énergie,
  alimentation/agriculture, retraites/solidarité/grand âge, immigration/asile/intégration, finances publiques/dette, autres textes.
- **Tous les votes publics** de la période (ensemble, articles, amendements, motions), regroupés par texte (dossier législatif).
- Pour chaque vote : **ce que change le texte** (résumé factuel), **adopté ou rejeté**, son **origine**
  (projet de loi du gouvernement ou proposition parlementaire), le **vote correspondant de l'Assemblée nationale**
  lorsqu'il existe, et la **répartition des votes par groupe** (pour, contre, abstention, non-votants).
- Graphiques par groupe (« comment le Sénat / l'Assemblée a voté »), page **Groupes** (Sénat et Assemblée) et page **Comparer** :
  checklist de sujets, taux d'accord entre deux groupes, participation et part de votes pour/contre, par sujet.

## Neutralité

- Le site **ne note pas les textes, ne classe pas les partis et ne recommande aucun vote**.
- Les sujets ont des **libellés descriptifs** (ex. « Immigration, asile et intégration »), pas des objectifs orientés.
- Aucun indicateur « en faveur / en défaveur » : les graphiques montrent la répartition des votes, sans juger le sens des textes.
- L'onglet Comparer ne désigne ni « meilleur » ni « pire » groupe : il mesure un **taux d'accord** (position majoritaire identique), la **participation** et la part de votes pour/contre.
- La page Méthode explique aussi la **composition du Sénat** : pas de groupe LFI (aucun sénateur LFI ; gauche représentée par SER, CRCE-K, GEST) et 4 sénateurs RN, sous le seuil de 10 pour former un groupe, donc non-inscrits (« NI »).

## Structure

```
site/
  index.html        # coquille de l'application
  data.js           # données générées (ne pas éditer à la main)
  data.json         # mêmes données en JSON
  assets/style.css  # design éditorial clair, mobile first
  assets/app.js     # routage par hash + rendu
pipeline/
  config.json       # sujets, scrutins, groupes (Sénat et Assemblée)
  resumes.json      # résumé factuel de chaque texte
  an_mapping.json   # correspondance scrutin Sénat → scrutin Assemblée (vérifiée)
  fetch_an.py       # télécharge les dumps officiels AN (scrutins + organes)
  match_an.py       # aide au rapprochement automatique des textes (curation)
  parse_sessions.py # liste des scrutins des sessions sénatoriales (senat.fr)
  build_data.py     # parsing, validation, génération de data.js
  smoke_test.js     # rendu de toutes les routes (DOM simulé, Node)
vercel.json         # déploiement statique (outputDirectory: site)
```

## Utilisation

Ouvrir `site/index.html` (fonctionne en `file://`) ou servir le dossier :

```bash
cd site && python3 -m http.server 8000
```

## Régénérer les données

```bash
python3 pipeline/fetch_an.py          # dumps officiels AN (une fois)
python3 pipeline/parse_sessions.py   # (optionnel) liste des scrutins Sénat
python3 pipeline/build_data.py       # parse, valide et écrit site/data.js
node pipeline/smoke_test.js          # vérifie le rendu de toutes les routes
```

`build_data.py` **bloque la publication** en cas d'incohérence : somme des groupes ≠ totaux (Sénat ou Assemblée),
effectifs incohérents, résultat différent de la liste officielle, résumé manquant, etc.

## Sources

- Scrutins du Sénat : https://www.senat.fr/scrutin-public/scr2025.html (Licence Ouverte 2.0 / Etalab)
- Scrutins de l'Assemblée nationale : https://data.assemblee-nationale.fr/travaux-parlementaires/votes (Licence Ouverte 2.0)
- Baromètres de préoccupations : Elabe (août 2026) et Ipsos (juillet 2026), cités sur les pages sujets.

Période couverte : octobre 2023 → juillet 2026.

## Indépendance

Projet citoyen indépendant, sans affiliation avec le Sénat, l'Assemblée nationale ou un parti politique.
Aucun cookie, aucun traceur, aucune donnée personnelle.
