<script setup>
// Page statique : le site ne pose aucun cookie.
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Cookies et stockage local</h1>
      <p class="page-lede">
        Sénat·Vote ne dépose <b>aucun cookie</b> : ni cookie de session, ni cookie de mesure d'audience, ni cookie
        publicitaire. Le site se contente de mémoriser vos préférences d'affichage dans votre navigateur.
      </p>
      <p class="note">Dernière mise à jour : <time datetime="2026-11-03">3 novembre 2026</time>.</p>
    </div>

    <div class="prose">
      <h2>1. Aucun cookie posé par le site</h2>
      <div class="kv">
        <div>
          <dt>Cookie de session</dt>
          <dd>Aucun. Le site n'a pas de compte ni d'espace connecté.</dd>
        </div>
        <div>
          <dt>Mesure d'audience</dt>
          <dd>Aucune. Ni Google Analytics, ni Matomo, ni outil équivalent.</dd>
        </div>
        <div>
          <dt>Publicité et profilage</dt>
          <dd>Aucun. Pas de régie, pas de pixel, pas de partage avec un annonceur.</dd>
        </div>
        <div>
          <dt>Cookies tiers</dt>
          <dd>
            Aucun cookie tiers déposé par le site. Les polices d'écriture sont chargées depuis Google Fonts, sans cookie
            (voir la page <RouterLink to="/confidentialite">Confidentialité</RouterLink>).
          </dd>
        </div>
      </div>
      <p>
        Vous pouvez le vérifier vous-même : ouvrez les outils de développement de votre navigateur, onglet
        « Application » (ou « Stockage »), rubrique « Cookies ». Aucune entrée n'est créée pour ce site.
      </p>

      <h2>2. Ce que le site stocke dans votre navigateur</h2>
      <p>
        Deux clés de <code>localStorage</code> sont utilisées. Ce ne sont pas des cookies : elles restent sur votre
        appareil, ne sont jamais transmises à un serveur et ne permettent pas de vous suivre.
      </p>
      <div class="kv">
        <div>
          <dt><code>senatvote.prefs.v1</code></dt>
          <dd>
            Vos préférences : sujets suivis, filtres de la page Votes, choix de comparaison et option de superposition
            Sénat / Assemblée. Elles évitent de tout reconfigurer à chaque visite.
          </dd>
        </div>
        <div>
          <dt><code>senatvote.avis-cookies.v1</code></dt>
          <dd>
            La valeur « vu » lorsque vous fermez le bandeau d'information, afin de ne pas le réafficher. Aucune autre
            information n'y est écrite.
          </dd>
        </div>
      </div>

      <h2>3. Le bandeau d'information</h2>
      <p>
        Puisque le site ne pose aucun cookie, il n'y a rien à accepter ni à refuser : le bandeau affiché lors de votre
        première visite est purement informatif. Le bouton « J'ai compris » ne vaut pas consentement, il note simplement
        que l'information a été lue. Aucun contenu n'est bloqué et aucune fonctionnalité n'en dépend.
      </p>

      <h2>4. Comment effacer ces préférences</h2>
      <ul>
        <li>
          <b>Effacement global</b> : dans les réglages du navigateur, « Confidentialité et sécurité » puis « Effacer les
          données de navigation » ; cochez « Données des sites » ou « Stockage local ». Le bandeau réapparaîtra et les
          filtres reviendront à leur état par défaut.
        </li>
        <li>
          <b>Effacement ciblé</b> : ouvrez les outils de développement, onglet « Application » (ou « Stockage »),
          rubrique « Stockage local », sélectionnez ce site puis supprimez les deux clés ci-dessus.
        </li>
        <li>
          <b>Navigation privée</b> : le stockage local y est effacé à la fermeture de la fenêtre ; le site fonctionne de
          la même manière.
        </li>
      </ul>

      <h2>5. Questions</h2>
      <p>
        Pour toute question sur les cookies ou le stockage local, écrivez à
        <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a>. Les droits RGPD et les journaux de l'hébergeur
        sont détaillés dans la page <RouterLink to="/confidentialite">Confidentialité</RouterLink>, et l'identité de
        l'éditeur dans les <RouterLink to="/mentions-legales">Mentions légales</RouterLink>.
      </p>
    </div>
  </div>
</template>
