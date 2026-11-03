# UI/UX — 3 novembre 2026

Passage de revue des pages existantes (aucune refonte, aucun changement de ton) après la mise à
jour des données. Captures avant/après aux deux tailles demandées, défauts constatés dans le DOM
et sur les captures, correctifs correspondants.

## État des données au moment de la passe

- **968 scrutins** du Sénat, du **10 octobre 2023** au **3 novembre 2026** (956 avant la mise à jour).
- Dernier scrutin publié par la source : **2026-46, 3 novembre 2026** — « sur l'ensemble du projet
  de loi relatif à la protection des enfants », adopté (260 pour, 1 contre, 80 abstentions).
- **Aucun scrutin publié entre le 30 octobre et le 2 novembre 2026** : la liste officielle de la
  session 2026 passe de la séance du 29 octobre (scrutins 2026-44 et 2026-45) à celle du
  3 novembre (2026-46). Les URL `scr2026-47.html` et `scr2026-48.html` répondent **404**.
- Captures « avant » prises avant l'intégration de 2026-46 (compteur à 967) ; captures « après »
  avec les 968 scrutins. Le delta visible sur les compteurs vient des données, pas de l'interface.

## Méthode de capture

Captures via Chrome (CDP, `Emulation.setDeviceMetricsOverride`) aux tailles exactes
**1440 × 1000** et **390 × 844**, après chargement complet de `data.json` (attente 1,4 s) et
remontée en haut de page. `chrome --headless=new --window-size=390,844` ne convenait pas : la
fenêtre est réduite mais la page est mise en page en 800 px puis rognée, ce qui produit de faux
débordements. Les images sont dans `avant/` et `apres/` :

```
accueil-1440.png   sujet-1440.png   votes-1440.png   scrutin-1440.png
groupes-1440.png   comparer-1440.png senateur-1440.png methode-1440.png
accueil-390.png    sujet-390.png    votes-390.png    scrutin-390.png
groupes-390.png    comparer-390.png senateur-390.png methode-390.png
```

Pages : accueil (`/`), sujet (`/sujet/securite`), votes (`/votes`), scrutin
(`/scrutin/2026-41`), groupes (`/groupes`), comparer (`/comparer`), sénateur
(`/senateur/levasseur_leon21692f`), méthode (`/methode`).

## Défauts constatés → correctifs

