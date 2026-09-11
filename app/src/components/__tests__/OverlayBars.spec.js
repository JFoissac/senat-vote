import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import OverlayBars from "../OverlayBars.vue";

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

function mountOverlay() {
  return mount(OverlayBars, {
    props: {
      senateGroups,
      anGroups,
      mapping: { LR: "DR", SER: "SOC", NI: "XX" },
    },
  });
}

describe("OverlayBars", () => {
  it("rend le tableau et les deux colonnes", () => {
    const wrapper = mountOverlay();
    expect(wrapper.find(".ovg2__head").exists()).toBe(true);
    expect(wrapper.find('[data-ch="Sénat"]').exists()).toBe(true);
    expect(wrapper.find('[data-ch="Assemblée"]').exists()).toBe(true);
  });

  it("affiche les lignes appariées avec le pourcentage Assemblée", () => {
    const wrapper = mountOverlay();
    const paired = wrapper.findAll(".ovg2__row:not(.ovg2__row--extra)");
    expect(paired).toHaveLength(2);
    expect(paired[0].text()).toContain("LR");
    expect(paired[0].text()).toContain("≈ DR");
    expect(paired[0].find(".ovg2__pct").text()).toBe("70 %");
  });

  it("affiche la section « sans équivalent » avec les groupes non appariés", () => {
    const wrapper = mountOverlay();
    const extra = wrapper.findAll(".ovg2__row--extra");
    expect(extra).toHaveLength(2);
    expect(wrapper.find(".ovg2__extra-title").text()).toContain("sans équivalent");
    expect(wrapper.text()).toContain("NI");
    expect(wrapper.text()).toContain("RN");
  });
});
