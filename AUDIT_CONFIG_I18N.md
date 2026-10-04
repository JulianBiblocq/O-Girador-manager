# Audit Statique Exhaustif i18n — Pôle Configuration

> **Statut : LECTURE SEULE STRICTE**  
> Aucun fichier source JSX, aucun dictionnaire de locale (`fr.js` / `pt.js`), aucun schéma Firestore ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel (`@babel/parser` & `@babel/traverse`) sur l'intégralité des onglets et sous-composants du Pôle Configuration.

---

## 🎯 Contexte & Périmètre de l'Audit

L'objectif de cet audit est de recenser l'exhaustivité des chaînes textuelles codées en dur, attributs textuels (`placeholder`, `title`, `subtitle`, `aria-label`, `alt`), options de sélection, messages runtime (`alert`, `confirm`, toasts) et configurations statiques du **Pôle Configuration** dans Organizad'Or.

### 🏛️ Piliers fondamentaux inspectés
1. **Pilier 1 : Identité Légale & Juridique (`TabIdentity`)** — Nom officiel, sigle, siège social, forme juridique, SIRET, signatures dématérialisées (Président & Trésorier), coordonnées bancaires/IBAN, organigramme Bureau & Mestria.
2. **Pilier 2 : Inscription, Profils & Organisation (`TabOrganization`)** — Tableau des champs d'inscription (Actif / Obligatoire), questions personnalisées sur-mesure, cycles calendaires de saison, nomenclature des pupitres et catalogue des instruments.
3. **Pilier 3 : Badges, Rôles & Sécurité (`TabSecurity`)** — Matrice fine de permissions par étiquette/badge statutaire, sécurité multi-rôles et guide pédagogique d'attribution.
4. **Pilier 4 : Modules SaaS, Apparence & Médias (`TabModules`)** — Interrupteurs des 7 grands pôles, mode de fonctionnement du vestiaire adhérent, nomenclature des tambours, logo officiel, thème Cordel, playlists YouTube et dispositions d'accueil.
5. **Cadre Général des Paramètres (`AssociationSettings`)** — Ruban supérieur de navigation des 5 piliers, boutons d'action d'enregistrement et notifications de statut.
6. **Extensions Métier associées (`TabAgenda` & `TabConfigComms`)** — Options de programmation de dates, gestion des lieux de répétition, configuration expéditeur d'e-mails et règles d'automatisation.

### 🚫 Périmètre formellement exclu
- **Back-Office Vitrine (`TabPublicGeneral`, `TabPublicTheme`, `TabPublicContent`, `vitrine/*`)** : déjà entièrement recensé dans `AUDIT_VITRINE_ADMIN_I18N.md`.
- **Règles Firebase et schémas Firestore** : autorité réservée au projet maître Orchestrad'Or.

---

## 📊 Synthèse Chiffrée Globale

| Pilier / Domaine de Configuration | Catégorie / Namespace | Fichiers Inspectés | Fichiers 100% Conformes | Fichiers avec textes bruts | Total Chaînes Détectées |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Pilier 1 : Identité Légale**<br>_Identité Légale, Signatures & Coordonnées (TabIdentity)_ | `settings.identity.*` | 10 | 2 | 8 | **85** |
| **Pilier 2 : Inscription & Organisation**<br>_Inscription, Profils, Cycles & Pupitres (TabOrganization)_ | `settings.organization.*` | 9 | 1 | 8 | **149** |
| **Pilier 3 : Badges & Sécurité**<br>_Gestion des Accès, Rôles & Matrice des Permissions (TabSecurity)_ | `settings.security.*` | 2 | 0 | 2 | **158** |
| **Pilier 4 : Modules SaaS & Apparence**<br>_Activation des Pôles, Vestiaire, Nomenclature & Médias (TabModules)_ | `settings.modules.*` | 9 | 2 | 7 | **103** |
| **Cadre Général des Paramètres**<br>_Ruban des Piliers & Actions Globales (AssociationSettings)_ | `settings.general.*` | 1 | 0 | 1 | **12** |
| **Configuration Métier : Agenda & Lieux**<br>_Options de l'Agenda, Types d'Événements, Convois & Lieux (TabAgenda)_ | `settings.agenda.*` | 6 | 0 | 6 | **108** |
| **Configuration Métier : Communication & Automatisations**<br>_E-mails, Relances, Automatisations & Documents (TabConfigComms)_ | `settings.communication.*` | 7 | 4 | 3 | **118** |
| **TOTAL GÉNÉRAL PÔLE CONFIGURATION** | — | **44** | **9** | **35** | **733** |

### 📈 Indicateurs Clés

- **Total général des chaînes à internationaliser :** **733 chaînes** détectées.
- **Volume des 4 Piliers Majeurs (+ Cadre) :** **507 chaînes** réparties sur **31 fichiers**.
- **Volume des extensions métier (Agenda/Lieux & Comms/Automations) :** **226 chaînes** réparties sur **13 fichiers**.
- **Taux de conformité actuel :** 20.5% des fichiers (9 fichiers) sont déjà exempts de textes en dur.
- **Namespace centralisé cible :** `settings.*` structuré par sous-domaine fonctionnel.

---

## 📁 Répartition Détaillée des Fichiers

### ✅ Composants 100 % Conformes (0 chaîne en dur) : 9 fichier(s)

| Fichier | Domaine fonctionnel | Motif de conformité |
| :--- | :--- | :--- |
| `src/components/association-settings/identity/BureauMestriaAccordion.jsx` | Identité Légale | Conteneur structurel pur assemblant Bureau et Mestria |
| `src/components/association-settings/blocks/LegalInfoBlock.jsx` | Identité Légale | Composant déjà branché sur les utilitaires i18n |
| `src/components/association-settings/TabOrganization.jsx` | Organisation | Hub d'aiguillage des accordéons sans libellés textuels propres |
| `src/components/association-settings/TabModules.jsx` | Modules SaaS | Hub d'aiguillage des tiroirs de configuration des modules |
| `src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx` | Modules & Médias | Déjà 100% internationalisé via `studio.communication.*` |
| `src/components/association-settings/TabConfigComms.jsx` | Communication | Déjà 100% internationalisé via `studio.communication.*` |
| `src/components/association-settings/email/EmailConfigSection.jsx` | Communication | Déjà 100% internationalisé via `studio.communication.*` |
| `src/components/association-settings/email/EmailDnsHelpCard.jsx` | Communication | Déjà 100% internationalisé via `studio.communication.*` |
| `src/components/association-settings/blocks/BrevoIntegrationBlock.jsx` | Communication | Déjà 100% internationalisé via `studio.communication.*` |

### ⚠️ Composants contenant des textes bruts : 35 fichier(s) (733 chaînes)

| Fichier | Pilier / Domaine | Chaînes brutes détectées |
| :--- | :--- | :---: |
| `src/components/association-settings/TabIdentity.jsx` | `association-settings` | 5 |
| `src/components/association-settings/identity/SubscriptionInvitationHeader.jsx` | `association-settings/identity` | 12 |
| `src/components/association-settings/identity/LegalInfoAccordion.jsx` | `association-settings/identity` | 14 |
| `src/components/association-settings/identity/OfficialSignaturesAccordion.jsx` | `association-settings/identity` | 18 |
| `src/components/association-settings/identity/BankDetailsAccordion.jsx` | `association-settings/identity` | 11 |
| `src/components/association-settings/identity/BureauAccordion.jsx` | `association-settings/identity` | 8 |
| `src/components/association-settings/identity/MestriaAccordion.jsx` | `association-settings/identity` | 9 |
| `src/components/association-settings/blocks/BankDetailsBlock.jsx` | `association-settings/blocks` | 8 |
| `src/components/association-settings/organization/RegistrationFieldsTable.jsx` | `association-settings/organization` | 30 |
| `src/components/association-settings/organization/CustomFieldsAccordion.jsx` | `association-settings/organization` | 12 |
| `src/components/association-settings/organization/CustomFieldAddForm.jsx` | `association-settings/organization` | 13 |
| `src/components/association-settings/organization/AnnualCyclesAccordion.jsx` | `association-settings/organization` | 28 |
| `src/components/association-settings/organization/PupitresNomenclatureAccordion.jsx` | `association-settings/organization` | 11 |
| `src/components/association-settings/organization/DefaultLocationsByEventTypeGrid.jsx` | `association-settings/organization` | 6 |
| `src/components/association-settings/organization/LieuEditModal.jsx` | `association-settings/organization` | 15 |
| `src/components/association-settings/blocks/InstrumentsCatalogBlock.jsx` | `association-settings/blocks` | 34 |
| `src/components/association-settings/TabSecurity.jsx` | `association-settings` | 157 |
| `src/components/PermissionsGuideBox.jsx` | `src/components` | 1 |
| `src/components/association-settings/modules/ModulesSwitchesTable.jsx` | `association-settings/modules` | 32 |
| `src/components/association-settings/modules/WardrobeMemberModeCard.jsx` | `association-settings/modules` | 13 |
| `src/components/association-settings/modules/TamboursNamingAccordion.jsx` | `association-settings/modules` | 6 |
| `src/components/association-settings/modules/BrandingLogoAccordion.jsx` | `association-settings/modules` | 16 |
| `src/components/association-settings/modules/MediaStorageAccordion.jsx` | `association-settings/modules` | 15 |
| `src/components/association-settings/modules/MemberDashboardLayoutAccordion.jsx` | `association-settings/modules` | 20 |
| `src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx` | `association-settings/blocks` | 1 |
| `src/components/AssociationSettings.jsx` | `src/components` | 12 |
| `src/components/association-settings/TabAgenda.jsx` | `association-settings` | 38 |
| `src/components/association-settings/TabLieux.jsx` | `association-settings` | 35 |
| `src/components/association-settings/EventTypeConfigCard.jsx` | `association-settings` | 23 |
| `src/components/association-settings/blocks/DepartureLocationAccordion.jsx` | `association-settings/blocks` | 6 |
| `src/components/association-settings/blocks/VehicleFleetSection.jsx` | `association-settings/blocks` | 5 |
| `src/components/association-settings/blocks/CarpoolBlock.jsx` | `association-settings/blocks` | 1 |
| `src/components/association-settings/TabAutomations.jsx` | `association-settings` | 91 |
| `src/components/association-settings/TabDocuments.jsx` | `association-settings` | 24 |
| `src/components/association-settings/blocks/SequenceurLinkBlock.jsx` | `association-settings/blocks` | 3 |

---

## 🔍 Inventaire Exhaustif par Sous-Module & Fichier

### 🔹 Pilier 1 : Identité Légale
**Description :** Identité Légale, Signatures & Coordonnées (TabIdentity)  
**Namespace suggéré :** `settings.identity.*`  
**Volume :** 85 chaînes réparties sur 8 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/identity/BureauMestriaAccordion.jsx`
- ✅ `src/components/association-settings/blocks/LegalInfoBlock.jsx`

#### 📄 `src/components/association-settings/TabIdentity.jsx` (5 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L37 | Titre (<h3>) | `Dénomination & Sigle de l'Association` | `settings.identity.tabIdentity.denominationSigleDeLAssociation` |
| L41 | Label de formulaire (<label>) | `Nom Officiel Complet de l'Association *` | `settings.identity.tabIdentity.nomOfficielCompletDeL` |
| L51 | Attribut placeholder | `ex: Associação Cultural Samambaia` | `settings.identity.tabIdentity.exAssociacaoCulturalSamambaia` |
| L57 | Label de formulaire (<label>) | `Nom court / Sigle *` | `settings.identity.tabIdentity.nomCourtSigle` |
| L67 | Attribut placeholder | `ex: Samambaia` | `settings.identity.tabIdentity.exSamambaia` |

#### 📄 `src/components/association-settings/identity/SubscriptionInvitationHeader.jsx` (12 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L23 | Message runtime (alert) | `Impossible d'accéder au portail de paiement.` | `settings.identity.subscriptionInvitationHeader.impossibleDAccederAuPortail` |
| L55 | Titre (<h4>) | `Assistant de Premier Démarrage (Wizard)` | `settings.identity.subscriptionInvitationHeader.assistantDePremierDemarrageWizard` |
| L58 | Paragraphe (<p>) | `Refaire la visite guidée et réinitialiser les réglages de base en 4 étapes.` | `settings.identity.subscriptionInvitationHeader.refaireLaVisiteGuideeEt` |
| L67 | Bouton (<button>) | `🚀 Relancer l'assistant` | `settings.identity.subscriptionInvitationHeader.relancerLAssistant` |
| L77 | Titre (<h3>) | `💳 Abonnement SaaS` | `settings.identity.subscriptionInvitationHeader.abonnementSaas` |
| L82 | Paragraphe (<p>) | `Plan :` | `settings.identity.subscriptionInvitationHeader.plan` |
| L92 | Branche conditionnelle (ternaire) | `Chargement...` | `settings.identity.subscriptionInvitationHeader.chargement` |
| L92 | Branche conditionnelle (ternaire) | `⚙️ Factures & Carte Bancaire` | `settings.identity.subscriptionInvitationHeader.facturesCarteBancaire` |
| L98 | Titre (<h3>) | `📨 Invitation au Groupe` | `settings.identity.subscriptionInvitationHeader.invitationAuGroupe` |
| L99 | Paragraphe (<p>) | `Partagez ce lien d'inscription direct pour inviter de nouveaux membres.` | `settings.identity.subscriptionInvitationHeader.partagezCeLienDInscription` |
| L108 | Branche conditionnelle (ternaire) | `✓ Lien copié !` | `settings.identity.subscriptionInvitationHeader.lienCopie` |
| L108 | Branche conditionnelle (ternaire) | `📋 Copier le lien d'invitation` | `settings.identity.subscriptionInvitationHeader.copierLeLienDInvitation` |

#### 📄 `src/components/association-settings/identity/LegalInfoAccordion.jsx` (14 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L37 | Libellé / Badge (<span>) | `Informations Légales & Coordonnées` | `settings.identity.legalInfoAccordion.informationsLegalesCoordonnees` |
| L57 | Branche conditionnelle (ternaire) | `▲ Fermer` | `settings.identity.legalInfoAccordion.fermer` |
| L57 | Branche conditionnelle (ternaire) | `✏️ Éditer` | `settings.identity.legalInfoAccordion.editer` |
| L65 | Paragraphe (<p>) | `Ces coordonnées administratives s'imprimeront automatiquement sur les devis, factures, reçus et contrats offic` | `settings.identity.legalInfoAccordion.cesCoordonneesAdministrativesSImprimeront` |
| L72 | Label de formulaire (<label>) | `Structure Juridique` | `settings.identity.legalInfoAccordion.structureJuridique` |
| L81 | Attribut placeholder | `ex: Association Loi 1901` | `settings.identity.legalInfoAccordion.exAssociationLoi1901` |
| L88 | Label de formulaire (<label>) | `Numéro SIRET / N° RNA` | `settings.identity.legalInfoAccordion.numeroSiretNRna` |
| L100 | Attribut placeholder | `ex: 849 123 456 00012 / W291001234` | `settings.identity.legalInfoAccordion.ex84912345600012` |
| L108 | Label de formulaire (<label>) | `Adresse de Domiciliation / Siège Social` | `settings.identity.legalInfoAccordion.adresseDeDomiciliationSiegeSocial` |
| L120 | Attribut placeholder | `ex: 12 Rue de la Paix, 29200 Brest` | `settings.identity.legalInfoAccordion.ex12RueDeLa` |
| L129 | Libellé / Badge (<span>) | `E-mail Officiel` | `settings.identity.legalInfoAccordion.eMailOfficiel` |
| L140 | Attribut placeholder | `ex: contact@votre-association.fr` | `settings.identity.legalInfoAccordion.exContactVotreAssociationFr` |
| L147 | Label de formulaire (<label>) | `Téléphone Officiel` | `settings.identity.legalInfoAccordion.telephoneOfficiel` |
| L159 | Attribut placeholder | `ex: 06 12 34 56 78` | `settings.identity.legalInfoAccordion.ex06123456` |

