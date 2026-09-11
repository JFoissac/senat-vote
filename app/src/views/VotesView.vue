<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { byDateDesc, n } from "../format.js";
import VoteCard from "../components/VoteCard.vue";
import Pager from "../components/Pager.vue";

const data = useDataStore();
const prefs = usePrefsStore();
const route = useRoute();

const PAGE_SIZE = 50;

const themes = computed(() => data.themesSorted);
const totalCount = computed(() => data.scrutinsArray.length);

const filtered = computed(() => {
  const v = prefs.votes;
  const sel = Object.keys(v.themes).filter((k) => v.themes[k]);
  return data.scrutinsArray
    .filter((s) => {
      if (sel.length && sel.indexOf(s.theme) === -1) return false;
      if (v.withAn && !s.an) return false;
      if (v.origin && s.origin !== v.origin) return false;
      if (v.group && !s.groups.some((g) => g.key === v.group)) return false;
      if (v.q) {
        const q = v.q.toLowerCase();
        if ((s.title + " " + (s.resume || "") + " " + s.text).toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    })
    .sort(byDateDesc);
});

const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));
const page = computed(() => Math.min(Math.max(1, prefs.votes.page), pages.value));
const slice = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));

function setPage(p) {
  if (p > 0) prefs.votes.page = p;
}

function resetPage() {
  prefs.votes.page = 1;
}

function themeCount(id) {
  return data.scrutinsOfTheme(id).length;
}

function applyRouteQuery() {
  const q = route.query.q;
  if (typeof q === "string") {
    prefs.votes.q = q;
    prefs.votes.page = 1;
  }
}

onMounted(applyRouteQuery);
watch(() => route.query.q, applyRouteQuery);
watch(pages, (p) => {
  if (prefs.votes.page > p) prefs.votes.page = p;
});
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Tous les votes</h1>
      <p class="page-lede">
        {{ n(totalCount) }} scrutins publics du Sénat, avec le résultat et la position des groupes ; votes de l'Assemblée nationale indiqués lorsqu'ils existent. <RouterLink to="/methode">Méthode et sources</RouterLink>.
      </p>
    </div>
    <div class="layout">
      <aside class="filters">
        <h2>Filtres</h2>
        <div class="filters__group">
          <input
            v-model="prefs.votes.q"
            type="search"
            placeholder="Un vote, un texte…"
            aria-label="Rechercher"
            @input="resetPage"
          >
        </div>
        <div class="filters__group">
          <p class="filters__label">Origine du texte</p>
          <select v-model="prefs.votes.origin" aria-label="Origine du texte" @change="resetPage">
            <option value="">Toutes origines</option>
            <option value="Gouvernement">Projets de loi (gouvernement)</option>
            <option value="Parlementaire">Propositions de loi (parlementaire)</option>
            <option value="Autre">Autres</option>
          </select>
        </div>
        <div class="filters__group">
          <p class="filters__label">Sujets</p>
          <label v-for="t in themes" :key="t.id" class="checkline">
            <input v-model="prefs.votes.themes[t.id]" type="checkbox" @change="resetPage">
            <span class="dot" :style="{ background: t.pastel }"></span>{{ t.name }} <small>({{ themeCount(t.id) }})</small>
          </label>
        </div>
        <div class="filters__group">
          <p class="filters__label">Groupe politique</p>
          <select v-model="prefs.votes.group" aria-label="Groupe politique" @change="resetPage">
            <option value="">Tous les groupes (Sénat)</option>
            <option v-for="g in data.senateGroups" :key="g.key" :value="g.key">{{ g.short }} — {{ g.label }}</option>
          </select>
        </div>
        <div class="filters__group">
          <label class="switch">
            <input v-model="prefs.votes.withAn" type="checkbox" @change="resetPage">
            Uniquement les votes avec un vote de l'Assemblée
          </label>
        </div>
      </aside>
      <div id="votelist">
        <p class="result-count" aria-live="polite">{{ n(filtered.length) }} vote{{ filtered.length > 1 ? "s" : "" }}</p>
        <Pager :page="page" :pages="pages" @update:page="setPage" />
        <div v-if="slice.length" class="vlist">
          <VoteCard v-for="s in slice" :key="s.id" :scrutin="s" />
        </div>
        <p v-else class="empty">Aucun vote ne correspond à ces filtres.</p>
        <Pager :page="page" :pages="pages" @update:page="setPage" />
      </div>
    </div>
  </div>
</template>
