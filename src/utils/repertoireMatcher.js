import { formatPieceTablature } from './tablatureFormatter.js';
import { computeTrainingStages } from './aisanceStagesUtils.js';

/**
 * Normalise une chaîne de caractères pour une comparaison souple et tolérante :
 * minuscules, suppression des accents (diacritiques), ponctuation et espaces superflus.
 *
 * @param {string|any} str Chaîne brute
 * @returns {string} Chaîne normalisée épurée
 */
export const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Recherche le meilleur preset ou rythme correspondant dans le catalogue du Séquenceur.
 * Priorité :
 * 1. Identifiant exact (`id`, `presetId`, `sequenceurId`, `jsonUrl`)
 * 2. Correspondance par titre normalisé
 *
 * @param {Object|string} pieceOrTitle - Objet morceau ou titre brut
 * @param {Array} catalogRhythms - Catalogue complet des rythmes et presets
 * @returns {Object|null} Preset ou rythme trouvé, ou null
 */
export function findMatchingPreset(pieceOrTitle, catalogRhythms = []) {
  if (!Array.isArray(catalogRhythms) || catalogRhythms.length === 0) return null;

  const isPieceObj = typeof pieceOrTitle === 'object' && pieceOrTitle !== null;
  const seqId = isPieceObj ? (pieceOrTitle.sequenceurId || pieceOrTitle.sequenceurFileUrl) : null;
  const rawTitle = isPieceObj ? pieceOrTitle.titre : pieceOrTitle;
  const normTitle = normalizeString(rawTitle);

  // 1. Recherche par identifiant direct
  if (seqId) {
    const directMatch = catalogRhythms.find(
      (r) =>
        r.id === seqId ||
        r.presetId === seqId ||
        r.jsonUrl === seqId ||
        (r.fileName && r.fileName === seqId)
    );
    if (directMatch) return directMatch;
  }

  // 2. Recherche par correspondance de titre normalisé
  if (normTitle) {
    // Favoriser en priorité les presets complets
    const titleMatch = catalogRhythms.find((r) => {
      const rTitle = normalizeString(r.titre || r.name || r.displayTitle);
      return rTitle && rTitle === normTitle;
    });
    if (titleMatch) return titleMatch;
  }

  return null;
}

/**
 * Recherche la toada correspondante dans les documents de type 'song' du Varal.
 *
 * @param {Object|string} pieceOrTitle - Objet morceau ou titre brut
 * @param {Array} toadasList - Liste des chants chargés depuis Firestore
 * @returns {Object|null} Toada trouvée ou null
 */
export function findMatchingToada(pieceOrTitle, toadasList = []) {
  if (!Array.isArray(toadasList) || toadasList.length === 0) return null;

  const isPieceObj = typeof pieceOrTitle === 'object' && pieceOrTitle !== null;
  const toadaId = isPieceObj ? pieceOrTitle.toadaDocId : null;
  const rawTitle = isPieceObj ? pieceOrTitle.titre : pieceOrTitle;
  const normTitle = normalizeString(rawTitle);

  if (toadaId) {
    const directMatch = toadasList.find((t) => t.id === toadaId);
    if (directMatch) return directMatch;
  }

  if (normTitle) {
    const match = toadasList.find((t) => normalizeString(t.titre) === normTitle);
    if (match) return match;
  }

  return null;
}

/**
 * Recherche la fiche culturelle correspondante dans les documents du Varal.
 *
 * @param {Object|string} pieceOrTitle - Objet morceau ou titre brut
 * @param {Array} cultureDocsList - Liste des fiches culturelles
 * @returns {Object|null} Fiche culturelle trouvée ou null
 */
export function findMatchingCultureDoc(pieceOrTitle, cultureDocsList = []) {
  if (!Array.isArray(cultureDocsList) || cultureDocsList.length === 0) return null;

  const isPieceObj = typeof pieceOrTitle === 'object' && pieceOrTitle !== null;
  const cultureId = isPieceObj
    ? (Array.isArray(pieceOrTitle.cultureDocIds) && pieceOrTitle.cultureDocIds.length > 0
        ? pieceOrTitle.cultureDocIds[0]
        : pieceOrTitle.cultureDocId)
    : null;
  const rawTitle = isPieceObj ? pieceOrTitle.titre : pieceOrTitle;
  const normTitle = normalizeString(rawTitle);

  if (cultureId) {
    const directMatch = cultureDocsList.find((c) => c.id === cultureId);
    if (directMatch) return directMatch;
  }

  if (normTitle) {
    const match = cultureDocsList.find((c) => normalizeString(c.titre || c.name) === normTitle);
    if (match) return match;
  }

  return null;
}

