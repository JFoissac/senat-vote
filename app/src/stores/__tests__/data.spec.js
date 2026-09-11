import { beforeEach, describe, it, expect } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDataStore } from "../data.js";

const raw = {
  generatedAt: "2026-01-01T00:00:00+00:00",
  senatorCount: 2,
  deputeCount: 1,
  themes: [
    { id: "autres", order: 99, name: "Autres" },
    { id: "sante", order: 2, name: "Santé" },
    { id: "logement", order: 1, name: "Logement" },
  ],
  groups: [
    { key: "LR", short: "LR", label: "Les Républicains", color: "#111", seats: 130, members: [] },
    { key: "SER", short: "SER", label: "Socialistes", color: "#222", seats: 60, members: [] },
  ],
  scrutins: {
    "2024-1": { id: "2024-1", theme: "sante", groups: [], an: null },
    "2024-2": { id: "2024-2", theme: "logement", groups: [], an: null },
    "2024-3": { id: "2024-3", theme: "sante", groups: [], an: null },
  },
  anGroups: [{ key: "DR", short: "DR", label: "Droite Républicaine", color: "#333", seats: 100 }],
  anGroupColors: { DR: "#333" },
  anGroupLabels: { DR: "Droite Républicaine" },
  anByText: { "loi santé": [{ uid: "VT1" }] },
  senators: { "jean dupont": { name: "Jean Dupont", group: "LR" } },
  groupMapping: { LR: "DR" },
  textSummaries: { "loi santé": "Résumé de la loi santé." },
};

function freshStore() {
  setActivePinia(createPinia());
  const store = useDataStore();
  store.raw = raw;
  return store;
}

describe("data store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("trie les thèmes par order", () => {
    const store = freshStore();
    expect(store.themesSorted.map((t) => t.id)).toEqual(["logement", "sante", "autres"]);
  });

  it("exclut « autres » des thèmes principaux", () => {
    const store = freshStore();
    expect(store.mainThemes.map((t) => t.id)).toEqual(["logement", "sante"]);
  });

  it("regroupe les scrutins par thème", () => {
    const store = freshStore();
    expect(store.scrutinsOfTheme("sante").map((s) => s.id)).toEqual(["2024-1", "2024-3"]);
    expect(store.scrutinsOfTheme("inconnu")).toEqual([]);
  });

  it("construit la table des groupes et les métadonnées", () => {
    const store = freshStore();
    expect(store.groupMap.LR.label).toBe("Les Républicains");
    expect(store.senateGroups.map((g) => g.key)).toEqual(["LR", "SER"]);
  });

  it("retrouve un sénateur par nom normalisé", () => {
    const store = freshStore();
    expect(store.senatorOf("M. Jean Dupont").name).toBe("Jean Dupont");
    expect(store.senatorOf("Inconnu")).toBeNull();
  });

  it("normalise les groupes de l'Assemblée nationale", () => {
    const store = freshStore();
    expect(store.anGroups).toHaveLength(1);
    expect(store.anGroup({ key: "DR", size: 10, pour: 1, contre: 2, abstention: 3, nonVotants: 4 })).toMatchObject({
      key: "DR",
      label: "Droite Républicaine",
      color: "#333",
    });
  });

  it("expose résumés, mapping et textes AN", () => {
    const store = freshStore();
    expect(store.groupMapping.LR).toBe("DR");
    expect(store.textSummaryOf("loi santé")).toBe("Résumé de la loi santé.");
    expect(store.anByText("loi santé")).toHaveLength(1);
    expect(store.generatedAt).toBe("2026-01-01T00:00:00+00:00");
  });
});
