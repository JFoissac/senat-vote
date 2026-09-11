import { describe, expect, it } from "vitest";
import { DEPT_REGION, regionOfDept } from "../departments.js";

describe("regionOfDept", () => {
  it("retrouve une région à partir d'un département", () => {
    expect(regionOfDept("75")).toBe("Île-de-France");
    expect(regionOfDept("2A")).toBe("Corse");
    expect(regionOfDept("976")).toBe("Mayotte");
  });

  it("renvoie une chaîne vide sans département connu", () => {
    expect(regionOfDept("")).toBe("");
    expect(regionOfDept("99")).toBe("");
  });

  it("expose la table des départements", () => {
    expect(DEPT_REGION["69"]).toBe("Auvergne-Rhône-Alpes");
  });
});
