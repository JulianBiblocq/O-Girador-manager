// Générateur de QCM pour les Toadas et Chants du Varal (<= 140 lignes)
import { distractorPool } from '../../data/distractorPool.js';
import { cleanPromptTitle, cleanChoiceText, sanitizeQuizQuestions, filterDistractorsByLength } from '../quizSanitizer.js';
import { buildDeterministicQuizQuestionId, applyQuizOverrides } from '../quizOverrideKeyHelper.js';
import { parseLexiqueString, getTransversalLexique } from './quizSheetGenerator.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export function generateQuizFromSong(song, allSongs = [], allSheetsData = [], config = {}) {
  if (!song) return [];
  const docId = song.id || 'song';
  const songsList = Array.isArray(allSongs) ? allSongs : [];
  const sheetsList = Array.isArray(allSheetsData) ? allSheetsData : [];
  const { askRythme = true, askNacao = true, askLexique = true, customDistractors = {} } = config;
  const questions = [];

  const getDistractors = (field, currentVal) => {
    const allVals = songsList.map((s) => s?.[field]).filter((v) => v && v.toLowerCase() !== String(currentVal || '').toLowerCase());
    const fallbacks = field === 'rythme'
      ? (customDistractors.baquesPlausibles?.length ? customDistractors.baquesPlausibles : distractorPool.baquesFictifsEtSimilaires)
      : (distractorPool.defaultOthersSongs || []);
    const merged = Array.from(new Set([...allVals, ...(fallbacks || [])])).filter((v) => v && v.toLowerCase() !== String(currentVal || '').toLowerCase());
    return shuffle(merged).slice(0, 3);
  };

  // 1. Question Rythme
  if (askRythme && song.rythme) {
    const promptTitle = cleanPromptTitle(song.titre, song.rythme);
    const wrongs = getDistractors('rythme', song.rythme);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'toada', targetField: 'rythme' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_song_rythme', sourceId: docId, category: 'toada', targetField: 'rythme',
      type: 'song_rythme', instruction: 'Identifie le rythme de ce chant.',
      questionText: `Quel est le rythme (baque) de la Toada "${promptTitle}" ?`,
      choices: shuffle([{ text: song.rythme, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: song.rythme, feedback: `Le rythme de "${promptTitle}" est bien "${song.rythme}".`,
    });
  }

  // 2. Question Nação
  if (askNacao && song.nacao) {
    const promptTitle = cleanPromptTitle(song.titre, song.nacao);
    const wrongs = getDistractors('nacao', song.nacao);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'toada', targetField: 'nacao' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_song_nacao', sourceId: docId, category: 'toada', targetField: 'nacao',
      type: 'song_nacao', instruction: "Identifie l'origine de ce chant.",
      questionText: `De quelle Nação provient la Toada "${promptTitle}" ?`,
      choices: shuffle([{ text: song.nacao, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: song.nacao, feedback: `Cette Toada provient bien de la "${song.nacao}".`,
    });
  }

  // 3. Question Lexique
  const lexiqueData = typeof song.notesLexique === 'string' ? parseLexiqueString(song.notesLexique) : song.notesLexique;
  if (askLexique && Array.isArray(lexiqueData) && lexiqueData.length > 0) {
    const allLexiqueFr = getTransversalLexique(sheetsList, songsList);
    const item = lexiqueData[0];
    if (item?.mot && item?.explication) {
      const cleanMot = cleanPromptTitle(item.mot);
      const cleanExpl = cleanChoiceText(item.explication, cleanMot);
      if (!cleanExpl.toLowerCase().includes(cleanMot.toLowerCase())) {
        let wrongs = filterDistractorsByLength(cleanExpl, allLexiqueFr);
        if (wrongs.length < 3) {
          wrongs = [...wrongs, ...(distractorPool.fallbackFailsTraductions || []).filter((f) => f.toLowerCase() !== cleanExpl.toLowerCase())].slice(0, 3);
        }
        const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'toada', targetField: 'lexique' });
        questions.push({
          id: detId, deterministicId: detId, legacyId: 'qcm_auto_song_lexique', sourceId: docId, category: 'toada', targetField: 'lexique',
          type: 'song_lexique', instruction: 'Trouve la bonne explication ou traduction.',
          questionText: `Dans ce chant, que signifie le mot "${cleanMot}" ?`,
          choices: shuffle([{ text: cleanExpl, isCorrect: true }, ...wrongs.slice(0, 3).map((w) => ({ text: w, isCorrect: false }))]),
          correctAnswer: cleanExpl, feedback: `Le mot "${cleanMot}" signifie bien "${cleanExpl}".`,
        });
      }
    }
  }

  // 4. Question Refrain / Paroles (Blind-test de vers)
  const rawLyrics = song.parolesOriginales || song.paroles;
  let lyricLines = [];
  if (typeof rawLyrics === 'string') {
    lyricLines = rawLyrics.split('\n').map((l) => l.replace(/<[^>]+>/g, '').trim()).filter((l) => l.length >= 10 && l.length <= 120 && !l.startsWith('['));
  } else if (Array.isArray(rawLyrics)) {
    rawLyrics.forEach((it) => {
      if (typeof it === 'string') lyricLines.push(it.trim());
      else if (it && typeof it === 'object') {
        if (it.puxador) lyricLines.push(String(it.puxador).trim());
        if (it.coro) lyricLines.push(String(it.coro).trim());
      }
    });
    lyricLines = lyricLines.map((l) => l.replace(/<[^>]+>/g, '').trim()).filter((l) => l.length >= 10 && l.length <= 120 && !l.startsWith('['));
  }
  const currentSongTitle = cleanPromptTitle(song.titre || 'Toada');
  if (currentSongTitle) lyricLines = lyricLines.filter((l) => !l.toLowerCase().includes(currentSongTitle.toLowerCase()));
  if (lyricLines.length > 0) {
    const line = lyricLines[0];
    const otherTitles = songsList.filter((s) => s?.id !== song.id && s?.titre).map((s) => cleanPromptTitle(s.titre));
    const fbTitles = distractorPool.defaultOthersSongs || ['Toada de Iemanjá', 'Abertura de Baque', 'Toada de Oxum', 'Estrela Brilhante'];
    const wrongs = shuffle(Array.from(new Set([...otherTitles, ...fbTitles])).filter((t) => t && t.toLowerCase() !== currentSongTitle.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'toada', targetField: 'refrain' });
    questions.push({
      id: detId, deterministicId: detId, legacyId: 'qcm_auto_song_lyrics', sourceId: docId, category: 'toada', targetField: 'refrain',
      type: 'song_lyrics', instruction: 'Paroles & Répertoire',
      questionText: `À quelle Toada appartient cet extrait de paroles : "${line}" ?`,
      choices: shuffle([{ text: currentSongTitle, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      correctAnswer: currentSongTitle, feedback: `Ces paroles font bien partie de la Toada "${currentSongTitle}".`,
    });
  }

  // 5. Questions personnalisées de la Toada
  const customAdded = [];
  if (Array.isArray(song.customQuestions)) {
    song.customQuestions.forEach((q, i) => {
      if (q?.texte && q?.bonneReponse) {
        const choices = [{ text: q.bonneReponse, isCorrect: true }, ...(q.mauvaisesReponses || []).map((mr) => ({ text: mr, isCorrect: false }))];
        const detId = buildDeterministicQuizQuestionId({ sourceId: docId, category: 'toada', targetField: `custom_${q.id || i}` });
        customAdded.push({
          id: detId, deterministicId: detId, legacyId: `qcm_auto_song_custom_${q.id || i}`, type: 'custom',
          instruction: 'Question spécifique', questionText: q.texte, choices: shuffle(choices),
          audioUrl: q.audioUrl || null, feedback: `La bonne réponse est : ${q.bonneReponse}`,
        });
      }
    });
  }

  const finalQs = shuffle([...customAdded, ...questions]).slice(0, 10);
  return sanitizeQuizQuestions(applyQuizOverrides(finalQs, song.quizOverrides, { sourceId: docId, category: 'toada' }));
}

