// Moteur d'extraction et génération pour le mode Cadavre Exquis Polyrythmique
// Exploite les données réelles du Répertoire actif (statut 'saison' avec audio et preset)

const DEFAULT_SEASON_PIECES = [
  {
    id: 'piece_baque_luanda',
    titre: 'Baque de Luanda',
    audioUrl: 'https://firebasestorage.googleapis.com/v0/b/ogirador-audio/o/demo%2Fluanda.mp3',
    tracks: [
      { name: 'Alfaia Marcante', steps: ['X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-', 'X', '-', '-', '-'] },
      { name: 'Caixa', steps: ['X', 'X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X', 'X', '-', 'X'] },
      { name: 'Gonguê', steps: ['X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-'] },
      { name: 'Agbê', steps: ['-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X', '-', 'X'] }
    ],
    sinaisDoMestre: [{ id: 'sig_parada', name: 'Parada Temps 1', consigne: 'Arrêt net sur le premier temps' }],
    histoire: 'Toada traditionnelle de salutation du cortège royal.'
  },
  {
    id: 'piece_estrela_dalva',
    titre: 'Estrela Dalva',
    audioUrl: 'https://firebasestorage.googleapis.com/v0/b/ogirador-audio/o/demo%2Fdalva.mp3',
    tracks: [
      { name: 'Alfaia Marcante', steps: ['X', '-', 'X', '-', '-', '-', 'X', '-', 'X', '-', 'X', '-', '-', '-', 'X', '-'] },
      { name: 'Alfaia Meião', steps: ['-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X', '-', '-', 'X', 'X'] },
      { name: 'Caixa', steps: ['X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X', 'X', '-', 'X', 'X'] },
      { name: 'Gonguê', steps: ['X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', 'X', '-', '-', '-'] }
    ],
    sinaisDoMestre: [{ id: 'sig_virada', name: 'Virada de Baque', consigne: 'Variation accélérée du motif de fond' }],
    histoire: 'Hommage poétique à l\'étoile du matin et à la reine de la nation.'
  }
];

