import { calculateToadaScore } from './toadaProgressEngine';
import { normalizePupitreName } from './secretariatMetrics';
import { isTestOrE2ESequence } from '../hooks/useSequencerFirestoreData';

/** Utilitaires d'analyse des pupitres, des Points Chauds (Top 3) et des éléments E2E (< 135 lignes). */
export function isDanseMember(u) {
  if (!u) return false;
  if (u.pratiqueDanse === true || (u.niveauDanse && u.niveauDanse !== 'aucun')) return true;
  const inst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase().trim();
  const secInst = (u.instrumentSecondaire || '').toLowerCase().trim();
  if (inst.includes('danse') || secInst.includes('danse')) return true;
  if (Array.isArray(u.instrumentsJoues) && u.instrumentsJoues.some((i) => String(i).toLowerCase().includes('danse'))) return true;
  return Boolean(Array.isArray(u.voeuxInstruments) && u.voeuxInstruments.some((w) => String(w).toLowerCase().includes('danse')));
}

export function isPercuMember(u) {
  if (!u || u.pratiquePercussion === false) return false;
  if (u.pratiqueDanse === true && !u.instrument && !u.instrumentPrincipal && !u.pupitre && (!Array.isArray(u.voeuxInstruments) || u.voeuxInstruments.length === 0)) return false;
  const inst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase().trim();
  return !(inst === 'danse' && u.pratiquePercussion !== true);
}

export function buildPupitresList(assocInstruments = [], percuUsers = []) {
  const set = new Set();
  (assocInstruments || []).forEach((inst) => {
    const clean = (inst || '').trim();
    if (clean && clean.toLowerCase() !== 'danse') set.add(clean);
  });
  percuUsers.forEach((u) => {
    const declared = normalizePupitreName(u.instrumentPrincipal || u.instrument || u.pupitre);
    if (declared && declared !== 'Non défini' && declared !== 'En attente' && declared.toLowerCase() !== 'danse') set.add(declared);
  });
  if (set.size === 0) ['Alfaia', 'Caixa', 'Tarol', 'Gonguê', 'Agbê', 'Mineiro'].forEach((i) => set.add(i));
  return Array.from(set);
}

