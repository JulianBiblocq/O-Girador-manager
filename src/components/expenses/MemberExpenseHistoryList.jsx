import React from 'react';
import { isPastSeason } from '../../utils/seasonUtils';

/**
 * Liste détaillée de l'historique des notes de frais d'un adhérent (dépliable à la demande).
 */
export default function MemberExpenseHistoryList({
  notesFiltrees,
  loading,
  error,
  selectedSeason,
  currentSeason,
  t
}) {
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('fr-FR');
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (claim) => {
    switch (claim.status) {
      case 'reimbursed': {
        const dateStr = claim.reimbursedAt ? formatDateDisplay(claim.reimbursedAt) : '';
        const label = dateStr
          ? t('userProfile.statusRefunded', { date: dateStr })
          : t('userProfile.statusRefunded', { date: '' }).replace('()', '').trim();
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded">
            🟢 {label}
          </span>
        );
      }
      case 'approved':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-600/35 rounded">
            🔵 {t('userProfile.statusValidatedReadyToPay')}
          </span>
        );
      case 'rejected':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] border border-[var(--color-cordel-rouge)]/40 rounded">
            🔴 {t('userProfile.statusRefused')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[var(--color-cordel-ocre)]/40 rounded">
            🟠 {t('common.pending', 'En attente')}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-3 text-xs font-bold text-cordel-master-dark opacity-60 animate-pulse">
        ⏳ Chargement de vos notes de frais...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-2 text-xs font-bold text-red-700">⚠️ {error}</div>;
  }

  if (notesFiltrees.length === 0) {
    return (
      <div className="text-center py-4 border border-dashed border-cordel-master-dark/20 rounded bg-white/20 text-xs italic text-cordel-master-dark/70">
        Aucune note de frais enregistrée pour la saison {selectedSeason}.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {notesFiltrees.map((claim) => {
        const isPastCarryover =
          (claim.status === 'pending' || claim.status === 'approved') &&
          isPastSeason(claim.saison, currentSeason);
        return (
          <div
            key={claim.id || claim.claimId}
            className="bg-white/60 dark:bg-black/20 p-2.5 rounded border border-encre-noire/15 flex flex-col gap-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-encre-noire dark:text-cordel-bg-light">
                  📅 {formatDateDisplay(claim.dateDepense)}
                </span>
                <span className="text-[9px] font-bold text-cordel-master-dark/70 bg-cordel-bg-light px-1.5 py-0.5 rounded border border-cordel-master-dark/20">
                  {claim.saison}
                </span>
                {isPastCarryover && (
                  <span className="text-[8.5px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-500/30 px-1.5 py-0.5 rounded">
                    🏷️ Report
                  </span>
                )}
              </div>
              {renderStatusBadge(claim)}
            </div>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-encre-noire leading-snug">{claim.motif}</p>
              <span className="text-sm font-black text-cordel-wood shrink-0">
                {(parseFloat(claim.montant) || 0).toFixed(2)} €
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15 text-[10px]">
              {claim.receiptUrl ? (
                <a
                  href={claim.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-cordel-wood hover:underline flex items-center gap-1"
                >
                  📎 {t('userProfile.viewReceipt', { file: claim.receiptNom || 'Fichier' })} ↗
                </a>
              ) : (
                <span className="text-cordel-master-dark/50 italic">Aucun fichier</span>
              )}
              {claim.status === 'rejected' && claim.motifRefus && (
                <div className="w-full bg-red-100/70 border border-dashed border-red-700/30 p-1.5 rounded text-[10px] text-red-900">
                  <strong>{t('userProfile.refusalReason')}</strong> {claim.motifRefus}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

