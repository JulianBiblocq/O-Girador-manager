import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

/**
 * Composant de gestion dynamique des catégories de pratique / publics cibles.
 * Permet à l'administrateur d'ajouter, modifier ou supprimer des catégories personnalisées.
 */
export default function TabCustomCategories({
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  handleChange,
  saving
}) {
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // Ajout d'une nouvelle catégorie personnalisée
  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    if (customCategories.some(cat => cat.toLowerCase() === trimmed.toLowerCase())) {
      alert("Cette catégorie existe déjà !");
      return;
    }

    const updated = [...customCategories, trimmed];
    handleChange('customCategories', updated);
    setNewCategory('');
  };

  // Suppression d'une catégorie
  const handleRemoveCategory = (indexToRemove) => {
    if (customCategories.length <= 1) {
      alert("L'association doit conserver au moins une catégorie.");
      return;
    }
    const updated = customCategories.filter((_, idx) => idx !== indexToRemove);
    handleChange('customCategories', updated);
  };

  // Démarrage du mode édition d'une catégorie
  const handleStartEdit = (index, value) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  // Annulation de l'édition
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  // Sauvegarde de la modification locale d'une catégorie
  const handleSaveEdit = (index) => {
    const trimmed = editingValue.trim();
    if (!trimmed) return;

    const exists = customCategories.some((cat, idx) => idx !== index && cat.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert("Une autre catégorie porte déjà ce nom !");
      return;
    }

    const updated = [...customCategories];
    updated[index] = trimmed;
    handleChange('customCategories', updated);
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 my-4">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3 flex items-center gap-1.5">
        🏷️ Catégories de pratique / Publics cibles
      </h3>
      <p className="text-[10px] text-cordel-master-dark/75 mb-3 text-left leading-relaxed">
        Définissez les catégories de niveaux et publics cibles de votre association (ex: "Les Nouveaux", "Les Anciens", "Section Défilé"). Elles alimentent dynamiquement les profils membres et les filtres d'événements.
      </p>

      {/* Formulaire d'ajout de catégorie */}
      <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
          Ajouter une catégorie personnalisée
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ex: Section Défilé, Les Nouveaux..."
            className="theme-input text-xs font-bold py-1.5 flex-1 bg-cordel-bg-light"
          />
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleAddCategory}
            disabled={saving || !newCategory.trim()}
            className="text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
          >
            + Ajouter
          </CordelButton>
        </div>
      </div>

      {/* Liste des catégories configurées */}
      <div className="flex flex-col gap-2 mt-3 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
          Catégories configurées ({customCategories.length})
        </span>

        {customCategories.length === 0 ? (
          <span className="text-[10px] italic opacity-60">Aucune catégorie configurée.</span>
        ) : (
          <div className="flex flex-col gap-2">
            {customCategories.map((category, index) => {
              const isEditing = editingIndex === index;
              return (
                <div
                  key={category + index}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-cordel-bg-light border border-dashed border-cordel-master-dark/15 shadow-xs"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="theme-input text-xs font-bold py-1 px-2 flex-1 bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(index)}
                        className="text-[10px] font-bold px-2 py-1 rounded theme-bg-vert text-white cursor-pointer"
                        title="Enregistrer"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-[10px] font-bold px-2 py-1 rounded bg-neutral-300 text-neutral-800 cursor-pointer"
                        title="Annuler"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[10px] px-2 py-0.5 font-bold">
                          {index === 0 && <span className="mr-1 opacity-80" title="Équivalent historique Débutant">🌱 (1er niveau)</span>}
                          {index === 1 && <span className="mr-1 opacity-80" title="Équivalent historique Confirmé">🏆 (2ème niveau)</span>}
                          {category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(index, category)}
                          disabled={saving}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-900 cursor-pointer px-1.5 py-0.5 rounded border border-amber-600/30 bg-amber-50"
                          title="Modifier le nom"
                        >
                          ✎ Éditer
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(index)}
                          disabled={saving || customCategories.length <= 1}
                          className="text-[10px] font-bold text-red-700 hover:text-red-900 cursor-pointer px-1.5 py-0.5 rounded border border-red-600/30 bg-red-50 disabled:opacity-40"
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CordelCard>
  );
}
