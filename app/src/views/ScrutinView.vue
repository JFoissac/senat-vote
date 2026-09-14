<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDataStore } from "../stores/data.js";
import { usePrefsStore } from "../stores/prefs.js";
import { capFirst, frDate, frDateShort, n } from "../format.js";
import { initials } from "../lib/names.js";
import { regionOfDept } from "../data/departments.js";
import GroupBars from "../components/GroupBars.vue";
import OverlaySection from "../components/OverlaySection.vue";
import TotalsChips from "../components/TotalsChips.vue";

const route = useRoute();
const data = useDataStore();
const prefs = usePrefsStore();

const s = computed(() => data.scrutins[route.params.id] || null);
const theme = computed(() => (s.value ? data.themeById(s.value.theme) : null));
const title = computed(() => capFirst(s.value ? s.value.text : ""));
const senateGroups = computed(() =>
  s.value ? s.value.groups.map((g) => data.senateGroup(g)) : []
);
const anGroupsNorm = computed(() =>
  s.value && s.value.an && s.value.an.groups
    ? s.value.an.groups.map((g) => data.anGroup(g))
    : []
);
const anTextVotes = computed(() => (s.value ? data.anByText(s.value.text) : []));
const senateTextCount = computed(() => {
  if (!s.value) return 0;
  return data.scrutinsArray.filter((x) => x.text === s.value.text).length;
});
const anBadge = computed(() => {
  if (!s.value) return "";
  if (s.value.an) {
    return "AN · " + resultWord(s.value.an.result) + " · " + s.value.an.stage;
  }
  if (anTextVotes.value.length) return "AN · votes sur le texte";
  return "";
});

const CATS = [
  { key: "pour", label: "Pour" },
  { key: "contre", label: "Contre" },
  { key: "abstention", label: "Abstention" },
  { key: "nonVotants", label: "N'a pas pris part au vote" }
];

const votes = ref(null);
const votesLoading = ref(false);
const votesError = ref(null);
const failedPhotos = ref(new Set());

const textSummary = computed(() =>
  s.value ? data.textSummaryOf(s.value.text) : ""
);

function markFailed(key) {
  failedPhotos.value.add(key);
}

