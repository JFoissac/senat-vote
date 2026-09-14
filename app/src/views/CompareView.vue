<script setup>
import { computed, ref } from "vue";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { statsOver } from "../lib/stats.js";
import Icon from "../components/Icon.vue";

const data = useDataStore();
const prefs = usePrefsStore();

const sideOpen = ref(false);
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
      <h1 class="page-title">Comparer les votes</h1>
      <p class="page-lede">Choisissez deux groupes du Sénat pour comparer la part de leurs votes <b>« pour »</b> et <b>« contre »</b>, sujet par sujet.</p>
    </div>
    <div class="compare">
      <aside class="compare__side" :class="{ 'is-open': sideOpen }">
        <div class="filters__head">
          <h2>Groupes et sujets</h2>
          <button
            class="filters__toggle"
            type="button"
            :aria-expanded="sideOpen"
            aria-controls="compare-filters"
            @click="sideOpen = !sideOpen"
          >
            {{ sideOpen ? "Masquer" : "Afficher" }}<span class="filters__chev" aria-hidden="true">▾</span>
          </button>
        </div>
        <div id="compare-filters" class="compare__side-body">
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
          <p class="note" style="margin: 6px 0 0">
            Par défaut, l'abstention compte dans le total : « pour » et « contre » sont calculés sur les votes émis.
          </p>
        </div>
        <div class="filters__group" style="border-top: 1px solid var(--line); padding-top: 12px; margin-top: 14px">
          <p class="filters__label">Sujets pris en compte {{ selectedCount }}/{{ themes.length }}</p>
          <label v-for="t in themes" :key="t.id" class="checkline checkline--icon">
            <input v-model="prefs.comparer.subjects[t.id]" type="checkbox">
            <span class="tile" :style="{ background: t.pastel }"><Icon :name="t.icon" /></span>
            <span>{{ t.name }} <small>({{ data.scrutinsOfTheme(t.id).length }})</small></span>
          </label>
          <button class="btn btn--small" type="button" style="margin-top: 8px" @click="toggleAll">Tout cocher / décocher</button>
        </div>
        </div>
      </aside>

      <div class="compare__main">
        <div class="cmp-vs">
          <div class="cmp-vs__g">
            <span class="cmp-mono" :style="{ background: ga ? ga.color : '#999' }">{{ ga ? ga.short : "?" }}</span>
            <b class="cmp-vs__name">{{ ga ? ga.label : "—" }}</b>
            <b class="cmp-vs__num" :style="{ color: ga ? ga.color : 'inherit' }">{{ fmt(totA.pour) }}</b>
            <small class="cmp-vs__sub">pour · {{ fmt(totA.contre) }} contre</small>
          </div>
          <span class="cmp-vs__word">VS</span>
          <div class="cmp-vs__g">
            <span class="cmp-mono" :style="{ background: gb ? gb.color : '#999' }">{{ gb ? gb.short : "?" }}</span>
            <b class="cmp-vs__name">{{ gb ? gb.label : "—" }}</b>
            <b class="cmp-vs__num" :style="{ color: gb ? gb.color : 'inherit' }">{{ fmt(totB.pour) }}</b>
            <small class="cmp-vs__sub">pour · {{ fmt(totB.contre) }} contre</small>
          </div>
        </div>
        <p class="note cmp-vs__note">
          Part des votes « pour » et « contre » sur les scrutins des sujets cochés.
          <template v-if="prefs.comparer.excludeAbs">Abstentions exclues.</template>
          <template v-else>Votes émis (pour + contre + abstentions) ; non-votants exclus.</template>
        </p>
        <table class="ctable ctable--cmp">
          <thead>
            <tr>
              <th>Sujet</th>
              <th>
                <span class="cmp-dot" :style="{ background: ga ? ga.color : '#999' }"></span>{{ ga ? ga.short : "—" }}
                <span class="th-name">{{ ga ? ga.label : "" }}</span>
                <span class="th-sub">pour / contre</span>
              </th>
              <th>
                <span class="cmp-dot" :style="{ background: gb ? gb.color : '#999' }"></span>{{ gb ? gb.short : "—" }}
                <span class="th-name">{{ gb ? gb.label : "" }}</span>
                <span class="th-sub">pour / contre</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.t.id">
              <td class="tname">
                <span class="tname__inner">
                  <span class="tile" :style="{ background: row.t.pastel }"><Icon :name="row.t.icon" /></span>
                  <span class="tname__txt">{{ row.t.name }}<small>{{ row.tl.length }} vote{{ row.tl.length > 1 ? "s" : "" }}</small></span>
                </span>
              </td>
              <td class="n" :data-label="ga ? ga.short : '—'" :title="(ga ? ga.short : '') + ' : ' + fmt(row.A.pour) + ' pour, ' + fmt(row.A.contre) + ' contre'">
                <span class="cmp-pct" :style="{ color: ga ? ga.color : 'inherit' }">{{ fmt(row.A.pour) }}</span>
                <small class="cmp-pct__sub">{{ fmt(row.A.contre) }} contre</small>
              </td>
              <td class="n" :data-label="gb ? gb.short : '—'" :title="(gb ? gb.short : '') + ' : ' + fmt(row.B.pour) + ' pour, ' + fmt(row.B.contre) + ' contre'">
                <span class="cmp-pct" :style="{ color: gb ? gb.color : 'inherit' }">{{ fmt(row.B.pour) }}</span>
                <small class="cmp-pct__sub">{{ fmt(row.B.contre) }} contre</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
