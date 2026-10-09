import React, { useState } from 'react';

/**
 * Composant unitaire représentant un jalon de commission avec mode affichage et mode édition en ligne.
 */
export default function CommissionJalonItem({
  jalon,
  today,
  usersMap = {},
  onToggleStatus,
  onSaveEdit,
  onDelete
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitre, setEditTitre] = useState(jalon.titre || '');
  const [editDeadline, setEditDeadline] = useState(jalon.deadline || '');
  const [editAssigneA, setEditAssigneA] = useState(jalon.assigneA || '');
  const [editNotes, setEditNotes] = useState(jalon.notes || '');
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  const isDone = jalon.status === 'fait';
  const isProgress = jalon.status === 'en_cours';
  const isOverdue = !isDone && jalon.deadline && jalon.deadline < today;
  const assigneUser = usersMap[jalon.assigneA];
  const assigneNom = assigneUser ? `${assigneUser.prenom || ''} ${assigneUser.nom || ''}`.trim() : jalon.assigneA;

  const handleStartEdit = () => {
    setEditTitre(jalon.titre || ''); setEditDeadline(jalon.deadline || '');
    setEditAssigneA(jalon.assigneA || ''); setEditNotes(jalon.notes || ''); setIsEditing(true);
  };
  const handleCancelEdit = () => setIsEditing(false);
  const handleConfirmEdit = () => {
    if (!editTitre.trim()) return;
    onSaveEdit(jalon.id, { titre: editTitre.trim(), deadline: editDeadline || null, assigneA: editAssigneA.trim(), notes: (editNotes || '').trim() });
    setIsEditing(false);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancelEdit();
      return;
    }
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      handleConfirmEdit();
    }
  };

  const hasNotes = Boolean(jalon.notes && jalon.notes.trim());
  const notesLinesCount = hasNotes ? jalon.notes.trim().split('\n').length : 0;
  const isLongNotes = notesLinesCount > 2 || (jalon.notes && jalon.notes.length > 90);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-2.5 rounded border-2 border-encre-noire bg-amber-50/90 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editTitre}
            onChange={(e) => setEditTitre(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder="Titre du jalon..."
            className="flex-1 min-w-[140px] text-xs px-2 py-1 rounded border border-encre-noire/30 bg-white focus:outline-none focus:border-encre-noire font-bold"
          />
          <input
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            onKeyDown={handleEditKeyDown}
            className="text-xs px-2 py-1 rounded border border-encre-noire/30 bg-white"
          />
          <input
            type="text"
            value={editAssigneA}
            onChange={(e) => setEditAssigneA(e.target.value)}
            onKeyDown={handleEditKeyDown}
            placeholder="Responsable..."
            className="w-28 text-xs px-2 py-1 rounded border border-encre-noire/30 bg-white"
          />
        </div>

        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); handleCancelEdit(); }
            else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); handleConfirmEdit(); }
            else { e.stopPropagation(); }
          }}
          placeholder="Notes, horaires, ordre de passage (ex: 14h VraKKA, 15h Guirá...)..."
          rows={3}
          className="w-full text-xs p-2 rounded border border-encre-noire/30 bg-white focus:outline-none focus:border-encre-noire whitespace-pre-line"
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button" onClick={handleCancelEdit}
            className="px-2.5 py-1 text-xs font-bold rounded border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button" disabled={!editTitre.trim()} onClick={handleConfirmEdit}
            className="px-3 py-1 text-xs font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40 cursor-pointer shadow-xs"
          >
            ✓ Valider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
      isDone ? 'bg-emerald-50/80 border-[var(--color-cordel-vert)] text-stone-700' : isOverdue ? 'bg-rose-50/80 border-[var(--color-cordel-rouge)] text-rose-900' : 'bg-white border-encre-noire/20 text-encre-noire'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => onToggleStatus(jalon.id)}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-black border transition-transform active:scale-95 shrink-0 ${
              isDone
                ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire'
                : isProgress
                ? 'bg-[var(--color-cordel-ocre)] text-white border-encre-noire'
                : 'bg-stone-100 text-stone-400 border-stone-300'
            }`}
            title="Cliquer pour changer d'état (À faire > En cours > Fait)"
          >
            {isDone ? '✓' : isProgress ? '◐' : '○'}
          </button>

          <div className="flex flex-col min-w-0">
            <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-stone-500' : ''}`}>
              {jalon.titre}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-stone-600">
              {jalon.deadline && (
                <span className={isOverdue ? 'font-black text-[var(--color-cordel-rouge)]' : ''}>
                  📅 {jalon.deadline} {isOverdue && '(En retard)'}
                </span>
              )}
              {assigneNom && <span>👤 {assigneNom}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-stone-400 hover:text-stone-800 p-1 text-xs shrink-0 cursor-pointer"
            title="Modifier ce jalon"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(jalon.id)}
            className="text-stone-400 hover:text-[var(--color-cordel-rouge)] p-1 text-xs shrink-0 cursor-pointer"
            title="Supprimer ce jalon"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Affichage des notes et détails multilignes */}
      {hasNotes && (
        <div className="mt-1 pt-1 border-t border-dashed border-encre-noire/10 text-[11px]">
          <div
            className={`p-1.5 rounded bg-amber-50/80 border border-amber-800/15 text-stone-800 font-sans whitespace-pre-line leading-relaxed ${
              !isNotesExpanded && isLongNotes ? 'line-clamp-2' : ''
            }`}
          >
            {jalon.notes}
          </div>
          {isLongNotes && (
            <button
              type="button"
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="mt-0.5 text-[9.5px] font-bold text-amber-900 hover:underline cursor-pointer"
            >
              {isNotesExpanded ? '▲ Replier les notes' : '▼ Déplier tous les détails'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
