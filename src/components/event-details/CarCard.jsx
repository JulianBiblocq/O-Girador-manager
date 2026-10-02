import React from 'react';
import { calculateCarStatus } from '../../hooks/useEventCarpool';
import { useTranslation } from '../LanguageContext';

/**
 * Carte individuelle représentant un véhicule dans le covoiturage.
 * Affiche l'état des places, les passagers, le badge retour direct et l'accès à la discussion d'équipage.
 *
 * @param {Object} props
 */
export default function CarCard({
  voiture, event, user, isAuthorized, enableCarpoolReimbursement, reimbursementRule,
  submittingCovoit, joiningVoitureId, setJoiningVoitureId, joinForm, setJoinForm,
  demandeRemboursementKm, handleToggleRemboursement, handleRetirerVoiture,
  handleQuitterVoiture, handleConfirmJoin, handleAssignPassenger, handleRemovePassenger,
  onOpenDiscussion
}) {
  const { t } = useTranslation();
  const status = calculateCarStatus(voiture, { enableCarpoolReimbursement, reimbursementRule });
  const isUserChauffeur = voiture.chauffeurId === user?.uid;
  const passengersList = voiture.passengers || voiture.passagers || [];
  const isUserPassager = passengersList.some(p => p.uid === user?.uid);
  const canAccessDiscussion = isAuthorized || isUserChauffeur || isUserPassager;
  const messageCount = (voiture.messages || []).length;

  const assignedPassengerIds = (event.covoiturage?.voitures || []).flatMap(v => (v.passengers || []).map(p => p.uid));
  const searchers = (event.covoiturage?.recherchePlace || []).filter(p => !assignedPassengerIds.includes(p.uid));
  const unassignedGuests = (event.invitesExternes || []).filter(g => !assignedPassengerIds.includes(g.id));
  const potentialPassengers = [
    ...searchers.map(p => ({ uid: p.uid, nom: p.nom, isInvite: false })),
    ...unassignedGuests.map(g => ({ uid: g.id, nom: `${g.nom} [Invité]`, isInvite: true }))
  ];

  const cardBg = enableCarpoolReimbursement && status.isFull ? 'bg-green-50/50 border-green-700' : 'bg-cordel-bg';

  return (
    <div className={`border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] p-3 text-left relative flex flex-col justify-between min-h-[140px] text-xs transition-all ${cardBg}`}>
      <div>
        {/* En-tête Chauffeur & Places */}
        <div className="flex justify-between items-start font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
          <div className="flex flex-col truncate pr-2">
            <span className="text-cordel-wood text-sm truncate flex items-center gap-1.5">
              👤 {voiture.chauffeurNom}
              {voiture.retourDirect && (
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded select-none shadow-2xs">
                  ⚡ Retour direct
                </span>
              )}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-encre-noire whitespace-nowrap font-bold">
              🚗 {status.availableSeats}/{voiture.passengerSeats || 0} {t('agenda.carpoolSeatsAvailable') || "places disponibles"}
            </span>
          </div>
        </div>

        {/* Places réservées hors association */}
        {Number(voiture.placesReserveesExternes) > 0 && (
          <div className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-dashed border-amber-300 px-2 py-0.5 rounded mb-1.5 flex justify-between">
            <span>👤 {voiture.placesReserveesExternes} réservée{Number(voiture.placesReserveesExternes) > 1 ? 's' : ''} hors-asso</span>
            {voiture.motifReserveesExternes && <span className="italic font-normal">({voiture.motifReserveesExternes})</span>}
          </div>
        )}

        {/* Badge Éligibilité Remboursement */}
        {enableCarpoolReimbursement && status.isEligibleForReimbursement && (
          <div className="mb-1.5">
            <span className="inline-block bg-green-100 text-green-800 text-[8px] px-2 py-0.5 rounded font-black border border-green-300 uppercase tracking-wide">
              {reimbursementRule === 'all_drivers' ? "✅ Éligible Défraiement" : "✅ Complète - Éligible Remboursement"}
            </span>
          </div>
        )}

        {/* Détail Coffre & Matériel */}
        <div className="flex flex-col gap-0.5 text-[11px] font-semibold text-encre-noire opacity-90 mb-2">
          <span>🥁 <strong className="text-cordel-wood">Alfaias :</strong> {status.alfayasInTrunk}/{voiture.trunkAlfayaCapacity || 0}</span>
          {voiture.materielCharge && <span>📦 <strong className="text-cordel-wood">Matériel asso :</strong> {voiture.materielCharge}</span>}
          {voiture.materielTransporte && <span>💼 <strong className="text-cordel-wood">Coffre :</strong> {voiture.materielTransporte}</span>}
        </div>

        {/* Liste des Passagers */}
        {passengersList.length > 0 && (
          <div className="theme-inner-panel rounded p-1.5 mb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 block mb-0.5">Équipage :</span>
            <ul className="list-disc pl-3 text-[11px] font-bold leading-normal flex flex-col gap-0.5">
              {passengersList.map((p, idx) => {
                const isDriver = p.uid === voiture.chauffeurId;
                const canRemove = isUserChauffeur || isAuthorized || p.uid === user?.uid;
                return (
                  <li key={p.uid ? `${p.uid}-${idx}` : idx} className="flex justify-between items-center gap-1">
                    <span className="truncate">
                      {isDriver ? '👨‍✈️ ' : '👤 '}
                      <strong className="text-encre-noire">{p.nom || p.name || 'Membre'}</strong>
                      {p.isInvite && <span className="ml-1 text-[8px] bg-cordel-bg border border-encre-noire px-1 py-0.2 rounded">[Invité]</span>}
                      {p.doitRentrerDirect && <span className="ml-1 text-[8px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded">⚡ Retour direct</span>}
                    </span>
                    {canRemove && (
                      <button type="button" disabled={submittingCovoit} onClick={() => handleRemovePassenger(voiture.id, p.uid)} className="text-[9px] font-black text-red-600 hover:text-red-800 pr-1">✕</button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Formulaire d'assignation rapide de passager (Chauffeur ou Admin) */}
      {(isUserChauffeur || isAuthorized) && potentialPassengers.length > 0 && (
        <div className="mt-1 mb-2 pt-1.5 border-t border-dashed border-encre-noire/15 flex gap-1.5">
          <select id={`assign-select-${voiture.id}`} disabled={submittingCovoit} className="theme-input text-[10px] font-bold py-0.5 px-1 bg-white/70 flex-1">
            {potentialPassengers.map(p => (<option key={p.uid} value={JSON.stringify(p)}>{p.nom}</option>))}
          </select>
          <button type="button" disabled={submittingCovoit} onClick={() => {
            const el = document.getElementById(`assign-select-${voiture.id}`);
            if (el?.value) {
              const p = JSON.parse(el.value);
              handleAssignPassenger(voiture.id, p.uid, p.nom.replace(' [Invité]', ''), p.isInvite);
            }
          }} className="text-[10px] font-black bg-cordel-vert text-encre-noire border border-encre-noire px-2 py-0.5 rounded">+</button>
        </div>
      )}

      {/* Actions & Inscription */}
      <div className="flex flex-col gap-2 mt-auto">
        {joiningVoitureId === voiture.id && (
          <div className="mt-1 p-2 bg-white/70 rounded border border-dashed border-encre-noire/25 text-[11px] font-bold space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={joinForm.isPassenger} onChange={(e) => setJoinForm(prev => ({ ...prev, isPassenger: e.target.checked }))} className="w-3.5 h-3.5" />
              <span>{t('agenda.carpoolOfferSeats') ? `${t('agenda.carpoolOfferSeats')} (1 place)` : "Je monte dans la voiture (1 place)"}</span>
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Alfaias transportées :</span>
              <input type="number" min="0" max="5" value={joinForm.alfayasCount} onChange={(e) => setJoinForm(prev => ({ ...prev, alfayasCount: Math.max(0, parseInt(e.target.value) || 0) }))} className="theme-input text-xs font-bold py-0.5 px-1 w-10 text-center bg-white" />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] text-amber-900 bg-amber-50 p-1 rounded border border-amber-200">
              <input type="checkbox" checked={Boolean(joinForm.doitRentrerDirect)} onChange={(e) => setJoinForm(prev => ({ ...prev, doitRentrerDirect: e.target.checked }))} className="accent-amber-700" />
              <span>⚡ Retour direct après le jeu (impératif)</span>
            </label>
            <div className="flex gap-1.5 justify-end pt-1">
              <button type="button" onClick={() => setJoiningVoitureId(null)} className="text-[9px] font-bold px-2 py-1 rounded bg-neutral-200">Annuler</button>
              <button type="button" onClick={() => handleConfirmJoin(voiture)} className="text-[9px] font-black uppercase bg-cordel-vert text-encre-noire border border-encre-noire px-2.5 py-1 rounded">Confirmer</button>
            </div>
          </div>
        )}

        {enableCarpoolReimbursement && isUserChauffeur && (
          <div className="mt-1 p-1.5 bg-white/60 border border-dashed border-encre-noire/20 rounded text-[10px] font-semibold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={demandeRemboursementKm} onChange={handleToggleRemboursement} disabled={submittingCovoit} className="accent-cordel-wood" />
              <span>Remboursement frais km (voiture pleine)</span>
            </label>
          </div>
        )}

        <div className="flex justify-between items-center gap-1.5 mt-1 pt-1 border-t border-dashed border-encre-noire/10">
          {canAccessDiscussion ? (
            <button
              type="button"
              onClick={() => onOpenDiscussion(voiture)}
              className="text-[10px] font-bold bg-white hover:bg-neutral-100 text-[var(--color-cordel-encre)] border border-encre-noire px-2 py-1 rounded shadow-2xs flex items-center gap-1 cursor-pointer"
              title={t('agenda.carpoolContactDriver') || "Contacter le conducteur"}
            >
              <span>💬 Équipage</span>
              {messageCount > 0 && <span className="bg-[var(--color-cordel-ocre)] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full">{messageCount}</span>}
            </button>
          ) : <div />}

          <div className="flex items-center gap-1.5">
            {isUserChauffeur ? (
              <button type="button" disabled={submittingCovoit} onClick={() => handleRetirerVoiture(voiture.id)} className="text-[9px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2 py-1 rounded">
                Retirer voiture
              </button>
            ) : isUserPassager ? (
              <button type="button" disabled={submittingCovoit} onClick={() => handleQuitterVoiture(voiture.id)} className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2 py-1 rounded">
                Quitter
              </button>
            ) : (
              joiningVoitureId !== voiture.id && (
                <button
                  type="button"
                  disabled={submittingCovoit}
                  onClick={() => {
                    setJoiningVoitureId(voiture.id);
                    setJoinForm({ isPassenger: true, alfayasCount: 0, doitRentrerDirect: false });
                  }}
                  className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-xs"
                >S'inscrire</button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
