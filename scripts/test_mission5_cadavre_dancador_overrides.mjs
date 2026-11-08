import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  getActiveSeasonPieces, getPieceActiveInstruments, getPieceCultureBonus,
  buildCadavreRoundChallenge, getCircularActivePlayer, evaluateCadavreCouncilRound
} from '../src/utils/cadavreExquisGenerator.js';
import { buildDancadorUrl, launchDancador } from '../src/utils/dancadorLauncher.js';
import { buildPieceDanceAndPostureQuestions } from '../src/utils/danceQuizBuilder.js';
import { buildDeterministicQuizQuestionId, applyQuizOverrides } from '../src/utils/quizOverrideKeyHelper.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('🧪 TEST AUTOMATISÉ MISSION 5 : CADAVRE EXQUIS, PASSERELLE DANÇADOR & QUIZ OVERRIDES');

// 1. Génération des 5 maillons du Cadavre Exquis & saut propre du Maillon 5
const mockRepertoire = [
  {
    id: 'piece_luanda', titre: 'Baque de Luanda', statutSaison: 'saison', sequenceurId: 'seq_1',
    audioUrl: 'https://cdn.example.com/luanda.mp3', toadaDocId: 'toada_1',
    tracks: [
      { name: 'Alfaia Marcante', activeSteps: ['X', '-', '-', '-', 'X', '-', '-', '-'] },
      { name: 'Caixa', activeSteps: ['X', 'X', '-', 'X', 'X', '-', 'X', 'X'] },
      { name: 'Atabaque Silencieux', activeSteps: ['-', '-', '-', '-', '-', '-', '-', '-'] }
    ],
    sinaisDoMestre: [{ id: 'sig_1', name: 'Parada Temps 1', consigne: 'Arrêt franc' }]
  },
  {
    id: 'piece_sans_bonus', titre: 'Exercice Instrumental Pur', statutSaison: 'saison', sequenceurId: 'seq_2',
    tracks: [{ name: 'Gonguê', steps: ['X', '-', 'X', '-'] }]
  },
  { id: 'piece_archive', titre: 'Ancien Morceau', statutSaison: 'archive', sequenceurId: 'seq_old' }
];
const mockVaral = [{ id: 'toada_1', type: 'song', titre: 'Toada Luanda', paroles: 'Nagô Nagô rainha coroada\nViva Luanda' }];

const seasonPieces = getActiveSeasonPieces(mockRepertoire);
assert.strictEqual(seasonPieces.length, 2, 'Seuls les morceaux actifs de la saison doivent être retenus');

const activeInsts = getPieceActiveInstruments(mockRepertoire[0]);
assert.deepStrictEqual(activeInsts, ['Alfaia Marcante', 'Caixa'], 'Le pupitre silencieux doit être exclu');

const challengeWithBonus = buildCadavreRoundChallenge(mockRepertoire[0], 'Alfaia Marcante', mockRepertoire, [], mockVaral);
assert.ok(challengeWithBonus.pieceChoices.length >= 2, 'Maillon 1 (Morceau) généré');
assert.ok(challengeWithBonus.activeInstruments.includes('Alfaia Marcante'), 'Maillon 2 (Pupitre) généré');
assert.strictEqual(challengeWithBonus.patternStep.choices.length, 4, 'Maillon 3 (Tablature) : 1 vraie + 3 leurres');
assert.strictEqual(challengeWithBonus.signalStep.choices.length, 4, 'Maillon 4 (Signal Mestre) : 1 vrai + 3 leurres');
assert.ok(challengeWithBonus.bonusStep && challengeWithBonus.bonusStep.correctChoice.includes('Nagô'), 'Maillon 5 (Bonus Toada) généré');

const bonusSkipped = getPieceCultureBonus(mockRepertoire[1], mockVaral);
assert.strictEqual(bonusSkipped, null, 'Maillon 5 doit retourner null si ni toadaDocId ni cultureDocIds');
console.log('  ✅ [1/5] Extraction des 5 maillons du Cadavre Exquis et saut conditionnel validés.');

// 2. Rotation circulaire sur N manches & Conseil de Batterie (1000 / 500 / 0)
const playerOrder = ['uid_A', 'uid_B', 'uid_C'];
assert.strictEqual(getCircularActivePlayer(playerOrder, 0, 0), 'uid_A');
assert.strictEqual(getCircularActivePlayer(playerOrder, 0, 1), 'uid_B');
assert.strictEqual(getCircularActivePlayer(playerOrder, 1, 0), 'uid_B');
assert.strictEqual(getCircularActivePlayer(playerOrder, 2, 0), 'uid_C');

