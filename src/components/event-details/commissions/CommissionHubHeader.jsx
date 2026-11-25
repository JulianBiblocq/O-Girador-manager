import React from 'react';
import { useTranslation } from '../../LanguageContext';

/**
 * En-tête de la Tour de Contrôle des Commissions d'un événement :
 * affiche le compte à rebours, la jauge bénévole globale et le rappel du compteur
 * de propositions externes à valider (`pendingApplicationsCount`) pour les admins et référents.
 */
export default function CommissionHubHeader({
  event,
  countdownText = null,
  globalVolunteerCoverage = { shiftsCount: 0, totalRequired: 0, filledPosts: 0, totalInscrits: 0, isComplete: false },
  pendingApplicationsCount = 0,
  canDepositVaral = false,
  canCreate = false,
  onOpenVaralDeposit,
  onOpenCreate,
  onClose
}) {
  const { t } = useTranslation();

  return (
    <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b-2 border-[var(--theme-border)] bg-[var(--cordel-bg)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
      <div className="flex items-center justify-between gap-2.5 min-w-0 flex-1">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <span className="text-xl sm:text-2xl shrink-0">🎪</span>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-xs sm:text-base font-black uppercase tracking-wide truncate">
                Tour de Contrôle — {event?.title || event?.titre || 'Événement'}
              </h2>
              {countdownText && (
                <span className="px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-black border border-[var(--theme-border)] bg-[var(--color-cordel-ocre)] text-white shrink-0">
                  {countdownText}
                </span>
              )}
              {globalVolunteerCoverage.shiftsCount > 0 && (
                <span className={`px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-black border border-[var(--theme-border)] text-white shrink-0 ${
                  globalVolunteerCoverage.isComplete ? 'bg-[var(--color-cordel-vert)]' : 'bg-[var(--color-cordel-ocre)]'
                }`}>
                  🤝 {globalVolunteerCoverage.totalRequired > 0
                    ? `${globalVolunteerCoverage.filledPosts} / ${globalVolunteerCoverage.totalRequired} ${t('agenda.volunteerPostsFilled') || 'postes pourvus'}`
                    : `${globalVolunteerCoverage.totalInscrits} bénévole(s)`}
                </span>
              )}
              {pendingApplicationsCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[9.5px] sm:text-[10px] font-black border border-[var(--theme-border)] bg-[var(--color-cordel-ocre)] text-white shrink-0">
                  📥 {pendingApplicationsCount} {t('agenda.volunteerInboxPendingBadge') || 'proposition(s) externe(s) à valider'}
                </span>
              )}
            </div>
            <p className="text-[9.5px] sm:text-[10px] opacity-70 truncate">
              Coordination générale des chantiers et des commissions associatives
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="sm:hidden w-7 h-7 rounded border border-[var(--theme-border)] bg-[var(--theme-input-bg)] flex items-center justify-center font-black text-xs shrink-0 cursor-pointer">✕</button>
      </div>

      <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto flex-wrap">
        {canDepositVaral && (
          <button type="button" onClick={onOpenVaralDeposit} className="flex-1 sm:flex-initial px-3 py-1.5 font-black text-xs rounded border border-[var(--theme-border)] bg-[var(--color-cordel-ocre)] text-white hover:opacity-90 shadow-xs flex items-center justify-center gap-1 cursor-pointer">
            <span>📜 Présenter / Ajouter au Varal</span>
          </button>
        )}
        {canCreate && (
          <button type="button" onClick={onOpenCreate} className="flex-1 sm:flex-initial px-3 py-1.5 font-black text-xs rounded border border-[var(--theme-border)] bg-[var(--color-cordel-vert)] text-white hover:opacity-90 shadow-xs flex items-center justify-center gap-1 cursor-pointer">
            <span>+</span><span>Nouvelle commission</span>
          </button>
        )}
        <button type="button" onClick={onClose} className="hidden sm:flex w-8 h-8 rounded border border-[var(--theme-border)] bg-[var(--theme-input-bg)] items-center justify-center font-black text-sm shrink-0 cursor-pointer">✕</button>
      </div>
    </div>
  );
}