/**
 * Recherche la chorégraphie Dançad'Or correspondante.
 * Priorité :
 * 1. `dancadorChoreoId` explicite
 * 2. `sequenceurId` ou `presetId` ou `audioMasterId`
 * 3. Titre / nom normalisé
 *
 * @param {Object|string} pieceOrTitle - Objet morceau ou titre brut
 * @param {Array} choreographies - Catalogue des chorégraphies publiées Dançad'Or
 * @returns {Object|null} Chorégraphie correspondante ou null
 */
export function findMatchingChoreography(pieceOrTitle, choreographies = []) {
  if (!Array.isArray(choreographies) || choreographies.length === 0) return null;

  const isPieceObj = typeof pieceOrTitle === 'object' && pieceOrTitle !== null;
  const choreoId = isPieceObj ? pieceOrTitle.dancadorChoreoId : null;
  const seqId = isPieceObj ? pieceOrTitle.sequenceurId : null;
  const rawTitle = isPieceObj ? pieceOrTitle.titre : pieceOrTitle;
  const normTitle = normalizeString(rawTitle);

  // 1. Identifiant direct de chorégraphie
  if (choreoId) {
    const direct = choreographies.find((c) => c.id === choreoId);
    if (direct) return direct;
  }

  // 2. Référence vers un preset ou audio master Séquenceur
  if (seqId) {
    const seqMatch = choreographies.find(
      (c) =>
        c.sequenceurId === seqId ||
        c.presetId === seqId ||
        c.audioMasterId === seqId ||
        c.audioId === seqId
    );
    if (seqMatch) return seqMatch;
  }

  // 3. Correspondance de titre normalisé
  if (normTitle) {
    const titleMatch = choreographies.find((c) => normalizeString(c.nom || c.titre) === normTitle);
    if (titleMatch) return titleMatch;
  }

  return null;
}

/**
 * Construit un ensemble de dictionnaires mémoïsés pour une résolution instantanée en temps constant O(1).
 *
 * @param {Object} params
 * @param {Array} params.catalogRhythms
 * @param {Array} params.toadasList
 * @param {Array} params.cultureDocsList
 * @param {Array} params.choreographies
 * @returns {Object} Index mémoïsés
 */
export function buildResolutionDictionaries({
  catalogRhythms = [],
  toadasList = [],
  cultureDocsList = [],
  choreographies = []
}) {
  // Index Séquenceur
  const seqById = new Map();
  const seqByNormTitle = new Map();
  (catalogRhythms || []).forEach((r) => {
    if (r.id) seqById.set(r.id, r);
    if (r.presetId) seqById.set(r.presetId, r);
    if (r.jsonUrl) seqById.set(r.jsonUrl, r);

    const norm = normalizeString(r.titre || r.name || r.displayTitle);
    if (norm && (!seqByNormTitle.has(norm) || r._collection === 'presets')) {
      seqByNormTitle.set(norm, r);
    }
  });

  // Index Toadas
  const toadasById = new Map();
  const toadasByNormTitle = new Map();
  (toadasList || []).forEach((t) => {
    if (t.id) toadasById.set(t.id, t);
    const norm = normalizeString(t.titre);
    if (norm && !toadasByNormTitle.has(norm)) {
      toadasByNormTitle.set(norm, t);
    }
  });

  // Index Fiches Culture
  const cultureById = new Map();
  const cultureByNormTitle = new Map();
  (cultureDocsList || []).forEach((c) => {
    if (c.id) cultureById.set(c.id, c);
    const norm = normalizeString(c.titre || c.name);
    if (norm && !cultureByNormTitle.has(norm)) {
      cultureByNormTitle.set(norm, c);
    }
  });

  // Index Chorégraphies Dançad'Or
  const choreosById = new Map();
  const choreosBySeqId = new Map();
  const choreosByNormTitle = new Map();
  (choreographies || []).forEach((ch) => {
    if (ch.id) choreosById.set(ch.id, ch);
    if (ch.sequenceurId) choreosBySeqId.set(ch.sequenceurId, ch);
    if (ch.presetId) choreosBySeqId.set(ch.presetId, ch);
    if (ch.audioMasterId) choreosBySeqId.set(ch.audioMasterId, ch);
    if (ch.audioId) choreosBySeqId.set(ch.audioId, ch);

    const norm = normalizeString(ch.nom || ch.titre);
    if (norm && !choreosByNormTitle.has(norm)) {
      choreosByNormTitle.set(norm, ch);
    }
  });

  return {
    seqById,
    seqByNormTitle,
    toadasById,
    toadasByNormTitle,
    cultureById,
    cultureByNormTitle,
    choreosById,
    choreosBySeqId,
    choreosByNormTitle
  };
}

