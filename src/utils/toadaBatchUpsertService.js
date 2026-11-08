/**
 * Service de Fusion Intelligente (Upsert sans doublon) pour l'import JSON de Toadas et documents Varal (< 140 lignes).
 * Compare normalizeString(item.titre || item.title) avec les Toadas existantes du groupe :
 * - Fiche existante -> updateDoc (préserve l'id Firestore et les liens toadaDocId du Répertoire/QCM)
 * - Nouvelle fiche -> addDoc
 */

import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { normalizeString } from './repertoireMatcher.js';
import { stripToadaTechnicalMarkers, toadaToCleanHtml } from './toadaSerializer.js';
import { buildToadaStructure, findSixPresetForTitle, isToadaDocument } from './toadaSixPresetsSync.js';
import { cleanFirestorePayload } from './firestoreUtils.js';

export const parseTagsList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return typeof val === 'string' ? val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [];
};

export function formatAndCleanVaralLyrics(lyricsInput) {
  if (!lyricsInput) return '';
  let raw = '';
  if (typeof lyricsInput === 'string') raw = lyricsInput;
  else if (Array.isArray(lyricsInput)) {
    raw = lyricsInput.map((b) => {
      if (typeof b === 'string') return b;
      if (b?.isMixed && Array.isArray(b.segments)) return b.segments.map((s) => (s.isBold ? `<b>${s.text}</b>` : s.text)).join('');
      return [b?.puxador ? `<b>${b.puxador}</b>` : '', b?.coro || '', b?.choeur || ''].filter(Boolean).join('<br/>');
    }).filter(Boolean).join('<br/>');
  }
  return stripToadaTechnicalMarkers(raw).replace(/\*([^*]+)\*/g, (_, inner) => `<strong>${inner.trim()}</strong>`);
}

export function buildBatchImportItemPayload(item, { groupId, category, categoryName, computedType, existingDoc = null } = {}) {
  const titre = (item.titre || item.title || existingDoc?.titre || '').trim();
  const isToada = category === 'Toadas' || computedType === 'song' || isToadaDocument(item) || isToadaDocument(existingDoc);
  const preset = isToada ? findSixPresetForTitle(titre) : null;
  const rawTxtCode = item.rawTxtCode !== undefined ? String(item.rawTxtCode) : (item.codeTxt || item.structureTxt || preset?.rawTxtCode || existingDoc?.rawTxtCode || '');
  const rawBpm = item.bpm ?? item.bpmDefaut ?? preset?.bpm ?? existingDoc?.bpm ?? existingDoc?.bpmDefaut;
  const bpm = rawBpm !== undefined && rawBpm !== null && rawBpm !== '' ? Number(rawBpm) : null;
  const signatureRythmique = item.signatureRythmique || item.signature || preset?.signatureRythmique || existingDoc?.signatureRythmique || existingDoc?.signature || '4/4';
  const toadaStructure = rawTxtCode ? buildToadaStructure(rawTxtCode, signatureRythmique) : (item.toadaStructure || existingDoc?.toadaStructure || null);

  const existingClean = existingDoc?.parolesOriginales ? formatAndCleanVaralLyrics(existingDoc.parolesOriginales) : '';
  const incomingClean = item.parolesOriginales ? formatAndCleanVaralLyrics(item.parolesOriginales) : '';
  const parolesOriginales = existingDoc
    ? (existingClean || incomingClean || (rawTxtCode ? toadaToCleanHtml(rawTxtCode) : ''))
    : (incomingClean || (rawTxtCode ? toadaToCleanHtml(rawTxtCode) : ''));

  const pick = (nVal, oVal, fb = '') => (nVal !== undefined && nVal !== '' && (!Array.isArray(nVal) || nVal.length > 0) ? nVal : (oVal ?? fb));
  return cleanFirestorePayload({
    titre, categoryId: category || existingDoc?.categoryId || 'Toadas',
    categorie: categoryName || existingDoc?.categorie || category || 'Toadas',
    annee: parseInt(item.annee, 10) || existingDoc?.annee || new Date().getFullYear(),
    fileUrl: pick(item.fileUrl, existingDoc?.fileUrl, ''),
    type: computedType || existingDoc?.type || (isToada ? 'song' : 'pdf'),
    groupId: groupId || existingDoc?.groupId,
    dateAjout: existingDoc?.dateAjout || new Date().toISOString(), order: existingDoc?.order ?? 0,
    isArchived: item.isArchived !== undefined ? Boolean(item.isArchived) : Boolean(existingDoc?.isArchived),
    isHidden: item.isHidden !== undefined ? Boolean(item.isHidden) : Boolean(existingDoc?.isHidden),
    excludeFromPedagogy: item.excludeFromPedagogy !== undefined ? Boolean(item.excludeFromPedagogy) : Boolean(existingDoc?.excludeFromPedagogy),
    nacao: pick(item.nacao, existingDoc?.nacao, ''), rythme: pick(item.rythme, existingDoc?.rythme, ''),
    rawTxtCode, toadaStructure, bpm, bpmDefaut: bpm, signatureRythmique, signature: signatureRythmique,
    parolesOriginales,
    parolesPhonetiques: item.parolesPhonetiques ? formatAndCleanVaralLyrics(item.parolesPhonetiques) : (existingDoc?.parolesPhonetiques || ''),
    traduction: pick(item.traduction, existingDoc?.traduction, ''),
    notesLexique: pick(item.notesLexique, existingDoc?.notesLexique, []),
    anecdote: pick(item.anecdote, existingDoc?.anecdote, ''),
    thematiqueFabrication: item.thematiqueFabrication || existingDoc?.thematiqueFabrication || 'lutherie',
    contenuFabrication: pick(item.contenuFabrication, existingDoc?.contenuFabrication, ''),
    materielRequis: item.materielRequis ? parseTagsList(item.materielRequis) : (existingDoc?.materielRequis || []),
    outilsNecessaires: item.outilsNecessaires ? parseTagsList(item.outilsNecessaires) : (existingDoc?.outilsNecessaires || []),
    instrumentConcerne: pick(item.instrumentConcerne, existingDoc?.instrumentConcerne, ''),
    visuelAnimeUrl: pick(item.visuelAnimeUrl, existingDoc?.visuelAnimeUrl, ''),
    etapesFabrication: Array.isArray(item.etapesFabrication)
      ? item.etapesFabrication.map((step, idx) => ({
          ...step, id: step.id || Date.now() + idx + Math.random(), sousTitre: step.sousTitre || '',
          description: step.description || '', imageUrl: step.imageUrl || '',
          materiaux: parseTagsList(step.materiaux), outils: parseTagsList(step.outils)
        }))
      : (existingDoc?.etapesFabrication || []),
    questionsQcm: pick(item.questionsQcm, existingDoc?.questionsQcm, []),
    categorieFiche: pick(item.categorieFiche, existingDoc?.categorieFiche, ''),
    hexPrimary: item.hexPrimary || (item.couleurs && item.couleurs[0]) || existingDoc?.hexPrimary || '#EAB308',
    hexSecondary: item.hexSecondary || (item.couleurs && item.couleurs[1]) || existingDoc?.hexSecondary || '#FFFFFF',
    iconeStamp: item.iconeStamp || item.stampKey || existingDoc?.iconeStamp || 'axe-default',
    personnageOrisha: pick(item.personnageOrisha, existingDoc?.personnageOrisha, ''),
    villeRegion: pick(item.villeRegion, existingDoc?.villeRegion, ''), epoque: pick(item.epoque, existingDoc?.epoque, ''),
    legendeImage: pick(item.legendeImage, existingDoc?.legendeImage, ''),
    chapitres: pick(item.chapitres, existingDoc?.chapitres, []),
    lexiqueMotsCles: pick(item.lexiqueMotsCles, existingDoc?.lexiqueMotsCles, ''),
    videoUrl: pick(item.videoUrl, existingDoc?.videoUrl, ''), lienSequenceurId: pick(item.lienSequenceurId, existingDoc?.lienSequenceurId, '')
  });
}

