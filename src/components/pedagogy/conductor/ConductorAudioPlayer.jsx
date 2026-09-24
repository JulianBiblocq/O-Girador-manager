import React from 'react';

/**
 * Lecteur audio compact pour le repérage auditif du morceau lors du jeu du Conducteur.
 *
 * @param {Object} props
 * @param {string} props.audioUrl - URL du flux audio du morceau
 * @param {React.RefObject} props.audioRef - Référence du composant audio
 * @param {boolean} props.isPlaying - État de lecture
 * @param {Function} props.setIsPlaying - Définition de la lecture
 * @param {number} props.currentTime - Seconde courante
 * @param {Function} props.setCurrentTime - Mise à jour du temps courant
 * @param {number} props.duration - Durée totale en secondes
 * @param {Function} props.setDuration - Mise à jour de la durée
 * @param {number|null} props.currentPlayheadMeasure - Numéro de mesure courante
 */
export default function ConductorAudioPlayer({
  audioUrl,
  audioRef,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  currentPlayheadMeasure
}) {
  if (!audioUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="p-2.5 bg-[#fdfaf2] rounded-lg border border-encre-noire/25 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!audioRef.current) return;
              if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
              } else {
                audioRef.current.play().then(() => setIsPlaying(true));
              }
            }}
            className="px-3 py-1 rounded text-xs font-black uppercase bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 cursor-pointer shadow-xs"
          >
            {isPlaying ? '⏸ Pause' : '▶ Écouter'}
          </button>
          <span className="text-[11px] font-mono font-bold">
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
          </span>
        </div>
        <span className="text-[10px] font-bold text-cordel-wood">
          {currentPlayheadMeasure ? `Mesure courante : M${currentPlayheadMeasure}` : 'Prêt à l\'écoute'}
        </span>
      </div>
    </>
  );
}
