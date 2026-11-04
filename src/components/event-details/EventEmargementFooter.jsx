import React from 'react';
import TerracottaMegaphoneIcon from '../TerracottaMegaphoneIcon';

/**
 * Pied de la feuille d'émargement d'un événement :
 * décompte optionnel des participants externes (non-adhérents) et résumé global des présences.
 */
export default function EventEmargementFooter({
  isAdmin,
  invitesCount = 0,
  presentsCount = 0,
  totalParticipants = 0,
  handleInvitesChange
}) {
  return (
    <>
      {/* Décompte optionnel des participants externes / public non adhérent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50/70 rounded border border-dashed border-amber-300 text-xs">
        <div className="flex flex-col">
          <span className="font-extrabold text-cordel-wood uppercase text-[10px] flex items-center gap-1">
            <TerracottaMegaphoneIcon size={13} />
            <span>Participants invités ou public non-adhérent</span>
          </span>
          <span className="text-[10px] text-stone-600 italic">
            Utile pour les réunions publiques ou assemblées ouvertes aux sympathisants
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleInvitesChange(invitesCount - 1)}
              disabled={invitesCount <= 0}
              className="w-6 h-6 flex items-center justify-center font-black bg-white rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer select-none"
            >
              −
            </button>
          )}
          <input
            type="number"
            min="0"
            value={invitesCount}
            disabled={!isAdmin}
            onChange={(e) => handleInvitesChange(e.target.value)}
            className="theme-input text-xs w-16 text-center font-bold py-1 bg-white"
          />
          {isAdmin && (
            <button
              type="button"
              onClick={() => handleInvitesChange(invitesCount + 1)}
              className="w-6 h-6 flex items-center justify-center font-black bg-white rounded border border-neutral-300 hover:bg-neutral-100 cursor-pointer select-none"
            >
              +
            </button>
          )}
          <span className="text-[10px] font-bold text-stone-700 ml-1">personne(s)</span>
        </div>
      </div>

      {/* Résumé d'émargement */}
      <div className="flex items-center justify-between text-[10px] text-stone-600 border-t border-dashed border-neutral-300 pt-2 px-1">
        <span>
          ✓ <strong>{presentsCount}</strong> adhérent(s) émargé(s)
        </span>
        {invitesCount > 0 && (
          <span>
            + <strong>{invitesCount}</strong> non-adhérent(s)
          </span>
        )}
        <span className="font-black text-cordel-wood uppercase tracking-wider">
          = {totalParticipants} au total
        </span>
      </div>
    </>
  );
}

