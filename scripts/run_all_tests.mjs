/**
 * Exécuteur Global de la Batterie Complète de Recette (Modules 1 à 8)
 * Valide l'ensemble des 250 assertions automatisées sur les profils Membre & Admin.
 */

import { execSync } from 'child_process';

const testScripts = [
  'scripts/test_module_1.mjs',
  'scripts/test_module_2.mjs',
  'scripts/test_module_3.mjs',
  'scripts/test_module_4.mjs',
  'scripts/test_module_5.mjs',
  'scripts/test_module_6.mjs',
  'scripts/test_module_7.mjs',
  'scripts/test_module_8.mjs'
];

console.log("===============================================================");
console.log("🚀 LANCEMENT DE LA BATTERIE DE RECETTE COMPLÈTE (MODULES 1 À 8)");
console.log("===============================================================\n");

let allPassed = true;

for (const script of testScripts) {
  try {
    console.log(`▶️ Exécution de ${script}...`);
    const output = execSync(`node ${script}`, { encoding: 'utf-8' });
    console.log(output);
  } catch (error) {
    allPassed = false;
    console.error(`❌ Échec sur ${script} :`);
    console.error(error.stdout || error.message);
    break;
  }
}

if (allPassed) {
  console.log("===============================================================");
  console.log("🏆 FÉLICITATIONS : LES 8 MODULES SONT 100% VALIDÉS SANS ERREUR !");
  console.log("===============================================================");
  process.exit(0);
} else {
  console.error("❌ LA BATTERIE A ÉCHOUÉ SUR AU MOINS UN MODULE.");
  process.exit(1);
}
