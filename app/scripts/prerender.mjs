/**
 * Prerender — écrit une vraie page HTML par route, après le build Vite.
 *
 * Pourquoi : l'application est une SPA. Le `index.html` produit par Vite ne contient
 * qu'un `<div id="root"></div>` vide et un titre générique : un moteur de recherche y
 * voit une seule page, sans contenu ni liens. Résultat, aucun des 967 scrutins, des
 * 12 sujets ou des 438 sénateurs n'est indexable.
 *
 * Ce script génère, pour chaque route, un fichier `dist/<chemin>/index.html` complet :
 * un titre et une description propres, les balises Open Graph (aperçu de partage),
 * une URL canonique, des données structurées JSON-LD, et surtout un contenu HTML
 * réellement lisible — titre, résumé, tableau des votes, liens internes — que les
 * robots lisent sans exécuter JavaScript. L'application Vue s'installe ensuite
 * par-dessus au chargement, dans le navigateur.
 *
 * Il produit aussi `sitemap.xml` et `robots.txt`.
 *
 *     node scripts/prerender.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(ICI, "..");
const DIST = path.join(APP, "dist");
const PUBLIC = path.join(APP, "public");
const SITE = "https://senat-vote.vercel.app";
const IMAGE_PARTAGE = `${SITE}/og.png`;

const data = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data.json"), "utf8"));
const gabarit = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

const themes = [...(data.themes || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
const themeParId = new Map(themes.map((t) => [t.id, t]));
const scrutins = Object.values(data.scrutins || {});
const groupes = data.groups || [];

/* ------------------------------------------------------------------ outils */

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Réduit un texte à `max` caractères, sans couper au milieu d'un mot. */
function court(texte, max) {
  const t = String(texte ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const espace = coupe.lastIndexOf(" ");
  return (espace > max * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[,;:.]$/, "") + "…";
}

const dateFr = (iso) => {
  if (!iso) return "";
  const [a, m, j] = String(iso).slice(0, 10).split("-");
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
    "août", "septembre", "octobre", "novembre", "décembre"];
  return `${Number(j)} ${mois[Number(m) - 1]} ${a}`;
};

const nombre = (n) => new Intl.NumberFormat("fr-FR").format(Number(n) || 0);

/** Position d'un groupe, résumée en une phrase factuelle. */
function positionGroupe(g) {
  const parts = [];
  if (g.pour) parts.push(`${g.pour} pour`);
  if (g.contre) parts.push(`${g.contre} contre`);
  if (g.abstention) parts.push(`${g.abstention} abstention${g.abstention > 1 ? "s" : ""}`);
  return parts.join(", ") || "aucun vote exprimé";
}

/* --------------------------------------------------------- squelette HTML */

const BALISES_A_REMPLACER = /<title>[\s\S]*?<\/title>|<meta name="description"[^>]*>|<meta name="viewport"[^>]*>/g;

/**
 * Construit la page complète. `contenu` est le HTML placé dans #root : il est lu par
 * les robots, puis remplacé par l'application au montage.
 */
function page({ chemin, titre, description, jsonld, contenu }) {
  const url = SITE + (chemin === "/" ? "/" : chemin);
  const t = court(titre, 62);
  const d = court(description, 155);

  const tete = [
    `<title>${esc(t)}</title>`,
    `<meta name="description" content="${esc(d)}">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Sénat·Vote">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta property="og:title" content="${esc(t)}">`,
    `<meta property="og:description" content="${esc(d)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(IMAGE_PARTAGE)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(t)}">`,
    `<meta name="twitter:description" content="${esc(d)}">`,
    `<meta name="twitter:image" content="${esc(IMAGE_PARTAGE)}">`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : "",
  ].filter(Boolean).join("\n    ");

  let html = gabarit.replace(BALISES_A_REMPLACER, "");
  html = html.replace("</head>", `${tete}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${contenu}</div>`);
  return { chemin, url, html };
}

const fil = (...etapes) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: etapes.map((e, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: e.nom,
    item: SITE + e.chemin,
  })),
});

