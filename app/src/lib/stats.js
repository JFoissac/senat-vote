export function statsOver(list, key, excludeAbs) {
  let pour = 0;
  let contre = 0;
  let abs = 0;
  let nb = 0;
  list.forEach((s) => {
    const g = s.groups.find((x) => x.key === key);
    if (!g || !g.size) return;
    nb++;
    pour += g.pour;
    contre += g.contre;
    abs += g.abstention;
  });
  const d = excludeAbs ? pour + contre : pour + contre + abs;
  return {
    nb,
    pour: d ? Math.round((100 * pour) / d) : null,
    contre: d ? Math.round((100 * contre) / d) : null,
    abs: d ? Math.round((100 * abs) / d) : null,
  };
}

function emis(g) {
  return g.pour + g.contre + g.abstention;
}

export function pourPct(g) {
  const e = emis(g);
  return e ? Math.round((100 * g.pour) / e) : null;
}
