/**
 * Test de vérification du masquage responsive du libellé "PARCOURIR"
 * Composant : src/components/agenda/EventRepertoireProgramSelector.jsx
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('🧪 Démarrage du test de masquage responsive du bouton Parcourir...');

const filePath = path.resolve('src/components/agenda/EventRepertoireProgramSelector.jsx');
const content = fs.readFileSync(filePath, 'utf-8');

// 1. Vérification du conteneur parent
assert.ok(
  content.includes('flex flex-row items-center gap-2 w-full'),
  'Le conteneur doit avoir les classes "flex flex-row items-center gap-2 w-full"'
);
console.log('  ✅ [PASS] Conteneur en "flex flex-row items-center gap-2 w-full"');

// 2. Vérification du select (flex-1 min-w-0 truncate)
assert.ok(
  content.includes('flex-1 min-w-0 truncate'),
  'Le sélecteur de morceaux doit avoir les classes "flex-1 min-w-0 truncate"'
);
console.log('  ✅ [PASS] Sélecteur avec "flex-1 min-w-0 truncate"');

// 3. Vérification du bouton (shrink-0, aria-label, hidden sm:inline)
assert.ok(
  content.includes('shrink-0 flex items-center justify-center'),
  'Le bouton doit avoir shrink-0 et centrage'
);
console.log('  ✅ [PASS] Bouton avec "shrink-0 flex items-center justify-center"');

assert.ok(
  content.includes('aria-label='),
  'Le bouton doit posséder l\'attribut aria-label'
);
console.log('  ✅ [PASS] Bouton doté de l\'attribut aria-label pour l\'accessibilité');

assert.ok(
  content.includes('hidden sm:inline'),
  'Le libellé texte doit être encapsulé dans un span "hidden sm:inline"'
);
console.log('  ✅ [PASS] Libellé textuel masqué sur mobile via "hidden sm:inline"');

console.log('\n===============================================================');
console.log('🏆 TEST DU SÉLECTEUR RESPONSIVE RÉPERTOIRE 100% VALIDÉ !');
console.log('===============================================================');
