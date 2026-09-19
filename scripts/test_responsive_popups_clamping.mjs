/**
 * Test de validation : Clamping et comportement responsive des popups
 * Vérifie l'absence de débordement sur petit smartphone (320px - 390px),
 * l'usage des portails React et les règles CSS globales de sécurité.
 */

import fs from 'fs';
import path from 'path';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : CLAMPING & RESPONSIVE DES POPUPS (PETITS ÉCRANS)");
console.log("===============================================================\n");

// 1. Audit de EcosystemAppLauncher.jsx
const launcherPath = path.resolve('src/components/navigation/EcosystemAppLauncher.jsx');
const launcherCode = fs.readFileSync(launcherPath, 'utf-8');

console.log("📌 Module 1 : Intégrité d'EcosystemAppLauncher");
if (!launcherCode.includes("createPortal")) {
  throw new Error("EcosystemAppLauncher doit utiliser createPortal pour s'affranchir de tout rognage parent.");
}
if (!launcherCode.includes("minLeft = 8") || !launcherCode.includes("screenWidth - targetWidth - 8")) {
  throw new Error("EcosystemAppLauncher doit comporter le clamping strict [8px, screenWidth - targetWidth - 8px].");
}
if (!launcherCode.includes("window.addEventListener('resize'") || !launcherCode.includes("window.addEventListener('scroll'")) {
  throw new Error("EcosystemAppLauncher doit écouter le redimensionnement et le défilement.");
}
console.log("  ✅ [PASS] EcosystemAppLauncher utilise createPortal, clamping strict et écouteurs d'écran.");

// 2. Audit de ViewSimulatorSelector.jsx
const simulatorPath = path.resolve('src/components/navigation/ViewSimulatorSelector.jsx');
const simulatorCode = fs.readFileSync(simulatorPath, 'utf-8');

console.log("\n📌 Module 2 : Intégrité de ViewSimulatorSelector");
if (!simulatorCode.includes("createPortal")) {
  throw new Error("ViewSimulatorSelector doit utiliser createPortal.");
}
if (!simulatorCode.includes("minLeft = 8") || !simulatorCode.includes("screenWidth - targetWidth - 8")) {
  throw new Error("ViewSimulatorSelector doit comporter le clamping strict.");
}
console.log("  ✅ [PASS] ViewSimulatorSelector utilise createPortal et clamping strict.");

// 3. Audit de src/index.css
const cssPath = path.resolve('src/index.css');
const cssCode = fs.readFileSync(cssPath, 'utf-8');

console.log("\n📌 Module 3 : Règle CSS globale de sécurité pour les dialogues et modales");
if (!cssCode.includes("max-width: calc(100vw - 16px) !important")) {
  throw new Error("index.css doit garantir max-width: calc(100vw - 16px) sur [role=\"dialog\"].");
}
console.log("  ✅ [PASS] Règle globale CSS anti-débordement validée.");

// 4. Simulation mathématique multi-résolutions
console.log("\n📌 Module 4 : Simulation mathématique sur différentes résolutions mobiles");

function simulateLauncherPlacement(screenWidth, rectRight) {
  const targetWidth = Math.min(300, Math.max(260, screenWidth - 16));
  let left = rectRight - targetWidth;
  const minLeft = 8;
  const maxLeft = Math.max(8, screenWidth - targetWidth - 8);
  left = Math.max(minLeft, Math.min(left, maxLeft));

  return {
    left,
    right: left + targetWidth,
    width: targetWidth,
    overflowsLeft: left < 0,
    overflowsRight: (left + targetWidth) > screenWidth
  };
}

const testCases = [
  { name: "iPhone 5 / SE 1re génération (320px)", screenWidth: 320, rectRight: 180 },
  { name: "Android Compact Galaxy A (360px)", screenWidth: 360, rectRight: 216 },
  { name: "iPhone 8 / SE 2e gén (375px)", screenWidth: 375, rectRight: 230 },
  { name: "iPhone 13 / 14 / 15 (390px)", screenWidth: 390, rectRight: 245 },
  { name: "Mode Paysage Smartphone (640px)", screenWidth: 640, rectRight: 450 },
  { name: "iPad Portrait (768px)", screenWidth: 768, rectRight: 580 },
  { name: "Desktop Standard (1280px)", screenWidth: 1280, rectRight: 1050 },
];

for (const tc of testCases) {
  const res = simulateLauncherPlacement(tc.screenWidth, tc.rectRight);
  if (res.overflowsLeft) {
    throw new Error(`DÉBORDEMENT GAUCHE DÉTECTÉ sur ${tc.name} : left=${res.left}px`);
  }
  if (res.overflowsRight) {
    throw new Error(`DÉBORDEMENT DROIT DÉTECTÉ sur ${tc.name} : right=${res.right}px > ${tc.screenWidth}px`);
  }
  console.log(`  ✅ [PASS] ${tc.name} -> Left: ${res.left}px, Right: ${res.right}px, Width: ${res.width}px (Marge G: ${res.left}px, Marge D: ${tc.screenWidth - res.right}px)`);
}

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DE RESPONSIVE POPUPS SONT VALIDÉES !");
console.log("===============================================================\n");
process.exit(0);
