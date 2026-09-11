<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { n } from "../format.js";
import { filterScrutins, sortScrutins } from "../lib/votes.js";
import VoteCard from "../components/VoteCard.vue";
import Pager from "../components/Pager.vue";

const data = useDataStore();
const prefs = usePrefsStore();
const route = useRoute();

const PAGE_SIZE = 50;
const filtersOpen = ref(false);

const themes = computed(() => data.themesSorted);
const totalCount = computed(() => data.scrutinsArray.length);

const themeRank = computed(() => {
  const map = {};
  data.themesSorted.forEach((t, i) => {
    map[t.id] = i;
  });
  return map;
});

const SORTS = [
  { value: "recents", label: "Plus récents d'abord" },
  { value: "anciens", label: "Plus anciens d'abord" },
  { value: "pour", label: "Plus de votes « pour »" },
  { value: "contre", label: "Plus de votes « contre »" },
  { value: "votants", label: "Plus de votants" },
  { value: "sujet", label: "Par sujet" },
];

const filtered = computed(() =>
  sortScrutins(filterScrutins(data.scrutinsArray, prefs.votes), prefs.votes.sort, themeRank.value),
);

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
        {{ n(totalCount) }} scrutins publics du Sénat, avec le résultat et la position des groupes ; votes de
        l'Assemblée nationale indiqués lorsqu'ils existent. <RouterLink to="/methode">Méthode et sources</RouterLink>.
      </p>
    </div>
    <div class="layout">
      <aside class="filters" :class="{ 'is-open': filtersOpen }">
        <div class="filters__head">
          <h2>Filtres</h2>
          <button
            class="filters__toggle"
            type="button"
            :aria-expanded="filtersOpen"
            aria-controls="votes-filters"
            @click="filtersOpen = !filtersOpen"
          >
            {{ filtersOpen ? "Masquer" : "Afficher" }}<span class="filters__chev" aria-hidden="true">▾</span>
          </button>
        </div>
        <div id="votes-filters" class="filters__body">
          <div class="filters__group">
            <input
              v-model="prefs.votes.q"
              type="search"
              placeholder="Un vote, un texte…"
              aria-label="Rechercher"
              @input="resetPage"
            />
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
              <input v-model="prefs.votes.themes[t.id]" type="checkbox" @change="resetPage" />
              <span class="dot" :style="{ background: t.pastel }"></span>{{ t.name }}
              <small>({{ themeCount(t.id) }})</small>
            </label>
          </div>
          <div class="filters__group">
            <p class="filters__label">Position d'un groupe</p>
            <select v-model="prefs.votes.group" aria-label="Groupe politique" @change="resetPage">
              <option value="">Tous les groupes (Sénat)</option>
              <option v-for="g in data.senateGroups" :key="g.key" :value="g.key">{{ g.short }} — {{ g.label }}</option>
            </select>
            <select
              v-model="prefs.votes.position"
              aria-label="Position majoritaire du groupe"
              :disabled="!prefs.votes.group"
              style="margin-top: 8px"
              @change="resetPage"
            >
              <option value="">Toutes les positions</option>
              <option value="pour">A voté majoritairement pour</option>
              <option value="contre">A voté majoritairement contre</option>
              <option value="abs">S'est majoritairement abstenu</option>
            </select>
            <p class="note" style="margin: 6px 0 0">
              Chaque scrutin liste les 9 groupes du Sénat. Choisissez un groupe, puis la position majoritaire (pour,
              contre, abstention) pour ne garder que les scrutins correspondants.
            </p>
          </div>
          <div class="filters__group">
            <label class="switch">
              <input v-model="prefs.votes.withAn" type="checkbox" @change="resetPage" />
              Uniquement les votes avec un vote de l'Assemblée
            </label>
          </div>
        </div>
      </aside>
      <div id="votelist">
        <div class="listbar">
          <p class="result-count" aria-live="polite">
            {{ n(filtered.length) }} vote{{ filtered.length > 1 ? "s" : "" }}
          </p>
          <label class="listbar__sort">
            <span>Trier</span>
            <select v-model="prefs.votes.sort" aria-label="Trier les votes" @change="resetPage">
              <option v-for="o in SORTS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
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