/**
 * Résout dynamiquement l'intégralité des données techniques et artistiques vivantes d'un morceau
 * depuis la mémoire vive, sans recalculer la tablature lourde (calcul paresseux).
 *
 * @param {Object} piece - Fiche morceau issue de Firestore
 * @param {Object} dicts - Dictionnaires d'indexation construits par buildResolutionDictionaries
 * @returns {Object} Objet résolu avec toutes les liaisons actives et indicateurs
 */
export function resolvePieceLiveTechnicalData(piece, dicts) {
  if (!piece) return null;

  const {
    seqById,
    seqByNormTitle,
    toadasById,
    toadasByNormTitle,
    cultureById,
    cultureByNormTitle,
    choreosById,
    choreosBySeqId,
    choreosByNormTitle
  } = dicts || {};

  const normTitre = normalizeString(piece.titre);

  // 1. Résolution du preset Séquenceur
  let preset = null;
  if (piece.sequenceurId && seqById?.has(piece.sequenceurId)) {
    preset = seqById.get(piece.sequenceurId);
  } else if (piece.sequenceurFileUrl && seqById?.has(piece.sequenceurFileUrl)) {
    preset = seqById.get(piece.sequenceurFileUrl);
  } else if (normTitre && seqByNormTitle?.has(normTitre)) {
    preset = seqByNormTitle.get(normTitre);
  }

  // 2. Résolution de la Toada du Varal
  let activeToada = null;
  if (piece.toadaDocId && toadasById?.has(piece.toadaDocId)) {
    activeToada = toadasById.get(piece.toadaDocId);
  } else if (normTitre && toadasByNormTitle?.has(normTitre)) {
    activeToada = toadasByNormTitle.get(normTitre);
  }

  // 3. Résolution des Fiches Culturelles du Varal (multi-liaison dynamique avec rétrocompatibilité)
  const ids = Array.isArray(piece.cultureDocIds)
    ? piece.cultureDocIds
    : (piece.cultureDocId ? [piece.cultureDocId] : []);

  let activeCultureDocs = [];
  if (ids.length > 0 && cultureById) {
    activeCultureDocs = ids.map((id) => cultureById.get(id)).filter(Boolean);
  } else if (normTitre && cultureByNormTitle?.has(normTitre)) {
    const match = cultureByNormTitle.get(normTitre);
    if (match) activeCultureDocs = [match];
  }

  const activeCultureDoc = activeCultureDocs[0] || null;

  // 4. Résolution de la Chorégraphie Dançad'Or
  let activeChoreography = null;
  if (piece.dancadorChoreoId && choreosById?.has(piece.dancadorChoreoId)) {
    activeChoreography = choreosById.get(piece.dancadorChoreoId);
  } else if (piece.sequenceurId && choreosBySeqId?.has(piece.sequenceurId)) {
    activeChoreography = choreosBySeqId.get(piece.sequenceurId);
  } else if (preset?.id && choreosBySeqId?.has(preset.id)) {
    activeChoreography = choreosBySeqId.get(preset.id);
  } else if (normTitre && choreosByNormTitle?.has(normTitre)) {
    activeChoreography = choreosByNormTitle.get(normTitre);
  }

  // 5. Audio actif (Preset > Toada > Morceau personnalisé > Repli ancien)
  const activeAudioUrl =
    (preset?.audioUrl || '').trim() ||
    (activeToada?.audioUrl || '').trim() ||
    (piece.audioUrl || '').trim() ||
    null;

  // 6. Présence de tablature (calcul paresseux : simple booléen)
  const hasTablature = Boolean(preset?.parsedData || piece.tablature);

  // 7. Signes du Mestre (lus en direct depuis le Preset, sinaisDoMestre ou signalIds)
  const activeSinaisDoMestre =
    (Array.isArray(preset?.parsedData?.sinaisDoMestre) && preset.parsedData.sinaisDoMestre.length > 0)
      ? preset.parsedData.sinaisDoMestre
      : (Array.isArray(preset?.sinaisDoMestre) && preset.sinaisDoMestre.length > 0)
        ? preset.sinaisDoMestre
        : (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)
          ? piece.sinaisDoMestre
          : (Array.isArray(piece.signalIds) ? piece.signalIds : []);

  // 8. BPM actif
  const activeBpm =
    preset?.bpm ||
    preset?.parsedData?.bpm ||
    preset?.parsedData?.metadata?.bpm ||
    piece.bpm ||
    null;

  // 9. Vidéo active (supporte videoUrl, youtubeUrl à la racine ou dans metadata)
  const activeVideoUrl =
    (piece.videoUrl || '').trim() ||
    (piece.youtubeUrl || '').trim() ||
    (preset?.videoUrl || '').trim() ||
    (preset?.youtubeUrl || '').trim() ||
    (preset?.parsedData?.videoUrl || '').trim() ||
    (preset?.parsedData?.youtubeUrl || '').trim() ||
    (preset?.parsedData?.metadata?.videoUrl || '').trim() ||
    (preset?.parsedData?.metadata?.youtubeUrl || '').trim() ||
    (Array.isArray(piece.videos) && piece.videos[0]?.url ? piece.videos[0].url.trim() : null);

  // 10. Contexte Historique & Histoire (supporte fiches culture, metadata preset en fr/pt)
  const cultureTexts = activeCultureDocs
    .map((c) => (c?.texte || c?.description || '').trim())
    .filter(Boolean)
    .join('\n\n');

  const activeHistoire =
    cultureTexts ||
    (activeCultureDoc?.texte || activeCultureDoc?.description || '').trim() ||
    (preset?.histoire || '').trim() ||
    (preset?.parsedData?.metadata?.histoire || '').trim() ||
    (preset?.parsedData?.metadata?.contexteHistorique || '').trim() ||
    (preset?.parsedData?.metadata?.descriptionFr || '').trim() ||
    (preset?.parsedData?.metadata?.description || '').trim() ||
    (preset?.parsedData?.metadata?.descriptionPt || '').trim() ||
    (piece.contexteHistorique || piece.histoire || '').trim() ||
    null;

  return {
    ...piece,
    // Objets vivants résolus
    preset,
    activeToada,
    activeCultureDoc,
    activeCultureDocs,
    activeChoreography,
    // Données dérivées résolues
    activeAudioUrl,
    hasTablature,
    activeSinaisDoMestre,
    activeBpm,
    activeVideoUrl,
    activeHistoire,
    // Type et identifiant Séquenceur résolus et alignés
    sequenceurType: preset?._collection || piece.sequenceurType || (preset ? 'presets' : null),
    sequenceurId: piece.sequenceurId || preset?.id || null,
    // Indicateurs sémantiques de liaison
    hasSequencer: Boolean(preset || piece.sequenceurId || piece.sequenceurFileUrl),
    hasAudio: Boolean(activeAudioUrl),
    hasChoreography: Boolean(activeChoreography || piece.dancadorChoreoId),
    hasToada: Boolean(activeToada || piece.toadaDocId),
    hasCulture: activeCultureDocs.length > 0 || Boolean(piece.cultureDocId) || (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds.length > 0)
  };
}

