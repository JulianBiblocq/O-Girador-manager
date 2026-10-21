import React from 'react';
import { useTranslation } from '../LanguageContext';
import RepertoirePasserelleButton from '../repertoire/RepertoirePasserelleButton';
import { launchCantador } from '../../utils/trainingLauncher';

/**
 * Section contextuelle "Carnet de Chants" (style Cordel du 14-16 octobre) (< 125 lignes) :
 * Traduction en pleine largeur, Encart Lexique avec bordure gauche orange, Anecdote,
 * et passerelles Cantad'Or & Répertoire.
 */
export default function SongCardDetailsSection({
  song,
  groupId = null,
  onNavigateToView = null,
  isPrintVersion = false,
  printSections = null,
  renderFlashcard = null
}) {
  const { t } = useTranslation();

  const getVisibility = (secKey) => {
    if (!isPrintVersion) return true;
    if (!printSections) return true;
    return Boolean(printSections[secKey]);
  };

  const handleTrainInCantador = () => {
    launchCantador({
      songId: song?.id,
      toadaId: song?.cantadorToadaId,
      mode: 'eleve',
      groupId: groupId || song?.groupId
    });
  };

  const hasTranslation = Boolean(song?.traduction && getVisibility('traduction'));
  const hasLexique = Boolean(
    ((Array.isArray(song?.notesLexique) && song.notesLexique.length > 0) ||
      (typeof song?.notesLexique === 'string' && song.notesLexique.trim())) &&
      getVisibility('lexique')
  );
  const hasAnecdote = Boolean(song?.anecdote && getVisibility('anecdote'));

  if (!hasTranslation && !hasLexique && !hasAnecdote && isPrintVersion) {
    return null;
  }

  const formatContent = (id, content) => {
    if (renderFlashcard) return renderFlashcard(id, content);
    return content;
  };

  return (
    <div className="flex flex-col w-full text-left">
      {/* 1. Filet de séparation Cordel */}
      {(hasTranslation || hasLexique || hasAnecdote) && (
        <hr className="border-t-2 border-encre-noire/10 my-4 md:my-6 print:hidden" />
      )}

      {/* 2. Section Traduction en Français (pleine largeur) */}
      {hasTranslation && (
        <div className="mb-4">
          <h3 className="text-lg md:text-2xl font-heading tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 uppercase print:text-lg">
            {t('pedagogy.cards.traductionEnFrancais') || 'Traduction en Français'}
          </h3>
          <div className="font-medium text-[11px] md:text-[13px] leading-normal print:leading-snug print:text-[11px] text-encre-noire px-1 md:px-2 italic whitespace-pre-wrap">
            {formatContent('traduction', song.traduction)}
          </div>
        </div>
      )}

      {/* 3. Encart Lexique avec bordure gauche orange */}
      {hasLexique && (
        <div className="mt-4 bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-ocre,#c05621)] p-3 md:p-4 rounded-r-md print:mt-2">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 flex items-center gap-2 print:text-[10px]">
            <span>📖</span>
            <span>{t('pedagogy.cards.lexiqueNotes') || 'Lexique & Notes'}</span>
          </h4>
          <div className="text-[10px] md:text-[11px] print:text-[9px] font-medium text-encre-noire leading-normal print:leading-snug">
            {Array.isArray(song.notesLexique) ? (
              <ul className="flex flex-col gap-2">
                {song.notesLexique.map((note, index) => (
                  <li key={index} className="flex w-full">
                    <div className="w-full">
                      <span className="font-bold mr-1">{note?.mot || note?.mot_cle} :</span>
                      <span>{note?.explication || note?.definition}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="whitespace-pre-wrap">{song.notesLexique}</div>
            )}
          </div>
        </div>
      )}

      {/* 4. Section Anecdote */}
      {hasAnecdote && (
        <div className="mt-4 bg-[#f5f0e6]/40 dark:bg-[#201d1a]/40 border border-dashed border-encre-noire/20 p-3 md:p-4 rounded-md print:mt-2">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] font-heading mb-1 flex items-center gap-2 print:text-[10px]">
            <span>💡</span>
            <span>{t('pedagogy.cards.anecdote') || 'Anecdote'}</span>
          </h4>
          <div className="text-[10px] md:text-[11px] print:text-[9px] font-medium text-encre-noire/90 leading-normal print:leading-snug italic whitespace-pre-wrap">
            {formatContent('anecdote', song.anecdote)}
          </div>
        </div>
      )}

      {/* 5. Passerelles Écosystème Cantad'Or & Répertoire */}
      {!isPrintVersion && (
        <div className="flex items-center justify-between gap-2 flex-wrap pt-3 mt-4 border-t border-dashed border-encre-noire/20 print:hidden">
          <button
            type="button"
            onClick={handleTrainInCantador}
            className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 select-none"
            title={t('repertoire.tooltipTrainInCantador') || "S'entraîner dans Cantador"}
          >
            <span>🎙️</span>
            <span>{t('repertoire.trainInCantador') || "S'entraîner dans Cantad'Or"}</span>
            <span className="text-[8px] opacity-70">↗</span>
          </button>

          <RepertoirePasserelleButton
            toadaId={song?.id}
            groupId={groupId || song?.groupId}
            onNavigateToView={onNavigateToView}
          />
        </div>
      )}
    </div>
  );
}
