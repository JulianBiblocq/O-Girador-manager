/**
 * ToadaMusicalToolbar.jsx
 * Barre d'outils de l'éditeur musical Toada (Organizador) avec accès direct à l'Atelier Papier du Chant (< 120 lignes).
 * Icônes SVG monochromes Cordel pures (zéro emoji Windows 3D).
 */
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToadaStampBadgeSelector from './ToadaStampBadgeSelector';

const SvgIcon = ({ d }) => (
  <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function ToadaMusicalToolbar({
  signature = '4/4', onChangeSignature, totalMeasures = 0, activeStamp, onSelectStamp,
  mode = 'time', onChangeMode, hasSelectedCell = false, onAddPauseBaque, onOpenBulkPasteModal, onImportTxt, onExportTxt,
  onPullFromTab1, onOpenPrintStylo, onOpenScanModal, onOpenLegendModal, disabled = false
}) {
  const { t, language } = useTranslation();
  const fileInputRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);

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
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-0.5 rounded border border-stone-300 shadow-2xs">
            <button type="button" disabled={disabled} onClick={() => onChangeMode('text')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase cursor-pointer flex items-center gap-1 transition-all ${mode === 'text' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100'}`}>
              <SvgIcon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /><span>{t('toada.modeText') || 'Mode Texte & Gras'}</span>
            </button>
            <button type="button" disabled={disabled} onClick={() => onChangeMode('time')}
              className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase cursor-pointer flex items-center gap-1 transition-all ${mode === 'time' ? 'bg-cordel-wood text-white shadow-xs' : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100'}`}>
              <SvgIcon d="M12 2v20M2 12h20" /><span>{t('toada.modeTime') || 'Poser les Temps'}</span>
            </button>
          </div>
          {onAddPauseBaque && (
            <button type="button" disabled={disabled} onClick={onAddPauseBaque}
              className="px-2 py-1 rounded text-[10px] font-black uppercase bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
              title="Insérer une carte [PAUSE 1M] (Le Batuque joue seul)">
              <SvgIcon d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6" /><span>{language === 'pt' ? 'Pausa do Batuque' : (t('toada.pauseBaqueBtn') || 'Pause Batuque')}</span>
            </button>
          )}
          {onOpenBulkPasteModal && (
            <button type="button" disabled={disabled} onClick={onOpenBulkPasteModal}
              className="px-2 py-1 rounded text-[10px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1 transition-all">
              <SvgIcon d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><span>{language === 'pt' ? 'Colar / Editar tudo' : (t('toada.bulkPasteBtn') || 'Coller / Éditer tout le texte')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 relative">
          <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileChange} className="hidden" />

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" disabled={disabled} onClick={() => setOpenMenu(openMenu === 'manuscrit' ? null : 'manuscrit')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-2xs cursor-pointer flex items-center gap-1 transition-all ${openMenu === 'manuscrit' ? 'bg-stone-200 border-stone-400 text-stone-900' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border-stone-300'}`}>
              <SvgIcon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /><span>{language === 'pt' ? 'Oficina Papel' : 'Atelier Papier'}</span><span className="text-[8px] opacity-60">▾</span>
            </button>
            {openMenu === 'manuscrit' && (
              <div className="absolute right-0 mt-1 w-60 bg-white dark:bg-stone-800 rounded-md shadow-lg border border-stone-300 dark:border-stone-700 py-1 z-50 text-left">
                <button type="button" onClick={() => { setOpenMenu(null); onOpenPrintStylo(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer">
                  <SvgIcon d="M6 9V2h12v7M6 14h12v8H6z" /><span>Imprimer feuilles A4 (100 % N&B)</span>
                </button>
                <button type="button" onClick={() => { setOpenMenu(null); onOpenScanModal(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer">
                  <SvgIcon d="M14.5 4h-5L7 7H4v12h16V7h-3z" /><span>Lecture optique du manuscrit</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" disabled={disabled} onClick={() => setOpenMenu(openMenu === 'fichier' ? null : 'fichier')}
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase border shadow-2xs cursor-pointer flex items-center gap-1 transition-all ${openMenu === 'fichier' ? 'bg-stone-200 border-stone-400 text-stone-900' : 'bg-white dark:bg-stone-800 hover:bg-stone-100 text-stone-700 dark:text-stone-200 border-stone-300'}`}>
              <SvgIcon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><span>{t('toada.menuFichier') || 'Fichier'}</span><span className="text-[8px] opacity-60">▾</span>
            </button>
            {openMenu === 'fichier' && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-stone-800 rounded-md shadow-lg border border-stone-300 dark:border-stone-700 py-1 z-50 text-left">
                {onPullFromTab1 && (
                  <button type="button" onClick={() => { setOpenMenu(null); onPullFromTab1(); }}
                    className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer">
                    <SvgIcon d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" /><span>{t('toada.copyFromVaralBtn') || 'Copier depuis la Fiche Varal'}</span>
                  </button>
                )}
                <button type="button" onClick={() => { setOpenMenu(null); fileInputRef.current?.click(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer">
                  <SvgIcon d="M12 15V3m0 0-4 4m4-4 4 4M4 19h16" /><span>{t('toada.importTxtBtn') || 'Importer un fichier (.txt)'}</span>
                </button>
                <button type="button" onClick={() => { setOpenMenu(null); onExportTxt(); }}
                  className="w-full px-3 py-1.5 text-xs text-stone-800 dark:text-stone-100 hover:bg-amber-50 dark:hover:bg-stone-700 flex items-center gap-2 cursor-pointer">
                  <SvgIcon d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" /><span>{t('toada.exportTxtBtn') || 'Exporter en fichier (.txt)'}</span>
                </button>
              </div>
            )}
          </div>

          <button type="button" onClick={onOpenLegendModal} disabled={disabled}
            className="px-2 py-1 rounded text-[10px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1">
            <SvgIcon d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 14v.01M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" /><span>{t('toada.legendBtn') || 'Légende'}</span>
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