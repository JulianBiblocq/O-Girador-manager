import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Panneau d'administration des indemnités kilométriques du convoi (réservé aux gestionnaires).
 *
 * @param {Object} props
 * @param {boolean} props.enableCarpoolReimbursement - Activation du défraiement
 * @param {number} props.distanceKm - Distance aller-retour de l'événement
 * @param {number} props.indemniteKm - Tarif indemnitaire au kilomètre
 * @param {Array} props.convoiDrivers - Liste des chauffeurs avec éligibilité calculée
 */
export default function CarpoolAdminRefundPanel({
  enableCarpoolReimbursement,
  distanceKm = 0,
  indemniteKm = 0,
  convoiDrivers = []
}) {
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
      <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
        {enableCarpoolReimbursement ? "🚗 Frais de déplacement (Admin)" : "🚗 Covoiturage & Convoi (Admin)"}
      </h4>
      <div className="text-xs flex flex-col gap-2.5 text-left theme-inner-panel p-3.5 rounded">
        {enableCarpoolReimbursement && (
          <>
            <div className="border-b border-dashed border-encre-noire/10 pb-2 mb-1 text-[11px] font-bold text-encre-noire/80">
              ℹ️ Distance estimée : {distanceKm} km A/R - Indemnité prévue : {(distanceKm * indemniteKm).toFixed(2)} €
            </div>
            <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1">
              <span>Distance A/R :</span>
              <span>{distanceKm} km</span>
            </div>
            <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
              <span>Tarif Km :</span>
              <span>{indemniteKm.toFixed(2)} €/km</span>
            </div>
          </>
        )}

        <div className="mt-2">
          <strong className="text-cordel-wood uppercase text-[10px] tracking-wider block border-b border-dashed border-cordel-master-dark/10 pb-0.5 mb-1.5">
            🚗 Chauffeurs du Convoi ({(convoiDrivers || []).length})
          </strong>
          {(convoiDrivers || []).length === 0 ? (
            <p className="text-[11px] italic opacity-60 pl-2">Aucun conducteur déclaré dans le convoi.</p>
          ) : (
            <div className="flex flex-col gap-1.5 pl-2">
              {(convoiDrivers || []).map((driver) => {
                const refund = driver.isEligibleRefund ? distanceKm * indemniteKm : 0;
                return (
                  <div key={driver.id} className="flex flex-col gap-0.5 border-b border-dashed border-encre-noire/5 pb-1 mb-1 last:border-none">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold">{driver.nom}</span>
                      {enableCarpoolReimbursement && (
                        <span className="font-black text-cordel-wood">
                          {refund > 0 ? `${refund.toFixed(2)} €` : "0.00 €"}
                        </span>
                      )}
                    </div>
                    {enableCarpoolReimbursement && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {driver.isEligibleRefund ? (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-green-100 border border-green-400 text-green-800 px-1.5 py-0.5 rounded select-none">
                            ✅ Complète - Éligible Remboursement
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-neutral-100 border border-neutral-300 text-neutral-600 px-1.5 py-0.5 rounded select-none">
                            ❌ Incomplète - Non éligible
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {enableCarpoolReimbursement && distanceKm > 0 && indemniteKm > 0 && (
                <div className="border-t border-double border-encre-noire/25 pt-2 mt-3 flex justify-between items-center font-black text-xs text-encre-noire">
                  <span>Total Général (Convoi) :</span>
                  <span className="text-cordel-wood">
                    {((convoiDrivers || []).filter(d => d.isEligibleRefund).length * distanceKm * indemniteKm).toFixed(2)} €
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CordelCard>
  );
}
