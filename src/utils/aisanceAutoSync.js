import { doc, setDoc } from 'firebase/firestore';
import { normalizeString } from './repertoireMatcher.js';

/**
 * Hiérarchie numérique des niveaux d'aisance pour empêcher toute rétrogradation automatique.
 */
export const COMFORT_RANKS = { decouverte: 1, pratique: 2, alaise: 3, referent: 4 };

/**
 * Stades vocaux progressifs (Chœur -> Simultané Instrument/Danse + Chant -> Soliste Puxador).
 */
export const VOCAL_STAGES = ['none', 'coro', 'simultane', 'puxador'];

export const VOCAL_STAGE_RANKS = { none: 0, coro: 1, simultane: 2, puxador: 3 };

export function normalizeVocalStage(stage) {
  const clean = String(stage || 'none').trim().toLowerCase();
  return VOCAL_STAGES.includes(clean) ? clean : 'none';
}

/**
 * Calcule la promotion automatique du niveau de confort suite à une pratique réelle
 * sans jamais rétrograder un niveau supérieur déjà déclaré par l'élève.
 */
export function computePromotedComfort({
  currentComfort = null, completedStagesCount = 0, totalStagesCount = 0, quizScorePct = null
} = {}) {
  const currentRank = COMFORT_RANKS[currentComfort] || 0;
  let targetComfort = null;

  if (totalStagesCount > 0 && completedStagesCount >= totalStagesCount) {
    targetComfort = 'alaise';
  } else if (completedStagesCount >= 1 || (typeof quizScorePct === 'number' && quizScorePct >= 0.75)) {
    targetComfort = 'pratique';
  }

  const targetRank = COMFORT_RANKS[targetComfort] || 0;
  if (targetRank > currentRank) {
    return { promoted: true, newComfort: targetComfort, previousComfort: currentComfort || null };
  }
  return { promoted: false, newComfort: currentComfort || null, previousComfort: currentComfort || null };
}

/**
 * Sélectionne le prochain événement à venir comportant un fil conducteur non vide.
 */
export function findNextRehearsalWithSetlist(events = [], todayIso = null) {
  if (!Array.isArray(events) || events.length === 0) return null;
  const today = todayIso || new Date().toISOString().split('T')[0];
  const valid = events.filter((ev) => {
    if (!ev || ev.isArchived || ev.status === 'cancelled') return false;
    if (!Array.isArray(ev.setlist) || ev.setlist.length === 0) return false;
    const evDate = String(ev.dateDebut || ev.date || '').split('T')[0];
    return !evDate || evDate >= today;
  });
  valid.sort((a, b) => String(a.dateDebut || a.date || '').localeCompare(String(b.dateDebut || b.date || '')));
  return valid[0] || null;
}

/**
 * Agrège les stades vocaux (Coro, Simultané, Puxador) des membres pour une Toada / un morceau.
 */
export function aggregateToadaVocalMetrics(song, usersList = [], piecesProgressMap = {}, repertoire = []) {
  const normSong = normalizeString(song?.titre);
  const linkedPiece = (repertoire || []).find(
    (p) => p.toadaDocId === song?.id || p.id === song?.id || (normSong && normalizeString(p.titre) === normSong)
  );
  let coroCount = 0;
  let simultaneCount = 0;
  const puxadores = [];
  (usersList || []).forEach((u) => {
    const uProg = piecesProgressMap?.[u.id] || {};
    const entry = uProg[song?.id] || (linkedPiece && uProg[linkedPiece.id]) || {};
    const stage = normalizeVocalStage(entry.vocalStage);
    if (stage === 'coro' || stage === 'simultane' || stage === 'puxador') coroCount++;
    if (stage === 'simultane' || stage === 'puxador') simultaneCount++;
    if (stage === 'puxador') puxadores.push(u.surnom || u.prenom || u.displayName || u.nom || 'Membre');
  });
  return { coroCount, simultaneCount, puxadorCount: puxadores.length, puxadores };
}

/**
 * Enregistre le confort et/ou le stade vocal d'un morceau dans users/{userId}/parcours/{groupId}.
 */
export async function savePieceComfortAndVocal({ db, userId, groupId, pieceId, confort, vocalStage }) {
  if (!db || !userId || !pieceId) return;
  const parcoursRef = doc(db, 'users', userId, 'parcours', groupId || 'default');
  const payload = { piecesProgress: { [pieceId]: { updatedAt: Date.now() } } };
  if (confort !== undefined) {
    payload.evaluations = { [pieceId]: confort };
    payload.piecesProgress[pieceId].confort = confort;
  }
  if (vocalStage !== undefined) payload.piecesProgress[pieceId].vocalStage = normalizeVocalStage(vocalStage);
  await setDoc(parcoursRef, payload, { merge: true });
}

export async function syncComfortAfterPractice({
  db, userId, groupId, pieceId, currentComfort = null,
  completedStagesCount = 0, totalStagesCount = 0, quizScorePct = null, onPromoted = null
}) {
  const res = computePromotedComfort({ currentComfort, completedStagesCount, totalStagesCount, quizScorePct });
  if (res.promoted && res.newComfort) {
    await savePieceComfortAndVocal({ db, userId, groupId, pieceId, confort: res.newComfort });
    if (typeof onPromoted === 'function') onPromoted(res.newComfort, pieceId);
  }
  return res;
}
