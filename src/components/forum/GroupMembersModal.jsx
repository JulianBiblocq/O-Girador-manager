import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import CordelButton from '../CordelButton';
import { useTerminologie } from '../../hooks/useTerminologie';
import useConfirm from '../../hooks/useConfirm';

/**
 * Modale de gestion des membres et informations d'un groupe privé.
 * Permet de visualiser les participants, d'en ajouter de nouveaux, d'en retirer,
 * de renommer le groupe et de quitter la boucle de discussion.
 */
export default function GroupMembersModal({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  isSystemAdmin = false,
  allMembers = [],
  onAddParticipants,
  onRemoveParticipant,
  onRenameGroup,
  onLeaveGroup
}) {
  const { tRole } = useTerminologie();
  const { confirm } = useConfirm();

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation?.name || '');
  const [submitting, setSubmitting] = useState(false);

  // Vérifier si l'utilisateur courant est administrateur du groupe ou de l'association
  const isGroupAdmin = useMemo(() => {
    if (!conversation) return false;
    if (isSystemAdmin) return true;
    if (conversation.createdBy === currentUserId) return true;
    if (Array.isArray(conversation.adminIds) && conversation.adminIds.includes(currentUserId)) return true;
    return false;
  }, [conversation, currentUserId, isSystemAdmin]);

  // Carte des membres par identifiant
  const membersMap = useMemo(() => {
    const map = {};
    allMembers.forEach((m) => {
      if (m?.id) map[m.id] = m;
    });
    return map;
  }, [allMembers]);

  // Liste des participants actuels
  const currentParticipants = useMemo(() => {
    if (!conversation?.participantIds) return [];
    return conversation.participantIds.map((id) => membersMap[id] || { id, prenom: 'Membre', nom: '' });
  }, [conversation?.participantIds, membersMap]);

  // Membres éligibles pour être ajoutés au groupe (actifs et pas encore dans le groupe)
  const eligibleMembers = useMemo(() => {
    if (!conversation?.participantIds) return [];
    const currentSet = new Set(conversation.participantIds);
    const term = searchTerm.toLowerCase().trim();

    return allMembers
      .filter((m) => {
        if (!m || currentSet.has(m.id)) return false;
        if (m.statutActuel === 'inactive' || m.statutActuel === 'archived') return false;
        if (!term) return true;

        const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
        const surnom = (m.surnom || '').toLowerCase();
        return fullName.includes(term) || surnom.includes(term);
      })
      .sort((a, b) => {
        const nameA = `${a.prenom || ''} ${a.nom || ''}`.trim().toLowerCase();
        const nameB = `${b.prenom || ''} ${b.nom || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB, 'fr');
      });
  }, [allMembers, conversation?.participantIds, searchTerm]);

  // Renommage du groupe
  const handleSaveTitle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onRenameGroup(conversation.id, newTitle.trim());
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Erreur renommage groupe :', err);
      alert('Impossible de renommer le groupe.');
    } finally {
      setSubmitting(false);
    }
  };

  // Ajout des participants sélectionnés
  const handleAddSubmit = async () => {
    if (selectedToAdd.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      await onAddParticipants(conversation.id, selectedToAdd);
      setSelectedToAdd([]);
      setIsAdding(false);
      setSearchTerm('');
    } catch (err) {
      console.error('Erreur ajout participants :', err);
      alert("Erreur lors de l'ajout des participants.");
    } finally {
      setSubmitting(false);
    }
  };

  // Retrait d'un participant
  const handleRemoveMember = async (member) => {
    const ok = await confirm({
      title: 'Retirer du groupe',
      message: `Voulez-vous vraiment retirer ${member.prenom || 'ce membre'} de cette boucle de discussion ?`,
      confirmText: 'Retirer',
      cancelText: 'Annuler',
      variant: 'danger'
    });

    if (ok) {
      try {
        await onRemoveParticipant(conversation.id, member.id);
      } catch (err) {
        console.error('Erreur retrait participant :', err);
        alert('Impossible de retirer ce membre.');
      }
    }
  };

  // Quitter le groupe
  const handleLeaveGroup = async () => {
    const ok = await confirm({
      title: 'Quitter le groupe',
      message: `Voulez-vous vraiment quitter la discussion "${conversation.name}" ? Vous ne recevrez plus les nouveaux messages.`,
      confirmText: 'Oui, quitter',
      cancelText: 'Annuler',
      variant: 'danger'
    });

    if (ok) {
      try {
        await onLeaveGroup(conversation.id);
        onClose();
      } catch (err) {
        console.error('Erreur sortie du groupe :', err);
        alert('Impossible de quitter le groupe.');
      }
    }
  };

  if (!isOpen || !conversation) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none outline-none"
    >
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-[8px_6px_10px_7px] bg-cordel-bg border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden text-left">
        
        {/* 1. En-tête avec nom du groupe */}
        <div className="p-4 border-b-2 border-dashed border-cordel-master-dark/25 bg-cordel-bg-light flex-shrink-0">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase text-cordel-wood tracking-widest block">
              👥 Groupe Privé • {currentParticipants.length} participant{currentParticipants.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-lg font-extrabold text-cordel-wood hover:text-red-700 cursor-pointer p-1"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-2 py-1 text-sm font-bold bg-white border-2 border-encre-noire rounded"
                autoFocus
              />
              <CordelButton type="submit" variant="vert" className="px-3 py-1 text-xs">
                ✓
              </CordelButton>
              <CordelButton
                type="button"
                variant="default"
                onClick={() => setIsEditingTitle(false)}
                className="px-2.5 py-1 text-xs"
              >
                ✕
              </CordelButton>
            </form>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase truncate">
                {conversation.name}
              </h3>
              {isGroupAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTitle(conversation.name);
                    setIsEditingTitle(true);
                  }}
                  className="text-xs text-cordel-wood hover:underline font-bold ml-2 shrink-0"
                  title="Renommer le groupe"
                >
                  ✏️ Modifier
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Liste des participants ou formulaire d'ajout */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {/* Bouton pour basculer vers l'ajout de membres */}
          {isGroupAdmin && !isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2 px-3 bg-white/70 hover:bg-amber-50 border border-dashed border-cordel-wood text-cordel-wood font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <span>➕</span>
              <span>Ajouter des participants</span>
            </button>
          )}

          {/* Formulaire d'ajout de membres */}
          {isAdding && (
            <div className="p-3 bg-white/80 border-2 border-encre-noire rounded-[6px_8px_5px_7px] space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase text-encre-noire">
                  Inviter des membres
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setSelectedToAdd([]);
                  }}
                  className="text-xs font-bold text-cordel-wood hover:underline"
                >
                  Annuler
                </button>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par prénom, nom..."
                className="w-full px-2.5 py-1.5 text-xs font-semibold bg-cordel-bg border border-cordel-master-dark/30 rounded focus:outline-none"
                autoFocus
              />

              <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                {eligibleMembers.length === 0 ? (
                  <p className="text-[10px] text-cordel-master-dark/70 py-2 text-center">
                    Aucun membre éligible trouvé.
                  </p>
                ) : (
                  eligibleMembers.map((member) => {
                    const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Membre';
                    const isSelected = selectedToAdd.includes(member.id);

                    return (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== member.id) : [...prev, member.id]
                          );
                        }}
                        className={`p-1.5 rounded flex items-center justify-between text-xs cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-100 border-encre-noire font-bold'
                            : 'bg-white/60 border-transparent hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 accent-cordel-wood shrink-0"
                          />
                          <XiloAvatar src={member.photoURL} name={fullName} size={24} />
                          <span className="truncate">{fullName}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 border-t border-dashed border-cordel-master-dark/20 flex justify-end">
                <CordelButton
                  type="button"
                  variant="vert"
                  disabled={selectedToAdd.length === 0 || submitting}
                  onClick={handleAddSubmit}
                  className="px-3 py-1 text-xs font-black uppercase tracking-wider"
                >
                  ✓ Ajouter ({selectedToAdd.length})
                </CordelButton>
              </div>
            </div>
          )}

          {/* Liste des participants réguliers */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/70 block">
              Membres du groupe ({currentParticipants.length})
            </span>
            {currentParticipants.map((member) => {
              const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
              const isAdmin = conversation.createdBy === member.id || (conversation.adminIds && conversation.adminIds.includes(member.id));
              const isMe = member.id === currentUserId;

              return (
                <div
                  key={member.id}
                  className="p-2 bg-white/70 border border-cordel-master-dark/20 rounded flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <XiloAvatar src={member.photoURL} name={fullName} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-encre-noire truncate">
                          {fullName} {isMe ? '(Vous)' : ''}
                        </span>
                        {isAdmin && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-cordel-wood text-white px-1.5 py-0.2 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-cordel-master-dark/60 block">
                        {tRole(member.role || 'membre', member.genre)}
                      </span>
                    </div>
                  </div>

                  {/* Bouton de retrait si admin du groupe et pas sur soi-même */}
                  {isGroupAdmin && !isMe && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      className="text-[10px] text-cordel-wood hover:text-red-700 font-bold p-1 cursor-pointer"
                      title="Retirer du groupe"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Pied de page avec bouton Quitter le groupe (Rouge Terre Cuite) */}
        <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between">
          <CordelButton
            type="button"
            variant="rouge"
            onClick={handleLeaveGroup}
            className="px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1 text-white"
          >
            <span>🚪</span>
            <span>Quitter le groupe</span>
          </CordelButton>

          <CordelButton
            type="button"
            variant="default"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold"
          >
            Fermer
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
