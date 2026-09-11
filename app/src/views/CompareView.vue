<script setup>
import { computed } from "vue";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";

const data = useDataStore();
const prefs = usePrefsStore();

const themes = computed(() => data.themesSorted);
const groups = computed(() => data.senateGroups);

const selectedThemes = computed(() => themes.value.filter((t) => prefs.comparer.subjects[t.id]));
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
  let nb = 0;
  list.forEach((s) => {
    const g = s.groups.find((x) => x.key === key);
    if (!g || !g.size) return;
    nb++;
    pour += g.pour;
    contre += g.contre;
    abs += g.abstention;
  });
  const d = excludeAbs ? pour + contre : pour + contre + abs;
  return {
    nb,
    pour: d ? Math.round((100 * pour) / d) : null,
    contre: d ? Math.round((100 * contre) / d) : null,
    abs: !excludeAbs && d ? Math.round((100 * abs) / d) : 0
  };
}

function fmt(v) {
  return v == null ? "—" : v + " %";
}

const ga = computed(() => data.groupMap[prefs.comparer.a]);
const gb = computed(() => data.groupMap[prefs.comparer.b]);
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
      <p class="page-lede">Part des votes <b>pour</b> et <b>contre</b> de deux groupes du Sénat, sujet par sujet. Aucune appréciation sur le sens des textes.</p>
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
          <p class="filters__label">Sujets pris en compte <span>{{ selectedCount }}/{{ themes.length }}</span></p>
          <label v-for="t in themes" :key="t.id" class="checkline">
            <input v-model="prefs.comparer.subjects[t.id]" type="checkbox">
            <span class="dot" :style="{ background: t.pastel }"></span>{{ t.name }} <small>({{ data.scrutinsOfTheme(t.id).length }})</small>
          </label>
          <button class="btn btn--small" type="button" style="margin-top: 8px" @click="toggleAll">Tout cocher / décocher</button>
        </div>
        <p class="note" style="margin-top: 12px">
          Les pourcentages portent sur les <b>votes émis</b> (pour + contre + abstentions) ; les non-votants sont exclus.
          Cochez « Exclure l'abstention » pour ne compter que les votes pour et contre.
        </p>
      </aside>
      <div class="compare__main">
        <div class="compare__nums">
          <span class="compare__num">
            <b :style="{ color: ga ? ga.color : 'inherit' }">{{ fmt(totA.pour) }}</b>
            <span>{{ ga ? ga.short : "" }} · pour</span>
          </span>
          <span class="compare__vs">vs</span>
          <span class="compare__num">
            <b :style="{ color: gb ? gb.color : 'inherit' }">{{ fmt(totB.pour) }}</b>
            <span>{{ gb ? gb.short : "" }} · pour</span>
          </span>
        </div>
        <p class="note" style="margin: 0 0 14px">
          {{ ga ? ga.short : "—" }} : {{ fmt(totA.contre) }} contre · {{ gb ? gb.short : "—" }} : {{ fmt(totB.contre) }} contre
          — sur les scrutins des sujets cochés.
        </p>
        <div class="table-wrap">
          <table class="ctable">
            <thead>
              <tr>
                <th>Sujet</th>
                <th :style="{ color: ga ? ga.color : 'inherit' }">{{ ga ? ga.short : "—" }}</th>
                <th :style="{ color: gb ? gb.color : 'inherit' }">{{ gb ? gb.short : "—" }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.t.id">
                <td class="tname">{{ row.t.name }}<small>{{ row.tl.length }} scrutin{{ row.tl.length > 1 ? "s" : "" }}</small></td>
                <td>
                  <div class="cmpcell">
                    <div class="cmpbar" :title="ga ? ga.short + ' : ' + fmt(row.A.pour) + ' pour, ' + fmt(row.A.contre) + ' contre' : ''">
                      <span v-if="row.A.pour" class="cmpbar__seg cmpbar__seg--pour" :style="{ width: row.A.pour + '%' }"></span>
                      <span v-if="row.A.contre" class="cmpbar__seg cmpbar__seg--contre" :style="{ width: row.A.contre + '%' }"></span>
                      <span v-if="row.A.abs" class="cmpbar__seg cmpbar__seg--abs" :style="{ width: row.A.abs + '%' }"></span>
                    </div>
                    <span class="cmpcell__vals"><b :style="{ color: ga ? ga.color : 'inherit' }">{{ fmt(row.A.pour) }}</b> pour · {{ fmt(row.A.contre) }} contre</span>
                  </div>
                </td>
                <td>
                  <div class="cmpcell">
                    <div class="cmpbar" :title="gb ? gb.short + ' : ' + fmt(row.B.pour) + ' pour, ' + fmt(row.B.contre) + ' contre' : ''">
                      <span v-if="row.B.pour" class="cmpbar__seg cmpbar__seg--pour" :style="{ width: row.B.pour + '%' }"></span>
                      <span v-if="row.B.contre" class="cmpbar__seg cmpbar__seg--contre" :style="{ width: row.B.contre + '%' }"></span>
                      <span v-if="row.B.abs" class="cmpbar__seg cmpbar__seg--abs" :style="{ width: row.B.abs + '%' }"></span>
                    </div>
                    <span class="cmpcell__vals"><b :style="{ color: gb ? gb.color : 'inherit' }">{{ fmt(row.B.pour) }}</b> pour · {{ fmt(row.B.contre) }} contre</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
