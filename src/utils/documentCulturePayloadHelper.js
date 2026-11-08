/**
 * Aide à la construction du payload Firestore pour les fiches Culture, étapes Fabrication et modèles JSON (< 120 lignes).
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';

export async function processEtapesImages(etapesList, storage, groupId) {
  const processed = [];
  for (const etape of etapesList) {
    const newEtape = { ...etape };
    if (newEtape.imageUploadType === 'file' && newEtape.imageFile) {
      try {
        const isVideoOrGif = newEtape.imageFile.type.startsWith('video/') || newEtape.imageFile.type === 'image/gif';
        const fileToUpload = isVideoOrGif ? newEtape.imageFile : await imageCompression(newEtape.imageFile, { maxSizeMB: 1, maxWidthOrHeight: 1024, useWebWorker: true });
        const snap = await uploadBytes(ref(storage, `documents/${groupId}/etape_${Date.now()}_${fileToUpload.name}`), fileToUpload);
        newEtape.imageUrl = await getDownloadURL(snap.ref);
      } catch (err) { console.error("Erreur lors de l'upload du média d'étape :", err); }
    }
    delete newEtape.imageFile;
    delete newEtape.imageUploadType;
    processed.push(newEtape);
  }
  return processed;
}

export function applyCultureDocumentFields(targetObj, cultureData = {}, isEditMode = false) {
  targetObj.categorieFiche = cultureData.categorieFiche || '';
  targetObj.themeCulture = cultureData.themeCulture || '';
  targetObj.legendeImage = cultureData.legendeImage || '';
  targetObj.chapitres = cultureData.chapitresCulture || [];
  targetObj.anecdote = cultureData.anecdote || '';
  targetObj.lexiqueMotsCles = cultureData.lexiqueMotsCles || '';
  targetObj.lexique = cultureData.lexique || [];
  targetObj.videoUrl = cultureData.videoUrlCulture || '';

  if (isEditMode) {
    targetObj.villeRegion = null;
    targetObj.climatGeographie = null;
    targetObj.personnageOrisha = null;
    targetObj.elementNaturel = null;
    targetObj.hexPrimary = null;
    targetObj.hexSecondary = null;
    targetObj.iconeStamp = null;
    targetObj.outilAccessoire = null;
    targetObj.roleCortejo = null;
    targetObj.epoque = null;
    targetObj.rythme = null;
    targetObj.postureDanse = null;
    targetObj.ingredientPrincipal = null;
    targetObj.symbolesSacres = null;
  }

  const cat = cultureData.categorieFiche;
  if (cat === 'Territoire') {
    targetObj.villeRegion = cultureData.villeRegion || '';
    targetObj.climatGeographie = cultureData.climatGeographie || '';
  } else if (cat === 'Orixás') {
    targetObj.personnageOrisha = cultureData.personnageOrisha || '';
    targetObj.elementNaturel = cultureData.elementNaturel || '';
    targetObj.hexPrimary = cultureData.hexPrimary || '#EAB308';
    targetObj.hexSecondary = cultureData.hexSecondary || '#FFFFFF';
    targetObj.outilAccessoire = cultureData.outilAccessoire || '';
    targetObj.iconeStamp = cultureData.iconeStamp || 'axe-default';
    targetObj.symbolesSacres = cultureData.symbolesSacres || '';
  } else if (cat === 'Cour Royale' || cat === 'Cortège') {
    targetObj.roleCortejo = cultureData.roleCortejo || '';
    targetObj.outilAccessoire = cultureData.outilAccessoire || '';
  } else if (cat === 'Histoire') {
    targetObj.epoque = cultureData.epoque || '';
    targetObj.personnageOrisha = cultureData.personnageOrisha || '';
  } else if (cat === 'Musique & Danse') {
    targetObj.rythme = cultureData.rythme || '';
    targetObj.postureDanse = cultureData.postureDanse || '';
  } else if (cat === 'Cuisine') {
    targetObj.ingredientPrincipal = cultureData.ingredientPrincipal || '';
  }
}

export function getNonFabricationTemplate(category) {
  if (category === 'Culture') {
    return [
      {
        titre: 'La Dama do Paço et la Calunga',
        categorieFiche: 'Cour Royale & Personnages',
        personnageOrisha: 'Dama do Paço',
        villeRegion: 'Recife / Olinda (Pernambuco)',
        epoque: 'Période coloniale à nos jours',
        legendeImage: 'Dama do Paço portant la Calunga lors du Carnaval de Recife',
        anecdote: "Si la Calunga tombe pendant le défilé, la Nação doit s'arrêter immédiatement.",
        lexiqueMotsCles: 'Calunga, Axé, Matriarcat, Nação',
        chapitres: [
          { sousTitre: 'Rôle et Dignité', texte: "La Dama do Paço est la dame d'honneur chargée de porter la Calunga..." },
          { sousTitre: 'La Calunga', texte: 'Poupée sacrée en bois représentant les ancêtres...' }
        ],
        questionsQcm: [{ question: 'Que représente la Calunga ?', options: ['Une poupée sacrée', 'Un instrument', 'Un roi'], correctIndex: 0, extraitTexte: '' }],
        hexPrimary: '#EAB308', hexSecondary: '#FFFFFF', iconeStamp: 'axe-default', videoUrl: '',
        annee: new Date().getFullYear(), isArchived: false, isHidden: true, excludeFromPedagogy: false
      }
    ];
  }
  return [
    {
      titre: '', nacao: '', rythme: '', bpm: 100, signatureRythmique: '4/4', rawTxtCode: '',
      parolesOriginales: [{ puxador: '' }, { coro: '' }],
      parolesPhonetiques: [{ puxador: '' }, { coro: '' }],
      traduction: '', notesLexique: [], anecdote: '',
      questionsQcm: [{ question: '', options: ['', ''], correctIndex: 0, extraitTexte: '' }],
      annee: new Date().getFullYear(), isArchived: false, isHidden: true, excludeFromPedagogy: false
    }
  ];
}
