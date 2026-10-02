/**
 * test_search_input_padding.mjs
 * Test de non-régression pour la correction du chevauchement de l'icône loupe dans le Trombinoscope.
 */

import fs from 'fs';
import path from 'path';

console.log("=== VÉRIFICATION DU PADDING DE RECHERCHE TROMBINOSCOPE ===\n");

const filePath = path.resolve('src/components/Trombinoscope.jsx');
const content = fs.readFileSync(filePath, 'utf8');

let errors = 0;

// 1. Vérification de la marge intérieure gauche (pl-10 ou pl-9)
if (content.includes('pl-10') && (content.includes('placeholder="Prénom, nom, surnom..."') || content.includes('placeholder={t(\'trombi.searchPlaceholder\')}'))) {
  console.log("  ✅ [PASS] Balise <input> dotée de la classe de décalage gauche 'pl-10'");
} else {
  console.error("  ❌ [FAIL] Balise <input> ne contient pas 'pl-10'");
  errors++;
}

// 2. Vérification du centrage et verrouillage de la loupe
if (
  content.includes('absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500')
) {
  console.log("  ✅ [PASS] Loupe calée avec 'absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500'");
} else {
  console.error("  ❌ [FAIL] Loupe mal positionnée");
  errors++;
}

// 3. Vérification du pointer-events-none
if (content.includes('pointer-events-none')) {
  console.log("  ✅ [PASS] 'pointer-events-none' présent pour garantir le focus direct de l'input");
} else {
  console.error("  ❌ [FAIL] 'pointer-events-none' manquant");
  errors++;
}

console.log(`\n=== BILAN : ${errors === 0 ? "TOUS LES TESTS SONT AU VERT" : "ERREURS DÉTECTÉES"} ===`);
process.exit(errors > 0 ? 1 : 0);
