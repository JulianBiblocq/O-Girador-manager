import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloPeople } from './XiloIcons';
import { usePresenceContext } from '../context/PresenceContext';

export default function OnlineStatusWidget({ onlineMembers = [], onlineCount = 0, className = "", isPresenceEnabled: propIsEnabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const context = usePresenceContext();
  const isPresenceEnabled = propIsEnabled !== undefined ? propIsEnabled : context?.isPresenceEnabled;

  if (isPresenceEnabled === false) return null;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_9px_7px_8px] shadow-[1.5px_1.5px_0px_0px_#181716] hover:scale-[1.03] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer select-none ${className}`}
        title="Voir les membres connectés en temps réel"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-encre-noire">
          {onlineCount} en ligne
        </span>
      </button>

      {/* Online Members Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="relative w-full max-w-md z-10 animate-fade-in">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 text-left max-h-[85vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b-2 border-dashed border-cordel-master-dark/25 mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                    Membres en ligne ({onlineCount})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-xs font-black uppercase border border-encre-noire rounded hover:bg-neutral-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Members List */}
              <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-2.5 scrollbar-thin">
                {onlineMembers.length === 0 ? (
                  <div className="py-8 text-center text-cordel-master-dark/60 text-xs font-bold">
                    Aucun membre actuellement en ligne.
                  </div>
                ) : (
                  onlineMembers.map((member) => {
                    const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Batuqueiro';
                    const userInstruments = Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0
                      ? member.instrumentsJoues
                      : [member.instrument].filter(Boolean);

                    return (
                      <div 
                        key={member.id || member.uid}
                        className="p-2.5 border-2 border-encre-noire rounded-[6px_9px_5px_7px] bg-white shadow-[2px_2px_0px_0px_#181716] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with status indicator */}
                          <div className="relative shrink-0">
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={fullName}
                                className="w-10 h-10 rounded-[6px_4px_7px_5px] border border-encre-noire object-cover grayscale contrast-[120%] sepia-[30%]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-[6px_4px_7px_5px] border border-encre-noire bg-cordel-bg flex items-center justify-center font-black text-xs text-cordel-wood">
                                {member.prenom ? member.prenom[0].toUpperCase() : '🥁'}
                              </div>
                            )}
                            {/* Online Green Badge */}
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-encre-noire truncate flex items-center gap-1.5">
                              <span>{fullName}</span>
                              {member.surnom && (
                                <span className="text-[9px] font-bold text-cordel-wood italic">
                                  "{member.surnom}"
                                </span>
                              )}
                            </h4>

                            {userInstruments.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {userInstruments.map(inst => (
                                  <span 
                                    key={inst}
                                    className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-cordel-bg-light border border-encre-noire/30 text-encre-noire"
                                  >
                                    🎵 {inst}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-600/30 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          Actif
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20 text-center shrink-0">
                <CordelButton
                  variant="ocre"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider"
                >
                  Fermer
                </CordelButton>
              </div>
            </CordelCard>
          </div>
        </div>
      )}
    </>
  );
}
