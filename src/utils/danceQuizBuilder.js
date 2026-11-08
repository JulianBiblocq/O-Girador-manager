// Générateur de questions Danse, Pas Dançador et Postures d'Orixás (<= 120 lignes)
import { distractorPool } from '../data/distractorPool.js';
import { cleanPromptTitle, sanitizeQuizText, sanitizeQuizQuestions } from './quizSanitizer.js';
import { buildDeterministicQuizQuestionId } from './quizOverrideKeyHelper.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const ORIXA_POSTURE_PROFILES = [
  { key: 'oxum', match: /oxum/i, label: 'Oxum', posture: "Mouvement fluide d'eau douce et regard au miroir avec l'abebé doré", attribute: 'Abebé doré et mouvement d’eau douce' },
  { key: 'iemanja', match: /iemanj[aá]|yemanj[aá]/i, label: 'Iemanjá', posture: "Ondulation ample des vagues océaniques avec l'abebé argenté", attribute: 'Abebé argenté et geste des vagues' },
  { key: 'xango', match: /xang[oô]/i, label: 'Xangô', posture: "Posture royale altière brandissant la double hache oxê", attribute: 'Oxê et frappe royale' },
  { key: 'ogum', match: /ogum|ogun/i, label: 'Ogum', posture: "Pas de coupe guerrier ouvrant le chemin au sabre alfanje", attribute: 'Alfanje et mouvement de coupe' },
  { key: 'iansa', match: /ians[aã]|oy[aá]/i, label: 'Iansã', posture: "Tourbillon vif des vents et maniement de l'éventail eruexim", attribute: 'Eruexim et tourbillon des vents' },
  { key: 'oxossi', match: /ox[oó]ssi|od[eé]/i, label: 'Oxóssi', posture: "Pas agile de chasseur tendant l'arc et la flèche ofá", attribute: 'Ofá et pas d’affût' },
];

const FALLBACK_POSTURES = ORIXA_POSTURE_PROFILES.map((p) => p.posture);

