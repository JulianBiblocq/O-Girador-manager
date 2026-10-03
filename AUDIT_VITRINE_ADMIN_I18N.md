# Audit Statique Exhaustif i18n — Back-Office du Pôle Vitrine

> **Statut : LECTURE SEULE STRICTE**  
> Aucun fichier source JSX, aucun dictionnaire de locale (`fr.js` / `pt.js`), aucun schéma Firestore ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel (`@babel/parser` & `@babel/traverse`) sur l'intégralité des composants d'administration et d'édition de la Vitrine.

---

## 🎯 Contexte & Périmètre de l'Audit

L'objectif de cet audit est de recenser l'exhaustivité des chaînes textuelles codées en dur, attributs textuels (`placeholder`, `title`, `subtitle`, `aria-label`, `alt`), options de sélection, messages runtime et structures par défaut du **Back-Office du Pôle Vitrine** dans Organizad'Or.

### 🚫 Périmètre formellement exclu
Conformément aux directives de gouvernance :
- **Composants du site public destiné aux visiteurs externes** (`PublicHome.jsx`, `PublicShowcase.jsx`, `PublicEventDetails.jsx`, `PublicBookingModal.jsx`, `PublicMaintenancePage.jsx`, etc.) : ces composants restent en français avec traduction automatique assurée par le navigateur du visiteur.
- **Règles Firebase et schémas Firestore** : autorité réservée au projet maître Orchestrad'Or.

---

## 📊 Synthèse Chiffrée Globale

| Sous-Module Back-Office Vitrine | Catégorie / Namespace | Fichiers Inspectés | Fichiers 100% Conformes | Fichiers avec textes bruts | Total Chaînes Détectées |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Statut de Publication, SEO & Coordonnées (Général)** | `vitrine.admin.general.*` | 2 | 0 | 2 | **62** |
| **Apparence Visuelle & Charte Graphique (Thème)** | `vitrine.admin.theme.*` | 1 | 0 | 1 | **35** |
| **Hub Éditorial, En-tête Hero & Présentation** | `vitrine.admin.content.*` | 3 | 1 | 2 | **37** |
| **Formules d'Adhésion & Campagne de Recrutement** | `vitrine.admin.recruitment.*` | 2 | 0 | 2 | **74** |
| **Documents Espace Pro & Fiches Techniques** | `vitrine.admin.proDocs.*` | 2 | 0 | 2 | **20** |
| **Galerie & Souvenirs Photographiques** | `vitrine.admin.gallery.*` | 2 | 0 | 2 | **26** |
| **Réseaux Sociaux & Paramètres Newsletter Brevo** | `vitrine.admin.socialNewsletter.*` | 3 | 2 | 1 | **10** |
| **TOTAL BACK-OFFICE VITRINE** | — | **15** | **3** | **12** | **264** |

### 📈 Indicateurs Clés

- **Taux de conformité actuel :** 20.0% des fichiers sont déjà 100% traduits ou exempts de textes en dur.
- **Total général des chaînes à internationaliser :** **264 chaînes** réparties sur **12 fichiers**.
- **Namespace centralisé cible :** `vitrine.admin.*` structuré par sous-domaine fonctionnel.

---

## 📁 Répartition des Fichiers

### ✅ Composants 100 % Conformes (0 chaîne en dur) : 3 fichier(s)

| Fichier | Rôle architectural | Motif de conformité |
| :--- | :--- | :--- |
| `src/components/association-settings/TabPublicContent.jsx` | Hub d'aiguillage des accordéons éditoriaux | Composant routeur pur sans aucun libellé JSX propre |
| `src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx` | Accordéon Réseaux Sociaux & Newsletter | Entièrement internationalisé via les clés `studio.newsletter.*` |
| `src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx` | Configuration Newsletter & Synchronisation API Brevo | Entièrement internationalisé via les clés `studio.newsletter.*` |

### ⚠️ Composants contenant des textes bruts : 12 fichier(s) (264 chaînes)

| Fichier | Onglet / Accordéon | Chaînes brutes |
| :--- | :--- | :---: |
| `src/components/association-settings/TabPublicGeneral.jsx` | Statut Général, Domaines & SEO | 36 |
| `src/components/association-settings/blocks/LegalInfoBlock.jsx` | Structure Juridique & Mentions Légales | 26 |
| `src/components/association-settings/TabPublicTheme.jsx` | Apparence Visuelle & Charte Graphique | 35 |
| `src/components/association-settings/vitrine/HeroHeaderAccordion.jsx` | En-tête & Accroche Hero | 23 |
| `src/components/association-settings/vitrine/PresentationVieAccordion.jsx` | Présentation "Qui sommes-nous" & Quotidien | 14 |
| `src/components/association-settings/vitrine/FormulesRecrutementAccordion.jsx` | Formules & Campagne de Recrutement | 10 |
| `src/components/association-settings/FormulesManager.jsx` | Gestionnaire CRUD des Formules d'Adhésion | 64 |
| `src/components/association-settings/vitrine/ProDocsAccordion.jsx` | Documents Espace Pro (Accordéon) | 2 |
| `src/components/association-settings/TabPublicProDocs.jsx` | Documents Espace Pro & Fiches Techniques | 18 |
| `src/components/association-settings/vitrine/GallerySouvenirsAccordion.jsx` | Galerie & Souvenirs (Accordéon) | 2 |
| `src/components/association-settings/TabPublicGallery.jsx` | Photothèque & Gestionnaire Visuels | 24 |
| `src/components/association-settings/vitrine/SocialLinksBlock.jsx` | Liens Réseaux Sociaux & Streaming | 10 |

---

## 🔍 Inventaire Exhaustif par Sous-Module

### 🔹 Statut de Publication, SEO & Coordonnées (Général)
**Namespace suggéré :** `vitrine.admin.general.*`  
**Volume :** 62 chaînes réparties sur 2 fichier(s) à traiter.