/**
 * Calcul paresseux (lazy) de la tablature textuelle complète.
 * N'est exécuté qu'à la demande explicite (ex. ouverture de la modale Tablature).
 *
 * @param {Object} resolvedPiece - Morceau résolu par resolvePieceLiveTechnicalData
 * @returns {string} Partition textuelle formatée
 */
export function getPieceTablature(resolvedPiece) {
  if (!resolvedPiece) return '';
  if (resolvedPiece.preset?.parsedData) {
    try {
      const generated = formatPieceTablature(resolvedPiece.preset.parsedData);
      if (generated) return generated;
    } catch (e) {
      console.warn("Erreur lors du calcul dynamique de la tablature :", e);
    }
  }
  return resolvedPiece.tablature || '';
}

/**
 * Résout dynamiquement les entraînements associés à un morceau
 * d'après son identifiant de preset ou son objet morceau.
 * Garantit un dédoublonnage strict par identifiant et respecte les exclusions.
 *
 * @param {string|Object} sequenceurIdOrPiece - Identifiant du preset ou objet morceau complet
 * @param {Array<Object>} trainingsList - Liste des entraînements du groupe
 * @param {Array<string>} [trainingIds=[]] - Liste optionnelle d'identifiants d'entraînements rattachés manuellement
 * @param {Array<string>} [excludedTrainingIds=[]] - Liste optionnelle d'identifiants d'entraînements exclus
 * @returns {Array<{ id: string, title: string, description: string, startBpm: number, targetBpm: number, stagesCount: number, stages: Array, presetId: string, rawTraining: Object }>}
 */
