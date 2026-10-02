// Test de validation de l'internationalisation FR / PT-BR — Atelier d'Entraînement, Cartes de Jeu & Runner de Quiz
import fs from 'fs';
import path from 'path';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log('========================================================================');
console.log('🧪 TEST MISSION : INTERNATIONALISATION ATELIER D\'ENTRAÎNEMENT & QUIZ (FR / PT)');
console.log('========================================================================\n');

let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedAssertions++;
  }
}

// -----------------------------------------------------------------------------
// 1. Contrôle de parité des clés de la mission sous pedagogy dans fr.js et pt.js
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Contrôle de parité des clés cibles dans fr.js et pt.js');

const targetKeys = [
  // Invite de session rapide
  'btnStartSession',
  'btnLater',

  // Hub de l'Atelier d'Entraînement
  'trainingHubTitle',
  'trainingHubSubtitle',
  'liveRodaStatsTitle',
  'liveRodaStatsSubtitle',
  'statPlayed',
  'statWins',
  'statPodiums',

  // Cartes des modes de jeu
  'cardSongsTitle',
  'cardSongsDesc',
  'btnLaunchRevision',
  'cardLiveQuizTitle',
  'cardLiveQuizDesc',
  'btnLaunchChallenge',
  'cardCultureQuizTitle',
  'cardCultureQuizDesc',
  'btnLaunchQuiz',

  // Écran du Quiz en cours
  'backToWorkshop',
  'btnQuitTraining',
  'questionProgress',
  'translatePrompt'
];

targetKeys.forEach(k => {
  assert(fr.pedagogy && typeof fr.pedagogy[k] === 'string' && fr.pedagogy[k].length > 0, `Clé fr.pedagogy.${k} présente et non-vide`);
  assert(pt.pedagogy && typeof pt.pedagogy[k] === 'string' && pt.pedagogy[k].length > 0, `Clé pt.pedagogy.${k} présente et non-vide`);
});

// -----------------------------------------------------------------------------
// 2. Contrôle de DailyRevisionSession.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Contrôle des clés i18n dans DailyRevisionSession.jsx');
const dailySessionPath = path.resolve('src/components/pedagogy/DailyRevisionSession.jsx');
assert(fs.existsSync(dailySessionPath), 'DailyRevisionSession.jsx existe');

if (fs.existsSync(dailySessionPath)) {
  const src = fs.readFileSync(dailySessionPath, 'utf8');
  assert(src.includes("t('pedagogy.btnStartSession'"), 'Bouton démarrer branché sur t(pedagogy.btnStartSession)');
  assert(src.includes("t('pedagogy.btnLater')"), 'Bouton plus tard branché sur t(pedagogy.btnLater)');
}

// -----------------------------------------------------------------------------
// 3. Contrôle de AtelierEntrainement.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Contrôle des clés i18n dans AtelierEntrainement.jsx');
const atelierPath = path.resolve('src/components/pedagogy/AtelierEntrainement.jsx');
assert(fs.existsSync(atelierPath), 'AtelierEntrainement.jsx existe');

if (fs.existsSync(atelierPath)) {
  const src = fs.readFileSync(atelierPath, 'utf8');
  assert(src.includes("t('pedagogy.trainingHubTitle')"), 'Titre hub branché sur t(pedagogy.trainingHubTitle)');
  assert(src.includes("t('pedagogy.trainingHubSubtitle')"), 'Sous-titre hub branché sur t(pedagogy.trainingHubSubtitle)');
  assert(src.includes("t('pedagogy.cardSongsTitle')"), 'Carte chants branchée sur t(pedagogy.cardSongsTitle)');
  assert(src.includes("t('pedagogy.cardSongsDesc')"), 'Description chants branchée sur t(pedagogy.cardSongsDesc)');
  assert(src.includes("t('pedagogy.btnLaunchRevision')"), 'Bouton chants branché sur t(pedagogy.btnLaunchRevision)');
  assert(src.includes("t('pedagogy.cardLiveQuizTitle')"), 'Carte live quiz branchée sur t(pedagogy.cardLiveQuizTitle)');
  assert(src.includes("t('pedagogy.cardLiveQuizDesc')"), 'Description live quiz branchée sur t(pedagogy.cardLiveQuizDesc)');
  assert(src.includes("t('pedagogy.btnLaunchChallenge')"), 'Bouton live quiz branché sur t(pedagogy.btnLaunchChallenge)');
  assert(src.includes("t('pedagogy.cardCultureQuizTitle')"), 'Carte culture branchée sur t(pedagogy.cardCultureQuizTitle)');
  assert(src.includes("t('pedagogy.cardCultureQuizDesc')"), 'Description culture branchée sur t(pedagogy.cardCultureQuizDesc)');
  assert(src.includes("t('pedagogy.btnLaunchQuiz')"), 'Bouton culture branché sur t(pedagogy.btnLaunchQuiz)');
  assert(src.includes("t('pedagogy.backToWorkshop')"), 'Lien retour branché sur t(pedagogy.backToWorkshop)');
}

