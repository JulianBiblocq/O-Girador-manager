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
  const [activeTab, setActiveTab] = useState('filConducteur'); // 'filConducteur' | 'danse'
  const [selectedChoreoToAdd, setSelectedChoreoToAdd] = useState('');

  // Hooks pour le séquenceur
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { rhythms: allSequencerRhythms, loading: loadingSequencerRhythms } = useSequencerFirestoreData(groupId);
  const linkedSequencerRhythms = allSequencerRhythms.filter(r => linkedPatterns.includes(r.id));

  // Hooks pour Dançador
  const { choreographies: allChoreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);
  const { steps: allSteps, loading: loadingSteps } = useDancadorSteps(groupId);

  // Détermination sémantique de la discipline pour les badges transversaux
  const getDisciplineBadge = (morceau) => {
    const type = morceau?.type || '';
    const lowerTitre = (morceau?.titre || '').toLowerCase();
    const lowerNotes = (morceau?.notes || '').toLowerCase();

    if (type === 'danse' || lowerTitre.includes('[danse') || lowerTitre.includes('danse')) {
      return {
        label: 'Danse',
        emoji: '💃',
        badgeClass: 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-950/40 dark:text-pink-300'
      };
    }
    if (type === 'song' || lowerTitre.includes('[chant') || lowerTitre.includes('toada') || lowerNotes.includes('chant') || lowerNotes.includes('toada')) {
      return {
        label: 'Chant',
        emoji: '🗣️',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
      };
    }
    return {
      label: 'Percussion',
      emoji: '🥁',
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
    };
  };

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
                  const disc = getDisciplineBadge(morceau);
                  let targetUrl = '';
                  if (morceau.jsonUrl) {
                    const baseUrl = assocSequenceurUrl || 'https://sequenceur.app';
                    targetUrl = baseUrl.includes('?') 
                      ? `${baseUrl}&file=${encodeURIComponent(morceau.jsonUrl)}`
                      : `${baseUrl}?file=${encodeURIComponent(morceau.jsonUrl)}`;
                  } else if (morceau.sequenceurUrl) {
                    targetUrl = morceau.sequenceurUrl;
                  }

                  return (
                    <div 
                      key={morceau.id}
                      className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-encre-noire/15 shadow-xs bg-white"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${disc.badgeClass}`}>
                            <span>{disc.emoji}</span>
                            <span>{disc.label}</span>
                          </span>
                          <span className="font-extrabold text-encre-noire text-sm">
                            {morceau.titre}
                          </span>
                        </div>
                        {isAuthorized && (
                          <button
                            type="button"
                            disabled={updatingSetlist}
                            onClick={() => handleRemoveMorceau(morceau.id)}
                            className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none shrink-0"
                            title="Retirer du fil conducteur"
                          >
                            ✕ Retirer
                          </button>
                        )}
                      </div>

                      {morceau.notes && (
                        <p className="text-[11px] text-encre-noire/80 bg-[#fdfaf2] p-2 rounded border border-dashed border-encre-noire/15 italic leading-snug">
                          💡 {morceau.notes}
                        </p>
                      )}

                      {/* Lecteur / Lien Séquenceur si disponible uniquement (tolérance propre pour les morceaux sans séquenceur) */}
                      {targetUrl && (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                        >
                          🎧 Écouter dans le Séquenceur
                        </a>
                      )}
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
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5">
                  ➕ Ajouter un point au fil conducteur
                </h5>
                <form onSubmit={handleAddMorceau} className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Choisir un rythme du catalogue (optionnel)
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
                      Titre de l'intention ou du morceau *
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
                      OU Fichier .json personnalisé (optionnel)
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
                      Notes d'intention de travail
                    </label>
                    <input 
                      type="text"
                      placeholder="Notes de révision (ex: Tempo 120, travailler la réponse choeur/puxador)"
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
    </CordelCard>
  );
}