#### 📄 `src/components/association-settings/identity/OfficialSignaturesAccordion.jsx` (18 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L31 | Libellé / Badge (<span>) | `Signatures Officielles` | `settings.identity.officialSignaturesAccordion.signaturesOfficielles` |
| L46 | Libellé / Badge (<span>) | `Président :` | `settings.identity.officialSignaturesAccordion.president` |
| L47 | Branche conditionnelle (ternaire) | `Enregistrée ✓` | `settings.identity.officialSignaturesAccordion.enregistree` |
| L47 | Branche conditionnelle (ternaire) | `Non renseignée` | `settings.identity.officialSignaturesAccordion.nonRenseignee` |
| L54 | Libellé / Badge (<span>) | `Trésorier :` | `settings.identity.officialSignaturesAccordion.tresorier` |
| L55 | Branche conditionnelle (ternaire) | `Enregistrée ✓` | `settings.identity.officialSignaturesAccordion.enregistree` |
| L55 | Branche conditionnelle (ternaire) | `Non renseignée` | `settings.identity.officialSignaturesAccordion.nonRenseignee` |
| L64 | Branche conditionnelle (ternaire) | `▲ Fermer` | `settings.identity.officialSignaturesAccordion.fermer` |
| L64 | Branche conditionnelle (ternaire) | `🔍 Voir / Remplacer` | `settings.identity.officialSignaturesAccordion.voirRemplacer` |
| L71 | Paragraphe (<p>) | `Ces signatures numériques s'impriment automatiquement sur les devis, reçus de cotisation et contrats PDF. Priv` | `settings.identity.officialSignaturesAccordion.cesSignaturesNumeriquesSImpriment` |
| L78 | Libellé / Badge (<span>) | `Signature du Président / Mestre` | `settings.identity.officialSignaturesAccordion.signatureDuPresidentMestre` |
| L85 | Attribut alt | `Signature Président` | `settings.identity.officialSignaturesAccordion.signaturePresident` |
| L89 | Nœud JSX | `Aucune` | `settings.identity.officialSignaturesAccordion.aucune` |
| L102 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `settings.identity.officialSignaturesAccordion.selectionne` |
| L110 | Libellé / Badge (<span>) | `Signature du Trésorier` | `settings.identity.officialSignaturesAccordion.signatureDuTresorier` |
| L117 | Attribut alt | `Signature Trésorier` | `settings.identity.officialSignaturesAccordion.signatureTresorier` |
| L121 | Nœud JSX | `Aucune` | `settings.identity.officialSignaturesAccordion.aucune` |
| L134 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `settings.identity.officialSignaturesAccordion.selectionne` |

#### 📄 `src/components/association-settings/identity/BankDetailsAccordion.jsx` (11 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L34 | Libellé / Badge (<span>) | `Coordonnées Bancaires & RIB` | `settings.identity.bankDetailsAccordion.coordonneesBancairesRib` |
| L43 | Libellé / Badge (<span>) | `IBAN :` | `settings.identity.bankDetailsAccordion.iban` |
| L52 | Branche conditionnelle (ternaire) | `▲ Fermer` | `settings.identity.bankDetailsAccordion.fermer` |
| L52 | Branche conditionnelle (ternaire) | `✏️ Modifier` | `settings.identity.bankDetailsAccordion.modifier` |
| L59 | Paragraphe (<p>) | `Ces informations apparaîtront sur vos factures et devis officiels pour permettre les règlements par virement b` | `settings.identity.bankDetailsAccordion.cesInformationsApparaitrontSurVos` |
| L66 | Label de formulaire (<label>) | `Mention d'Exonération TVA` | `settings.identity.bankDetailsAccordion.mentionDExonerationTva` |
| L75 | Attribut placeholder | `ex: TVA non applicable, art. 293 B du CGI` | `settings.identity.bankDetailsAccordion.exTvaNonApplicableArt` |
| L82 | Label de formulaire (<label>) | `Coordonnées Bancaires (IBAN / BIC)` | `settings.identity.bankDetailsAccordion.coordonneesBancairesIbanBic` |
| L94 | Attribut placeholder | `ex: FR76 3000 4000 1234 5678 9012 345` | `settings.identity.bankDetailsAccordion.exFr76300040001234` |
| L102 | Label de formulaire (<label>) | `Titulaire du compte bancaire` | `settings.identity.bankDetailsAccordion.titulaireDuCompteBancaire` |
| L111 | Attribut placeholder | `ex: Association O Girador` | `settings.identity.bankDetailsAccordion.exAssociationOGirador` |

#### 📄 `src/components/association-settings/identity/BureauAccordion.jsx` (8 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L43 | Libellé / Badge (<span>) | `Membres du Bureau (` | `settings.identity.bureauAccordion.membresDuBureau` |
| L46 | Libellé / Badge (<span>) | `(Présidence, Secrétariat, Trésorerie...)` | `settings.identity.bureauAccordion.presidenceSecretariatTresorerie` |
| L55 | Branche conditionnelle (ternaire) | `Fermer` | `settings.identity.bureauAccordion.fermer` |
| L55 | Branche conditionnelle (ternaire) | `Gérer` | `settings.identity.bureauAccordion.gerer` |
| L62 | Nœud JSX | `Aucun membre du bureau renseigné pour le moment.` | `settings.identity.bureauAccordion.aucunMembreDuBureauRenseigne` |
| L73 | Attribut placeholder | `Fonction (ex: Trésorier(ère))` | `settings.identity.bureauAccordion.fonctionExTresorierEre` |
| L81 | Attribut placeholder | `Prénom & Nom du membre` | `settings.identity.bureauAccordion.prenomNomDuMembre` |
| L125 | Nœud JSX | `➕ Ajouter une fonction du bureau` | `settings.identity.bureauAccordion.ajouterUneFonctionDuBureau` |

#### 📄 `src/components/association-settings/identity/MestriaAccordion.jsx` (9 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L43 | Libellé / Badge (<span>) | `Direction Artistique (` | `settings.identity.mestriaAccordion.directionArtistique` |
| L46 | Libellé / Badge (<span>) | `(Mestres, Directeurs musicaux...)` | `settings.identity.mestriaAccordion.mestresDirecteursMusicaux` |
| L55 | Branche conditionnelle (ternaire) | `Fermer` | `settings.identity.mestriaAccordion.fermer` |
| L55 | Branche conditionnelle (ternaire) | `Gérer` | `settings.identity.mestriaAccordion.gerer` |
| L62 | Nœud JSX | `Aucun Mestre ou Directeur Artistique renseigné.` | `settings.identity.mestriaAccordion.aucunMestreOuDirecteurArtistique` |
| L73 | Attribut placeholder | `Fonction (ex: Mestre)` | `settings.identity.mestriaAccordion.fonctionExMestre` |
| L81 | Attribut placeholder | `Prénom & Nom du Mestre` | `settings.identity.mestriaAccordion.prenomNomDuMestre` |
| L125 | Nœud JSX | `➕ Ajouter un membre de la Direction Artistique` | `settings.identity.mestriaAccordion.ajouterUnMembreDeLa` |
| L139 | Libellé / Badge (<span>) | `Afficher la Direction Artistique sur les Procès-Verbaux (PV)` | `settings.identity.mestriaAccordion.afficherLaDirectionArtistiqueSur` |

#### 📄 `src/components/association-settings/blocks/BankDetailsBlock.jsx` (8 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L7 | Titre (<h3>) | `🏦 Coordonnées Bancaires & Facturation` | `settings.identity.bankDetailsBlock.coordonneesBancairesFacturation` |
| L11 | Paragraphe (<p>) | `Ces informations apparaîtront sur vos factures et devis pour permettre les paiements par virement.` | `settings.identity.bankDetailsBlock.cesInformationsApparaitrontSurVos` |
| L18 | Label de formulaire (<label>) | `Mention d'Exonération TVA` | `settings.identity.bankDetailsBlock.mentionDExonerationTva` |
| L27 | Attribut placeholder | `ex: TVA non applicable, art. 293 B du CGI` | `settings.identity.bankDetailsBlock.exTvaNonApplicableArt` |
| L34 | Label de formulaire (<label>) | `Coordonnées Bancaires (IBAN / BIC)` | `settings.identity.bankDetailsBlock.coordonneesBancairesIbanBic` |
| L46 | Attribut placeholder | `ex: FR76 3000 4000 1234 5678 9012 345` | `settings.identity.bankDetailsBlock.exFr76300040001234` |
| L54 | Label de formulaire (<label>) | `Titulaire du compte bancaire` | `settings.identity.bankDetailsBlock.titulaireDuCompteBancaire` |
| L63 | Attribut placeholder | `ex: Association O Girador` | `settings.identity.bankDetailsBlock.exAssociationOGirador` |

---

### 🔹 Pilier 2 : Inscription & Organisation
**Description :** Inscription, Profils, Cycles & Pupitres (TabOrganization)  
**Namespace suggéré :** `settings.organization.*`  
**Volume :** 149 chaînes réparties sur 8 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/TabOrganization.jsx`

#### 📄 `src/components/association-settings/organization/RegistrationFieldsTable.jsx` (30 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L37 | Config statique (label) | `📞 Téléphone` | `settings.organization.registrationFieldsTable.telephone` |
| L37 | Config statique (desc) | `Contact mobile du membre` | `settings.organization.registrationFieldsTable.contactMobileDuMembre` |
| L38 | Config statique (label) | `🏠 Adresse physique` | `settings.organization.registrationFieldsTable.adressePhysique` |
| L38 | Config statique (desc) | `Domicile / Ville` | `settings.organization.registrationFieldsTable.domicileVille` |
| L39 | Config statique (label) | `🎭 Surnom / Nom de scène` | `settings.organization.registrationFieldsTable.surnomNomDeScene` |
| L39 | Config statique (desc) | `Apelido au sein de la Roda` | `settings.organization.registrationFieldsTable.apelidoAuSeinDeLa` |
| L40 | Config statique (label) | `👕 Taille T-shirt` | `settings.organization.registrationFieldsTable.tailleTShirt` |
| L40 | Config statique (desc) | `Mensurations textile haut` | `settings.organization.registrationFieldsTable.mensurationsTextileHaut` |
| L41 | Config statique (label) | `👖 Taille Pantalon/Bas` | `settings.organization.registrationFieldsTable.taillePantalonBas` |
| L41 | Config statique (desc) | `Mensurations costume bas` | `settings.organization.registrationFieldsTable.mensurationsCostumeBas` |
| L42 | Config statique (label) | `📷 Droit à l'image` | `settings.organization.registrationFieldsTable.droitALImage` |
| L42 | Config statique (desc) | `Autorisation captations & diffusions` | `settings.organization.registrationFieldsTable.autorisationCaptationsDiffusions` |
| L43 | Config statique (label) | `🩺 Aptitude médicale` | `settings.organization.registrationFieldsTable.aptitudeMedicale` |
| L43 | Config statique (desc) | `Questionnaire QS-Sport / Décharge` | `settings.organization.registrationFieldsTable.questionnaireQsSportDecharge` |
| L44 | Config statique (label) | `✋ Latéralité` | `settings.organization.registrationFieldsTable.lateralite` |
| L44 | Config statique (desc) | `Gaucher ou Droitier` | `settings.organization.registrationFieldsTable.gaucherOuDroitier` |
| L45 | Config statique (label) | `🎂 Date de naissance` | `settings.organization.registrationFieldsTable.dateDeNaissance` |
| L45 | Config statique (desc) | `Anniversaires & Catégories d'âge` | `settings.organization.registrationFieldsTable.anniversairesCategoriesDAge` |
| L46 | Config statique (label) | `🎖️ Niveaux trombinoscope` | `settings.organization.registrationFieldsTable.niveauxTrombinoscope` |
| L46 | Config statique (desc) | `Affichage des badges sur l'annuaire` | `settings.organization.registrationFieldsTable.affichageDesBadgesSurL` |
| L62 | Attribut title | `Formulaire d'inscription & Profil membre` | `settings.organization.registrationFieldsTable.formulaireDInscriptionProfilMembre` |
| L63 | Attribut subtitle | `{param} champs configurés ({param} obligatoire{param})` | `settings.organization.registrationFieldsTable.paramChampsConfiguresParamObligatoire` |
| L69 | Paragraphe (<p>) | `Définissez les informations collectées lors de l'adhésion et leur niveau d'exigence.` | `settings.organization.registrationFieldsTable.definissezLesInformationsCollecteesLors` |
| L77 | En-tête de tableau (<th>) | `Champ standard` | `settings.organization.registrationFieldsTable.champStandard` |
| L78 | En-tête de tableau (<th>) | `Activation` | `settings.organization.registrationFieldsTable.activation` |
| L79 | En-tête de tableau (<th>) | `Exigence` | `settings.organization.registrationFieldsTable.exigence` |
| L107 | Branche conditionnelle (ternaire) | `✓ Actif` | `settings.organization.registrationFieldsTable.actif` |
| L107 | Branche conditionnelle (ternaire) | `✕ Inactif` | `settings.organization.registrationFieldsTable.inactif` |
| L125 | Branche conditionnelle (ternaire) | `★ Obligatoire` | `settings.organization.registrationFieldsTable.obligatoire` |
| L125 | Branche conditionnelle (ternaire) | `Facultatif` | `settings.organization.registrationFieldsTable.facultatif` |

#### 📄 `src/components/association-settings/organization/CustomFieldsAccordion.jsx` (12 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L20 | Config statique (title) | `Supprimer le champ personnalisé` | `settings.organization.customFieldsAccordion.supprimerLeChampPersonnalise` |
| L21 | Config statique (message) | `Êtes-vous sûr de vouloir supprimer ce champ personnalisé ?` | `settings.organization.customFieldsAccordion.etesVousSurDeVouloir` |
| L40 | Libellé / Badge (<span>) | `Champs personnalisés (` | `settings.organization.customFieldsAccordion.champsPersonnalises` |
| L41 | Libellé / Badge (<span>) | `actifs)` | `settings.organization.customFieldsAccordion.actifs` |
| L43 | Libellé / Badge (<span>) | `(Questions sur-mesure pour l'inscription & le profil)` | `settings.organization.customFieldsAccordion.questionsSurMesurePourL` |
| L52 | Branche conditionnelle (ternaire) | `Fermer` | `settings.organization.customFieldsAccordion.fermer` |
| L52 | Branche conditionnelle (ternaire) | `Gérer` | `settings.organization.customFieldsAccordion.gerer` |
| L58 | Paragraphe (<p>) | `Ajoutez des questions spécifiques selon les besoins de votre troupe (ex: Régime alimentaire, Besoin covoiturag` | `settings.organization.customFieldsAccordion.ajoutezDesQuestionsSpecifiquesSelon` |
| L67 | Nœud JSX | `Aucune question personnalisée configurée.` | `settings.organization.customFieldsAccordion.aucuneQuestionPersonnaliseeConfiguree` |
| L81 | Libellé / Badge (<span>) | `Obligatoire` | `settings.organization.customFieldsAccordion.obligatoire` |
| L84 | Libellé / Badge (<span>) | `Type :` | `settings.organization.customFieldsAccordion.type` |
| L93 | Attribut title | `Supprimer cette question` | `settings.organization.customFieldsAccordion.supprimerCetteQuestion` |

#### 📄 `src/components/association-settings/organization/CustomFieldAddForm.jsx` (13 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L5 | Config statique (label) | `Texte court` | `settings.organization.customFieldAddForm.texteCourt` |
| L6 | Config statique (label) | `Texte long` | `settings.organization.customFieldAddForm.texteLong` |
| L7 | Config statique (label) | `Nombre` | `settings.organization.customFieldAddForm.nombre` |
| L9 | Config statique (label) | `Liste déroulante` | `settings.organization.customFieldAddForm.listeDeroulante` |
| L10 | Config statique (label) | `Choix multiples` | `settings.organization.customFieldAddForm.choixMultiples` |
| L11 | Config statique (label) | `Case à cocher` | `settings.organization.customFieldAddForm.caseACocher` |
| L48 | Label de formulaire (<label>) | `Nom de la question *` | `settings.organization.customFieldAddForm.nomDeLaQuestion` |
| L55 | Attribut placeholder | `Ex: Régime alimentaire` | `settings.organization.customFieldAddForm.exRegimeAlimentaire` |
| L61 | Label de formulaire (<label>) | `Type de réponse` | `settings.organization.customFieldAddForm.typeDeReponse` |
| L78 | Label de formulaire (<label>) | `Options (séparées par une virgule)` | `settings.organization.customFieldAddForm.optionsSepareesParUneVirgule` |
| L85 | Attribut placeholder | `Ex: Végétarien, Végan, Sans gluten` | `settings.organization.customFieldAddForm.exVegetarienVeganSansGluten` |
| L99 | Libellé / Badge (<span>) | `Réponse obligatoire` | `settings.organization.customFieldAddForm.reponseObligatoire` |
| L108 | Nœud JSX | `+ Ajouter la question` | `settings.organization.customFieldAddForm.ajouterLaQuestion` |

