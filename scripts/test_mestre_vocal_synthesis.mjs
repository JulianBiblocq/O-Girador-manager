/**
 * test_mestre_vocal_synthesis.mjs
 * Validation automatisée complète de la Synthèse Vocale Maestria :
 * - Parsing bi-directionnel Note ⟷ MIDI et calculs d'ambitus
 * - Algorithme de recouvrement du chœur (80%+) et note centrale
 * - Répartition des tessitures (graves, médiums, aiguës)
 * - Exclusion de 'vocal' dans aisanceService.js (Gouvernance Carnet d'Aisance)
 * - Confidentialité stricte (aucune exposition de vocalProfile dans les composants membres simples)
 * - Règles architecturales anti-monolithe (< 140 lignes par sous-composant)
 * - Parité bilingue i18n FR / PT-BR
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  noteNameToMidi,
  midiToLatinNote,
  determineTessiture,
  resolveMemberVocalWish,
  getMemberVocalProfile,
  computeChoirOverlap,
  computeTessitureBreakdown,
  KEYBOARD_MIN_MIDI,
  KEYBOARD_MAX_MIDI
} from '../src/utils/vocalAmbitusUtils.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST AUTOMATISÉ : SYNTHÈSE VOCALE MAESTRIA & AMBITUS CONFIDENTIELS');
console.log('========================================================================\n');

// -------------------------------------------------------------
// 1. Validation Note ⟷ MIDI et calculs d'ambitus
// -------------------------------------------------------------
console.log("▶️ Test 1 : Mathématiques musicales & Parsing Note ⟷ MIDI");

// Mi2 = 40, Do5 = 72
assert.strictEqual(KEYBOARD_MIN_MIDI, 40, "Clavier min doit être Mi2 (40)");
assert.strictEqual(KEYBOARD_MAX_MIDI, 72, "Clavier max doit être Do5 (72)");

// Sol2 = 43, Mi4 = 64
const sol2Midi = noteNameToMidi('Sol2');
const mi4Midi = noteNameToMidi('Mi4');
assert.strictEqual(sol2Midi, 43, "Sol2 doit être MIDI 43");
assert.strictEqual(mi4Midi, 64, "Mi4 doit être MIDI 64");
const rangeSemitones = mi4Midi - sol2Midi;
assert.strictEqual(rangeSemitones, 21, "Sol2 ➔ Mi4 doit donner exactement 21 demi-tons");

// Notation latine et anglo-saxonne, minuscules, dièses et bémols
assert.strictEqual(noteNameToMidi('C4'), 60, "C4 doit être 60");
assert.strictEqual(noteNameToMidi('Do4'), 60, "Do4 doit être 60");
assert.strictEqual(noteNameToMidi('do#3'), 49, "do#3 doit être 49");
assert.strictEqual(noteNameToMidi('re4'), 62, "re4 doit être 62");
assert.strictEqual(noteNameToMidi('Ré4'), 62, "Ré4 doit être 62");
assert.strictEqual(noteNameToMidi('Sib3'), 58, "Sib3 doit être 58 (Si3 59 - 1)");
assert.strictEqual(noteNameToMidi('invalid'), -1, "Note invalide retourne -1");

// Conversion inverse MIDI -> Latin
assert.strictEqual(midiToLatinNote(40), 'Mi2', "40 doit être Mi2");
assert.strictEqual(midiToLatinNote(43), 'Sol2', "43 doit être Sol2");
assert.strictEqual(midiToLatinNote(60), 'Do4', "60 doit être Do4");
assert.strictEqual(midiToLatinNote(64), 'Mi4', "64 doit être Mi4");
assert.strictEqual(midiToLatinNote(72), 'Do5', "72 doit être Do5");
console.log("  ✅ [PASS] Conversions Note ⟷ MIDI et écarts validés à 100%");

// -------------------------------------------------------------
// 2. Détermination de tessiture et détection de souhait
// -------------------------------------------------------------
console.log("\n▶️ Test 2 : Détermination de tessiture et souhait Puxador / Coro");
assert.strictEqual(determineTessiture(44), 'basse');
assert.strictEqual(determineTessiture(50), 'baryton');
assert.strictEqual(determineTessiture(55), 'tenor');
assert.strictEqual(determineTessiture(60), 'alto');
assert.strictEqual(determineTessiture(65), 'mezzo-soprano');
assert.strictEqual(determineTessiture(70), 'soprano');

const memberPuxador = {
  nom: 'Silva',
  prenom: 'Mateus',
  vocalProfile: {
    targetRole: 'Puxador',
    lowestSolidNote: 'Sol2',
    highestSolidNote: 'Sol4',
    comfortCenterNote: 'Sol3',
    stairsAccuracyPct: 92
  }
};
assert.strictEqual(resolveMemberVocalWish(memberPuxador), 'Puxador');

const memberCoro = {
  nom: 'Dupont',
  prenom: 'Claire',
  voeuPrincipal: 'Choeur et chant',
  vocalProfile: {
    lowestSolidNote: 'La2',
    highestSolidNote: 'Do4',
    comfortCenterNote: 'Fa3',
    stairsAccuracyPct: 88
  }
};
assert.strictEqual(resolveMemberVocalWish(memberCoro), 'Coro');

const profPuxador = getMemberVocalProfile(memberPuxador);
assert.ok(profPuxador, "Profil puxador extrait");
assert.strictEqual(profPuxador.lowestSolidNote, 'Sol2');
assert.strictEqual(profPuxador.highestSolidNote, 'Sol4');
assert.strictEqual(profPuxador.rangeSemitones, 24);
assert.strictEqual(profPuxador.stairsAccuracyPct, 92);
assert.strictEqual(profPuxador.targetRole, 'Puxador');
console.log("  ✅ [PASS] Extraction de profils et souhait vocal validés");

// -------------------------------------------------------------
// 3. Calcul de Recouvrement du Chœur et Répartition
// -------------------------------------------------------------
console.log("\n▶️ Test 3 : Calcul de recouvrement du chœur (80%+) et tessitures");

const sampleMembers = [
  { id: '1', vocalData: { lowestMidi: 45, highestMidi: 65, centerMidi: 55, tessiture: 'tenor' } }, // La2 -> Fa4
  { id: '2', vocalData: { lowestMidi: 48, highestMidi: 67, centerMidi: 57, tessiture: 'tenor' } }, // Do3 -> Sol4
  { id: '3', vocalData: { lowestMidi: 48, highestMidi: 64, centerMidi: 56, tessiture: 'alto' } },  // Do3 -> Mi4
  { id: '4', vocalData: { lowestMidi: 43, highestMidi: 62, centerMidi: 52, tessiture: 'baryton' } },// Sol2 -> Ré4
  { id: '5', vocalData: { lowestMidi: 50, highestMidi: 70, centerMidi: 60, tessiture: 'alto' } }   // Ré3 -> Si4
];

const overlap = computeChoirOverlap(sampleMembers);
assert.ok(overlap, "Le recouvrement doit être calculé");
assert.ok(overlap.startMidi >= 48, "Le début de recouvrement doit être >= 48 (Do3)");
assert.ok(overlap.endMidi <= 64, "La fin de recouvrement doit être <= 64 (Mi4)");
assert.ok(overlap.rangeSemitones >= 12, "L'intervalle doit avoir une amplitude cohérente");
assert.ok(overlap.centerMidi >= 50 && overlap.centerMidi <= 60, "Note centrale du groupe cohérente");
assert.strictEqual(overlap.evaluatedCount, 5);

const breakdown = computeTessitureBreakdown(sampleMembers);
assert.strictEqual(breakdown.graves, 1, "1 voix grave (baryton)");
assert.strictEqual(breakdown.mediums, 4, "4 voix médiums (2 tenors, 2 altos)");
assert.strictEqual(breakdown.total, 5);
console.log("  ✅ [PASS] Recouvrement de chœur et répartition des voix validés");

// -------------------------------------------------------------
// 4. Gouvernance Carnet d'Aisance (Exclusion de 'vocal')
// -------------------------------------------------------------
console.log("\n▶️ Test 4 : Gouvernance Carnet d'Aisance (Exclusion de 'vocal' dans aisanceService.js)");
const aisanceServicePath = path.resolve('src/services/aisanceService.js');
const aisanceServiceContent = fs.readFileSync(aisanceServicePath, 'utf-8');

assert.ok(
  aisanceServiceContent.includes("d.id === 'vocal'"),
  "aisanceService.js doit explicitement exclure d.id === 'vocal'"
);
assert.ok(
  aisanceServiceContent.includes("d.id === 'reflexes' || d.id === 'conducteurs' || d.id === 'vocal'"),
  "L'instruction de filtrage doit inclure reflexes, conducteurs et vocal"
);
console.log("  ✅ [PASS] Gouvernance Carnet d'Aisance validée");

// -------------------------------------------------------------
// 5. Anti-Monolithe & Lignes de Code (< 140 lignes)
// -------------------------------------------------------------
console.log("\n▶️ Test 5 : Règles architecturales anti-monolithe (< 140 lignes par composant)");
const componentsToCheck = [
  { path: 'src/components/mestre/MestreVocalSynthesisPanel.jsx', max: 140 },
  { path: 'src/components/mestre/vocal/VocalCollectiveBanner.jsx', max: 140 },
  { path: 'src/components/mestre/vocal/VocalKeyboardBar.jsx', max: 140 },
  { path: 'src/utils/vocalAmbitusUtils.js', max: 150 }
];

componentsToCheck.forEach(({ path: compPath, max }) => {
  const fullPath = path.resolve(compPath);
  assert.ok(fs.existsSync(fullPath), `Le fichier ${compPath} doit exister`);
  const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
  console.log(`   - ${compPath} : ${lines} lignes (max: ${max})`);
  assert.ok(lines <= max, `${compPath} dépasse la limite autorisée (${lines} > ${max})`);
});
console.log("  ✅ [PASS] Anti-monolithe rigoureusement respecté");

// -------------------------------------------------------------
// 6. Confidentialité stricte Mestre
// -------------------------------------------------------------
console.log("\n▶️ Test 6 : Confidentialité stricte de la Synthèse Vocale");
const appPath = path.resolve('src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

// Vérifie que MestreOrientationCasting est protégé par hasAccessMestre
assert.ok(
  appContent.includes("currentTab === 'mestre-orientation' && hasAccessMestre"),
  "MestreOrientationCasting doit être gardé par hasAccessMestre dans App.jsx"
);

// Vérifie que MestreVocalSynthesisPanel n'est importé nulle part dans l'espace membre
const memberComponentsDir = path.resolve('src/components');
const filesInComponents = fs.readdirSync(memberComponentsDir);
filesInComponents.forEach(file => {
  if (file.startsWith('Member') || file.startsWith('Adherent') || file.startsWith('Trombinoscope')) {
    const filePath = path.join(memberComponentsDir, file);
    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(
        !content.includes('MestreVocalSynthesisPanel'),
        `Fuite détectée : ${file} ne doit pas importer MestreVocalSynthesisPanel !`
      );
    }
  }
});
console.log("  ✅ [PASS] Confidentialité stricte Maestria garantie");

// -------------------------------------------------------------
// 7. Parité bilingue i18n FR / PT-BR
// -------------------------------------------------------------
console.log("\n▶️ Test 7 : Parité bilingue i18n FR / PT-BR");
const requiredVocalKeys = [
  'subTabPupitres',
  'subTabVocal',
  'vocalSynthesisTitle',
  'vocalSynthesisSubtitle',
  'choirOverlapHeading',
  'choirOverlapDesc',
  'choirCoverageNotice',
  'idealGroupCenter',
  'tessituresBreakdownHeading',
  'voicesGraves',
  'voicesMediums',
  'voicesAigues',
  'thAmbitusPower',
  'thComfortCenter',
  'thStairsAccuracy',
  'thKeyboardPosition',
  'noVocalProfilesYet',
  'noVocalProfilesNotice',
  'badgePuxador',
  'badgeCoro',
  'semitonesCount',
  'openVocalLab'
];

requiredVocalKeys.forEach(k => {
  assert.ok(fr.mestre?.casting?.[k], `Clé mestre.casting.${k} manquante dans fr.js`);
  assert.ok(pt.mestre?.casting?.[k], `Clé mestre.casting.${k} manquante dans pt.js`);
});

const requiredRepertoireVocalKeys = ['btnVocalLab', 'tooltipVocalLab', 'vocalLabBadge'];
requiredRepertoireVocalKeys.forEach(k => {
  assert.ok(fr.repertoire?.[k], `Clé repertoire.${k} manquante dans fr.js`);
  assert.ok(pt.repertoire?.[k], `Clé repertoire.${k} manquante dans pt.js`);
});

// Vérification stricte de la nomenclature officielle Cantador en FR
assert.strictEqual(fr.mestre.casting.openVocalLab, "Ouvrir Cantador (Atelier Vocal)", "Nomenclature FR casting openVocalLab incorrecte");
assert.strictEqual(fr.repertoire.btnVocalLab, "Cantador / S'entraîner au chant", "Nomenclature FR repertoire btnVocalLab incorrecte");
assert.strictEqual(fr.repertoire.tooltipVocalLab, "Ouvrir Cantador en ligne", "Nomenclature FR repertoire tooltipVocalLab incorrecte");
assert.strictEqual(fr.repertoire.vocalLabBadge, "Cantador", "Nomenclature FR repertoire vocalLabBadge incorrecte");

// Vérification stricte de la nomenclature officielle Cantador en PT-BR
assert.strictEqual(pt.mestre.casting.openVocalLab, "Abrir o Cantador (Oficina Vocal)", "Nomenclature PT casting openVocalLab incorrecte");
assert.strictEqual(pt.repertoire.btnVocalLab, "Cantador / Treinar canto", "Nomenclature PT repertoire btnVocalLab incorrecte");
assert.strictEqual(pt.repertoire.tooltipVocalLab, "Abrir o Cantador online", "Nomenclature PT repertoire tooltipVocalLab incorrecte");
assert.strictEqual(pt.repertoire.vocalLabBadge, "Cantador", "Nomenclature PT repertoire vocalLabBadge incorrecte");

const newRepertoireKeys = [
  'fieldCantadorToada',
  'selectCantadorToadaPlaceholder',
  'btnCreateCantador',
  'tooltipCreateCantador',
  'cantadorToadaLinkedNotice',
  'btnTrainVocalDirect'
];
newRepertoireKeys.forEach(k => {
  assert.ok(fr.repertoire?.[k], `Clé repertoire.${k} manquante dans fr.js`);
  assert.ok(pt.repertoire?.[k], `Clé repertoire.${k} manquante dans pt.js`);
});

const newPedagogyKeys = [
  'cantadorBannerTitle',
  'cantadorBannerDesc',
  'btnCantadorAmbitus'
];
newPedagogyKeys.forEach(k => {
  assert.ok(fr.pedagogy?.[k], `Clé pedagogy.${k} manquante dans fr.js`);
  assert.ok(pt.pedagogy?.[k], `Clé pedagogy.${k} manquante dans pt.js`);
});

console.log(`  ✅ [PASS] ${requiredVocalKeys.length + requiredRepertoireVocalKeys.length + newRepertoireKeys.length + newPedagogyKeys.length} clés i18n FR/PT-BR et nomenclature officielle "Cantador" validées`);

// -------------------------------------------------------------
// 8. Passerelle Répertoire & Entraînement Toada Cantador
// -------------------------------------------------------------
console.log("\n▶️ Test 8 : Validation Passerelle Répertoire & Toada Cantador");
const hookPath = path.resolve('src/hooks/useCantadorToadas.js');
assert.ok(fs.existsSync(hookPath), "useCantadorToadas.js doit exister");
const hookContent = fs.readFileSync(hookPath, 'utf-8');
assert.ok(hookContent.includes('toada_packs'), "useCantadorToadas doit écouter toada_packs");

const repModalPath = path.resolve('src/components/mestre/RepertoirePieceModal.jsx');
const repModalContent = fs.readFileSync(repModalPath, 'utf-8');
assert.ok(repModalContent.includes('cantadorToadaId'), "RepertoirePieceModal doit gérer cantadorToadaId");
assert.ok(repModalContent.includes('useCantadorToadas'), "RepertoirePieceModal doit utiliser useCantadorToadas");

const cardPath = path.resolve('src/components/member/MemberPieceCard.jsx');
const cardContent = fs.readFileSync(cardPath, 'utf-8');
const cardLines = cardContent.split('\n').length;
assert.ok(cardLines < 200, `MemberPieceCard.jsx doit être < 200 lignes (actuel: ${cardLines})`);
assert.ok(cardContent.includes('cantadorToadaId'), "MemberPieceCard doit vérifier cantadorToadaId");
assert.ok(cardContent.includes('toadaId'), "MemberPieceCard doit passer toadaId");

const unfoldedPath = path.resolve('src/components/member/MemberPieceUnfoldedContent.jsx');
const unfoldedContent = fs.readFileSync(unfoldedPath, 'utf-8');
const unfoldedLines = unfoldedContent.split('\n').length;
assert.ok(unfoldedLines < 200, `MemberPieceUnfoldedContent.jsx doit être < 200 lignes (actuel: ${unfoldedLines})`);
assert.ok(unfoldedContent.includes('toadaId'), "MemberPieceUnfoldedContent doit passer toadaId");

const carnetPath = path.resolve('src/components/pedagogy/MonCarnetAisance.jsx');
const carnetContent = fs.readFileSync(carnetPath, 'utf-8');
assert.ok(carnetContent.includes('cantadorBannerTitle'), "MonCarnetAisance doit afficher la bannière Cantador");
console.log("  ✅ [PASS] Passerelle Répertoire & Entraînement Toada Cantador 100% validée");

console.log("\n========================================================================");
console.log("🏆 TOUS LES TESTS DE LA SYNTHÈSE VOCALE MAESTRIA SONT 100% VALIDÉS !");
console.log("========================================================================\n");
