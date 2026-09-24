import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import RepertoirePieceModal from './RepertoirePieceModal';
import ProgramPieceModal from './ProgramPieceModal';
import RepertoireVideoModal from './RepertoireVideoModal';
import SignalZoomModal from './SignalZoomModal';
import TablatureModal from './TablatureModal';
import CreateCultureFicheModal from './CreateCultureFicheModal';
import PieceReflexConfigModal from './PieceReflexConfigModal';
import ConductorGameModal from '../pedagogy/ConductorGameModal';
import CultureCard from '../CultureCard';
import SongCard from '../SongCard';
import RepertoireUnlinkedPresetsBanner from './RepertoireUnlinkedPresetsBanner';
import useConfirm from '../../hooks/useConfirm';
import useMestreSignals from '../../hooks/useMestreSignals';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { openSequencerWithCrossApp } from '../../utils/sequencerUrlUtils';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';
import { cleanFirestorePayload } from '../../utils/firestoreUtils';
import {
  buildResolutionDictionaries,
  resolvePieceLiveTechnicalData,
  getPieceTablature,
  findMatchingPreset,
  resolvePieceTrainings
} from '../../utils/repertoireMatcher';
import { subscribeGroupTrainings, computeTrainingStages } from '../../services/aisanceService';
import { launchTrainingStage } from '../../utils/trainingLauncher';
import TrainingCompactCard from '../pedagogy/TrainingCompactCard';

/**
 * Vue principale du Répertoire de la troupe (Direction Artistique & Mestria).
 * Architecture 100 % réactive : les données techniques (audio, tablature, signes,
 * toadas, danse et culture) sont résolues en direct depuis les hooks en mémoire vive.
 *
 * @param {string} groupId - Identifiant du groupe/association
 * @param {Object} user - Données utilisateur de session
 * @param {Object} profileData - Profil adhérent
 * @param {string} sequenceurUrl - URL de base du Séquenceur
 * @param {Object} [features] - Fonctionnalités et options activées pour le groupe
 */