#### 📄 `src/components/association-settings/organization/AnnualCyclesAccordion.jsx` (28 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L36 | Config statique (label) | `Janvier` | `settings.organization.annualCyclesAccordion.janvier` |
| L37 | Config statique (label) | `Février` | `settings.organization.annualCyclesAccordion.fevrier` |
| L38 | Config statique (label) | `Mars` | `settings.organization.annualCyclesAccordion.mars` |
| L39 | Config statique (label) | `Avril` | `settings.organization.annualCyclesAccordion.avril` |
| L40 | Config statique (label) | `Mai` | `settings.organization.annualCyclesAccordion.mai` |
| L41 | Config statique (label) | `Juin` | `settings.organization.annualCyclesAccordion.juin` |
| L42 | Config statique (label) | `Juillet` | `settings.organization.annualCyclesAccordion.juillet` |
| L43 | Config statique (label) | `Août` | `settings.organization.annualCyclesAccordion.aout` |
| L44 | Config statique (label) | `Septembre` | `settings.organization.annualCyclesAccordion.septembre` |
| L45 | Config statique (label) | `Octobre` | `settings.organization.annualCyclesAccordion.octobre` |
| L46 | Config statique (label) | `Novembre` | `settings.organization.annualCyclesAccordion.novembre` |
| L47 | Config statique (label) | `Décembre` | `settings.organization.annualCyclesAccordion.decembre` |
| L60 | Libellé / Badge (<span>) | `Cycles Annuels` | `settings.organization.annualCyclesAccordion.cyclesAnnuels` |
| L65 | Libellé / Badge (<span>) | `Saison :` | `settings.organization.annualCyclesAccordion.saison` |
| L66 | Libellé / Badge (<span>) | `• Exercice comptable :` | `settings.organization.annualCyclesAccordion.exerciceComptable` |
| L74 | Branche conditionnelle (ternaire) | `▲ Fermer` | `settings.organization.annualCyclesAccordion.fermer` |
| L74 | Branche conditionnelle (ternaire) | `⚙️ Régler` | `settings.organization.annualCyclesAccordion.regler` |
| L80 | Paragraphe (<p>) | `Synchronisez l'Agenda, les notes de frais et les bilans d'AG sur les bornes calendaires réelles de votre assoc` | `settings.organization.annualCyclesAccordion.synchronisezLAgendaLesNotes` |
| L87 | Label de formulaire (<label>) | `🌱 Mois de rentrée / Saison d'activité` | `settings.organization.annualCyclesAccordion.moisDeRentreeSaisonD` |
| L99 | Branche conditionnelle (ternaire) | `— (Recommandé / Rentrée)` | `settings.organization.annualCyclesAccordion.recommandeRentree` |
| L99 | Branche conditionnelle (ternaire) | `— (Année civile)` | `settings.organization.annualCyclesAccordion.anneeCivile` |
| L103 | Libellé / Badge (<span>) | `Période active :` | `settings.organization.annualCyclesAccordion.periodeActive` |
| L104 | Libellé / Badge (<span>) | `au` | `settings.organization.annualCyclesAccordion.au` |
| L110 | Label de formulaire (<label>) | `💼 Mois de clôture / Exercice comptable` | `settings.organization.annualCyclesAccordion.moisDeClotureExerciceComptable` |
| L122 | Branche conditionnelle (ternaire) | `— (Standard / Année civile)` | `settings.organization.annualCyclesAccordion.standardAnneeCivile` |
| L122 | Branche conditionnelle (ternaire) | `— (Année scolaire)` | `settings.organization.annualCyclesAccordion.anneeScolaire` |
| L126 | Libellé / Badge (<span>) | `Exercice actif :` | `settings.organization.annualCyclesAccordion.exerciceActif` |
| L127 | Libellé / Badge (<span>) | `au` | `settings.organization.annualCyclesAccordion.au` |

#### 📄 `src/components/association-settings/organization/PupitresNomenclatureAccordion.jsx` (11 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L25 | Config statique (label) | `Personnalisé` | `settings.organization.pupitresNomenclatureAccordion.personnalise` |
| L53 | Libellé / Badge (<span>) | `Pupitres, Tambours & Nomenclature (` | `settings.organization.pupitresNomenclatureAccordion.pupitresTamboursNomenclature` |
| L57 | Libellé / Badge (<span>) | `instrument` | `settings.organization.pupitresNomenclatureAccordion.instrument` |
| L57 | Libellé / Badge (<span>) | `pupitre` | `settings.organization.pupitresNomenclatureAccordion.pupitre` |
| L57 | Libellé / Badge (<span>) | `lié` | `settings.organization.pupitresNomenclatureAccordion.lie` |
| L65 | Branche conditionnelle (ternaire) | `Fermer` | `settings.organization.pupitresNomenclatureAccordion.fermer` |
| L65 | Branche conditionnelle (ternaire) | `Configurer` | `settings.organization.pupitresNomenclatureAccordion.configurer` |
| L82 | Bouton (<button>) | `🎵 Nomenclature & Voix (Marcante, Meião...)` | `settings.organization.pupitresNomenclatureAccordion.nomenclatureVoixMarcanteMeiao` |
| L93 | Bouton (<button>) | `🎨 Pupitres, Couleurs & Instruments Liés` | `settings.organization.pupitresNomenclatureAccordion.pupitresCouleursInstrumentsLies` |
| L103 | Libellé / Badge (<span>) | `Tradition & Préréglages Rapides` | `settings.organization.pupitresNomenclatureAccordion.traditionPrereglagesRapides` |
| L106 | Paragraphe (<p>) | `Sélectionnez un preset pour aligner les rôles ou personnalisez chaque nom de pupitre ci-dessous.` | `settings.organization.pupitresNomenclatureAccordion.selectionnezUnPresetPourAligner` |

#### 📄 `src/components/association-settings/organization/DefaultLocationsByEventTypeGrid.jsx` (6 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L8 | Config statique (label) | `🥁 Répétitions` | `settings.organization.defaultLocationsByEventTypeGrid.repetitions` |
| L9 | Config statique (label) | `🎭 Prestations` | `settings.organization.defaultLocationsByEventTypeGrid.prestations` |
| L10 | Config statique (label) | `🎓 Stages` | `settings.organization.defaultLocationsByEventTypeGrid.stages` |
| L11 | Config statique (label) | `🤝 Réunions & AG` | `settings.organization.defaultLocationsByEventTypeGrid.reunionsAg` |
| L16 | Libellé / Badge (<span>) | `🎯 Lieux par Défaut selon le Type d'Événement` | `settings.organization.defaultLocationsByEventTypeGrid.lieuxParDefautSelonLe` |
| L31 | Option de liste (<option>) | `🚫 Manuel` | `settings.organization.defaultLocationsByEventTypeGrid.manuel` |

#### 📄 `src/components/association-settings/organization/LieuEditModal.jsx` (15 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L40 | Message runtime (alert) | `Veuillez renseigner le nom et l'adresse complète.` | `settings.organization.lieuEditModal.veuillezRenseignerLeNomEt` |
| L64 | Branche conditionnelle (ternaire) | `✏️ Modifier le lieu` | `settings.organization.lieuEditModal.modifierLeLieu` |
| L64 | Branche conditionnelle (ternaire) | `➕ Nouveau lieu habituel` | `settings.organization.lieuEditModal.nouveauLieuHabituel` |
| L70 | Attribut title | `Fermer` | `settings.organization.lieuEditModal.fermer` |
| L80 | Label de formulaire (<label>) | `Nom usuel du lieu *` | `settings.organization.lieuEditModal.nomUsuelDuLieu` |
| L85 | Attribut placeholder | `Ex: Salle de répétition principale` | `settings.organization.lieuEditModal.exSalleDeRepetitionPrincipale` |
| L92 | Label de formulaire (<label>) | `Adresse physique complète *` | `settings.organization.lieuEditModal.adressePhysiqueComplete` |
| L105 | Attribut placeholder | `Rechercher une adresse sur Google Maps...` | `settings.organization.lieuEditModal.rechercherUneAdresseSurGoogle` |
| L116 | Branche conditionnelle (ternaire) | `Ajuster le repère sur la carte` | `settings.organization.lieuEditModal.ajusterLeRepereSurLa` |
| L116 | Branche conditionnelle (ternaire) | `Placer le repère sur la carte` | `settings.organization.lieuEditModal.placerLeRepereSurLa` |
| L119 | Libellé / Badge (<span>) | `✓ Repère GPS :` | `settings.organization.lieuEditModal.repereGps` |
| L126 | Label de formulaire (<label>) | `Instructions d'accès / Notes (Optionnel)` | `settings.organization.lieuEditModal.instructionsDAccesNotesOptionnel` |
| L131 | Attribut placeholder | `Ex: Digicode 45B, entrée côté cour` | `settings.organization.lieuEditModal.exDigicode45bEntreeCote` |
| L143 | Bouton (<button>) | `Annuler` | `settings.organization.lieuEditModal.annuler` |
| L152 | Nœud JSX | `Enregistrer` | `settings.organization.lieuEditModal.enregistrer` |

#### 📄 `src/components/association-settings/blocks/InstrumentsCatalogBlock.jsx` (34 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L34 | Config statique (label) | `Terracotta` | `settings.organization.instrumentsCatalogBlock.terracotta` |
| L35 | Config statique (label) | `Ocre` | `settings.organization.instrumentsCatalogBlock.ocre` |
| L36 | Config statique (label) | `Feuillage` | `settings.organization.instrumentsCatalogBlock.feuillage` |
| L37 | Config statique (label) | `Écorce` | `settings.organization.instrumentsCatalogBlock.ecorce` |
| L38 | Config statique (label) | `Patine` | `settings.organization.instrumentsCatalogBlock.patine` |
| L39 | Config statique (label) | `Encre` | `settings.organization.instrumentsCatalogBlock.encre` |
| L40 | Config statique (label) | `Ficelle` | `settings.organization.instrumentsCatalogBlock.ficelle` |
| L60 | Message runtime (alert) | `La Danse est gérée nativement comme discipline autonome et Mestre comme rôle de direction. Ils n'ont pas besoi` | `settings.organization.instrumentsCatalogBlock.laDanseEstGereeNativement` |
| L64 | Message runtime (alert) | `Cet instrument existe déjà !` | `settings.organization.instrumentsCatalogBlock.cetInstrumentExisteDeja` |
| L95 | Message runtime (alert) | `Cette liaison existe déjà !` | `settings.organization.instrumentsCatalogBlock.cetteLiaisonExisteDeja` |
| L118 | Titre (<h3>) | `🥁 Pupitres & Instruments` | `settings.organization.instrumentsCatalogBlock.pupitresInstruments` |
| L123 | Libellé / Badge (<span>) | `Ajouter un instrument` | `settings.organization.instrumentsCatalogBlock.ajouterUnInstrument` |
| L129 | Attribut placeholder | `Ex: Agbê, Chant...` | `settings.organization.instrumentsCatalogBlock.exAgbeChant` |
| L139 | Nœud JSX | `+ Ajouter` | `settings.organization.instrumentsCatalogBlock.ajouter` |
| L144 | Nœud JSX | `Précision` | `settings.organization.instrumentsCatalogBlock.precision` |
| L144 | Paragraphe (<p>) | `: Configurez uniquement les instruments physiques de votre parc musical (Alfaia, Caixa, Agbê...). La` | `settings.organization.instrumentsCatalogBlock.configurezUniquementLesInstrumentsPhysiques` |
| L144 | Nœud JSX | `Danse` | `settings.organization.instrumentsCatalogBlock.danse` |
| L144 | Paragraphe (<p>) | `(discipline autonome) et le` | `settings.organization.instrumentsCatalogBlock.disciplineAutonomeEtLe` |
| L144 | Nœud JSX | `Mestre` | `settings.organization.instrumentsCatalogBlock.mestre` |
| L144 | Paragraphe (<p>) | `(rôle de direction) sont gérés nativement par le système et ne doivent pas être ajoutés ici.` | `settings.organization.instrumentsCatalogBlock.roleDeDirectionSontGeres` |
| L150 | Libellé / Badge (<span>) | `Instruments configurés` | `settings.organization.instrumentsCatalogBlock.instrumentsConfigures` |
| L152 | Libellé / Badge (<span>) | `Aucun instrument configuré.` | `settings.organization.instrumentsCatalogBlock.aucunInstrumentConfigure` |
| L165 | Attribut title | `Supprimer` | `settings.organization.instrumentsCatalogBlock.supprimer` |
| L178 | Repli logique (||) | `Instruments Liés / Pupitres` | `settings.organization.instrumentsCatalogBlock.instrumentsLiesPupitres` |
| L186 | Repli logique (||) | `Nom du pupitre (optionnel)` | `settings.organization.instrumentsCatalogBlock.nomDuPupitreOptionnel` |
| L199 | Repli logique (||) | `Sélectionner les instruments du pupitre (minimum 2)` | `settings.organization.instrumentsCatalogBlock.selectionnerLesInstrumentsDuPupitre` |
| L241 | Nœud JSX | `Créer le Pupitre` | `settings.organization.instrumentsCatalogBlock.creerLePupitre` |
| L249 | Libellé / Badge (<span>) | `Pupitres configurés` | `settings.organization.instrumentsCatalogBlock.pupitresConfigures` |
| L253 | Libellé / Badge (<span>) | `Aucun pupitre configuré pour le moment.` | `settings.organization.instrumentsCatalogBlock.aucunPupitreConfigurePourLe` |
| L273 | Attribut title | `Supprimer` | `settings.organization.instrumentsCatalogBlock.supprimer` |
| L286 | Titre (<h3>) | `🎨 Couleurs des Pupitres & Instruments` | `settings.organization.instrumentsCatalogBlock.couleursDesPupitresInstruments` |
| L289 | Paragraphe (<p>) | `Configurez les couleurs des pupitres et instruments pour personnaliser l'identité visuelle de la troupe (utili` | `settings.organization.instrumentsCatalogBlock.configurezLesCouleursDesPupitres` |
| L326 | Attribut title | `{param} ({param})` | `settings.organization.instrumentsCatalogBlock.paramParam` |
| L343 | Libellé / Badge (<span>) | `Perso` | `settings.organization.instrumentsCatalogBlock.perso` |

---

### 🔹 Pilier 3 : Badges & Sécurité
**Description :** Gestion des Accès, Rôles & Matrice des Permissions (TabSecurity)  
**Namespace suggéré :** `settings.security.*`  
**Volume :** 158 chaînes réparties sur 2 fichier(s) à traiter.