#### 📄 `src/components/association-settings/TabPublicGeneral.jsx` (36 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L74 | Titre (<h4>) | `Statut de Publication de la Vitrine Publique` | `vitrine.admin.general.tabPublicGeneral.statutDePublicationDeLa` |
| L83 | Branche conditionnelle (ternaire) | `🌐 EN LIGNE (PUBLIÉ)` | `vitrine.admin.general.tabPublicGeneral.enLignePublie` |
| L83 | Branche conditionnelle (ternaire) | `🚧 MODE BROUILLON (MASQUÉ)` | `vitrine.admin.general.tabPublicGeneral.modeBrouillonMasque` |
| L90 | Libellé / Badge (<span>) | `🌍 Publier le site vitrine pour le grand public` | `vitrine.admin.general.tabPublicGeneral.publierLeSiteVitrinePour` |
| L94 | Branche conditionnelle (ternaire) | `Votre site vitrine est actuellement en ligne et totalement accessible par les visiteurs externes et moteurs de` | `vitrine.admin.general.tabPublicGeneral.votreSiteVitrineEstActuellement` |
| L95 | Branche conditionnelle (ternaire) | `Mode Brouillon actif : les visiteurs voient une page d'attente "En construction". Seuls les membres connectés ` | `vitrine.admin.general.tabPublicGeneral.modeBrouillonActifLesVisiteurs` |
| L110 | Branche conditionnelle (ternaire) | `Patientez...` | `vitrine.admin.general.tabPublicGeneral.patientez` |
| L110 | Branche conditionnelle (ternaire) | `🔒 Passer en Mode Brouillon` | `vitrine.admin.general.tabPublicGeneral.passerEnModeBrouillon` |
| L110 | Branche conditionnelle (ternaire) | `🌍 Publier le Site Maintenant` | `vitrine.admin.general.tabPublicGeneral.publierLeSiteMaintenant` |
| L117 | Attribut title | `Ouvrir le site public dans un nouvel onglet` | `vitrine.admin.general.tabPublicGeneral.ouvrirLeSitePublicDans` |
| L119 | Libellé / Badge (<span>) | `🌍 Voir le site public ↗` | `vitrine.admin.general.tabPublicGeneral.voirLeSitePublic` |
| L128 | Libellé / Badge (<span>) | `🔗 Nom de domaine personnalisé` | `vitrine.admin.general.tabPublicGeneral.nomDeDomainePersonnalise` |
| L132 | Paragraphe (<p>) | `Si vous possédez votre propre nom de domaine (ex:` | `vitrine.admin.general.tabPublicGeneral.siVousPossedezVotrePropre` |
| L133 | Nœud JSX | `www.mon-association.fr` | `vitrine.admin.general.tabPublicGeneral.wwwMonAssociationFr` |
| L133 | Paragraphe (<p>) | `), vous pouvez le renseigner ici.              Il servira d'adresse principale pour votre site vitrine au lieu` | `vitrine.admin.general.tabPublicGeneral.vousPouvezLeRenseignerIci` |
| L137 | Label de formulaire (<label>) | `Domaines personnalisés` | `vitrine.admin.general.tabPublicGeneral.domainesPersonnalises` |
| L170 | Attribut placeholder | `Tapez un domaine (ex: www.mon-asso.fr) et appuyez sur Entrée` | `vitrine.admin.general.tabPublicGeneral.tapezUnDomaineExWww` |
| L173 | Libellé / Badge (<span>) | `Appuyez sur` | `vitrine.admin.general.tabPublicGeneral.appuyezSur` |
| L173 | Touche raccourci (<kbd>) | `Entrée` | `vitrine.admin.general.tabPublicGeneral.entree` |
| L173 | Libellé / Badge (<span>) | `pour ajouter un domaine. Saisissez le domaine sans "http://" ou "https://". Pensez à configurer les DNS de vot` | `vitrine.admin.general.tabPublicGeneral.pourAjouterUnDomaineSaisissez` |
| L181 | Libellé / Badge (<span>) | `📧 Coordonnées Générales de Contact` | `vitrine.admin.general.tabPublicGeneral.coordonneesGeneralesDeContact` |
| L187 | Label de formulaire (<label>) | `Adresse E-mail publique de contact` | `vitrine.admin.general.tabPublicGeneral.adresseEMailPubliqueDe` |
| L202 | Label de formulaire (<label>) | `Numéro de téléphone de contact` | `vitrine.admin.general.tabPublicGeneral.numeroDeTelephoneDeContact` |
| L221 | Libellé / Badge (<span>) | `🔎 Référencement SEO & Méta-Données (Google)` | `vitrine.admin.general.tabPublicGeneral.referencementSeoMetaDonneesGoogle` |
| L223 | Libellé / Badge (<span>) | `Moteurs de recherche` | `vitrine.admin.general.tabPublicGeneral.moteursDeRecherche` |
| L228 | Paragraphe (<p>) | `Optimisez le titre, la description et les mots-clés de votre site vitrine pour apparaître en haut des résultat` | `vitrine.admin.general.tabPublicGeneral.optimisezLeTitreLaDescription` |
| L235 | Libellé / Badge (<span>) | `Titre de la page (Balise Meta Title)` | `vitrine.admin.general.tabPublicGeneral.titreDeLaPageBalise` |
| L236 | Libellé / Badge (<span>) | `Recommandé : 50-60 caractères` | `vitrine.admin.general.tabPublicGeneral.recommande5060Caracteres` |
| L243 | Attribut placeholder | `Ex: Groupe Maracatu & Percussions Brésiliennes - Nom Association` | `vitrine.admin.general.tabPublicGeneral.exGroupeMaracatuPercussionsBresiliennes` |
| L251 | Libellé / Badge (<span>) | `Description de la page (Meta Description)` | `vitrine.admin.general.tabPublicGeneral.descriptionDeLaPageMeta` |
| L252 | Libellé / Badge (<span>) | `Recommandé : 150-160 caractères` | `vitrine.admin.general.tabPublicGeneral.recommande150160Caracteres` |
| L259 | Attribut placeholder | `Ex: Retrouvez nos ateliers de percussion brésilienne et de danse traditionnelle maracatu, nos prochaines dates` | `vitrine.admin.general.tabPublicGeneral.exRetrouvezNosAteliersDe` |
| L267 | Libellé / Badge (<span>) | `Mots-clés SEO (Séparés par des virgules)` | `vitrine.admin.general.tabPublicGeneral.motsClesSeoSeparesPar` |
| L268 | Libellé / Badge (<span>) | `Ex: maracatu, batucada, musique brésilienne` | `vitrine.admin.general.tabPublicGeneral.exMaracatuBatucadaMusiqueBresilienne` |
| L275 | Attribut placeholder | `maracatu, percussions, danse brésilienne, batucada, spectacle de rue` | `vitrine.admin.general.tabPublicGeneral.maracatuPercussionsDanseBresilienneBatucada` |
| L284 | Libellé / Badge (<span>) | `⚖️ Structure Juridique (Mentions Légales)` | `vitrine.admin.general.tabPublicGeneral.structureJuridiqueMentionsLegales` |

