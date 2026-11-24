// Générateur de QCM pour les Presets Sequenciador et les Signes du Mestre (< 135 lignes)
import { buildDeterministicQuizQuestionId } from '../quizOverrideKeyHelper.js';
import { normalizeQuizMediaUrl } from '../quizTextValidator.js';

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function tr(rawT, key, fallback, params = null) {
  let out = typeof rawT === 'function' ? (params ? rawT(key, params) : rawT(key)) : undefined;
  if (!out || out === key) out = fallback;
  if (typeof out === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach((k) => {
      if (params[k] != null) out = out.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, 'g'), String(params[k]));
    });
  }
  return out;
}

const resolveSignalName = (sig, cat = null, fb = 'Signe') =>
  String(sig?.name || sig?.label || sig?.nom || sig?.title || cat?.name || cat?.label || cat?.nom || cat?.title || sig?.action || sig?.consigne || fb).trim() || fb;

export function generateQuizFromSequencerJson(rhythmTitle, parsedSequencerData, allSheetsData = [], config = {}) {
  if (!parsedSequencerData) return [];
  const sheets = Array.isArray(allSheetsData) ? allSheetsData : [];
  const t = config.t;
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
      const pupitre = patternObj.cleanName || 'Percussion';
      const patChoice = tr(t, 'pedagogyQuiz.thisPatternChoice', 'Ce motif');
      questions.push({
        id: `qcm_auto_seq_pattern_${idx}`, type: 'pattern_rythmique',
        instruction: tr(t, 'pedagogyQuiz.seqPatternInstruction', 'Motif Rythmique (Sequenciador)'),
        questionText: tr(t, 'pedagogyQuiz.seqPatternQuestion', `Identifiez le motif rythmique joué par le pupitre "${pupitre}" dans : ${rhythmTitle}`, { pupitre, titre: rhythmTitle }),
        choices: shuffle([
          { text: patChoice, isCorrect: true, visualElement: { type: 'pattern', patternData: formatted } },
          ...wrongs.map((w) => ({ text: patChoice, isCorrect: false, visualElement: { type: 'pattern', patternData: w } })),
        ]),
        feedback: tr(t, 'pedagogyQuiz.seqPatternFeedback', `Le bon motif pour "${pupitre}" est celui affiché en vert.`, { pupitre }),
      });
    });
  }

  const mestreSignals = config.mestreSignals || [];
  const specificSignal = mestreSignals.find((s) => resolveSignalName(s, null, '').toLowerCase() === String(rhythmTitle || '').toLowerCase());
  if (specificSignal) {
    const sigName = resolveSignalName(specificSignal, null, rhythmTitle || 'Appel');
    const sigImg = normalizeQuizMediaUrl(specificSignal.imageUrl || specificSignal.url || null);
    const wrongs = shuffle(mestreSignals.filter((s) => s.id !== specificSignal.id).map((s) => resolveSignalName(s, null, '')).filter(Boolean)).slice(0, 3);
    while (wrongs.length < 3) wrongs.push(tr(t, 'pedagogyQuiz.mysteryActionFallback', `Action ${wrongs.length + 1}`, { index: wrongs.length + 1 }));
    questions.push({
      id: 'qcm_auto_seq_signe_visuel', type: 'mestre_signal_visuel',
      instruction: tr(t, 'pedagogyQuiz.mestreSignInstruction', 'Signes du Mestre'),
      questionText: tr(t, 'pedagogyQuiz.whatActionForGesture', 'Quelle action musicale ou consigne est annoncée par ce geste du Mestre ?'),
      questionImage: sigImg, imageUrl: sigImg,
      choices: shuffle([{ text: sigName, isCorrect: true }, ...wrongs.map((w) => ({ text: w, isCorrect: false }))]),
      feedback: tr(t, 'pedagogyQuiz.signalsVisualFeedback', `Ce geste correspond à "${sigName}".`, { name: sigName }),
    });
  }
  return shuffle(questions);
}