#### 📄 `src/components/association-settings/TabSecurity.jsx` (157 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L10 | Config statique (label) | `🏛️ Gouvernance` | `settings.security.tabSecurity.gouvernance` |
| L11 | Config statique (desc) | `Pilotage stratégique, réunions et délibérations du Conseil d'Administration` | `settings.security.tabSecurity.pilotageStrategiqueReunionsEtDeliberations` |
| L13 | Config statique (label) | `Réunions & PV` | `settings.security.tabSecurity.reunionsPv` |
| L13 | Config statique (desc) | `Ordres du jour, délibérations et procès-verbaux de réunions` | `settings.security.tabSecurity.ordresDuJourDeliberationsEt` |
| L14 | Config statique (label) | `Bilans & Rapports AG` | `settings.security.tabSecurity.bilansRapportsAg` |
| L14 | Config statique (desc) | `Consolidation multi-pôles et bilans pour l'Assemblée Générale` | `settings.security.tabSecurity.consolidationMultiPolesEtBilans` |
| L15 | Config statique (label) | `Registre & Statuts` | `settings.security.tabSecurity.registreStatuts` |
| L15 | Config statique (desc) | `Documents officiels, statuts, règlement intérieur et PV officiels` | `settings.security.tabSecurity.documentsOfficielsStatutsReglementInterieur` |
| L16 | Config statique (label) | `Synthèse Financière` | `settings.security.tabSecurity.syntheseFinanciere` |
| L16 | Config statique (desc) | `Aperçu global des comptes, trésorerie et synthèses financières` | `settings.security.tabSecurity.apercuGlobalDesComptesTresorerie` |
| L17 | Config statique (label) | `Dates & Engagements` | `settings.security.tabSecurity.datesEngagements` |
| L17 | Config statique (desc) | `Suivi stratégique des prestations, devis et engagements` | `settings.security.tabSecurity.suiviStrategiqueDesPrestationsDevis` |
| L22 | Config statique (label) | `📋 Secrétariat` | `settings.security.tabSecurity.secretariat` |
| L23 | Config statique (desc) | `Gestion statutaire, annuaire, bilans d'activité, registre des dates et documents officiels` | `settings.security.tabSecurity.gestionStatutaireAnnuaireBilansD` |
| L25 | Config statique (label) | `Annuaire & Exports` | `settings.security.tabSecurity.annuaireExports` |
| L25 | Config statique (desc) | `Accès à la liste des adhérents et export CSV/Excel` | `settings.security.tabSecurity.accesALaListeDes` |
| L26 | Config statique (label) | `Rapports & Bilan AG` | `settings.security.tabSecurity.rapportsBilanAg` |
| L26 | Config statique (desc) | `Bilan d'activité AG et extraction CSV des présences` | `settings.security.tabSecurity.bilanDActiviteAgEt` |
| L27 | Config statique (label) | `Registre des dates` | `settings.security.tabSecurity.registreDesDates` |
| L27 | Config statique (desc) | `Tableau d'édition rapide et globale des événements` | `settings.security.tabSecurity.tableauDEditionRapideEt` |
| L28 | Config statique (label) | `Documents officiels` | `settings.security.tabSecurity.documentsOfficiels` |
| L28 | Config statique (desc) | `Documents administratifs et comptes-rendus officiels` | `settings.security.tabSecurity.documentsAdministratifsEtComptesRendus` |
| L29 | Config statique (label) | `Chartes, Santé & Liens` | `settings.security.tabSecurity.chartesSanteLiens` |
| L29 | Config statique (desc) | `Gestion des chartes, droits à l'image RGPD, attestations médicales et liens cloud` | `settings.security.tabSecurity.gestionDesChartesDroitsA` |
| L34 | Config statique (label) | `🎷 Diffusion` | `settings.security.tabSecurity.diffusion` |
| L35 | Config statique (desc) | `Suivi des prestations, opportunités de concerts et pipeline CRM` | `settings.security.tabSecurity.suiviDesPrestationsOpportunitesDe` |
| L37 | Config statique (label) | `Suivi des Prestations` | `settings.security.tabSecurity.suiviDesPrestations` |
| L37 | Config statique (desc) | `Gestion de l'entonnoir des prestations (demandes, devis, options, factures)` | `settings.security.tabSecurity.gestionDeLEntonnoirDes` |
| L42 | Config statique (label) | `🪙 Trésorerie` | `settings.security.tabSecurity.tresorerie` |
| L43 | Config statique (desc) | `Gestion financière, cotisations et frais kilométriques` | `settings.security.tabSecurity.gestionFinanciereCotisationsEtFrais` |
| L45 | Config statique (label) | `Synthèse` | `settings.security.tabSecurity.synthese` |
| L45 | Config statique (desc) | `Aperçu global de la trésorerie et synthèses` | `settings.security.tabSecurity.apercuGlobalDeLaTresorerie` |
| L46 | Config statique (label) | `Cotisations` | `settings.security.tabSecurity.cotisations` |
| L46 | Config statique (desc) | `Suivi et enregistrement des adhésions et cotisations` | `settings.security.tabSecurity.suiviEtEnregistrementDesAdhesions` |
| L47 | Config statique (label) | `Événements` | `settings.security.tabSecurity.evenements` |
| L47 | Config statique (desc) | `Suivi financier dédié aux prestations et événements` | `settings.security.tabSecurity.suiviFinancierDedieAuxPrestations` |
| L48 | Config statique (label) | `Opérations` | `settings.security.tabSecurity.operations` |
| L48 | Config statique (desc) | `Saisie des recettes et dépenses courantes hors événements` | `settings.security.tabSecurity.saisieDesRecettesEtDepenses` |
| L49 | Config statique (label) | `Frais` | `settings.security.tabSecurity.frais` |
| L49 | Config statique (desc) | `Validation et remboursement des indemnités kilométriques` | `settings.security.tabSecurity.validationEtRemboursementDesIndemnites` |
| L50 | Config statique (label) | `Exports` | `settings.security.tabSecurity.exports` |
| L50 | Config statique (desc) | `Génération du grand livre et exports comptables` | `settings.security.tabSecurity.generationDuGrandLivreEt` |
| L55 | Config statique (label) | `📦 Logistique` | `settings.security.tabSecurity.logistique` |
| L56 | Config statique (desc) | `Inventaire du parc d'instruments, commandes groupées, convois et malles régie` | `settings.security.tabSecurity.inventaireDuParcDInstruments` |
| L58 | Config statique (label) | `Parc Instruments & Cautions` | `settings.security.tabSecurity.parcInstrumentsCautions` |
| L58 | Config statique (desc) | `Gestion du parc d'instruments, cautions et état du matériel` | `settings.security.tabSecurity.gestionDuParcDInstruments` |
| L59 | Config statique (label) | `Commandes Groupées` | `settings.security.tabSecurity.commandesGroupees` |
| L59 | Config statique (desc) | `Suivi des achats et commandes de matériel` | `settings.security.tabSecurity.suiviDesAchatsEtCommandes` |
| L60 | Config statique (label) | `Convois & Flotte Véhicules` | `settings.security.tabSecurity.convoisFlotteVehicules` |
| L60 | Config statique (desc) | `Point de départ convoi, barème km et règles de transport` | `settings.security.tabSecurity.pointDeDepartConvoiBareme` |
| L61 | Config statique (label) | `Malles Régie & Trousses Secours` | `settings.security.tabSecurity.mallesRegieTroussesSecours` |
| L61 | Config statique (desc) | `Gestion des malles régie, trousses de secours, maquillage et outillage` | `settings.security.tabSecurity.gestionDesMallesRegieTrousses` |
| L66 | Config statique (label) | `🪚 Lutherie & Atelier` | `settings.security.tabSecurity.lutherieAtelier` |
| L67 | Config statique (desc) | `Artisanat, modèles d'instruments, établi, pièces détachées et outillage` | `settings.security.tabSecurity.artisanatModelesDInstrumentsEtabli` |
| L69 | Config statique (label) | `Établi & chantiers` | `settings.security.tabSecurity.etabliChantiers` |
| L69 | Config statique (desc) | `Suivi des chantiers de fabrication et réparations lourdes` | `settings.security.tabSecurity.suiviDesChantiersDeFabrication` |
| L70 | Config statique (label) | `Modèles d'instruments` | `settings.security.tabSecurity.modelesDInstruments` |
| L70 | Config statique (desc) | `Fiches techniques, nomenclatures et gabarits de fabrication` | `settings.security.tabSecurity.fichesTechniquesNomenclaturesEtGabarits` |
| L71 | Config statique (label) | `Pièces détachées` | `settings.security.tabSecurity.piecesDetachees` |
| L71 | Config statique (desc) | `Gestion des stocks de fûts, cercles, peaux et accastillage` | `settings.security.tabSecurity.gestionDesStocksDeFuts` |
| L72 | Config statique (label) | `Matières premières` | `settings.security.tabSecurity.matieresPremieres` |
| L72 | Config statique (desc) | `Suivi des cordes, tirants, vernis et consommables` | `settings.security.tabSecurity.suiviDesCordesTirantsVernis` |
| L73 | Config statique (label) | `Outillage` | `settings.security.tabSecurity.outillage` |
| L73 | Config statique (desc) | `Inventaire des outils et machines de l'atelier` | `settings.security.tabSecurity.inventaireDesOutilsEtMachines` |
| L74 | Config statique (label) | `Varal Lutherie` | `settings.security.tabSecurity.varalLutherie` |
| L74 | Config statique (desc) | `Tutoriels et plans de fabrication artisanale` | `settings.security.tabSecurity.tutorielsEtPlansDeFabrication` |
| L77 | Config statique (label) | `Validation d'atelier & Fiche suiveuse` | `settings.security.tabSecurity.validationDAtelierFicheSuiveuse` |
| L78 | Config statique (desc) | `Autorise à valider les étapes d'usinage et à demander des retouches sur l'établi` | `settings.security.tabSecurity.autoriseAValiderLesEtapes` |
| L86 | Config statique (label) | `🧵 Costumerie` | `settings.security.tabSecurity.costumerie` |
| L87 | Config statique (desc) | `Artisanat textile, confection des tenues, patrons, tissus et mensurations` | `settings.security.tabSecurity.artisanatTextileConfectionDesTenues` |
| L89 | Config statique (label) | `Établi de confection` | `settings.security.tabSecurity.etabliDeConfection` |
| L89 | Config statique (desc) | `Suivi des projets et chantiers couture en cours` | `settings.security.tabSecurity.suiviDesProjetsEtChantiers` |
| L90 | Config statique (label) | `Modèles & Patrons` | `settings.security.tabSecurity.modelesPatrons` |
| L90 | Config statique (desc) | `Gestion des modèles de costumes et pièces requises` | `settings.security.tabSecurity.gestionDesModelesDeCostumes` |
| L91 | Config statique (label) | `Vestiaire physique` | `settings.security.tabSecurity.vestiairePhysique` |
| L91 | Config statique (desc) | `Stock unitaire des tenues, état et prêts aux membres` | `settings.security.tabSecurity.stockUnitaireDesTenuesEtat` |
| L92 | Config statique (label) | `Tissus & Mercerie` | `settings.security.tabSecurity.tissusMercerie` |
| L92 | Config statique (desc) | `Gestion des rouleaux de tissus, fils, boutons et consommables` | `settings.security.tabSecurity.gestionDesRouleauxDeTissus` |
| L93 | Config statique (label) | `Machines & Outils` | `settings.security.tabSecurity.machinesOutils` |
| L93 | Config statique (desc) | `Inventaire des machines à coudre, surjeteuses et outils` | `settings.security.tabSecurity.inventaireDesMachinesACoudre` |
| L94 | Config statique (label) | `Tailles & Mensurations` | `settings.security.tabSecurity.taillesMensurations` |
| L94 | Config statique (desc) | `Tableau des tailles et mensurations des danseurs et musiciens` | `settings.security.tabSecurity.tableauDesTaillesEtMensurations` |
| L95 | Config statique (label) | `Varal Costumerie` | `settings.security.tabSecurity.varalCostumerie` |
| L95 | Config statique (desc) | `Patrons de coupe et fiches techniques de couture` | `settings.security.tabSecurity.patronsDeCoupeEtFiches` |
| L100 | Config statique (label) | `Studio` | `settings.security.tabSecurity.studio` |
| L101 | Config statique (desc) | `Communication externe, réseaux sociaux, lettres d'info et photothèque` | `settings.security.tabSecurity.communicationExterneReseauxSociauxLettres` |
| L105 | Config statique (label) | `Le Mégaphone (Annonces)` | `settings.security.tabSecurity.leMegaphoneAnnonces` |
| L106 | Config statique (desc) | `Autorise à rédiger, publier et gérer les annonces officielles sur le tableau de bord (ex: CA, Modérateur, Comm` | `settings.security.tabSecurity.autoriseARedigerPublierEt` |
| L110 | Config statique (label) | `Réseaux & Médias` | `settings.security.tabSecurity.reseauxMedias` |
| L110 | Config statique (desc) | `Gestion et publication sur les réseaux sociaux` | `settings.security.tabSecurity.gestionEtPublicationSurLes` |
| L111 | Config statique (label) | `Lettres d'info` | `settings.security.tabSecurity.lettresDInfo` |
| L111 | Config statique (desc) | `Création et envoi de lettres d'information` | `settings.security.tabSecurity.creationEtEnvoiDeLettres` |
| L112 | Config statique (label) | `Médiathèque Photos` | `settings.security.tabSecurity.mediathequePhotos` |
| L112 | Config statique (desc) | `Dépôts et albums photos partagés des prestations` | `settings.security.tabSecurity.depotsEtAlbumsPhotosPartages` |
| L113 | Config statique (label) | `Communication & Brevo` | `settings.security.tabSecurity.communicationBrevo` |
| L113 | Config statique (desc) | `Vidéo à la une, synchronisation Brevo, Cloud Functions et exports` | `settings.security.tabSecurity.videoALaUneSynchronisation` |
| L114 | Config statique (label) | `Lexique & Mentions` | `settings.security.tabSecurity.lexiqueMentions` |
| L114 | Config statique (desc) | `Dictionnaire des termes musicaux, mentions légales et lexique` | `settings.security.tabSecurity.dictionnaireDesTermesMusicauxMentions` |
| L119 | Config statique (label) | `📚 Pédagogie` | `settings.security.tabSecurity.pedagogie` |
| L120 | Config statique (desc) | `Transmission musicale, parcours et Varal pédagogique` | `settings.security.tabSecurity.transmissionMusicaleParcoursEtVaral` |
| L122 | Config statique (label) | `Varal Pédagogique` | `settings.security.tabSecurity.varalPedagogique` |
| L122 | Config statique (desc) | `Toadas, fiches de culture et tutoriels vidéo` | `settings.security.tabSecurity.toadasFichesDeCultureEt` |
| L123 | Config statique (label) | `QCM & Quiz` | `settings.security.tabSecurity.qcmQuiz` |
| L123 | Config statique (desc) | `Gestion des questionnaires et seuils de validation` | `settings.security.tabSecurity.gestionDesQuestionnairesEtSeuils` |
| L124 | Config statique (label) | `Suivi & Analyse` | `settings.security.tabSecurity.suiviAnalyse` |
| L124 | Config statique (desc) | `Visualisation de la progression et aisance des adhérents` | `settings.security.tabSecurity.visualisationDeLaProgressionEt` |
| L129 | Config statique (label) | `🥁 Mestria` | `settings.security.tabSecurity.mestria` |
| L130 | Config statique (desc) | `Direction artistique et plan de scène` | `settings.security.tabSecurity.directionArtistiqueEtPlanDe` |
| L132 | Config statique (label) | `Répertoire` | `settings.security.tabSecurity.repertoire` |
| L132 | Config statique (desc) | `Gestion de la setlist de saison et statut des morceaux` | `settings.security.tabSecurity.gestionDeLaSetlistDe` |
| L133 | Config statique (label) | `Catégories de pratique` | `settings.security.tabSecurity.categoriesDePratique` |
| L133 | Config statique (desc) | `Gestion des sections et niveaux de pratique de la troupe` | `settings.security.tabSecurity.gestionDesSectionsEtNiveaux` |
| L134 | Config statique (label) | `Casting` | `settings.security.tabSecurity.casting` |
| L134 | Config statique (desc) | `Gestion des affectations d'instruments et vœux d'évolution` | `settings.security.tabSecurity.gestionDesAffectationsDInstruments` |
| L135 | Config statique (label) | `Événements` | `settings.security.tabSecurity.evenements` |
| L135 | Config statique (desc) | `Vue mestre détaillée des événements et présences` | `settings.security.tabSecurity.vueMestreDetailleeDesEvenements` |
| L136 | Config statique (label) | `Plan de Scène` | `settings.security.tabSecurity.planDeScene` |
| L136 | Config statique (desc) | `Création et disposition visuelle du placement scénique` | `settings.security.tabSecurity.creationEtDispositionVisuelleDu` |
| L137 | Config statique (label) | `Annonces` | `settings.security.tabSecurity.annonces` |
| L137 | Config statique (desc) | `Publication des communications officielles du Mestre` | `settings.security.tabSecurity.publicationDesCommunicationsOfficiellesDu` |
| L142 | Config statique (label) | `🌐 Vitrine Publique` | `settings.security.tabSecurity.vitrinePublique` |
| L143 | Config statique (desc) | `Autorisations de prévisualisation en mode brouillon et d'administration de la vitrine` | `settings.security.tabSecurity.autorisationsDePrevisualisationEnMode` |
| L145 | Config statique (label) | `Vitrine — Prévisualisation (Mode Brouillon)` | `settings.security.tabSecurity.vitrinePrevisualisationModeBrouillon` |
| L145 | Config statique (desc) | `Permet d'accéder à la vitrine lorsque isPublished est à false (mode en construction)` | `settings.security.tabSecurity.permetDAccederALa` |
| L146 | Config statique (label) | `Vitrine — Édition & Configuration` | `settings.security.tabSecurity.vitrineEditionConfiguration` |
| L146 | Config statique (desc) | `Permet d'accéder au pôle d'administration de la Vitrine (textes, formules, images, SEO, etc.)` | `settings.security.tabSecurity.permetDAccederAuPole` |
| L151 | Config statique (label) | `⚙️ Configuration` | `settings.security.tabSecurity.configuration` |
| L152 | Config statique (desc) | `Paramètres institutionnels de l'association, identité, sécurité, modules et profils` | `settings.security.tabSecurity.parametresInstitutionnelsDeLAssociation` |
| L154 | Config statique (label) | `Identité légale & Juridique` | `settings.security.tabSecurity.identiteLegaleJuridique` |
| L154 | Config statique (desc) | `SIRET, RNA, siège social, signatures et coordonnées bancaires` | `settings.security.tabSecurity.siretRnaSiegeSocialSignatures` |
| L155 | Config statique (label) | `Inscription, Profils & Lieux/Agenda` | `settings.security.tabSecurity.inscriptionProfilsLieuxAgenda` |
| L155 | Config statique (desc) | `Formulaire d'inscription, cycles annuels, salles clés et catégories d'agenda` | `settings.security.tabSecurity.formulaireDInscriptionCyclesAnnuels` |
| L156 | Config statique (label) | `Badges, Rôles & Sécurité` | `settings.security.tabSecurity.badgesRolesSecurite` |
| L156 | Config statique (desc) | `Matrice RBAC des rôles et permissions par pôle` | `settings.security.tabSecurity.matriceRbacDesRolesEt` |
| L157 | Config statique (label) | `Communication, E-mails & Automatisations` | `settings.security.tabSecurity.communicationEMailsAutomatisations` |
| L157 | Config statique (desc) | `Configuration expéditeur, API Brevo, DNS et règles de relance automatique` | `settings.security.tabSecurity.configurationExpediteurApiBrevoDns` |
| L158 | Config statique (label) | `Modules SaaS, Apparence & Médias` | `settings.security.tabSecurity.modulesSaasApparenceMedias` |
| L158 | Config statique (desc) | `Activation des pôles, nomenclature des tambours, logo et playlists` | `settings.security.tabSecurity.activationDesPolesNomenclatureDes` |
| L331 | Repli logique (||) | `Gestionnaire d'Étiquettes & Vue Inversée` | `settings.security.tabSecurity.gestionnaireDEtiquettesVueInversee` |
| L334 | Repli logique (||) | `Créer ou modifier les rôles (ex. Trésorier, CA), auditer les membres porteurs et dissocier les étiquettes.` | `settings.security.tabSecurity.creerOuModifierLesRoles` |
| L343 | Repli logique (||) | `Ouvrir les Badges & Vue Inversée →` | `settings.security.tabSecurity.ouvrirLesBadgesVueInversee` |
| L357 | Repli logique (||) | `Matrice des Permissions (Par Pôle & Par Onglet)` | `settings.security.tabSecurity.matriceDesPermissionsParPole` |
| L367 | Repli logique (||) | `Tout ouvrir` | `settings.security.tabSecurity.toutOuvrir` |
| L375 | Repli logique (||) | `Tout fermer` | `settings.security.tabSecurity.toutFermer` |
| L381 | Repli logique (||) | `Attribuez l'accès global à un pôle entier (recommandé pour une gestion rapide) ou affinez les autorisations on` | `settings.security.tabSecurity.attribuezLAccesGlobalA` |
| L386 | Repli logique (||) | `Aucune étiquette/badge n'est configuré pour cette association. Veuillez d'abord créer des badges dans le Gesti` | `settings.security.tabSecurity.aucuneEtiquetteBadgeNEst` |
| L447 | Repli logique (||) | `Cochez une étiquette ici pour lui accorder l'accès d'office à l'ensemble du pôle et à tous ses onglets en une ` | `settings.security.tabSecurity.cochezUneEtiquetteIciPour` |
| L458 | Attribut title | `Accorder l'accès à tout le pôle pour toutes les étiquettes` | `settings.security.tabSecurity.accorderLAccesATout` |
| L461 | Repli logique (||) | `Tout le Pôle` | `settings.security.tabSecurity.toutLePole` |
| L468 | Attribut title | `Retirer les accès globaux accordés à ce pôle` | `settings.security.tabSecurity.retirerLesAccesGlobauxAccordes` |
| L470 | Repli logique (||) | `Aucun` | `settings.security.tabSecurity.aucun` |
| L484 | Repli logique (||) | `Restrictions par Onglet Spécifique` | `settings.security.tabSecurity.restrictionsParOngletSpecifique` |
| L487 | Repli logique (||) | `(Pour attribuer un accès partiel aux membres n'ayant pas l'accès global au pôle)` | `settings.security.tabSecurity.pourAttribuerUnAccesPartiel` |
| L516 | Attribut title | `Cocher tous les badges pour cet onglet` | `settings.security.tabSecurity.cocherTousLesBadgesPour` |
| L518 | Repli logique (||) | `Tous` | `settings.security.tabSecurity.tous` |
| L524 | Attribut title | `Décocher tous les badges pour cet onglet` | `settings.security.tabSecurity.decocherTousLesBadgesPour` |
| L526 | Repli logique (||) | `Aucun` | `settings.security.tabSecurity.aucun` |