const pied = `
    <footer>
      <p>Sénat·Vote — données officielles du Sénat et de l'Assemblée nationale.
      Présentation strictement factuelle : aucune note, aucun classement des partis.</p>
      <nav>
        <a href="/votes">Tous les votes</a> ·
        <a href="/groupes">Les groupes</a> ·
        <a href="/comparer">Comparer deux groupes</a> ·
        <a href="/methode">Méthode et sources</a>
      </nav>
      <nav aria-label="Informations légales">
        <a href="/mentions-legales">Mentions légales</a> ·
        <a href="/confidentialite">Confidentialité</a> ·
        <a href="/cookies">Cookies</a>
      </nav>
    </footer>`;

/* ------------------------------------------------------------------ routes */

const pages = [];

/* --- accueil --- */
{
  const sujets = themes.map((t) => {
    const n = scrutins.filter((s) => s.theme === t.id).length;
    return `<li><a href="/sujet/${esc(t.id)}">${esc(t.name)}</a> — ${nombre(n)} scrutins. ${esc(t.description || "")}</li>`;
  }).join("\n        ");

  const contenu = `
    <main>
      <h1>Comment le Sénat et l'Assemblée nationale votent, sujet par sujet</h1>
      <p>Les scrutins publics du Sénat regroupés par texte et classés par sujets de la vie
      quotidienne : ce que change chaque texte, le résultat, et la position de chaque groupe
      politique. Les votes de l'Assemblée nationale sur les mêmes textes sont indiqués
      lorsqu'ils existent.</p>
      <p><strong>${nombre(scrutins.length)} scrutins</strong> du Sénat,
      <strong>${nombre(data.senatorCount || 0)} sénateurs</strong>, du
      ${dateFr(data.period?.from)} au ${dateFr(data.period?.to)}.
      Présentation strictement factuelle : aucune note, aucun classement des partis,
      aucune recommandation de vote.</p>
      <h2>Les ${themes.length} sujets</h2>
      <ul>
        ${sujets}
      </ul>
      <h2>Explorer</h2>
      <ul>
        <li><a href="/votes">Tous les votes du Sénat</a>, filtrables par sujet, groupe et résultat.</li>
        <li><a href="/groupes">Les groupes politiques</a> du Sénat et de l'Assemblée nationale.</li>
        <li><a href="/comparer">Comparer deux groupes</a> : taux d'accord, participation, part de votes pour et contre.</li>
        <li><a href="/methode">Méthode et sources</a> : d'où viennent les données et comment elles sont traitées.</li>
      </ul>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/",
    titre: "Sénat·Vote — les votes du Sénat et de l'Assemblée, sujet par sujet",
    description: `Les ${nombre(scrutins.length)} scrutins publics du Sénat classés par sujets de la vie quotidienne : ce que change chaque texte, le résultat, et la position de chaque groupe politique. Données officielles.`,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Sénat·Vote",
      url: SITE,
      inLanguage: "fr-FR",
      description: "Les scrutins publics du Sénat et de l'Assemblée nationale, classés par sujets de la vie quotidienne.",
      publisher: { "@type": "Organization", name: "Sénat·Vote", url: SITE },
    },
    contenu,
  }));
}

/* --- les 12 sujets --- */
for (const t of themes) {
  const siens = scrutins.filter((s) => s.theme === t.id);
  const adoptes = siens.filter((s) => s.result === "Adoption").length;

  // Position cumulée des groupes sur l'ensemble des scrutins du sujet.
  const cumul = new Map();
  for (const s of siens) {
    for (const g of s.groups || []) {
      const c = cumul.get(g.key) || { pour: 0, contre: 0, abstention: 0 };
      c.pour += g.pour || 0;
      c.contre += g.contre || 0;
      c.abstention += g.abstention || 0;
      cumul.set(g.key, c);
    }
  }
  const lignesGroupes = groupes
    .map((g) => {
      const c = cumul.get(g.key);
      if (!c) return "";
      const exprime = c.pour + c.contre;
      const taux = exprime ? Math.round((c.pour / exprime) * 100) : 0;
      return `<tr><th scope="row">${esc(g.label || g.short)}</th><td>${nombre(c.pour)}</td><td>${nombre(c.contre)}</td><td>${nombre(c.abstention)}</td><td>${taux} %</td></tr>`;
    })
    .filter(Boolean).join("\n          ");

  const liste = siens
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 60)
    .map((s) => `<li><a href="/scrutin/${esc(s.id)}">${esc(court(s.text || s.title, 110))}</a> — ${esc(s.type || "")}, ${esc(s.result || "")}, ${dateFr(s.date)}</li>`)
    .join("\n        ");

  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › ${esc(t.name)}</nav>
      <h1>${esc(t.name)} — les votes du Sénat</h1>
      <p>${esc(t.description || "")} ${nombre(siens.length)} scrutins du Sénat sur ce sujet,
      dont ${nombre(adoptes)} adoptés, du ${dateFr(data.period?.from)} au ${dateFr(data.period?.to)}.</p>
      <h2>Comment chaque groupe a voté sur ce sujet</h2>
      <table>
        <caption>Votes cumulés des groupes sur les ${nombre(siens.length)} scrutins du sujet ${esc(t.name)}</caption>
        <thead><tr><th scope="col">Groupe</th><th scope="col">Pour</th><th scope="col">Contre</th><th scope="col">Abstention</th><th scope="col">Part de pour</th></tr></thead>
        <tbody>
          ${lignesGroupes}
        </tbody>
      </table>
      <h2>Les scrutins les plus récents</h2>
      <ul>
        ${liste}
      </ul>
      <p><a href="/votes">Voir tous les votes du Sénat</a> — filtrables par sujet, groupe et résultat.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: `/sujet/${t.id}`,
    titre: `${t.name} — comment le Sénat a voté`,
    description: `Les ${nombre(siens.length)} scrutins du Sénat sur le sujet « ${t.name} » : ce que change chaque texte, le résultat, et la position de chaque groupe politique. Données officielles.`,
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: t.name, chemin: `/sujet/${t.id}` }),
    contenu,
  }));
}

/* --- liste des votes --- */
{
  const parSujet = themes
    .map((t) => {
      const n = scrutins.filter((s) => s.theme === t.id).length;
      return `<li><a href="/sujet/${esc(t.id)}">${esc(t.name)}</a> — ${nombre(n)} scrutins</li>`;
    })
    .join("\n        ");

  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Tous les votes</nav>
      <h1>Tous les votes du Sénat</h1>
      <p>Les ${nombre(scrutins.length)} scrutins publics du Sénat de la période, du
      ${dateFr(data.period?.from)} au ${dateFr(data.period?.to)} : votes sur l'ensemble d'un texte,
      articles, amendements et motions de procédure. Chaque scrutin donne le résultat, l'origine du
      texte et la répartition des votes par groupe politique.</p>
      <h2>Par sujet</h2>
      <ul>
        ${parSujet}
      </ul>
      <p><a href="/groupes">Les groupes politiques</a> ·
      <a href="/comparer">Comparer deux groupes</a> ·
      <a href="/methode">Méthode et sources</a></p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/votes",
    titre: "Tous les votes du Sénat",
    description: `Les ${nombre(scrutins.length)} scrutins publics du Sénat, par sujet : résultat, origine du texte et répartition des votes par groupe politique.`,
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Tous les votes", chemin: "/votes" }),
    contenu,
  }));
}

/* --- les 967 scrutins --- */
for (const s of scrutins) {
  const t = themeParId.get(s.theme);
  const tot = s.totals || {};
  const lignes = (s.groups || [])
    .map((g) => {
      const groupe = groupes.find((x) => x.key === g.key);
      return `<tr><th scope="row">${esc(groupe?.label || g.key)}</th><td>${nombre(g.pour)}</td><td>${nombre(g.contre)}</td><td>${nombre(g.abstention)}</td><td>${nombre(g.nonVotants)}</td><td>${nombre(g.size)}</td></tr>`;
    })
    .join("\n          ");

  const an = s.an
    ? `<p>Assemblée nationale sur le même texte : <strong>${esc(s.an.result || "")}</strong>, ${dateFr(s.an.date)}${s.an.url ? ` (<a href="${esc(s.an.url)}" rel="nofollow noopener">source officielle</a>)` : ""}.</p>`
    : "";

  const positionsTexte = (s.groups || [])
    .map((g) => {
      const groupe = groupes.find((x) => x.key === g.key);
      return `<li><strong>${esc(groupe?.label || g.key)}</strong> : ${esc(positionGroupe(g))}.</li>`;
    })
    .join("\n        ");

  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="/votes">Votes</a>${t ? ` › <a href="/sujet/${esc(t.id)}">${esc(t.name)}</a>` : ""} › Scrutin</nav>
      <h1>${esc(court(s.text || s.title, 150))}</h1>
      <p><strong>${esc(s.type || "Scrutin")}</strong> — ${esc(s.result || "")}, le ${dateFr(s.date)}.
      ${s.origin ? `Origine : ${esc(s.origin)}.` : ""}
      ${t ? `Sujet : <a href="/sujet/${esc(t.id)}">${esc(t.name)}</a>.` : ""}</p>
      <p>${esc(s.subject || s.title || "")}</p>
      ${s.resume ? `<p>${esc(s.resume)}</p>` : ""}
      <h2>Répartition des votes par groupe</h2>
      <table>
        <caption>${nombre(tot.votants)} votants, ${nombre(tot.exprimes)} suffrages exprimés :
        ${nombre(tot.pour)} pour, ${nombre(tot.contre)} contre, ${nombre(tot.abstention)} abstentions.</caption>
        <thead><tr><th scope="col">Groupe</th><th scope="col">Pour</th><th scope="col">Contre</th><th scope="col">Abstention</th><th scope="col">Non-votants</th><th scope="col">Effectif</th></tr></thead>
        <tbody>
          ${lignes}
        </tbody>
      </table>
      <h2>La position de chaque groupe</h2>
      <ul>
        ${positionsTexte}
      </ul>
      ${an}
      <p><a href="${esc(s.url)}" rel="nofollow noopener">Scrutin officiel sur senat.fr</a>${s.dossierUrl ? ` · <a href="${esc(s.dossierUrl)}" rel="nofollow noopener">Dossier législatif</a>` : ""}</p>
      <p>Les votes nominatifs (nom de chaque sénateur et sa position) sont affichés dans la fiche
      du scrutin, dans l'application.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: `/scrutin/${s.id}`,
    titre: `${court(s.text || s.title, 90)} — ${s.result || ""} (${dateFr(s.date)})`,
    description: `${s.type || "Scrutin"} du ${dateFr(s.date)} : ${court(s.text || s.title, 100)} — ${s.result || ""}. Répartition des votes par groupe politique du Sénat.`,
    jsonld: fil(
      { nom: "Accueil", chemin: "/" },
      { nom: "Tous les votes", chemin: "/votes" },
      ...(t ? [{ nom: t.name, chemin: `/sujet/${t.id}` }] : []),
      { nom: `Scrutin ${s.id}`, chemin: `/scrutin/${s.id}` },
    ),
    contenu,
  }));
}

/* --- les groupes --- */
{
  const lignes = groupes
    .map((g) => `<li><strong>${esc(g.label || g.short)}</strong> — ${nombre(g.seats)} sièges, ${nombre(g.members?.length || g.seats)} membres.</li>`)
    .join("\n        ");
  const an = (data.anGroups || [])
    .map((g) => `<li><strong>${esc(data.anGroupLabels?.[g.key] || g.label || g.key)}</strong> — ${nombre(g.seats)} sièges à l'Assemblée nationale.</li>`)
    .join("\n        ");

  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Les groupes</nav>
      <h1>Les groupes politiques du Sénat et de l'Assemblée nationale</h1>
      <p>Les scrutins sont présentés par groupe politique : c'est la seule lecture qui montre une
      position collective, un sénateur votant d'abord avec son groupe. Voici les
      ${groupes.length} groupes du Sénat et les ${(data.anGroups || []).length} groupes de
      l'Assemblée nationale.</p>
      <h2>Groupes du Sénat</h2>
      <ul>
        ${lignes}
      </ul>
      <h2>Groupes de l'Assemblée nationale</h2>
      <ul>
        ${an}
      </ul>
      <p><a href="/comparer">Comparer deux groupes</a> : taux d'accord, participation, part de votes pour et contre.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/groupes",
    titre: "Les groupes politiques du Sénat et de l'Assemblée",
    description: `Les ${groupes.length} groupes du Sénat et les ${(data.anGroups || []).length} groupes de l'Assemblée nationale : effectifs et composition.`,
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Les groupes", chemin: "/groupes" }),
    contenu,
  }));
}