const evalPerfect = evaluateCadavreCouncilRound({ patternChoice: { isCorrect: true }, signalChoice: { isCorrect: true } }, {});
assert.strictEqual(evalPerfect.pointsEarned, 1000, '100 % exact = 1000 pts');
const evalSaved = evaluateCadavreCouncilRound(
  { patternChoice: { isCorrect: false }, signalChoice: { isCorrect: true } },
  { uid_B: { valid: false, suspectedStep: 'pattern' } }
);
assert.strictEqual(evalSaved.pointsEarned, 500, 'Faille exacte démasquée au Conseil = 500 pts (sauvetage solidaire)');
const evalFailed = evaluateCadavreCouncilRound(
  { patternChoice: { isCorrect: false }, signalChoice: { isCorrect: true } },
  { uid_B: { valid: true, suspectedStep: null } }
);
assert.strictEqual(evalFailed.pointsEarned, 0, 'Erreur non démasquée = 0 pt');
console.log('  ✅ [2/5] Rotation circulaire et barème du Conseil de Batterie (1000/500/0) validés.');

// 3. Passerelle Dançador (URLs SSO & Questions Danse / Postures Orixás)
const choreoUrl = await launchDancador({ choreoId: 'choreo_oxum', groupId: 'samambaia' }, { dryRun: true });
assert.strictEqual(choreoUrl, 'https://dancador.o-girador.com?choreoId=choreo_oxum&groupId=samambaia');
const stepUrl = buildDancadorUrl({ stepId: 'step_abebe', groupId: 'samambaia' });
assert.strictEqual(stepUrl, 'https://dancador.o-girador.com/player/step/step_abebe?groupId=samambaia');

const danceQs = buildPieceDanceAndPostureQuestions({ id: 'p_oxum', titre: 'Brilho de Oxum', dancadorChoreoId: 'choreo_oxum', orixa: 'Oxum' });
assert.strictEqual(danceQs.length, 2, 'Doit générer la question de pas Dançador et la question de posture Orixá');
assert.ok(danceQs.some((q) => q.correctAnswer.includes('abebé')), 'La posture Oxum (abebé) doit être présente');
console.log('  ✅ [3/5] Passerelle Dançador et questions corporelles/Orixás validées.');

// 4. Stabilité déterministe des quizOverrides Mestre
const keyBefore = buildDeterministicQuizQuestionId({ sourceId: 'doc_42', category: 'toada', targetField: 'refrain' });
const keyAfterTitleEdit = buildDeterministicQuizQuestionId({ sourceId: 'doc_42', category: 'toada', targetField: 'refrain', editedTitle: 'Nouveau Titre' });
assert.strictEqual(keyBefore, 'toada_doc_42_refrain');
assert.strictEqual(keyBefore, keyAfterTitleEdit, 'La clé déterministe reste identique après édition du texte');

const overridden = applyQuizOverrides(
  [{ id: keyBefore, questionText: 'Texte auto', choices: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] }],
  { [keyBefore]: { questionText: 'Question Mestre arbitrée', correctAnswer: 'Réponse Mestre', distractors: ['L1', 'L2', 'L3'] } }
);
assert.strictEqual(overridden[0].questionText, 'Question Mestre arbitrée');
assert.strictEqual(overridden[0].correctAnswer, 'Réponse Mestre');
console.log('  ✅ [4/5] Stabilité déterministe des quizOverrides Mestre validée.');

// 5. Parité i18n (fr.js / pt.js), zéro apostrophe et limite <= 140 lignes
const getKeys = (obj, p = '') => Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? getKeys(v, `${p}${k}.`) : `${p}${k}`));
assert.deepStrictEqual(getKeys(fr).sort(), getKeys(pt).sort(), 'Parité 1:1 stricte entre fr.js et pt.js');

const filesToCheck = [
  'src/utils/quizOverrideKeyHelper.js', 'src/utils/dancadorLauncher.js', 'src/utils/danceQuizBuilder.js',
  'src/utils/pieceRevisionQuizBuilder.js', 'src/utils/quizGenerator.js', 'src/utils/cadavreExquisGenerator.js',
  'src/hooks/useActiveGameRoom.js', 'src/components/games/cadavre/CadavreExquisArena.jsx',
  'src/components/games/cadavre/CadavreCouncilView.jsx', 'src/components/games/cadavre/CadavreSentenceView.jsx',
  'src/components/games/cadavre/CadavreStepPicker.jsx', 'src/components/member/MemberPieceUnfoldedContent.jsx',
  'src/components/pedagogy/AisancePieceAccordionRow.jsx', 'src/components/event-details/EventRevisionProgram.jsx',
  'src/components/mestre/CustomQuizConfigPanel.jsx', 'src/components/mestre/CustomQuizQuestionForm.jsx'
];
const aposRegex = /(Organizad|Sequenciad|Séquenciad|Cantad|Orquestrad|Orchestrad|Mostrad|Dançad)'[Oo]r/;
for (const rel of filesToCheck) {
  const content = fs.readFileSync(path.resolve(rel), 'utf8');
  const lines = content.split(/\r?\n/).length;
  assert.ok(lines <= 140, `${rel} dépasse 140 lignes (${lines})`);
  assert.ok(!aposRegex.test(content), `${rel} contient une apostrophe interdite sur un nom d'application`);
}
console.log('  ✅ [5/5] Parité FR/PT-BR, zéro apostrophe et respect strict <= 140 lignes validés.');
console.log('🏆 MISSION 5 : 100 % DES TESTS SONT VALIDÉS AVEC SUCCÈS !');
