<script setup>
// Page statique : aucune donnée du site n'est nécessaire ici.
</script>

<template>
  <div class="wrap">
    <div class="page-head">
      <h1 class="page-title">Mentions légales</h1>
      <p class="page-lede">
        Sénat·Vote est un site d'information citoyen indépendant consacré aux votes publics du Sénat et de l'Assemblée
        nationale. Voici qui l'édite, qui l'héberge et dans quelles conditions ses contenus peuvent être réutilisés.
      </p>
      <p class="note">Dernière mise à jour : <time datetime="2026-11-03">3 novembre 2026</time>.</p>
    </div>

    <div class="prose">
      <h2>1. Éditeur du site</h2>
      <div class="kv">
        <div>
          <dt>Éditeur</dt>
          <dd>Jean-François Foissac</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>
            Particulier — site édité à titre personnel et non professionnel. Aucune société n'édite ce site.
          </dd>
        </div>
        <div>
          <dt>Adresse</dt>
          <dd>Caen, France</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a> — seul moyen de contact pour le site.
          </dd>
        </div>
        <div>
          <dt>Directeur de la publication</dt>
          <dd>Jean-François Foissac</dd>
        </div>
        <div>
          <dt>Immatriculation</dt>
          <dd>SIRET, RCS, numéro de TVA intracommunautaire : <b>À VENIR</b>.</dd>
        </div>
      </div>

      <h2>2. Hébergeur</h2>
      <div class="kv">
        <div>
          <dt>Hébergeur</dt>
          <dd>Vercel Inc.</dd>
        </div>
        <div>
          <dt>Adresse</dt>
          <dd>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</dd>
        </div>
        <div>
          <dt>Site</dt>
          <dd>
            <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com ↗</a>
          </dd>
        </div>
      </div>
      <p>
        Le site est une application statique : les pages sont générées à l'avance et servies par le réseau de
        l'hébergeur. Aucun serveur applicatif propre à l'éditeur ne traite les visites.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        La structure du site, son interface, ses graphismes et les textes éditoriaux qui ne proviennent pas des sources
        officielles sont l'œuvre de l'éditeur. Ils ne peuvent pas être reproduits sans autorisation, hormis les courtes
        citations accompagnées d'un lien vers la page d'origine.
      </p>
      <p>
        Les <b>données de vote</b> (scrutins, résultats, décomptes, noms des parlementaires) sont des données publiques
        issues du Sénat et de l'Assemblée nationale. Elles ne sont pas la propriété de l'éditeur : elles restent soumises
        à leurs licences respectives, décrites ci-dessous.
      </p>

      <h2>4. Sources et licences</h2>
      <div class="kv">
        <div>
          <dt>Scrutins du Sénat</dt>
          <dd>
            Pages officielles des scrutins publics sur
            <a href="https://www.senat.fr/scrutin-public/" target="_blank" rel="noopener">senat.fr ↗</a>, réutilisées
            sous <b>Licence Ouverte 2.0</b> (Etalab). Source : Sénat français.
          </dd>
        </div>
        <div>
          <dt>Votes de l'Assemblée</dt>
          <dd>
            Dumps officiels publiés sur
            <a href="https://data.assemblee-nationale.fr/travaux-parlementaires/votes" target="_blank" rel="noopener"
              >data.assemblee-nationale.fr ↗</a
            >, réutilisés sous <b>Licence Ouverte 2.0</b>. Source : Assemblée nationale.
          </dd>
        </div>
        <div>
          <dt>Fiches et photos</dt>
          <dd>
            Informations publiques des sénateurs issues de l'
            <a href="https://www.senat.fr/api-senat" target="_blank" rel="noopener">API officielle du Sénat ↗</a>.
          </dd>
        </div>
      </div>
      <p>
        Toute réutilisation des données doit mentionner la source (Sénat ou Assemblée nationale) et ne pas laisser croire
        à une affiliation officielle avec l'une de ces institutions.
      </p>

      <h2>5. Liens externes</h2>
      <p>
        Le site renvoie vers les pages officielles du Sénat, de l'Assemblée nationale, de la CNIL et de l'hébergeur. Ces
        liens sont fournis pour vérifier les informations à la source. L'éditeur ne contrôle pas ces sites et n'est pas
        responsable de leur contenu ni de leurs pratiques en matière de données personnelles.
      </p>

      <h2>6. Données personnelles et cookies</h2>
      <p>
        Le site ne collecte aucune donnée personnelle et ne dépose aucun cookie. Le détail figure dans les pages
        <RouterLink to="/confidentialite">Confidentialité</RouterLink> et
        <RouterLink to="/cookies">Cookies et stockage local</RouterLink>.
      </p>

      <h2>7. Signalement</h2>
      <p>
        Une erreur de donnée, un lien mort ou une demande de correction peut être signalé à
        <a href="mailto:jf.foissac@gmail.com">jf.foissac@gmail.com</a>. Les corrections factuelles sont traitées en
        priorité ; les données affichées restent celles publiées par les sources officielles.
      </p>

      <p class="note">
        Sénat·Vote n'est affilié ni au Sénat, ni à l'Assemblée nationale, ni à un parti politique, ni à un institut de
        sondage.
      </p>
    </div>
  </div>
</template>
