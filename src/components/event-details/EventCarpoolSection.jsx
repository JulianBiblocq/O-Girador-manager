import React from 'react';
import CordelCard from '../CordelCard';
import { calculateCarStatus } from '../../hooks/useEventCarpool';

export default function EventCarpoolSection({
  event,
  user,
  profileData,
  isAuthorized,
  enableCarpoolReimbursement,
  indemniteKilometrique,
  convoiDrivers,
  individualDrivers,
  submittingCovoit,
  joiningVoitureId,
  setJoiningVoitureId,
  joinForm,
  setJoinForm,
  demandeRemboursementKm,
  handleToggleRemboursement,
  handleRetirerVoiture,
  handleQuitterVoiture,
  handleConfirmJoin,
  handleChercherPlace,
  handleAnnulerCherchePlace,
  showProposerForm,
  setShowProposerForm,
  voitureForm,
  setVoitureForm,
  handleProposerVoiture,
  reimbursementRule,
  handleAssignPassenger,
  handleRemovePassenger
}) {
  return (
    <>
      {/* 🚗 Frais de déplacement / Convoi (uniquement pour les administrateurs pour prestation, stage & atelier) */}
      {isAuthorized && (event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            {enableCarpoolReimbursement ? "🚗 Frais de déplacement (Admin)" : "🚗 Covoiturage & Convoi (Admin)"}
          </h4>
          <div className="text-xs flex flex-col gap-2.5 text-left theme-inner-panel p-3.5 rounded">
            {enableCarpoolReimbursement && (
              <>
                <div className="border-b border-dashed border-encre-noire/10 pb-2 mb-1 text-[11px] font-bold text-encre-noire/80">
                  ℹ️ Distance estimée : {event.distanceAllerRetourKm || 0} km A/R - Indemnité prévue : {((event.distanceAllerRetourKm || 0) * indemniteKilometrique).toFixed(2)} €
                </div>
                <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1">
                  <span>Distance A/R :</span>
                  <span>{event.distanceAllerRetourKm || 0} km</span>
                </div>
                <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
                  <span>Tarif Km :</span>
                  <span>{indemniteKilometrique.toFixed(2)} €/km</span>
                </div>
              </>
            )}

            {/* 1. Catégorie : Convoi / Covoiturage */}
            <div className="mt-2">
              <strong className="text-cordel-wood uppercase text-[10px] tracking-wider block border-b border-dashed border-cordel-master-dark/10 pb-0.5 mb-1.5">
                🚗 Chauffeurs du Convoi ({convoiDrivers.length})
              </strong>
              {convoiDrivers.length === 0 ? (
                <p className="text-[11px] italic opacity-60 pl-2">Aucun conducteur déclaré dans le convoi.</p>
              ) : (
                <div className="flex flex-col gap-1.5 pl-2">
                  {convoiDrivers.map(driver => {
                    const refund = driver.isEligibleRefund ? (event.distanceAllerRetourKm || 0) * indemniteKilometrique : 0;
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
                  {enableCarpoolReimbursement && event.distanceAllerRetourKm > 0 && indemniteKilometrique > 0 && (
                    <div className="border-t border-double border-encre-noire/25 pt-2 mt-3 flex justify-between items-center font-black text-xs text-encre-noire">
                      <span>Total Général (Convoi) :</span>
                      <span className="text-cordel-wood">
                        {(convoiDrivers.filter(d => d.isEligibleRefund).length * event.distanceAllerRetourKm * indemniteKilometrique).toFixed(2)} €
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CordelCard>
      )}

      {/* 🚗 Convoi & Covoiturage (uniquement prestation, stage et atelier) */}
      {(event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            🚗 Convoi & Covoiturage (Départ du local)
          </h4>

          {/* Cars Grid */}
          <div className="flex flex-col gap-3">
            {(event.covoiturage?.voitures || []).length === 0 ? (
              <p className="text-[11px] italic opacity-60">Aucun chauffeur ne s'est encore déclaré pour cet événement.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(event.covoiturage.voitures).map((voiture) => {
                  const status = calculateCarStatus(voiture, { enableCarpoolReimbursement, reimbursementRule });
                  const isUserChauffeur = voiture.chauffeurId === user.uid;
                  const isUserPassager = (voiture.passengers || voiture.passagers || []).some(p => p.uid === user.uid);
                  const passengersList = voiture.passengers || voiture.passagers || [];

                  const assignedPassengerIds = (event.covoiturage?.voitures || []).flatMap(v => (v.passengers || []).map(p => p.uid));
                  const searchers = (event.covoiturage?.recherchePlace || []).filter(p => !assignedPassengerIds.includes(p.uid));
                  const unassignedGuests = (event.invitesExternes || []).filter(g => !assignedPassengerIds.includes(g.id));
                  const potentialPassengers = [
                    ...searchers.map(p => ({ uid: p.uid, nom: p.nom, isInvite: false })),
                    ...unassignedGuests.map(g => ({ uid: g.id, nom: `${g.nom} [Invité]`, isInvite: true }))
                  ];

                  return (
                    <div 
                      key={voiture.id}
                      className={`border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] p-3 text-left relative flex flex-col justify-between min-h-[140px] text-xs transition-all ${
                        enableCarpoolReimbursement && status.isFull ? 'bg-green-50/50 border-green-700' : 'bg-cordel-bg'
                      }`}
                    >
                      <div>
                        {/* Chauffeur header */}
                        <div className="flex justify-between items-start font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
                          <span className="text-cordel-wood text-sm truncate pr-2">
                            👤 Chauffeur : {voiture.chauffeurNom}
                          </span>
                          <span className="shrink-0 text-encre-noire whitespace-nowrap">
                            🚗 Libres : {status.availableSeats}/{voiture.passengerSeats || 0}
                          </span>
                        </div>

                        {/* Eligibility badge */}
                        {enableCarpoolReimbursement && status.isEligibleForReimbursement && (
                          <div className="mb-2">
                            <span className="inline-block bg-green-100 text-green-800 text-[8px] px-2 py-0.5 rounded font-black border border-green-300 uppercase tracking-wide">
                              {reimbursementRule === 'all_drivers' ? "✅ Éligible Défraiement" : "✅ Complète - Éligible Remboursement"}
                            </span>
                          </div>
                        )}

                        {/* Cargo items */}
                        <div className="flex flex-col gap-1 text-[11px] font-semibold text-encre-noire opacity-90 mb-2">
                          <span className="flex items-center gap-1.5">
                            🥁 <strong className="text-cordel-wood">Coffre (Alfaias) :</strong> {status.alfayasInTrunk}/{voiture.trunkAlfayaCapacity || 0}
                          </span>
                          {status.alfayasOnSeats > 0 && (
                            <span className="flex items-center gap-1.5 text-amber-700">
                              ⚠️ <strong className="text-amber-800">Alfaias sur sièges :</strong> {status.alfayasOnSeats}
                            </span>
                          )}
                          {voiture.materielCharge && (
                            <span className="flex items-center gap-1.5">
                              📦 <strong className="text-cordel-wood">Matériel asso :</strong> {voiture.materielCharge}
                            </span>
                          )}
                        </div>

                        {/* Passengers listing */}
                        {passengersList.length > 0 && (
                          <div className="theme-inner-panel rounded p-1.5 mb-3">
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 block mb-0.5">Participants :</span>
                            <ul className="list-disc pl-3 text-[11px] font-bold leading-normal flex flex-col gap-0.5">
                              {passengersList.map((p, idx) => {
                                const details = [];
                                if (p.isPassenger !== false) {
                                  details.push("Passager");
                                } else {
                                  details.push("Instrument seul");
                                }
                                if (p.alfayasCount > 0) {
                                  details.push(`${p.alfayasCount} Alfaia${p.alfayasCount > 1 ? 's' : ''}`);
                                }
                                const canRemove = isUserChauffeur || isAuthorized || p.uid === user.uid;
                                return (
                                  <li key={idx} className="flex justify-between items-center gap-2">
                                    <span>
                                      {p.nom} {p.isInvite && <span className="text-[8px] font-black uppercase tracking-wider bg-cordel-bg border border-encre-noire text-cordel-master-dark px-1 py-0.5 rounded select-none">[Invité]</span>} <span className="text-[9px] font-semibold text-cordel-master-dark/70">({details.join(', ')})</span>
                                    </span>
                                    {canRemove && (
                                      <button
                                        type="button"
                                        disabled={submittingCovoit}
                                        onClick={() => handleRemovePassenger(voiture.id, p.uid)}
                                        className="text-[9px] font-black text-red-600 hover:text-red-800 cursor-pointer ml-1 select-none pr-1"
                                        title="Retirer ce passager"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Assign passenger/guest dropdown form (Admin or Chauffeur only) */}
                      {(isUserChauffeur || isAuthorized) && potentialPassengers.length > 0 && (
                        <div className="mt-1 mb-3 pt-2.5 border-t border-dashed border-encre-noire/15 flex flex-col gap-1.5 text-left">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                            Ajouter un passager / invité
                          </span>
                          <div className="flex gap-1.5">
                            <select
                              id={`assign-select-${voiture.id}`}
                              disabled={submittingCovoit}
                              className="theme-input text-[11px] font-bold py-1 px-1.5 bg-white/70 flex-1"
                            >
                              {potentialPassengers.map(p => (
                                <option key={p.uid} value={JSON.stringify(p)}>{p.nom}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={submittingCovoit}
                              onClick={() => {
                                const selectEl = document.getElementById(`assign-select-${voiture.id}`);
                                if (selectEl && selectEl.value) {
                                  const p = JSON.parse(selectEl.value);
                                  handleAssignPassenger(voiture.id, p.uid, p.nom.replace(' [Invité]', ''), p.isInvite);
                                }
                              }}
                              className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons / inline form */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {joiningVoitureId === voiture.id && (
                          <div className="reservation-form mt-2 p-2 bg-white/60 dark:bg-black/20 rounded border border-dashed border-encre-noire/25 text-[11px] font-bold">
                            <label className="flex items-center gap-2 mb-2 select-none cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={joinForm.isPassenger} 
                                onChange={(e) => setJoinForm(prev => ({ ...prev, isPassenger: e.target.checked }))} 
                                className="w-3.5 h-3.5 border border-encre-noire bg-white rounded"
                              />
                              <span>Je monte dans la voiture (1 place)</span>
                            </label>
                            
                            <label className="flex items-center justify-between gap-2">
                              <span>Nombre d'Alfaias transportées :</span>
                              <input 
                                type="number" 
                                min="0" 
                                max="5"
                                value={joinForm.alfayasCount} 
                                onChange={(e) => setJoinForm(prev => ({ ...prev, alfayasCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                                className="theme-input text-xs font-bold py-0.5 px-1.5 w-12 text-center bg-white"
                              />
                            </label>
                            
                            <div className="flex gap-2 justify-end mt-3">
                              <button 
                                type="button"
                                onClick={() => setJoiningVoitureId(null)}
                                className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2 py-1 rounded"
                              >
                                Annuler
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleConfirmJoin(voiture)}
                                className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                              >
                                Confirmer ma place
                              </button>
                            </div>
                          </div>
                        )}

                        {enableCarpoolReimbursement && isUserChauffeur && (
                          <div className="mt-2 p-2 bg-white/60 dark:bg-black/20 border border-dashed border-encre-noire/20 rounded text-[11px] font-semibold">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={demandeRemboursementKm}
                                onChange={handleToggleRemboursement}
                                disabled={submittingCovoit}
                                className="accent-cordel-wood scale-105"
                              />
                              <span className="leading-snug">Demander le remboursement des frais kilométriques (voiture pleine)</span>
                            </label>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-1">
                          {isUserChauffeur ? (
                            <button
                              type="button"
                              disabled={submittingCovoit}
                              onClick={() => handleRetirerVoiture(voiture.id)}
                              className="text-[9px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2 py-1 rounded"
                            >
                              Retirer ma voiture
                            </button>
                          ) : isUserPassager ? (
                            <button
                              type="button"
                              disabled={submittingCovoit}
                              onClick={() => handleQuitterVoiture(voiture.id)}
                              className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2 py-1 rounded"
                            >
                              Quitter la voiture
                            </button>
                          ) : (
                            joiningVoitureId !== voiture.id && (
                              <button
                                type="button"
                                disabled={submittingCovoit}
                                onClick={() => {
                                  setJoiningVoitureId(voiture.id);
                                  setJoinForm({ isPassenger: true, alfayasCount: 0 });
                                }}
                                className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                              >
                                S'inscrire
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waiting List queue */}
          <div className="mt-5 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5 flex justify-between items-center">
              <span>📋 Membres en recherche de place</span>
              {!(event.covoiturage?.recherchePlace || []).some(p => p.uid === user.uid) ? (
                <button
                  type="button"
                  disabled={submittingCovoit}
                  onClick={handleChercherPlace}
                  className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-cordel-hover border border-encre-noire px-2 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  Je cherche une place
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submittingCovoit}
                  onClick={handleAnnulerCherchePlace}
                  className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 border border-encre-noire px-2 py-1 rounded"
                >
                  Annuler ma recherche
                </button>
              )}
            </h5>

            {(event.covoiturage?.recherchePlace || []).length === 0 ? (
              <p className="text-[11px] italic opacity-60">Aucun membre en recherche de place actuellement.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(event.covoiturage.recherchePlace).map((p) => (
                  <span 
                    key={p.uid}
                    className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed"
                  >
                    ⏳ {p.nom}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Proposer ma voiture button/form */}
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left">
            {!showProposerForm ? (
              <button
                type="button"
                onClick={() => setShowProposerForm(true)}
                className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center"
              >
                🚗 Proposer ma voiture pour le trajet
              </button>
            ) : (
              <form onSubmit={handleProposerVoiture} className="flex flex-col gap-3 theme-inner-panel p-4 rounded">
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood">
                  Proposer un véhicule
                </h5>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Places passagers libres
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="8"
                      value={voitureForm.passengerSeats}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, passengerSeats: parseInt(e.target.value) || 0 }))}
                      disabled={submittingCovoit}
                      required
                      className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Volume coffre (Alfaias)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="10"
                      value={voitureForm.trunkAlfayaCapacity}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, trunkAlfayaCapacity: parseInt(e.target.value) || 0 }))}
                      disabled={submittingCovoit}
                      required
                      className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Matériel collectif pris en charge
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: sac de baguettes, 3 caixas..."
                    value={voitureForm.materielCharge}
                    onChange={(e) => setVoitureForm(prev => ({ ...prev, materielCharge: e.target.value }))}
                    disabled={submittingCovoit}
                    className="theme-input text-xs font-bold py-1 bg-cordel-bg-light"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowProposerForm(false)}
                    disabled={submittingCovoit}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCovoit}
                    className="text-[10px] font-black uppercase tracking-widest bg-cordel-vert border border-encre-noire px-3.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                  >
                    {submittingCovoit ? "Envoi..." : "Valider"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </CordelCard>
      )}
    </>
  );
}
