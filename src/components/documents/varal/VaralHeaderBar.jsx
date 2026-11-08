import React from 'react';
import CordelButton from '../../CordelButton';
import { useTranslation } from '../../LanguageContext';

/**
 * En-tête du Varal de documents affichant le titre de section,
 * le bouton discret de révélation des cordes masquées/vides pour l'Admin/Mestre,
 * et le bouton d'ajout global.
 */
export default function VaralHeaderBar({
  title,
  loading,
  isAuthorized,
  canWrite,
  isAdding,
  poleId,
  hiddenCordsCount,
  showHiddenCords,
  onToggleHiddenCords,
  onOpenGlobalAdd,
  uploadBtnLabel
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-between items-center gap-2 pl-1 pr-1">
      <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
        {title}
      </h3>
      <div className="flex items-center gap-2 ml-auto">
        {!loading && isAuthorized && !isAdding && hiddenCordsCount > 0 && (
          <button
            type="button"
            onClick={onToggleHiddenCords}
            className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border transition-all cursor-pointer select-none flex items-center gap-1 ${
              showHiddenCords
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none'
                : 'bg-cordel-bg-light hover:bg-white text-cordel-master-dark/80 border-cordel-master-dark/30 shadow-[1px_1px_0px_0px_#181716]'
            }`}
            title={showHiddenCords ? "Masquer les cordes vides ou désactivées" : "Afficher les cordes vides ou désactivées pour les éditer ou y déposer un document"}
          >
            <span>👁️</span>
            <span>{t('dashboard.hiddenStringsCount', { count: hiddenCordsCount })}</span>
          </button>
        )}
        {!loading && (isAuthorized || canWrite) && !isAdding && poleId !== 'secretariat' && poleId !== 'pedagogie' && (
          <CordelButton
            variant="default"
            onClick={onOpenGlobalAdd}
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            {uploadBtnLabel}
          </CordelButton>
        )}
      </div>
    </div>
  );
}