export function generateQuizFromPieceSignals(piece, resolvedSignals = [], catalogSignals = [], config = {}) {
  const t = config.t;
  const rawList = resolvedSignals?.length ? resolvedSignals : (piece?.sinaisDoMestre?.length ? piece.sinaisDoMestre : (piece?.activeSinaisDoMestre || []));
  if (!Array.isArray(rawList) || rawList.length === 0) return [];

  const signals = rawList.map((sig, idx) => {
    const fb = `${tr(t, 'common.signes', 'Signe')} ${idx + 1}`;
    if (typeof sig === 'string') {
      const m = (catalogSignals || []).find((cs) => cs.id === sig || resolveSignalName(cs, null, '').toLowerCase() === sig.toLowerCase());
      const nm = resolveSignalName(null, m, sig || fb);
      const rawImg = m?.imageUrl || m?.url || null;
      return { id: m?.id || `sig_${idx}`, nom: nm, name: nm, consigne: m?.consigne || m?.action || m?.description || nm, imageUrl: rawImg ? normalizeQuizMediaUrl(rawImg) : null };
    }
    const lookup = sig?.name || sig?.label || sig?.nom || sig?.title || '';
    const m = (catalogSignals || []).find((cs) => (sig.signalId && cs.id === sig.signalId) || (sig.id && cs.id === sig.id) || (lookup && resolveSignalName(cs, null, '').toLowerCase() === lookup.toLowerCase()));
    const nm = resolveSignalName(sig, m, fb);
    const rawImg = sig.imageUrl || sig.url || sig.image || m?.imageUrl || m?.url || null;
    return {
      id: sig.id || sig.signalId || m?.id || `sig_${idx}`, nom: nm, name: nm,
      consigne: sig.consigne || sig.action || sig.description || m?.consigne || m?.action || m?.description || nm,
      imageUrl: rawImg ? normalizeQuizMediaUrl(rawImg) : null,
    };
  });

  const allImages = Array.from(new Set([...signals.map((s) => s.imageUrl), ...(catalogSignals || []).map((cs) => normalizeQuizMediaUrl(cs?.imageUrl || cs?.url || ''))].filter(Boolean)));
  const defaultActions = ['Départ du morceau', 'Appel de Virada 1', 'Appel de Virada 2', "Break d'arrêt complet", 'Coupure générale', 'Relance en tempo rapide', 'Solo de Gonguê', 'Reprise du baque continu'];
  const allActions = Array.from(new Set([...signals.map((s) => s.consigne || s.nom), ...(catalogSignals || []).map((cs) => cs?.consigne || cs?.action || resolveSignalName(cs, null, '')), ...defaultActions].filter(Boolean)));

  const questions = [];
  const pieceId = piece?.id || 'piece';

  signals.forEach((sig, idx) => {
    const signalName = sig.name || sig.nom;
    const consigne = sig.consigne || signalName;

    if (sig.imageUrl) {
      const wrongImgs = shuffle(allImages.filter((img) => img !== sig.imageUrl)).slice(0, 3);
      if (wrongImgs.length > 0) {
        const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: `signe_visuel_${sig.id || idx}` });
        const expl = tr(t, 'pedagogyQuiz.signalsVisualFeedback', `Ce geste correspond à "${signalName}".`, { name: signalName });
        questions.push({
          id: `qcm_signe_visuel_${sig.id || idx}`, deterministicId: detId, type: 'image_options',
          instruction: tr(t, 'pedagogyQuiz.signalsVisualInstruction', 'Reconnaissance Visuelle du Geste'),
          questionText: tr(t, 'pedagogyQuiz.whichGestureForSignal', `Quel est le geste du Mestre pour l'appel : "${signalName}" ?`, { name: signalName }),
          choices: shuffle([{ text: sig.imageUrl, imageUrl: sig.imageUrl, isImage: true, isCorrect: true, label: signalName }, ...wrongImgs.map((img) => ({ text: img, imageUrl: img, isImage: true, isCorrect: false }))]),
          correctAnswer: signalName, correctAnswerExplanation: expl, feedback: expl,
        });
      }
    }

    const wrongActs = shuffle(allActions.filter((a) => a.toLowerCase() !== consigne.toLowerCase())).slice(0, 3);
    const detId = buildDeterministicQuizQuestionId({ sourceId: pieceId, category: 'repertoire', targetField: `signe_consigne_${sig.id || idx}` });
    const expl = tr(t, 'pedagogyQuiz.signalsConsigneFeedback', `L'action déclenchée est : "${consigne}".`, { consigne });
    questions.push({
      id: `qcm_signe_consigne_${sig.id || idx}`, deterministicId: detId, type: 'mestre_signal_consigne',
      instruction: tr(t, 'pedagogyQuiz.signalsConsigneInstruction', 'Consigne & Direction Musicale'),
      questionText: sig.imageUrl
        ? tr(t, 'pedagogyQuiz.whatActionForGesture', 'Quelle action musicale ou consigne est annoncée par ce geste du Mestre ?')
        : tr(t, 'pedagogyQuiz.whatActionForSignalName', `Quelle action musicale déclenche l'appel "${signalName}" ?`, { name: signalName }),
      questionImage: sig.imageUrl || null, imageUrl: sig.imageUrl || null,
      choices: shuffle([{ text: consigne, isCorrect: true }, ...wrongActs.map((txt) => ({ text: txt, isCorrect: false }))]),
      correctAnswer: consigne, correctAnswerExplanation: expl, feedback: expl,
    });
  });

  return shuffle(questions);
}
