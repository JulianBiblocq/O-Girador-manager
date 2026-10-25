import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToadaStampBadgeSelector from './ToadaStampBadgeSelector';

export default function ToadaMusicalToolbar({
  signature = '4/4', onChangeSignature, totalMeasures = 0, activeStamp, onSelectStamp,
  mode = 'time', onChangeMode, hasSelectedCell = false, onImportTxt, onExportTxt,
  onPullFromTab1, onOpenPrintStylo, onOpenScanModal, onOpenLegendModal, disabled = false
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null); // 'manuscrit' | 'fichier' | null

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    if (openMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenu]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImportTxt) {
      const reader = new FileReader();
      reader.onload = (ev) => onImportTxt(ev.target?.result || '');
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  return (
    <div className="sticky top-0 z-30 flex flex-col gap-2 p-2 bg-[#fdfbf7] dark:bg-stone-900 rounded-b border-b border-cordel-master-dark/30 shadow-sm backdrop-blur-md text-left w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-0.5 rounded border border-stone-300 shadow-2xs">
          <button
            type="button" disabled={disabled} onClick={() => onChangeMode('text')}
            className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase cursor-pointer transition-all ${
              mode === 'text' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100'
            }`}
          >
            ✏️ {t('toada.modeText') || "Mode Texte & Gras"}
          </button>
          <button
            type="button" disabled={disabled} onClick={() => onChangeMode('time')}
            className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase cursor-pointer transition-all ${
              mode === 'time' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100'
            }`}
          >
            🎯 {t('toada.modeTime') || "Poser les Temps"}
          </button>
        </div>

        <div className="flex items-center gap-1.5 relative">
          <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />

          {/* Menu 1 : Manuscrit */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button" disabled={disabled} onClick={() => setOpenMenu(openMenu === 'manuscrit' ? null : 'manuscrit')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-2xs cursor-pointer flex items-center gap-1 transition-all ${
                openMenu === 'manuscrit' ? 'bg-stone-200 border-stone-400 text-stone-900' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border-stone-300'
              }`}
            >
              🖋️ {t('toada.menuManuscrit') || "Manuscrit"} <span className="text-[8px] opacity-60">▾</span>
            </button>
            {openMenu === 'manuscrit' && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-stone-800 rounded-md shadow-lg border border-stone-300 dark:border-stone-700 py-1 z-50 text-left">
                <button
                  type="button" onClick={() => { setOpenMenu(null); onOpenPrintStylo(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer"
                >
                  <span>🖨️</span> {t('toada.printSheetBtn') || "Imprimer la feuille à compléter"}
                </button>
                <button
                  type="button" onClick={() => { setOpenMenu(null); onOpenScanModal(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer"
                >
                  <span>📷</span> {t('toada.scanSheetBtn') || "Numériser une feuille manuscrite"}
                </button>
              </div>
            )}
          </div>

          {/* Menu 2 : Fichier */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button" disabled={disabled} onClick={() => setOpenMenu(openMenu === 'fichier' ? null : 'fichier')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-2xs cursor-pointer flex items-center gap-1 transition-all ${
                openMenu === 'fichier' ? 'bg-stone-200 border-stone-400 text-stone-900' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border-stone-300'
              }`}
            >
              📂 {t('toada.menuFichier') || "Fichier"} <span className="text-[8px] opacity-60">▾</span>
            </button>
            {openMenu === 'fichier' && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-stone-800 rounded-md shadow-lg border border-stone-300 dark:border-stone-700 py-1 z-50 text-left">
                {onPullFromTab1 && (
                  <button
                    type="button" onClick={() => { setOpenMenu(null); onPullFromTab1(); }}
                    className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer"
                  >
                    <span>📥</span> {t('toada.copyFromVaralBtn') || "Copier depuis la Fiche Varal"}
                  </button>
                )}
                <button
                  type="button" onClick={() => { setOpenMenu(null); fileInputRef.current?.click(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer"
                >
                  <span>📂</span> {t('toada.importTxtBtn') || "Importer un fichier (.txt)"}
                </button>
                <button
                  type="button" onClick={() => { setOpenMenu(null); onExportTxt(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer"
                >
                  <span>💾</span> {t('toada.exportTxtBtn') || "Exporter en fichier (.txt)"}
                </button>
              </div>
            )}
          </div>

          {/* Bouton 3 : Légende */}
          <button
            type="button" onClick={onOpenLegendModal} disabled={disabled}
            className="px-2 py-1 rounded text-[10px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1"
            title="Ouvrir la légende des 5 règles"
          >
            ❓ {t('toada.legendBtn') || "Légende"}
          </button>
        </div>
      </div>

      {mode === 'time' && (
        <ToadaStampBadgeSelector
          signature={signature} onChangeSignature={onChangeSignature} totalMeasures={totalMeasures}
          activeStamp={activeStamp} onSelectStamp={onSelectStamp} hasSelectedCell={hasSelectedCell} disabled={disabled}
        />
      )}
    </div>
  );
}
