import React, { useState, useMemo, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import ExpenseClaimModal from './ExpenseClaimModal';
import MemberExpenseHistoryList from './MemberExpenseHistoryList';
import { useExpenseClaims } from '../../hooks/useExpenseClaims';
import { getCurrentSeason, getSeasonOptions, isPastSeason, DEFAULT_SEASON_START_MONTH } from '../../utils/seasonUtils';
import { useTranslation } from '../LanguageContext';

/**
 * Section "Mes Remboursements de frais" affichée côté adhérent.
 * Par défaut, affiche uniquement l'en-tête compact avec les compteurs sur une ligne,
 * le bouton [+ Déclarer une note] et un bouton [Voir l'historique (N) ▾].
 */
export default function MemberExpenseSection({ groupId, currentUser, profileData, saisonDebutMois }) {
  const { t } = useTranslation();
  const {
    claims,
    loading,
    error,
    submitting,
    saisonDebutMois: hookSaisonDebutMois,
    addExpenseClaim
  } = useExpenseClaims(groupId, currentUser?.uid || profileData?.uid || profileData?.id);

  const effectiveStartMonth =
    saisonDebutMois !== undefined ? Number(saisonDebutMois) : hookSaisonDebutMois || DEFAULT_SEASON_START_MONTH;

  const currentSeason = useMemo(() => getCurrentSeason(effectiveStartMonth), [effectiveStartMonth]);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    if (currentSeason) {
      setSelectedSeason((prev) => prev || currentSeason);
    }
  }, [currentSeason]);

  const seasonOptions = useMemo(() => {
    const claimSeasons = claims.map((c) => c.saison).filter(Boolean);
    return getSeasonOptions(currentSeason, claimSeasons);
  }, [claims, currentSeason]);

  const { totalRembourseSaison, totalEnAttente, notesFiltrees } = useMemo(() => {
    let rembSaison = 0;
    let enAttenteTotal = 0;

    claims.forEach((c) => {
      const montant = parseFloat(c.montant) || 0;
      const isUnpaid = c.status === 'pending' || c.status === 'approved';
      if (c.saison === selectedSeason && c.status === 'reimbursed') {
        rembSaison += montant;
      }
      if (isUnpaid) {
        enAttenteTotal += montant;
      }
    });

    const filtered = claims.filter((c) => {
      if (c.saison === selectedSeason) return true;
      const isUnpaid = c.status === 'pending' || c.status === 'approved';
      return isUnpaid && isPastSeason(c.saison, selectedSeason);
    });

    return {
      totalRembourseSaison: rembSaison,
      totalEnAttente: enAttenteTotal,
      notesFiltrees: filtered
    };
  }, [claims, selectedSeason]);

  const handleCreateClaim = async (claimData) => {
    await addExpenseClaim({
      ...claimData,
      currentUser,
      profileData
    });
  };

  return (
    <CordelCard id="member-expense-section" variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col gap-2.5 text-left">
      {/* Ligne 1 : Titre + Bouton [+ Déclarer une note] */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          🧾 {t('userProfile.expensesSectionTitle')}
        </h3>
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={() => setIsModalOpen(true)}
          className="py-1 px-2.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716]"
        >
          {t('userProfile.btnDeclareExpense')}
        </CordelButton>
      </div>

      {/* Ligne 2 : Compteurs synthétiques sur une seule ligne + Bouton [Voir l'historique (N) ▾] */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-cordel-bg-light/70 px-2.5 py-2 rounded border border-dashed border-cordel-master-dark/20 text-[11px]">
        <div className="flex flex-wrap items-center gap-2 font-bold">
          <span className="text-[var(--color-cordel-vert)]">
            Remboursé : <strong>{totalRembourseSaison.toFixed(2)} €</strong>
          </span>
          <span className="opacity-30">|</span>
          <span className="text-[var(--color-cordel-ocre)]">
            En attente : <strong>{totalEnAttente.toFixed(2)} €</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer shrink-0"
        >
          Voir l'historique ({notesFiltrees.length}) {isHistoryOpen ? '▴' : '▾'}
        </button>
      </div>

      {/* Historique dépliable au clic */}
      {isHistoryOpen && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20">
          <div className="flex items-center justify-between gap-2 text-xs">
            <label htmlFor="memberSeasonSelector" className="text-[10px] uppercase font-extrabold text-cordel-master-dark">
              📅 {t('userProfile.seasonLabel')}
            </label>
            <select
              id="memberSeasonSelector"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="theme-input text-xs font-black py-1 px-2 bg-cordel-bg-light cursor-pointer border border-cordel-master-dark/30 rounded"
            >
              {seasonOptions.map((s) => (
                <option key={s} value={s}>
                  {s === currentSeason ? t('userProfile.seasonCurrentNotice', { season: s }) : s}
                </option>
              ))}
            </select>
          </div>

          <MemberExpenseHistoryList
            notesFiltrees={notesFiltrees}
            loading={loading}
            error={error}
            selectedSeason={selectedSeason}
            currentSeason={currentSeason}
            t={t}
          />
        </div>
      )}

      <ExpenseClaimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateClaim}
        submitting={submitting}
        defaultSeason={selectedSeason || currentSeason}
        seasonOptions={seasonOptions}
      />
    </CordelCard>
  );
}
