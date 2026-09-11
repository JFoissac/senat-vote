import { beforeEach, describe, it, expect } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { defaultPrefs, PREFS_KEY, usePrefsStore } from "../prefs.js";

function freshStore() {
  setActivePinia(createPinia());
  return usePrefsStore();
}

describe("prefs store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("expose la clé de stockage attendue", () => {
    expect(PREFS_KEY).toBe("senatvote.prefs.v1");
  });

  it("retourne les valeurs par défaut sans stockage", () => {
    const store = freshStore();
    expect(store.$state).toEqual(defaultPrefs());
    expect(store.chamber).toBe("senat");
    expect(store.votes.sort).toBe("recents");
    expect(store.comparer.a).toBe("LR");
  });

  it("relit l'état écrit dans localStorage", () => {
    const store = freshStore();
    store.chamber = "an";
    store.votes.q = "budget";
    localStorage.setItem(PREFS_KEY, JSON.stringify(store.$state));

    const reloaded = freshStore();
    expect(reloaded.chamber).toBe("an");
    expect(reloaded.votes.q).toBe("budget");
    expect(reloaded.votes.sort).toBe("recents");
  });

  it("fusionne un JSON partiel avec les valeurs par défaut", () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ chamber: "an", votes: { q: "x" } }));
    const store = freshStore();
    expect(store.chamber).toBe("an");
    expect(store.votes.q).toBe("x");
    expect(store.overlay).toBe(false);
    expect(store.votes.origin).toBe("");
    expect(store.comparer.b).toBe("SER");
  });

  it("retombe sur les valeurs par défaut si le JSON est invalide", () => {
    localStorage.setItem(PREFS_KEY, "{pas du json");
    const store = freshStore();
    expect(store.$state).toEqual(defaultPrefs());
  });

  it("initialise les sujets comparés quand ils sont vides", () => {
    const store = freshStore();
    store.ensureSubjects(["logement", "sante"]);
    expect(store.comparer.subjects).toEqual({ logement: true, sante: true });
    store.comparer.subjects = { autre: false };
    store.ensureSubjects(["logement"]);
    expect(store.comparer.subjects).toEqual({ autre: false });
  });
});
