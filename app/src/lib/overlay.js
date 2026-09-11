export function pairGroups(senateGroups, anGroups, mapping) {
  const map = mapping || {};
  const anByKey = {};
  anGroups.forEach((g) => {
    anByKey[g.key] = g;
  });
  const matchedAn = new Set();
  const rows = [];
  const unmatchedSenate = [];
  senateGroups
    .slice()
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .forEach((sg) => {
      const anKey = map[sg.key];
      const ag = anKey ? anByKey[anKey] || null : null;
      if (ag) {
        matchedAn.add(anKey);
        rows.push({ sg, ag });
      } else {
        unmatchedSenate.push(sg);
      }
    });
  const unmatchedAn = anGroups.filter((g) => !matchedAn.has(g.key)).sort((a, b) => (b.size || 0) - (a.size || 0));
  return { rows, unmatchedSenate, unmatchedAn };
}
