import React from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import { extractYouTubePlaylistId } from '../../../utils/mediaUrlUtils';

/**
 * Bloc Cordel de configuration des Playlists YouTube de l'association.
 * Permet de définir dynamiquement les playlists des pupitres, ateliers et concerts.
 *
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association
 * @param {Function} props.handleChange - Handler de mise à jour du formulaire
 * @param {boolean} [props.disabled=false] - Désactive les interactions pendant la sauvegarde
 */
export default function YouTubePlaylistsBlock({ formData, handleChange, disabled = false }) {
  const playlists = Array.isArray(formData?.youtubePlaylists) ? formData.youtubePlaylists : [];

  const handleAddPlaylist = () => {
    const newEntry = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: '',
      playlistId: ''
    };
    handleChange('youtubePlaylists', [...playlists, newEntry]);
  };

  const handleUpdate = (index, field, value) => {
    let finalValue = value;
    if (field === 'playlistId') {
      const extracted = extractYouTubePlaylistId(value);
      if (extracted) {
        finalValue = extracted;
      }
    }
    const updated = [...playlists];
    updated[index] = { ...updated[index], [field]: finalValue };
    handleChange('youtubePlaylists', updated);
  };

  const handleRemove = (index) => {
    const updated = playlists.filter((_, i) => i !== index);
    handleChange('youtubePlaylists', updated);
  };

  return (
    <CordelCard
      variant="default"
      className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood">
              Playlists YouTube de l'association
            </h4>
            <p className="text-[10px] text-cordel-master-dark/70 font-semibold">
              Instruments, pupitres, ateliers, lives et captations pour sélection rapide en 1 clic.
            </p>
          </div>
        </div>

        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={false}
          onClick={handleAddPlaylist}
          disabled={disabled}
          className="text-[9.5px] font-black uppercase tracking-wider py-1 px-3 self-start sm:self-auto"
        >
          ➕ Ajouter une playlist
        </CordelButton>
      </div>

      {playlists.length === 0 ? (
        <div className="py-4 px-3 text-center text-[11px] text-cordel-master-dark/60 italic border border-dashed border-cordel-master-dark/20 rounded bg-[#faf6ee]">
          Aucune playlist configurée. Ajoutez vos playlists YouTube (ex: Alfaias, Chœur, Prestations) pour alimenter le sélecteur vidéo.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {playlists.map((pl, idx) => (
            <div
              key={pl.id || idx}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px]"
            >
              {/* Nom / Pupitre */}
              <div className="flex-1 sm:w-1/3">
                <input
                  type="text"
                  placeholder="ex: Alfaias, Chœur, Live 2024..."
                  value={pl.label || ''}
                  onChange={(e) => handleUpdate(idx, 'label', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-cordel-master-dark/30 rounded focus:border-cordel-wood focus:outline-hidden"
                />
              </div>

              {/* Lien ou ID de la Playlist */}
              <div className="flex-2 sm:w-1/2">
                <input
                  type="text"
                  placeholder="Lien YouTube ou ID (ex: PL...)"
                  value={pl.playlistId || ''}
                  onChange={(e) => handleUpdate(idx, 'playlistId', e.target.value)}
                  onBlur={(e) => handleUpdate(idx, 'playlistId', e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-cordel-master-dark/30 rounded focus:border-cordel-wood focus:outline-hidden"
                />
              </div>

              {/* Bouton Suppression */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                disabled={disabled}
                className="self-end sm:self-center p-1.5 text-cordel-wood hover:bg-red-50 rounded transition-colors cursor-pointer"
                title="Supprimer cette playlist"
                aria-label="Supprimer la playlist"
              >
                <span>🗑️</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </CordelCard>
  );
}
