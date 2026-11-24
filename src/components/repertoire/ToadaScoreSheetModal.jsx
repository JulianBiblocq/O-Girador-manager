/**
 * ToadaScoreSheetModal.jsx
 * Modale autonome A4 Portrait N&B (Partition 2 Portées Puxador/Coro ou Tablature 4 Étages)
 * et export MuseScore (.musicxml) depuis le Répertoire dans Organizador, compatible Jour / Nuit (< 138 lignes).
 */
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../LanguageContext';
import { fetchToadaScorePackOnDemand } from '../../utils/toadaScorePackFetcher';
import { renderTwoStaffScoreSvgPages } from '../../utils/vocal-score/twoStaffSvgRenderer';
import { renderFilledVocalTabPortraitHTML } from '../../utils/vocal-score/filledVocalTabRenderer';
import { exportTwoStaffMusicXml, triggerMusicXmlDownload } from '../../utils/vocal-score/musicXmlTwoStaffExporter';
import { printOrganizadorHtmlDocument } from '../../utils/vocalPaperSheetPrinter';

const PILL_IDLE = 'select-none bg-[#faf5e8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#cbbba0] border-[#bfa98a] dark:border-[#4a392d] hover:bg-[#e5d5b5] dark:hover:bg-[#2a1f18]';
const PILL_ACT = 'select-none bg-[#9a3412] dark:bg-[#c2410c] text-white border-[#9a3412] dark:border-[#c2410c]';

