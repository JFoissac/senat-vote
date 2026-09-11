<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { byDateDesc, frDate, n } from "../format.js";
import Icon from "../components/Icon.vue";
import VoteCard from "../components/VoteCard.vue";

const data = useDataStore();
const router = useRouter();
const query = ref("");

const all = computed(() => data.scrutinsArray);
const anCount = computed(() => all.value.filter((s) => s.an).length);
const latest = computed(() => all.value.slice().sort(byDateDesc).slice(0, 5));
const mainThemes = computed(() =>
  data.mainThemes.map((t) => {
    const sc = data.scrutinsOfTheme(t.id);
    return { ...t, scrutinCount: sc.length, anCount: sc.filter((s) => s.an).length };
  })
);
const updatedLabel = computed(() =>
  data.raw ? frDate(data.raw.generatedAt.slice(0, 10)) : ""
);

function search() {
  const q = query.value.trim();
  router.push({ name: "votes", query: q ? { q } : {} });
}
</script>

<template>
  <div class="home">
    <div class="home__left">
      <span class="home__kicker">Observatoire citoyen · Sénat &amp; Assemblée</span>
      <h1 class="home__title">Tous les votes du Sénat, sujet par sujet</h1>
      <p class="home__lede">
        Les {{ n(all.length) }} scrutins publics de la période, classés par sujets de la vie quotidienne :
        ce que change chaque texte, le résultat, et la position de chaque groupe politique.
      </p>
      <form class="home__search" @submit.prevent="search">
        <input
          v-model="query"
          type="search"
          placeholder="Un sujet, un vote, un texte…"
          aria-label="Rechercher un vote"
        >
        <button class="btn btn--black" type="submit">Rechercher</button>
      </form>
      <RouterLink class="home__card" to="/votes">
        <strong>Parcourir tous les votes, texte par texte</strong>
        <span>Voir les scrutins →</span>
      </RouterLink>
    </div>

    <div class="home__right">
      <div class="section-head">
        <h2>Les sujets</h2>
        <p class="note">{{ mainThemes.length }} sujets de la vie quotidienne</p>
      </div>
      <RouterLink
        v-for="t in mainThemes"
        :key="t.id"
        class="sujet"
        :to="'/sujet/' + encodeURIComponent(t.id)"
      >
        <span class="sujet__icon" :style="{ background: t.pastel }"><Icon :name="t.icon" /></span>
        <span>
          <span class="sujet__name">{{ t.name }}</span>
          <span class="sujet__meta">{{ t.scrutinCount }} scrutin{{ t.scrutinCount > 1 ? "s" : "" }} · {{ t.anCount }} vote{{ t.anCount > 1 ? "s" : "" }} de l'Assemblée</span>
        </span>
        <span class="sujet__arrow">→</span>
      </RouterLink>
      <p style="margin-top: 16px"><RouterLink class="btn btn--black" to="/votes">Voir tous les votes</RouterLink></p>
    </div>
  </div>

  <div class="wrap">
    <div class="stats">
      <span class="stat"><b>{{ n(all.length) }}</b> scrutins analysés</span>
      <span class="stat"><b>{{ n(anCount) }}</b> croisés avec l'Assemblée nationale</span>
      <span class="stat"><b>{{ n(data.senatorCount) }}</b> sénateurs · <b>{{ n(data.deputeCount) }}</b> députés</span>
      <span class="stat">Mis à jour le <b>{{ updatedLabel }}</b></span>
    </div>
    <section class="section">
      <div class="section-head">
        <h2>Derniers votes</h2>
        <p class="note"><RouterLink to="/votes">Tous les votes</RouterLink></p>
      </div>
      <div class="vlist">
        <VoteCard v-for="s in latest" :key="s.id" :scrutin="s" />
      </div>
    </section>
  </div>
</template>