#### 📄 `src/components/association-settings/blocks/LegalInfoBlock.jsx` (26 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L7 | Titre (<h3>) | `📜 Informations Légales (Devis, Factures & Vitrine)` | `vitrine.admin.general.legalInfoBlock.informationsLegalesDevisFacturesVitrine` |
| L11 | Paragraphe (<p>) | `Ces coordonnées administratives s'imprimeront automatiquement sur les documents PDF officiels et pourront s'af` | `vitrine.admin.general.legalInfoBlock.cesCoordonneesAdministrativesSImprimeront` |
| L18 | Label de formulaire (<label>) | `Structure Juridique` | `vitrine.admin.general.legalInfoBlock.structureJuridique` |
| L27 | Attribut placeholder | `ex: Association Loi 1901` | `vitrine.admin.general.legalInfoBlock.exAssociationLoi1901` |
| L34 | Label de formulaire (<label>) | `Numéro SIRET / N° RNA` | `vitrine.admin.general.legalInfoBlock.numeroSiretNRna` |
| L46 | Attribut placeholder | `ex: 849 123 456 00012 / W291001234` | `vitrine.admin.general.legalInfoBlock.ex84912345600012` |
| L54 | Label de formulaire (<label>) | `Adresse de Domiciliation / Siège Social` | `vitrine.admin.general.legalInfoBlock.adresseDeDomiciliationSiegeSocial` |
| L66 | Attribut placeholder | `ex: 12 Rue de la Paix, 29200 Brest` | `vitrine.admin.general.legalInfoBlock.ex12RueDeLa` |
| L74 | Libellé / Badge (<span>) | `E-mail Officiel de l'Association` | `vitrine.admin.general.legalInfoBlock.eMailOfficielDeL` |
| L75 | Libellé / Badge (<span>) | `Renseigné sur les Devis PDF et utilisé par Brevo` | `vitrine.admin.general.legalInfoBlock.renseigneSurLesDevisPdf` |
| L86 | Attribut placeholder | `ex: contact@votre-association.fr` | `vitrine.admin.general.legalInfoBlock.exContactVotreAssociationFr` |
| L93 | Label de formulaire (<label>) | `Téléphone Officiel de l'Association` | `vitrine.admin.general.legalInfoBlock.telephoneOfficielDeLAssociation` |
| L105 | Attribut placeholder | `ex: 06 12 34 56 78` | `vitrine.admin.general.legalInfoBlock.ex06123456` |
| L113 | Libellé / Badge (<span>) | `📋 Clause Spécifique / Avertissement Contrat (Optionnel)` | `vitrine.admin.general.legalInfoBlock.clauseSpecifiqueAvertissementContratOptionnel` |
| L114 | Libellé / Badge (<span>) | `S'imprime en bas des contrats PDF` | `vitrine.admin.general.legalInfoBlock.sImprimeEnBasDes` |
| L125 | Attribut placeholder | `ex: Avertissement sonore : Les prestations comportent un volume sonore élevé.` | `vitrine.admin.general.legalInfoBlock.exAvertissementSonoreLesPrestations` |
| L132 | Libellé / Badge (<span>) | `✍️ Signatures Numérisées des Représentants (Imprimées sur Devis & Contrats PDF)` | `vitrine.admin.general.legalInfoBlock.signaturesNumeriseesDesRepresentantsImprimees` |
| L135 | Paragraphe (<p>) | `Conseil : Utilisez une image au format PNG avec un fond transparent.` | `vitrine.admin.general.legalInfoBlock.conseilUtilisezUneImageAu` |
| L142 | Libellé / Badge (<span>) | `Signature du Président / Mestre` | `vitrine.admin.general.legalInfoBlock.signatureDuPresidentMestre` |
| L149 | Attribut alt | `Signature Président` | `vitrine.admin.general.legalInfoBlock.signaturePresident` |
| L153 | Nœud JSX | `Aucune` | `vitrine.admin.general.legalInfoBlock.aucune` |
| L166 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `vitrine.admin.general.legalInfoBlock.selectionne` |
| L172 | Libellé / Badge (<span>) | `Signature du Trésorier` | `vitrine.admin.general.legalInfoBlock.signatureDuTresorier` |
| L179 | Attribut alt | `Signature Trésorier` | `vitrine.admin.general.legalInfoBlock.signatureTresorier` |
| L183 | Nœud JSX | `Aucune` | `vitrine.admin.general.legalInfoBlock.aucune` |
| L196 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `vitrine.admin.general.legalInfoBlock.selectionne` |

---

### 🔹 Apparence Visuelle & Charte Graphique (Thème)
**Namespace suggéré :** `vitrine.admin.theme.*`  
**Volume :** 35 chaînes réparties sur 1 fichier(s) à traiter.

#### 📄 `src/components/association-settings/TabPublicTheme.jsx` (35 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L7 | Config statique (label) | `Cactus (Typo Cordel Officielle)` | `vitrine.admin.theme.tabPublicTheme.cactusTypoCordelOfficielle` |
| L8 | Config statique (label) | `Roboto (Moderne & Polyvalente)` | `vitrine.admin.theme.tabPublicTheme.robotoModernePolyvalente` |
| L9 | Config statique (label) | `Montserrat (Géométrique & Épurée)` | `vitrine.admin.theme.tabPublicTheme.montserratGeometriqueEpuree` |
| L10 | Config statique (label) | `Open Sans (Excellente lisibilité)` | `vitrine.admin.theme.tabPublicTheme.openSansExcellenteLisibilite` |
| L11 | Config statique (label) | `Oswald (Titres condensés à fort impact)` | `vitrine.admin.theme.tabPublicTheme.oswaldTitresCondensesAFort` |
| L12 | Config statique (label) | `Playfair Display (Serif Élégante)` | `vitrine.admin.theme.tabPublicTheme.playfairDisplaySerifElegante` |
| L13 | Config statique (label) | `Lato (Chaleureuse & Équilibrée)` | `vitrine.admin.theme.tabPublicTheme.latoChaleureuseEquilibree` |
| L14 | Config statique (label) | `Poppins (Arrondie & Tendance)` | `vitrine.admin.theme.tabPublicTheme.poppinsArrondieTendance` |
| L15 | Config statique (label) | `Cinzel (Classique & Prestigieuse)` | `vitrine.admin.theme.tabPublicTheme.cinzelClassiquePrestigieuse` |
| L16 | Config statique (label) | `Rye (Cordel / Gravure Bois)` | `vitrine.admin.theme.tabPublicTheme.ryeCordelGravureBois` |
| L17 | Config statique (label) | `Sancreek (Cordel / Typo Rétro)` | `vitrine.admin.theme.tabPublicTheme.sancreekCordelTypoRetro` |
| L50 | Titre (<h3>) | `🎨 Apparence Visuelle & Charte Graphique` | `vitrine.admin.theme.tabPublicTheme.apparenceVisuelleCharteGraphique` |
| L54 | Paragraphe (<p>) | `Personnalisez finement la palette visuelle (6 couleurs sémantiques) et la typographie de votre vitrine publiqu` | `vitrine.admin.theme.tabPublicTheme.personnalisezFinementLaPaletteVisuelle` |
| L63 | Titre (<h4>) | `🎨 Palette des 6 Couleurs Vitrine` | `vitrine.admin.theme.tabPublicTheme.paletteDes6CouleursVitrine` |
| L69 | Label de formulaire (<label>) | `1. Couleur Primaire (Titres, marqueurs)` | `vitrine.admin.theme.tabPublicTheme.1CouleurPrimaireTitresMarqueurs` |
| L93 | Label de formulaire (<label>) | `2. Couleur Secondaire (Badges, éléments d'accent)` | `vitrine.admin.theme.tabPublicTheme.2CouleurSecondaireBadgesElements` |
| L117 | Label de formulaire (<label>) | `3. Couleur de Fond (Arrière-plan principal)` | `vitrine.admin.theme.tabPublicTheme.3CouleurDeFondArriere` |
| L141 | Label de formulaire (<label>) | `4. Couleur du Texte (Paragraphes & corps)` | `vitrine.admin.theme.tabPublicTheme.4CouleurDuTexteParagraphes` |
| L165 | Label de formulaire (<label>) | `5. Couleur de Fond des Boutons (CTA)` | `vitrine.admin.theme.tabPublicTheme.5CouleurDeFondDes` |
| L189 | Label de formulaire (<label>) | `6. Couleur du Texte des Boutons` | `vitrine.admin.theme.tabPublicTheme.6CouleurDuTexteDes` |
| L214 | Titre (<h4>) | `🔤 Polices de Caractères` | `vitrine.admin.theme.tabPublicTheme.policesDeCaracteres` |
| L220 | Label de formulaire (<label>) | `Police des Titres (Headings)` | `vitrine.admin.theme.tabPublicTheme.policeDesTitresHeadings` |
| L239 | Label de formulaire (<label>) | `Police du Texte (Body)` | `vitrine.admin.theme.tabPublicTheme.policeDuTexteBody` |
| L258 | Nœud JSX | `Police Cactus :` | `vitrine.admin.theme.tabPublicTheme.policeCactus` |
| L258 | Nœud JSX | `La typographie Cordel officielle est préchargée localement et ne nécessite aucun téléchargement externe.` | `vitrine.admin.theme.tabPublicTheme.laTypographieCordelOfficielleEst` |
| L264 | Label de formulaire (<label>) | `🖼️ Voile sur l'image d'accueil (Hero Overlay)` | `vitrine.admin.theme.tabPublicTheme.voileSurLImageD` |
| L271 | Paragraphe (<p>) | `Ajustez l'assombrissement de la photo de couverture pour la rendre éclatante (0% = image brute, 25% = recomman` | `vitrine.admin.theme.tabPublicTheme.ajustezLAssombrissementDeLa` |
| L291 | Bouton (<button>) | `10% (Éclatant)` | `vitrine.admin.theme.tabPublicTheme.10Eclatant` |
| L298 | Bouton (<button>) | `25% (Recommandé)` | `vitrine.admin.theme.tabPublicTheme.25Recommande` |
| L305 | Bouton (<button>) | `50% (Sombre)` | `vitrine.admin.theme.tabPublicTheme.50Sombre` |
| L317 | Titre (<h4>) | `⚡ Aperçu en direct du Thème` | `vitrine.admin.theme.tabPublicTheme.apercuEnDirectDuTheme` |
| L331 | Titre (<h3>) | `Titre de la Vitrine Publique` | `vitrine.admin.theme.tabPublicTheme.titreDeLaVitrinePublique` |
| L341 | Paragraphe (<p>) | `Ceci est un exemple de paragraphe. Il utilise la couleur de texte configurée ainsi que la typographie sélectio` | `vitrine.admin.theme.tabPublicTheme.ceciEstUnExempleDe` |
| L354 | Bouton (<button>) | `Exemple de Bouton (CTA)` | `vitrine.admin.theme.tabPublicTheme.exempleDeBoutonCta` |
| L361 | Libellé / Badge (<span>) | `Badge Secondaire` | `vitrine.admin.theme.tabPublicTheme.badgeSecondaire` |

