import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useDancadorChoreographies, useDancadorSteps } from '../../hooks/useDancadorData';
import { useSequencerFirestoreData } from '../../hooks/useSequencerFirestoreData';

export default function EventRevisionProgram({
  setlist,
  isAuthorized,
  updatingSetlist,
  handleRemoveMorceau,
  assocSequenceurUrl,
  handleAddMorceau,
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
  linkedPatterns = []
}) {
  const [activeTab, setActiveTab] = useState('percussion'); // 'percussion' | 'danse'
  const [selectedChoreoToAdd, setSelectedChoreoToAdd] = useState('');

  // Hooks pour le séquenceur
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { rhythms: allSequencerRhythms, loading: loadingSequencerRhythms } = useSequencerFirestoreData(groupId);
  const linkedSequencerRhythms = allSequencerRhythms.filter(r => linkedPatterns.includes(r.id));

  // Hooks pour Dançador
  const { choreographies: allChoreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);
  const { steps: allSteps, loading: loadingSteps } = useDancadorSteps(groupId);

  const handleSelectCatalogRhythm = (e) => {
    const selectedUrl = e.target.value;
    setSelectedCatalogRhythmUrl(selectedUrl);
    if (selectedUrl) {
      const foundRhythm = catalogRhythms.find(r => r.jsonUrl === selectedUrl);
      if (foundRhythm) {
        setNewMorceauTitre(foundRhythm.titre);
      }
    }
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
      {/* Onglets */}
      <div className="flex border-b-2 border-dashed border-cordel-master-dark/15 bg-cordel-bg-light">
        <button
          onClick={() => setActiveTab('percussion')}
          className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors ${
            activeTab === 'percussion'
              ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white'
              : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'
          }`}
        >
          🥁 Percussion
        </button>
        <button
          onClick={() => setActiveTab('danse')}
          className={`flex-1 py-3 text-xs font-black tracking-widest uppercase transition-colors ${
            activeTab === 'danse'
              ? 'text-cordel-wood border-b-4 border-cordel-wood bg-white'
              : 'text-cordel-master-dark/50 hover:text-cordel-wood/70'
          }`}
        >
          💃 Danse
        </button>
      </div>

      <div className="p-5">
        {/* ONGLET PERCUSSION */}
        {activeTab === 'percussion' && (
          <div className="animate-fadeIn">
            {setlist.length === 0 && linkedSequencerRhythms.length === 0 ? (
              <p className="text-[11px] italic opacity-60 mb-4">Aucun morceau ou rythme programmé pour cet événement.</p>
            ) : (
              <div className="flex flex-col gap-2.5 mb-4">
                {/* SETLIST (Legacy JSON/URLs) */}
                {setlist.map((morceau) => (
                  <div 
                    key={morceau.id}
                    className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-encre-noire text-sm">{morceau.titre}</span>
                      {isAuthorized && (
                        <button
                          type="button"
                          disabled={updatingSetlist}
                          onClick={() => handleRemoveMorceau(morceau.id)}
                          className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none"
                          title="Retirer de la setlist"
                        >
                          ✕ Retirer
                        </button>
                      )}
                    </div>

                    {morceau.notes && (
                      <p className="text-[11px] text-encre-noire/70 bg-white/40 dark:bg-black/20 p-1.5 rounded italic">
                        💡 {morceau.notes}
                      </p>
                    )}

                    {(() => {
                      let targetUrl = '';
                      if (morceau.jsonUrl) {
                        const baseUrl = assocSequenceurUrl || 'https://sequenceur.app';
                        targetUrl = baseUrl.includes('?') 
                          ? `${baseUrl}&file=${encodeURIComponent(morceau.jsonUrl)}`
                          : `${baseUrl}?file=${encodeURIComponent(morceau.jsonUrl)}`;
                      } else if (morceau.sequenceurUrl) {
                        targetUrl = morceau.sequenceurUrl;
                      }

                      if (!targetUrl) return null;

                      return (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                        >
                          🎧 Écouter dans le Séquenceur
                        </a>
                      );
                    })()}
                  </div>
                ))}

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
                      className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-cordel-master-dark/20"
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

            {/* Formulaire d'ajout pour les Admins */}
            {isAuthorized && (
              <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5">
                  ➕ Ajouter un morceau / rythme
                </h5>
                <form onSubmit={handleAddMorceau} className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Choisir un rythme du catalogue
                    </label>
                    <select
                      value={selectedCatalogRhythmUrl}
                      onChange={handleSelectCatalogRhythm}
                      disabled={updatingSetlist || loadingRhythms}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
                    >
                      <option value="">
                        {loadingRhythms 
                          ? "-- Chargement du catalogue... --" 
                          : catalogRhythms.length === 0 
                            ? "-- Aucun rythme dans le catalogue --" 
                            : "-- Choisir un rythme du catalogue --"}
                      </option>
                      {catalogRhythms.map((rhythm) => (
                        <option key={rhythm.id} value={rhythm.jsonUrl}>
                          🎵 {rhythm.titre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark text-left">
                      Titre du morceau *
                    </label>
                    <input 
                      type="text"
                      placeholder="Titre du morceau (ex: Baque de Luanda)"
                      value={newMorceauTitre}
                      onChange={(e) => setNewMorceauTitre(e.target.value)}
                      disabled={updatingSetlist}
                      required
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      OU Fichier .json personnalisé
                    </label>
                    <input 
                      key={fileInputKey}
                      type="file"
                      accept=".json"
                      onChange={(e) => setNewMorceauJsonFile(e.target.files[0])}
                      disabled={updatingSetlist}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Notes de révision
                    </label>
                    <input 
                      type="text"
                      placeholder="Notes de révision (ex: Tempo 120, variations A et B)"
                      value={newMorceauNotes}
                      onChange={(e) => setNewMorceauNotes(e.target.value)}
                      disabled={updatingSetlist}
                      className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                    />
                  </div>

                  <CordelButton
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={updatingSetlist || !newMorceauTitre.trim()}
                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    {updatingSetlist ? "Enregistrement..." : "Ajouter au programme"}
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
    </CordelCard>
  );
}
