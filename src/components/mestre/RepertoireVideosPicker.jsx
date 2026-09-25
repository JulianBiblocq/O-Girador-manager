import React from 'react';
import CordelButton from '../CordelButton';
import VideoInstrumentCheckboxes from './VideoInstrumentCheckboxes';
import { DEFAULT_INSTRUMENTS } from '../../hooks/useAssociationSettings';

/**
 * Sélecteur dynamique de vidéos libres pour une pièce du répertoire (< 200 lignes).
 * Permet à l'association d'ajouter autant de vidéos qu'elle le souhaite
 * avec sélection multi-instruments (cases à cocher) et libellé personnalisé,
 * ou de piocher dans ses playlists YouTube.
 *
 * @param {Array} videos - Liste des vidéos actuelles [{ id, titre, url, instruments: string[] }]
 * @param {Function} onChange - Callback de mise à jour de la liste
 * @param {Function} onOpenPicker - Callback d'ouverture du sélecteur YouTube (targetIndex, initialPupitre)
 * @param {Array} instrumentsList - Liste des pupitres de l'association
 */
export default function RepertoireVideosPicker({
  videos = [],
  onChange,
  onOpenPicker,
  instrumentsList = DEFAULT_INSTRUMENTS
}) {
  const SUGGESTIONS = ['Tuto', 'Captation', 'Répétition', 'Chorégraphie', 'Ralenti'];

  const handleAddVideo = () => {
    const newVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      titre: '',
      url: '',
      instruments: []
    };
    onChange([...videos, newVideo]);
  };

  const handleUpdate = (id, field, value) => {
    const updated = videos.map((v) => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    });
    onChange(updated);
  };

  const handleRemove = (id) => {
    onChange(videos.filter((v) => v.id !== id));
  };

  const handleApplySuggestion = (id, sug) => {
    const current = videos.find((v) => v.id === id);
    if (!current) return;
    const newTitle = current.titre ? `${current.titre} - ${sug}` : sug;
    handleUpdate(id, 'titre', newTitle);
  };

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-[6px_10px_7px_9px] border border-dashed border-cordel-wood/30 bg-[#fbf7ee]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎬</span>
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            Vidéos du morceau ({videos.length})
          </label>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onOpenPicker && (
            <CordelButton type="button" variant="default" useExtremeBorder={false} onClick={() => onOpenPicker(null)} className="py-1 px-2 text-[9px] uppercase font-black tracking-wider flex items-center gap-1" title="Choisir parmi les vidéos de l'asso">
              <span>🎬 Ajouter une vidéo de l'asso</span>
            </CordelButton>
          )}
          <CordelButton type="button" variant="ocre" useExtremeBorder={false} onClick={handleAddVideo} className="py-1 px-2 text-[9px] uppercase font-black tracking-wider">
            ➕ Ajouter une vidéo
          </CordelButton>
        </div>
      </div>

      <p className="text-[10px] text-encre-noire/70 font-semibold italic leading-tight">
        Ajoutez des liens vidéo (YouTube, Vimeo, Google Drive, MP4) avec vos propres libellés et cochez les pupitres concernés.
      </p>

      {videos.length === 0 ? (
        <div className="py-2.5 text-center text-[10px] text-encre-noire/50 italic border border-dashed border-encre-noire/15 rounded bg-white/60">
          Aucune vidéo rattachée pour le moment.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-1">
          {videos.map((vid, idx) => {
            const vidInstruments = Array.isArray(vid.instruments)
              ? vid.instruments
              : (vid.pupitre ? [vid.pupitre] : []);

            return (
              <div
                key={vid.id || idx}
                className="p-2.5 bg-white border border-encre-noire/25 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-wood">
                    Vidéo #{idx + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemove(vid.id)}
                    className="text-[10px] text-red-600 hover:text-red-700 font-black cursor-pointer uppercase flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-50"
                    title="Supprimer cette vidéo"
                  >
                    <span>🗑️</span>
                    <span>Supprimer</span>
                  </button>
                </div>

                {/* Ligne 1 : Titre / Libellé de la vidéo avec suggestions */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-cordel-master-dark/70">
                      Libellé / Titre de la vidéo :
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {SUGGESTIONS.map((sug) => (
                        <button key={sug} type="button" onClick={() => handleApplySuggestion(vid.id, sug)} className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/60 cursor-pointer">
                          +{sug}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="ex: Tuto Alfaia, Tuto Caixa/Tarol, Captation Recife 2024..."
                    value={vid.titre || ''}
                    onChange={(e) => handleUpdate(vid.id, 'titre', e.target.value)}
                    className="theme-input text-xs font-bold py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded"
                  />
                </div>

                {/* Ligne 2 : URL avec bouton d'appel au sélecteur YouTube */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-cordel-master-dark/70">
                    Lien URL de la vidéo :
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... ou Vimeo / Drive / MP4"
                      value={vid.url || ''}
                      onChange={(e) => handleUpdate(vid.id, 'url', e.target.value)}
                      className="theme-input text-xs font-mono py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded flex-1"
                    />
                    {onOpenPicker && (
                      <CordelButton
                        type="button"
                        variant="ocre"
                        useExtremeBorder={false}
                        onClick={() => onOpenPicker(idx, vidInstruments[0] || '')}
                        className="py-1 px-2 text-[10px] uppercase font-black shrink-0 flex items-center gap-1 shadow-2xs"
                        title={vidInstruments[0] ? `Choisir dans la playlist ${vidInstruments[0]}` : "Choisir parmi les vidéos de l'asso"}
                      >
                        <span>🎬</span>
                      </CordelButton>
                    )}
                  </div>
                </div>

                {/* Ligne 3 : Cases à cocher multi-instruments */}
                <VideoInstrumentCheckboxes
                  selectedInstruments={vidInstruments}
                  instrumentsList={instrumentsList}
                  onChange={(newInsts) => handleUpdate(vid.id, 'instruments', newInsts)}
                />
              </div>
            );
          })}

          {/* Boutons d'ajout sous la liste des vidéos */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15 flex-wrap">
            {onOpenPicker && (
              <CordelButton type="button" variant="default" useExtremeBorder={false} onClick={() => onOpenPicker(null)} className="py-1 px-2 text-[9px] uppercase font-black tracking-wider flex items-center gap-1" title="Choisir parmi les vidéos de l'asso">
                <span>🎬 Ajouter une vidéo de l'asso</span>
              </CordelButton>
            )}
            <CordelButton type="button" variant="ocre" useExtremeBorder={false} onClick={handleAddVideo} className="py-1 px-2 text-[9px] uppercase font-black tracking-wider">
              ➕ Ajouter une vidéo
            </CordelButton>
          </div>
        </div>
      )}
    </div>
  );
}
