# Ancienne version (obsolète)

Ce dossier contient l'**ancienne application vanilla** (HTML/CSS/JS, sans dépendance), conservée
uniquement pour référence.

- L'application active se trouve dans [`../app/`](../app) (Vue 3 + Vite + Pinia + vue-router).
- `data.js` et `data.json` sont générés par [`../pipeline/build_data.py`](../pipeline/build_data.py).
- `assets/app.js` et `assets/style.css` ne sont plus maintenus.
- `../pipeline/smoke_test.js` (legacy) sert au rendu de cette ancienne version sous Node.

Ne plus modifier cette version : toute évolution doit se faire dans `app/`.
