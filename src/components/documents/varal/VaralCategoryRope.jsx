import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import VaralRopeSVG from './VaralRopeSVG';
import VaralBookletCover from './VaralBookletCover';
import VaralEmptyRopeAdmin from './VaralEmptyRopeAdmin';
import { CULTURE_THEMES, filterCultureDocsByTheme } from './varalCultureThemes';
import { buildCultureDisplayList } from '../../../utils/weeklyCultureDocUtils';
import { resolveVaralCategoryLabel, getCategoryLabel as getCategoryLabelUtil } from '../../../utils/documentCategories';
import { useTranslation } from '../../LanguageContext';

/**
 * Résolution sécurisée du libellé de catégorie avec repli local anti-crash.
 * @param {string|Object} categoryKey - Identifiant ou objet de la catégorie
 * @param {string} [eventTitle] - Titre de l'événement associé
 * @returns {string} Libellé prêt à l'affichage
 */
export const getCategoryLabel = (categoryKey, eventTitle) => {
  if (typeof getCategoryLabelUtil === 'function') {
    return getCategoryLabelUtil(categoryKey, eventTitle);
  }
  if (!categoryKey) return 'DOCUMENTS';
  const catStr = typeof categoryKey === 'object' ? (categoryKey.id || categoryKey.nom || '') : String(categoryKey);
  if (catStr.startsWith('projet_')) {
    return `🎪 PROJET : ${(eventTitle || catStr.replace('projet_', '')).toUpperCase()}`;
  }
  return catStr.replace(/_/g, ' ').toUpperCase();
};

const categoryVariants = {
  'Partitions': 'ocre',
  'Tutoriels': 'vert',
  'Culture': 'ocre',
  'Administratif': 'rouge',
  'DocumentsFixes': 'bleu'
};

/**
 * Sous-composant matérialisant une corde complète du Varal avec son intitulé,
 * ses boutons contextuels (déposer, modèles atelier, édition), sa ligne en chanvre et ses livrets.
 */
