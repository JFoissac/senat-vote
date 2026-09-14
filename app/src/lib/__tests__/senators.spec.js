import { describe, expect, it } from "vitest";
import { filterSenatorVotes, positionClass, positionLabel, senatorStats } from "../senators.js";

const scrutins = { a: {}, b: {}, c: {} };
const votes = [
  { i: "a", p: "P", g: "LR", a: true },
  { i: "b", p: "C", g: "LR", a: false },
  { i: "c", p: "A", g: "LR", a: false },
  { i: "x", p: "P", g: "LR", a: true }
];

describe("positionLabel / positionClass", () => {
  it("traduit les positions", () => {
    expect(positionLabel("P")).toBe("Pour");
    expect(positionLabel("C")).toBe("Contre");
    expect(positionLabel("A")).toBe("Abstention");
    expect(positionLabel("N")).toBe("Non-votant");
    expect(positionClass("P")).toBe("pos--pour");
    expect(positionClass("Z")).toBe("");
  });
});

describe("filterSenatorVotes", () => {
  it("ignore les scrutins inconnus", () => {
    expect(filterSenatorVotes(votes, scrutins)).toHaveLength(3);
  });
  it("filtre les écarts au groupe", () => {
    const out = filterSenatorVotes(votes, scrutins, { ecartsOnly: true });
    expect(out.map((v) => v.i)).toEqual(["b", "c"]);
  });
  it("filtre par position", () => {
    expect(filterSenatorVotes(votes, scrutins, { position: "P" }).map((v) => v.i)).toEqual(["a"]);
  });
});

describe("senatorStats", () => {
  it("compte les positions et les écarts (hors non-votants)", () => {
    const stats = senatorStats([...votes, { i: "a", p: "N", g: "LR", a: false }]);
    expect(stats).toMatchObject({ n: 5, p: 2, c: 1, a: 1, nv: 1, ecarts: 2 });
  });
});
