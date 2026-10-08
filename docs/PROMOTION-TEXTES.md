---
titre: Textes de promotion prêts à publier — Sénat·Vote
projet: senat-vote
derniere_maj: 2026-10-08
---

# Textes prêts à publier

À copier tels quels, en remplaçant seulement ce qui est entre crochets.
Règle commune : **le constat d'abord, le lien en source à la fin**. Jamais
d'interprétation politique — les chiffres parlent seuls.

---

## Reddit — r/france

> **Sur les 165 scrutins du Sénat liés à la santé, voici comment chaque groupe a voté**
>
> En parcourant les scrutins publics du Sénat (données officielles, 922 votes entre
> octobre 2023 et juillet 2026), j'ai regroupé les votes par sujet de la vie
> quotidienne — santé, logement, école, retraites, immigration… — et compté la
> position de chaque groupe sur chacun.
>
> Quelques constats bruts, sans interprétation :
>
> - La santé est le sujet le plus dense : 165 scrutins, contre 8 pour le pouvoir d'achat.
> - Sur les amendements, les groupes votent bien plus souvent en ordre dispersé que
>   sur les votes finaux : le clivage apparaît surtout sur l'ensemble des textes.
> - Les votes de l'Assemblée nationale sur les mêmes textes sont indiqués quand ils
>   existent (dans une minorité de cas).
>
> Le site ne note pas les groupes et ne classe rien : uniquement des comptages de
> votes publiés, avec le lien vers le scrutin officiel sur senat.fr pour chacun.
>
> Source : https://senat-vote.vercel.app
> Données : scrutins publics du Sénat + données ouvertes de l'Assemblée nationale.

**Après publication** : répondre à chaque commentaire dans l'heure. Si quelqu'un
conteste un chiffre, donner le lien du scrutin officiel — jamais argumenter sur le
fond politique.

---

## Hacker News — Show HN (en anglais, matin heure US)

> **Show HN: Sénat·Vote – 922 French Senate roll-call votes, grouped by topic**
>
> I built a static site that makes the French Senate's public votes readable. The
> official data is published as 922 individual scrutin pages with no clean index,
> and matching them to the corresponding National Assembly votes is not
> straightforward (different identifiers, different legislatures).
>
> What it does: groups each vote by legislative text, classifies texts into 12
> everyday topics, and shows each political group's position — for, against,
> abstention, non-voting. Every vote links back to the official source.
>
> Stack: Vue 3 + Vite, pre-rendered to 1311 static pages so the whole thing is
> crawlable and fast (no server, no database). Data pipeline is Python.
>
> The site takes no editorial position: no ratings, no party ranking, no voting
> recommendation. Just counts from published votes.
>
> https://senat-vote.vercel.app

---

## X / Twitter — fil de 4 tweets

> **1/** Le Sénat a voté 922 fois entre octobre 2023 et juillet 2026. Ces votes sont
> publics, mais illisibles : publiés un par un, sans index par sujet.
> Je les ai regroupés par sujet de la vie quotidienne, et compté la position de
> chaque groupe. 🧵

> **2/** La santé concentre 165 scrutins — de très loin le premier sujet. À l'autre
> bout : le pouvoir d'achat, 8 scrutins seulement.
> [image : graphique par sujet]

> **3/** Sur les votes finaux d'un texte, les groupes votent en bloc. Sur les
> amendements, beaucoup moins : c'est là que se jouent les vraies divisions.
> [image : exemple de répartition]

> **4/** Aucune note, aucun classement des partis, aucune recommandation de vote :
> uniquement des comptages de votes publiés, chacun relié à sa source officielle
> sur senat.fr.
> 👉 https://senat-vote.vercel.app

---

## LinkedIn

> **Rendre les votes du Sénat lisibles**
>
> Les scrutins publics du Sénat sont en open data, mais dans un format qui les rend
> difficiles à appréhender : 922 votes publiés individuellement, sans regroupement
> par sujet ni mise en regard avec les votes de l'Assemblée nationale.
>
> J'ai construit Sénat·Vote pour combler cet écart : les scrutins sont regroupés par
> texte législatif, classés en 12 sujets de la vie quotidienne, et la position de
> chaque groupe politique y est comptée — pour, contre, abstention, non-votants.
>
> Le parti pris est la neutralité stricte : aucune note, aucun classement des
> partis, aucune recommandation de vote. Chaque chiffre renvoie au scrutin officiel.
> C'est, je crois, la seule façon qu'un tel outil soit utilisable par tous.
>
> https://senat-vote.vercel.app

---

## Courriel à un journaliste data (à personnaliser)

> **Objet : Les 922 votes du Sénat, regroupés par sujet — données réutilisables**
>
> Bonjour [prénom],
>
> Je suis [nom]. J'ai construit un outil qui rend lisibles les scrutins publics du
> Sénat : les 922 votes de la période 2023-2026 sont regroupés par texte et classés
> en 12 sujets de la vie quotidienne (santé, logement, retraites, immigration…),
> avec la position de chaque groupe et, quand ils existent, les votes de
> l'Assemblée nationale sur les mêmes textes.
>
> Deux choses peuvent vous servir :
>
> 1. **Le site** : https://senat-vote.vercel.app — aucune interprétation, chaque
>    chiffre renvoie au scrutin officiel sur senat.fr.
> 2. **Les données consolidées**, que je peux vous transmettre en JSON ou CSV, avec
>    l'appariement Sénat/Assemblée déjà fait — c'est la partie la plus laborieuse à
>    reconstituer.
>
> Si un sujet vous intéresse (par exemple les 165 scrutins liés à la santé, ou les
> textes où les deux chambres divergent), je peux vous sortir les chiffres sur
> mesure.
>
> Bien à vous,
> [nom] — [téléphone]

---

## Commentaire à poster sur les fils existants (avec parcimonie)

À utiliser seulement quand quelqu'un demande explicitement où trouver ces données,
jamais pour placer un lien :

> Les scrutins publics sont sur senat.fr (scrutin-public), et l'Assemblée publie ses
> votes en open data sur data.assemblee-nationale.fr. J'ai regroupé l'ensemble par
> sujet ici si ça peut aider : https://senat-vote.vercel.app
