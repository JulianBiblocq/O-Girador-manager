import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Bandeau adhérent affiché en haut de la fiche d'un atelier lorsque sa participation
 * issue du sondage est en attente de re-confirmation hors pupitre (`status === 'pending_reconfirm'`).
 */
export default function WorkshopPendingReconfirmBanner({
  pupitreLabel = '',
  saving = false,
  onConfirmParticipation,
  onWithdrawParticipation
}) {
  if (!pupitreLabel) return null;

  return (
    <CordelCard
      variant="ocre"
      useExtremeBorder={true}
      className="p-3.5 sm:p-4 border-2 border-[var(--color-cordel-ocre)] bg-cordel-bg-light select-none"
    >
      <div className="flex flex-col gap-3 text-left">
        <p className="text-xs sm:text-sm font-bold text-encre-noire leading-relaxed">
          🥁 Cet atelier est dédié au pupitre <strong className="text-cordel-wood font-black">{pupitreLabel}</strong>. Tu avais indiqué être disponible à cette date : souhaites-tu quand même y participer ?
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onConfirmParticipation}
            className="px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded border-2 border-encre-noire bg-[var(--color-cordel-vert)] text-white shadow-[2px_2px_0px_0px_#181716] hover:brightness-105 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all text-center"
          >
            ✅ Oui, je participe à cet atelier
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={onWithdrawParticipation}
            className="px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded border-2 border-encre-noire bg-[var(--color-cordel-rouge)] text-white shadow-[2px_2px_0px_0px_#181716] hover:brightness-105 active:translate-y-0.5 cursor-pointer disabled:opacity-50 transition-all text-center"
          >
            ❌ Non, je me retire
          </button>
        </div>
      </div>
    </CordelCard>
  );
}
