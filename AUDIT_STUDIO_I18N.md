# Rapport d'Audit Statique Exhaustif i18n — Pôle Studio

> **Mode d'exécution :** Lecture Seule Stricte (Inspection AST Babel `@babel/parser` & `@babel/traverse`).  
> **Date de l'audit :** 3 octobre 2026  
> **Application cible :** `o-girador-organizador` (Front-End React / Tailwind CSS / Cordel)  
> **Données brutes générées :** [`scripts/audit_studio_results.json`](file:///E:/o-girador/o-girador-organizador/scripts/audit_studio_results.json)  
> **Script d'audit :** [`scripts/audit_studio_i18n.mjs`](file:///E:/o-girador/o-girador-organizador/scripts/audit_studio_i18n.mjs)

---

## 1. Vue d'Ensemble & Métriques Clés

L'inspection statique a scanné l'intégralité des composants, modales, modules et services gravitant autour de la communication, de la newsletter, de la médiathèque de photos, des réseaux sociaux et du lexique franco-brésilien.

| Métrique | Valeur |
| :--- | :--- |
| **Total de fichiers audités** | **47 fichiers** |
| **Fichiers 100 % propres (i18n Ready / 0 texte en dur)** | **47 fichiers** (100.0 %) |
| **Fichiers comportant des chaînes brutes à traduire** | **0 fichiers** (0.0 %) |
| **Total général des chaînes brutes détectées** | **0 chaînes** |
| **Namespace racine cible recommandé** | `studio.*` |

---

## 2. Décomposition par Sous-Périmètre

| Sous-Périmètre | Fichiers audités | Fichiers propres | Fichiers avec chaînes | Chaînes brutes |
| :--- | :---: | :---: | :---: | :---: |
| **Gazette & Newsletter** (`studio.newsletter.*`) | 11 | 11 | 0 | **0** |
| **Studio Communication & Identité** (`studio.communication.*`) | 18 | 18 | 0 | **0** |
| **Galerie Photos & Médiathèque** (`studio.photos.*`) | 13 | 13 | 0 | **0** |
| **Lexique Franco-Brésilien** (`studio.lexique.*`) | 5 | 5 | 0 | **0** |
| **TOTAL GÉNÉRAL** | **47** | **47** | **0** | **0** |

---

## 3. Détail Exhaustif par Composant & Fichier

### Gazette & Newsletter (0 chaînes)
*Namespace recommandé : `studio.newsletter.*`*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/studio/NewsletterPage.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/NewsletterPage.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/newsletter/NewsletterStepper.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/newsletter/NewsletterStepper.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/newsletter/Step1MessageAccueil.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/newsletter/Step1MessageAccueil.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/newsletter/Step2ProchainesDates.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/newsletter/Step2ProchainesDates.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/newsletter/Step3RetourImages.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/newsletter/Step3RetourImages.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/newsletter/Step4Recapitulatif.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/newsletter/Step4Recapitulatif.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/vitrine/NewsletterBrevoBlock.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/vitrine/SocialNewsletterAccordion.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/public/PublicNewsletterForm.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/public/PublicNewsletterForm.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/hooks/useNewsletterData.js`](file:///E:/o-girador/o-girador-organizador/src/hooks/useNewsletterData.js) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/services/newsletterService.js`](file:///E:/o-girador/o-girador-organizador/src/services/newsletterService.js) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |

### Studio Communication & Identité (0 chaînes)
*Namespace recommandé : `studio.communication.*`*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/studio/StudioCommunication.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioCommunication.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/StudioSocial.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/StudioSocial.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/TabCommunication.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/TabCommunication.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/TabConfigComms.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/TabConfigComms.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/email/EmailConfigSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/email/EmailConfigSection.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/email/EmailDnsHelpCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/email/EmailDnsHelpCard.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/blocks/BrevoIntegrationBlock.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/blocks/BrevoIntegrationBlock.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/blocks/FramaspaceIntegrationBlock.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/association-settings/blocks/YouTubePlaylistsBlock.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/SendContractModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/SendContractModal.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioSocialPreview.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioSocialPreview.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioTextToolbar.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioTextToolbar.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioWritingGuide.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioWritingGuide.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioEmojiPicker.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioEmojiPicker.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioQuickChips.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioQuickChips.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/preview/FacebookPreviewGrid.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/preview/FacebookPreviewGrid.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/preview/InstagramPreviewCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/preview/InstagramPreviewCard.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/config/studioSocialConfig.js`](file:///E:/o-girador/o-girador-organizador/src/config/studioSocialConfig.js) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |

### Galerie Photos & Médiathèque (0 chaînes)
*Namespace recommandé : `studio.photos.*`*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/studio/StudioPhotosView.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioPhotosView.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioPhotoQrPrintModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioPhotoQrPrintModal.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioMultiPhotoManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioMultiPhotoManager.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioVaralPickerModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioVaralPickerModal.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/FramaspaceGalleryViewer.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/FramaspaceGalleryViewer.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioEventsMediaTable.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioEventsMediaTable.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioEventMediaAccordionRow.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioEventMediaAccordionRow.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioEventsManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioEventsManager.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/EventsDataGrid.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/EventsDataGrid.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/EventsDataGridRow.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/EventsDataGridRow.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/EventToggleSwitch.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/EventToggleSwitch.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/ActivityReports.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/ActivityReports.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/StudioCloudHeader.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioCloudHeader.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |

### Lexique Franco-Brésilien (0 chaînes)
*Namespace recommandé : `studio.lexique.*`*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/studio/StudioLexiqueManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/StudioLexiqueManager.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/lexique/HashtagsSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/lexique/HashtagsSection.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/lexique/MentionsSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/lexique/MentionsSection.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/lexique/VocabForm.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/lexique/VocabForm.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |
| [`src/components/studio/lexique/VocabSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/studio/lexique/VocabSection.jsx) | ✨ Propre | **0** | *Déjà internationalisé ou 100% technique* |

---

## 4. Recommandations d'Architecture pour l'Injection i18n

1. **Sous-namespaces dédiés dans `src/locales/fr.js` et `src/locales/pt.js` :**
   - `studio.newsletter.*` : Stepper 4 étapes, sélection d'événements, téléversement de photos, export API Brevo.
   - `studio.communication.*` : Paramètres généraux, passerelles Brevo / DNS / Framaspace / YouTube, prévisualisation réseaux (Instagram, Facebook).
   - `studio.photos.*` : Albums, QR-Code d'impression pour événements, modale Varal, visionneuse plein écran.
   - `studio.lexique.*` : Éditeur de vocabulaire traditionnel, mentions officielles et hashtags associatifs.

2. **Parité linguistique stricte :** 100% des clés créées en français devront disposer de leur équivalent en portugais brésilien avec une terminologie fidèle aux traditions percussives de Pernambuco (*baques, toadas, cortejo, puxador, alfaias, batuque*).

3. **Préservation des variables d'interpolation :** Les interpolations existantes telles que `{count}`, `{name}`, `{url}` devront être scrupuleusement maintenues dans les deux locales.
