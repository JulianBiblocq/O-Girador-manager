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
  'scripts/test_module_8.mjs',
  'scripts/test_gouvernance_pole.mjs',
  'scripts/test_break_glass.mjs',
  'scripts/test_automation_present_only.mjs',
  'scripts/test_costume_return_automation.mjs',
  'scripts/test_tag_audit_reverse_view.mjs',
  'scripts/test_view_simulator.mjs',
  'scripts/test_saas_multi_tenant_isolation.mjs',
  'scripts/test_saas_license_guard.mjs',
  'scripts/test_pupitre_instrument_rules.mjs',
  'scripts/test_event_qr_code_pipeline.mjs',
  'scripts/test_private_messages_recovery.mjs',
  'scripts/test_studio_lexique_integration.mjs',
  'scripts/test_studio_social_enrichment.mjs',
  'scripts/test_studio_social_unicode_workflow.mjs',
  'scripts/test_mestre_forum_rsvp_recovery.mjs',
  'scripts/test_expense_claims_season.mjs',
  'scripts/test_expense_claims_firestore_rules.mjs',
  'scripts/test_orders_reconciliation.mjs',
  'scripts/test_in_app_notifications.mjs'
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
