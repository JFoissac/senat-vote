import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";

import App from "../../App.vue";
import HomeView from "../HomeView.vue";
import ThemeView from "../ThemeView.vue";
import VotesView from "../VotesView.vue";
import CompareView from "../CompareView.vue";
import GroupesView from "../GroupesView.vue";
import MethodeView from "../MethodeView.vue";
import ScrutinView from "../ScrutinView.vue";
import NotFoundView from "../NotFoundView.vue";
import { useDataStore } from "../../stores/data.js";
import { usePrefsStore } from "../../stores/prefs.js";

const Dummy = { template: "<div />" };

const routes = [
  { path: "/", name: "home", component: Dummy },
  { path: "/sujet/:id", name: "sujet", component: Dummy },
  { path: "/votes", name: "votes", component: Dummy },
  { path: "/scrutin/:id", name: "scrutin", component: Dummy },
  { path: "/comparer", name: "comparer", component: Dummy },
  { path: "/groupes", name: "groupes", component: Dummy },
  { path: "/methode", name: "methode", component: Dummy },
  { path: "/:pathMatch(.*)*", name: "notfound", component: Dummy },
];

function group(key, short, size, pour, contre, abstention = 0) {
  return { key, short, size, pour, contre, abstention, nonVotants: size - pour - contre - abstention };
}

const senateGroups = [
  {
    key: "LR",
    short: "LR",
    label: "Les Républicains",
    color: "#111",
    seats: 130,
    members: [{ name: "Jean Dupont", department: "Paris" }],
  },
  {
    key: "SER",
    short: "SER",
    label: "Socialistes",
    color: "#222",
    seats: 60,
    members: [{ name: "Alice Martin", department: "Lyon" }],
  },
];

const anVote = {
  uid: "VT1",
  legislature: 17,
  date: "2024-02-01",
  stage: "1ʳᵉ lecture",
  result: "Adoption",
  title: "vote AN",
  url: "https://example.org/an/1",
  totals: { pour: 300, contre: 100, abstention: 20, nonVotants: 5 },
  groups: [group("DR", "DR", 100, 80, 10, 5), group("SOC", "SOC", 60, 30, 20, 10)],
};

const scrutins = {
  "2024-1": {
    id: "2024-1",
    date: "2024-03-01",
    title: "sur l'amendement n° 1",
    text: "loi santé",
    subject: "Amendement n° 1 · article 2",
    type: "Amendement",
    theme: "sante",
    result: "Rejet",
    origin: "Parlementaire",
    resume: "réforme de l'hôpital",
    totals: { votants: 200, exprimes: 200, pour: 80, contre: 100, abstention: 20, nonVotants: 5 },
    groups: [group("LR", "LR", 130, 10, 100, 5), group("SER", "SER", 60, 50, 5, 5)],
    an: anVote,
    anNote: "note AN",
    url: "https://www.senat.fr/scrutin/2024-1",
    dossierUrl: "https://www.senat.fr/dossier/1",
  },
  "2024-2": {
    id: "2024-2",
    date: "2024-01-15",
    title: "sur l'ensemble",
    text: "loi logement",
    subject: "Ensemble du texte",
    type: "Ensemble du texte",
    theme: "logement",
    result: "Adoption",
    origin: "Gouvernement",
    resume: "",
    totals: { votants: 250, exprimes: 250, pour: 150, contre: 80, abstention: 20, nonVotants: 10 },
    groups: [group("LR", "LR", 130, 90, 30, 5), group("SER", "SER", 60, 40, 10, 5)],
    an: null,
    url: "https://www.senat.fr/scrutin/2024-2",
    dossierUrl: "",
  },
  "2024-3": {
    id: "2024-3",
    date: "2023-12-01",
    title: "sur l'article 1",
    text: "loi santé",
    subject: "Article 1",
    type: "Article",
    theme: "sante",
    result: "Adoption",
    origin: "Gouvernement",
    resume: "",
    totals: { votants: 180, exprimes: 180, pour: 90, contre: 60, abstention: 30, nonVotants: 0 },
    groups: [group("LR", "LR", 130, 70, 40, 10), group("SER", "SER", 60, 20, 20, 10)],
    an: null,
    url: "https://www.senat.fr/scrutin/2024-3",
    dossierUrl: "",
  },
};

