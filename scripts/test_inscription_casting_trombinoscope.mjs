import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

import {
  resolveMemberPrimaryPupitre,
  resolveMemberInstrumentSubtitle
} from '../src/components/trombinoscope/trombinoscopeUtils.js';

console.log('===============================================================');
console.log("🧪 TEST DE VALIDATION DU FLUX INSCRIPTION, CASTING & TROMBINOSCOPE");
console.log('===============================================================');

// --- Test 1 : Trombinoscope utils (Lot 2) ---
console.log("\n▶️ Module 1 : Test unitaire de resolveMemberPrimaryPupitre et resolveMemberInstrumentSubtitle");

// Cas 1 : Nouveau membre avec instrument 'En attente'
const membreEnAttente = {
  id: 'user_1',
  prenom: 'Nouveau',
  instrument: 'En attente',
  pratiquePercussion: true
};
const pupitreAttente = resolveMemberPrimaryPupitre(membreEnAttente);
assert.equal(pupitreAttente, 'en-orientation', "Le membre en attente doit être classé sous 'en-orientation'");
const subtitleAttente = resolveMemberInstrumentSubtitle(membreEnAttente);
assert.equal(subtitleAttente, "En cours d'orientation", "Le sous-titre doit être 'En cours d'orientation'");
console.log("  ✅ [PASS] Nouveau membre 'En attente' orienté vers 'en-orientation' avec sous-titre adapté.");

// Cas 2 : Membre sans instrument défini (null ou vide) et percussionniste
const membreSansInst = {
  id: 'user_2',
  prenom: 'Inconnu',
  instrument: '',
  pratiquePercussion: true
};
const pupitreSansInst = resolveMemberPrimaryPupitre(membreSansInst);
assert.equal(pupitreSansInst, 'en-orientation', "Le membre sans instrument doit être classé sous 'en-orientation' et non 'alfaias'");
console.log("  ✅ [PASS] Membre sans instrument n'est plus attribué d'office aux alfaias.");

// Cas 3 : Danseur exclusif
const membreDanseur = {
  id: 'user_3',
  prenom: 'Danseur',
  instrument: '',
  pratiqueDanse: true,
  pratiquePercussion: false
};
const pupitreDanseur = resolveMemberPrimaryPupitre(membreDanseur);
assert.equal(pupitreDanseur, 'danse', "Le membre exclusivement danseur doit être dans le pupitre 'danse'");
console.log("  ✅ [PASS] Danseur exclusif reste orienté vers 'danse'.");

// Cas 4 : Membre avec instrument officiel valide
const membreAlfaias = {
  id: 'user_4',
  prenom: 'Alfaias',
  instrument: 'Alfaia',
  pratiquePercussion: true
};
assert.equal(resolveMemberPrimaryPupitre(membreAlfaias), 'alfaias', "Le joueur d'Alfaia doit être dans 'alfaias'");
console.log("  ✅ [PASS] Membre avec instrument officiel correctement classé.");

// --- Test 2 : Contrôle Onboarding.jsx (Lot 1) ---
console.log("\n▶️ Module 2 : Contrôle du sas d'inscription dans Onboarding.jsx");
const onboardingContent = fs.readFileSync(path.resolve('src/components/Onboarding.jsx'), 'utf-8');
assert.ok(onboardingContent.includes('isNew: isAncien ? false : true'), "Onboarding doit positionner 'isNew: isAncien ? false : true'");
assert.ok(onboardingContent.includes("isAncien ? (profileData?.statutActuel || \"active\") : \"pending\""), "Onboarding doit positionner statutActuel en 'pending' pour les nouveaux");
console.log("  ✅ [PASS] Onboarding rétablit le sas d'attente (isNew: true, statut: pending pour les nouveaux).");

