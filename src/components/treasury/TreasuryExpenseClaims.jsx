import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import ExpenseRefusalModal from '../expenses/ExpenseRefusalModal';
import { useExpenseClaims } from '../../hooks/useExpenseClaims';
import { getCurrentSeason, getSeasonOptions, isPastSeason } from '../../utils/seasonUtils';

/**
 * Interface du Trésorier : Gestion des Notes de Frais & Achats.
 * 
 * Permet de filtrer par saison, de visualiser les reliquats impayés, de consulter
 * les justificatifs, de copier l'IBAN des adhérents, de valider, refuser (avec motif)
 * ou marquer chaque note comme remboursée avec génération comptable automatique.
 */
export default function TreasuryExpenseClaims({
  groupId,
  _role,
  _isSystemAdmin,
  _hasAccessTresorerie
}) {
  const currentSeason = useMemo(() => getCurrentSeason(), []);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);
  const [searchMember, setSearchMember] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [refusalModalClaim, setRefusalModalClaim] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [copiedIbanClaimId, setCopiedIbanClaimId] = useState(null);

  // 1. Récupération des notes de frais via le hook
  const {
    claims,
    loading,
    error,
    submitting,
    approveExpenseClaim,
    rejectExpenseClaim,
    markAsReimbursed
  } = useExpenseClaims(groupId, null);

  // 2. Récupération de la liste des membres pour croiser l'IBAN le plus frais du profil
  const [membersMap, setMembersMap] = useState({});
  useEffect(() => {
    if (!groupId) return;
    const usersQuery = query(collection(db, 'users'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(usersQuery, (snap) => {
      const map = {};
      snap.forEach((docSnap) => {
        map[docSnap.id] = docSnap.data();
      });
      setMembersMap(map);
    }, (err) => {
      console.warn("TreasuryExpenseClaims - Erreur récupération users :", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Options de saisons disponibles
  const seasonOptions = useMemo(() => {
    const seasonsInClaims = claims.map((c) => c.saison).filter(Boolean);
    return getSeasonOptions(currentSeason, seasonsInClaims);
  }, [claims, currentSeason]);

  // Filtrage des demandes selon saison, impayés, recherche et statut
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const isUnpaid = claim.status === 'pending' || claim.status === 'approved';

      // Filtre saison / impayés
      if (showAllUnpaid) {
        // Afficher tous les impayés de n'importe quelle saison
        if (!isUnpaid) return false;
      } else {
        // Filtre par saison sélectionnée
        if (claim.saison !== selectedSeason) return false;
      }

      // Filtre par statut spécifique
      if (statusFilter !== 'all' && claim.status !== statusFilter) {
        return false;
      }

      // Filtre de recherche par membre ou motif
      if (searchMember.trim()) {
        const queryClean = searchMember.toLowerCase().trim();
        const nameMatch = (claim.userName || '').toLowerCase().includes(queryClean);
        const emailMatch = (claim.userEmail || '').toLowerCase().includes(queryClean);
        const motifMatch = (claim.motif || '').toLowerCase().includes(queryClean);
        if (!nameMatch && !emailMatch && !motifMatch) return false;
      }

      return true;
    });
  }, [claims, selectedSeason, showAllUnpaid, statusFilter, searchMember]);

  // Statistiques synthétiques
  const stats = useMemo(() => {
    let pendingCount = 0;
    let approvedCount = 0;
    let totalUnpaidAmount = 0;
    let totalReimbursedSeason = 0;

    claims.forEach((c) => {
      const montant = parseFloat(c.montant) || 0;
      if (c.status === 'pending') {
        pendingCount++;
        totalUnpaidAmount += montant;
      } else if (c.status === 'approved') {
        approvedCount++;
        totalUnpaidAmount += montant;
      }

      if (c.saison === selectedSeason && c.status === 'reimbursed') {
        totalReimbursedSeason += montant;
      }
    });

    return {
      pendingCount,
      approvedCount,
      totalUnpaidAmount,
      totalReimbursedSeason
    };
  }, [claims, selectedSeason]);

  const handleCopyIban = async (claimId, ibanValue) => {
    if (!ibanValue) return;
    try {
      await navigator.clipboard.writeText(ibanValue.replace(/\s+/g, ''));
      setCopiedIbanClaimId(claimId);
      setTimeout(() => setCopiedIbanClaimId(null), 2000);
    } catch (err) {
      console.error("Erreur copie IBAN :", err);
      alert("Impossible de copier automatiquement. IBAN : " + ibanValue);
    }
  };

  const handleApprove = async (claim) => {
    const id = claim.claimId || claim.id;
    setActionInProgressId(id);
    try {
      await approveExpenseClaim(id);
    } catch (err) {
      alert("Erreur validation : " + (err.message || err));
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReimburse = async (claim) => {
    const id = claim.claimId || claim.id;
    const confirmMsg = `Confirmez-vous le remboursement de ${(parseFloat(claim.montant) || 0).toFixed(2)} € à ${claim.userName} ?\n\nUne écriture sera automatiquement enregistrée dans la comptabilité et une notification envoyée à l'adhérent.`;
    if (!window.confirm(confirmMsg)) return;

    setActionInProgressId(id);
    try {
      await markAsReimbursed(claim);
    } catch (err) {
      alert("Erreur remboursement : " + (err.message || err));
    } finally {
      setActionInProgressId(null);
    }
  };

  const formatDate = (dateStr) => {
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
          <span className="theme-stamp-badge font-black uppercase text-[8.5px] px-2 py-0.5 bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded whitespace-nowrap">
            🟢 Remboursée
          </span>
        );
      case 'approved':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[8.5px] px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-600/35 rounded whitespace-nowrap">
            🔵 Validée (à payer)
          </span>
        );
      case 'rejected':
        return (
          <span className="theme-stamp-badge font-black uppercase text-[8.5px] px-2 py-0.5 bg-[var(--color-cordel-rouge)]/15 text-[var(--color-cordel-rouge)] border border-[var(--color-cordel-rouge)]/40 rounded whitespace-nowrap">
            🔴 Refusée
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="theme-stamp-badge font-black uppercase text-[8.5px] px-2 py-0.5 bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[var(--color-cordel-ocre)]/40 rounded whitespace-nowrap">
            🟠 En attente
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/60 dark:bg-black/20">
          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">
            Notes à traiter
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-cordel-wood">
              {stats.pendingCount}
            </span>
            <span className="text-[10px] font-bold text-blue-700">
              (+{stats.approvedCount} prêtes à payer)
            </span>
          </div>
        </CordelCard>

        <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/60 dark:bg-black/20">
          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">
            Total dû aux membres
          </span>
          <span className="text-xl font-black text-[var(--color-cordel-ocre)]">
            {stats.totalUnpaidAmount.toFixed(2)} €
          </span>
        </CordelCard>

        <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/60 dark:bg-black/20">
          <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">
            Remboursé sur la saison ({selectedSeason})
          </span>
          <span className="text-xl font-black text-[var(--color-cordel-vert)]">
            {stats.totalReimbursedSeason.toFixed(2)} €
          </span>
        </CordelCard>
      </div>

      {/* Barre de filtres */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Sélecteur de saison et case impayés */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="treasurySeasonSelect" className="text-[10px] uppercase font-extrabold text-cordel-master-dark">
                📅 Saison :
              </label>
              <select
                id="treasurySeasonSelect"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={showAllUnpaid}
                className={`theme-input text-xs font-black py-1 px-2.5 bg-cordel-bg-light cursor-pointer rounded border border-cordel-master-dark/30 ${
                  showAllUnpaid ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                {seasonOptions.map((s) => (
                  <option key={s} value={s}>
                    {s} {s === currentSeason ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Case à cocher : Afficher tous les impayés / reports */}
            <label className="flex items-center gap-2 text-xs font-bold text-encre-noire dark:text-cordel-bg-light cursor-pointer select-none bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded border border-cordel-master-dark/20">
              <input
                type="checkbox"
                checked={showAllUnpaid}
                onChange={(e) => setShowAllUnpaid(e.target.checked)}
                className="w-4 h-4 accent-cordel-wood cursor-pointer"
              />
              <span>🚨 Afficher tous les impayés / reports (toutes saisons)</span>
            </label>
          </div>

          {/* Filtres de recherche et statut */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              placeholder="Rechercher membre ou motif..."
              className="theme-input text-xs font-semibold py-1 px-2.5 bg-cordel-bg-light rounded border border-cordel-master-dark/30 w-full md:w-56"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="theme-input text-xs font-bold py-1 px-2.5 bg-cordel-bg-light rounded border border-cordel-master-dark/30 cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">🟠 En attente</option>
              <option value="approved">🔵 Validée (à payer)</option>
              <option value="reimbursed">🟢 Remboursée</option>
              <option value="rejected">🔴 Refusée</option>
            </select>
          </div>
        </div>
      </CordelCard>

      {/* Tableau des demandes */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Demandes de remboursement ({filteredClaims.length})
          </h3>
          {showAllUnpaid && (
            <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
              Mode : Tous les impayés et reports
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs font-bold text-cordel-master-dark opacity-60 animate-pulse">
            ⏳ Chargement des notes de frais...
          </div>
        ) : error ? (
          <div className="text-center py-4 text-xs font-bold text-red-700">
            ⚠️ {error}
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-cordel-master-dark/20 rounded bg-white/20 text-xs italic text-cordel-master-dark/70">
            Aucune note de frais ne correspond à vos filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-encre-noire/20 text-[9px] uppercase font-black text-cordel-master-dark/70 tracking-wider">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Saison</th>
                  <th className="py-2 px-2">Membre</th>
                  <th className="py-2 px-2">Motif</th>
                  <th className="py-2 px-2 text-right">Montant</th>
                  <th className="py-2 px-2 text-center">Justificatif</th>
                  <th className="py-2 px-2">IBAN du membre</th>
                  <th className="py-2 px-2 text-center">Statut</th>
                  <th className="py-2 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-cordel-master-dark/15 font-semibold">
                {filteredClaims.map((claim) => {
                  const claimId = claim.claimId || claim.id;
                  const isProcessing = actionInProgressId === claimId || submitting;
                  const isPastCarryover = (claim.status === 'pending' || claim.status === 'approved') &&
                                          isPastSeason(claim.saison, currentSeason);

                  // Récupération de l'IBAN : soit sur la note, soit dans le profil actuel du membre
                  const memberDoc = membersMap[claim.userId];
                  const currentIban = claim.userIban || memberDoc?.iban || memberDoc?.ribIban || '';
                  const isIbanCopied = copiedIbanClaimId === claimId;

                  return (
                    <tr key={claimId} className="hover:bg-white/40 transition-colors">
                      {/* Date */}
                      <td className="py-2.5 px-2 font-bold whitespace-nowrap text-[11px]">
                        {formatDate(claim.dateDepense)}
                      </td>

                      {/* Saison */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-cordel-master-dark">
                          {claim.saison}
                        </span>
                        {isPastCarryover && (
                          <div className="text-[7.5px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/40 px-1 py-0.2 rounded border border-orange-500/20 w-max mt-0.5">
                            Report
                          </div>
                        )}
                      </td>

                      {/* Membre */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-encre-noire dark:text-cordel-bg-light">
                            {claim.userName || 'Adhérent'}
                          </span>
                          {claim.userEmail && (
                            <span className="text-[9px] text-cordel-master-dark/60 lowercase">
                              {claim.userEmail}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Motif */}
                      <td className="py-2.5 px-2 max-w-[200px]">
                        <p className="line-clamp-2 text-xs leading-tight" title={claim.motif}>
                          {claim.motif}
                        </p>
                        {claim.status === 'rejected' && claim.motifRefus && (
                          <div className="text-[9px] text-red-700 italic mt-0.5">
                            Refus : {claim.motifRefus}
                          </div>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="py-2.5 px-2 text-right font-black text-cordel-wood whitespace-nowrap">
                        {(parseFloat(claim.montant) || 0).toFixed(2)} €
                      </td>

                      {/* Justificatif */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {claim.receiptUrl ? (
                          <a
                            href={claim.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-cordel-wood hover:underline bg-white/60 dark:bg-black/30 px-2 py-1 rounded border border-cordel-master-dark/20"
                            title="Ouvrir le justificatif"
                          >
                            📎 Voir ↗
                          </a>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">Aucun</span>
                        )}
                      </td>

                      {/* IBAN & Bouton Copier */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {currentIban ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-encre-noire bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-black/10">
                              {currentIban.length > 12 
                                ? `${currentIban.slice(0, 4)} ... ${currentIban.slice(-4)}`
                                : currentIban}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyIban(claimId, currentIban)}
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border transition-all cursor-pointer select-none ${
                                isIbanCopied
                                  ? 'bg-green-700 text-white border-green-900 shadow-sm'
                                  : 'bg-white hover:bg-neutral-100 text-cordel-master-dark border-cordel-master-dark/30'
                              }`}
                              title="Copier l'IBAN complet dans le presse-papier"
                            >
                              {isIbanCopied ? '✓ Copié !' : '📋 Copier'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[9px] italic text-neutral-400">
                            Non renseigné
                          </span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {renderStatusBadge(claim)}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Bouton Valider (si pending) */}
                          {claim.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(claim)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-blue-700 hover:bg-blue-800 text-white rounded border border-blue-900 shadow-[1px_1px_0px_0px_#181716] cursor-pointer select-none"
                              title="Valider la note de frais"
                            >
                              ✓ Valider
                            </button>
                          )}

                          {/* Bouton Refuser (si pending ou approved) */}
                          {(claim.status === 'pending' || claim.status === 'approved') && (
                            <button
                              type="button"
                              onClick={() => setRefusalModalClaim(claim)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-[9px] font-black uppercase tracking-wider bg-[var(--color-cordel-rouge)] hover:opacity-90 text-white rounded border border-red-950 shadow-[1px_1px_0px_0px_#181716] cursor-pointer select-none"
                              title="Refuser la note de frais avec motif"
                            >
                              ✕ Refuser
                            </button>
                          )}

                          {/* Bouton Marquer comme remboursé (si pending ou approved) */}
                          {(claim.status === 'pending' || claim.status === 'approved') && (
                            <button
                              type="button"
                              onClick={() => handleReimburse(claim)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] hover:opacity-90 text-white rounded border border-green-950 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer select-none"
                              title="Marquer comme payée, enregistrer en comptabilité et notifier le membre"
                            >
                              💸 Rembourser
                            </button>
                          )}

                          {/* Statut remboursé : date rappel */}
                          {claim.status === 'reimbursed' && (
                            <span className="text-[9px] text-green-700 dark:text-green-400 font-bold italic">
                              Payé le {formatDate(claim.reimbursedAt)}
                            </span>
                          )}

                          {/* Statut rejeté : date rappel */}
                          {claim.status === 'rejected' && (
                            <span className="text-[9px] text-red-700 font-bold italic">
                              Refusé
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CordelCard>

      {/* Modale de motif de refus */}
      <ExpenseRefusalModal
        isOpen={Boolean(refusalModalClaim)}
        claim={refusalModalClaim}
        onClose={() => setRefusalModalClaim(null)}
        onConfirmRefusal={rejectExpenseClaim}
        submitting={submitting}
      />
    </div>
  );
}
