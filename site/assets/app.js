/* Sénat·Vote — application (vanilla JS, routage par hash). Présentation factuelle. */
(function () {
  "use strict";

  var DATA = window.SENAT_DATA;
  var app = document.getElementById("app");
  if (!DATA) {
    app.innerHTML = '<p class="empty">Données introuvables. Vérifiez que <code>data.js</code> est chargé.</p>';
    return;
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var nf = new Intl.NumberFormat("fr-FR");
  function n(x) { return nf.format(x || 0); }
  var dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  var dateShort = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  function frDate(iso) { return iso ? dateFmt.format(new Date(iso + "T12:00:00")) : ""; }
  function frDateShort(iso) { return iso ? dateShort.format(new Date(iso + "T12:00:00")) : ""; }
  function pct(a, b) { return b ? Math.round((100 * a) / b) : 0; }

  var senateGroups = DATA.groups.slice().sort(function (a, b) { return b.seats - a.seats; });
  var groupMeta = {};
  DATA.groups.forEach(function (g) { groupMeta[g.key] = g; });
  var themesSorted = DATA.themes.slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });

  function themeById(id) { return DATA.themes.find(function (t) { return t.id === id; }) || null; }
  function scrutinsOf(theme) { return theme.scrutins.map(function (id) { return DATA.scrutins[id]; }).filter(Boolean); }
  function byDateDesc(a, b) { return (b.date || "").localeCompare(a.date || ""); }

  var ICONS = {
    euro: '<path d="M17.5 8.6A6.5 6.5 0 1 0 17.5 15.4"/><path d="M5.5 11h8.5M5.5 13.5h8"/>',
    heart: '<path d="M12 20s-7.3-4.4-9.2-8.2A5 5 0 0 1 12 6.6a5 5 0 0 1 9.2 5.2C19.3 15.6 12 20 12 20z"/>',
    book: '<path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 0-2 2z"/><path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 1 2 2z"/>',
    home: '<path d="m4 11 8-6.5L20 11"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M3.5 12h17"/>',
    leaf: '<path d="M5 19C5 10 11.5 5.2 20 4.5 19 13.5 15 19.5 6.5 19.5z"/><path d="M5 19c3.2-5.2 7.2-8.2 11-9.5"/>',
    wheat: '<path d="M12 21V9"/><path d="M12 9c-2.5 0-3.5-2-3.5-4.5C11 4.5 12 6.5 12 9zM12 9c2.5 0 3.5-2 3.5-4.5C13 4.5 12 6.5 12 9z"/><path d="M12 15c-2.5 0-3.5-2-3.5-4.5 2.5 0 3.5 2 3.5 4.5zM12 15c2.5 0 3.5-2 3.5-4.5-2.5 0-3.5 2-3.5 4.5z"/>',
    users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19.5c0-2.2-.7-3.9-2-5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.8 3.4 2.8 13.6 0 17-2.8-3.4-2.8-13.6 0-17z"/>',
    scale: '<path d="M12 4.5v15M6 8.5h12M8.5 19.5h7"/><path d="m6 8.5-2.5 5h5zM18 8.5l-2.5 5h5z"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.scale) + "</svg>";
  }

  function senateGroup(g) {
    var m = groupMeta[g.key] || {};
    return { key: g.key, label: g.label || m.label || g.key, short: m.short || g.key, color: m.color || "#8B95A9",
             size: g.size, pour: g.pour, contre: g.contre, abstention: g.abstention, nonVotants: g.nonVotants };
  }

  function resultBadge(chamber, result, extra) {
    var cls = result === "Adoption" ? "b--adopted" : "b--rejected";
    var label = result === "Adoption" ? "Adopté" : "Rejeté";
    return '<span class="b ' + cls + '">' + esc(chamber) + " · " + label + (extra ? " " + esc(extra) : "") + "</span>";
  }
  function originBadge(origin) {
    var label = origin === "Gouvernement" ? "Projet de loi (gouvernement)" : origin === "Parlementaire" ? "Proposition de loi (parlementaire)" : origin;
    return '<span class="b b--origin">' + esc(label) + "</span>";
  }

  /* ---------- Graphiques : comment les groupes ont voté ---------- */
  function themeChartRows(theme, chamber) {
    var acc = {};
    scrutinsOf(theme).forEach(function (s) {
      var groups = chamber === "senat" ? s.groups.map(senateGroup) : (s.an ? s.an.groups : []);
      groups.forEach(function (g) {
        if (!acc[g.key]) acc[g.key] = { key: g.key, short: g.short || g.key, label: g.label, color: g.color, pour: 0, contre: 0, abs: 0 };
        var a = acc[g.key];
        a.pour += g.pour; a.contre += g.contre; a.abs += g.abstention;
      });
    });
    var rows = Object.keys(acc).map(function (k) {
      var a = acc[k];
      var denom = a.pour + a.contre + a.abs;
      a.pctPour = denom ? Math.round((100 * a.pour) / denom) : 0;
      a.pctContre = denom ? Math.round((100 * a.contre) / denom) : 0;
      a.pctAbs = denom ? 100 - a.pctPour - a.pctContre : 0;
      a.votes = denom;
      return a;
    }).filter(function (a) { return a.votes > 0; });
    rows.sort(function (x, y) { return y.votes - x.votes; });
    return rows;
  }

  function renderChart(rows) {
    if (!rows.length) return '<p class="empty">Aucune donnée pour ce graphique.</p>';
    var yl = [100, 75, 50, 25].map(function (v) { return '<span style="top:' + (100 - v) + '%">' + v + "</span>"; }).join("") + '<span style="top:100%">0</span>';
    var cols = rows.map(function (r) {
      var segs = "";
      function seg(cls, h, value, showPct) {
        if (h <= 0) return "";
        return '<div class="col__seg ' + cls + '" style="height:' + h + '%">' + (showPct && h >= 14 ? '<span class="col__pct">' + value + " %</span>" : "") + "</div>";
      }
      var dominant = Math.max(r.pctPour, r.pctContre, r.pctAbs);
      segs += seg("col__seg--unfav", r.pctContre, r.pctContre, r.pctContre === dominant);
      segs += seg("col__seg--abs", r.pctAbs, r.pctAbs, r.pctAbs === dominant);
      segs += seg("col__seg--fav", r.pctPour, r.pctPour, r.pctPour === dominant);
      return '<div class="col" style="--c:' + r.color + '" title="' + esc(r.label + " : " + r.pctPour + " % pour, " + r.pctContre + " % contre, " + r.pctAbs + " % abstention") + '">' +
        '<div class="col__stack">' + segs + "</div>" +
        '<div class="col__label"><span class="col__dot"></span>' + esc(r.short) + "</div></div>";
    }).join("");
    return '<div class="chart">' +
      '<div class="chart__ylabels">' + yl + "</div>" +
      '<div class="chart__grid"></div>' +
      '<div class="chart__scroll"><div class="chart__plot">' + cols + "</div></div></div>" +
      '<div class="chart-legend"><span><i class="l-fav"></i>Ont voté pour</span><span><i class="l-abs"></i>Abstention</span><span><i class="l-unfav"></i>Ont voté contre</span></div>';
  }

  function groupBars(groups) {
    var list = groups.slice().sort(function (a, b) { return (b.size || 0) - (a.size || 0); });
    return list.map(function (g) {
      var size = g.size || (g.pour + g.contre + g.abstention + g.nonVotants);
      var w = function (v) { return size ? (100 * v) / size : 0; };
      var seg = "";
      if (g.pour) seg += '<span class="gbar__seg gbar__seg--pour" style="width:' + w(g.pour) + '%"></span>';
      if (g.contre) seg += '<span class="gbar__seg gbar__seg--contre" style="width:' + w(g.contre) + '%"></span>';
      if (g.abstention) seg += '<span class="gbar__seg gbar__seg--abs" style="width:' + w(g.abstention) + '%"></span>';
      if (g.nonVotants) seg += '<span class="gbar__seg gbar__seg--nv" style="width:' + w(g.nonVotants) + '%"></span>';
      var exp = g.pour + g.contre;
      return '<div class="gbar">' +
        '<span class="gbar__tag"><span class="gbar__dot" style="background:' + g.color + '"></span>' + esc(g.short || g.key) + "</span>" +
        '<div class="gbar__stack" role="img" aria-label="' + esc(g.label + " : " + g.pour + " pour, " + g.contre + " contre, " + g.abstention + " abstentions, " + g.nonVotants + " non-votants") + '">' + seg + "</div>" +
        '<div class="gbar__counts"><span class="p"><b>' + n(g.pour) + "</b> P</span><span class=\"c\"><b>" + n(g.contre) + "</b> C</span><span><b>" + n(g.abstention) + "</b> A</span><span><b>" + n(g.nonVotants) + "</b> NV</span>" + (exp ? '<span>' + pct(g.pour, exp) + " % P</span>" : "") + "</div></div>";
    }).join("");
  }

  function totalsChips(t) {
    return '<div class="totals">' +
      '<span class="tot tot--pour"><b>' + n(t.pour) + "</b> pour</span>" +
      '<span class="tot tot--contre"><b>' + n(t.contre) + "</b> contre</span>" +
      '<span class="tot"><b>' + n(t.abstention) + "</b> abst.</span>" +
      '<span class="tot"><b>' + n(t.nonVotants) + "</b> non-votants</span>" +
      '<span class="tot">' + n(t.votants) + " votants</span></div>";
  }

  function voteRow(s, opts) {
    opts = opts || {};
    var theme = themeById(s.theme);
    var meta = resultBadge("Sénat", s.result);
    meta += s.an ? '<span class="b b--an">AN · ' + (s.an.result === "Adoption" ? "adopté" : "rejeté") + " · " + esc(s.an.stage) + "</span>" : '<span class="b b--an">AN · pas de vote public</span>';
    meta += originBadge(s.origin);

    var senat = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Sénat<small>' + esc(frDate(s.date)) + "</small></div>" + resultBadge("Sénat", s.result) + "</div>" +
      totalsChips(s.totals) + groupBars(s.groups.map(senateGroup)) +
      '<div class="vrow__links"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">Page du scrutin (senat.fr) ↗</a>' +
      (s.dossierUrl ? '<a href="' + esc(s.dossierUrl) + '" target="_blank" rel="noopener">Dossier législatif ↗</a>' : "") + "</div></div>";

    var anBlock;
    if (s.an) {
      anBlock = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>' + esc(frDate(s.an.date)) + " · " + esc(s.an.stage) + " · " + s.an.legislature + "ᵉ législature</small></div>" + resultBadge("AN", s.an.result) + "</div>" +
        totalsChips(s.an.totals) + groupBars(s.an.groups) +
        (s.anNote ? '<p class="note" style="margin:10px 0 0">' + esc(s.anNote) + "</p>" : "") +
        '<div class="vrow__links"><a href="' + esc(s.an.url) + '" target="_blank" rel="noopener">Page du vote (Assemblée nationale) ↗</a></div></div>';
    } else {
      anBlock = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>Aucun vote public recensé sur ce texte</small></div></div>' +
        '<p class="chamber__empty">Le texte n\'a pas fait l\'objet d\'un vote public de l\'Assemblée nationale dans les données officielles (navette en cours, rejet au Sénat, ou adoption sans scrutin public sur l\'ensemble).</p></div>';
    }

    return '<article class="vrow' + (opts.open ? " is-open" : "") + '" id="v-' + esc(s.id) + '">' +
      '<button class="vrow__head" data-toggle aria-expanded="' + (opts.open ? "true" : "false") + '">' +
        '<span class="vrow__eyebrow">' + (theme ? '<span class="miniicon" style="background:' + theme.pastel + '">' + icon(theme.icon) + "</span>" + esc(theme.name) : "Scrutin") + "</span>" +
        '<span class="vrow__title">' + esc(s.title.replace(/^sur /, "Sur ")) + "</span>" +
        '<span class="vrow__meta">' + meta + '<span class="vrow__date">' + esc(frDateShort(s.date)) + '</span><span class="vrow__chev">▾</span></span>' +
      "</button>" +
      '<div class="vrow__body">' +
        '<p class="resume"><b>Ce que change le texte</b>' + esc(s.resume) + "</p>" +
        '<div class="chambers">' + senat + anBlock + "</div></div>" +
      "</article>";
  }

  /* ---------- Accueil ---------- */
  function homePage() {
    var sujets = themesSorted.map(function (t) {
      var withAn = scrutinsOf(t).filter(function (s) { return s.an; }).length;
      return '<a class="sujet" href="#/sujet/' + encodeURIComponent(t.id) + '">' +
        '<span class="sujet__icon" style="background:' + t.pastel + '">' + icon(t.icon) + "</span>" +
        '<span><span class="sujet__name">' + esc(t.name) + '</span><span class="sujet__meta">' + t.scrutins.length + " scrutin" + (t.scrutins.length > 1 ? "s" : "") + " · " + withAn + " avec vote de l'Assemblée</span></span>" +
        '<span class="sujet__arrow">→</span></a>';
    }).join("");

    var latest = Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).sort(byDateDesc).slice(0, 5);
    var anCount = Object.keys(DATA.scrutins).filter(function (k) { return DATA.scrutins[k].an; }).length;

    return '<div class="home">' +
      '<div class="home__left">' +
        '<span class="home__kicker">Observatoire citoyen · Sénat & Assemblée</span>' +
        '<h1 class="home__title">Ce que votent le Sénat et l\'Assemblée, sujet par sujet</h1>' +
        '<p class="home__lede">Les scrutins publics classés par sujets de la vie quotidienne. Pour chaque vote : ce que change le texte, le résultat, et la position de chaque groupe politique.</p>' +
        '<form class="home__search" data-search><input type="search" placeholder="Un sujet, un vote, un groupe…" aria-label="Rechercher un vote"><button class="btn btn--black" type="submit">Rechercher</button></form>' +
        '<a class="home__card" href="#/votes"><strong>Parcourir tous les votes, texte par texte</strong><span>Voir les scrutins →</span></a>' +
      "</div>" +
      '<div class="home__right">' +
        '<div class="section-head"><h2>Les sujets</h2><p class="note">' + themesSorted.length + " sujets de la vie quotidienne</p></div>" +
        sujets +
        '<p style="margin-top:16px"><a class="btn btn--black" href="#/votes">Voir tous les votes</a></p>' +
      "</div></div>" +
      '<div class="wrap"><div class="stats">' +
        '<span class="stat"><b>' + Object.keys(DATA.scrutins).length + "</b> scrutins analysés</span>" +
        '<span class="stat"><b>' + anCount + "</b> croisés avec l'Assemblée nationale</span>" +
        '<span class="stat"><b>' + n(DATA.senatorCount) + "</b> sénateurs · <b>" + n(DATA.deputeCount) + "</b> députés</span>" +
        '<span class="stat">Mis à jour le <b>' + esc(frDate(DATA.generatedAt.slice(0, 10))) + "</b></span></div>" +
        '<section class="section"><div class="section-head"><h2>Derniers votes</h2><p class="note"><a href="#/votes">Tous les votes</a></p></div><div class="vlist">' + latest.map(function (s) { return voteRow(s); }).join("") + "</div></section>" +
      "</div>";
  }

  /* ---------- Page sujet ---------- */
  var themeState = { chamber: "senat" };

  function themeChartArea(theme) {
    var hasAn = scrutinsOf(theme).some(function (s) { return s.an; });
    var chamber = hasAn ? themeState.chamber : "senat";
    var nScrutins = scrutinsOf(theme).length;
    var head = '<div class="chart-card__head"><div><h2>' + (chamber === "senat" ? "Comment le Sénat a voté" : "Comment l'Assemblée nationale a voté") + " sur ces textes</h2>" +
      '<p class="note">En % des votes émis par groupe (pour + contre + abstentions), sur ' + nScrutins + " scrutin" + (nScrutins > 1 ? "s" : "") + ".</p></div>" +
      '<div class="segmented" role="group" aria-label="Chambre">' +
        '<button data-chamber="senat" class="' + (chamber === "senat" ? "is-on" : "") + '">Sénat</button>' +
        '<button data-chamber="an" class="' + (chamber === "an" ? "is-on" : "") + '"' + (hasAn ? "" : " disabled") + '>Assemblée nationale</button>' +
      "</div></div>";
    return head + renderChart(themeChartRows(theme, chamber)) +
      '<p class="note" style="margin-top:12px">Les barres indiquent la répartition des votes de chaque groupe, sans jugement sur le sens des textes. Les non-votants sont exclus des pourcentages.</p>';
  }

  function themePage(id, openSid) {
    var t = themeById(id);
    if (!t) return notFound();
    var scrutins = scrutinsOf(t).sort(byDateDesc);
    var withAn = scrutins.filter(function (s) { return s.an; }).length;
    var cards = scrutins.map(function (s) { return voteRow(s, { open: s.id === openSid }); }).join("");
    var concern = t.concern ? '<span class="chip">Sujet cité par <b>' + t.concern.value + " %</b> (" + esc(t.concern.source) + " " + esc(t.concern.date) + ")</span>" : "";
    return '<div class="backrow"><a class="btn btn--small" href="#/">← Retour</a></div>' +
      '<div class="hero-band" style="--pastel:' + t.pastel + '"><div class="hero-band__inner"><div>' +
        '<span class="hero-band__icon">' + icon(t.icon) + "</span>" +
        "<h1>" + esc(t.name) + "</h1>" +
        '<p class="hero-band__sub">' + esc(t.description) + " Voici les scrutins publics correspondants, adoptés ou rejetés, et la position de chaque groupe.</p>" +
        '<div class="chips">' + concern +
          '<span class="chip"><b>' + t.scrutins.length + "</b> scrutin" + (t.scrutins.length > 1 ? "s" : "") + "</span>" +
          '<span class="chip"><b>' + withAn + "</b> avec vote de l'Assemblée</span>" +
        "</div></div>" +
        '<div class="goalcard"><h2>Comment lire</h2><p>Chaque fiche indique <strong>ce que change le texte</strong>, s\'il a été <strong>adopté ou rejeté</strong> au Sénat, s\'il est d\'origine <strong>gouvernementale ou parlementaire</strong>, et le vote correspondant de l\'Assemblée nationale lorsqu\'il existe.</p><p>La répartition des votes par groupe (pour, contre, abstention) est reprise des comptes rendus officiels, avec un lien vers la source.</p></div>' +
      "</div></div>" +
      '<div class="wrap">' +
        '<section class="section"><div class="chart-card" id="chart-area">' + themeChartArea(t) + "</div></section>" +
        '<section class="section"><div class="section-head"><h2>Les scrutins</h2><p class="note">Du plus récent au plus ancien.</p></div><div class="vlist">' + cards + "</div>" +
        '<p class="note" style="margin-top:12px">Cliquez sur un scrutin pour voir le détail des votes par groupe et les liens vers les sources officielles.</p></section>' +
      "</div>";
  }

  /* ---------- Page Votes ---------- */
  var votesState = { themes: {}, group: "", withAn: false, origin: "", q: "" };

  function filterVotes() {
    var list = Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).filter(function (s) {
      var sel = Object.keys(votesState.themes).filter(function (k) { return votesState.themes[k]; });
      if (sel.length && sel.indexOf(s.theme) === -1) return false;
      if (votesState.withAn && !s.an) return false;
      if (votesState.origin && s.origin !== votesState.origin) return false;
      if (votesState.group && !s.groups.some(function (g) { return g.key === votesState.group; })) return false;
      if (votesState.q) {
        var q = votesState.q.toLowerCase();
        var hay = (s.title + " " + s.resume + " " + (s.an ? s.an.title : "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(byDateDesc);
    return list;
  }
  function voteListHTML() {
    var list = filterVotes();
    return '<p class="result-count">' + list.length + " vote" + (list.length > 1 ? "s" : "") + "</p>" +
      (list.length ? '<div class="vlist">' + list.map(function (s) { return voteRow(s); }).join("") + "</div>" : '<p class="empty">Aucun vote ne correspond à ces filtres.</p>');
  }
  function votesPage() {
    var themeChecks = themesSorted.map(function (t) {
      return '<label class="checkline"><input type="checkbox" data-theme="' + t.id + '"' + (votesState.themes[t.id] ? " checked" : "") + '><span class="dot" style="background:' + t.pastel + '"></span>' + esc(t.name) + "</label>";
    }).join("");
    var groupOptions = '<option value="">Tous les groupes (Sénat)</option>' + senateGroups.map(function (g) {
      return '<option value="' + g.key + '"' + (votesState.group === g.key ? " selected" : "") + ">" + esc(g.short + " — " + g.label) + "</option>";
    }).join("");
    var originOptions = ["", "Gouvernement", "Parlementaire"].map(function (o) {
      var lab = o === "" ? "Toutes origines" : o === "Gouvernement" ? "Projets de loi (gouvernement)" : "Propositions de loi (parlementaire)";
      return '<option value="' + o + '"' + (votesState.origin === o ? " selected" : "") + ">" + lab + "</option>";
    }).join("");

    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Tous les votes</h1>' +
      "<p class=\"page-lede\">" + Object.keys(DATA.scrutins).length + " scrutins du Sénat, avec un résumé factuel de chaque texte, le résultat et la position des groupes. Le vote de l'Assemblée nationale est indiqué lorsqu'il existe. <a href=\"#/methode\">Méthode et sources</a>.</p></div>" +
      '<div class="layout"><aside class="filters"><h2>Filtres</h2>' +
        '<div class="filters__group"><input type="search" data-q placeholder="Un vote, un texte…" value="' + esc(votesState.q) + '" aria-label="Rechercher"></div>' +
        '<div class="filters__group"><p class="filters__label">Origine du texte</p><select data-origin>' + originOptions + "</select></div>" +
        '<div class="filters__group"><p class="filters__label">Sujets</p>' + themeChecks + "</div>" +
        '<div class="filters__group"><p class="filters__label">Groupe politique</p><select data-group>' + groupOptions + "</select></div>" +
        '<div class="filters__group"><label class="switch"><input type="checkbox" data-withan' + (votesState.withAn ? " checked" : "") + ">Uniquement les votes avec un vote de l'Assemblée</label></div>" +
      '</aside><div id="votelist">' + voteListHTML() + "</div></div></div>";
  }

  /* ---------- Page Groupes ---------- */
  function groupesPage() {
    var cards = senateGroups.map(function (g) {
      var p = g.profile || {};
      function prow(label, value, color) {
        if (value == null) return "";
        return '<div class="prow"><span>' + esc(label) + '</span><span class="prow__bar"><span class="prow__fill" style="--f:' + color + ";width:" + value + '%"></span></span><b>' + value + " %</b></div>";
      }
      var members = g.members.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); })
        .map(function (m) { return "<li>" + esc(m.name) + "<span>" + esc(m.department) + "</span></li>"; }).join("");
      return '<section class="gcard" style="--c:' + g.color + '"><div class="gcard__head"><div><h2 class="gcard__name">' + esc(g.short) + '</h2><p class="gcard__label">' + esc(g.label) + '</p></div><div class="gcard__seats">' + n(g.seats) + "<small>sénateurs</small></div></div>" +
        '<div class="gcard__profile">' + prow("Présence aux votes", p.presencePct, "#4C6FFF") + prow("Votes pour", p.pourPct, "#3BAF7F") + prow("Votes contre", p.contrePct, "#E8654F") + "</div>" +
        '<p class="note">Sur les ' + Object.keys(DATA.scrutins).length + " scrutins analysés. Présence = suffrages exprimés + abstentions, rapportés aux sièges du groupe au jour de chaque vote.</p>" +
        '<details><summary>Voir les ' + g.members.length + " sénateurs du groupe</summary><ul class=\"gmembers\">" + members + "</ul></details></section>";
    }).join("");
    var anRows = DATA.anGroups.map(function (g) {
      return '<div class="anrow"><span class="anrow__dot" style="background:' + g.color + '"></span><b>' + esc(g.short) + "</b><span>" + esc(g.label) + '</span><span class="seats">' + n(g.seats) + "</span></div>";
    }).join("");
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Les groupes politiques</h1>' +
      "<p class=\"page-lede\">Les couleurs de chaque groupe sont utilisées dans tout le site. Effectifs actuels et comportement de vote agrégé.</p></div>" +
      '<section class="section"><div class="section-head"><h2>Au Sénat</h2><p class="note">' + n(DATA.senatorCount) + " sénateurs · " + senateGroups.length + ' groupes</p></div><div class="gcards">' + cards + "</div>" +
      '<p class="note" style="margin-top:12px">Le Sénat est renouvelé par moitié tous les trois ans, au suffrage indirect. Il n\'existe pas de groupe LFI au Sénat (aucun sénateur LFI) : la gauche y est représentée par les groupes SER, CRCE-K et GEST. Le RN compte 4 sénateurs, sous le seuil de 10 requis pour former un groupe : ils siègent comme non-inscrits, regroupés ici sous « NI ».</p></section>' +
      '<section class="section"><div class="section-head"><h2>À l\'Assemblée nationale</h2><p class="note">' + n(DATA.deputeCount) + " députés · 17ᵉ législature · " + DATA.anGroups.length + ' groupes</p></div><div class="anlist">' + anRows + "</div>" +
      '<p class="note" style="margin-top:10px">Les groupes de l\'Assemblée sont regroupés par continuité politique d\'une législature à l\'autre (ex. Renaissance et Ensemble pour la République). Source : annuaire ouvert des députés.</p></section></div>';
  }

  /* ---------- Page Méthode ---------- */
  function methodePage() {
    var anCount = Object.keys(DATA.scrutins).filter(function (k) { return DATA.scrutins[k].an; }).length;
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Méthode et sources</h1>' +
      '<p class="page-lede">Ce site restitue des votes publics. Voici d\'où viennent les données, comment les scrutins sont choisis, et ce que les chiffres ne disent pas.</p></div>' +
      '<div class="prose">' +
      '<div class="callout"><strong>Principe de neutralité.</strong> Le site ne note pas les textes, ne classe pas les partis et ne recommande aucun vote. Il indique ce que change chaque texte (résumé factuel), s\'il a été adopté ou rejeté, son origine (gouvernement ou parlement), et la répartition des votes par groupe (pour, contre, abstention).</div>' +
      "<h2>1. Les votes</h2><p>Les scrutins du Sénat proviennent des <strong>pages officielles de scrutins publics de senat.fr</strong> (intitulé, date, totaux et ventilation par groupe). Le vote correspondant de l'<strong>Assemblée nationale</strong> provient des <strong>dumps officiels data.assemblee-nationale.fr</strong> (16ᵉ et 17ᵉ législatures).</p>" +
      '<div class="kv"><div><dt>Scrutins analysés</dt><dd>' + Object.keys(DATA.scrutins).length + " au Sénat, dont " + anCount + " avec un vote de l'Assemblée nationale</dd></div>" +
      "<div><dt>Période</dt><dd>" + esc(frDate(DATA.period.from)) + " → " + esc(frDate(DATA.period.to)) + "</dd></div>" +
      "<div><dt>Contrôles</dt><dd>somme des groupes = totaux, cohérence des effectifs, comparaison croisée ; toute incohérence bloque la publication</dd></div></div>" +
      "<h2>2. La sélection des scrutins</h2><p>Sont retenus les votes publics sur <strong>l'ensemble d'un texte</strong> ou sur le texte issu d'une <strong>commission mixte paritaire</strong>, pour les principaux sujets de la vie quotidienne. Les amendements et les motions de procédure sont écartés : ils ne se lisent pas seuls et se prêtent aux interprétations.</p>" +
      "<h2>3. Ce que montrent les graphiques</h2><ul><li>Chaque colonne représente un groupe : part de votes <strong>pour</strong> (vert), <strong>contre</strong> (rouge) et <strong>abstentions</strong> (gris).</li><li>Les pourcentages portent sur les votes émis (pour + contre + abstentions) ; les non-votants sont exclus.</li><li>Les colonnes sont classées par volume de votes émis. Le sens des textes n'est pas noté : c'est au lecteur de se faire une opinion.</li></ul>" +
      "<h2>4. Composition et non-inscrits</h2><p>Le Sénat est élu au suffrage indirect et renouvelé par moitié tous les trois ans. Il n'existe <strong>pas de groupe LFI</strong> au Sénat (aucun sénateur LFI) : la gauche y est représentée par les groupes SER, CRCE-K et GEST. Le <strong>RN compte 4 sénateurs</strong>, sous le seuil de 10 requis pour constituer un groupe : ils siègent comme non-inscrits et apparaissent dans la ligne « NI ». À l'Assemblée nationale, les groupes RN et LFI-NFP existent et apparaissent dans les blocs « Assemblée ».</p>" +
      "<h2>5. Limites</h2><ul><li>Agréger des votes ne résume pas un texte : un scrutin peut mêler des mesures diverses. Le dossier législatif est lié pour chaque vote.</li><li>Certains textes n'ont pas de vote public de l'Assemblée nationale ; c'est indiqué vote par vote.</li><li>Les effectifs et intitulés des groupes varient dans le temps ; les graphiques utilisent les effectifs au jour de chaque vote.</li><li>Les pourcentages présentés dépendent de la participation : un faible nombre de votants doit être lu avec prudence.</li></ul>" +
      "<h2>6. Sources et réutilisation</h2><p>Données publiques sous <strong>Licence Ouverte 2.0 (Etalab)</strong> : réutilisation libre avec mention de la source. Sénat : <a href=\"https://www.senat.fr/scrutin-public/scr2025.html\" target=\"_blank\" rel=\"noopener\">senat.fr</a> · Assemblée : <a href=\"" + esc(DATA.anSource.url) + "\" target=\"_blank\" rel=\"noopener\">data.assemblee-nationale.fr</a>.</p>" +
      '<p class="note">Site citoyen indépendant, sans affiliation avec le Sénat, l\'Assemblée nationale ou un parti politique. Aucun cookie, aucun traceur, aucune donnée personnelle.</p>' +
      "</div></div>";
  }

  function notFound() {
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Page introuvable</h1><p class="page-lede">Le contenu demandé n\'existe pas ou plus. <a href="#/">Revenir aux sujets</a>.</p></div></div>';
  }

  /* ---------- Routage ---------- */
  function parseHash() {
    var raw = window.location.hash.replace(/^#/, "");
    var qi = raw.indexOf("?");
    var query = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : "");
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    if (!path || path === "/") return { name: "home", args: [], query: query };
    var parts = path.replace(/^\//, "").split("/").map(decodeURIComponent);
    return { name: parts[0], args: parts.slice(1), query: query };
  }
  function setTabs(name) {
    var map = { home: "home", sujet: "home", votes: "votes", groupes: "groupes" };
    var links = document.querySelectorAll("[data-tab]");
    for (var i = 0; i < links.length; i++) {
      if (map[name] === links[i].getAttribute("data-tab")) links[i].classList.add("is-active");
      else links[i].classList.remove("is-active");
    }
  }
  function render() {
    var route = parseHash();
    var html, title = "Sénat·Vote", scrollTarget = null;
    if (route.name === "home") { html = homePage(); title += " — les votes par sujet"; }
    else if (route.name === "sujet") {
      var openSid = route.query.get("v") || null;
      html = themePage(route.args[0], openSid);
      var t = themeById(route.args[0]);
      title += t ? " — " + t.name : "";
      if (openSid) scrollTarget = "v-" + openSid;
    } else if (route.name === "votes") {
      votesState.q = route.query.get("q") || "";
      html = votesPage(); title += " — tous les votes";
    } else if (route.name === "groupes") { html = groupesPage(); title += " — les groupes politiques"; }
    else if (route.name === "methode") { html = methodePage(); title += " — méthode et sources"; }
    else { html = notFound(); title += " — page introuvable"; }
    app.innerHTML = html;
    setTabs(route.name);
    document.title = title;
    if (scrollTarget) {
      var el = document.getElementById(scrollTarget);
      if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("is-open"); }
    } else window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  /* ---------- Interactions ---------- */
  app.addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      var row = toggle.closest(".vrow");
      if (row) {
        row.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", row.classList.contains("is-open") ? "true" : "false");
      }
      return;
    }
    var chamberBtn = e.target.closest("[data-chamber]");
    if (chamberBtn) {
      themeState.chamber = chamberBtn.getAttribute("data-chamber");
      var route = parseHash();
      var t = route.name === "sujet" ? themeById(route.args[0]) : null;
      if (t) document.getElementById("chart-area").innerHTML = themeChartArea(t);
    }
  });
  app.addEventListener("change", function (e) {
    var el = e.target;
    function refresh() { var l = document.getElementById("votelist"); if (l) l.innerHTML = voteListHTML(); }
    if (el.matches("[data-theme]")) { votesState.themes[el.getAttribute("data-theme")] = el.checked; refresh(); }
    else if (el.matches("[data-group]")) { votesState.group = el.value; refresh(); }
    else if (el.matches("[data-origin]")) { votesState.origin = el.value; refresh(); }
    else if (el.matches("[data-withan]")) { votesState.withAn = el.checked; refresh(); }
  });
  app.addEventListener("input", function (e) {
    if (e.target.matches("[data-q]")) {
      votesState.q = e.target.value;
      var l = document.getElementById("votelist");
      if (l) l.innerHTML = voteListHTML();
    }
  });
  app.addEventListener("submit", function (e) {
    if (e.target.matches("[data-search]")) {
      e.preventDefault();
      var input = e.target.querySelector("input");
      var q = input ? input.value.trim() : "";
      window.location.hash = "#/votes" + (q ? "?q=" + encodeURIComponent(q) : "");
    }
  });

  window.addEventListener("hashchange", render);
  render();
})();