function splitNames(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function voter(name, listGroup, index) {
  const senator = data.senatorOf(name);
  const meta = senator ? data.groupMeta(senator.group) : null;
  return {
    raw: name,
    key: listGroup.key + "|" + name + "|" + index,
    name: senator ? senator.name : name,
    department: senator ? senator.department : "",
    region: senator ? regionOfDept(senator.dept) : "",
    short: meta ? meta.short : listGroup.short,
    color: meta ? meta.color : listGroup.color,
    photo: senator && senator.photo ? senator.photo : "",
    page: senator && senator.page ? senator.page : "",
    initials: initials(senator ? senator.name : name)
  };
}

const groupRows = computed(() => {
  if (!votes.value || !votes.value.groups) return [];
  const official = {};
  (s.value ? s.value.groups : []).forEach((g) => {
    official[g.key] = g;
  });
  return data.senateGroups.map((meta) => {
    const block = votes.value.groups[meta.key] || {};
    const cats = CATS.map((c) => ({
      key: c.key,
      label: c.label,
      people: splitNames(block[c.key]).map((name, i) => voter(name, meta, i))
    }));
    const total = cats.reduce((acc, c) => acc + c.people.length, 0);
    return { key: meta.key, short: meta.short, label: meta.label, color: meta.color, cats, total, official: official[meta.key] || {} };
  });
});

function resultWord(result) {
  return result === "Adoption" ? "Adopté" : "Rejeté";
}

function resultClass(result) {
  return result === "Adoption" ? "b--adopted" : "b--rejected";
}

function typeClass(type) {
  return type === "Ensemble du texte" ? "b--type-ens" : "b--type";
}

function originLabel(origin) {
  if (origin === "Gouvernement") return "Projet de loi (gouvernement)";
  if (origin === "Parlementaire") return "Proposition de loi (parlementaire)";
  return origin;
}

async function loadVotes(id) {
  if (!id) return;
  votes.value = null;
  votesError.value = null;
  votesLoading.value = true;
  failedPhotos.value = new Set();
  try {
    const res = await fetch(import.meta.env.BASE_URL + "votes/" + id + ".json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.id === id) votes.value = json;
    else throw new Error("identifiant inattendu");
  } catch {
    votesError.value = "Les votes nominatifs de ce scrutin ne sont pas disponibles.";
  } finally {
    votesLoading.value = false;
  }
}

onMounted(() => {
  if (s.value) loadVotes(s.value.id);
});

watch(
  () => (s.value ? s.value.id : null),
  (id) => {
    if (id) loadVotes(id);
  }
);
const overlayOn = computed(() => prefs.overlay && !!data.anVoteOf(s.value));
</script>

<template>
  <div v-if="s" class="wrap">
    <div class="backrow backrow--split">
      <RouterLink class="btn btn--small" :to="'/sujet/' + s.theme">← {{ theme ? theme.name : "Sujet" }}</RouterLink>
      <RouterLink class="btn btn--small" to="/votes">Tous les votes</RouterLink>
    </div>

    <article class="scrutin">
      <header class="scrutin__head">
        <h1 class="scrutin__title">{{ title }}</h1>
        <p class="scrutin__sub">{{ s.subject }}</p>
        <div class="scrutin__badges">
          <span class="b" :class="resultClass(s.result)">Sénat · {{ resultWord(s.result) }}</span>
          <span v-if="anBadge" class="b b--an">{{ anBadge }}</span>
          <span class="b" :class="typeClass(s.type)">{{ s.type }}</span>
          <span class="b b--origin">{{ originLabel(s.origin) }}</span>
          <span class="scrutin__date">{{ frDate(s.date) }}</span>
        </div>
        <p v-if="s.resume" class="resume"><b>Ce que change le texte</b>{{ s.resume }}</p>
      </header>

      <OverlaySection v-if="s" :scrutin="s" />

      <div v-if="!overlayOn" class="scrutin-grid">
        <section class="scrutin-card" aria-label="Vote du Sénat">
          <div class="chamber__head">
            <div class="chamber__title">Sénat<small>{{ frDate(s.date) }}</small></div>
            <span class="b" :class="resultClass(s.result)">Sénat · {{ resultWord(s.result) }}</span>
          </div>
          <TotalsChips :totals="s.totals" />
          <GroupBars :groups="senateGroups" />
        </section>

        <section class="scrutin-card" aria-label="Vote de l'Assemblée nationale">
          <div v-if="s.an" class="chamber__head">
            <div class="chamber__title">
              Assemblée nationale<small>{{ frDate(s.an.date) }} · {{ s.an.stage }} · {{ s.an.legislature }}ᵉ législature</small>
            </div>
            <span class="b" :class="resultClass(s.an.result)">AN · {{ resultWord(s.an.result) }}</span>
          </div>
          <template v-if="s.an">
            <TotalsChips :totals="s.an.totals" />
            <GroupBars :groups="anGroupsNorm" />
            <p v-if="s.anNote" class="note">{{ s.anNote }}</p>
          </template>

          <template v-else-if="anTextVotes.length">
            <div class="chamber__head">
              <div class="chamber__title">Assemblée nationale<small>Votes publics sur ce texte</small></div>
            </div>
            <ul class="anvotes">
              <li v-for="a in anTextVotes" :key="a.uid">
                <a :href="a.url" target="_blank" rel="noopener" aria-label="Ouvrir le vote de l'Assemblée nationale sur le site de l'Assemblée (nouvel onglet)">{{ frDateShort(a.date) }} · {{ a.stage }}</a>
                <span class="b" :class="resultClass(a.result)">{{ resultWord(a.result) }}</span>
                <span class="anvotes__c">{{ n(a.totals.pour) }} pour · {{ n(a.totals.contre) }} contre</span>
              </li>
            </ul>
          </template>

          <template v-else>
            <div class="chamber__head">
              <div class="chamber__title">Assemblée nationale<small>Aucun vote public recensé sur ce texte</small></div>
            </div>
            <p class="chamber__empty">Aucun vote public de l'Assemblée nationale n'est recensé sur ce texte dans les données officielles.</p>
          </template>
        </section>
      </div>

      <section class="scrutin-card about" aria-label="À propos du texte">
        <h2 class="scrutin-card__title">À propos du texte</h2>
        <p v-if="textSummary" class="resume"><b>En bref</b>{{ textSummary }}</p>
        <dl class="about__facts">
          <div>
            <dt>Texte</dt>
            <dd>{{ title }}</dd>
          </div>
          <div>
            <dt>Origine</dt>
            <dd>{{ originLabel(s.origin) }}</dd>
          </div>
          <div>
            <dt>Scrutins du Sénat sur ce texte</dt>
            <dd>{{ n(senateTextCount) }}</dd>
          </div>
        </dl>

        <div v-if="anTextVotes.length" class="about__an">
          <p class="about__label">Votes de l'Assemblée nationale sur ce texte</p>
          <ul class="anvotes">
            <li v-for="a in anTextVotes" :key="a.uid">
              <a :href="a.url" target="_blank" rel="noopener" :aria-label="'Ouvrir le vote de l\'Assemblée nationale du ' + frDateShort(a.date) + ' sur le site de l\'Assemblée (nouvel onglet)'">{{ frDateShort(a.date) }} · {{ a.stage }}</a>
              <span class="b" :class="resultClass(a.result)">{{ resultWord(a.result) }}</span>
              <span class="anvotes__c">{{ n(a.totals.pour) }} pour · {{ n(a.totals.contre) }} contre</span>
            </li>
          </ul>
        </div>
        <p v-else class="about__empty">Aucun vote public de l'Assemblée nationale n'est recensé sur ce texte.</p>

        <p v-if="s.dossierUrl" class="about__dossier">
          <a :href="s.dossierUrl" target="_blank" rel="noopener" aria-label="Ouvrir le dossier législatif sur senat.fr (nouvel onglet)">Dossier législatif ↗</a>
        </p>
      </section>

      <section class="scrutin-card" aria-label="Votes nominatifs des sénateurs">
        <h2 class="scrutin-card__title">Qui a voté<small>Détail nominatif par groupe, d'après le compte rendu officiel du scrutin.</small></h2>

        <p v-if="votesLoading" class="wv-loading">Chargement des votes nominatifs…</p>
        <p v-else-if="votesError" class="wv-error">{{ votesError }}</p>

        <div v-else-if="groupRows.length" class="wv">
          <details v-for="g in groupRows" :key="g.key" class="wv-group">
            <summary class="wv-group__summary">
              <span class="wv-group__id">
                <span class="wv-dot" :style="{ background: g.color }"></span>
                <span class="wv-group__short">{{ g.short }}</span>
                <span class="wv-group__label">{{ g.label }}</span>
              </span>
              <span class="wv-group__counts">
                {{ n(g.official.pour) }} pour · {{ n(g.official.contre) }} contre · {{ n(g.official.abstention) }} abst. · {{ n(g.official.nonVotants) }} non-votants
              </span>
            </summary>
            <div class="wv-body">
              <div v-if="g.total" class="wv-names">
                <div v-for="c in g.cats" v-show="c.people.length" :key="c.key" class="wv-cat">
                  <p class="wv-cat__head">{{ c.label }} <b>{{ n(c.people.length) }}</b></p>
                  <ul class="wv-voters">
                    <li v-for="(p, i) in c.people" :key="p.raw + i" class="wv-voter">
                      <span class="wv-avatar" :style="{ background: p.color }" aria-hidden="true">
                        <img
                          v-if="p.photo && !failedPhotos.has(p.key)"
                          class="wv-photo"
                          :src="p.photo"
                          alt=""
                          loading="lazy"
                          referrerpolicy="no-referrer"
                          @error="markFailed(p.key)"
                        />
                        <template v-else>{{ p.initials }}</template>
                      </span>
                      <span class="wv-voter__id">
                        <a
                          v-if="p.page"
                          class="wv-voter__name"
                          :href="p.page"
                          target="_blank"
                          rel="noopener"
                          :aria-label="'Fiche du sénateur ' + p.name + ' sur senat.fr'"
                        >{{ p.name }}</a>
                        <span v-else class="wv-voter__name">{{ p.name }}</span>
                        <span v-if="p.department" class="wv-voter__dept">{{ p.department }}<template v-if="p.region"> · {{ p.region }}</template></span>
                      </span>
                      <span class="wv-tag" :style="{ color: p.color, borderColor: p.color }">{{ p.short }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p v-else class="wv-empty">Aucun nom enregistré.</p>
            </div>
          </details>
        </div>
      </section>

      <div class="vrow__links">
        <a :href="s.url" target="_blank" rel="noopener" aria-label="Ouvrir la page du scrutin sur senat.fr (nouvel onglet)">Page du scrutin (senat.fr) ↗</a>
        <a v-if="s.dossierUrl" :href="s.dossierUrl" target="_blank" rel="noopener" aria-label="Ouvrir le dossier législatif sur senat.fr (nouvel onglet)">Dossier législatif ↗</a>
      </div>
    </article>
  </div>

  <div v-else class="wrap">
    <div class="page-head">
      <h1 class="page-title">Scrutin introuvable</h1>
      <p class="page-lede">Ce scrutin n'existe pas ou plus. <RouterLink to="/votes">Revenir à tous les votes</RouterLink>.</p>
    </div>
  </div>
</template>
