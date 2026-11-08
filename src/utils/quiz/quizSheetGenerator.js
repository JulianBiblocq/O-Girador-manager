// Générateur de QCM pour les fiches Culture et Atelier (<= 140 lignes)
import { distractorPool } from '../../data/distractorPool.js';
import { sanitizeTextHole, sanitizeQuizQuestions, filterDistractorsByLength } from '../quizSanitizer.js';
import { buildDeterministicQuizQuestionId, applyQuizOverrides } from '../quizOverrideKeyHelper.js';
import { buildCultureFicheQuestions } from './quizSheetOrixaAndThemeBuilder.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export function parseLexiqueString(str) {
  if (!str || typeof str !== 'string') return [];
  const results = [];
  str.split('\n').forEach((line) => {
    const match = line.match(/^(?:\d*\*+)?\s*(.*?)\s*:\s*(.*)$/);
    if (match) results.push({ mot: match[1].trim(), explication: match[2].trim() });
  });
  return results;
}

export function getTransversalLexique(allSheetsData = [], allSongs = []) {
  const translations = new Set();
  if (Array.isArray(allSheetsData)) {
    allSheetsData.forEach((sheet) => {
      const lex = sheet?.lexique || sheet?.notesLexique;
      if (Array.isArray(lex)) lex.forEach((w) => { if (w?.fr || w?.explication) translations.add(w.fr || w.explication); });
    });
  }
  if (Array.isArray(allSongs)) {
    allSongs.forEach((song) => {
      const lex = typeof song?.notesLexique === 'string' ? parseLexiqueString(song.notesLexique) : song?.notesLexique;
      if (Array.isArray(lex)) lex.forEach((n) => { if (n?.explication) translations.add(n.explication); });
    });
  }
  (distractorPool.lexiqueSpecialise || []).forEach((item) => { if (item?.fr) translations.add(item.fr); });
  return Array.from(translations);
}

export function generateQuizFromSheet(sheetData, allSheetsData = [], allSongsData = [], config = {}) {
  if (!sheetData) return [];
  const docId = sheetData.id || 'sheet';
  const t = config.t || ((_k, fb) => fb || _k);
  const questions = [];

  // 1. QCM Texte à trous (balises <strong> ou <b> dans content ou corpsHtml)
  let fullText = sheetData.content || sheetData.corpsHtml || '';
  if (Array.isArray(sheetData.chapitres)) fullText += ' ' + sheetData.chapitres.map((c) => c.texte || '').join(' ');
  if (fullText) {
    const strongRegex = /<(strong|b)[^>]*>(.*?)<\/\1>/gi;
    let match;
    let strongIdx = 0;
    const fallbacks = distractorPool.materiauxEtLutherie || ['Calunga', 'Gonguê', 'Alfaia', 'Recife'];
    while ((match = strongRegex.exec(fullText)) !== null) {
      const word = match[2].replace(/<[^>]+>/g, '').trim();
      if (word.length <= 2 || word.length > 25 || word.split(/\s+/).length > 3) continue;
      strongIdx++;
      const phrase = fullText.substring(Math.max(0, match.index - 60), Math.min(fullText.length, match.index + match[0].length + 60)).replace(/<[^>]+>/g, ' ');
      const hole = sanitizeTextHole(phrase, word);
      if (!hole.isValid) continue;
      const wrongs = shuffle(fallbacks.filter((f) => f.toLowerCase() !== hole.cleanWord.toLowerCase())).slice(0, 3);
      const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: `hole_${strongIdx}` });
      questions.push({
        id: detId, deterministicId: detId, legacyId: `qcm_auto_culture_${strongIdx}`, sourceId: docId, category: 'culture', targetField: `hole_${strongIdx}`,
        type: 'culture', instruction: 'Quel mot manque dans cette phrase ?',
        questionText: `Dans ce contexte : "...${hole.phraseTrou}..."`,
        choices: shuffle([{ text: hole.cleanWord, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
        feedback: `Le bon mot était "${hole.cleanWord}".`,
      });
    }
  }

  // 2. QCM Lexique de la fiche (lexique ou notesLexique)
  const rawLex = Array.isArray(sheetData.lexique) ? sheetData.lexique : (Array.isArray(sheetData.notesLexique) ? sheetData.notesLexique : []);
  if (rawLex.length > 0) {
    const allTrans = getTransversalLexique(allSheetsData, allSongsData);
    rawLex.forEach((wordObj, i) => {
      const ptTerm = wordObj?.pt || wordObj?.mot;
      const frDef = wordObj?.fr || wordObj?.explication;
      if (!ptTerm || !frDef) return;
      let wrongs = filterDistractorsByLength(frDef, allTrans);
      if (wrongs.length < 3) {
        wrongs = [...wrongs, ...(distractorPool.fallbackFailsTraductions || []).filter((f) => f.toLowerCase() !== frDef.toLowerCase())].slice(0, 3);
      }
      const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: `lexique_${i}` });
      questions.push({
        id: detId, deterministicId: detId, legacyId: `qcm_auto_lexique_${i}`, sourceId: docId, category: 'culture', targetField: `lexique_${i}`,
        type: 'lexique', questionText: ptTerm, instruction: 'Que signifie ce terme ?',
        choices: shuffle([{ text: frDef, isCorrect: true }, ...wrongs.slice(0, 3).map((w) => ({ text: w, isCorrect: false }))]),
        feedback: `"${ptTerm}" correspond bien à : "${frDef}".`,
      });
    });
  }

  // 3. Questions spécifiques Fiche Culture (Orixás, Cortège, Géographie)
  questions.push(...buildCultureFicheQuestions(sheetData, allSheetsData, { t }));

  // 4. QCM personnalisés de la fiche (questionsQcm + customQuestions)
  const customAdded = [];
  if (Array.isArray(sheetData.questionsQcm)) {
    sheetData.questionsQcm.forEach((q, i) => {
      if (q?.question && Array.isArray(q.options) && q.options.length > 1) {
        const choices = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === parseInt(q.correctIndex, 10) }));
        const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: `custom_qcm_${i}` });
        customAdded.push({
          id: detId, deterministicId: detId, legacyId: `qcm_auto_custom_qcm_${i}`, type: 'custom_culture',
          instruction: 'Question spécifique', questionText: q.question, choices: shuffle(choices),
          feedback: q.extraitTexte ? `Extrait : ${q.extraitTexte}` : (choices.find((c) => c.isCorrect)?.text || ''),
        });
      }
    });
  }
  if (Array.isArray(sheetData.customQuestions)) {
    sheetData.customQuestions.forEach((q, i) => {
      if (q?.texte && q?.bonneReponse) {
        const choices = [{ text: q.bonneReponse, isCorrect: true }, ...(q.mauvaisesReponses || []).map((mr) => ({ text: mr, isCorrect: false }))];
        const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'culture', targetField: `custom_${q.id || i}` });
        customAdded.push({
          id: detId, deterministicId: detId, legacyId: `qcm_auto_sheet_custom_${q.id || i}`, type: 'custom',
          instruction: 'Question spécifique', questionText: q.texte, choices: shuffle(choices),
          audioUrl: q.audioUrl || null, feedback: `La bonne réponse est : ${q.bonneReponse}`,
        });
      }
    });
  }

  let finalQs = [...customAdded, ...shuffle(questions)];
  if (sheetData.type !== 'culture_fiche') finalQs = finalQs.slice(0, 10);
  return sanitizeQuizQuestions(applyQuizOverrides(finalQs, sheetData.quizOverrides, { sourceId: docId, category: 'culture' }));
}
