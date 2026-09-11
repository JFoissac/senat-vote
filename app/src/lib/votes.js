import { byDateDesc } from "../format.js";

export function majority(g) {
  if (!g) return null;
  if (g.pour >= g.contre && g.pour >= g.abstention) return "pour";
  if (g.contre >= g.pour && g.contre >= g.abstention) return "contre";
  return "abs";
}

export function filterScrutins(list, filters) {
  const v = filters || {};
  const themes = v.themes || {};
  const sel = Object.keys(themes).filter((k) => themes[k]);
  return list.filter((s) => {
    if (sel.length && sel.indexOf(s.theme) === -1) return false;
    if (v.withAn && !s.an) return false;
    if (v.origin && s.origin !== v.origin) return false;
    if (v.group && v.position) {
      const g = s.groups.find((x) => x.key === v.group);
      if (!g || majority(g) !== v.position) return false;
    }
    if (v.q) {
      const q = v.q.toLowerCase();
      if ((s.title + " " + (s.resume || "") + " " + s.text).toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  });
}

export function sortScrutins(list, sortKey, themeRank) {
  const ranks = themeRank || {};
  const out = list.slice();
  if (sortKey === "anciens") out.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  else if (sortKey === "pour") out.sort((a, b) => b.totals.pour - a.totals.pour || byDateDesc(a, b));
  else if (sortKey === "contre") out.sort((a, b) => b.totals.contre - a.totals.contre || byDateDesc(a, b));
  else if (sortKey === "votants") out.sort((a, b) => (b.totals.votants || 0) - (a.totals.votants || 0));
  else if (sortKey === "sujet") out.sort((a, b) => (ranks[a.theme] || 0) - (ranks[b.theme] || 0) || byDateDesc(a, b));
  else out.sort(byDateDesc);
  return out;
}
