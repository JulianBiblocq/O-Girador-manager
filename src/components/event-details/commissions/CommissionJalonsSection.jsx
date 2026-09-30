import React, { useState } from 'react';
import useConfirm from '../../../hooks/useConfirm';

/**
 * Sous-composant du tiroir "Jalons & Rétro-planning"
 * Permet d'ajouter, modifier l'état et supprimer des jalons.
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

  const today = new Date().toISOString().slice(0, 10);

  // Gestionnaire d'ajout — bloque impérativement la propagation
  // pour éviter de déclencher le submit du formulaire parent (CommissionEditModal)
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
      creeLe: new Date().toISOString()
    };

    onChangeJalons([...jalons, newJalon]);
    setNewTitre('');
    setNewDeadline('');
    setNewAssigneA('');
  };

  // Interception de la touche Entrée sur les champs du jalon
  // pour déclencher l'ajout sans soumettre le formulaire parent
  const handleJalonKeyDown = (e) => {
    if (e.key === 'Enter') {
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
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {jalons.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic p-2 text-center">
            Aucun jalon défini pour le moment.
          </p>
        ) : (
          jalons.map((jalon) => {
            const isDone = jalon.status === 'fait';
            const isProgress = jalon.status === 'en_cours';
            const isOverdue = !isDone && jalon.deadline && jalon.deadline < today;
            const assigneUser = usersMap[jalon.assigneA];
            const assigneNom = assigneUser ? `${assigneUser.prenom || ''} ${assigneUser.nom || ''}`.trim() : jalon.assigneA;

            return (
              <div
                key={jalon.id}
                className={`flex items-center justify-between gap-2 p-2 rounded border transition-colors ${
                  isDone
                    ? 'bg-emerald-50/80 border-[var(--color-cordel-vert)] text-stone-700'
                    : isOverdue
                    ? 'bg-rose-50/80 border-[var(--color-cordel-rouge)] text-rose-900'
                    : 'bg-white border-encre-noire/20 text-encre-noire'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(jalon.id)}
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

                <button
                  type="button"
                  onClick={() => handleDeleteJalon(jalon.id)}
                  className="text-stone-400 hover:text-[var(--color-cordel-rouge)] p-1 text-xs shrink-0"
                  title="Supprimer ce jalon"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Zone d'ajout rapide — utilise un <div> au lieu de <form> imbriqué
          pour ne pas provoquer un submit en cascade vers le formulaire parent */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-encre-noire/10">
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
          className="text-xs px-3 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
}
