import React from 'react';
import CordelCard from '../CordelCard';
import { useTranslation } from '../LanguageContext';

/**
 * Bandeau de synthèse du ⚠️ Top 3 des Points Chauds du Cockpit Pédagogique Mestre (< 95 lignes).
 * Permet d'épingler un morceau au programme de la prochaine répétition ou au bloc-notes.
 */
export default function MestreHotPointsBanner({
  hotPoints = [],
  isLoading = false,
  onProgramDirect,
  onPinNote
}) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('mestre.pedagogy.hotspotsAriaLabel')}>
      <CordelCard variant="default" className="p-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[2px_3px_0px_0px_#181716]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20">
          <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>⚠️</span>
            <span>{t('pedagogy.hotPointsTitle')}</span>
          </h2>
          <span className="text-[10px] text-encre-noire/60 font-semibold">
            {t('pedagogy.suggestedForNextRehearsal')}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-4 text-xs font-bold text-cordel-master-dark/50 animate-pulse">
            {t('mestre.pedagogy.analyzingHotspots')}
          </div>
        ) : hotPoints.length === 0 ? (
          <div className="p-3 bg-[var(--color-cordel-vert)]/10 border border-[var(--color-cordel-vert)]/30 rounded text-center text-xs font-black text-[var(--color-cordel-vert)]">
            {t('mestre.pedagogy.noCriticalHotspotsNotice')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {hotPoints.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded bg-[var(--color-cordel-rouge)]/5 border-l-4 border-l-[var(--color-cordel-rouge)] border border-encre-noire/15 flex flex-col justify-between gap-2 shadow-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--color-cordel-rouge)]">
                      {t('mestre.pedagogy.priorityPrefix')}{idx + 1}
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)]">
                      {item.pct}%
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs text-encre-noire leading-tight">{item.titre}</h3>
                  <span className="text-[10px] font-bold text-encre-noire/70">{item.discipline}</span>
                  <span className="text-[9px] text-encre-noire/50">{item.detail}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-encre-noire/15">
                  <button
                    type="button"
                    onClick={() => onProgramDirect && onProgramDirect(item)}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[var(--color-cordel-vert)] text-white border border-encre-noire rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title={t('mestre.pedagogy.programInNextRehearsalTitle')}
                  >
                    <span>⚡</span>
                    <span>{t('pedagogy.btnProgramRehearsal')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onPinNote && onPinNote(item.titre, item.discipline, item.requestCount || 0)}
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white text-encre-noire border border-encre-noire/30 rounded hover:bg-neutral-100 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title={t('mestre.pedagogy.pinInNotepadTitle')}
                  >
                    <span>📌</span>
                    <span>{t('pedagogy.btnPinToNotepad')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CordelCard>
    </section>
  );
}

