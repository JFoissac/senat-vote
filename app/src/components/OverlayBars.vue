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
  const unmatchedAn = props.anGroups.filter((g) => !matchedAn.has(g.key));
  return { rows, unmatchedSenate, unmatchedAn };
});

function emis(g) {
  return g.pour + g.contre + g.abstention;
}
function w(g, value) {
  const e = emis(g);
  return e ? (100 * value) / e : 0;
}
function pPct(g) {
  const e = emis(g);
  return e ? Math.round((100 * g.pour) / e) : null;
}
function segs(g) {
  return [
    ["pour", g.pour],
    ["contre", g.contre],
    ["abs", g.abstention]
  ].filter((s) => s[1] > 0);
}
function label(chamber, name, g) {
  return (
    chamber + " · " + name + " : " + g.pour + " pour, " + g.contre + " contre, " + g.abstention + " abstentions, " + g.nonVotants + " non-votants"
  );
}
</script>

<template>
  <div class="ovg2" role="group" aria-label="Superposition des votes du Sénat et de l'Assemblée nationale, groupe par groupe">
    <div class="ovg2__legend">
      <span><i class="ovg2__sw ovg2__sw--pour"></i>pour</span>
      <span><i class="ovg2__sw ovg2__sw--contre"></i>contre</span>
      <span><i class="ovg2__sw ovg2__sw--abs"></i>abstention</span>
      <span class="ovg2__sep" aria-hidden="true"></span>
      <span><i class="ovg2__sw ovg2__sw--senat"></i>Sénat (aplat)</span>
      <span><i class="ovg2__sw ovg2__sw--an"></i>Assemblée (hachures)</span>
      <span>· % = part de votes « pour » sur les votes émis</span>
    </div>

    <div class="ovg2__head" aria-hidden="true"><span>Groupe</span><span>Sénat</span><span>Assemblée nationale</span></div>

    <div v-for="row in paired.rows" :key="row.sg.key" class="ovg2__row">
      <div class="ovg2__group">
        <span class="ovg2__dot" :style="{ background: row.sg.color }"></span>
        <span class="ovg2__gname">{{ row.sg.short }} <small>≈ {{ row.ag.short }}</small></span>
      </div>
      <div class="ovg2__cell" data-ch="Sénat">
        <div class="ovg2__stack" role="img" :aria-label="label('Sénat', row.sg.short, row.sg)" :title="label('Sénat', row.sg.short, row.sg)">
          <span v-for="s in segs(row.sg)" :key="s[0]" class="ovg2__seg" :class="'ovg2__seg--' + s[0]" :style="{ width: w(row.sg, s[1]) + '%' }"></span>
        </div>
        <span class="ovg2__pct">{{ pPct(row.sg) == null ? "—" : pPct(row.sg) + " %" }}</span>
      </div>
      <div class="ovg2__cell" data-ch="Assemblée">
        <div class="ovg2__stack ovg2__stack--an" role="img" :aria-label="label('Assemblée', row.ag.short, row.ag)" :title="label('Assemblée', row.ag.short, row.ag)">
          <span v-for="s in segs(row.ag)" :key="s[0]" class="ovg2__seg" :class="'ovg2__seg--' + s[0]" :style="{ width: w(row.ag, s[1]) + '%' }"></span>
        </div>
        <span class="ovg2__pct">{{ pPct(row.ag) == null ? "—" : pPct(row.ag) + " %" }}</span>
      </div>
    </div>

    <div v-if="paired.unmatchedSenate.length || paired.unmatchedAn.length" class="ovg2__unmatched">
      <span class="ovg2__chip-title">Sans équivalent dans l'autre chambre :</span>
      <span v-for="g in paired.unmatchedSenate" :key="'s-' + g.key" class="ovg2__chip">
        <i class="ovg2__dot" :style="{ background: g.color }"></i>Sénat · {{ g.short }}
      </span>
      <span v-for="g in paired.unmatchedAn" :key="'a-' + g.key" class="ovg2__chip">
        <i class="ovg2__dot" :style="{ background: g.color }"></i>Assemblée · {{ g.short }}
      </span>
    </div>
  </div>
</template>
