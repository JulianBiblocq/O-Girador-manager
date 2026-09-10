import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import CordelButton from '../CordelButton';
import { useTerminologie } from '../../hooks/useTerminologie';

/**
 * Modale de création d'une nouvelle discussion privée (Directe ou Groupe).
 * Permet soit de démarrer un échange en tête-à-tête, soit de fonder une boucle de groupe multi-membres.
 * Règle d'adhérent actif : seuls les membres dont le statutActuel !== 'inactive' peuvent être sélectionnés.
 */
export default function NewConversationModal({
  isOpen,
  onClose,
  onStartDirectChat,
  onCreateGroupChat,
  members = [],
  currentUserId,
  existingDirectUserIds = new Set()
}) {
  const { tRole } = useTerminologie();
  const [tab, setTab] = useState('direct'); // 'direct' ou 'group'
  const [searchTerm, setSearchTerm] = useState('');
  
  // États spécifiques à la création de groupe
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrer les membres actifs de l'association (exclure inactifs, archivés et l'utilisateur lui-même)
  const activeMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];

    return members.filter((m) => {
      if (!m || m.id === currentUserId) return false;
      // Restriction obligatoire : adhérent actif (statutActuel !== 'inactive' et pas archivé)
      if (m.statutActuel === 'inactive' || m.statutActuel === 'archived') return false;
      return true;
    });
  }, [members, currentUserId]);

  // Filtrage selon la saisie de recherche
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

  // Basculer la sélection d'un membre pour le groupe
  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Soumission de la création de groupe
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateGroupChat({
        name: groupName.trim(),
        participantIds: selectedMemberIds,
        initialMessage: initialMessage.trim()
      });
      onClose();
    } catch (err) {
      console.error('Erreur création groupe :', err);
      alert("Une erreur est survenue lors de la création du groupe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none outline-none"
    >
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-[8px_6px_10px_7px] bg-cordel-bg border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden">
        
        {/* 1. En-tête de la modale avec onglets */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 bg-cordel-bg-light">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood tracking-widest block">
                ✉️ Messagerie Privée
              </span>
              <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
                Nouvelle discussion
              </h3>
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

          {/* Navigation par onglets */}
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setTab('direct')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                tab === 'direct'
                  ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-white text-encre-noire border-encre-noire/30 hover:border-encre-noire'
              }`}
            >
              👤 Message direct
            </button>
            <button
              type="button"
              onClick={() => setTab('group')}
              className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
                tab === 'group'
                  ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-white text-encre-noire border-encre-noire/30 hover:border-encre-noire'
              }`}
            >
              👥 Nouveau groupe ({selectedMemberIds.length})
            </button>
          </div>
        </div>

        {/* 2. Contenu Onglet 1 : Message direct */}
        {tab === 'direct' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Barre de recherche */}
            <div className="p-3 border-b border-dashed border-cordel-master-dark/20 bg-cordel-bg">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs opacity-60">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un membre par prénom, nom, surnom..."
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
            </div>

            {/* Liste défilante des membres pour chat direct */}
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
                      className="p-2.5 bg-white/70 hover:bg-amber-50 border border-cordel-master-dark/20 hover:border-cordel-wood rounded-[6px_8px_5px_7px] shadow-xs flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
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
          </div>
        )}

        {/* 3. Contenu Onglet 2 : Nouveau groupe privé */}
        {tab === 'group' && (
          <form onSubmit={handleCreateGroupSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-dashed border-cordel-master-dark/20 bg-cordel-bg space-y-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
                  Nom du groupe de discussion *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="ex: Covoiturage Nantes, Répétition cordes, Comité fête..."
                  className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-none focus:ring-2 focus:ring-cordel-wood"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
                  Premier message (optionnel)
                </label>
                <input
                  type="text"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="ex: Bonjour à tous, j'ai créé ce groupe pour..."
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-none focus:border-cordel-wood"
                />
              </div>

              <div className="pt-1">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs opacity-60">🔍</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrer les membres à inviter..."
                    className="w-full pl-8 pr-8 py-1.5 text-xs font-semibold bg-white/70 border border-cordel-master-dark/30 rounded focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 text-xs text-cordel-master-dark/60 hover:text-cordel-wood font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Résumé des sélectionnés */}
              <div className="flex items-center justify-between text-[9px] font-bold text-cordel-master-dark/70 pt-0.5">
                <span>
                  {selectedMemberIds.length} membre{selectedMemberIds.length > 1 ? 's' : ''} sélectionné{selectedMemberIds.length > 1 ? 's' : ''}
                </span>
                {selectedMemberIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMemberIds([])}
                    className="text-cordel-wood hover:underline"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
            </div>

            {/* Liste de sélection avec cases à cocher */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-left scrollbar-thin">
              {filteredMembers.map((member) => {
                const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
                const isSelected = selectedMemberIds.includes(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-100/70 border-encre-noire shadow-xs font-bold'
                        : 'bg-white/70 border-cordel-master-dark/20 hover:bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // géré par le conteneur parent
                        className="w-4 h-4 accent-cordel-wood cursor-pointer rounded shrink-0"
                      />
                      <XiloAvatar src={member.photoURL} name={fullName} size={30} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-encre-noire truncate block">
                          {fullName}
                        </span>
                        <span className="text-[9px] text-cordel-master-dark/60 block">
                          {tRole(member.role || 'membre', member.genre)} {member.instrument ? `• ${member.instrument}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pied de page avec bouton vert validation */}
            <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between">
              <span className="text-[10px] font-semibold text-cordel-master-dark/70">
                Vous serez l'administrateur de ce groupe
              </span>
              <div className="flex gap-2">
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-bold"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="submit"
                  variant="vert"
                  disabled={!groupName.trim() || selectedMemberIds.length === 0 || isSubmitting}
                  className="px-4 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>{isSubmitting ? 'Création...' : 'Créer le groupe'}</span>
                </CordelButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
