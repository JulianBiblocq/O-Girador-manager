/**
 * Service de soumission unitaire (création / modification) d'un document du Varal (< 170 lignes).
 * Prend en charge les livrets Projet (`projet_presentation`), PDF/Photos compressées et Albums Cloud.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase.js';
import { cleanFirestorePayload } from './firestoreUtils.js';
import { applyCultureDocumentFields, processEtapesImages } from './documentCulturePayloadHelper.js';
import { buildToadaStructure } from './toadaSixPresetsSync.js';
import { stripToadaTechnicalMarkers } from './toadaSerializer.js';

/**
 * Compresse automatiquement un fichier image (hors GIF/SVG) avant envoi vers Firebase Storage.
 */
export async function compressImageIfNeeded(fileObj, maxWidthOrHeight = 1280) {
  if (!fileObj || !fileObj.type?.startsWith('image/') || fileObj.type === 'image/gif' || fileObj.type === 'image/svg+xml') {
    return fileObj;
  }
  try {
    return await imageCompression(fileObj, { maxSizeMB: 1, maxWidthOrHeight, useWebWorker: true });
  } catch {
    return fileObj;
  }
}

function applySongDocumentFields(targetObj, songData, finalVideoUrlSong, finalAudioUrl, documentToEdit, isEditMode) {
  targetObj.nacao = songData.nacao || '';
  targetObj.rythme = songData.rythme || '';
  const sig = songData.signatureRythmique || songData.signature || '4/4';
  targetObj.signature = sig;
  targetObj.signatureRythmique = sig;
  if (songData.bpmDefaut || songData.bpm) {
    const bpmNum = Number(songData.bpmDefaut || songData.bpm);
    targetObj.bpmDefaut = bpmNum; targetObj.bpm = bpmNum;
  }
  if (songData.tonaliteDefaut) targetObj.tonaliteDefaut = songData.tonaliteDefaut;
  targetObj.parolesOriginales = stripToadaTechnicalMarkers(songData.parolesOriginales || '');
  if (songData.rawTxtCode !== undefined) {
    targetObj.rawTxtCode = songData.rawTxtCode;
    targetObj.toadaStructure = songData.rawTxtCode ? buildToadaStructure(songData.rawTxtCode, sig) : null;
  }
  targetObj.parolesPhonetiques = songData.parolesPhonetiques || '';
  targetObj.traduction = songData.traduction || '';
  targetObj.anecdote = songData.anecdote || '';
  targetObj.videoUrl = finalVideoUrlSong || (isEditMode ? null : '');
  targetObj.cantadorValidated = Boolean(songData.cantadorValidated);
  targetObj.cantadorStatus = songData.cantadorValidated ? 'valide' : null;
  if (finalAudioUrl) {
    targetObj.audioUrl = finalAudioUrl;
    if (!targetObj.fileUrl) targetObj.fileUrl = finalAudioUrl;
  } else if (isEditMode) {
    targetObj.audioUrl = null;
    if (documentToEdit?.fileUrl && (documentToEdit.fileUrl === documentToEdit.audioUrl || /\.(mp3|wav|ogg|m4a|aac)$/i.test(documentToEdit.fileUrl) || /youtube(?:-nocookie)?\.com|youtu\.be/i.test(documentToEdit.fileUrl))) {
      targetObj.fileUrl = null;
    }
  }
}

