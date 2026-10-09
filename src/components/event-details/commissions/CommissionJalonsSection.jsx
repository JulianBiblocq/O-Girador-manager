import React, { useState } from 'react';
import useConfirm from '../../../hooks/useConfirm';
import CommissionJalonItem from './CommissionJalonItem';

/**
 * Sous-composant du tiroir "Jalons & Rétro-planning"
 * Permet d'ajouter, modifier en ligne (titre, dates, notes) et supprimer des jalons.
 */
export default function CommissionJalonsSection({
  jalons = [],
  onChangeJalons,
  usersMap = {}
}) {
  const confirm = useConfirm();
  const [newTitre, setNewTitre] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAssigneA, setNewAssigneA] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [showAddNotes, setShowAddNotes] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Gestionnaire d'ajout — bloque impérativement la propagation
  const handleAddJalon = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newTitre.trim()) return;

    const newJalon = {
      id: `jalon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      titre: (newTitre || '').trim() || 'Nouveau jalon',
      deadline: newDeadline || null,
      status: 'a_faire',
      assigneA: newAssigneA || '',
      notes: (newNotes || '').trim(),
      creeLe: new Date().toISOString()
    };

    onChangeJalons([...jalons, newJalon]);
    setNewTitre('');
    setNewDeadline('');
    setNewAssigneA('');
    setNewNotes('');
    setShowAddNotes(false);
  };

  const handleJalonKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      handleAddJalon(e);
    }
  };

  const handleToggleStatus = (jalonId) => {
    const cycle = { a_faire: 'en_cours', en_cours: 'fait', fait: 'a_faire' };
    const updated = jalons.map((j) => (j.id === jalonId ? { ...j, status: cycle[j.status] || 'a_faire' } : j));
    onChangeJalons(updated);
  };

  const handleSaveEdit = (jalonId, updatedFields) => {
    const updated = jalons.map((j) => (j.id === jalonId ? { ...j, ...updatedFields } : j));
    onChangeJalons(updated);
  };

  const handleDeleteJalon = async (jalonId) => {
    const ok = await confirm({
      title: "Supprimer le jalon ?",
      message: "Êtes-vous sûr de vouloir supprimer ce jalon du rétro-planning ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger"
    });
    if (!ok) return;

    onChangeJalons(jalons.filter((j) => j.id !== jalonId));
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg/50 rounded-lg border border-encre-noire/20">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase text-encre-noire flex items-center gap-1.5">
          <span>🎯</span> Jalons & Rétro-planning ({jalons.filter((j) => j.status === 'fait').length}/{jalons.length})
        </h4>
      </div>

      {/* Liste des jalons */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
        {jalons.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic p-2 text-center">
            Aucun jalon défini pour le moment.
          </p>
        ) : (
          jalons.map((jalon) => (
            <CommissionJalonItem
              key={jalon.id}
              jalon={jalon}
              today={today}
              usersMap={usersMap}
              onToggleStatus={handleToggleStatus}
              onSaveEdit={handleSaveEdit}
              onDelete={handleDeleteJalon}
            />
          ))
        )}
      </div>

      {/* Zone d'ajout rapide avec champ notes dépliable */}
      <div className="flex flex-col gap-2 pt-2 border-t border-encre-noire/10">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            onKeyDown={handleJalonKeyDown}
            placeholder="Titre du jalon..."
            className="flex-1 min-w-[140px] text-xs px-2.5 py-1.5 rounded border border-encre-noire/30 bg-white focus:outline-none focus:border-encre-noire"
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            onKeyDown={handleJalonKeyDown}
            className="text-xs px-2 py-1 rounded border border-encre-noire/30 bg-white"
          />
          <input
            type="text"
            value={newAssigneA}
            onChange={(e) => setNewAssigneA(e.target.value)}
            onKeyDown={handleJalonKeyDown}
            placeholder="Responsable..."
            className="w-28 text-xs px-2 py-1.5 rounded border border-encre-noire/30 bg-white"
          />
          <button
            type="button"
            onClick={handleAddJalon}
            disabled={!newTitre.trim()}
            className="text-xs px-3 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-xs"
          >
            + Ajouter
          </button>
        </div>

        {/* Accordéon discret pour notes et détails */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddNotes(!showAddNotes)}
            className="self-start text-[10.5px] font-bold text-stone-600 hover:text-encre-noire flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{showAddNotes ? '▾ Masquer les notes' : '+ Ajouter des notes / détails'}</span>
          </button>

          {showAddNotes && (
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddJalon(e);
                } else {
                  e.stopPropagation();
                }
              }}
              placeholder="Détails, horaires, ordre de passage (retours à la ligne supportés)..."
              rows={3}
              className="w-full text-xs p-2 rounded border border-encre-noire/30 bg-white focus:outline-none focus:border-encre-noire whitespace-pre-line"
            />
          )}
        </div>
      </div>
    </div>
  );
}
