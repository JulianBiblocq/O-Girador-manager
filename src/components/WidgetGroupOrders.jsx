import React, { useState, useEffect } from 'react';
import CordelCard from './CordelCard';

/**
 * Accordéon repliable / dépliable pour le panneau « Commande Groupée de Matériel » sur l'accueil.
 * Mémorise l'état replié dans localStorage par campagne (`ogirador_order_collapsed_${campaign.id}`).
 */
export default function WidgetGroupOrders({ campaign, children }) {
  const campaignId = campaign?.id || 'default';
  const storageKey = `ogirador_order_collapsed_${campaignId}`;
  const campaignTitle = campaign?.title || campaign?.titre || 'Matériel';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  // Synchronise l'état lorsque la campagne active change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setIsCollapsed(window.localStorage.getItem(storageKey) === 'true');
    } catch {
      // Ignorer les erreurs d'accès au localStorage (navigation privée)
    }
  }, [storageKey]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {
          // Ignorer les erreurs d'écriture localStorage
        }
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2.5 text-left select-none">
      {/* Barre d'en-tête compacte sur une seule ligne */}
      <CordelCard
        variant="ocre"
        useExtremeBorder={false}
        className="py-2.5 px-3.5 cursor-pointer hover:brightness-98 transition-all"
      >
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
          className="flex items-center justify-between gap-2 w-full"
        >
          <span className="text-xs font-black uppercase tracking-wider text-encre-noire truncate flex-1 min-w-0">
            📦 COMMANDE GROUPÉE : {campaignTitle}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleCollapse();
            }}
            className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-cordel-bg-light hover:bg-white text-cordel-wood shrink-0 cursor-pointer transition-colors"
          >
            {isCollapsed ? 'Déplier ▾' : 'Replier ▴'}
          </button>
        </div>
      </CordelCard>

      {/* Contenu détaillé de la campagne lorsqu'il est déplié */}
      {!isCollapsed && (
        <div className="flex flex-col gap-3 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
