import React, { useState } from 'react';
import XiloAvatar from '../XiloAvatar';

/**
 * Cellule de la matrice croisée (Date × Pupitre) avec compteurs cliquables
 * pour déplier à la demande les membres « Indispo » et « Sans réponse » (< 120 lignes).
 */
export default function PollPupitreMatrixCell({
  cell = {},
  isSelected = false,
  isSuperAdminOrMestre = false,
  onSelectSlot
}) {
  // État local du tiroir déplié : null | 'indispo' | 'unanswered'
  const [expandedTab, setExpandedTab] = useState(null);

  const availableMembers = cell.availableMembers || [];
  const unavailableMembers = cell.unavailableMembers || [];
  const unansweredMembers = cell.unansweredMembers || [];
  const count = cell.count || 0;
  const totalPupitre = cell.totalPupitre || 0;
  const percentage = cell.percentage || 0;

  const toggleTab = (e, tab) => {
    e.stopPropagation();
    setExpandedTab((prev) => (prev === tab ? null : tab));
  };

  const activeList = expandedTab === 'indispo'
    ? unavailableMembers
    : expandedTab === 'unanswered'
      ? unansweredMembers
      : [];

  return (
    <td
      onClick={() => isSuperAdminOrMestre && onSelectSlot && onSelectSlot()}
      className={`p-2 border-r border-encre-noire/15 last:border-r-0 align-top transition-all ${
        isSuperAdminOrMestre ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-inset ring-[var(--color-cordel-vert,#2d6a4f)] font-bold'
          : 'hover:bg-amber-50/50'
      }`}
    >
      {/* En-tête de la cellule : compteur Dispo uniquement (sans badge Retenu avant validation) */}
      <div className="flex items-center justify-between gap-1">
        <span className={isSelected ? 'text-[var(--color-cordel-vert,#2d6a4f)] font-black' : 'font-bold text-encre-noire'}>
          {count} / {totalPupitre} dispo ({percentage}%)
        </span>
      </div>

      {/* Pastilles des membres disponibles */}
      {availableMembers.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-1">
          {availableMembers.slice(0, 4).map((m) => (
            <span
              key={m.uid}
              className="inline-flex items-center gap-0.5 text-[8.5px] bg-white/90 border border-encre-noire/20 px-1 py-0.2 rounded"
            >
              <XiloAvatar src={m.photoURL} name={m.name} size={11} /> <span>{m.prenom}</span>
            </span>
          ))}
          {availableMembers.length > 4 && (
            <span className="text-[8px] opacity-70">+{availableMembers.length - 4}</span>
          )}
        </div>
      )}

      {/* Ligne des 2 mini-badges cliquables : Indispo & Sans réponse */}
      {(unavailableMembers.length > 0 || unansweredMembers.length > 0) && (
        <div className="flex flex-wrap items-center gap-1 mt-1.5 pt-1 border-t border-dashed border-encre-noire/10">
          <button
            type="button"
            disabled={unavailableMembers.length === 0}
            onClick={(e) => unavailableMembers.length > 0 && toggleTab(e, 'indispo')}
            title={unavailableMembers.length > 0 ? 'Cliquer pour voir les indisponibles' : 'Aucun indisponible'}
            className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border transition-all ${
              expandedTab === 'indispo'
                ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white border-encre-noire'
                : 'bg-red-50/80 text-[var(--color-cordel-rouge,#8b2a1a)] border-red-800/25 hover:bg-red-100/80'
            } ${unavailableMembers.length > 0 ? 'cursor-pointer' : 'opacity-40 cursor-default'}`}
          >
            ✕ {unavailableMembers.length} indispo
          </button>

          <button
            type="button"
            disabled={unansweredMembers.length === 0}
            onClick={(e) => unansweredMembers.length > 0 && toggleTab(e, 'unanswered')}
            title={unansweredMembers.length > 0 ? 'Cliquer pour voir les membres sans réponse sur ce créneau' : 'Tout le monde a répondu'}
            className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border transition-all ${
              expandedTab === 'unanswered'
                ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-encre-noire'
                : 'bg-amber-50/80 text-[var(--color-cordel-ocre,#c05621)] border-amber-800/25 hover:bg-amber-100/80'
            } ${unansweredMembers.length > 0 ? 'cursor-pointer' : 'opacity-40 cursor-default'}`}
          >
            ⏳ {unansweredMembers.length} sans rép.
          </button>
        </div>
      )}

      {/* Tiroir compact déplié au clic uniquement */}
      {expandedTab && activeList.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-1 p-1.5 rounded bg-white/95 dark:bg-black/50 border border-encre-noire/25 flex flex-wrap items-center gap-1"
        >
          {activeList.map((m) => (
            <span
              key={m.uid}
              className="inline-flex items-center gap-0.5 text-[8px] font-semibold bg-cordel-bg-light border border-encre-noire/15 px-1 py-0.2 rounded text-encre-noire"
            >
              <XiloAvatar src={m.photoURL} name={m.name} size={10} /> <span>{m.prenom}</span>
            </span>
          ))}
        </div>
      )}
    </td>
  );
}
