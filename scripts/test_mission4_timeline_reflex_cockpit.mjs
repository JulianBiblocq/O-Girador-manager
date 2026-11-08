/**
 * Script de validation de la Mission 4 :
 * - Calcul exact de T_pause au temps 1 de la mesure N+1, respect de cueOnly (signalOverrides) et absence de pause si le pupitre est vide à N+1
 * - Génération des encoches (slots) et du bac à signaux avec leurres dans signalTimelineUtils.js
 * - Présence et raccordement de SignalTimelineModal, PieceReflexConfigModal et MestreChallengesCompactBar
 * - Respect strict de la limite <= 140 lignes, 0 apostrophe sur les noms d'applications et parité 1:1 fr.js / pt.js
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSignalTimelineChallenge,
  extractConductorChallenge
} from '../src/utils/signalTimelineUtils.js';
import {
  calculatePauseTimes,
  extractPupitrePattern
} from '../src/utils/reflexGameUtils.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Démarrage des tests de la Mission 4 (Conducteur Interactif, Défi Réflexe Temps 1 & Cockpit Mestre)...');

// ---------------------------------------------------------------------------
// 1. Calcul exact de T_pause au temps 1 de la mesure N+1, cueOnly & pupitre vide
// ---------------------------------------------------------------------------
const mockPreset = {
  bpm: 120, // 1 temps = 0.5s, 1 mesure 4/4 = 2.0s
  measureBpms: [120, 120, 60, 120], // M1=2s, M2=2s, M3=4s, M4=2s
  expandedMeasures: [
    // Mesure 1 (index 0)
    { beats: 4, tracks: { caixa: { activeSteps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] }, gongue: { activeSteps: new Array(16).fill(0) } } },
    // Mesure 2 (index 1 = cible d'un signal annoncé en mesure 1) : caixa joue, gongue silence complet
    { beats: 4, tracks: { caixa: { activeSteps: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0] }, gongue: { activeSteps: new Array(16).fill(0) } } },
    // Mesure 3 (index 2 = cible d'un signal annoncé en mesure 2) : caixa & gongue jouent
    { beats: 4, tracks: { caixa: { activeSteps: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0] }, gongue: { activeSteps: [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0] } } },
    // Mesure 4 (index 3 = cible d'un signal annoncé en mesure 3)
    { beats: 4, tracks: { caixa: { activeSteps: [1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0] }, gongue: { activeSteps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] } } }
  ]
};

const mockPiece = {
  id: 'piece_m4',
  titre: 'Baque Virado M4',
  sinaisDoMestre: [
    { id: 'sig_1', signalId: 'sig_1', mesure: 1, name: 'Virada Caixa' },
    { id: 'sig_2', signalId: 'sig_2', mesure: 2, name: 'Appel Gonguê' },
    { id: 'sig_3', signalId: 'sig_3', mesure: 3, name: 'Repère Visuel Seul' }
  ],
  signalOverrides: {
    sig_3: { mode: 'cueOnly', isInteractive: false }
  }
};

// Pour le pupitre 'caixa' : tous les signaux ont une piste active à N+1
const caixaPoints = calculatePauseTimes(mockPiece, mockPreset, 'caixa');
assert.equal(caixaPoints.length, 3, 'Caixa doit recevoir les 3 signaux');
// Signal 1 annoncé en mesure 1 -> pause au temps 1 de la mesure 2 : T_pause = 2.0s
assert.equal(caixaPoints[0].pauseTime, 2.0, 'T_pause du signal en mesure 1 doit être exactement 2.0s (temps 1 de M2)');
assert.equal(caixaPoints[0].targetMeasure, 2, 'La mesure cible doit être N+1 = 2');
assert.equal(caixaPoints[0].isInteractive, true, 'sig_1 doit être interactif');

// Signal 2 annoncé en mesure 2 -> pause au temps 1 de la mesure 3 : T_pause = 2.0 + 2.0 = 4.0s
assert.equal(caixaPoints[1].pauseTime, 4.0, 'T_pause du signal en mesure 2 doit être exactement 4.0s (temps 1 de M3)');

// Signal 3 annoncé en mesure 3 (BPM=60 => durée 4.0s) -> T_pause = 2.0 + 2.0 + 4.0 = 8.0s, mais mode='cueOnly'
assert.equal(caixaPoints[2].pauseTime, 8.0, 'T_pause du signal en mesure 3 (BPM 60) doit être exactement 8.0s');
assert.equal(caixaPoints[2].isInteractive, false, 'sig_3 marqué cueOnly dans signalOverrides ne doit pas déclencher de pause interactive');

// Pour le pupitre 'gongue' : en mesure 2 (N+1 du signal 1), activeSteps est vide (tout à 0) -> sig_1 doit être ignoré !
const gonguePoints = calculatePauseTimes(mockPiece, mockPreset, 'gongue');
assert.equal(gonguePoints.some((p) => p.signalId === 'sig_1'), false, 'Le signal 1 doit être ignoré pour le gongue car sa piste est vide à la mesure N+1');
assert.equal(gonguePoints.some((p) => p.signalId === 'sig_2'), true, 'Le signal 2 doit être conservé pour le gongue car sa piste est active à la mesure 3');

const extractedCaixaM2 = extractPupitrePattern(mockPreset, 'caixa', 1);
assert.equal(extractedCaixaM2.length, 16, 'Le motif extrait doit comporter 16 pas');
console.log('✅ 1/4 Calcul exact de T_pause, respect de cueOnly et filtrage pupitre vide à N+1 validés.');

// ---------------------------------------------------------------------------
// 2. Génération des encoches (slots) et des leurres dans signalTimelineUtils.js
// ---------------------------------------------------------------------------
const catalogSignals = [
  { id: 'sig_1', name: 'Virada Caixa', consigne: 'Entrée Caixa' },
  { id: 'sig_2', name: 'Appel Gonguê', consigne: 'Phrase Gonguê' },
  { id: 'sig_3', name: 'Repère Visuel Seul', consigne: 'Attention' },
  { id: 'cat_dist_1', name: 'Parada Geral', consigne: 'Arrêt net' },
  { id: 'cat_dist_2', name: 'Baque Forte', consigne: 'Nuance forte' },
  { id: 'cat_dist_3', name: 'Corte Surdo', consigne: 'Coupure' }
];

const timelineSession = buildSignalTimelineChallenge(mockPiece, mockPreset, catalogSignals);
assert.equal(timelineSession.totalSignals, 3, 'La session Conducteur doit détecter les 3 signaux du morceau');
assert.equal(timelineSession.slots.length, 3, '3 encoches cibles doivent être générées');
assert.equal(timelineSession.slots[0].announcementTime, 0, 'T_annonce de la mesure 1 doit être 0s');
assert.equal(timelineSession.slots[1].announcementTime, 2.0, 'T_annonce de la mesure 2 doit être 2.0s');
assert.equal(timelineSession.slots[2].announcementTime, 4.0, 'T_annonce de la mesure 3 doit être 4.0s');
assert.equal(timelineSession.distractors.length, 3, '3 leurres plausibles doivent être générés depuis mestre_signals');
assert.equal(timelineSession.signalTray.length, 6, 'Le Bac à Signaux doit contenir les 3 vrais signaux + 3 leurres');

const aliasCheck = extractConductorChallenge(mockPiece, mockPreset, catalogSignals);
assert.equal(aliasCheck.slots.length, 3, 'extractConductorChallenge doit retourner les 3 encoches triées');
console.log('✅ 2/4 Génération des encoches et du Bac à Signaux (signalTimelineUtils.js) validée.');

// ---------------------------------------------------------------------------
// 3. Présence des composants SignalTimelineModal, PieceReflexConfigModal & MestreChallengesCompactBar
// ---------------------------------------------------------------------------
const requiredComponents = [
  'src/utils/signalTimelineUtils.js',
  'src/components/pedagogy/SignalTimelineModal.jsx',
  'src/components/pedagogy/conductor/SignalTimelineBoard.jsx',
  'src/components/pedagogy/PieceDirectionChallengesBar.jsx',
  'src/components/mestre/PieceReflexConfigModal.jsx',
  'src/components/mestre/MestreChallengesCompactBar.jsx',
  'src/components/mestre/MestrePedagogyDashboard.jsx'
];

for (const rel of requiredComponents) {
  const full = path.join(ROOT, rel);
  assert.ok(fs.existsSync(full), `Le fichier requis ${rel} doit exister`);
}

const dashboardCode = fs.readFileSync(path.join(ROOT, 'src/components/mestre/MestrePedagogyDashboard.jsx'), 'utf8');
assert.ok(dashboardCode.includes('MestreChallengesCompactBar'), 'MestrePedagogyDashboard.jsx doit intégrer MestreChallengesCompactBar');
assert.ok(dashboardCode.includes('MestreHotPointsBanner'), 'MestrePedagogyDashboard.jsx doit conserver le bandeau Top 3 des Points Chauds');
console.log('✅ 3/4 Présence et raccordement de SignalTimelineModal, PieceReflexConfigModal et MestreChallengesCompactBar validés.');

// ---------------------------------------------------------------------------
// 4. Respect strict <= 140 lignes, 0 apostrophe sur noms d'applications & parité fr.js / pt.js
// ---------------------------------------------------------------------------
const mission4Files = [
  'src/utils/signalTimelineUtils.js',
  'src/components/pedagogy/SignalTimelineModal.jsx',
  'src/components/pedagogy/conductor/SignalTimelineBoard.jsx',
  'src/utils/reflexPatternCatalog.js',
  'src/utils/reflexGameUtils.js',
  'src/hooks/useReflexGameSession.js',
  'src/components/pedagogy/ReflexGameModal.jsx',
  'src/components/pedagogy/PieceDirectionChallengesBar.jsx',
  'src/components/pedagogy/AisancePieceAccordionRow.jsx',
  'src/components/member/MemberPieceUnfoldedContent.jsx',
  'src/components/pedagogy/AtelierEntrainement.jsx',
  'src/components/mestre/reflex/SignalReflexCard.jsx',
  'src/components/mestre/PieceReflexConfigModal.jsx',
  'src/components/member/PieceSignalsModal.jsx',
  'src/components/mestre/MestreChallengesCompactBar.jsx',
  'src/components/mestre/MestreHotPointsBanner.jsx',
  'src/hooks/useMestrePedagogyData.js',
  'src/utils/mestreHotPointsUtils.js',
  'src/utils/mestrePedagogyActions.js',
  'src/components/mestre/MestrePedagogyDashboard.jsx'
];

const forbiddenApostropheRegex = /(Organizad|Sequenciad|Séquenciad|Cantad|Orquestrad|Orchestrad|Mostrad|Dançad)'[Oo]r/;

for (const rel of mission4Files) {
  const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const lineCount = content.split(/\r?\n/).length;
  assert.ok(lineCount <= 140, `Règle Anti-Monolithe violée : ${rel} fait ${lineCount} lignes (max 140)`);
  assert.ok(!forbiddenApostropheRegex.test(content), `Nomenclature violée (apostrophe détectée) dans ${rel}`);
}

function collectKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

const frReflexKeys = collectKeys(fr.pedagogy?.reflex, 'pedagogy.reflex');
const ptReflexKeys = collectKeys(pt.pedagogy?.reflex, 'pedagogy.reflex');
assert.deepEqual(frReflexKeys, ptReflexKeys, 'Parité stricte 1:1 requise entre fr.js et pt.js sur pedagogy.reflex');
console.log('✅ 4/4 Limite <= 140 lignes, 0 apostrophe et parité bilingue FR/PT-BR validées.');

console.log('🎉 Tous les tests de la Mission 4 sont passés avec succès !');
