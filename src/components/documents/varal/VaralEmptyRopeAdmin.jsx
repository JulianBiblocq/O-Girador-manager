import React from 'react';
import CordelCard from '../../CordelCard';
import { useTranslation } from '../../LanguageContext';

/**
 * Rendu compact pour les cordes vides ou inactives visible uniquement par les administrateurs (Règle 3).
 * Affiche un bandeau très discret avec badges d'avertissement et boutons d'action rapide.
 */
export default function VaralEmptyRopeAdmin({
  category,
  isInactive = false,
  variant = 'default',
  canDeposit = false,
  canWrite = false,
  isAuthorized = false,
  onOpenAdd,
  onNavigateToView,
  onEditCategory
}) {
  const { t } = useTranslation();
  const categoryLabel = category?.nom || category?.id || '';

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className={`py-2 px-3 relative overflow-hidden bg-[#FEF9E7]/80 dark:bg-[#1A1712]/80 border border-dashed ${
        isInactive
          ? 'border-[var(--color-cordel-rouge,#8b2a1a)]/40 opacity-75'
          : 'border-cordel-master-dark/30'
      } rounded-lg shadow-xs w-full my-2 transition-all select-none`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge Cordel de la corde */}
          <span
            className={`theme-stamp-badge theme-stamp-badge-${
              variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'
            } text-[8px] tracking-wider font-extrabold`}
          >
            {categoryLabel}
          </span>

          {/* Badge d'état discret pour informer que la corde est masquée aux adhérents */}
          {isInactive ? (
            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-cordel-rouge,#8b2a1a)]/15 text-[var(--color-cordel-rouge,#8b2a1a)] border border-[var(--color-cordel-rouge,#8b2a1a)]/30">
              🚫 Corde désactivée (masquée aux adhérents)
            </span>
          ) : (
            <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30">
              ⚠️ Corde vide (masquée aux adhérents)
            </span>
          )}

          {/* Bouton pour déposer le premier document */}
          {canDeposit && (
            <button
              type="button"
              onClick={() => {
                if (onOpenAdd) onOpenAdd(category);
              }}
              className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7] border border-encre-noire shadow-xs hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
              title={`Déposer le premier document sur la corde ${category.nom || category.id}`}
            >
              <span className="text-[10px] leading-none">+</span>
              <span>{t('widgetDocuments.addShort') || "Déposer"}</span>
            </button>
          )}

          {/* Raccourci vers l'Atelier Lutherie si applicable */}
          {(category.id === 'TutosFabrication' || category.nom === 'Tutos Fabrication') && onNavigateToView && (canWrite || isAuthorized) && (
            <button
              type="button"
              onClick={() => onNavigateToView('instrument-models')}
              className="text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border border-encre-noire shadow-xs hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
              title="Ouvrir l'Atelier Lutherie"
            >
              <span>🛠️ Modèles d'Atelier</span>
            </button>
          )}

          {/* Bouton de configuration de la corde */}
          {isAuthorized && (
            <button
              type="button"
              onClick={() => {
                if (onEditCategory) onEditCategory(category);
              }}
              className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-xs opacity-75 hover:opacity-100 transition-opacity"
              title="Modifier la catégorie / corde"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </CordelCard>
  );
}
