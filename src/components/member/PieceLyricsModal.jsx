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

  if (!isOpen) return null;

  if (!song) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md p-6 bg-[#fdfaf2] rounded-lg shadow-2xl border-2 border-encre-noire text-center">
          <p className="text-xs font-bold text-stone-600 mb-4">{t('repertoire.emptyLyrics') || t('pedagogy.modals.aucuneParoleRenseigneePour')}</p>
          <button type="button" onClick={onClose} className="px-3 py-1 bg-stone-200 border border-encre-noire rounded font-bold text-xs cursor-pointer">
            {t('repertoire.closeModal') || t('pedagogy.modals.fermer')}
          </button>
        </div>
      </div>
    );
  }

  const songTitle = song.titre || piece?.titre || 'Chant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left mt-2 sm:mt-0">
        {/* En-tête Cordel épuré */}
        <div className="w-full flex justify-between items-start gap-3 p-4 bg-stone-100/90 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <div className="flex-1 min-w-0 pr-2">
            <span className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider break-words block">
            🗣️ {t('repertoire.lyricsTitle') || t('pedagogy.modals.parolesDuMorceau')} — {songTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-lg text-white hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0 select-none touch-manipulation"
            title={t('repertoire.closeModal') || "Fermer"}
          >
              <span className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white hover:bg-red-700 transition-colors shadow-2xs pointer-events-none">
                ✕
              </span>
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