/* --- comparer --- */
{
  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Comparer</nav>
      <h1>Comparer deux groupes politiques</h1>
      <p>Choisissez deux groupes et une liste de sujets : la page calcule leur
      <strong>taux d'accord</strong> sur les scrutins où les deux se sont prononcés, leur
      <strong>participation</strong>, et la part de votes pour et contre de chacun. Aucune note,
      aucun classement : uniquement des comptages sur les votes publiés.</p>
      <p>La comparaison porte sur les ${nombre(scrutins.length)} scrutins de la période, du
      ${dateFr(data.period?.from)} au ${dateFr(data.period?.to)}.</p>
      <p><a href="/groupes">Voir la composition des groupes</a> ·
      <a href="/methode">Méthode et sources</a></p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/comparer",
    titre: "Comparer deux groupes politiques — Sénat·Vote",
    description: "Taux d'accord, participation et part de votes pour et contre entre deux groupes politiques, calculés sur les scrutins publics du Sénat. Aucun classement.",
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Comparer", chemin: "/comparer" }),
    contenu,
  }));
}

/* --- méthode --- */
{
  const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Méthode</nav>
      <h1>Méthode et sources</h1>
      <p>Les données viennent des publications officielles : les scrutins publics du Sénat, et les
      votes de l'Assemblée nationale issus des données ouvertes (${esc(data.anSource?.license || "Licence Ouverte")}).
      Rien n'est saisi à la main ni estimé.</p>
      <h2>Comment les scrutins sont regroupés</h2>
      <p>Chaque scrutin est rattaché au texte qu'il concerne (dossier législatif), puis classé dans
      l'un des ${themes.length} sujets selon l'objet du texte. Un texte peut concerner plusieurs
      sujets ; le classement retient le principal.</p>
      <h2>Ce que le site ne fait pas</h2>
      <p>Aucune note, aucun classement des partis, aucune recommandation de vote, aucune
      interprétation des intentions. Le site présente des comptages de votes publiés et des
      résumés factuels des textes.</p>
      <h2>Sources</h2>
      <ul>
        <li><a href="https://www.senat.fr/scrutin-public/" rel="nofollow noopener">Scrutins publics du Sénat</a></li>
        <li><a href="${esc(data.anSource?.url || "https://data.assemblee-nationale.fr/")}" rel="nofollow noopener">${esc(data.anSource?.label || "Assemblée nationale — données ouvertes")}</a></li>
        ${data.opinion?.primary ? `<li>${esc(data.opinion.primary.label)} (${esc(data.opinion.primary.date)}) — ${esc(data.opinion.primary.question)} : sert à ordonner les sujets, pas à les noter.</li>` : ""}
      </ul>
      <p>Dernière mise à jour des données : ${dateFr((data.generatedAt || "").slice(0, 10))}.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/methode",
    titre: "Méthode et sources — Sénat·Vote",
    description: "D'où viennent les données (scrutins publics du Sénat, données ouvertes de l'Assemblée nationale), comment les textes sont classés par sujet, et ce que le site ne fait pas.",
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Méthode", chemin: "/methode" }),
    contenu,
  }));
}