#### 📄 `src/components/PermissionsGuideBox.jsx` (1 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L82 | Nœud JSX | `Note :` | `settings.security.permissionsGuideBox.note` |

---

### 🔹 Pilier 4 : Modules SaaS & Apparence
**Description :** Activation des Pôles, Vestiaire, Nomenclature & Médias (TabModules)  
**Namespace suggéré :** `settings.modules.*`  
**Volume :** 103 chaînes réparties sur 7 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/TabModules.jsx`
- ✅ `src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx`

#### 📄 `src/components/association-settings/modules/ModulesSwitchesTable.jsx` (32 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L6 | Config statique (title) | `Gouvernance & Conseil d'Administration` | `settings.modules.modulesSwitchesTable.gouvernanceConseilDAdministration` |
| L6 | Config statique (desc) | `Réunions de CA, bilans AG et registre des statuts` | `settings.modules.modulesSwitchesTable.reunionsDeCaBilansAg` |
| L7 | Config statique (title) | `Diffusion & Pipeline Prestations` | `settings.modules.modulesSwitchesTable.diffusionPipelinePrestations` |
| L7 | Config statique (desc) | `Prestations, démarchage et opportunités de concerts` | `settings.modules.modulesSwitchesTable.prestationsDemarchageEtOpportunitesDe` |
| L8 | Config statique (title) | `Trésorerie & Finances` | `settings.modules.modulesSwitchesTable.tresorerieFinances` |
| L8 | Config statique (desc) | `Cotisations, dépenses, notes de frais kilométriques` | `settings.modules.modulesSwitchesTable.cotisationsDepensesNotesDeFrais` |
| L9 | Config statique (title) | `Logistique & Instruments` | `settings.modules.modulesSwitchesTable.logistiqueInstruments` |
| L9 | Config statique (desc) | `Inventaire matériel, état du parc, convois` | `settings.modules.modulesSwitchesTable.inventaireMaterielEtatDuParc` |
| L10 | Config statique (title) | `Boutique & Commandes` | `settings.modules.modulesSwitchesTable.boutiqueCommandes` |
| L10 | Config statique (desc) | `Commandes groupées de consommables pour la troupe` | `settings.modules.modulesSwitchesTable.commandesGroupeesDeConsommablesPour` |
| L11 | Config statique (title) | `Vestiaire & Costumerie` | `settings.modules.modulesSwitchesTable.vestiaireCostumerie` |
| L11 | Config statique (desc) | `Suivi des costumes, mensurations et pièces textiles` | `settings.modules.modulesSwitchesTable.suiviDesCostumesMensurationsEt` |
| L12 | Config statique (title) | `Covoiturage Événements` | `settings.modules.modulesSwitchesTable.covoiturageEvenements` |
| L12 | Config statique (desc) | `Organisation des trajets partagés sur l'agenda` | `settings.modules.modulesSwitchesTable.organisationDesTrajetsPartagesSur` |
| L13 | Config statique (title) | `Studio Social & Médias` | `settings.modules.modulesSwitchesTable.studioSocialMedias` |
| L13 | Config statique (desc) | `Photothèque, diffusion externe et Varal` | `settings.modules.modulesSwitchesTable.photothequeDiffusionExterneEtVaral` |
| L14 | Config statique (title) | `Gestion des Réunions` | `settings.modules.modulesSwitchesTable.gestionDesReunions` |
| L14 | Config statique (desc) | `Ordres du jour, PV et comptes-rendus` | `settings.modules.modulesSwitchesTable.ordresDuJourPvEt` |
| L15 | Config statique (title) | `Porte-voix (Discussions)` | `settings.modules.modulesSwitchesTable.porteVoixDiscussions` |
| L15 | Config statique (desc) | `Messagerie communautaire et canaux de discussion` | `settings.modules.modulesSwitchesTable.messagerieCommunautaireEtCanauxDe` |
| L16 | Config statique (title) | `Espace Mestre & Direction Artistique` | `settings.modules.modulesSwitchesTable.espaceMestreDirectionArtistique` |
| L16 | Config statique (desc) | `Plan de scène, orientation et casting` | `settings.modules.modulesSwitchesTable.planDeSceneOrientationEt` |
| L17 | Config statique (title) | `Roda Quiz & Défis` | `settings.modules.modulesSwitchesTable.rodaQuizDefis` |
| L17 | Config statique (desc) | `Défis Rythme et Culture en direct` | `settings.modules.modulesSwitchesTable.defisRythmeEtCultureEn` |
| L51 | Titre (<h3>) | `🧩 Pôles Métiers & Modules SaaS` | `settings.modules.modulesSwitchesTable.polesMetiersModulesSaas` |
| L54 | Paragraphe (<p>) | `Activez uniquement les pôles pertinents pour adapter l'application à la taille de votre structure.` | `settings.modules.modulesSwitchesTable.activezUniquementLesPolesPertinents` |
| L65 | Bouton (<button>) | `✓ Tout activer` | `settings.modules.modulesSwitchesTable.toutActiver` |
| L74 | Bouton (<button>) | `✕ Tout désactiver` | `settings.modules.modulesSwitchesTable.toutDesactiver` |
| L112 | Libellé / Badge (<span>) | `⚡ Fonctionnalités Transversales & Visibilité` | `settings.modules.modulesSwitchesTable.fonctionnalitesTransversalesVisibilite` |
| L118 | Libellé / Badge (<span>) | `🟢 Pastilles de statut en ligne` | `settings.modules.modulesSwitchesTable.pastillesDeStatutEnLigne` |
| L129 | Libellé / Badge (<span>) | `📜 Répertoire ouvert aux membres` | `settings.modules.modulesSwitchesTable.repertoireOuvertAuxMembres` |
| L143 | Libellé / Badge (<span>) | `📈 Auto-évaluation individuelle` | `settings.modules.modulesSwitchesTable.autoEvaluationIndividuelle` |

#### 📄 `src/components/association-settings/modules/WardrobeMemberModeCard.jsx` (13 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L12 | Config statique (label) | `Garde-robe personnelle` | `settings.modules.wardrobeMemberModeCard.gardeRobePersonnelle` |
| L13 | Config statique (badge) | `Individuel` | `settings.modules.wardrobeMemberModeCard.individuel` |
| L17 | Config statique (desc) | `Chaque adhérent possède et entretient sa tenue individuelle.` | `settings.modules.wardrobeMemberModeCard.chaqueAdherentPossedeEtEntretient` |
| L18 | Config statique (details) | `Mannequin interactif d'habillage SVG, checklist des pièces possédées et validation autonome des tenues.` | `settings.modules.wardrobeMemberModeCard.mannequinInteractifDHabillageSvg` |
| L23 | Config statique (label) | `Confection collective & Atelier` | `settings.modules.wardrobeMemberModeCard.confectionCollectiveAtelier` |
| L24 | Config statique (badge) | `Mutualisé` | `settings.modules.wardrobeMemberModeCard.mutualise` |
| L28 | Config statique (desc) | `Parc de costumes associatif mutualisé et prêté le jour des prestations.` | `settings.modules.wardrobeMemberModeCard.parcDeCostumesAssociatifMutualise` |
| L29 | Config statique (details) | `Compteur déclaratif des pièces confectionnées pour le stock, rappel du chantier textile en cours et accès dire` | `settings.modules.wardrobeMemberModeCard.compteurDeclaratifDesPiecesConfectionnees` |
| L34 | Config statique (label) | `Désactivé (Masqué pour les membres)` | `settings.modules.wardrobeMemberModeCard.desactiveMasquePourLesMembres` |
| L35 | Config statique (badge) | `Masqué Adhérents` | `settings.modules.wardrobeMemberModeCard.masqueAdherents` |
| L39 | Config statique (desc) | `L'onglet Vestiaire disparaît de l'espace membre pour les adhérents simples.` | `settings.modules.wardrobeMemberModeCard.lOngletVestiaireDisparaitDe` |
| L40 | Config statique (details) | `Le Pôle Costumerie & WardrobeManager reste pleinement accessible aux responsables ayant le badge requis.` | `settings.modules.wardrobeMemberModeCard.lePoleCostumerieWardrobemanagerReste` |
| L66 | Branche conditionnelle (ternaire) | `Personnel` | `settings.modules.wardrobeMemberModeCard.personnel` |

#### 📄 `src/components/association-settings/modules/TamboursNamingAccordion.jsx` (6 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L17 | Config statique (label) | `Personnalisé` | `settings.modules.tamboursNamingAccordion.personnalise` |
| L41 | Libellé / Badge (<span>) | `Nomenclature des Tambours & Pupitres (` | `settings.modules.tamboursNamingAccordion.nomenclatureDesTamboursPupitres` |
| L44 | Libellé / Badge (<span>) | `(Alfaias, caisses, cloches, voix...)` | `settings.modules.tamboursNamingAccordion.alfaiasCaissesClochesVoix` |
| L53 | Branche conditionnelle (ternaire) | `Fermer` | `settings.modules.tamboursNamingAccordion.fermer` |
| L53 | Branche conditionnelle (ternaire) | `Ajuster` | `settings.modules.tamboursNamingAccordion.ajuster` |
| L61 | Libellé / Badge (<span>) | `Tradition & Présélection Rapide` | `settings.modules.tamboursNamingAccordion.traditionPreselectionRapide` |

#### 📄 `src/components/association-settings/modules/BrandingLogoAccordion.jsx` (16 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L38 | Libellé / Badge (<span>) | `Identité Visuelle & Logo Officiel` | `settings.modules.brandingLogoAccordion.identiteVisuelleLogoOfficiel` |
| L43 | Attribut alt | `Logo` | `settings.modules.brandingLogoAccordion.logo` |
| L45 | Attribut title | `Couleur primaire` | `settings.modules.brandingLogoAccordion.couleurPrimaire` |
| L46 | Attribut title | `Couleur secondaire` | `settings.modules.brandingLogoAccordion.couleurSecondaire` |
| L54 | Branche conditionnelle (ternaire) | `Fermer` | `settings.modules.brandingLogoAccordion.fermer` |
| L54 | Branche conditionnelle (ternaire) | `Personnaliser` | `settings.modules.brandingLogoAccordion.personnaliser` |
| L63 | Attribut alt | `Logo` | `settings.modules.brandingLogoAccordion.logo` |
| L65 | Nœud JSX | `Aucun` | `settings.modules.brandingLogoAccordion.aucun` |
| L70 | Libellé / Badge (<span>) | `Remplacer le Logo (SVG ou PNG transparent)` | `settings.modules.brandingLogoAccordion.remplacerLeLogoSvgOu` |
| L81 | Libellé / Badge (<span>) | `✓ Fichier prêt :` | `settings.modules.brandingLogoAccordion.fichierPret` |
| L84 | Libellé / Badge (<span>) | `Envoi du logo en cours...` | `settings.modules.brandingLogoAccordion.envoiDuLogoEnCours` |
| L91 | Libellé / Badge (<span>) | `Charte Graphique de l'Association` | `settings.modules.brandingLogoAccordion.charteGraphiqueDeLAssociation` |
| L103 | Libellé / Badge (<span>) | `Primaire` | `settings.modules.brandingLogoAccordion.primaire` |
| L114 | Libellé / Badge (<span>) | `Secondaire` | `settings.modules.brandingLogoAccordion.secondaire` |
| L125 | Libellé / Badge (<span>) | `Arrière-plan` | `settings.modules.brandingLogoAccordion.arrierePlan` |
| L136 | Libellé / Badge (<span>) | `Texte` | `settings.modules.brandingLogoAccordion.texte` |