export function resolvePieceTrainings(sequenceurIdOrPiece, trainingsList = [], trainingIds = [], excludedTrainingIds = []) {
  if (!Array.isArray(trainingsList) || trainingsList.length === 0) {
    return [];
  }

  let cleanSeqId = '';
  let cleanTrainingIds = [];
  let cleanExcludedIds = [];

  if (sequenceurIdOrPiece && typeof sequenceurIdOrPiece === 'object') {
    cleanSeqId = String(
      sequenceurIdOrPiece.sequenceurId ||
      sequenceurIdOrPiece.presetId ||
      sequenceurIdOrPiece.preset?.id ||
      ''
    ).trim();
    cleanTrainingIds = Array.isArray(sequenceurIdOrPiece.trainingIds)
      ? sequenceurIdOrPiece.trainingIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
    cleanExcludedIds = Array.isArray(sequenceurIdOrPiece.excludedTrainingIds)
      ? sequenceurIdOrPiece.excludedTrainingIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
  } else {
    cleanSeqId = sequenceurIdOrPiece ? String(sequenceurIdOrPiece).trim() : '';
    cleanTrainingIds = Array.isArray(trainingIds)
      ? trainingIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
    cleanExcludedIds = Array.isArray(excludedTrainingIds)
      ? excludedTrainingIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
  }

  if (!cleanSeqId && cleanTrainingIds.length === 0) {
    return [];
  }

  // Dédoublonnage préalable strict des entraînements de la liste par identifiant unique
  const uniqueTrainings = Array.from(
    new Map(
      trainingsList
        .filter((t) => t && t.id)
        .map((t) => [String(t.id).trim(), t])
    ).values()
  );

  const excludedSet = new Set(cleanExcludedIds);
  const matched = [];

  for (const t of uniqueTrainings) {
    const tid = String(t.id).trim();

    // Règle d'exclusion : ne pas inclure si marqué comme ignoré/exclu pour ce morceau
    if (excludedSet.has(tid)) {
      continue;
    }

    const tPresetId = String(t.presetId || t.sequenceurId || '').trim();
    const matchesPreset = cleanSeqId && tPresetId && tPresetId === cleanSeqId;
    const matchesExplicitId = cleanTrainingIds.includes(tid);

    if (matchesPreset || matchesExplicitId) {
      matched.push(t);
    }
  }

  // Dédoublonnage final strict par identifiant
  const finalUniqueTrainings = Array.from(
    new Map(matched.map((t) => [String(t.id).trim(), t])).values()
  );

  return finalUniqueTrainings.map((t) => {
    const stages = computeTrainingStages(t);
    const startBpm = Number(t.startBpm ?? (stages.length > 0 ? stages[0].startBpm : 60));
    const targetBpm = Number(t.targetBpm ?? (stages.length > 0 ? stages[stages.length - 1].targetBpm : 100));

    return {
      id: t.id,
      title: t.title || t.titre || t.name || 'Entraînement',
      description: t.description || '',
      startBpm,
      targetBpm,
      stagesCount: stages.length,
      stages,
      presetId: t.presetId || cleanSeqId,
      rawTraining: t
    };
  });
}


