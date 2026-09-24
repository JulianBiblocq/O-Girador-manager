import React from 'react';
import SongCard from '../SongCard';
import { useTranslation } from '../LanguageContext';

/**
 * Modale de consultation intégrale des Paroles / Toadas (< 70 lignes).
 * Ouvre directement la SongCard habituelle complète (paroles, phonétique, traduction).
 * En lecture seule, sans mode masqué et sans quiz.
 */
export default function PieceLyricsModal({
  isOpen,
  onClose,
  song,
  piece = null,
  groupId = null,
  profileData = null
}) {
  const { t } = useTranslation();

  if (!isOpen || !song) return null;

  const songTitle = song.titre || piece?.titre || 'Chant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel épuré */}
        <div className="w-full flex justify-between items-center px-4 py-2.5 bg-stone-100/90 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <span className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider truncate pr-2">
            🗣️ {t('paroles', 'Paroles')} — {songTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white cursor-pointer hover:bg-stone-800 transition-colors shadow-2xs"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps : Affichage direct de la SongCard complète */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-cordel-bg-light flex flex-col items-center">
          <div className="w-full max-w-[580px]">
            <SongCard
              song={song}
              defaultOpen={true}
              defaultRevisionMode={false}
              groupId={groupId}
              profileData={profileData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
