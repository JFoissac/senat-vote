/**
 * Bandeau d'information cookies.
 *
 * Le site ne dépose aucun cookie : le bandeau ne recueille donc aucun
 * consentement, il informe. Seul le fait de l'avoir lu est mémorisé, dans le
 * localStorage de l'appareil — jamais transmis au serveur.
 */
export const COOKIE_NOTICE_KEY = "senatvote.avis-cookies.v1";

/** Le visiteur a-t-il déjà fermé le bandeau ? */
export function hasSeenCookieNotice() {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === "vu";
  } catch {
    return false;
  }
}

/** Mémorise la lecture du bandeau, sans jamais faire échouer la page. */
export function rememberCookieNotice() {
  try {
    localStorage.setItem(COOKIE_NOTICE_KEY, "vu");
  } catch {
    // Stockage indisponible (navigation privée verrouillée) : le bandeau
    // reviendra à la prochaine visite, rien d'autre n'est affecté.
  }
}

/** Efface la mémorisation — utile aux tests et à un éventuel « revoir » plus tard. */
export function forgetCookieNotice() {
  try {
    localStorage.removeItem(COOKIE_NOTICE_KEY);
  } catch {
    // Rien à faire : l'absence de stockage équivaut à « non lu ».
  }
}
