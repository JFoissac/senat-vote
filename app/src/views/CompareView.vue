<script setup>
import { computed } from "vue";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";

const data = useDataStore();
const prefs = usePrefsStore();

const themes = computed(() => data.themesSorted);
const groups = computed(() => data.senateGroups);

const selectedThemes = computed(() =>
  themes.value.filter((t) => prefs.comparer.subjects[t.id])
);
const selectedCount = computed(() => selectedThemes.value.length);

const selectedScrutins = computed(() => {
  const sel = {};
  selectedThemes.value.forEach((t) => {
    sel[t.id] = true;
  });
  return data.scrutinsArray.filter((s) => sel[s.theme]);
});

function statsOver(list, key, excludeAbs) {
  let pour = 0;
  let contre = 0;
  let abs = 0;
  let votants = 0;
  let possible = 0;
  let nb = 0;
  list.forEach((s) => {
    const g = s.groups.find((x) => x.key === key);
    if (!g || !g.size) return;
    nb++;
    pour += g.pour;
    contre += g.contre;
    abs += g.abstention;
    votants += g.pour + g.contre + g.abstention;
    possible += g.size;
  });
  const d = excludeAbs ? pour + contre : pour + contre + abs;
  return {
    nb,
    presence: possible ? Math.round((100 * votants) / possible) : null,
    pour: d ? Math.round((100 * pour) / d) : null,
    contre: d ? Math.round((100 * contre) / d) : null
  };
}

function agreementBetween(aKey, bKey, list) {
  let common = 0;
  let same = 0;
  list.forEach((s) => {
    const ga = s.groups.find((x) => x.key === aKey);
    const gb = s.groups.find((x) => x.key === bKey);
    if (!ga || !gb || !ga.size || !gb.size) return;
    function maj(g) {
      return g.pour >= g.contre && g.pour >= g.abstention ? "pour" : g.contre >= g.pour && g.contre >= g.abstention ? "contre" : "abs";
    }
    common++;
    if (maj(ga) === maj(gb)) same++;
  });
  return { pct: common ? Math.round((100 * same) / common) : null, common, same };
}

function fmtPct(v) {
  return v == null ? "—" : v + " %";
}

const ga = computed(() => data.groupMap[prefs.comparer.a]);
const gb = computed(() => data.groupMap[prefs.comparer.b]);
const agreement = computed(() =>
  agreementBetween(prefs.comparer.a, prefs.comparer.b, selectedScrutins.value)
);
const totA = computed(() => statsOver(selectedScrutins.value, prefs.comparer.a, prefs.comparer.excludeAbs));
const totB = computed(() => statsOver(selectedScrutins.value, prefs.comparer.b, prefs.comparer.excludeAbs));

const rows = computed(() =>
  selectedThemes.value
    .map((t) => {
      const tl = data.scrutinsOfTheme(t.id);
      if (!tl.length) return null;
      const A = statsOver(tl, prefs.comparer.a, prefs.comparer.excludeAbs);
      const B = statsOver(tl, prefs.comparer.b, prefs.comparer.excludeAbs);
      if (A.nb === 0 && B.nb === 0) return null;
      return { t, tl, A, B };
    })
    .filter(Boolean)
);

const allOn = computed(() => selectedCount.value === themes.value.length);

