// Barre d'actions contextuelles d'une corde du Varal (dépôt, carnet de chants, atelier, filtres culture) (< 115 lignes).
import React from 'react';
import { CULTURE_THEMES } from './varalCultureThemes';
import { useTranslation } from '../../LanguageContext';

export default function VaralCategoryRopeActions({
  category,
  canDeposit = false,
  canWrite = false,
  isAuthorized = false,
  hasSongs = false,
  cultureFilter = 'all',
  onSelectCultureFilter,
  onOpenAdd,
  onNavigateToView,
  onEditCategory,
  onOpenSongbook = null
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Bouton Carnet de chants accessible à tous les membres connectés sur la corde Toadas */}
      {category.id === 'Toadas' && hasSongs && onOpenSongbook && (
        <button
          type="button"
          onClick={onOpenSongbook}
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-[3px_5px_2px_4px] bg-white hover:bg-amber-50 text-encre-noire border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer select-none flex items-center gap-1 transition-all"
          title={t('toadaPrint.modalTitleSongbook')}
        >
          <span>🖨️</span>
          <span>{t('toadaPrint.btnOpenSongbook')}</span>
        </button>
      )}

      {/* Bouton "+ Déposer" compact par corde */}
      {canDeposit && (
        <button
          type="button"
          onClick={() => onOpenAdd && onOpenAdd(category)}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
        >
          <span className="text-[11px] leading-none">+</span>
          <span>{t('widgetDocuments.addShort')}</span>
        </button>
      )}

      {/* Bouton vers l'atelier de lutherie */}
      {(category.id === 'TutosFabrication' || category.nom === 'Tutos Fabrication') && onNavigateToView && (canWrite || isAuthorized) && (
        <button
          type="button"
          onClick={() => onNavigateToView('instrument-models')}
          className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
        >
          <span>🛠️</span>
          <span>➜</span>
        </button>
      )}

      {/* Bouton d'édition de la catégorie pour les administrateurs */}
      {isAuthorized && (
        <button
          type="button"
          onClick={() => onEditCategory && onEditCategory(category)}
          className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm opacity-65 hover:opacity-100 transition-opacity"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
          </svg>
        </button>
      )}

      {/* Filtres thématiques spécifiques à la Culture */}
      {category.id === 'Culture' && (
        <div className="flex flex-wrap gap-1 items-center bg-[#fdfaf2] border border-encre-noire/20 p-1 rounded-md shadow-sm md:ml-2">
          {CULTURE_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectCultureFilter(theme.id)}
              className={`text-[12px] md:text-sm px-1.5 py-1 rounded flex items-center justify-center transition-all cursor-pointer ${
                cultureFilter === theme.id
                  ? 'bg-cordel-wood text-[#fdfaf2] shadow-[1px_1px_0px_0px_#181716] scale-110 z-10'
                  : 'text-cordel-master-dark hover:bg-neutral-200 opacity-80 hover:opacity-100'
              }`}
              title={theme.label}
            >
              {theme.icon}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