#### 📄 `src/components/association-settings/modules/MediaStorageAccordion.jsx` (15 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L29 | Exception d'erreur (new Error) | `Lien non généré.` | `settings.modules.mediaStorageAccordion.lienNonGenere` |
| L49 | Libellé / Badge (<span>) | `Playlists YouTube (` | `settings.modules.mediaStorageAccordion.playlistsYoutube` |
| L50 | Libellé / Badge (<span>) | `configurées)` | `settings.modules.mediaStorageAccordion.configurees` |
| L52 | Libellé / Badge (<span>) | `(Sélection de vidéos pour les ateliers et l'accueil)` | `settings.modules.mediaStorageAccordion.selectionDeVideosPourLes` |
| L61 | Branche conditionnelle (ternaire) | `Fermer` | `settings.modules.mediaStorageAccordion.fermer` |
| L61 | Branche conditionnelle (ternaire) | `Gérer` | `settings.modules.mediaStorageAccordion.gerer` |
| L84 | Libellé / Badge (<span>) | `Stockage Cloud des Captations (Framaspace / Drive)` | `settings.modules.mediaStorageAccordion.stockageCloudDesCaptationsFramaspace` |
| L88 | Branche conditionnelle (ternaire) | `(Dossier configuré ✓)` | `settings.modules.mediaStorageAccordion.dossierConfigure` |
| L88 | Branche conditionnelle (ternaire) | `(Non renseigné)` | `settings.modules.mediaStorageAccordion.nonRenseigne` |
| L96 | Branche conditionnelle (ternaire) | `Fermer` | `settings.modules.mediaStorageAccordion.fermer` |
| L96 | Branche conditionnelle (ternaire) | `Configurer` | `settings.modules.mediaStorageAccordion.configurer` |
| L102 | Paragraphe (<p>) | `Lien du dossier de dépôt par défaut où les adhérents déposent leurs captations brutes lors des répétitions et ` | `settings.modules.mediaStorageAccordion.lienDuDossierDeDepot` |
| L108 | Label de formulaire (<label>) | `🔗 Lien du dossier de dépôt (Framaspace File Drop / Nextcloud / Drive)` | `settings.modules.mediaStorageAccordion.lienDuDossierDeDepot` |
| L117 | Branche conditionnelle (ternaire) | `⏳ Création...` | `settings.modules.mediaStorageAccordion.creation` |
| L117 | Branche conditionnelle (ternaire) | `⚡ Créer automatiquement sur Framaspace` | `settings.modules.mediaStorageAccordion.creerAutomatiquementSurFramaspace` |

#### 📄 `src/components/association-settings/modules/MemberDashboardLayoutAccordion.jsx` (20 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L5 | Config statique (label) | `📢 Le Mégaphone (Annonces officielles)` | `settings.modules.memberDashboardLayoutAccordion.leMegaphoneAnnoncesOfficielles` |
| L6 | Config statique (label) | `🎬 Vidéo à la une (YouTube)` | `settings.modules.memberDashboardLayoutAccordion.videoALaUneYoutube` |
| L7 | Config statique (label) | `📝 Le Mot du Mestre` | `settings.modules.memberDashboardLayoutAccordion.leMotDuMestre` |
| L8 | Config statique (label) | `📅 Dates à Venir (Agenda)` | `settings.modules.memberDashboardLayoutAccordion.datesAVenirAgenda` |
| L9 | Config statique (label) | `📦 Achats de Matériel (Commandes)` | `settings.modules.memberDashboardLayoutAccordion.achatsDeMaterielCommandes` |
| L10 | Config statique (label) | `💬 Le Porte-Voix (Discussions)` | `settings.modules.memberDashboardLayoutAccordion.lePorteVoixDiscussions` |
| L11 | Config statique (label) | `📂 Varal de Documents` | `settings.modules.memberDashboardLayoutAccordion.varalDeDocuments` |
| L12 | Config statique (label) | `🪙 Adhésion & Cotisation` | `settings.modules.memberDashboardLayoutAccordion.adhesionCotisation` |
| L56 | Libellé / Badge (<span>) | `Disposition des Blocs de l'Accueil Adhérent` | `settings.modules.memberDashboardLayoutAccordion.dispositionDesBlocsDeL` |
| L59 | Libellé / Badge (<span>) | `(Ordre d'affichage du tableau de bord & anniversaires)` | `settings.modules.memberDashboardLayoutAccordion.ordreDAffichageDuTableau` |
| L68 | Branche conditionnelle (ternaire) | `Fermer` | `settings.modules.memberDashboardLayoutAccordion.fermer` |
| L68 | Branche conditionnelle (ternaire) | `Réorganiser` | `settings.modules.memberDashboardLayoutAccordion.reorganiser` |
| L79 | Libellé / Badge (<span>) | `Emplacement du Bloc Anniversaires` | `settings.modules.memberDashboardLayoutAccordion.emplacementDuBlocAnniversaires` |
| L80 | Libellé / Badge (<span>) | `Affichage des anniversaires de la semaine des adhérents` | `settings.modules.memberDashboardLayoutAccordion.affichageDesAnniversairesDeLa` |
| L89 | Option de liste (<option>) | `En bas du tableau de bord` | `settings.modules.memberDashboardLayoutAccordion.enBasDuTableauDe` |
| L90 | Option de liste (<option>) | `En haut (sous le mégaphone)` | `settings.modules.memberDashboardLayoutAccordion.enHautSousLeMegaphone` |
| L91 | Option de liste (<option>) | `Désactivé (Masqué)` | `settings.modules.memberDashboardLayoutAccordion.desactiveMasque` |
| L97 | Libellé / Badge (<span>) | `Ordre d'apparition des cartes sur l'Accueil` | `settings.modules.memberDashboardLayoutAccordion.ordreDApparitionDesCartes` |
| L116 | Attribut title | `Monter` | `settings.modules.memberDashboardLayoutAccordion.monter` |
| L125 | Attribut title | `Descendre` | `settings.modules.memberDashboardLayoutAccordion.descendre` |

#### 📄 `src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx` (1 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L138 | Config statique (message) | `Veuillez renseigner l'URL de l'instance, l'identifiant et le mot de passe d'application avant de tester.` | `settings.modules.framaspaceIntegrationBlock.veuillezRenseignerLUrlDe` |

---

### 🔹 Cadre Général des Paramètres
**Description :** Ruban des Piliers & Actions Globales (AssociationSettings)  
**Namespace suggéré :** `settings.general.*`  
**Volume :** 12 chaînes réparties sur 1 fichier(s) à traiter.

#### 📄 `src/components/AssociationSettings.jsx` (12 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L98 | Titre (<h2>) | `🚨 ACCÈS REFUSÉ` | `settings.general.associationSettings.accesRefuse` |
| L99 | Paragraphe (<p>) | `Vous devez être administrateur pour configurer les paramètres de l'association.` | `settings.general.associationSettings.vousDevezEtreAdministrateurPour` |
| L103 | Nœud JSX | `⬅️ Retour` | `settings.general.associationSettings.retour` |
| L230 | Bouton (<button>) | `⬅️ Retour` | `settings.general.associationSettings.retour` |
| L235 | Repli en dur après t() | `Paramètres Association` | `settings.general.associationSettings.parametresAssociation` |
| L242 | Nœud JSX | `🔧 Personnalisez l'identité visuelle de votre association et configurez les champs requis pour le profil de vo` | `settings.general.associationSettings.personnalisezLIdentiteVisuelleDe` |
| L272 | Libellé / Badge (<span>) | `Identité Légale` | `settings.general.associationSettings.identiteLegale` |
| L286 | Libellé / Badge (<span>) | `Inscription, Profils & Pupitres` | `settings.general.associationSettings.inscriptionProfilsPupitres` |
| L300 | Libellé / Badge (<span>) | `Agenda & Lieux` | `settings.general.associationSettings.agendaLieux` |
| L314 | Libellé / Badge (<span>) | `Badges & Sécurité` | `settings.general.associationSettings.badgesSecurite` |
| L328 | Libellé / Badge (<span>) | `Communication & Automatisations` | `settings.general.associationSettings.communicationAutomatisations` |
| L342 | Libellé / Badge (<span>) | `Modules, Apparence & Médias` | `settings.general.associationSettings.modulesApparenceMedias` |

---

### 🔹 Configuration Métier : Agenda & Lieux
**Description :** Options de l'Agenda, Types d'Événements, Convois & Lieux (TabAgenda)  
**Namespace suggéré :** `settings.agenda.*`  
**Volume :** 108 chaînes réparties sur 6 fichier(s) à traiter.

#### 📄 `src/components/association-settings/TabAgenda.jsx` (38 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L38 | Message runtime (alert) | `Ce type d'événement existe déjà.` | `settings.agenda.tabAgenda.ceTypeDEvenementExiste` |
| L91 | Message runtime (alert) | `Vous devez conserver au moins un type d'événement.` | `settings.agenda.tabAgenda.vousDevezConserverAuMoins` |
| L96 | Config statique (title) | `Supprimer le type d'événement` | `settings.agenda.tabAgenda.supprimerLeTypeDEvenement` |
| L125 | Bouton (<button>) | `📜 Vue d'ensemble (Tout)` | `settings.agenda.tabAgenda.vueDEnsembleTout` |
| L136 | Bouton (<button>) | `📍 Salles & Lieux Habituels` | `settings.agenda.tabAgenda.sallesLieuxHabituels` |
| L147 | Bouton (<button>) | `📅 Types d'Événements & Presets` | `settings.agenda.tabAgenda.typesDEvenementsPresets` |
| L157 | Titre (<h2>) | `1. Répertoire des Salles, Repères GPS & Lieux Habituels` | `settings.agenda.tabAgenda.1RepertoireDesSallesReperes` |
| L175 | Titre (<h2>) | `2. Types d'Événements, Presets & Options d'Agenda` | `settings.agenda.tabAgenda.2TypesDEvenementsPresets` |
| L182 | Titre (<h3>) | `📋 Catégories et Types d'Événements` | `settings.agenda.tabAgenda.categoriesEtTypesDEvenements` |
| L188 | Libellé / Badge (<span>) | `Ajouter un type d'événement` | `settings.agenda.tabAgenda.ajouterUnTypeDEvenement` |
| L194 | Attribut placeholder | `Ex: ca, forum des assos, festival...` | `settings.agenda.tabAgenda.exCaForumDesAssos` |
| L205 | Nœud JSX | `+ Ajouter` | `settings.agenda.tabAgenda.ajouter` |
| L214 | Libellé / Badge (<span>) | `Types actifs & Presets par format` | `settings.agenda.tabAgenda.typesActifsPresetsParFormat` |
| L217 | Libellé / Badge (<span>) | `Dépliez un type pour configurer ses modules par défaut` | `settings.agenda.tabAgenda.depliezUnTypePourConfigurer` |
| L268 | Libellé / Badge (<span>) | `Options générales de l'agenda (RSVP, plan de scène, covoiturage...)` | `settings.agenda.tabAgenda.optionsGeneralesDeLAgenda` |
| L271 | Libellé / Badge (<span>) | `(Modules transversaux activés pour l'ensemble des événements)` | `settings.agenda.tabAgenda.modulesTransversauxActivesPourL` |
| L280 | Branche conditionnelle (ternaire) | `Fermer` | `settings.agenda.tabAgenda.fermer` |
| L280 | Branche conditionnelle (ternaire) | `Déplier les options` | `settings.agenda.tabAgenda.deplierLesOptions` |
| L298 | Label de formulaire (<label>) | `Activer les inscriptions (RSVP)` | `settings.agenda.tabAgenda.activerLesInscriptionsRsvp` |
| L301 | Libellé / Badge (<span>) | `Permet aux adhérents de se déclarer présents, absents ou à confirmer aux événements.` | `settings.agenda.tabAgenda.permetAuxAdherentsDeSe` |
| L319 | Label de formulaire (<label>) | `Imposer le choix de l'instrument lors de l'inscription` | `settings.agenda.tabAgenda.imposerLeChoixDeL` |
| L322 | Libellé / Badge (<span>) | `Force les adhérents à spécifier l'instrument qu'ils joueront, même s'ils n'en ont qu'un seul dans leur profil.` | `settings.agenda.tabAgenda.forceLesAdherentsASpecifier` |
| L341 | Label de formulaire (<label>) | `Activer l'option "À confirmer" pour les réponses` | `settings.agenda.tabAgenda.activerLOptionAConfirmer` |
| L344 | Libellé / Badge (<span>) | `Permet aux membres de répondre "À confirmer" aux événements plutôt que de choisir uniquement entre "Présent" o` | `settings.agenda.tabAgenda.permetAuxMembresDeRepondre` |
| L362 | Label de formulaire (<label>) | `Activer le module de Plan de Scène` | `settings.agenda.tabAgenda.activerLeModuleDePlan` |
| L365 | Libellé / Badge (<span>) | `Affiche la grille de placement scénique interactif sur la fiche détaillée des événements.` | `settings.agenda.tabAgenda.afficheLaGrilleDePlacement` |
| L382 | Label de formulaire (<label>) | `Activer le module Programme de Révision (Séquenceur JSON)` | `settings.agenda.tabAgenda.activerLeModuleProgrammeDe` |
| L385 | Libellé / Badge (<span>) | `Permet d'ajouter des morceaux de musique et des séquences rythmiques JSON à travailler sur les événements.` | `settings.agenda.tabAgenda.permetDAjouterDesMorceaux` |
| L402 | Label de formulaire (<label>) | `Activer le module Covoiturage & Convoi` | `settings.agenda.tabAgenda.activerLeModuleCovoiturageConvoi` |
| L405 | Libellé / Badge (<span>) | `Permet aux conducteurs de proposer des trajets et d'organiser les départs collectifs aux événements.` | `settings.agenda.tabAgenda.permetAuxConducteursDeProposer` |
| L422 | Label de formulaire (<label>) | `Activer le Bilan Financier des événements` | `settings.agenda.tabAgenda.activerLeBilanFinancierDes` |
| L425 | Libellé / Badge (<span>) | `Permet aux administrateurs de renseigner les recettes et dépenses générées par chaque événement.` | `settings.agenda.tabAgenda.permetAuxAdministrateursDeRenseigner` |
| L442 | Label de formulaire (<label>) | `Activer les Créneaux de Bénévolat / Logistique` | `settings.agenda.tabAgenda.activerLesCreneauxDeBenevolat` |
| L445 | Libellé / Badge (<span>) | `Permet d'ajouter des tâches et horaires (ex: montage, buvette) à réaliser par les adhérents sur les événements` | `settings.agenda.tabAgenda.permetDAjouterDesTaches` |
| L457 | Titre (<h3>) | `🔔 Notifications des Commentaires & Questions Logistiques` | `settings.agenda.tabAgenda.notificationsDesCommentairesQuestionsLogistiques` |
| L460 | Paragraphe (<p>) | `Lorsqu'un membre pose une question ou publie un commentaire sur un événement, le créateur de l'événement est n` | `settings.agenda.tabAgenda.lorsquUnMembrePoseUne` |
| L465 | Label de formulaire (<label>) | `Étiquette (Tag) destinataire des notifications de commentaires` | `settings.agenda.tabAgenda.etiquetteTagDestinataireDesNotifications` |
| L476 | Option de liste (<option>) | `-- Aucune étiquette spécifique (Créateur et Mestre uniquement) --` | `settings.agenda.tabAgenda.aucuneEtiquetteSpecifiqueCreateurEt` |

