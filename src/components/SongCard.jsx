// Fiche de Chant (Toada) Cordel : lecture interactive, révision 1-clic et impression adaptative (< 138 lignes).
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import PrintConfigModal from './PrintConfigModal';
import PrintableSongbook from './pedagogy/print/PrintableSongbook';
import SongCardHeader from './song/SongCardHeader'; // intègre RepertoirePasserelleButton
import SongCardLyricsSection from './song/SongCardLyricsSection';
import SongCardDetailsSection from './song/SongCardDetailsSection';
import { useTranslation } from './LanguageContext';
import useSongCardController from '../hooks/useSongCardController';
import { normalizePrintSections, resolveToadaPrintDensity } from '../utils/toadaPrintPrefsUtils';
import { extractCleanSongLyrics, countNonEmptyLyricsLines } from '../utils/songCardLyricsUtils';

export default function SongCard({
  song,
  isPrintVersion = false,
  defaultRevisionMode = true,
  onPrintAll,
  allDocsToPrint = null,
  printSections = null,
  lyricsColumnsMode = 'auto',
  songbookIndex = null,
  isRevisionRequested = null,
  onToggleRevision = null,
  profileData = null,
  userId = null,
  groupId = null,
  onNavigateToView = null,
  hideCantadorButton = false
}) {
  const { t } = useTranslation();
  const [activePuxador, setActivePuxador] = useState(!defaultRevisionMode || isPrintVersion);
  const [activeChoeur, setActiveChoeur] = useState(!defaultRevisionMode || isPrintVersion);
  const isRevealedMode = isPrintVersion || !defaultRevisionMode;

  const {
    effectiveGroupId, effectiveIsRequested, localReveals, setLocalReveals,
    showPrintModal, setShowPrintModal, showSongbookModal, setShowSongbookModal,
    localPrintJob, handleToggleClick, handleConfirmSinglePrint
  } = useSongCardController({
    song, isPrintVersion, isRevisionRequested, onToggleRevision, profileData, userId, groupId, onPrintAll
  });

  if (!song) return null;

  const normSections = isPrintVersion ? normalizePrintSections(printSections) : null;
  const showOrig = normSections ? normSections.original : true;
  const showPhon = normSections ? normSections.phonetic : true;

  const { origLines, phonLines } = extractCleanSongLyrics(song);
  const hasOrig = showOrig && countNonEmptyLyricsLines(origLines) > 0;
  const hasPhon = showPhon && countNonEmptyLyricsLines(phonLines) > 0;
  const activeLangCount = (hasOrig ? 1 : 0) + (hasPhon ? 1 : 0);

  const hasBottomSections = Boolean(
    (song.traduction && String(song.traduction).trim() && (!normSections || normSections.translation)) ||
    (((Array.isArray(song.notesLexique) && song.notesLexique.length > 0) || (typeof song.notesLexique === 'string' && song.notesLexique.trim())) && (!normSections || normSections.lexicon)) ||
    (song.anecdote && String(song.anecdote).trim() && (!normSections || normSections.anecdote))
  );

  const densityClass = isPrintVersion ? `toada-density-${resolveToadaPrintDensity({ activeLangCount, hasBottomSections })}` : '';
  const hasSongbookDocs = Array.isArray(allDocsToPrint) && allDocsToPrint.length > 0;

  const renderFlashcard = (id, content, extraClass = '') => {
    if (isRevealedMode) return <div className={extraClass}>{content}</div>;
    if (localReveals[id]) {
      return <div onClick={() => setLocalReveals((p) => ({ ...p, [id]: false }))} className={`${extraClass} cursor-pointer hover:opacity-80`}>{content}</div>;
    }
    return (
      <div onClick={() => setLocalReveals((p) => ({ ...p, [id]: true }))} className={`relative cursor-pointer group rounded border border-dashed border-cordel-master-dark/30 overflow-hidden bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center min-h-[1.5em] min-w-[60px] ${extraClass}`}>
        <div className="absolute inset-0 bg-[#fdfaf2] dark:bg-[#1a1816] flex items-center justify-center z-10">
          <span className="bg-cordel-wood text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shadow-md">👁️ {t('pedagogy.btnReveal')}</span>
        </div>
        <div className="opacity-0 select-none">{content}</div>
      </div>
    );
  };

  return (
    <>
      <div id={`song-card-${song?.id || 'temp'}`} className={`${densityClass} bg-[#fdfaf2] dark:bg-[#1a1816] border-2 border-encre-noire rounded-lg shadow-[3px_3px_0px_0px_#181716] w-full max-w-3xl mx-auto flex flex-col relative print:shadow-none print:border-none print:max-w-full print:min-h-0 print:h-auto print:mx-0 print:overflow-visible text-left`}>
        {!isPrintVersion && (
          <div className="absolute top-3 left-3 z-20 print:hidden flex items-center gap-2">
            <button type="button" onClick={() => setShowPrintModal(true)} title={t('pedagogy.cards.imprimerCetteFiche')} className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-cordel-master-dark/30 text-cordel-master-dark/60 hover:bg-neutral-100 transition-all hover:text-cordel-wood hover:border-cordel-wood cursor-pointer bg-white">🖨️</button>
            {song?.id && (
              <button type="button" onClick={handleToggleClick} className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all border shadow-xs flex items-center gap-1 cursor-pointer ${effectiveIsRequested ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-[#1b4332]' : 'bg-[#fdfaf2] text-cordel-master-dark hover:bg-white border-encre-noire/30'}`}>
                <span>🙋</span>
                <span>{effectiveIsRequested ? t('pedagogy.revisionRequestedNotice') : t('pedagogy.btnAskToRevise')}</span>
              </button>
            )}
          </div>
        )}

        <table className="w-full table-fixed border-collapse toada-print-table">
          <thead className="table-header-group">
            <tr><td className="p-4 md:p-6 pb-0 pt-4 print:p-0"><SongCardHeader song={song} isPrintVersion={isPrintVersion} songbookIndex={songbookIndex} groupId={effectiveGroupId} onNavigateToView={onNavigateToView} renderFlashcard={renderFlashcard} /></td></tr>
          </thead>
          <tbody>
            {(!isPrintVersion || activeLangCount > 0) && (
              <tr>
                <td className="px-4 md:px-6 pb-2 pt-1 md:pt-2 print:px-0 print:pt-1 toada-lyrics-print-guard">
                  {!isRevealedMode && (
                    <div className="flex justify-center gap-4 md:gap-6 py-2 mb-4 bg-cordel-wood/5 rounded border border-cordel-wood/20">
                      <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={activePuxador} onChange={(e) => setActivePuxador(e.target.checked)} className="accent-cordel-wood w-4 h-4 cursor-pointer" /><span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">{t('pedagogy.cards.puxadorSoliste')}</span></label>
                      <label className="flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" checked={activeChoeur} onChange={(e) => setActiveChoeur(e.target.checked)} className="accent-cordel-wood w-4 h-4 cursor-pointer" /><span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-encre-noire">{t('pedagogy.cards.coroChUr')}</span></label>
                    </div>
                  )}
                  <SongCardLyricsSection song={song} activePuxador={activePuxador} activeChoeur={activeChoeur} isRevealedMode={isRevealedMode} isPrintVersion={isPrintVersion} showOriginal={showOrig} showPhonetic={showPhon} lyricsColumnsMode={lyricsColumnsMode} hasBottomSections={hasBottomSections} />
                </td>
              </tr>
            )}
            {(!isPrintVersion || hasBottomSections) && (
              <tr>
                <td className="px-4 md:px-6 pb-6 pt-1 print:px-0 print:pb-0">
                  <SongCardDetailsSection song={song} groupId={effectiveGroupId} onNavigateToView={onNavigateToView} isPrintVersion={isPrintVersion} printSections={normSections} hasLyricsAbove={activeLangCount > 0} renderFlashcard={renderFlashcard} hideCantadorButton={hideCantadorButton} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPrintModal && (
        <PrintConfigModal title={song?.titre} onClose={() => setShowPrintModal(false)} onConfirm={handleConfirmSinglePrint} allowBulk={Boolean(onPrintAll || hasSongbookDocs)} onOpenSongbook={hasSongbookDocs ? () => { setShowPrintModal(false); setShowSongbookModal(true); } : null} userProfile={profileData} />
      )}
      {hasSongbookDocs && (
        <PrintableSongbook isOpen={showSongbookModal} onClose={() => setShowSongbookModal(false)} songs={allDocsToPrint} groupId={effectiveGroupId} userProfile={profileData} />
      )}
      {localPrintJob && createPortal(
        <div className="toada-print-portal print:block bg-white w-full"><div className="print-song-page"><SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={localPrintJob.sections} lyricsColumnsMode={localPrintJob.lyricsColumnsMode} groupId={effectiveGroupId} /></div></div>,
        document.body
      )}
    </>
  );
}
