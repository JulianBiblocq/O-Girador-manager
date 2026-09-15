import React, { useState } from 'react';
import VocabForm from './VocabForm';

/**
 * Section Vocabulaire & Guide culturel :
 * Permet d'administrer les termes recommandés, les termes à éviter, leurs contextes
 * et d'activer/désactiver la pastille d'insertion rapide dans la barre du Studio Social.
 *
 * @param {Object} props
 * @param {Array} props.equivalences Liste des équivalences [{ id, preferred, avoid, context, activeChip }]
 * @param {Function} props.onSaveEquivalences Callback de mise à jour des équivalences
 * @param {boolean} [props.disabled=false] État de désactivation
 */
export default function VocabSection({
  equivalences = [],
  onSaveEquivalences,
  disabled = false
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Démarre l'ajout d'une nouvelle équivalence
  const handleStartAdd = () => {
    setEditingItem(null);
    setIsAdding(true);
  };

  // Démarre l'édition d'une équivalence existante
  const handleStartEdit = (item) => {
    setEditingItem(item);
    setIsAdding(true);
  };

  // Annule la saisie
  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
  };

  // Valide l'ajout ou la mise à jour via le formulaire
  const handleFormSubmit = (formData) => {
    let updated = [];
    if (editingItem) {
      updated = equivalences.map((eq) =>
        eq.id === editingItem.id ? { ...eq, ...formData } : eq
      );
    } else {
      const newEntry = {
        id: `eq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...formData
      };
      updated = [...equivalences, newEntry];
    }

    onSaveEquivalences(updated);
    handleCancel();
  };

  // Bascule l'état de la pastille rapide directement depuis le tableau
  const handleToggleChip = (id) => {
    const updated = equivalences.map((eq) =>
      eq.id === id ? { ...eq, activeChip: !(eq.activeChip !== false) } : eq
    );
    onSaveEquivalences(updated);
  };

  // Supprime une équivalence culturelle
  const handleDelete = (id, term) => {
    if (window.confirm(`Voulez-vous supprimer l'équivalence pour "${term}" ?`)) {
      const updated = equivalences.filter((eq) => eq.id !== id);
      onSaveEquivalences(updated);
    }
  };

  return (
    <div className="bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-lg p-4 shadow-sm text-left">
      {/* En-tête de section */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-cordel-master-dark/25">
        <div>
          <h3 className="text-base font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>📖</span> Vocabulaire & Guide culturel
          </h3>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Équivalences culturelles, termes recommandés et activation des pastilles d'insertion rapide.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleStartAdd}
            className="px-3 py-1.5 rounded text-xs font-bold text-white bg-[var(--color-cordel-vert)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>➕</span> Nouvelle équivalence
          </button>
        )}
      </div>

      {/* Formulaire modulaire d'ajout / modification */}
      {isAdding && (
        <VocabForm
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      )}

      {/* Tableau des équivalences */}
      <div className="mt-3 overflow-x-auto">
        {equivalences.length === 0 ? (
          <div className="py-6 text-center text-xs italic text-cordel-master-dark/60">
            Aucune équivalence culturelle enregistrée.
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-cordel-master-dark/20 text-left text-[11px] uppercase tracking-wider text-cordel-wood font-black">
                <th className="py-2 px-3">Terme privilégié</th>
                <th className="py-2 px-3">À éviter</th>
                <th className="py-2 px-3">Contexte</th>
                <th className="py-2 px-3 text-center">Pastille rapide</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10">
              {equivalences.map((item) => {
                const preferred = item.preferred || item.recommande;
                const avoid = item.avoid || item.aEviter;
                const context = item.context || item.contexte;
                const isChipActive = item.activeChip !== false;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/40 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-black text-cordel-master-dark">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[var(--color-cordel-vert)] dark:text-emerald-300 border border-emerald-800/30">
                        ✨ {preferred}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {avoid ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold text-[var(--color-cordel-rouge)] line-through opacity-80">
                          {avoid}
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-cordel-master-dark/80 max-w-xs leading-relaxed">
                      {context || <span className="text-neutral-400 italic">Aucun contexte</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleToggleChip(item.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all border ${
                          isChipActive
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-900/60 dark:text-emerald-200'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                        title={isChipActive ? "Désactiver la pastille rapide" : "Activer la pastille rapide"}
                      >
                        {isChipActive ? "✅ Active" : "⚪ Désactivée"}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleStartEdit(item)}
                          className="p-1 rounded text-neutral-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          title="Modifier l'équivalence"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => handleDelete(item.id, preferred)}
                          className="p-1 rounded text-neutral-600 hover:text-[var(--color-cordel-rouge)] hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Supprimer l'équivalence"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
