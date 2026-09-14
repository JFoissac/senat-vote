<script setup>
import { computed } from "vue";
import { useDataStore } from "../stores/data.js";
import { n } from "../format.js";

const data = useDataStore();

function slugOf(name) {
  const senator = data.senatorOf(name);
  return senator && senator.slug ? senator.slug : "";
}

const groups = computed(() =>
  data.senateGroups.map((g) => ({
    ...g,
    members: g.members.slice().sort((a, b) => a.name.localeCompare(b.name, "fr"))
  }))
);
const anGroups = computed(() => data.anGroups);
const scrutinsCount = computed(() => data.scrutinsArray.length);
const anGroupCount = computed(() => anGroups.value.length);
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Les groupes politiques</h1>
      <p class="page-lede">Les couleurs de chaque groupe sont utilisées dans tout le site. Effectifs actuels et comportement de vote agrégé.</p>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>Au Sénat</h2>
        <p class="note">{{ n(data.senatorCount) }} sénateurs · {{ groups.length }} groupes</p>
      </div>
      <div class="gcards">
        <section
          v-for="g in groups"
          :key="g.key"
          class="gcard"
          :style="{ '--c': g.color }"
        >
          <div class="gcard__head">
            <div>
              <h2 class="gcard__name">{{ g.short }}</h2>
              <p class="gcard__label">{{ g.label }}</p>
            </div>
            <div class="gcard__seats">{{ n(g.seats) }}<small>sénateurs</small></div>
          </div>
          <div class="gcard__profile">
            <div v-if="g.profile && g.profile.presencePct != null" class="prow">
              <span>Présence aux votes</span>
              <span class="prow__bar"><span class="prow__fill" :style="{ '--f': '#4C6FFF', width: g.profile.presencePct + '%' }"></span></span>
              <b>{{ g.profile.presencePct }} %</b>
            </div>
            <div v-if="g.profile && g.profile.pourPct != null" class="prow">
              <span>Votes pour</span>
              <span class="prow__bar"><span class="prow__fill" :style="{ '--f': '#3BAF7F', width: g.profile.pourPct + '%' }"></span></span>
              <b>{{ g.profile.pourPct }} %</b>
            </div>
            <div v-if="g.profile && g.profile.contrePct != null" class="prow">
              <span>Votes contre</span>
              <span class="prow__bar"><span class="prow__fill" :style="{ '--f': '#E8654F', width: g.profile.contrePct + '%' }"></span></span>
              <b>{{ g.profile.contrePct }} %</b>
            </div>
          </div>
          <p class="note">Sur les {{ n(scrutinsCount) }} scrutins analysés. Présence = suffrages exprimés + abstentions, rapportés aux sièges du groupe au jour de chaque vote.</p>
          <details>
            <summary>Voir les {{ g.members.length }} sénateurs du groupe</summary>
            <ul class="gmembers">
              <li v-for="m in g.members" :key="m.name + m.department">
                <RouterLink v-if="slugOf(m.name)" :to="'/senateur/' + slugOf(m.name)">{{ m.name }}</RouterLink>
                <span v-else>{{ m.name }}</span>
                <span>{{ m.department }}</span>
              </li>
            </ul>
          </details>
        </section>
      </div>
      <p class="note" style="margin-top: 12px">Le Sénat est renouvelé par moitié tous les trois ans, au suffrage indirect. Il n'existe pas de groupe LFI au Sénat (aucun sénateur LFI) : la gauche y est représentée par les groupes SER, CRCE-K et GEST. Le RN compte 4 sénateurs, sous le seuil de 10 requis pour former un groupe : ils siègent comme non-inscrits, regroupés ici sous « NI ».</p>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>À l'Assemblée nationale</h2>
        <p class="note">{{ n(data.deputeCount) }} députés · 17ᵉ législature · {{ anGroupCount }} groupes</p>
      </div>
      <div class="anlist">
        <div v-for="g in anGroups" :key="g.key" class="anrow">
          <span class="anrow__dot" :style="{ background: g.color }"></span>
          <b>{{ g.short }}</b>
          <span>{{ g.label }}</span>
          <span class="seats">{{ n(g.seats) }}</span>
        </div>
      </div>
      <p class="note" style="margin-top: 10px">Les groupes de l'Assemblée sont regroupés par continuité politique d'une législature à l'autre.</p>
    </section>
  </div>
</template>
