// Constructeur de questions thématiques pour les fiches Culture (Orixás, Cortège, Cuisine, Style, Territoire) (<= 140 lignes)
import { distractorPool } from '../../data/distractorPool.js';
import { cleanPromptTitle, cleanChoiceText } from '../quizSanitizer.js';
import { buildDeterministicQuizQuestionId } from '../quizOverrideKeyHelper.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function getDistractors(pools, needed = 3, currentVal = '') {
  const result = [];
  for (const pool of pools) {
    for (const item of shuffle(pool || [])) {
      if (result.length >= needed) return result;
      if (item && !result.includes(item) && String(item).toLowerCase() !== String(currentVal).toLowerCase()) {
        result.push(item);
      }
    }
  }
  return result;
}

export function buildCultureFicheQuestions(sheetData, allSheetsData = [], config = {}) {
  const questions = [];
  if (!sheetData || sheetData.type !== 'culture_fiche') return questions;
  const docId = sheetData.id || 'doc';
  const t = config.t || ((_k, fb) => fb || _k);
  const isOrixa = sheetData.themeCulture === 'orixas';
  const isCortejo = /cort(ejo|ège)/i.test(sheetData.themeCulture || '');
  const isCuisine = /cuisine/i.test(sheetData.categorieFiche || sheetData.themeCulture || '');
  const isStyle = /styles de musique/i.test(sheetData.categorieFiche || sheetData.themeCulture || '');
  const isTerritoire = /territoire/i.test(sheetData.categorieFiche || sheetData.themeCulture || '');

  // 1. Orixás : Devinette visuelle, Identité, Outil sacré, Élément & Geste
  if (isOrixa && sheetData.personnageOrisha && sheetData.stampKey && sheetData.couleursTheme) {
    const wrong = getDistractors([distractorPool.orixasNames], 3, sheetData.personnageOrisha);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'orixa' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_visuel_orixa', sourceId: docId, category: 'culture', targetField: 'orixa',
      type: 'devinette_visuelle', instruction: t('pedagogyQuiz.visualRiddleInstruction', 'Devinette visuelle'),
      questionText: "De quel Orixá s'agit-il ?",
      visualElement: { type: 'orixaBadge', stampKey: sheetData.stampKey, couleurs: sheetData.couleursTheme },
      choices: shuffle([{ text: sheetData.personnageOrisha, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `C'est bien ${sheetData.personnageOrisha}.`,
    });
  }

  if (isOrixa && sheetData.personnageOrisha) {
    let correctTitle = sheetData.titre || sheetData.name || '';
    if (correctTitle.includes(sheetData.personnageOrisha)) {
      correctTitle = correctTitle.replace(new RegExp(`${sheetData.personnageOrisha}[,\\s-]*`, 'gi'), '').trim();
    }
    correctTitle = cleanPromptTitle(correctTitle);
    if (correctTitle) {
      const wrong = shuffle(distractorPool.orixasTitles || []).slice(0, 3);
      const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'identite' });
      questions.push({
        id: detId, deterministicId: detId, legacyId: 'qcm_auto_qui_est', sourceId: docId, category: 'culture', targetField: 'identite',
        type: 'culture', instruction: t('pedagogyQuiz.identityInstruction', 'Identité'),
        questionText: `Qui est ${sheetData.personnageOrisha} ?`,
        choices: shuffle([{ text: correctTitle, isCorrect: true }, ...wrong.map((w) => ({ text: cleanPromptTitle(w), isCorrect: false }))]),
        feedback: `${sheetData.personnageOrisha} est : ${correctTitle}.`,
      });
    }
  }

  if (isOrixa && sheetData.symbolesSacres) {
    const cleanOrixa = cleanPromptTitle(sheetData.personnageOrisha || 'cette divinité');
    const cleanTool = cleanChoiceText(sheetData.symbolesSacres, cleanOrixa);
    const wrong = shuffle((distractorPool.orixasTools || []).map((w) => cleanChoiceText(w, cleanOrixa)).filter((w) => !w.toLowerCase().includes(sheetData.symbolesSacres.toLowerCase()))).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'symbole_orixa' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_outil', sourceId: docId, category: 'culture', targetField: 'symbole_orixa',
      type: 'culture', instruction: t('pedagogyQuiz.toolInstruction', 'Outil sacré'),
      questionText: `Quel est le symbole sacré (outil) associé à ${cleanOrixa} ?`,
      choices: shuffle([{ text: cleanTool, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `L'outil correct est : ${cleanTool}.`,
    });
  }

  if (isOrixa && sheetData.elementNaturel) {
    const wrong = getDistractors([distractorPool.elementsNaturels], 3, sheetData.elementNaturel);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'element_naturel' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_element', sourceId: docId, category: 'culture', targetField: 'element_naturel',
      type: 'element_naturel', instruction: t('pedagogyQuiz.elementInstruction', 'Élément Naturel'),
      questionText: `Quel est l'élément naturel associé à ${sheetData.personnageOrisha} ?`,
      choices: shuffle([{ text: sheetData.elementNaturel, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `L'élément naturel correct est ${sheetData.elementNaturel}.`,
    });
  }

  if (sheetData.danseData?.nomDuGeste || sheetData.danseData?.descriptionGeste) {
    const correctGeste = sheetData.danseData.nomDuGeste || `${sheetData.danseData.descriptionGeste.slice(0, 50)}...`;
    const wrong = getDistractors([distractorPool.danseGestes], 3, correctGeste);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'danse_geste' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_geste', sourceId: docId, category: 'culture', targetField: 'danse_geste',
      type: 'danse_geste', instruction: t('pedagogyQuiz.danceInstruction', 'Danse & Gestuelle'),
      questionText: 'Quel geste ou mouvement caractérise cette figure culturelle ?',
      choices: shuffle([{ text: correctGeste, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `Le geste correct est : ${correctGeste}.`,
    });
  }

  // 2. Géographie (Cortège, Cuisine, Style, Territoire)
  if ((isCortejo || isCuisine || isStyle || isTerritoire) && sheetData.villeRegion) {
    const cleanTitle = cleanPromptTitle(sheetData.titre, sheetData.villeRegion);
    const otherPlaces = allSheetsData.map((s) => s.villeRegion).filter((v) => v && v !== sheetData.villeRegion);
    const wrong = getDistractors([otherPlaces, distractorPool.villesCortejo, distractorPool.regionsCuisineStyle], 3, sheetData.villeRegion);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: 'geographie' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_geo_cortejo', sourceId: docId, category: 'culture', targetField: 'geographie',
      type: 'culture_geographie', instruction: 'Territoire & Région',
      questionText: `À quelle région ou ville est traditionnellement rattaché "${cleanTitle}" ?`,
      choices: shuffle([{ text: sheetData.villeRegion, isCorrect: true }, ...wrong.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `Cette référence est caractéristique de ${sheetData.villeRegion}.`,
    });
  }

  return questions;
}