/* --- pages légales : mentions, confidentialité, cookies --- */
{
  const mentions = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Mentions légales</nav>
      <h1>Mentions légales</h1>
      <p>Sénat·Vote est un site d'information citoyen indépendant consacré aux votes publics du Sénat et de l'Assemblée
      nationale. Dernière mise à jour : 3 novembre 2026.</p>
      <h2>Éditeur du site</h2>
      <ul>
        <li><strong>Éditeur</strong> : Jean-François Foissac, particulier — site édité à titre personnel et non professionnel.</li>
        <li><strong>Adresse</strong> : Caen, France.</li>
        <li><strong>Contact</strong> : <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a>.</li>
        <li><strong>Directeur de la publication</strong> : Jean-François Foissac.</li>
        <li><strong>Immatriculation</strong> : SIRET, RCS, numéro de TVA intracommunautaire : <strong>À VENIR</strong>.</li>
      </ul>
      <h2>Hébergeur</h2>
      <p><strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —
      <a href="https://vercel.com" rel="noopener">vercel.com</a>. Le site est une application statique : les pages sont
      générées à l'avance et servies par le réseau de l'hébergeur ; aucun serveur applicatif propre à l'éditeur ne traite
      les visites.</p>
      <h2>Propriété intellectuelle</h2>
      <p>La structure du site, son interface, ses graphismes et les textes éditoriaux qui ne proviennent pas des sources
      officielles sont l'œuvre de l'éditeur. Les <strong>données de vote</strong> sont des données publiques issues du
      Sénat et de l'Assemblée nationale : elles restent soumises à leurs licences respectives.</p>
      <h2>Sources et licences</h2>
      <ul>
        <li><a href="https://www.senat.fr/scrutin-public/" rel="noopener">Scrutins publics du Sénat</a> — réutilisés sous
        <strong>Licence Ouverte 2.0</strong> (Etalab). Source : Sénat français.</li>
        <li><a href="https://data.assemblee-nationale.fr/travaux-parlementaires/votes" rel="noopener">Votes de l'Assemblée
        nationale</a> — réutilisés sous <strong>Licence Ouverte 2.0</strong>. Source : Assemblée nationale.</li>
        <li><a href="https://www.senat.fr/api-senat" rel="noopener">API officielle du Sénat</a> — fiches et photos des
        sénateurs.</li>
      </ul>
      <p>Toute réutilisation des données doit mentionner la source et ne pas laisser croire à une affiliation officielle.</p>
      <h2>Liens externes</h2>
      <p>Les liens vers le Sénat, l'Assemblée nationale, la CNIL et l'hébergeur permettent de vérifier les informations à
      la source. L'éditeur ne contrôle pas ces sites et n'est pas responsable de leur contenu.</p>
      <h2>Données personnelles et cookies</h2>
      <p>Le site ne collecte aucune donnée personnelle et ne dépose aucun cookie. Voir
      <a href="/confidentialite">Confidentialité</a> et <a href="/cookies">Cookies et stockage local</a>.</p>
      <p>Sénat·Vote n'est affilié ni au Sénat, ni à l'Assemblée nationale, ni à un parti politique, ni à un institut de
      sondage.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/mentions-legales",
    titre: "Mentions légales — Sénat·Vote",
    description: "Éditeur, contact, directeur de la publication, hébergeur (Vercel Inc.), propriété intellectuelle, sources et licences des données du site Sénat·Vote.",
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Mentions légales", chemin: "/mentions-legales" }),
    contenu: mentions,
  }));

  const confidentialite = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Confidentialité</nav>
      <h1>Confidentialité et données personnelles</h1>
      <p>Ce site ne collecte aucune donnée personnelle : ni compte, ni formulaire, ni newsletter, ni mesure d'audience,
      ni publicité. Dernière mise à jour : 3 novembre 2026.</p>
      <h2>Ce que le site ne collecte pas</h2>
      <ul>
        <li>Aucun compte et aucune identification : le site se consulte sans se connecter.</li>
        <li>Aucun formulaire de contact, d'inscription ou de commentaire.</li>
        <li>Aucun outil de mesure d'audience : personne ne compte les visites.</li>
        <li>Aucun cookie, aucun traceur publicitaire, aucun profilage.</li>
        <li>Aucune newsletter et aucune transmission d'adresse e-mail depuis le site.</li>
      </ul>
      <p>Les seules données disponibles pour l'éditeur sont celles qu'un visiteur choisit de lui envoyer par e-mail, par
      exemple pour signaler une erreur ; elles ne servent qu'à répondre à ce message.</p>
      <h2>Ce qui reste sur votre appareil</h2>
      <p>Vos préférences d'affichage sont mémorisées dans le <code>localStorage</code> du navigateur, sur votre appareil
      uniquement : <code>senatvote.prefs.v1</code> (sujets, filtres, comparaison, superposition) et
      <code>senatvote.avis-cookies.v1</code> (bandeau d'information déjà lu). Rien n'est envoyé à l'éditeur ni à un tiers.</p>
      <h2>Journaux serveur de l'hébergeur</h2>
      <p>Comme tout site web, l'accès aux pages passe par l'hébergeur <strong>Vercel Inc.</strong>, qui tient des journaux
      techniques (adresse IP, date et heure, page demandée, caractéristiques du navigateur) pendant <strong>30 jours</strong>,
      pour la sécurité et le diagnostic. Base légale : intérêt légitime (article 6.1.f du RGPD). Aucune exploitation
      commerciale, aucune mesure d'audience.</p>
      <h2>Polices d'écriture</h2>
      <p>Les polices Fraunces et Inter sont chargées depuis Google Fonts ; cette requête transmet votre adresse IP à
      Google, sans cookie ni identifiant, et n'est utilisée par l'éditeur pour aucune mesure.</p>
      <h2>Vos droits</h2>
      <p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité.
      Écrivez à <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a> : réponse sous un mois. En pratique, le site
      ne conservant aucune donnée, ces droits s'exercent surtout auprès de l'hébergeur pour ses journaux techniques.</p>
      <h2>Réclamation</h2>
      <p>Vous pouvez saisir la CNIL — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —
      <a href="https://www.cnil.fr/fr/plaintes" rel="noopener">cnil.fr/fr/plaintes</a>.</p>
      <p>Voir aussi : <a href="/mentions-legales">Mentions légales</a> · <a href="/cookies">Cookies et stockage local</a>.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/confidentialite",
    titre: "Confidentialité et données personnelles — Sénat·Vote",
    description: "Aucune donnée personnelle collectée, aucun cookie : journaux techniques de l'hébergeur (30 jours), stockage local des préférences, droits RGPD et contact CNIL.",
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Confidentialité", chemin: "/confidentialite" }),
    contenu: confidentialite,
  }));

  const cookies = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Cookies</nav>
      <h1>Cookies et stockage local</h1>
      <p>Sénat·Vote ne dépose <strong>aucun cookie</strong> : ni cookie de session, ni cookie de mesure d'audience, ni
      cookie publicitaire. Dernière mise à jour : 3 novembre 2026.</p>
      <h2>Aucun cookie posé par le site</h2>
      <ul>
        <li>Cookie de session : aucun — le site n'a ni compte ni espace connecté.</li>
        <li>Mesure d'audience : aucune — ni Google Analytics, ni Matomo, ni équivalent.</li>
        <li>Publicité et profilage : aucun — pas de régie, pas de pixel, pas de partage avec un annonceur.</li>
        <li>Cookies tiers : aucun cookie tiers déposé par le site ; les polices Google Fonts sont chargées sans cookie.</li>
      </ul>
      <p>Vérifiable dans les outils de développement du navigateur, onglet « Application », rubrique « Cookies » : aucune
      entrée n'est créée pour ce site.</p>
      <h2>Ce que le site stocke dans votre navigateur</h2>
      <ul>
        <li><code>senatvote.prefs.v1</code> — sujets suivis, filtres de la page Votes, comparaison, superposition
        Sénat / Assemblée. Conservé jusqu'à effacement des données du site, jamais transmis.</li>
        <li><code>senatvote.avis-cookies.v1</code> — valeur « vu » lorsque le bandeau d'information est fermé, pour ne pas
        le réafficher. Conservé jusqu'à effacement, jamais transmis.</li>
      </ul>
      <p>Ce ne sont pas des cookies : ces clés restent sur l'appareil et ne permettent pas de vous suivre.</p>
      <h2>Le bandeau d'information</h2>
      <p>Le site ne posant aucun cookie, il n'y a rien à accepter ni à refuser : le bandeau de première visite est
      purement informatif. « J'ai compris » ne vaut pas consentement et ne bloque aucun contenu.</p>
      <h2>Comment effacer ces préférences</h2>
      <p>Réglages du navigateur → « Confidentialité et sécurité » → « Effacer les données de navigation », en cochant
      « Données des sites » ou « Stockage local ». Effacement ciblé possible dans l'onglet « Application » des outils de
      développement. En navigation privée, le stockage est effacé à la fermeture de la fenêtre.</p>
      <p>Questions : <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a>. Voir aussi
      <a href="/confidentialite">Confidentialité</a> et <a href="/mentions-legales">Mentions légales</a>.</p>
    </main>
    ${pied}`;

  pages.push(page({
    chemin: "/cookies",
    titre: "Cookies et stockage local — Sénat·Vote",
    description: "Aucun cookie posé par Sénat·Vote : ni session, ni mesure d'audience, ni publicité. Les préférences de filtres restent en localStorage, non traçant et effaçable.",
    jsonld: fil({ nom: "Accueil", chemin: "/" }, { nom: "Cookies et stockage local", chemin: "/cookies" }),
    contenu: cookies,
  }));
}

/* --- les sénateurs (une page par élu) --- */
{
  const dossier = path.join(PUBLIC, "senateurs");
  const fichiers = fs.existsSync(dossier) ? fs.readdirSync(dossier).filter((f) => f.endsWith(".json")) : [];
  let ajoutees = 0;

  for (const f of fichiers) {
    let p;
    try {
      p = JSON.parse(fs.readFileSync(path.join(dossier, f), "utf8"));
    } catch {
      continue;
    }
    if (!p?.slug || !p?.name) continue;

    const st = p.stats || {};
    const participation = st.n ? Math.round(((st.n - (st.nv || 0)) / st.n) * 100) : 0;
    const recents = (p.votes || []).slice(-25).reverse();

    const lignes = recents
      .map((v) => {
        const s = data.scrutins?.[v.i];
        const sens = { P: "pour", C: "contre", A: "abstention", NV: "non-votant" }[v.p] || v.p;
        return `<li><a href="/scrutin/${esc(v.i)}">${esc(court(s?.text || s?.title || `Scrutin ${v.i}`, 100))}</a> — ${esc(sens)}, ${dateFr(s?.date)}</li>`;
      })
      .join("\n        ");

    const contenu = `
    <main>
      <nav aria-label="Fil d'Ariane"><a href="/">Accueil</a> › Sénateur</nav>
      <h1>${esc(p.name)}</h1>
      <p>Sénateur ou sénatrice : ${nombre(st.n)} scrutins de la période,
      ${nombre(st.p)} votes pour, ${nombre(st.c)} contre, ${nombre(st.a)} abstentions,
      ${nombre(st.nv)} non-votants — soit une participation de ${participation} %.</p>
      <h2>Ses votes les plus récents</h2>
      <ul>
        ${lignes}
      </ul>
      <p><a href="/votes">Tous les votes du Sénat</a> ·
      <a href="/groupes">Les groupes politiques</a></p>
    </main>
    ${pied}`;

    pages.push(page({
      chemin: `/senateur/${p.slug}`,
      titre: `${p.name} — ses votes au Sénat`,
      description: `Les votes de ${p.name} au Sénat : ${nombre(st.n)} scrutins, participation de ${participation} %, et le détail de ses positions les plus récentes.`,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Person",
        name: p.name,
        url: `${SITE}/senateur/${p.slug}`,
        jobTitle: "Sénateur",
        affiliation: { "@type": "GovernmentOrganization", name: "Sénat français" },
      },
      contenu,
    }));
    ajoutees += 1;
  }
  console.log(`  sénateurs : ${ajoutees} pages`);
}

/* ------------------------------------------------------------- écriture */

let ecrites = 0;
for (const p of pages) {
  const cible = p.chemin === "/"
    ? path.join(DIST, "index.html")
    : path.join(DIST, p.chemin.replace(/^\//, ""), "index.html");
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, p.html, "utf8");
  ecrites += 1;
}

/* --- sitemap --- */
const priorite = (chemin) =>
  chemin === "/" ? "1.0"
    : chemin.startsWith("/sujet/") ? "0.8"
      : chemin.startsWith("/scrutin/") ? "0.6"
        : ["/mentions-legales", "/confidentialite", "/cookies"].includes(chemin) ? "0.3"
          : "0.7";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${p.url}</loc>
    <lastmod>${(data.generatedAt || new Date().toISOString()).slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priorite(p.chemin)}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemap, "utf8");

const robots = `# Sénat·Vote
User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
fs.writeFileSync(path.join(DIST, "robots.txt"), robots, "utf8");

console.log(`Prerender : ${ecrites} pages, sitemap.xml (${pages.length} URL), robots.txt`);
