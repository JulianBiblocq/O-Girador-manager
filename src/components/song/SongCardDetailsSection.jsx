// Section contextuelle d'une Toada : Traduction, Lexique, Anecdote et passerelles (< 130 lignes).
import React from 'react';
import { useTranslation } from '../LanguageContext';
import RepertoirePasserelleButton from '../repertoire/RepertoirePasserelleButton';
import { launchCantador } from '../../utils/trainingLauncher';
import { isCantadorValidated } from '../../utils/repertoireMatcher';
import { normalizePrintSections } from '../../utils/toadaPrintPrefsUtils';

export default function SongCardDetailsSection({
  song,
  groupId = null,
  onNavigateToView = null,
  isPrintVersion = false,
  printSections = null,
  hasLyricsAbove = true,
  renderFlashcard = null,
  hideCantadorButton = false
}) {
  const { t } = useTranslation();
  const vis = isPrintVersion && printSections ? normalizePrintSections(printSections) : null;
  const allow = (key) => (!vis ? true : Boolean(vis[key]));

  const canTrainInCantador = !hideCantadorButton && isCantadorValidated(song);

  const handleTrainInCantador = () => {
    launchCantador({
      songId: song?.id,
      toadaId: song?.cantadorToadaId,
      mode: 'eleve',
      groupId: groupId || song?.groupId
    });
  };

  const hasTranslation = Boolean(song?.traduction && String(song.traduction).trim() && allow('translation'));
  const hasLexique = Boolean(
    ((Array.isArray(song?.notesLexique) && song.notesLexique.length > 0) ||
      (typeof song?.notesLexique === 'string' && song.notesLexique.trim())) &&
      allow('lexicon')
  );
  const hasAnecdote = Boolean(song?.anecdote && String(song.anecdote).trim() && allow('anecdote'));
  const hasAnyDetail = hasTranslation || hasLexique || hasAnecdote;

  if (!hasAnyDetail && isPrintVersion) return null;

  const formatContent = (id, content) => (renderFlashcard ? renderFlashcard(id, content) : content);

  return (
    <div className="flex flex-col w-full text-left">
      {/* Filet de séparation uniquement si des paroles ET une section basse coexistent */}
      {hasLyricsAbove && hasAnyDetail && (
        <hr className="border-t-2 border-encre-noire/10 my-3 md:my-5 print:my-2.5" />
      )}

      {/* Traduction en pleine largeur */}
      {hasTranslation && (
        <div className="mb-3 break-inside-avoid">
          <h3 className="text-lg md:text-2xl font-heading tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 uppercase print:text-base">
            {t('pedagogy.cards.traductionEnFrancais')}
          </h3>
          <div className="font-medium text-[11px] md:text-[13px] leading-normal toada-print-translation-text text-encre-noire print:text-black px-1 md:px-2 italic whitespace-pre-wrap">
            {formatContent('traduction', song.traduction)}
          </div>
        </div>
      )}

      {/* Encart Lexique */}
      {hasLexique && (
        <div className="mt-3 bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-ocre,#c05621)] p-3 md:p-4 rounded-r-md print:mt-2 print:p-2.5 break-inside-avoid">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 flex items-center gap-2 print:text-[10.5px]">
            <span>📖</span>
            <span>{t('pedagogy.cards.lexiqueNotes')}</span>
          </h4>
          <div className="text-[10px] md:text-[11px] toada-print-notes-text font-medium text-encre-noire print:text-black leading-normal">
            {Array.isArray(song.notesLexique) ? (
              <ul className="flex flex-col gap-1.5">
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

      {/* Encart Anecdote */}
      {hasAnecdote && (
        <div className="mt-3 bg-[#f5f0e6]/40 dark:bg-[#201d1a]/40 border border-dashed border-encre-noire/20 p-3 md:p-4 rounded-md print:mt-2 print:p-2.5 break-inside-avoid">
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] font-heading mb-1 flex items-center gap-2 print:text-[10.5px]">
            <span>💡</span>
            <span>{t('pedagogy.cards.anecdote')}</span>
          </h4>
          <div className="text-[10px] md:text-[11px] toada-print-notes-text font-medium text-encre-noire/90 print:text-black/90 leading-normal italic whitespace-pre-wrap">
            {formatContent('anecdote', song.anecdote)}
          </div>
        </div>
      )}

      {/* Passerelles interactives Cantador & Répertoire (écran uniquement) */}
      {!isPrintVersion && (
        <div className="flex items-center justify-between gap-2 flex-wrap pt-3 mt-4 border-t border-dashed border-encre-noire/20 print:hidden">
          {canTrainInCantador && (
            <button
              type="button"
              onClick={handleTrainInCantador}
              className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 select-none"
              title={t('repertoire.tooltipTrainInCantador')}
            >
              <span>🎙️</span>
              <span>{t('repertoire.trainInCantador')}</span>
              <span className="text-[8px] opacity-70">↗</span>
            </button>
          )}
          <RepertoirePasserelleButton toadaId={song?.id} groupId={groupId || song?.groupId} onNavigateToView={onNavigateToView} />
        </div>
      )}
    </div>
  );
}