const raw = {
  generatedAt: "2026-01-01T00:00:00+00:00",
  period: { from: "2023-01-01", to: "2025-12-31" },
  senatorCount: 2,
  deputeCount: 2,
  anSource: { label: "AN", url: "https://example.org/an", license: "LO" },
  themes: [
    {
      id: "sante",
      order: 1,
      name: "Santé",
      icon: "heart",
      pastel: "#eee",
      description: "Santé",
      concern: { value: 40, source: "Ipsos", date: "2026" },
    },
    { id: "logement", order: 2, name: "Logement", icon: "home", pastel: "#ddd", description: "Logement" },
    { id: "autres", order: 99, name: "Autres", icon: "globe", pastel: "#ccc", description: "Autres" },
  ],
  groups: senateGroups,
  anGroups: [
    { key: "DR", short: "DR", label: "Droite Républicaine", color: "#333", seats: 100 },
    { key: "SOC", short: "SOC", label: "Socialistes", color: "#444", seats: 60 },
  ],
  anGroupColors: { DR: "#333", SOC: "#444" },
  anGroupLabels: { DR: "Droite Républicaine", SOC: "Socialistes" },
  groupMapping: { LR: "DR", SER: "SOC" },
  scrutins,
  anByText: { "loi santé": [anVote] },
  senators: {
    "jean dupont": {
      name: "Jean Dupont",
      department: "Paris",
      dept: "75",
      group: "LR",
      photo: "",
      page: "https://example.org/jean",
      active: true,
    },
    "alice martin": {
      name: "Alice Martin",
      department: "Lyon",
      dept: "69",
      group: "SER",
      photo: "",
      page: "",
      active: true,
    },
  },
  textSummaries: { "loi santé": "Résumé de la loi santé." },
};

async function mountView(View, path) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const data = useDataStore();
  data.raw = raw;
  const prefs = usePrefsStore();
  prefs.comparer.subjects = { sante: true, logement: true };
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.push(path);
  await router.isReady();
  const wrapper = mount(View, { global: { plugins: [pinia, router] } });
  await flushPromises();
  return wrapper;
}

describe("views (smoke)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 404 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("HomeView affiche les sujets et les derniers votes", async () => {
    const wrapper = await mountView(HomeView, "/");
    expect(wrapper.text()).toContain("Tous les votes du Sénat");
    expect(wrapper.findAll(".sujet").length).toBe(2);
  });

  it("ThemeView affiche un sujet et son graphique", async () => {
    const wrapper = await mountView(ThemeView, "/sujet/sante");
    expect(wrapper.find("h1").text()).toBe("Santé");
    expect(wrapper.find(".chart").exists()).toBe(true);
  });

  it("ThemeView gère un sujet inconnu", async () => {
    const wrapper = await mountView(ThemeView, "/sujet/inconnu");
    expect(wrapper.text()).toContain("Sujet introuvable");
  });

  it("VotesView affiche la liste filtrable et le pager", async () => {
    const wrapper = await mountView(VotesView, "/votes");
    expect(wrapper.find(".page-title").text()).toBe("Tous les votes");
    expect(wrapper.find(".pager").exists()).toBe(true);
    expect(wrapper.findAll(".vrow").length).toBeGreaterThan(0);
  });

  it("CompareView affiche le tableau comparatif", async () => {
    const wrapper = await mountView(CompareView, "/comparer");
    expect(wrapper.find(".page-title").text()).toBe("Comparer les votes");
    expect(wrapper.findAll("tbody tr").length).toBe(2);
  });

  it("GroupesView liste les groupes du Sénat et de l'Assemblée", async () => {
    const wrapper = await mountView(GroupesView, "/groupes");
    expect(wrapper.text()).toContain("Les groupes politiques");
    expect(wrapper.findAll(".gcard").length).toBe(2);
    expect(wrapper.findAll(".anrow").length).toBe(2);
  });

  it("MethodeView affiche la période et les sources", async () => {
    const wrapper = await mountView(MethodeView, "/methode");
    expect(wrapper.text()).toContain("Méthode et sources");
    expect(wrapper.text()).toContain("1 janvier 2023");
  });

  it("NotFoundView affiche le message d'erreur", async () => {
    const wrapper = await mountView(NotFoundView, "/inconnu");
    expect(wrapper.text()).toContain("Page introuvable");
  });

  it("ScrutinView rend le détail et les votes nominatifs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: "2024-1",
              groups: {
                LR: { pour: "M. Jean Dupont", contre: "Alice Martin", abstention: "", nonVotants: "" },
                SER: { pour: "", contre: "", abstention: "", nonVotants: "" },
              },
            }),
        }),
      ),
    );
    const wrapper = await mountView(ScrutinView, "/scrutin/2024-1");
    await flushPromises();
    expect(wrapper.find(".scrutin__title").text()).toBe("Loi santé");
    expect(wrapper.text()).toContain("Amendement n° 1 · article 2");
    expect(wrapper.find(".wv-group").exists()).toBe(true);
  });

  it("ScrutinView gère un scrutin inconnu", async () => {
    const wrapper = await mountView(ScrutinView, "/scrutin/9999");
    expect(wrapper.text()).toContain("Scrutin introuvable");
  });

  it("App monte l'en-tête, le routeur et le pied de page", async () => {
    const wrapper = await mountView(App, "/");
    expect(wrapper.find(".siteheader").exists()).toBe(true);
    expect(wrapper.find(".footer").exists()).toBe(true);
    expect(document.title).toContain("Sénat·Vote");
  });
});
