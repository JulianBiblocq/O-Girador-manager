import React from 'react';
import { renderRichTextWithLinks } from './CommissionDocReader';

/**
 * Lecteur éditorial Cordel pour les livrets de « Présentation globale du projet » (`projet_presentation`).
 * Affiche le visuel d'en-tête (s'il existe), le texte structuré avec retours à la ligne préservés
 * (`whitespace-pre-line`) et les URLs cliquables sécurisées (`target="_blank" rel="noopener noreferrer"`).
 */
export default function ProjectPresentationReader({ docItem }) {
  if (!docItem) return null;

  const headerImageUrl =
    docItem.imageUrl ||
    docItem.illustrationUrl ||
    (docItem.fileUrl && !String(docItem.fileUrl).toLowerCase().includes('.pdf') ? docItem.fileUrl : '');

  const mainText = docItem.texte || docItem.contenu || docItem.description || '';

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Bandeau éditorial Cordel */}
      <div className="bg-amber-50/85 border-2 border-dashed border-[var(--color-cordel-ocre,#c05621)]/50 p-3.5 rounded-[6px_10px_4px_8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
            🌟 Présentation
          </span>
          <span className="font-extrabold text-cordel-wood uppercase tracking-wide text-xs">
            {docItem.eventTitle || docItem.projetTitre || 'Présentation globale du projet'}
          </span>
        </div>

        {docItem.auteur && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 rounded border border-encre-noire/20 text-[11px] font-bold text-stone-800 shrink-0">
            <span>✍️</span>
            <span>{docItem.auteur}</span>
          </div>
        )}
      </div>

      {/* Visuel d'illustration en en-tête (s'il existe) */}
      {headerImageUrl && (
        <div className="w-full rounded-[6px_10px_4px_8px] border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] overflow-hidden bg-stone-900/5 flex items-center justify-center">
          <img
            src={headerImageUrl}
            alt={docItem.titre || 'Visuel du projet'}
            loading="lazy"
            decoding="async"
            className="w-full max-h-[380px] object-contain sm:object-cover"
          />
        </div>
      )}

      {/* Corps du texte éditorial avec retours à la ligne préservés et liens cliquables sécurisés */}
      <div className="p-4 sm:p-6 bg-[var(--cordel-bg-light,#fffcf5)] border-2 border-encre-noire/20 rounded-[6px_10px_4px_8px] shadow-xs text-xs sm:text-sm leading-relaxed font-medium text-encre-noire whitespace-pre-line">
        {renderRichTextWithLinks(mainText || 'Aucune note de présentation rédigée pour ce projet.')}
      </div>
    </div>
  );
}