// --- Test 3 : Contrôle SystemAdminPanel.jsx (Lot 1) ---
console.log("\n▶️ Module 3 : Contrôle de la libération dans SystemAdminPanel.jsx");
const systemAdminContent = fs.readFileSync(path.resolve('src/components/SystemAdminPanel.jsx'), 'utf-8');
assert.ok(systemAdminContent.includes('usersList.find'), "SystemAdminPanel doit utiliser usersList.find sans planter");
assert.ok(systemAdminContent.includes("isNew: false"), "SystemAdminPanel doit passer isNew à false lors de la validation");
assert.ok(systemAdminContent.includes("statutActuel: 'active'"), "SystemAdminPanel doit passer statutActuel à active lors de la validation");
console.log("  ✅ [PASS] Validation admin libère le sas et active le compte.");

// --- Test 4 : Contrôle Trombinoscope.jsx (Lot 2) ---
console.log("\n▶️ Module 4 : Contrôle de la section 'En cours d'orientation' dans Trombinoscope.jsx");
const trombiContent = fs.readFileSync(path.resolve('src/components/Trombinoscope.jsx'), 'utf-8');
assert.ok(trombiContent.includes("'en-orientation': []"), "Trombinoscope doit déclarer le pupitre en-orientation");
assert.ok(trombiContent.includes("🌱 En cours d'orientation"), "Trombinoscope doit comporter le titre de section 'En cours d'orientation'");
console.log("  ✅ [PASS] Trombinoscope isole la section 'En cours d'orientation' tout en bas du défilé.");

// --- Test 5 : Contrôle Dashboard.jsx (Lot 3) ---
console.log("\n▶️ Module 5 : Contrôle de la bannière d'invitation aux vœux dans Dashboard.jsx");
const dashContent = fs.readFileSync(path.resolve('src/components/Dashboard.jsx'), 'utf-8');
assert.ok(dashContent.includes("profileData?.isNew === false"), "La bannière ne doit s'afficher que pour un compte validé (isNew === false)");
assert.ok(dashContent.includes("profileData.instrument === 'En attente'"), "La bannière s'affiche si l'instrument est 'En attente'");
assert.ok(dashContent.includes("InstrumentReminderBanner"), "Composant InstrumentReminderBanner présent");
console.log("  ✅ [PASS] Bannière d'invitation aux vœux conditionnée aux membres validés sans vœux.");

// --- Test 6 : Contrôle MestreOrientationCasting.jsx (Lot 3) ---
console.log("\n▶️ Module 6 : Contrôle du tableau de casting dans MestreOrientationCasting.jsx");
const castingContent = fs.readFileSync(path.resolve('src/components/mestre/MestreOrientationCasting.jsx'), 'utf-8');
assert.ok(castingContent.includes("En attente de vœux (cours d'essai)"), "Badge neutre 'En attente de vœux' présent");
assert.ok(castingContent.includes("1. "), "Hiérarchie des vœux '1. ' présente");
assert.ok(castingContent.includes("2. "), "Hiérarchie des vœux '2. ' présente");
console.log("  ✅ [PASS] Badge d'attente et hiérarchie 1/2 présents dans le tableau de casting.");

// --- Test 7 : Contrôle useUserProfile.js (Lot 4) ---
console.log("\n▶️ Module 7 : Sécurisation de l'attribution des pupitres dans useUserProfile.js");
const profileHookContent = fs.readFileSync(path.resolve('src/hooks/useUserProfile.js'), 'utf-8');
assert.ok(!profileHookContent.includes("defaultInitialInst = formData.instrumentsJoues[0]"), "defaultInitialInst doit être supprimé");
assert.ok(profileHookContent.includes("resolvedInstrument"), "resolvedInstrument calculé avec protection de profil");
assert.ok(profileHookContent.includes("instrument: resolvedInstrument"), "instrument assigné via resolvedInstrument protégé");
console.log("  ✅ [PASS] Attribution silencieuse supprimée et protection du champ instrument validée.");

console.log("\n===============================================================");
console.log("🏆 TOUS LES TESTS DES 4 LOTS SONT VALIDÉS AVEC SUCCÈS !");
console.log("===============================================================");
