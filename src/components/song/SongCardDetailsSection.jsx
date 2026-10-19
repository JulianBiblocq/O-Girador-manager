import React from 'react';
import { useTranslation } from '../LanguageContext';
import RepertoirePasserelleButton from '../repertoire/RepertoirePasserelleButton';

/**
 * Section contextuelle de la fiche SongCard :
 * Traduction, Lexique, Anecdote, Audio témoin et Passerelle Répertoire.
 */
export default function SongCardDetailsSection({
  song,
  groupId = null,
  onNavigateToView = null
}) {
  const { t } = useTranslation();
  const audioSrc = song?.audioUrl || (song?.fileUrl && /\.(mp3|wav|ogg|m4a|aac)$/i.test(song.fileUrl) ? song.fileUrl : null);

  return (
    <div className="flex flex-col gap-3.5 w-full text-left pt-2 border-t-2 border-dashed border-cordel-master-dark/20">
      {/* 1. Traduction */}
      {song?.traduction && (
        <div className="p-3 rounded-[4px_6px_3px_5px] bg-amber-50/70 border border-amber-200">
          <span className="text-[9.5px] font-black uppercase text-amber-950 flex items-center gap-1 mb-1">
            <span>🌐</span> {t('repertoire.translationTitle') || "Traduction française"}
          </span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">
            {song.traduction}
          </p>
        </div>
      )}

      {/* 2. Anecdote & Contexte historique */}
      {song?.anecdote && (
        <div className="p-3 rounded-[4px_6px_3px_5px] bg-stone-50 border border-stone-200">
          <span className="text-[9.5px] font-black uppercase text-stone-700 flex items-center gap-1 mb-1">
            <span>💡</span> {t('repertoire.contextTitle') || "Contexte & Histoire"}
          </span>
          <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
            {song.anecdote}
          </p>
        </div>
      )}

      {/* 3. Audio Témoin */}
      {audioSrc && (
        <div className="flex items-center gap-2 p-2.5 rounded-[4px_6px_3px_5px] bg-cordel-bg-light border border-encre-noire/20">
          <span className="text-xs select-none">🎧</span>
          <span className="text-[10px] font-bold text-stone-600 hidden sm:inline">
            {t('repertoire.witnessAudio') || "Audio témoin :"}
          </span>
          <audio controls src={audioSrc} className="w-full h-8" preload="none" />
        </div>
      )}

      {/* 4. Passerelle vers la fiche Répertoire */}
      <div className="flex justify-end pt-1">
        <RepertoirePasserelleButton
          toadaId={song?.id}
          groupId={groupId || song?.groupId}
          onNavigateToView={onNavigateToView}
        />
      </div>
    </div>
  );
}
