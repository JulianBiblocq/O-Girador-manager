import React from 'react';

/**
 * Sous-composant pour les cases à cocher des droits d'écriture sur les applications satellites
 * (Sequenciador, Dançador, Orquestrador) dans la gestion des utilisateurs.
 */
export default function UserAppRightsToggles({
  userId,
  savingId,
  activeAppRights = {},
  quotas = {},
  appRightsUsage = {},
  seqReached,
  seqZero,
  danReached,
  danZero,
  orchReached,
  orchZero,
  onToggle
}) {
  const getQuotaTitle = (isZero, isReached, hasRight) => {
    if (isZero && !hasRight) return "Aucun badge disponible dans le forfait de l'association";
    if (isReached && !hasRight) return "Quota maximum atteint pour l'association";
    return undefined;
  };

  return (
    <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-3">
      <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
        Accès Autres Applications (Écriture)
      </label>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-0.5">
        <label
          title={getQuotaTitle(seqZero, seqReached, activeAppRights.sequenciador)}
          className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${(seqReached || seqZero) && !activeAppRights.sequenciador ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={activeAppRights.sequenciador}
            onChange={(e) => onToggle(userId, 'sequenciador', e.target.checked)}
            disabled={savingId === userId || ((seqReached || seqZero) && !activeAppRights.sequenciador)}
            title={getQuotaTitle(seqZero, seqReached, activeAppRights.sequenciador)}
            className="w-3 h-3 cursor-pointer"
          />
          <span>
            Sequenciador (Mestre)
            {quotas.sequenciador !== undefined && quotas.sequenciador !== null && (
              <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.sequenciador}/{quotas.sequenciador})</span>
            )}
          </span>
        </label>

        <label
          title={getQuotaTitle(danZero, danReached, activeAppRights.dansador)}
          className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${(danReached || danZero) && !activeAppRights.dansador ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={activeAppRights.dansador}
            onChange={(e) => onToggle(userId, 'dansador', e.target.checked)}
            disabled={savingId === userId || ((danReached || danZero) && !activeAppRights.dansador)}
            title={getQuotaTitle(danZero, danReached, activeAppRights.dansador)}
            className="w-3 h-3 cursor-pointer"
          />
          <span>
            Dançador (Mestre)
            {quotas.dansador !== undefined && quotas.dansador !== null && (
              <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.dansador}/{quotas.dansador})</span>
            )}
          </span>
        </label>

        <label
          title={getQuotaTitle(orchZero, orchReached, activeAppRights.orchestrador)}
          className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${(orchReached || orchZero) && !activeAppRights.orchestrador ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={activeAppRights.orchestrador}
            onChange={(e) => onToggle(userId, 'orchestrador', e.target.checked)}
            disabled={savingId === userId || ((orchReached || orchZero) && !activeAppRights.orchestrador)}
            title={getQuotaTitle(orchZero, orchReached, activeAppRights.orchestrador)}
            className="w-3 h-3 cursor-pointer"
          />
          <span>
            Orquestrador (Mestre)
            {quotas.orchestrador !== undefined && quotas.orchestrador !== null && (
              <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.orchestrador}/{quotas.orchestrador})</span>
            )}
          </span>
        </label>
      </div>
    </div>
  );
}