| # | Défaut constaté (capture ou DOM) | Correctif | Fichier : ligne |
|---|---|---|---|
| 1 | En-tête mobile : le bouton « Méthode » restait affiché sous 720 px alors que la règle prévoyait de le masquer (`.btn { display: inline-flex }` déclarée après `.siteheader__cta { display: none }` l'emportait). Encombrement du haut de page sur téléphone. | Règle portée à `.btn.siteheader__cta` (masquée par défaut, affichée à partir de 720 px). Accès à la Méthode conservé par le pied de page. | `app/src/assets/style.css` : 114-115, 424 |
| 2 | Cibles tactiles sous 44 px à 390 px : onglets 39 px, marque 36 px, boutons secondaires 34-40 px, bouton « Afficher » des filtres 37 px, segments Sénat/AN 34 px, liens du pied de page 16-20 px. | Hauteur minimale 44 px : onglets, marque, `btn--small`, bascule de filtres, segments, résumés de groupes, liens du pied de page. | `style.css` : 70, 78-83, 576, 727-733, 786 |
| 3 | Barres par groupe : compteurs à 11,2 px (0,7 rem) en gris, barres de 8 px, chiffres non alignés — lisibilité faible, surtout en mobile. | Compteurs à 12,2 px (0,76 rem), chiffres tabulaires, « pour/contre » colorés, abstentions et non-votants distingués, barres de 10 px, colonne de sigle élargie à 74 px. | `style.css` : 300-314 |
| 4 | Badges de vote à 10,9 px sur mobile (0,68 rem), interligne serré. | 11,8 px (0,74 rem), interligne 1,25, padding 4 × 8 px. | `style.css` : 276, 690 |
| 5 | Doublon de libellé : « Ensemble du texte » apparaissait deux fois (sous-titre puis badge de type) sur les cartes et la fiche scrutin. | Le sous-titre n'est affiché que s'il diffère du type de vote. | `app/src/components/VoteCard.vue` : 79 ; `app/src/views/ScrutinView.vue` : 25-29, 179 |
| 6 | Groupe vide : depuis l'ajout du groupe UNT, la fiche scrutin affichait une ligne « UNT » à zéro sur les 923 scrutins antérieurs à sa création. | La liste nominative ne rend que les groupes réellement présents dans le scrutin (vérifié : 9 groupes sur `2023-1`, 10 sur `2026-46`). | `ScrutinView.vue` : 97-99 |
| 7 | Contrastes sous AA : `--faint` #9aa0a6 sur blanc = **2,64:1** (dates, métadonnées) ; étiquettes de % des colonnes empilées blanches sur vert **2,75:1** et sur rouge **3,28:1** ; chiffres colorés sur blanc (RDSE #FFC53D = **1,55:1**) ; pastilles de groupe à texte blanc sur jaune. | `--faint` → #6b7178 (**4,93:1**), `--muted` → #5f646b ; étiquettes de % en encre (**8,6:1** sur vert, **7,0:1** sur rouge) ; helpers `textOnWhite()` / `inkOn()` (assombrissement ou inversion contrôlés, testés). | `style.css` : 11-13, 246 ; `app/src/lib/colors.js` ; `CompareView.vue` : 6, 123-192 ; `GroupesView.vue` : 5, 47 |
| 8 | Filtres : état vide sans issue (« Aucun vote ne correspond à ces filtres. »), aucune action possible. | Message explicite + bouton « Réinitialiser les filtres » (remet recherche, origine, sujets, groupe, position, vote AN ; vérifié : 0 → 50 cartes). | `app/src/views/VotesView.vue` : 54-67, 183-188 |
| 9 | Liste des votes d'un sénateur : intitulés tronqués par `text-overflow: ellipsis` en mobile. | Retour à la ligne autorisé sous 480 px (plus de texte coupé). | `style.css` : 786-788 |
| 10 | Page Méthode : lignes de 78 caractères (> 75). | `.prose` ramené à 68ch — 686 px à 14,4 px, soit ≈ 68 caractères par ligne. | `style.css` : 395 |
| 11 | Pied de page : 4 colonnes dès 720 px (≈ 146 px par colonne), liens trop courts pour le tactile. | 1 colonne, puis 2 colonnes (bloc marque sur toute la largeur) à 720 px, 4 à 1024 px ; liens de 44 px minimum en mobile. | `style.css` : 410-413, 434-436, 447-449, 732 |
| 12 | Titres de fiche trop serrés (interligne 1,08, lettrage -0,6 px). | Interligne 1,14 et lettrage -0,4 px. | `style.css` : 596 |
| 13 | Mentions factuelles devenues fausses : « les 4 sénateurs RN siègent parmi les non-inscrits » et « les neuf groupes du Sénat ». | Textes corrigés : groupe UNT créé en octobre 2026, non-inscrits sans mention de parti, nombre de groupes calculé depuis les données. | `MethodeView.vue` : 169, 238 ; `GroupesView.vue` : 93 ; `VotesView.vue` : 156 |
| 14 | SEO : chaque page prérendue contenait **deux `<title>`** et **deux descriptions** (le remplacement ne visait que la première balise, le `<meta name="viewport">` étant placé avant le titre). | Suppression globale des balises puis injection d'un seul bloc `<head>` avant `</head>` ; contrôlé : 1 titre, 1 description, 1 viewport par page. | `app/scripts/prerender.mjs` : 78, 110-111 |

## Vérifications

- `npm run lint` : aucune erreur.
- `npm test` : **12 fichiers, 68 tests** au vert (dont un nouveau test des helpers de contraste).
- `npm run build` : **1423 pages** prérendues (968 scrutins + 438 sénateurs + sujets et pages fixes),
  `sitemap.xml` (1423 URL), `robots.txt`. Chaque page contrôlée : 1 `<title>`, 1 description,
  1 viewport.
- DOM à 390 px sur les 8 pages : `scrollWidth == clientWidth` (aucun débordement horizontal) ;
  aucun élément interactif de navigation sous 44 px.
- Fiche scrutin : groupes présents uniquement (`2023-1` : 9 groupes, pas d'UNT ; `2026-46` : 10).

## Ce qui n'a pas été fait

- Pas de refonte, pas de changement de ton ni de hiérarchie éditoriale ; aucune note, aucun classement.
- Les captures « avant » datent de 967 scrutins (avant l'intégration du scrutin du 3 novembre) ;
  le delta de compteur est assumé et expliqué ci-dessus.
- Les libellés de groupes proviennent de l'API officielle du Sénat ; aucune couleur de parti n'a été
  changée, seules les variantes de texte (assombries) sont calculées pour le contraste.
