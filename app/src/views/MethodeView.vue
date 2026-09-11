<script setup>
import { computed } from "vue";
import { useDataStore } from "../stores/data.js";
import { frDate, n } from "../format.js";

const data = useDataStore();

const scrutins = computed(() => data.scrutinsArray);
const scrutinsCount = computed(() => scrutins.value.length);
const textesCount = computed(() => new Set(scrutins.value.map((s) => s.text)).size);
const votesAnCount = computed(() => {
  const ids = new Set();
  scrutins.value.forEach((s) => {
    if (s.an && s.an.uid) ids.add(s.an.uid);
  });
  const map = data.raw && data.raw.anByText ? data.raw.anByText : {};
  Object.values(map).forEach((list) => list.forEach((a) => ids.add(a.uid)));
  return ids.size;
});
const sujets = computed(() =>
  data.themesSorted.map((t) => ({ ...t, count: data.scrutinsOfTheme(t.id).length }))
);
const sujetsCount = computed(() => data.mainThemes.length);
const periode = computed(() => (data.raw ? data.raw.period : null));
const generated = computed(() => (data.raw ? frDate(data.raw.generatedAt.slice(0, 10)) : ""));
const anSource = computed(() => (data.raw ? data.raw.anSource : null));
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Méthode et sources</h1>
      <p class="page-lede">
        Ce site restitue des votes publics du Sénat et les compare aux votes de l'Assemblée nationale quand il en existe.
        Voici, sans jargon, ce qu'il fait, d'où viennent les données et comment lire les chiffres.
      </p>
    </div>

    <div class="prose">
      <h2>1. Ce que fait ce site — et ce qu'il ne fait pas</h2>
      <p>
        Le site rassemble <b>{{ n(scrutinsCount) }} scrutins publics du Sénat</b>, portant sur
        <b>{{ n(textesCount) }} textes</b>, répartis en <b>{{ n(sujetsCount) }} sujets</b> de la vie quotidienne.
        Il indique ce que change chaque texte, s'il a été adopté ou rejeté au Sénat, et comment chaque groupe
        politique s'est prononcé. Il affiche aussi, lorsqu'ils existent, les votes publics correspondants de
        l'Assemblée nationale (<b>{{ n(votesAnCount) }} votes</b> recensés).
      </p>
      <div class="callout">
        <p><b>Ce que fait ce site</b></p>
        <ul>
          <li>Donner à voir des <b>votes publics</b>, avec leur source officielle et un lien vers la page d'origine.</li>
          <li>Montrer <b>qui a voté pour, contre ou s'est abstenu</b>, groupe par groupe.</li>
          <li>Mettre en regard <b>Sénat et Assemblée nationale</b> sur un même texte, quand un vote de l'Assemblée existe.</li>
        </ul>
      </div>
      <div class="callout">
        <p><b>Ce qu'il ne fait pas</b></p>
        <ul>
          <li>Il ne donne <b>aucune note</b> à un texte, un groupe, un parti ou un élu.</li>
          <li>Il n'établit <b>aucun classement</b> des partis politiques.</li>
          <li>Il ne dit pas <b>pour qui voter</b> et ne formule <b>aucune recommandation de vote</b>.</li>
          <li>Il ne juge pas le contenu des textes : il se contente de restituer des votes.</li>
        </ul>
      </div>

      <h2>2. D'où viennent les données</h2>
      <p>
        Les données sont des <b>données publiques officielles</b>, reprises telles quelles puis reconstituées
        fiche par fiche. Aucune donnée n'est saisie à la main vote par vote.
      </p>
      <div class="kv">
        <div>
          <dt>Sénat</dt>
          <dd>
            Pages officielles des scrutins publics sur <a href="https://www.senat.fr/scrutin-public/scr2025.html" target="_blank" rel="noopener">senat.fr ↗</a>
            (résultats, décomptes par groupe et par sénateur). Données sous <b>Licence Ouverte 2.0</b> (Etalab).
          </dd>
        </div>
        <div>
          <dt>Assemblée nationale</dt>
          <dd>
            <a :href="anSource ? anSource.url : 'https://data.assemblee-nationale.fr/travaux-parlementaires/votes'" target="_blank" rel="noopener">Dumps officiels de l'Assemblée nationale ↗</a>
            (fichiers JSON des scrutins publics, 16<sup>e</sup> et 17<sup>e</sup> législatures), publiés sous
            <b>Licence Ouverte 2.0</b>.
          </dd>
        </div>
        <div>
          <dt>Période couverte</dt>
          <dd v-if="periode">{{ frDate(periode.from) }} → {{ frDate(periode.to) }} · données générées le {{ generated }}.</dd>
          <dd v-else>—</dd>
        </div>
      </div>

      <h2>3. Comment lire une fiche de vote</h2>
      <p>Chaque fiche dépliable se lit de la même façon.</p>
      <div class="kv">
        <div>
          <dt>Adopté / Rejeté</dt>
          <dd>Résultat du scrutin au Sénat, tel qu'indiqué par la source officielle.</dd>
        </div>
        <div>
          <dt>Assemblée</dt>
          <dd>Quand elle apparaît, cette étiquette indique qu'un vote de l'Assemblée nationale est rattaché au texte (avec sa date et son étape).</dd>
        </div>
        <div>
          <dt>Type de vote</dt>
          <dd>
            <b>Ensemble du texte</b> : vote global sur tout le texte ; <b>Article</b> : vote sur un article précis ;
            <b>Amendement</b> : vote sur une modification proposée ; <b>Motion de procédure</b> : motion liée au déroulement des débats.
          </dd>
        </div>
        <div>
          <dt>Origine</dt>
          <dd>
            <b>Projet de loi (gouvernement)</b> : texte déposé par le gouvernement ;
            <b>Proposition de loi (parlementaire)</b> : texte déposé par des parlementaires.
          </dd>
        </div>
        <div>
          <dt>Totaux</dt>
          <dd>Nombre de <b>pour</b>, <b>contre</b>, <b>abstentions</b> et <b>non-votants</b> pour la chambre concernée.</dd>
        </div>
        <div>
          <dt>Barres par groupe</dt>
          <dd>
            Une ligne par groupe, avec les décomptes <b>P</b> (pour), <b>C</b> (contre), <b>A</b> (abstentions) et
            <b>NV</b> (non-votants), le <b>% P</b> (part de « pour » parmi les votes exprimés) et une barre
            <b>proportionnelle à l'effectif du groupe au jour du vote</b>.
          </dd>
        </div>
      </div>
      <p class="note">
        Les pourcentages ne portent jamais sur l'ensemble des sièges : les non-votants sont exclus du calcul du <b>% P</b>.
      </p>

      <h2>4. La superposition Sénat / Assemblée</h2>
      <p>
        Dans chaque fiche, l'interrupteur <b>« Superposer Sénat et Assemblée »</b> remplace les deux blocs séparés par un
        tableau unique : <b>une ligne par groupe</b> et <b>deux colonnes</b> (Sénat, Assemblée nationale).
      </p>
      <ul>
        <li>
          La <b>barre du Sénat</b> montre la répartition du groupe : <b>pour</b> (vert), <b>contre</b> (rouge),
          <b>abstention</b> (gris) et <b>non-votants</b> (hachures claires, absents compris), proportionnellement à
          l'effectif du groupe au jour du vote.
        </li>
        <li>
          Pour l'<b>Assemblée nationale</b>, seul le <b>pourcentage de votes « pour »</b> est affiché (sur les votes émis,
          c'est-à-dire hors non-votants) ; les comptes détaillés sont disponibles au survol.
        </li>
        <li>
          Les groupes sans équivalent dans l'autre chambre (RN, LFI-NFP, AD, UDR à l'Assemblée, par exemple) sont
          affichés <b>en dessous</b> : barre Sénat seule, ou pourcentage Assemblée seul.
        </li>
        <li>Le rapprochement des groupes (LR ↔ DR, SER ↔ SOC, RDPI ↔ EPR, UC ↔ Dem, etc.) est <b>indicatif</b> : les groupes ne sont pas les mêmes dans les deux chambres.</li>
        <li>Les groupes sans équivalent dans l'autre chambre (par exemple RN, LFI-NFP, AD ou UDR à l'Assemblée) sont listés à part, sous le graphique.</li>
        <li>
          L'Assemblée nationale <b>ne vote pas les amendements du Sénat</b>. Pour un amendement ou un article, la barre
          « Assemblée » porte donc sur le <b>vote de l'Assemblée sur le texte</b> — la date et l'étape de ce vote sont
          affichées en tête de la superposition.
        </li>
        <li>Si aucun vote public de l'Assemblée n'est recensé sur le texte, l'interrupteur est <b>désactivé</b>.</li>
      </ul>
      <p class="note">Pour l'activer : ouvrez une fiche, puis cochez « Superposer Sénat et Assemblée » en tête de la fiche.</p>

      <h2>5. Le rattachement des textes aux sujets</h2>
      <p>
        Les textes sont classés dans des sujets <b>automatiquement, par mots-clés</b> (par exemple « immigration »,
        « logement », « santé »). Ce classement est <b>approximatif</b>, en particulier pour les textes transversaux
        qui touchent plusieurs domaines. Le <b>titre officiel</b> du texte et le <b>dossier législatif</b> lié depuis
        la fiche restent la référence.
      </p>
      <p>Répartition actuelle ({{ n(sujetsCount) }} sujets principaux) :</p>
      <ul>
        <li v-for="t in sujets" :key="t.id">
          <b>{{ t.name }}</b> — {{ n(t.count) }} vote{{ t.count > 1 ? "s" : "" }}
        </li>
      </ul>

      <h2>6. Composition du Sénat (et différences avec l'Assemblée)</h2>
      <p>
        La composition des groupes change dans le temps ; les effectifs affichés correspondent à la période couverte.
      </p>
      <div class="kv">
        <div>
          <dt>Sénat</dt>
          <dd>
            {{ n(data.senatorCount) }} sénateurs. Il n'existe <b>aucun groupe LFI</b> au Sénat : la gauche est
            représentée par <b>SER</b> (Socialiste, Écologiste et Républicain), <b>CRCE-K</b>
            (Communiste Républicain Citoyen et Écologiste – Kanaky) et <b>GEST</b> (Écologiste – Solidarité et Territoires).
            Les <b>4 sénateurs RN</b> siègent parmi les non-inscrits (<b>NI</b>) : ils sont sous le seuil de 10 requis
            pour former un groupe.
          </dd>
        </div>
        <div>
          <dt>Groupes du Sénat</dt>
          <dd>
            <span v-for="(g, i) in data.senateGroups" :key="g.key">{{ i ? " · " : "" }}{{ g.short }} ({{ n(g.seats) }})</span>
          </dd>
        </div>
        <div>
          <dt>Assemblée nationale</dt>
          <dd>
            {{ n(data.deputeCount) }} députés. À l'inverse du Sénat, le <b>RN</b> et <b>LFI-NFP</b>
            (La France insoumise – Nouveau Front Populaire) y forment de grands groupes, aux côtés d'EPR, SOC, DR, EcoS, Dem, HOR, LIOT, GDR, UDR et NI.
          </dd>
        </div>
      </div>

      <h2>7. Fiabilité et limites</h2>
      <ul>
        <li>Les sommes sont <b>contrôlées automatiquement</b> lors de la construction : les décomptes par groupe doivent correspondre aux totaux officiels, sans quoi le scrutin est écarté.</li>
        <li><b>Agréger des votes n'est pas résumer un texte</b> : le site ne dit pas ce que « vaut » une loi, seulement comment on a voté.</li>
        <li>Les <b>non-votants sont exclus des pourcentages</b> ; le % P porte sur les votes exprimés (pour + contre).</li>
        <li>Les <b>effectifs des groupes varient dans le temps</b> : une barre est proportionnelle à l'effectif au jour du vote.</li>
        <li>Beaucoup de textes <b>n'ont aucun vote public de l'Assemblée</b> : la comparaison n'est alors pas possible.</li>
        <li>La superposition compare des groupes <b>rapprochés, pas identiques</b> ; elle ne mesure pas une « cohérence » entre chambres.</li>
      </ul>

      <h2>8. Vie privée</h2>
      <p>
        Le site ne dépose <b>aucun cookie</b>, <b>aucun traceur</b> et n'envoie <b>aucune donnée</b> à un serveur.
        Vos préférences (sujets, filtres, choix de superposition, comparaison) sont stockées <b>uniquement dans le
        <code>localStorage</code> de votre appareil</b>, sous la clé <code>senatvote.prefs.v1</code>. Vider les
        données du site dans votre navigateur les efface.
      </p>

      <h2>9. Sources et réutilisation</h2>
      <p>
        Les données proviennent du Sénat et de l'Assemblée nationale et sont réutilisées sous
        <b>Licence Ouverte 2.0 (Etalab)</b>. Vous pouvez les réutiliser à condition de <b>mentionner la source</b>
        (Sénat pour les scrutins du Sénat, Assemblée nationale pour les votes de l'Assemblée) et de ne pas laisser
        croire à une affiliation officielle.
      </p>
      <div class="kv">
        <div>
          <dt>Scrutins du Sénat</dt>
          <dd><a href="https://www.senat.fr/scrutin-public/scr2025.html" target="_blank" rel="noopener">senat.fr/scrutin-public ↗</a></dd>
        </div>
        <div>
          <dt>Votes de l'Assemblée</dt>
          <dd><a href="https://data.assemblee-nationale.fr/travaux-parlementaires/votes" target="_blank" rel="noopener">data.assemblee-nationale.fr ↗</a></dd>
        </div>
        <div>
          <dt>Licence</dt>
          <dd>Licence Ouverte 2.0 (Etalab) — <a href="https://www.etalab.gouv.fr/licence-ouverte-open-licence/" target="_blank" rel="noopener">texte de la licence ↗</a></dd>
        </div>
      </div>
      <p class="note">
        Ce site est un outil citoyen indépendant, sans publicité et sans affiliation avec le Sénat, l'Assemblée
        nationale ou un parti politique.
      </p>
    </div>
  </div>
</template>
