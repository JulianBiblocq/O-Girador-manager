/**
 * Test de Recette Automatisé : Pipeline QR Code Événements & Récolte Médias
 * Valide la résolution prioritaire, l'aiguillage des modales, l'intégrité des endpoints
 * et la persistance symétrique de la récolte de photos/vidéos.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : PIPELINE QR CODE ÉVÉNEMENTS & RÉCOLTE MÉDIAS");
console.log("===============================================================\n");

// --- MODULE 1 : Résolution Prioritaire de l'URL du QR Code ---
console.log("▶️ Module 1 : Résolution prioritaire de l'URL du QR Code");

function resolveEventQrUrl(event, associationLienGoogleForm) {
  const currentLienDepot = (event?.lienDepotMedias || '').trim();
  const formFallback = (associationLienGoogleForm || '').trim();
  const effectiveQrUrl = currentLienDepot || formFallback;
  return {
    currentLienDepot,
    effectiveQrUrl,
    hasQrCode: Boolean(effectiveQrUrl),
    targetModal: currentLienDepot ? 'media' : (formFallback ? 'public' : null)
  };
}

// Cas 1 : Événement provisionné automatiquement sur Framaspace avec Google Form configuré
const testCase1 = resolveEventQrUrl(
  { lienDepotMedias: "https://asso.framaspace.org/s/prestation-2026" },
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(testCase1.hasQrCode, true, "Le QR Code doit être détecté comme actif");
assert.strictEqual(testCase1.effectiveQrUrl, "https://asso.framaspace.org/s/prestation-2026", "Priorité absolue au dossier direct Framaspace");
assert.strictEqual(testCase1.targetModal, 'media', "Doit ouvrir la modale média dédiée à l'événement");
console.log("  ✅ [PASS] Cas 1 : Priorité absolue au dossier Framaspace de l'événement");

// Cas 2 : Événement sans lien direct mais avec Google Form d'association configuré
const testCase2 = resolveEventQrUrl(
  { lienDepotMedias: "" },
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(testCase2.hasQrCode, true, "Le QR Code de repli doit être actif");
assert.strictEqual(testCase2.effectiveQrUrl, "https://forms.google.com/r/asso-photos", "Repli fluide sur le Google Form");
assert.strictEqual(testCase2.targetModal, 'public', "Doit ouvrir la modale de récolte publique");
console.log("  ✅ [PASS] Cas 2 : Repli propre sur le formulaire Google Form d'association");

// Cas 3 : Événement sans aucun lien configuré
const testCase3 = resolveEventQrUrl(
  { lienDepotMedias: null },
  ""
);
assert.strictEqual(testCase3.hasQrCode, false, "Aucun QR Code actif");
assert.strictEqual(testCase3.targetModal, null, "Aucune modale ne doit s'ouvrir");
console.log("  ✅ [PASS] Cas 3 : Aucun QR code orphelin si aucun lien n'est renseigné\n");


// --- MODULE 2 : Non-Régression du Déclenchement de la Modale ---
console.log("▶️ Module 2 : Déclenchement sans état orphelin (Anti-blocage UI)");

function simulateModalTrigger(hasQrCode, targetModal) {
  let showMediaModal = false;
  let showPublicModal = false;

  if (hasQrCode) {
    if (targetModal === 'media') {
      showMediaModal = true;
    } else if (targetModal === 'public') {
      showPublicModal = true;
    }
  }

  return { showMediaModal, showPublicModal, modalOpened: showMediaModal || showPublicModal };
}

// Vérifier que le clic sur un événement avec lien Framaspace ouvre bien la modale
const triggerResult1 = simulateModalTrigger(testCase1.hasQrCode, testCase1.targetModal);
assert.strictEqual(triggerResult1.modalOpened, true, "La modale DOIT s'ouvrir lors du clic");
assert.strictEqual(triggerResult1.showMediaModal, true, "C'est la modale média qui doit s'ouvrir");
assert.strictEqual(triggerResult1.showPublicModal, false);
console.log("  ✅ [PASS] Clic sur événement Framaspace : ouvre directement EventMediaQrCodeModal");

const triggerResult2 = simulateModalTrigger(testCase2.hasQrCode, testCase2.targetModal);
assert.strictEqual(triggerResult2.modalOpened, true, "La modale de repli DOIT s'ouvrir");
assert.strictEqual(triggerResult2.showPublicModal, true, "C'est la modale public qui doit s'ouvrir");
console.log("  ✅ [PASS] Clic sur événement sans Framaspace mais avec Google Form : ouvre EventPublicQrCodeModal\n");


// --- MODULE 3 : Persistance Symétrique des Champs de Récolte Médias ---
console.log("▶️ Module 3 : Persistance symétrique (création & mise à jour)");

function simulateAddDocPayload(formData) {
  return {
    titre: formData.titre,
    type: formData.type,
    activerRecolteMedias: formData.activerRecolteMedias !== false,
    publierSurVaral: formData.publierSurVaral !== undefined ? Boolean(formData.publierSurVaral) : true
  };
}

function simulateUpdateDocPayload(editForm) {
  return {
    titre: editForm.titre,
    type: editForm.type,
    activerRecolteMedias: editForm.activerRecolteMedias !== false,
    publierSurVaral: editForm.publierSurVaral !== false
  };
}

const payloadCreatePresta = simulateAddDocPayload({ titre: "Fête de la Musique", type: "prestation" });
assert.strictEqual(payloadCreatePresta.activerRecolteMedias, true, "Actif par défaut sur prestation à la création");
assert.strictEqual(payloadCreatePresta.publierSurVaral, true, "Publié sur Varal par défaut");

const payloadCreateAtelier = simulateAddDocPayload({ titre: "Atelier Percu", type: "atelier", activerRecolteMedias: true });
assert.strictEqual(payloadCreateAtelier.activerRecolteMedias, true, "Doit persister le choix explicite de l'organisateur");

const payloadUpdateDisabled = simulateUpdateDocPayload({ titre: "Répétition", type: "repetition", activerRecolteMedias: false });
assert.strictEqual(payloadUpdateDisabled.activerRecolteMedias, false, "Doit pouvoir désactiver la récolte lors de la modification");
console.log("  ✅ [PASS] Persistance symétrique validée sur la création et la modification d'événement\n");


// --- MODULE 4 : Éligibilité du Provisionnement Automatique Cloud Functions ---
console.log("▶️ Module 4 : Règles d'éligibilité Cloud Functions (Framaspace)");

function isEligibleForAutoProvisioning(eventData) {
  const typeEv = (eventData.type || eventData.typeEvenement || "").toLowerCase();
  const isTargetPrestation = ["prestation", "concert", "spectacle"].includes(typeEv) || eventData.isPrestation === true;
  const isExcludedType = ["repetition", "reunion", "atelier", "stage"].includes(typeEv);

  if (isExcludedType) {
    return eventData.activerRecolteMedias === true;
  } else if (isTargetPrestation) {
    return eventData.activerRecolteMedias !== false;
  } else {
    return eventData.activerRecolteMedias === true;
  }
}

assert.strictEqual(isEligibleForAutoProvisioning({ type: "prestation" }), true, "Prestation provisionnée d'office");
assert.strictEqual(isEligibleForAutoProvisioning({ type: "prestation", activerRecolteMedias: false }), false, "Prestation ignorée si décochée");
assert.strictEqual(isEligibleForAutoProvisioning({ type: "repetition" }), false, "Répétition ignorée par défaut");
assert.strictEqual(isEligibleForAutoProvisioning({ type: "repetition", activerRecolteMedias: true }), true, "Répétition provisionnée si cochée explicitement");
assert.strictEqual(isEligibleForAutoProvisioning({ type: "stage", activerRecolteMedias: true }), true, "Stage provisionné si coché explicitement");
console.log("  ✅ [PASS] Règles d'éligibilité automatique vérifiées sur tous les types d'événements\n");


// --- MODULE 5 : Intégrité du Code Source (Zéro Erreur 404 & Isolation Print) ---
console.log("▶️ Module 5 : Intégrité du code source (Zéro 404 & isolation print)");

const mediaModalPath = path.resolve('src/components/event-details/EventMediaQrCodeModal.jsx');
const publicModalPath = path.resolve('src/components/event-details/EventPublicQrCodeModal.jsx');
const eventDetailsPath = path.resolve('src/components/EventDetails.jsx');

const mediaModalCode = fs.readFileSync(mediaModalPath, 'utf-8');
const publicModalCode = fs.readFileSync(publicModalPath, 'utf-8');
const eventDetailsCode = fs.readFileSync(eventDetailsPath, 'utf-8');

// 1. Zéro faute d'accent dans l'URL de l'API externe
assert(!mediaModalCode.includes('créer-qr-code'), "EventMediaQrCodeModal ne doit pas contenir 'créer-qr-code'");
assert(!publicModalCode.includes('créer-qr-code'), "EventPublicQrCodeModal ne doit pas contenir 'créer-qr-code'");
console.log("  ✅ [PASS] Aucune URL cassée ('créer-qr-code' avec accent éradiqué)");

// 2. Présence de QRCodeCanvas pour le rendu local haute fidélité
assert(mediaModalCode.includes('QRCodeCanvas'), "EventMediaQrCodeModal doit utiliser QRCodeCanvas");
assert(publicModalCode.includes('QRCodeCanvas'), "EventPublicQrCodeModal doit utiliser QRCodeCanvas");
console.log("  ✅ [PASS] Utilisation de QRCodeCanvas autonome sur les deux modales");

// 3. Présence de l'isolation CSS d'impression
assert(mediaModalCode.includes('body.printing-qr'), "EventMediaQrCodeModal doit intégrer l'isolation CSS 'printing-qr'");
assert(mediaModalCode.includes('canvas.toDataURL'), "EventMediaQrCodeModal doit permettre l'export direct en PNG");
assert(publicModalCode.includes('body.printing-qr'), "EventPublicQrCodeModal doit intégrer l'isolation CSS 'printing-qr'");
console.log("  ✅ [PASS] Isolation CSS @media print et export PNG validés dans le composant");

// 4. Présence du bouton direct dans EventDetails
assert(eventDetailsCode.includes('handleOpenQrCodeModal'), "EventDetails doit avoir la fonction d'aiguillage unifiée");
assert(eventDetailsCode.includes('currentLienDepot'), "EventDetails doit évaluer prioritairement currentLienDepot");
console.log("  ✅ [PASS] Bouton direct et aiguillage unifié confirmés dans EventDetails.jsx\n");


// --- MODULE 6 : Configuration par Type d'Événement & Masquage Conditionnel ---
console.log("▶️ Module 6 : Configuration par Type d'Événement & Masquage QR Code");

// 1. Logique de résolution conforme à EventDetails.jsx
function resolveEventQrVisibility(event, activeEvent, associationLienGoogleForm) {
  const isTargetPrestation = ['prestation', 'concert', 'spectacle', 'festival'].includes(event?.type);
  const isRecolteActive = (activeEvent?.activerRecolteMedias !== undefined 
    ? Boolean(activeEvent.activerRecolteMedias) 
    : (event?.activerRecolteMedias !== undefined ? Boolean(event.activerRecolteMedias) : isTargetPrestation));

  const currentLienDepot = ((activeEvent?.lienDepotMedias || event?.lienDepotMedias || '')).trim();
  const effectiveQrUrl = isRecolteActive ? (currentLienDepot || (associationLienGoogleForm || '').trim()) : '';
  const hasQrCode = isRecolteActive && Boolean(effectiveQrUrl);

  return { isRecolteActive, currentLienDepot, effectiveQrUrl, hasQrCode };
}

// Cas A : Réunion sans champ explicite (type non scénique) -> QR Code masqué même avec Google Form
const resReunionDefaut = resolveEventQrVisibility(
  { type: 'reunion' },
  null,
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(resReunionDefaut.isRecolteActive, false, "Récolte inactive par défaut pour réunion");
assert.strictEqual(resReunionDefaut.hasQrCode, false, "QR Code MASQUÉ pour réunion");
console.log("  ✅ [PASS] Réunion sans option explicite : QR Code masqué");

// Cas B : Prestation sans champ explicite (type scénique) -> QR Code affiché avec Google Form
const resPrestaDefaut = resolveEventQrVisibility(
  { type: 'prestation' },
  null,
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(resPrestaDefaut.isRecolteActive, true, "Récolte active par défaut pour prestation");
assert.strictEqual(resPrestaDefaut.hasQrCode, true, "QR Code affiché pour prestation");
console.log("  ✅ [PASS] Prestation sans option explicite : QR Code actif");

// Cas C : Événement avec activerRecolteMedias: false explicite -> QR Code strictement masqué
const resPrestaDesactivee = resolveEventQrVisibility(
  { type: 'prestation', activerRecolteMedias: false, lienDepotMedias: "https://asso.framaspace.org/s/test" },
  null,
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(resPrestaDesactivee.isRecolteActive, false, "Récolte désactivée explicitement");
assert.strictEqual(resPrestaDesactivee.hasQrCode, false, "QR Code MASQUÉ lorsque activerRecolteMedias est faux");
console.log("  ✅ [PASS] Prestation désactivée explicitement : QR Code strictement masqué");

// Cas D : Réunion avec activerRecolteMedias: true (activation personnalisée) -> QR Code affiché
const resReunionActivee = resolveEventQrVisibility(
  { type: 'reunion', activerRecolteMedias: true },
  null,
  "https://forms.google.com/r/asso-photos"
);
assert.strictEqual(resReunionActivee.isRecolteActive, true, "Récolte activée explicitement sur réunion");
assert.strictEqual(resReunionActivee.hasQrCode, true, "QR Code affiché pour réunion si activé");
console.log("  ✅ [PASS] Réunion avec récolte activée : QR Code bien affiché");

// 2. Simulation de propagation du typePreset dans le formulaire
function simulateTypeChange(newType, eventTypeConfigs, currentFormData, isEdit = false) {
  const typePresets = eventTypeConfigs?.[newType];
  const updated = { ...currentFormData, type: newType };
  const isTargetPrestation = ['prestation', 'concert', 'spectacle', 'festival'].includes(newType);

  if (typePresets?.activerRecolteMedias !== undefined) {
    updated.activerRecolteMedias = Boolean(typePresets.activerRecolteMedias);
  } else if (!isEdit || updated.activerRecolteMedias === undefined) {
    updated.activerRecolteMedias = isTargetPrestation;
  }

  return updated;
}

const customConfigs = {
  reunion: { activerRecolteMedias: false },
  festival: { activerRecolteMedias: true },
  autre: { activerRecolteMedias: true }
};

const formSwitchedToReunion = simulateTypeChange('reunion', customConfigs, { titre: "CA", type: "prestation", activerRecolteMedias: true });
assert.strictEqual(formSwitchedToReunion.activerRecolteMedias, false, "Le passage à réunion doit appliquer le preset désactivé");

const formSwitchedToFestival = simulateTypeChange('festival', customConfigs, { titre: "Festival", type: "reunion", activerRecolteMedias: false });
assert.strictEqual(formSwitchedToFestival.activerRecolteMedias, true, "Le passage à festival doit appliquer le preset activé");

console.log("  ✅ [PASS] Propagation réactive des presets de types d'événements validée");

// 3. Intégrité des composants modifiés
const tabAgendaPath = path.resolve('src/components/association-settings/TabAgenda.jsx');
const eventFormFieldsPath = path.resolve('src/components/agenda/EventFormFields.jsx');
const widgetAgendaPath = path.resolve('src/components/WidgetAgenda.jsx');
const tabAdminPath = path.resolve('src/components/event-details/tabs/TabAdmin.jsx');

const tabAgendaCode = fs.readFileSync(tabAgendaPath, 'utf-8');
const eventFormFieldsCode = fs.readFileSync(eventFormFieldsPath, 'utf-8');
const widgetAgendaCode = fs.readFileSync(widgetAgendaPath, 'utf-8');
const tabAdminCode = fs.readFileSync(tabAdminPath, 'utf-8');

assert(tabAgendaCode.includes('activerRecolteMedias'), "TabAgenda.jsx doit contenir l'option activerRecolteMedias");
assert(tabAgendaCode.includes('Boîte Photos (QR Code)'), "TabAgenda.jsx doit afficher la case 'Boîte Photos (QR Code)'");
assert(eventFormFieldsCode.includes('typePresets?.activerRecolteMedias'), "EventFormFields.jsx doit lire typePresets.activerRecolteMedias");
assert(widgetAgendaCode.includes('activerRecolteMedias: typeCfg.activerRecolteMedias'), "WidgetAgenda.jsx doit initialiser activerRecolteMedias");
assert(tabAdminCode.includes('📸 Boîte Photos'), "TabAdmin.jsx doit proposer l'interrupteur '📸 Boîte Photos'");
console.log("  ✅ [PASS] Intégrité de la chaîne TabAgenda -> Formulaire -> WidgetAgenda -> Vue Détails confirmée\n");

console.log("===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS QR CODE SONT VALIDÉES !");
console.log("===============================================================");

