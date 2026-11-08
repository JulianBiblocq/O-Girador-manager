// Constructeur de parcours de révision ciblé sur un morceau du Répertoire (<= 140 lignes)
// Combine Toada, caractéristiques musicales, Danse/Postures Dançador, Culture et surcharges quizOverrides

import { detectAlfaiaSticks } from './sequencerParser.js';
import { cleanPromptTitle, cleanChoiceText, sanitizeQuizText, sanitizeQuizQuestions, hasAnswerLeak, filterDistractorsByLength } from './quizSanitizer.js';
import { distractorPool } from '../data/distractorPool.js';
import { buildPieceDanceAndPostureQuestions } from './danceQuizBuilder.js';
import { buildDeterministicQuizQuestionId, applyQuizOverrides } from './quizOverrideKeyHelper.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const buildPieceRevisionQuestions = (pieceDoc, contextData = {}, config = {}, helpers = {}) => {
  if (!pieceDoc) return [];
  const { generateQuizFromPieceSignals, generateQuizFromSheet, generateQuizFromSong } = helpers;
  const questions = [];
  const t = config.t || contextData.t || ((k, fbOrParams, maybeParams) => {
    const isFbStr = typeof fbOrParams === 'string';
    let s = isFbStr ? fbOrParams : k;
    const p = isFbStr ? maybeParams : (fbOrParams && typeof fbOrParams === 'object' ? fbOrParams : null);
    if (p) Object.keys(p).forEach((key) => { s = s.replace(new RegExp(`{{${key}}}`, 'g'), p[key]); });
    return s;
  });

  const pieceId = pieceDoc.id || 'p';
  const pieceTitle = cleanPromptTitle(pieceDoc.titre || pieceDoc.title || 'ce morceau');
  const toadaId = pieceDoc.toadaDocId || pieceDoc.toadaId;
  const toadaDoc = contextData.toadaDoc || pieceDoc.activeToada || (contextData.allSongs || []).find((s) => s.id === toadaId);

  // 1. Axe Matériel Alfaia
  const alfaiaSource = contextData.presetData || contextData.tracks || pieceDoc.parsedSequencerData || pieceDoc.tracks ||
    (contextData.allPresets || []).find((p) => p.id === pieceDoc.sequenceurId || p.presetId === pieceDoc.sequenceurId) || pieceDoc;
  const sticksDetId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: 'sticks' });
  const sticksResult = detectAlfaiaSticks(alfaiaSource, { pieceTitle, pieceId, id: sticksDetId, t });
  if (sticksResult?.question) {
    questions.push({ ...sticksResult.question, deterministicId: sticksDetId, sourceId: pieceId, category: 'repertoire', targetField: 'sticks' });
  }

  // 2. Caractéristiques musicales : Signes du Mestre, Rythme/Baque, Nação & Tablature
  const rawSignals = pieceDoc.sinaisDoMestre?.length ? pieceDoc.sinaisDoMestre : (pieceDoc.activeSinaisDoMestre?.length ? pieceDoc.activeSinaisDoMestre : (contextData.presetData?.sinaisDoMestre || []));
  if (rawSignals.length > 0 && generateQuizFromPieceSignals) {
    const sigQs = generateQuizFromPieceSignals(pieceDoc, rawSignals, contextData.catalogSignals || contextData.mestreSignals || [], { t });
    if (Array.isArray(sigQs)) questions.push(...sigQs.slice(0, 2));
  }

  const baque = sanitizeQuizText(pieceDoc.rythme || pieceDoc.style || toadaDoc?.rythme || '');
  if (baque && !hasAnswerLeak(pieceTitle, baque)) {
    const wrongs = shuffle(['Baque Virado', 'Baque Luanda', 'Arrasto', 'Martelo', 'Parada', 'Samba Reggae', 'Ijexá', 'Coco'].filter((b) => b.toLowerCase() !== baque.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: 'rythme' });
    questions.push({
      id: detId, deterministicId: detId, sourceId: pieceId, category: 'repertoire', targetField: 'rythme', type: 'rythme_carac',
      instruction: 'Caractéristiques Musicales', questionText: `Quel est le rythme ou baque principal associé à ${pieceTitle} ?`,
      choices: shuffle([{ text: baque, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: baque, feedback: `Le rythme associé à ${pieceTitle} est ${baque}.`
    });
  }

  const nacao = sanitizeQuizText(pieceDoc.nacao || toadaDoc?.nacao || '');
  if (nacao && !hasAnswerLeak(pieceTitle, nacao)) {
    const wrongs = shuffle(['Estrela Brilhante', 'Porto Rico', 'Leão Coroado', 'Cambinda Estrela', 'Elefante', 'Encanto do Pina'].filter((n) => n.toLowerCase() !== nacao.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: 'nacao' });
    questions.push({
      id: detId, deterministicId: detId, sourceId: pieceId, category: 'repertoire', targetField: 'nacao', type: 'nacao_carac',
      instruction: 'Origine & Nação', questionText: `À quelle Nação ou tradition se rattache ${pieceTitle} ?`,
      choices: shuffle([{ text: nacao, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: nacao, feedback: `${pieceTitle} est rattaché à la tradition ${nacao}.`
    });
  }

  const userInst = (contextData.userInstrument || contextData.pupitre || 'alfaia').toLowerCase();
  const tracks = contextData.presetData?.tracks || pieceDoc.parsedSequencerData?.tracks || pieceDoc.tracks || [];
  const targetTrack = Array.isArray(tracks) && tracks.length > 0 ? (tracks.find((tr) => (tr.name || tr.instrument || '').toLowerCase().includes(userInst)) || tracks[0]) : null;
  const rawSteps = targetTrack?.activeSteps || targetTrack?.steps || targetTrack?.patterns?.[0]?.steps;
  if (rawSteps && (Array.isArray(rawSteps) || typeof rawSteps === 'string')) {
    const formatted = (Array.isArray(rawSteps) ? rawSteps : rawSteps.split('')).map((s) => (s === 0 || s === '0' ? '-' : String(s))).slice(0, 16);
    const patText = formatted.join(' ');
    const trName = sanitizeQuizText(targetTrack.name || targetTrack.instrument || 'ce pupitre');
    const wrongPats = [];
    for (let att = 0; wrongPats.length < 3 && att < 30; att++) {
      const fake = [...formatted];
      const idx = Math.floor(Math.random() * fake.length);
      fake[idx] = fake[idx] === '-' ? (fake.includes('I') ? 'I' : 'X') : '-';
      if (fake.join(' ') !== patText && !wrongPats.some((w) => w.join(' ') === fake.join(' '))) wrongPats.push(fake);
    }
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: `tablature_${userInst}` });
    questions.push({
      id: detId, deterministicId: detId, sourceId: pieceId, category: 'repertoire', targetField: `tablature_${userInst}`,
      type: 'pattern_rythmique', instruction: t('pedagogyQuiz.rhythmPatternInstruction', 'Tablature & Rythme'),
      questionText: `Quel est le pattern rythmique joué par le pupitre ${trName} sur ${pieceTitle} ?`,
      choices: shuffle([
        { text: patText, isCorrect: true, visualElement: { type: 'pattern', patternData: formatted } },
        ...wrongPats.slice(0, 3).map((wp) => ({ text: wp.join(' '), isCorrect: false, visualElement: { type: 'pattern', patternData: wp } }))
      ]),
      correctAnswer: patText, feedback: `Le bon pattern pour ${trName} est : ${patText}.`
    });
  }

  // 3. Axe Toada & Paroles
  if (toadaDoc) {
    const lexList = Array.isArray(toadaDoc.notesLexique) ? toadaDoc.notesLexique : (Array.isArray(toadaDoc.lexique) ? toadaDoc.lexique : []);
    if (lexList.length > 0) {
      const cleanMot = cleanPromptTitle(lexList[0].mot || lexList[0].pt);
      const cleanExpl = sanitizeQuizText(cleanChoiceText(lexList[0].explication || lexList[0].fr));
      if (cleanMot && cleanExpl && !hasAnswerLeak(cleanMot, cleanExpl)) {
        const pool = [...lexList.slice(1).map((l) => sanitizeQuizText(l.explication || l.fr)), ...(distractorPool.fallbackFailsTraductions || []).map((f) => sanitizeQuizText(f))];
        let wrongs = filterDistractorsByLength(cleanExpl, pool);
        if (wrongs.length < 3) wrongs = [...wrongs, ...pool.filter((p) => p && p.toLowerCase() !== cleanExpl.toLowerCase() && !wrongs.includes(p))].slice(0, 3);
        const detId = buildDeterministicQuizQuestionId({ sourceId: toadaDoc.id || pieceId, category: 'toada', targetField: 'lexique' });
        questions.push({
          id: detId, deterministicId: detId, sourceId: toadaDoc.id || pieceId, category: 'toada', targetField: 'lexique', type: 'song_lexique',
          instruction: t('pedagogyQuiz.songLexiconInstruction', 'Sens des Paroles & Toada'),
          questionText: `Dans la Toada ${cleanPromptTitle(toadaDoc.titre || pieceTitle)}, que signifie ${cleanMot} ?`,
          choices: shuffle([{ text: cleanExpl, isCorrect: true }, ...wrongs.slice(0, 3).map((w) => ({ text: w, isCorrect: false }))]),
          correctAnswer: cleanExpl, feedback: `Le terme ${cleanMot} signifie : ${cleanExpl}.`
        });
      }
    }
    if (generateQuizFromSong) {
      const songQs = generateQuizFromSong(toadaDoc, contextData.allSongs || [], contextData.allSheetsData || [], { t });
      if (Array.isArray(songQs)) questions.push(...songQs.slice(0, 2));
    }
  }

  // 4. Axe Danse Dançador & Postures d'Orixás + Fiches Culture
  questions.push(...buildPieceDanceAndPostureQuestions(pieceDoc, contextData, { t }));
  const cIds = Array.from(new Set([...(Array.isArray(pieceDoc.cultureDocIds) ? pieceDoc.cultureDocIds : []), ...(pieceDoc.cultureDocId ? [pieceDoc.cultureDocId] : [])]));
  const cDocs = [...(contextData.cultureDoc ? [contextData.cultureDoc] : []), ...(Array.isArray(pieceDoc.activeCultureDocs) ? pieceDoc.activeCultureDocs : []), ...(pieceDoc.activeCultureDoc ? [pieceDoc.activeCultureDoc] : []), ...(contextData.allSheetsData || []).filter((s) => cIds.includes(s.id))];
  const seenDocIds = new Set();
  cDocs.forEach((cDoc) => {
    if (!cDoc || (cDoc.id && seenDocIds.has(cDoc.id)) || !generateQuizFromSheet) return;
    if (cDoc.id) seenDocIds.add(cDoc.id);
    const cQuiz = generateQuizFromSheet(cDoc, contextData.allSheetsData || [], contextData.allSongs || [], { t });
    if (Array.isArray(cQuiz) && cQuiz.length > 0) {
      const prio = cQuiz.filter((q) => ['devinette_visuelle', 'symbole_orixa', 'culture', 'anecdote', 'histoire_orixa'].includes(q.type));
      questions.push(...(prio.length > 0 ? prio.slice(0, 2) : cQuiz.slice(0, 1)));
    }
  });
  return sanitizeQuizQuestions(applyQuizOverrides(questions, { ...(toadaDoc?.quizOverrides || {}), ...(pieceDoc.quizOverrides || {}), ...(config.quizOverrides || {}) }, { sourceId: pieceId, category: 'repertoire' }));
};
