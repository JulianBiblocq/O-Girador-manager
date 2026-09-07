import React from 'react';
import CordelCard from '../CordelCard';
import { XiloClose } from '../XiloIcons';
import { INSTRUMENT_ICONS } from './inventoryConstants';

/**
 * Encart Cordel d'alerte pour les mouvements de matériel en attente de confirmation
 * (restitutions au local ou transferts déclarés par les membres).
 *
 * @param {Object} props
 * @param {Array} props.pendingMovements Liste des instruments avec un mouvement en attente
 * @param {Object} props.usersMap Dictionnaire ID -> Nom Prénom des membres
 * @param {Function} props.onApproveMovement Callback de validation du mouvement
 * @param {Function} props.onRejectMovement Callback de refus du mouvement
 */
export default function InventoryMovementsBanner({
  pendingMovements = [],
  usersMap = {},
  onApproveMovement,
  onRejectMovement
}) {
  if (!pendingMovements || pendingMovements.length === 0) return null;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4 bg-cordel-ocre/10 border-cordel-ocre">
      <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase mb-3 flex items-center gap-2">
        ⏳ Mouvements en attente ({pendingMovements.length})
      </h3>

      <div className="flex flex-col gap-3">
        {pendingMovements.map((inst) => {
          const movement = inst.pendingMovement || {};
          const { type, fromUserId, toUserId, note } = movement;
          const fromName = usersMap[fromUserId] || 'Un membre';
          const toName = toUserId ? (usersMap[toUserId] || 'un membre') : '';

          let message = '';
          if (type === 'return_to_local') {
            message = `${fromName} déclare avoir rendu l'instrument au local.`;
          } else if (type === 'transfer') {
            message = `${fromName} déclare avoir transmis l'instrument à ${toName}.`;
          } else {
            message = `${fromName} signale un mouvement sur cet instrument.`;
          }

          const iconSrc = INSTRUMENT_ICONS[inst.type] || INSTRUMENT_ICONS.Autre;

          return (
            <div 
              key={inst.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/50 dark:bg-stone-900/40 border border-dashed border-cordel-master-dark/20 rounded"
            >
              <div className="flex flex-col gap-1 text-left">
                <div className="text-xs font-bold text-encre-noire flex items-center gap-1.5">
                  <img 
                    src={iconSrc} 
                    alt={inst.type || 'Instrument'} 
                    className="w-4 h-4 object-contain opacity-70" 
                  />
                  <span>{inst.nom}</span>
                </div>
                <div className="text-[10px] text-cordel-master-dark/80">{message}</div>
                {note && (
                  <div className="text-[9px] italic text-cordel-wood bg-cordel-wood/5 p-1.5 rounded mt-1 border-l-2 border-cordel-wood">
                    "{note}"
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRejectMovement && onRejectMovement(inst)}
                  className="p-1.5 bg-cordel-rouge/10 text-cordel-rouge rounded hover:bg-cordel-rouge/20 border border-cordel-rouge/30 transition-colors cursor-pointer"
                  title="Refuser le mouvement"
                >
                  <XiloClose size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onApproveMovement && onApproveMovement(inst)}
                  className="px-3 py-1 bg-cordel-vert text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_#181716] hover:brightness-110 active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  ✅ Valider
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
