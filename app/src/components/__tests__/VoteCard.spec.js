import { beforeEach, describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import VoteCard from "../VoteCard.vue";
import { useDataStore } from "../../stores/data.js";

const scrutin = {
  id: "2024-1",
  date: "2024-05-15",
  theme: "sante",
  title: "sur l'amendement n° 1",
  text: "proposition de loi sur la santé",
  subject: "Amendement n° 1 · article 2",
  type: "Amendement",
  origin: "Parlementaire",
  result: "Rejet",
  totals: { pour: 10, contre: 20, abstention: 0, nonVotants: 1 },
  groups: [],
  an: null,
  resume: "",
};

const RouterLinkStub = {
  props: ["to"],
  template: '<a :href="to"><slot /></a>',
};

function mountCard() {
  setActivePinia(createPinia());
  const data = useDataStore();
  data.raw = {
    themes: [{ id: "sante", order: 1, name: "Santé", pastel: "#fff", icon: "heart" }],
    groups: [],
    anByText: {},
    groupMapping: {},
  };
  return mount(VoteCard, {
    props: { scrutin, initiallyOpen: true },
    global: {
      plugins: [createPinia()],
      stubs: { RouterLink: RouterLinkStub },
    },
  });
}

describe("VoteCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("rend le titre principal (text) et le sous-titre (subject)", () => {
    const wrapper = mountCard();
    expect(wrapper.find(".vrow__title").text()).toBe("Proposition de loi sur la santé");
    expect(wrapper.find(".vrow__subject").text()).toBe("Amendement n° 1 · article 2");
  });

  it("expose un lien vers le détail du scrutin", () => {
    const wrapper = mountCard();
    const link = wrapper.find('a[href="/scrutin/2024-1"]');
    expect(link.exists()).toBe(true);
    expect(link.text()).toContain("Détail du scrutin");
  });
});