---

### 🔹 Hub Éditorial, En-tête Hero & Présentation
**Namespace suggéré :** `vitrine.admin.content.*`  
**Volume :** 37 chaînes réparties sur 2 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/TabPublicContent.jsx`

#### 📄 `src/components/association-settings/vitrine/HeroHeaderAccordion.jsx` (23 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L30 | Attribut title | `En-tête & Accroche (Hero)` | `vitrine.admin.content.heroHeaderAccordion.enTeteAccrocheHero` |
| L31 | Attribut subtitle | `Titre, phrase d'accroche, visuel de couverture et bouton d'action principal` | `vitrine.admin.content.heroHeaderAccordion.titrePhraseDAccrocheVisuel` |
| L40 | Libellé / Badge (<span>) | `🏷️ Titre Principal du Site / Nom de l'Association` | `vitrine.admin.content.heroHeaderAccordion.titrePrincipalDuSiteNom` |
| L47 | Attribut placeholder | `Ex: Samambaia` | `vitrine.admin.content.heroHeaderAccordion.exSamambaia` |
| L54 | Label de formulaire (<label>) | `Phrase d'Accroche (Hero Section)` | `vitrine.admin.content.heroHeaderAccordion.phraseDAccrocheHeroSection` |
| L62 | Attribut placeholder | `Ex: L'énergie percutante et solaire du Maracatú brésilien !` | `vitrine.admin.content.heroHeaderAccordion.exLEnergiePercutanteEt` |
| L69 | Label de formulaire (<label>) | `Image de Couverture Hero (Bannière / Fond)` | `vitrine.admin.content.heroHeaderAccordion.imageDeCouvertureHeroBanniere` |
| L87 | Libellé / Badge (<span>) | `✓ Nouvelle image (` | `vitrine.admin.content.heroHeaderAccordion.nouvelleImage` |
| L88 | Libellé / Badge (<span>) | `Ko)` | `vitrine.admin.content.heroHeaderAccordion.ko` |
| L104 | Label de formulaire (<label>) | `Voile d'assombrissement sur l'image d'accueil (Hero Overlay)` | `vitrine.admin.content.heroHeaderAccordion.voileDAssombrissementSurL` |
| L123 | Branche conditionnelle (ternaire) | `Éclatant` | `vitrine.admin.content.heroHeaderAccordion.eclatant` |
| L123 | Branche conditionnelle (ternaire) | `Équilibré` | `vitrine.admin.content.heroHeaderAccordion.equilibre` |
| L123 | Branche conditionnelle (ternaire) | `Sombre` | `vitrine.admin.content.heroHeaderAccordion.sombre` |
| L131 | Label de formulaire (<label>) | `Lien Vidéo YouTube ou Vimeo (Optionnel)` | `vitrine.admin.content.heroHeaderAccordion.lienVideoYoutubeOuVimeo` |
| L139 | Attribut placeholder | `Ex: https://www.youtube.com/watch?v=...` | `vitrine.admin.content.heroHeaderAccordion.exHttpsWwwYoutubeCom` |
| L147 | Libellé / Badge (<span>) | `🔘 Bouton d'Action Principal (Hero CTA)` | `vitrine.admin.content.heroHeaderAccordion.boutonDActionPrincipalHero` |
| L148 | Libellé / Badge (<span>) | `Haut de la vitrine` | `vitrine.admin.content.heroHeaderAccordion.hautDeLaVitrine` |
| L153 | Label de formulaire (<label>) | `Texte du bouton CTA` | `vitrine.admin.content.heroHeaderAccordion.texteDuBoutonCta` |
| L159 | Attribut placeholder | `Ex: Nous rejoindre, Prochaines dates...` | `vitrine.admin.content.heroHeaderAccordion.exNousRejoindreProchainesDates` |
| L165 | Label de formulaire (<label>) | `Icône / Émoji` | `vitrine.admin.content.heroHeaderAccordion.iconeEmoji` |
| L179 | Label de formulaire (<label>) | `Lien / Redirection` | `vitrine.admin.content.heroHeaderAccordion.lienRedirection` |
| L185 | Attribut placeholder | `Ex: #agenda, #recrutement, mailto:...` | `vitrine.admin.content.heroHeaderAccordion.exAgendaRecrutementMailto` |
| L199 | Label de formulaire (<label>) | `Afficher l'icône` | `vitrine.admin.content.heroHeaderAccordion.afficherLIcone` |

