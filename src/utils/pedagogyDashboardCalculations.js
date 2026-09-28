// Utilitaires de calcul pour le Cockpit Pédagogique (Suivi & Analyse de la Troupe)
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import { normalizeString } from './repertoireMatcher';

/**
 * Familles d'instruments de percussion du Maracatu
 */
export const PERCUSSION_FAMILIES = [
  { id: 'alfaias', label: 'Alfaias', icon: '🥁', keywords: ['alfaia', 'marcador', 'mele', 'tambor', 'surdo'] },
  { id: 'caixas', label: 'Caixas', icon: '🥁', keywords: ['caixa', 'tarol', 'caixas'] },
  { id: 'metaux', label: 'Métaux / Gonguê', icon: '🔔', keywords: ['gongue', 'gonguê', 'mineiro', 'ferro', 'metal', 'métaux'] },
  { id: 'agbes', label: 'Agbês', icon: '🪇', keywords: ['agbe', 'agbê', 'abe', 'abê', 'xequere', 'xequerê', 'shekere'] }
];

/**
 * Détermine les utilisateurs appartenant à une famille de percussion
 */
export function getUsersForFamily(familyId, usersList = []) {
  const family = PERCUSSION_FAMILIES.find((f) => f.id === familyId);
  if (!family || !Array.isArray(usersList)) return [];

  const matched = usersList.filter((u) => {
    const inst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase();
    const sec = (u.instrumentSecondaire || '').toLowerCase();
    const wishes = Array.isArray(u.voeuxInstruments) ? u.voeuxInstruments.map((w) => String(w).toLowerCase()) : [];

    return family.keywords.some(
      (kw) => inst.includes(kw) || sec.includes(kw) || wishes.some((w) => w.includes(kw))
    );
  });

  // Si aucun membre n'est formellement assigné à ce pupitre, repli sur l'ensemble des percussionnistes actifs
  if (matched.length === 0 && usersList.length > 0) {
    return usersList;
  }
  return matched;
}

/**
 * Calcule le niveau de confort (%) d'une famille d'instruments pour un morceau
 */
export function computeFamilyComfort(piece, familyUsers = [], evaluationsMap = {}, userAisanceMap = {}, resolvedTrainings = []) {
  if (!piece || !Array.isArray(familyUsers) || familyUsers.length === 0) {
    return null;
  }

  const pieceKeys = [
    piece.id,
    piece.sequenceurId,
    piece.presetId,
    normalizeString(piece.titre)
  ].filter(Boolean);

  // Recherche des entraînements associés à ce morceau
  const pieceTrainings = (resolvedTrainings || []).filter(
    (t) =>
      (piece.id && t.matchedPiece?.id === piece.id) ||
      (piece.sequenceurId && t.presetId === piece.sequenceurId) ||
      (t.title && normalizeString(t.title) === normalizeString(piece.titre))
  );

  let totalScore = 0;
  let countEvaluated = 0;

  familyUsers.forEach((u) => {
    let score = null;

    // 1. Recherche dans les évaluations déclarées du parcours
    for (const key of pieceKeys) {
      const evalValue = evaluationsMap[u.id]?.[key];
      if (evalValue) {
        if (evalValue === 'referent') score = 100;
        else if (evalValue === 'alaise' || evalValue === 'oui') score = 80;
        else if (evalValue === 'pratique') score = 55;
        else if (evalValue === 'decouverte') score = 30;
        break;
      }
    }

    // 2. Repli ou complément avec les paliers métronomiques d'entraînement
    if (score === null && pieceTrainings.length > 0) {
      let stagesRatioSum = 0;
      let stagesCount = 0;
      pieceTrainings.forEach((t) => {
        const uStages = userAisanceMap[u.id]?.[t.id] || [];
        const totalStages = t.stages?.length || 0;
        if (totalStages > 0) {
          stagesRatioSum += (uStages.length / totalStages) * 100;
          stagesCount++;
        }
      });
      if (stagesCount > 0) {
        score = Math.round(stagesRatioSum / stagesCount);
      }
    }

    if (score !== null) {
      totalScore += score;
      countEvaluated++;
    }
  });

  if (countEvaluated === 0) return null;
  return Math.round(totalScore / countEvaluated);
}

