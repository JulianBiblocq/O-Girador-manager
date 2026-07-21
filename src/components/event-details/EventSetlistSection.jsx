import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';

export default function EventSetlistSection({
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
  groupId
}) {
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);

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

  return (
    <>
      {/* Setlist & Séquenceur de l'événement */}
      {(setlist.length > 0 || isAuthorized) && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            🎵 Programme de révision / Setlist
          </h4>

          {setlist.length === 0 ? (
            <p className="text-[11px] italic opacity-60">Aucun morceau ou rythme programmé pour cet événement.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
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
                        🎧 Travailler ce rythme (Séquenceur)
                      </a>
                    );
                  })()}
                </div>
              ))}
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
        </CordelCard>
      )}
    </>
  );
}
