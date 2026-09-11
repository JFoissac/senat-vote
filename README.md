# Sénat·Vote — les votes du Sénat et de l'Assemblée, sujet par sujet

Application web statique qui présente **les scrutins publics du Sénat** de la période, regroupés par
**texte** et classés par **sujets de la vie quotidienne**, avec la position de chaque **groupe politique**
et, au niveau du texte, les **votes de l'Assemblée nationale**. La présentation est **strictement factuelle** :
aucune note, aucun classement des partis, aucune recommandation de vote.

## Ce que montre le site

- **12 sujets** : pouvoir d'achat et coût de la vie, santé, école, logement, travail, sécurité et ordre public,
  écologie/climat/énergie, alimentation et agriculture, retraites/solidarité/grand âge, immigration/asile/intégration,
  finances publiques et dette, autres textes votés.
- **Tous les votes publics** de la période (ensemble du texte, articles, amendements, motions), regroupés par texte
  (dossier législatif).
- Pour chaque vote : **ce que change le texte** (résumé factuel), **adopté ou rejeté**, son **origine**
  (projet de loi du gouvernement ou proposition parlementaire), le **vote correspondant de l'Assemblée nationale**
  lorsqu'il existe, et la **répartition des votes par groupe** (pour, contre, abstention, non-votants), avec lien
  vers la source officielle.
- Un graphique « comment le Sénat / l'Assemblée a voté » par sujet, une page **Groupes** (Sénat et Assemblée),
  une page **Comparer** (checklist de sujets, taux d'accord entre deux groupes, participation, part de votes
  pour/contre) et une **superposition Sénat / Assemblée** optionnelle dans chaque fiche (désactivée par défaut).

## Architecture

```
app/                       # Application Vue 3 + Vite + Pinia + vue-router (version active)
  index.html               # Coquille de l'application
  src/
    main.js                # Amorçage (Pinia, router, chargement des données, persistance des préférences)
    router.js              # Routes (history par hash)
    format.js              # Formatage fr-FR (nombres, dates)
    stores/data.js         # Données (chargement de /data.json, index et agrégats)
    stores/prefs.js        # Préférences persistées dans localStorage
    components/            # En-tête, fiches de vote, barres par groupe, graphiques, pagination
    views/                 # Accueil, Sujet, Votes, Comparer, Groupes, Méthode, 404
    assets/style.css       # Thème clair, mobile first, sans dépendance
  public/
    data.json              # Données de production (versionné, généré par le pipeline)
  dist/                    # Build de production (ignoré par git)

site/                      # Ancienne version vanilla (HTML/CSS/JS) — OBSOLÈTE, conservée pour référence
  index.html
  data.js / data.json
  assets/app.js / assets/style.css
  README.md                # Marque le dossier comme obsolète

pipeline/                  # Génération des données (Python)
  config.json              # Sujets, groupes Sénat/Assemblée, correspondances, sources
  resumes.json             # Résumé factuel de chaque texte
  an_mapping.json          # Correspondance scrutin Sénat → scrutin Assemblée (vérifiée)
  fetch_an.py              # Télécharge les dumps officiels de l'Assemblée nationale
  parse_sessions.py        # Liste les scrutins des sessions sénatoriales (senat.fr)
  match_an.py              # Aide au rapprochement automatique des textes (curation)
  build_data.py            # Parse, valide et écrit app/public/data.json + site/data.json
  smoke_test.js            # (legacy) rendu des routes de l'ancienne app vanilla sous Node

opendata/                  # Dumps et caches de sources (re-téléchargeables, non versionnés)
vercel.json                # Configuration de déploiement
README.md
```

> `site/` n'est plus maintenue : elle est conservée à titre d'archive. L'application active est `app/`.

## Prérequis

