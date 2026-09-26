import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Bloc de sélection et de prévisualisation de la source vidéo
 * pour l'affectation par lot (< 120 lignes).
 * Permet de saisir l'URL ou de piocher dans les playlists YouTube de l'association.
 */
export default function BatchAssignVideoSource({
  videoTitle,
  setVideoTitle,
  videoUrl,
  setVideoUrl,
  ytMedia,
  onOpenPicker
}) {
  return (
    <div className="p-3 bg-white rounded border border-encre-noire/20 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase text-cordel-wood">
          Source de la vidéo
        </span>
        <button
          type="button"
          onClick={onOpenPicker}
          className="px-2.5 py-1 bg-[var(--color-cordel-ocre,#c05621)] text-white text-[9.5px] font-black uppercase rounded-[4px_6px_3px_5px] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs font-extrabold"
          title="Piocher une vidéo parmi les playlists de l'association"
        >
          <span>📺</span>
          <span>Piocher dans mes playlists</span>
        </button>
      </div>

      {/* Bouton d'action directe invitant à piocher dans les playlists */}
      {!videoUrl && (
        <button
          type="button"
          onClick={onOpenPicker}
          className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/90 border-2 border-dashed border-amber-400/80 text-amber-950 rounded-[4px_6px_3px_5px] flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-all shadow-2xs"
        >
          <span>📺</span>
          <span>Afficher les vidéos de mes playlists</span>
          <span className="text-[10px] opacity-70">➔</span>
        </button>
      )}

      <div className="flex gap-3 items-center">
        {ytMedia?.videoId ? (
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenPicker}
            title="Cliquer pour changer de vidéo depuis vos playlists"
            className="relative group cursor-pointer shrink-0"
          >
            <img
              src={`https://img.youtube.com/vi/${ytMedia.videoId}/mqdefault.jpg`}
              alt="Miniature"
              className="w-24 aspect-video object-cover rounded border border-encre-noire/30 group-hover:opacity-85 transition-opacity"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded">
              Changer
            </span>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={onOpenPicker}
            title="Cliquer pour choisir depuis vos playlists"
            className="w-24 aspect-video bg-stone-100 hover:bg-stone-200 border border-dashed border-encre-noire/25 rounded flex flex-col items-center justify-center text-stone-600 cursor-pointer shrink-0 transition-colors"
          >
            <span className="text-xl">🎬</span>
            <span className="text-[8px] font-black uppercase text-stone-500">Playlists</span>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Titre / libellé de la vidéo (ex: Tuto de base, Captation...)"
            className="theme-input text-xs font-bold py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded w-full"
          />
          <div className="flex items-center gap-1.5">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="theme-input text-xs font-mono py-1 px-2 bg-[#fdfaf2] border border-encre-noire/30 rounded flex-1"
            />
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={false}
              onClick={onOpenPicker}
              className="py-1 px-2 text-[9.5px] uppercase font-black shrink-0 flex items-center gap-1 shadow-2xs"
              title="Parcourir les playlists YouTube"
            >
              <span>📺</span>
              <span className="hidden sm:inline">Playlists</span>
            </CordelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