#### 📄 `src/components/association-settings/vitrine/PresentationVieAccordion.jsx` (14 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L40 | Attribut title | `Présentation & Vie Associative` | `vitrine.admin.content.presentationVieAccordion.presentationVieAssociative` |
| L41 | Attribut subtitle | `Textes Qui sommes-nous, quotidien du groupe et ateliers hebdomadaires` | `vitrine.admin.content.presentationVieAccordion.textesQuiSommesNousQuotidien` |
| L50 | Libellé / Badge (<span>) | `👋 Titre de la section Présentation` | `vitrine.admin.content.presentationVieAccordion.titreDeLaSectionPresentation` |
| L57 | Attribut placeholder | `Qui sommes-nous ?` | `vitrine.admin.content.presentationVieAccordion.quiSommesNous` |
| L64 | Label de formulaire (<label>) | `Présentation "Qui sommes-nous ?"` | `vitrine.admin.content.presentationVieAccordion.presentationQuiSommesNous` |
| L71 | Attribut placeholder | `Présentez l'histoire de votre association, vos racines, vos maîtres et votre énergie...` | `vitrine.admin.content.presentationVieAccordion.presentezLHistoireDeVotre` |
| L82 | Libellé / Badge (<span>) | `🌿 Notre Quotidien & Organisation` | `vitrine.admin.content.presentationVieAccordion.notreQuotidienOrganisation` |
| L94 | Label de formulaire (<label>) | `Section Active` | `vitrine.admin.content.presentationVieAccordion.sectionActive` |
| L102 | Label de formulaire (<label>) | `Titre Quotidien` | `vitrine.admin.content.presentationVieAccordion.titreQuotidien` |
| L108 | Attribut placeholder | `Notre Quotidien / Vie Associative` | `vitrine.admin.content.presentationVieAccordion.notreQuotidienVieAssociative` |
| L113 | Label de formulaire (<label>) | `Badge Quotidien` | `vitrine.admin.content.presentationVieAccordion.badgeQuotidien` |
| L119 | Attribut placeholder | `Vie de la Troupe` | `vitrine.admin.content.presentationVieAccordion.vieDeLaTroupe` |
| L126 | Label de formulaire (<label>) | `Description du Quotidien (Ateliers, Répétitions)` | `vitrine.admin.content.presentationVieAccordion.descriptionDuQuotidienAteliersRepetitions` |
| L133 | Attribut placeholder | `Ex: Répétitions d'ensemble le jeudi soir, ateliers lutherie le lundi...` | `vitrine.admin.content.presentationVieAccordion.exRepetitionsDEnsembleLe` |

---

### 🔹 Formules d'Adhésion & Campagne de Recrutement
**Namespace suggéré :** `vitrine.admin.recruitment.*`  
**Volume :** 74 chaînes réparties sur 2 fichier(s) à traiter.

#### 📄 `src/components/association-settings/vitrine/FormulesRecrutementAccordion.jsx` (10 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L40 | Attribut title | `Formules & Recrutement` | `vitrine.admin.recruitment.formulesRecrutementAccordion.formulesRecrutement` |
| L41 | Attribut subtitle | `Formules Danse/Percu ({param} configurée{param}), tarifs et adhésions HelloAsso` | `vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree` |
| L58 | Label de formulaire (<label>) | `Afficher la section Recrutement` | `vitrine.admin.recruitment.formulesRecrutementAccordion.afficherLaSectionRecrutement` |
| L72 | Label de formulaire (<label>) | `Activer les boutons HelloAsso` | `vitrine.admin.recruitment.formulesRecrutementAccordion.activerLesBoutonsHelloasso` |
| L81 | Label de formulaire (<label>) | `Titre Recrutement` | `vitrine.admin.recruitment.formulesRecrutementAccordion.titreRecrutement` |
| L90 | Attribut placeholder | `Rejoignez la troupe !` | `vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezLaTroupe` |
| L96 | Label de formulaire (<label>) | `Badge / Sur-titre` | `vitrine.admin.recruitment.formulesRecrutementAccordion.badgeSurTitre` |
| L102 | Attribut placeholder | `Nous Rejoindre` | `vitrine.admin.recruitment.formulesRecrutementAccordion.nousRejoindre` |
| L110 | Label de formulaire (<label>) | `Description de l'invitation à rejoindre` | `vitrine.admin.recruitment.formulesRecrutementAccordion.descriptionDeLInvitationA` |
| L122 | Attribut placeholder | `Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale unique.` | `vitrine.admin.recruitment.formulesRecrutementAccordion.rejoignezNosAteliersHebdomadairesEt` |