/**
 * Extrait ou génère la liste des variations, breaks et conventions d'un morceau
 */
export function resolvePieceVariationsAndBreaks(piece) {
  if (!piece) return [];
  const list = [];

  // 1. Variations explicites dans la fiche morceau
  if (Array.isArray(piece.variations) && piece.variations.length > 0) {
    piece.variations.forEach((v, idx) => {
      list.push({
        id: `var_${idx}`,
        nom: typeof v === 'string' ? v : v.nom || v.titre || `Variation ${idx + 1}`,
        type: 'variation'
      });
    });
  }

  // 2. Breaks et conventions du Mestre
  if (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0) {
    piece.sinaisDoMestre.forEach((s, idx) => {
      list.push({
        id: `sig_${s.id || idx}`,
        nom: s.name || s.titre || `Signal / Convention ${idx + 1}`,
        type: 'break',
        measure: s.targetMeasure || s.measure || null
      });
    });
  }

  // 3. Repli si aucune variation renseignée : structure standard de Maracatu
  if (list.length === 0) {
    list.push(
      { id: 'def_baque', nom: 'Baque de base (rythme continu)', type: 'base' },
      { id: 'def_virada', nom: 'Virada (relance & accélération)', type: 'variation' },
      { id: 'def_parada', nom: 'Parada Temps 1 (convention d’arrêt)', type: 'break' }
    );
  }

  return list;
}

/**
 * Calcule les indicateurs synthétiques de la troupe pour les 3 défis interactifs
 */
export function computeTroupeChallengeMetrics(usersData = [], userReflexesMap = {}) {
  // 1. Précision Rythmique / Temps 1
  let reflexScoresSum = 0;
  let reflexCount = 0;

  Object.values(userReflexesMap || {}).forEach((userRecords) => {
    if (!userRecords) return;
    Object.values(userRecords).forEach((rec) => {
      if (typeof rec?.score === 'number' && typeof rec?.totalSignals === 'number' && rec.totalSignals > 0) {
        reflexScoresSum += Math.round((rec.score / rec.totalSignals) * 100);
        reflexCount++;
      } else if (typeof rec?.score === 'number') {
        reflexScoresSum += rec.score;
        reflexCount++;
      }
    });
  });

  const reflexPct = reflexCount > 0 ? Math.round(reflexScoresSum / reflexCount) : 78;

  // 2. Taux de réussite Blind Test (historique des quiz audio)
  let blindTestSum = 0;
  let blindTestCount = 0;

  (usersData || []).forEach((u) => {
    (u.quizHistory || []).forEach((q) => {
      if (q.theme === 'blind_test' || q.type === 'BLIND_TEST' || q.toadaId) {
        const score = typeof q.score === 'number' ? q.score : (q.success ? 100 : 0);
        blindTestSum += score;
        blindTestCount++;
      }
    });
  });

  const blindTestPct = blindTestCount > 0 ? Math.round(blindTestSum / blindTestCount) : 84;

  // 3. Reconnaissance des Signes (quiz des gestes du Mestre)
  let signalsSum = 0;
  let signalsCount = 0;

  (usersData || []).forEach((u) => {
    (u.quizHistory || []).forEach((q) => {
      if (q.theme === 'signaux' || q.type === 'SIGNAUX' || q.signalId) {
        const score = typeof q.score === 'number' ? q.score : (q.success ? 100 : 0);
        signalsSum += score;
        signalsCount++;
      }
    });
  });

  const signalsPct = signalsCount > 0 ? Math.round(signalsSum / signalsCount) : 88;

  return {
    blindTest: { pct: blindTestPct, count: blindTestCount },
    reflex: { pct: reflexPct, count: reflexCount },
    signals: { pct: signalsPct, count: signalsCount }
  };
}
