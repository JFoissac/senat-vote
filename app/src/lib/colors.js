/**
 * Couleurs des groupes : garantir un texte lisible (WCAG AA) sans changer la
 * palette politique. Deux besoins différents :
 *  - un texte posé sur un aplat coloré (pastille de groupe) ;
 *  - un texte coloré posé sur le fond blanc de la page.
 */

function parse(hex) {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return [128, 128, 128];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function channel(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/** Texte (noir ou blanc) lisible sur un aplat de couleur. */
export function inkOn(color) {
  return contrast(parse(color), [255, 255, 255]) >= 4.5 ? "#ffffff" : "#0e1013";
}

/**
 * Couleur de texte sur fond blanc : renvoie la couleur d'origine si elle atteint
 * le contraste demandé, sinon la même teinte assombrie par paliers de 8 %.
 */
export function textOnWhite(color, min = 4.5) {
  let rgb = parse(color);
  for (let i = 0; i < 10 && contrast(rgb, [255, 255, 255]) < min; i += 1) {
    rgb = rgb.map((v) => v * 0.92);
  }
  return toHex(rgb);
}
