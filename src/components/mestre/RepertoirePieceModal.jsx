import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import RepertoireVideosPicker from './RepertoireVideosPicker';
import RepertoireSignalsPicker from './RepertoireSignalsPicker';

/**
 * Modale de création et d'édition d'un morceau du répertoire musical.
 * Gère les métadonnées de saison, l'état de validation artistique,
 * les vidéos libres personnalisables, les signes du Mestre associés
 * et les liaisons optionnelles transversales (Toada, Séquenceur, Dançador, Culture).
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
  // Champs du formulaire
  const [titre, setTitre] = useState('');
  const [statutSaison, setStatutSaison] = useState('saison'); // 'saison' | 'chantier' | 'archive'
  const [etatValidation, setEtatValidation] = useState('pret'); // 'pret' | 'a_faire'
  const [notes, setNotes] = useState('');

  // Vidéos libres & Signes du Mestre
  const [videos, setVideos] = useState([]);
  const [signalIds, setSignalIds] = useState([]);

  // Liaisons optionnelles
  const [selectedToadaId, setSelectedToadaId] = useState('');
  const [selectedSeqUrl, setSelectedSeqUrl] = useState('');
  const [selectedSeqType, setSelectedSeqType] = useState(null); // 'presets' | 'sections' | 'patterns' | 'storage'
  const [selectedAudioUrl, setSelectedAudioUrl] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [selectedChoreoId, setSelectedChoreoId] = useState('');
  const [selectedCultureId, setSelectedCultureId] = useState('');

  // Données pour les listes déroulantes
  const [toadasList, setToadasList] = useState([]);
  const [cultureDocsList, setCultureDocsList] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Hooks externes pour le Séquenceur et Dançador
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { choreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);

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
      setSelectedToadaId(pieceToEdit.toadaDocId || '');

      // Détecter si l'ancienne valeur était un audio ou un rythme séquenceur
      const rawSeq = pieceToEdit.sequenceurFileUrl || pieceToEdit.sequenceurId || '';
      const isSeqAudio = /\.(mp3|wav|ogg|m4a|aac)$/i.test(rawSeq) || (pieceToEdit.sequenceurId && String(pieceToEdit.sequenceurId).startsWith('am_'));

      if (pieceToEdit.audioUrl) {
        setSelectedAudioUrl(pieceToEdit.audioUrl);
        setSelectedSeqUrl(isSeqAudio ? '' : rawSeq);
      } else if (isSeqAudio) {
        // Migration automatique : si l'ancien champ contenait un audio, l'attribuer à audioUrl
        setSelectedAudioUrl(pieceToEdit.sequenceurFileUrl || '');
        setSelectedSeqUrl('');
      } else {
        setSelectedAudioUrl('');
        setSelectedSeqUrl(rawSeq);
      }
      setSelectedSeqType(pieceToEdit.sequenceurType || null);

      setSelectedChoreoId(pieceToEdit.dancadorChoreoId || '');
      setSelectedCultureId(pieceToEdit.cultureDocId || '');
    } else {
      // Valeurs par défaut pour un nouveau morceau
      setTitre('');
      setStatutSaison('saison');
      setEtatValidation('pret');
      setNotes('');
      setVideos([]);
      setSignalIds([]);
      setSelectedToadaId('');
      setSelectedSeqUrl('');
      setSelectedSeqType(null);
      setSelectedAudioUrl('');
      setSelectedChoreoId('');
      setSelectedCultureId('');
    }
    setErrorMsg(null);
  }, [isOpen, pieceToEdit]);

  // Récupération des Toadas et fiches culturelles depuis la collection documents
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
        const snap = await getDocs(qDocs);
        const fetchedSongs = [];
        const fetchedCulture = [];

        snap.forEach((d) => {
          const data = d.data();
          if (data.type === 'song') {
            fetchedSongs.push({ id: d.id, ...data });
          } else if (data.type === 'culture_fiche' || data.type === 'fiche_pedagogique') {
            fetchedCulture.push({ id: d.id, ...data });
          }
        });

        // Tri alphabétique
        fetchedSongs.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        fetchedCulture.sort((a, b) => (a.titre || a.name || '').localeCompare(b.titre || b.name || ''));

        setToadasList(fetchedSongs);
        setCultureDocsList(fetchedCulture);
      } catch (err) {
        console.error("Erreur lors de la récupération des documents du Varal :", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  // Enregistrement sécurisé (anti-undefined Firestore)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) {
      setErrorMsg("Veuillez renseigner le titre du morceau.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Trouver l'identifiant, l'URL et le type du rythme séquenceur
      let matchedSeqId = null;
      let matchedSeqUrl = null;
      let matchedSeqType = selectedSeqType || null;

      if (selectedSeqUrl && catalogRhythms.length > 0) {
        const found = catalogRhythms.find((r) => r.jsonUrl === selectedSeqUrl || r.id === selectedSeqUrl);
        if (found) {
          matchedSeqId = found.id || null;
          matchedSeqType = found._collection || null;
          matchedSeqUrl = (found.jsonUrl && (found.jsonUrl.startsWith('http://') || found.jsonUrl.startsWith('https://')))
            ? found.jsonUrl
            : (selectedSeqUrl.startsWith('http://') || selectedSeqUrl.startsWith('https://') ? selectedSeqUrl : null);
        } else {
          if (selectedSeqUrl.startsWith('http://') || selectedSeqUrl.startsWith('https://')) {
            matchedSeqUrl = selectedSeqUrl;
          } else {
            matchedSeqId = selectedSeqUrl;
          }
        }
      }

      // Nettoyage strict des vidéos et signaux
      const cleanVideos = (videos || [])
        .filter((v) => v && typeof v.url === 'string' && v.url.trim() !== '')
        .map((v) => ({
          id: v.id || `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          titre: (v.titre || '').trim(),
          url: v.url.trim()
        }));

      const cleanSignalIds = (signalIds || []).filter(Boolean);

      // Construction de l'objet strictement assaini (aucun undefined envoyé à Firestore)
      const pieceData = {
        groupId: groupId,
        titre: titre.trim(),
        statutSaison: statutSaison || 'saison',
        etatValidation: etatValidation || 'pret',
        notes: (notes || '').trim(),
        videos: cleanVideos,
        signalIds: cleanSignalIds,
        sequenceurId: matchedSeqId || null,
        sequenceurType: matchedSeqType || null,
        sequenceurFileUrl: matchedSeqUrl || null,
        audioUrl: (selectedAudioUrl || '').trim() || null,
        dancadorChoreoId: selectedChoreoId || null,
        toadaDocId: selectedToadaId || null,
        cultureDocId: selectedCultureId || null,
        updatedAt: new Date().toISOString()
      };

      if (pieceToEdit?.id) {
        // Mise à jour d'un morceau existant
        const pieceRef = doc(db, 'associations', groupId, 'repertoire', pieceToEdit.id);
        await updateDoc(pieceRef, pieceData);
        if (onSaveSuccess) onSaveSuccess({ id: pieceToEdit.id, ...pieceData });
      } else {
        // Création d'un nouveau morceau
        pieceData.createdAt = new Date().toISOString();
        const colRef = collection(db, 'associations', groupId, 'repertoire');
        const docRef = await addDoc(colRef, pieceData);
        if (onSaveSuccess) onSaveSuccess({ id: docRef.id, ...pieceData });
      }

      onClose();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du morceau :", err);
      setErrorMsg("Erreur lors de l'enregistrement dans le répertoire.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSong = toadasList.find((s) => s.id === selectedToadaId);

  // Gestion de la sélection d'une toada avec injection automatique du titre si vide
  const handleToadaChange = (e) => {
    const newToadaId = e.target.value;
    setSelectedToadaId(newToadaId);

    if (newToadaId) {
      const chosenSong = toadasList.find((s) => s.id === newToadaId);
      if (chosenSong && chosenSong.titre && !titre.trim()) {
        setTitre(chosenSong.titre);
      }
    }
  };

  // Gestion de la sélection d'un rythme séquenceur avec injection du titre si vide
  const handleSequenceurChange = (e) => {
    const newSeqUrl = e.target.value;
    setSelectedSeqUrl(newSeqUrl);

    if (newSeqUrl) {
      const found = catalogRhythms.find((r) => r.jsonUrl === newSeqUrl || r.id === newSeqUrl);
      if (found) {
        setSelectedSeqType(found._collection || null);
        if (!titre.trim() && (found.titre || found.name)) {
          setTitre(found.titre || found.name);
        }
      }
    } else {
      setSelectedSeqType(null);
    }
  };

  // Téléversement d'un fichier audio vers Firebase Storage
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
      setSelectedAudioUrl(downloadUrl);
    } catch (err) {
      console.error("Erreur lors du téléversement audio :", err);
      alert("Erreur lors de l'envoi du fichier audio.");
    } finally {
      setUploadingAudio(false);
      e.target.value = '';
    }
  };

  // Rythmes et séquences pour le Séquenceur (exclusion des purs fichiers audio)
  const sequencerRhythms = (catalogRhythms || []).filter(
    (r) => !r.isAudio || r.isJson || r._collection === 'presets' || r._collection === 'sections'
  );
  const presetsList = sequencerRhythms.filter((r) => r._collection === 'presets');
  const sectionsList = sequencerRhythms.filter((r) => r._collection === 'sections');
  const patternsList = sequencerRhythms.filter((r) => r._collection !== 'presets' && r._collection !== 'sections');

  // Enregistrements et pistes pour l'Audio de référence
  const audioMastersList = (catalogRhythms || []).filter(
    (r) => r.isAudio || r._collection === 'audio_masters' || Boolean(r.audioUrl) || /\.(mp3|wav|ogg|m4a|aac)$/i.test(r.fileName || r.id || r.titre)
  );
  const toadaAudiosList = (toadasList || []).filter((t) => Boolean(t.audioUrl));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <CordelCard className="w-full max-w-2xl p-6 flex flex-col gap-4 animate-scale-in bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
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
              onChange={(e) => setTitre(e.target.value)}
              disabled={submitting}
              className="theme-input text-xs font-bold p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />
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

          {/* Section Liaisons transversales optionnelles */}
          <div className="p-3.5 rounded bg-white border border-encre-noire/15 shadow-xs flex flex-col gap-3">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Liaisons transversales optionnelles (Varal, Séquenceur, Danse)</span>
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

                {/* Suggestion en 1 clic si le titre actuel est différent de la toada choisie */}
                {selectedSong && selectedSong.titre && titre.trim() !== selectedSong.titre && (
                  <button
                    type="button"
                    onClick={() => setTitre(selectedSong.titre)}
                    className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-[4px_6px_3px_5px] shadow-xs cursor-pointer transition-all text-left animate-fade-in"
                    title="Cliquer pour utiliser le nom de cette toada comme titre du morceau"
                  >
                    <span>💡</span>
                    <span>
                      Définir comme titre : <u>« {selectedSong.titre} »</u>
                    </span>
                  </button>
                )}
              </div>

              {/* 2. Séquence / Préréglage Séquenceur (Renvoi vers le Séquenceur) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🥁</span>
                    <span>Séquence / Preset Séquenceur</span>
                  </span>
                  {selectedSeqUrl && (
                    <span className="text-[8.5px] text-amber-700 font-bold lowercase">
                      {selectedSeqType === 'presets' ? '✓ preset' : selectedSeqType === 'sections' ? '✓ séquence' : '✓ rythme'}
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
                    <optgroup label="🎛️ Préréglages Séquenceur (Presets complets)">
                      {presetsList.map((rhythm) => (
                        <option key={rhythm.id} value={rhythm.jsonUrl || rhythm.id}>
                          🎛️ {rhythm.displayTitle || rhythm.titre}
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
                  Permet d'ouvrir et travailler le morceau directement dans le Séquenceur multi-pistes.
                </span>
              </div>

              {/* 3. Audio de référence (Écoute directe dans Organizador) */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded bg-white/40 dark:bg-black/10 border border-dashed border-encre-noire/15">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                    <span>🎵</span>
                    <span>Audio de référence (écoute dans Organizador)</span>
                  </label>
                  {selectedAudioUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedAudioUrl('')}
                      className="text-[9px] text-cordel-wood hover:underline font-bold cursor-pointer"
                      title="Dissocier cet enregistrement audio"
                    >
                      Retirer l'audio
                    </button>
                  )}
                </div>

                <select
                  value={selectedAudioUrl}
                  onChange={(e) => setSelectedAudioUrl(e.target.value)}
                  disabled={submitting || uploadingAudio}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucun audio de référence --</option>
                  {audioMastersList.length > 0 && (
                    <optgroup label="🎧 Masters Audio & Enregistrements du Séquenceur">
                      {audioMastersList.map((a) => (
                        <option key={a.id || a.audioUrl} value={a.audioUrl || a.jsonUrl}>
                          🎧 {a.titre || a.displayTitle}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {toadaAudiosList.length > 0 && (
                    <optgroup label="🗣️ Audios des Toadas (Chants)">
                      {toadaAudiosList.map((t) => (
                        <option key={t.id} value={t.audioUrl}>
                          🗣️ {t.titre} {t.nacao ? `(${t.nacao})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {selectedAudioUrl &&
                    !audioMastersList.some((a) => (a.audioUrl || a.jsonUrl) === selectedAudioUrl) &&
                    !toadaAudiosList.some((t) => t.audioUrl === selectedAudioUrl) && (
                      <optgroup label="🔗 Audio personnalisé">
                        <option value={selectedAudioUrl}>
                          🎵 Fichier lié ({selectedAudioUrl.split('/').pop()?.split('?')[0] || 'Lien externe'})
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
                      const custom = window.prompt("Entrez l'URL directe du fichier audio (MP3, WAV, etc.) :", selectedAudioUrl || '');
                      if (custom !== null) {
                        setSelectedAudioUrl(custom.trim());
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[9.5px] font-black uppercase text-encre-noire bg-cordel-bg-light hover:bg-stone-200 border border-encre-noire/30 rounded shadow-xs cursor-pointer"
                  >
                    <span>🔗 Coller une URL</span>
                  </button>
                </div>

                {/* Pré-écoute immédiate du fichier sélectionné */}
                {selectedAudioUrl && (
                  <div className="mt-1 p-2 rounded bg-cordel-bg/80 border border-encre-noire/15 flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-wider text-cordel-wood">
                      ▶ Pré-écoute de l'audio :
                    </span>
                    <audio controls src={selectedAudioUrl} className="w-full h-7 rounded" preload="metadata" />
                  </div>
                )}
              </div>

              {/* 3. Chorégraphie Dançador */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>💃</span>
                  <span>Chorégraphie Dançador associée</span>
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

              {/* 4. Fiche Culturelle */}
              <div className="flex flex-col gap-1">
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

          {/* Vidéos personnalisables du morceau */}
          <RepertoireVideosPicker
            videos={videos}
            onChange={setVideos}
          />

          {/* Signes du Mestre associés */}
          <RepertoireSignalsPicker
            selectedSignalIds={signalIds}
            onChange={setSignalIds}
            groupId={groupId}
          />

          {/* Notes d'intention / mémo du Mestre */}
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
    </div>
  );
}
