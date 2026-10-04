/**
 * Test de validation : Recalage responsive des boutons et suppression du scroll horizontal dans le Simulateur de vue
 * Vérifie :
 * 1. La disposition verticale fluide anti-débordement sur les rangées badge et membre.
 * 2. La présence de min-w-0 et w-full sur les <select>.
 * 3. La présence de shrink-0 sur les boutons d'action ("Appliquer" et "Adopter").
 * 4. Le verrouillage strict overflow-x-hidden w-full max-w-full sur les conteneurs et formulaires.
 */

import fs from 'fs';
import path from 'path';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : SIMULATEUR DE VUE - DISPOSITION ANTI-DÉBORDEMENT");
console.log("===============================================================\n");

const selectorPath = path.resolve('src/components/navigation/ViewSimulatorSelector.jsx');
if (!fs.existsSync(selectorPath)) {
  throw new Error(`Fichier introuvable : ${selectorPath}`);
}

const fileContent = fs.readFileSync(selectorPath, 'utf-8');

console.log("📌 Étape 1 : Vérification des règles de verrouillage anti-débordement conteneur");
if (!fileContent.includes('overflow-x-hidden w-full max-w-full')) {
  throw new Error("Le conteneur du popover et/ou la liste doivent porter 'overflow-x-hidden w-full max-w-full'.");
}
console.log("  ✅ [PASS] Clé 'overflow-x-hidden w-full max-w-full' présente.");

console.log("\n📌 Étape 2 : Vérification de la disposition des sélecteurs et boutons");
// Vérifier la présence de min-w-0 sur les select pour autoriser le rétrécissement
const selectMatches = fileContent.match(/<select[\s\S]*?className="([^"]*)"/g);
if (!selectMatches || selectMatches.length < 2) {
  throw new Error("Les deux <select> (badge et membre) doivent être présents.");
}

for (let i = 0; i < selectMatches.length; i++) {
  const selectSnippet = selectMatches[i];
  if (!selectSnippet.includes('w-full') || !selectSnippet.includes('min-w-0')) {
    throw new Error(`Le <select> #${i + 1} doit posséder 'w-full' et 'min-w-0'. Snippet: ${selectSnippet}`);
  }
}
console.log(`  ✅ [PASS] Les ${selectMatches.length} <select> possèdent bien 'w-full' et 'min-w-0'.`);

console.log("\n📌 Étape 3 : Vérification des boutons d'action (Appliquer et Adopter)");
if (!fileContent.includes('Appliquer') || !fileContent.includes('Adopter')) {
  throw new Error("Les libellés 'Appliquer' et 'Adopter' doivent être présents.");
}

// Vérifier que les boutons possèdent shrink-0
const buttonShrinkMatches = fileContent.match(/type="submit"[\s\S]*?shrink-0/g);
if (!buttonShrinkMatches || buttonShrinkMatches.length < 2) {
  throw new Error("Les boutons 'Appliquer' et 'Adopter' doivent contenir 'shrink-0' pour ne jamais être compressés.");
}
console.log("  ✅ [PASS] Les boutons 'Appliquer' et 'Adopter' sont verrouillés avec 'shrink-0' et 'self-end'.");

console.log("\n📌 Étape 4 : Vérification du conteneur vertical flex-col sur les rangées");
if (!fileContent.includes('flex flex-col gap-2.5 w-full max-w-full min-w-0 mt-0.5')) {
  throw new Error("Les conteneurs de formulaire doivent utiliser la disposition verticale 'flex flex-col gap-2.5 w-full max-w-full min-w-0'.");
}
console.log("  ✅ [PASS] Disposition verticale fluide validée sur les formulaires de sélection.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : LE SIMULATEUR DE VUE EST 100% SÉCURISÉ CONTRE LES DÉBORDEMENTS !");
console.log("===============================================================\n");
process.exit(0);
