export const POSITIONS = {
  P: { label: "Pour", cls: "pos--pour" },
  C: { label: "Contre", cls: "pos--contre" },
  A: { label: "Abstention", cls: "pos--abs" },
  N: { label: "Non-votant", cls: "pos--nv" }
};

export function positionLabel(letter) {
  return (POSITIONS[letter] || {}).label || letter;
}

export function positionClass(letter) {
  return (POSITIONS[letter] || {}).cls || "";
}

export function filterSenatorVotes(votes, scrutins, opts = {}) {
  const { ecartsOnly = false, position = "" } = opts;
  return (votes || []).filter((v) => {
    if (ecartsOnly && v.a) return false;
    if (position && v.p !== position) return false;
    return !!scrutins[v.i];
  });
}

export function senatorStats(votes) {
  const stats = { n: 0, p: 0, c: 0, a: 0, nv: 0, ecarts: 0 };
  (votes || []).forEach((v) => {
    stats.n += 1;
    if (v.p === "P") stats.p += 1;
    else if (v.p === "C") stats.c += 1;
    else if (v.p === "A") stats.a += 1;
    else stats.nv += 1;
    if (!v.a && v.p !== "N") stats.ecarts += 1;
  });
  return stats;
}
