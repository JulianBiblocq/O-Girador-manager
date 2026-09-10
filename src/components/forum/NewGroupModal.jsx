import React, { useState, useMemo } from 'react';
import XiloAvatar from '../XiloAvatar';
import CordelButton from '../CordelButton';
import { useTerminologie } from '../../hooks/useTerminologie';

/**
 * Composant : NewGroupModal
 * 
 * Modale modulaire dédiée à la création d'une boucle de discussion de groupe multi-membres.
 * Respecte la règle Anti-Monolithe en supprimant les onglets internes superflus.
 * Seuls les adhérents actifs de l'association (statutActuel !== 'inactive' et non archivés) peuvent être invités.
 * 
 * @param {boolean} isOpen - Indique si la modale est visible
 * @param {Function} onClose - Callback de fermeture de la modale
 * @param {Function} onCreateGroupChat - Callback asynchrone recevant { name, participantIds, initialMessage }
 * @param {Array} members - Liste de tous les membres de l'association
 * @param {string} currentUserId - UID de l'utilisateur connecté
 */
export default function NewGroupModal({
  isOpen,
  onClose,
  onCreateGroupChat,
  members = [],
  currentUserId
}) {
  const { tRole } = useTerminologie();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtrer les adhérents actifs de l'association (exclure inactifs, archivés et l'utilisateur lui-même)
  const activeMembers = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];

    return members.filter((m) => {
      if (!m || m.id === currentUserId) return false;
      // Restriction stricte : statutActuel actif et non archivé
      if (m.statutActuel === 'inactive' || m.statutActuel === 'archived') return false;
      return true;
    });
  }, [members, currentUserId]);

  // Filtrer les membres selon la recherche saisie
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

  // Basculer la sélection d'un membre
  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  // Réinitialiser les champs à la fermeture ou après soumission
  const resetForm = () => {
    setGroupName('');
    setSelectedMemberIds([]);
    setInitialMessage('');
    setSearchTerm('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Soumission de la création du groupe
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onCreateGroupChat({
        name: groupName.trim(),
        participantIds: selectedMemberIds,
        initialMessage: initialMessage.trim()
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la création du groupe :', err);
      alert("Une erreur est survenue lors de la création du groupe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
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
                👥 Groupes Privés
              </span>
              <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase mt-0.5">
                Nouveau groupe de discussion
              </h3>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-lg font-extrabold text-cordel-wood hover:text-red-700 cursor-pointer p-1 transition-colors"
              title="Fermer (Échap)"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
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
                className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-encre-noire rounded focus:outline-hidden focus:ring-2 focus:ring-cordel-wood"
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
                placeholder="ex: Bonjour à tous, j'ai créé ce groupe pour coordonner..."
                className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood"
              />
            </div>

            {/* Filtrage des membres */}
            <div className="pt-1">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs opacity-60">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrer les membres à inviter..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs font-semibold bg-white/80 border border-cordel-master-dark/30 rounded focus:outline-hidden"
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

            {/* Résumé des sélectionnés */}
            <div className="flex items-center justify-between text-[9px] font-bold text-cordel-master-dark/70 pt-0.5">
              <span>
                {selectedMemberIds.length} membre{selectedMemberIds.length > 1 ? 's' : ''} sélectionné{selectedMemberIds.length > 1 ? 's' : ''}
              </span>
              {selectedMemberIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMemberIds([])}
                  className="text-cordel-wood hover:underline cursor-pointer"
                >
                  Tout désélectionner
                </button>
              )}
            </div>
          </div>

          {/* Liste de sélection avec cases à cocher */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-left scrollbar-thin">
            {filteredMembers.length === 0 ? (
              <div className="p-6 text-center bg-cordel-bg-light/60 rounded border border-dashed border-cordel-master-dark/20">
                <span className="text-xl block mb-1">👤</span>
                <p className="text-xs font-bold text-cordel-master-dark">
                  Aucun membre actif ne correspond à cette recherche.
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre';
                const isSelected = selectedMemberIds.includes(member.id);

                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`p-2 rounded border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-100/70 border-encre-noire shadow-xs font-bold'
                        : 'bg-white/80 border-cordel-master-dark/20 hover:bg-amber-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // L'état est contrôlé au clic de la ligne parente
                        className="w-4 h-4 accent-cordel-wood cursor-pointer rounded shrink-0"
                      />
                      <XiloAvatar src={member.photoURL} name={fullName} size={30} />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-encre-noire truncate block">
                          {fullName}
                        </span>
                        <span className="text-[9px] text-cordel-master-dark/60 block truncate">
                          {tRole(member.role || 'membre', member.genre)} {member.instrument ? `• ${member.instrument}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de page avec bouton vert validation */}
          <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cordel-master-dark/70 hidden sm:inline">
              Vous serez l'administrateur de ce groupe
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <CordelButton
                type="button"
                variant="default"
                onClick={handleClose}
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
      </div>
    </div>
  );
}
