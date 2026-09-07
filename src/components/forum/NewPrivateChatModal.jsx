import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import CordelButton from '../CordelButton';

/**
 * Modale de sélection d'un membre pour initier une nouvelle discussion privée.
 * Respecte les règles du projet : modularité, styles CSS sémantiques, commentaires 100% en français.
 */
export default function NewPrivateChatModal({
  isOpen,
  onClose,
  onSelectUser,
  members = [],
  currentUserId,
  existingChatUserIds = new Set()
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrage et tri alphabétique des membres de l'association
  const filteredMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];

    const term = searchTerm.toLowerCase().trim();

    return members
      .filter((m) => {
        // Exclure l'utilisateur lui-même
        if (!m || m.id === currentUserId) return false;
        // Exclure les comptes archivés
        if (m.statutActuel === 'archived') return false;

        if (!term) return true;

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
      })
      .sort((a, b) => {
        const nameA = `${a.prenom || ''} ${a.nom || ''}`.trim().toLowerCase();
        const nameB = `${b.prenom || ''} ${b.nom || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
      });
  }, [members, currentUserId, searchTerm]);

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none outline-none"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-[8px_6px_10px_7px] bg-cordel-bg border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden">
        
        {/* 1. En-tête de la modale */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex justify-between items-start bg-cordel-bg-light">
          <div>
            <span className="text-[9px] font-black uppercase text-cordel-wood tracking-widest block">
              ✉️ Messagerie Privée
            </span>
            <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
              Nouvelle discussion
            </h3>
            <p className="text-[10px] font-semibold text-cordel-master-dark/70 mt-0.5">
              Choisissez un membre pour lui envoyer un message privé
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg font-extrabold text-cordel-wood hover:text-red-700 cursor-pointer p-1"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* 2. Barre de recherche instantanée */}
        <div className="p-3 border-b border-dashed border-cordel-master-dark/20 bg-cordel-bg">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs opacity-60">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par prénom, nom, surnom ou pupitre..."
              className="w-full pl-8 pr-8 py-2 text-xs font-semibold bg-white/70 border border-cordel-master-dark/30 rounded-[4px_6px_3px_5px] focus:outline-none focus:border-cordel-wood shadow-inner"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-xs text-cordel-master-dark/60 hover:text-cordel-wood font-bold"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>
          <div className="mt-1.5 px-1 flex justify-between items-center text-[9px] font-bold text-cordel-master-dark/60">
            <span>{filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''} trouvé{filteredMembers.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* 3. Liste défilante des membres */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-left scrollbar-thin">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-cordel-bg-light/60 rounded border border-dashed border-cordel-master-dark/20">
              <span className="text-2xl block mb-2">👤</span>
              <p className="text-xs font-bold text-cordel-master-dark">
                Aucun membre ne correspond à cette recherche.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-[10px] font-black uppercase text-cordel-wood hover:underline"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
              const instrument = member.instrument || member.instrumentPrincipal;
              const hasExistingChat = existingChatUserIds && existingChatUserIds.has(member.id);

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    onSelectUser(member.id);
                    onClose();
                  }}
                  className="p-2.5 bg-white/70 hover:bg-amber-50 border border-cordel-master-dark/20 hover:border-cordel-wood rounded-[6px_8px_5px_7px] shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <XiloAvatar src={member.photoURL} name={fullName} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-encre-noire truncate">
                          {fullName}
                        </span>
                        {member.surnom && (
                          <span className="text-[10px] font-semibold text-cordel-wood italic">
                            « {member.surnom} »
                          </span>
                        )}
                        {hasExistingChat && (
                          <span className="text-[8px] font-bold text-cordel-vert bg-cordel-vert/10 px-1.5 py-0.2 rounded border border-cordel-vert/30">
                            Discussion active
                          </span>
                        )}
                      </div>
                      {instrument && (
                        <p className="text-[10px] font-bold text-cordel-master-dark/75 mt-0.5 truncate">
                          🥁 {instrument}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider theme-bg-vert text-white rounded-[4px] shadow-[1px_1px_0px_0px_#181716] hover:scale-105 active:shadow-none transition-all flex items-center gap-1"
                    >
                      <span>✉️</span>
                      <span>Écrire</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Pied de page de la modale */}
        <div className="p-3 border-t border-dashed border-cordel-master-dark/25 bg-cordel-bg flex justify-end">
          <CordelButton
            variant="default"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
          >
            Fermer
          </CordelButton>
        </div>

      </div>
    </div>
  );
}
