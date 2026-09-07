import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { collection, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { useTranslation } from '../components/LanguageContext';
import { cleanFirestorePayload } from '../utils/firestoreUtils';

/**
 * Hook personnalisé gérant l'ensemble du pipeline de soumission, d'upload Firebase Storage,
 * de compression d'images et d'import par lot JSON pour le formulaire du Varal.
 */
export function useDocumentUploadPipeline({
  groupId,
  varalCategories = [],
  documentToEdit = null,
  onClose
}) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(documentToEdit);

  /**
   * Traite et compresse les images/vidéos des étapes de confection d'atelier.
   */
  const processEtapesImages = async (etapesList) => {
    const processed = [];
    for (const etape of etapesList) {
      const newEtape = { ...etape };
      if (newEtape.imageUploadType === 'file' && newEtape.imageFile) {
        try {
          const isVideoOrGif = newEtape.imageFile.type.startsWith('video/') || newEtape.imageFile.type === 'image/gif';
          let fileToUpload = newEtape.imageFile;

          if (!isVideoOrGif) {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(newEtape.imageFile, options);
          }

          const storagePath = `documents/${groupId}/etape_${Date.now()}_${fileToUpload.name}`;
          const fileRef = ref(storage, storagePath);
          const snapshot = await uploadBytes(fileRef, fileToUpload);
          newEtape.imageUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.error("Erreur lors de l'upload du média d'étape :", err);
        }
      }
      delete newEtape.imageFile;
      delete newEtape.imageUploadType;
      processed.push(newEtape);
    }
    return processed;
  };

  /**
   * Télécharge un modèle de fichier JSON adapté à la catégorie sélectionnée pour faciliter l'import en masse.
   */
  const downloadTemplate = (category) => {
    let templateObj;
    if (category === 'Culture') {
      templateObj = [
        {
          titre: "La Dama do Paço et la Calunga",
          categorieFiche: "Cour Royale & Personnages",
          personnageOrisha: "Dama do Paço",
          villeRegion: "Recife / Olinda (Pernambuco)",
          epoque: "Période coloniale à nos jours",
          legendeImage: "Dama do Paço portant la Calunga lors du Carnaval de Recife",
          anecdote: "Si la Calunga tombe pendant le défilé, la Nação doit s'arrêter immédiatement.",
          lexiqueMotsCles: "Calunga, Axé, Matriarcat, Nação",
          chapitres: [
            {
              sousTitre: "Rôle et Dignité",
              texte: "La Dama do Paço est la dame d'honneur chargée de porter la Calunga..."
            },
            {
              sousTitre: "La Calunga",
              texte: "Poupée sacrée en bois représentant les ancêtres..."
            }
          ],
          questionsQcm: [
            {
              question: "Que représente la Calunga ?",
              options: ["Une poupée sacrée", "Un instrument", "Un roi"],
              correctIndex: 0,
              extraitTexte: ""
            }
          ],
          hexPrimary: "#EAB308",
          hexSecondary: "#FFFFFF",
          iconeStamp: "axe-default",
          videoUrl: "",
          annee: new Date().getFullYear(),
          isArchived: false,
          isHidden: true,
          excludeFromPedagogy: false
        }
      ];
    } else {
      templateObj = [
        {
          titre: "",
          nacao: "",
          rythme: "",
          parolesOriginales: [
            { "puxador": "" },
            { "coro": "" }
          ],
          parolesPhonetiques: [
            { "puxador": "" },
            { "coro": "" }
          ],
          traduction: "",
          notesLexique: [],
          anecdote: "",
          contenuFabrication: "",
          materielRequis: [],
          outilsNecessaires: [],
          instrumentConcerne: "",
          visuelAnimeUrl: "",
          etapesFabrication: [
            {
              sousTitre: "",
              description: "",
              imageUrl: ""
            }
          ],
          questionsQcm: [
            {
              question: "",
              options: ["", ""],
              correctIndex: 0,
              extraitTexte: ""
            }
          ],
          annee: new Date().getFullYear(),
          isArchived: false,
          isHidden: true,
          excludeFromPedagogy: false
        }
      ];
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `modele_import_${category}.json`);
    dlAnchorElem.click();
  };

  /**
   * Exécute l'import d'un lot de documents depuis un fichier JSON.
   */
  const executeBatchImport = async (batchFile, category, computedType) => {
    if (!batchFile) {
      alert("Veuillez sélectionner un fichier JSON d'import.");
      return;
    }
    setIsSubmitting(true);

    const parseTagsList = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      if (typeof val === 'string') {
        return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
      return [];
    };

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          alert("Le fichier JSON doit contenir un tableau d'objets (array).");
          setIsSubmitting(false);
          return;
        }

        const categoryObj = varalCategories.find(c => c.id === category);
        const categoryName = categoryObj ? categoryObj.nom : category;
        const batch = writeBatch(db);

        const formatLyrics = (lyricsInput) => {
          if (!lyricsInput) return '';
          if (typeof lyricsInput === 'string') return lyricsInput;
          if (Array.isArray(lyricsInput)) {
            return lyricsInput.map(block => {
              const parts = [];
              if (block.puxador) parts.push(`<b>${block.puxador}</b>`);
              if (block.coro) parts.push(`${block.coro}`);
              if (block.choeur) parts.push(`${block.choeur}`);
              return parts.join('<br/>');
            }).filter(Boolean).join('<br/>');
          }
          return '';
        };

        let count = 0;
        data.forEach(item => {
          if (!item.titre) return;
          const newDocRef = doc(collection(db, 'documents'));
          const newDoc = {
            titre: item.titre,
            categoryId: category,
            categorie: categoryName,
            annee: parseInt(item.annee, 10) || new Date().getFullYear(),
            fileUrl: '',
            type: computedType,
            groupId: groupId,
            dateAjout: new Date().toISOString(),
            order: 0,
            isArchived: Boolean(item.isArchived),
            isHidden: Boolean(item.isHidden),
            excludeFromPedagogy: Boolean(item.excludeFromPedagogy),
            nacao: item.nacao || '',
            rythme: item.rythme || '',
            parolesOriginales: formatLyrics(item.parolesOriginales),
            parolesPhonetiques: formatLyrics(item.parolesPhonetiques),
            traduction: item.traduction || '',
            notesLexique: Array.isArray(item.notesLexique) ? item.notesLexique : [],
            anecdote: item.anecdote || '',
            contenuFabrication: item.contenuFabrication || '',
            materielRequis: parseTagsList(item.materielRequis),
            outilsNecessaires: parseTagsList(item.outilsNecessaires),
            instrumentConcerne: item.instrumentConcerne || '',
            visuelAnimeUrl: item.visuelAnimeUrl || '',
            etapesFabrication: Array.isArray(item.etapesFabrication) ? item.etapesFabrication : [],
            questionsQcm: Array.isArray(item.questionsQcm) ? item.questionsQcm : [],
            categorieFiche: item.categorieFiche || '',
            hexPrimary: item.hexPrimary || (item.couleurs && item.couleurs[0]) || (item.couleursString && item.couleursString.split(',')[0].trim()) || '#EAB308',
            hexSecondary: item.hexSecondary || (item.couleurs && item.couleurs[1]) || (item.couleursString && item.couleursString.split(',')[1]?.trim()) || '#FFFFFF',
            iconeStamp: item.iconeStamp || item.stampKey || 'axe-default',
            personnageOrisha: item.personnageOrisha || '',
            villeRegion: item.villeRegion || '',
            epoque: item.epoque || '',
            legendeImage: item.legendeImage || '',
            chapitres: Array.isArray(item.chapitres) ? item.chapitres : [],
            lexiqueMotsCles: item.lexiqueMotsCles || '',
            videoUrl: item.videoUrl || '',
            lienSequenceurId: item.lienSequenceurId || ''
          };
          batch.set(newDocRef, cleanFirestorePayload(newDoc));
          count++;
        });

        await batch.commit();
        alert(`${count} éléments importés avec succès !`);
        if (onClose) onClose();
      } catch (err) {
        console.error("Erreur import JSON :", err);
        alert("Erreur lors de la lecture ou de l'import du fichier JSON. Vérifiez le format.");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(batchFile);
  };

  /**
   * Soumission principale du document (création ou modification).
   */
  const submitDocument = async (formData) => {
    if (!groupId) return;
    const {
      title,
      category,
      computedType,
      annee,
      isArchived,
      isHidden,
      excludeFromPedagogy,
      lienSequenceurId,
      file,
      externalUrl,
      songData = {},
      cultureData = {},
      fabricationData = {},
      quizData = {}
    } = formData;

    if (!title) return;

    const isLinkType = computedType === 'video' || computedType === 'web' || computedType === 'dossier_externe';
    const isSongType = computedType === 'song';
    const isFabricationType = computedType === 'fabrication';
    const isManualType = isSongType || isFabricationType || computedType === 'culture_fiche';

    // Validation des fichiers / liens requis
    if (!isEditMode) {
      if (!isLinkType && !isManualType && !file) {
        alert("Veuillez sélectionner un fichier.");
        return;
      }
      if (isLinkType && !externalUrl) {
        alert("Veuillez entrer une URL.");
        return;
      }
      if (!isLinkType && !isManualType && computedType === 'audio' && file?.size > 15 * 1024 * 1024) {
        alert(t('documents.audioSizeError') || "Le fichier audio est trop volumineux (max 15 Mo).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Traitement visuel animé (Fabrication)
      let finalVisuelAnimeUrl = fabricationData.visuelAnimeUrl || '';
      if (computedType === 'fabrication' && fabricationData.visuelAnimeType === 'file' && fabricationData.visuelAnimeFile) {
        try {
          const isVideoOrGif = fabricationData.visuelAnimeFile.type.startsWith('video/') || fabricationData.visuelAnimeFile.type === 'image/gif';
          let fileToUpload = fabricationData.visuelAnimeFile;
          if (!isVideoOrGif) {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1024,
              useWebWorker: true,
            };
            fileToUpload = await imageCompression(fabricationData.visuelAnimeFile, options);
          }
          const storagePath = `documents/${groupId}/fabrication_visuel_${Date.now()}_${fileToUpload.name}`;
          const fileRef = ref(storage, storagePath);
          const snapshot = await uploadBytes(fileRef, fileToUpload);
          finalVisuelAnimeUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.error("Erreur lors de l'upload du visuel d'atelier :", err);
        }
      }

      // 2. Traitement audio témoin (Chant / Toada)
      let finalAudioUrl = songData.audioUrl || '';
      if (isSongType && songData.audioUploadType === 'file' && songData.audioFile) {
        const audioStoragePath = `documents/${groupId}/audio_${Date.now()}_${songData.audioFile.name}`;
        const audioRef = ref(storage, audioStoragePath);
        const audioSnapshot = await uploadBytes(audioRef, songData.audioFile);
        finalAudioUrl = await getDownloadURL(audioSnapshot.ref);
      }

      const categoryObj = varalCategories.find(c => c.id === category);
      const categoryName = categoryObj ? categoryObj.nom : category;

      // MODE ÉDITION
      if (isEditMode) {
        const docRef = doc(db, 'documents', documentToEdit.id);
        const updateData = {
          titre: title,
          categoryId: category,
          categorie: categoryName,
          annee: parseInt(annee, 10) || new Date().getFullYear(),
          isArchived: Boolean(isArchived),
          isHidden: Boolean(isHidden),
          excludeFromPedagogy: Boolean(excludeFromPedagogy),
          type: computedType,
          lienSequenceurId: lienSequenceurId || ''
        };

        if (isSongType) {
          updateData.nacao = songData.nacao || '';
          updateData.rythme = songData.rythme || '';
          updateData.parolesOriginales = songData.parolesOriginales || '';
          updateData.parolesPhonetiques = songData.parolesPhonetiques || '';
          updateData.traduction = songData.traduction || '';
          updateData.anecdote = songData.anecdote || '';
          if (finalAudioUrl) {
            updateData.audioUrl = finalAudioUrl;
            if (!updateData.fileUrl) {
              updateData.fileUrl = finalAudioUrl;
            }
          }
        }

        if (computedType === 'fabrication') {
          updateData.contenuFabrication = fabricationData.contenuFabrication || '';
          updateData.materielRequis = fabricationData.materielRequisList || [];
          updateData.outilsNecessaires = fabricationData.outilsNecessairesList || [];
          updateData.instrumentConcerne = fabricationData.instrumentConcerne || '';
          updateData.visuelAnimeUrl = finalVisuelAnimeUrl;
          updateData.etapesFabrication = await processEtapesImages(fabricationData.etapesFabrication || []);
        }

        if (computedType === 'fabrication' || computedType === 'song' || computedType === 'culture_fiche') {
          updateData.notesLexique = quizData.notesLexique || [];
          updateData.questionsQcm = quizData.questionsQcm || [];
        }

        if (computedType === 'culture_fiche') {
          updateData.categorieFiche = cultureData.categorieFiche || '';
          updateData.themeCulture = cultureData.themeCulture || '';
          updateData.legendeImage = cultureData.legendeImage || '';
          updateData.chapitres = cultureData.chapitresCulture || [];
          updateData.anecdote = cultureData.anecdote || '';
          updateData.lexiqueMotsCles = cultureData.lexiqueMotsCles || '';
          updateData.lexique = cultureData.lexique || [];
          updateData.videoUrl = cultureData.videoUrlCulture || '';

          // Réinitialisation conditionnelle selon la catégorie de fiche
          updateData.villeRegion = null;
          updateData.climatGeographie = null;
          updateData.personnageOrisha = null;
          updateData.elementNaturel = null;
          updateData.hexPrimary = null;
          updateData.hexSecondary = null;
          updateData.iconeStamp = null;
          updateData.outilAccessoire = null;
          updateData.roleCortejo = null;
          updateData.epoque = null;
          updateData.rythme = null;
          updateData.postureDanse = null;
          updateData.ingredientPrincipal = null;
          updateData.symbolesSacres = null;

          const cat = cultureData.categorieFiche;
          if (cat === 'Territoire') {
            updateData.villeRegion = cultureData.villeRegion || '';
            updateData.climatGeographie = cultureData.climatGeographie || '';
          } else if (cat === 'Orixás') {
            updateData.personnageOrisha = cultureData.personnageOrisha || '';
            updateData.elementNaturel = cultureData.elementNaturel || '';
            updateData.hexPrimary = cultureData.hexPrimary || '#EAB308';
            updateData.hexSecondary = cultureData.hexSecondary || '#FFFFFF';
            updateData.outilAccessoire = cultureData.outilAccessoire || '';
            updateData.iconeStamp = cultureData.iconeStamp || 'axe-default';
            updateData.symbolesSacres = cultureData.symbolesSacres || '';
          } else if (cat === 'Cour Royale' || cat === 'Cortège') {
            updateData.roleCortejo = cultureData.roleCortejo || '';
            updateData.outilAccessoire = cultureData.outilAccessoire || '';
          } else if (cat === 'Histoire') {
            updateData.epoque = cultureData.epoque || '';
            updateData.personnageOrisha = cultureData.personnageOrisha || '';
          } else if (cat === 'Musique & Danse') {
            updateData.rythme = cultureData.rythme || '';
            updateData.postureDanse = cultureData.postureDanse || '';
          } else if (cat === 'Cuisine') {
            updateData.ingredientPrincipal = cultureData.ingredientPrincipal || '';
          }
        }

        if (isLinkType) {
          updateData.fileUrl = externalUrl;
        }

        await updateDoc(docRef, cleanFirestorePayload(updateData));
        if (onClose) onClose();
        return;
      }

      // MODE CRÉATION
      let finalUrl = '';
      if (isLinkType) {
        finalUrl = externalUrl;
      } else if (!isManualType && file) {
        const storagePath = `documents/${groupId}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        finalUrl = await getDownloadURL(snapshot.ref);
      }

      const newDoc = {
        titre: title,
        categoryId: category,
        categorie: categoryName,
        annee: parseInt(annee, 10) || new Date().getFullYear(),
        fileUrl: finalUrl,
        type: computedType,
        groupId: groupId,
        dateAjout: new Date().toISOString(),
        order: 0,
        isArchived: Boolean(isArchived),
        isHidden: Boolean(isHidden),
        excludeFromPedagogy: Boolean(excludeFromPedagogy),
        lienSequenceurId: lienSequenceurId || ''
      };

      if (isSongType) {
        newDoc.nacao = songData.nacao || '';
        newDoc.rythme = songData.rythme || '';
        newDoc.parolesOriginales = songData.parolesOriginales || '';
        newDoc.parolesPhonetiques = songData.parolesPhonetiques || '';
        newDoc.traduction = songData.traduction || '';
        newDoc.anecdote = songData.anecdote || '';
        if (finalAudioUrl) {
          newDoc.audioUrl = finalAudioUrl;
          if (!newDoc.fileUrl) {
            newDoc.fileUrl = finalAudioUrl;
          }
        }
      }

      if (computedType === 'fabrication') {
        newDoc.contenuFabrication = fabricationData.contenuFabrication || '';
        newDoc.materielRequis = fabricationData.materielRequisList || [];
        newDoc.outilsNecessaires = fabricationData.outilsNecessairesList || [];
        newDoc.instrumentConcerne = fabricationData.instrumentConcerne || '';
        newDoc.visuelAnimeUrl = finalVisuelAnimeUrl;
        newDoc.etapesFabrication = await processEtapesImages(fabricationData.etapesFabrication || []);
      }

      if (computedType === 'fabrication' || computedType === 'song' || computedType === 'culture_fiche') {
        newDoc.notesLexique = quizData.notesLexique || [];
        newDoc.questionsQcm = quizData.questionsQcm || [];
      }

      if (computedType === 'culture_fiche') {
        newDoc.categorieFiche = cultureData.categorieFiche || '';
        newDoc.themeCulture = cultureData.themeCulture || '';
        newDoc.legendeImage = cultureData.legendeImage || '';
        newDoc.chapitres = cultureData.chapitresCulture || [];
        newDoc.anecdote = cultureData.anecdote || '';
        newDoc.lexiqueMotsCles = cultureData.lexiqueMotsCles || '';
        newDoc.lexique = cultureData.lexique || [];
        newDoc.videoUrl = cultureData.videoUrlCulture || '';

        const cat = cultureData.categorieFiche;
        if (cat === 'Territoire') {
          newDoc.villeRegion = cultureData.villeRegion || '';
          newDoc.climatGeographie = cultureData.climatGeographie || '';
        } else if (cat === 'Orixás') {
          newDoc.personnageOrisha = cultureData.personnageOrisha || '';
          newDoc.elementNaturel = cultureData.elementNaturel || '';
          newDoc.hexPrimary = cultureData.hexPrimary || '#EAB308';
          newDoc.hexSecondary = cultureData.hexSecondary || '#FFFFFF';
          newDoc.outilAccessoire = cultureData.outilAccessoire || '';
          newDoc.iconeStamp = cultureData.iconeStamp || 'axe-default';
          newDoc.symbolesSacres = cultureData.symbolesSacres || '';
        } else if (cat === 'Cour Royale' || cat === 'Cortège') {
          newDoc.roleCortejo = cultureData.roleCortejo || '';
          newDoc.outilAccessoire = cultureData.outilAccessoire || '';
        } else if (cat === 'Histoire') {
          newDoc.epoque = cultureData.epoque || '';
          newDoc.personnageOrisha = cultureData.personnageOrisha || '';
        } else if (cat === 'Musique & Danse') {
          newDoc.rythme = cultureData.rythme || '';
          newDoc.postureDanse = cultureData.postureDanse || '';
        } else if (cat === 'Cuisine') {
          newDoc.ingredientPrincipal = cultureData.ingredientPrincipal || '';
        }
      }

      await addDoc(collection(db, 'documents'), cleanFirestorePayload(newDoc));
      if (onClose) onClose();
    } catch (error) {
      console.error("DocumentUploadForm - Erreur d'enregistrement :", error);
      alert(t('common.saveError') || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submitDocument,
    executeBatchImport,
    downloadTemplate
  };
}
