<script setup>
import { computed } from "vue";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { frDate } from "../format.js";
import OverlayBars from "./OverlayBars.vue";
import TotalsChips from "./TotalsChips.vue";

const props = defineProps({
  scrutin: { type: Object, required: true }
});

const data = useDataStore();
const prefs = usePrefsStore();

const anVote = computed(() => data.anVoteOf(props.scrutin));
const hasAn = computed(() => !!anVote.value);
const anIsText = computed(() => !props.scrutin.an && hasAn.value);
const overlayOn = computed(() => prefs.overlay && hasAn.value);
const senateGroups = computed(() => props.scrutin.groups.map((g) => data.senateGroup(g)));
const anGroups = computed(() =>
  anVote.value && anVote.value.groups ? anVote.value.groups.map((g) => data.anGroup(g)) : []
);

function resultWord(result) {
  return result === "Adoption" ? "Adopté" : "Rejeté";
}

function resultClass(result) {
  return result === "Adoption" ? "b--adopted" : "b--rejected";
}
</script>

<template>
  <div v-if="hasAn" class="overlay-toggle">
    <label class="switch">
      <input v-model="prefs.overlay" type="checkbox">
      <span>Superposer Sénat et Assemblée</span>
    </label>
  </div>

  <section v-if="overlayOn" class="chamber" aria-label="Superposition des votes du Sénat et de l'Assemblée nationale">
    <div class="chamber__head">
      <div class="chamber__title">
        Superposition Sénat / Assemblée
        <small>
          Assemblée · {{ frDate(anVote.date) }} · {{ anVote.stage }} · {{ anVote.legislature }}ᵉ législature<template v-if="anIsText"> · vote sur le texte</template>
        </small>
      </div>
      <span class="b" :class="resultClass(anVote.result)">AN · {{ resultWord(anVote.result) }}</span>
    </div>

    <div class="ovg-totals">
      <div>
        <p class="ovg-totals__lbl">Sénat · {{ frDate(props.scrutin.date) }} · {{ resultWord(props.scrutin.result) }}</p>
        <TotalsChips :totals="props.scrutin.totals" />
      </div>
      <div>
        <p class="ovg-totals__lbl">Assemblée · {{ frDate(anVote.date) }} · {{ resultWord(anVote.result) }}</p>
        <TotalsChips :totals="anVote.totals" />
      </div>
    </div>

    <OverlayBars :senate-groups="senateGroups" :an-groups="anGroups" :mapping="data.groupMapping" />

    <p class="note ovg__note">
      Le rapprochement des groupes (LR ↔ DR, SER ↔ SOC, RDPI ↔ EPR, …) est <b>indicatif</b> : les groupes du Sénat et de l'Assemblée nationale ne sont pas les mêmes.
      L'Assemblée ne vote pas les amendements du Sénat : pour un amendement ou un article, la barre « Assemblée » correspond au <b>vote de l'Assemblée sur le texte</b> (date et étape ci-dessus).
    </p>

    <div class="vrow__links">
      <a :href="anVote.url" target="_blank" rel="noopener">Page du vote (Assemblée nationale) ↗</a>
    </div>
  </section>
</template>
