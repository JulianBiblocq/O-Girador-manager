import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import { useTerminologie } from '../../hooks/useTerminologie';

/**
 * Composant : NewDirectMessageModal
 * 
 * Modale modulaire dédiée au démarrage direct d'une discussion en tête-à-tête (1-à-1).
 * Respecte la règle Anti-Monolithe en supprimant les onglets intermédiaires et en proposant
 * une sélection rapide avec recherche instantanée parmi les adhérents actifs de l'association.
 * 
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture de la modale
 * @param {Function} onStartDirectChat - Callback recevant l'ID du membre sélectionné
 * @param {Array} members - Liste complète des profils membres de l'association
 * @param {string} currentUserId - UID de l'utilisateur connecté
 * @param {Set} existingDirectUserIds - Ensemble des IDs de membres ayant déjà une discussion directe
 */
export default function NewDirectMessageModal({
  isOpen,
  onClose,
  onStartDirectChat,
  members = [],
  currentUserId,
  existingDirectUserIds = new Set()
}) {
  const { tRole } = useTerminologie();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les adhérents actifs de l'association (exclut inactifs, archivés et l'utilisateur lui-même)
  const activeMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];

    return members.filter((m) => {
      if (!m || m.id === currentUserId) return false;
      // Restriction stricte : adhérent actif
      if (m.statutActuel === 'inactive' || m.statutActuel === 'archived') return false;
      return true;
    });
  }, [members, currentUserId]);

  // Filtrage selon la saisie de recherche (prénom, nom, surnom, instrument, email)
  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return activeMembers;

    return activeMembers.filter((m) => {
      const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const instrument = (m.instrument || m.instrumentPrincipal || '').toLowerCase();
      const email = (m.email || '').toLowerCase();

      return (
        fullName.includes(term) ||
        surnom.includes(term) ||
        instrument.includes(term) ||
        email.includes(term)
      );
    });
  }, [activeMembers, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs animate-fade-in select-none outline-hidden"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-[8px_6px_10px_7px] bg-cordel-bg border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden">
        
        {/* En-tête de la modale */}
        <div className="shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 bg-cordel-bg-light">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood tracking-widest block">
                ✉️ Messagerie 1-à-1
              </span>
              <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
                Nouveau message direct
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-lg font-extrabold text-cordel-wood hover:text-red-700 cursor-pointer p-1 transition-colors"
              title="Fermer (Échap)"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barre de recherche instantanée */}
        <div className="p-3 border-b border-dashed border-cordel-master-dark/20 bg-cordel-bg">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs opacity-60">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un membre par prénom, nom, surnom..."
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold bg-white/80 border border-cordel-master-dark/30 rounded-[4px_6px_3px_5px] focus:outline-hidden focus:border-cordel-wood shadow-inner"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-xs text-cordel-master-dark/60 hover:text-cordel-wood font-bold cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Liste défilante des membres actifs */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-left scrollbar-thin">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-cordel-bg-light/60 rounded border border-dashed border-cordel-master-dark/20">
              <span className="text-2xl block mb-2">👤</span>
              <p className="text-xs font-bold text-cordel-master-dark">
                Aucun membre actif ne correspond à cette recherche.
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
              const hasExistingChat = existingDirectUserIds && existingDirectUserIds.has(member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    onStartDirectChat(member.id);
                    onClose();
                  }}
                  className="p-2.5 bg-white/80 hover:bg-amber-50 border border-cordel-master-dark/20 hover:border-cordel-wood rounded-[6px_8px_5px_7px] shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <XiloAvatar src={member.photoURL} name={fullName} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-encre-noire truncate">
                          {fullName}
                        </span>
                        {member.surnom && (
                          <span className="text-[10px] font-bold text-cordel-wood">
                            « {member.surnom} »
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] font-semibold text-cordel-master-dark/70">
                        <span>{tRole(member.role || 'membre', member.genre)}</span>
                        {member.instrument && <span>• 🪘 {member.instrument}</span>}
                      </div>
                    </div>
                  </div>
                  {hasExistingChat && (
                    <span className="text-[9px] font-black uppercase text-cordel-wood bg-white px-2 py-0.5 rounded border border-cordel-wood/30 shrink-0">
                      Déjà ouvert
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pied de page informatif */}
        <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between">
          <span className="text-[10px] font-semibold text-cordel-master-dark/70">
            {activeMembers.length} adhérent{activeMembers.length > 1 ? 's' : ''} disponible{activeMembers.length > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold rounded border border-cordel-master-dark/30 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
