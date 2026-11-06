import React from 'react';
import { resolveReunionPrivacyConfig, getTargetGroupDisplayName } from '../../utils/reunionPrivacyUtils';

/**
 * Badge visuel indiquant le statut de confidentialité d'une réunion
 * (ex: "🔒 Huis clos — Bureau", "🛡️ Demi-huis clos — CA", "🏛️ CA").
 */
export default function ReunionPrivacyBadge({ event, tagsDisponibles = [], showPublic = false, className = '' }) {
  if (!event || event.type !== 'reunion') return null;

  const { targetGroup, reunionPrivacyMode, hideAgendaFromNonTarget } = resolveReunionPrivacyConfig(event);
  const groupLabel = getTargetGroupDisplayName(targetGroup, tagsDisponibles, false);

  if (reunionPrivacyMode === 'huis_clos') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cordel-wood text-white border border-encre-noire shadow-2xs select-none ${className}`}
        title={`Réunion à huis clos réservée aux membres : ${groupLabel}`}
      >
        🔒 Huis clos — {groupLabel}
      </span>
    );
  }

  if (reunionPrivacyMode === 'transparent' && hideAgendaFromNonTarget) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-500 select-none ${className}`}
        title={`Date visible par tous, ordre du jour et compte-rendu réservés à : ${groupLabel}`}
      >
        🛡️ Demi-huis clos — {groupLabel}
      </span>
    );
  }

  if (reunionPrivacyMode === 'transparent' || targetGroup !== 'all') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-400 select-none ${className}`}
        title={`Réunion transparente — participation réservée à : ${groupLabel}`}
      >
        🏛️ {groupLabel}
      </span>
    );
  }

  if (showPublic) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 select-none ${className}`}
      >
        🌍 Publique
      </span>
    );
  }

  return null;
}

