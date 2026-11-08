/**
 * Script de validation de la Mission 3 :
 * Purge stricte des noms d'applications (zéro apostrophe) & Unification Répertoire ⇄ Carnet ⇄ Répétition.
 *
 * Vérifie :
 * 1. 0 occurrence de /(Organizad|Sequenciad|Séquenciad|Cantad|Orquestrad|Orchestrad|Mostrad|Dançad)'[Oo]r/ dans src/
 * 2. Le dédoublonnage strict de resolvePieceTrainings (combinaison presetId + trainingIds + excludedTrainingIds)
 * 3. La présence des passerelles Cantador, PieceRevisionRunner et des 3 paliers vocaux sur la vue Répertoire Membre
 * 4. La conformité de la limite de lignes (<= 140 lignes, <= 60 pour resolvePieceTrainings.js) et la parité 1:1 fr.js / pt.js
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePieceTrainings } from '../src/utils/resolvePieceTrainings.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function countLines(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return content.split(/\r?\n/).length;
}

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function walkFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile() && /\.(js|jsx|mjs)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

console.log('🧪 Démarrage des tests Mission 3 (Purge Nomenclature & Unification Répertoire)...');

// 1. Vérification Zéro Apostrophe dans src/locales/, src/components/pedagogy/ et tout src/
const APOSTROPHE_REGEX = /(Organizad|Sequenciad|Séquenciad|Cantad|Orquestrad|Orchestrad|Mostrad|Dançad)['’][Oo]r/g;
const srcFiles = walkFiles(path.join(ROOT, 'src'));
const violations = [];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(APOSTROPHE_REGEX);
  if (matches && matches.length > 0) {
    violations.push(`${path.relative(ROOT, file)}: ${matches.join(', ')}`);
  }
}
assert.equal(
  violations.length,
  0,
  `Violation Zéro Apostrophe détectée dans src/ :\n${violations.join('\n')}`
);
console.log('  ✅ 0 occurrence de nom d’application avec apostrophe dans tout src/');

// 2. Test unitaire de resolvePieceTrainings (combinaison presetId + trainingIds + excludedTrainingIds + dédoublonnage)
const resolveLines = countLines('src/utils/resolvePieceTrainings.js');
assert.ok(
  resolveLines <= 60,
  `src/utils/resolvePieceTrainings.js dépasse 60 lignes (${resolveLines} lignes)`
);

const mockTrainings = [
  { id: 'tr-auto-1', title: 'Baque Base', presetId: 'preset-baque-1', startBpm: 70, targetBpm: 110, stepBpm: 20 },
  { id: 'tr-auto-1', title: 'Baque Base Doublon', presetId: 'preset-baque-1', startBpm: 70, targetBpm: 110, stepBpm: 20 },
  { id: 'tr-auto-excluded', title: 'Baque Détaché', presetId: 'preset-baque-1', startBpm: 80, targetBpm: 120, stepBpm: 20 },
  { id: 'tr-shared-loopback', title: 'Virada Partagée', presetId: 'other-preset', startBpm: 60, targetBpm: 100, stepBpm: 20 },
  { id: 'tr-unrelated', title: 'Autre Morceau', presetId: 'unrelated-preset', startBpm: 60, targetBpm: 90, stepBpm: 15 }
];

const resolved = resolvePieceTrainings(
  {
    id: 'piece-1',
    sequenceurId: 'preset-baque-1',
    trainingIds: ['tr-auto-1', 'tr-shared-loopback'],
    excludedTrainingIds: ['tr-auto-excluded']
  },
  mockTrainings
);

assert.equal(resolved.length, 2, 'resolvePieceTrainings doit retourner exactement 2 entraînements dédoublonnés');
assert.deepEqual(
  resolved.map((t) => t.id),
  ['tr-auto-1', 'tr-shared-loopback'],
  'resolvePieceTrainings doit combiner presetId + trainingIds et exclure excludedTrainingIds sans doublon'
);
console.log('  ✅ resolvePieceTrainings.js (<= 60 lignes) : dédoublonnage et partage Loopback validés');

// 3. Vérification de la limite <= 140 lignes sur tous les fichiers créés ou refondus
const FILES_LIMIT_140 = [
  'src/components/member/MemberPieceCard.jsx',
  'src/components/member/MemberPieceUnfoldedContent.jsx',
  'src/components/member/MemberRepertoireView.jsx',
  'src/components/member/PieceQuizModal.jsx',
  'src/components/mestre/RepertoireTrainingsManager.jsx',
  'src/components/pedagogy/TrainingCompactCard.jsx',
  'src/components/pedagogy/MonCarnetAisance.jsx',
  'src/components/pedagogy/AisancePieceAccordionRow.jsx',
  'src/components/pedagogy/PieceRevisionRunner.jsx',
  'src/utils/pedagogicalLexiconPool.js'
];

for (const relPath of FILES_LIMIT_140) {
  const lines = countLines(relPath);
  assert.ok(lines <= 140, `${relPath} dépasse 140 lignes (${lines} lignes)`);
  console.log(`  ✅ ${relPath} : ${lines} lignes (<= 140)`);
}

// 4. Vérification de l'unification sur la vue Répertoire Membre (Cantador, PieceRevisionRunner, 3 paliers vocaux)
const cardSrc = readSource('src/components/member/MemberPieceCard.jsx');
const unfoldedSrc = readSource('src/components/member/MemberPieceUnfoldedContent.jsx');
const quizModalSrc = readSource('src/components/member/PieceQuizModal.jsx');
const managerSrc = readSource('src/components/mestre/RepertoireTrainingsManager.jsx');

assert.ok(cardSrc.includes('launchCantador') && cardSrc.includes("mode: 'eleve'"), 'MemberPieceCard doit intégrer launchCantador en mode eleve');
assert.ok(unfoldedSrc.includes("'coro'") && unfoldedSrc.includes("'simultane'") && unfoldedSrc.includes("'puxador'"), 'MemberPieceUnfoldedContent doit afficher les 3 paliers vocaux');
assert.ok(quizModalSrc.includes('PieceRevisionRunner'), 'PieceQuizModal doit ouvrir PieceRevisionRunner');
assert.ok(managerSrc.includes('resolvePieceTrainings'), 'RepertoireTrainingsManager doit utiliser resolvePieceTrainings');
console.log('  ✅ Unification Répertoire Membre (3 paliers vocaux, Cantador, PieceRevisionRunner) validée');

// 5. Parité stricte 1:1 entre fr.js et pt.js
const frKeys = flattenKeys(fr);
const ptKeys = flattenKeys(pt);
const frSet = new Set(frKeys);
const ptSet = new Set(ptKeys);
const missingInPt = frKeys.filter((k) => !ptSet.has(k));
const missingInFr = ptKeys.filter((k) => !frSet.has(k));

assert.equal(missingInPt.length, 0, `Clés manquantes dans pt.js : ${missingInPt.join(', ')}`);
assert.equal(missingInFr.length, 0, `Clés manquantes dans fr.js : ${missingInFr.join(', ')}`);
console.log(`  ✅ Parité stricte 1:1 entre fr.js et pt.js (${frKeys.length} clés)`);

console.log('🎉 Tous les tests de la Mission 3 sont passés avec succès !');

