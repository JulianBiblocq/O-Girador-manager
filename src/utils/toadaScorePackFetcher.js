/**
 * toadaScorePackFetcher.js
 * Chargeur à la demande (lazy) du pack mélodique `/toada_packs` depuis Organizador (< 115 lignes).
 * Interroge `/toada_packs/{cantadorToadaId}` ou `where('documentId', '==', doc.id)` borné au `groupId` actif,
 * et synthétise un projet rythmique de repli depuis `rawTxtCode` si aucun pack mélodique n'existe encore.
 */
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { sanitizePitchHz } from './pitchHzContract.js';

function parseRawTxtFallbackPatterns(rawTxtCode = '', bpm = 88) {
  const lines = String(rawTxtCode || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^\[sig:/i.test(l));
  const patterns = [], slots = [];
  let idx = 0;

  for (const line of lines) {
    const pauseMatch = line.match(/^\[PAUSE\s+(\d+)\s*M\]$/i);
    if (pauseMatch) {
      slots.push({ slotId: `slot-pause-${slots.length + 1}`, puxadorPatternId: null, coroPatternId: null, advanceMeasures: Math.max(1, Number(pauseMatch[1]) || 1) });
      continue;
    }
    const isTutti = /^\*{3}[\s\S]+\*{3}$/.test(line), isPux = !isTutti && /^\*[\s\S]+\*$/.test(line);
    const beatMatches = [...line.replace(/^\*+|\*+$/g, '').trim().matchAll(/\[(\d+)\]([^[]*)/g)];
    if (beatMatches.length === 0) continue;

    const hasAnacrusis = (Number(beatMatches[0][1]) || 1) > 1;
    const t1Idx = hasAnacrusis ? beatMatches.findIndex((m) => Number(m[1]) === 1) : 0;
    const effMain = hasAnacrusis && t1Idx >= 0 ? beatMatches.slice(t1Idx) : beatMatches;
    const measuresCount = Math.max(1, Math.min(4, Math.ceil(effMain.length / 4)));
    const mkEmpty = (len) => Array.from({ length: len }, (_, s) => ({ stepIndex: s, active: false, note: '', midiNumber: 0 }));
    const anacrusisSteps = mkEmpty(hasAnacrusis ? 16 : 0), mainSteps = mkEmpty(measuresCount * 16);

    const fillBeatSlice = (targetArr, beatZeroIdx, textSlice) => {
      const cleaned = String(textSlice || '').trim();
      if (!cleaned || cleaned === '0' || cleaned === '𝄽') return;
      const tokens = cleaned.split(/\s+/).filter(Boolean);
      tokens.slice(0, 4).forEach((tok, tIdx) => {
        if (tok === '0' || tok === '𝄽') return;
        const stepPos = beatZeroIdx * 4 + (tokens.length === 1 ? 0 : tokens.length === 2 ? tIdx * 2 : tIdx);
        if (stepPos >= targetArr.length) return;
        const isHold = tok === '_' || /^_+$/.test(tok);
        targetArr[stepPos] = { stepIndex: stepPos, active: true, isTie: isHold, isMelisma: tok === '_', note: isHold ? '───' : 'C4', midiNumber: 60, syllable: isHold ? '_' : tok, syllableAttack: !isHold };
        const dur = tokens.length === 1 ? 4 : tokens.length === 2 ? 2 : 1;
        for (let k = 1; k < dur && stepPos + k < targetArr.length; k++) {
          targetArr[stepPos + k] = { stepIndex: stepPos + k, active: true, isTie: true, note: '───', midiNumber: 60, syllable: '───' };
        }
      });
    };

    if (hasAnacrusis && t1Idx > 0) {
      beatMatches.slice(0, t1Idx).forEach((m) => fillBeatSlice(anacrusisSteps, Math.max(0, Math.min(3, (Number(m[1]) || 4) - 1)), m[2]));
    }
    effMain.forEach((m, bPos) => fillBeatSlice(mainSteps, bPos, m[2]));

    const mkPat = (role, suffix = '') => ({
      id: `fallback_pat_${++idx}${suffix}`, name: `Phrase ${idx}`, role, bpm, measuresCount,
      hasAnacrusis, hasTailBeat: false, foldNotesView: true, rhythmOnlyMode: true,
      stepsInTroupeKey: true, anacrusisSteps: [...anacrusisSteps], mainSteps: [...mainSteps], rawLineCode: line,
    });

    if (isTutti) {
      const pPat = mkPat('puxador', '_p'), cPat = mkPat('coro', '_c');
      patterns.push(pPat, cPat);
      slots.push({ slotId: `slot-${slots.length + 1}`, puxadorPatternId: pPat.id, coroPatternId: cPat.id, advanceMeasures: measuresCount });
    } else {
      const pat = mkPat(isPux ? 'puxador' : 'coro');
      patterns.push(pat);
      slots.push({ slotId: `slot-${slots.length + 1}`, puxadorPatternId: isPux ? pat.id : null, coroPatternId: isPux ? null : pat.id, advanceMeasures: measuresCount });
    }
  }
  return { patterns, slots };
}

export function buildFallbackProjectFromRawTxtCode(toadaDoc = {}, piece = {}) {
  const rawTxt = toadaDoc?.rawTxtCode || piece?.activeToada?.rawTxtCode || piece?.rawTxtCode || '';
  const bpm = Number(toadaDoc?.bpmDefaut || toadaDoc?.bpm || piece?.activeBpm || piece?.bpm || 88);
  const { patterns, slots } = parseRawTxtFallbackPatterns(rawTxt, bpm);
  return {
    id: toadaDoc?.id || piece?.id || 'fallback_toada', title: toadaDoc?.titre || piece?.titre || 'Toada', bpm,
    timeSignature: toadaDoc?.signature || toadaDoc?.timeSignature || '4/4', troupeKey: toadaDoc?.tonaliteDefaut || 'Do Majeur',
    sungKey: toadaDoc?.tonaliteChanteeOrigine || toadaDoc?.tonaliteDefaut || 'Do Majeur', transpositionSemitones: 0,
    referencePitchHz: sanitizePitchHz(toadaDoc?.referencePitchHz ?? piece?.referencePitchHz),
    harmonyGrid: toadaDoc?.harmonyGrid || toadaDoc?.globalHarmonyGrid || null, isRhythmFallbackOnly: true, patterns, slots,
  };
}

export async function fetchToadaScorePackOnDemand({ piece = null, toadaDoc = null, groupId = null } = {}) {
  const docObj = toadaDoc || piece?.activeToada || null, memPack = piece?.activeCantadorPack;
  if (memPack && Array.isArray(memPack.patterns) && memPack.patterns.length > 0) return { pack: memPack, hasMelodicPack: true, source: 'memory' };

  const targetToadaId = piece?.cantadorToadaId || docObj?.cantadorToadaId || '';
  if (targetToadaId) {
    try {
      const snap = await getDoc(doc(db, 'toada_packs', targetToadaId));
      if (snap.exists()) return { pack: { id: snap.id, ...snap.data() }, hasMelodicPack: true, source: 'firestore_id' };
    } catch {}
  }

  const cleanGroupId = String(groupId || docObj?.groupId || piece?.groupId || '').trim().toLowerCase();
  const docId = docObj?.id || piece?.toadaDocId || '';
  if (docId && cleanGroupId) {
    try {
      const snap = await getDocs(query(collection(db, 'toada_packs'), where('groupId', '==', cleanGroupId), where('documentId', '==', docId), limit(1)));
      if (!snap.empty) return { pack: { id: snap.docs[0].id, ...snap.docs[0].data() }, hasMelodicPack: true, source: 'firestore_query' };
    } catch {}
  }

  const fallback = buildFallbackProjectFromRawTxtCode(docObj, piece);
  return { pack: fallback, hasMelodicPack: false, hasRhythmFallback: fallback.patterns.length > 0, source: 'raw_txt_fallback' };
}