export async function executeSmartBatchImport({
  db, data = [], existingDocs = null, groupId, category = 'Toadas', categoryName = 'Toadas',
  computedType = 'song', updateDocFn = null, addDocFn = null
} = {}) {
  let docsList = Array.isArray(existingDocs) ? existingDocs : [];
  if (!existingDocs && db && groupId) {
    const snap = await getDocs(query(collection(db, 'documents'), where('groupId', '==', groupId)));
    docsList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const existingToadasMap = new Map();
  docsList.filter(isToadaDocument).forEach((d) => {
    const norm = normalizeString(d.titre || d.title);
    if (norm && !existingToadasMap.has(norm)) existingToadasMap.set(norm, d);
  });

  let createdCount = 0, updatedCount = 0;
  const operations = [];
  for (const item of data) {
    const rawTitle = (item?.titre || item?.title || '').trim();
    if (!rawTitle) continue;
    const normTitle = normalizeString(rawTitle), isToada = category === 'Toadas' || computedType === 'song' || isToadaDocument(item);
    const existingDoc = isToada ? (existingToadasMap.get(normTitle) || null) : null;
    const payload = buildBatchImportItemPayload(item, { groupId, category, categoryName, computedType, existingDoc });

    if (existingDoc?.id) {
      if (updateDocFn) await updateDocFn(existingDoc.id, payload);
      else if (db) await updateDoc(doc(db, 'documents', existingDoc.id), payload);
      existingToadasMap.set(normTitle, { ...existingDoc, ...payload, id: existingDoc.id });
      updatedCount++;
      operations.push({ action: 'updateDoc', id: existingDoc.id, titre: rawTitle, payload });
    } else {
      let createdId = `new_${createdCount + 1}`;
      if (addDocFn) { const r = await addDocFn(payload); if (r?.id) createdId = r.id; }
      else if (db) { const refDoc = await addDoc(collection(db, 'documents'), payload); createdId = refDoc.id; }
      if (isToada && normTitle) existingToadasMap.set(normTitle, { ...payload, id: createdId });
      createdCount++;
      operations.push({ action: 'addDoc', id: createdId, titre: rawTitle, payload });
    }
  }
  return { totalCount: createdCount + updatedCount, createdCount, updatedCount, operations };
}
