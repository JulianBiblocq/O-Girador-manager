import React from 'react';
import VaralClothespinSVG from './VaralClothespinSVG';
import VaralBookletWatermarkSVG from './VaralBookletWatermarkSVG';
import { isWorkshopVirtualDoc } from '../../../utils/workshopProjectionUtils';
import { useTranslation } from '../../LanguageContext';
import { isAdministrativeDoc, isReportDoc } from '../../../hooks/useVaralData';

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
  isWeeklyCultureDoc = false,
  isWeeklyManuallyPinned = false,
  isAuthorized = false,
  docType = 'pdf',
  onSelect,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onDelete,
  onTogglePinWeekly
}) {
  const { t } = useTranslation();
  const isCultureRope = category?.id === 'Culture';
  const isWeeklyHighlight = isCultureRope && isWeeklyCultureDoc;
  const realIndex = Array.isArray(docList)
    ? docList.findIndex((d) => d && d.id === docItem.id)
    : index;
  const effectiveIndex = realIndex !== -1 ? realIndex : index;

  const isArchived = docItem.isArchived === true;
  const isHidden = docItem.isHidden === true;
  const isReport = isReportDoc(docItem);
  const isAdminDoc = isAdministrativeDoc(docItem);

  // Année du document pour la règle d'opacité des comptes-rendus
  const currentYear = new Date().getFullYear();
  const docYear = docItem.annee || (docItem.date ? new Date(docItem.date).getFullYear() : (docItem.dateAjout ? new Date(docItem.dateAjout).getFullYear() : null));
  const isPastYear = Boolean(docYear && docYear < currentYear);

  let colorClass = 'default';
  let opacityClass = 'opacity-100';

  // 1. Cloisonnement strict et mutuellement exclusif : Comptes-rendus (ROUGE) vs Documents statutaires (BLEU)
  if (isReport) {
    // Livrets rouges (Comptes-rendus de réunion) : theme-bg-rouge, opacité 50% pour les années antérieures
    colorClass = 'rouge';
    if (isPastYear || isArchived) {
      opacityClass = 'opacity-50 grayscale-[0.2] hover:opacity-100 hover:grayscale-0 transition-all duration-300';
    } else if (isHidden) {
      opacityClass = 'opacity-85 hover:opacity-100 transition-all duration-300';
    } else {
      opacityClass = 'opacity-100';
    }
  } else if (isAdminDoc || category?.id === 'Administratif' || category?.id === 'DocumentsFixes' || category?.nom === 'Administratif') {
    // Livrets bleus (Documents administratifs statutaires fixes) : theme-bg-bleu-ardoise, opacité fixe 100%
    colorClass = 'bleu-ardoise';
    opacityClass = 'opacity-100';
  } else if (category?.id === 'ComptesRendus' || category?.nom?.includes('Comptes-rendus') || category?.nom?.includes('Documents administratifs')) {
    // Repli sécurisé sur la 5e corde partagée : les pièces non statutaires sont traitées en compte-rendu rouge
    colorClass = 'rouge';
    if (isPastYear || isArchived) {
      opacityClass = 'opacity-50 grayscale-[0.2] hover:opacity-100 hover:grayscale-0 transition-all duration-300';
    } else if (isHidden) {
      opacityClass = 'opacity-85 hover:opacity-100 transition-all duration-300';
    } else {
      opacityClass = 'opacity-100';
    }
  } else if (category?.id?.startsWith('projet_') || category?.isProjectRope || docItem.type === 'cordel_commission' || docType === 'cordel_commission') {
    colorClass = 'ocre';
    opacityClass = 'opacity-100';
  } else {
    colorClass = getDeterministicColor(docItem.id);
    opacityClass = isArchived 
      ? 'opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 transition-all duration-300' 
      : isHidden 
        ? 'opacity-85 hover:opacity-100 transition-all duration-300' 
        : 'opacity-100';
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
    compte_rendu: '📜',
    cordel_commission: '🎪',
    statuts: '⚖️',
    culture_fiche: '📖',
    instrument_model: '🛠️',
    instrument_part: '⚙️'
  };
  const typeIcon = typeIcons[docType] || (docItem.typeDoc === 'instrument_part' || docItem.type === 'instrument_part' ? '⚙️' : (docItem.typeDoc === 'instrument_model' || docItem.type === 'instrument_model' ? '🛠️' : '📄'));

  const isDarkBg = colorClass === 'rouge' || colorClass === 'bleu-ardoise' || colorClass === 'bleu';
  const textClass = isDarkBg ? 'text-[#FEF9E7]' : 'text-encre-noire';
  const borderDashedClass = isDarkBg ? 'border-[#FEF9E7]/35' : 'border-encre-noire/25';
  const yearBadgeClass = isDarkBg ? 'bg-white/25 text-[#FEF9E7]' : 'bg-encre-noire/10 text-encre-noire';

  // Animation de balancement : swing accentué pour le dernier document, brise légère désynchronisée pour les autres (y compris Fiche de la semaine)
  const cardAnimationClass = isLatestDoc
    ? 'animate-varal-newest'
    : 'animate-varal-breeze hover:z-30 hover:scale-105 hover:rotate-0';

  const cardAnimationStyle = isLatestDoc
    ? {}
    : {
      animationDelay: `${(index * 0.4) % 1.5}s`,
      animationDuration: `${3 + (index % 3) * 0.6}s`,
    };

  return (
    <div
      onClick={() => {
        if (onSelect) onSelect(docItem);
      }}
      className={`
        relative flex flex-col items-center group cursor-pointer
        transition-all duration-300 origin-top shrink-0 flex-none
        ${isWeeklyHighlight ? 'scale-[1.03] z-20' : ''}
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

      {/* Badge Tampon Cuivre/Brique « 📌 LA SEMAINE » exclusif à la Fiche de la semaine de la corde Culture */}
      {isWeeklyHighlight && !isLatestDoc && (
        <span className="absolute -top-2.5 -left-3 z-40 bg-[#9E2A2B] text-[#F4ECD8] border border-dashed border-[#F4ECD8]/85 rounded-[4px_6px_3px_5px] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716] select-none flex items-center gap-1">
          <span>{t('documents.weeklyCultureBadge') || '📌 LA SEMAINE'}</span>
        </span>
      )}

      {/* Pince à linge 3D en bois naturel ou dorée/cuivrée pour la Fiche de la semaine */}
      <VaralClothespinSVG
        variant={isWeeklyHighlight ? 'gold' : 'wood'}
        className={`absolute -top-[16px] z-30 pointer-events-none ${isWeeklyHighlight ? 'bg-amber-500/0 border-amber-900' : ''}`}
      />

      {/* Couverture du livret Cordel (Booklet Cover) */}
      <div
        className={`
          relative w-36 h-48 border-2 ${isHidden ? 'border-dashed border-[var(--color-cordel-rouge,#8b2a1a)]/70' : 'border-encre-noire'} p-3.5 flex flex-col justify-between text-left
          bg-cordel-bg-light shadow-[4px_4px_0px_0px_#181716]
          rounded-[4px_10px_3px_8px]
          border-l-4 border-l-double
          theme-bg-${colorClass}
          ${isWeeklyHighlight ? 'ring-2 ring-amber-500/80 ring-offset-2 ring-offset-[#F4ECD8]' : ''}
          overflow-hidden
        `}
      >
        {/* Hachures pour les documents masqués aux membres (brouillons) */}
        {isHidden && (
          <div
            className="absolute inset-0 pointer-events-none z-[5] opacity-20 mix-blend-multiply" 
            style={{ backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 8px, #8b2a1a 8px, #8b2a1a 10px)` }}
          />
        )}

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
        <VaralBookletWatermarkSVG
          docItem={docItem}
          category={category}
          docType={docType}
          isDarkBg={isDarkBg}
        />

        {/* Boutons d'action au survol (épingler Culture, réordonner, modifier, supprimer) pour les administrateurs */}
        {isAuthorized && !docItem.isVirtualEventMedia && !isWorkshopVirtualDoc(docItem) && (
          <div className="absolute top-1.5 right-1.5 flex gap-1 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isCultureRope && onTogglePinWeekly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePinWeekly(docItem);
                }}
                className={`p-1 rounded border cursor-pointer select-none flex items-center justify-center shadow-sm text-[9px] leading-none transition-colors ${
                  isWeeklyHighlight && isWeeklyManuallyPinned
                    ? 'bg-[#9E2A2B] text-[#F4ECD8] border-[#F4ECD8]'
                    : 'bg-[var(--cordel-bg)] text-[var(--cordel-text)] border-[var(--cordel-border)] hover:bg-amber-200'
                }`}
                title={
                  isWeeklyHighlight && isWeeklyManuallyPinned
                    ? (t('documents.unpinWeeklyCultureTitle') || 'Désépingler la Fiche de la semaine (revenir au mode automatique)')
                    : (t('documents.pinWeeklyCultureTitle') || 'Épingler comme Fiche de la semaine')
                }
              >
                📌
              </button>
            )}
            {effectiveIndex > 0 && (
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
            {effectiveIndex < docList.length - 1 && (
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
            ) : isHidden ? (
              <span className="theme-stamp-badge text-[7.5px] font-black uppercase px-1.5 py-0.5 bg-[var(--color-cordel-ocre,#c05621)]/20 text-[var(--color-cordel-wood,#8b2a1a)] border border-[var(--color-cordel-wood,#8b2a1a)]/40 rounded shadow-xs flex items-center gap-0.5" title="Document masqué du Varal (Brouillon)">
                <span>🙈 Masqué</span>
              </span>
            ) : isArchived ? (
              <span className="theme-stamp-badge text-[7.5px] font-black uppercase px-1.5 py-0.5 bg-neutral-500/20 text-neutral-800 dark:text-neutral-300 border border-neutral-600/30 rounded shadow-xs flex items-center gap-0.5" title="Document archivé">
                <span>📦 Archive</span>
              </span>
            ) : (
              <div className="flex items-center gap-1">
                {(docItem.audience === 'ca' || docItem.portee === 'ca' || (docItem.sousCategorie || '').includes('CA')) && (
                  <span className="text-[7.5px] font-black uppercase px-1 py-0.2 rounded bg-amber-400/30 text-amber-950 border border-amber-800/40" title="Réunion de CA / Bureau (Restreinte)">
                    🔒 CA
                  </span>
                )}
                {docItem.annee && (
                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-sm ${yearBadgeClass}`}>
                    {docItem.annee}
                  </span>
                )}
              </div>
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