// -----------------------------------------------------------------------------
// 4. Contrôle de GameStatsCard.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Contrôle des clés i18n dans GameStatsCard.jsx');
const statsCardPath = path.resolve('src/components/games/GameStatsCard.jsx');
assert(fs.existsSync(statsCardPath), 'GameStatsCard.jsx existe');

if (fs.existsSync(statsCardPath)) {
  const src = fs.readFileSync(statsCardPath, 'utf8');
  assert(src.includes("t('pedagogy.liveRodaStatsTitle')"), 'Titre stats branché sur t(pedagogy.liveRodaStatsTitle)');
  assert(src.includes("t('pedagogy.liveRodaStatsSubtitle')"), 'Sous-titre stats branché sur t(pedagogy.liveRodaStatsSubtitle)');
  assert(src.includes("t('pedagogy.statPlayed')"), 'Compteur parties branché sur t(pedagogy.statPlayed)');
  assert(src.includes("t('pedagogy.statWins')"), 'Compteur victoires branché sur t(pedagogy.statWins)');
  assert(src.includes("t('pedagogy.statPodiums')"), 'Compteur podiums branché sur t(pedagogy.statPodiums)');
}

// -----------------------------------------------------------------------------
// 5. Contrôle de AutoEvalQuiz.jsx et AutoEvalQuizContainer.jsx
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Contrôle des écrans de jeu du Quiz');
const quizPath = path.resolve('src/components/pedagogy/AutoEvalQuiz.jsx');
const containerPath = path.resolve('src/components/student/AutoEvalQuizContainer.jsx');
assert(fs.existsSync(quizPath), 'AutoEvalQuiz.jsx existe');
assert(fs.existsSync(containerPath), 'AutoEvalQuizContainer.jsx existe');

if (fs.existsSync(quizPath)) {
  const src = fs.readFileSync(quizPath, 'utf8');
  assert(src.includes("t('pedagogy.questionProgress'"), 'Progression questions branchée sur t(pedagogy.questionProgress)');
  assert(src.includes("t('pedagogy.translatePrompt'"), 'Consigne de traduction branchée sur t(pedagogy.translatePrompt)');
  assert(src.includes("t('pedagogy.btnQuitTraining')"), 'Bouton quitter entraînement branché sur t(pedagogy.btnQuitTraining)');
}

if (fs.existsSync(containerPath)) {
  const src = fs.readFileSync(containerPath, 'utf8');
  assert(src.includes("t('pedagogy.questionProgress'"), 'Container: progression questions branchée sur t(pedagogy.questionProgress)');
  assert(src.includes("t('pedagogy.translatePrompt'"), 'Container: consigne de traduction branchée sur t(pedagogy.translatePrompt)');
  assert(src.includes("t('pedagogy.btnQuitTraining')"), 'Container: bouton quitter entraînement branché sur t(pedagogy.btnQuitTraining)');
  assert(src.includes("t('pedagogy.backToWorkshop')"), 'Container: lien retour branché sur t(pedagogy.backToWorkshop)');
}

// -----------------------------------------------------------------------------
// 6. Test d'interpolation dynamique des paramètres
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 6 : Test d\'interpolation dynamique des variables');
function interpolate(template, params) {
  let str = template;
  Object.keys(params).forEach(k => {
    str = str.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, 'g'), params[k]);
  });
  return str;
}

const interpStartFr = interpolate(fr.pedagogy.btnStartSession, { count: 12 });
const interpStartPt = interpolate(pt.pedagogy.btnStartSession, { count: 12 });
assert(interpStartFr === "Démarrer la session (12)", `Interpolation FR btnStartSession : ${interpStartFr}`);
assert(interpStartPt === "Iniciar a sessão (12)", `Interpolation PT btnStartSession : ${interpStartPt}`);

const interpProgFr = interpolate(fr.pedagogy.questionProgress, { current: 3, total: 10 });
const interpProgPt = interpolate(pt.pedagogy.questionProgress, { current: 3, total: 10 });
assert(interpProgFr === "QUESTION 3 / 10", `Interpolation FR questionProgress : ${interpProgFr}`);
assert(interpProgPt === "PERGUNTA 3 / 10", `Interpolation PT questionProgress : ${interpProgPt}`);

const interpTransFr = interpolate(fr.pedagogy.translatePrompt, { term: "alfaia" });
const interpTransPt = interpolate(pt.pedagogy.translatePrompt, { term: "alfaia" });
assert(interpTransFr === "Traduis : alfaia", `Interpolation FR translatePrompt : ${interpTransFr}`);
assert(interpTransPt === "Traduza: alfaia", `Interpolation PT translatePrompt : ${interpTransPt}`);

console.log('\n========================================================================');
if (failedAssertions === 0) {
  console.log('🏆 TOUS LES TESTS ATELIER ET QUIZ SONT 100% VALIDÉS AVEC SUCCÈS !');
  console.log('========================================================================');
  process.exit(0);
} else {
  console.error(`❌ ÉCHEC : ${failedAssertions} assertion(s) non validée(s).`);
  console.log('========================================================================');
  process.exit(1);
}
