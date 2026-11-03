<script setup>
// Page statique : aucun traitement de données n'est effectué ici.
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Confidentialité et données personnelles</h1>
      <p class="page-lede">
        Ce site ne collecte aucune donnée personnelle. Ce n'est pas une formule : il n'y a ni compte, ni formulaire, ni
        newsletter, ni mesure d'audience, ni publicité. Cette page explique ce qui existe malgré tout — les journaux
        techniques de l'hébergeur — et comment exercer vos droits.
      </p>
      <p class="note">Dernière mise à jour : <time datetime="2026-11-03">3 novembre 2026</time>.</p>
    </div>

    <div class="prose">
      <h2>1. Ce que le site ne collecte pas</h2>
      <ul>
        <li>Aucun <b>compte</b> et aucune identification : le site se consulte sans se connecter.</li>
        <li>Aucun <b>formulaire</b> : pas de contact, d'inscription ni de commentaire en ligne.</li>
        <li>
          Aucun <b>outil de mesure d'audience</b> (ni Google Analytics, ni Matomo, ni équivalent) : personne ne compte
          les visites.
        </li>
        <li>Aucun <b>cookie</b>, aucun traceur publicitaire, aucun profilage.</li>
        <li>Aucune <b>newsletter</b> et aucune transmission d'adresse e-mail depuis le site.</li>
      </ul>
      <p>
        Les seules données personnelles disponibles pour l'éditeur sont celles qu'un visiteur choisit de lui envoyer
        volontairement par e-mail, par exemple pour signaler une erreur. Elles ne servent qu'à répondre à ce message.
      </p>

      <h2>2. Ce qui reste sur votre appareil</h2>
      <p>
        Le site mémorise vos préférences d'affichage dans le <code>localStorage</code> de votre navigateur, c'est-à-dire
        sur votre appareil uniquement. Rien n'est envoyé à l'éditeur ni à un tiers.
      </p>
      <div class="kv">
        <div>
          <dt><code>senatvote.prefs.v1</code></dt>
          <dd>
            Sujets suivis, filtres de la page Votes, choix de comparaison, option de superposition Sénat / Assemblée.
            Conservé jusqu'à ce que vous vidiez les données du site.
          </dd>
        </div>
        <div>
          <dt><code>senatvote.avis-cookies.v1</code></dt>
          <dd>
            Simple drapeau indiquant que le bandeau d'information a été lu, pour ne pas le réafficher à chaque page.
            Conservé jusqu'à ce que vous vidiez les données du site.
          </dd>
        </div>
      </div>
      <p>
        Ces informations ne sont ni des cookies, ni des identifiants de suivi : elles ne quittent jamais votre
        navigateur et ne permettent pas de vous reconnaître sur un autre site. La page
        <RouterLink to="/cookies">Cookies et stockage local</RouterLink> détaille leur contenu et comment les effacer.
      </p>

      <h2>3. Journaux serveur de l'hébergeur</h2>
      <p>
        Comme tout site web, l'accès aux pages passe par l'hébergeur, <b>Vercel Inc.</b>, qui tient des journaux
        techniques pour assurer la sécurité et le bon fonctionnement du service. Ces journaux peuvent contenir l'adresse
        IP, la date et l'heure de la requête, l'adresse de la page demandée et les caractéristiques techniques du
        navigateur.
      </p>
      <div class="kv">
        <div>
          <dt>Finalité</dt>
          <dd>Sécurité, prévention des abus et diagnostic technique. Aucune exploitation commerciale, aucune mesure d'audience.</dd>
        </div>
        <div>
          <dt>Base légale</dt>
          <dd>Intérêt légitime de l'éditeur et de l'hébergeur à la sécurité du service (article 6.1.f du RGPD).</dd>
        </div>
        <div>
          <dt>Durée</dt>
          <dd>30 jours, puis suppression par l'hébergeur.</dd>
        </div>
        <div>
          <dt>Destinataire</dt>
          <dd>Vercel Inc., hébergeur du site. Aucun autre destinataire, aucune revente.</dd>
        </div>
      </div>

      <h2>4. Polices d'écriture</h2>
      <p>
        Les polices Fraunces et Inter sont chargées depuis <b>Google Fonts</b> (<code>fonts.googleapis.com</code> et
        <code>fonts.gstatic.com</code>). Comme toute requête web, celle-ci transmet votre adresse IP et les
        caractéristiques techniques de votre navigateur à Google. Elle ne dépose aucun cookie et n'est utilisée par
        l'éditeur pour aucune mesure ni aucun profilage. Un bloqueur de contenus ou des polices locales dans votre
        navigateur l'empêchent ; le site reste lisible avec les polices de substitution.
      </p>

      <h2>5. Données des parlementaires</h2>
      <p>
        Les noms, groupes, photos et votes des sénateurs et des députés proviennent de publications officielles et
        ouvertes. Ces informations concernent des élus dans l'exercice de leur mandat ; elles ne sont pas collectées
        auprès des visiteurs. Une demande de rectification les concernant peut être adressée à l'éditeur, qui la
        transmettra à la source officielle compétente.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Le RGPD vous confère un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
        portabilité sur les données qui vous concernent. En pratique, le site n'en conserve aucune : ces droits
        s'exercent donc principalement auprès de l'hébergeur pour ses journaux techniques.
      </p>
      <p>
        Pour toute demande, écrivez à <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a> en précisant l'objet
        de la demande. Une réponse est apportée dans un délai d'un mois. Une pièce d'identité peut être demandée en cas
        de doute raisonnable sur l'identité du demandeur.
      </p>

      <h2>7. Réclamation</h2>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission nationale de l'informatique
        et des libertés (CNIL) :
      </p>
      <div class="kv">
        <div>
          <dt>Adresse</dt>
          <dd>3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France</dd>
        </div>
        <div>
          <dt>En ligne</dt>
          <dd>
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener">cnil.fr/fr/plaintes ↗</a>
          </dd>
        </div>
      </div>

      <h2>8. Modifications</h2>
      <p>
        Cette page peut être mise à jour si le site change de fonctionnement, par exemple si un outil de mesure était
        ajouté. La date affichée en tête indique la dernière révision. Aucun cookie n'étant utilisé, aucune bannière de
        consentement n'est nécessaire.
      </p>

      <p class="note">
        Voir aussi : <RouterLink to="/mentions-legales">Mentions légales</RouterLink> ·
        <RouterLink to="/cookies">Cookies et stockage local</RouterLink>.
      </p>
    </div>
  </div>
</template>
