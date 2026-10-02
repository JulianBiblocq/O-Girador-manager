import React from 'react';
import CordelCard from '../CordelCard';
import TreasuryEventsRow from './TreasuryEventsRow';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de présentation du tableau de trésorerie des événements.
 * Affiche les revenus issus des Devis/Factures et les dépenses hybrides (Covoiturage + Frais annexes).
 *
 * @param {Array} events - Liste des événements
 * @param {string} groupId - Identifiant de l'association
 * @param {Array} lieuxImportants - Liste des lieux importants de l'association
 */
export default function TreasuryEvents({ events = [], groupId, lieuxImportants = [] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 w-full text-left">
      <div className="text-xs text-stone-700 dark:text-stone-300 border border-dashed border-[#2d6a4f]/30 p-3 rounded-[var(--theme-border-radius,6px)] bg-[var(--color-cordel-vert)]/5 leading-relaxed">
        <span className="font-medium">💡 {t('treasury.eventsFinancialModelNotice')}</span>
      </div>

      <CordelCard className="p-4">
        {events.length === 0 ? (
          <p className="text-xs italic opacity-60 text-center py-8">Aucun événement trouvé.</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-auto">
            {/* Entête du tableau */}
            <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-stone-500 border-b border-dashed border-stone-300 dark:border-stone-700 pb-2 min-w-[650px] px-2">
              <div className="col-span-2 text-left">{t('treasury.thDate')}</div>
              <div className="col-span-3 text-left">{t('treasury.thTitleType')}</div>
              <div className="col-span-2 text-left">{t('treasury.thLocation')}</div>
              <div className="col-span-2 text-right">{t('treasury.thIncome')}</div>
              <div className="col-span-2 text-right">{t('treasury.thExpenses')}</div>
              <div className="col-span-1 text-center">{t('treasury.thBalance')}</div>
            </div>

            {/* Lignes du tableau */}
            <div className="flex flex-col gap-1 min-w-[650px] max-h-[520px] overflow-y-auto pr-1 mt-1">
              {events.map((evt) => (
                <TreasuryEventsRow
                  key={evt.id}
                  evt={evt}
                  groupId={groupId || evt.groupId}
                  lieuxImportants={lieuxImportants}
                />
              ))}
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
