import React from 'react';
import CordelCard from '../CordelCard';
import { useTranslation } from '../LanguageContext';

/**
 * Onglet d'administration annuelle de la saison et nettoyage des artefacts E2E (< 80 lignes).
 * Extrait de MestrePedagogyDashboard selon la règle du Boy Scout.
 */
export default function MestreSeasonAdminTab({
  onResetAllEvaluations,
  onPurgeE2ETests,
  purgingE2E = false,
  detectedE2ECount = 0
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <CordelCard variant="default" className="p-8 border-cordel-rouge/30 bg-cordel-rouge/5">
        <h3 className="text-lg font-black uppercase tracking-wider text-cordel-rouge mb-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>{t('mestre.pedagogy.annualResetHeading')}</span>
        </h3>
        <p className="text-xs md:text-sm font-bold text-encre-noire/80 mb-6 leading-relaxed">
          {t('mestre.pedagogy.annualResetDesc')}
        </p>
        <button
          type="button"
          onClick={onResetAllEvaluations}
          className="px-6 py-3 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black uppercase tracking-widest rounded shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          {t('mestre.pedagogy.btnResetCounters')}
        </button>
      </CordelCard>

      <CordelCard variant="default" className="p-8 border-[var(--color-cordel-ocre,#c05621)]/30 bg-[var(--color-cordel-ocre,#c05621)]/5">
        <h3 className="text-lg font-black uppercase tracking-wider text-[var(--color-cordel-ocre,#c05621)] mb-3 flex items-center gap-2">
          <span>🧹</span>
          <span>{t('mestre.pedagogy.cleanupE2eHeading')}</span>
        </h3>
        <p className="text-xs md:text-sm font-bold text-encre-noire/80 mb-6 leading-relaxed">
          {t('mestre.pedagogy.cleanupE2eDesc')}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPurgeE2ETests}
            disabled={purgingE2E}
            className="px-6 py-3 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black uppercase tracking-widest rounded shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{purgingE2E ? t('pedagogy.admin.purgeEnCours') : t('pedagogy.admin.purgerLesArtefactsE2e')}</span>
          </button>
          <span className="text-xs font-bold text-encre-noire/60">
            {detectedE2ECount} {t('mestre.pedagogy.testElementsCountLabel')}
          </span>
        </div>
      </CordelCard>
    </div>
  );
}