- **Node.js** ≥ 20 et npm (pour l'application).
- **Python 3** ≥ 3.9 (pour le pipeline, uniquement si vous régénérez les données).
- Chrome/Chromium (uniquement pour lancer les tests QA avec `puppeteer-core`).

## Application (Vue 3 + Vite)

```bash
cd app
npm install        # installe les dépendances
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production dans app/dist
npm run preview    # prévisualise le build de production
```

Le build copie `app/public/data.json` dans `app/dist/data.json` ; l'application le charge au démarrage
depuis `/data.json`.

## Régénérer les données (pipeline)

```bash
python3 pipeline/fetch_an.py          # télécharge les dumps officiels de l'Assemblée nationale (une fois)
python3 pipeline/parse_sessions.py    # (optionnel) reconstruit la liste des scrutins du Sénat
python3 pipeline/build_data.py        # parse, valide et écrit app/public/data.json + site/data.json
node pipeline/smoke_test.js           # (legacy) vérifie le rendu de l'ancienne app vanilla
```

`build_data.py` **bloque la publication** en cas d'incohérence : somme des groupes ≠ totaux officiels
(Sénat ou Assemblée), effectifs incohérents, résultat différent de la source, etc. Il écrit les mêmes
données dans `app/public/data.json` (application active) et `site/data.json` (archive).

## Déploiement (Vercel)

Le déploiement est automatique à chaque push sur GitHub. La configuration racine (`vercel.json`) :

```json
{
  "installCommand": "cd app && npm ci",
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/dist"
}
```

La navigation utilise un **history par hash** (`#/...`) : aucune règle de réécriture serveur n'est nécessaire.

## Sources et licences

- **Scrutins du Sénat** : pages officielles des scrutins publics sur
  [senat.fr](https://www.senat.fr/scrutin-public/scr2025.html) — résultats, décomptes par groupe et par sénateur.
- **Votes de l'Assemblée nationale** : dumps officiels sur
  [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr/travaux-parlementaires/votes)
  (scrutins publics des 16ᵉ et 17ᵉ législatures, organes et groupes).
- **Baromètres de préoccupations** : Elabe (août 2026) et Ipsos, cités sur les pages sujets.

Les données publiques sont réutilisées sous **Licence Ouverte 2.0 (Etalab)**. Toute réutilisation doit
**mentionner la source** (Sénat / Assemblée nationale) et ne pas laisser croire à une affiliation officielle.

Période couverte : **octobre 2023 → juillet 2026**.

## Neutralité

- Le site **ne note pas les textes, ne classe pas les partis et ne recommande aucun vote**.
- Les libellés des sujets sont descriptifs (« Immigration, asile et intégration »), jamais orientés.
- Les graphiques montrent la **répartition des votes** (pour, contre, abstention) sans juger le sens des textes.
- La page **Comparer** mesure un **taux d'accord** (position majoritaire identique), la **participation** et la
  part de votes pour/contre : elle ne désigne ni « meilleur » ni « pire » groupe.
- La page **Méthode** détaille la composition des chambres (par exemple, pas de groupe LFI au Sénat ; les
  sénateurs RN siègent parmi les non-inscrits).

## Vie privée

Le site ne dépose **aucun cookie**, **aucun traceur** et n'envoie **aucune donnée** à un serveur.
Les préférences (filtres, sujet, choix de superposition, comparaison, chambre affichée) sont stockées
**uniquement dans le `localStorage` de l'appareil**, sous la clé `senatvote.prefs.v1`. Vider les données du
site dans le navigateur les efface.

## Limites connues

- **Rattachement automatique des sujets** : les textes sont classés par mots-clés, de façon approximative,
  en particulier pour les textes transversaux. Le titre officiel et le dossier législatif restent la référence.
- **Rapprochement des groupes Sénat / Assemblée** : la correspondance (LR ↔ DR, SER ↔ SOC, RDPI ↔ EPR, …) est
  **indicative** ; les groupes ne sont pas identiques d'une chambre à l'autre.
- **Amendements non votés à l'Assemblée** : pour un amendement ou un article, la barre « Assemblée » correspond
  au **vote de l'Assemblée sur le texte**, pas au vote sur cet amendement.
- Certains textes n'ont **aucun vote public** de l'Assemblée : la comparaison n'est alors pas possible.
- Les **effectifs des groupes varient dans le temps** : les barres sont proportionnelles à l'effectif au jour du vote.

## Indépendance

Projet citoyen indépendant, sans affiliation avec le Sénat, l'Assemblée nationale ou un parti politique,
sans publicité et sans traceur.
