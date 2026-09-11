import { describe, it, expect } from "vitest";
import { pourPct, statsOver } from "../stats.js";

const list = [
  { groups: [{ key: "LR", size: 10, pour: 4, contre: 2, abstention: 4 }] },
  { groups: [{ key: "LR", size: 10, pour: 6, contre: 2, abstention: 2 }] },
  { groups: [{ key: "SER", size: 20, pour: 0, contre: 0, abstention: 20 }] },
];

describe("statsOver", () => {
  it("calcule les pourcentages sur les votes émis (abstention incluse)", () => {
    const r = statsOver(list, "LR", false);
    expect(r.nb).toBe(2);
    expect(r.pour).toBe(50);
    expect(r.contre).toBe(20);
    expect(r.abs).toBe(30);
  });

  it("exclut l'abstention du total si demandé", () => {
    const r = statsOver(list, "LR", true);
    expect(r.nb).toBe(2);
    expect(r.pour).toBe(71);
    expect(r.contre).toBe(29);
  });

  it("ignore les scrutins sans groupe ou sans effectif", () => {
    const r = statsOver(list, "SER", false);
    expect(r.nb).toBe(1);
    expect(r.pour).toBe(0);
    expect(r.contre).toBe(0);
    expect(statsOver(list, "ABSENT", false).nb).toBe(0);
  });
});

describe("pourPct", () => {
  it("renvoie le pourcentage de votes pour sur les votes émis", () => {
    expect(pourPct({ pour: 4, contre: 2, abstention: 4 })).toBe(40);
    expect(pourPct({ pour: 7, contre: 0, abstention: 0 })).toBe(100);
  });

  it("renvoie null sans vote émis", () => {
    expect(pourPct({ pour: 0, contre: 0, abstention: 0 })).toBeNull();
  });
});
