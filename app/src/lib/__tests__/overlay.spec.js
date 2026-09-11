import { describe, it, expect } from "vitest";
import { pairGroups } from "../overlay.js";

const senateGroups = [
  { key: "LR", short: "LR", size: 131, pour: 100, contre: 20, abstention: 5, nonVotants: 6 },
  { key: "SER", short: "SER", size: 64, pour: 40, contre: 10, abstention: 14, nonVotants: 0 },
  { key: "NI", short: "NI", size: 4, pour: 1, contre: 2, abstention: 0, nonVotants: 1 },
];

const anGroups = [
  { key: "DR", short: "DR", size: 100, pour: 70, contre: 20, abstention: 10, nonVotants: 0 },
  { key: "SOC", short: "SOC", size: 60, pour: 30, contre: 20, abstention: 10, nonVotants: 0 },
  { key: "RN", short: "RN", size: 120, pour: 100, contre: 10, abstention: 5, nonVotants: 5 },
];

describe("pairGroups", () => {
  it("apparie les groupes selon le mapping et trie par effectif", () => {
    const { rows } = pairGroups(senateGroups, anGroups, { LR: "DR", SER: "SOC", NI: "XX" });
    expect(rows.map((r) => [r.sg.key, r.ag.key])).toEqual([
      ["LR", "DR"],
      ["SER", "SOC"],
    ]);
  });

  it("liste les groupes sans équivalent dans l'autre chambre", () => {
    const { unmatchedSenate, unmatchedAn } = pairGroups(senateGroups, anGroups, {
      LR: "DR",
      SER: "SOC",
      NI: "XX",
    });
    expect(unmatchedSenate.map((g) => g.key)).toEqual(["NI"]);
    expect(unmatchedAn.map((g) => g.key)).toEqual(["RN"]);
  });

  it("renvoie des listes vides quand tout est apparié", () => {
    const { rows, unmatchedSenate, unmatchedAn } = pairGroups([{ key: "LR", size: 10 }], [{ key: "DR", size: 10 }], {
      LR: "DR",
    });
    expect(rows).toHaveLength(1);
    expect(unmatchedSenate).toEqual([]);
    expect(unmatchedAn).toEqual([]);
  });
});
