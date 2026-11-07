import React from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

/**
 * Modale d'édition des paramètres d'une corde du Varal (nom, visibilité, upload public).
 */
export default function VaralCategoryEditModal({
  editingCategory,
  setEditingCategory,
  onSaveCategory,
  onDeleteCategory
}) {
  if (!editingCategory) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md p-6 text-left relative bg-cordel-bg shadow-xl">
        <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase mb-4 border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
          ✏️ Modifier la Corde / Catégorie
        </h3>

        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={editingCategory.nom}
              onChange={(e) => setEditingCategory((prev) => ({ ...prev, nom: e.target.value }))}
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={editingCategory.actif !== false}
              onChange={(e) => setEditingCategory((prev) => ({ ...prev, actif: e.target.checked }))}
              className="w-4 h-4 cursor-pointer mt-0.5 accent-[var(--color-cordel-vert,#2d6a4f)]"
            />
            <div className="flex flex-col">
              <span className="font-bold text-encre-noire">Afficher cette corde sur le Varal</span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                Désactivez pour masquer complètement cette corde aux adhérents.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={editingCategory.activerUploadPublic}
              onChange={(e) => setEditingCategory((prev) => ({ ...prev, activerUploadPublic: e.target.checked }))}
              className="w-4 h-4 cursor-pointer mt-0.5"
            />
            <div className="flex flex-col">
              <span className="font-bold text-encre-noire">Activer l&apos;upload public</span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                Permet aux membres d&apos;accéder à un lien externe pour verser des fichiers.
              </span>
            </div>
          </label>

          {editingCategory.activerUploadPublic && (
            <div className="flex flex-col gap-1 pl-6">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Lien d&apos;upload (Drive, Dropbox...)
              </label>
              <input
                type="url"
                value={editingCategory.lienUploadPublic || ''}
                onChange={(e) => setEditingCategory((prev) => ({ ...prev, lienUploadPublic: e.target.value }))}
                placeholder="https://..."
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              />
            </div>
          )}

          <div className="flex justify-between items-center mt-4 border-t border-dashed border-cordel-master-dark/20 pt-4 flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                await onDeleteCategory(editingCategory.id);
                setEditingCategory(null);
              }}
              className="text-[10px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>🗑️</span>
              <span>Supprimer cette corde</span>
            </button>
            <div className="flex gap-2">
              <CordelButton
                type="button"
                variant="default"
                onClick={() => setEditingCategory(null)}
                className="text-[10px] px-3 py-1.5 uppercase font-bold"
              >
                Annuler
              </CordelButton>
              <CordelButton
                type="button"
                variant="ocre"
                onClick={async () => {
                  await onSaveCategory(editingCategory);
                  setEditingCategory(null);
                }}
                className="text-[10px] px-3 py-1.5 uppercase font-bold"
              >
                Enregistrer
              </CordelButton>
            </div>
          </div>
        </div>
      </CordelCard>
    </div>
  );
}

