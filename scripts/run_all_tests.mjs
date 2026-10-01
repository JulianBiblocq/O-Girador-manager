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
  'scripts/test_in_app_notifications.mjs',
  'scripts/test_treasurer_logistics_permissions.mjs',
  'scripts/test_sequencer_repertoire_unification.mjs',
  'scripts/test_annonces_publish_permissions.mjs',
  'scripts/test_tablature_formatter.mjs',
  'scripts/test_repertoire_culture_bridge.mjs',
  'scripts/test_react_hooks_imports.mjs',
  'scripts/test_agenda_translations.mjs',
  'scripts/test_sinais_do_mestre_aspiration.mjs',
  'scripts/test_season_cycles_config.mjs',
  'scripts/test_agenda_temporal_season_filtering.mjs',
  'scripts/test_treasury_secretariat_season_wiring.mjs',
  'scripts/test_repertoire_reactive_architecture.mjs',
  'scripts/test_repertoire_multi_culture.mjs',
  'scripts/test_forum_chat_attachments.mjs',
  'scripts/test_speed_trainer_aisance.mjs',
  'scripts/test_reflex_game_engine.mjs',
  'scripts/test_conductor_game_engine.mjs',
  'scripts/test_repertoire_adherents_mission.mjs',
  'scripts/test_mission_vocabulaire_dedoublonnage_culture.mjs',
  'scripts/test_member_repertoire_accordion.mjs',
  'scripts/test_toada_mixed_line_lyrics.mjs',
  'scripts/test_repertoire_piece_signals.mjs',
  'scripts/test_repertoire_lyrics_and_culture_modals.mjs',
  'scripts/test_repertoire_video_levels_and_varal_gateway.mjs',
  'scripts/test_varal_ropes_visibility_and_toggle.mjs',
  'scripts/test_mestre_custom_categories_edition_and_sync.mjs',
  'scripts/test_event_rsvp_accordion_and_permissions.mjs',
  'scripts/test_instrument_icons_resolution.mjs',
  'scripts/test_mestre_orientation_custom_categories_robustness.mjs',
  'scripts/test_quiz_generator_focus_repertoire.mjs',
  'scripts/test_presence_counter_and_voice_dictation.mjs',
  'scripts/test_varal_reorganization_5_ropes.mjs',
  'scripts/test_espace_instruments_labels.mjs',
  'scripts/test_secretariat_4_tabs_and_forum_channels.mjs',
  'scripts/test_inventory_caution_attribution.mjs',
  'scripts/test_event_roadbook_mission.mjs',
  'scripts/test_carpool_crew_discussion_mission.mjs',
  'scripts/test_collective_kits_roadbook_mission.mjs',
  'scripts/test_simple_member_suite.mjs',
  'scripts/test_tab_ribbon_responsive.mjs',
  'scripts/test_event_commissions_engine.mjs',
  'scripts/test_event_commissions_bloc2.mjs',
  'scripts/test_trombinoscope_stamp_grid.mjs',
  'scripts/test_event_type_configs_accordion.mjs',
  'scripts/test_in_app_notifications_deletion.mjs',
  'scripts/test_repertoire_event_program_mission.mjs',
  'scripts/test_responsive_popups_clamping.mjs',
  'scripts/test_consolidation_config_mission.mjs',
  'scripts/test_commission_varal_gateway.mjs',
  'scripts/test_birthday_privacy.mjs',
  'scripts/test_card_height_and_tags.mjs',
  'scripts/test_cordel_confirm_modal.mjs',
  'scripts/test_dedup_and_secretariat_fix.mjs',
  'scripts/test_effective_tags_and_search_bar.mjs',
  'scripts/test_event_discussion_notifications.mjs',
  'scripts/test_fiche5_cordel_confirm_modal.mjs',
  'scripts/test_fiche6_trombinoscope.mjs',
  'scripts/test_helloasso_sync.mjs',
  'scripts/test_levels_and_sementes.mjs',
  'scripts/test_mestre_pedagogical_roles.mjs',
  'scripts/test_read_receipt.mjs',
  'scripts/test_porte_voix_read_receipts.mjs',
  'scripts/test_search_input_padding.mjs'
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