function toggleAll() {
  const value = !allOn.value;
  const subjects = {};
  themes.value.forEach((t) => {
    subjects[t.id] = value;
  });
  prefs.comparer.subjects = subjects;
}
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Comparer deux groupes</h1>
      <p class="page-lede">Comparaison factuelle de deux groupes du Sénat : taux d'accord, participation et part de votes pour ou contre, sujet par sujet. Aucune appréciation sur le sens des textes.</p>
    </div>
    <div class="compare">
      <aside class="compare__side">
        <h2>Groupes à comparer</h2>
        <label for="cmp-a">1. Premier groupe</label>
        <select id="cmp-a" v-model="prefs.comparer.a">
          <option v-for="g in groups" :key="g.key" :value="g.key">{{ g.short }} — {{ g.label }}</option>
        </select>
        <label for="cmp-b">2. Second groupe</label>
        <select id="cmp-b" v-model="prefs.comparer.b">
          <option v-for="g in groups" :key="g.key" :value="g.key">{{ g.short }} — {{ g.label }}</option>
        </select>
        <div style="margin-top: 14px">
          <label class="switch">
            <input v-model="prefs.comparer.excludeAbs" type="checkbox">
            Exclure l'abstention
          </label>
        </div>
        <div class="filters__group" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 14px">
          <p class="filters__label">Sujets pris en compte <span id="cmp-count">{{ selectedCount }}/{{ themes.length }}</span></p>
          <label v-for="t in themes" :key="t.id" class="checkline">
            <input v-model="prefs.comparer.subjects[t.id]" type="checkbox">
            <span class="dot" :style="{ background: t.pastel }"></span>{{ t.name }} <small>({{ t.count }})</small>
          </label>
          <button class="btn btn--small" type="button" style="margin-top: 8px" @click="toggleAll">Tout cocher / décocher</button>
        </div>
        <p class="note" style="margin-top: 12px">« Pour » et « contre » portent sur les votes émis (pour + contre + abstentions) ; les non-votants sont exclus. La participation rapporte les votes émis aux sièges du groupe au jour de chaque vote.</p>
      </aside>
      <div class="compare__main">
        <h2 class="compare__title">Taux d'accord : {{ agreement.pct == null ? "—" : agreement.pct + " %" }}</h2>
        <p class="note">Part des scrutins où les deux groupes ont voté majoritairement de la même façon ({{ agreement.same }} sur {{ agreement.common }} scrutins où ils ont tous deux participé), pour les sujets cochés. Une même position peut correspondre à un vote pour comme à un vote contre.</p>
        <div class="compare__nums">
          <span class="compare__num">
            <b :style="{ color: ga ? ga.color : 'inherit' }">{{ fmtPct(totA.presence) }}</b>
            <span>{{ ga ? ga.short : "" }} · participation</span>
          </span>
          <span class="compare__vs">vs</span>
          <span class="compare__num">
            <b :style="{ color: gb ? gb.color : 'inherit' }">{{ fmtPct(totB.presence) }}</b>
            <span>{{ gb ? gb.short : "" }} · participation</span>
          </span>
        </div>
        <div class="table-wrap">
          <table class="ctable">
            <thead>
              <tr>
                <th rowspan="2">Sujet</th>
                <th colspan="3" :style="{ color: ga ? ga.color : 'inherit' }">{{ ga ? ga.short : "—" }}</th>
                <th colspan="3" :style="{ color: gb ? gb.color : 'inherit' }">{{ gb ? gb.short : "—" }}</th>
              </tr>
              <tr>
                <th>Partic.</th>
                <th>Pour</th>
                <th>Contre</th>
                <th>Partic.</th>
                <th>Pour</th>
                <th>Contre</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.t.id">
                <td class="tname">{{ row.t.name }}<small>{{ row.tl.length }} scrutin{{ row.tl.length > 1 ? "s" : "" }}</small></td>
                <td>{{ fmtPct(row.A.presence) }}</td>
                <td class="n" :style="{ color: ga ? ga.color : 'inherit' }">{{ fmtPct(row.A.pour) }}</td>
                <td>{{ fmtPct(row.A.contre) }}</td>
                <td>{{ fmtPct(row.B.presence) }}</td>
                <td class="n" :style="{ color: gb ? gb.color : 'inherit' }">{{ fmtPct(row.B.pour) }}</td>
                <td>{{ fmtPct(row.B.contre) }}</td>
              </tr>
              <tr class="is-total">
                <td>Tous les scrutins cochés</td>
                <td>{{ fmtPct(totA.presence) }}</td>
                <td>{{ fmtPct(totA.pour) }}</td>
                <td>{{ fmtPct(totA.contre) }}</td>
                <td>{{ fmtPct(totB.presence) }}</td>
                <td>{{ fmtPct(totB.pour) }}</td>
                <td>{{ fmtPct(totB.contre) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
