import React, { useState } from 'react';
import SongCard from '../SongCard';
import AutoEvalQuiz from '../pedagogy/AutoEvalQuiz';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel d'apprentissage des Paroles / Toadas (< 180 lignes).
 * Propose trois intentions d'apprentissage :
 * - Option A : Parolier complet (lecture intégrale, phonétique, traduction, lexique).
 * - Option B : Récitation masquée (mémoire active, filtres Puxador / Coro, flashcards cliquables).
 * - Action rapide : Quiz du chant (QCM auto-évalué via AutoEvalQuiz).
 */
export default function PieceLyricsModal({
  isOpen,
  onClose,
  song,
  piece = null,
  groupId,
  profileData = null
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('complet'); // 'complet' | 'recitation' | 'quiz'

  if (!isOpen || !song) return null;

  const songTitle = song.titre || piece?.titre || 'Chant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel avec onglets d'intention */}
        <div className="w-full flex flex-col border-b-2 border-dashed border-cordel-master-dark/20 bg-stone-100/90 shrink-0">
          <div className="flex justify-between items-center px-4 py-2.5">
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

          <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('complet')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'complet'
                  ? 'border-cordel-wood text-cordel-wood bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              📖 {t('parolierComplet', 'Parolier complet')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recitation')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'recitation'
                  ? 'border-[var(--color-cordel-ocre,#c05621)] text-[var(--color-cordel-ocre,#c05621)] bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              🙈 {t('recitationMasquee', 'Récitation masquée')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'border-[var(--color-cordel-vert,#2d6a4f)] text-[var(--color-cordel-vert,#2d6a4f)] bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              🎯 {t('quizChant', 'Quiz du chant')}
            </button>
          </div>
        </div>

        {/* Contenu de la modale */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-cordel-bg-light flex flex-col items-center">
          {activeTab === 'complet' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full max-w-[580px] flex items-center justify-between gap-2 p-2 rounded bg-white/80 border border-encre-noire/15 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold text-stone-600">
                  Paroles originales, phonétique, traduction et lexique complet
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('recitation')}
                    className="px-2.5 py-1 text-[11px] font-bold rounded border border-encre-noire/25 bg-stone-50 hover:bg-stone-100 text-stone-800 cursor-pointer shadow-2xs select-none"
                  >
                    🙈 Récitation
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className="px-2.5 py-1 text-[11px] font-black rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:opacity-90 cursor-pointer shadow-2xs select-none"
                  >
                    🎯 Quiz
                  </button>
                </div>
              </div>
              <div className="w-full max-w-[580px]">
                <SongCard
                  key="complet"
                  song={song}
                  defaultRevisionMode={false}
                  groupId={groupId}
                  profileData={profileData}
                />
              </div>
            </div>
          )}

          {activeTab === 'recitation' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full max-w-[580px] flex items-center justify-between gap-2 p-2 rounded bg-amber-50/90 border border-amber-300 flex-wrap text-left">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase text-amber-950">
                    Mode Récitation active
                  </span>
                  <span className="text-[10px] text-amber-900 font-medium">
                    Cliquez sur les blocs pour révéler les strophes ou cochez Puxador / Coro.
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('complet')}
                    className="px-2 py-1 text-[10px] font-bold rounded bg-white hover:bg-stone-100 text-stone-800 border border-encre-noire/20 cursor-pointer shadow-2xs select-none"
                  >
                    📖 Tout afficher
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('quiz')}
                    className="px-2.5 py-1 text-[11px] font-black rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:opacity-90 cursor-pointer shadow-2xs select-none"
                  >
                    🎯 Quiz
                  </button>
                </div>
              </div>
              <div className="w-full max-w-[580px]">
                <SongCard
                  key="recitation"
                  song={song}
                  defaultRevisionMode={true}
                  groupId={groupId}
                  profileData={profileData}
                />
              </div>
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="w-full flex justify-center">
              <AutoEvalQuiz
                isSong={true}
                songData={song}
                profileData={profileData}
                onClose={() => setActiveTab('complet')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
