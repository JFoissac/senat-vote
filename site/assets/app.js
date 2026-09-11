/* Sénat·Vote — application (vanilla JS, routage par hash). Présentation factuelle. */
(function () {
  "use strict";

  var DATA = window.SENAT_DATA;
  var app = document.getElementById("app");
  if (!DATA) { app.innerHTML = '<p class="empty">Données introuvables.</p>'; return; }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var nf = new Intl.NumberFormat("fr-FR");
  function n(x) { return nf.format(x || 0); }
  var dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  var dateShort = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  function frDate(iso) { return iso ? dateFmt.format(new Date(iso + "T12:00:00")) : ""; }
  function frDateShort(iso) { return iso ? dateShort.format(new Date(iso + "T12:00:00")) : ""; }

  var senateGroups = DATA.groups.slice().sort(function (a, b) { return b.seats - a.seats; });
  var groupMeta = {}; DATA.groups.forEach(function (g) { groupMeta[g.key] = g; });
  var themesSorted = DATA.themes.slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
  var mainThemes = themesSorted.filter(function (t) { return t.id !== "autres"; });

  var scrutinsByTheme = {};
  Object.keys(DATA.scrutins).forEach(function (k) {
    var s = DATA.scrutins[k];
    (scrutinsByTheme[s.theme] = scrutinsByTheme[s.theme] || []).push(s);
  });
  function scrutinsOf(theme) { return scrutinsByTheme[theme.id] || []; }
  function themeById(id) { return DATA.themes.find(function (t) { return t.id === id; }) || null; }
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
    shield: '<path d="M12 3.5 19 6.2v5.1c0 4.8-3.4 7.9-7 9.7-3.6-1.8-7-4.9-7-9.7V6.2z"/><path d="m9 12 2.1 2.1L15.5 9.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.8 3.4 2.8 13.6 0 17-2.8-3.4-2.8-13.6 0-17z"/>',
    scale: '<path d="M12 4.5v15M6 8.5h12M8.5 19.5h7"/><path d="m6 8.5-2.5 5h5zM18 8.5l-2.5 5h5z"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.scale) + "</svg>"; }

  function senateGroup(g) { var m = groupMeta[g.key] || {}; return { key: g.key, label: m.label || g.key, short: m.short || g.key, color: m.color || "#8B95A9", size: g.size, pour: g.pour, contre: g.contre, abstention: g.abstention, nonVotants: g.nonVotants }; }
  function anGroup(g) { return { key: g.key, label: DATA.anGroupLabels[g.key] || g.key, short: g.key, color: DATA.anGroupColors[g.key] || "#8B95A9", size: g.size, pour: g.pour, contre: g.contre, abstention: g.abstention, nonVotants: g.nonVotants }; }

  function resultBadge(chamber, result) {
    return '<span class="b ' + (result === "Adoption" ? "b--adopted" : "b--rejected") + '">' + esc(chamber) + " · " + (result === "Adoption" ? "Adopté" : "Rejeté") + "</span>";
  }
  function originBadge(origin) {
    var label = origin === "Gouvernement" ? "Projet de loi (gouvernement)" : origin === "Parlementaire" ? "Proposition de loi (parlementaire)" : origin;
    return '<span class="b b--origin">' + esc(label) + "</span>";
  }
  function typeBadge(type) {
    var cls = type === "Ensemble du texte" ? "b--type-ens" : "b--type";
    return '<span class="b ' + cls + '">' + esc(type) + "</span>";
  }

  /* ---------- Graphiques ---------- */
  function themeChartRows(theme, chamber) {
    var acc = {};
    scrutinsOf(theme).forEach(function (s) {
      var groups = chamber === "senat" ? s.groups.map(senateGroup) : (s.an && s.an.groups ? s.an.groups.map(anGroup) : []);
      groups.forEach(function (g) {
        if (!acc[g.key]) acc[g.key] = { key: g.key, short: g.short, label: g.label, color: g.color, pour: 0, contre: 0, abs: 0 };
        acc[g.key].pour += g.pour; acc[g.key].contre += g.contre; acc[g.key].abs += g.abstention;
      });
    });
    return Object.keys(acc).map(function (k) {
      var a = acc[k], d = a.pour + a.contre + a.abs;
      a.pctPour = d ? Math.round((100 * a.pour) / d) : 0;
      a.pctContre = d ? Math.round((100 * a.contre) / d) : 0;
      a.pctAbs = d ? 100 - a.pctPour - a.pctContre : 0;
      a.votes = d; return a;
    }).filter(function (a) { return a.votes > 0; }).sort(function (x, y) { return y.votes - x.votes; });
  }
  function renderChart(rows) {
    if (!rows.length) return '<p class="empty">Aucune donnée pour ce graphique.</p>';
    var yl = [100, 75, 50, 25].map(function (v) { return '<span style="top:' + (100 - v) + '%">' + v + "</span>"; }).join("") + '<span style="top:100%">0</span>';
    var cols = rows.map(function (r) {
      var segs = "";
      function seg(cls, h, value, show) { return h <= 0 ? "" : '<div class="col__seg ' + cls + '" style="height:' + h + '%">' + (show && h >= 14 ? '<span class="col__pct">' + value + " %</span>" : "") + "</div>"; }
      var dom = Math.max(r.pctPour, r.pctContre, r.pctAbs);
      segs += seg("col__seg--unfav", r.pctContre, r.pctContre, r.pctContre === dom);
      segs += seg("col__seg--abs", r.pctAbs, r.pctAbs, r.pctAbs === dom);
      segs += seg("col__seg--fav", r.pctPour, r.pctPour, r.pctPour === dom);
      return '<div class="col" style="--c:' + r.color + '" title="' + esc(r.label + " : " + r.pctPour + " % pour, " + r.pctContre + " % contre, " + r.pctAbs + " % abstention") + '"><div class="col__stack">' + segs + '</div><div class="col__label"><span class="col__dot"></span>' + esc(r.short) + "</div></div>";
    }).join("");
    return '<div class="chart"><div class="chart__ylabels">' + yl + '</div><div class="chart__grid"></div><div class="chart__scroll"><div class="chart__plot">' + cols + "</div></div></div>" +
      '<div class="chart-legend"><span><i class="l-fav"></i>Ont voté pour</span><span><i class="l-abs"></i>Abstention</span><span><i class="l-unfav"></i>Ont voté contre</span></div>';
  }
  function groupBars(groups) {
    return groups.slice().sort(function (a, b) { return (b.size || 0) - (a.size || 0); }).map(function (g) {
      var size = g.size || (g.pour + g.contre + g.abstention + g.nonVotants);
      function w(v) { return size ? (100 * v) / size : 0; }
      var seg = "";
      if (g.pour) seg += '<span class="gbar__seg gbar__seg--pour" style="width:' + w(g.pour) + '%"></span>';
      if (g.contre) seg += '<span class="gbar__seg gbar__seg--contre" style="width:' + w(g.contre) + '%"></span>';
      if (g.abstention) seg += '<span class="gbar__seg gbar__seg--abs" style="width:' + w(g.abstention) + '%"></span>';
      if (g.nonVotants) seg += '<span class="gbar__seg gbar__seg--nv" style="width:' + w(g.nonVotants) + '%"></span>';
      var exp = g.pour + g.contre;
      return '<div class="gbar"><span class="gbar__tag"><span class="gbar__dot" style="background:' + g.color + '"></span>' + esc(g.short) + '</span><div class="gbar__stack">' + seg + '</div><div class="gbar__counts"><span class="p"><b>' + n(g.pour) + '</b> P</span><span class="c"><b>' + n(g.contre) + '</b> C</span><span><b>' + n(g.abstention) + '</b> A</span><span><b>' + n(g.nonVotants) + '</b> NV</span>' + (exp ? "<span>" + Math.round((100 * g.pour) / exp) + " % P</span>" : "") + "</div></div>";
    }).join("");
  }
  function totalsChips(t) {
    return '<div class="totals"><span class="tot tot--pour"><b>' + n(t.pour) + "</b> pour</span><span class=\"tot tot--contre\"><b>" + n(t.contre) + "</b> contre</span>" +
      (t.abstention != null ? '<span class="tot"><b>' + n(t.abstention) + "</b> abst.</span>" : "") +
      (t.nonVotants != null ? '<span class="tot"><b>' + n(t.nonVotants) + "</b> non-votants</span>" : "") +
      (t.votants != null ? '<span class="tot">' + n(t.votants) + " votants</span>" : "") + "</div>";
  }

  function anTextBlock(s) {
    var list = DATA.anByText && DATA.anByText[s.text];
    if (!list || !list.length) return "";
    var items = list.map(function (a) {
      return '<li><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(frDateShort(a.date)) + " · " + esc(a.stage) + '</a> <span class="b ' + (a.result === "Adoption" ? "b--adopted" : "b--rejected") + '">' + (a.result === "Adoption" ? "Adopté" : "Rejeté") + "</span> <span class=\"anvotes__c\">" + n(a.totals.pour) + " pour · " + n(a.totals.contre) + " contre</span></li>";
    }).join("");
    return '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>Votes publics sur ce texte</small></div></div><ul class="anvotes">' + items + '<li class="note">Les amendements ne sont pas votés dans les deux chambres : le vote de l\'Assemblée porte sur le texte, pas sur chaque amendement du Sénat.</li></ul></div>';
  }

  function voteRow(s, opts) {
    opts = opts || {};
    var theme = themeById(s.theme);
    var meta = resultBadge("Sénat", s.result);
    if (s.an) meta += '<span class="b b--an">AN · ' + (s.an.result === "Adoption" ? "adopté" : "rejeté") + " · " + esc(s.an.stage) + "</span>";
    else if (DATA.anByText && DATA.anByText[s.text]) meta += '<span class="b b--an">AN · votes sur le texte</span>';
    meta += typeBadge(s.type) + originBadge(s.origin);

    var senat = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Sénat<small>' + esc(frDate(s.date)) + '</small></div>' + resultBadge("Sénat", s.result) + "</div>" + totalsChips(s.totals) + groupBars(s.groups.map(senateGroup)) +
      '<div class="vrow__links"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">Page du scrutin (senat.fr) ↗</a>' + (s.dossierUrl ? '<a href="' + esc(s.dossierUrl) + '" target="_blank" rel="noopener">Dossier législatif ↗</a>' : "") + "</div></div>";

    var anBlock;
    if (s.an) {
      anBlock = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>' + esc(frDate(s.an.date)) + " · " + esc(s.an.stage) + " · " + s.an.legislature + "ᵉ législature</small></div>" + resultBadge("AN", s.an.result) + "</div>" + totalsChips(s.an.totals) + groupBars(s.an.groups.map(anGroup)) +
        (s.anNote ? '<p class="note" style="margin:10px 0 0">' + esc(s.anNote) + "</p>" : "") +
        '<div class="vrow__links"><a href="' + esc(s.an.url) + '" target="_blank" rel="noopener">Page du vote (Assemblée nationale) ↗</a></div></div>';
    } else {
      anBlock = anTextBlock(s) || '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>Aucun vote public recensé sur ce texte</small></div></div><p class="chamber__empty">Aucun vote public de l\'Assemblée nationale n\'est recensé sur ce texte dans les données officielles.</p></div>';
    }

    return '<article class="vrow' + (opts.open ? " is-open" : "") + '" id="v-' + esc(s.id) + '">' +
      '<button class="vrow__head" data-toggle aria-expanded="' + (opts.open ? "true" : "false") + '">' +
        '<span class="vrow__eyebrow">' + (theme ? '<span class="miniicon" style="background:' + theme.pastel + '">' + icon(theme.icon) + "</span>" + esc(theme.name) : "Scrutin") + "</span>" +
        '<span class="vrow__title">' + esc(s.title.replace(/^sur /, "Sur ")) + "</span>" +
        '<span class="vrow__meta">' + meta + '<span class="vrow__date">' + esc(frDateShort(s.date)) + '</span><span class="vrow__chev">▾</span></span>' +
      "</button>" +
      '<div class="vrow__body">' + (s.resume ? '<p class="resume"><b>Ce que change le texte</b>' + esc(s.resume) + "</p>" : "") + '<div class="chambers">' + senat + anBlock + "</div></div></article>";
  }

  /* ---------- Accueil ---------- */
  function homePage() {
    var sujets = mainThemes.map(function (t) {
      var sc = scrutinsOf(t);
      var withAn = sc.filter(function (s) { return s.an; }).length;
      return '<a class="sujet" href="#/sujet/' + encodeURIComponent(t.id) + '"><span class="sujet__icon" style="background:' + t.pastel + '">' + icon(t.icon) + '</span>' +
        '<span><span class="sujet__name">' + esc(t.name) + '</span><span class="sujet__meta">' + sc.length + " scrutin" + (sc.length > 1 ? "s" : "") + " · " + withAn + " vote" + (withAn > 1 ? "s" : "") + " de l'Assemblée</span></span><span class=\"sujet__arrow\">→</span></a>";
    }).join("");
    var latest = Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).sort(byDateDesc).slice(0, 5);
    var all = Object.keys(DATA.scrutins);
    var anCount = all.filter(function (k) { return DATA.scrutins[k].an; }).length;
    return '<div class="home"><div class="home__left"><span class="home__kicker">Observatoire citoyen · Sénat & Assemblée</span>' +
      '<h1 class="home__title">Tous les votes du Sénat, sujet par sujet</h1>' +
      '<p class="home__lede">Les ' + all.length + " scrutins publics de la période, classés par sujets de la vie quotidienne : ce que change chaque texte, le résultat, et la position de chaque groupe politique.</p>" +
      '<form class="home__search" data-search><input type="search" placeholder="Un sujet, un vote, un groupe…" aria-label="Rechercher un vote"><button class="btn btn--black" type="submit">Rechercher</button></form>' +
      '<a class="home__card" href="#/votes"><strong>Parcourir tous les votes, texte par texte</strong><span>Voir les scrutins →</span></a></div>' +
      '<div class="home__right"><div class="section-head"><h2>Les sujets</h2><p class="note">' + mainThemes.length + ' sujets de la vie quotidienne</p></div>' + sujets +
      '<p style="margin-top:16px"><a class="btn btn--black" href="#/votes">Voir tous les votes</a></p></div></div>' +
      '<div class="wrap"><div class="stats"><span class="stat"><b>' + n(all.length) + '</b> scrutins analysés</span><span class="stat"><b>' + n(anCount) + "</b> croisés avec l'Assemblée nationale</span>" +
      '<span class="stat"><b>' + n(DATA.senatorCount) + '</b> sénateurs · <b>' + n(DATA.deputeCount) + '</b> députés</span><span class="stat">Mis à jour le <b>' + esc(frDate(DATA.generatedAt.slice(0, 10))) + "</b></span></div>" +
      '<section class="section"><div class="section-head"><h2>Derniers votes</h2><p class="note"><a href="#/votes">Tous les votes</a></p></div><div class="vlist">' + latest.map(function (s) { return voteRow(s); }).join("") + "</div></section></div>";
  }

  /* ---------- Page sujet ---------- */
  var themeState = { chamber: "senat" };
  function themeChartArea(theme, chamber) {
    var hasAn = scrutinsOf(theme).some(function (s) { return s.an; });
    chamber = chamber || (hasAn ? themeState.chamber : "senat");
    var count = scrutinsOf(theme).length;
    return '<div class="chart-card__head"><div><h2>' + (chamber === "senat" ? "Comment le Sénat a voté" : "Comment l'Assemblée nationale a voté") + " sur ces textes</h2>" +
      '<p class="note">En % des votes émis par groupe (pour + contre + abstentions), sur ' + count + " scrutin" + (count > 1 ? "s" : "") + ".</p></div>" +
      '<div class="segmented" role="group"><button data-chamber="senat" class="' + (chamber === "senat" ? "is-on" : "") + '">Sénat</button>' +
      '<button data-chamber="an" class="' + (chamber === "an" ? "is-on" : "") + '"' + (hasAn ? "" : " disabled") + '>Assemblée nationale</button></div></div>' +
      renderChart(themeChartRows(theme, chamber)) +
      '<p class="note" style="margin-top:12px">Répartition des votes de chaque groupe, sans jugement sur le sens des textes. Les non-votants sont exclus des pourcentages.</p>';
  }

  function textSections(scrutins) {
    var byText = {};
    scrutins.forEach(function (s) { (byText[s.text] = byText[s.text] || []).push(s); });
    var texts = Object.keys(byText).sort(function (a, b) {
      var da = byText[a][0].date || "", db = byText[b][0].date || "";
      return db.localeCompare(da);
    });
    return texts.map(function (text, idx) {
      var list = byText[text].sort(byDateDesc);
      var ensemble = list.filter(function (s) { return s.type === "Ensemble du texte"; }).length;
      var dossier = list[0].dossierUrl;
      var anVotes = (DATA.anByText && DATA.anByText[text]) || [];
      return '<section class="textblock"><div class="textblock__head"><h3 class="textblock__title">' + esc(text) + "</h3>" +
        '<p class="textblock__meta">' + list.length + " vote" + (list.length > 1 ? "s" : "") + " · " + ensemble + " sur l'ensemble" + (anVotes.length ? " · " + anVotes.length + " vote" + (anVotes.length > 1 ? "s" : "") + " de l'Assemblée" : "") +
        (dossier ? ' · <a href="' + esc(dossier) + '" target="_blank" rel="noopener">dossier législatif ↗</a>' : "") + "</p></div>" +
        '<div class="vlist">' + list.map(function (s, i) { return voteRow(s, { open: idx === 0 && i === 0 && list.length <= 3 }); }).join("") + "</div></section>";
    }).join("");
  }

  function themePage(id, openSid) {
    var t = themeById(id);
    if (!t) return notFound();
    var scrutins = scrutinsOf(t).sort(byDateDesc);
    if (openSid) { var target = DATA.scrutins[openSid]; if (target) target.open = true; }
    var withAn = scrutins.filter(function (s) { return s.an; }).length;
    var byType = {};
    scrutins.forEach(function (s) { byType[s.type] = (byType[s.type] || 0) + 1; });
    var types = Object.keys(byType).sort(function (a, b) { return byType[b] - byType[a]; }).map(function (k) { return byType[k] + " " + k.toLowerCase() + (byType[k] > 1 ? "s" : ""); }).join(" · ");
    var concern = t.concern ? '<span class="chip">Sujet cité par <b>' + t.concern.value + " %</b> (" + esc(t.concern.source) + " " + esc(t.concern.date) + ")</span>" : "";
    return '<div class="backrow"><a class="btn btn--small" href="#/">← Retour</a></div>' +
      '<div class="hero-band" style="--pastel:' + t.pastel + '"><div class="hero-band__inner"><div><span class="hero-band__icon">' + icon(t.icon) + "</span>" +
      "<h1>" + esc(t.name) + "</h1><p class=\"hero-band__sub\">" + esc(t.description) + " Voici les scrutins publics correspondants, adoptés ou rejetés, et la position de chaque groupe.</p>" +
      '<div class="chips">' + concern + '<span class="chip"><b>' + n(scrutins.length) + "</b> scrutin" + (scrutins.length > 1 ? "s" : "") + '</span><span class="chip"><b>' + n(withAn) + "</b> vote" + (withAn > 1 ? "s" : "") + " de l'Assemblée</span></div></div>" +
      '<div class="goalcard"><h2>Comment lire</h2><p>Chaque fiche indique <strong>ce que change le texte</strong>, s\'il a été <strong>adopté ou rejeté</strong> au Sénat, s\'il est d\'origine <strong>gouvernementale ou parlementaire</strong>, et le vote correspondant de l\'Assemblée nationale lorsqu\'il existe.</p><p>La répartition des votes par groupe (pour, contre, abstention) est reprise des comptes rendus officiels, avec un lien vers la source.</p></div></div></div>' +
      '<div class="wrap"><section class="section"><div class="chart-card" id="chart-area">' + themeChartArea(t) + "</div></section>" +
      '<section class="section"><div class="section-head"><h2>Les scrutins</h2><p class="note">' + types + "</p></div>" + (scrutins.length ? textSections(scrutins) : '<p class="empty">Aucun scrutin pour ce sujet.</p>') + "</section></div>";
  }

  /* ---------- Page Votes (avec pagination) ---------- */
  var votesState = { themes: {}, group: "", withAn: false, origin: "", q: "", page: 1 };
  var PAGE_SIZE = 50;

  function filterVotes() {
    return Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).filter(function (s) {
      var sel = Object.keys(votesState.themes).filter(function (k) { return votesState.themes[k]; });
      if (sel.length && sel.indexOf(s.theme) === -1) return false;
      if (votesState.withAn && !s.an) return false;
      if (votesState.origin && s.origin !== votesState.origin) return false;
      if (votesState.group && !s.groups.some(function (g) { return g.key === votesState.group; })) return false;
      if (votesState.q) {
        var q = votesState.q.toLowerCase();
        if ((s.title + " " + (s.resume || "") + " " + s.text).toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    }).sort(byDateDesc);
  }
  function voteListHTML() {
    var list = filterVotes();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (votesState.page > pages) votesState.page = pages;
    var slice = list.slice((votesState.page - 1) * PAGE_SIZE, votesState.page * PAGE_SIZE);
    var nav = '<div class="pager"><button class="btn btn--small" data-page="' + (votesState.page - 1) + '"' + (votesState.page <= 1 ? " disabled" : "") + ">← Précédent</button>" +
      "<span>Page " + votesState.page + " / " + pages + "</span>" +
      '<button class="btn btn--small" data-page="' + (votesState.page + 1) + '"' + (votesState.page >= pages ? " disabled" : "") + ">Suivant →</button></div>";
    return '<p class="result-count">' + n(list.length) + " vote" + (list.length > 1 ? "s" : "") + "</p>" + nav +
      (slice.length ? '<div class="vlist">' + slice.map(function (s) { return voteRow(s); }).join("") + "</div>" : '<p class="empty">Aucun vote ne correspond à ces filtres.</p>') + nav;
  }
  function votesPage() {
    var themeChecks = themesSorted.map(function (t) {
      return '<label class="checkline"><input type="checkbox" data-theme="' + t.id + '"' + (votesState.themes[t.id] ? " checked" : "") + '><span class="dot" style="background:' + t.pastel + '"></span>' + esc(t.name) + " <small>(" + (scrutinsByTheme[t.id] || []).length + ")</small></label>";
    }).join("");
    var groupOptions = '<option value="">Tous les groupes (Sénat)</option>' + senateGroups.map(function (g) {
      return '<option value="' + g.key + '"' + (votesState.group === g.key ? " selected" : "") + ">" + esc(g.short + " — " + g.label) + "</option>";
    }).join("");
    var originOptions = ["", "Gouvernement", "Parlementaire", "Autre"].map(function (o) {
      var lab = o === "" ? "Toutes origines" : o === "Gouvernement" ? "Projets de loi (gouvernement)" : o === "Parlementaire" ? "Propositions de loi (parlementaire)" : "Autres";
      return '<option value="' + o + '"' + (votesState.origin === o ? " selected" : "") + ">" + lab + "</option>";
    }).join("");
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Tous les votes</h1>' +
      "<p class=\"page-lede\">" + n(Object.keys(DATA.scrutins).length) + " scrutins publics du Sénat, avec le résultat et la position des groupes ; votes de l'Assemblée nationale indiqués lorsqu'ils existent. <a href=\"#/methode\">Méthode et sources</a>.</p></div>" +
      '<div class="layout"><aside class="filters"><h2>Filtres</h2>' +
      '<div class="filters__group"><input type="search" data-q placeholder="Un vote, un texte…" value="' + esc(votesState.q) + '" aria-label="Rechercher"></div>' +
      '<div class="filters__group"><p class="filters__label">Origine du texte</p><select data-origin>' + originOptions + "</select></div>" +
      '<div class="filters__group"><p class="filters__label">Sujets</p>' + themeChecks + "</div>" +
      '<div class="filters__group"><p class="filters__label">Groupe politique</p><select data-group>' + groupOptions + "</select></div>" +
      '<div class="filters__group"><label class="switch"><input type="checkbox" data-withan' + (votesState.withAn ? " checked" : "") + ">Uniquement les votes avec un vote de l'Assemblée</label></div>" +
      '</aside><div id="votelist">' + voteListHTML() + "</div></div></div>";
  }

  /* ---------- Groupes ---------- */
  function groupesPage() {
    var cards = senateGroups.map(function (g) {
      var p = g.profile || {};
      function prow(label, value, color) { return value == null ? "" : '<div class="prow"><span>' + esc(label) + '</span><span class="prow__bar"><span class="prow__fill" style="--f:' + color + ";width:" + value + '%"></span></span><b>' + value + " %</b></div>"; }
      var members = g.members.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); }).map(function (m) { return "<li>" + esc(m.name) + "<span>" + esc(m.department) + "</span></li>"; }).join("");
      return '<section class="gcard" style="--c:' + g.color + '"><div class="gcard__head"><div><h2 class="gcard__name">' + esc(g.short) + '</h2><p class="gcard__label">' + esc(g.label) + '</p></div><div class="gcard__seats">' + n(g.seats) + "<small>sénateurs</small></div></div>" +
        '<div class="gcard__profile">' + prow("Présence aux votes", p.presencePct, "#4C6FFF") + prow("Votes pour", p.pourPct, "#3BAF7F") + prow("Votes contre", p.contrePct, "#E8654F") + "</div>" +
        '<p class="note">Sur les ' + n(Object.keys(DATA.scrutins).length) + " scrutins analysés. Présence = suffrages exprimés + abstentions, rapportés aux sièges du groupe au jour de chaque vote.</p>" +
        '<details><summary>Voir les ' + g.members.length + ' sénateurs du groupe</summary><ul class="gmembers">' + members + "</ul></details></section>";
    }).join("");
    var anRows = DATA.anGroups.map(function (g) { return '<div class="anrow"><span class="anrow__dot" style="background:' + g.color + '"></span><b>' + esc(g.short) + "</b><span>" + esc(g.label) + '</span><span class="seats">' + n(g.seats) + "</span></div>"; }).join("");
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Les groupes politiques</h1><p class="page-lede">Les couleurs de chaque groupe sont utilisées dans tout le site. Effectifs actuels et comportement de vote agrégé.</p></div>' +
      '<section class="section"><div class="section-head"><h2>Au Sénat</h2><p class="note">' + n(DATA.senatorCount) + " sénateurs · " + senateGroups.length + ' groupes</p></div><div class="gcards">' + cards + '</div><p class="note" style="margin-top:12px">Le Sénat est renouvelé par moitié tous les trois ans, au suffrage indirect. Il n\'existe pas de groupe LFI au Sénat (aucun sénateur LFI) : la gauche y est représentée par les groupes SER, CRCE-K et GEST. Le RN compte 4 sénateurs, sous le seuil de 10 requis pour former un groupe : ils siègent comme non-inscrits, regroupés ici sous « NI ».</p></section>' +
      '<section class="section"><div class="section-head"><h2>À l\'Assemblée nationale</h2><p class="note">' + n(DATA.deputeCount) + " députés · 17ᵉ législature · " + DATA.anGroups.length + ' groupes</p></div><div class="anlist">' + anRows + '</div><p class="note" style="margin-top:10px">Les groupes de l\'Assemblée sont regroupés par continuité politique d\'une législature à l\'autre.</p></section></div>';
  }

  /* ---------- Comparer (factuel) ---------- */
  var compareState = { a: senateGroups[0] ? senateGroups[0].key : "", b: senateGroups[1] ? senateGroups[1].key : "", excludeAbs: false,
    themes: (function () { var m = {}; themesSorted.forEach(function (t) { m[t.id] = true; }); return m; })() };

  function selectedThemes() { return themesSorted.filter(function (t) { return compareState.themes[t.id]; }); }
  function selectedCount() { return selectedThemes().length; }
  function selectedScrutins() {
    var sel = {}; selectedThemes().forEach(function (t) { sel[t.id] = true; });
    return Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).filter(function (s) { return sel[s.theme]; });
  }
  function statsOver(list, key, excludeAbs) {
    var pour = 0, contre = 0, abs = 0, votants = 0, possible = 0, nb = 0;
    list.forEach(function (s) {
      var g = s.groups.find(function (x) { return x.key === key; });
      if (!g || !g.size) return;
      nb++; pour += g.pour; contre += g.contre; abs += g.abstention; votants += g.pour + g.contre + g.abstention; possible += g.size;
    });
    var d = excludeAbs ? pour + contre : pour + contre + abs;
    return { nb: nb, presence: possible ? Math.round((100 * votants) / possible) : null, pour: d ? Math.round((100 * pour) / d) : null, contre: d ? Math.round((100 * contre) / d) : null };
  }
  function agreementBetween(aKey, bKey, list) {
    var common = 0, same = 0;
    list.forEach(function (s) {
      var ga = s.groups.find(function (x) { return x.key === aKey; });
      var gb = s.groups.find(function (x) { return x.key === bKey; });
      if (!ga || !gb || !ga.size || !gb.size) return;
      function maj(g) { return g.pour >= g.contre && g.pour >= g.abstention ? "pour" : (g.contre >= g.pour && g.contre >= g.abstention ? "contre" : "abs"); }
      common++; if (maj(ga) === maj(gb)) same++;
    });
    return { pct: common ? Math.round((100 * same) / common) : null, common: common, same: same };
  }
  function fmtPct(v) { return v == null ? "—" : v + " %"; }
  function compareMain() {
    var ga = groupMeta[compareState.a], gb = groupMeta[compareState.b];
    var list = selectedScrutins();
    var ag = agreementBetween(compareState.a, compareState.b, list);
    var totA = statsOver(list, compareState.a, compareState.excludeAbs), totB = statsOver(list, compareState.b, compareState.excludeAbs);
    var rows = selectedThemes().map(function (t) {
      var tl = scrutinsOf(t); if (!tl.length) return "";
      var A = statsOver(tl, compareState.a, compareState.excludeAbs), B = statsOver(tl, compareState.b, compareState.excludeAbs);
      if (A.nb === 0 && B.nb === 0) return "";
      return '<tr><td class="tname">' + esc(t.name) + "<small>" + tl.length + " scrutin" + (tl.length > 1 ? "s" : "") + "</small></td>" +
        "<td>" + fmtPct(A.presence) + '</td><td class="n" style="color:' + (ga ? ga.color : "inherit") + '">' + fmtPct(A.pour) + "</td><td>" + fmtPct(A.contre) + "</td>" +
        "<td>" + fmtPct(B.presence) + '</td><td class="n" style="color:' + (gb ? gb.color : "inherit") + '">' + fmtPct(B.pour) + "</td><td>" + fmtPct(B.contre) + "</td></tr>";
    }).join("");
    return '<h2 class="compare__title">Taux d\'accord : ' + (ag.pct == null ? "—" : ag.pct + " %") + "</h2>" +
      '<p class="note">Part des scrutins où les deux groupes ont voté majoritairement de la même façon (' + ag.same + " sur " + ag.common + " scrutins où ils ont tous deux participé), pour les sujets cochés. Une même position peut correspondre à un vote pour comme à un vote contre.</p>" +
      '<div class="compare__nums"><span class="compare__num"><b style="color:' + (ga ? ga.color : "inherit") + '">' + fmtPct(totA.presence) + '</b><span>' + esc(ga ? ga.short : "") + ' · participation</span></span><span class="compare__vs">vs</span><span class="compare__num"><b style="color:' + (gb ? gb.color : "inherit") + '">' + fmtPct(totB.presence) + '</b><span>' + esc(gb ? gb.short : "") + " · participation</span></span></div>" +
      '<div class="table-wrap"><table class="ctable"><thead><tr><th rowspan="2">Sujet</th><th colspan="3" style="color:' + (ga ? ga.color : "inherit") + '">' + esc(ga ? ga.short : "—") + '</th><th colspan="3" style="color:' + (gb ? gb.color : "inherit") + '">' + esc(gb ? gb.short : "—") + "</th></tr>" +
      "<tr><th>Partic.</th><th>Pour</th><th>Contre</th><th>Partic.</th><th>Pour</th><th>Contre</th></tr></thead><tbody>" + rows +
      '<tr class="is-total"><td>Tous les scrutins cochés</td><td>' + fmtPct(totA.presence) + "</td><td>" + fmtPct(totA.pour) + "</td><td>" + fmtPct(totA.contre) + "</td><td>" + fmtPct(totB.presence) + "</td><td>" + fmtPct(totB.pour) + "</td><td>" + fmtPct(totB.contre) + "</td></tr></tbody></table></div>";
  }
  function cmpCountLabel() { return selectedCount() + "/" + themesSorted.length; }
  function comparePage() {
    function options(cur) { return senateGroups.map(function (g) { return '<option value="' + g.key + '"' + (cur === g.key ? " selected" : "") + ">" + esc(g.short + " — " + g.label) + "</option>"; }).join(""); }
    var themeChecks = themesSorted.map(function (t) {
      return '<label class="checkline"><input type="checkbox" data-cmp-theme="' + t.id + '"' + (compareState.themes[t.id] ? " checked" : "") + '><span class="dot" style="background:' + t.pastel + '"></span>' + esc(t.name) + " <small>(" + (scrutinsByTheme[t.id] || []).length + ")</small></label>";
    }).join("");
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Comparer deux groupes</h1>' +
      '<p class="page-lede">Comparaison factuelle de deux groupes du Sénat : taux d\'accord, participation et part de votes pour ou contre, sujet par sujet. Aucune appréciation sur le sens des textes.</p></div>' +
      '<div class="compare"><aside class="compare__side"><h2>Groupes à comparer</h2><label for="cmp-a">1. Premier groupe</label><select id="cmp-a" data-cmp="a">' + options(compareState.a) + "</select>" +
      '<label for="cmp-b">2. Second groupe</label><select id="cmp-b" data-cmp="b">' + options(compareState.b) + "</select>" +
      '<div style="margin-top:14px"><label class="switch"><input type="checkbox" data-excludeabs-cmp' + (compareState.excludeAbs ? " checked" : "") + '>Exclure l\'abstention</label></div>' +
      '<div class="filters__group" style="border-top:1px solid var(--line);padding-top:12px;margin-top:14px"><p class="filters__label">Sujets pris en compte <span id="cmp-count">' + cmpCountLabel() + '</span></p>' + themeChecks +
      '<button class="btn btn--small" data-cmp-all style="margin-top:8px">Tout cocher / décocher</button></div>' +
      '<p class="note" style="margin-top:12px">« Pour » et « contre » portent sur les votes émis (pour + contre + abstentions) ; les non-votants sont exclus. La participation rapporte les votes émis aux sièges du groupe au jour de chaque vote.</p></aside>' +
      '<div class="compare__main" id="compare-main">' + compareMain() + "</div></div></div>";
  }

  /* ---------- Méthode ---------- */
  function methodePage() {
    var all = Object.keys(DATA.scrutins);
    var anCount = all.filter(function (k) { return DATA.scrutins[k].an; }).length;
    var textCount = Object.keys(DATA.anByText || {}).length;
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Méthode et sources</h1><p class="page-lede">Ce site restitue des votes publics. Voici d\'où viennent les données, comment les scrutins sont choisis, et ce que les chiffres ne disent pas.</p></div><div class="prose">' +
      '<div class="callout"><strong>Principe de neutralité.</strong> Le site ne note pas les textes, ne classe pas les partis et ne recommande aucun vote. Il indique ce que change chaque texte (résumé factuel), s\'il a été adopté ou rejeté, son origine (gouvernement ou parlement) et la répartition des votes par groupe (pour, contre, abstention).</div>' +
      "<h2>1. Les votes</h2><p>Les scrutins du Sénat proviennent des <strong>pages officielles de scrutins publics de senat.fr</strong>. Les votes de l'<strong>Assemblée nationale</strong> proviennent des <strong>dumps officiels data.assemblee-nationale.fr</strong> (16ᵉ et 17ᵉ législatures).</p>" +
      '<div class="kv"><div><dt>Scrutins analysés</dt><dd>' + n(all.length) + " scrutins du Sénat, répartis sur " + textCount + " textes ; " + n(anCount) + " sont les votes sur l'ensemble vérifiés comme correspondant à un vote de l'Assemblée</dd></div>" +
      "<div><dt>Période</dt><dd>" + esc(frDate(DATA.period.from)) + " → " + esc(frDate(DATA.period.to)) + "</dd></div><div><dt>Contrôles</dt><dd>somme des groupes = totaux, cohérence des effectifs ; tout scrutin incohérent est écarté</dd></div></div>" +
      "<h2>2. Ce qui est inclus</h2><p>Tous les <strong>votes publics</strong> du Sénat de la période : votes sur l'ensemble des textes, sur les articles et sur les amendements, ainsi que les motions de procédure. Chaque vote est regroupé par <strong>texte</strong> (dossier législatif).</p>" +
      "<h2>3. Assemblée nationale : au niveau du texte, pas de l'amendement</h2><p>Les deux chambres ne votent pas les mêmes amendements (numérotation et rédaction différentes). Le site affiche donc, pour chaque <strong>texte</strong>, les votes publics de l'Assemblée nationale sur ce texte, et une fiche détaillée (pour/contre par groupe AN) pour les votes sur l'ensemble vérifiés comme correspondants.</p>" +
      "<h2>4. Composition et non-inscrits</h2><p>Pas de groupe <strong>LFI</strong> au Sénat (aucun sénateur LFI ; gauche représentée par SER, CRCE-K et GEST). Le <strong>RN</strong> compte 4 sénateurs, sous le seuil de 10 pour former un groupe : ils siègent comme non-inscrits (« NI »). À l'Assemblée, RN et LFI-NFP existent et apparaissent dans les blocs « Assemblée ».</p>" +
      "<h2>5. Limites</h2><ul><li>Agréger des votes ne résume pas un texte : le dossier législatif est lié pour chaque vote.</li><li>Les pourcentages dépendent de la participation (les non-votants sont exclus) ; un faible nombre de votants doit être lu avec prudence.</li><li>Les effectifs et intitulés des groupes varient dans le temps ; les graphiques utilisent les effectifs au jour de chaque vote.</li><li>Les résumés « ce que change le texte » sont fournis pour les principaux votes sur l'ensemble ; les autres fiches reprennent l'intitulé officiel.</li></ul>" +
      "<h2>6. Sources et réutilisation</h2><p>Données publiques sous <strong>Licence Ouverte 2.0 (Etalab)</strong> : réutilisation avec mention de la source. Sénat : <a href=\"https://www.senat.fr/scrutin-public/scr2025.html\" target=\"_blank\" rel=\"noopener\">senat.fr</a> · Assemblée : <a href=\"" + esc(DATA.anSource.url) + "\" target=\"_blank\" rel=\"noopener\">data.assemblee-nationale.fr</a>.</p>" +
      '<p class="note">Site citoyen indépendant, sans affiliation avec le Sénat, l\'Assemblée nationale ou un parti politique. Aucun cookie, aucun traceur.</p></div></div>';
  }

  function notFound() { return '<div class="wrap"><div class="page-head"><h1 class="page-title">Page introuvable</h1><p class="page-lede">Le contenu demandé n\'existe pas ou plus. <a href="#/">Revenir aux sujets</a>.</p></div></div>'; }

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
    var map = { home: "home", sujet: "home", votes: "votes", groupes: "groupes", comparer: "comparer" };
    var links = document.querySelectorAll("[data-tab]");
    for (var i = 0; i < links.length; i++) {
      if (map[name] === links[i].getAttribute("data-tab")) links[i].classList.add("is-active"); else links[i].classList.remove("is-active");
    }
  }
  function render() {
    var route = parseHash(), html, title = "Sénat·Vote", scrollTarget = null;
    if (route.name === "home") { html = homePage(); title += " — les votes par sujet"; }
    else if (route.name === "sujet") { var openSid = route.query.get("v") || null; html = themePage(route.args[0], openSid); var t = themeById(route.args[0]); title += t ? " — " + t.name : ""; if (openSid) scrollTarget = "v-" + openSid; }
    else if (route.name === "votes") { votesState.q = route.query.get("q") || ""; votesState.page = 1; html = votesPage(); title += " — tous les votes"; }
    else if (route.name === "comparer") { html = comparePage(); title += " — comparer deux groupes"; }
    else if (route.name === "groupes") { html = groupesPage(); title += " — les groupes politiques"; }
    else if (route.name === "methode") { html = methodePage(); title += " — méthode et sources"; }
    else { html = notFound(); title += " — page introuvable"; }
    app.innerHTML = html; setTabs(route.name); document.title = title;
    if (scrollTarget) { var el = document.getElementById(scrollTarget); if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("is-open"); } } else window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  /* ---------- Interactions ---------- */
  app.addEventListener("click", function (e) {
    var toggle = e.target.closest("[data-toggle]");
    if (toggle) { var row = toggle.closest(".vrow"); if (row) { row.classList.toggle("is-open"); toggle.setAttribute("aria-expanded", row.classList.contains("is-open") ? "true" : "false"); } return; }
    var allBtn = e.target.closest("[data-cmp-all]");
    if (allBtn) {
      var allOn = selectedCount() === themesSorted.length;
      themesSorted.forEach(function (t) { compareState.themes[t.id] = !allOn; });
      render();
      return;
    }
    var pageBtn = e.target.closest("[data-page]");
    if (pageBtn) { var p = parseInt(pageBtn.getAttribute("data-page"), 10); if (p > 0) { votesState.page = p; var l = document.getElementById("votelist"); if (l) l.innerHTML = voteListHTML(); window.scrollTo(0, 0); } return; }
    var chamberBtn = e.target.closest("[data-chamber]");
    if (chamberBtn) { themeState.chamber = chamberBtn.getAttribute("data-chamber"); var r = parseHash(); var t = r.name === "sujet" ? themeById(r.args[0]) : null; if (t) document.getElementById("chart-area").innerHTML = themeChartArea(t); }
  });
  app.addEventListener("change", function (e) {
    var el = e.target;
    function refresh() { votesState.page = 1; var l = document.getElementById("votelist"); if (l) l.innerHTML = voteListHTML(); }
    if (el.matches("[data-theme]")) { votesState.themes[el.getAttribute("data-theme")] = el.checked; refresh(); }
    else if (el.matches("[data-group]")) { votesState.group = el.value; refresh(); }
    else if (el.matches("[data-origin]")) { votesState.origin = el.value; refresh(); }
    else if (el.matches("[data-withan]")) { votesState.withAn = el.checked; refresh(); }
    else if (el.matches("[data-cmp]")) { compareState[el.getAttribute("data-cmp")] = el.value; var cm = document.getElementById("compare-main"); if (cm) cm.innerHTML = compareMain(); }
    else if (el.matches("[data-excludeabs-cmp]")) { compareState.excludeAbs = el.checked; var cm2 = document.getElementById("compare-main"); if (cm2) cm2.innerHTML = compareMain(); }
    else if (el.matches("[data-cmp-theme]")) {
      compareState.themes[el.getAttribute("data-cmp-theme")] = el.checked;
      var cc = document.getElementById("cmp-count"); if (cc) cc.textContent = cmpCountLabel();
      var cm3 = document.getElementById("compare-main"); if (cm3) cm3.innerHTML = compareMain();
    }
  });
  app.addEventListener("input", function (e) {
    if (e.target.matches("[data-q]")) { votesState.q = e.target.value; votesState.page = 1; var l = document.getElementById("votelist"); if (l) l.innerHTML = voteListHTML(); }
  });
  app.addEventListener("submit", function (e) {
    if (e.target.matches("[data-search]")) { e.preventDefault(); var input = e.target.querySelector("input"); var q = input ? input.value.trim() : ""; window.location.hash = "#/votes" + (q ? "?q=" + encodeURIComponent(q) : ""); }
  });

  window.addEventListener("hashchange", render);
  render();
})();