#### 📄 `src/components/association-settings/TabLieux.jsx` (35 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L56 | Message runtime (alert) | `Veuillez renseigner au minimum le nom usuel et l'adresse complète.` | `settings.agenda.tabLieux.veuillezRenseignerAuMinimumLe` |
| L96 | Message runtime (confirm) | `Êtes-vous sûr de vouloir supprimer ce lieu de la liste des lieux importants ?` | `settings.agenda.tabLieux.etesVousSurDeVouloir` |
| L110 | Titre (<h3>) | `Local Associatif & Référence Kilométrique` | `settings.agenda.tabLieux.localAssociatifReferenceKilometrique` |
| L113 | Paragraphe (<p>) | `Adresse du local de l'association servant de point de départ par défaut des convois régie et de base de calcul` | `settings.agenda.tabLieux.adresseDuLocalDeL` |
| L130 | Attribut placeholder | `Rechercher l'adresse physique du local associatif...` | `settings.agenda.tabLieux.rechercherLAdressePhysiqueDu` |
| L145 | Option de liste (<option>) | `📋 Copier depuis un lieu enregistré...` | `settings.agenda.tabLieux.copierDepuisUnLieuEnregistre` |
| L153 | Libellé / Badge (<span>) | `✅ Point de départ configuré :` | `settings.agenda.tabLieux.pointDeDepartConfigure` |
| L164 | Titre (<h3>) | `📍 Lieux Clés & Salles Clé en main` | `settings.agenda.tabLieux.lieuxClesSallesCleEn` |
| L167 | Paragraphe (<p>) | `Gérez le répertoire centralisé des lieux habituels (salles de répétitions, local, salles de réunion, scènes pr` | `settings.agenda.tabLieux.gerezLeRepertoireCentraliseDes` |
| L181 | Nœud JSX | `＋ Ajouter un lieu` | `settings.agenda.tabLieux.ajouterUnLieu` |
| L191 | Branche conditionnelle (ternaire) | `✏️ Modifier le lieu` | `settings.agenda.tabLieux.modifierLeLieu` |
| L191 | Branche conditionnelle (ternaire) | `➕ Nouveau lieu important` | `settings.agenda.tabLieux.nouveauLieuImportant` |
| L197 | Label de formulaire (<label>) | `Nom usuel du lieu *` | `settings.agenda.tabLieux.nomUsuelDuLieu` |
| L204 | Attribut placeholder | `Ex: Salle de répétition principale / Local Matériel` | `settings.agenda.tabLieux.exSalleDeRepetitionPrincipale` |
| L212 | Label de formulaire (<label>) | `Adresse physique complète *` | `settings.agenda.tabLieux.adressePhysiqueComplete` |
| L231 | Attribut placeholder | `Rechercher une adresse sur Google Maps...` | `settings.agenda.tabLieux.rechercherUneAdresseSurGoogle` |
| L240 | Bouton (<button>) | `📌 Placer ou ajuster le repère sur la carte manuellement` | `settings.agenda.tabLieux.placerOuAjusterLeRepere` |
| L244 | Libellé / Badge (<span>) | `✅ Coordonnées GPS ajustées :` | `settings.agenda.tabLieux.coordonneesGpsAjustees` |
| L253 | Label de formulaire (<label>) | `Lien Google Maps / GPS (Optionnel)` | `settings.agenda.tabLieux.lienGoogleMapsGpsOptionnel` |
| L267 | Label de formulaire (<label>) | `Instructions d'accès / Notes (Optionnel)` | `settings.agenda.tabLieux.instructionsDAccesNotesOptionnel` |
| L274 | Attribut placeholder | `Ex: Digicode 45B, 2ème étage à droite, entrée parc` | `settings.agenda.tabLieux.exDigicode45b2emeEtage` |
| L285 | Bouton (<button>) | `Annuler` | `settings.agenda.tabLieux.annuler` |
| L294 | Branche conditionnelle (ternaire) | `Enregistrer les modifications` | `settings.agenda.tabLieux.enregistrerLesModifications` |
| L294 | Branche conditionnelle (ternaire) | `Ajouter le lieu` | `settings.agenda.tabLieux.ajouterLeLieu` |
| L302 | Nœud JSX | `Aucun lieu enregistré pour le moment. Cliquez sur "Ajouter un lieu" pour créer votre répertoire.` | `settings.agenda.tabLieux.aucunLieuEnregistrePourLe` |
| L319 | Bouton (<button>) | `✏️ Édit` | `settings.agenda.tabLieux.edit` |
| L326 | Bouton (<button>) | `🗑️ Suppr` | `settings.agenda.tabLieux.suppr` |
| L338 | Nœud JSX | `Accès :` | `settings.agenda.tabLieux.acces` |
| L350 | Nœud JSX | `🗺️ Voir sur Google Maps ↗` | `settings.agenda.tabLieux.voirSurGoogleMaps` |
| L377 | Libellé / Badge (<span>) | `Lieux par défaut par type d'événement` | `settings.agenda.tabLieux.lieuxParDefautParType` |
| L380 | Libellé / Badge (<span>) | `(Pré-remplissage automatique des salles selon le format d'événement)` | `settings.agenda.tabLieux.preRemplissageAutomatiqueDesSalles` |
| L389 | Branche conditionnelle (ternaire) | `Fermer` | `settings.agenda.tabLieux.fermer` |
| L389 | Branche conditionnelle (ternaire) | `Déplier les lieux` | `settings.agenda.tabLieux.deplierLesLieux` |
| L395 | Paragraphe (<p>) | `Associez un lieu habituel par défaut à chaque type d'événement. Lors de la création d'un événement de ce forma` | `settings.agenda.tabLieux.associezUnLieuHabituelPar` |
| L434 | Option de liste (<option>) | `🚫 Aucun (Saisie manuelle)` | `settings.agenda.tabLieux.aucunSaisieManuelle` |

#### 📄 `src/components/association-settings/EventTypeConfigCard.jsx` (23 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L109 | Branche conditionnelle (ternaire) | `Fermer ▲` | `settings.agenda.eventTypeConfigCard.fermer` |
| L109 | Branche conditionnelle (ternaire) | `Configurer ▾` | `settings.agenda.eventTypeConfigCard.configurer` |
| L117 | Attribut title | `Supprimer le type "{param}"` | `settings.agenda.eventTypeConfigCard.supprimerLeTypeParam` |
| L118 | Attribut aria-label | `Supprimer {param}` | `settings.agenda.eventTypeConfigCard.supprimerParam` |
| L132 | Libellé / Badge (<span>) | `Modules & Outils activés par défaut` | `settings.agenda.eventTypeConfigCard.modulesOutilsActivesParDefaut` |
| L143 | Libellé / Badge (<span>) | `📄 Feuille de route (Roadbook)` | `settings.agenda.eventTypeConfigCard.feuilleDeRouteRoadbook` |
| L154 | Libellé / Badge (<span>) | `📸 Boîte Photos (QR Code)` | `settings.agenda.eventTypeConfigCard.boitePhotosQrCode` |
| L165 | Libellé / Badge (<span>) | `📹 Dépôt de vidéos` | `settings.agenda.eventTypeConfigCard.depotDeVideos` |
| L176 | Libellé / Badge (<span>) | `📐 Plan de scène` | `settings.agenda.eventTypeConfigCard.planDeScene` |
| L187 | Libellé / Badge (<span>) | `🎵 Programme / Séquenceur` | `settings.agenda.eventTypeConfigCard.programmeSequenceur` |
| L198 | Libellé / Badge (<span>) | `🚗 Covoiturage actif` | `settings.agenda.eventTypeConfigCard.covoiturageActif` |
| L209 | Libellé / Badge (<span>) | `🥁 Section Percussion` | `settings.agenda.eventTypeConfigCard.sectionPercussion` |
| L220 | Libellé / Badge (<span>) | `💃 Section Danse` | `settings.agenda.eventTypeConfigCard.sectionDanse` |
| L231 | Libellé / Badge (<span>) | `🎪 Activer les commissions par défaut` | `settings.agenda.eventTypeConfigCard.activerLesCommissionsParDefaut` |
| L240 | Libellé / Badge (<span>) | `Inscriptions & Délais` | `settings.agenda.eventTypeConfigCard.inscriptionsDelais` |
| L252 | Libellé / Badge (<span>) | `🔒 Validation obligatoire par un administrateur` | `settings.agenda.eventTypeConfigCard.validationObligatoireParUnAdministrateur` |
| L255 | Libellé / Badge (<span>) | `Les inscriptions des membres sont placées « En attente » tant qu'un admin ne les a pas confirmées.` | `settings.agenda.eventTypeConfigCard.lesInscriptionsDesMembresSont` |
| L265 | Libellé / Badge (<span>) | `Délai limite d'inscription (avant l'événement)` | `settings.agenda.eventTypeConfigCard.delaiLimiteDInscriptionAvant` |
| L272 | Attribut placeholder | `Ex: 48 (clôture 48h avant)` | `settings.agenda.eventTypeConfigCard.ex48Cloture48hAvant` |
| L278 | Libellé / Badge (<span>) | `heures avant` | `settings.agenda.eventTypeConfigCard.heuresAvant` |
| L281 | Libellé / Badge (<span>) | `Laissez vide ou 0 pour ne pas imposer de date limite automatique lors de la création.` | `settings.agenda.eventTypeConfigCard.laissezVideOu0Pour` |
| L292 | Libellé / Badge (<span>) | `Lien Cloud & Dépôt par défaut (Optionnel)` | `settings.agenda.eventTypeConfigCard.lienCloudDepotParDefaut` |
| L303 | Libellé / Badge (<span>) | `Pré-remplit automatiquement le lien de téléversement (photos/vidéos) lors de la création d'un événement de typ` | `settings.agenda.eventTypeConfigCard.preRemplitAutomatiquementLeLien` |

#### 📄 `src/components/association-settings/blocks/DepartureLocationAccordion.jsx` (6 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L92 | Nœud JSX | `📍 Saisissez une adresse pour afficher la carte` | `settings.agenda.departureLocationAccordion.saisissezUneAdressePourAfficher` |
| L154 | Branche conditionnelle (ternaire) | `Masquer la carte ▴` | `settings.agenda.departureLocationAccordion.masquerLaCarte` |
| L154 | Template conditionnel | `{param} ▾` | `settings.agenda.departureLocationAccordion.param` |
| L160 | Label de formulaire (<label>) | `Adresse du local / Point de rassemblement des départs en convoi` | `settings.agenda.departureLocationAccordion.adresseDuLocalPointDe` |
| L164 | Nœud JSX | `⏳ Chargement du champ adresse...` | `settings.agenda.departureLocationAccordion.chargementDuChampAdresse` |
| L173 | Attribut placeholder | `ex: 12 Rue du Maracatu, 75000 Paris` | `settings.agenda.departureLocationAccordion.ex12RueDuMaracatu` |

#### 📄 `src/components/association-settings/blocks/VehicleFleetSection.jsx` (5 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L137 | Template conditionnel | `{param} / {param}` | `settings.agenda.vehicleFleetSection.paramParam` |
| L147 | Nœud JSX | `⏳ Chargement de la flotte de véhicules...` | `settings.agenda.vehicleFleetSection.chargementDeLaFlotteDe` |
| L151 | Nœud JSX | `Aucun adhérent n'a encore déclaré de véhicule utilisable pour l'association. Les membres peuvent renseigner le` | `settings.agenda.vehicleFleetSection.aucunAdherentNAEncore` |
| L155 | Nœud JSX | `Aucun véhicule ne correspond à votre recherche "` | `settings.agenda.vehicleFleetSection.aucunVehiculeNeCorrespondA` |
| L192 | Libellé / Badge (<span>) | `📦 Galerie / Toit` | `settings.agenda.vehicleFleetSection.galerieToit` |

#### 📄 `src/components/association-settings/blocks/CarpoolBlock.jsx` (1 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L39 | Nœud JSX | `Groupe non spécifié pour afficher la flotte de véhicules.` | `settings.agenda.carpoolBlock.groupeNonSpecifiePourAfficher` |

---

### 🔹 Configuration Métier : Communication & Automatisations
**Description :** E-mails, Relances, Automatisations & Documents (TabConfigComms)  
**Namespace suggéré :** `settings.communication.*`  
**Volume :** 118 chaînes réparties sur 3 fichier(s) à traiter.

*Fichiers 100% conformes dans cette section :*
- ✅ `src/components/association-settings/TabConfigComms.jsx`
- ✅ `src/components/association-settings/email/EmailConfigSection.jsx`
- ✅ `src/components/association-settings/email/EmailDnsHelpCard.jsx`
- ✅ `src/components/association-settings/blocks/BrevoIntegrationBlock.jsx`

