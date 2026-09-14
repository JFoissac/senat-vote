import { defineStore } from "pinia";
import { nin } from "../lib/names.js";

export const useDataStore = defineStore("data", {
  state: () => ({
    raw: null,
    ready: false,
    error: null
  }),
  getters: {
    generatedAt(state) {
      return state.raw ? state.raw.generatedAt : "";
    },
    scrutins(state) {
      return state.raw ? state.raw.scrutins : {};
    },
    scrutinsArray(state) {
      return state.raw ? Object.values(state.raw.scrutins) : [];
    },
    themesSorted(state) {
      const themes = state.raw ? state.raw.themes : [];
      return themes.slice().sort((a, b) => (a.order || 99) - (b.order || 99));
    },
    mainThemes() {
      return this.themesSorted.filter((t) => t.id !== "autres");
    },
    themeById(state) {
      return (id) => {
        const themes = state.raw ? state.raw.themes : [];
        return themes.find((t) => t.id === id) || null;
      };
    },
    senateGroups(state) {
      const groups = state.raw ? state.raw.groups : [];
      return groups.slice().sort((a, b) => b.seats - a.seats);
    },
    anGroups(state) {
      return state.raw ? state.raw.anGroups : [];
    },
    groupMap(state) {
      const map = {};
      (state.raw ? state.raw.groups : []).forEach((g) => {
        map[g.key] = g;
      });
      return map;
    },
    anGroupColors(state) {
      return state.raw ? state.raw.anGroupColors || {} : {};
    },
    anGroupLabels(state) {
      return state.raw ? state.raw.anGroupLabels || {} : {};
    },
    groupMapping(state) {
      return state.raw ? state.raw.groupMapping || {} : {};
    },
    scrutinsByTheme() {
      const map = {};
      this.scrutinsArray.forEach((s) => {
        (map[s.theme] = map[s.theme] || []).push(s);
      });
      return map;
    },
    scrutinsOfTheme() {
      return (id) => this.scrutinsByTheme[id] || [];
    },
    anByText(state) {
      return (text) => {
        const map = state.raw && state.raw.anByText ? state.raw.anByText : {};
        return map[text] || [];
      };
    },
    anVoteOf(state) {
      return (s) => {
        if (!s) return null;
        if (s.an) return s.an;
        const map = state.raw && state.raw.anByText ? state.raw.anByText : {};
        return (map[s.text] || [])[0] || null;
      };
    },
    senateGroup() {
      return (g) => {
        const meta = this.groupMap[g.key] || {};
        return {
          key: g.key,
          label: meta.label || g.key,
          short: meta.short || g.key,
          color: meta.color || "#8B95A9",
          size: g.size,
          pour: g.pour,
          contre: g.contre,
          abstention: g.abstention,
          nonVotants: g.nonVotants
        };
      };
    },
    anGroup() {
      return (g) => ({
        key: g.key,
        label: this.anGroupLabels[g.key] || g.key,
        short: g.key,
        color: this.anGroupColors[g.key] || "#8B95A9",
        size: g.size,
        pour: g.pour,
        contre: g.contre,
        abstention: g.abstention,
        nonVotants: g.nonVotants
      });
    },
    senators(state) {
      return state.raw && state.raw.senators ? state.raw.senators : {};
    },
    senatorOf() {
      return (name) => this.senators[nin(name)] || null;
    },
    groupMeta(state) {
      return (value) => {
        if (!value) return null;
        const groups = state.raw ? state.raw.groups : [];
        const found = groups.find(
          (g) => g.key === value || g.short === value || g.label === value
        );
        return found
          ? { key: found.key, short: found.short, label: found.label, color: found.color }
          : null;
      };
    },
    textSummaries(state) {
      return state.raw && state.raw.textSummaries ? state.raw.textSummaries : {};
    },
    textSummaryOf() {
      return (text) => this.textSummaries[text] || "";
    },
    senatorCount(state) {
      return state.raw ? state.raw.senatorCount : 0;
    },
    deputeCount(state) {
      return state.raw ? state.raw.deputeCount : 0;
    }
  },
  actions: {
    async load() {
      try {
        const res = await fetch(import.meta.env.BASE_URL + "data.json");
        if (!res.ok) throw new Error("HTTP " + res.status);
        this.raw = await res.json();
        this.ready = true;
      } catch (err) {
        this.error = err;
        this.ready = false;
      }
    }
  }
});
