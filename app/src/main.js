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
