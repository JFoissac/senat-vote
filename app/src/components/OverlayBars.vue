<script setup>
import { computed } from "vue";

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
  const rows = [];
  const unmatchedSenate = [];
  props.senateGroups
    .slice()
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .forEach((sg) => {
      const anKey = props.mapping[sg.key];
      const ag = anKey ? anByKey[anKey] || null : null;
      if (ag) {
        matchedAn.add(anKey);
        rows.push({ sg, ag });
      } else {
        unmatchedSenate.push(sg);
      }
    });
  const unmatchedAn = props.anGroups
    .filter((g) => !matchedAn.has(g.key))
    .sort((a, b) => (b.size || 0) - (a.size || 0));
  return { rows, unmatchedSenate, unmatchedAn };
});

function wSize(g, value) {
  return g.size ? (100 * value) / g.size : 0;
}
function emis(g) {
  return g.pour + g.contre + g.abstention;
}
function pourPct(g) {
  const e = emis(g);
  return e ? Math.round((100 * g.pour) / e) : null;
}
function label(chamber, name, g) {
  return (
    chamber + " · " + name + " : " + g.pour + " pour, " + g.contre + " contre, " + g.abstention + " abstentions, " + g.nonVotants + " non-votants (effectif " + g.size + ")"
  );
}
</script>

<template>
  <div class="ovg2" role="group" aria-label="Superposition des votes du Sénat et de l'Assemblée nationale, groupe par groupe">
    <div class="ovg2__legend">
      <span><i class="ovg2__sw ovg2__sw--pour"></i>pour</span>
      <span><i class="ovg2__sw ovg2__sw--contre"></i>contre</span>
      <span><i class="ovg2__sw ovg2__sw--abs"></i>abstention</span>
      <span><i class="ovg2__sw ovg2__sw--nv"></i>non-votants</span>
      <span class="ovg2__sep" aria-hidden="true"></span>
      <span>Sénat : barre = répartition du groupe (non-votants inclus) · Assemblée : <b>% de votes « pour »</b> sur les votes émis</span>
    </div>

    <div class="ovg2__head" aria-hidden="true"><span>Groupe</span><span>Sénat</span><span>Assemblée · % pour</span></div>

    <div v-for="row in paired.rows" :key="row.sg.key" class="ovg2__row">
      <div class="ovg2__group">
        <span class="ovg2__dot" :style="{ background: row.sg.color }"></span>
        <span class="ovg2__gname">{{ row.sg.short }} <small>≈ {{ row.ag.short }}</small></span>
      </div>
      <div class="ovg2__cell" data-ch="Sénat">
        <div class="ovg2__stack" role="img" :aria-label="label('Sénat', row.sg.short, row.sg)" :title="label('Sénat', row.sg.short, row.sg)">
          <span v-if="row.sg.pour" class="ovg2__seg ovg2__seg--pour" :style="{ width: wSize(row.sg, row.sg.pour) + '%' }"></span>
          <span v-if="row.sg.contre" class="ovg2__seg ovg2__seg--contre" :style="{ width: wSize(row.sg, row.sg.contre) + '%' }"></span>
          <span v-if="row.sg.abstention" class="ovg2__seg ovg2__seg--abs" :style="{ width: wSize(row.sg, row.sg.abstention) + '%' }"></span>
          <span v-if="row.sg.nonVotants" class="ovg2__seg ovg2__seg--nv" :style="{ width: wSize(row.sg, row.sg.nonVotants) + '%' }"></span>
        </div>
      </div>
      <div class="ovg2__cell ovg2__cell--num" data-ch="Assemblée">
        <span class="ovg2__pct" :title="label('Assemblée', row.ag.short, row.ag)">{{ pourPct(row.ag) == null ? "—" : pourPct(row.ag) + " %" }}</span>
      </div>
    </div>

    <template v-if="paired.unmatchedSenate.length || paired.unmatchedAn.length">
      <p class="ovg2__extra-title">
        Groupes sans équivalent dans l'autre chambre
        <span class="ovg2__extra-hint">(affichés à part ; pour l'Assemblée, seul le % de « pour » est indiqué)</span>
      </p>
      <div v-for="g in paired.unmatchedSenate" :key="'s-' + g.key" class="ovg2__row ovg2__row--extra">
        <div class="ovg2__group">
          <span class="ovg2__dot" :style="{ background: g.color }"></span>
          <span class="ovg2__gname">Sénat · {{ g.short }}</span>
        </div>
        <div class="ovg2__cell" data-ch="Sénat">
          <div class="ovg2__stack" role="img" :aria-label="label('Sénat', g.short, g)" :title="label('Sénat', g.short, g)">
            <span v-if="g.pour" class="ovg2__seg ovg2__seg--pour" :style="{ width: wSize(g, g.pour) + '%' }"></span>
            <span v-if="g.contre" class="ovg2__seg ovg2__seg--contre" :style="{ width: wSize(g, g.contre) + '%' }"></span>
            <span v-if="g.abstention" class="ovg2__seg ovg2__seg--abs" :style="{ width: wSize(g, g.abstention) + '%' }"></span>
            <span v-if="g.nonVotants" class="ovg2__seg ovg2__seg--nv" :style="{ width: wSize(g, g.nonVotants) + '%' }"></span>
          </div>
        </div>
        <div class="ovg2__cell ovg2__cell--num" data-ch="Assemblée"><span class="ovg2__dash">—</span></div>
      </div>
      <div v-for="g in paired.unmatchedAn" :key="'a-' + g.key" class="ovg2__row ovg2__row--extra">
        <div class="ovg2__group">
          <span class="ovg2__dot" :style="{ background: g.color }"></span>
          <span class="ovg2__gname">Assemblée · {{ g.short }}</span>
        </div>
        <div class="ovg2__cell" data-ch="Sénat"><span class="ovg2__dash">—</span></div>
        <div class="ovg2__cell ovg2__cell--num" data-ch="Assemblée">
          <span class="ovg2__pct" :title="label('Assemblée', g.short, g)">{{ pourPct(g) == null ? "—" : pourPct(g) + " %" }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
