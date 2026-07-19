import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { useInstrumentColor } from '../../hooks/useInstrumentColor';

export default function EventRSVPSection({
  event,
  user,
  profileData,
  status,
  saving,
  isPrestationRestricted,
  existingResponse,
  instrumentChoisi,
  setInstrumentChoisi,
  isInstrumentLocked,
  transport,
  demandeRemboursementKm,
  isCalendarMenuOpen,
  setIsCalendarMenuOpen,
  handleStatusChange,
  handleSave,
  handleAddToGoogleCalendar,
  handleDownloadIcs,
  getMemberInstrumentOptions,
  getPupitreName,
  presentsByInstrument,
  allUsers,
  isAuthorized,
  handleValidatePending,
  handleUpdateMemberInstrument,
  isManualRegisterOpen,
  setIsManualRegisterOpen,
  unregisteredUsers,
  selectedManualUserId,
  setSelectedManualUserId,
  selectedManualInstrument,
  setSelectedManualInstrument,
  savingManualRegistration,
  handleManualRegister,
  handleManualUnregister,
  isRegistrationDeadlinePassed,
  t,
  agendaRequireInstrument = false,
  agendaEnableMaybeStatus = true,
  handleAddInviteExterne,
  handleRemoveInviteExterne,
  instrumentsDisponibles = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"]
}) {
  const { getColorForInstrument } = useInstrumentColor(profileData?.groupId);

  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [inviteNom, setInviteNom] = useState('');
  const [inviteFonction, setInviteFonction] = useState('');
  const [inviteInstrument, setInviteInstrument] = useState('');
  const [addingInvite, setAddingInvite] = useState(false);

  // Initialize guest instrument to first option when list is loaded
  React.useEffect(() => {
    if (instrumentsDisponibles && instrumentsDisponibles.length > 0 && !inviteInstrument) {
      setInviteInstrument(instrumentsDisponibles[0]);
    }
  }, [instrumentsDisponibles, inviteInstrument]);

  const onSubmitInvite = async (e) => {
    if (e) e.preventDefault();
    if (!inviteNom.trim() || !inviteFonction.trim() || !inviteInstrument) return;
    setAddingInvite(true);
    try {
      await handleAddInviteExterne(inviteNom, inviteFonction, inviteInstrument);
      setInviteNom('');
      setInviteFonction('');
      setIsInviteFormOpen(false);
    } catch (error) {
      console.error("Erreur lors de la validation de l'invité externe :", error);
    } finally {
      setAddingInvite(false);
    }
  };

  const getInstrumentIconPath = (instName) => {
    if (!instName) return '/favicon.svg';
    const name = instName.toLowerCase();
    if (name.includes('alfaia')) return '/icones/alfaia.svg';
    if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return '/icones/agbe.svg';
    if (name.includes('gonguê') || name.includes('gongue')) return '/icones/gongue.svg';
    if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return '/icones/caixa.svg';
    if (name.includes('chant') || name.includes('voix') || name.includes('singer') || name.includes('danse') || name.includes('dance')) return '/icones/micro.svg';
    if (name.includes('timbal')) return '/icones/timbal.svg';
    if (name.includes('mineiro')) return '/icones/mineiro.svg';
    if (name.includes('apito') || name.includes('mestre') || name.includes('chef')) return '/icones/apito.svg';
    return '/favicon.svg';
  };

  return (
    <>
      {/* RSVP Form */}
      {isRegistrationDeadlinePassed && !isAuthorized ? (
        <div className="flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4 text-center">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood text-left">
              Votre présence
            </h4>
            {existingResponse && (
              <div className="text-xs font-bold text-encre-noire mb-2 text-left">
                Votre réponse enregistrée : <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                  existingResponse.status === 'present' ? 'theme-bg-vert' :
                  existingResponse.status === 'absent' ? 'bg-cordel-wood text-cordel-bg-light' :
                  existingResponse.status === 'confirm' ? 'theme-bg-ocre' : 'bg-neutral-200'
                }`}>{
                  existingResponse.status === 'present' ? 'Présent' :
                  existingResponse.status === 'absent' ? 'Absent' :
                  existingResponse.status === 'confirm' ? 'À confirmer' : existingResponse.status
                }</span>
                {existingResponse.instrumentChoisi && (
                  <span className="ml-2 opacity-75">(Instrument : {existingResponse.instrumentChoisi})</span>
                )}
              </div>
            )}
            <div className="text-xs font-extrabold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-[6px_10px_8px_12px] border-2 border-dashed border-amber-600/30 flex flex-col items-center justify-center gap-1.5 leading-relaxed">
              <span>{t('eventDetails.registrationClosed') || "🔒 Les inscriptions pour cet événement sont closes."}</span>
            </div>
          </CordelCard>

          {/* Calendar Sync Button can still be visible */}
          <div className="relative w-full mt-2">
            <button
              type="button"
              onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-cordel-bg-light text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] hover:bg-cordel-hover active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer h-full min-h-[46px]"
            >
              📅 Ajouter à mon agenda
            </button>
            
            {isCalendarMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCalendarMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-2 w-full min-w-[180px] bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[3px_3px_0px_0px_#181716] py-1.5 z-50 flex flex-col text-left">
                  <button
                     type="button"
                     onClick={() => {
                       handleAddToGoogleCalendar();
                       setIsCalendarMenuOpen(false);
                     }}
                     className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                  >
                     🔵 Google Agenda
                  </button>
                  <div className="border-t border-dashed border-encre-noire/15 my-0.5" />
                  <button
                     type="button"
                     onClick={() => {
                       handleDownloadIcs();
                       setIsCalendarMenuOpen(false);
                     }}
                     className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                  >
                     🍏 Apple / Outlook (.ics)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
              Votre présence
            </h4>
            
            {/* Status Selection Buttons */}
            <div className={`grid ${agendaEnableMaybeStatus ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
              <button
                type="button"
                disabled={saving || isPrestationRestricted || event.status === 'annule'}
                onClick={() => handleStatusChange('present')}
                className={`
                  theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                  ${status === 'present' 
                    ? 'theme-bg-vert font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                    : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                  ${(isPrestationRestricted || event.status === 'annule') ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                Présent
              </button>
              
              <button
                type="button"
                disabled={saving || event.status === 'annule'}
                onClick={() => handleStatusChange('absent')}
                className={`
                  theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                  ${status === 'absent' 
                    ? 'bg-cordel-wood text-cordel-bg-light font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                    : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                  ${event.status === 'annule' ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                Absent
              </button>

              {agendaEnableMaybeStatus && (
                <button
                  type="button"
                  disabled={saving || isPrestationRestricted || event.status === 'annule'}
                  onClick={() => handleStatusChange('confirm')}
                  className={`
                    theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                    ${status === 'confirm' 
                      ? 'theme-bg-ocre font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                      : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                    ${(isPrestationRestricted || event.status === 'annule') ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  À confirmer
                </button>
              )}
            </div>

            {/* Cancellation warning message */}
            {event.status === 'annule' && (
              <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
                🚫 Les inscriptions sont fermées car cet événement a été annulé.
              </div>
            )}

            {/* Restriction warning message */}
            {isPrestationRestricted && (
              <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
                🚫 Prestation réservée aux musiciens confirmés.
              </div>
            )}

            {/* Validation pending / refused warning message */}
            {existingResponse?.status === 'pending' && (
              <div className="text-[11px] font-extrabold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-2.5 rounded border border-dashed border-yellow-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
                ⏳ Votre inscription est en attente de validation par l'administrateur.
              </div>
            )}
            {existingResponse?.status === 'refused' && (
              <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
                🚫 Votre inscription a été refusée par l'administrateur.
              </div>
            )}

            {/* Conditional Instrument Choice Options */}
            {status === 'present' && (isInstrumentLocked || agendaRequireInstrument || (profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 1)) && (
              <div className="flex flex-col gap-4 border-t border-dashed border-cordel-master-dark/20 pt-4 mt-2">
                
                {/* Choice of Instrument for Polyvalents or locked notice */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
                    Choix d'Instrument
                  </h4>
                  {isInstrumentLocked ? (
                    <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded border border-dashed border-blue-500/30 flex items-center justify-center gap-1.5 select-none leading-relaxed">
                      Le Mestre a défini ton instrument pour cette date : {instrumentChoisi}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                        Avec quel instrument vas-tu jouer pour cet événement ?
                      </label>
                      <select
                        value={instrumentChoisi}
                        onChange={(e) => setInstrumentChoisi(e.target.value)}
                        disabled={saving}
                        className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                      >
                        {(() => {
                          const options = getMemberInstrumentOptions(profileData);
                          if (instrumentChoisi && !options.includes(instrumentChoisi)) {
                            options.push(instrumentChoisi);
                          }
                          return options.map((inst) => {
                            const pupitreName = getPupitreName(inst);
                            return (
                              <option key={inst} value={inst}>
                                {pupitreName ? `${inst} (${pupitreName})` : inst}
                              </option>
                            );
                          });
                        })()}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CordelCard>

          {/* Action Buttons: Validation & Calendar Sync */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              disabled={saving || event.status === 'annule'}
              type="submit"
              className="flex-1 py-3"
            >
              {saving ? "Validation..." : "Valider mon inscription"}
            </CordelButton>

            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
                className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-cordel-bg-light text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] hover:bg-cordel-hover active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer h-full min-h-[46px]"
              >
                📅 Ajouter à mon agenda
              </button>
              
              {isCalendarMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsCalendarMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-full min-w-[180px] bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[3px_3px_0px_0px_#181716] py-1.5 z-50 flex flex-col text-left">
                    <button
                       type="button"
                       onClick={() => {
                         handleAddToGoogleCalendar();
                         setIsCalendarMenuOpen(false);
                       }}
                       className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                    >
                       🔵 Google Agenda
                    </button>
                    <div className="border-t border-dashed border-encre-noire/15 my-0.5" />
                    <button
                       type="button"
                       onClick={() => {
                         handleDownloadIcs();
                         setIsCalendarMenuOpen(false);
                       }}
                       className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                    >
                       🍏 Apple / Outlook (.ics)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      )}

      {/* 👥 Tableau nominatif des présences */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
          👥 Tableau de présence / Inscriptions
        </h4>

        {/* Grouped by instrument for prestation, repetition, stage, atelier */}
        {(event.type === 'prestation' || event.type === 'repetition' || event.type === 'stage' || event.type === 'atelier') ? (
          Object.keys(presentsByInstrument).length === 0 ? (
            <p className="text-[11px] italic opacity-60">Aucun membre présent pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2.5 theme-inner-panel p-3.5 rounded text-left">
              {Object.keys(presentsByInstrument).map(inst => {
                const list = presentsByInstrument[inst];
                const isLinked = inst.includes(' + ');
                return (
                  <div key={inst} className="text-xs leading-normal">
                    <strong className="text-cordel-wood flex items-center gap-1.5 mb-1">
                      <img src={getInstrumentIconPath(inst)} alt={inst} className="w-4 h-4 object-contain dark:invert inline-block" />
                      {(() => {
                        const pupitreName = getPupitreName(inst);
                        return pupitreName ? `${inst} (${pupitreName})` : inst;
                      })()} ({list.length})
                      {isLinked && (() => {
                        const count = inst.split(' + ').length;
                        const badgeText = count > 2 
                          ? (t('eventDetails.multiRole') || "Multi-Rôles")
                          : (t('eventDetails.doubleRole') || "Double Rôle");
                        return (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-extrabold uppercase border border-amber-600/30 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-sm inline-block select-none leading-none">
                            {badgeText}
                          </span>
                        );
                      })()} :
                    </strong>
                    <div className="flex flex-wrap gap-1.5 items-center pl-4">
                       {list.map(u => (
                         <div 
                           key={u.id || `${u.prenom}-${u.nom}`} 
                           className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-encre-noire/15 text-xs font-semibold text-encre-noire"
                           style={{ backgroundColor: getColorForInstrument(inst, 'pastel') }}
                         >
                           <XiloAvatar src={u.photoURL} name={u.isInvite ? u.prenom : `${u.prenom} ${u.nom}`} size={18} />
                           <span>
                             {u.isInvite ? u.prenom : `${u.prenom} ${u.nom}`}
                             {u.isInvite && (
                               <span className="ml-1 px-1 py-0.5 text-[8px] font-extrabold uppercase border border-amber-600/30 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-sm inline-block select-none leading-none">
                                 [Invité]
                               </span>
                             )}
                           </span>
                           {isAuthorized && (
                             u.isInvite ? (
                               <button
                                 type="button"
                                 onClick={() => handleRemoveInviteExterne(u.id)}
                                 className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                                 title="Retirer cet invité"
                               >
                                 🗑️
                               </button>
                             ) : (
                               u.id && (
                                 <button
                                   type="button"
                                   onClick={() => handleManualUnregister(u.id)}
                                   className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                                   title="Désinscrire ce membre"
                                 >
                                   ✕
                                 </button>
                               )
                             )
                           )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3.5 theme-inner-panel p-3.5 rounded text-xs text-left">
            <div>
              <strong className="text-green-600 block border-b border-dashed border-green-500/10 pb-0.5 mb-1">
                ✅ Présents ({((event.inscriptions || []).filter(i => i.status === 'present').length) + ((event.invitesExternes || []).length)})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'present').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div 
                      key={i.userId} 
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-encre-noire/15 text-xs font-semibold text-encre-noire"
                      style={{ backgroundColor: getColorForInstrument(userInfo.instrument, 'pastel') }}
                    >
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => handleManualUnregister(i.userId)}
                          className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                          title="Désinscrire ce membre"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
                {(event.invitesExternes || []).map(i => (
                  <div 
                    key={i.id} 
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-encre-noire/15 text-xs font-semibold text-encre-noire"
                    style={{ backgroundColor: getColorForInstrument(i.fonction, 'pastel') }}
                  >
                    <XiloAvatar src={null} name={i.nom} size={18} />
                    <span>
                      {i.nom} <span className="text-[10px] opacity-75 font-normal">({i.fonction})</span>
                      <span className="ml-1 px-1 py-0.5 text-[8px] font-extrabold uppercase border border-amber-600/30 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-sm inline-block select-none leading-none">
                        [Invité]
                      </span>
                    </span>
                    {isAuthorized && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInviteExterne(i.id)}
                        className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                        title="Retirer cet invité"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
                {(event.inscriptions || []).filter(i => i.status === 'present').length === 0 && (event.invitesExternes || []).length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
            <div>
              <strong className="text-red-600 block border-b border-dashed border-red-500/10 pb-0.5 mb-1">
                ❌ Absents ({(event.inscriptions || []).filter(i => i.status === 'absent').length})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'absent').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => handleManualUnregister(i.userId)}
                          className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                          title="Désinscrire ce membre"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
                {(event.inscriptions || []).filter(i => i.status === 'absent').length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
            <div>
              <strong className="text-amber-600 block border-b border-dashed border-amber-500/10 pb-0.5 mb-1">
                ⏳ À confirmer ({(event.inscriptions || []).filter(i => i.status === 'confirm').length})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'confirm').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => handleManualUnregister(i.userId)}
                          className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5"
                          title="Désinscrire ce membre"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
                {(event.inscriptions || []).filter(i => i.status === 'confirm').length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
          </div>
        )}

        {/* Validation section */}
        {((event.inscriptions || []).some(i => i.status === 'pending' || i.status === 'refused') || isAuthorized) && (
          <div className="flex flex-col gap-3.5 theme-inner-panel p-3.5 rounded text-xs text-left mt-3.5 border-t border-dashed border-cordel-master-dark/15">
            {/* Pending validations list */}
            {((event.inscriptions || []).some(i => i.status === 'pending') || isAuthorized) && (
              <div>
                <strong className="text-yellow-600 block border-b border-dashed border-yellow-500/10 pb-0.5 mb-1">
                  ⏳ En attente de validation ({(event.inscriptions || []).filter(i => i.status === 'pending').length})
                </strong>
                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                  {(event.inscriptions || []).filter(i => i.status === 'pending').map(i => {
                    const userInfo = allUsers.find(u => u.id === i.userId) || {};
                    return (
                      <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-1 rounded border border-dashed border-yellow-500/30 text-xs font-semibold text-encre-noire">
                        <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                        <span>{i.userName}</span>
                        {isAuthorized && (
                          <div className="flex items-center gap-1 ml-1.5 border-l border-encre-noire/15 pl-1.5 font-bold">
                            <button
                              type="button"
                              onClick={() => handleValidatePending(i.userId, 'present')}
                              className="text-green-600 hover:text-green-800 text-[10px] font-black cursor-pointer px-1 py-0.5 bg-green-50 border border-green-300 rounded hover:bg-green-100"
                              title="Valider l'inscription"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleValidatePending(i.userId, 'refused')}
                              className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer px-1 py-0.5 bg-red-50 border border-red-300 rounded hover:bg-red-100 animate-none"
                              title="Refuser l'inscription"
                            >
                              ✗
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualUnregister(i.userId)}
                              className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1 pl-1 border-l border-encre-noire/15"
                              title="Désinscrire ce membre"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(event.inscriptions || []).filter(i => i.status === 'pending').length === 0 && <span className="opacity-60 italic">Aucun</span>}
                </div>
              </div>
            )}

            {/* Refused registrations list */}
            {((event.inscriptions || []).some(i => i.status === 'refused') || isAuthorized) && (
              <div>
                <strong className="text-gray-600 block border-b border-dashed border-gray-500/10 pb-0.5 mb-1">
                  🚫 Inscriptions refusées ({(event.inscriptions || []).filter(i => i.status === 'refused').length})
                </strong>
                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                  {(event.inscriptions || []).filter(i => i.status === 'refused').map(i => {
                    const userInfo = allUsers.find(u => u.id === i.userId) || {};
                    return (
                      <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-1 rounded border border-dashed border-gray-300 text-xs font-semibold text-encre-noire opacity-70">
                        <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                        <span>{i.userName}</span>
                        {isAuthorized && (
                          <div className="flex items-center gap-1 ml-1.5 border-l border-encre-noire/15 pl-1.5 font-bold">
                            <button
                              type="button"
                              onClick={() => handleValidatePending(i.userId, 'present')}
                              className="text-green-600 hover:text-green-800 text-[10px] font-black cursor-pointer px-1 py-0.5 bg-green-50 border border-green-300 rounded hover:bg-green-100"
                              title="Valider/Rétablir l'inscription"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleManualUnregister(i.userId)}
                              className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer ml-1.5 border-l border-encre-noire/15 pl-1.5 font-black"
                              title="Désinscrire ce membre"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(event.inscriptions || []).filter(i => i.status === 'refused').length === 0 && <span className="opacity-60 italic">Aucun</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthorized && (event.inscriptions || []).filter(i => i.status === 'present').length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left flex flex-col gap-3">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-1">
              🛠️ Gestion des instruments par Mestre
            </h5>
            <div className="flex flex-col gap-2.5 bg-white/40 dark:bg-black/20 p-3 rounded border border-dashed border-encre-noire/15">
              {(event.inscriptions || [])
                .filter(ins => ins.status === 'present')
                .map(ins => {
                  const userInfo = allUsers.find(u => u.id === ins.userId) || {};
                  const memberInstruments = getMemberInstrumentOptions(userInfo);
                  
                  const currentInst = ins.instrumentChoisi || userInfo.instrument || 'Autre';
                  const isLocked = !!ins.instrumentImposeParMestre;

                  return (
                    <div key={ins.userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-dashed border-encre-noire/10 pb-2 last:border-0 last:pb-0 text-xs">
                      <span className="font-bold text-encre-noire truncate sm:max-w-[180px] flex items-center gap-1.5">
                        <XiloAvatar src={userInfo.photoURL} name={ins.userName} size={20} />
                        <span>{ins.userName}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={currentInst}
                          onChange={(e) => handleUpdateMemberInstrument(ins.userId, e.target.value, isLocked)}
                          className="theme-input text-[11px] font-bold py-1 bg-cordel-bg-light"
                        >
                          {!memberInstruments.includes(currentInst) && (() => {
                            const pupitreName = getPupitreName(currentInst);
                            return (
                              <option value={currentInst}>
                                {pupitreName ? `${currentInst} (${pupitreName})` : currentInst}
                              </option>
                            );
                          })()}
                          {memberInstruments.map(inst => {
                            const pupitreName = getPupitreName(inst);
                            return (
                              <option key={inst} value={inst}>
                                {pupitreName ? `${inst} (${pupitreName})` : inst}
                              </option>
                            );
                          })}
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase select-none">
                          <input
                            type="checkbox"
                            checked={isLocked}
                            onChange={(e) => handleUpdateMemberInstrument(ins.userId, currentInst, e.target.checked)}
                            className="scale-95 cursor-pointer"
                          />
                          <span>Imposer</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {isAuthorized && (
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left flex flex-col gap-3">
            {!isManualRegisterOpen && !isInviteFormOpen ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualRegisterOpen(true);
                    if (unregisteredUsers.length > 0) {
                      const firstUser = unregisteredUsers[0];
                      setSelectedManualUserId(firstUser.id);
                      setSelectedManualInstrument(firstUser.instrument || 'Autre');
                    }
                  }}
                  className="theme-btn text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-[4px_6px_3px_5px] flex items-center gap-1.5 hover:bg-cordel-hover cursor-pointer"
                >
                  ➕ Inscrire un membre
                </button>
                <button
                  type="button"
                  onClick={() => setIsInviteFormOpen(true)}
                  className="theme-btn text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-[4px_6px_3px_5px] flex items-center gap-1.5 hover:bg-cordel-hover cursor-pointer"
                >
                  👤 Ajouter un invité extérieur
                </button>
              </div>
            ) : isManualRegisterOpen ? (
              <form onSubmit={handleManualRegister} className="flex flex-col gap-3 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15">
                <div className="flex justify-between items-center border-b border-dashed border-encre-noire/10 pb-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood">
                    Inscrire un membre à sa place
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualRegisterOpen(false);
                      setSelectedManualUserId('');
                      setSelectedManualInstrument('');
                    }}
                    className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select Member */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Membre
                    </label>
                    <select
                      value={selectedManualUserId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setSelectedManualUserId(uid);
                        const usr = unregisteredUsers.find(u => u.id === uid);
                        if (usr) {
                          setSelectedManualInstrument(usr.instrument || 'Autre');
                        }
                      }}
                      className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg-light"
                      required
                    >
                      <option value="" disabled>Sélectionner un membre...</option>
                      {unregisteredUsers.length === 0 ? (
                        <option disabled>Tous les membres sont inscrits</option>
                      ) : (
                        unregisteredUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.prenom} {u.nom} {u.instrument ? `(🎵 ${u.instrument})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Select Instrument/Role */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Instrument / Rôle
                    </label>
                    <select
                      value={selectedManualInstrument}
                      onChange={(e) => setSelectedManualInstrument(e.target.value)}
                      className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg-light"
                      required
                    >
                      <option value="" disabled>Sélectionner un instrument/rôle...</option>
                      {(() => {
                        const targetUser = unregisteredUsers.find(u => u.id === selectedManualUserId);
                        const opts = getMemberInstrumentOptions(targetUser);
                        return opts.map(inst => {
                          const pupitreName = getPupitreName(inst);
                          return (
                            <option key={inst} value={inst}>
                              {pupitreName ? `${inst} (${pupitreName})` : inst}
                            </option>
                          );
                        });
                      })()}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={savingManualRegistration || !selectedManualUserId || !selectedManualInstrument}
                    className="theme-btn theme-stamp-badge theme-stamp-badge-wood text-[10px] font-black uppercase tracking-wider py-1.5 px-3 cursor-pointer disabled:opacity-50"
                  >
                    {savingManualRegistration ? "Validation..." : "Valider l'inscription"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={onSubmitInvite} className="flex flex-col gap-3 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15">
                <div className="flex justify-between items-center border-b border-dashed border-encre-noire/10 pb-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood">
                    Ajouter un invité extérieur
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteFormOpen(false);
                      setInviteNom('');
                      setInviteFonction('');
                    }}
                    className="text-red-600 hover:text-red-800 text-[10px] font-black cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Guest Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={inviteNom}
                      onChange={(e) => setInviteNom(e.target.value)}
                      className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg-light"
                      placeholder="Ex: Jean Dupont"
                      required
                    />
                  </div>

                  {/* Guest Function */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Fonction
                    </label>
                    <input
                      type="text"
                      value={inviteFonction}
                      onChange={(e) => setInviteFonction(e.target.value)}
                      className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg-light"
                      placeholder="Ex: Musicien remplaçant"
                      required
                    />
                  </div>

                  {/* Guest Instrument/Pupitre */}
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Pupitre / Instrument
                    </label>
                    <select
                      value={inviteInstrument}
                      onChange={(e) => setInviteInstrument(e.target.value)}
                      className="theme-input text-[11px] font-bold py-1.5 px-2 bg-cordel-bg-light w-full"
                      required
                    >
                      {instrumentsDisponibles.map(inst => (
                        <option key={inst} value={inst}>{inst}</option>
                      ))}
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="submit"
                    disabled={addingInvite || !inviteNom.trim() || !inviteFonction.trim()}
                    className="theme-btn theme-stamp-badge theme-stamp-badge-wood text-[10px] font-black uppercase tracking-wider py-1.5 px-3 cursor-pointer disabled:opacity-50"
                  >
                    {addingInvite ? "Ajout..." : "+ Ajouter"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </CordelCard>
    </>
  );
}
