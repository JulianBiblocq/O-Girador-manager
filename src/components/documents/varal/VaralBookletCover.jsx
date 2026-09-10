import React from 'react';
import VaralClothespinSVG from './VaralClothespinSVG';
import { getInstrumentStamp } from '../../InstrumentStampSVG';
import { isWorkshopVirtualDoc } from '../../../utils/workshopProjectionUtils';
import { useTranslation } from '../../LanguageContext';

/**
 * Calcule une couleur déterministe Cordel pour un document
 * en excluant les nuances réservées aux documents officiels.
 */
const getDeterministicColor = (docId) => {
  if (!docId) return 'kraft';
  const colors = ['vert', 'ocre', 'rouge', 'jaune', 'kraft', 'orange'];
  let hash = 0;
  for (let i = 0; i < docId.length; i++) {
    hash = docId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Sous-composant représentant un livret individuel de littérature de Cordel
 * suspendu sur la corde par une pince à linge artisanale en bois.
 */
export default function VaralBookletCover({
  docItem,
  index,
  docList,
  category,
  isLatestDoc = false,
  isAuthorized = false,
  docType = 'pdf',
  onSelect,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onDelete
}) {
  const { t } = useTranslation();

  const isArchived = docItem.isArchived === true;
  const opacityClass = isArchived ? 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all duration-300' : 'opacity-100';

  let colorClass = 'default';
  if (category?.id === 'Administratif' || category?.id === 'DocumentsFixes' || category?.nom === 'Administratif') {
    colorClass = 'bleu-ardoise'; // Ardoise exclusif pour les documents administratifs fixes
  } else if (category?.id === 'ComptesRendus' || category?.nom === 'Comptes-rendus') {
    colorClass = 'rouge'; // Rouge distinctif pour les comptes-rendus
  } else {
    colorClass = getDeterministicColor(docItem.id);
  }

  const typeIcons = {
    pdf: '📄',
    audio: '🎵',
    image: '📷',
    video: '🎥',
    web: '🌐',
    dossier_externe: '📂',
    drive: '📂',
    report: '📜',
    culture_fiche: '📖',
    instrument_model: '🛠️',
    instrument_part: '⚙️'
  };
  const typeIcon = typeIcons[docType] || (docItem.typeDoc === 'instrument_part' || docItem.type === 'instrument_part' ? '⚙️' : (docItem.typeDoc === 'instrument_model' || docItem.type === 'instrument_model' ? '🛠️' : '📄'));

  const isDarkBg = colorClass === 'rouge' || colorClass === 'bleu-ardoise' || colorClass === 'bleu';
  const textClass = isDarkBg ? 'text-[#FEF9E7]' : 'text-encre-noire';
  const borderDashedClass = isDarkBg ? 'border-[#FEF9E7]/35' : 'border-encre-noire/25';
  const yearBadgeClass = isDarkBg ? 'bg-white/25 text-[#FEF9E7]' : 'bg-encre-noire/10 text-encre-noire';

  // Animation de balancement : swing accentué pour le dernier document, brise légère désynchronisée pour les autres
  const cardAnimationClass = isLatestDoc
    ? 'animate-varal-newest'
    : 'animate-varal-breeze hover:z-30 hover:scale-105 hover:rotate-0';

  const cardAnimationStyle = isLatestDoc
    ? {}
    : {
      animationDelay: `${(index * 0.4) % 1.5}s`,
      animationDuration: `${3 + (index % 3) * 0.6}s`,
    };

  const theme = ((docItem.themeCulture || '') + ' ' + (docItem.stampKey || '') + ' ' + (docItem.categorieFiche || '') + ' ' + (docItem.sousCategorieFiche || '')).toLowerCase();
  const isOrixa = theme.includes('orixa') || theme.includes('spiritualit');
  const isCortejo = theme.includes('cortejo') || theme.includes('cortège');
  const isCuisine = theme.includes('cuisine') || theme.includes('gastronomi');
  const isHistoire = theme.includes('histoire');
  const isMusique = theme.includes('musique');
  const isTerritoire = theme.includes('territoire') || theme.includes('geograph');
  const isFolklore = theme.includes('folklore');

  const isAdminOrCR = category?.id === 'Administratif' || category?.nom === 'Administratif' || category?.id === 'ComptesRendus' || category?.nom === 'Comptes-rendus' || category?.id === 'DocumentsFixes';
  const isTutoFab = category?.id === 'TutosFabrication' || category?.nom === 'TutosFabrication' || category?.nom === 'Tutos Fabrication';

  const renderIcon = (id, paths, maskLines, extraClasses = "w-24 h-24 opacity-60") => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className={`absolute inset-0 m-auto z-0 pointer-events-none ${isDarkBg ? 'text-encre-noire' : 'text-white'} ${extraClasses}`}>
      <defs>
        <mask id={`${id}-${docItem.id}`}>
          <rect width="100" height="100" fill="white" />
          <g stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {maskLines}
          </g>
        </mask>
      </defs>
      <path fill="currentColor" mask={`url(#${id}-${docItem.id})`} d={paths} />
    </svg>
  );

  return (
    <div
      onClick={() => {
        if (onSelect) onSelect(docItem);
      }}
      className={`
        relative flex flex-col items-center group cursor-pointer
        transition-all duration-300 origin-top shrink-0 flex-none
        ${cardAnimationClass}
        ${opacityClass}
      `}
      style={cardAnimationStyle}
      title={`${docItem.titre || ''}${docItem.sousTitre ? ' - ' + docItem.sousTitre : ''}${isArchived ? ' (' + (t('documents.archiveTag') || "Archive") + ')' : ''}`}
    >
      {/* Badge "✨ Nouveau" exclusif au tout dernier document global */}
      {isLatestDoc && (
        <span className="absolute -top-2.5 -left-3 z-40 bg-[#d99f4d] text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716] animate-bounce select-none">
          {t('documents.newestBadge') || "✨ Nouveau"}
        </span>
      )}

      {/* Pince à linge 3D en bois naturel */}
      <VaralClothespinSVG className="absolute -top-[16px] z-30 pointer-events-none" />

      {/* Couverture du livret Cordel (Booklet Cover) */}
      <div
        className={`
          relative w-36 h-48 border-2 border-encre-noire p-3.5 flex flex-col justify-between text-left
          bg-cordel-bg-light shadow-[4px_4px_0px_0px_#181716]
          rounded-[4px_10px_3px_8px]
          border-l-4 border-l-double
          theme-bg-${colorClass}
          overflow-hidden
        `}
      >
        {/* Hachures pour les réunions en brouillon non validées */}
        {docItem.type === 'reunion' && !docItem.isPublished && (
          <div
            className="absolute inset-0 pointer-events-none z-[5] opacity-20 mix-blend-multiply" 
            style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, #181716 8px, #181716 10px)` }}
          />
        )}

        {/* Texture xylogravure en filigrane (veines et stries de bois gravé) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.16] mix-blend-multiply select-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23181716' stroke-linecap='round'%3E%3Cpath d='M6 0 V120 M17 0 Q22 40 17 80 T17 120 M31 0 V120 M43 0 Q39 50 43 100 V120 M56 0 V120 M70 0 Q74 30 70 85 V120 M85 0 V120 M98 0 Q94 60 98 110 V120 M110 0 V120' stroke-width='1.1' stroke-dasharray='9 3 18 5'/%3E%3Cpath d='M11 0 V120 M25 0 V120 M49 0 V120 M63 0 V120 M78 0 V120 M92 0 V120 M104 0 V120' stroke-width='0.6' stroke-dasharray='4 7 12 6' opacity='0.7'/%3E%3Cpath d='M42 35 C42 28, 48 24, 55 28 C62 32, 59 41, 51 42 C44 43, 42 37, 42 35 Z' stroke-width='1' opacity='0.6'/%3E%3Cpath d='M45 35 C45 31, 49 28, 54 31 C59 34, 57 39, 51 40 C46 41, 45 37, 45 35 Z' stroke-width='0.6' opacity='0.4'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Dégradé de patine Cordel vieilli */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-amber-200/15 via-transparent to-black/20 select-none" />

        {/* Tampon Archivé */}
        {isArchived && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[-15deg] opacity-80 mix-blend-multiply">
            <span className="border-4 border-cordel-master-dark text-cordel-master-dark px-2 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#181716] bg-cordel-bg-light/90 rotate-[-5deg]">
              {t('documents.archivedStamp') || "Archivé"}
            </span>
          </div>
        )}

        {/* Tampon En attente / ODJ pour les réunions */}
        {docItem.type === 'reunion' && !docItem.isPublished && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 rotate-[10deg] opacity-90">
            <span className="border-[3px] border-[#c05621] text-[var(--color-cordel-ocre)] px-2 py-1 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#181716] bg-cordel-bg-light/95 rotate-[-5deg] text-center leading-tight whitespace-pre-line">
              {docItem.isPast ? "En attente\nde CA" : "ODJ\nen cours"}
            </span>
          </div>
        )}

        {/* Tampons graphiques centraux thématiques */}
        {(() => {
          if (docType === 'song') {
            return renderIcon(
              'song',
              "M 30 30 C 30 10, 70 10, 70 30 C 70 50, 30 50, 30 30 M 27 32 C 27 5, 73 5, 73 32 C 73 55, 27 55, 27 32 M 35 15 L 65 45 M 45 12 L 70 35 M 30 25 L 55 48 M 65 15 L 35 45 M 55 12 L 30 35 M 70 25 L 45 48 M 30 30 Q 50 35 70 30 M 35 20 Q 50 25 65 20 M 35 50 Q 50 55 65 50 M 33 53 Q 50 58 67 53 M 38 52 L 43 90 C 43 95, 57 95, 57 90 L 62 52 M 35 55 L 40 92 M 65 55 L 60 92 M 50 93 Q 45 105 60 98 Q 75 90 70 75 M 48 93 Q 43 108 62 100 Q 78 92 72 73",
              <></>,
              "w-16 h-16 opacity-80"
            );
          }

          if (isAdminOrCR) {
            return renderIcon(
              'admin',
              "M 50 10 C 27.9 10 10 27.9 10 50 C 10 72.1 27.9 90 50 90 C 72.1 90 90 72.1 90 50 C 90 27.9 72.1 10 50 10 Z M 50 15 C 69.3 15 85 30.7 85 50 C 85 69.3 69.3 85 50 85 C 30.7 85 15 69.3 15 50 C 15 30.7 30.7 15 50 15 Z M 50 25 C 36.2 25 25 36.2 25 50 C 25 63.8 36.2 75 50 75 C 63.8 75 75 63.8 75 50 C 75 36.2 63.8 25 50 25 Z M 50 33 L 55.3 43.8 L 67 45.5 L 58.5 53.8 L 60.5 65 L 50 59.5 L 39.5 65 L 41.5 53.8 L 33 45.5 L 44.7 43.8 L 50 33 Z",
              <>
                <path d="M 15 50 L 30 50 M 70 50 L 85 50 M 50 15 L 50 30 M 50 70 L 50 85" strokeWidth="2" strokeDasharray="3 3" />
              </>,
              "w-20 h-20 opacity-30"
            );
          }

          if (docType === 'video') {
            return renderIcon(
              'video',
              "M 20 30 L 60 30 C 65 30 70 35 70 40 L 70 60 C 70 65 65 70 60 70 L 20 70 C 15 70 10 65 10 60 L 10 40 C 10 35 15 30 20 30 Z M 70 40 L 90 25 L 90 75 L 70 60 Z M 30 50 C 30 44.5 34.5 40 40 40 C 45.5 40 50 44.5 50 50 C 50 55.5 45.5 60 40 60 C 34.5 60 30 55.5 30 50 Z",
              <>
                <circle cx="40" cy="50" r="4" fill="black" />
                <line x1="20" y1="40" x2="60" y2="40" strokeWidth="1" strokeDasharray="2 2" />
              </>,
              "w-16 h-16 opacity-30"
            );
          }

          if (isTutoFab) {
            const instr = docItem.instrument || docItem.familleInstrument || docItem.categorieFiche || docItem.categorie;
            if (instr) {
              return (
                <div className={`absolute inset-0 m-auto flex items-center justify-center z-0 pointer-events-none opacity-20 ${isDarkBg ? 'text-encre-noire' : 'text-[#523214]'}`}>
                  <div className="scale-[1.2] origin-center mix-blend-multiply dark:mix-blend-normal">
                    {getInstrumentStamp(instr, "currentColor")}
                  </div>
                </div>
              );
            }
          }

          if (isOrixa) {
            return renderIcon(
              'orixa',
              "M 50 3 L 44 14 L 36 24 L 38 31 L 31 39 L 34 46 L 24 50 L 19 63 L 12 90 L 88 90 L 83 66 L 74 49 L 66 44 L 69 37 L 62 31 L 64 26 L 57 13 Z",
              <>
                <line x1="39" y1="36" x2="39" y2="52" strokeDasharray="3 3" />
                <line x1="44" y1="34" x2="44" y2="57" strokeDasharray="3 3" />
                <line x1="51" y1="35" x2="51" y2="60" strokeDasharray="3 3" />
                <line x1="57" y1="34" x2="57" y2="56" strokeDasharray="3 3" />
                <line x1="62" y1="37" x2="62" y2="51" strokeDasharray="3 3" />
                <path d="M 22 62 Q 50 78 78 61" fill="none" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M 18 78 Q 50 95 82 77" fill="none" strokeWidth="3" />
                <path d="M 50 72 L 50 90" fill="none" strokeWidth="2" strokeDasharray="5 3" />
                <circle cx="50" cy="15" r="2.5" fill="black" stroke="none" />
                <circle cx="40" cy="22" r="2" fill="black" stroke="none" />
                <circle cx="60" cy="22" r="2" fill="black" stroke="none" />
                <path d="M 45 28 L 55 28" fill="none" strokeWidth="1.5" />
              </>
            );
          }

          if (isCortejo) {
            return renderIcon(
              'cortejo',
              "M 50 5 A 8 8 0 1 0 50 21 A 8 8 0 1 0 50 5 Z M 48 23 L 30 40 L 25 35 L 20 40 L 35 55 L 43 45 L 35 85 L 15 90 L 20 95 L 80 95 L 85 90 L 65 85 L 57 45 L 65 55 L 80 40 L 75 35 L 70 40 L 52 23 Z",
              <>
                <path d="M 25 85 Q 50 75 75 85" fill="none" strokeWidth="3" strokeDasharray="5 3" />
                <path d="M 32 75 Q 50 65 68 75" fill="none" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="45" y1="50" x2="40" y2="80" strokeDasharray="2 2" />
                <line x1="55" y1="50" x2="60" y2="80" strokeDasharray="2 2" />
              </>
            );
          }

          if (isCuisine) {
            return renderIcon(
              'cuisine',
              "M 20 50 L 25 80 C 30 90 70 90 75 80 L 80 50 Z M 15 40 C 15 35 85 35 85 40 L 80 45 L 20 45 Z M 10 40 C 5 40 5 50 10 50 C 15 50 15 40 10 40 Z M 90 40 C 95 40 95 50 90 50 C 85 50 85 40 90 40 Z M 40 30 Q 30 15 40 5 Q 50 15 40 30 M 60 35 Q 50 20 60 10 Q 70 20 60 35",
              <>
                <path d="M 30 75 Q 50 85 70 75" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 35 65 Q 50 75 65 65" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="25" y1="50" x2="75" y2="50" strokeWidth="1" strokeDasharray="2 2" />
              </>
            );
          }

          if (isHistoire) {
            return renderIcon(
              'histoire',
              "M 10 20 L 45 30 L 50 32 L 55 30 L 90 20 L 90 80 L 55 70 L 55 90 L 50 85 L 45 90 L 45 70 L 10 80 Z",
              <>
                <line x1="50" y1="32" x2="50" y2="72" strokeWidth="3" />
                <path d="M 15 30 Q 30 35 45 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 15 45 Q 30 50 45 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 15 60 Q 30 65 45 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 30 Q 70 35 55 40" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 45 Q 70 50 55 55" fill="none" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M 85 60 Q 70 65 55 70" fill="none" strokeWidth="2" strokeDasharray="3 2" />
              </>
            );
          }

          if (isMusique && docType !== 'song') {
            return renderIcon(
              'musique',
              "M 20 80 C 20 65 40 65 40 80 C 40 95 20 95 20 80 Z M 60 70 C 60 55 80 55 80 70 C 80 85 60 85 60 70 Z M 32 75 L 32 20 L 72 10 L 72 65 L 65 65 L 65 22 L 40 28 L 40 75 Z",
              <>
                <line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="10" y1="40" x2="90" y2="40" strokeWidth="2" strokeDasharray="5 5" />
                <line x1="10" y1="60" x2="90" y2="60" strokeWidth="2" strokeDasharray="5 5" />
              </>
            );
          }

          if (isTerritoire) {
            return renderIcon(
              'territoire',
              "M 15 25 L 35 15 L 65 25 L 85 15 L 85 75 L 65 85 L 35 75 L 15 85 Z",
              <>
                <line x1="35" y1="15" x2="35" y2="75" strokeWidth="2.5" />
                <line x1="65" y1="25" x2="65" y2="85" strokeWidth="2.5" />
                <path d="M 25 45 Q 50 30 75 65" fill="none" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx="75" cy="65" r="4" fill="black" stroke="none" />
                <circle cx="25" cy="45" r="4" fill="black" stroke="none" />
              </>
            );
          }

          if (isFolklore) {
            return renderIcon(
              'folklore',
              "M 30 15 C 20 15 15 25 15 40 C 15 35 25 35 35 45 C 35 60 45 90 50 90 C 55 90 65 60 65 45 C 75 35 85 35 85 40 C 85 25 80 15 70 15 C 60 15 55 30 50 30 C 45 30 40 15 30 15 Z",
              <>
                <circle cx="42" cy="55" r="4" fill="black" stroke="none" />
                <circle cx="58" cy="55" r="4" fill="black" stroke="none" />
                <path d="M 50 35 L 52 40 L 57 40 L 53 43 L 55 48 L 50 45 L 45 48 L 47 43 L 43 40 L 48 40 Z" fill="black" stroke="none" />
                <path d="M 45 75 Q 50 85 55 75" fill="none" strokeWidth="2" strokeDasharray="2 2" />
              </>
            );
          }

          return null;
        })()}

        {/* Boutons d'action au survol (réordonner, modifier, supprimer) pour les administrateurs */}
        {isAuthorized && !docItem.isVirtualEventMedia && !isWorkshopVirtualDoc(docItem) && (
          <div className="absolute top-1.5 right-1.5 flex gap-1 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveLeft) onMoveLeft(docItem, docList);
                }}
                className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm font-bold text-[8px]"
                title="Déplacer vers la gauche"
              >
                ◀
              </button>
            )}
            {index < docList.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMoveRight) onMoveRight(docItem, docList);
                }}
                className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm font-bold text-[8px]"
                title="Déplacer vers la droite"
              >
                ▶
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(docItem);
              }}
              className="p-1 rounded bg-[var(--cordel-bg)] text-[var(--cordel-text)] border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm"
              title={t('common.edit') || "Modifier"}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(docItem);
              }}
              className="p-1 rounded bg-[var(--cordel-bg)] text-red-600 border border-[var(--cordel-border)] hover:bg-[var(--cordel-master-bg)] cursor-pointer select-none flex items-center justify-center shadow-sm"
              title={t('common.delete') || "Supprimer"}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        )}

        {/* Partie supérieure de la couverture */}
        <div className="flex flex-col min-w-0 relative z-10">
          <div className={`w-full border-b border-dashed ${borderDashedClass} pb-1 select-none flex justify-between items-center`}>
            <span className="text-xs select-none">
              {typeIcon}
            </span>
            {isWorkshopVirtualDoc(docItem) ? (
              <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 border border-amber-800/30">
                {docItem.partsCount ? `📐 ${docItem.partsCount} p.` : '📐 Modèle'}
              </span>
            ) : (
              docItem.annee && (
                <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-sm ${yearBadgeClass}`}>
                  {docItem.annee}
                </span>
              )
            )}
          </div>
          <h4 className={`font-black text-xs ${textClass} leading-snug mt-2 break-words line-clamp-3`}>
            {docItem.titre}
          </h4>
          {docItem.sousTitre && (
            <span className={`text-[8px] font-bold uppercase tracking-wider opacity-75 mt-0.5 block truncate ${textClass}`}>
              {docItem.sousTitre}
            </span>
          )}
        </div>

        {/* Partie inférieure de la couverture */}
        <div className="mt-auto select-none">
          <div className={`text-[8.5px] text-right font-black uppercase tracking-wider mt-1 ${textClass}`}>
            {isWorkshopVirtualDoc(docItem)
              ? "Fabrication ➜"
              : (t('documents.readBtn') || "Lire ➜")}
          </div>
        </div>
      </div>
    </div>
  );
}
