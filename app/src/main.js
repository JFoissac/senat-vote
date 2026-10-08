import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router.js";
import { useDataStore } from "./stores/data.js";
import { usePrefsStore, PREFS_KEY } from "./stores/prefs.js";
import "./assets/style.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Les adresses historiques utilisaient un fragment (#/sujet/x) : on les réécrit vers
// l'URL propre (/sujet/x) avant le montage, pour ne casser aucun lien déjà partagé.
if (window.location.hash.startsWith("#/")) {
  window.history.replaceState(null, "", window.location.hash.slice(1));
}

const data = useDataStore(pinia);
const prefs = usePrefsStore(pinia);

prefs.$subscribe(
  (mutation, state) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(state));
    } catch {
      return;
    }
  },
  { detached: true }
);

data
  .load()
  .finally(() => {
    prefs.ensureSubjects(data.themesSorted.map((t) => t.id));
    app.use(router);
    app.mount("#root");
  });
