<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { frDateShort, n } from "../format.js";
import { initials } from "../lib/names.js";
import { regionOfDept } from "../data/departments.js";
import { filterSenatorVotes, positionClass, positionLabel, senatorStats } from "../lib/senators.js";

const route = useRoute();
const data = useDataStore();

const senator = computed(() => (data.ready ? data.senatorBySlug(route.params.slug) : null));
const group = computed(() => (senator.value ? data.groupMeta(senator.value.group || senator.value.groupLabel) : null));
const region = computed(() => (senator.value ? regionOfDept(senator.value.dept) : ""));
const photoFailed = ref(false);

const profile = ref(null);
const loading = ref(false);
const error = ref("");
const ecartsOnly = ref(false);
const position = ref("");
const visible = ref(40);

const organs = computed(() => {
  if (!senator.value || !senator.value.organs) return [];
  return senator.value.organs.filter((o) => o.label);
});

const stats = computed(() => (profile.value ? senatorStats(profile.value.votes) : null));
const rows = computed(() => {
  if (!profile.value) return [];
  return filterSenatorVotes(profile.value.votes, data.scrutins, { ecartsOnly: ecartsOnly.value, position: position.value });
});
const shown = computed(() => rows.value.slice(0, visible.value));

async function load() {
  profile.value = null;
  error.value = "";
  const s = senator.value;
  if (!s || !s.slug) return;
  loading.value = true;
  try {
    const res = await fetch(import.meta.env.BASE_URL + "senateurs/" + s.slug + ".json");
    if (!res.ok) throw new Error("profil indisponible");
    profile.value = await res.json();
  } catch {
    error.value = "Le détail des votes de ce sénateur n'est pas disponible.";
  } finally {
    loading.value = false;
  }
}

watch(() => [route.params.slug, data.ready], load, { immediate: true });
watch([ecartsOnly, position], () => {
  visible.value = 40;
});