export default function VaralCategoryRope({
  category,
  documents = [],
  newestDocumentId = null,
  weeklyCultureDocId = null,
  isWeeklyManuallyPinned = false,
  isAuthorized = false,
  canWrite = false,
  canDeposit = false,
  allEventsMap = {},
  getDocType,
  onOpenAdd,
  onNavigateToView,
  onEditCategory,
  onSelectDoc,
  onMoveLeft,
  onMoveRight,
  onEditDoc,
  onDeleteDoc,
  onTogglePinWeekly
}) {
  const { t } = useTranslation();
  const [cultureFilter, setCultureFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'visible' | 'hidden'

  const variant = categoryVariants[category.id] || 'default';

  // Comptage des documents masqués, archivés et visibles pour les utilisateurs autorisés
  const archivedCount = documents.filter(d => Boolean(d.isArchived)).length;
  const hiddenCount = documents.filter(d => Boolean(d.isHidden) && !d.isArchived).length;
  const visibleCount = documents.filter(d => !d.isHidden && !d.isArchived).length;

  // 1. Filtrage éventuel par état de visibilité pour les administrateurs
  let docList = documents;
  if (isAuthorized && (hiddenCount > 0 || archivedCount > 0)) {
    if (visibilityFilter === 'visible') {
      docList = docList.filter(d => !d.isHidden && !d.isArchived);
    } else if (visibilityFilter === 'hidden') {
      docList = docList.filter(d => Boolean(d.isHidden) && !d.isArchived);
    } else if (visibilityFilter === 'archived') {
      docList = docList.filter(d => Boolean(d.isArchived));
    }
  }
  if (category.id === 'Culture' && cultureFilter !== 'all') {
    docList = filterCultureDocsByTheme(docList, cultureFilter);
  }

  // 2. Copie d'affichage non-destructive pour la corde Culture :
  // Remonte la « Fiche de la semaine » en 1ère position (ou 2ème après « ✨ NOUVEAU »)
  // tout en conservant `docList` intact pour le réordonnancement et le retour à la place d'origine.
  const displayDocList = category.id === 'Culture'
    ? buildCultureDisplayList(docList, weeklyCultureDocId, newestDocumentId)
    : docList;

  // Évaluation de l'état d'activité et de vacuité de la corde
  const isInactive = category.actif === false;
  const hasValidPublicUpload = Boolean(
    category.activerUploadPublic &&
    category.lienUploadPublic &&
    category.lienUploadPublic.trim() !== ''
  );
  // Une corde est considérée vide si elle ne contient aucun document et aucun lien de dépôt public actif
  const isEmpty = docList.length === 0 && !hasValidPublicUpload;

  // Règle 1 (Désactivation manuelle) & Règle 2 (Masquage si vide) côté adhérent : ne rien afficher
  if (!isAuthorized) {
    if (isInactive || isEmpty) {
      return null;
    }
  }

  // Règle 3 (Vue Admin) : Affichage compact avec avertissement et bouton d'ajout si corde vide ou inactive
  if (isAuthorized && (isInactive || isEmpty)) {
    return (
      <VaralEmptyRopeAdmin
        category={category}
        isInactive={isInactive}
        variant={variant}
        canDeposit={canDeposit}
        canWrite={canWrite}
        isAuthorized={isAuthorized}
        allEventsMap={allEventsMap}
        onOpenAdd={onOpenAdd}
        onNavigateToView={onNavigateToView}
        onEditCategory={onEditCategory}
      />
    );
  }

  return (
    <CordelCard
      key={category.id}
      variant="default"
      useExtremeBorder={true}
      className="pt-3 pb-4 relative overflow-hidden bg-[#FEF9E7] dark:bg-[#1A1712] border-2 border-cordel-master-dark/30 rounded-xl shadow-[4px_6px_16px_rgba(24,23,22,0.12)] w-full my-4 transition-all"
    >
      {/* En-tête de la corde : titre, filtres et actions contextuelles */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 mb-2 pl-3 pr-3 select-none relative z-20">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8.5px] tracking-wider font-extrabold uppercase`}>
            {resolveVaralCategoryLabel(category, t, documents, [], allEventsMap) || getCategoryLabel(category, allEventsMap?.[category?.id?.replace('projet_', '')]?.titre)}
          </span>

          {/* Filtres de visibilité (Tous, Visibles, Masqués, Archivés) */}
          {isAuthorized && (hiddenCount > 0 || archivedCount > 0) && (
            <div className="flex items-center gap-1 bg-[#fdfaf2] dark:bg-[#1a1816] border border-encre-noire/25 p-0.5 rounded shadow-xs select-none">
              <button
                type="button"
                onClick={() => setVisibilityFilter('all')}
                className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer ${visibilityFilter === 'all'
                  ? 'bg-cordel-master-dark text-[#FEF9E7] shadow-xs'
                  : 'text-cordel-master-dark/80 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Afficher tous les livrets de cette corde"
              >
                {t('documents.filterAllWithCount', { count: documents.length })}
              </button>
              <button
                type="button"
                onClick={() => setVisibilityFilter('visible')}
                className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${visibilityFilter === 'visible'
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7] shadow-xs'
                  : 'text-cordel-master-dark/80 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Afficher uniquement les livrets visibles aux membres"
              >
                <span>👁️</span>
                <span>{t('documents.filterVisibleWithCount', { count: visibleCount })}</span>
              </button>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('hidden')}
                  className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${visibilityFilter === 'hidden'
                    ? 'bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] shadow-xs'
                    : 'text-cordel-wood font-extrabold hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                  title="Afficher uniquement les livrets masqués (brouillons)"
                >
                  <span>🙈</span>
                  <span>Masqués ({hiddenCount})</span>
                </button>
              )}
              {archivedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setVisibilityFilter('archived')}
                  className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 ${visibilityFilter === 'archived'
                    ? 'bg-[var(--color-cordel-wood,#8b2a1a)] text-[#FEF9E7] shadow-xs'
                    : 'text-cordel-wood font-extrabold hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  }`}
                  title="Afficher uniquement les livrets archivés (anciennes saisons)"
                >
                  <span>📦</span>
                  <span>{t('documents.filterArchivedWithCount', { count: archivedCount })}</span>
                </button>
              )}
            </div>
          )}

          {/* Bouton "+ Déposer" compact par corde */}
          {canDeposit && (
            <button
              type="button"
              onClick={() => {
                if (onOpenAdd) onOpenAdd(category);
              }}
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
              title={`Déposer un document sur la corde ${category.nom}`}
            >
              <span className="text-[11px] leading-none">+</span>
              <span>{t('widgetDocuments.addShort') || "Déposer"}</span>
            </button>
          )}

          {/* Bouton vers l'atelier de lutherie */}
          {(category.id === 'TutosFabrication' || category.nom === 'Tutos Fabrication') && onNavigateToView && (canWrite || isAuthorized) && (
            <button
              type="button"
              onClick={() => onNavigateToView('instrument-models')}
              className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[3px_5px_2px_4px] bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7] border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer select-none flex items-center gap-1 transition-all"
              title="Ouvrir l'éditeur de gabarits et de pièces dans l'Atelier Lutherie"
            >
              <span>🛠️ Modèles d'Atelier</span>
              <span>➜</span>
            </button>
          )}

          {/* Bouton d'édition de la catégorie pour les administrateurs */}
          {isAuthorized && (
            <button
              type="button"
              onClick={() => {
                if (onEditCategory) onEditCategory(category);
              }}
              className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm opacity-65 hover:opacity-100 transition-opacity"
              title="Modifier la catégorie"
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
              {CULTURE_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setCultureFilter(theme.id)}
                  className={`text-[12px] md:text-sm px-1.5 py-1 rounded flex items-center justify-center transition-all ${cultureFilter === theme.id
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
        </div>

        {/* Lien de partage public externe */}
        {category.activerUploadPublic && category.lienUploadPublic && (
          <a
            href={category.lienUploadPublic}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-black uppercase text-blue-700 hover:underline flex items-center gap-1 cursor-pointer mt-1 md:mt-0"
          >
            📤 {t('documents.publicUploadLink') || "Partager vos photos/vidéos"}
          </a>
        )}
      </div>

      {/* Conteneur de la corde et des livrets suspendus */}
      <div className="relative w-full mt-2">
        {/* Corde 3D en chanvre torsadé */}
        <VaralRopeSVG className="absolute top-[12px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible" />

        {/* Défilement horizontal des livrets Cordel */}
        <div className="flex flex-nowrap overflow-x-auto overflow-y-visible justify-start items-start gap-4 sm:gap-6 pt-[33px] pb-6 relative z-10 w-full varal-scrollbar px-6 min-h-[210px]">
          {displayDocList.length === 0 ? (
            <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">
              {t('documents.noDocumentsCategory') || "Aucun document dans cette rubrique."}
            </p>
          ) : (
            displayDocList.map((docItem, index) => (
              <VaralBookletCover
                key={docItem.id}
                docItem={docItem}
                index={index}
                docList={docList}
                category={category}
                isLatestDoc={docItem.id === newestDocumentId}
                isWeeklyCultureDoc={category.id === 'Culture' && docItem.id === weeklyCultureDocId}
                isWeeklyManuallyPinned={category.id === 'Culture' && isWeeklyManuallyPinned}
                isAuthorized={isAuthorized}
                docType={getDocType ? getDocType(docItem) : 'pdf'}
                onSelect={onSelectDoc}
                onMoveLeft={onMoveLeft}
                onMoveRight={onMoveRight}
                onEdit={onEditDoc}
                onDelete={onDeleteDoc}
                onTogglePinWeekly={category.id === 'Culture' ? onTogglePinWeekly : null}
              />
            ))
          )}
        </div>
      </div>
    </CordelCard>
  );
}