#### 📄 `src/components/association-settings/TabAutomations.jsx` (91 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L71 | Message runtime (alert) | `Veuillez saisir un titre pour la règle.` | `settings.communication.tabAutomations.veuillezSaisirUnTitrePour` |
| L85 | Message runtime (alert) | `Erreur lors de l'enregistrement de la règle.` | `settings.communication.tabAutomations.erreurLorsDeLEnregistrement` |
| L93 | Config statique (title) | `Supprimer la règle d'automatisation` | `settings.communication.tabAutomations.supprimerLaRegleDAutomatisation` |
| L105 | Message runtime (alert) | `Impossible de supprimer la règle.` | `settings.communication.tabAutomations.impossibleDeSupprimerLaRegle` |
| L118 | Message runtime (alert) | `Erreur lors de l'exécution du moteur de relance.` | `settings.communication.tabAutomations.erreurLorsDeLExecution` |
| L135 | Config statique (badge) | `🎭 Recommandé` | `settings.communication.tabAutomations.recommande` |
| L136 | Config statique (titre) | `🎭 Retour des costumes de scène` | `settings.communication.tabAutomations.retourDesCostumesDeScene` |
| L145 | Config statique (description) | `Relance automatique à J+1 pour le retour des tenues aux membres présents.` | `settings.communication.tabAutomations.relanceAutomatiqueAJ1` |
| L149 | Config statique (badge) | `⏳ Classique` | `settings.communication.tabAutomations.classique` |
| L150 | Config statique (titre) | `📅 Relance RSVP générale` | `settings.communication.tabAutomations.relanceRsvpGenerale` |
| L159 | Config statique (description) | `Rappel automatique 2 jours avant la date limite d'inscription.` | `settings.communication.tabAutomations.rappelAutomatique2JoursAvant` |
| L163 | Config statique (badge) | `📋 Logistique` | `settings.communication.tabAutomations.logistique` |
| L164 | Config statique (titre) | `📋 Feuille de route la veille` | `settings.communication.tabAutomations.feuilleDeRouteLaVeille` |
| L173 | Config statique (description) | `Envoi de la feuille de route la veille aux seuls participants confirmés.` | `settings.communication.tabAutomations.envoiDeLaFeuilleDe` |
| L201 | Titre (<h3>) | `🤖 Automatisations & Moteur de Relances` | `settings.communication.tabAutomations.automatisationsMoteurDeRelances` |
| L204 | Paragraphe (<p>) | `Configurez des règles automatiques pour rappeler aux membres de valider leur présence avant la date limite d'i` | `settings.communication.tabAutomations.configurezDesReglesAutomatiquesPour` |
| L216 | Branche conditionnelle (ternaire) | `⏳ Analyse...` | `settings.communication.tabAutomations.analyse` |
| L216 | Branche conditionnelle (ternaire) | `⚡ Tester les relances du jour` | `settings.communication.tabAutomations.testerLesRelancesDuJour` |
| L223 | Nœud JSX | `📊 Synthèse du Moteur (` | `settings.communication.tabAutomations.syntheseDuMoteur` |
| L224 | Nœud JSX | `règles actives,` | `settings.communication.tabAutomations.reglesActives` |
| L224 | Nœud JSX | `événements analysés) :` | `settings.communication.tabAutomations.evenementsAnalyses` |
| L239 | Libellé / Badge (<span>) | `💡 Modèle Recommandé` | `settings.communication.tabAutomations.modeleRecommande` |
| L243 | Titre (<h4>) | `Relance Retour des Costumes (J+1)` | `settings.communication.tabAutomations.relanceRetourDesCostumesJ` |
| L245 | Paragraphe (<p>) | `Relance automatiquement les participants confirmés le lendemain d'une prestation pour déclarer l'état de leur ` | `settings.communication.tabAutomations.relanceAutomatiquementLesParticipantsConfirmes` |
| L255 | Nœud JSX | `➕ Activer la règle` | `settings.communication.tabAutomations.activerLaRegle` |
| L266 | Branche conditionnelle (ternaire) | `✏️ Modifier la règle` | `settings.communication.tabAutomations.modifierLaRegle` |
| L266 | Branche conditionnelle (ternaire) | `➕ Nouvelle Règle d'Automatisation` | `settings.communication.tabAutomations.nouvelleRegleDAutomatisation` |
| L273 | Bouton (<button>) | `Annuler` | `settings.communication.tabAutomations.annuler` |
| L282 | Libellé / Badge (<span>) | `⚡ Modèles prêts à l'emploi (1 clic pour pré-remplir) :` | `settings.communication.tabAutomations.modelesPretsALEmploi` |
| L306 | Label de formulaire (<label>) | `Titre explicatif de la règle` | `settings.communication.tabAutomations.titreExplicatifDeLaRegle` |
| L313 | Attribut placeholder | `ex: Relance Urgente Concert` | `settings.communication.tabAutomations.exRelanceUrgenteConcert` |
| L322 | Label de formulaire (<label>) | `Type d'événement ciblé` | `settings.communication.tabAutomations.typeDEvenementCible` |
| L331 | Option de liste (<option>) | `🌐 Tous les événements` | `settings.communication.tabAutomations.tousLesEvenements` |
| L332 | Option de liste (<option>) | `🎭 Prestations / Sorties` | `settings.communication.tabAutomations.prestationsSorties` |
| L333 | Option de liste (<option>) | `🥁 Répétitions` | `settings.communication.tabAutomations.repetitions` |
| L334 | Option de liste (<option>) | `📋 Réunions` | `settings.communication.tabAutomations.reunions` |
| L335 | Option de liste (<option>) | `🧵 Ateliers` | `settings.communication.tabAutomations.ateliers` |
| L348 | Label de formulaire (<label>) | `Public Ciblé (Destinataires)` | `settings.communication.tabAutomations.publicCibleDestinataires` |
| L357 | Option de liste (<option>) | `🌍 Tout le monde (selon les niveaux de l'événement)` | `settings.communication.tabAutomations.toutLeMondeSelonLes` |
| L358 | Option de liste (<option>) | `✅ Uniquement les confirmés (Présents)` | `settings.communication.tabAutomations.uniquementLesConfirmesPresents` |
| L359 | Option de liste (<option>) | `📋 Tous les inscrits (Présents, En attente...)` | `settings.communication.tabAutomations.tousLesInscritsPresentsEn` |
| L360 | Option de liste (<option>) | `🎯 Le public concerné (critères exacts)` | `settings.communication.tabAutomations.lePublicConcerneCriteresExacts` |
| L361 | Option de liste (<option>) | `🥁 Section Percussion uniquement` | `settings.communication.tabAutomations.sectionPercussionUniquement` |
| L362 | Option de liste (<option>) | `💃 Section Danse uniquement` | `settings.communication.tabAutomations.sectionDanseUniquement` |
| L369 | Label de formulaire (<label>) | `Nombre de jours après l'événement (ex: 1 pour J+1)` | `settings.communication.tabAutomations.nombreDeJoursApresL` |
| L385 | Label de formulaire (<label>) | `Nombre de jours avant déclenchement` | `settings.communication.tabAutomations.nombreDeJoursAvantDeclenchement` |
| L403 | Label de formulaire (<label>) | `Point de référence (Déclenchement)` | `settings.communication.tabAutomations.pointDeReferenceDeclenchement` |
| L433 | Option de liste (<option>) | `📌 Avant la date limite d'inscription` | `settings.communication.tabAutomations.avantLaDateLimiteD` |
| L434 | Option de liste (<option>) | `📅 Avant la date de l'événement` | `settings.communication.tabAutomations.avantLaDateDeL` |
| L435 | Option de liste (<option>) | `🎭 Après la fin de l'événement (Retour des costumes)` | `settings.communication.tabAutomations.apresLaFinDeL` |
| L436 | Option de liste (<option>) | `✅ À la confirmation de l'événement` | `settings.communication.tabAutomations.aLaConfirmationDeL` |
| L437 | Option de liste (<option>) | `❌ À l'annulation de l'événement` | `settings.communication.tabAutomations.aLAnnulationDeL` |
| L438 | Option de liste (<option>) | `📝 À la soumission du compte-rendu pour validation` | `settings.communication.tabAutomations.aLaSoumissionDuCompte` |
| L446 | Label de formulaire (<label>) | `Titre de la notification Push` | `settings.communication.tabAutomations.titreDeLaNotificationPush` |
| L453 | Attribut placeholder | `ex: ⏳ Rappel : Réponse attendue` | `settings.communication.tabAutomations.exRappelReponseAttendue` |
| L463 | Label de formulaire (<label>) | `Message de la notification` | `settings.communication.tabAutomations.messageDeLaNotification` |
| L470 | Bouton (<button>) | `+ Insérer` | `settings.communication.tabAutomations.inserer` |
| L471 | Expression JSX directe | `{{nomEvenement}}` | `settings.communication.tabAutomations.nomevenement` |
| L478 | Attribut placeholder | `Bonjour ! N'oublie pas d'indiquer ta présence pour {{nomEvenement}} !` | `settings.communication.tabAutomations.bonjourNOubliePasD` |
| L489 | Libellé / Badge (<span>) | `Destination automatique au clic (Deep Link) :` | `settings.communication.tabAutomations.destinationAutomatiqueAuClicDeep` |
| L490 | Expression JSX directe | `{{eventId}}` | `settings.communication.tabAutomations.eventid` |
| L505 | Label de formulaire (<label>) | `Activer immédiatement cette règle d'automatisation` | `settings.communication.tabAutomations.activerImmediatementCetteRegleD` |
| L519 | Nœud JSX | `Annuler` | `settings.communication.tabAutomations.annuler` |
| L530 | Branche conditionnelle (ternaire) | `⏳ Enregistrement...` | `settings.communication.tabAutomations.enregistrement` |
| L530 | Branche conditionnelle (ternaire) | `💾 Enregistrer la règle` | `settings.communication.tabAutomations.enregistrerLaRegle` |
| L530 | Branche conditionnelle (ternaire) | `➕ Créer la règle` | `settings.communication.tabAutomations.creerLaRegle` |
| L540 | Titre (<h4>) | `📋 Règles d'Automatisation (` | `settings.communication.tabAutomations.reglesDAutomatisation` |
| L548 | Nœud JSX | `➕ Ajouter une règle` | `settings.communication.tabAutomations.ajouterUneRegle` |
| L555 | Nœud JSX | `⏳ Chargement des règles...` | `settings.communication.tabAutomations.chargementDesRegles` |
| L560 | Paragraphe (<p>) | `Aucune règle d'automatisation n'est configurée pour le moment.` | `settings.communication.tabAutomations.aucuneRegleDAutomatisationN` |
| L584 | Libellé / Badge (<span>) | `🎭 Post-Événement (J+` | `settings.communication.tabAutomations.postEvenementJ` |
| L588 | Libellé / Badge (<span>) | `⏳ Pré-Événement (J-` | `settings.communication.tabAutomations.preEvenementJ` |
| L594 | Branche conditionnelle (ternaire) | `Tous événements` | `settings.communication.tabAutomations.tousEvenements` |
| L597 | Branche conditionnelle (ternaire) | `Tout le monde` | `settings.communication.tabAutomations.toutLeMonde` |
| L597 | Branche conditionnelle (ternaire) | `Confirmés (Présents)` | `settings.communication.tabAutomations.confirmesPresents` |
| L597 | Branche conditionnelle (ternaire) | `Inscrits` | `settings.communication.tabAutomations.inscrits` |
| L597 | Branche conditionnelle (ternaire) | `Percussion` | `settings.communication.tabAutomations.percussion` |
| L597 | Branche conditionnelle (ternaire) | `Danse` | `settings.communication.tabAutomations.danse` |
| L597 | Branche conditionnelle (ternaire) | `Public concerné` | `settings.communication.tabAutomations.publicConcerne` |
| L601 | Paragraphe (<p>) | `⏱️ Déclenchement :` | `settings.communication.tabAutomations.declenchement` |
| L604 | Libellé / Badge (<span>) | `Immédiat à la confirmation` | `settings.communication.tabAutomations.immediatALaConfirmation` |
| L606 | Libellé / Badge (<span>) | `Immédiat à l'annulation` | `settings.communication.tabAutomations.immediatALAnnulation` |
| L608 | Libellé / Badge (<span>) | `Immédiat à la soumission du compte-rendu` | `settings.communication.tabAutomations.immediatALaSoumissionDu` |
| L611 | Libellé / Badge (<span>) | `jour(s)` | `settings.communication.tabAutomations.jourS` |
| L611 | Nœud JSX | `après la date de fin de l’événement (Costumes)` | `settings.communication.tabAutomations.apresLaDateDeFin` |
| L616 | Libellé / Badge (<span>) | `jour(s)` | `settings.communication.tabAutomations.jourS` |
| L617 | Branche conditionnelle (ternaire) | `avant la date limite d’inscription` | `settings.communication.tabAutomations.avantLaDateLimiteD` |
| L617 | Branche conditionnelle (ternaire) | `avant la date de l’événement` | `settings.communication.tabAutomations.avantLaDateDeL` |
| L649 | Libellé / Badge (<span>) | `ON` | `settings.communication.tabAutomations.on` |
| L649 | Libellé / Badge (<span>) | `OFF` | `settings.communication.tabAutomations.off` |
| L657 | Bouton (<button>) | `✏️ Éditer` | `settings.communication.tabAutomations.editer` |

#### 📄 `src/components/association-settings/TabDocuments.jsx` (24 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L57 | Config statique (title) | `Supprimer la corde` | `settings.communication.tabDocuments.supprimerLaCorde` |
| L71 | Titre (<h3>) | `📋 Documents de l'Association (RGPD & Médical)` | `settings.communication.tabDocuments.documentsDeLAssociationRgpd` |
| L86 | Libellé / Badge (<span>) | `Activer la demande de Droit à l'Image` | `settings.communication.tabDocuments.activerLaDemandeDeDroit` |
| L89 | Libellé / Badge (<span>) | `Si activé, les adhérents verront un consentement pour l'exploitation de leur image dans leur profil.` | `settings.communication.tabDocuments.siActiveLesAdherentsVerront` |
| L98 | Libellé / Badge (<span>) | `Charte de Droit à l'image (PDF)` | `settings.communication.tabDocuments.charteDeDroitAL` |
| L108 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `settings.communication.tabDocuments.selectionne` |
| L118 | Nœud JSX | `Voir le document en ligne` | `settings.communication.tabDocuments.voirLeDocumentEnLigne` |
| L136 | Libellé / Badge (<span>) | `Activer la demande d'Aptitude Médicale` | `settings.communication.tabDocuments.activerLaDemandeDAptitude` |
| L139 | Libellé / Badge (<span>) | `Si activé, les adhérents devront attester ne présenter aucune contre-indication médicale pour participer aux a` | `settings.communication.tabDocuments.siActiveLesAdherentsDevront` |
| L148 | Libellé / Badge (<span>) | `Modèle de certificat médical / Règlement santé (PDF)` | `settings.communication.tabDocuments.modeleDeCertificatMedicalReglement` |
| L158 | Libellé / Badge (<span>) | `✓ Sélectionné :` | `settings.communication.tabDocuments.selectionne` |
| L168 | Nœud JSX | `Voir le document en ligne` | `settings.communication.tabDocuments.voirLeDocumentEnLigne` |
| L178 | Repli logique (||) | `Catégories du Varal (Fils)` | `settings.communication.tabDocuments.categoriesDuVaralFils` |
| L186 | Repli logique (||) | `Nom de la catégorie (ex: Prestations, Danses)` | `settings.communication.tabDocuments.nomDeLaCategorieEx` |
| L205 | Repli logique (||) | `Activer l'upload public (Lien externe)` | `settings.communication.tabDocuments.activerLUploadPublicLien` |
| L226 | Repli logique (||) | `Archiver visuellement (opacité réduite si année antérieure)` | `settings.communication.tabDocuments.archiverVisuellementOpaciteReduiteSi` |
| L240 | Repli logique (||) | `+ Ajouter` | `settings.communication.tabDocuments.ajouter` |
| L248 | Repli logique (||) | `Cordes configurées` | `settings.communication.tabDocuments.cordesConfigurees` |
| L252 | Repli logique (||) | `Aucune catégorie configurée.` | `settings.communication.tabDocuments.aucuneCategorieConfiguree` |
| L265 | Libellé / Badge (<span>) | `📤 Public` | `settings.communication.tabDocuments.public` |
| L270 | Libellé / Badge (<span>) | `⏳ Opacité Archive` | `settings.communication.tabDocuments.opaciteArchive` |
| L286 | Branche conditionnelle (ternaire) | `Afficher cette corde` | `settings.communication.tabDocuments.afficherCetteCorde` |
| L286 | Branche conditionnelle (ternaire) | `Corde masquée` | `settings.communication.tabDocuments.cordeMasquee` |
| L293 | Attribut title | `Supprimer` | `settings.communication.tabDocuments.supprimer` |

#### 📄 `src/components/association-settings/blocks/SequenceurLinkBlock.jsx` (3 chaînes détectées)

| Ligne | Contexte | Texte brut détecté | Clé suggérée sous `settings.*` |
| :---: | :--- | :--- | :--- |
| L9 | Titre (<h3>) | `🎛️ Lien Séquenceur` | `settings.communication.sequenceurLinkBlock.lienSequenceur` |
| L14 | Label de formulaire (<label>) | `URL Racine du Séquenceur de l'association` | `settings.communication.sequenceurLinkBlock.urlRacineDuSequenceurDe` |
| L23 | Attribut placeholder | `ex: https://mon-sequenceur.app` | `settings.communication.sequenceurLinkBlock.exHttpsMonSequenceurApp` |

---

## 🏗️ Recommandations d'Architecture pour l'Injection i18n

### 1. Structure Recommandée du Namespace `settings.*`

Pour maintenir la cohérence de l'architecture bilingue FR / PT-BR de l'application, l'arborescence des clés dans `src/locales/fr.js` et `src/locales/pt.js` s'articulera autour du préfixe `settings` :

```javascript
settings: {
  // Pilier 1 : Identité Légale
  identity: {
    tabIdentity: { /* 5 clés */ },
    subscriptionInvitationHeader: { /* 12 clés */ },
    legalInfoAccordion: { /* 14 clés */ },
    officialSignaturesAccordion: { /* 18 clés */ },
    bankDetailsAccordion: { /* 11 clés */ },
    bureauAccordion: { /* 8 clés */ },
    mestriaAccordion: { /* 9 clés */ },
    bankDetailsBlock: { /* 8 clés */ }
  },

  // Pilier 2 : Inscription & Organisation
  organization: {
    registrationFieldsTable: { /* 30 clés */ },
    customFieldsAccordion: { /* 12 clés */ },
    customFieldAddForm: { /* 13 clés */ },
    annualCyclesAccordion: { /* 28 clés */ },
    pupitresNomenclatureAccordion: { /* 11 clés */ },
    defaultLocationsByEventTypeGrid: { /* 6 clés */ },
    lieuEditModal: { /* 15 clés */ },
    instrumentsCatalogBlock: { /* 34 clés */ }
  },

  // Pilier 3 : Badges, Rôles & Sécurité
  security: {
    tabSecurity: { /* 157 clés (pôles de permissions, libellés de badges, infobulles) */ },
    permissionsGuideBox: { /* 1 clé */ }
  },

  // Pilier 4 : Modules SaaS, Apparence & Médias
  modules: {
    modulesSwitchesTable: { /* 32 clés */ },
    wardrobeMemberModeCard: { /* 13 clés */ },
    tamboursNamingAccordion: { /* 6 clés */ },
    brandingLogoAccordion: { /* 16 clés */ },
    mediaStorageAccordion: { /* 15 clés */ },
    memberDashboardLayoutAccordion: { /* 20 clés */ },
    framaspaceIntegrationBlock: { /* 1 clé */ }
  },

  // Cadre Général
  general: {
    associationSettings: { /* 12 clés */ }
  },

  // Extensions Métier (Agenda & Comms)
  agenda: {
    tabAgenda: { /* 38 clés */ },
    tabLieux: { /* 35 clés */ },
    eventTypeConfigCard: { /* 23 clés */ },
    departureLocationAccordion: { /* 6 clés */ },
    vehicleFleetSection: { /* 5 clés */ },
    carpoolBlock: { /* 1 clé */ }
  },
  communication: {
    tabAutomations: { /* 91 clés */ },
    tabDocuments: { /* 24 clés */ },
    sequenceurLinkBlock: { /* 3 clés */ }
  }
}
```

### 2. Typologie & Points d'Attention Particuliers

1. **Matrice des Permissions (`TabSecurity.jsx` - 157 chaînes) :**
   - Très fort volume de métadonnées statiques (`PERMISSION_POLES` : identifiants de pôles, intitulés de sous-onglets, descriptions de périmètre).
   - Recommandation : enrichir chaque entrée avec les propriétés `labelKey` et `descKey` résolues dynamiquement via `t(tab.labelKey || tab.label)` afin de préserver l'autonomie et le typage du composant.
2. **Tableau des Champs d'Inscription (`RegistrationFieldsTable.jsx` - 30 chaînes) :**
   - Noms de champs obligatoires/facultatifs (ex: *Téléphone portable*, *Adresse postale*, *Date de naissance*, *Contact d'urgence*).
   - Les clés correspondantes doivent s'aligner avec le lexique d'inscription de l'application.
3. **Alertes & Modales Runtime :**
   - `TabAgenda.jsx` : `alert("Ce type d'événement existe déjà.")` -> à raccorder avec `t('settings.agenda.tabAgenda.ceTypeDEvenementExisteDeja')`.
   - `MediaStorageAccordion.jsx` : notifications de provisioning Framaspace.
4. **Options Sélecteurs & Radio Cards :**
   - `WardrobeMemberModeCard.jsx` : cartes de mode de vestiaire adhérent (*Garde-robe personnelle*, *Confection collective*, *Masqué*).
   - `AnnualCyclesAccordion.jsx` : choix des mois de début et fin de saison.

---

### 3. Feuille de Route pour l'Internationalisation

1. **Génération du dictionnaire bilingue :** Extraire les chaînes de `scripts/audit_config_results.json` pour rédiger les traductions françaises et brésiliennes conformes au lexique Cordel.
2. **Injection dans `src/locales/fr.js` et `src/locales/pt.js` :** Intégrer les sections sous `settings.*`.
3. **Raccordement chirurgical des composants :** Brancher `t('settings...')` sur les composants cibles en conservant l'intégrité fonctionnelle et les styles visuels Cordel.
4. **Validation automatisée :** Réexécuter `scripts/audit_config_i18n.mjs` pour certifier 100% de fichiers propres et absence de toute régression.
