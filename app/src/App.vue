<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "./stores/data.js";
import AppHeader from "./components/AppHeader.vue";
import { frDate } from "./format.js";

const route = useRoute();
const data = useDataStore();
const main = ref(null);
const dataDate = computed(() => (data.generatedAt ? frDate(data.generatedAt.slice(0, 10)) : ""));

const TITLES = {
  home: "les votes par sujet",
  votes: "tous les votes",
  comparer: "comparer deux groupes",
  groupes: "les groupes politiques",
  methode: "méthode et sources",
  notfound: "page introuvable"
};

watch(
  () => route.fullPath,
  () => {
    const name = route.name;
    let title = "Sénat·Vote";
    if (name === "sujet") {
      const theme = data.themeById(route.params.id);
      title += theme ? " — " + theme.name : "";
    } else if (name === "scrutin") {
      const scrutin = data.scrutins[route.params.id];
      title += scrutin ? " — " + scrutin.subject : " — scrutin introuvable";
    } else if (TITLES[name]) {
      title += " — " + TITLES[name];
    }
    document.title = title;
    nextTick(() => {
      if (main.value) main.value.focus({ preventScroll: true });
    });
  },
  { immediate: true }
);
</script>

<template>
  <a class="skip-link" href="#app">Aller au contenu</a>
  <AppHeader />
  <main id="app" ref="main" tabindex="-1">
    <div v-if="data.error" class="wrap">
      <p class="empty">Les données n'ont pas pu être chargées. Vérifiez votre connexion puis rechargez la page.</p>
    </div>
    <RouterView />
  </main>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__cols">
        <div class="footer__col footer__col--brand">
          <p class="footer__title">Sénat·Vote</p>
          <p class="footer__text">Comment le Sénat et l'Assemblée nationale votent sur les sujets qui préoccupent les Français. Un outil citoyen indépendant, sans publicité et sans traceur.</p>
          <p class="footer__text footer__text--small">Interface v2.5 · données du {{ dataDate }}</p>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Le projet</p>
          <RouterLink to="/methode">Méthodologie et sources</RouterLink>
          <RouterLink to="/votes">Tous les votes</RouterLink>
          <RouterLink to="/groupes">Les groupes politiques</RouterLink>
          <RouterLink to="/comparer">Comparer deux groupes</RouterLink>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Données</p>
          <a href="https://www.senat.fr/scrutin-public/scr2025.html" target="_blank" rel="noopener">Scrutins du Sénat (senat.fr)</a>
          <a href="https://data.assemblee-nationale.fr/travaux-parlementaires/votes" target="_blank" rel="noopener">Scrutins de l'Assemblée (open data)</a>
          <a href="https://elabe.fr/rentree-2026/" target="_blank" rel="noopener">Baromètre Elabe (août 2026)</a>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Indépendance</p>
          <p class="footer__text footer__text--small">Aucune affiliation avec le Sénat, l'Assemblée nationale, Elabe, Ipsos ou un parti politique. Licence Ouverte 2.0 (Etalab) pour les données publiques.</p>
        </div>
      </div>
    </div>
  </footer>
</template>
