// Générateur de QCM pour les Presets Séquenceur et les Signes du Mestre (<= 140 lignes)
import { buildDeterministicQuizQuestionId } from '../quizOverrideKeyHelper.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export function generateQuizFromSequencerJson(rhythmTitle, parsedSequencerData, allSheetsData = [], config = {}) {
  if (!parsedSequencerData) return [];
  const sheets = Array.isArray(allSheetsData) ? allSheetsData : [];
  const t = config.t || ((_k, fb) => fb || _k);
  const questions = [];

  if (Array.isArray(parsedSequencerData.patterns) && parsedSequencerData.patterns.length > 0) {
    const allOtherPatterns = sheets
      .filter((s) => (s.type === 'rythme' || s.categorie?.toLowerCase().includes('rythme')) && s.activeSteps)
      .map((s) => s.activeSteps.map((st) => (st === 0 || st === '0' ? '-' : st)));

    shuffle(parsedSequencerData.patterns).slice(0, 2).forEach((patternObj, idx) => {
      const formatted = (patternObj.steps || []).map((s) => (s === 0 || s === '0' ? '-' : s));
      const wrongs = shuffle(allOtherPatterns).filter((p) => JSON.stringify(p) !== JSON.stringify(formatted)).slice(0, 3);
      for (let att = 0; wrongs.length < 3 && att < 30; att++) {
        const fake = [...formatted];
        const i1 = Math.floor(Math.random() * fake.length);
        fake[i1] = fake[i1] === '-' ? 'X' : '-';
        if (JSON.stringify(fake) !== JSON.stringify(formatted) && !wrongs.some((w) => JSON.stringify(w) === JSON.stringify(fake))) wrongs.push(fake);
      }
      questions.push({
        id: `qcm_auto_seq_pattern_${idx}`, type: 'pattern_rythmique',
        instruction: t('pedagogyQuiz.seqPatternInstruction', 'Pattern Rythmique (Sequenciador)'),
        questionText: `Identifiez le pattern rythmique joué par le pupitre "${patternObj.cleanName}" dans : ${rhythmTitle}`,
        choices: shuffle([
          { text: 'Ce pattern', isCorrect: true, visualElement: { type: 'pattern', patternData: formatted } },
          ...wrongs.map((w) => ({ text: 'Ce pattern', isCorrect: false, visualElement: { type: 'pattern', patternData: w } })),
        ]),
        feedback: `Le bon pattern pour "${patternObj.cleanName}" est celui affiché en vert.`,
      });
    });
  }

  const mestreSignals = config.mestreSignals || [];
  const specificSignal = mestreSignals.find((s) => s.name?.toLowerCase() === String(rhythmTitle || '').toLowerCase());
  if (specificSignal) {
    const wrongs = shuffle(mestreSignals.filter((s) => s.id !== specificSignal.id).map((s) => s.name)).slice(0, 3);
    while (wrongs.length < 3) wrongs.push(`Action Mystère ${wrongs.length + 1}`);
    questions.push({
      id: 'qcm_auto_seq_signe_visuel', type: 'mestre_signal_visuel',
      instruction: t('pedagogyQuiz.mestreSignInstruction', 'Signes du Mestre'),
      questionText: 'Quel rythme ou quelle action le Mestre annonce-t-il avec ce signe ?',
      questionImage: specificSignal.imageUrl,
      choices: shuffle([{ text: specificSignal.name, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: `Ce signe correspond à : ${specificSignal.name}.`,
    });
  }

  return shuffle(questions);
}

export function generateQuizFromPieceSignals(piece, resolvedSignals = [], catalogSignals = [], config = {}) {
  const t = config.t || ((k, fallback, params) => {
    let str = fallback || k;
    if (params) Object.keys(params).forEach((p) => { str = str.replace(new RegExp(`{{${p}}}`, 'g'), params[p]); });
    return str;
  });

  const rawList = resolvedSignals?.length ? resolvedSignals : (piece?.sinaisDoMestre?.length ? piece.sinaisDoMestre : (piece?.activeSinaisDoMestre || []));
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  const signals = rawList.map((sig, idx) => {
    if (typeof sig === 'string') {
      const m = (catalogSignals || []).find((cs) => cs.id === sig || (cs.name || cs.nom)?.toLowerCase() === sig.toLowerCase());
      return { id: m?.id || `sig_${idx}`, mesure: idx + 1, nom: m?.name || m?.nom || sig, name: m?.name || m?.nom || sig, consigne: m?.consigne || m?.action || m?.description || sig, imageUrl: m?.imageUrl || null };
    }
    const m = (catalogSignals || []).find((cs) => (sig.signalId && cs.id === sig.signalId) || (sig.id && cs.id === sig.id) || ((sig.name || sig.nom) && (cs.name || cs.nom)?.toLowerCase() === (sig.name || sig.nom).toLowerCase()));
    const nm = sig.nom || sig.name || m?.name || m?.nom || `Signe ${idx + 1}`;
    return {
      id: sig.id || m?.id || `sig_${idx}`, mesure: sig.mesure ?? sig.bar ?? sig.barIndex ?? (idx + 1),
      nom: nm, name: nm, consigne: sig.consigne || sig.action || m?.consigne || m?.action || m?.description || nm,
      imageUrl: sig.imageUrl || m?.imageUrl || null,
    };
  });

  const allImages = Array.from(new Set([...signals.map((s) => s.imageUrl), ...(catalogSignals || []).map((cs) => cs.imageUrl)].filter(Boolean)));
  const defaultActions = ['Départ du morceau', 'Appel de Virada 1', 'Appel de Virada 2', "Break d'arrêt complet", 'Coupure générale', 'Relance en tempo rapide', 'Solo de Gonguê', 'Reprise du baque continu'];
  const allActions = Array.from(new Set([...signals.map((s) => s.consigne || s.nom), ...(catalogSignals || []).map((cs) => cs.consigne || cs.action || cs.name || cs.nom), ...defaultActions].filter(Boolean)));

  const questions = [];
  const pieceId = piece?.id || 'piece';

  signals.forEach((sig, idx) => {
    const signalName = sig.nom || sig.name;
    const consigne = sig.consigne || signalName;
    const mesureStr = sig.mesure ? ` (Mesure ${sig.mesure})` : '';

    if (sig.imageUrl) {
      const wrongImgs = shuffle(allImages.filter((img) => img !== sig.imageUrl)).slice(0, 3);
      if (wrongImgs.length > 0) {
        const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: `signe_visuel_${sig.id || idx}` });
        questions.push({
          id: `qcm_signe_visuel_${sig.id || idx}`, deterministicId: detId, type: 'image_options',
          instruction: t('pedagogyQuiz.signalsVisualInstruction', 'Reconnaissance Visuelle du Geste'),
          questionText: t('pedagogyQuiz.whichGestureForSignal', `Quel est le geste du Mestre pour l'appel : "${signalName}"${mesureStr} ?`, { name: signalName }),
          choices: shuffle([{ text: sig.imageUrl, isCorrect: true, label: signalName }, ...wrongImgs.map((img) => ({ text: img, isCorrect: false }))]),
          correctAnswer: signalName, correctAnswerExplanation: `Ce geste correspond à "${signalName}".`, feedback: `Ce geste correspond bien à l'appel "${signalName}".`,
        });
      }
    }

    const wrongActs = shuffle(allActions.filter((a) => a.toLowerCase() !== consigne.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: `signe_consigne_${sig.id || idx}` });
    questions.push({
      id: `qcm_signe_consigne_${sig.id || idx}`, deterministicId: detId, type: 'mestre_signal_consigne',
      instruction: t('pedagogyQuiz.signalsConsigneInstruction', 'Consigne & Direction Musicale'),
      questionText: sig.imageUrl
        ? t('pedagogyQuiz.whatActionForGesture', `Quelle action musicale ou consigne est annoncée par ce geste du Mestre${mesureStr} ?`)
        : t('pedagogyQuiz.whatActionForSignalName', `Quelle action musicale déclenche l'appel "${signalName}"${mesureStr} ?`, { name: signalName }),
      questionImage: sig.imageUrl || null, imageUrl: sig.imageUrl || null,
      choices: shuffle([{ text: consigne, isCorrect: true }, ...wrongActs.map((txt) => ({ text: txt, isCorrect: false }))]),
      correctAnswer: consigne, correctAnswerExplanation: `L'action déclenchée est : "${consigne}".`, feedback: `Exact ! L'action déclenchée est bien "${consigne}".`,
    });
  });

  return shuffle(questions);
}

