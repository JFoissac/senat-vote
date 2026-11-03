<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { hasSeenCookieNotice, rememberCookieNotice } from "../lib/cookieNotice.js";

/**
 * Bandeau informatif, pas de consentement : le site ne pose aucun cookie.
 * Il s'affiche une fois, en flux (il ne recouvre jamais le contenu), se ferme
 * au clic sur « J'ai compris » ou avec la touche Échap.
 */
const visible = ref(false);

function dismiss() {
  visible.value = false;
  rememberCookieNotice();
}

function onKeydown(event) {
  if (event.key === "Escape" && visible.value) dismiss();
}

onMounted(() => {
  visible.value = !hasSeenCookieNotice();
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <div v-if="visible" class="cookienotice" role="status" aria-live="polite" aria-labelledby="cookienotice-texte">
    <div class="cookienotice__inner">
      <p id="cookienotice-texte" class="cookienotice__text">
        <b>Ce site n'utilise aucun cookie</b> : ni mesure d'audience, ni publicité. Vos préférences de filtres restent
        sur votre appareil.
      </p>
      <div class="cookienotice__actions">
        <RouterLink class="cookienotice__link" to="/cookies">En savoir plus</RouterLink>
        <button type="button" class="btn btn--small cookienotice__ok" @click="dismiss">J'ai compris</button>
      </div>
    </div>
  </div>
</template>
