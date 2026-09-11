<script setup>
import { computed } from "vue";
import { n } from "../format.js";

const props = defineProps({
  senateGroups: { type: Array, default: () => [] },
  anGroups: { type: Array, default: () => [] },
  mapping: { type: Object, default: () => ({}) }
});

const paired = computed(() => {
  const anByKey = {};
  props.anGroups.forEach((g) => {
    anByKey[g.key] = g;
  });
  const matchedAn = new Set();
  const sorted = props.senateGroups
    .slice()
    .sort((a, b) => (b.size || 0) - (a.size || 0));
  const rows = [];
  const unmatchedSenate = [];
  sorted.forEach((sg) => {
    const anKey = props.mapping[sg.key];
    const ag = anKey ? anByKey[anKey] || null : null;
    if (ag) {
      matchedAn.add(anKey);
      rows.push({ sg, ag });
    } else {
      unmatchedSenate.push(sg);
    }
  });
  const unmatchedAn = props.anGroups.filter((g) => !matchedAn.has(g.key));
  return { rows, unmatchedSenate, unmatchedAn };
});

function w(g, value) {
  return g.size ? (100 * value) / g.size : 0;
}

function exp(g) {
  return g.pour + g.contre;
}

function expPct(g) {
  const e = exp(g);
  return e ? Math.round((100 * g.pour) / e) : 0;
}

function barLabel(chamber, g) {
  return (
    chamber +
    " " +
    (g.short || g.key) +
    " : " +
    n(g.pour) +
    " pour, " +
    n(g.contre) +
    " contre, " +
    n(g.abstention) +
    " abstentions, " +
    n(g.nonVotants) +
    " non-votants"
  );
}
</script>

<template>
  <div
    class="ovg"
    role="group"
    aria-label="Superposition des votes du Sénat et de l'Assemblée nationale, groupe par groupe"
  >
    <template v-for="row in paired.rows" :key="row.sg.key">
      <span class="ovg__tag">
        <span class="ovg__dot" :style="{ background: row.sg.color }"></span>
        <span class="ovg__ch">Sénat :</span> {{ row.sg.short }}
      </span>
      <div class="ovg__stack" role="img" :aria-label="barLabel('Sénat', row.sg)">
        <span
          v-if="row.sg.pour"
          class="ovg__seg"
          :style="{ width: w(row.sg, row.sg.pour) + '%', background: row.sg.color }"
        ></span>
        <span
          v-if="row.sg.contre"
          class="ovg__seg ovg__seg--contre"
          :style="{ width: w(row.sg, row.sg.contre) + '%' }"
        ></span>
        <span
          v-if="row.sg.abstention"
          class="ovg__seg ovg__seg--abs"
          :style="{ width: w(row.sg, row.sg.abstention) + '%' }"
        ></span>
      </div>
      <div class="ovg__counts">
        <span class="p"><b>{{ n(row.sg.pour) }}</b> P</span>
        <span class="c"><b>{{ n(row.sg.contre) }}</b> C</span>
        <span><b>{{ n(row.sg.abstention) }}</b> A</span>
        <span><b>{{ n(row.sg.nonVotants) }}</b> NV</span>
        <span v-if="exp(row.sg)">{{ expPct(row.sg) }} % P</span>
      </div>

      <span class="ovg__tag ovg__tag--an">
        <span class="ovg__dot" :style="{ background: row.ag.color }"></span>
        <span class="ovg__ch">Assemblée :</span> {{ row.ag.short }}
      </span>
      <div class="ovg__stack" role="img" :aria-label="barLabel('Assemblée', row.ag)">
        <span
          v-if="row.ag.pour"
          class="ovg__seg"
          :style="{ width: w(row.ag, row.ag.pour) + '%', background: row.ag.color }"
        ></span>
        <span
          v-if="row.ag.contre"
          class="ovg__seg ovg__seg--contre"
          :style="{ width: w(row.ag, row.ag.contre) + '%' }"
        ></span>
        <span
          v-if="row.ag.abstention"
          class="ovg__seg ovg__seg--abs"
          :style="{ width: w(row.ag, row.ag.abstention) + '%' }"
        ></span>
      </div>
      <div class="ovg__counts">
        <span class="p"><b>{{ n(row.ag.pour) }}</b> P</span>
        <span class="c"><b>{{ n(row.ag.contre) }}</b> C</span>
        <span><b>{{ n(row.ag.abstention) }}</b> A</span>
        <span><b>{{ n(row.ag.nonVotants) }}</b> NV</span>
        <span v-if="exp(row.ag)">{{ expPct(row.ag) }} % P</span>
      </div>
    </template>
  </div>

  <div v-if="paired.unmatchedSenate.length || paired.unmatchedAn.length" class="ovg__unmatched">
    <p class="note"><b>Groupes sans équivalent dans l'autre chambre</b></p>
    <ul class="note">
      <li v-for="g in paired.unmatchedSenate" :key="'s-' + g.key">
        Sénat · {{ g.short }} ({{ n(g.size) }} sièges) : aucun groupe de l'Assemblée nationale rapproché.
      </li>
      <li v-for="g in paired.unmatchedAn" :key="'a-' + g.key">
        Assemblée · {{ g.short }} ({{ n(g.size) }} sièges) : aucun groupe du Sénat rapproché.
      </li>
    </ul>
  </div>
</template>
