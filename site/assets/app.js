/* Sénat·Vote — application (vanilla JS, routage par hash) */
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
  function themeById(id) { return DATA.themes.find(function (t) { return t.id === id; }) || null; }
  function themeOf(sid) { var s = DATA.scrutins[sid]; return s ? themeById(s.theme) : null; }
  function scrutinsOf(theme) { return theme.scrutins.map(function (id) { return DATA.scrutins[id]; }).filter(Boolean); }
  function byDateDesc(a, b) { return (b.date || "").localeCompare(a.date || ""); }

  var ICONS = {
    euro: '<path d="M17.5 8.6A6.5 6.5 0 1 0 17.5 15.4"/><path d="M5.5 11h8.5M5.5 13.5h8"/>',
    shield: '<path d="M12 3.5 19 6.2v5.1c0 4.8-3.4 7.9-7 9.7-3.6-1.8-7-4.9-7-9.7V6.2z"/><path d="m9 12 2.1 2.1L15.5 9.5"/>',
    scale: '<path d="M12 4.5v15M6 8.5h12M8.5 19.5h7"/><path d="m6 8.5-2.5 5h5zM18 8.5l-2.5 5h5z"/>',
    heart: '<path d="M12 20s-7.3-4.4-9.2-8.2A5 5 0 0 1 12 6.6a5 5 0 0 1 9.2 5.2C19.3 15.6 12 20 12 20z"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.8 3.4 2.8 13.6 0 17-2.8-3.4-2.8-13.6 0-17z"/>',
    leaf: '<path d="M5 19C5 10 11.5 5.2 20 4.5 19 13.5 15 19.5 6.5 19.5z"/><path d="M5 19c3.2-5.2 7.2-8.2 11-9.5"/>',
    balance: '<path d="M4.5 19.5h15"/><path d="M7.5 19.5V9.5M12 19.5V5M16.5 19.5v-7.5"/><circle cx="7.5" cy="7" r="1.4"/><circle cx="12" cy="3.6" r="1.4"/><circle cx="16.5" cy="9.6" r="1.4"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.balance) + "</svg>";
  }

  var DIR_LABEL = { favorable: "Texte en faveur", defavorable: "Texte en défaveur", neutre: "Texte neutre" };
  var DIR_BADGE = { favorable: "b--fav", defavorable: "b--unfav", neutre: "b--neutral" };
  var RES_LABEL = { favorable: "Résultat favorable", defavorable: "Résultat défavorable" };
  var RES_BADGE = { favorable: "b--fav", defavorable: "b--unfav" };

  function resultBadge(chamber, result, extra) {
    var cls = result === "Adoption" ? "b--adopted" : "b--rejected";
    var label = result === "Adoption" ? "Adopté" : "Rejeté";
    return '<span class="b ' + cls + '">' + esc(chamber) + " · " + label + (extra ? " " + esc(extra) : "") + "</span>";
  }

  /* ---------- Agrégats par thème et par chambre ---------- */

  function themeChartRows(theme, chamber, excludeAbs) {
    var acc = {};
    scrutinsOf(theme).forEach(function (s) {
      if (s.qualification.direction === "neutre") return;
      var groups = chamber === "senat" ? s.groups.map(senateGroup) : (s.an ? s.an.groups : []);
      groups.forEach(function (g) {
        if (!acc[g.key]) acc[g.key] = { key: g.key, short: g.short || g.key, label: g.label, color: g.color, fav: 0, unfav: 0, abs: 0 };
        var a = acc[g.key];
        a.fav += s.qualification.direction === "favorable" ? g.pour : g.contre;
        a.unfav += s.qualification.direction === "favorable" ? g.contre : g.pour;
        a.abs += g.abstention;
      });
    });
    var rows = Object.keys(acc).map(function (k) {
      var a = acc[k];
      var denom = excludeAbs ? a.fav + a.unfav : a.fav + a.unfav + a.abs;
      a.pctFav = denom ? Math.round((100 * a.fav) / denom) : 0;
      a.pctUnfav = denom ? Math.round((100 * a.unfav) / denom) : 0;
      a.pctAbs = excludeAbs ? 0 : 100 - a.pctFav - a.pctUnfav;
      a.votes = a.fav + a.unfav + a.abs;
      return a;
    }).filter(function (a) { return a.votes > 0; });
    rows.sort(function (x, y) { return y.votes - x.votes; });
    return rows;
  }

  function renderChart(rows) {
    if (!rows.length) return '<p class="empty">Aucune donnée pour ce graphique.</p>';
    var yl = [100, 75, 50, 25].map(function (v) {
      return '<span style="top:' + (100 - v) + '%">' + v + "</span>";
    }).join("") + '<span style="top:100%">0</span>';
    var cols = rows.map(function (r) {
      var segs = "";
      function seg(cls, h, value, showPct) {
        if (h <= 0) return "";
        return '<div class="col__seg ' + cls + '" style="height:' + h + '%">' +
          (showPct && h >= 14 ? '<span class="col__pct">' + value + " %</span>" : "") + "</div>";
      }
      var dominant = Math.max(r.pctFav, r.pctUnfav, r.pctAbs);
      segs += seg("col__seg--unfav", r.pctUnfav, r.pctUnfav, r.pctUnfav === dominant);
      segs += seg("col__seg--abs", r.pctAbs, r.pctAbs, r.pctAbs === dominant);
      segs += seg("col__seg--fav", r.pctFav, r.pctFav, r.pctFav === dominant);
      return '<div class="col" style="--c:' + r.color + '" title="' + esc(r.label + " : " + r.pctFav + " % en faveur, " + r.pctUnfav + " % contre, " + r.pctAbs + " % abstention") + '">' +
        '<div class="col__stack">' + segs + "</div>" +
        '<div class="col__label"><span class="col__dot"></span>' + esc(r.short) + "</div>" +
        "</div>";
    }).join("");
    return '<div class="chart">' +
      '<div class="chart__ylabels">' + yl + "</div>" +
      '<div class="chart__grid"></div>' +
      '<div class="chart__scroll"><div class="chart__plot">' + cols + "</div></div>" +
      "</div>" +
      '<div class="chart-legend">' +
      '<span><i class="l-fav"></i>Votes en faveur de l\'objectif</span>' +
      '<span><i class="l-abs"></i>Abstention</span>' +
      '<span><i class="l-unfav"></i>Votes contre l\'objectif</span>' +
      "</div>";
  }

  /* ---------- Ligne de vote ---------- */

  function senateGroup(g) {
    var m = groupMeta[g.key] || {};
    return { key: g.key, label: g.label || m.label || g.key, short: m.short || g.key, color: m.color || "#8B95A9",
             size: g.size, pour: g.pour, contre: g.contre, abstention: g.abstention, nonVotants: g.nonVotants };
  }

  function groupBars(groups, sortBySize) {
    var list = groups.slice();
    if (sortBySize !== false) list.sort(function (a, b) { return (b.size || 0) - (a.size || 0); });
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
        '<span class="gbar__tag" style="--c:' + g.color + '"><span class="gbar__dot" style="background:' + g.color + '"></span>' + esc(g.short || g.key) + "</span>" +
        '<div class="gbar__stack" role="img" aria-label="' + esc(g.label + " : " + g.pour + " pour, " + g.contre + " contre, " + g.abstention + " abstentions, " + g.nonVotants + " non-votants") + '">' + seg + "</div>" +
        '<div class="gbar__counts"><span class="p"><b>' + n(g.pour) + "</b> P</span><span class=\"c\"><b>" + n(g.contre) + "</b> C</span><span><b>" + n(g.abstention) + "</b> A</span><span><b>" + n(g.nonVotants) + "</b> NV</span>" + (exp ? '<span>' + pct(g.pour, exp) + " % P</span>" : "") + "</div>" +
        "</div>";
    }).join("");
  }

  function totalsChips(t) {
    return '<div class="totals">' +
      '<span class="tot tot--pour"><b>' + n(t.pour) + "</b> pour</span>" +
      '<span class="tot tot--contre"><b>' + n(t.contre) + "</b> contre</span>" +
      '<span class="tot"><b>' + n(t.abstention) + "</b> abst.</span>" +
      '<span class="tot"><b>' + n(t.nonVotants) + "</b> non-votants</span>" +
      '<span class="tot">' + n(t.votants) + " votants</span>" +
      "</div>";
  }

  function voteRow(s, opts) {
    opts = opts || {};
    var theme = themeById(s.theme);
    var q = s.qualification;
    var meta = "";
    meta += resultBadge("Sénat", s.result);
    if (s.an) meta += '<span class="b b--an">AN · ' + (s.an.result === "Adoption" ? "adopté" : "rejeté") + " · " + esc(s.an.stage) + "</span>";
    else meta += '<span class="b b--an">AN · pas de vote public</span>';
    meta += '<span class="b ' + DIR_BADGE[q.direction] + '">' + esc(DIR_LABEL[q.direction]) + "</span>";
    if (s.resultEffect) meta += '<span class="b ' + RES_BADGE[s.resultEffect] + '">' + esc(RES_LABEL[s.resultEffect]) + "</span>";

    var senat = '<div class="chamber">' +
      '<div class="chamber__head"><div class="chamber__title">Sénat<small>' + esc(frDate(s.date)) + "</small></div>" + resultBadge("Sénat", s.result) + "</div>" +
      totalsChips(s.totals) +
      groupBars(s.groups.map(senateGroup)) +
      '<div class="vrow__links">' +
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">Page du scrutin (senat.fr) ↗</a>' +
        (s.dossierUrl ? '<a href="' + esc(s.dossierUrl) + '" target="_blank" rel="noopener">Dossier législatif ↗</a>' : "") +
      "</div></div>";

    var anBlock;
    if (s.an) {
      anBlock = '<div class="chamber">' +
        '<div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>' + esc(frDate(s.an.date)) + " · " + esc(s.an.stage) + " · " + s.an.legislature + "ᵉ législature</small></div>" + resultBadge("AN", s.an.result) + "</div>" +
        totalsChips(s.an.totals) +
        groupBars(s.an.groups) +
        (s.anNote ? '<p class="note" style="margin:10px 0 0">' + esc(s.anNote) + "</p>" : "") +
        '<div class="vrow__links"><a href="' + esc(s.an.url) + '" target="_blank" rel="noopener">Page du vote (Assemblée nationale) ↗</a></div>' +
        "</div>";
    } else {
      anBlock = '<div class="chamber"><div class="chamber__head"><div class="chamber__title">Assemblée nationale<small>Aucun vote public recensé sur ce texte</small></div></div>' +
        '<p class="chamber__empty">Le texte n\'a pas fait l\'objet d\'un vote public de l\'Assemblée nationale dans les données officielles (texte encore en navette, rejeté au Sénat, ou adopté sans scrutin public sur l\'ensemble).</p></div>';
    }

    return '<article class="vrow' + (opts.open ? " is-open" : "") + '" id="v-' + esc(s.id) + '">' +
      '<button class="vrow__head" data-toggle aria-expanded="' + (opts.open ? "true" : "false") + '">' +
        '<span class="vrow__eyebrow">' + (theme ? '<span class="miniicon" style="background:' + theme.pastel + '">' + icon(theme.icon) + "</span>" + esc(theme.name) : "Scrutin") + "</span>" +
        '<span class="vrow__title">' + esc(s.title.replace(/^sur /, "Sur ")) + "</span>" +
        '<span class="vrow__meta">' + meta + '<span class="vrow__date">' + esc(frDateShort(s.date)) + '</span><span class="vrow__chev">▾</span></span>' +
      "</button>" +
      '<div class="vrow__body">' +
        '<p class="qualnote"><b>Pourquoi cette qualification ?</b>' + esc(q.note) + "</p>" +
        '<div class="chambers">' + senat + anBlock + "</div>" +
      "</div>" +
    "</article>";
  }

  /* ---------- Accueil ---------- */

  function homePage() {
    var sujets = DATA.themes.map(function (t) {
      var withAn = scrutinsOf(t).filter(function (s) { return s.an; }).length;
      return '<a class="sujet" href="#/sujet/' + encodeURIComponent(t.id) + '">' +
        '<span class="sujet__icon" style="background:' + t.pastel + '">' + icon(t.icon) + "</span>" +
        '<span><span class="sujet__name">' + esc(t.name) + '</span><span class="sujet__meta">' + t.scrutins.length + " scrutin" + (t.scrutins.length > 1 ? "s" : "") + " au Sénat · " + withAn + " avec vote de l'Assemblée</span></span>" +
        '<span class="sujet__arrow">→</span>' +
      "</a>";
    }).join("");

    var latest = Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; }).sort(byDateDesc).slice(0, 5);
    var rows = latest.map(function (s) { return voteRow(s); }).join("");
    var anCount = Object.keys(DATA.scrutins).filter(function (k) { return DATA.scrutins[k].an; }).length;

    return "" +
      '<div class="home">' +
        '<div class="home__left">' +
          '<span class="home__kicker">Observatoire citoyen · Sénat & Assemblée</span>' +
          '<h1 class="home__title">Comment votent-ils sur ce qui vous préoccupe ?</h1>' +
          '<p class="home__lede">Les scrutins publics du Sénat et de l\'Assemblée nationale, classés par sujets de préoccupation des Français, avec le sens du vote : en faveur ou contre chaque objectif, groupe par groupe.</p>' +
          '<form class="home__search" data-search><input type="search" placeholder="Un sujet, un vote, un groupe…" aria-label="Rechercher un vote"><button class="btn btn--black" type="submit">Rechercher</button></form>' +
          '<a class="home__card" href="#/comparer"><strong>Quels groupes votent le plus en faveur des sujets qui comptent pour vous&nbsp;?</strong><span>Comparer les groupes →</span></a>' +
        "</div>" +
        '<div class="home__right">' +
          '<div class="section-head"><h2>Les sujets analysés</h2><p class="note">' + DATA.themes.length + " sujets, classés par leur poids dans l'opinion</p></div>" +
          sujets +
          '<p style="margin-top:16px"><a class="btn btn--black" href="#/votes">Parcourir tous les votes</a></p>' +
        "</div>" +
      "</div>" +
      '<div class="wrap">' +
        '<div class="stats">' +
          '<span class="stat"><b>' + Object.keys(DATA.scrutins).length + "</b> scrutins analysés</span>" +
          '<span class="stat"><b>' + anCount + "</b> croisés avec l'Assemblée nationale</span>" +
          '<span class="stat"><b>' + n(DATA.senatorCount) + "</b> sénateurs · <b>" + n(DATA.deputeCount) + "</b> députés</span>" +
          '<span class="stat">Mis à jour le <b>' + esc(frDate(DATA.generatedAt.slice(0, 10))) + "</b></span>" +
        "</div>" +
        '<section class="section"><div class="section-head"><h2>Derniers votes analysés</h2><p class="note"><a href="#/votes">Tous les votes</a></p></div><div class="vlist">' + rows + "</div></section>" +
      "</div>";
  }

  /* ---------- Page sujet ---------- */

  var themeState = { chamber: "senat", excludeAbs: false };

  function themeChartArea(theme) {
    var hasAn = scrutinsOf(theme).some(function (s) { return s.an && s.qualification.direction !== "neutre"; });
    var chamber = hasAn ? themeState.chamber : "senat";
    var rows = themeChartRows(theme, chamber, themeState.excludeAbs);
    var qualifyCount = scrutinsOf(theme).filter(function (s) { return s.qualification.direction !== "neutre"; }).length;
    var countNote = chamber === "senat"
      ? "sur " + qualifyCount + " scrutin" + (qualifyCount > 1 ? "s" : "") + " qualifié" + (qualifyCount > 1 ? "s" : "")
      : "sur les " + scrutinsOf(theme).filter(function (s) { return s.an && s.qualification.direction !== "neutre"; }).length + " scrutins ayant fait l'objet d'un vote public à l'Assemblée";
    var head = '<div class="chart-card__head">' +
      "<div><h2>" + (chamber === "senat" ? "Les votes du Sénat" : "Les votes de l'Assemblée nationale") + " pour ou contre l'objectif</h2>" +
      '<p class="note">En % des voix exprimées par groupe, ' + countNote + ".</p></div>" +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
        '<div class="segmented" role="group" aria-label="Chambre">' +
          '<button data-chamber="senat" class="' + (chamber === "senat" ? "is-on" : "") + '">Sénat</button>' +
          '<button data-chamber="an" class="' + (chamber === "an" ? "is-on" : "") + '"' + (hasAn ? "" : " disabled") + '>Assemblée nationale</button>' +
        "</div>" +
        '<label class="switch"><input type="checkbox" data-excludeabs' + (themeState.excludeAbs ? " checked" : "") + ">Exclure l'abstention</label>" +
      "</div></div>";
    var note = themeState.excludeAbs
      ? "Les abstentions sont exclues du calcul : le pourcentage porte sur les votes pour et contre uniquement."
      : "Par défaut, une abstention n'est pas comptée comme un vote en faveur de l'objectif.";
    return head + renderChart(rows) + '<p class="note" style="margin-top:12px">' + note + " Les textes dont l'effet est <em>neutre</em> sont exclus de ce graphique.</p>";
  }

  function themePage(id, openSid) {
    var t = themeById(id);
    if (!t) return notFound();
    var scrutins = scrutinsOf(t).sort(byDateDesc);
    var withAn = scrutins.filter(function (s) { return s.an; }).length;
    var rank = DATA.themes.slice().sort(function (a, b) { return b.primaryScore - a.primaryScore; }).findIndex(function (x) { return x.id === t.id; }) + 1;
    var rows = scrutins.map(function (s) { return voteRow(s, { open: s.id === openSid }); }).join("");
    var objective = t.goal.replace(/^Objectif de référence : /, "");

    return "" +
      '<div class="backrow"><a class="btn btn--small" href="#/">← Retour</a></div>' +
      '<div class="hero-band" style="--pastel:' + t.pastel + '">' +
        '<div class="hero-band__inner">' +
          "<div>" +
            '<span class="hero-band__icon">' + icon(t.icon) + "</span>" +
            "<h1>" + esc(t.name) + "</h1>" +
            '<p class="hero-band__sub">Les votes du Sénat et de l\'Assemblée nationale en faveur ou contre : ' + esc(objective) + ".</p>" +
            '<div class="chips">' +
              '<span class="chip"><b>' + rank + 'ᵉ</b> priorité des Français</span>' +
              '<span class="chip">Elabe · <b>' + t.primaryScore + " %</b></span>" +
              (t.secondaryScore ? '<span class="chip">' + esc(t.secondaryLabel) + " · <b>" + t.secondaryScore + " %</b></span>" : "") +
              '<span class="chip"><b>' + t.scrutins.length + "</b> scrutin" + (t.scrutins.length > 1 ? "s" : "") + "</span>" +
              '<span class="chip"><b>' + withAn + "</b> avec vote de l'Assemblée</span>" +
            "</div>" +
          "</div>" +
          '<div class="goalcard"><h2>Le sujet et l\'objectif de référence</h2><p>' + esc(t.description) + "</p><p>" + esc(t.goal) + "</p>" +
          '<p class="note">Sources : <a href="' + esc(DATA.opinion.primary.url) + '" target="_blank" rel="noopener">' + esc(DATA.opinion.primary.label) + "</a> (" + esc(DATA.opinion.primary.date) + ") · <a href=\"" + esc(DATA.opinion.secondary.url) + '" target="_blank" rel="noopener">Ipsos</a> (' + esc(DATA.opinion.secondary.date) + "). Les votes sont qualifiés par rapport à cet objectif, affiché pour permettre à chacun d\'en discuter le cadre.</p></div>" +
        "</div>" +
      "</div>" +
      '<div class="wrap">' +
        '<section class="section"><div class="chart-card" id="chart-area">' + themeChartArea(t) + "</div></section>" +
        '<section class="section"><div class="section-head"><h2>Les scrutins</h2><p class="note">Votes publics liés à ce sujet, du plus récent au plus ancien.</p></div><div class="vlist">' + rows + "</div>" +
        '<p class="note" style="margin-top:12px">Chaque fiche indique la position du Sénat et, lorsqu\'il existe, le vote correspondant de l\'Assemblée nationale sur le même texte, avec les liens vers les sources officielles.</p></section>' +
      "</div>";
  }

  /* ---------- Page Votes ---------- */

  var votesState = { dir: "tous", themes: {}, group: "", withAn: false, q: "" };

  function filterVotes() {
    var list = Object.keys(DATA.scrutins).map(function (k) { return DATA.scrutins[k]; });
    list = list.filter(function (s) {
      if (votesState.dir === "fav" && s.qualification.direction !== "favorable") return false;
      if (votesState.dir === "unfav" && s.qualification.direction !== "defavorable") return false;
      var sel = Object.keys(votesState.themes).filter(function (k) { return votesState.themes[k]; });
      if (sel.length && sel.indexOf(s.theme) === -1) return false;
      if (votesState.withAn && !s.an) return false;
      if (votesState.group) {
        var has = s.groups.some(function (g) { return g.key === votesState.group; });
        if (!has) return false;
      }
      if (votesState.q) {
        var q = votesState.q.toLowerCase();
        var hay = (s.title + " " + (s.an ? s.an.title : "")).toLowerCase();
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
    var themeChecks = DATA.themes.map(function (t) {
      return '<label class="checkline"><input type="checkbox" data-theme="' + t.id + '"' + (votesState.themes[t.id] ? " checked" : "") + '><span class="dot" style="--c:' + t.pastel + ';background:' + t.pastel + '"></span>' + esc(t.name) + "</label>";
    }).join("");
    var groupOptions = '<option value="">Tous les groupes (Sénat)</option>' + senateGroups.map(function (g) {
      return '<option value="' + g.key + '"' + (votesState.group === g.key ? " selected" : "") + ">" + esc(g.short + " — " + g.label) + "</option>";
    }).join("");

    return '<div class="wrap">' +
      '<div class="page-head"><h1 class="page-title">Tous les votes</h1>' +
      "<p class=\"page-lede\">" + Object.keys(DATA.scrutins).length + " scrutins du Sénat, qualifiés <strong>en faveur</strong> ou <strong>en défaveur</strong> de l'objectif du sujet, avec le résultat de l'Assemblée nationale lorsqu'il existe. La qualification est documentée : <a href=\"#/methode\">voir la méthode</a>.</p></div>" +
      '<div class="layout">' +
        '<aside class="filters">' +
          "<h2>Filtres</h2>" +
          '<div class="filters__group"><input type="search" data-q placeholder="Un vote, un texte…" value="' + esc(votesState.q) + '" aria-label="Rechercher"></div>' +
          '<div class="filters__group"><p class="filters__label">Sens du texte</p><div class="segmented" role="group">' +
            '<button data-dir="tous" class="' + (votesState.dir === "tous" ? "is-on" : "") + '">Tous</button>' +
            '<button data-dir="fav" class="' + (votesState.dir === "fav" ? "is-on" : "") + '">En faveur</button>' +
            '<button data-dir="unfav" class="' + (votesState.dir === "unfav" ? "is-on" : "") + '">En défaveur</button>' +
          "</div></div>" +
          '<div class="filters__group"><p class="filters__label">Sujets</p>' + themeChecks + "</div>" +
          '<div class="filters__group"><p class="filters__label">Groupe politique</p><select data-group>' + groupOptions + "</select></div>" +
          '<div class="filters__group"><label class="switch"><input type="checkbox" data-withan' + (votesState.withAn ? " checked" : "") + ">Uniquement les votes avec un vote de l'Assemblée</label></div>" +
        "</aside>" +
        '<div id="votelist">' + voteListHTML() + "</div>" +
      "</div></div>";
  }

  /* ---------- Page Comparer ---------- */

  var compareState = { a: senateGroups[0] ? senateGroups[0].key : "", b: senateGroups[1] ? senateGroups[1].key : "", excludeAbs: false };

  function groupStatsAll(groupKey, excludeAbs) {
    var fav = 0, unfav = 0, abs = 0;
    DATA.themes.forEach(function (t) {
      scrutinsOf(t).forEach(function (s) {
        if (s.qualification.direction === "neutre") return;
        var g = s.groups.find(function (x) { return x.key === groupKey; });
        if (!g) return;
        fav += s.qualification.direction === "favorable" ? g.pour : g.contre;
        unfav += s.qualification.direction === "favorable" ? g.contre : g.pour;
        abs += g.abstention;
      });
    });
    var denom = excludeAbs ? fav + unfav : fav + unfav + abs;
    return { fav: fav, unfav: unfav, abs: abs, pct: denom ? Math.round((100 * fav) / denom) : 0, votes: fav + unfav + abs };
  }

  function compareMain() {
    var ga = groupMeta[compareState.a], gb = groupMeta[compareState.b];
    var sa = groupStatsAll(compareState.a, compareState.excludeAbs);
    var sb = groupStatsAll(compareState.b, compareState.excludeAbs);

    var rows = DATA.themes.map(function (t) {
      var fA = 0, uA = 0, aA = 0, fB = 0, uB = 0, aB = 0;
      var sc = scrutinsOf(t);
      sc.forEach(function (s) {
        if (s.qualification.direction === "neutre") return;
        var gA = s.groups.find(function (x) { return x.key === compareState.a; });
        var gB = s.groups.find(function (x) { return x.key === compareState.b; });
        var isFav = s.qualification.direction === "favorable";
        if (gA) { fA += isFav ? gA.pour : gA.contre; uA += isFav ? gA.contre : gA.pour; aA += gA.abstention; }
        if (gB) { fB += isFav ? gB.pour : gB.contre; uB += isFav ? gB.contre : gB.pour; aB += gB.abstention; }
      });
      function pctOf(f, u, a) { var d = compareState.excludeAbs ? f + u : f + u + a; return d ? Math.round((100 * f) / d) : null; }
      var pA = pctOf(fA, uA, aA), pB = pctOf(fB, uB, aB);
      if (pA == null && pB == null) return "";
      return '<tr><td class="tname">' + esc(t.name) + "<small>" + t.scrutins.length + " vote" + (t.scrutins.length > 1 ? "s" : "") + "</small></td>" +
        '<td class="n" style="color:' + (ga ? ga.color : "inherit") + '">' + (pA == null ? "—" : pA + " %") + "</td>" +
        '<td class="n" style="color:' + (gb ? gb.color : "inherit") + '">' + (pB == null ? "—" : pB + " %") + "</td></tr>";
    }).join("");

    return '<h2 class="compare__title">Qui vote en faveur des sujets qui comptent ?</h2>' +
      '<p class="note">Part des votes en faveur de l\'objectif de chaque sujet, en % des voix exprimées par le groupe au Sénat. ' +
      (compareState.excludeAbs ? "Abstentions exclues." : "Par défaut, les abstentions ne sont pas comptées comme des votes en faveur.") + "</p>" +
      '<div class="compare__nums">' +
        '<span class="compare__num"><b style="color:' + (ga ? ga.color : "inherit") + '">' + sa.pct + '%</b><span>' + esc(ga ? ga.short : "") + "</span></span>" +
        '<span class="compare__vs">vs</span>' +
        '<span class="compare__num"><b style="color:' + (gb ? gb.color : "inherit") + '">' + sb.pct + '%</b><span>' + esc(gb ? gb.short : "") + "</span></span>" +
      "</div>" +
      '<div class="table-wrap"><table class="ctable"><thead><tr><th>Sujet</th><th><span class="thead-dot" style="background:' + (ga ? ga.color : "#999") + '"></span>' + esc(ga ? ga.short : "—") + '</th><th><span class="thead-dot" style="background:' + (gb ? gb.color : "#999") + '"></span>' + esc(gb ? gb.short : "—") + "</th></tr></thead>" +
      "<tbody>" + rows +
      '<tr class="is-total"><td>Tous sujets</td><td>' + sa.pct + '%</td><td>' + sb.pct + "%</td></tr>" +
      "</tbody></table></div>";
  }

  function comparePage() {
    function options(current) {
      return senateGroups.map(function (g) {
        return '<option value="' + g.key + '"' + (current === g.key ? " selected" : "") + ">" + esc(g.short + " — " + g.label) + "</option>";
      }).join("");
    }
    return '<div class="wrap">' +
      '<div class="page-head"><h1 class="page-title">Comparer les groupes</h1>' +
      "<p class=\"page-lede\">Choisissez deux groupes du Sénat et comparez la part de leurs votes en faveur des objectifs des sujets, sur l'ensemble des scrutins analysés.</p></div>" +
      '<div class="compare">' +
        '<aside class="compare__side">' +
          "<h2>Groupes à comparer</h2>" +
          '<label for="cmp-a">1. Premier groupe</label><select id="cmp-a" data-cmp="a">' + options(compareState.a) + "</select>" +
          '<label for="cmp-b">2. Second groupe</label><select id="cmp-b" data-cmp="b">' + options(compareState.b) + "</select>" +
          '<div style="margin-top:14px"><label class="switch"><input type="checkbox" data-excludeabs-cmp' + (compareState.excludeAbs ? " checked" : "") + ">Exclure l'abstention</label></div>" +
          '<p class="note" style="margin-top:12px">Le calcul porte sur les scrutins du Sénat qualifiés « en faveur » ou « en défaveur » de l\'objectif affiché de chaque sujet. Les textes neutres sont exclus.</p>' +
        "</aside>" +
        '<div class="compare__main" id="compare-main">' + compareMain() + "</div>" +
      "</div></div>";
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
      return '<section class="gcard" style="--c:' + g.color + '">' +
        '<div class="gcard__head"><div><h2 class="gcard__name">' + esc(g.short) + "</h2><p class=\"gcard__label\">" + esc(g.label) + "</p></div>" +
        '<div class="gcard__seats">' + n(g.seats) + "<small>sénateurs</small></div></div>" +
        '<div class="gcard__profile">' +
          prow("Présence aux votes", p.presencePct, "#4C6FFF") +
          prow("Votes pour", p.pourPct, "#3BAF7F") +
          prow("Votes contre", p.contrePct, "#E8654F") +
        "</div>" +
        '<p class="note">Sur les ' + Object.keys(DATA.scrutins).length + " scrutins analysés. Présence = suffrages exprimés + abstentions, rapportés aux sièges du groupe au jour de chaque vote.</p>" +
        "<details><summary>Voir les " + g.members.length + " sénateurs du groupe</summary><ul class=\"gmembers\">" + members + "</ul></details>" +
      "</section>";
    }).join("");

    var anRows = DATA.anGroups.map(function (g) {
      return '<div class="anrow"><span class="anrow__dot" style="background:' + g.color + '"></span><b>' + esc(g.short) + "</b><span>" + esc(g.label) + '</span><span class="seats">' + n(g.seats) + "</span></div>";
    }).join("");

    return '<div class="wrap">' +
      '<div class="page-head"><h1 class="page-title">Les groupes politiques</h1><p class="page-lede">Les couleurs de chaque groupe sont utilisées dans tout le site. Effectifs actuels et comportement de vote agrégé.</p></div>' +
      '<section class="section"><div class="section-head"><h2>Au Sénat</h2><p class="note">' + n(DATA.senatorCount) + " sénateurs · " + senateGroups.length + " groupes</p></div><div class=\"gcards\">" + cards + "</div></section>" +
      '<section class="section"><div class="section-head"><h2>À l\'Assemblée nationale</h2><p class="note">' + n(DATA.deputeCount) + " députés · 17ᵉ législature · " + DATA.anGroups.length + " groupes</p></div><div class=\"anlist\">" + anRows + "</div>" +
      '<p class="note" style="margin-top:10px">Les groupes de l\'Assemblée sont regroupés par continuité politique d\'une législature à l\'autre (ex. Renaissance et Ensemble pour la République). Source : annuaire ouvert des députés.</p></section>' +
      "</div>";
  }

  /* ---------- Page Méthode ---------- */

  function methodePage() {
    var anCount = Object.keys(DATA.scrutins).filter(function (k) { return DATA.scrutins[k].an; }).length;
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Méthode et sources</h1>' +
      '<p class="page-lede">Ce site agrège des documents publics et qualifie chaque vote par rapport à un objectif affiché. Voici précisément comment, et ce que cela ne dit pas.</p></div>' +
      '<div class="prose">' +

      '<div class="callout"><strong>Principe de neutralité.</strong> Le site ne note pas les partis et ne recommande aucun vote. Pour chaque sujet, un <strong>objectif de référence</strong> est affiché (par exemple : « réduire la dette et les déficits publics »). Chaque texte est ensuite qualifié, par une note documentée, comme allant <em>en faveur</em>, <em>en défaveur</em> ou étant <em>neutre</em> vis-à-vis de cet objectif, puis le résultat du vote est combiné à cette qualification. Ces cadres sont explicites et discutables : chacun peut vérifier les notes et les sources, et contester le cadre en connaissance de cause.</div>' +

      "<h2>1. Les votes</h2>" +
      "<p>Les scrutins du Sénat proviennent des <strong>pages officielles de scrutins publics de senat.fr</strong> : intitulé, date, totaux (pour, contre, abstentions, non-votants) et ventilation par groupe politique. Le vote correspondant de l'<strong>Assemblée nationale</strong>, lorsqu'il existe, provient des <strong>dumps officiels data.assemblee-nationale.fr</strong> (16ᵉ et 17ᵉ législatures) : mêmes informations, groupe par groupe.</p>" +
      '<div class="kv">' +
        "<div><dt>Scrutins analysés</dt><dd>" + Object.keys(DATA.scrutins).length + " au Sénat, dont " + anCount + " avec un vote de l'Assemblée nationale</dd></div>" +
        "<div><dt>Période</dt><dd>" + esc(frDate(DATA.period.from)) + " → " + esc(frDate(DATA.period.to)) + " (session issue du renouvellement sénatorial de 2023)</dd></div>" +
        "<div><dt>Dernière génération</dt><dd>" + esc(frDate(DATA.generatedAt.slice(0, 10))) + "</dd></div>" +
        "<div><dt>Contrôles automatiques</dt><dd>somme des groupes = totaux, cohérence des effectifs, comparaison croisée des résultats ; toute incohérence bloque la publication</dd></div>" +
      "</div>" +

      "<h2>2. La qualification des votes</h2>" +
      "<p>Pour chaque sujet, le site affiche l'objectif de référence retenu. La qualification répond à une seule question : <strong>ce texte, s'il était appliqué, irait-il dans le sens de cet objectif, à l'encontre, ou serait-il sans effet direct ?</strong> La note associée à chaque vote explique la qualification en une phrase, et le lien vers le dossier législatif permet de vérifier.</p>" +
      "<p>Le <strong>résultat</strong> est ensuite combiné : un texte favorable <em>adopté</em> donne un résultat favorable à l'objectif ; le même texte <em>rejeté</em> donne un résultat défavorable. Les textes <em>neutres</em> sont exclus des graphiques comparatifs.</p>" +
      '<p class="note">Exemple : la proposition de loi créant un impôt plancher de 2 % sur les ultra-riches est qualifiée « en faveur » de l\'objectif « réduire les inégalités ». Le Sénat l\'ayant rejetée, le résultat du vote est indiqué comme défavorable à l\'objectif.</p>' +

      "<h2>3. Le classement des sujets</h2>" +
      "<p>Les sujets sont classés par la part de Français qui les citent comme <strong>priorité d'action pour le gouvernement</strong> (Elabe, « L'état d'esprit des Français pour la rentrée 2026 », 26 août 2026), avec une seconde mesure issue des <strong>préoccupations citées</strong> par Ipsos (juillet 2026).</p>" +
      '<ul><li><a href="' + esc(DATA.opinion.primary.url) + '" target="_blank" rel="noopener">' + esc(DATA.opinion.primary.label) + "</a></li>" +
      '<li><a href="' + esc(DATA.opinion.secondary.url) + '" target="_blank" rel="noopener">' + esc(DATA.opinion.secondary.label) + "</a></li></ul>" +
      "<p>Ces enquêtes mesurent des opinions à une date donnée : elles ne constituent ni un vote, ni une évaluation de l'action du Sénat.</p>" +

      "<h2>4. Comment lire les graphiques</h2>" +
      "<ul>" +
      "<li>Chaque colonne représente un groupe. La <strong>part verte</strong> correspond à la part des voix du groupe allant dans le sens de l'objectif, la <strong>part rouge</strong> à celles allant contre, la <strong>part grise</strong> aux abstentions.</li>" +
      "<li>Par défaut, une abstention n'est pas comptée comme un vote en faveur (option « exclure l'abstention » pour ne compter que les votes pour et contre).</li>" +
      "<li>Les non-votants sont exclus des pourcentages. Les colonnes sont classées par volume de voix exprimées.</li>" +
      "<li>P = pour, C = contre, A = abstention, NV = n'a pas pris part au vote ; les barres sont proportionnelles à l'effectif du groupe au jour du vote.</li>" +
      "</ul>" +

      "<h2>5. Limites</h2>" +
      "<ul>" +
      "<li>Agréger des votes ne résume pas un texte : un même scrutin peut mêler des mesures diverses. Le dossier législatif est lié pour chaque vote.</li>" +
      "<li>La qualification d'un texte par rapport à un objectif reste un jugement documenté : les notes sont fournies pour être lues et contestées.</li>" +
      "<li>Certains textes n'ont pas de vote public de l'Assemblée nationale (navette en cours, rejet au Sénat, adoption sans scrutin sur l'ensemble) ; c'est indiqué vote par vote.</li>" +
      "<li>Les intitulés des groupes et les effectifs varient dans le temps ; les graphiques utilisent les effectifs au jour de chaque vote.</li>" +
      "<li>Les groupes de l'Assemblée sont regroupés par continuité politique entre législatures (Renaissance / Ensemble pour la République, Les Républicains / Droite Républicaine, etc.).</li>" +
      "</ul>" +

      "<h2>6. Réutilisation</h2>" +
      "<p>Données publiques sous <strong>Licence Ouverte 2.0 (Etalab)</strong> : réutilisation libre avec mention de la source. Sénat : " +
      '<a href="https://www.senat.fr/scrutin-public/scr2025.html" target="_blank" rel="noopener">senat.fr</a> · Assemblée : ' +
      '<a href="' + esc(DATA.anSource.url) + '" target="_blank" rel="noopener">data.assemblee-nationale.fr</a>.</p>' +
      '<p class="note">Site citoyen indépendant, sans affiliation avec le Sénat, l\'Assemblée nationale, Elabe, Ipsos ou un parti politique. Aucun cookie, aucun traceur, aucune donnée personnelle.</p>' +

      "</div></div>";
  }

  function notFound() {
    return '<div class="wrap"><div class="page-head"><h1 class="page-title">Page introuvable</h1>' +
      '<p class="page-lede">Le contenu demandé n\'existe pas ou plus. <a href="#/">Revenir aux sujets</a>.</p></div></div>';
  }

  /* ---------- Routage ---------- */

  function parseHash() {
    var raw = window.location.hash.replace(/^#/, "");
    var qIndex = raw.indexOf("?");
    var query = new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : "");
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    if (!path || path === "/") return { name: "home", args: [], query: query };
    var parts = path.replace(/^\//, "").split("/").map(decodeURIComponent);
    return { name: parts[0], args: parts.slice(1), query: query };
  }

  function setTabs(name) {
    var map = { home: "home", sujet: "home", votes: "votes", comparer: "comparer", groupes: "groupes" };
    var links = document.querySelectorAll("[data-tab]");
    for (var i = 0; i < links.length; i++) {
      var k = links[i].getAttribute("data-tab");
      if (map[name] === k) links[i].classList.add("is-active");
      else links[i].classList.remove("is-active");
    }
  }

  function render() {
    var route = parseHash();
    var html, title = "Sénat·Vote";
    var scrollTarget = null;

    if (route.name === "home") { html = homePage(); title += " — les votes par sujet"; }
    else if (route.name === "sujet") {
      var openSid = route.query.get("v") || null;
      html = themePage(route.args[0], openSid);
      var t = themeById(route.args[0]);
      title += t ? " — " + t.name : "";
      if (openSid) scrollTarget = "v-" + openSid;
    }
    else if (route.name === "votes") {
      votesState.q = route.query.get("q") || "";
      var dirParam = route.query.get("dir");
      if (dirParam === "fav" || dirParam === "unfav") votesState.dir = dirParam;
      html = votesPage();
      title += " — tous les votes";
    }
    else if (route.name === "comparer") { html = comparePage(); title += " — comparer les groupes"; }
    else if (route.name === "groupes") { html = groupesPage(); title += " — les groupes politiques"; }
    else if (route.name === "methode") { html = methodePage(); title += " — méthode et sources"; }
    else { html = notFound(); title += " — page introuvable"; }

    app.innerHTML = html;
    setTabs(route.name);
    document.title = title;
    if (scrollTarget) {
      var el = document.getElementById(scrollTarget);
      if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("is-open"); }
    } else {
      window.scrollTo(0, 0);
    }
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
      var t = themeFromChartDom();
      if (t) document.getElementById("chart-area").innerHTML = themeChartArea(t);
      return;
    }
    var dirBtn = e.target.closest("[data-dir]");
    if (dirBtn) {
      votesState.dir = dirBtn.getAttribute("data-dir");
      var seg = dirBtn.parentElement;
      Array.prototype.forEach.call(seg.querySelectorAll("button"), function (b) {
        b.classList.toggle("is-on", b === dirBtn);
      });
      var list = document.getElementById("votelist");
      if (list) list.innerHTML = voteListHTML();
      return;
    }
  });

  app.addEventListener("change", function (e) {
    var el = e.target;
    if (el.matches("[data-theme]")) {
      votesState.themes[el.getAttribute("data-theme")] = el.checked;
      var list = document.getElementById("votelist");
      if (list) list.innerHTML = voteListHTML();
      return;
    }
    if (el.matches("[data-group]")) {
      votesState.group = el.value;
      var l2 = document.getElementById("votelist");
      if (l2) l2.innerHTML = voteListHTML();
      return;
    }
    if (el.matches("[data-withan]")) {
      votesState.withAn = el.checked;
      var l3 = document.getElementById("votelist");
      if (l3) l3.innerHTML = voteListHTML();
      return;
    }
    if (el.matches("[data-excludeabs]")) {
      themeState.excludeAbs = el.checked;
      var t = themeFromChartDom();
      if (t) document.getElementById("chart-area").innerHTML = themeChartArea(t);
      return;
    }
    if (el.matches("[data-cmp]")) {
      compareState[el.getAttribute("data-cmp")] = el.value;
      document.getElementById("compare-main").innerHTML = compareMain();
      return;
    }
    if (el.matches("[data-excludeabs-cmp]")) {
      compareState.excludeAbs = el.checked;
      document.getElementById("compare-main").innerHTML = compareMain();
      return;
    }
  });

  app.addEventListener("input", function (e) {
    if (e.target.matches("[data-q]")) {
      votesState.q = e.target.value;
      var list = document.getElementById("votelist");
      if (list) list.innerHTML = voteListHTML();
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

  function themeFromChartDom() {
    var route = parseHash();
    return route.name === "sujet" ? themeById(route.args[0]) : null;
  }

  window.addEventListener("hashchange", render);
  render();
})();
