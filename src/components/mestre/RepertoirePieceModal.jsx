import React, { useState, useEffect, useMemo } from 'react';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { formatPieceTablature } from '../../utils/tablatureFormatter';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';
import RepertoireVideosPicker from './RepertoireVideosPicker';
import RepertoireSignalsPicker from './RepertoireSignalsPicker';
import RepertoireSinaisDoMestreEditor from './RepertoireSinaisDoMestreEditor';
import CreateCultureFicheModal from './CreateCultureFicheModal';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { cleanFirestorePayload } from '../../utils/firestoreUtils';
import {
  findMatchingPreset,
  findMatchingToada,
  findMatchingCultureDoc,
  findMatchingChoreography
} from '../../utils/repertoireMatcher';

/**
 * Modale de création et d'édition d'un morceau du répertoire musical.
 * Architecture réactive : ne stocke que les identifiants et pointeurs vers les ressources sources
 * (Séquenceur, Toadas du Varal, Dançad'Or, Fiches Culturelles).
 * Ne persiste aucun snapshot statique volumineux (tablature, signes ou audio dérivés).
 *
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {string} groupId - Identifiant de l'association
 * @param {Object|null} pieceToEdit - Objet morceau à éditer ou null pour création
 * @param {Function} onSaveSuccess - Callback après enregistrement réussi
 */
