import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";

import CookieNotice from "../CookieNotice.vue";
import { COOKIE_NOTICE_KEY, forgetCookieNotice } from "../../lib/cookieNotice.js";

const Dummy = { template: "<div />" };
const routes = [
  { path: "/", name: "home", component: Dummy },
  { path: "/cookies", name: "cookies", component: Dummy },
];

async function mountNotice() {
  const router = createRouter({ history: createMemoryHistory(), routes });
  router.push("/");
  await router.isReady();
  return mount(CookieNotice, { global: { plugins: [router] } });
}

describe("CookieNotice", () => {
  beforeEach(() => {
    localStorage.clear();
    forgetCookieNotice();
  });

  it("affiche un bandeau informatif tant qu'il n'a pas été lu", async () => {
    const wrapper = await mountNotice();
    const bandeau = wrapper.find(".cookienotice");
    expect(bandeau.exists()).toBe(true);
    expect(bandeau.attributes("role")).toBe("status");
    expect(bandeau.text()).toContain("Ce site n'utilise aucun cookie");
    expect(bandeau.text()).toContain("ni mesure d'audience, ni publicité");
    expect(wrapper.find('a[href="/cookies"]').text()).toBe("En savoir plus");
    expect(wrapper.find("button").text()).toBe("J'ai compris");
    wrapper.unmount();
  });

  it("mémorise la lecture au clic et disparaît", async () => {
    const wrapper = await mountNotice();
    await wrapper.find("button").trigger("click");
    expect(wrapper.find(".cookienotice").exists()).toBe(false);
    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBe("vu");
    wrapper.unmount();
  });

  it("ne réapparaît pas quand la lecture est déjà mémorisée", async () => {
    localStorage.setItem(COOKIE_NOTICE_KEY, "vu");
    const wrapper = await mountNotice();
    expect(wrapper.find(".cookienotice").exists()).toBe(false);
    wrapper.unmount();
  });

  it("se ferme avec la touche Échap et mémorise la lecture", async () => {
    const wrapper = await mountNotice();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find(".cookienotice").exists()).toBe(false);
    expect(localStorage.getItem(COOKIE_NOTICE_KEY)).toBe("vu");
    wrapper.unmount();
  });

  it("ne bloque ni ne recouvre le contenu (bandeau en flux)", async () => {
    const wrapper = await mountNotice();
    // Le bandeau est rendu hors du <main> et sans position fixe : il pousse la
    // page vers le bas au lieu de masquer le contenu.
    expect(wrapper.find(".cookienotice").element.closest("main")).toBeNull();
    const style = getComputedStyle(wrapper.find(".cookienotice").element);
    expect(style.position).not.toBe("fixed");
    expect(style.position).not.toBe("absolute");
    wrapper.unmount();
  });
});