export default function ToadaScoreSheetModal({ isOpen, onClose, piece = null, toadaDoc = null, groupId = null }) {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [scoreState, setScoreState] = useState({ pack: null, hasMelodicPack: false, hasRhythmFallback: false });
  const [viewMode, setViewMode] = useState('two_staves');
  const [clefMode, setClefMode] = useState('auto');
  const [notation, setNotation] = useState('letters');

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setLoading(true);
    fetchToadaScorePackOnDemand({ piece, toadaDoc, groupId })
      .then((res) => {
        if (cancelled) return;
        setScoreState(res);
        setViewMode(res.hasMelodicPack ? 'two_staves' : 'tab_4e');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, piece, toadaDoc, groupId]);

  const previewHtml = useMemo(() => {
    if (!scoreState.pack) return '';
    if (viewMode === 'tab_4e') {
      return renderFilledVocalTabPortraitHTML(scoreState.pack, { notation, lang: locale === 'pt' ? 'br' : 'fr' }).html;
    }
    return renderTwoStaffScoreSvgPages(scoreState.pack, { clefMode }).fullHtml;
  }, [scoreState.pack, viewMode, clefMode, notation, locale]);

  if (!isOpen || typeof document === 'undefined') return null;

  const title = toadaDoc?.titre || piece?.titre || scoreState.pack?.title || 'Toada';
  const hasPatterns = Array.isArray(scoreState.pack?.patterns) && scoreState.pack.patterns.length > 0;

  const handleExportMusicXml = () => {
    if (!scoreState.pack) return;
    const xml = exportTwoStaffMusicXml(scoreState.pack, { clefMode });
    triggerMusicXmlDownload(xml, title);
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs select-none" onClick={onClose}>
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#f4ecd8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6] rounded-lg shadow-2xl border-2 border-[#9a3412] dark:border-[#c2410c] text-left overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-2.5 bg-[#efe6d0] dark:bg-[#211a15] border-b-2 border-[#9a3412] dark:border-[#c2410c] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#9a3412] dark:text-[#fdba74] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide text-[#1c1613] dark:text-[#f5ebd6] truncate">
              {t('repertoire.scoreModalTitle')} {title}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded-full bg-[#1c1613] dark:bg-[#2a1f18] text-white font-black text-xs flex items-center justify-center border border-[#9a3412]/50 hover:bg-red-700 cursor-pointer shrink-0" title={t('repertoire.closeModal')}>
            ✕
          </button>
        </div>

        <div className="px-4 py-2 bg-[#efe4cc] dark:bg-[#241c16] border-b border-[#9a3412]/30 dark:border-[#4a392d] flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={() => setViewMode('two_staves')} className={`px-2.5 py-1 rounded font-black border cursor-pointer transition-colors ${viewMode === 'two_staves' ? PILL_ACT : PILL_IDLE}`}>
              {t('repertoire.scoreModeTwoStaves')}
            </button>
            <button type="button" onClick={() => setViewMode('tab_4e')} className={`px-2.5 py-1 rounded font-black border cursor-pointer transition-colors ${viewMode === 'tab_4e' ? PILL_ACT : PILL_IDLE}`}>
              {t('repertoire.scoreModeTab4E')}
            </button>

            {viewMode === 'two_staves' ? (
              <div className="flex items-center gap-1 ml-1">
                <span className="font-bold text-[#4a3b31] dark:text-[#cbbba0]">{t('repertoire.scoreClefLabel')}</span>
                {[['auto', 'scoreClefAuto'], ['treble', 'scoreClefTreble'], ['treble_8vb', 'scoreClefTreble8vb']].map(([val, key]) => (
                  <button key={val} type="button" onClick={() => setClefMode(val)} className={`px-2 py-0.5 rounded font-bold border cursor-pointer transition-colors ${clefMode === val ? PILL_ACT : PILL_IDLE}`}>
                    {t(`repertoire.${key}`)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1 ml-1">
                <span className="font-bold text-[#4a3b31] dark:text-[#cbbba0]">{t('repertoire.scoreNotationLabel')}</span>
                {[['letters', 'scoreNotationLetters'], ['solfege', 'scoreNotationSolfege'], ['degrees', 'scoreNotationDegrees']].map(([val, key]) => (
                  <button key={val} type="button" onClick={() => setNotation(val)} className={`px-2 py-0.5 rounded font-bold border cursor-pointer transition-colors ${notation === val ? PILL_ACT : PILL_IDLE}`}>
                    {t(`repertoire.${key}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" disabled={!hasPatterns} onClick={() => printOrganizadorHtmlDocument(previewHtml)} className="px-2.5 py-1 rounded font-black bg-[#9a3412] hover:bg-[#7c2d12] dark:bg-[#c2410c] dark:hover:bg-[#ea580c] text-white disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              <span>{t('repertoire.scoreBtnPrintPortrait')}</span>
            </button>
            <button type="button" disabled={!hasPatterns} onClick={handleExportMusicXml} className="px-2.5 py-1 rounded font-black bg-[#0f766e] hover:bg-[#115e59] text-white disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              <span>{t('repertoire.scoreBtnExportMusicXml')}</span>
            </button>
          </div>
        </div>

        {!loading && !scoreState.hasMelodicPack && hasPatterns && (
          <div className="px-4 py-1.5 bg-[#efe4cc] text-[#1c1613] dark:bg-[#2a1f18] dark:text-[#f5ebd6] border-b border-[#9a3412]/40 dark:border-[#c2410c]/50 text-[11px] font-bold shrink-0">
            {t('repertoire.scoreRhythmFallbackNotice')}
          </div>
        )}

        <div className="flex-1 min-h-0 bg-[#e5dac3] dark:bg-[#1b1511] p-3 overflow-y-auto flex items-center justify-center">
          {loading ? (
            <p className="text-xs font-bold text-[#1c1613] dark:text-[#f5ebd6]">{t('repertoire.scoreLoadingNotice')}</p>
          ) : !hasPatterns ? (
            <p className="text-xs font-bold text-[#1c1613] dark:text-[#f5ebd6] p-6 bg-[#faf5e8] dark:bg-[#241c16] rounded border border-[#9a3412]/40 dark:border-[#4a392d]">{t('repertoire.scoreEmptyNotice')}</p>
          ) : (
            <iframe title={`score-${title}`} srcDoc={previewHtml} className="w-full h-[66vh] bg-white text-black rounded shadow-md border border-stone-400" />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