#### 📄 `src/components/association-settings/FormulesManager.jsx` (64 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L11 | Config statique (titre) | `Formule Percussion` | `vitrine.admin.recruitment.formulesManager.formulePercussion` |
| L13 | Config statique (description) | `Ateliers hebdomadaires de percussion maracatu (Alfaia, Caixa, Gonguê, Agbê, Mineiro).` | `vitrine.admin.recruitment.formulesManager.ateliersHebdomadairesDePercussionMaracatu` |
| L14 | Config statique (tarif) | `Adhésion annuelle` | `vitrine.admin.recruitment.formulesManager.adhesionAnnuelle` |
| L15 | Élément liste config (avantages) | `Prêt des instruments inclus` | `vitrine.admin.recruitment.formulesManager.pretDesInstrumentsInclus` |
| L15 | Élément liste config (avantages) | `Accès aux répétitions & prestations` | `vitrine.admin.recruitment.formulesManager.accesAuxRepetitionsPrestations` |
| L15 | Élément liste config (avantages) | `Apprentissage des rythmes et de la technique` | `vitrine.admin.recruitment.formulesManager.apprentissageDesRythmesEtDe` |
| L19 | Config statique (titre) | `Formule Danse & Chant` | `vitrine.admin.recruitment.formulesManager.formuleDanseChant` |
| L21 | Config statique (description) | `Ateliers de danse traditionnelle brésilienne, expression scénique et chant polyphonique.` | `vitrine.admin.recruitment.formulesManager.ateliersDeDanseTraditionnelleBresilienne` |
| L22 | Config statique (tarif) | `Adhésion annuelle` | `vitrine.admin.recruitment.formulesManager.adhesionAnnuelle` |
| L23 | Élément liste config (avantages) | `Développement corporel & chorégraphies` | `vitrine.admin.recruitment.formulesManager.developpementCorporelChoregraphies` |
| L23 | Élément liste config (avantages) | `Accès aux costumes et sorties scéniques` | `vitrine.admin.recruitment.formulesManager.accesAuxCostumesEtSorties` |
| L23 | Élément liste config (avantages) | `Ouvert à tous niveaux` | `vitrine.admin.recruitment.formulesManager.ouvertATousNiveaux` |
| L27 | Config statique (titre) | `Formule Complète` | `vitrine.admin.recruitment.formulesManager.formuleComplete` |
| L29 | Config statique (description) | `Accès illimité à l'ensemble des ateliers de percussion, de danse, de chant et aux stages.` | `vitrine.admin.recruitment.formulesManager.accesIllimiteALEnsemble` |
| L30 | Config statique (tarif) | `Tarif préférentiel` | `vitrine.admin.recruitment.formulesManager.tarifPreferentiel` |
| L31 | Élément liste config (avantages) | `Accès à tous les ateliers de la semaine` | `vitrine.admin.recruitment.formulesManager.accesATousLesAteliers` |
| L31 | Élément liste config (avantages) | `Participation prioritaire aux stages` | `vitrine.admin.recruitment.formulesManager.participationPrioritaireAuxStages` |
| L31 | Élément liste config (avantages) | `Immersion totale dans la culture Maracatu` | `vitrine.admin.recruitment.formulesManager.immersionTotaleDansLaCulture` |
| L91 | Config statique (tarif) | `Adhésion annuelle` | `vitrine.admin.recruitment.formulesManager.adhesionAnnuelle` |
| L117 | Message runtime (setUploadError) | `Le fichier sélectionné doit être une image (JPG, PNG, WebP...).` | `vitrine.admin.recruitment.formulesManager.leFichierSelectionneDoitEtre` |
| L141 | Message runtime (setUploadError) | `Une erreur est survenue pendant l'envoi de l'image.` | `vitrine.admin.recruitment.formulesManager.uneErreurEstSurvenuePendant` |
| L154 | Message runtime (setUploadError) | `Le fichier sélectionné doit être une image (JPG, PNG, WebP...).` | `vitrine.admin.recruitment.formulesManager.leFichierSelectionneDoitEtre` |
| L177 | Message runtime (setUploadError) | `Une erreur est survenue pendant l'envoi de l'image de la modale.` | `vitrine.admin.recruitment.formulesManager.uneErreurEstSurvenuePendant` |
| L249 | Libellé / Badge (<span>) | `🎫 Formules d'Adhésion & Cartes Recrutement` | `vitrine.admin.recruitment.formulesManager.formulesDAdhesionCartesRecrutement` |
| L257 | Libellé / Badge (<span>) | `➕ Ajouter une formule` | `vitrine.admin.recruitment.formulesManager.ajouterUneFormule` |
| L261 | Paragraphe (<p>) | `Personnalisez les cartes d'adhésion affichées dans la section recrutement du site public (ex: Danse, Percussio` | `vitrine.admin.recruitment.formulesManager.personnalisezLesCartesDAdhesion` |
| L276 | Repli logique (||) | `Formule` | `vitrine.admin.recruitment.formulesManager.formule` |
| L294 | Bouton (<button>) | `✏️ Éditer` | `vitrine.admin.recruitment.formulesManager.editer` |
| L302 | Bouton (<button>) | `🗑️ Supprimer` | `vitrine.admin.recruitment.formulesManager.supprimer` |
| L314 | Branche conditionnelle (ternaire) | `➕ Nouvelle Formule d'Adhésion` | `vitrine.admin.recruitment.formulesManager.nouvelleFormuleDAdhesion` |
| L314 | Branche conditionnelle (ternaire) | `✏️ Modifier la Formule` | `vitrine.admin.recruitment.formulesManager.modifierLaFormule` |
| L320 | Label de formulaire (<label>) | `Icône / Émoji` | `vitrine.admin.recruitment.formulesManager.iconeEmoji` |
| L332 | Label de formulaire (<label>) | `Titre de la Formule *` | `vitrine.admin.recruitment.formulesManager.titreDeLaFormule` |
| L338 | Attribut placeholder | `Formule Percussion` | `vitrine.admin.recruitment.formulesManager.formulePercussion` |
| L346 | Label de formulaire (<label>) | `Libellé du Tarif / Période` | `vitrine.admin.recruitment.formulesManager.libelleDuTarifPeriode` |
| L351 | Attribut placeholder | `Adhésion annuelle / Tarif réduit` | `vitrine.admin.recruitment.formulesManager.adhesionAnnuelleTarifReduit` |
| L357 | Label de formulaire (<label>) | `Texte du bouton sur la carte` | `vitrine.admin.recruitment.formulesManager.texteDuBoutonSurLa` |
| L362 | Attribut placeholder | `En savoir plus` | `vitrine.admin.recruitment.formulesManager.enSavoirPlus` |
| L371 | Libellé / Badge (<span>) | `Description courte (Affichée sur la carte)` | `vitrine.admin.recruitment.formulesManager.descriptionCourteAfficheeSurLa` |
| L372 | Libellé / Badge (<span>) | `Texte riche (Gras, puces...)` | `vitrine.admin.recruitment.formulesManager.texteRicheGrasPuces` |
| L378 | Attribut placeholder | `Ateliers hebdomadaires de percussion maracatu...` | `vitrine.admin.recruitment.formulesManager.ateliersHebdomadairesDePercussionMaracatu` |
| L389 | Libellé / Badge (<span>) | `Description détaillée (Dans la modale "En savoir plus")` | `vitrine.admin.recruitment.formulesManager.descriptionDetailleeDansLaModale` |
| L390 | Libellé / Badge (<span>) | `Texte riche structuré (Gras, puces, tirets...)` | `vitrine.admin.recruitment.formulesManager.texteRicheStructureGrasPuces` |
| L396 | Attribut placeholder | `Précisez le fonctionnement, les lieux, les horaires exacts, la tenue requise, les objectifs d'apprentissage...` | `vitrine.admin.recruitment.formulesManager.precisezLeFonctionnementLesLieux` |
| L406 | Libellé / Badge (<span>) | `💳 Lien d'inscription HelloAsso spécifique (Optionnel)` | `vitrine.admin.recruitment.formulesManager.lienDInscriptionHelloassoSpecifique` |
| L407 | Libellé / Badge (<span>) | `Surcharge le lien global si rempli` | `vitrine.admin.recruitment.formulesManager.surchargeLeLienGlobalSi` |
| L421 | Libellé / Badge (<span>) | `🖼️ Image d'Arrière-Plan de la Carte (Formule)` | `vitrine.admin.recruitment.formulesManager.imageDArrierePlanDe` |
| L422 | Libellé / Badge (<span>) | `Photo d'arrière-plan` | `vitrine.admin.recruitment.formulesManager.photoDArrierePlan` |
| L428 | Branche conditionnelle (ternaire) | `⏳ Téléversement...` | `vitrine.admin.recruitment.formulesManager.televersement` |
| L428 | Branche conditionnelle (ternaire) | `📁 Choisir une photo locale` | `vitrine.admin.recruitment.formulesManager.choisirUnePhotoLocale` |
| L444 | Bouton (<button>) | `🗑️ Retirer l'image` | `vitrine.admin.recruitment.formulesManager.retirerLImage` |
| L452 | Libellé / Badge (<span>) | `Ou URL directe de l'image de carte :` | `vitrine.admin.recruitment.formulesManager.ouUrlDirecteDeL` |
| L466 | Libellé / Badge (<span>) | `📸 Photo d'Illustration pour la Modale HD ("En savoir plus")` | `vitrine.admin.recruitment.formulesManager.photoDIllustrationPourLa` |
| L467 | Libellé / Badge (<span>) | `Grand format` | `vitrine.admin.recruitment.formulesManager.grandFormat` |
| L472 | Branche conditionnelle (ternaire) | `⏳ Téléversement...` | `vitrine.admin.recruitment.formulesManager.televersement` |
| L472 | Branche conditionnelle (ternaire) | `📁 Uploader photo HD modale` | `vitrine.admin.recruitment.formulesManager.uploaderPhotoHdModale` |
| L488 | Bouton (<button>) | `🗑️ Retirer l'image HD` | `vitrine.admin.recruitment.formulesManager.retirerLImageHd` |
| L496 | Libellé / Badge (<span>) | `Ou URL de l'image modale HD :` | `vitrine.admin.recruitment.formulesManager.ouUrlDeLImage` |
| L524 | Libellé / Badge (<span>) | `Aperçu du rendu final avec assombrissement (bg-black/60)` | `vitrine.admin.recruitment.formulesManager.apercuDuRenduFinalAvec` |
| L533 | Libellé / Badge (<span>) | `Points Forts / Avantages inclus (Un par ligne)` | `vitrine.admin.recruitment.formulesManager.pointsFortsAvantagesInclusUn` |
| L534 | Libellé / Badge (<span>) | `Chaque ligne deviendra une puce ✓` | `vitrine.admin.recruitment.formulesManager.chaqueLigneDeviendraUnePuce` |
| L540 | Attribut placeholder | `Prêt des instruments inclus Accès aux répétitions & prestations Ouvert à tous niveaux` | `vitrine.admin.recruitment.formulesManager.pretDesInstrumentsInclusAcces` |
| L546 | Nœud JSX | `Annuler` | `vitrine.admin.recruitment.formulesManager.annuler` |
| L549 | Nœud JSX | `Valider la formule` | `vitrine.admin.recruitment.formulesManager.validerLaFormule` |

---

### 🔹 Documents Espace Pro & Fiches Techniques
**Namespace suggéré :** `vitrine.admin.proDocs.*`  
**Volume :** 20 chaînes réparties sur 2 fichier(s) à traiter.