function posOf(v) {
  return data.scrutins[v.i] || null;
}
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <nav class="crumbs" aria-label="Fil d'Ariane">
        <RouterLink to="/groupes">Groupes</RouterLink> <span>›</span> <span>{{ senator ? senator.name : "Sénateur" }}</span>
      </nav>
    </div>

    <div v-if="!senator" class="page-head">
      <h1 class="page-title">Sénateur introuvable</h1>
      <p class="page-lede">Cette fiche n'existe pas. <RouterLink to="/groupes">Revenir aux groupes</RouterLink>.</p>
    </div>

    <template v-else>
      <section class="sen-head">
        <img
          v-if="senator.photo && !photoFailed"
          class="sen-head__photo"
          :src="senator.photo"
          :alt="'Photo de ' + senator.name"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="photoFailed = true"
        >
        <span v-else class="sen-head__avatar" :style="{ background: group ? group.color : '#999' }">{{ initials(senator.name) }}</span>

        <div class="sen-head__main">
          <h1 class="sen-head__name">{{ senator.name }}</h1>
          <div class="chips">
            <span class="chip chip--group" :style="{ '--c': group ? group.color : '#999' }">
              <i class="cmp-dot" :style="{ background: group ? group.color : '#999' }"></i>{{ group ? group.short : senator.group }}
            </span>
            <span v-if="senator.department" class="chip">{{ senator.department }}<template v-if="region"> · {{ region }}</template></span>
            <span v-if="!senator.active" class="chip">Ancien sénateur</span>
          </div>
          <p v-if="senator.profession" class="sen-head__job">{{ senator.profession }}</p>
          <p class="sen-head__links">
            <a v-if="senator.page" :href="senator.page" target="_blank" rel="noopener">Fiche officielle sur senat.fr ↗</a>
            <a v-if="senator.twitter" :href="'https://twitter.com/' + senator.twitter" target="_blank" rel="noopener">Twitter ↗</a>
            <a v-if="senator.facebook" :href="'https://www.facebook.com/' + senator.facebook" target="_blank" rel="noopener">Facebook ↗</a>
          </p>
        </div>
      </section>

      <section class="section">
        <div class="sen-facts">
          <div><p class="about__label">Circonscription</p><p class="sen-fact">{{ senator.department || "—" }}<template v-if="region"> ({{ region }})</template></p></div>
          <div><p class="about__label">Groupe politique</p><p class="sen-fact">{{ senator.groupLabel || senator.group || "—" }}</p></div>
          <div><p class="about__label">Profession</p><p class="sen-fact">{{ senator.profession || "—" }}</p></div>
          <div><p class="about__label">Série de renouvellement</p><p class="sen-fact">{{ senator.serie ? "Série " + senator.serie : "—" }}</p></div>
          <div><p class="about__label">Siège</p><p class="sen-fact">{{ senator.siege !== "" && senator.siege != null ? "n° " + senator.siege : "—" }}</p></div>
          <div><p class="about__label">Mandat</p><p class="sen-fact">{{ senator.active ? "En exercice" : "Ancien" }}</p></div>
        </div>
      </section>

      <section v-if="organs.length" class="section">
        <div class="section-head"><h2>Commissions, délégations et missions</h2></div>
        <ul class="sen-organs">
          <li v-for="(o, i) in organs" :key="i">
            <span class="sen-organ-type">{{ o.type === "COMMISSION" ? "Commission" : o.type === "TEMPORAIRE" ? "Commission temporaire" : o.type === "DELEGATION/OFFICE" ? "Délégation / office" : "Organisme" }}</span>
            {{ o.label }}
          </li>
        </ul>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Les votes</h2>
          <p class="note">Positions nominatives issues des comptes rendus officiels du Sénat.</p>
        </div>

        <p v-if="loading" class="note">Chargement des votes…</p>
        <p v-else-if="error" class="note">{{ error }}</p>

        <template v-else-if="stats">
          <div class="sen-stats">
            <div><b>{{ n(stats.n) }}</b><span>votes</span></div>
            <div><b class="s-p">{{ n(stats.p) }}</b><span>pour</span></div>
            <div><b class="s-c">{{ n(stats.c) }}</b><span>contre</span></div>
            <div><b>{{ n(stats.a) }}</b><span>abstentions</span></div>
            <div><b>{{ n(stats.nv) }}</b><span>non-votants</span></div>
            <div><b>{{ n(stats.ecarts) }}</b><span>écarts au groupe</span></div>
          </div>

          <div class="sen-filters">
            <label class="switch">
              <input v-model="ecartsOnly" type="checkbox">
              <span>Voir uniquement les écarts avec son groupe</span>
            </label>
            <select v-model="position" aria-label="Filtrer par position">
              <option value="">Toutes les positions</option>
              <option value="P">Pour</option>
              <option value="C">Contre</option>
              <option value="A">Abstention</option>
              <option value="N">Non-votant</option>
            </select>
          </div>

          <p class="note" aria-live="polite">{{ n(rows.length) }} vote{{ rows.length > 1 ? "s" : "" }}</p>

          <ol class="sen-votes">
            <li v-for="v in shown" :key="v.i + v.p">
              <template v-if="posOf(v)">
                <RouterLink class="sen-vote__title" :to="'/scrutin/' + v.i">
                  <span class="sen-vote__subject">{{ posOf(v).subject }}</span>
                  <span class="sen-vote__text">{{ posOf(v).text }}</span>
                </RouterLink>
                <span class="sen-vote__date">{{ frDateShort(posOf(v).date) }}</span>
                <span class="b pos" :class="positionClass(v.p)">{{ positionLabel(v.p) }}</span>
                <span v-if="!v.a && v.p !== 'N'" class="b b--ecart" title="Position différente de celle de la majorité de son groupe">Écart</span>
              </template>
            </li>
          </ol>

          <p v-if="visible < rows.length" class="sen-more">
            <button class="btn btn--small" type="button" @click="visible += 40">Afficher plus de votes</button>
          </p>
          <p v-else-if="!rows.length" class="empty">Aucun vote ne correspond à ce filtre.</p>
        </template>
      </section>
    </template>
  </div>
</template>
