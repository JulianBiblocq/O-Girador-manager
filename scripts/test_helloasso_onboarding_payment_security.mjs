/**
 * Test de validation de la sécurité de l'onboarding pour les paiements HelloAsso.
 * 
 * Vérifie :
 * 1. Absence totale de toute écriture cliente de 'paymentStatus' ou 'isSystemAdmin' dans Onboarding.jsx.
 * 2. Éradication des tentatives d'écriture / suppression directe sur 'pending_payments' et 'transactions'.
 * 3. Présence d'un affichage visuel informatif sécurisé (pendingPaymentInfo) sans réécriture dans users/{uid}.
 * 4. Validation de la résolution canonique générique avec le paramètre '?groupe=baque_sol'.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { canonicalizeGroupId, registerCanonicalGroupId } from '../src/utils/tenantUtils.js';

console.log('===============================================================');
console.log('🧪 TEST DE SÉCURITÉ : ONBOARDING & PAIEMENTS HELLOASSO');
console.log('===============================================================\n');

// 1. Audit statique de Onboarding.jsx
console.log('▶️ Module 1 : Audit de sécurité des écritures Firestore dans Onboarding.jsx');
const onboardingPath = path.resolve('src/components/Onboarding.jsx');
const onboardingSrc = fs.readFileSync(onboardingPath, 'utf-8');

// Vérification de l'absence d'injection de paymentStatus = 'paid' côté client
assert.ok(
  !onboardingSrc.includes('sanitizedUserDoc.paymentStatus ='),
  "❌ ÉCHEC : Onboarding.jsx ne doit jamais assigner 'sanitizedUserDoc.paymentStatus' côté client."
);
console.log("  ✅ [PASS] Aucune assignation cliente de 'paymentStatus' dans Onboarding.jsx.");

// Vérification de l'assainissement systématique (delete sanitizedUserDoc.paymentStatus)
assert.ok(
  onboardingSrc.includes('delete sanitizedUserDoc.paymentStatus;'),
  "❌ ÉCHEC : Onboarding.jsx doit supprimer explicitement 'paymentStatus' de sanitizedUserDoc avant setDoc."
);
console.log("  ✅ [PASS] Suppression systématique garantie de 'paymentStatus' avant toute écriture Firestore.");

// Vérification de l'assainissement de isSystemAdmin
assert.ok(
  onboardingSrc.includes('delete sanitizedUserDoc.isSystemAdmin;'),
  "❌ ÉCHEC : Onboarding.jsx doit supprimer explicitement 'isSystemAdmin' de sanitizedUserDoc."
);
console.log("  ✅ [PASS] Suppression systématique garantie de 'isSystemAdmin' avant toute écriture Firestore.");

// Vérification de l'absence de deleteDoc sur pending_payments
assert.ok(
  !onboardingSrc.includes('deleteDoc('),
  "❌ ÉCHEC : Le client ne doit pas tenter de supprimer le sas pending_payments (réservé à onUserCreate)."
);
console.log("  ✅ [PASS] Aucune tentative de suppression cliente du sas pending_payments.");

// Vérification de l'absence d'updateDoc sur transactions
assert.ok(
  !onboardingSrc.includes('updateDoc('),
  "❌ ÉCHEC : Le client ne doit pas tenter d'écrire dans la collection transactions (réservé à la comptabilité admin)."
);
console.log("  ✅ [PASS] Aucune tentative d'écriture cliente dans la collection transactions.");

// 2. Détection visuelle et affichage informatif sécurisé
console.log('\n▶️ Module 2 : Contrôle de l\'affichage visuel informatif pendingPaymentInfo');
assert.ok(
  onboardingSrc.includes('pendingPaymentInfo'),
  "❌ ÉCHEC : Onboarding.jsx doit gérer un état pendingPaymentInfo pour l'affichage visuel."
);
assert.ok(
  onboardingSrc.includes("t('onboarding.paymentDetectedTitle')"),
  "❌ ÉCHEC : Onboarding.jsx doit comporter l'encart d'alerte visuelle Cordel pour le paiement détecté."
);
console.log("  ✅ [PASS] Affichage visuel informatif et bienveillant Cordel présent pour les membres ayant déjà payé.");

// 3. Validation de l'URL HelloAsso et du garde-fou anti-compte orphelin
console.log('\n▶️ Module 3 : Validation de la résolution canonique dynamique (?groupe=baquesol -> BaqueSol)');
registerCanonicalGroupId('BaqueSol');
const testUrl = 'https://organizador.o-girador.com/?groupe=baquesol';
const parsedUrl = new URL(testUrl);
const groupeParam = parsedUrl.searchParams.get('groupe');

assert.equal(groupeParam, 'baquesol', "Le paramètre groupe brut doit être 'baquesol'");
const canonicalGroup = canonicalizeGroupId(groupeParam);
assert.equal(canonicalGroup, 'BaqueSol', "canonicalizeGroupId doit restituer la casse canonique 'BaqueSol'");
assert.ok(onboardingSrc.includes('if (!verifiedGroupId)'), "Onboarding.jsx doit bloquer toute écriture sans verifiedGroupId");
assert.ok(onboardingSrc.includes('<GroupSelectorStep'), "Onboarding.jsx doit forcer GroupSelectorStep si aucun groupe valide n'est résolu");
console.log(`  ✅ [PASS] L'URL ${testUrl} normalise le groupe en '${canonicalGroup}' et bloque les profils orphelins.`);

console.log('\n===============================================================');
console.log('🏆 TOUS LES CONTRÔLES DE SÉCURITÉ ONBOARDING SONT VALIDÉS !');
console.log('===============================================================\n');
