import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Sélecteur dynamique de vidéos libres pour une pièce du répertoire.
 * Permet à l'association d'ajouter autant de vidéos qu'elle le souhaite
 * avec un libellé totalement personnalisé (ex: "Tuto Alfaia", "Live Recife", etc.).
 *
 * @param {Array} videos - Liste des vidéos actuelles [{ id, titre, url }]
 * @param {Function} onChange - Callback de mise à jour de la liste
 */
export default function RepertoireVideosPicker({ videos = [], onChange }) {
  const SUGGESTIONS = ['Tuto', 'Captation', 'Répétition', 'Chorégraphie', 'Ralenti'];

  const handleAddVideo = () => {
    const newVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      titre: '',
      url: ''
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🎬</span>
          <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
            Vidéos du morceau ({videos.length})
          </label>
        </div>

        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={false}
          onClick={handleAddVideo}
          className="py-1 px-2.5 text-[9.5px] uppercase font-black tracking-wider"
        >
          ➕ Ajouter une vidéo
        </CordelButton>
      </div>

      <p className="text-[10px] text-encre-noire/70 font-semibold italic leading-tight">
        Ajoutez des liens vidéo (YouTube, Vimeo, Google Drive, MP4) avec vos propres libellés (ex : tuto, concert, etc.).
      </p>

      {videos.length === 0 ? (
        <div className="py-2.5 text-center text-[10px] text-encre-noire/50 italic border border-dashed border-encre-noire/15 rounded bg-white/60">
          Aucune vidéo rattachée pour le moment.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 mt-1">
          {videos.map((vid, idx) => (
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

              {/* Ligne 1 : Titre personnalisé */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <span className="text-[9px] font-black uppercase text-cordel-master-dark/70">
                    Libellé / Titre de la vidéo :
                  </span>
                  {/* Suggestions rapides de libellés */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleApplySuggestion(vid.id, sug)}
                        className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/60 cursor-pointer"
                      >
                        +{sug}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="ex: Tuto Alfaia, Captation Recife 2024, Décomposition Virada..."
                  value={vid.titre || ''}
                  onChange={(e) => handleUpdate(vid.id, 'titre', e.target.value)}
                  className="theme-input text-xs font-bold py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded"
                />
              </div>

              {/* Ligne 2 : URL */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-cordel-master-dark/70">
                  Lien URL de la vidéo :
                </span>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... ou Vimeo / Drive / MP4"
                  value={vid.url || ''}
                  onChange={(e) => handleUpdate(vid.id, 'url', e.target.value)}
                  className="theme-input text-xs font-mono py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
