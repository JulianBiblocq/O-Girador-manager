import React from 'react';

/**
 * Composant : AnnonceSelectedChips
 * 
 * Affiche la liste des membres sélectionnés sous forme de chips Cordel supprimables [Prénom Nom ×].
 *
 * @param {Array<string>} selectedUserIds - UIDs sélectionnés
 * @param {Map<string, Object>} memberMap - Map des adhérents indexée par ID
 * @param {Function} onRemoveMember - Callback pour retirer un membre
 * @param {boolean} disabled - Désactivation
 */
export default function AnnonceSelectedChips({
  selectedUserIds = [],
  memberMap,
  onRemoveMember,
  disabled = false
}) {
  if (!selectedUserIds.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {selectedUserIds.map((uid) => {
        const member = memberMap?.get(uid);
        const displayName = member
          ? `${member.prenom || ''} ${member.nom || ''}`.trim() || member.email || 'Membre'
          : 'Membre';

        return (
          <span
            key={uid}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px_6px_3px_5px] bg-amber-100 border border-encre-noire text-[8px] font-extrabold text-encre-noire shadow-[1px_1px_0px_0px_#181716]"
          >
            <span>{displayName}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => onRemoveMember(uid, e)}
              className="text-red-700 hover:text-red-900 font-black cursor-pointer ml-0.5 leading-none"
              title={`Retirer ${displayName}`}
            >
              ✕
            </button>
          </span>
        );
      })}
    </div>
  );
}
