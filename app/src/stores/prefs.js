import { defineStore } from "pinia";

export const PREFS_KEY = "senatvote.prefs.v1";

export function defaultPrefs() {
  return {
    overlay: false,
    chamber: "senat",
    votes: { q: "", origin: "", group: "", position: "", sort: "recents", withAn: false, themes: {}, page: 1 },
    comparer: { a: "LR", b: "SER", excludeAbs: false, subjects: {} }
  };
}

function mergePrefs(base, stored) {
  if (!stored || typeof stored !== "object") return base;
  return {
    ...base,
    ...stored,
    votes: { ...base.votes, ...(stored.votes || {}) },
    comparer: { ...base.comparer, ...(stored.comparer || {}) }
  };
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    return mergePrefs(defaultPrefs(), JSON.parse(raw));
  } catch (err) {
    return defaultPrefs();
  }
}

export const usePrefsStore = defineStore("prefs", {
  state: () => loadPrefs(),
  actions: {
    ensureSubjects(themeIds) {
      if (Object.keys(this.comparer.subjects).length) return;
      const subjects = {};
      themeIds.forEach((id) => {
        subjects[id] = true;
      });
      this.comparer.subjects = subjects;
    }
  }
});
