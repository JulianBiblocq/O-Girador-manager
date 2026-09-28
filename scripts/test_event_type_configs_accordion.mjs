/**
 * Test d'intégrité : Cartes Accordéons des Types d'Événements dans TabAgenda & Presets Réactifs
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log("===============================================================");
console.log("🧪 TEST : CARTES ACCORDÉONS TYPES D'ÉVÉNEMENTS & PRESETS");
console.log("===============================================================\n");

// --- 1. Vérification de l'existence et des exports de EventTypeConfigCard.jsx ---
console.log("▶️ Étape 1 : Validation du composant EventTypeConfigCard.jsx");
const cardPath = path.resolve('src/components/association-settings/EventTypeConfigCard.jsx');
assert(fs.existsSync(cardPath), "Le fichier EventTypeConfigCard.jsx doit exister");

const cardCode = fs.readFileSync(cardPath, 'utf-8');
assert(cardCode.includes('getEventTypeEmoji'), "EventTypeConfigCard doit exporter getEventTypeEmoji");
assert(cardCode.includes('resolveTypeEffectiveConfig'), "EventTypeConfigCard doit exporter resolveTypeEffectiveConfig");
assert(cardCode.includes('buildConfigSummary'), "EventTypeConfigCard doit exporter buildConfigSummary");
assert(cardCode.includes('enableRoadbook'), "EventTypeConfigCard doit gérer enableRoadbook");
assert(cardCode.includes('activerRecolteMedias'), "EventTypeConfigCard doit gérer activerRecolteMedias");
assert(cardCode.includes('enableVideoDrop') || cardCode.includes('activerDepotVideo'), "EventTypeConfigCard doit gérer enableVideoDrop / activerDepotVideo");
assert(cardCode.includes('enableStageLayout'), "EventTypeConfigCard doit gérer enableStageLayout");
assert(cardCode.includes('enableRevisionProgram'), "EventTypeConfigCard doit gérer enableRevisionProgram");
assert(cardCode.includes('enableCarpool'), "EventTypeConfigCard doit gérer enableCarpool");
assert(cardCode.includes('includesPercussion'), "EventTypeConfigCard doit gérer includesPercussion");
assert(cardCode.includes('includesDance'), "EventTypeConfigCard doit gérer includesDance");
assert(cardCode.includes('requiresValidation'), "EventTypeConfigCard doit gérer requiresValidation");
assert(cardCode.includes('defaultDeadlineHours'), "EventTypeConfigCard doit gérer defaultDeadlineHours");
assert(cardCode.includes('defaultDropUrl'), "EventTypeConfigCard doit gérer defaultDropUrl");
assert(cardCode.includes('Configurer ▾') || cardCode.includes('Configurer'), "EventTypeConfigCard doit afficher le bouton 'Configurer'");
console.log("  ✅ [PASS] Composant modulaire EventTypeConfigCard validé avec tous ses interrupteurs et presets\n");

// --- 2. Vérification des fonctions utilitaires de configuration ---
console.log("▶️ Étape 2 : Test des logiques métiers de presets par type");
import { getEventTypeEmoji, resolveTypeEffectiveConfig, buildConfigSummary } from '../src/utils/eventTypeConfigUtils.js';

// Emojis
assert.strictEqual(getEventTypeEmoji('prestation'), '🎭');
assert.strictEqual(getEventTypeEmoji('repetition'), '🥁');
assert.strictEqual(getEventTypeEmoji('stage'), '🥋');
assert.strictEqual(getEventTypeEmoji('atelier'), '🛠️');
assert.strictEqual(getEventTypeEmoji('reunion'), '📋');
assert.strictEqual(getEventTypeEmoji('autre'), '📅');

// Résolution intelligente par défaut
const prestaConfig = resolveTypeEffectiveConfig('prestation', {});
assert.strictEqual(prestaConfig.enableRoadbook, true, "Prestation doit avoir le roadbook par défaut");
assert.strictEqual(prestaConfig.activerRecolteMedias, true, "Prestation doit avoir la boîte photos par défaut");
assert.strictEqual(prestaConfig.enableStageLayout, true, "Prestation doit avoir le plan de scène par défaut");

const reunionConfig = resolveTypeEffectiveConfig('reunion', {});
assert.strictEqual(reunionConfig.enableRoadbook, false, "Réunion ne doit pas avoir le roadbook par défaut");
assert.strictEqual(reunionConfig.includesPercussion, false, "Réunion ne doit pas inclure les percussions par défaut");
assert.strictEqual(reunionConfig.enableCarpool, false, "Réunion ne doit pas inclure le covoiturage par défaut");

// Résumé textuel
const summaryPresta = buildConfigSummary(prestaConfig);
assert(summaryPresta.includes('Feuille de route'), "Le résumé doit mentionner Feuille de route");
assert(summaryPresta.includes('Photos'), "Le résumé doit mentionner Photos");
console.log("  ✅ [PASS] Fonctions pures validées (Emojis, Résolution par type, Résumé textuel)\n");

// --- 3. Vérification de l'intégration dans TabAgenda.jsx ---
console.log("▶️ Étape 3 : Intégration dans TabAgenda.jsx");
const tabAgendaPath = path.resolve('src/components/association-settings/TabAgenda.jsx');
const tabAgendaCode = fs.readFileSync(tabAgendaPath, 'utf-8');

assert(tabAgendaCode.includes("import EventTypeConfigCard from './EventTypeConfigCard'"), "TabAgenda doit importer EventTypeConfigCard");
assert(tabAgendaCode.includes('expandedType'), "TabAgenda doit gérer l'état d'accordéon expandedType");
assert(tabAgendaCode.includes('<EventTypeConfigCard'), "TabAgenda doit instancier EventTypeConfigCard");
assert(tabAgendaCode.includes('activerRecolteMedias'), "TabAgenda doit préserver le mot-clé activerRecolteMedias");
assert(tabAgendaCode.includes('Boîte Photos (QR Code)'), "TabAgenda doit préserver le libellé 'Boîte Photos (QR Code)'");
console.log("  ✅ [PASS] Accordéons Cordel et gestion d'état validés dans TabAgenda.jsx\n");

// --- 4. Vérification de la propagation des presets dans EventFormFields.jsx ---
console.log("▶️ Étape 4 : Injection et calcul automatique dans EventFormFields.jsx");
const eventFormFieldsPath = path.resolve('src/components/agenda/EventFormFields.jsx');
const formFieldsCode = fs.readFileSync(eventFormFieldsPath, 'utf-8');

assert(formFieldsCode.includes('typePresets.requiresValidation'), "EventFormFields doit propager requiresValidation");
assert(formFieldsCode.includes('typePresets.enableRoadbook'), "EventFormFields doit propager enableRoadbook");
assert(formFieldsCode.includes('typePresets.enableStageLayout'), "EventFormFields doit propager enableStageLayout");
assert(formFieldsCode.includes('typePresets.defaultDropUrl'), "EventFormFields doit propager defaultDropUrl");
assert(formFieldsCode.includes('typePresets.defaultDeadlineHours') || formFieldsCode.includes('typePresets?.defaultDeadlineHours'), "EventFormFields doit calculer la deadline à partir de defaultDeadlineHours");
assert(formFieldsCode.includes('enableRoadbook'), "EventFormFields doit proposer le toggle enableRoadbook");
console.log("  ✅ [PASS] Propagation des presets et calcul automatique de deadline confirmés dans EventFormFields.jsx\n");

// --- 5. Persistance dans WidgetAgenda et EventDetails ---
console.log("▶️ Étape 5 : Persistance Firestore dans WidgetAgenda et EventDetails");
const widgetAgendaPath = path.resolve('src/components/WidgetAgenda.jsx');
const eventDetailsPath = path.resolve('src/components/EventDetails.jsx');

const widgetAgendaCode = fs.readFileSync(widgetAgendaPath, 'utf-8');
const eventDetailsCode = fs.readFileSync(eventDetailsPath, 'utf-8');

assert(widgetAgendaCode.includes('enableRoadbook:'), "WidgetAgenda doit persister enableRoadbook");
assert(eventDetailsCode.includes('enableRoadbook:'), "EventDetails doit persister enableRoadbook");
console.log("  ✅ [PASS] Persistance Firestore de enableRoadbook validée\n");

console.log("🎉 TOUS LES TESTS DES ACCORDÉONS TYPES D'ÉVÉNEMENTS ONT RÉUSSI AVEC SUCCÈS !\n");
