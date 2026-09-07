import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import VaralRopeSVG from './VaralRopeSVG';
import VaralBookletCover from './VaralBookletCover';
import { useTranslation } from '../../LanguageContext';

/**
 * Thèmes culturels avec icônes vectorielles personnalisées pour le filtre du Varal Culture.
 */
const CULTURE_THEMES = [
  { id: 'all', label: 'Toute la Culture', icon: <span className="text-[12px] md:text-sm pt-0.5">✨</span> },
  {
    id: 'orixás',
    label: 'Orixás',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-orixa">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" />
              <line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" />
              <line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" />
              <line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" />
              <circle cx="60" cy="22" r="2" fill="black" stroke="none" />
              <path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-orixa)" d="M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z" />
      </svg>
    )
  },
  {
    id: 'cuisine',
    label: 'Cuisine',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-cuisine">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-cuisine)" d="M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35" />
      </svg>
    )
  },
  {
    id: 'histoire',
    label: 'Histoire',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-histoire">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" />
              <path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              <path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-histoire)" d="M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z" />
      </svg>
    )
  },
  {
    id: 'musique',
    label: 'Musique',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-musique">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" />
              <line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" />
              <line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-musique)" d="M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z" />
      </svg>
    )
  },
  {
    id: 'cortège',
    label: 'Cortège',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-cortejo">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" />
              <path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" />
              <line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-cortejo)" d="M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z" />
      </svg>
    )
  },
  {
    id: 'territoire',
    label: 'Territoire',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-territoire">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" />
              <line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" />
              <path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="75" cy="65" r="4" fill="black" stroke="none" />
              <circle cx="25" cy="45" r="4" fill="black" stroke="none" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-territoire)" d="M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z" />
      </svg>
    )
  },
  {
    id: 'folklore',
    label: 'Folklore',
    icon: (
      <svg viewBox="0 0 100 100" className="w-5 h-5">
        <defs>
          <mask id="icon-mask-folklore">
            <rect width="100" height="100" fill="white" />
            <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="42" cy="55" r="4" fill="black" stroke="none" />
              <circle cx="58" cy="55" r="4" fill="black" stroke="none" />
              <path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" />
              <path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" />
            </g>
          </mask>
        </defs>
        <path fill="currentColor" mask="url(#icon-mask-folklore)" d="M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z" />
      </svg>
    )
  }
];

const categoryVariants = {
  'Partitions': 'ocre',
  'Tutoriels': 'vert',
  'Culture': 'ocre',
  'Administratif': 'rouge',
  'DocumentsFixes': 'bleu'
};

const getCategoryLabel = (cat) => {
  if (!cat) return '';
  if (typeof cat === 'string') return cat;
  return cat.nom || cat.id || '';
};

/**
 * Sous-composant matérialisant une corde complète du Varal avec son intitulé,
 * ses boutons contextuels (déposer, modèles atelier, édition), sa ligne en chanvre et ses livrets.
 */
export default function VaralCategoryRope({
  category,
  documents = [],
  newestDocumentId = null,
  isAuthorized = false,
  canWrite = false,
  canDeposit = false,
  getDocType,
  onOpenAdd,
  onNavigateToView,
  onEditCategory,
  onSelectDoc,
  onMoveLeft,
  onMoveRight,
  onEditDoc,
  onDeleteDoc
}) {
  const { t } = useTranslation();
  const [cultureFilter, setCultureFilter] = useState('all');

  const variant = categoryVariants[category.id] || 'default';

  // Filtrage spécifique pour la corde Culture
  let docList = documents;
  if (category.id === 'Culture' && cultureFilter !== 'all') {
    docList = docList.filter((d) => {
      if (d.type !== 'culture_fiche') return false;
      const dCat = (d.categorieFiche || '').toLowerCase();
      const dTheme = (d.themeCulture || '').toLowerCase();
      const filterCat = cultureFilter.toLowerCase();

      if (filterCat === 'all') {
        return true;
      } else if (filterCat === 'cuisine') {
        if (!dCat.includes('cuisine') && !dTheme.includes('cuisine') && !dCat.includes('recette') && !dTheme.includes('gastronomi')) return false;
      } else if (filterCat === 'cortège') {
        if (!dCat.includes('cour') && !dCat.includes('personnage') && !dCat.includes('cortège') && !dTheme.includes('cortejo') && !dTheme.includes('cortège')) return false;
      } else if (filterCat === 'orixás') {
        if (!dCat.includes('orix') && !dCat.includes('spirit') && !dTheme.includes('orixa')) return false;
      } else if (filterCat === 'histoire') {
        if (!dCat.includes('histoire') && !dCat.includes('origine') && !dTheme.includes('histoire')) return false;
      } else if (filterCat === 'musique') {
        if (!dCat.includes('musique') && !dTheme.includes('musique')) return false;
      } else if (filterCat === 'territoire') {
        if (!dCat.includes('territoire') && !dTheme.includes('territoire') && !dCat.includes('géographie') && !dCat.includes('lieu')) return false;
      } else if (filterCat === 'folklore') {
        if (!dCat.includes('folklore') && !dTheme.includes('folklore')) return false;
      } else {
        if (dCat !== filterCat && dTheme !== filterCat) return false;
      }
      return true;
    });
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
          <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8.5px] tracking-wider font-extrabold`}>
            {getCategoryLabel(category.nom)}
          </span>

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
          {docList.length === 0 ? (
            <p className="text-[10px] italic opacity-60 self-center py-6 text-cordel-master-dark">
              {t('documents.noDocumentsCategory') || "Aucun document dans cette rubrique."}
            </p>
          ) : (
            docList.map((docItem, index) => (
              <VaralBookletCover
                key={docItem.id}
                docItem={docItem}
                index={index}
                docList={docList}
                category={category}
                isLatestDoc={docItem.id === newestDocumentId}
                isAuthorized={isAuthorized}
                docType={getDocType ? getDocType(docItem) : 'pdf'}
                onSelect={onSelectDoc}
                onMoveLeft={onMoveLeft}
                onMoveRight={onMoveRight}
                onEdit={onEditDoc}
                onDelete={onDeleteDoc}
              />
            ))
          )}
        </div>
      </div>
    </CordelCard>
  );
}