export default function MestreRepertoireView({ groupId, user: _user, profileData: _profileData, sequenceurUrl, features }) {
  const { confirm } = useConfirm();
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Bibliothèque des Signes du Mestre
  const { signals } = useMestreSignals(groupId);
  const signalsMap = useMemo(() => new Map((signals || []).map((s) => [s.id, s])), [signals]);

  // Catalogues vivants des modules transversaux (Séquenceur, Dançad'Or, Varal)
  const { catalogRhythms } = useSequencerRhythms(groupId);
  const { choreographies } = useDancadorChoreographies(groupId);
  const { toadasList, cultureDocsList } = useRepertoireVaralDocs(groupId);

  // Filtres
  const [seasonFilter, setSeasonFilter] = useState('saison'); // 'saison' | 'chantier' | 'archive' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Gestion des modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pieceToEdit, setPieceToEdit] = useState(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [pieceToProgram, setPieceToProgram] = useState(null);
  const [activeVideoToWatch, setActiveVideoToWatch] = useState(null);
  const [activeSignalToZoom, setActiveSignalToZoom] = useState(null);
  const [activeTablaturePiece, setActiveTablaturePiece] = useState(null);
  const [pieceForCultureCreation, setPieceForCultureCreation] = useState(null);
  const [activeCultureDocToView, setActiveCultureDocToView] = useState(null);
  const [culturePickerData, setCulturePickerData] = useState(null);
  const [activeToadaToView, setActiveToadaToView] = useState(null);
  const [reflexConfigPiece, setReflexConfigPiece] = useState(null);
  const [conductorGamePiece, setConductorGamePiece] = useState(null);

  // Synchronisation & Importation
  const [syncingPieceId, setSyncingPieceId] = useState(null);
  const [importingPresetId, setImportingPresetId] = useState(null);

  // Notification toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Commutateur interactif d'ouverture du répertoire aux adhérents
  const [togglingRepertoire, setTogglingRepertoire] = useState(false);
  const isRepertoireOpen = Boolean(features?.repertoireEleves);

  const handleToggleRepertoireEleves = async () => {
    if (!groupId) return;
    setTogglingRepertoire(true);
    try {
      const newValue = !isRepertoireOpen;
      await updateDoc(doc(db, 'associations', groupId), {
        'features.repertoireEleves': newValue
      });
      showToast(newValue ? '🟢 Répertoire ouvert aux adhérents !' : '🔒 Répertoire masqué aux adhérents.');
    } catch (err) {
      console.error('Erreur lors du basculement du statut du répertoire :', err);
      showToast('Erreur lors de la modification du statut du répertoire.');
    } finally {
      setTogglingRepertoire(false);
    }
  };

  // Entraînements Speed Trainer rattachés
  const [trainings, setTrainings] = useState([]);
  const [activeTrainingDetailsPieceId, setActiveTrainingDetailsPieceId] = useState(null);

  // Écoute en temps réel des entraînements Speed Trainer du groupe
  useEffect(() => {
    if (!groupId) return;
    const unsubTrainings = subscribeGroupTrainings(groupId, setTrainings);
    return () => unsubTrainings();
  }, [groupId]);

  // Écoute en temps réel de la collection repertoire
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setFetchError(null);

    const colRef = collection(db, 'associations', groupId, 'repertoire');
    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const fetched = [];
        snap.forEach((d) => {
          fetched.push({ id: d.id, ...d.data() });
        });
        // Tri alphabétique par titre
        fetched.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        setPieces(fetched);
        setLoading(false);
        setFetchError(null);
      },
      (err) => {
        console.error("Erreur lors de l'écoute du répertoire :", err);
        setFetchError("Impossible d'accéder au répertoire. Vérifiez vos autorisations d'accès.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Construction mémoïsée des dictionnaires de résolution pour un accès instantané O(1)
  const resolutionDicts = useMemo(() => {
    return buildResolutionDictionaries({
      catalogRhythms,
      toadasList,
      cultureDocsList,
      choreographies
    });
  }, [catalogRhythms, toadasList, cultureDocsList, choreographies]);

  // Résolution vivante mémoïsée de l'ensemble des morceaux du répertoire
  const resolvedPieces = useMemo(() => {
    return pieces.map((piece) => resolvePieceLiveTechnicalData(piece, resolutionDicts));
  }, [pieces, resolutionDicts]);

  // Compteurs par statut de saison
  const counts = useMemo(() => {
    let saison = 0;
    let chantier = 0;
    let archive = 0;

    resolvedPieces.forEach((p) => {
      if (p.statutSaison === 'saison') saison++;
      else if (p.statutSaison === 'chantier') chantier++;
      else if (p.statutSaison === 'archive') archive++;
    });

    return {
      saison,
      chantier,
      archive,
      all: resolvedPieces.length
    };
  }, [resolvedPieces]);

  // Morceaux filtrés par saison et recherche textuelle
  const filteredPieces = useMemo(() => {
    return resolvedPieces.filter((p) => {
      if (seasonFilter !== 'all' && p.statutSaison !== seasonFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitre = (p.titre || '').toLowerCase().includes(q);
        const inNotes = (p.notes || '').toLowerCase().includes(q);
        const inPreset = (p.preset?.titre || p.preset?.name || '').toLowerCase().includes(q);
        const inToada = (p.activeToada?.titre || '').toLowerCase().includes(q);
        return inTitre || inNotes || inPreset || inToada;
      }
      return true;
    });
  }, [resolvedPieces, seasonFilter, searchQuery]);

  // Détection des Presets complets du Séquenceur non encore répertoriés
  const unlinkedPresets = useMemo(() => {
    if (!Array.isArray(catalogRhythms) || catalogRhythms.length === 0) return [];

    const fullPresets = catalogRhythms.filter(
      (r) => r._collection === 'presets' || r.collection === 'presets'
    );

    const registeredIds = new Set(
      pieces.map((p) => p.sequenceurId || p.sequenceurFileUrl).filter(Boolean)
    );
    const registeredTitles = new Set(
      pieces.map((p) => (p.titre || '').trim().toLowerCase()).filter(Boolean)
    );

    return fullPresets.filter((preset) => {
      if (preset.id && registeredIds.has(preset.id)) return false;
      if (preset.jsonUrl && registeredIds.has(preset.jsonUrl)) return false;

      const pTitle = (preset.titre || preset.name || '').trim().toLowerCase();
      if (pTitle && registeredTitles.has(pTitle)) return false;

      return true;
    });
  }, [catalogRhythms, pieces]);

  // Suppression d'un morceau
  const handleDeletePiece = async (piece) => {
    const isOk = await confirm({
      title: "Supprimer du répertoire",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le morceau « ${piece.titre} » du classeur de répertoire ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });

    if (!isOk) return;

    try {
      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      await deleteDoc(pieceRef);
      showToast(`« ${piece.titre} » retiré du répertoire.`);
    } catch (e) {
      console.error("Erreur suppression morceau répertoire :", e);
      alert("Erreur lors de la suppression.");
    }
  };

  // Importation en 1 clic d'un Preset Séquenceur : POINTEURS purs, 0 copie de données dérivées
  const handleImportPreset = async (preset) => {
    if (!groupId || !preset) return;
    setImportingPresetId(preset.id);

    try {
      const presetVid = preset.videoUrl || preset.youtubeUrl || preset.parsedData?.metadata?.youtubeUrl || preset.parsedData?.metadata?.videoUrl || null;
      const presetDesc = preset.histoire || preset.parsedData?.metadata?.descriptionFr || preset.parsedData?.metadata?.description || preset.parsedData?.metadata?.descriptionPt || null;

      const newPieceData = {
        groupId,
        titre: (preset.titre || preset.name || 'Nouveau Morceau').trim(),
        statutSaison: 'chantier',
        etatValidation: 'a_faire',
        notes: '',
        videos: presetVid
          ? [{ id: `vid_${Date.now()}`, titre: 'Vidéo Séquenceur', url: presetVid.trim() }]
          : [],
        signalIds: [],
        sequenceurId: preset.id || null,
        sequenceurType: 'presets',
        sequenceurFileUrl:
          preset.jsonUrl &&
          (preset.jsonUrl.startsWith('http://') || preset.jsonUrl.startsWith('https://'))
            ? preset.jsonUrl
            : null,
        audioUrl: null,
        videoUrl: presetVid ? presetVid.trim() : null,
        contexteHistorique: presetDesc ? presetDesc.trim() : null,
        histoire: presetDesc ? presetDesc.trim() : null,
        dancadorChoreoId: null,
        toadaDocId: null,
        cultureDocId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const colRef = collection(db, 'associations', groupId, 'repertoire');
      await addDoc(colRef, cleanFirestorePayload(newPieceData));
      showToast(`« ${newPieceData.titre} » importé dans le Répertoire (liaison vivante) !`);
    } catch (err) {
      console.error("Erreur lors de l'importation du preset :", err);
      showToast("Erreur lors de l'importation du morceau dans le Répertoire.");
    } finally {
      setImportingPresetId(null);
    }
  };

  // Raccordement / Réactualisation vivante de la référence Séquenceur
  const handleSyncWithSequencer = async (piece) => {
    if (!piece || !groupId) return;
    setSyncingPieceId(piece.id);

    try {
      const match = piece.preset || findMatchingPreset(piece, catalogRhythms);
      if (!match) {
        showToast(`Rythme associé introuvable dans le Séquenceur pour « ${piece.titre} ».`);
        setSyncingPieceId(null);
        return;
      }

      // Mise à jour ciblée : pointeurs d'identification et vidéo/histoire si non renseignés localement
      const matchVid = match.videoUrl || match.youtubeUrl || match.parsedData?.metadata?.youtubeUrl || match.parsedData?.metadata?.videoUrl || null;
      const updateData = {
        sequenceurId: match.id || null,
        sequenceurType: match._collection || 'presets',
        sequenceurFileUrl:
          match.jsonUrl && (match.jsonUrl.startsWith('http://') || match.jsonUrl.startsWith('https://'))
            ? match.jsonUrl
            : null,
        updatedAt: new Date().toISOString()
      };

      if (matchVid && !piece.videoUrl) {
        updateData.videoUrl = matchVid.trim();
      }

      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      await updateDoc(pieceRef, cleanFirestorePayload(updateData));

      showToast(`« ${piece.titre} » synchronisé avec le Séquenceur !`);
    } catch (err) {
      console.error("Erreur lors de la synchronisation avec le Séquenceur :", err);
      showToast("Erreur lors de la synchronisation avec le Séquenceur.");
    } finally {
      setSyncingPieceId(null);
    }
  };

  // Ouverture paresseuse (lazy) de la tablature au clic
  const handleOpenTablatureModal = (piece) => {
    const lazyTab = getPieceTablature(piece);
    setActiveTablaturePiece({
      ...piece,
      tablature: lazyTab
    });
  };

  return (
    <div className="flex flex-col gap-5 text-left select-none w-full max-w-5xl mx-auto">
      {/* Toast de confirmation */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 p-3 bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded shadow-[2px_2px_0px_0px_#181716] border border-emerald-900 animate-bounce">
          ✓ {toastMsg}
        </div>
      )}

      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b-2 border-dashed border-cordel-master-dark/30">
        <div>
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>📜</span>
            <span>Direction Artistique — Répertoire de la Troupe</span>
          </h2>
          <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
            Architecture réactive vivante liée au Séquenceur, au Varal et à Dançad'Or
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bandeau d'état interactif : Répertoire adhérents */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px_6px_3px_5px] border-2 text-xs font-black shadow-[1.5px_1.5px_0px_0px_#181716] transition-all ${
            isRepertoireOpen
              ? 'bg-emerald-100 text-emerald-900 border-emerald-950'
              : 'bg-stone-100 text-stone-700 border-stone-800'
          }`}>
            {isRepertoireOpen ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="animate-pulse">🟢</span>
                  <span>Répertoire adhérents ouvert</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleRepertoireEleves}
                  disabled={togglingRepertoire}
                  className="ml-2 text-[10px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Masquer
                </button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-stone-600">
                  <span>🔒</span>
                  <span>Répertoire adhérents masqué</span>
                </span>
                <button
                  type="button"
                  onClick={handleToggleRepertoireEleves}
                  disabled={togglingRepertoire}
                  className="ml-2 text-[10px] font-black uppercase text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer disabled:opacity-50"
                >
                  Ouvrir au groupe
                </button>
              </>
            )}
          </div>

          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={() => {
              setPieceToEdit(null);
              setIsEditModalOpen(true);
            }}
            className="py-1.5 px-4 text-xs font-black uppercase tracking-wider shrink-0"
          >
            ➕ Ajouter un morceau
          </CordelButton>
        </div>
      </div>

      {/* Barre de filtrage & Recherche */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Filtres de saison */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSeasonFilter('saison')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'saison'
                ? 'bg-green-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            🟢 Au programme ({counts.saison})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('chantier')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'chantier'
                ? 'bg-amber-600 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            🟡 En préparation ({counts.chantier})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('archive')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'archive'
                ? 'bg-stone-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            ⚪ Archives ({counts.archive})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('all')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'all'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            Tous ({counts.all})
          </button>
        </div>

        {/* Barre de recherche rapide */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="🔍 Rechercher un morceau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full text-xs font-bold py-1.5 px-3 bg-cordel-bg-light border-2 border-encre-noire rounded"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-red-100 border-2 border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--color-cordel-rouge,#8b2a1a)] rounded font-bold text-xs flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>{fetchError}</span>
        </div>
      )}

      {/* Encart des Presets complets du Séquenceur non encore répertoriés */}
      <RepertoireUnlinkedPresetsBanner
        unlinkedPresets={unlinkedPresets}
        onImportPreset={handleImportPreset}
        importingPresetId={importingPresetId}
      />

      {/* Liste principale des morceaux */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
            ⏳ Chargement du répertoire vivant...
          </span>
        </div>
      ) : filteredPieces.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-10 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">📜</span>
          <p className="text-xs font-bold opacity-75">
            {searchQuery
              ? "Aucun morceau ne correspond à votre recherche."
              : "Aucun morceau dans cette catégorie de répertoire."}
          </p>
          {!searchQuery && (
            <CordelButton
              type="button"
              variant="ocre"
              onClick={() => {
                setPieceToEdit(null);
                setIsEditModalOpen(true);
              }}
              className="py-1 px-3 text-xs font-black uppercase tracking-wider mt-1"
            >
              ➕ Ajouter un premier morceau
            </CordelButton>
          )}
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPieces.map((piece) => {
            const isPret = piece.etatValidation === 'pret';
            const hasSequencer = Boolean(piece.sequenceurFileUrl || piece.sequenceurId);

            return (
              <div
                key={piece.id}
                className="border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-white p-4 flex flex-col justify-between gap-3 hover:shadow-[3.5px_3.5px_0px_0px_#181716] transition-all text-left"
              >
                {/* Haut de la carte : Titre & Pastille d'état */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-sm md:text-base text-encre-noire leading-tight">
                        {piece.titre}
                      </h3>
                      {seasonFilter === 'all' && (
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark/60 mt-0.5">
                          {piece.statutSaison === 'saison'
                            ? '🟢 Au programme cette année'
                            : piece.statutSaison === 'chantier'
                              ? '🟡 En préparation'
                              : '⚪ Archives'}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9.5px] shrink-0 ${
                        isPret
                          ? 'bg-green-100 text-green-900 border-green-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}
                    >
                      {isPret ? '🟢 Validé / Prêt' : '🟡 En chantier'}
                    </span>
                  </div>

                  {/* Notes du Mestre */}
                  {piece.notes && (
                    <p className="text-[11px] text-encre-noire/80 bg-[#fdfaf2] p-2 rounded border border-dashed border-encre-noire/15 italic leading-snug">
                      💡 {piece.notes}
                    </p>
                  )}

                  {/* Badges des liaisons actives résolues en direct */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {piece.hasSequencer && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-50 text-amber-900 border border-amber-300"
                        title={piece.preset ? `Lié en direct au Preset : ${piece.preset.titre || piece.preset.name}` : 'Lié au Séquenceur'}
                      >
                        <span>🥁</span>
                        <span>
                          {piece.preset?._collection === 'presets' || piece.sequenceurType === 'presets'
                            ? 'Preset vivant'
                            : piece.sequenceurType === 'sections'
                              ? 'Séquence'
                              : 'Séquenceur'}
                        </span>
                      </span>
                    )}

                    {piece.hasAudio && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-purple-50 text-purple-900 border border-purple-300"
                        title={piece.preset?.audioUrl ? "Audio direct du Séquenceur" : "Audio de référence lié"}
                      >
                        <span>🎵</span>
                        <span>Audio</span>
                      </span>
                    )}

                    {piece.hasToada && (
                      <button
                        type="button"
                        onClick={() => {
                          const toadaToOpen = piece.activeToada || toadasList.find((t) => t.id === piece.toadaDocId);
                          if (toadaToOpen) {
                            setActiveToadaToView(toadaToOpen);
                          } else {
                            showToast("La fiche de ce chant n'a pas pu être trouvée sur le Varal.");
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors shadow-2xs cursor-pointer select-none"
                        title={piece.activeToada?.titre ? `Lire les paroles : ${piece.activeToada.titre}` : 'Lire les paroles de la Toada du Varal'}
                      >
                        <span>🗣️</span>
                        <span className="truncate max-w-[130px]">
                          {piece.activeToada?.titre ? piece.activeToada.titre : 'Toada'}
                        </span>
                        <span className="text-[8px] opacity-70">↗</span>
                      </button>
                    )}

                    {piece.hasChoreography && piece.activeChoreography && (
                      <a
                        href={`https://dancador.ogirador.fr/?choreoId=${piece.activeChoreography.id}&groupId=${groupId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 transition-colors shadow-2xs"
                        title={`Ouvrir « ${piece.activeChoreography.nom} » dans Dançad'Or`}
                      >
                        <span>💃</span>
                        <span className="truncate max-w-[120px]">{piece.activeChoreography.nom}</span>
                        <span className="text-[8px] opacity-70">↗</span>
                      </a>
                    )}

                    {piece.hasCulture && (
                      piece.activeCultureDocs && piece.activeCultureDocs.length > 1 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {piece.activeCultureDocs.map((cDoc, cIdx) => (
                            <button
                              key={cDoc.id || cIdx}
                              type="button"
                              onClick={() => setActiveCultureDocToView(cDoc)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 transition-colors shadow-2xs cursor-pointer select-none"
                              title={`Consulter la fiche culturelle : ${cDoc.titre || cDoc.name || 'Culture'}`}
                            >
                              <span>📖</span>
                              <span className="truncate max-w-[120px]">{cDoc.titre || cDoc.name || 'Culture'}</span>
                              <span className="text-[8px] opacity-70">↗</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const docToOpen = piece.activeCultureDocs?.[0] || piece.activeCultureDoc || {
                              id: piece.cultureDocId || (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds[0]),
                              titre: piece.titre,
                              videoUrl: piece.activeVideoUrl || piece.videoUrl,
                              chapitres: piece.activeHistoire ? [{ sousTitre: 'Origines & Histoire', texte: piece.activeHistoire }] : []
                            };
                            setActiveCultureDocToView(docToOpen);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 transition-colors shadow-2xs cursor-pointer select-none"
                          title={piece.activeCultureDocs?.[0]?.titre || piece.activeCultureDoc?.titre ? `Consulter la fiche culturelle : ${piece.activeCultureDocs?.[0]?.titre || piece.activeCultureDoc?.titre}` : 'Consulter la fiche culturelle du Varal'}
                        >
                          <span>📖</span>
                          <span className="truncate max-w-[130px]">{piece.activeCultureDocs?.[0]?.titre || piece.activeCultureDoc?.titre || 'Culture'}</span>
                          <span className="text-[8px] opacity-70">↗</span>
                        </button>
                      )
                    )}

                    {piece.hasTablature && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-stone-100 text-stone-800 border border-stone-300">
                        <span>📄</span>
                        <span>Tablature vivante</span>
                      </span>
                    )}

                    {((Array.isArray(piece.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0) || (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-50 text-amber-950 border border-amber-300">
                        <span>🖐️</span>
                        <span>{(piece.activeSinaisDoMestre?.length || piece.sinaisDoMestre?.length || (piece.sinaisDoMestre ? piece.sinaisDoMestre.length : 0))} Signe{(piece.activeSinaisDoMestre?.length || piece.sinaisDoMestre?.length) > 1 ? 's' : ''}</span>
                      </span>
                    )}

                    {/* Badge Speed Trainer si des entraînements sont rattachés au morceau */}
                    {(() => {
                      const piecePresetId = piece.sequenceurId || piece.preset?.id;
                      const pieceTrainings = resolvePieceTrainings(piecePresetId, trainings);
                      if (pieceTrainings.length === 0) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => setActiveTrainingDetailsPieceId(activeTrainingDetailsPieceId === piece.id ? null : piece.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 transition-colors shadow-2xs cursor-pointer select-none"
                          title="Afficher les défis Speed Trainer associés"
                        >
                          <span>⚡</span>
                          <span>{pieceTrainings.length} défi{pieceTrainings.length > 1 ? 's' : ''} Speed Trainer</span>
                          <span className="text-[8px] opacity-70">{activeTrainingDetailsPieceId === piece.id ? '▲' : '▼'}</span>
                        </button>
                      );
                    })()}

                    {!piece.hasSequencer && !piece.hasAudio && !piece.hasTablature && !piece.hasToada && !piece.hasChoreography && !piece.hasCulture && (!piece.activeSinaisDoMestre || piece.activeSinaisDoMestre.length === 0) && (
                      <span className="text-[9.5px] italic text-encre-noire/50">
                        Autonome (joué de mémoire)
                      </span>
                    )}
                  </div>

                  {/* Lecteur direct pour l'audio résolu en temps réel */}
                  {piece.hasAudio && piece.activeAudioUrl && (
                    <div className="w-full mt-2 pt-2 border-t border-dashed border-encre-noire/15 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center gap-1">
                          <span>🎵</span>
                          <span>Audio de référence :</span>
                        </span>
                        {piece.preset?.audioUrl ? (
                          <span className="text-[8.5px] text-amber-800 font-bold lowercase">✓ direct séquenceur</span>
                        ) : piece.activeToada?.audioUrl ? (
                          <span className="text-[8.5px] text-emerald-800 font-bold lowercase">✓ direct toada</span>
                        ) : null}
                      </div>
                      <audio controls src={piece.activeAudioUrl} className="w-full mt-1.5 h-7 rounded border border-encre-noire/10" preload="none" />
                    </div>
                  )}

                  {/* Lecteur vidéo YouTube */}
                  {(() => {
                    const targetVideo = piece.activeVideoUrl;
                    const yt = targetVideo ? parseYouTubeMedia(targetVideo) : null;
                    if (!yt || !yt.embedUrl) return null;
                    return (
                      <div className="w-full mt-2 pt-2 border-t border-dashed border-encre-noire/15 flex flex-col gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center gap-1">
                            <span>🎬</span>
                            <span>Vidéo de référence :</span>
                          </span>
                          <a
                            href={yt.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[9px] text-cordel-wood hover:underline font-bold"
                          >
                            Ouvrir sur YouTube ↗
                          </a>
                        </div>
                        <div className="relative w-full aspect-video rounded overflow-hidden border border-encre-noire/20 shadow-xs bg-black">
                          <iframe
                            src={yt.embedUrl}
                            title={`Vidéo ${piece.titre}`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Vidéos personnalisables du morceau */}
                  {Array.isArray(piece.videos) && piece.videos.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {piece.videos.map((vid, idx) => (
                        <button
                          key={vid.id || idx}
                          type="button"
                          onClick={() => setActiveVideoToWatch(vid)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9.5px] font-black uppercase rounded-[4px_6px_3px_5px] bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 shadow-sm transition-all cursor-pointer"
                          title={`Visionner la vidéo : ${vid.titre || 'Vidéo'}`}
                        >
                          <span>🎬</span>
                          <span className="truncate max-w-[150px]">{vid.titre || `Vidéo #${idx + 1}`}</span>
                          <span className="text-[8px] opacity-70">▶</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Signes du Mestre associés (vignettes avec zoom au clic) */}
                  {Array.isArray(piece.signalIds) && piece.signalIds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/70 mr-0.5">
                        ✋ Signes :
                      </span>
                      {piece.signalIds.map((sigId) => {
                        const sig = signalsMap.get(sigId);
                        if (!sig) return null;
                        return (
                          <button
                            key={sigId}
                            type="button"
                            onClick={() => setActiveSignalToZoom(sig)}
                            className="inline-flex items-center gap-1.5 p-1 pr-2 rounded-[4px_6px_3px_5px] bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-300 transition-all cursor-pointer shadow-sm select-none"
                            title={`Agrandir le geste : ${sig.name}`}
                          >
                            <div className="w-5 h-5 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center border border-encre-noire/20">
                              {sig.imageUrl ? (
                                <img src={sig.imageUrl} alt={sig.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px]">✋</span>
                              )}
                            </div>
                            <span className="text-[9.5px] font-extrabold truncate max-w-[100px]">{sig.name}</span>
                            <span className="text-[8.5px] opacity-50">🔍</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Signes & Conventions chronologiques vivants */}
                  {((Array.isArray(piece.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0) || (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)) && (
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-dashed border-encre-noire/10 text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/80 flex items-center gap-1">
                        <span>🖐️</span>
                        <span>Signes &amp; Conventions ({(piece.activeSinaisDoMestre?.length || piece.sinaisDoMestre?.length || (piece.sinaisDoMestre ? piece.sinaisDoMestre.length : 0))}) :</span>
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[...(piece.activeSinaisDoMestre || piece.sinaisDoMestre || [])]
                          .sort((a, b) => {
                            const ma = typeof a === 'object' && a !== null ? (a.mesure ?? a.bar ?? a.barIndex ?? 0) : 0;
                            const mb = typeof b === 'object' && b !== null ? (b.mesure ?? b.bar ?? b.barIndex ?? 0) : 0;
                            return Number(ma) - Number(mb);
                          })
                          .map((s, idx) => {
                            const m = typeof s === 'object' && s !== null ? (s.mesure ?? s.bar ?? s.barIndex ?? (idx + 1)) : (idx + 1);
                            const nom = typeof s === 'object' && s !== null ? (s.nom || s.name || s.signe || s.label || s.action || 'Signe') : String(s);
                            return (
                              <span
                                key={s.id || idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-extrabold rounded-[4px_6px_3px_5px] bg-[#fbf7ee] text-encre-noire border border-encre-noire/25 shadow-2xs"
                              >
                                <span className="text-cordel-wood font-black">Mesure {m} :</span>
                                <span>{nom}</span>
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Volet déplié : Défis et paliers Speed Trainer rattachés */}
                  {(() => {
                    const piecePresetId = piece.sequenceurId || piece.preset?.id;
                    const pieceTrainings = resolvePieceTrainings(piecePresetId, trainings);
                    if (activeTrainingDetailsPieceId !== piece.id || pieceTrainings.length === 0) return null;

                    return (
                      <div className="w-full mt-3 p-3 bg-amber-50/70 border border-dashed border-amber-300 rounded-[4px_6px_3px_5px] flex flex-col gap-2.5 text-left">
                        <div className="flex items-center justify-between border-b border-dashed border-amber-300/60 pb-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                            <span>⚡</span>
                            <span>Défis Speed Trainer ({pieceTrainings.length})</span>
                          </span>
                          <span className="text-[9px] text-amber-900/70 font-bold">
                            Séquenciad'Or
                          </span>
                        </div>
                        <TrainingCompactCard
                          trainings={pieceTrainings}
                          sequenceurUrl={sequenceurUrl}
                          mode="repertoire"
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Bas de la carte : Barre d'actions responsive */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-dashed border-cordel-master-dark/15 mt-1">
                  {/* Boutons d'accès et de synchronisation Séquenceur */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {piece.hasSequencer ? (
                      <button
                        type="button"
                        onClick={() => openSequencerWithCrossApp(sequenceurUrl, piece)}
                        className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline inline-flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer font-extrabold w-fit shrink-0"
                        title="Ouvrir et travailler ce morceau dans le Séquenceur avec SSO"
                      >
                        <span>🥁</span>
                        <span>
                          {piece.preset?._collection === 'presets' || piece.sequenceurType === 'presets'
                            ? 'Ouvrir le Preset ➔'
                            : piece.sequenceurType === 'sections'
                              ? 'Ouvrir la Séquence ➔'
                              : 'Ouvrir Séquenceur ➔'}
                        </span>
                      </button>
                    ) : null}

                    {/* Bouton de synchronisation / rattachement au Séquenceur */}
                    <button
                      type="button"
                      disabled={syncingPieceId === piece.id}
                      onClick={() => handleSyncWithSequencer(piece)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] bg-stone-100 hover:bg-stone-200 text-stone-800 border border-encre-noire/25 cursor-pointer shadow-2xs transition-all active:translate-y-[0.5px] disabled:opacity-50 select-none"
                      title={piece.sequenceurId ? "Synchroniser les références et données vives du Séquenceur" : "Lier automatiquement au Preset Séquenceur correspondant"}
                    >
                      <span className={syncingPieceId === piece.id ? 'animate-spin inline-block' : ''}>🔄</span>
                      <span>
                        {syncingPieceId === piece.id
                          ? 'Synchronisation...'
                          : piece.sequenceurId
                            ? 'Synchroniser'
                            : 'Lier Séquenceur'}
                      </span>
                    </button>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end sm:justify-end sm:ml-auto">
                    {/* Bouton Tablature avec calcul paresseux (lazy) à la demande */}
                    {piece.hasTablature && (
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        onClick={() => handleOpenTablatureModal(piece)}
                        className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-stone-100 hover:bg-stone-200 border border-encre-noire/25 text-encre-noire flex items-center gap-1 shrink-0"
                        title="Consulter et imprimer la tablature (calculée à la volée)"
                      >
                        <span>📄</span>
                        <span>Tablature</span>
                      </CordelButton>
                    )}

                    {/* Bouton Configuration Défi Réflexe « Temps 1 » (Arbitrage & Surcharges Mestre) */}
                    {Boolean(
                      (Array.isArray(piece.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0) ||
                      (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0) ||
                      (Array.isArray(piece.preset?.sinaisDoMestre) && piece.preset.sinaisDoMestre.length > 0)
                    ) && (
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        onClick={() => setReflexConfigPiece(piece)}
                        className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1 shrink-0"
                        title="Configurer le Défi Réflexe « Temps 1 » (arbitrage des pauses et des leurres)"
                      >
                        <span>🎯</span>
                        <span>Défi Temps 1</span>
                      </CordelButton>
                    )}

                    {/* Bouton Jeu du Conducteur à trous (Timeline) */}
                    {Boolean(
                      (Array.isArray(piece.activeSinaisDoMestre) && piece.activeSinaisDoMestre.length > 0) ||
                      (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0) ||
                      (Array.isArray(piece.preset?.sinaisDoMestre) && piece.preset.sinaisDoMestre.length > 0)
                    ) && (
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        onClick={() => setConductorGamePiece(piece)}
                        className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 flex items-center gap-1 shrink-0"
                        title="Lancer le jeu du Conducteur à trous (mémoriser la structure des signaux)"
                      >
                        <span>🗺️</span>
                        <span>Conduire le morceau (Timeline)</span>
                      </CordelButton>
                    )}

                    {/* Bouton consultation Toada (Chant & Paroles) */}
                    {piece.hasToada && (
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        onClick={() => {
                          const toadaToOpen = piece.activeToada || toadasList.find((t) => t.id === piece.toadaDocId);
                          if (toadaToOpen) {
                            setActiveToadaToView(toadaToOpen);
                          } else {
                            showToast("La fiche de ce chant n'a pas pu être trouvée sur le Varal.");
                          }
                        }}
                        className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-1 shrink-0"
                        title={piece.activeToada?.titre ? `Lire les paroles de « ${piece.activeToada.titre} »` : "Lire les paroles du chant associé (Toada du Varal)"}
                      >
                        <span>🗣️</span>
                        <span>Toada</span>
                      </CordelButton>
                    )}

                    {/* Bouton consultation Fiche Varal Culture liée ou passerelle de création */}
                    {piece.hasCulture ? (
                      piece.activeCultureDocs && piece.activeCultureDocs.length > 1 ? (
                        <CordelButton
                          type="button"
                          variant="default"
                          useExtremeBorder={false}
                          onClick={() => setCulturePickerData({ piece, docs: piece.activeCultureDocs })}
                          className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 flex items-center gap-1 shrink-0"
                          title="Consulter les fiches culturelles associées"
                        >
                          <span>📖</span>
                          <span>{piece.activeCultureDocs.length} fiches Culture</span>
                        </CordelButton>
                      ) : (
                        <CordelButton
                          type="button"
                          variant="default"
                          useExtremeBorder={false}
                          onClick={() => {
                            const docToOpen = piece.activeCultureDocs?.[0] || piece.activeCultureDoc || {
                              id: piece.cultureDocId || (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds[0]),
                              titre: piece.titre,
                              videoUrl: piece.activeVideoUrl || piece.videoUrl,
                              chapitres: piece.activeHistoire ? [{ sousTitre: 'Origines & Histoire', texte: piece.activeHistoire }] : []
                            };
                            setActiveCultureDocToView(docToOpen);
                          }}
                          className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 flex items-center gap-1 shrink-0"
                          title="Consulter la fiche culturelle du Varal associée"
                        >
                          <span>📖</span>
                          <span>Fiche Culture</span>
                        </CordelButton>
                      )
                    ) : (
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        onClick={() => setPieceForCultureCreation(piece)}
                        className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1 shrink-0"
                        title="Créer une fiche du Varal Culture pré-remplie avec le Contexte & Histoire du morceau (contexteHistorique)"
                      >
                        <span>➕</span>
                        <span>Fiche Culture</span>
                      </CordelButton>
                    )}

                    <CordelButton
                      type="button"
                      variant="ocre"
                      useExtremeBorder={false}
                      onClick={() => {
                        setPieceToProgram(piece);
                        setIsProgramModalOpen(true);
                      }}
                      className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black shrink-0"
                      title="Ajouter au fil conducteur d'une répétition ou d'un concert"
                    >
                      ➕ Programmer
                    </CordelButton>

                    <CordelButton
                      type="button"
                      variant="default"
                      useExtremeBorder={false}
                      onClick={() => {
                        setPieceToEdit(piece);
                        setIsEditModalOpen(true);
                      }}
                      className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-stone-100 hover:bg-stone-200 border border-encre-noire/20 shrink-0"
                      title="Modifier les informations"
                    >
                      ✏️
                    </CordelButton>

                    <CordelButton
                      type="button"
                      variant="rouge"
                      useExtremeBorder={false}
                      onClick={() => handleDeletePiece(piece)}
                      className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black shrink-0"
                      title="Supprimer du répertoire"
                    >
                      🗑️
                    </CordelButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'ajout / modification */}
      <RepertoirePieceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        groupId={groupId}
        pieceToEdit={pieceToEdit}
        onSaveSuccess={(saved) => {
          showToast(`Morceau « ${saved.titre} » enregistré.`);
        }}
      />

      {/* Modale d'injection dans l'Agenda */}
      <ProgramPieceModal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        groupId={groupId}
        piece={pieceToProgram}
        onSuccess={(event, item) => {
          const evName = event ? (event.titre || event.title || 'l\'événement') : 'l\'événement';
          showToast(`« ${item.titre} » programmé sur ${evName} !`);
        }}
      />

      {/* Modale de lecture vidéo Cordel */}
      <RepertoireVideoModal
        isOpen={Boolean(activeVideoToWatch)}
        onClose={() => setActiveVideoToWatch(null)}
        video={activeVideoToWatch}
      />

      {/* Modale de zoom sur le geste du Mestre */}
      <SignalZoomModal
        isOpen={Boolean(activeSignalToZoom)}
        onClose={() => setActiveSignalToZoom(null)}
        signal={activeSignalToZoom}
      />

      {/* Modale de consultation et d'impression de la tablature */}
      <TablatureModal
        isOpen={Boolean(activeTablaturePiece)}
        onClose={() => setActiveTablaturePiece(null)}
        piece={activeTablaturePiece}
      />

      {/* Modale passerelle vers le Varal Culture */}
      <CreateCultureFicheModal
        isOpen={Boolean(pieceForCultureCreation)}
        onClose={() => setPieceForCultureCreation(null)}
        groupId={groupId}
        piece={pieceForCultureCreation}
        onSuccess={(newCultureId) => {
          if (pieceForCultureCreation) {
            setPieces((prev) =>
              prev.map((p) => {
                if (p.id !== pieceForCultureCreation.id) return p;
                const existingIds = Array.isArray(p.cultureDocIds)
                  ? p.cultureDocIds
                  : (p.cultureDocId ? [p.cultureDocId] : []);
                const updatedIds = Array.from(new Set([...existingIds, newCultureId]));
                return {
                  ...p,
                  cultureDocIds: updatedIds,
                  cultureDocId: updatedIds[0] || newCultureId
                };
              })
            );
            showToast(`Fiche culture créée sur le Varal et liée à « ${pieceForCultureCreation.titre} » !`);
          }
          setPieceForCultureCreation(null);
        }}
      />

      {/* Modale de sélection lorsqu'un morceau possède plusieurs fiches culturelles */}
      {culturePickerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-[460px] bg-cordel-bg p-4 rounded-lg shadow-2xl border-2 border-encre-noire text-left">
            <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/20 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <span className="text-xs font-black uppercase text-cordel-wood tracking-wider">
                  Fiches Culturelles — {culturePickerData.piece?.titre}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCulturePickerData(null)}
                className="w-6 h-6 rounded-full bg-encre-noire text-white font-bold text-xs flex items-center justify-center hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-cordel-master-dark/80 mb-3 font-semibold">
              Sélectionnez la fiche culturelle à consulter :
            </p>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {culturePickerData.docs.map((docItem, idx) => (
                <button
                  key={docItem.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveCultureDocToView(docItem);
                    setCulturePickerData(null);
                  }}
                  className="flex items-center justify-between p-2.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 font-bold text-xs cursor-pointer transition-all shadow-xs text-left"
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>📖</span>
                    <span className="truncate">{docItem.titre || docItem.name || 'Fiche Culture'}</span>
                  </span>
                  <span className="text-[10px] text-blue-700 underline shrink-0 font-black">Consulter ↗</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modale de consultation de la Fiche Culture du Varal */}
      {activeCultureDocToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-[620px] max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setActiveCultureDocToView(null)}
              className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-md hover:scale-105 transition-transform cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
            <CultureCard culture={activeCultureDocToView} />
          </div>
        </div>
      )}

      {/* Modale de consultation d'une Toada (Chant & Paroles) du Varal */}
      {activeToadaToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-[580px] max-h-[92vh] flex flex-col min-h-0 bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
            {/* Header avec titre & bouton fermeture */}
            <div className="w-full flex justify-between items-center px-4 py-2.5 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0 bg-[#fdfaf2]">
              <div className="flex items-center gap-2">
                <span className="text-base">🗣️</span>
                <span className="text-xs font-black uppercase text-cordel-wood tracking-wider">
                  Chant &amp; Paroles {activeToadaToView.titre ? `— ${activeToadaToView.titre}` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveToadaToView(null)}
                className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Contenu défilable */}
            <div className="w-full flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-cordel-bg-light flex flex-col items-center">
              <div className="w-full max-w-full">
                <SongCard
                  song={activeToadaToView}
                  defaultRevisionMode={false}
                  groupId={groupId}
                  profileData={_profileData}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'arbitrage Mestre pour le Défi Réflexe « Temps 1 » */}
      <PieceReflexConfigModal
        isOpen={Boolean(reflexConfigPiece)}
        onClose={() => setReflexConfigPiece(null)}
        piece={reflexConfigPiece}
        presetData={reflexConfigPiece?.preset || (Array.isArray(catalogRhythms) ? catalogRhythms.find(r => r.id === reflexConfigPiece?.sequenceurId) : null)}
        groupId={groupId}
        onSaveSuccess={(updatedPiece) => {
          setPieces((prev) => prev.map(p => p.id === updatedPiece.id ? { ...p, ...updatedPiece } : p));
          showToast(`Réglages Défi Réflexe enregistrés pour « ${updatedPiece.titre} » !`);
        }}
      />

      {/* Modale du jeu du Conducteur à trous */}
      {conductorGamePiece && (
        <ConductorGameModal
          isOpen={Boolean(conductorGamePiece)}
          onClose={() => setConductorGamePiece(null)}
          piece={conductorGamePiece}
          presetData={conductorGamePiece.preset || (Array.isArray(catalogRhythms) ? catalogRhythms.find(r => r.id === conductorGamePiece.sequenceurId) : null)}
          profileData={_profileData}
        />
      )}
    </div>
  );
}
