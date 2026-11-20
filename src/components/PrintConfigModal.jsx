// Modale de configuration d'impression d'une Toada isolée branchée sur ToadaPrintControlsPanel (< 95 lignes).
import React from 'react';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useToadaPrintPrefs } from '../hooks/useToadaPrintPrefs';
import ToadaPrintControlsPanel from './pedagogy/print/ToadaPrintControlsPanel';

export default function PrintConfigModal({
  onClose,
  onConfirm,
  title = null,
  allowBulk = false,
  onOpenSongbook = null,
  userProfile = null
}) {
  const { t } = useTranslation();
  const prefs = useToadaPrintPrefs(userProfile);

  const buildPrintPayload = (isBulk = false) => ({
    format: prefs.format,
    isBW: prefs.bwMode,
    bwMode: prefs.bwMode,
    isBulk,
    printSections: prefs.sections,
    sections: prefs.sections,
    lyricsColumnsMode: prefs.lyricsColumnsMode,
    margins: prefs.margins
  });

  const handlePrint = () => onConfirm(buildPrintPayload(false));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 print:hidden backdrop-blur-xs" onClick={onClose}>
      <div className="bg-[#fdfaf2] dark:bg-[#1a1816] rounded-xl shadow-2xl max-w-lg w-full border-2 border-encre-noire overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="bg-[#f5f0e6] dark:bg-[#2a2622] px-4 py-3 border-b-2 border-encre-noire flex justify-between items-center gap-3 shrink-0">
          <h2 className="font-heading tracking-widest text-lg sm:text-xl text-encre-noire dark:text-stone-200 truncate">
            🖨️ {title || t('toadaPrint.modalTitleSingle')}
          </h2>
          <button type="button" onClick={onClose} className="cordel-modal-close-btn" title={t('common.close')} aria-label={t('common.close')}>
            <span className="text-xl font-black leading-none pointer-events-none">✕</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <ToadaPrintControlsPanel prefs={prefs} />

          {(allowBulk || onOpenSongbook) && (
            <button
              type="button"
              onClick={() => {
                if (onOpenSongbook) onOpenSongbook();
                else onConfirm(buildPrintPayload(true));
              }}
              className="w-full py-2 px-3 rounded-lg border-2 border-[var(--color-cordel-vert,#2d6a4f)] bg-[var(--color-cordel-vert,#2d6a4f)]/10 text-[var(--color-cordel-vert,#2d6a4f)] font-black uppercase tracking-wider text-xs hover:bg-[var(--color-cordel-vert,#2d6a4f)]/20 transition-colors cursor-pointer"
            >
              📖 {t('toadaPrint.btnSwitchToSongbook')}
            </button>
          )}

          <div className="bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-ocre,#c05621)] p-3 rounded-r text-xs text-encre-noire dark:text-stone-200">
            <h4 className="font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-1 text-[11px]">
              💡 {t('toadaPrint.printTipTitle')}
            </h4>
            <p className="font-medium opacity-90">{t('toadaPrint.printTipBody')}</p>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-encre-noire/15 bg-[#f5f0e6]/60 dark:bg-[#221f1c] flex justify-end gap-2.5 shrink-0">
          <CordelButton variant="secondary" onClick={onClose}>{t('toadaPrint.btnCancel')}</CordelButton>
          <CordelButton variant="primary" onClick={handlePrint} className="bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire">
            🖨️ {t('toadaPrint.btnPrint')}
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
