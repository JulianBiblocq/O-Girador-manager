// Corde complète du Varal Cordel avec intitulé, filtres, impression Carnet Toadas et livrets (< 138 lignes).
import React, { useState } from 'react';
import VaralRopeSVG from './VaralRopeSVG';
import VaralBookletCover from './VaralBookletCover';
import VaralEmptyRopeAdmin from './VaralEmptyRopeAdmin';
import VaralCategoryRopeActions from './VaralCategoryRopeActions';
import PrintableSongbook from '../../pedagogy/print/PrintableSongbook';
import { filterCultureDocsByTheme } from './varalCultureThemes';
import { buildCultureDisplayList } from '../../../utils/weeklyCultureDocUtils';
import { sortProjectRopeDocuments } from '../../../utils/projectVaralUtils';
import { resolveVaralCategoryLabel, getCategoryLabel as getCategoryLabelUtil } from '../../../utils/documentCategories';
import { useTranslation } from '../../LanguageContext';

export const getCategoryLabel = (categoryKey, eventTitle) => {
  if (typeof getCategoryLabelUtil === 'function') return getCategoryLabelUtil(categoryKey, eventTitle);
  if (!categoryKey) return 'DOCUMENTS';
  const catStr = typeof categoryKey === 'object' ? (categoryKey.id || categoryKey.nom || '') : String(categoryKey);
  if (catStr.startsWith('projet_')) return `🎪 PROJET : ${(eventTitle || catStr.replace('projet_', '')).toUpperCase()}`;
  return catStr.replace(/_/g, ' ').toUpperCase();
};

const categoryVariants = { Partitions: 'ocre', Tutoriels: 'vert', Culture: 'ocre', Administratif: 'rouge', DocumentsFixes: 'bleu' };

