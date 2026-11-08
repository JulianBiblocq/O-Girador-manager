import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isTestOrE2ESequence } from '../hooks/useSequencerFirestoreData';

/**
 * Actions d'administration et d'épinglage pour le Cockpit Pédagogique Mestre (< 115 lignes).
 */
export async function pinPedagogyNote({ groupId, itemTitre, categoryInfo, requestCount = 0, authorName = 'Mestre' }) {
  if (!groupId || !itemTitre) return null;
  const mentionDemandes = requestCount > 0
    ? ` (${requestCount} demande${requestCount > 1 ? 's' : ''} d'élèves)`
    : '';
  const newNote = {
    id: `note_${Date.now()}`,
    titre: `🛠️ À travailler${categoryInfo ? ` [${categoryInfo}]` : ''} : ${itemTitre}${mentionDemandes}`,
    contenu: `Point de répétition prioritaire : ${itemTitre}.${requestCount > 0 ? `\n🙋 Signalé par ${requestCount} élève${requestCount > 1 ? 's' : ''} en demande de révision.` : ''}`,
    createdBy: authorName,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'associations', groupId, 'blocNotes', newNote.id), newNote);
  return `${itemTitre}${mentionDemandes}`;
}

export async function resetAllGroupEvaluations({ groupId, usersData = [] }) {
  if (!groupId) return {};
  await Promise.all(usersData.map(async (u) => {
    const docRef = doc(db, 'users', u.id, 'parcours', groupId);
    await setDoc(docRef, { evaluations: {} }, { merge: true });
  }));
  const emptyEvals = {};
  usersData.forEach((u) => { emptyEvals[u.id] = {}; });
  return emptyEvals;
}

export function detectE2EArtifacts({ sequencerRhythms = [], rhythmMetaList = [], evaluationsMap = {} }) {
  const list = [];
  (sequencerRhythms || []).forEach((r) => {
    if (isTestOrE2ESequence(r)) list.push({ ...r, source: 'sequencer' });
  });
  (rhythmMetaList || []).forEach((m) => {
    if (isTestOrE2ESequence(m)) list.push({ ...m, source: 'rhythmMetadata' });
  });
  Object.entries(evaluationsMap || {}).forEach(([uid, uEvals]) => {
    Object.keys(uEvals || {}).forEach((k) => {
      if (isTestOrE2ESequence({ id: k, title: k })) {
        list.push({ id: k, titre: k, uid, source: 'parcours' });
      }
    });
  });
  return list;
}

export async function purgeE2ETestData({ groupId, usersData = [] }) {
  let deletedCount = 0;
  const seqCollections = ['patterns', 'sections', 'presets', 'audio_masters'];
  for (const colName of seqCollections) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        if (isTestOrE2ESequence({ id: d.id, ...d.data() })) {
          await deleteDoc(d.ref);
          deletedCount++;
        }
      }
    } catch { /* ignore */ }
  }

  try {
    const metaSnap = await getDocs(collection(db, 'associations', groupId, 'rhythmMetadata'));
    for (const d of metaSnap.docs) {
      if (isTestOrE2ESequence({ id: d.id, ...d.data() })) {
        await deleteDoc(d.ref);
        deletedCount++;
      }
    }
  } catch { /* ignore */ }

  for (const u of usersData) {
    try {
      const parcoursRef = doc(db, 'users', u.id, 'parcours', groupId);
      const pSnap = await getDoc(parcoursRef);
      if (pSnap.exists()) {
        const pData = pSnap.data();
        let changed = false;
        const newEvals = { ...(pData.evaluations || {}) };
        const newRevs = { ...(pData.revisionsDemandees || {}) };
        Object.keys(newEvals).forEach((k) => {
          if (isTestOrE2ESequence({ id: k, title: k })) { delete newEvals[k]; changed = true; deletedCount++; }
        });
        Object.keys(newRevs).forEach((k) => {
          if (isTestOrE2ESequence({ id: k, title: k })) { delete newRevs[k]; changed = true; }
        });
        if (changed) {
          await setDoc(parcoursRef, { ...pData, evaluations: newEvals, revisionsDemandees: newRevs });
        }
      }
    } catch { /* ignore */ }
  }
  return deletedCount;
}

