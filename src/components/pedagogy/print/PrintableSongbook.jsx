// Configurateur et moteur d'impression complet du Carnet de chants Cordel (< 125 lignes).
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CordelButton from '../../CordelButton';
import SongCard from '../../SongCard';
import { useTranslation } from '../../LanguageContext';
import { useToadaPrintPrefs } from '../../../hooks/useToadaPrintPrefs';
import useAssociationPrintBranding from '../../../hooks/useAssociationPrintBranding';
import { buildSongbookSelection, toggleExcludedSongId } from '../../../utils/songbookSortUtils';
import { executeToadaWindowPrint } from '../../../utils/toadaPrintRunner';
import ToadaPrintControlsPanel from './ToadaPrintControlsPanel';
import SongbookCoverPage from './SongbookCoverPage';
import SongbookTocPage from './SongbookTocPage';

export function PrintableSongbook({
  isOpen = false,
  onClose,
  songs = [],
  groupId = null,
  userProfile = null,
  associationData = null
}) {
  const { t } = useTranslation();
  const prefs = useToadaPrintPrefs(userProfile);
  const { groupName, logoUrl } = useAssociationPrintBranding(groupId || userProfile?.groupId, associationData);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [excludedIds, setExcludedIds] = useState(() => new Set());
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isOpen) setExcludedIds(new Set());
  }, [isOpen]);

  const { candidateSongs, selectedIds, indexedSongs } = useMemo(
    () => buildSongbookSelection(songs, { includeArchived, excludedIds, sortBy: prefs.songbookOptions.sortBy }),
    [songs, includeArchived, excludedIds, prefs.songbookOptions.sortBy]
  );

  if (!isOpen && !isPrinting) return null;

  const handleLaunchPrint = () => {
    if (indexedSongs.length === 0) return;
    setIsPrinting(true);
    executeToadaWindowPrint({
      format: prefs.format,
      bwMode: prefs.bwMode,
      margins: prefs.margins,
      onDone: () => { setIsPrinting(false); onClose?.(); }
    });
  };

  const pageBreakClass = prefs.songbookOptions.startOnOddPage
    ? 'print-song-page print-song-page-odd'
    : 'print-song-page';

  return (
    <>
      {isOpen && !isPrinting && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 print:hidden backdrop-blur-xs" onClick={onClose}>
          <div className="bg-[#fdfaf2] dark:bg-[#1a1816] rounded-xl shadow-2xl max-w-xl w-full border-2 border-encre-noire overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#f5f0e6] dark:bg-[#2a2622] px-4 py-3 border-b-2 border-encre-noire flex justify-between items-center gap-3 shrink-0">
              <h2 className="font-heading tracking-widest text-lg sm:text-xl text-encre-noire dark:text-stone-200">
                🖨️ {t('toadaPrint.modalTitleSongbook')}
              </h2>
              <button type="button" onClick={onClose} className="cordel-modal-close-btn" aria-label={t('common.close')}>
                <span className="text-xl font-black leading-none pointer-events-none">✕</span>
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <ToadaPrintControlsPanel
                prefs={prefs}
                songbookExtra={{
                  songbookOptions: prefs.songbookOptions,
                  onUpdateOptions: prefs.updateSongbookOptions,
                  includeArchived,
                  onToggleArchived: setIncludeArchived,
                  candidateSongs,
                  selectedIds,
                  onToggleSongId: (id) => setExcludedIds((prev) => toggleExcludedSongId(prev, id)),
                  onSelectAll: () => setExcludedIds(new Set()),
                  onDeselectAll: () => setExcludedIds(new Set(candidateSongs.map((s) => s.id)))
                }}
              />
            </div>

            <div className="px-4 py-3 border-t border-encre-noire/15 bg-[#f5f0e6]/60 dark:bg-[#221f1c] flex justify-end gap-2.5 shrink-0">
              <CordelButton variant="secondary" onClick={onClose}>{t('toadaPrint.btnCancel')}</CordelButton>
              <CordelButton variant="primary" disabled={indexedSongs.length === 0} onClick={handleLaunchPrint} className="bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire disabled:opacity-45">
                🖨️ {t('toadaPrint.btnPrint')} ({indexedSongs.length})
              </CordelButton>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isPrinting && createPortal(
        <div className="toada-print-portal print:block bg-white w-full">
          {prefs.songbookOptions.includeCover && (
            <SongbookCoverPage groupName={groupName} logoUrl={logoUrl} subtitle={prefs.songbookOptions.subtitle} songsCount={indexedSongs.length} bwMode={prefs.bwMode} startOnOddPage={prefs.songbookOptions.startOnOddPage} />
          )}
          {prefs.songbookOptions.includeToc && (
            <SongbookTocPage indexedSongs={indexedSongs} sortBy={prefs.songbookOptions.sortBy} bwMode={prefs.bwMode} startOnOddPage={prefs.songbookOptions.startOnOddPage} groupName={groupName} />
          )}
          {indexedSongs.map(({ song, formattedIndex }) => (
            <div key={song.id} className={pageBreakClass}>
              <SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={prefs.sections} lyricsColumnsMode={prefs.lyricsColumnsMode} songbookIndex={formattedIndex} groupId={groupId} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export const SongbookPrintable = PrintableSongbook;
export default PrintableSongbook;
