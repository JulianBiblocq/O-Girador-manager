import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useDancadorChoreographies, useDancadorSteps } from '../../hooks/useDancadorData';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import useMestreSignals from '../../hooks/useMestreSignals';
import RepertoireVideoModal from '../mestre/RepertoireVideoModal';
import SignalZoomModal from '../mestre/SignalZoomModal';
import PieceLyricsModal from '../member/PieceLyricsModal';
import PieceCultureModal from '../member/PieceCultureModal';
import { buildSequencerUrl } from '../../utils/sequencerUrlUtils';
import { subscribeGroupTrainings } from '../../services/aisanceService';
import { resolvePieceTrainings, buildResolutionDictionaries, resolvePieceLiveTechnicalData } from '../../utils/repertoireMatcher';
import TrainingCompactCard from '../pedagogy/TrainingCompactCard';

export default function EventRevisionProgram({
  setlist,
  isAuthorized,
  updatingSetlist,
  handleRemoveMorceau,
  assocSequenceurUrl,
  handleAddMorceau,
  handleAddRepertoirePiece,
  newMorceauTitre,
  setNewMorceauTitre,
  selectedCatalogRhythmUrl,
  setSelectedCatalogRhythmUrl,
  fileInputKey,
  setNewMorceauJsonFile,
  newMorceauNotes,
  setNewMorceauNotes,
  groupId,
  dancadorChoreoIds,
  handleAddDancadorChoreo,
  handleRemoveDancadorChoreo,
  linkedPatterns = [],
  trainingsList: externalTrainingsList
}) {
  const [activeTab, setActiveTab] = useState('filConducteur'); // 'filConducteur' | 'danse'
  const [selectedChoreoToAdd, setSelectedChoreoToAdd] = useState('');
  const [activeVideoToWatch, setActiveVideoToWatch] = useState(null);
  const [activeSignalToZoom, setActiveSignalToZoom] = useState(null);
  const [activeToadaToView, setActiveToadaToView] = useState(null);
  const [activeCultureToView, setActiveCultureToView] = useState(null);

  // Documents du Varal (Chants & Fiches Culturelles)
  const { toadasList, toadasMap, cultureDocsList, cultureMap } = useRepertoireVaralDocs(groupId);

  // Morceaux actifs du Répertoire pour ajout direct par l'Admin
  const [repertoirePieces, setRepertoirePieces] = useState([]);
  const [loadingRepertoire, setLoadingRepertoire] = useState(false);
  const [selectedRepertoirePieceId, setSelectedRepertoirePieceId] = useState('');

  useEffect(() => {
    if (!groupId || !isAuthorized) return;
    setLoadingRepertoire(true);
    const colRef = collection(db, 'associations', groupId.trim().toLowerCase(), 'repertoire');
    const unsub = onSnapshot(colRef, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
      setRepertoirePieces(list);
      setLoadingRepertoire(false);
    }, (err) => {
      console.warn("EventRevisionProgram - Erreur répertoire :", err);
      setLoadingRepertoire(false);
    });
    return () => unsub();
  }, [groupId, isAuthorized]);

  const activeRepertoirePieces = useMemo(() => {
    return repertoirePieces.filter((p) => {
      if (!p) return false;
      if (p.isArchived || p.archived || p.statutSaison === 'archive') return false;
      return p.statutSaison === 'saison' || (!p.statutSaison && !p.isArchived && !p.archived);
    });
  }, [repertoirePieces]);

  // Entraînements du groupe (écoute réactive si non fournis par le parent)
  const [internalTrainingsList, setInternalTrainingsList] = useState([]);

  useEffect(() => {
    if (externalTrainingsList) return;
    if (!groupId) return;
    const unsub = subscribeGroupTrainings(groupId, setInternalTrainingsList);
    return () => unsub();
  }, [groupId, externalTrainingsList]);

  const effectiveTrainingsList = externalTrainingsList || internalTrainingsList;

  // Bibliothèque des Signes du Mestre
  const { signals } = useMestreSignals(groupId);
  const signalsMap = useMemo(() => new Map((signals || []).map((s) => [s.id, s])), [signals]);

  // Hooks pour le séquenceur
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { rhythms: allSequencerRhythms, loading: loadingSequencerRhythms } = useSequencerFirestoreData(groupId);
  const linkedSequencerRhythms = allSequencerRhythms.filter(r => linkedPatterns.includes(r.id));

  // Hooks pour Dançador
  const { choreographies: allChoreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);
  const { steps: allSteps, loading: loadingSteps } = useDancadorSteps(groupId);

  // Dictionnaires de résolution instantanée O(1)
  const resolutionDicts = useMemo(() => {
    return buildResolutionDictionaries({
      catalogRhythms: allSequencerRhythms || [],
      toadasList: toadasList || [],
      cultureDocsList: cultureDocsList || [],
      choreographies: allChoreographies || []
    });
  }, [allSequencerRhythms, toadasList, cultureDocsList, allChoreographies]);

  // Détermination sémantique multi-disciplines (Percussion, Chant, Danse, Culture)
  const getDisciplineBadges = (morceau, resolved) => {
    const badges = [];
    const hasDanse = Boolean(morceau.dancadorChoreoId || resolved?.hasChoreography || morceau.type === 'danse');
    const hasChant = Boolean(morceau.toadaDocId || resolved?.hasToada || morceau.type === 'song');
    const hasCulture = Boolean(morceau.cultureDocId || (Array.isArray(morceau.cultureDocIds) && morceau.cultureDocIds.length > 0) || resolved?.hasCulture);
    const hasPercu = Boolean(morceau.sequenceurId || morceau.sequenceurType || morceau.jsonUrl || morceau.sequenceurUrl || resolved?.hasSequencer || (!hasDanse && !hasChant && !hasCulture));

    if (hasPercu) {
      badges.push({
        key: 'percu',
        label: 'Percussion',
        emoji: '🥁',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
      });
    }
    if (hasChant) {
      badges.push({
        key: 'chant',
        label: 'Chant',
        emoji: '🗣️',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
      });
    }
    if (hasDanse) {
      badges.push({
        key: 'danse',
        label: 'Danse',
        emoji: '💃',
        badgeClass: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300'
      });
    }
    if (hasCulture) {
      badges.push({
        key: 'culture',
        label: 'Culture',
        emoji: '📖',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
      });
    }

    return badges;
  };

  const submitAddChoreo = (e) => {
    e.preventDefault();
    if (selectedChoreoToAdd) {
      handleAddDancadorChoreo(selectedChoreoToAdd);
      setSelectedChoreoToAdd('');
    }
  };

  // Filtrer les chorégraphies associées à l'événement
  const eventChoreographies = allChoreographies.filter(c => dancadorChoreoIds.includes(c.id));

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-0 px-0 overflow-hidden">
      {/* Onglets transversaux */}
      <div className="flex border-b-2 border-dashed border-cordel-master-dark/15 bg-cordel-bg-light">
        <button
          type="button"
          onClick={() => setActiveTab('filConducteur')}
          className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'filConducteur'
              ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white'
              : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'
          }`}
        >
          <span>🧭</span>
          <span>Fil conducteur</span>
          {setlist.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cordel-wood/10 text-cordel-wood font-black">
              {setlist.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('danse')}
          className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'danse'
              ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white'
              : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'
          }`}
        >
          <span>💃</span>
          <span>Danse</span>
          {eventChoreographies.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cordel-wood/10 text-cordel-wood font-black">
              {eventChoreographies.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-5">
        {/* ONGLET 1 : FIL CONDUCTEUR TRANSVERSAL (Percu, Danse, Chants, Intentions) */}
        {activeTab === 'filConducteur' && (
          <div className="animate-fadeIn">
            {/* Encart discret d'intention de travail Cordel */}
            <div className="p-3 mb-4 rounded bg-[#fdfaf2] border border-dashed border-[var(--color-cordel-ocre,#c05621)]/50 text-[11px] font-bold text-encre-noire/80 italic flex items-start gap-2 shadow-xs">
              <span className="text-base shrink-0 select-none">🧭</span>
              <span className="leading-snug">
                Ce fil conducteur donne les intentions de travail de la séance. Il s'adapte en direct selon les forces en présence et les ajustements du moment.
              </span>
            </div>

            {setlist.length === 0 && linkedSequencerRhythms.length === 0 ? (
              <p className="text-[11px] italic opacity-60 mb-4">Aucun point de travail ou morceau n'est encore inscrit au fil conducteur de cette séance.</p>
            ) : (
              <div className="flex flex-col gap-2.5 mb-4">
                {/* Liste transversale du Fil Conducteur */}
                {setlist.map((morceau) => {
                  const resolved = resolvePieceLiveTechnicalData(morceau, resolutionDicts) || morceau;
                  const badges = getDisciplineBadges(morceau, resolved);

                  // Résolution propre de l'URL du séquenceur (compatible presets, sections, patterns et legacy jsonUrl)
                  let targetUrl = '';
                  const seqId = morceau.sequenceurId || resolved.sequenceurId;
                  const seqFileUrl = morceau.jsonUrl || morceau.sequenceurUrl || resolved.sequenceurFileUrl;
                  const seqType = morceau.sequenceurType || resolved.sequenceurType;

                  if (seqType || seqId || seqFileUrl) {
                    targetUrl = buildSequencerUrl({
                      sequenceurType: seqType,
                      sequenceurId: seqId,
                      sequenceurFileUrl: seqFileUrl,
                    }, assocSequenceurUrl);
                  }

                  const activeToadaDoc = resolved.activeToada || (morceau.toadaDocId ? toadasMap.get(morceau.toadaDocId) : null);
                  const activeCultureDoc = resolved.activeCultureDoc || (morceau.cultureDocId ? cultureMap.get(morceau.cultureDocId) : null);
                  const choreoId = morceau.dancadorChoreoId || resolved.activeChoreography?.id;
                  const audioSrc = morceau.audioUrl || resolved.activeAudioUrl;

                  return (
                    <div 
                      key={morceau.id || morceau.pieceId}
                      className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-encre-noire/15 shadow-xs bg-white"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {badges.map((b) => (
                            <span key={b.key} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${b.badgeClass}`}>
                              <span>{b.emoji}</span>
                              <span className="hidden sm:inline">{b.label}</span>
                            </span>
                          ))}
                          <span className="font-extrabold text-encre-noire text-sm ml-0.5">
                            {morceau.titre}
                          </span>
                        </div>
                        {isAuthorized && (
                          <button
                            type="button"
                            disabled={updatingSetlist}
                            onClick={() => handleRemoveMorceau(morceau.id || morceau.pieceId)}
                            className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none shrink-0"
                            title="Retirer du fil conducteur"
                          >
                            ✕ Retirer
                          </button>
                        )}
                      </div>

                      {morceau.notes && (
                        <p className="text-[11px] text-encre-noire/80 bg-[#fdfaf2] p-2 rounded border border-dashed border-encre-noire/15 italic leading-snug">
                          🎯 {morceau.notes}
                        </p>
                      )}

                      {/* Entraînement recommandé pour la séance si rattaché au morceau */}
                      {(() => {
                        const pieceTrainings = resolvePieceTrainings(morceau, effectiveTrainingsList);
                        if (pieceTrainings.length === 0) return null;
                        return (
                          <div className="w-full mt-1">
                            <TrainingCompactCard
                              trainings={pieceTrainings}
                              sequenceurUrl={assocSequenceurUrl}
                              mode="rehearsal"
                            />
                          </div>
                        );
                      })()}

                      {/* Vidéos associées au morceau */}
                      {Array.isArray(morceau.videos) && morceau.videos.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {morceau.videos.map((vid, vIdx) => (
                            <button
                              key={vid.id || vIdx}
                              type="button"
                              onClick={() => setActiveVideoToWatch(vid)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 shadow-sm transition-all cursor-pointer"
                              title={`Visionner la vidéo : ${vid.titre || 'Vidéo'}`}
                            >
                              <span>🎬</span>
                              <span className="truncate max-w-[130px]">{vid.titre || `Vidéo #${vIdx + 1}`}</span>
                              <span className="text-[7.5px] opacity-70">▶</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Signes du Mestre associés (vignettes avec zoom au clic) */}
                      {Array.isArray(morceau.signalIds) && morceau.signalIds.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[8.5px] font-black uppercase text-cordel-master-dark/70">
                            ✋ Signes :
                          </span>
                          {morceau.signalIds.map((sigId) => {
                            const sig = signalsMap.get(sigId);
                            if (!sig) return null;
                            return (
                              <button
                                key={sigId}
                                type="button"
                                onClick={() => setActiveSignalToZoom(sig)}
                                className="inline-flex items-center gap-1 p-0.5 pr-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-all cursor-pointer text-[9px] font-bold shadow-sm"
                                title={`Agrandir le geste : ${sig.name}`}
                              >
                                <div className="w-4 h-4 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center">
                                  {sig.imageUrl ? (
                                    <img src={sig.imageUrl} alt={sig.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>✋</span>
                                  )}
                                </div>
                                <span>{sig.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Audio de référence (écoute directe dans Organizador) */}
                      {audioSrc && (
                        <div className="w-full mt-1">
                          <audio
                            controls
                            src={audioSrc}
                            className="w-full h-8"
                            preload="none"
                          >
                            Votre navigateur ne supporte pas la lecture audio.
                          </audio>
                        </div>
                      )}

                      {/* Liens et passerelles dynamiques */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {targetUrl && (
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] flex-1 text-center"
                          >
                            🎧 {morceau.sequenceurType === 'presets' ? 'Ouvrir le Preset dans le Séquenceur' : (morceau.sequenceurType === 'sections' ? 'Ouvrir la Séquence dans le Séquenceur' : 'Écouter dans le Séquenceur')}
                          </a>
                        )}

                        {choreoId && (
                          <a
                            href={`https://dancador.ogirador.fr/?choreoId=${choreoId}&groupId=${groupId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 shadow-2xs transition-colors cursor-pointer"
                            title="Ouvrir la chorégraphie dans Dançad'Or"
                          >
                            <span>💃</span>
                            <span>Chorégraphie</span>
                          </a>
                        )}

                        {activeToadaDoc && (
                          <button
                            type="button"
                            onClick={() => setActiveToadaToView(activeToadaDoc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                            title="Consulter les paroles du chant"
                          >
                            <span>🗣️</span>
                            <span>Paroles</span>
                          </button>
                        )}

                        {activeCultureDoc && (
                          <button
                            type="button"
                            onClick={() => setActiveCultureToView(activeCultureDoc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs transition-colors cursor-pointer"
                            title="Consulter la fiche culturelle"
                          >
                            <span>📖</span>
                            <span>Culture</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Rythmes et Presets Séquenceur liés à l'événement */}
                {linkedSequencerRhythms.length > 0 && (
                  <div className="mt-5 pt-4 border-t-2 border-dashed border-cordel-master-dark/15 flex flex-col gap-2.5">
                    <h5 className="font-black text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                      <span>🎛️</span>
                      <span>Rythmes &amp; Presets Séquenceur associés ({linkedSequencerRhythms.length})</span>
                    </h5>
                    {linkedSequencerRhythms.map((rhythm) => {
                      let targetUrl = '';
                      const baseUrl = assocSequenceurUrl || 'https://sequenceur.app';
                      const paramKey = rhythm._collection === 'sections' ? 'sectionId' : 'loadPreset';
                      targetUrl = baseUrl.includes('?') 
                        ? `${baseUrl}&${paramKey}=${rhythm.id}`
                        : `${baseUrl}?${paramKey}=${rhythm.id}`;

                      return (
                        <div 
                          key={rhythm.id}
                          className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-cordel-master-dark/20 bg-white"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="font-bold text-encre-noire text-sm flex items-center gap-1.5">
                                🎛️ {rhythm.title || rhythm.titre || rhythm.name || 'Sans titre'}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">
                                {rhythm._collection === 'sections' ? 'Section' : (rhythm._collection === 'presets' ? 'Preset (Arrangement Complet)' : 'Rythme')}
                              </span>
                            </div>
                          </div>

                          {rhythm.audioUrl && (
                            <div className="w-full mt-1">
                              <audio 
                                controls 
                                src={rhythm.audioUrl} 
                                className="w-full h-8"
                              />
                            </div>
                          )}

                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                          >
                            🎧 Ouvrir dans le Séquenceur
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Formulaire d'ajout pour les Admins */}
            {isAuthorized && (
              <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5 flex items-center gap-1.5">
                  <span>➕</span>
                  <span>Ajouter un morceau au fil conducteur</span>
                </h5>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const piece = activeRepertoirePieces.find((p) => p.id === selectedRepertoirePieceId);
                    if (piece) {
                      if (handleAddRepertoirePiece) {
                        handleAddRepertoirePiece(piece, newMorceauNotes);
                      }
                      setSelectedRepertoirePieceId('');
                      setNewMorceauTitre('');
                      setNewMorceauNotes('');
                    } else if (newMorceauTitre.trim()) {
                      handleAddMorceau(e);
                    }
                  }}
                  className="flex flex-col gap-2.5"
                >
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Choisir un morceau du Répertoire
                    </label>
                    <select
                      value={selectedRepertoirePieceId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedRepertoirePieceId(id);
                        const found = activeRepertoirePieces.find((p) => p.id === id);
                        if (found) {
                          setNewMorceauTitre(found.titre || '');
                          if (found.notes) setNewMorceauNotes(found.notes);
                        }
                      }}
                      disabled={updatingSetlist || loadingRepertoire}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
                    >
                      <option value="">
                        {loadingRepertoire
                          ? "-- Chargement du répertoire... --"
                          : activeRepertoirePieces.length === 0
                            ? "-- Aucun morceau dans le répertoire --"
                            : "-- Sélectionner un morceau du Répertoire (ou saisie libre ci-dessous) --"}
                      </option>
                      {activeRepertoirePieces.map((p) => (
                        <option key={p.id} value={p.id}>
                          📜 {p.titre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Titre du morceau ou de l'intention *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Baque de Luanda, Toada Ô Samambaia, Pas d'entrée..."
                      value={newMorceauTitre}
                      onChange={(e) => setNewMorceauTitre(e.target.value)}
                      disabled={updatingSetlist}
                      required
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      🎯 Notes d'intention / Focus de travail
                    </label>
                    <input
                      type="text"
                      placeholder="Notes de révision (ex: Bien caler le chant, break à 95 BPM...)"
                      value={newMorceauNotes}
                      onChange={(e) => setNewMorceauNotes(e.target.value)}
                      disabled={updatingSetlist}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                    />
                  </div>

                  <CordelButton
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={updatingSetlist || (!newMorceauTitre.trim() && !selectedRepertoirePieceId)}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    {updatingSetlist ? "Enregistrement..." : "Ajouter au fil conducteur"}
                  </CordelButton>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ONGLET DANSE */}
        {activeTab === 'danse' && (
          <div className="animate-fadeIn">
            {loadingChoreos || loadingSteps ? (
              <p className="text-[11px] italic opacity-60 mb-4">Chargement du catalogue Dançador...</p>
            ) : eventChoreographies.length === 0 ? (
              <p className="text-[11px] italic opacity-60 mb-4">Aucune chorégraphie associée à cet événement.</p>
            ) : (
              <div className="flex flex-col gap-4 mb-4">
                {eventChoreographies.map((choreo) => {
                  const dancadorUrl = `https://dancador.ogirador.fr/?choreoId=${choreo.id}&groupId=${groupId}`;
                  
                  // Récupérer les pas associés à cette chorégraphie
                  const elements = choreo.elements || [];
                  // Extraire les IDs de pas uniques de cette choré
                  const stepIdsInChoreo = [...new Set(elements.filter(e => e.type === 'step').map(e => e.stepId))];
                  const stepsForChoreo = allSteps.filter(s => stepIdsInChoreo.includes(s.id));

                  return (
                    <div key={choreo.id} className="border-2 border-cordel-master-dark/10 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-cordel-wood uppercase tracking-wider">{choreo.nom}</h4>
                          <p className="text-[10px] text-encre-noire/60 font-semibold">{elements.length} élément(s)</p>
                        </div>
                        {isAuthorized && (
                          <button
                            type="button"
                            disabled={updatingSetlist}
                            onClick={() => handleRemoveDancadorChoreo(choreo.id)}
                            className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none"
                            title="Retirer de la setlist"
                          >
                            ✕ Retirer
                          </button>
                        )}
                      </div>

                      {stepsForChoreo.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-[9px] font-black uppercase text-cordel-master-dark/60 tracking-widest border-b border-dashed border-cordel-master-dark/20 pb-1">
                            Pas à réviser
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {stepsForChoreo.map(step => {
                              const stepUrl = `https://dancador.ogirador.fr/player/step/${step.id}?groupId=${groupId}`;
                              return (
                                <a 
                                  href={stepUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  key={step.id} 
                                  className="flex flex-col items-center bg-cordel-bg-light hover:bg-neutral-100 transition-colors rounded border border-cordel-master-dark/10 p-1 overflow-hidden cursor-pointer group"
                                  title={`Ouvrir ${step.nom} dans le lecteur`}
                                >
                                  {step.vignetteUrl ? (
                                    <img src={step.vignetteUrl} alt={step.nom} className="w-full h-16 object-cover rounded-sm mb-1 group-hover:opacity-80 transition-opacity" />
                                  ) : (
                                    <div className="w-full h-16 bg-cordel-master-dark/5 rounded-sm mb-1 flex items-center justify-center text-xl group-hover:bg-cordel-master-dark/10 transition-colors">
                                      💃
                                    </div>
                                  )}
                                  <span className="text-[9px] font-bold text-encre-noire truncate w-full text-center group-hover:text-cordel-wood transition-colors">{step.nom}</span>
                                  {step.famille && <span className="text-[8px] text-cordel-wood truncate w-full text-center">{step.famille}</span>}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <a
                        href={dancadorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                      >
                        💃 Ouvrir dans Dançador
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulaire d'ajout pour les Admins */}
            {isAuthorized && (
              <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5">
                  ➕ Ajouter une Chorégraphie
                </h5>
                <form onSubmit={submitAddChoreo} className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Choisir une chorégraphie de Dançador
                    </label>
                    <select
                      value={selectedChoreoToAdd}
                      onChange={(e) => setSelectedChoreoToAdd(e.target.value)}
                      disabled={updatingSetlist || loadingChoreos}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
                    >
                      <option value="">
                        {loadingChoreos 
                          ? "-- Chargement du catalogue... --" 
                          : allChoreographies.length === 0 
                            ? "-- Aucune chorégraphie publiée --" 
                            : "-- Choisir une chorégraphie --"}
                      </option>
                      {allChoreographies.filter(c => !dancadorChoreoIds.includes(c.id)).map((choreo) => (
                        <option key={choreo.id} value={choreo.id}>
                          💃 {choreo.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <CordelButton
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={updatingSetlist || !selectedChoreoToAdd}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    {updatingSetlist ? "Enregistrement..." : "Ajouter au programme"}
                  </CordelButton>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modale de lecture vidéo Cordel */}
      <RepertoireVideoModal
        isOpen={Boolean(activeVideoToWatch)}
        onClose={() => setActiveVideoToWatch(null)}
        video={activeVideoToWatch}
      />

      {/* Modale de zoom sur le geste / signe du Mestre */}
      <SignalZoomModal
        isOpen={Boolean(activeSignalToZoom)}
        onClose={() => setActiveSignalToZoom(null)}
        signal={activeSignalToZoom}
      />

      {/* Modale des paroles de la toada */}
      {activeToadaToView && (
        <PieceLyricsModal
          isOpen={Boolean(activeToadaToView)}
          onClose={() => setActiveToadaToView(null)}
          song={activeToadaToView}
          groupId={groupId}
        />
      )}

      {/* Modale de la fiche culturelle */}
      {activeCultureToView && (
        <PieceCultureModal
          isOpen={Boolean(activeCultureToView)}
          onClose={() => setActiveCultureToView(null)}
          cultureDocs={[activeCultureToView]}
          initialDocId={activeCultureToView?.id}
        />
      )}
    </CordelCard>
  );
}