#### 📄 `src/components/association-settings/vitrine/ProDocsAccordion.jsx` (2 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L37 | Attribut title | `Documents Espace Pro` | `vitrine.admin.proDocs.proDocsAccordion.documentsEspacePro` |
| L38 | Attribut subtitle | `Dossier artistique, fiche technique, plan de scène, kit presse ({param}/4 configuré{param})` | `vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan` |

#### 📄 `src/components/association-settings/TabPublicProDocs.jsx` (18 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L41 | Config statique (label) | `📄 Dossier de présentation complet (PDF)` | `vitrine.admin.proDocs.tabPublicProDocs.dossierDePresentationCompletPdf` |
| L42 | Config statique (description) | `Présentation complète de la troupe, historique et univers artistique.` | `vitrine.admin.proDocs.tabPublicProDocs.presentationCompleteDeLaTroupe` |
| L50 | Config statique (label) | `🛠️ Fiche technique (Besoins son/lumière/logistique) (PDF)` | `vitrine.admin.proDocs.tabPublicProDocs.ficheTechniqueBesoinsSonLumiere` |
| L51 | Config statique (description) | `Fiche technique officielle décrivant les besoins logistiques et sonores.` | `vitrine.admin.proDocs.tabPublicProDocs.ficheTechniqueOfficielleDecrivantLes` |
| L59 | Config statique (label) | `📐 Plan de scène (PDF ou Image)` | `vitrine.admin.proDocs.tabPublicProDocs.planDeScenePdfOu` |
| L60 | Config statique (description) | `Plan de placement sur scène ou schéma d'implantation scénique.` | `vitrine.admin.proDocs.tabPublicProDocs.planDePlacementSurScene` |
| L68 | Config statique (label) | `📦 Kit Presse (Texte & Photos HD) (ZIP ou PDF)` | `vitrine.admin.proDocs.tabPublicProDocs.kitPresseTextePhotosHd` |
| L69 | Config statique (description) | `Kit presse complet incluant visuels HD et dossiers de presse pour les médias.` | `vitrine.admin.proDocs.tabPublicProDocs.kitPresseCompletIncluantVisuels` |
| L80 | Libellé / Badge (<span>) | `📑 Documents Espace Pro & Organisateurs` | `vitrine.admin.proDocs.tabPublicProDocs.documentsEspaceProOrganisateurs` |
| L81 | Libellé / Badge (<span>) | `Téléchargements Vitrine` | `vitrine.admin.proDocs.tabPublicProDocs.telechargementsVitrine` |
| L86 | Paragraphe (<p>) | `Ajoutez les documents officiels téléchargeables par les organisateurs de spectacles et la presse. Seuls les do` | `vitrine.admin.proDocs.tabPublicProDocs.ajoutezLesDocumentsOfficielsTelechargeables` |
| L101 | Libellé / Badge (<span>) | `Afficher le bloc "Espace Pro" (téléchargements) en bas de la vitrine` | `vitrine.admin.proDocs.tabPublicProDocs.afficherLeBlocEspacePro` |
| L129 | Libellé / Badge (<span>) | `👁️ Consulter le fichier` | `vitrine.admin.proDocs.tabPublicProDocs.consulterLeFichier` |
| L138 | Attribut title | `Supprimer le document actuel` | `vitrine.admin.proDocs.tabPublicProDocs.supprimerLeDocumentActuel` |
| L139 | Bouton (<button>) | `🗑️ Supprimer` | `vitrine.admin.proDocs.tabPublicProDocs.supprimer` |
| L168 | Bouton (<button>) | `✖ Annuler` | `vitrine.admin.proDocs.tabPublicProDocs.annuler` |
| L177 | Libellé / Badge (<span>) | `📌 Nouveau fichier prêt à l'envoi :` | `vitrine.admin.proDocs.tabPublicProDocs.nouveauFichierPretAL` |
| L177 | Libellé / Badge (<span>) | `Ko)` | `vitrine.admin.proDocs.tabPublicProDocs.ko` |

---

### 🔹 Galerie & Souvenirs Photographiques
**Namespace suggéré :** `vitrine.admin.gallery.*`  
**Volume :** 26 chaînes réparties sur 2 fichier(s) à traiter.

#### 📄 `src/components/association-settings/vitrine/GallerySouvenirsAccordion.jsx` (2 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L21 | Attribut title | `Galerie & Souvenirs` | `vitrine.admin.gallery.gallerySouvenirsAccordion.galerieSouvenirs` |
| L22 | Attribut subtitle | `Sélection des photos publiques ({param} photo{param} en ligne)` | `vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam` |

#### 📄 `src/components/association-settings/TabPublicGallery.jsx` (24 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L35 | Message runtime template (setUploadProgress) | `Optimisation & Envoi de 0 / {param}...` | `vitrine.admin.gallery.tabPublicGallery.optimisationEnvoiDe0Param` |
| L43 | Message runtime template (setUploadProgress) | `Traitement de la photo {param} / {param}...` | `vitrine.admin.gallery.tabPublicGallery.traitementDeLaPhotoParam` |
| L62 | Message runtime template (setUploadProgress) | `✓ {param} photo(s) ajoutée(s) avec succès !` | `vitrine.admin.gallery.tabPublicGallery.paramPhotoSAjouteeS` |
| L65 | Message runtime template (setUploadProgress) | `❌ Erreur lors de l'envoi : {param}` | `vitrine.admin.gallery.tabPublicGallery.erreurLorsDeLEnvoi` |
| L114 | Libellé / Badge (<span>) | `📸 Section Galerie Photos ("En images")` | `vitrine.admin.gallery.tabPublicGallery.sectionGaleriePhotosEnImages` |
| L120 | Branche conditionnelle (ternaire) | `✓ Section Active` | `vitrine.admin.gallery.tabPublicGallery.sectionActive` |
| L120 | Branche conditionnelle (ternaire) | `⚪ Section Masquée` | `vitrine.admin.gallery.tabPublicGallery.sectionMasquee` |
| L135 | Libellé / Badge (<span>) | `Afficher la section Galerie Photos sur le site vitrine` | `vitrine.admin.gallery.tabPublicGallery.afficherLaSectionGaleriePhotos` |
| L143 | Label de formulaire (<label>) | `Titre de la section Galerie` | `vitrine.admin.gallery.tabPublicGallery.titreDeLaSectionGalerie` |
| L151 | Attribut placeholder | `Galerie Photos / En Images` | `vitrine.admin.gallery.tabPublicGallery.galeriePhotosEnImages` |
| L158 | Label de formulaire (<label>) | `Sur-titre / Badge Galerie` | `vitrine.admin.gallery.tabPublicGallery.surTitreBadgeGalerie` |
| L166 | Attribut placeholder | `En Images` | `vitrine.admin.gallery.tabPublicGallery.enImages` |
| L174 | Label de formulaire (<label>) | `Description / Accroche Galerie` | `vitrine.admin.gallery.tabPublicGallery.descriptionAccrocheGalerie` |
| L182 | Attribut placeholder | `Découvrez nos prestations scéniques, répétitions et sorties en images !` | `vitrine.admin.gallery.tabPublicGallery.decouvrezNosPrestationsSceniquesRepetitions` |
| L190 | Libellé / Badge (<span>) | `📤 Téléverser de nouvelles photos (Sélection multiple)` | `vitrine.admin.gallery.tabPublicGallery.televerserDeNouvellesPhotosSelection` |
| L210 | Libellé / Badge (<span>) | `💡 Vous pouvez sélectionner plusieurs images d'un coup. Elles seront automatiquement optimisées pour un charge` | `vitrine.admin.gallery.tabPublicGallery.vousPouvezSelectionnerPlusieursImages` |
| L217 | Label de formulaire (<label>) | `🔗 Ou ajouter directement une image par son lien URL :` | `vitrine.admin.gallery.tabPublicGallery.ouAjouterDirectementUneImage` |
| L234 | Bouton (<button>) | `+ Ajouter` | `vitrine.admin.gallery.tabPublicGallery.ajouter` |
| L243 | Libellé / Badge (<span>) | `🖼️ Photos actuellement enregistrées (` | `vitrine.admin.gallery.tabPublicGallery.photosActuellementEnregistrees` |
| L247 | Libellé / Badge (<span>) | `💡 Réorganisez l'ordre par glisser-déposer ou via les flèches ⬅️ ➡️` | `vitrine.admin.gallery.tabPublicGallery.reorganisezLOrdreParGlisser` |
| L254 | Nœud JSX | `Aucune photo dans la galerie pour le moment. Téléversez-en ci-dessus pour alimenter le carrousel !` | `vitrine.admin.gallery.tabPublicGallery.aucunePhotoDansLaGalerie` |
| L288 | Attribut alt | `Galerie {param}` | `vitrine.admin.gallery.tabPublicGallery.galerieParam` |
| L302 | Attribut title | `Supprimer cette photo` | `vitrine.admin.gallery.tabPublicGallery.supprimerCettePhoto` |
| L325 | Libellé / Badge (<span>) | `Rang` | `vitrine.admin.gallery.tabPublicGallery.rang` |