export default function VaralCategoryRope({
  category, documents = [], newestDocumentId = null, weeklyCultureDocId = null,
  isWeeklyManuallyPinned = false, isAuthorized = false, canWrite = false,
  canDeposit = false, canManageDoc = null, allEventsMap = {}, getDocType,
  onOpenAdd, onNavigateToView, onEditCategory, onSelectDoc,
  onMoveLeft, onMoveRight, onEditDoc, onDeleteDoc, onTogglePinWeekly
}) {
  const { t } = useTranslation();
  const [cultureFilter, setCultureFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [songbookOpen, setSongbookOpen] = useState(false);

  const variant = categoryVariants[category.id] || 'default';
  const archivedCount = documents.filter((d) => Boolean(d.isArchived)).length;
  const hiddenCount = documents.filter((d) => Boolean(d.isHidden) && !d.isArchived).length;
  const visibleCount = documents.filter((d) => !d.isHidden && !d.isArchived).length;

  let docList = documents;
  if (isAuthorized && (hiddenCount > 0 || archivedCount > 0)) {
    if (visibilityFilter === 'visible') docList = docList.filter((d) => !d.isHidden && !d.isArchived);
    else if (visibilityFilter === 'hidden') docList = docList.filter((d) => Boolean(d.isHidden) && !d.isArchived);
    else if (visibilityFilter === 'archived') docList = docList.filter((d) => Boolean(d.isArchived));
  }
  if (category.id === 'Culture' && cultureFilter !== 'all') docList = filterCultureDocsByTheme(docList, cultureFilter);

  const displayDocList = category.id === 'Culture'
    ? buildCultureDisplayList(docList, weeklyCultureDocId, newestDocumentId)
    : category.id?.startsWith('projet_') ? sortProjectRopeDocuments(docList) : docList;

  const isInactive = category.actif === false;
  const hasValidPublicUpload = Boolean(category.activerUploadPublic && category.lienUploadPublic && category.lienUploadPublic.trim() !== '');
  const isEmpty = docList.length === 0 && !hasValidPublicUpload;

  if (!isAuthorized && (isInactive || isEmpty)) return null;
  if (isAuthorized && (isInactive || isEmpty)) {
    return (
      <VaralEmptyRopeAdmin
        category={category} isInactive={isInactive} variant={variant} canDeposit={canDeposit}
        canWrite={canWrite} isAuthorized={isAuthorized} allEventsMap={allEventsMap}
        onOpenAdd={onOpenAdd} onNavigateToView={onNavigateToView} onEditCategory={onEditCategory}
      />
    );
  }

  const inferredGroupId = documents[0]?.groupId || null;

  return (
    <div key={category.id} className="py-5 first:pt-0 last:pb-0 relative w-full transition-all">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 mb-2 pl-3 pr-3 select-none relative z-20">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8.5px] tracking-wider font-extrabold uppercase`}>
            {resolveVaralCategoryLabel(category, t, documents, [], allEventsMap) || getCategoryLabel(category, allEventsMap?.[category?.id?.replace('projet_', '')]?.titre)}
          </span>

          {isAuthorized && (hiddenCount > 0 || archivedCount > 0) && (
            <div className="flex items-center gap-1 bg-[#fdfaf2] dark:bg-[#1a1816] border border-encre-noire/25 p-0.5 rounded shadow-xs select-none">
              <button type="button" onClick={() => setVisibilityFilter('all')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${visibilityFilter === 'all' ? 'bg-cordel-master-dark text-[#FEF9E7]' : 'text-cordel-master-dark/80 hover:bg-neutral-200'}`}>
                {t('documents.filterAllWithCount', { count: documents.length })}
              </button>
              <button type="button" onClick={() => setVisibilityFilter('visible')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 ${visibilityFilter === 'visible' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-[#FEF9E7]' : 'text-cordel-master-dark/80 hover:bg-neutral-200'}`}>
                <span>👁️</span><span>{t('documents.filterVisibleWithCount', { count: visibleCount })}</span>
              </button>
              {hiddenCount > 0 && (
                <button type="button" onClick={() => setVisibilityFilter('hidden')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 ${visibilityFilter === 'hidden' ? 'bg-[var(--color-cordel-ocre,#c05621)] text-[#FEF9E7]' : 'text-cordel-wood font-extrabold hover:bg-neutral-200'}`}>
                  <span>🙈</span><span>({hiddenCount})</span>
                </button>
              )}
              {archivedCount > 0 && (
                <button type="button" onClick={() => setVisibilityFilter('archived')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 ${visibilityFilter === 'archived' ? 'bg-[var(--color-cordel-wood,#8b2a1a)] text-[#FEF9E7]' : 'text-cordel-wood font-extrabold hover:bg-neutral-200'}`}>
                  <span>📦</span><span>{t('documents.filterArchivedWithCount', { count: archivedCount })}</span>
                </button>
              )}
            </div>
          )}

          <VaralCategoryRopeActions
            category={category} canDeposit={canDeposit} canWrite={canWrite} isAuthorized={isAuthorized}
            hasSongs={documents.length > 0} cultureFilter={cultureFilter} onSelectCultureFilter={setCultureFilter}
            onOpenAdd={onOpenAdd} onNavigateToView={onNavigateToView} onEditCategory={onEditCategory}
            onOpenSongbook={category.id === 'Toadas' ? () => setSongbookOpen(true) : null}
          />
        </div>

        {category.activerUploadPublic && category.lienUploadPublic && (
          <a href={category.lienUploadPublic} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-blue-700 hover:underline flex items-center gap-1 cursor-pointer mt-1 md:mt-0">
            📤 {t('documents.publicUploadLink')}
          </a>
        )}
      </div>

      <div className="relative w-full mt-2">
        <VaralRopeSVG className="absolute top-[12px] left-0 right-0 h-8 w-full z-0 select-none pointer-events-none overflow-visible" />
        <div className="flex flex-nowrap overflow-x-auto overflow-y-visible justify-start items-start gap-4 sm:gap-6 pt-[33px] pb-6 relative z-10 w-full varal-scrollbar px-6 min-h-[210px]">
          {displayDocList.length === 0 ? (
            <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">{t('documents.noDocumentsCategory')}</p>
          ) : displayDocList.map((docItem, index) => (
            <VaralBookletCover
              key={docItem.id} docItem={docItem} index={index} docList={docList} category={category}
              isLatestDoc={docItem.id === newestDocumentId} isWeeklyCultureDoc={category.id === 'Culture' && docItem.id === weeklyCultureDocId}
              isWeeklyManuallyPinned={category.id === 'Culture' && isWeeklyManuallyPinned} isAuthorized={isAuthorized}
              canManageDoc={canManageDoc ? canManageDoc(docItem, category) : false} docType={getDocType ? getDocType(docItem) : 'pdf'}
              onSelect={onSelectDoc} onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} onEdit={onEditDoc} onDelete={onDeleteDoc}
              onTogglePinWeekly={category.id === 'Culture' ? onTogglePinWeekly : null}
            />
          ))}
        </div>
      </div>

      {category.id === 'Toadas' && (
        <PrintableSongbook isOpen={songbookOpen} onClose={() => setSongbookOpen(false)} songs={documents} groupId={inferredGroupId} />
      )}
    </div>
  );
}
