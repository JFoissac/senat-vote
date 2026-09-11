<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const active = computed(() => {
  const name = route.name;
  if (name === "home" || name === "sujet") return "home";
  if (name === "groupes") return "groupes";
  if (name === "votes") return "votes";
  if (name === "scrutin") return "votes";
  if (name === "comparer") return "comparer";
  return "";
});
</script>

<template>
  <header class="siteheader">
    <div class="siteheader__inner">
      <RouterLink class="brand" to="/" aria-label="Sénat·Vote, accueil">
        <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="#0E1013" />
          <path
            d="M8 11a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z"
            fill="#F6E7BC"
          />
        </svg>
        <span class="brand__text">Sénat<span class="brand__dot">·</span>Vote</span>
      </RouterLink>
      <nav class="tabs" aria-label="Navigation principale">
        <RouterLink class="tab tab--sujets" :class="{ 'is-active': active === 'home' }" :aria-current="active === 'home' ? 'page' : null" to="/">Sujets</RouterLink>
        <RouterLink class="tab tab--groupes" :class="{ 'is-active': active === 'groupes' }" :aria-current="active === 'groupes' ? 'page' : null" to="/groupes">Groupes</RouterLink>
        <RouterLink class="tab tab--votes" :class="{ 'is-active': active === 'votes' }" :aria-current="active === 'votes' ? 'page' : null" to="/votes">Votes</RouterLink>
        <RouterLink class="tab tab--comparer" :class="{ 'is-active': active === 'comparer' }" :aria-current="active === 'comparer' ? 'page' : null" to="/comparer">Comparer</RouterLink>
      </nav>
      <RouterLink class="btn btn--black siteheader__cta" :aria-current="route.name === 'methode' ? 'page' : null" to="/methode">Méthode</RouterLink>
    </div>
  </header>
</template>
