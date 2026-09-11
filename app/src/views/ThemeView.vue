<script setup>
import { computed, nextTick, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { byDateDesc, n } from "../format.js";
import Icon from "../components/Icon.vue";
import VoteCard from "../components/VoteCard.vue";
import StackedColumns from "../components/StackedColumns.vue";

const route = useRoute();
const data = useDataStore();
const prefs = usePrefsStore();

const theme = computed(() => data.themeById(route.params.id));
const scrutins = computed(() => data.scrutinsOfTheme(route.params.id).slice().sort(byDateDesc));
const withAn = computed(() => scrutins.value.filter((s) => s.an).length);
const hasAn = computed(() => withAn.value > 0);
const chamber = computed(() => (hasAn.value ? prefs.chamber : "senat"));
const openSid = computed(() => route.query.v || null);

const TYPE_LABELS = {
  amendement: ["amendement", "amendements"],
  article: ["article", "articles"],
  "ensemble du texte": ["vote sur l'ensemble", "votes sur l'ensemble"],
  "motion de procédure": ["motion de procédure", "motions de procédure"],
  autre: ["autre vote", "autres votes"]
};

const types = computed(() => {
  const byType = {};
  scrutins.value.forEach((s) => {
    byType[s.type] = (byType[s.type] || 0) + 1;
  });
  return Object.keys(byType)
    .sort((a, b) => byType[b] - byType[a])
    .map((k) => {
      const [one, many] = TYPE_LABELS[k.toLowerCase()] || [k.toLowerCase(), k.toLowerCase() + "s"];
      return byType[k] + " " + (byType[k] > 1 ? many : one);
    })
    .join(" · ");
});

const chartRows = computed(() => {
  const acc = {};
  scrutins.value.forEach((s) => {
    const groups =
      chamber.value === "senat"
        ? s.groups.map((g) => data.senateGroup(g))
        : s.an && s.an.groups
          ? s.an.groups.map((g) => data.anGroup(g))
          : [];
    groups.forEach((g) => {
      if (!acc[g.key]) {
        acc[g.key] = { key: g.key, short: g.short, label: g.label, color: g.color, pour: 0, contre: 0, abs: 0 };
      }
      acc[g.key].pour += g.pour;
      acc[g.key].contre += g.contre;
      acc[g.key].abs += g.abstention;
    });
  });
  return Object.keys(acc)
    .map((k) => {
      const a = acc[k];
      const d = a.pour + a.contre + a.abs;
      a.pctPour = d ? Math.round((100 * a.pour) / d) : 0;
      a.pctContre = d ? Math.round((100 * a.contre) / d) : 0;
      a.pctAbs = d ? 100 - a.pctPour - a.pctContre : 0;
      a.votes = d;
      return a;
    })
    .filter((a) => a.votes > 0)
    .sort((x, y) => y.votes - x.votes);
});

const textSections = computed(() => {
  const byText = {};
  scrutins.value.forEach((s) => {
    (byText[s.text] = byText[s.text] || []).push(s);
  });
  const texts = Object.keys(byText).sort((a, b) => {
    const da = byText[a][0].date || "";
    const db = byText[b][0].date || "";
    return db.localeCompare(da);
  });
  return texts.map((text, idx) => {
    const list = byText[text].slice().sort(byDateDesc);
    const ensemble = list.filter((s) => s.type === "Ensemble du texte").length;
    const dossier = list[0].dossierUrl;
    const anVotes = data.anByText(text);
    return { text, idx, list, ensemble, dossier, anVotes };
  });
});

function scrollToOpen() {
  if (!openSid.value) return;
  nextTick(() => {
    const el = document.getElementById("v-" + openSid.value);
    if (el) el.scrollIntoView({ block: "start" });
  });
}

onMounted(scrollToOpen);
watch(openSid, scrollToOpen);
</script>

<template>
  <div v-if="theme">
    <div class="backrow"><RouterLink class="btn btn--small" to="/">← Retour</RouterLink></div>
    <div class="hero-band" :style="{ '--pastel': theme.pastel }">
      <div class="hero-band__inner">
        <div>
          <span class="hero-band__icon"><Icon :name="theme.icon" /></span>
          <h1>{{ theme.name }}</h1>
          <p class="hero-band__sub">
            {{ theme.description }} Voici les scrutins publics correspondants, adoptés ou rejetés, et la position de chaque groupe.
          </p>
          <div class="chips">
            <span v-if="theme.concern" class="chip">Sujet cité par <b>{{ theme.concern.value }} %</b> ({{ theme.concern.source }} {{ theme.concern.date }})</span>
            <span class="chip"><b>{{ n(scrutins.length) }}</b> scrutin{{ scrutins.length > 1 ? "s" : "" }}</span>
            <span class="chip"><b>{{ n(withAn) }}</b> vote{{ withAn > 1 ? "s" : "" }} de l'Assemblée</span>
          </div>
        </div>
        <div class="goalcard">
          <h2>Comment lire</h2>
          <p>Chaque fiche indique <strong>ce que change le texte</strong>, s'il a été <strong>adopté ou rejeté</strong> au Sénat, s'il est d'origine <strong>gouvernementale ou parlementaire</strong>, et le vote correspondant de l'Assemblée nationale lorsqu'il existe.</p>
          <p>La répartition des votes par groupe (pour, contre, abstention) est reprise des comptes rendus officiels, avec un lien vers la source.</p>
        </div>
      </div>
    </div>

    <div class="wrap">
      <section class="section">
        <div class="chart-card">
          <div class="chart-card__head">
            <div>
              <h2>{{ chamber === "senat" ? "Comment le Sénat a voté" : "Comment l'Assemblée nationale a voté" }} sur ces textes</h2>
              <p class="note">En % des votes émis par groupe (pour + contre + abstentions), sur {{ scrutins.length }} scrutin{{ scrutins.length > 1 ? "s" : "" }}.</p>
            </div>
            <div class="segmented" role="group" aria-label="Chambre affichée dans le graphique">
              <button type="button" :class="{ 'is-on': chamber === 'senat' }" :aria-pressed="chamber === 'senat'" @click="prefs.chamber = 'senat'">Sénat</button>
              <button type="button" :class="{ 'is-on': chamber === 'an' }" :aria-pressed="chamber === 'an'" :disabled="!hasAn" @click="prefs.chamber = 'an'">Assemblée nationale</button>
            </div>
          </div>
          <StackedColumns :rows="chartRows" />
          <p class="note" style="margin-top: 12px">Répartition des votes de chaque groupe, sans jugement sur le sens des textes. Les non-votants sont exclus des pourcentages.</p>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Les scrutins</h2>
          <p class="note">{{ types }}</p>
        </div>
        <template v-if="scrutins.length">
          <section v-for="block in textSections" :key="block.text" class="textblock">
            <div class="textblock__head">
              <h3 class="textblock__title">{{ block.text }}</h3>
              <p class="textblock__meta">
                {{ block.list.length }} vote{{ block.list.length > 1 ? "s" : "" }} · {{ block.ensemble }} sur l'ensemble<template v-if="block.anVotes.length"> · {{ block.anVotes.length }} vote{{ block.anVotes.length > 1 ? "s" : "" }} de l'Assemblée</template><template v-if="block.dossier"> · <a :href="block.dossier" target="_blank" rel="noopener">dossier législatif ↗</a></template>
              </p>
            </div>
            <div class="vlist">
              <VoteCard
                v-for="(s, i) in block.list"
                :key="s.id"
                :scrutin="s"
                :initially-open="openSid === s.id || (block.idx === 0 && i === 0 && block.list.length <= 3)"
              />
            </div>
          </section>
        </template>
        <p v-else class="empty">Aucun scrutin pour ce sujet.</p>
      </section>
    </div>
  </div>
  <div v-else class="wrap">
    <div class="page-head">
      <h1 class="page-title">Sujet introuvable</h1>
      <p class="page-lede">Ce sujet n'existe pas ou plus. <RouterLink to="/">Revenir aux sujets</RouterLink>.</p>
    </div>
  </div>
</template>
