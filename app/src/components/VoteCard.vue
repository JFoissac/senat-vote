<script setup>
import { computed, ref, watch } from "vue";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { frDate, frDateShort, n, capFirst } from "../format.js";
import GroupBars from "./GroupBars.vue";
import OverlaySection from "./OverlaySection.vue";
import TotalsChips from "./TotalsChips.vue";
import Icon from "./Icon.vue";

const props = defineProps({
  scrutin: { type: Object, required: true },
  initiallyOpen: { type: Boolean, default: false }
});

const data = useDataStore();
const prefs = usePrefsStore();
const open = ref(props.initiallyOpen);

watch(
  () => props.initiallyOpen,
  (value) => {
    if (value) open.value = true;
  }
);

const s = computed(() => props.scrutin);
const theme = computed(() => data.themeById(props.scrutin.theme));
const title = computed(() => capFirst(props.scrutin.text));
const subject = computed(() => props.scrutin.subject);
const typeClass = computed(() =>
  props.scrutin.type === "Ensemble du texte" ? "b--type-ens" : "b--type"
);
const originLabel = computed(() => {
  const origin = props.scrutin.origin;
  if (origin === "Gouvernement") return "Projet de loi (gouvernement)";
  if (origin === "Parlementaire") return "Proposition de loi (parlementaire)";
  return origin;
});
const senateGroups = computed(() => props.scrutin.groups.map((g) => data.senateGroup(g)));
const anGroupsNorm = computed(() =>
  props.scrutin.an && props.scrutin.an.groups
    ? props.scrutin.an.groups.map((g) => data.anGroup(g))
    : []
);
const anTextVotes = computed(() => data.anByText(props.scrutin.text));
const overlayOn = computed(() => prefs.overlay && !!data.anVoteOf(props.scrutin));
const anBadge = computed(() => {
  if (props.scrutin.an) {
    return (
      "AN · " +
      resultWord(props.scrutin.an.result) +
      " · " +
      props.scrutin.an.stage
    );
  }
  if (anTextVotes.value.length) return "AN · votes sur le texte";
  return "";
});

function resultWord(result) {
  return result === "Adoption" ? "Adopté" : "Rejeté";
}

function resultClass(result) {
  return result === "Adoption" ? "b--adopted" : "b--rejected";
}

</script>

<template>
  <article :id="'v-' + s.id" class="vrow" :class="{ 'is-open': open }">
    <button
      class="vrow__head"
      type="button"
      :aria-expanded="open"
      :aria-controls="'body-' + s.id"
      @click="open = !open"
    >
      <span class="vrow__eyebrow">
        <template v-if="theme">
          <span class="miniicon" :style="{ background: theme.pastel }"><Icon :name="theme.icon" /></span>{{ theme.name }}
        </template>
        <template v-else>Scrutin</template>
      </span>
      <span class="vrow__title">{{ title }}</span>
      <span v-if="subject" class="vrow__subject">{{ subject }}</span>
      <span class="vrow__meta">
        <span class="b" :class="resultClass(s.result)">Sénat · {{ resultWord(s.result) }}</span>
        <span v-if="anBadge" class="b b--an">{{ anBadge }}</span>
        <span class="b" :class="typeClass">{{ s.type }}</span>
        <span class="b b--origin">{{ originLabel }}</span>
        <span class="vrow__date">{{ frDateShort(s.date) }}</span>
        <span class="vrow__chev">▾</span>
      </span>
    </button>
    <div :id="'body-' + s.id" class="vrow__body">
      <template v-if="open">
        <div class="vrow__links vrow__links--top">
          <RouterLink :to="'/scrutin/' + s.id">Détail du scrutin et votes nominatifs →</RouterLink>
        </div>

        <p v-if="s.resume" class="resume"><b>Ce que change le texte</b>{{ s.resume }}</p>

      <OverlaySection :scrutin="s" />

      <div v-if="!overlayOn" class="chambers">
        <div class="chamber">
          <div class="chamber__head">
            <div class="chamber__title">Sénat<small>{{ frDate(s.date) }}</small></div>
            <span class="b" :class="resultClass(s.result)">Sénat · {{ resultWord(s.result) }}</span>
          </div>
          <TotalsChips :totals="s.totals" />
          <GroupBars :groups="senateGroups" />
          <div class="vrow__links">
            <a :href="s.url" target="_blank" rel="noopener">Page du scrutin (senat.fr) ↗</a>
            <a v-if="s.dossierUrl" :href="s.dossierUrl" target="_blank" rel="noopener">Dossier législatif ↗</a>
          </div>
        </div>

        <div v-if="s.an" class="chamber">
          <div class="chamber__head">
            <div class="chamber__title">
              Assemblée nationale<small>{{ frDate(s.an.date) }} · {{ s.an.stage }} · {{ s.an.legislature }}ᵉ législature</small>
            </div>
            <span class="b" :class="resultClass(s.an.result)">AN · {{ resultWord(s.an.result) }}</span>
          </div>
          <TotalsChips :totals="s.an.totals" />
          <GroupBars :groups="anGroupsNorm" />
          <p v-if="s.anNote" class="note" style="margin: 10px 0 0">{{ s.anNote }}</p>
          <div class="vrow__links">
            <a :href="s.an.url" target="_blank" rel="noopener">Page du vote (Assemblée nationale) ↗</a>
          </div>
        </div>

        <div v-else-if="anTextVotes.length" class="chamber">
          <div class="chamber__head">
            <div class="chamber__title">Assemblée nationale<small>Votes publics sur ce texte</small></div>
          </div>
          <ul class="anvotes">
            <li v-for="a in anTextVotes" :key="a.uid">
              <a :href="a.url" target="_blank" rel="noopener">{{ frDateShort(a.date) }} · {{ a.stage }}</a>
              <span class="b" :class="resultClass(a.result)">{{ resultWord(a.result) }}</span>
              <span class="anvotes__c">{{ n(a.totals.pour) }} pour · {{ n(a.totals.contre) }} contre</span>
            </li>
            <li class="note">Les amendements ne sont pas votés dans les deux chambres : le vote de l'Assemblée porte sur le texte, pas sur chaque amendement du Sénat.</li>
          </ul>
        </div>

        <div v-else class="chamber">
          <div class="chamber__head">
            <div class="chamber__title">Assemblée nationale<small>Aucun vote public recensé sur ce texte</small></div>
          </div>
          <p class="chamber__empty">Aucun vote public de l'Assemblée nationale n'est recensé sur ce texte dans les données officielles.</p>
        </div>
      </div>
      </template>
    </div>
  </article>
</template>