export default function RepertoirePieceModal({
  isOpen,
  onClose,
  groupId,
  pieceToEdit = null,
  onSaveSuccess
}) {
  // Champs administratifs & de direction artistique
  const [titre, setTitre] = useState('');
  const [statutSaison, setStatutSaison] = useState('saison'); // 'saison' | 'chantier' | 'archive'
  const [etatValidation, setEtatValidation] = useState('pret'); // 'pret' | 'a_faire'
  const [notes, setNotes] = useState('');

  // Vidéos personnalisables & Signes gestuels du Mestre (IDs)
  const [videos, setVideos] = useState([]);
  const [signalIds, setSignalIds] = useState([]);
  const [sinaisDoMestre, setSinaisDoMestre] = useState([]);

  // Pointeurs réactifs vers les applications et modules transversaux
  const [selectedToadaId, setSelectedToadaId] = useState('');
  const [selectedSeqUrl, setSelectedSeqUrl] = useState('');
  const [selectedSeqType, setSelectedSeqType] = useState(null); // 'presets' | 'sections' | 'patterns'
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [selectedChoreoId, setSelectedChoreoId] = useState('');
  const [selectedCultureId, setSelectedCultureId] = useState('');

  // Média et documentation propre au morceau
  const [videoUrl, setVideoUrl] = useState('');
  const [histoire, setHistoire] = useState('');
  const [showTabPreview, setShowTabPreview] = useState(false);
  const [isCultureModalOpen, setIsCultureModalOpen] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // État du formulaire
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Hooks réactifs en direct (Séquenceur, Dançad'Or, Varal)
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { choreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);
  const { toadasList, cultureDocsList, loadingDocs } = useRepertoireVaralDocs(groupId);

  // Détection du preset Séquenceur sélectionné en mémoire
  const selectedPreset = useMemo(() => {
    if (!selectedSeqUrl || !catalogRhythms || catalogRhythms.length === 0) return null;
    return catalogRhythms.find(
      (r) => r.jsonUrl === selectedSeqUrl || r.id === selectedSeqUrl
    ) || null;
  }, [selectedSeqUrl, catalogRhythms]);

  // Audio effectif affiché (priorité au preset Séquenceur, sinon audio personnalisé)
  const effectiveAudioUrl = selectedPreset?.audioUrl || customAudioUrl || '';

  // Initialisation à l'ouverture (création vs modification)
  useEffect(() => {
    if (!isOpen) return;

    if (pieceToEdit) {
      setTitre(pieceToEdit.titre || '');
      setStatutSaison(pieceToEdit.statutSaison || 'saison');
      setEtatValidation(pieceToEdit.etatValidation || 'pret');
      setNotes(pieceToEdit.notes || '');
      setVideos(Array.isArray(pieceToEdit.videos) ? pieceToEdit.videos : []);
      setSignalIds(Array.isArray(pieceToEdit.signalIds) ? pieceToEdit.signalIds : []);
      setSinaisDoMestre(Array.isArray(pieceToEdit.sinaisDoMestre) ? pieceToEdit.sinaisDoMestre : []);
      setSelectedToadaId(pieceToEdit.toadaDocId || '');

      const rawSeq = pieceToEdit.sequenceurFileUrl || pieceToEdit.sequenceurId || '';
      setSelectedSeqUrl(rawSeq);
      setSelectedSeqType(pieceToEdit.sequenceurType || null);

      setCustomAudioUrl(pieceToEdit.audioUrl || '');
      setSelectedChoreoId(pieceToEdit.dancadorChoreoId || '');
      setSelectedCultureId(pieceToEdit.cultureDocId || '');
      setShowTabPreview(false);
      setVideoUrl(pieceToEdit.videoUrl || pieceToEdit.youtubeUrl || pieceToEdit.activeVideoUrl || (pieceToEdit.videos && pieceToEdit.videos[0]?.url) || '');
      setHistoire(pieceToEdit.contexteHistorique || pieceToEdit.histoire || pieceToEdit.activeHistoire || '');
    } else {
      setTitre('');
      setStatutSaison('saison');
      setEtatValidation('pret');
      setNotes('');
      setVideos([]);
      setSignalIds([]);
      setSinaisDoMestre([]);
      setSelectedToadaId('');
      setSelectedSeqUrl('');
      setSelectedSeqType(null);
      setCustomAudioUrl('');
      setShowTabPreview(false);
      setVideoUrl('');
      setHistoire('');
      setSelectedChoreoId('');
      setSelectedCultureId('');
    }
    setErrorMsg(null);
  }, [isOpen, pieceToEdit]);

  // Calcul paresseux de la tablature pour la prévisualisation (uniquement si dépliée)
  const previewTablature = useMemo(() => {
    if (!showTabPreview) return '';
    if (selectedPreset?.parsedData) {
      try {
        return formatPieceTablature(selectedPreset.parsedData);
      } catch (err) {
        console.warn("Erreur calcul tablature prévisualisation :", err);
      }
    }
    return pieceToEdit?.tablature || '';
  }, [showTabPreview, selectedPreset, pieceToEdit]);

  // Toada actuellement sélectionnée
  const selectedSong = useMemo(() => {
    return toadasList.find((s) => s.id === selectedToadaId) || null;
  }, [toadasList, selectedToadaId]);

  // Détections automatiques de suggestions rapides en arrière-plan
  const detectedSuggestions = useMemo(() => {
    if (!titre.trim()) return null;
    const seqMatch = !selectedSeqUrl ? findMatchingPreset(titre, catalogRhythms) : null;
    const toadaMatch = !selectedToadaId ? findMatchingToada(titre, toadasList) : null;
    const choreoMatch = !selectedChoreoId ? findMatchingChoreography(titre, choreographies) : null;
    const cultureMatch = !selectedCultureId ? findMatchingCultureDoc(titre, cultureDocsList) : null;

    return {
      seqMatch,
      toadaMatch,
      choreoMatch,
      cultureMatch,
      hasAny: Boolean(seqMatch || toadaMatch || choreoMatch || cultureMatch)
    };
  }, [titre, selectedSeqUrl, selectedToadaId, selectedChoreoId, selectedCultureId, catalogRhythms, toadasList, choreographies, cultureDocsList]);

  // Gestion de la saisie du titre avec auto-liaison NON DESTRUCTIVE (champs vides uniquement)
  const handleTitreChange = (e) => {
    const newTitre = e.target.value;
    setTitre(newTitre);

    if (newTitre.trim()) {
      // 1. Auto-liaison Séquenceur si non renseigné
      if (!selectedSeqUrl && catalogRhythms.length > 0) {
        const foundSeq = findMatchingPreset(newTitre, catalogRhythms);
        if (foundSeq) {
          setSelectedSeqUrl(foundSeq.jsonUrl || foundSeq.id);
          setSelectedSeqType(foundSeq._collection || null);
        }
      }

      // 2. Auto-liaison Toada si non renseignée
      if (!selectedToadaId && toadasList.length > 0) {
        const foundToada = findMatchingToada(newTitre, toadasList);
        if (foundToada) {
          setSelectedToadaId(foundToada.id);
        }
      }

      // 3. Auto-liaison Chorégraphie si non renseignée
      if (!selectedChoreoId && choreographies.length > 0) {
        const foundChoreo = findMatchingChoreography(newTitre, choreographies);
        if (foundChoreo) {
          setSelectedChoreoId(foundChoreo.id);
        }
      }

      // 4. Auto-liaison Fiche Culture si non renseignée
      if (!selectedCultureId && cultureDocsList.length > 0) {
        const foundCulture = findMatchingCultureDoc(newTitre, cultureDocsList);
        if (foundCulture) {
          setSelectedCultureId(foundCulture.id);
        }
      }
    }
  };

  // Sélection d'une Toada avec auto-complétion intelligente non destructive
  const handleToadaChange = (e) => {
    const newToadaId = e.target.value;
    setSelectedToadaId(newToadaId);

    if (newToadaId) {
      const chosenSong = toadasList.find((s) => s.id === newToadaId);
      if (chosenSong && chosenSong.titre) {
        if (!titre.trim()) {
          setTitre(chosenSong.titre);
        }
        // Auto-liaisons transversales non destructives
        if (!selectedSeqUrl && catalogRhythms.length > 0) {
          const matchSeq = findMatchingPreset(chosenSong.titre, catalogRhythms);
          if (matchSeq) {
            setSelectedSeqUrl(matchSeq.jsonUrl || matchSeq.id);
            setSelectedSeqType(matchSeq._collection || null);
          }
        }
        if (!selectedChoreoId && choreographies.length > 0) {
          const matchChoreo = findMatchingChoreography(chosenSong.titre, choreographies);
          if (matchChoreo) setSelectedChoreoId(matchChoreo.id);
        }
      }
    }
  };

  // Sélection d'un rythme ou preset Séquenceur
  const handleSequenceurChange = (e) => {
    const newSeqUrl = e.target.value;
    setSelectedSeqUrl(newSeqUrl);

    // Injection automatique du titre si vide
    if (newSeqUrl && !titre.trim()) {
      const foundItem = catalogRhythms.find((r) => r.jsonUrl === newSeqUrl || r.id === newSeqUrl);
      if (foundItem && (foundItem.titre || foundItem.name)) {
        setTitre(foundItem.titre || foundItem.name);
      }
    }

    if (newSeqUrl) {
      const found = catalogRhythms.find((r) => r.jsonUrl === newSeqUrl || r.id === newSeqUrl);
      if (found) {
        setSelectedSeqType(found._collection || null);
        const seqName = found.titre || found.name;

        // Auto-compléter la vidéo YouTube si présente dans le preset
        const presetVideo = found.videoUrl || found.parsedData?.metadata?.videoUrl || found.parsedData?.metadata?.youtubeUrl || found.youtubeUrl || null;
        if (presetVideo && !videoUrl.trim()) {
          setVideoUrl(presetVideo.trim());
        }

        // Auto-compléter l'histoire / contexte culturel si présent dans le preset
        const presetHistoire = found.parsedData?.metadata?.histoire ||
          found.parsedData?.metadata?.contexteHistorique ||
          found.parsedData?.metadata?.descriptionFr ||
          found.parsedData?.metadata?.description ||
          found.parsedData?.description ||
          found.histoire || null;
        if (presetHistoire && !histoire.trim()) {
          setHistoire(presetHistoire.trim());
        }

        // Auto-aspiration des signes et conventions du Mestre depuis le preset
        const extractedSinais = found.parsedData?.sinaisDoMestre ||
          found.parsedData?.metadata?.sinaisDoMestre ||
          found.sinaisDoMestre ||
          [];
        if (Array.isArray(extractedSinais) && extractedSinais.length > 0) {
          setSinaisDoMestre(extractedSinais);
        }

        // Auto-liaisons transversales non destructives
        if (seqName) {
          if (!selectedToadaId && toadasList.length > 0) {
            const matchToada = findMatchingToada(seqName, toadasList);
            if (matchToada) setSelectedToadaId(matchToada.id);
          }
          if (!selectedChoreoId && choreographies.length > 0) {
            const matchChoreo =
              findMatchingChoreography(found.id, choreographies) ||
              findMatchingChoreography(seqName, choreographies);
            if (matchChoreo) setSelectedChoreoId(matchChoreo.id);
          }
          if (!selectedCultureId && cultureDocsList.length > 0) {
            const matchCulture = findMatchingCultureDoc(seqName, cultureDocsList);
            if (matchCulture) setSelectedCultureId(matchCulture.id);
          }
        }
      }
    } else {
      setSelectedSeqType(null);
    }
  };

  // Téléversement d'un fichier audio autonome vers Storage
  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Le fichier audio est trop volumineux (maximum 25 Mo).");
      return;
    }

    setUploadingAudio(true);
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `associations/${groupId}/repertoire/audio_${Date.now()}_${cleanFileName}`;
      const audioRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(audioRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setCustomAudioUrl(downloadUrl);
    } catch (err) {
      console.error("Erreur lors du téléversement audio :", err);
      alert("Erreur lors de l'envoi du fichier audio.");
    } finally {
      setUploadingAudio(false);
      e.target.value = '';
    }
  };

  // Enregistrement Firestore réactif (schéma épuré sans snapshots dérivés)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) {
      setErrorMsg("Veuillez renseigner le titre du morceau.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Résolution de l'identifiant et de l'URL Séquenceur
      let matchedSeqId = null;
      let matchedSeqUrl = null;
      let matchedSeqType = selectedSeqType || null;

      if (selectedSeqUrl && catalogRhythms.length > 0) {
        const found = catalogRhythms.find(
          (r) => r.jsonUrl === selectedSeqUrl || r.id === selectedSeqUrl
        );
        if (found) {
          matchedSeqId = found.id || null;
          matchedSeqType = found._collection || null;
          matchedSeqUrl =
            found.jsonUrl &&
            (found.jsonUrl.startsWith('http://') || found.jsonUrl.startsWith('https://'))
              ? found.jsonUrl
              : selectedSeqUrl.startsWith('http://') || selectedSeqUrl.startsWith('https://')
                ? selectedSeqUrl
                : null;
        } else {
          if (selectedSeqUrl.startsWith('http://') || selectedSeqUrl.startsWith('https://')) {
            matchedSeqUrl = selectedSeqUrl;
          } else {
            matchedSeqId = selectedSeqUrl;
          }
        }
      }

      // Nettoyage strict des vidéos personnalisées
      const cleanVideos = (videos || [])
        .filter((v) => v && typeof v.url === 'string' && v.url.trim() !== '')
        .map((v) => ({
          id: v.id || `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          titre: (v.titre || '').trim(),
          url: v.url.trim()
        }));

      const cleanSignalIds = (signalIds || []).filter(Boolean);

      // Vidéo principale ajoutée à la liste si non présente
      if (videoUrl && videoUrl.trim()) {
        const vTrim = videoUrl.trim();
        if (!cleanVideos.some((v) => v.url === vTrim)) {
          cleanVideos.unshift({
            id: `vid_yt_${Date.now()}`,
            titre: 'Vidéo principale',
            url: vTrim
          });
        }
      }

      // Audio : Ne persiste sous `audioUrl` que s'il s'agit d'un enregistrement autonome / personnalisé
      // (si l'audio provient du preset lié, on ne le duplique pas en base)
      const isPresetAudio =
        selectedPreset?.audioUrl && customAudioUrl === selectedPreset.audioUrl;
      const audioToPersist = isPresetAudio
        ? null
        : (customAudioUrl ? customAudioUrl.trim() : null);

      // Payload strictement épuré : POINTEURS VIVANTS uniquement, tout vide converti en null
      const pieceData = {
        groupId: groupId,
        titre: titre.trim(),
        statutSaison: statutSaison || 'saison',
        etatValidation: etatValidation || 'pret',
        notes: (notes || '').trim() || '',
        videos: cleanVideos,
        signalIds: cleanSignalIds,
        sinaisDoMestre: Array.isArray(sinaisDoMestre) ? cleanFirestorePayload(sinaisDoMestre) : [],
        sequenceurId: matchedSeqId || null,
        sequenceurType: matchedSeqType || null,
        sequenceurFileUrl: matchedSeqUrl || null,
        audioUrl: audioToPersist || null,
        videoUrl: (videoUrl || '').trim() || null,
        contexteHistorique: (histoire || '').trim() || null,
        histoire: (histoire || '').trim() || null,
        dancadorChoreoId: selectedChoreoId || null,
        toadaDocId: selectedToadaId || null,
        cultureDocId: selectedCultureId || null,
        updatedAt: new Date().toISOString()
      };

      const sanitizedData = cleanFirestorePayload(pieceData);

      if (pieceToEdit?.id) {
        const pieceRef = doc(db, 'associations', groupId, 'repertoire', pieceToEdit.id);
        await updateDoc(pieceRef, sanitizedData);
        if (onSaveSuccess) onSaveSuccess({ id: pieceToEdit.id, ...sanitizedData });
      } else {
        sanitizedData.createdAt = new Date().toISOString();
        const colRef = collection(db, 'associations', groupId, 'repertoire');
        const docRef = await addDoc(colRef, sanitizedData);
        if (onSaveSuccess) onSaveSuccess({ id: docRef.id, ...sanitizedData });
      }

      onClose();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du morceau :", err);
      setErrorMsg("Erreur lors de l'enregistrement dans le répertoire.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrage des collections du Séquenceur
  const sequencerRhythms = (catalogRhythms || []).filter(
    (r) => !r.isAudio || r.isJson || r._collection === 'presets' || r._collection === 'sections'
  );
  const presetsList = sequencerRhythms.filter((r) => r._collection === 'presets');
  const sectionsList = sequencerRhythms.filter((r) => r._collection === 'sections');
  const patternsList = sequencerRhythms.filter(
    (r) => r._collection !== 'presets' && r._collection !== 'sections'
  );

  // Masters audio pour sélection optionnelle
  const audioMastersList = (catalogRhythms || []).filter(
    (r) =>
      r.isAudio ||
      r._collection === 'audio_masters' ||
      Boolean(r.audioUrl) ||
      /\.(mp3|wav|ogg|m4a|aac)$/i.test(r.fileName || r.id || r.titre)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <CordelCard className="w-full max-w-2xl p-6 flex flex-col gap-4 animate-scale-in bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] overflow-y-auto">
        {/* En-tête de la modale */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>📜</span>
            <span>{pieceToEdit ? "Modifier le morceau" : "Ajouter un morceau au répertoire"}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-lg p-1 cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-xs font-bold rounded">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Titre du morceau */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
                Titre du morceau / Rythme <span className="text-red-600">*</span>
              </label>
              {selectedSong && selectedSong.titre && titre.trim() !== selectedSong.titre && (
                <button
                  type="button"
                  onClick={() => setTitre(selectedSong.titre)}
                  className="text-[9.5px] font-extrabold text-amber-800 hover:text-amber-950 underline cursor-pointer flex items-center gap-1"
                  title="Injecter le titre de la toada sélectionnée"
                >
                  <span>💡 Suggérer « {selectedSong.titre} »</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Baque de Luanda, Fatras, Virada Samambaia..."
              value={titre}
              onChange={handleTitreChange}
              disabled={submitting}
              className="theme-input text-xs font-bold p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />

            {/* Encart de suggestions rapides en 1 clic */}
            {detectedSuggestions?.hasAny && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 animate-fade-in">
                <span className="text-[8.5px] uppercase font-bold text-amber-900">
                  Correspondances détectées :
                </span>
                {detectedSuggestions.seqMatch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeqUrl(detectedSuggestions.seqMatch.jsonUrl || detectedSuggestions.seqMatch.id);
                      setSelectedSeqType(detectedSuggestions.seqMatch._collection || null);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded cursor-pointer transition-colors shadow-2xs"
                    title="Lier au Preset Séquenceur détecté"
                  >
                    <span>🥁 Lier au Preset « {detectedSuggestions.seqMatch.titre || detectedSuggestions.seqMatch.name} »</span>
                  </button>
                )}
                {detectedSuggestions.toadaMatch && (
                  <button
                    type="button"
                    onClick={() => setSelectedToadaId(detectedSuggestions.toadaMatch.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded cursor-pointer transition-colors shadow-2xs"
                    title="Lier à la Toada détectée"
                  >
                    <span>🗣️ Lier à la Toada « {detectedSuggestions.toadaMatch.titre} »</span>
                  </button>
                )}
                {detectedSuggestions.choreoMatch && (
                  <button
                    type="button"
                    onClick={() => setSelectedChoreoId(detectedSuggestions.choreoMatch.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 rounded cursor-pointer transition-colors shadow-2xs"
                    title="Lier à la chorégraphie Dançad'Or détectée"
                  >
                    <span>💃 Lier à la Danse « {detectedSuggestions.choreoMatch.nom} »</span>
                  </button>
                )}
                {detectedSuggestions.cultureMatch && (
                  <button
                    type="button"
                    onClick={() => setSelectedCultureId(detectedSuggestions.cultureMatch.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold bg-blue-100 hover:bg-blue-200 text-blue-950 border border-blue-300 rounded cursor-pointer transition-colors shadow-2xs"
                    title="Lier à la fiche Varal Culture détectée"
                  >
                    <span>📖 Lier à la Culture « {detectedSuggestions.cultureMatch.titre || detectedSuggestions.cultureMatch.name} »</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Statut de saison & État de validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Statut de saison */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
                Statut de la saison
              </label>
              <div className="flex flex-col gap-1.5 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="saison"
                    checked={statutSaison === 'saison'}
                    onChange={() => setStatutSaison('saison')}
                    className="accent-green-700 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟢</span>
                    <span>Au programme cette année</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="chantier"
                    checked={statutSaison === 'chantier'}
                    onChange={() => setStatutSaison('chantier')}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟡</span>
                    <span>En préparation / Chantier</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="archive"
                    checked={statutSaison === 'archive'}
                    onChange={() => setStatutSaison('archive')}
                    className="accent-stone-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>⚪</span>
                    <span>Au frigo / Archives</span>
                  </span>
                </label>
              </div>
            </div>

            {/* État de validation artistique */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
                Maturité artistique
              </label>
              <p className="text-[9.5px] text-encre-noire/60 leading-tight mb-1">
                La validation est libre : un morceau peut être prêt même sans ressource externe attachée.
              </p>
              <div className="flex flex-col gap-1.5 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="etatValidation"
                    value="pret"
                    checked={etatValidation === 'pret'}
                    onChange={() => setEtatValidation('pret')}
                    className="accent-green-700 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟢</span>
                    <span>Validé / Prêt pour la scène</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="etatValidation"
                    value="a_faire"
                    checked={etatValidation === 'a_faire'}
                    onChange={() => setEtatValidation('a_faire')}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟡</span>
                    <span>À affiner / En répétition</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section Liaisons transversales réactives */}
          <div className="p-3.5 rounded bg-white border border-encre-noire/15 shadow-xs flex flex-col gap-3">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Liaisons transversales vivantes (Varal, Séquenceur, Danse)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {/* 1. Toada (Chant) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>🗣️</span>
                  <span>Chant / Toada associée</span>
                </label>
                <select
                  value={selectedToadaId}
                  onChange={handleToadaChange}
                  disabled={submitting || loadingDocs}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucun chant associé --</option>
                  {toadasList.map((song) => (
                    <option key={song.id} value={song.id}>
                      🗣️ {song.titre} {song.nacao ? `(${song.nacao})` : ''}
                    </option>
                  ))}
                </select>

                {selectedSong && selectedSong.titre && titre.trim() !== selectedSong.titre && (
                  <button
                    type="button"
                    onClick={() => setTitre(selectedSong.titre)}
                    className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded shadow-xs cursor-pointer transition-all text-left"
                    title="Cliquer pour utiliser le nom de cette toada comme titre du morceau"
                  >
                    <span>💡</span>
                    <span>Définir comme titre : <u>« {selectedSong.titre} »</u></span>
                  </button>
                )}
              </div>

              {/* 2. Séquence / Préréglage Séquenceur */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🥁</span>
                    <span>Séquence / Preset Séquenceur</span>
                  </span>
                  {selectedSeqUrl && (
                    <span className="text-[8.5px] text-amber-700 font-bold lowercase">
                      {selectedSeqType === 'presets' ? '✓ preset vivant' : selectedSeqType === 'sections' ? '✓ séquence' : '✓ rythme'}
                    </span>
                  )}
                </label>
                <select
                  value={selectedSeqUrl}
                  onChange={handleSequenceurChange}
                  disabled={submitting || loadingRhythms}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucun préréglage ou séquence liée --</option>
                  {presetsList.length > 0 && (
                    <optgroup label="⭐ 🎛️ Préréglages Complets (Presets - Audio & Tablature en direct)">
                      {presetsList.map((rhythm) => (
                        <option key={rhythm.id} value={rhythm.jsonUrl || rhythm.id}>
                          ⭐ {rhythm.displayTitle || rhythm.titre}
                          {rhythm.audioUrl ? ' 🔊' : ''}
                          {rhythm.parsedData ? ' 📄' : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {sectionsList.length > 0 && (
                    <optgroup label="📑 Séquences & Arrangements (Sections)">
                      {sectionsList.map((rhythm) => (
                        <option key={rhythm.id} value={rhythm.jsonUrl || rhythm.id}>
                          📑 {rhythm.displayTitle || rhythm.titre}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {patternsList.length > 0 && (
                    <optgroup label="🥁 Motifs individuels & Fichiers JSON">
                      {patternsList.map((rhythm) => (
                        <option key={rhythm.id} value={rhythm.jsonUrl || rhythm.id}>
                          🥁 {rhythm.displayTitle || rhythm.titre}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <span className="text-[8.5px] opacity-65 italic">
                  Liaison vivante : audio, BPM, signes et tablature seront lus en direct depuis ce preset.
                </span>
              </div>

              {/* 3. Audio de référence / personnalisé */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded bg-white/40 dark:bg-black/10 border border-dashed border-encre-noire/15">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                    <span>🎵</span>
                    <span>Audio de référence</span>
                  </label>
                  {effectiveAudioUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomAudioUrl('')}
                      className="text-[9px] text-cordel-wood hover:underline font-bold cursor-pointer"
                      title="Dissocier cet enregistrement audio personnalisé"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                <select
                  value={customAudioUrl}
                  onChange={(e) => setCustomAudioUrl(e.target.value)}
                  disabled={submitting || uploadingAudio}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">
                    {selectedPreset?.audioUrl ? `✓ Audio direct du preset Séquenceur (recommandé)` : `-- Aucun audio personnalisé --`}
                  </option>
                  {audioMastersList.length > 0 && (
                    <optgroup label="🎧 Masters Audio & Enregistrements du Séquenceur">
                      {audioMastersList.map((a) => (
                        <option key={a.id || a.audioUrl} value={a.audioUrl || a.jsonUrl}>
                          🎧 {a.titre || a.displayTitle}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {customAudioUrl &&
                    !audioMastersList.some((a) => (a.audioUrl || a.jsonUrl) === customAudioUrl) && (
                      <optgroup label="🔗 Audio personnalisé">
                        <option value={customAudioUrl}>
                          🎵 Fichier lié ({customAudioUrl.split('/').pop()?.split('?')[0] || 'Lien externe'})
                        </option>
                      </optgroup>
                    )}
                </select>

                {/* Actions d'ajout : Fichier local ou URL */}
                <div className="flex items-center gap-2 pt-0.5">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-black uppercase text-encre-noire bg-cordel-bg-light hover:bg-stone-200 border border-encre-noire/30 rounded shadow-xs cursor-pointer select-none">
                    <span>{uploadingAudio ? '⏳ Téléversement...' : '📁 Téléverser un MP3 / WAV'}</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a"
                      disabled={submitting || uploadingAudio}
                      className="hidden"
                      onChange={handleAudioFileUpload}
                    />
                  </label>

                  <span className="text-[9px] opacity-50">ou</span>

                  <button
                    type="button"
                    onClick={() => {
                      const custom = window.prompt("Entrez l'URL directe du fichier audio (MP3, WAV, etc.) :", customAudioUrl || '');
                      if (custom !== null) {
                        setCustomAudioUrl(custom.trim());
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-black uppercase text-encre-noire bg-cordel-bg-light hover:bg-stone-200 border border-encre-noire/30 rounded shadow-xs cursor-pointer"
                  >
                    <span>🔗 Coller une URL</span>
                  </button>
                </div>

                {/* Pré-écoute de l'audio effectif */}
                {effectiveAudioUrl && (
                  <div className="mt-1 p-2 rounded bg-cordel-bg/80 border border-encre-noire/15 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-cordel-wood">
                      ▶ Pré-écoute de l'audio :
                    </span>
                    <audio controls src={effectiveAudioUrl} className="w-full h-7 rounded" preload="metadata" />
                  </div>
                )}
              </div>

              {/* 4. Chorégraphie Dançad'Or */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>💃</span>
                  <span>Chorégraphie Dançad'Or associée</span>
                </label>
                <select
                  value={selectedChoreoId}
                  onChange={(e) => setSelectedChoreoId(e.target.value)}
                  disabled={submitting || loadingChoreos}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucune chorégraphie liée --</option>
                  {choreographies.map((choreo) => (
                    <option key={choreo.id} value={choreo.id}>
                      💃 {choreo.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Fiche Culturelle */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>📖</span>
                  <span>Fiche Culturelle associée</span>
                </label>
                <select
                  value={selectedCultureId}
                  onChange={(e) => setSelectedCultureId(e.target.value)}
                  disabled={submitting || loadingDocs}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucune fiche culturelle liée --</option>
                  {cultureDocsList.map((docItem) => (
                    <option key={docItem.id} value={docItem.id}>
                      📖 {docItem.titre || docItem.name || 'Fiche Culturelle'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Aperçu paresseux de la tablature (calculée à la volée sans snapshot en base) */}
          {(selectedPreset?.parsedData || pieceToEdit?.tablature) && (
            <div className="p-3.5 rounded bg-white border border-encre-noire/15 shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowTabPreview(!showTabPreview)}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-cordel-master-dark hover:text-cordel-wood cursor-pointer select-none transition-colors"
                >
                  <span>📄</span>
                  <span>Tablature résolue du Séquenceur</span>
                  <span className="text-[11px] font-bold text-cordel-wood underline ml-1">
                    {showTabPreview ? '▲ Replier' : '▼ Déplier l\'aperçu (calcul à la volée)'}
                  </span>
                </button>
              </div>

              {showTabPreview && previewTablature && (
                <div className="w-full overflow-x-auto p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded max-h-56 overflow-y-auto">
                  <pre className="text-[10px] md:text-[11px] font-mono leading-relaxed text-encre-noire whitespace-pre min-w-max select-text">
                    {previewTablature}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Vidéo YouTube de référence & Histoire du morceau */}
          <div className="p-3.5 rounded bg-white border border-encre-noire/15 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1">
              <h4 className="text-[10px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1.5">
                <span>🎬</span>
                <span>Vidéo de référence &amp; Histoire culturelle</span>
              </h4>
              {!selectedCultureId && (
                <button
                  type="button"
                  onClick={() => setIsCultureModalOpen(true)}
                  className="text-[9.5px] font-extrabold text-amber-900 hover:text-amber-950 underline cursor-pointer flex items-center gap-1"
                  title="Créer une fiche sur le Varal Culture pré-remplie avec ces informations"
                >
                  <span>📜</span>
                  <span>Créer la fiche Varal Culture</span>
                </button>
              )}
            </div>

            {/* URL de la vidéo YouTube */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>🎬</span>
                  <span>Lien vidéo YouTube propre au morceau</span>
                </label>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="text-[8.5px] text-cordel-wood hover:underline font-bold cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={submitting}
                placeholder="https://www.youtube.com/watch?v=..."
                className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded"
              />
              {videoUrl && parseYouTubeMedia(videoUrl)?.isValid && (
                <span className="text-[8.5px] text-green-800 font-bold flex items-center gap-1">
                  <span>✓</span>
                  <span>Vidéo YouTube reconnue (ID : {parseYouTubeMedia(videoUrl).videoId})</span>
                </span>
              )}
            </div>

            {/* Contexte historique propre au répertoire */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>📜</span>
                  <span>Notes d'histoire &amp; contexte artistique</span>
                </label>
                {histoire && (
                  <button
                    type="button"
                    onClick={() => setHistoire('')}
                    className="text-[8.5px] text-cordel-wood hover:underline font-bold cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={histoire}
                onChange={(e) => setHistoire(e.target.value)}
                disabled={submitting}
                placeholder="Renseignez l'histoire spécifique, la nation d'origine ou l'inspiration du morceau..."
                className="theme-input text-xs font-medium p-2 bg-cordel-bg-light border border-encre-noire/30 rounded leading-relaxed font-serif"
              />
            </div>
          </div>

          {/* Vidéos personnalisables du morceau */}
          <RepertoireVideosPicker
            videos={videos}
            onChange={setVideos}
          />

          {/* Signes gestuels du Mestre associés (vignettes de la bibliothèque de signes) */}
          <RepertoireSignalsPicker
            selectedSignalIds={signalIds}
            onChange={setSignalIds}
            groupId={groupId}
          />

          {/* Signes & Conventions chronologiques par mesure (Séquenceur & Mestria) */}
          <RepertoireSinaisDoMestreEditor
            sinais={sinaisDoMestre}
            onChange={setSinaisDoMestre}
            disabled={submitting}
          />

          {/* Notes du Mestre & Consignes artistiques */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              Notes du Mestre &amp; Consignes artistiques
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Tempo cible 128 BPM, break avec virada en 2 temps, entrée soliste au repique..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              className="theme-input text-xs font-medium p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={submitting || !titre.trim()}
              className="px-6 py-2 text-xs font-black uppercase tracking-wider"
            >
              {submitting ? "Enregistrement..." : (pieceToEdit ? "💾 Enregistrer les modifications" : "➕ Ajouter au répertoire")}
            </CordelButton>
          </div>
        </form>
      </CordelCard>

      {/* Modale passerelle vers le Varal Culture */}
      <CreateCultureFicheModal
        isOpen={isCultureModalOpen}
        onClose={() => setIsCultureModalOpen(false)}
        groupId={groupId}
        piece={{
          id: pieceToEdit?.id,
          titre: titre || '',
          videoUrl: videoUrl || '',
          histoire: histoire || '',
          contexteHistorique: histoire || ''
        }}
        onSuccess={(newCultureId, _newCultureDoc) => {
          setSelectedCultureId(newCultureId);
          setIsCultureModalOpen(false);
        }}
      />
    </div>
  );
}
