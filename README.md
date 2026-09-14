# Sénat·Vote — les votes du Sénat et de l'Assemblée, sujet par sujet

Application web statique qui présente **les scrutins publics du Sénat** de la période, regroupés par
**texte** et classés par **sujets de la vie quotidienne**, avec la position de chaque **groupe politique**
et, au niveau du texte, les **votes de l'Assemblée nationale**. La présentation est **strictement factuelle** :
aucune note, aucun classement des partis, aucune recommandation de vote.

## Ce que montre le site

- **12 sujets** : pouvoir d'achat et coût de la vie, santé, école, logement, travail, sécurité et ordre public,
  écologie/climat/énergie, alimentation et agriculture, retraites/solidarité/grand âge, immigration/asile/intégration,
  finances publiques et dette, autres textes votés.
- **922 scrutins du Sénat** de la période, regroupés par **texte** (dossier législatif) : vote sur l'ensemble du
  texte, articles, amendements et motions de procédure.
- Pour chaque vote : **ce que change le texte** (résumé factuel pour les principaux textes), **adopté ou rejeté**,
  son **origine** (projet de loi du gouvernement ou proposition parlementaire), la **répartition des votes par
  groupe** (pour, contre, abstention, non-votants) et, lorsqu'il existe, le **vote de l'Assemblée nationale sur le
  même texte** (au niveau du texte).
- Des **votes nominatifs par groupe** (listes de sénateurs par position) pour chaque scrutin.
- Un graphique « comment le Sénat / l'Assemblée a voté » par sujet, une page **Groupes** (Sénat et Assemblée),
  une page **Comparer** (checklist de sujets, taux d'accord entre deux groupes, participation, part de votes
  pour/contre) et une **superposition Sénat / Assemblée** optionnelle dans chaque fiche (désactivée par défaut).
- Les pages **Sujet**, **Votes**, **Comparer**, **Groupes**, **Scrutin**, **Sénateur** et **Méthode**.

## Architecture

```
app/                       # Application Vue 3 + Vite + Pinia + vue-router (version active)
  index.html               # Coquille de l'application
  src/
    main.js                # Amorçage (Pinia, router, chargement des données, persistance des préférences)
    App.vue                # Gabarit global (en-tête, pied de page)
    router.js              # Routes (history par hash)
    format.js              # Formatage fr-FR (nombres, dates)
    data/departments.js    # Table des départements
    stores/data.js         # Données (chargement de /data.json, index et agrégats)
    stores/prefs.js        # Préférences persistées dans localStorage
    components/            # En-tête, fiches de vote, barres par groupe, graphiques, pagination
    views/                 # Accueil, Sujet, Votes, Comparer, Groupes, Scrutin, Méthode, 404
    assets/style.css       # Thème clair, mobile first, sans dépendance
  public/
    data.json              # Données de production (versionné, généré par le pipeline)
    votes/                 # Votes nominatifs par scrutin (versionné, généré par le pipeline)
  dist/                    # Build de production (ignoré par git)

pipeline/                  # Génération des données (Python)
  config.json              # Sujets, groupes Sénat/Assemblée, correspondances, sources
  resumes.json             # Résumé factuel de chaque texte
  text_summaries.json      # Synthèses de textes
  an_mapping.json          # Correspondance scrutin Sénat → scrutin Assemblée (vérifiée)
  fetch_an.py              # Télécharge les dumps officiels de l'Assemblée nationale
  parse_sessions.py        # Liste les scrutins des sessions sénatoriales (senat.fr)
  match_an.py              # Aide au rapprochement automatique des textes (curation)
  build_data.py            # Parse, valide et écrit app/public/data.json
  build_individual.py      # Écrit les votes nominatifs dans app/public/votes/
  build_senators_map.py    # Construit l'annuaire (photos, pages officielles) dans app/public/data.json

opendata/                  # Dumps et caches de sources (re-téléchargeables, non versionnés)
vercel.json                # Configuration de déploiement
README.md
```

Le store `prefs` (Pinia) persiste les préférences de l'utilisateur (filtres, sujet, comparaison, chambre
affichée, superposition) **uniquement dans le `localStorage`**.

## Prérequis

