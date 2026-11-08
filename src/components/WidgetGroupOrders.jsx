import React, { useState, useEffect } from 'react';
import CordelCard from './CordelCard';
import { useTranslation } from './LanguageContext';

/**
 * Accordéon repliable / dépliable pour le panneau « Commande Groupée » sur l'accueil.
 * Encapsule l'en-tête et le formulaire dans une seule et unique CordelCard asymétrique,
 * et mémorise l'état plié/déplié dans localStorage via `grouped_order_collapsed_${campaignId}`.
 */
export default function WidgetGroupOrders({ campaign, children, footer }) {
  const { t } = useTranslation();
  const campaignId = campaign?.id || 'default';
  const storageKey = `grouped_order_collapsed_${campaignId}`;
  const legacyStorageKey = `ogirador_order_collapsed_${campaignId}`;
  const campaignTitle = campaign?.title || campaign?.titre || 'Matériel';

  const readStoredCollapsed = (key, legacyKey) => {
    if (typeof window === 'undefined') return false;
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val === 'true';
      return window.localStorage.getItem(legacyKey) === 'true';
    } catch {
      return false;
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(() =>
    readStoredCollapsed(storageKey, legacyStorageKey)
  );

  // Synchronise l'état lorsque la campagne active change
  useEffect(() => {
    setIsCollapsed(readStoredCollapsed(storageKey, legacyStorageKey));
  }, [storageKey, legacyStorageKey]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {
          // Ignorer les erreurs d'écriture localStorage (navigation privée)
        }
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3 text-left select-none">
      <CordelCard
        variant="ocre"
        useExtremeBorder={true}
        className="py-3 px-3.5 sm:px-5 transition-all"
      >
        {/* En-tête cliquable de l'accordéon dans la même CordelCard */}
        <div
          onClick={handleToggleCollapse}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleCollapse();
            }
          }}
          className={`flex items-center justify-between gap-2 w-full cursor-pointer ${!isCollapsed ? 'border-b border-dashed border-cordel-master-dark/25 pb-2.5 mb-3' : ''
            }`}
        >
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-encre-noire truncate flex-1 min-w-0">
            📦 {t('dashboard.groupOrderPrefix')} {campaignTitle}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-cordel-bg-light hover:bg-white text-cordel-wood shrink-0 cursor-pointer transition-colors"
          >
            {isCollapsed ? `${t('dashboard.btnExpand')} ▾` : `${t('dashboard.btnCollapse')} ▴`}
          </button>
        </div>

        {/* Formulaire interne affiché directement dans la même CordelCard une fois dépliée */}
        {!isCollapsed && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            {children}
          </div>
        )}
      </CordelCard>

      {/* Blocs complémentaires sous la carte (alertes de paiement, demandes enregistrées) */}
      {!isCollapsed && footer && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {footer}
        </div>
      )}
    </div>
  );
}
