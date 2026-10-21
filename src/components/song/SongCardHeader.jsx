import React from 'react';
import { useTranslation } from '../LanguageContext';
import RepertoirePasserelleButton from '../repertoire/RepertoirePasserelleButton';

/**
 * En-tête noble "Carnet de Chants" (style Cordel du 14-16 octobre) (< 90 lignes) :
 * Grand titre centré ocre, nação & rythme en sous-titre, filet horizontal ocre 4px,
 * passerelle répertoire et lecteur audio témoin.
 */
export default function SongCardHeader({
  song,
  isPrintVersion = false,
  groupId = null,
  onNavigateToView = null,
  renderFlashcard = null
}) {
  const { t } = useTranslation();
  const audioSrc = song?.audioUrl || (song?.fileUrl && /\.(mp3|wav|ogg|m4a|aac)$/i.test(song.fileUrl) ? song.fileUrl : null);

  const formatSub = (id, content) => {
    if (renderFlashcard) return renderFlashcard(id, content);
    return content;
  };

  return (
    <div className="flex flex-col gap-1 md:gap-2 mt-2 md:mt-0 text-left">
      {/* 1. Titre majestueux centré */}
      <div className="flex flex-col items-center justify-center relative w-full">
        <h1 className="text-2xl md:text-4xl font-heading tracking-widest text-[var(--color-cordel-ocre,#c05621)] text-center mt-1 print:mt-0 print:text-3xl relative z-20 uppercase">
          {song?.titre || t('pedagogy.cards.titreInconnu') || 'Chant sans titre'}
        </h1>
      </div>

      {/* 2. Sous-titre : Nação à gauche | Rythme à droite */}
      <div className="flex justify-between items-center mt-1 text-[10px] md:text-sm font-extrabold uppercase tracking-widest text-cordel-master-dark opacity-80">
        <div className="text-left font-heading text-base md:text-xl lowercase tracking-wider capitalize print:text-base">
          {song?.nacao ? formatSub('nacao', <span>{song.nacao}</span>) : null}
        </div>
        <div className="text-right font-heading text-base md:text-xl lowercase tracking-wider capitalize print:text-base">
          {song?.rythme ? formatSub('rythme', <span>{song.rythme}</span>) : null}
        </div>
      </div>

      {/* 3. Passerelle directe vers la fiche Répertoire */}
      {!isPrintVersion && (
        <div className="mt-1 flex justify-center print:hidden">
          <RepertoirePasserelleButton
            toadaId={song?.id}
            groupId={groupId || song?.groupId}
            onNavigateToView={onNavigateToView}
          />
        </div>
      )}

      {/* 4. Grand filet horizontal ocre Cordel */}
      <hr className="border-t-4 border-[var(--color-cordel-ocre,#c05621)] mt-2 print:mt-1 mb-1 md:mb-2" />

      {/* 5. Lecteur Audio Témoin */}
      {audioSrc && !isPrintVersion && (
        <div className="my-2 p-1.5 bg-[#f5f0e6]/70 dark:bg-[#201d1a] border border-cordel-wood/20 rounded flex items-center gap-2 shadow-xs">
          <span className="text-xs">🎵</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-wood shrink-0">
            {t('pedagogy.cards.audioTemoin') || 'Audio témoin'}
          </span>
          <audio controls src={audioSrc} className="w-full h-7" preload="none" />
        </div>
      )}
    </div>
  );
}
