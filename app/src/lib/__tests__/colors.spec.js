import { describe, expect, it } from "vitest";
import { inkOn, textOnWhite } from "../colors.js";

function ratio(hex) {
  const parse = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (h) => {
    const [r, g, b] = parse(h).map(lin);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex);
  return 1.05 / (l1 + 0.05);
}

describe("couleurs des groupes", () => {
  it("garde le blanc sur les couleurs sombres", () => {
    expect(inkOn("#22315B")).toBe("#ffffff");
    expect(inkOn("#A63A28")).toBe("#ffffff");
  });

  it("passe au texte foncé dès que le blanc n'atteint pas 4,5:1", () => {
    expect(inkOn("#4C6FFF")).toBe("#0e1013");
    expect(inkOn("#FFC53D")).toBe("#0e1013");
    expect(inkOn("#FFE0C7")).toBe("#0e1013");
  });

  it("assombrit une couleur trop claire pour un texte sur blanc", () => {
    const rdse = textOnWhite("#FFC53D");
    expect(rdse).not.toBe("#ffc53d");
    expect(ratio(rdse)).toBeGreaterThanOrEqual(3);
  });

  it("laisse intacte une couleur déjà contrastée", () => {
    expect(textOnWhite("#1d6e4f")).toBe("#1d6e4f");
  });

  it("reste stable sur une valeur inattendue", () => {
    expect(textOnWhite(undefined)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
