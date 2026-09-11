import { describe, it, expect } from "vitest";
import { initials, nin } from "../names.js";

describe("nin", () => {
  it("normalise civilité, accents, ponctuation et casse", () => {
    expect(nin("Mme Marie-Do Aeschlimann")).toBe("marie do aeschlimann");
  });

  it("retire M., MM. et compacte les espaces", () => {
    expect(nin("M.  Jean-Yves   Leconte")).toBe("jean yves leconte");
    expect(nin("MM. Dupont et Durand")).toBe("dupont et durand");
    expect(nin("Mmes A...B")).toBe("a b");
  });

  it("tolère null et undefined", () => {
    expect(nin(null)).toBe("");
    expect(nin(undefined)).toBe("");
  });
});

describe("initials", () => {
  it("renvoie deux initiales majuscules", () => {
    expect(initials("Mme Marie-Do Aeschlimann")).toBe("MA");
    expect(initials("Jean-Yves Leconte")).toBe("JL");
  });

  it("gère un seul mot et la chaîne vide", () => {
    expect(initials("Aeschlimann")).toBe("A");
    expect(initials("")).toBe("?");
  });
});
