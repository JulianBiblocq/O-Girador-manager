// Moteur d'extraction et génération pour le mode coopératif Cadavre Exquis (100 % Répertoire)
// Exploite les données réelles du Répertoire actif (statutSaison === 'saison' avec preset Sequenciador ou audio)

const FALLBACK_SIGNALS = [
  { id: 'sig_parada', name: 'Parada Temps 1', consigne: 'Arrêt net sur le premier temps' },
  { id: 'sig_virada', name: 'Virada de Baque', consigne: 'Variation syncopée de transition' },
  { id: 'sig_solo_caixa', name: 'Appel Solo Caixa', consigne: 'Les alfaias laissent chanter le timbre' },
  { id: 'sig_reprise', name: 'Reprise Apito', consigne: 'Coup de sifflet marquant le retour au baque' }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Filtre uniquement les morceaux actifs (statutSaison === 'saison') possédant un preset Sequenciador ou un audio résolu. */
export function getActiveSeasonPieces(repertoireList = []) {
  if (!Array.isArray(repertoireList) || repertoireList.length === 0) return [];
  return repertoireList.filter((p) => {
    if (!p || p.isArchived || p.archived) return false;
    const isSeason = p.statutSaison === 'saison' || (!p.statutSaison && p.statut !== 'archive' && p.statut !== 'chantier');
    const hasAudio = Boolean(String(p.audioUrl || p.activeAudioUrl || p.preset?.audioUrl || p.parsedData?.audioUrl || '').trim());
    const hasPreset = Boolean(p.sequenceurId || p.presetId || p.parsedData || p.preset?.parsedData || (Array.isArray(p.tracks) && p.tracks.length > 0));
    return isSeason && (hasPreset || hasAudio);
  });
}

/** Extrait uniquement les pupitres effectivement joués dans le morceau (activeSteps / steps non vides). */
export function getPieceActiveInstruments(piece, presetData = null) {
  if (!piece && !presetData) return [];
  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || piece?.tracks || piece?.parsedData?.tracks || piece?.preset?.parsedData?.tracks || [];
  const active = tracks
    .filter((t) => {
      const steps = t?.activeSteps || t?.steps || [];
      return Array.isArray(steps) && steps.some((s) => s !== '-' && s !== 0 && s !== '0' && s !== '' && s !== false && s !== null);
    })
    .map((t) => t.name || t.instrument)
    .filter(Boolean);
  if (active.length > 0) return Array.from(new Set(active));
  if (Array.isArray(piece?.instruments) && piece.instruments.length > 0) return piece.instruments.filter(Boolean);
  return ['Alfaia', 'Caixa', 'Gonguê', 'Agbê'];
}

export const getPieceInstruments = getPieceActiveInstruments;

/** Isole la tablature réelle de l'instrument sur ce morceau et génère 3 leurres cohérents. */
export function generatePatternChoices(piece, instrument, allPieces = [], presetData = null) {
  const tracks = presetData?.tracks || presetData?.parsedData?.tracks || piece?.tracks || piece?.parsedData?.tracks || piece?.preset?.parsedData?.tracks || [];
  const matched = tracks.find((t) => (t.name || t.instrument || '').toLowerCase() === String(instrument || '').toLowerCase()) || tracks[0];
  const realPattern = matched?.activeSteps || matched?.steps || ['X', '-', 'X', '-', 'X', '-', 'X', '-'];

  const candidates = [];
  (allPieces || []).forEach((p) => {
    if (p?.id !== piece?.id) {
      (p?.tracks || p?.parsedData?.tracks || p?.preset?.parsedData?.tracks || []).forEach((t) => {
        const st = t?.activeSteps || t?.steps;
        if (Array.isArray(st) && JSON.stringify(st) !== JSON.stringify(realPattern)) candidates.push(st);
      });
    }
  });
  const fallbacks = [['X', 'X', '-', 'X', 'X', '-', 'X', 'X'], ['-', 'X', '-', 'X', '-', 'X', '-', 'X'], ['X', '-', '-', 'X', '-', '-', 'X', '-']];
  const distractors = shuffle([...candidates, ...fallbacks]).filter((p) => JSON.stringify(p) !== JSON.stringify(realPattern)).slice(0, 3);
  const choices = shuffle([realPattern, ...distractors]);
  const correctIndex = choices.findIndex((c) => JSON.stringify(c) === JSON.stringify(realPattern));
  return { realPattern, choices, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

/** Isole un signal réel du Mestre rattaché au morceau et génère 3 signaux leurres. */
export function generateSignalChoices(piece, allPieces = [], allSignals = []) {
  const rawSignals = piece?.sinaisDoMestre || piece?.activeSinaisDoMestre || piece?.parsedData?.sinaisDoMestre || [];
  const realSignal = rawSignals[0] || allSignals[0] || FALLBACK_SIGNALS[0];
  const realName = realSignal.name || realSignal.nom || realSignal.title || 'Signal 1';

  const pool = [...(allSignals || [])];
  (allPieces || []).forEach((p) => {
    if (p?.id !== piece?.id) (p?.sinaisDoMestre || p?.activeSinaisDoMestre || []).forEach((s) => pool.push(s));
  });
  const distractors = shuffle([...pool, ...FALLBACK_SIGNALS]).filter((s) => (s.name || s.nom || s.title) !== realName).slice(0, 3);
  const choices = shuffle([realSignal, ...distractors]);
  const correctIndex = choices.findIndex((s) => (s.name || s.nom || s.title) === realName);
  return { realSignal, choices, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

/** Génère le Maillon 5 (Bonus Toada / Culture) uniquement si le morceau possède toadaDocId ou cultureDocIds/cultureDocId. */
export function getPieceCultureBonus(piece, varalDocs = []) {
  if (!piece) return null;
  const cultureIds = Array.isArray(piece.cultureDocIds) ? piece.cultureDocIds.filter(Boolean) : (piece.cultureDocId ? [piece.cultureDocId] : []);
  const hasToadaLink = Boolean(piece.toadaDocId || piece.activeToada?.id);
  const hasCultureLink = cultureIds.length > 0 || (Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0);
  if (!hasToadaLink && !hasCultureLink) return null;

  const docs = Array.isArray(varalDocs) ? varalDocs : [];
  if (hasToadaLink) {
    const toada = piece.activeToada || docs.find((v) => v.id === piece.toadaDocId);
    const firstLine = (toada?.paroles || toada?.refrain || '').split('\n').map((l) => l.trim()).find(Boolean) || toada?.titre || `Refrain de ${piece.titre}`;
    const distractors = ['Ô viva Zumbi dos Palmares', 'No batuque da minha nação', 'Corta a cana no canavial'];
    const choices = shuffle([firstLine, ...distractors]);
    return { type: 'toada', questionText: `Quel refrain ou vers est chanté sur « ${piece.titre} » ?`, correctChoice: firstLine, distractors, choices, correctIndex: choices.indexOf(firstLine) };
  }
  const cultDoc = piece.activeCultureDocs?.[0] || docs.find((v) => cultureIds.includes(v.id));
  const correctChoice = cultDoc?.orixa || cultDoc?.nacao || cultDoc?.titre || piece.orixa || piece.nacao || `Tradition de ${piece.titre}`;
  const distractors = ['Nação Porto Rico (Oxum)', 'Nação Estrela Brilhante (Iansã)', 'Nação Leão Coroado (Xangô)'].filter((d) => d !== correctChoice).slice(0, 3);
  const choices = shuffle([correctChoice, ...distractors]);
  return { type: 'culture', questionText: `Quelle Nação, Orixá ou fiche culturelle est associée à « ${piece.titre} » ?`, correctChoice, distractors, choices, correctIndex: choices.indexOf(correctChoice) };
}

/** Construit le défi complet des 5 maillons et évalue la rotation circulaire et le Conseil de Batterie. */
export function buildCadavreRoundChallenge(piece, instrument, allPieces = [], allSignals = [], varalDocs = []) {
  const seasonPool = getActiveSeasonPieces(allPieces);
  const otherPieces = shuffle((seasonPool.length > 0 ? seasonPool : allPieces).filter((p) => p?.id !== piece?.id)).slice(0, 3);
  const pieceChoices = shuffle([piece, ...otherPieces].filter(Boolean));
  const activeInstruments = getPieceActiveInstruments(piece);
  const chosenInstrument = instrument || activeInstruments[0] || 'Alfaia';
  return { pieceChoices, activeInstruments, patternStep: generatePatternChoices(piece, chosenInstrument, allPieces), signalStep: generateSignalChoices(piece, allPieces, allSignals), bonusStep: getPieceCultureBonus(piece, varalDocs) };
}

export function getCircularActivePlayer(playerOrder = [], roundIndex = 0, stepIndex = 0) {
  if (!Array.isArray(playerOrder) || playerOrder.length === 0) return null;
  return playerOrder[(Math.max(0, roundIndex) + Math.max(0, stepIndex)) % playerOrder.length];
}

export function evaluateCadavreCouncilRound(chain = {}, councilVotes = {}) {
  const failedSteps = [];
  if (chain.patternChoice && chain.patternChoice.isCorrect === false) failedSteps.push('pattern');
  if (chain.signalChoice && chain.signalChoice.isCorrect === false) failedSteps.push('signal');
  if (chain.bonusChoice && chain.bonusChoice.isCorrect === false) failedSteps.push('bonus');
  if (failedSteps.length === 0) return { isPerfect: true, isSavedByCouncil: false, pointsEarned: 1000, failedSteps, explanation: "Arrangement sans faute ! La batterie résonne d'un seul souffle." };
  const isSaved = Object.values(councilVotes || {}).some((v) => (v?.valid === false || v?.isValid === false) && failedSteps.includes(v?.suspectedStep));
  return isSaved
    ? { isPerfect: false, isSavedByCouncil: true, pointsEarned: 500, failedSteps, explanation: `Une faute sur [${failedSteps.join(', ')}] a été repérée par le Conseil ! 500 points d'Axé sauvés.` }
    : { isPerfect: false, isSavedByCouncil: false, pointsEarned: 0, failedSteps, explanation: `Une fausse note sur [${failedSteps.join(', ')}] n'a pas été démasquée par le Conseil. 0 point.` };
}