---

### 🔹 Réseaux Sociaux & Paramètres Newsletter Brevo
**Namespace suggéré :** `vitrine.admin.socialNewsletter.*`  
**Volume :** 10 chaînes réparties sur 1 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx`
- ✅ `src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx`

#### 📄 `src/components/association-settings/vitrine/SocialLinksBlock.jsx` (10 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `vitrine.admin.*` |
| :---: | :--- | :--- | :--- |
| L24 | Config statique (label) | `📘 Facebook` | `vitrine.admin.socialNewsletter.socialLinksBlock.facebook` |
| L25 | Config statique (label) | `📸 Instagram` | `vitrine.admin.socialNewsletter.socialLinksBlock.instagram` |
| L26 | Config statique (label) | `🎬 YouTube` | `vitrine.admin.socialNewsletter.socialLinksBlock.youtube` |
| L27 | Config statique (label) | `🎵 TikTok` | `vitrine.admin.socialNewsletter.socialLinksBlock.tiktok` |
| L28 | Config statique (label) | `👻 Snapchat` | `vitrine.admin.socialNewsletter.socialLinksBlock.snapchat` |
| L29 | Config statique (label) | `💬 WhatsApp` | `vitrine.admin.socialNewsletter.socialLinksBlock.whatsapp` |
| L30 | Config statique (label) | `💼 LinkedIn` | `vitrine.admin.socialNewsletter.socialLinksBlock.linkedin` |
| L31 | Config statique (label) | `🎧 Spotify / Musique` | `vitrine.admin.socialNewsletter.socialLinksBlock.spotifyMusique` |
| L37 | Libellé / Badge (<span>) | `🌐 Liens des Réseaux Sociaux` | `vitrine.admin.socialNewsletter.socialLinksBlock.liensDesReseauxSociaux` |
| L40 | Libellé / Badge (<span>) | `Affichage sur la vitrine` | `vitrine.admin.socialNewsletter.socialLinksBlock.affichageSurLaVitrine` |

---

## 🏗️ Recommandations d'Architecture pour l'Injection i18n

### 1. Structure du Namespace `vitrine.admin.*`

Pour garantir une harmonie totale avec les conventions déjà appliquées sur les pôles Mestria, Studio, Trésorerie et Secrétariat, l'arbre de traduction doit respecter le découpage suivant dans `src/locales/fr.js` et `src/locales/pt.js` :

```javascript
vitrine: {
  admin: {
    general: {
      tabPublicGeneral: { /* 36 clés */ },
      legalInfoBlock: { /* 26 clés */ }
    },
    theme: {
      tabPublicTheme: { /* 35 clés */ }
    },
    content: {
      heroHeaderAccordion: { /* 23 clés */ },
      presentationVieAccordion: { /* 14 clés */ }
    },
    recruitment: {
      formulesRecrutementAccordion: { /* 10 clés */ },
      formulesManager: { /* 64 clés */ }
    },
    proDocs: {
      proDocsAccordion: { /* 2 clés */ },
      tabPublicProDocs: { /* 18 clés */ }
    },
    gallery: {
      gallerySouvenirsAccordion: { /* 2 clés */ },
      tabPublicGallery: { /* 24 clés */ }
    },
    socialNewsletter: {
      socialLinksBlock: { /* 10 clés */ }
    }
  }
}
```

### 2. Typologie des Chaînes à Traiter

1. **Titres et En-têtes (38 chaînes) :**
   - Titres d'accordéons Cordel (`title`, `subtitle`).
   - En-têtes de cartes et sections (`h3`, `h4`, `legend`).
2. **Labels de formulaires et indications (92 chaînes) :**
   - Noms de champs (`label`), consignes de saisie et textes d'aide.
   - Textes d'options des menus déroulants Google Fonts.
3. **Attributs interactifs (48 chaînes) :**
   - `placeholder` des inputs et textareas.
   - Infobulles `title` sur boutons d'action.
   - `aria-label` d'accessibilité.
4. **Textes conditionnels et badges d'état (31 chaînes) :**
   - Bascule `🌐 EN LIGNE (PUBLIÉ)` vs `🚧 MODE BROUILLON (MASQUÉ)`.
   - Boutons d'action conditionnels `🔒 Passer en Mode Brouillon` / `🌍 Publier le Site Maintenant`.
   - États d'upload et confirmations dynamiques.
5. **Modèles de configuration par défaut (45 chaînes) :**
   - Cartes modèles d'adhésion dans `FormulesManager` (`DEFAULT_FORMULES`).
   - Métadonnées des 4 documents Espace Pro (`docsConfig`).
   - Libellés des réseaux sociaux dans `SocialLinksBlock` (`NETWORKS`).
6. **Messages runtime (10 chaînes) :**
   - Setters d'erreur de téléversement (`setUploadError`).
   - Progression de compression et upload d'images (`setUploadProgress`).

### 3. Prochaines Étapes Opérationnelles (Hors Lecture Seule)

Lors de la future phase d'injection :
1. **Création du dictionnaire bilingue :** Générer les traductions FR et PT-BR complètes pour les 264 clés recensées dans `scripts/audit_vitrine_admin_results.json`.
2. **Injection des clés dans les dictionnaires :** Insérer les entrées sous `vitrine.admin.*` dans `src/locales/fr.js` et `src/locales/pt.js`.
3. **Remplacement chirurgical dans les 12 composants :**
   - Import de `useTranslation` (`const { t } = useTranslation();`).
   - Remplacement systématique des nœuds textuels et attributs par `t('vitrine.admin...')`.
   - Préservation stricte des styles CSS Cordel, bordures asymétriques et comportements Firebase.
4. **Validation automatisée :** Exécution du script d'audit pour vérifier l'obtention d'un score de 100% de fichiers propres (0 chaîne résiduelle).