const FALLBACK_SIGNALS = [
  { id: 'sig_parada', name: 'Parada Temps 1', consigne: 'Arrêt net sur le premier temps' },
  { id: 'sig_virada', name: 'Virada de Baque', consigne: 'Variation syncopée de transition' },
  { id: 'sig_solo_caixa', name: 'Appel Solo Caixa', consigne: 'Les alfaias s\'effacent pour laisser chanter le timbre' },
  { id: 'sig_reprise', name: 'Reprise Apito', consigne: 'Coup de sifflet marquant le retour au baque lourd' },
  { id: 'sig_cortejo', name: 'Entrée du Cortège', consigne: 'Ouverture solennelle de la marche' }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Filtre les morceaux actifs possédant un audio et un preset Séquenceur
 */
export function getActiveSeasonPieces(repertoireList = []) {
  if (!Array.isArray(repertoireList) || repertoireList.length === 0) return DEFAULT_SEASON_PIECES;
  const filtered = repertoireList.filter(p => {
    const isSeason = !p.statutSaison || p.statutSaison === 'saison';
    const hasAudio = Boolean((p.audioUrl || p.activeAudioUrl || p.preset?.audioUrl || p.parsedData?.audioUrl || '').trim());
    const hasPreset = Boolean(p.sequenceurId || p.presetId || p.parsedData || p.preset?.parsedData || (Array.isArray(p.tracks) && p.tracks.length > 0));
    return isSeason && hasAudio && hasPreset;
  });
  return filtered.length > 0 ? filtered : (repertoireList.length > 0 ? repertoireList : DEFAULT_SEASON_PIECES);
}

/**
 * Extrait la liste exacte des pupitres joués dans ce morceau
 */
export function getPieceInstruments(piece) {
  if (!piece) return ['Alfaia Marcante', 'Caixa', 'Gonguê', 'Agbê'];
  const tracks = piece.tracks || piece.parsedData?.tracks || piece.preset?.parsedData?.tracks || [];
  const activeInstruments = tracks
    .filter(t => Array.isArray(t.steps) && t.steps.some(s => s !== '-' && s !== 0 && s !== '0' && s !== ''))
    .map(t => t.name || t.instrument)
    .filter(Boolean);
  if (activeInstruments.length > 0) return Array.from(new Set(activeInstruments));
  if (Array.isArray(piece.instruments) && piece.instruments.length > 0) return piece.instruments;
  return ['Alfaia Marcante', 'Caixa', 'Gonguê', 'Agbê'];
}

/**
 * Isole la tablature réelle de l'instrument et génère 3 leurres cohérents
 */
export function generatePatternChoices(piece, instrument, repertoireList = []) {
  const tracks = piece?.tracks || piece?.parsedData?.tracks || piece?.preset?.parsedData?.tracks || [];
  const matchedTrack = tracks.find(t => (t.name || t.instrument)?.toLowerCase() === (instrument || '').toLowerCase()) || tracks[0];
  const realPattern = matchedTrack?.steps || ['X', '-', 'X', '-', 'X', '-', 'X', '-'];

  // Recherche de leurres distincts dans les autres morceaux
  const candidatePatterns = [];
  (repertoireList || []).forEach(p => {
    if (p.id !== piece?.id) {
      const otherTracks = p.tracks || p.parsedData?.tracks || p.preset?.parsedData?.tracks || [];
      otherTracks.forEach(t => {
        if (Array.isArray(t.steps) && JSON.stringify(t.steps) !== JSON.stringify(realPattern)) {
          candidatePatterns.push(t.steps);
        }
      });
    }
  });

  // Complément de leurres si besoin
  const fallbackPatterns = [
    ['X', 'X', '-', 'X', 'X', '-', 'X', 'X'],
    ['-', 'X', '-', 'X', '-', 'X', '-', 'X'],
    ['X', '-', '-', 'X', '-', '-', 'X', '-']
  ];
  const distractors = shuffle([...candidatePatterns, ...fallbackPatterns])
    .filter(p => JSON.stringify(p) !== JSON.stringify(realPattern))
    .slice(0, 3);

  const choices = shuffle([realPattern, ...distractors]);
  const correctIndex = choices.findIndex(c => JSON.stringify(c) === JSON.stringify(realPattern));

  return { realPattern, choices, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

/**
 * Isole le signal réel du Mestre et génère 3 leurres
 */
export function generateSignalChoices(piece, repertoireList = []) {
  const rawSignals = piece?.sinaisDoMestre || piece?.parsedData?.sinaisDoMestre || piece?.activeSinaisDoMestre || [];
  const realSignal = rawSignals.length > 0 ? rawSignals[0] : FALLBACK_SIGNALS[0];

  const otherSignals = [];
  (repertoireList || []).forEach(p => {
    if (p.id !== piece?.id) {
      const pSignals = p.sinaisDoMestre || p.parsedData?.sinaisDoMestre || p.activeSinaisDoMestre || [];
      pSignals.forEach(s => {
        if ((s.name || s.nom) !== (realSignal.name || realSignal.nom)) otherSignals.push(s);
      });
    }
  });

  const distractors = shuffle([...otherSignals, ...FALLBACK_SIGNALS])
    .filter(s => (s.name || s.nom) !== (realSignal.name || realSignal.nom))
    .slice(0, 3);

  const choices = shuffle([realSignal, ...distractors]);
  const correctIndex = choices.findIndex(s => (s.name || s.nom) === (realSignal.name || realSignal.nom));

  return { realSignal, choices, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

/**
 * Extrait la toada ou la question culture liée au morceau si disponible
 */
export function getPieceCultureBonus(piece, varalList = []) {
  if (!piece) return null;
  const toada = (varalList || []).find(v => v.type === 'song' && (v.id === piece.toadaDocId || v.titre?.toLowerCase() === piece.titre?.toLowerCase()));
  if (toada) {
    return {
      type: 'toada',
      questionText: `Quelle est la première phrase de la toada de « ${piece.titre} » ?`,
      correctChoice: toada.paroles?.split('\n')?.[0] || toada.titre,
      distractors: ['Ô viva Zumbi dos Palmares', 'No batuque da minha nação', 'Corta a cana no canavial'],
      explanation: `Toada de la Nação liée au morceau ${piece.titre}.`
    };
  }
  if (piece.histoire || piece.contexteHistorique) {
    return {
      type: 'culture',
      questionText: `Quel contexte historique est rattaché à « ${piece.titre} » ?`,
      correctChoice: piece.histoire?.slice(0, 70) + '...',
      distractors: ['Hommage au carnaval d\'Olinda', 'Chant de travail des pêcheurs', 'Salutation guerrière d\'Ogum'],
      explanation: piece.histoire
    };
  }
  return null;
}