- **Node.js** ≥ 20 et npm (pour l'application).
- **Python 3** ≥ 3.9 (pour le pipeline, uniquement si vous régénérez les données).

## Application (Vue 3 + Vite)

```bash
cd app
npm install        # installe les dépendances
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production dans app/dist
npm run preview    # prévisualise le build de production
```

### Qualité

```bash
cd app
npm run lint           # analyse statique (ESLint)
npm run test           # tests unitaires
npm run test:coverage  # tests avec couverture
npm run format         # formatage automatique
```

La **CI GitHub Actions** (`.github/workflows/ci.yml`) lance **lint + tests + build** à chaque push et
chaque pull request.

Le build copie `app/public/data.json` (et `app/public/votes/`) dans `app/dist/` ; l'application charge
`/data.json` au démarrage.

## Régénérer les données (pipeline)

À exécuter dans cet ordre (depuis la racine du dépôt) :

```bash
python3 pipeline/fetch_an.py           # (une fois) télécharge les dumps officiels de l'Assemblée nationale
python3 pipeline/parse_sessions.py     # reconstruit la liste des scrutins du Sénat
python3 pipeline/build_data.py         # parse, valide et écrit app/public/data.json
python3 pipeline/build_individual.py   # écrit les votes nominatifs dans app/public/votes/
python3 pipeline/build_senator_profiles.py # profils de vote par sénateur dans app/public/senateurs/
python3 pipeline/build_senators_map.py # annuaire des sénateurs (photos, pages officielles) dans app/public/data.json
```

`build_data.py` **bloque la publication** en cas d'incohérence : somme des groupes ≠ totaux officiels
(Sénat ou Assemblée), effectifs incohérents, résultat différent de la source, etc. Il écrit uniquement
`app/public/data.json` (forme minifiée).

## Déploiement (Vercel)

**En ligne : <https://senat-vote.vercel.app/#/>** — le site est redéployé automatiquement à chaque push sur `main`.

Configuration du projet Vercel (deux options équivalentes) :

- **Root Directory vide** : la configuration racine (`vercel.json`) construit `app/dist` ;
- **Root Directory** réglé sur `app` : Vercel utilise directement les scripts de `app/package.json`.

```json
{
  "installCommand": "cd app && npm ci",
  "buildCommand": "cd app && npm run build",
  "outputDirectory": "app/dist"
}
```

Le site peut aussi être servi par **tout hébergeur statique** à partir du contenu de `app/dist`.
La navigation utilise un **history par hash** (`#/...`) : aucune règle de réécriture serveur n'est nécessaire.

## Sources et licences

- **Scrutins du Sénat** : pages officielles des scrutins publics sur
  [senat.fr](https://www.senat.fr/scrutin-public/scr2025.html) — résultats, décomptes par groupe et par sénateur,
  ainsi que l'API officielle des sénateurs (photos, pages officielles).
- **Votes de l'Assemblée nationale** : dumps officiels sur
  [data.assemblee-nationale.fr](https://data.assemblee-nationale.fr/travaux-parlementaires/votes)
  (scrutins publics des 16ᵉ et 17ᵉ législatures, organes et groupes).
- **Baromètres de préoccupations** : Ipsos et Elabe, cités sur les pages sujets.

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
Les préférences sont stockées **uniquement dans le `localStorage` de l'appareil** (clé `senatvote.prefs.v1`).
Vider les données du site dans le navigateur les efface.

## Limites connues

- **Rattachement automatique des sujets** : les textes sont classés par mots-clés, de façon approximative,
  en particulier pour les textes transversaux. Le titre officiel et le dossier législatif restent la référence.
- **Votes de l'Assemblée au niveau du texte** : les amendements ne sont pas votés dans les deux chambres ; pour
  un amendement ou un article, la barre « Assemblée » correspond au **vote de l'Assemblée sur le texte**, pas au
  vote sur cet amendement.
- **Résumés partiels** : les résumés factuels ne sont disponibles que pour les **principaux textes**.
- **Rapprochement des groupes Sénat / Assemblée** : la correspondance (LR ↔ DR, SER ↔ SOC, RDPI ↔ EPR, …) est
  **indicative** ; les groupes ne sont pas identiques d'une chambre à l'autre.
- Certains textes n'ont **aucun vote public** de l'Assemblée : la comparaison n'est alors pas possible.
- Les **effectifs des groupes varient dans le temps** : les barres sont proportionnelles à l'effectif au jour du vote.

## Version et volume de données

- **Version d'interface : v2.5** (affichée dans le pied de page).
- `app/public/data.json` ≈ **2 Mo** ; `app/public/votes/` ≈ **7 Mo** (tous deux versionnés).

## Indépendance

Projet citoyen indépendant, sans affiliation avec le Sénat, l'Assemblée nationale ou un parti politique,
sans publicité et sans traceur.
