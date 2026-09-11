import { describe, it, expect } from "vitest";
import { filterScrutins, majority, sortScrutins } from "../votes.js";

function group(key, pour, contre, abstention = 0) {
  return { key, size: pour + contre + abstention + 1, pour, contre, abstention, nonVotants: 1 };
}

function scrutin(over = {}) {
  return {
    id: "x",
    date: "2024-01-01",
    theme: "logement",
    title: "Titre",
    text: "texte",
    subject: "sujet",
    origin: "Gouvernement",
    resume: "",
    totals: { pour: 10, contre: 5, votants: 15 },
    groups: [],
    an: null,
    ...over,
  };
}

const list = [
  scrutin({
    id: "a",
    date: "2024-01-01",
    theme: "logement",
    title: "Logement",
    text: "loi logement",
    origin: "Gouvernement",
    totals: { pour: 10, contre: 5, votants: 15 },
    groups: [group("LR", 0, 10), group("SER", 10, 0)],
    an: { result: "Adoption" },
  }),
  scrutin({
    id: "b",
    date: "2024-03-01",
    theme: "sante",
    title: "Santé",
    text: "loi santé",
    origin: "Parlementaire",
    resume: "réforme de hopital",
    totals: { pour: 5, contre: 10, votants: 15 },
    groups: [group("LR", 10, 0), group("SER", 0, 10)],
    an: { result: "Rejet" },
  }),
  scrutin({
    id: "c",
    date: "2024-02-01",
    theme: "sante",
    title: "Budget",
    text: "loi budget",
    origin: "Gouvernement",
    totals: { pour: 7, contre: 7, votants: 14 },
    groups: [group("LR", 5, 5), group("SER", 2, 2)],
    an: null,
  }),
];

describe("majority", () => {
  it("classe pour / contre / abstention", () => {
    expect(majority({ pour: 10, contre: 5, abstention: 2 })).toBe("pour");
    expect(majority({ pour: 2, contre: 10, abstention: 5 })).toBe("contre");
    expect(majority({ pour: 2, contre: 5, abstention: 10 })).toBe("abs");
  });

  it("départage les égalités comme l'implémentation d'origine", () => {
    expect(majority({ pour: 5, contre: 5, abstention: 2 })).toBe("pour");
    expect(majority({ pour: 1, contre: 5, abstention: 5 })).toBe("contre");
    expect(majority({ pour: 5, contre: 5, abstention: 5 })).toBe("pour");
  });

  it("renvoie null sans groupe", () => {
    expect(majority(null)).toBeNull();
  });
});

describe("filterScrutins", () => {
  it("filtre par sujet sélectionné", () => {
    const out = filterScrutins(list, { themes: { sante: true } });
    expect(out.map((s) => s.id)).toEqual(["b", "c"]);
  });

  it("filtre par position majoritaire d'un groupe", () => {
    const out = filterScrutins(list, { themes: {}, group: "LR", position: "contre" });
    expect(out.map((s) => s.id)).toEqual(["a"]);
    expect(out.length).toBeLessThan(list.length);
  });

  it("filtre par origine", () => {
    const out = filterScrutins(list, { origin: "Parlementaire" });
    expect(out.map((s) => s.id)).toEqual(["b"]);
  });

  it("filtre les scrutins avec un vote de l'Assemblée", () => {
    const out = filterScrutins(list, { withAn: true });
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("recherche dans le titre, le résumé et le texte", () => {
    expect(filterScrutins(list, { q: "budget" }).map((s) => s.id)).toEqual(["c"]);
    expect(filterScrutins(list, { q: "hopital" }).map((s) => s.id)).toEqual(["b"]);
  });
});

describe("sortScrutins", () => {
  it("trie par date décroissante par défaut", () => {
    expect(sortScrutins(list, undefined, {}).map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(sortScrutins(list, "recents", {}).map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("trie par date croissante", () => {
    expect(sortScrutins(list, "anciens", {}).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });

  it("trie par nombre de votes pour", () => {
    expect(sortScrutins(list, "pour", {}).map((s) => s.id)).toEqual(["a", "c", "b"]);
  });

  it("trie par sujet puis par date", () => {
    const ranks = { logement: 0, sante: 1 };
    expect(sortScrutins(list, "sujet", ranks).map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("ne mute pas la liste reçue", () => {
    const input = list.slice();
    sortScrutins(input, "pour", {});
    expect(input.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });
});