export function buildPieceDanceAndPostureQuestions(pieceDoc, contextData = {}, config = {}) {
  if (!pieceDoc) return [];
  const t = config.t || contextData.t || ((_k, fb) => fb || _k);
  const questions = [];
  const pieceTitle = cleanPromptTitle(pieceDoc.titre || pieceDoc.title || 'ce morceau');
  const audioUrl = pieceDoc.activeAudioUrl || pieceDoc.audioUrl || contextData.presetData?.audioUrl || null;

  // 1. Question Rythme / Audio ➔ Pas ou Chorégraphie Dançador
  const choreo = pieceDoc.activeChoreography || contextData.choreography || (contextData.allChoreographies || []).find((c) => c.id === pieceDoc.dancadorChoreoId);
  const linkedStepName = sanitizeQuizText(pieceDoc.pasDeBase || choreo?.pasDeBase || choreo?.nom || (pieceDoc.rythme ? `Pas de base ${pieceDoc.rythme}` : ''));
  if (choreo || pieceDoc.dancadorChoreoId || pieceDoc.dancadorStepIds?.length || pieceDoc.pasDeBase) {
    const correctStep = linkedStepName || 'Pas de base Baque Virado';
    const stepPool = [
      ...(contextData.stepsData || []).map((s) => sanitizeQuizText(s.nom)),
      ...(distractorPool.fallbacksDanseNoms || ['Pas de Luanda', 'Croisé de Cortejo', 'Rebond Royal', 'Balanço de Dama']),
    ].filter((s) => s && s.toLowerCase() !== correctStep.toLowerCase());
    const wrongs = Array.from(new Set(shuffle(stepPool))).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceDoc.id, category: 'repertoire', questionType: 'danse_pas', targetField: 'danse_pas' });
    questions.push({
      id: detId, deterministicId: detId, sourceId: pieceDoc.id, category: 'repertoire',
      type: 'danse_pas', targetField: 'danse_pas', audioUrl,
      instruction: t('pedagogyQuiz.danceInstruction', 'Danse & Gestuelle Dançador'),
      questionText: `À l'écoute ou au chant de ${pieceTitle}, quel pas ou enchaînement corporel Dançador est associé ?`,
      choices: shuffle([{ text: correctStep, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: correctStep,
      feedback: `Sur ${pieceTitle}, la posture et le pas associés sont : ${correctStep}.`,
    });
  }

  // 2. Question Chant / Audio / Culture ➔ Posture corporelle & Attributs d'Orixá
  const cIds = [...(pieceDoc.cultureDocIds || []), ...(pieceDoc.cultureDocId ? [pieceDoc.cultureDocId] : [])];
  const cDocs = [
    ...(contextData.cultureDoc ? [contextData.cultureDoc] : []),
    ...(pieceDoc.activeCultureDocs || []),
    ...(pieceDoc.activeCultureDoc ? [pieceDoc.activeCultureDoc] : []),
    ...(contextData.allSheetsData || []).filter((s) => cIds.includes(s.id)),
  ].filter(Boolean);
  const searchCorpus = [
    pieceDoc.titre, pieceDoc.orixa, pieceDoc.notes, contextData.toadaDoc?.titre, contextData.toadaDoc?.paroles,
    ...cDocs.flatMap((d) => [d.personnageOrisha, d.titre, d.symbolesSacres, d.danseData?.nomDuGeste, d.danseData?.descriptionGeste]),
  ].filter(Boolean).join(' ');

  const matchedOrixa = ORIXA_POSTURE_PROFILES.find((p) => p.match.test(searchCorpus));
  const customGeste = cDocs.find((d) => d.danseData?.nomDuGeste || d.danseData?.descriptionGeste);
  if (matchedOrixa || customGeste) {
    const correctPosture = sanitizeQuizText(customGeste?.danseData?.nomDuGeste || matchedOrixa?.posture || FALLBACK_POSTURES[0]);
    const orixaLabel = cleanPromptTitle(customGeste?.personnageOrisha || matchedOrixa?.label || pieceTitle);
    const wrongs = shuffle(FALLBACK_POSTURES.filter((p) => p.toLowerCase() !== correctPosture.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceDoc.id, category: 'repertoire', questionType: 'danse_posture_orixa', targetField: 'posture_orixa' });
    questions.push({
      id: detId, deterministicId: detId, sourceId: pieceDoc.id, category: 'repertoire',
      type: 'danse_posture_orixa', targetField: 'posture_orixa', audioUrl,
      instruction: t('pedagogyQuiz.danceInstruction', 'Posture & Attributs d’Orixá'),
      questionText: `Quelle posture corporelle et quel attribut incarnent ${orixaLabel} sur le morceau ${pieceTitle} ?`,
      choices: shuffle([{ text: correctPosture, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: correctPosture,
      feedback: `La posture associée à ${orixaLabel} est : ${correctPosture}.`,
    });
  }
  return questions;
}

export function generateQuizFromDancador(stepsData = [], config = {}) {
  if (!Array.isArray(stepsData) || stepsData.length === 0) return [];
  const t = config.t || ((_k, fb) => fb || _k);
  const allNames = stepsData.map((s) => s.nom).filter(Boolean);
  const allFamilies = [...new Set(stepsData.map((s) => s.famille).filter(Boolean))];
  const qs = [];
  stepsData.forEach((step) => {
    if (step.vignetteUrl && step.nom) {
      const wrongs = shuffle([...allNames.filter((n) => n !== step.nom), ...(distractorPool.fallbacksDanseNoms || [])]).slice(0, 3);
      qs.push({
        id: buildDeterministicQuizQuestionId({ sourceId: step.id, category: 'danse', targetField: 'visuel' }),
        type: 'danse_reconnaissance', imageUrl: step.vignetteUrl,
        instruction: t('pedagogyQuiz.danceVisualInstruction', 'Reconnaissance Visuelle'),
        questionText: t('pedagogyQuiz.danceVisualQuestion', "Comment s'appelle ce pas de danse ?"),
        choices: shuffle([{ text: step.nom, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
        feedback: `Ce pas s'appelle bien "${step.nom}".`,
      });
    }
    if (step.famille && step.nom) {
      const cleanNom = cleanPromptTitle(step.nom, step.famille);
      const wrongs = shuffle([...allFamilies.filter((f) => f !== step.famille), ...(distractorPool.fallbackDanseFamilles || [])]).slice(0, 3);
      qs.push({
        id: buildDeterministicQuizQuestionId({ sourceId: step.id, category: 'danse', targetField: 'famille' }),
        type: 'danse_famille',
        instruction: t('pedagogyQuiz.danceFamilyInstruction', 'Famille de pas'),
        questionText: `À quelle famille appartient le pas "${cleanNom}" ?`,
        choices: shuffle([{ text: step.famille, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
        feedback: `Le pas "${cleanNom}" appartient à la famille "${step.famille}".`,
      });
    }
  });
  return sanitizeQuizQuestions(shuffle(qs)).slice(0, config.questionCount || 10);
}
