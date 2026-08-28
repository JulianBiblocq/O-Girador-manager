import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { collection, addDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import RichTextEditor from './RichTextEditor';

export default function DocumentUploadForm({ groupId, varalCategories = [], onClose, documentToEdit }) {
  const { t } = useTranslation();
  const isEditMode = !!documentToEdit;
  
  // Base fields
  const [title, setTitle] = useState(documentToEdit ? documentToEdit.titre : '');
  const [category, setCategory] = useState(() => {
    if (!documentToEdit) {
      return varalCategories && varalCategories.length > 0 ? varalCategories[0].id : 'Toadas';
    }
    const match = (documentToEdit.categoryId && varalCategories.find(c => c.id === documentToEdit.categoryId))
      || (documentToEdit.categorie && varalCategories.find(c => c.nom === documentToEdit.categorie))
      || (documentToEdit.categorie && varalCategories.find(c => c.id === documentToEdit.categorie));
    return match ? match.id : (documentToEdit.categoryId || documentToEdit.categorie || 'Toadas');
  });
  const [annee, setAnnee] = useState(documentToEdit ? documentToEdit.annee : new Date().getFullYear());
  const [isArchived, setIsArchived] = useState(documentToEdit ? (documentToEdit.isArchived || false) : false);
  const [isHidden, setIsHidden] = useState(documentToEdit ? (documentToEdit.isHidden || false) : false);

  // Computed Type logic
  const [pvType, setPvType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'pdf');
  const [tutoFabType, setTutoFabType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'fabrication');
  const [cultureType, setCultureType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'culture_fiche');

  const computedType = (() => {
    switch(category) {
      case 'Toadas': return 'song';
      case 'Culture': return cultureType;
      case 'TutorielsVideo': return 'video';
      case 'TutosFabrication': return tutoFabType;
      case 'PhotosPrestations': return 'dossier_externe';
      case 'Administratif': return 'pdf';
      case 'ComptesRendus': return pvType;
      default: return 'pdf';
    }
  })();

  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState(documentToEdit ? documentToEdit.fileUrl : '');

  // Song / Culture fields
  const [nacao, setNacao] = useState(documentToEdit ? documentToEdit.nacao || '' : '');
  const [rythme, setRythme] = useState(documentToEdit ? documentToEdit.rythme || '' : '');
  const [parolesOriginales, setParolesOriginales] = useState(documentToEdit ? documentToEdit.parolesOriginales || '' : '');
  const [parolesPhonetiques, setParolesPhonetiques] = useState(documentToEdit ? documentToEdit.parolesPhonetiques || '' : '');
  const [traduction, setTraduction] = useState(documentToEdit ? documentToEdit.traduction || '' : '');
  const [notesLexique, setNotesLexique] = useState(documentToEdit ? documentToEdit.notesLexique || '' : '');
  const [anecdote, setAnecdote] = useState(documentToEdit ? documentToEdit.anecdote || '' : '');
  
  // Tuto Fabrication fields
  const [contenuFabrication, setContenuFabrication] = useState(documentToEdit ? documentToEdit.contenuFabrication || '' : '');
  const [materielRequis, setMaterielRequis] = useState(documentToEdit ? documentToEdit.materielRequis || '' : '');
  const [outilsNecessaires, setOutilsNecessaires] = useState(documentToEdit ? documentToEdit.outilsNecessaires || '' : '');
  const [instrumentConcerne, setInstrumentConcerne] = useState(documentToEdit ? documentToEdit.instrumentConcerne || '' : '');
  const [etapesFabrication, setEtapesFabrication] = useState(documentToEdit ? documentToEdit.etapesFabrication || [] : []);
  const [visuelAnimeType, setVisuelAnimeType] = useState(documentToEdit && documentToEdit.visuelAnimeUrl ? 'url' : 'file');
  const [visuelAnimeUrl, setVisuelAnimeUrl] = useState(documentToEdit ? documentToEdit.visuelAnimeUrl || '' : '');
  const [visuelAnimeFile, setVisuelAnimeFile] = useState(null);

  // Culture fields
  const [categorieFiche, setCategorieFiche] = useState(documentToEdit ? documentToEdit.categorieFiche || 'Orixás' : 'Orixás');
  const [themeCulture, setThemeCulture] = useState(documentToEdit ? documentToEdit.themeCulture || 'orixas' : 'orixas');
  const [elementNaturel, setElementNaturel] = useState(documentToEdit ? documentToEdit.elementNaturel || '' : '');
  const [symbolesSacres, setSymbolesSacres] = useState(documentToEdit ? documentToEdit.symbolesSacres || '' : '');
  const [hexPrimary, setHexPrimary] = useState(documentToEdit ? documentToEdit.hexPrimary || (documentToEdit.couleursTheme ? documentToEdit.couleursTheme[0] : '#EAB308') : '#EAB308');
  const [hexSecondary, setHexSecondary] = useState(documentToEdit ? documentToEdit.hexSecondary || (documentToEdit.couleursTheme ? documentToEdit.couleursTheme[1] : '#FFFFFF') : '#FFFFFF');
  const [iconeStamp, setIconeStamp] = useState(documentToEdit ? documentToEdit.iconeStamp || documentToEdit.stampKey || 'axe-default' : 'axe-default');
  const [danseData, setDanseData] = useState(documentToEdit ? documentToEdit.danseData || {
    nomDuGeste: '',
    descriptionGeste: '',
    motsClesCorps: '',
    mediaGesteUrl: ''
  } : {
    nomDuGeste: '',
    descriptionGeste: '',
    motsClesCorps: '',
    mediaGesteUrl: ''
  });
  const [personnageOrisha, setPersonnageOrisha] = useState(documentToEdit ? documentToEdit.personnageOrisha || '' : '');
  const [villeRegion, setVilleRegion] = useState(documentToEdit ? documentToEdit.villeRegion || '' : '');
  const [epoque, setEpoque] = useState(documentToEdit ? documentToEdit.epoque || '' : '');
  const [legendeImage, setLegendeImage] = useState(documentToEdit ? documentToEdit.legendeImage || '' : '');
  const [chapitresCulture, setChapitresCulture] = useState(documentToEdit ? documentToEdit.chapitres || [] : []);
  const [lexiqueMotsCles, setLexiqueMotsCles] = useState(documentToEdit ? documentToEdit.lexiqueMotsCles || '' : '');
  const [videoUrlCulture, setVideoUrlCulture] = useState(documentToEdit ? documentToEdit.videoUrl || '' : '');
  const [climatGeographie, setClimatGeographie] = useState(documentToEdit ? documentToEdit.climatGeographie || '' : '');
  const [outilAccessoire, setOutilAccessoire] = useState(documentToEdit ? documentToEdit.outilAccessoire || '' : '');
  const [roleCortejo, setRoleCortejo] = useState(documentToEdit ? documentToEdit.roleCortejo || '' : '');
  const [postureDanse, setPostureDanse] = useState(documentToEdit ? documentToEdit.postureDanse || '' : '');
  const [ingredientPrincipal, setIngredientPrincipal] = useState(documentToEdit ? documentToEdit.ingredientPrincipal || '' : '');
  
  // Champ optionnel Séquenceur (pour les Signes du Mestre)
  const [lienSequenceurId, setLienSequenceurId] = useState(documentToEdit ? documentToEdit.lienSequenceurId || '' : '');

  const addChapitreCulture = () => {
    setChapitresCulture([...chapitresCulture, { id: Date.now(), sousTitre: '', texte: '' }]);
  };
  const updateChapitreCulture = (id, field, value) => {
    setChapitresCulture(chapitresCulture.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };
  const removeChapitreCulture = (id) => {
    setChapitresCulture(chapitresCulture.filter(ch => ch.id !== id));
  };
  const moveChapitreCultureUp = (index) => {
    if (index === 0) return;
    const newChapitres = [...chapitresCulture];
    const temp = newChapitres[index];
    newChapitres[index] = newChapitres[index - 1];
    newChapitres[index - 1] = temp;
    setChapitresCulture(newChapitres);
  };
  const moveChapitreCultureDown = (index) => {
    if (index === chapitresCulture.length - 1) return;
    const newChapitres = [...chapitresCulture];
    const temp = newChapitres[index];
    newChapitres[index] = newChapitres[index + 1];
    newChapitres[index + 1] = temp;
    setChapitresCulture(newChapitres);
  };

  const addEtape = () => {
    setEtapesFabrication([...etapesFabrication, {
      id: Date.now(),
      sousTitre: '',
      description: '',
      imageUploadType: 'url',
      imageUrl: '',
      imageFile: null
    }]);
  };

  const updateEtape = (id, field, value) => {
    setEtapesFabrication(etapesFabrication.map(etape => 
      etape.id === id ? { ...etape, [field]: value } : etape
    ));
  };

  const removeEtape = (id) => {
    setEtapesFabrication(etapesFabrication.filter(etape => etape.id !== id));
  };

  const moveEtapeUp = (index) => {
    if (index === 0) return;
    const newEtapes = [...etapesFabrication];
    const temp = newEtapes[index];
    newEtapes[index] = newEtapes[index - 1];
    newEtapes[index - 1] = temp;
    setEtapesFabrication(newEtapes);
  };

  const moveEtapeDown = (index) => {
    if (index === etapesFabrication.length - 1) return;
    const newEtapes = [...etapesFabrication];
    const temp = newEtapes[index];
    newEtapes[index] = newEtapes[index + 1];
    newEtapes[index + 1] = temp;
    setEtapesFabrication(newEtapes);
  };
  
  // QCM fields
  const [questionsQcm, setQuestionsQcm] = useState(documentToEdit ? (documentToEdit.questionsQcm || []) : []);
  
  // Lexique détaillé (Dictionnaire)
  const [lexique, setLexique] = useState(documentToEdit ? (documentToEdit.lexique || []) : []);

  const addLexiqueItem = () => {
    setLexique([...lexique, { pt: '', fr: '' }]);
  };

  const updateLexiqueItem = (index, field, value) => {
    const updated = [...lexique];
    updated[index][field] = value;
    setLexique(updated);
  };

  const removeLexiqueItem = (index) => {
    const updated = [...lexique];
    updated.splice(index, 1);
    setLexique(updated);
  };
  
  const addQuestion = () => {
    setQuestionsQcm([...questionsQcm, { question: '', options: ['', ''], correctIndex: 0, extraitTexte: '' }]);
  };

  const updateQuestion = (qIndex, field, value) => {
    const updated = [...questionsQcm];
    updated[qIndex][field] = value;
    setQuestionsQcm(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questionsQcm];
    updated[qIndex].options.push('');
    setQuestionsQcm(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questionsQcm];
    updated[qIndex].options[optIndex] = value;
    setQuestionsQcm(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questionsQcm];
    updated[qIndex].options.splice(optIndex, 1);
    if (updated[qIndex].correctIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctIndex = Math.max(0, updated[qIndex].options.length - 1);
    }
    setQuestionsQcm(updated);
  };

  const removeQuestion = (qIndex) => {
    const updated = [...questionsQcm];
    updated.splice(qIndex, 1);
    setQuestionsQcm(updated);
  };
  
  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [importMode, setImportMode] = useState('manual'); // 'manual' | 'import'
  const [batchFile, setBatchFile] = useState(null);

  const downloadTemplate = () => {
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
          isHidden: true
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
          notesLexique: "",
          anecdote: "",
          contenuFabrication: "",
          materielRequis: "",
          outilsNecessaires: "",
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
          isHidden: true
        }
      ];
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `modele_import_${category}.json`);
    dlAnchorElem.click();
  };

  const handleBatchFileChange = (e) => {
    if (e.target.files[0]) {
      setBatchFile(e.target.files[0]);
    }
  };

  const executeBatchImport = async () => {
    if (!batchFile) {
      alert("Veuillez sélectionner un fichier JSON d'import.");
      return;
    }
    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          alert("Le fichier JSON doit contenir un tableau d'objets (array).");
          setIsUploading(false);
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
              if (block.choeur) parts.push(`${block.choeur}`); // fallback alias
              return parts.join('<br/>');
            }).filter(Boolean).join('<br/>');
          }
          return '';
        };

        let count = 0;
        data.forEach(item => {
          if (!item.titre) return; // Titre est obligatoire
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
            isArchived: !!item.isArchived,
            isHidden: !!item.isHidden,
            nacao: item.nacao || '',
            rythme: item.rythme || '',
            parolesOriginales: formatLyrics(item.parolesOriginales),
            parolesPhonetiques: formatLyrics(item.parolesPhonetiques),
            traduction: item.traduction || '',
            notesLexique: item.notesLexique || '',
            anecdote: item.anecdote || '',
            contenuFabrication: item.contenuFabrication || '',
            materielRequis: item.materielRequis || '',
            outilsNecessaires: item.outilsNecessaires || '',
            instrumentConcerne: item.instrumentConcerne || '',
            visuelAnimeUrl: item.visuelAnimeUrl || '',
            etapesFabrication: Array.isArray(item.etapesFabrication) ? item.etapesFabrication : [],
            questionsQcm: Array.isArray(item.questionsQcm) ? item.questionsQcm : [],
            // Culture fields
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
          batch.set(newDocRef, newDoc);
          count++;
        });

        await batch.commit();
        alert(`${count} éléments importés avec succès !`);
        onClose();
      } catch (err) {
        console.error("Erreur import JSON :", err);
        alert("Erreur lors de la lecture ou de l'import du fichier JSON. Vérifiez le format.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(batchFile);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        const nameWithoutExt = e.target.files[0].name.substring(0, e.target.files[0].name.lastIndexOf('.')) || e.target.files[0].name;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId) return;

    if (importMode === 'import' && !isEditMode) {
      await executeBatchImport();
      return;
    }

    if (!title) return;

    const isLinkType = computedType === 'video' || computedType === 'web' || computedType === 'dossier_externe';
    const isSongType = computedType === 'song';
    const isFabricationType = computedType === 'fabrication';
    const isManualType = isSongType || isFabricationType;

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
            console.error("Error processing/uploading etape media:", err);
          }
        }
        delete newEtape.imageFile;
        delete newEtape.imageUploadType;
        processed.push(newEtape);
      }
      return processed;
    };

    let finalVisuelAnimeUrl = visuelAnimeUrl;
    if (computedType === 'fabrication' && visuelAnimeType === 'file' && visuelAnimeFile) {
      try {
        const isVideoOrGif = visuelAnimeFile.type.startsWith('video/') || visuelAnimeFile.type === 'image/gif';
        let fileToUpload = visuelAnimeFile;
        if (!isVideoOrGif) {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          };
          fileToUpload = await imageCompression(visuelAnimeFile, options);
        }
        const storagePath = `documents/${groupId}/fabrication_visuel_${Date.now()}_${fileToUpload.name}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, fileToUpload);
        finalVisuelAnimeUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Error processing/uploading global fabrication media:", err);
      }
    }

    if (isEditMode) {
      setIsUploading(true);
      try {
        const categoryObj = varalCategories.find(c => c.id === category);
        const categoryName = categoryObj ? categoryObj.nom : category;

        const docRef = doc(db, 'documents', documentToEdit.id);
        const updateData = {
          titre: title,
          categoryId: category,
          categorie: categoryName,
          annee: parseInt(annee, 10) || new Date().getFullYear(),
          isArchived: isArchived,
          isHidden: isHidden,
          type: computedType,
          lienSequenceurId: lienSequenceurId
        };
        
        if (isSongType) {
          updateData.nacao = nacao;
          updateData.rythme = rythme;
          updateData.parolesOriginales = parolesOriginales;
          updateData.parolesPhonetiques = parolesPhonetiques;
          updateData.traduction = traduction;
          updateData.anecdote = anecdote;
        }

        if (computedType === 'fabrication') {
          updateData.contenuFabrication = contenuFabrication;
          updateData.materielRequis = materielRequis;
          updateData.outilsNecessaires = outilsNecessaires;
          updateData.instrumentConcerne = instrumentConcerne;
          updateData.visuelAnimeUrl = finalVisuelAnimeUrl;
          updateData.etapesFabrication = await processEtapesImages(etapesFabrication);
        }
        
        if (computedType === 'fabrication' || computedType === 'song' || computedType === 'culture_fiche') {
          updateData.notesLexique = notesLexique;
          updateData.questionsQcm = questionsQcm;
        }

        if (computedType === 'culture_fiche') {
          const cleanPayload = (docData) => {
            docData.categorieFiche = categorieFiche;
            docData.themeCulture = themeCulture;
            docData.legendeImage = legendeImage;
            docData.chapitres = chapitresCulture;
            docData.anecdote = anecdote;
            docData.lexiqueMotsCles = lexiqueMotsCles;
            docData.lexique = lexique;
            docData.videoUrl = videoUrlCulture;

            // Réinitialiser conditionnels
            docData.villeRegion = null;
            docData.climatGeographie = null;
            docData.personnageOrisha = null;
            docData.elementNaturel = null;
            docData.hexPrimary = null;
            docData.hexSecondary = null;
            docData.iconeStamp = null;
            docData.outilAccessoire = null;
            docData.roleCortejo = null;
            docData.epoque = null;
            docData.rythme = null;
            docData.postureDanse = null;
            docData.ingredientPrincipal = null;
            docData.symbolesSacres = null;

            if (categorieFiche === 'Territoire') {
              docData.villeRegion = villeRegion;
              docData.climatGeographie = climatGeographie;
            } else if (categorieFiche === 'Orixás') {
              docData.personnageOrisha = personnageOrisha;
              docData.elementNaturel = elementNaturel;
              docData.hexPrimary = hexPrimary;
              docData.hexSecondary = hexSecondary;
              docData.outilAccessoire = outilAccessoire;
              docData.iconeStamp = iconeStamp;
              docData.symbolesSacres = symbolesSacres;
            } else if (categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') {
              docData.roleCortejo = roleCortejo;
              docData.outilAccessoire = outilAccessoire;
            } else if (categorieFiche === 'Histoire') {
              docData.epoque = epoque;
              docData.personnageOrisha = personnageOrisha;
            } else if (categorieFiche === 'Musique & Danse') {
              docData.rythme = rythme;
              docData.postureDanse = postureDanse;
            } else if (categorieFiche === 'Cuisine') {
              docData.ingredientPrincipal = ingredientPrincipal;
            }
          };
          cleanPayload(updateData);
        }

        if (isLinkType) {
          updateData.fileUrl = externalUrl;
        }

        // Nettoyage des valeurs undefined pour Firebase
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        await updateDoc(docRef, updateData);

        onClose();
      } catch (error) {
        console.error("DocumentUploadForm - Erreur d'update :", error);
        alert(t('common.saveError'));
      } finally {
        setIsUploading(false);
      }
      return;
    }
    
    if (!isLinkType && !isManualType && !file) {
      alert("Veuillez sélectionner un fichier.");
      return;
    }
    if (isLinkType && !externalUrl) {
      alert("Veuillez entrer une URL.");
      return;
    }

    if (!isLinkType && !isManualType && computedType === 'audio' && file.size > 15 * 1024 * 1024) {
      alert(t('documents.audioSizeError') || "Le fichier audio est trop volumineux (max 15 Mo).");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = '';

      if (isLinkType) {
        finalUrl = externalUrl;
      } else if (!isManualType) {
        const storagePath = `documents/${groupId}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        finalUrl = await getDownloadURL(snapshot.ref);
      }

      const categoryObj = varalCategories.find(c => c.id === category);
      const categoryName = categoryObj ? categoryObj.nom : category;

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
        isArchived: isArchived,
        isHidden: isHidden,
        lienSequenceurId: lienSequenceurId,
      };

      if (isSongType) {
        newDoc.nacao = nacao;
        newDoc.rythme = rythme;
        newDoc.parolesOriginales = parolesOriginales;
        newDoc.parolesPhonetiques = parolesPhonetiques;
        newDoc.traduction = traduction;
        newDoc.anecdote = anecdote;
      }

      if (computedType === 'fabrication') {
        newDoc.contenuFabrication = contenuFabrication;
        newDoc.materielRequis = materielRequis;
        newDoc.outilsNecessaires = outilsNecessaires;
        newDoc.instrumentConcerne = instrumentConcerne;
        newDoc.visuelAnimeUrl = finalVisuelAnimeUrl;
        newDoc.etapesFabrication = await processEtapesImages(etapesFabrication);
      }

      if (computedType === 'fabrication' || computedType === 'song' || computedType === 'culture_fiche') {
        newDoc.notesLexique = notesLexique;
        newDoc.questionsQcm = questionsQcm;
      }

      if (computedType === 'culture_fiche') {
        const cleanPayload = (docData) => {
            docData.categorieFiche = categorieFiche;
            docData.themeCulture = themeCulture;
            docData.legendeImage = legendeImage;
            docData.chapitres = chapitresCulture;
            docData.anecdote = anecdote;
            docData.lexiqueMotsCles = lexiqueMotsCles;
            docData.lexique = lexique;
            docData.videoUrl = videoUrlCulture;

            if (categorieFiche === 'Territoire') {
              docData.villeRegion = villeRegion;
              docData.climatGeographie = climatGeographie;
            } else if (categorieFiche === 'Orixás') {
              docData.personnageOrisha = personnageOrisha;
              docData.elementNaturel = elementNaturel;
              docData.hexPrimary = hexPrimary;
              docData.hexSecondary = hexSecondary;
              docData.outilAccessoire = outilAccessoire;
              docData.iconeStamp = iconeStamp;
              docData.symbolesSacres = symbolesSacres;
            } else if (categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') {
              docData.roleCortejo = roleCortejo;
              docData.outilAccessoire = outilAccessoire;
            } else if (categorieFiche === 'Histoire') {
              docData.epoque = epoque;
              docData.personnageOrisha = personnageOrisha;
            } else if (categorieFiche === 'Musique & Danse') {
              docData.rythme = rythme;
              docData.postureDanse = postureDanse;
            } else if (categorieFiche === 'Cuisine') {
              docData.ingredientPrincipal = ingredientPrincipal;
            }
        };
        cleanPayload(newDoc);
      }

      // Nettoyage des valeurs undefined pour Firebase
      Object.keys(newDoc).forEach(key => {
        if (newDoc[key] === undefined) {
          delete newDoc[key];
        }
      });

      await addDoc(collection(db, 'documents'), newDoc);

      onClose();
    } catch (error) {
      console.error("DocumentUploadForm - Erreur d'upload :", error);
      alert(t('common.saveError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
        {isEditMode ? (t('documents.editDocTitle') || "Modifier le document") : t('documents.addDocTitle')}
      </h4>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Category Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Corde Native
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={isUploading || isEditMode}
            className="theme-input w-full disabled:opacity-50"
          >
            {varalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector for Toadas / Culture / TutosFabrication */}
        {!isEditMode && (category === 'Toadas' || category === 'Culture' || category === 'TutosFabrication') && (
          <div className="flex gap-2 p-1 bg-encre-noire/5 rounded w-fit">
            <button 
              type="button" 
              onClick={() => setImportMode('manual')}
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-all ${importMode === 'manual' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
            >
              Saisie Manuelle
            </button>
            <button 
              type="button" 
              onClick={() => setImportMode('import')}
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-all ${importMode === 'import' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
            >
              Import (JSON)
            </button>
          </div>
        )}

        {/* IMPORT MODE UI */}
        {importMode === 'import' && !isEditMode && (category === 'Toadas' || category === 'Culture' || category === 'TutosFabrication') ? (
          <div className="flex flex-col gap-4 border-2 border-dashed border-cordel-master-dark/20 p-4 rounded bg-cordel-bg">
            <p className="text-xs text-cordel-master-dark">
              L'import JSON permet d'ajouter un lot entier de fiches d'un seul coup (idéal pour initialiser vos {category}).
            </p>
            <CordelButton 
              type="button" 
              variant="default"
              onClick={downloadTemplate}
              className="text-xs px-4 py-2 self-start"
            >
              ⬇️ Télécharger un modèle vierge (.json)
            </CordelButton>

            <div className="flex flex-col gap-1 mt-2">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Fichier JSON à importer
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleBatchFileChange}
                disabled={isUploading}
                className="theme-input w-full disabled:opacity-50 text-xs py-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
              />
            </div>
          </div>
        ) : (
          /* MANUAL MODE UI */
          <>
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {category === 'TutosFabrication' ? "Nom de l'atelier / tutoriel" : t('documents.docTitleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isUploading}
                placeholder={t('documents.docTitlePlaceholder')}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Champ Séquenceur (Optionnel) pour la catégorie Signes */}
            {(category.toLowerCase().includes('signe') || category === 'SignesMestre') && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lien Séquenceur (Optionnel)
                </label>
                {/* TODO: Plus tard, ce champ servira à lier l'audio du Gonguê/Alfaia pour le QCM */}
                <input
                  type="text"
                  value={lienSequenceurId}
                  onChange={(e) => setLienSequenceurId(e.target.value)}
                  disabled={isUploading}
                  placeholder="ID ou URL du pattern dans le Séquenceur..."
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
                />
              </div>
            )}

            {/* Type selector (only for ComptesRendus to autoriser linking instead of PDF) */}
            {category === 'ComptesRendus' && !isEditMode && (
               <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Format du Compte-Rendu
                  </label>
                  <select
                    value={pvType}
                    onChange={(e) => setPvType(e.target.value)}
                    disabled={isUploading}
                    className="theme-input w-full disabled:opacity-50"
                  >
                    <option value="pdf">Uploader un fichier (PDF)</option>
                    <option value="web">Lien URL (vers PV Studio Réunion)</option>
                  </select>
               </div>
            )}

            {/* Type selector (only for TutosFabrication) */}
            {category === 'TutosFabrication' && !isEditMode && importMode === 'manual' && (
               <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Format du Tutoriel
                  </label>
                  <select
                    value={tutoFabType}
                    onChange={(e) => setTutoFabType(e.target.value)}
                    disabled={isUploading}
                    className="theme-input w-full disabled:opacity-50"
                  >
                    <option value="fabrication">Créer une fiche de fabrication (Saisie manuelle)</option>
                    <option value="web">Lien URL externe (Vidéo YouTube, etc.)</option>
                  </select>
               </div>
            )}

            {/* Type selector (only for Culture) */}
            {category === 'Culture' && !isEditMode && importMode === 'manual' && (
               <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Format de la Fiche Culture
                  </label>
                  <select
                    value={cultureType}
                    onChange={(e) => setCultureType(e.target.value)}
                    disabled={isUploading}
                    className="theme-input w-full disabled:opacity-50"
                  >
                    <option value="song">Créer une fiche (Saisie manuelle)</option>
                    <option value="web">Lien URL externe (Vidéo YouTube, Article, etc.)</option>
                  </select>
               </div>
            )}

            {/* Document Year (Useful for Administratif, ComptesRendus, PhotosPrestations) */}
            {(category === 'Administratif' || category === 'ComptesRendus' || category === 'PhotosPrestations') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('documents.yearLabel') || "Année de référence"}
                </label>
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  required
                  disabled={isUploading}
                  min="1900"
                  max="2100"
                  placeholder="Ex: 2024"
                  className="theme-input w-full disabled:opacity-50 text-xs font-bold"
                />
              </div>
            )}

            {/* External URL Inputs */}
            {(computedType === 'video' || computedType === 'web' || computedType === 'dossier_externe') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {computedType === 'dossier_externe' ? "Lien du dossier public (Drive, Framaspace...)" : "URL Externe (Lien de la vidéo, de la réunion, etc.)"}
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  required
                  disabled={isUploading}
                  placeholder="https://..."
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
                />
              </div>
            )}

            {/* PDF Upload */}
            {computedType === 'pdf' && !isEditMode && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Document PDF
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  disabled={isUploading}
                  accept="application/pdf"
                  className="theme-input w-full disabled:opacity-50 text-xs py-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                />
              </div>
            )}

            {/* Song / Culture Text fields */}
            {computedType === 'song' && (
              <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Origine / Nation / Auteur
                    </label>
                    <input
                      type="text"
                      value={nacao}
                      onChange={(e) => setNacao(e.target.value)}
                      disabled={isUploading}
                      placeholder="Ex: Porto Rico"
                      className="theme-input w-full disabled:opacity-50 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {category === 'Culture' ? "Époque / Période" : "Rythme"}
                    </label>
                    <input
                      type="text"
                      value={rythme}
                      onChange={(e) => setRythme(e.target.value)}
                      disabled={isUploading}
                      placeholder={category === 'Culture' ? "Ex: 19ème Siècle" : "Ex: Baque de Virada"}
                      className="theme-input w-full disabled:opacity-50 text-xs"
                    />
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${category === 'Toadas' ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {category === 'Culture' ? "Texte de contenu (Fiche Culturelle)" : "Paroles Originales (Mettez en gras le Puxador/Soliste)"}
                    </label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={parolesOriginales}
                        onChange={(html) => setParolesOriginales(html)}
                        disabled={isUploading}
                        placeholder={category === 'Culture' ? "Rédigez la fiche culturelle ici..." : "Paroles dans la langue d'origine..."}
                        minHeight="120px"
                        showImage={category === 'Culture'}
                        showLists={category === 'Culture'}
                        showAlign={category === 'Culture'}
                      />
                    </div>
                  </div>
                  
                  {category === 'Toadas' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Paroles Phonétiques (Mettez en gras le Puxador/Soliste)
                      </label>
                      <div className="mt-1">
                        <RichTextEditor
                          value={parolesPhonetiques}
                          onChange={(html) => setParolesPhonetiques(html)}
                          disabled={isUploading}
                          placeholder="Prononciation..."
                          minHeight="120px"
                          showImage={false}
                          showLists={false}
                          showAlign={false}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {category === 'Toadas' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Traduction
                    </label>
                    <textarea
                      value={traduction}
                      onChange={(e) => setTraduction(e.target.value)}
                      disabled={isUploading}
                      placeholder="Traduction française..."
                      className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
                    />
                  </div>
                )}



                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Information
                  </label>
                  <textarea
                    value={anecdote}
                    onChange={(e) => setAnecdote(e.target.value)}
                    disabled={isUploading}
                    placeholder="Informations ou contexte supplémentaire..."
                    className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
                  />
                </div>
              </div>
            )}

            {/* Culture Text fields */}
            {computedType === 'culture_fiche' && (
              <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Catégorie (Type de fiche)
                    </label>
                    <select
                      value={categorieFiche}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCategorieFiche(val);
                        if (val === 'Orixás') { setThemeCulture('orixas'); setIconeStamp('axe-default'); }
                        else if (val === 'Cuisine') setThemeCulture('cuisine');
                        else if (val === 'Histoire') setThemeCulture('histoire');
                        else if (val === 'Musique & Danse') setThemeCulture('musique');
                        else if (val === 'Cour Royale') setThemeCulture('cortejo');
                        else if (val === 'Territoire') setThemeCulture('territoire');
                        else if (val === 'Folklore') setThemeCulture('folklore');
                      }}
                      disabled={isUploading}
                      className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-wood/10"
                    >
                      <option value="Orixás">Orixás</option>
                      <option value="Territoire">Territoire</option>
                      <option value="Cour Royale">Cour Royale</option>
                      <option value="Histoire">Histoire</option>
                      <option value="Musique & Danse">Musique & Danse</option>
                      <option value="Cuisine">Cuisine</option>
                      <option value="Folklore">Folklore</option>
                    </select>
                  </div>
                </div>

                {/* RENDU CONDITIONNEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md">
                  {categorieFiche === 'Territoire' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ville / Région</label>
                        <input type="text" value={villeRegion || ''} onChange={(e) => setVilleRegion(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Climat / Géographie</label>
                        <input type="text" value={climatGeographie || ''} onChange={(e) => setClimatGeographie(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Orixás' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Nom de l'Orixá</label>
                        <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Élément Naturel</label>
                        <input type="text" value={elementNaturel || ''} onChange={(e) => setElementNaturel(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Couleurs (Primaire & Secondaire)</label>
                        <div className="flex gap-2">
                          <input type="color" value={hexPrimary || '#EAB308'} onChange={(e) => setHexPrimary(e.target.value)} disabled={isUploading} className="w-8 h-8 rounded cursor-pointer" />
                          <input type="color" value={hexSecondary || '#FFFFFF'} onChange={(e) => setHexSecondary(e.target.value)} disabled={isUploading} className="w-8 h-8 rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Outil / Accessoire</label>
                        <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Selo de Axé (Tampon SVG)</label>
                        <select value={iconeStamp} onChange={(e) => setIconeStamp(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs">
                           <option value="axe-default">Défaut / Générique</option>
                           <option value="axe-oxala">Oxalá</option>
                           <option value="axe-yemanja">Yemanjá</option>
                           <option value="axe-oxum">Oxum</option>
                           <option value="axe-iansa">Iansã</option>
                           <option value="axe-oxossi">Oxóssi</option>
                           <option value="axe-ogum">Ogum</option>
                           <option value="axe-xango">Xangô</option>
                           <option value="axe-nana">Nanã</option>
                           <option value="axe-obaluai">Obaluaiê</option>
                           <option value="axe-exu">Exu</option>
                           <option value="axe-oxumare">Oxumarê</option>
                           <option value="axe-logunede">Logun Edé</option>
                        </select>
                      </div>
                    </>
                  )}

                  {(categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Rôle dans le Cortejo</label>
                        <input type="text" value={roleCortejo || ''} onChange={(e) => setRoleCortejo(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Accessoire / Objet</label>
                        <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Histoire' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Époque / Date</label>
                        <input type="text" value={epoque || ''} onChange={(e) => setEpoque(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Figure Historique</label>
                        <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Musique & Danse' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Rythme (Baque)</label>
                        <input type="text" value={rythme || ''} onChange={(e) => setRythme(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Posture de danse</label>
                        <input type="text" value={postureDanse || ''} onChange={(e) => setPostureDanse(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Cuisine' && (
                    <>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ingrédient principal</label>
                        <input type="text" value={ingredientPrincipal || ''} onChange={(e) => setIngredientPrincipal(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}
                  
                  {categorieFiche === 'Folklore' && (
                    <div className="md:col-span-2 text-center text-xs text-cordel-master-dark/70 italic py-2">
                      (Pas de champs spécifiques pour le folklore, utilisez la description)
                    </div>
                  )}
                </div>

                {!isEditMode && (
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Image Principale
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="theme-input w-full disabled:opacity-50 text-xs py-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                    />
                    {externalUrl && (
                      <span className="text-[9px] text-cordel-vert font-bold">Image actuelle: {externalUrl.split('/').pop()}</span>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Légende de l'image
                  </label>
                  <input
                    type="text"
                    value={legendeImage}
                    onChange={(e) => setLegendeImage(e.target.value)}
                    disabled={isUploading}
                    placeholder="Courte description de l'image..."
                    className="theme-input w-full disabled:opacity-50 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
                      📖 Chapitres
                    </label>
                    <button
                      type="button"
                      onClick={addChapitreCulture}
                      disabled={isUploading}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm"
                    >
                      + Ajouter un chapitre
                    </button>
                  </div>

                  {chapitresCulture.length === 0 ? (
                    <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
                      Aucun chapitre défini.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {chapitresCulture.map((chap, index) => (
                        <div key={chap.id} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveChapitreCultureUp(index)}
                              disabled={index === 0}
                              className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1"
                              title="Monter"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveChapitreCultureDown(index)}
                              disabled={index === chapitresCulture.length - 1}
                              className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1"
                              title="Descendre"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => removeChapitreCulture(chap.id)}
                              className="text-xs text-cordel-rouge hover:opacity-80 p-1"
                              title="Supprimer"
                            >
                              ❌
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-3 pr-16">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Sous-Titre
                              </label>
                              <input
                                type="text"
                                value={chap.sousTitre}
                                onChange={(e) => updateChapitreCulture(chap.id, 'sousTitre', e.target.value)}
                                placeholder="Ex: Origine et Symbole"
                                className="theme-input w-full text-xs font-bold"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Texte
                              </label>
                              <div className="mt-1">
                                <RichTextEditor
                                  value={chap.texte}
                                  onChange={(html) => updateChapitreCulture(chap.id, 'texte', html)}
                                  disabled={isUploading}
                                  placeholder="Contenu du chapitre..."
                                  minHeight="120px"
                                  showImage={true}
                                  showLists={true}
                                  showAlign={true}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Anecdote / Le saviez-vous ?
                  </label>
                  <textarea
                    value={anecdote}
                    onChange={(e) => setAnecdote(e.target.value)}
                    disabled={isUploading}
                    placeholder="Une petite phrase clé très marquante..."
                    className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Lexique / Mots-clés (Étiquettes simples)
                  </label>
                  <input
                    type="text"
                    value={lexiqueMotsCles}
                    onChange={(e) => setLexiqueMotsCles(e.target.value)}
                    disabled={isUploading}
                    placeholder="Ex: Calunga, Axé, Egum, Búzios"
                    className="theme-input w-full disabled:opacity-50 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1 mt-4 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
                      📖 Dictionnaire / Lexique Détaillé
                    </label>
                    <button
                      type="button"
                      onClick={addLexiqueItem}
                      disabled={isUploading}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm"
                    >
                      + Ajouter un mot
                    </button>
                  </div>

                  {lexique.length === 0 ? (
                    <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
                      Aucun mot de lexique défini (utilisé pour les QCM).
                    </p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {lexique.map((item, index) => (
                        <div key={index} className="bg-[#fdfaf2] border border-cordel-wood/30 p-4 rounded-md shadow-sm relative">
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={() => removeLexiqueItem(index)}
                              className="text-xs text-cordel-rouge hover:opacity-80 p-1"
                              title="Supprimer"
                            >
                              ❌
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-3 pr-8">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Mot / Terme
                              </label>
                              <input
                                type="text"
                                value={item.pt}
                                onChange={(e) => updateLexiqueItem(index, 'pt', e.target.value)}
                                placeholder="Ex: Caboclo de Lança"
                                className="theme-input w-full text-xs font-bold bg-white"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Définition / Explication
                              </label>
                              <textarea
                                value={item.fr}
                                onChange={(e) => updateLexiqueItem(index, 'fr', e.target.value)}
                                placeholder="Guerrier portant une lance..."
                                className="theme-input w-full text-xs min-h-[60px] bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    URL de la vidéo externe (YouTube/Vimeo)
                  </label>
                  <input
                    type="url"
                    value={videoUrlCulture}
                    onChange={(e) => setVideoUrlCulture(e.target.value)}
                    disabled={isUploading}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
                  />
                </div>

                {/* Section Danse & Gestuelle */}
                <div className="flex flex-col gap-4 mt-4 pt-4 border-t-2 border-dashed border-cordel-master-dark/20">
                  <h5 className="text-xs font-bold text-cordel-wood uppercase">Danse & Gestuelle</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Nom du Geste</label>
                      <input type="text" value={danseData.nomDuGeste} onChange={(e) => setDanseData({...danseData, nomDuGeste: e.target.value})} disabled={isUploading} className="theme-input w-full text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Mots-clés Corps</label>
                      <input type="text" value={danseData.motsClesCorps} onChange={(e) => setDanseData({...danseData, motsClesCorps: e.target.value})} disabled={isUploading} placeholder="Ex: Omoplates, Hanches" className="theme-input w-full text-xs" />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Description Geste</label>
                      <textarea value={danseData.descriptionGeste} onChange={(e) => setDanseData({...danseData, descriptionGeste: e.target.value})} disabled={isUploading} className="theme-input w-full text-xs min-h-[60px]" />
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Lien Media (Image/GIF/Vidéo)</label>
                      <input type="url" value={danseData.mediaGesteUrl} onChange={(e) => setDanseData({...danseData, mediaGesteUrl: e.target.value})} disabled={isUploading} placeholder="https://" className="theme-input w-full text-xs" />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Fabrication Text fields */}
            {computedType === 'fabrication' && (
              <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Visuel animé en boucle (GIF ou petite vidéo MP4)
                  </label>
                  <div className="flex gap-2 p-1 bg-encre-noire/5 rounded w-fit mb-1">
                    <button
                      type="button"
                      onClick={() => setVisuelAnimeType('url')}
                      className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${visuelAnimeType === 'url' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
                    >
                      Lien URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisuelAnimeType('file')}
                      className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${visuelAnimeType === 'file' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
                    >
                      Uploader fichier
                    </button>
                  </div>
                  
                  {visuelAnimeType === 'url' ? (
                    <input
                      type="url"
                      value={visuelAnimeUrl}
                      onChange={(e) => setVisuelAnimeUrl(e.target.value)}
                      disabled={isUploading}
                      placeholder="https://..."
                      className="theme-input w-full text-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*,video/mp4,image/gif"
                        onChange={(e) => setVisuelAnimeFile(e.target.files[0])}
                        disabled={isUploading}
                        className="theme-input w-full text-xs py-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                      />
                      {(visuelAnimeUrl && !visuelAnimeFile) && (
                        <span className="text-[9px] text-cordel-vert font-bold flex-shrink-0">✓ Fichier actuel conservé</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Instrument concerné
                  </label>
                  <input
                    type="text"
                    value={instrumentConcerne}
                    onChange={(e) => setInstrumentConcerne(e.target.value)}
                    disabled={isUploading}
                    placeholder="Ex: Alfaia, Agbê, Mineiro..."
                    className="theme-input w-full disabled:opacity-50 text-xs"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Matériel Requis
                    </label>
                    <textarea
                      value={materielRequis}
                      onChange={(e) => setMaterielRequis(e.target.value)}
                      disabled={isUploading}
                      placeholder="Ex: Fût en bois, Peau animale, Corde..."
                      className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Outils Nécessaires
                    </label>
                    <textarea
                      value={outilsNecessaires}
                      onChange={(e) => setOutilsNecessaires(e.target.value)}
                      disabled={isUploading}
                      placeholder="Ex: Perceuse, Mètre, Ciseaux..."
                      className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
                      🛠️ Étapes de fabrication
                    </label>
                    <button
                      type="button"
                      onClick={addEtape}
                      disabled={isUploading}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm"
                    >
                      + Ajouter une étape
                    </button>
                  </div>

                  {etapesFabrication.length === 0 ? (
                    <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
                      Aucune étape définie.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {etapesFabrication.map((etape, index) => (
                        <div key={etape.id} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveEtapeUp(index)}
                              disabled={index === 0}
                              className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1"
                              title="Monter"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEtapeDown(index)}
                              disabled={index === etapesFabrication.length - 1}
                              className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1"
                              title="Descendre"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEtape(etape.id)}
                              className="text-xs text-cordel-rouge hover:opacity-80 p-1"
                              title="Supprimer"
                            >
                              ❌
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-3 pr-16">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Étape {index + 1} - Titre court
                              </label>
                              <input
                                type="text"
                                value={etape.sousTitre}
                                onChange={(e) => updateEtape(etape.id, 'sousTitre', e.target.value)}
                                placeholder="Ex: Découpe du bois"
                                className="theme-input w-full text-xs font-bold"
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Description détaillée
                              </label>
                              <textarea
                                value={etape.description}
                                onChange={(e) => updateEtape(etape.id, 'description', e.target.value)}
                                placeholder="Décrivez l'action à réaliser..."
                                className="theme-input w-full text-xs min-h-[60px]"
                              />
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Image de l'étape
                              </label>
                              <div className="flex gap-2 p-1 bg-encre-noire/5 rounded w-fit mb-1">
                                <button
                                  type="button"
                                  onClick={() => updateEtape(etape.id, 'imageUploadType', 'url')}
                                  className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${etape.imageUploadType === 'url' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
                                >
                                  Lien URL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateEtape(etape.id, 'imageUploadType', 'file')}
                                  className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all ${etape.imageUploadType === 'file' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'}`}
                                >
                                  Uploader fichier
                                </button>
                              </div>
                              
                              {etape.imageUploadType === 'url' ? (
                                <input
                                  type="url"
                                  value={etape.imageUrl}
                                  onChange={(e) => updateEtape(etape.id, 'imageUrl', e.target.value)}
                                  placeholder="https://..."
                                  className="theme-input w-full text-xs"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    accept="image/*,video/mp4,image/gif"
                                    onChange={(e) => updateEtape(etape.id, 'imageFile', e.target.files[0])}
                                    className="theme-input w-full text-xs py-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                                  />
                                  {(etape.imageUrl && !etape.imageFile) && (
                                    <span className="text-[9px] text-cordel-vert font-bold flex-shrink-0">✓ Fichier actuel conservé</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common fields for Song, Fabrication and Culture */}
            {(computedType === 'song' || computedType === 'fabrication' || computedType === 'culture_fiche') && (
              <>
                {(computedType === 'song' || computedType === 'fabrication') && (
                  <div className="flex flex-col gap-1 mt-4">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Astérisques / Vocabulaire
                    </label>
                    <textarea
                      value={notesLexique}
                      onChange={(e) => setNotesLexique(e.target.value)}
                      disabled={isUploading}
                      placeholder="Explications des mots référencés par un astérisque dans le texte..."
                      className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
                    />
                  </div>
                )}

                {/* QCM BLOCK */}
                <div className="flex flex-col gap-4 mt-6 pt-4 border-t-2 border-dashed border-cordel-master-dark/20">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
                      ❓ Questions QCM
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={isUploading}
                      className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm"
                    >
                      + Ajouter une question
                    </button>
                  </div>
                  
                  {questionsQcm.length === 0 ? (
                    <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
                      Aucune question pour le moment.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {questionsQcm.map((q, qIndex) => (
                        <div key={qIndex} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="absolute top-2 right-2 text-cordel-rouge hover:opacity-80 p-1"
                            title="Supprimer la question"
                          >
                            ❌
                          </button>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1 pr-6">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Question {qIndex + 1}
                              </label>
                              <input
                                type="text"
                                value={q.question}
                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                placeholder="Posez votre question..."
                                className="theme-input w-full text-xs"
                                required
                              />
                            </div>
                            
                            <div className="flex flex-col gap-2 pl-2 border-l-2 border-cordel-wood/20">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Options de réponse (Cochez la bonne réponse)
                              </label>
                              {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`q_${qIndex}_correct`}
                                    checked={q.correctIndex === optIndex}
                                    onChange={() => updateQuestion(qIndex, 'correctIndex', optIndex)}
                                    className="w-4 h-4 text-cordel-vert focus:ring-cordel-vert"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                    placeholder={`Option ${optIndex + 1}`}
                                    className="theme-input flex-1 text-xs py-1"
                                    required
                                  />
                                  {q.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(qIndex, optIndex)}
                                      className="text-[10px] text-cordel-rouge px-1"
                                    >
                                      ✖
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(qIndex)}
                                className="text-[10px] text-cordel-vert self-start hover:underline mt-1 font-bold"
                              >
                                + Ajouter une option
                              </button>
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-2">
                              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                                Extrait du texte (Explication affichée lors de la correction)
                              </label>
                              <textarea
                                value={q.extraitTexte}
                                onChange={(e) => updateQuestion(qIndex, 'extraitTexte', e.target.value)}
                                placeholder="Copiez-collez ici le bout du texte qui justifie la réponse..."
                                className="theme-input w-full text-xs min-h-[60px] resize-y"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Archiving Checkbox (Only for Toadas) */}
            {category === 'Toadas' && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2 bg-cordel-bg border border-cordel-wood/30 p-3 rounded shadow-xs">
                  <input
                    type="checkbox"
                    id="isArchivedCheck"
                    checked={isArchived}
                    onChange={(e) => setIsArchived(e.target.checked)}
                    disabled={isUploading}
                    className="w-4 h-4 text-cordel-wood rounded focus:ring-cordel-wood"
                  />
                  <label htmlFor="isArchivedCheck" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                    📦 Archiver (Ne plus étudier cette saison / Exclure du QCM)
                  </label>
                </div>
              </div>
            )}
            
            {/* Hidden/Draft Checkbox (All categories) */}
            <div className="flex items-center gap-2 mt-2 bg-cordel-bg border border-cordel-rouge/30 p-3 rounded shadow-xs">
              <input
                type="checkbox"
                id="isHiddenCheck"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                disabled={isUploading}
                className="w-4 h-4 text-cordel-rouge rounded focus:ring-cordel-rouge"
              />
              <label htmlFor="isHiddenCheck" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                👁️ Masquer sur le Varal (Brouillon / En préparation)
              </label>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-encre-noire/10">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={onClose} 
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            {t('common.cancel')}
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="ocre" 
            useExtremeBorder={true}
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            {isUploading ? t('documents.uploadingMsg') : (t('common.confirm') || "Valider")}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