export function buildUnifiedRhythms({ sequencerRhythms = [], rhythmMetaList = [], evaluationsMap = {}, songs = [], fiches = [] }) {
  const map = new Map();
  (sequencerRhythms || []).forEach((r) => {
    const cleanTitle = r.title || r.titre || r.name || r.id;
    if (isTestOrE2ESequence(r) || isTestOrE2ESequence({ id: r.id, title: cleanTitle })) return;
    map.set(r.id, { id: r.id, titre: cleanTitle, jsonUrl: r.jsonUrl || null, source: 'sequencer' });
  });
  (rhythmMetaList || []).forEach((m) => {
    const existing = map.get(m.id);
    const cleanTitle = m.titre || m.title || existing?.titre || m.id;
    if (isTestOrE2ESequence({ id: m.id, title: cleanTitle })) return;
    map.set(m.id, { id: m.id, titre: cleanTitle, jsonUrl: m.jsonUrl || existing?.jsonUrl || null, source: 'metadata', ...m });
  });
  Object.values(evaluationsMap || {}).forEach((userEvals) => {
    Object.keys(userEvals || {}).forEach((key) => {
      if (isTestOrE2ESequence({ id: key, title: key })) return;
      if (!songs.find((s) => s.id === key) && !fiches.find((f) => f.id === key) && key !== 'entretien_global' && !key.endsWith('_chant') && !key.startsWith('danse_')) {
        if (!map.has(key)) map.set(key, { id: key, titre: key.replace(/_/g, ' '), source: 'evaluations' });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.titre.localeCompare(b.titre));
}

export function computeTopHotPoints({ pupitres = [], percuUsers = [], danseUsers = [], unifiedRhythms = [], songs = [], usersData = [], evaluationsMap = {}, revisionsCountMap = {}, t }) {
  const list = [];
  const seenKeys = new Set();

  const getStats = (rhythmId, filteredUsers, isDanse = false) => {
    let total = 0; let okCount = 0;
    filteredUsers.forEach((u) => {
      const e = isDanse ? (evaluationsMap[u.id]?.[`danse_${rhythmId}`] || evaluationsMap[u.id]?.[rhythmId]) : evaluationsMap[u.id]?.[rhythmId];
      if (e) { total++; if (e === 'alaise' || e === 'referent' || e === 'oui') okCount++; }
    });
    return { total, pct: total > 0 ? Math.round((okCount / total) * 100) : 0 };
  };

  pupitres.forEach((pupitre) => {
    const target = pupitre.toLowerCase().trim();
    const matched = percuUsers.filter((u) => {
      const uInst = (u.instrument || u.instrumentPrincipal || u.pupitre || '').toLowerCase();
      return uInst.includes(target) || target.includes(uInst);
    });
    const pUsers = matched.length > 0 ? matched : percuUsers;
    if (pUsers.length === 0) return;

    unifiedRhythms.forEach((r) => {
      const stats = getStats(r.id, pUsers, false);
      const reqCount = revisionsCountMap[r.id] || 0;
      if ((stats.total > 0 && stats.pct < 60) || reqCount > 0) {
        const itemKey = `percu_${pupitre}_${r.id}`;
        if (!seenKeys.has(itemKey)) {
          seenKeys.add(itemKey);
          list.push({
            id: itemKey, titre: r.titre, discipline: `🥁 Percussion [${pupitre}]`, pupitre, pct: stats.pct,
            requestCount: reqCount, urgencyScore: (reqCount * 30) + (100 - (stats.total > 0 ? stats.pct : 0)),
            detail: reqCount > 0 ? `🙋 ${reqCount} demande(s) • ${stats.pct}%` : (stats.total > 0 ? (t ? t('pedagogy.masteryRate', { rate: stats.pct }) : `${stats.pct}%`) : 'Non évalué'),
            rawItem: r, type: 'percussion', itemId: r.id
          });
        }
      }
    });
  });

  if (danseUsers.length > 0) {
    unifiedRhythms.forEach((r) => {
      const stats = getStats(r.id, danseUsers, true);
      const reqCount = revisionsCountMap[`danse_${r.id}`] || 0;
      if ((stats.total > 0 && stats.pct < 60) || reqCount > 0) {
        list.push({
          id: `danse_${r.id}`, titre: r.titre, discipline: '💃 Danse', pupitre: 'Danse', pct: stats.pct,
          requestCount: reqCount, urgencyScore: (reqCount * 30) + (100 - (stats.total > 0 ? stats.pct : 0)),
          detail: reqCount > 0 ? `🙋 ${reqCount} demande(s) • ${stats.pct}%` : `${stats.pct}%`,
          rawItem: r, type: 'danse', itemId: `danse_${r.id}`
        });
      }
    });
  }

  (songs || []).filter((s) => !s.isArchived).forEach((song) => {
    let totalScore = 0; let evaluatedCount = 0;
    usersData.forEach((u) => {
      const toadaSessions = (u.quizHistory || []).filter((e) => e.toadaId === song.id);
      if (toadaSessions.length > 0) { totalScore += calculateToadaScore(song.id, u.quizHistory || []).score; evaluatedCount++; }
      else if (evaluationsMap[u.id]?.[song.id]) {
        const m = evaluationsMap[u.id][song.id];
        evaluatedCount++;
        totalScore += m === 'referent' ? 100 : (m === 'alaise' || m === 'oui') ? 75 : m === 'pratique' ? 50 : 25;
      }
    });
    const avg = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;
    const reqCount = revisionsCountMap[song.id] || 0;
    if ((evaluatedCount > 0 && avg < 60) || reqCount > 0) {
      list.push({ id: `song_${song.id}`, titre: song.titre, discipline: '📜 Chant & Toada', pupitre: 'Chœur', pct: avg, requestCount: reqCount, urgencyScore: (reqCount * 30) + (100 - avg), detail: reqCount > 0 ? `🙋 ${reqCount} demande(s) • ${avg}%` : `${avg}%`, rawItem: song, type: 'song', itemId: song.id });
    }
  });

  return list.sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 3);
}
