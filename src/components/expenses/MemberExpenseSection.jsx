import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import ExpenseClaimModal from './ExpenseClaimModal';
import { useExpenseClaims } from '../../hooks/useExpenseClaims';
import { getCurrentSeason, getSeasonOptions, isPastSeason } from '../../utils/seasonUtils';

/**
 * Section "Mes Remboursements de frais" affichée côté adhérent
 * (dans WidgetTreasury et dans le profil de l'utilisateur).
 */
export default function MemberExpenseSection({ groupId, currentUser, profileData }) {
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Hook temps réel des notes de frais du membre
  const {
    claims,
    loading,
    error,
    submitting,
    addExpenseClaim
  } = useExpenseClaims(groupId, currentUser?.uid || profileData?.uid || profileData?.id);

  // Liste des saisons disponibles calculée à partir des notes de frais de l'adhérent
  const seasonOptions = useMemo(() => {
    const claimSeasons = claims.map((c) => c.saison).filter(Boolean);
    return getSeasonOptions(currentSeason, claimSeasons);
  }, [claims, currentSeason]);

  // Calcul des compteurs synthétiques
  const { totalRembourseSaison, totalEnAttente, totalReportPasse, notesFiltrees } = useMemo(() => {
    let rembSaison = 0;
    let enAttenteTotal = 0;
    let reportPasse = 0;

    // Calcul global sur l'ensemble des notes de l'adhérent
    claims.forEach((c) => {
      const montant = parseFloat(c.montant) || 0;
      const isUnpaid = c.status === 'pending' || c.status === 'approved';

      // 1. Remboursé sur la saison sélectionnée
      if (c.saison === selectedSeason && c.status === 'reimbursed') {
        rembSaison += montant;
      }

      // 2. En attente de remboursement (inclut la saison sélectionnée et tous les reliquats antérieurs)
      if (isUnpaid) {
        enAttenteTotal += montant;
        if (isPastSeason(c.saison, currentSeason)) {
          reportPasse += montant;
        }
      }
    });

    // Notes à afficher : celles de la saison sélectionnée, + les reliquats impayés des saisons passées
    const filtered = claims.filter((c) => {
      if (c.saison === selectedSeason) return true;
      // Afficher également les impayés antérieurs pour ne jamais perdre de vue un reliquat
      const isUnpaid = c.status === 'pending' || c.status === 'approved';
      return isUnpaid && isPastSeason(c.saison, selectedSeason);
    });

    return {
      totalRembourseSaison: rembSaison,
      totalEnAttente: enAttenteTotal,
      totalReportPasse: reportPasse,
      notesFiltrees: filtered
    };
  }, [claims, selectedSeason, currentSeason]);

  const handleCreateClaim = async (claimData) => {
    await addExpenseClaim({
      ...claimData,
      currentUser,
      profileData
    });
  };

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
      case 'reimbursed':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded">
            🟢 Remboursée {claim.reimbursedAt ? `(${formatDateDisplay(claim.reimbursedAt)})` : ''}
          </span>
        );
      case 'approved':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-600/35 rounded">
            🔵 Validée / Prête à payer
          </span>
        );
      case 'rejected':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] border border-[var(--color-cordel-rouge)]/40 rounded">
            🔴 Refusée
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="theme-stamp-badge font-black uppercase text-[9px] px-2 py-0.5 bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[var(--color-cordel-ocre)]/40 rounded">
            🟠 En attente
          </span>
        );
    }
  };

  return (
    <CordelCard id="member-expense-section" variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left">
      {/* En-tête de la section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          🧾 Mes Remboursements de frais
        </h3>
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={() => setIsModalOpen(true)}
          className="py-1.5 px-3 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716]"
        >
          + Déclarer une note de frais
        </CordelButton>
      </div>

      {/* Sélecteur de saison */}
      <div className="flex items-center justify-between gap-2 bg-white/40 dark:bg-black/10 p-2.5 rounded border border-encre-noire/15 text-xs">
        <label htmlFor="memberSeasonSelector" className="text-[10px] uppercase font-extrabold text-cordel-master-dark flex items-center gap-1">
          📅 Saison associative :
        </label>
        <select
          id="memberSeasonSelector"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="theme-input text-xs font-black py-1 px-2.5 bg-cordel-bg-light cursor-pointer border border-cordel-master-dark/30 rounded"
        >
          {seasonOptions.map((s) => (
            <option key={s} value={s}>
              {s} {s === currentSeason ? ' (en cours)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Compteurs synthétiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Remboursé sur la saison */}
        <div className="bg-[var(--color-cordel-vert)]/10 border border-dashed border-[var(--color-cordel-vert)]/35 p-3 rounded flex flex-col gap-1">
          <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--color-cordel-vert)]">
            Remboursé sur la saison
          </span>
          <span className="text-lg font-black text-[var(--color-cordel-vert)]">
            {totalRembourseSaison.toFixed(2)} €
          </span>
          <span className="text-[8px] text-cordel-master-dark/60 font-semibold">
            Notes validées et payées en {selectedSeason}
          </span>
        </div>

        {/* En attente de remboursement */}
        <div className="bg-[var(--color-cordel-ocre)]/10 border border-dashed border-[var(--color-cordel-ocre)]/35 p-3 rounded flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-[var(--color-cordel-ocre)]">
              En attente de remboursement
            </span>
            {totalReportPasse > 0 && (
              <span className="text-[8px] font-black uppercase tracking-wider bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/30">
                Report actif
              </span>
            )}
          </div>
          <span className="text-lg font-black text-[var(--color-cordel-ocre)]">
            {totalEnAttente.toFixed(2)} €
          </span>
          <span className="text-[8px] text-cordel-master-dark/70 font-semibold">
            {totalReportPasse > 0 ? (
              <span>Dont <strong>{totalReportPasse.toFixed(2)} €</strong> en report de saisons passées</span>
            ) : (
              <span>Toutes saisons confondues</span>
            )}
          </span>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="flex flex-col gap-2 mt-1">
        <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
          Historique des demandes ({notesFiltrees.length}) :
        </span>

        {loading ? (
          <div className="text-center py-4 text-xs font-bold text-cordel-master-dark opacity-60 animate-pulse">
            ⏳ Chargement de vos notes de frais...
          </div>
        ) : error ? (
          <div className="text-center py-2 text-xs font-bold text-red-700">
            ⚠️ {error}
          </div>
        ) : notesFiltrees.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-cordel-master-dark/20 rounded bg-white/20 text-xs italic text-cordel-master-dark/70">
            Aucune note de frais enregistrée pour la saison {selectedSeason}.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notesFiltrees.map((claim) => {
              const isPastCarryover = (claim.status === 'pending' || claim.status === 'approved') && 
                                      isPastSeason(claim.saison, currentSeason);
              return (
                <div
                  key={claim.id || claim.claimId}
                  className="bg-white/60 dark:bg-black/20 p-3 rounded border border-encre-noire/15 flex flex-col gap-2 transition-all hover:bg-white/80"
                >
                  {/* Ligne 1 : Date, saison, badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-encre-noire dark:text-cordel-bg-light">
                        📅 {formatDateDisplay(claim.dateDepense)}
                      </span>
                      <span className="text-[9px] font-bold text-cordel-master-dark/70 bg-cordel-bg-light px-1.5 py-0.5 rounded border border-cordel-master-dark/20">
                        {claim.saison}
                      </span>
                      {isPastCarryover && (
                        <span className="text-[8.5px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/40 text-orange-900 dark:text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
                          🏷️ Report saison passée
                        </span>
                      )}
                    </div>
                    {renderStatusBadge(claim)}
                  </div>

                  {/* Ligne 2 : Motif et montant */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-encre-noire dark:text-cordel-bg-light leading-relaxed">
                      {claim.motif}
                    </p>
                    <span className="text-sm font-black text-cordel-wood shrink-0">
                      {(parseFloat(claim.montant) || 0).toFixed(2)} €
                    </span>
                  </div>

                  {/* Ligne 3 : Justificatif et motif de refus éventuel */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15 text-[10px]">
                    {claim.receiptUrl ? (
                      <a
                        href={claim.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-cordel-wood hover:underline flex items-center gap-1"
                      >
                        📎 Voir le justificatif ({claim.receiptNom || 'Fichier'}) ↗
                      </a>
                    ) : (
                      <span className="text-cordel-master-dark/50 italic">Aucun fichier</span>
                    )}

                    {claim.status === 'rejected' && claim.motifRefus && (
                      <div className="w-full bg-red-100/70 dark:bg-red-950/30 border border-dashed border-red-700/30 p-2 rounded text-[10px] text-red-900 dark:text-red-300">
                        <strong>Motif du refus :</strong> {claim.motifRefus}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale de déclaration */}
      <ExpenseClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateClaim}
        submitting={submitting}
        profileData={profileData}
      />
    </CordelCard>
  );
}
