/**
 * Test unitaire : Gestion des bulles d'aides (Bannières et Infobulles)
 * Vérifie :
 * 1. Que les bannières d'aide contextuelle (InfoPoleBanner, usePoleGuide, MonParcoursGuideBanner)
 *    ne s'affichent pas par défaut (masquées par défaut).
 * 2. Qu'elles s'ouvrent dès que l'utilisateur clique sur le bouton 💡 ('false' dans localStorage).
 * 3. Que les infobulles contextuelles (Tooltip.jsx) ne s'ouvrent plus au survol par défaut,
 *    mais s'ouvrent sur clic utilisateur (onClick).
 */

import fs from 'fs';
import path from 'path';
import { readHiddenState, getGuideKey } from '../src/hooks/usePoleGuide.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : BULLES D'AIDES & GUIDES CONTEXTUELS AU CLIC");
console.log("===============================================================\n");

// 1. Simulation localStorage pour usePoleGuide
global.window = {};
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

console.log("📌 Étape 1 : Vérification de usePoleGuide (masqué par défaut)");
localStorage.clear();
const isHiddenByDefault = readHiddenState('agenda', 'agenda');
if (isHiddenByDefault !== true) {
  throw new Error(`usePoleGuide devrait être masqué par défaut (attendu: true, reçu: ${isHiddenByDefault})`);
}
console.log("  ✅ [PASS] usePoleGuide retourne isHidden = true par défaut quand le localStorage est vierge.");

console.log("\n📌 Étape 2 : Vérification de usePoleGuide lors de l'ouverture explicite au clic");
localStorage.setItem('pole_guide_hidden_agenda', 'false');
const isHiddenAfterClick = readHiddenState('agenda', 'agenda');
if (isHiddenAfterClick !== false) {
  throw new Error(`usePoleGuide devrait être affiché après clic d'ouverture (attendu: false, reçu: ${isHiddenAfterClick})`);
}
console.log("  ✅ [PASS] usePoleGuide retourne isHidden = false lorsque l'utilisateur a cliqué sur 💡 ('false').");

console.log("\n📌 Étape 3 : Audit du code source de InfoPoleBanner.jsx");
const bannerPath = path.resolve('src/components/InfoPoleBanner.jsx');
const bannerCode = fs.readFileSync(bannerPath, 'utf-8');
if (!bannerCode.includes("=== 'false'") || !bannerCode.includes("isDirectlyHidden")) {
  throw new Error("InfoPoleBanner.jsx doit vérifier isDirectlyHidden avec la condition masquée par défaut.");
}
console.log("  ✅ [PASS] InfoPoleBanner.jsx est calé sur l'état masqué par défaut.");

console.log("\n📌 Étape 4 : Audit de MonParcoursGuideBanner.jsx");
const parcoursPath = path.resolve('src/components/pedagogy/MonParcoursGuideBanner.jsx');
const parcoursCode = fs.readFileSync(parcoursPath, 'utf-8');
if (!parcoursCode.includes("!== 'false'")) {
  throw new Error("MonParcoursGuideBanner.jsx doit initialiser isHidden à true par défaut.");
}
console.log("  ✅ [PASS] MonParcoursGuideBanner.jsx démarre masqué par défaut.");

console.log("\n📌 Étape 5 : Audit de Tooltip.jsx (ouverture sur clic et hover désactivé par défaut)");
const tooltipPath = path.resolve('src/components/Tooltip.jsx');
const tooltipCode = fs.readFileSync(tooltipPath, 'utf-8');

if (!tooltipCode.includes('enableHover = false')) {
  throw new Error("Tooltip.jsx doit comporter enableHover = false par défaut.");
}
if (!tooltipCode.includes('enableHover && setIsVisible(true)')) {
  throw new Error("Tooltip.jsx doit conditionner le survol à enableHover.");
}
if (!tooltipCode.includes('setIsVisible((prev) => !prev)')) {
  throw new Error("Tooltip.jsx doit permettre l'ouverture et fermeture sur clic (onClick).");
}
console.log("  ✅ [PASS] Tooltip.jsx ne s'ouvre plus automatiquement au survol et s'ouvre sur clic.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : LES BULLES D'AIDES ET GUIDES NE S'OUVRENT QU'AU CLIC !");
console.log("===============================================================\n");
process.exit(0);
