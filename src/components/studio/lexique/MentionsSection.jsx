import React, { useState } from 'react';
import { normalizeMentionHandle } from '../../../config/studioSocialConfig';

/**
 * Section du carnet de mentions (@) :
 * Affiche et permet d'administrer les comptes et partenaires récurrents à insérer d'un clic.
 *
 * @param {Object} props
 * @param {Array} props.mentions Liste des mentions [{ id, label, handle }]
 * @param {Function} props.onSaveMentions Callback de mise à jour de la liste
 * @param {boolean} [props.disabled=false] État de désactivation
 */
export default function MentionsSection({
  mentions = [],
  onSaveMentions,
  disabled = false
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formLabel, setFormLabel] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ouvre le formulaire d'ajout
  const handleStartAdd = () => {
    setEditingId(null);
    setFormLabel('');
    setFormHandle('@');
    setErrorMessage('');
    setIsAdding(true);
  };

  // Ouvre le formulaire d'édition pour une mention existante
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setFormLabel(item.label || '');
    setFormHandle(item.handle || '');
    setErrorMessage('');
    setIsAdding(true);
  };

  // Annule la saisie
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormLabel('');
    setFormHandle('');
    setErrorMessage('');
  };

  // Valide l'ajout ou la modification
  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanHandle = normalizeMentionHandle(formHandle);
    const cleanLabel = formLabel.trim() || cleanHandle;

    if (!cleanHandle || cleanHandle === '@') {
      setErrorMessage("Veuillez saisir un nom de compte valide (ex: @ogirador)");
      return;
    }

    let updated = [];
    if (editingId) {
      updated = mentions.map((m) =>
        m.id === editingId ? { ...m, label: cleanLabel, handle: cleanHandle } : m
      );
    } else {
      const newEntry = {
        id: `men-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        label: cleanLabel,
        handle: cleanHandle
      };
      updated = [...mentions, newEntry];
    }

    onSaveMentions(updated);
    handleCancel();
  };

  // Supprime une mention
  const handleDelete = (id, label) => {
    if (window.confirm(`Voulez-vous vraiment retirer la mention "${label}" du carnet ?`)) {
      const updated = mentions.filter((m) => m.id !== id);
      onSaveMentions(updated);
    }
  };

  return (
    <div className="bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-lg p-4 shadow-sm text-left">
      {/* En-tête de section */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-cordel-master-dark/25">
        <div>
          <h3 className="text-base font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>👤</span> Carnet de mentions (@)
          </h3>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Comptes partenaires, collectifs et tags officiels à insérer directement dans les publications.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleStartAdd}
            className="px-3 py-1.5 rounded text-xs font-bold text-white bg-[var(--color-cordel-vert)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span>➕</span> Nouvelle mention
          </button>
        )}
      </div>

      {/* Formulaire d'ajout / modification */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="my-3 p-3 bg-amber-50/60 dark:bg-neutral-800/60 border border-amber-300 dark:border-amber-700/50 rounded-md">
          <div className="text-xs font-black uppercase text-cordel-wood mb-2">
            {editingId ? "✏️ Modifier la mention" : "➕ Ajouter une mention au carnet"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-cordel-master-dark mb-1">
                Libellé du bouton (ex: O Girador) :
              </label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Nom du compte / Partenaire"
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cordel-master-dark mb-1">
                Tag exact (@handle) :
              </label>
              <input
                type="text"
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@nom_du_compte"
                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-encre-noire/30 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-cordel-vert)]"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-[11px] font-bold text-[var(--color-cordel-rouge)] mt-2">
              ⚠️ {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-dashed border-encre-noire/20">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 rounded text-xs font-semibold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded text-xs font-bold text-white bg-[var(--color-cordel-vert)] hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              💾 Enregistrer
            </button>
          </div>
        </form>
      )}

      {/* Tableau des mentions */}
      <div className="mt-3 overflow-x-auto">
        {mentions.length === 0 ? (
          <div className="py-6 text-center text-xs italic text-cordel-master-dark/60">
            Aucune mention enregistrée pour le moment. Cliquez sur "Nouvelle mention" pour commencer.
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-cordel-master-dark/20 text-left text-[11px] uppercase tracking-wider text-cordel-wood font-black">
                <th className="py-2 px-3">Bouton</th>
                <th className="py-2 px-3">Tag inséré</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10">
              {mentions.map((item) => (
                <tr key={item.id} className="hover:bg-amber-50/40 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="py-2 px-3 font-bold text-cordel-master-dark">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 border border-blue-900/30">
                      {item.label || item.handle}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-blue-800 dark:text-blue-400 font-semibold">
                    {item.handle}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleStartEdit(item)}
                        className="p-1 rounded text-neutral-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        title="Modifier la mention"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDelete(item.id, item.label || item.handle)}
                        className="p-1 rounded text-neutral-600 hover:text-[var(--color-cordel-rouge)] hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Supprimer la mention"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
