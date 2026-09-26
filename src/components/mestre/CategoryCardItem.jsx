import React, { useState, useEffect } from 'react';
import CordelButton from '../CordelButton';

/**
  * Composant affichant une carte de catégorie de pratique individuelle.
  * Permet la lecture standard avec actions d'édition et de suppression,
  * ainsi que le mode édition en ligne (nom, couleur, palette Cordel).
  */
export default function CategoryCardItem({
  category,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRemove,
  disabled,
  cordelPresets,
  allCategories
}) {
  const [editName, setEditName] = useState(category.name || '');
  const [editColor, setEditColor] = useState(category.color || '#8b2a1a');

  // Synchronise les valeurs locales lorsque le mode édition est activé ou que la catégorie change
  useEffect(() => {
    setEditName(category.name || '');
    setEditColor(category.color || '#8b2a1a');
  }, [category, isEditing]);

  // Validation de la saisie
  const handleValidate = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    // Vérifier l'unicité du nom (hors la catégorie en cours)
    const exists = allCategories.some(
      (c) => c.id !== category.id && (c.name || '').toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      alert("Une autre catégorie de pratique porte déjà cet intitulé !");
      return;
    }

    onSaveEdit({
      ...category,
      name: trimmed,
      color: editColor || '#8b2a1a'
    });
  };

  // Gestion des touches clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelEdit();
    }
  };

  // Affichage du mode édition en ligne
  if (isEditing) {
    return (
      <div
        className="flex flex-col gap-2.5 p-3 rounded-[4px_6px_3px_5px] border-2 border-dashed border-cordel-master-dark/40 shadow-md bg-cordel-bg-light/90 animate-scale-in"
        style={{ borderLeftColor: editColor || '#8b2a1a', borderLeftWidth: '5px' }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
            ✏️ Modifier la catégorie
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold">
            (Entrée pour valider, Échap pour annuler)
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`edit-cat-${category.id}`} className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Nouvel intitulé
          </label>
          <input
            id={`edit-cat-${category.id}`}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={disabled}
            placeholder="Ex: Première année, Plus d'un an..."
            className="theme-input text-xs font-bold py-1.5 px-2 bg-white w-full border border-cordel-master-dark/30 rounded"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              disabled={disabled}
              className="w-7 h-7 p-0 border-0 rounded cursor-pointer bg-transparent"
              title="Choisir une couleur"
            />
            <div className="flex items-center gap-1">
              {cordelPresets.slice(0, 5).map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  onClick={() => setEditColor(preset.color)}
                  className="w-4 h-4 rounded-full border border-encre-noire/40 transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: preset.color }}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <CordelButton
              type="button"
              onClick={onCancelEdit}
              disabled={disabled}
              className="text-[10px] py-1 px-2 font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleValidate}
              disabled={disabled || !editName.trim()}
              className="text-[10px] py-1 px-3 uppercase font-black"
            >
              💾 Valider
            </CordelButton>
          </div>
        </div>
      </div>
    );
  }

  // Affichage standard en lecture avec boutons Modifier et Supprimer
  return (
    <div
      className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-[4px_6px_3px_5px] border border-cordel-master-dark/30 shadow-sm bg-cordel-bg-light hover:shadow transition-shadow"
      style={{ borderLeftColor: category.color || '#8b2a1a', borderLeftWidth: '4px' }}
    >
      <div className="flex items-center gap-2 truncate">
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner"
          style={{ backgroundColor: category.color || '#8b2a1a' }}
        />
        <span className="text-xs font-black text-encre-noire truncate" title={category.name}>
          {category.name}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onStartEdit}
          disabled={disabled}
          className="text-xs text-cordel-master-dark/80 hover:text-cordel-wood hover:bg-amber-100 dark:hover:bg-amber-950/40 p-1 rounded font-bold cursor-pointer transition-colors"
          title="Modifier l'intitulé et la couleur de cette catégorie"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={() => onRemove(category.id, category.name)}
          disabled={disabled}
          className="text-xs text-[var(--theme-primary)] hover:bg-red-100 dark:hover:bg-red-950/40 p-1 rounded font-bold cursor-pointer transition-colors"
          title="Supprimer cette catégorie"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