export async function submitSingleDocument({ db, storage, groupId, varalCategories, documentToEdit, formData, t, onClose }) {
  const isEditMode = Boolean(documentToEdit);
  const { title, category, computedType, annee, isArchived, isHidden, excludeFromPedagogy, lienSequenceurId, file, externalUrl, songData = {}, cultureData = {}, fabricationData = {}, quizData = {}, projectData = {} } = formData;
  if (!title) return;

  const isLinkType = computedType === 'video' || computedType === 'web' || computedType === 'dossier_externe';
  const isSongType = computedType === 'song', isFabricationType = computedType === 'fabrication';
  const isProjectPresentation = computedType === 'projet_presentation';
  const isManualType = isSongType || isFabricationType || computedType === 'culture_fiche' || isProjectPresentation;

  if (!isEditMode) {
    if (!isLinkType && !isManualType && !file) { alert('Veuillez sélectionner un fichier.'); return; }
    if (isLinkType && !externalUrl) { alert('Veuillez entrer une URL.'); return; }
    if (!isLinkType && !isManualType && computedType === 'audio' && file?.size > 15 * 1024 * 1024) {
      alert(t('documents.audioSizeError') || 'Le fichier audio est trop volumineux (max 15 Mo).'); return;
    }
  }

  let finalVisuelAnimeUrl = fabricationData.visuelAnimeUrl || '';
  if (isFabricationType && fabricationData.visuelAnimeType === 'file' && fabricationData.visuelAnimeFile) {
    try {
      const fileToUpload = await compressImageIfNeeded(fabricationData.visuelAnimeFile, 1024);
      const snap = await uploadBytes(ref(storage, `documents/${groupId}/fabrication_visuel_${Date.now()}_${fileToUpload.name}`), fileToUpload);
      finalVisuelAnimeUrl = await getDownloadURL(snap.ref);
    } catch (err) { console.error("Erreur lors de l'upload du visuel d'atelier :", err); }
  }

  let finalPatronUrl = fabricationData.patronUrl || '';
  if (isFabricationType && fabricationData.patronUploadType === 'file' && fabricationData.patronFile) {
    try {
      const snap = await uploadBytes(ref(storage, `documents/${groupId}/patron_${Date.now()}_${fabricationData.patronFile.name}`), fabricationData.patronFile);
      finalPatronUrl = await getDownloadURL(snap.ref);
    } catch (err) { console.error("Erreur lors de l'upload du patron téléchargeable :", err); }
  }

  let rawAudioInput = (songData.audioUrl || '').trim(), finalVideoUrlSong = (songData.videoUrl || '').trim();
  if (rawAudioInput && /youtube(?:-nocookie)?\.com|youtu\.be/i.test(rawAudioInput)) {
    if (!finalVideoUrlSong) finalVideoUrlSong = rawAudioInput;
    rawAudioInput = '';
  }
  let finalAudioUrl = rawAudioInput;
  if (isSongType && songData.audioUploadType === 'file' && songData.audioFile) {
    const snap = await uploadBytes(ref(storage, `documents/${groupId}/audio_${Date.now()}_${songData.audioFile.name}`), songData.audioFile);
    finalAudioUrl = await getDownloadURL(snap.ref);
  }

  const categoryObj = varalCategories.find((c) => c.id === category);
  const categoryName = categoryObj ? categoryObj.nom : category;
  let finalUrl = isLinkType ? externalUrl : (isEditMode ? (documentToEdit?.fileUrl || '') : '');
  if (!isLinkType && !isManualType && file) {
    const fileToUpload = await compressImageIfNeeded(file, 1600);
    const snap = await uploadBytes(ref(storage, `documents/${groupId}/${Date.now()}_${fileToUpload.name || file.name}`), fileToUpload);
    finalUrl = await getDownloadURL(snap.ref);
  }

  const payload = {
    titre: title, categoryId: category, categorie: categoryName,
    annee: parseInt(annee, 10) || new Date().getFullYear(),
    isArchived: Boolean(isArchived), isHidden: Boolean(isHidden), excludeFromPedagogy: Boolean(excludeFromPedagogy),
    type: computedType, lienSequenceurId: lienSequenceurId || '',
    ...(isEditMode ? ((isLinkType || file) ? { fileUrl: finalUrl } : {}) : { fileUrl: finalUrl, groupId, dateAjout: new Date().toISOString(), order: 0 })
  };

  if (isProjectPresentation) {
    let finalIllustrationUrl = (projectData.illustrationUrl || '').trim();
    if (projectData.illustrationUploadType === 'file' && projectData.illustrationFile) {
      try {
        const imgToUpload = await compressImageIfNeeded(projectData.illustrationFile, 1280);
        const snap = await uploadBytes(ref(storage, `documents/${groupId}/projet_visuel_${Date.now()}_${imgToUpload.name || 'visuel.jpg'}`), imgToUpload);
        finalIllustrationUrl = await getDownloadURL(snap.ref);
      } catch (err) { console.error("Erreur lors de l'upload du visuel projet :", err); }
    }
    payload.typeDoc = 'projet_presentation';
    payload.texte = projectData.texte || '';
    payload.contenu = projectData.texte || '';
    payload.description = projectData.description || '';
    payload.imageUrl = finalIllustrationUrl;
    payload.illustrationUrl = finalIllustrationUrl;
    payload.fileUrl = finalIllustrationUrl;
    payload.isPinnedFirst = projectData.isPinnedFirst !== false;
  } else if (String(category || '').startsWith('projet_')) {
    if (projectData.description !== undefined) payload.description = projectData.description || '';
    payload.isPinnedFirst = Boolean(projectData.isPinnedFirst);
  }

  if (String(category || '').startsWith('projet_') && !isEditMode) {
    const currentUser = auth?.currentUser;
    if (currentUser?.uid) payload.authorId = currentUser.uid;
    if (currentUser?.displayName) payload.auteur = currentUser.displayName;
  }

  if (isSongType) applySongDocumentFields(payload, songData, finalVideoUrlSong, finalAudioUrl, documentToEdit, isEditMode);
  if (isFabricationType) {
    payload.thematiqueFabrication = fabricationData.thematiqueFabrication || 'lutherie';
    payload.patronUrl = finalPatronUrl; payload.contenuFabrication = fabricationData.contenuFabrication || '';
    payload.materielRequis = fabricationData.materielRequisList || []; payload.outilsNecessaires = fabricationData.outilsNecessairesList || [];
    payload.instrumentConcerne = fabricationData.instrumentConcerne || ''; payload.visuelAnimeUrl = finalVisuelAnimeUrl;
    payload.etapesFabrication = await processEtapesImages(fabricationData.etapesFabrication || [], storage, groupId);
  }
  if (isFabricationType || isSongType || computedType === 'culture_fiche') {
    payload.notesLexique = quizData.notesLexique || []; payload.questionsQcm = quizData.questionsQcm || [];
  }
  if (computedType === 'culture_fiche') applyCultureDocumentFields(payload, cultureData, isEditMode);

  if (isEditMode) await updateDoc(doc(db, 'documents', documentToEdit.id), cleanFirestorePayload(payload));
  else await addDoc(collection(db, 'documents'), cleanFirestorePayload(payload));
  if (onClose) onClose();
}
