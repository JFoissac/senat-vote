---
titre: Promotion de Sénat·Vote
projet: senat-vote
derniere_maj: 2026-10-08
---

# Promotion de Sénat·Vote

Le site est techniquement prêt à être trouvé : 1 311 pages indexables, sitemap,
aperçu social. Reste à le faire **connaître** — et sur un sujet politique, la
crédibilité se gagne par la neutralité, pas par le volume.

## 1. Le principe : la neutralité est l'argument

Le site ne note pas les partis, ne classe rien, ne recommande aucun vote. C'est
rare et c'est ce qui le rend citable **par tous les camps**. Toute communication
doit s'y tenir : jamais « le groupe X est contre les salariés », toujours « le
groupe X a voté contre sur 12 des 14 scrutins de ce sujet ». Les chiffres sont
vérifiables, les interprétations non.

## 2. Ce qui manque avant de communiquer

1. **Des données fraîches.** Les données s'arrêtent au **21 juillet 2026** (session
   2023-2026). Relancer le pipeline avant une campagne : un site d'actualité
   parlementaire qui s'arrête trois mois plus tôt perd l'essentiel de son intérêt.
2. **Une mesure d'audience.** Sans analytics, impossible de savoir ce qui marche.
   Vercel Analytics (gratuit, sans cookie, sans bannière) s'active en une ligne.
3. **Un nom de domaine propre.** `senat-vote.vercel.app` fait « projet de
   développeur ». Un `.fr` ou `.org` (par ex. `senat-vote.fr`, encore libre)
   inspire davantage confiance à un journaliste et se retient mieux à l'oral.

## 3. Où communiquer, par ordre de rendement

### Reddit — r/france (1,4 M membres), r/politique, r/actualiteFR

Le levier le plus rapide, à condition de **ne pas poster un lien nu**. La règle
d'or : publier un **constat chiffré**, l'outil n'étant que la source.

- Angle qui fonctionne : *« Sur les 165 scrutins du Sénat liés à la santé, voici
  comment chaque groupe a voté »* — un tableau, une phrase d'explication, le lien
  en fin de message.
- Angle qui se fait supprimer : *« J'ai fait un site qui montre comment vote le
  Sénat, venez voir »*.
- Poster en semaine, entre 8 h et 10 h (heure française), et **répondre à tous les
  commentaires** : les premières heures décident de la visibilité.

### Hacker News — « Show HN »

Audience technique, très réceptive aux projets de données publiques bien faits.
Le post doit parler de **la difficulté technique**, pas du sujet politique :
l'appariement des scrutins du Sénat avec les votes de l'Assemblée, les 922 votes
nominatifs, l'absence d'API officielle propre. En anglais, le matin (heure US).

### X / Twitter

Les comptes de données et de journalistes politiques relaient volontiers un
graphique. Publier **une image par constat** (capture du graphique par sujet), en
mentionnant le lien. Les fils de 3-4 tweets marchent mieux qu'un tweet unique.

### LinkedIn

Pour le réseau professionnel et la civic tech : présenter la **démarche** (données
officielles, aucune interprétation) plutôt que le résultat. Bon canal pour toucher
des associations civiques et des enseignants.

### Presse et médias de données

À contacter **avec un constat déjà prêt**, jamais avec « voici mon site » :

- **Les Décodeurs (Le Monde)**, **CheckNews (Libération)**, **France Info**,
  **Contexte**, **Politico** — ils ont des équipes data qui cherchent des outils.
- L'angle gagnant : *« Voici, sujet par sujet, les votes du Sénat — et nous avons
  les données brutes, librement réutilisables »*.

### Écosystème civic tech et open data

- **Regards Citoyens**, **NosDéputés.fr**, **Datan**, **Voxe** : mêmes données,
  publics complémentaires. Un lien croisé vaut mieux qu'une concurrence.
- **data.gouv.fr** : publier le jeu de données consolidé comme réutilisation des
  sources officielles — cela apporte un lien depuis un domaine d'État.
- **Wikipédia** : possible sur les pages de textes de loi, uniquement si le site
  est présenté comme source factuelle (jamais en lien externe promotionnel).

## 4. Angles éditoriaux prêts à l'emploi

Tous se calculent dans les données déjà en place :

1. **« Ce que le Sénat a voté sur la santé »** — 165 scrutins, le sujet le plus
   dense. Le plus fort pour démarrer.
2. **« Quels groupes votent le plus souvent ensemble »** — la page Comparer le
   calcule déjà. Très partagé car contre-intuitif.
3. **« Qui participe le moins »** — la participation par groupe, factuelle et
   facile à vérifier.
4. **« Sénat contre Assemblée »** — les textes où les deux chambres divergent.
5. **« Les amendements rejetés »** — ce que le Sénat refuse, sujet peu couvert
   ailleurs.

## 5. Ce qu'il ne faut pas faire

- **Ne pas publier depuis plusieurs comptes** le même jour : repérable, et cela
  abîme la crédibilité d'un outil qui prétend à la neutralité.
- **Ne pas mettre de lien dans un commentaire** sous un fil populaire : cela se
  voit et se signale.
- **Ne pas répondre aux polémiques politiques.** La réponse type : « le site ne
  prend pas position, voici le scrutin et sa source officielle. »
- **Ne pas promettre d'exhaustivité** : le site couvre la période 2023-2026, et
  le dit.

## 6. Mesurer

- **Google Search Console** (à faire en premier) : soumettre
  `https://senat-vote.vercel.app/sitemap.xml`, puis suivre les requêtes réelles.
  Les premières impressions arrivent en général sous 1 à 3 semaines après
  indexation.
- **Bing Webmaster Tools** : le même sitemap. L'indexation y est plus rapide.
- **IndexNow** : la clé est déjà en place
  (`app/public/1aa0057e2211973eb8253e6361d2d682.txt`) ; la soumission automatique
  des 1 311 URL se fait via `api.indexnow.org`. À relancer une fois la
  vérification du site acceptée.
- **Vercel Analytics** : pour voir les pages réellement consultées, ce que ni
  Search Console ni IndexNow ne disent.

## 7. Ordre d'exécution conseillé

1. Actualiser les données (pipeline) et brancher la mesure d'audience.
2. Soumettre le sitemap à Search Console et à Bing.
3. Publier **un** constat chiffré sur r/france, avec le lien en source.
4. Poster un « Show HN » le lendemain, en anglais, axé technique.
5. Contacter deux ou trois journalistes data avec un constat déjà prêt.
6. Publier le jeu de données consolidé sur data.gouv.fr.
7. Répéter un angle par semaine — la régularité vaut mieux qu'un pic.
