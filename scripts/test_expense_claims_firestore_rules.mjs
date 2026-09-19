/**
 * Test unitaire automatisé pour vérifier la présence des règles de sécurité Firestore
 * relatives aux notes de frais (expense_claims).
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("=== Lancement des tests de sécurité Firestore : Notes de Frais ===");

const firestoreRulesCandidates = [
  path.join(rootDir, 'ogirador-backend', 'firestore.rules.DEPRECATED'),
  path.join(rootDir, 'ogirador-backend', 'firestore.rules'),
  path.join(rootDir, '..', 'o-girador-orquestrador', 'firestore.rules')
];
const firestoreRulesPath = firestoreRulesCandidates.find(p => fs.existsSync(p)) || firestoreRulesCandidates[0];
assert(fs.existsSync(firestoreRulesPath), "Le fichier ogirador-backend/firestore.rules doit exister");
const rulesContent = fs.readFileSync(firestoreRulesPath, 'utf8');

// 1. Vérification de la collection expense_claims
assert(
  rulesContent.includes('match /expense_claims/{claimId}'),
  "firestore.rules doit comporter un bloc match pour /expense_claims/{claimId}"
);
console.log("✓ Règle match /expense_claims/{claimId} détectée.");

// 2. Vérification de la création par le membre
assert(
  rulesContent.includes("request.resource.data.get('userId', '') == request.auth.uid"),
  "La création doit autoriser le créateur correspondant à son propre UID"
);
console.log("✓ Règle de création pour le membre propriétaire validée.");

// 3. Vérification de la lecture de groupe et trésorerie
assert(
  rulesContent.includes("canReadGroupData()") && rulesContent.includes("canManageTreasury()"),
  "La lecture doit couvrir le groupe et les rôles de trésorerie"
);
console.log("✓ Règle de lecture et gestion de trésorerie validée.");

console.log("🎉 TOUS LES TESTS DE SÉCURITÉ EXPENSE_CLAIMS SONT VALIDÉS AVEC SUCCÈS ! 🎉\n");
