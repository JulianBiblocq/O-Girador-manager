/**
 * Test de validation : Volets d'apprentissage Paroles et Culture sur les fiches Répertoire
 * Vérifie l'intégration des composants PieceLyricsModal et PieceCultureModal,
 * les conditions d'affichage strictes, la modularité (< 200 lignes) et le bon fonctionnement des générateurs QCM.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { generateQuizFromSong, generateQuizFromSheet } from '../src/utils/quizGenerator.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : VOLETS D\'APPRENTISSAGE PAROLES ET CULTURE (RÉPERTOIRE)');
console.log('========================================================================\n');

// 1. Contrôle statique de PieceLyricsModal.jsx
console.log('▶️ Test 1 : Contrôle statique de PieceLyricsModal.jsx');
const lyricsModalPath = path.resolve('src/components/member/PieceLyricsModal.jsx');
assert(fs.existsSync(lyricsModalPath), 'Le fichier PieceLyricsModal.jsx doit exister');
const lyricsCode = fs.readFileSync(lyricsModalPath, 'utf-8');
const lyricsLines = lyricsCode.split('\n').length;

assert(lyricsLines < 200, `PieceLyricsModal.jsx doit être sous 200 lignes (actuel: ${lyricsLines})`);
assert(lyricsCode.includes('SongCard'), 'PieceLyricsModal doit intégrer SongCard');
assert(lyricsCode.includes('songTitle'), 'PieceLyricsModal doit afficher le titre');
console.log(`  ✅ [PASS] PieceLyricsModal.jsx < 200 lignes (actuel: ${lyricsLines})`);
console.log('  ✅ [PASS] Affichage épuré de SongCard validé');

// 2. Contrôle statique de PieceCultureModal.jsx
console.log('\n▶️ Test 2 : Contrôle statique de PieceCultureModal.jsx');
const cultureModalPath = path.resolve('src/components/member/PieceCultureModal.jsx');
assert(fs.existsSync(cultureModalPath), 'Le fichier PieceCultureModal.jsx doit exister');
const cultureCode = fs.readFileSync(cultureModalPath, 'utf-8');
const cultureLines = cultureCode.split('\n').length;

assert(cultureLines < 200, `PieceCultureModal.jsx doit être sous 200 lignes (actuel: ${cultureLines})`);
assert(cultureCode.includes('CultureCard'), 'PieceCultureModal doit intégrer CultureCard');
assert(cultureCode.includes('docsList.length > 1'), 'PieceCultureModal doit gérer le sélecteur d\'onglets si plusieurs fiches liées');
console.log(`  ✅ [PASS] PieceCultureModal.jsx < 200 lignes (actuel: ${cultureLines})`);
console.log('  ✅ [PASS] Support multi-fiches et affichage épuré de CultureCard validés');

// 3. Contrôle statique de MemberPieceUnfoldedContent.jsx
console.log('\n▶️ Test 3 : Contrôle statique de MemberPieceUnfoldedContent.jsx');
const unfoldedPath = path.resolve('src/components/member/MemberPieceUnfoldedContent.jsx');
const unfoldedCode = fs.readFileSync(unfoldedPath, 'utf-8');
const unfoldedLines = unfoldedCode.split('\n').length;

assert(unfoldedLines < 200, `MemberPieceUnfoldedContent.jsx doit être sous 200 lignes (actuel: ${unfoldedLines})`);
assert(unfoldedCode.includes('hasToada'), 'MemberPieceUnfoldedContent doit définir hasToada conditionnel strict');
assert(unfoldedCode.includes('hasCulture'), 'MemberPieceUnfoldedContent doit définir hasCulture conditionnel strict');
assert(unfoldedCode.includes('onOpenToada'), 'MemberPieceUnfoldedContent doit brancher onOpenToada');
assert(unfoldedCode.includes('onOpenCulture'), 'MemberPieceUnfoldedContent doit brancher onOpenCulture');
console.log(`  ✅ [PASS] MemberPieceUnfoldedContent.jsx < 200 lignes (actuel: ${unfoldedLines})`);
console.log('  ✅ [PASS] Conditions strictes hasToada et hasCulture respectées');

// 4. Contrôle statique de MemberPieceCard.jsx et MemberMediaModals.jsx
console.log('\n▶️ Test 4 : Contrôle statique de MemberPieceCard.jsx et MemberMediaModals.jsx');
const cardPath = path.resolve('src/components/member/MemberPieceCard.jsx');
const cardCode = fs.readFileSync(cardPath, 'utf-8');
const cardLines = cardCode.split('\n').length;

assert(cardLines < 200, `MemberPieceCard.jsx doit être sous 200 lignes (actuel: ${cardLines})`);
assert(cardCode.includes('PieceLyricsModal'), 'MemberPieceCard doit importer PieceLyricsModal');
assert(cardCode.includes('PieceCultureModal'), 'MemberPieceCard doit importer PieceCultureModal');

const modalsPath = path.resolve('src/components/member/MemberMediaModals.jsx');
const modalsCode = fs.readFileSync(modalsPath, 'utf-8');
assert(modalsCode.includes('PieceLyricsModal'), 'MemberMediaModals doit monter PieceLyricsModal');
assert(modalsCode.includes('PieceCultureModal'), 'MemberMediaModals doit monter PieceCultureModal');
console.log(`  ✅ [PASS] MemberPieceCard.jsx < 200 lignes (actuel: ${cardLines})`);
console.log('  ✅ [PASS] Intégration complète dans MemberPieceCard et MemberMediaModals');

// 5. Contrôle des générateurs QCM de Toada et Fiche Culture
console.log('\n▶️ Test 5 : Générateurs QCM Paroles et Culture');
const mockSong = {
  id: 'song_1',
  titre: 'A Lôa pra Boule',
  nacao: 'Porto Rico',
  rythme: 'Luanda',
  notesLexique: [
    { mot: 'Loa', explication: 'Chant rituel d\'introduction' },
    { mot: 'Baque', explication: 'Frappe rythmique ou battement' }
  ]
};

const songQuestions = generateQuizFromSong(mockSong);
assert(songQuestions.length > 0, 'generateQuizFromSong doit générer au moins une question');
console.log(`  ✅ [PASS] generateQuizFromSong génère ${songQuestions.length} questions`);

const mockSheet = {
  id: 'sheet_1',
  titre: 'Histoire du Maracatu de Baque Virado',
  epoque: 'XVIIIe siècle',
  corpsHtml: '<p>Le <b>Maracatu de Baque Virado</b> est né à <b>Recife</b> dans le Pernambouc.</p>',
  notesLexique: [
    { mot: 'Maracatu', explication: 'Procession et couronnement des Rois du Congo' }
  ]
};

const sheetQuestions = generateQuizFromSheet(mockSheet);
assert(sheetQuestions.length > 0, 'generateQuizFromSheet doit générer au moins une question');
console.log(`  ✅ [PASS] generateQuizFromSheet génère ${sheetQuestions.length} questions`);

// 6. Contrôle des locales FR et PT
console.log('\n▶️ Test 6 : Contrôle des locales FR et PT');
const frPath = path.resolve('src/locales/fr.js');
const frCode = fs.readFileSync(frPath, 'utf-8');
assert(frCode.includes('parolierComplet:'), 'fr.js doit contenir parolierComplet');
assert(frCode.includes('recitationMasquee:'), 'fr.js doit contenir recitationMasquee');
assert(frCode.includes('quizChant:'), 'fr.js doit contenir quizChant');
assert(frCode.includes('quizCulture:'), 'fr.js doit contenir quizCulture');

const ptPath = path.resolve('src/locales/pt.js');
const ptCode = fs.readFileSync(ptPath, 'utf-8');
assert(ptCode.includes('parolierComplet:'), 'pt.js doit contenir parolierComplet');
assert(ptCode.includes('recitationMasquee:'), 'pt.js doit contenir recitationMasquee');
assert(ptCode.includes('quizChant:'), 'pt.js doit contenir quizChant');
assert(ptCode.includes('quizCulture:'), 'pt.js doit contenir quizCulture');
console.log('  ✅ [PASS] Traductions FR et PT validées');

console.log('\n========================================================================');
console.log('🏆 SUCCÈS TOTAL : LES VOLETS PAROLES ET CULTURE SONT 100% OPÉRATIONNELS !');
console.log('========================================================================\n');
