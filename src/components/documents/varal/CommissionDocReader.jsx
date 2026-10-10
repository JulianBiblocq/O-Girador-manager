import React from 'react';
import { getCommissionBookletData } from '../../../utils/commissionBookletParser';

/**
 * Découpe une chaîne textuelle et rend les URLs brutes et liens Markdown cliquables.
 * Ouvre tous les liens externes dans un nouvel onglet sécurisé.
 * @param {string} text Texte source à enrichir
 * @returns {Array<React.ReactNode>}
 */
export function renderRichTextWithLinks(text) {
  if (!text || typeof text !== 'string') return null;

  // Regex capturant soit [label](url) soit une URL brute http(s)://
  const linkRegex = /(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const isMarkdownLink = Boolean(match[1] && match[2]);
    const label = isMarkdownLink ? match[1] : match[3];
    const url = isMarkdownLink ? match[2] : match[3];

    parts.push(
      <a
        key={`link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[var(--cordel-wood,#8b2a1a)] font-bold underline decoration-[var(--color-cordel-ocre,#c05621)]/60 decoration-1 underline-offset-2 hover:decoration-[var(--cordel-wood,#8b2a1a)] hover:text-stone-950 transition-colors inline-flex items-center gap-0.5 break-all cursor-pointer"
        title={`Ouvrir le lien : ${url}`}
      >
        <span>{label}</span>
        <span className="text-[10px] no-underline opacity-70">↗</span>
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Lecteur riche pour les livrets de commission affichés au Varal.
 * Affiche la mission, les jalons avec statut et carnet de bord, et rend les liens interactifs.
 */
export default function CommissionDocReader({ docItem }) {
  if (!docItem) return null;

  const { description, jalons, sections, rawContent } = getCommissionBookletData(docItem);
  const completedCount = jalons.filter((j) => j.status === 'fait').length;
  const hasStructuredContent = Boolean(description || jalons.length > 0 || sections.length > 0);

  if (!hasStructuredContent) {
    return (
      <div className="p-4 sm:p-6 bg-white border-2 border-encre-noire/20 rounded-[6px_10px_4px_8px] shadow-xs text-xs whitespace-pre-line leading-relaxed font-medium text-encre-noire">
        {renderRichTextWithLinks(rawContent || 'Aucun contenu rédigé pour cette commission.')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* 1. Description générale & Mission de la commission */}
      {description && (
        <div className="p-4 bg-[var(--cordel-bg-light,#fffcf5)] border-2 border-encre-noire/15 rounded-[6px_10px_4px_8px] shadow-xs flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b border-dashed border-encre-noire/15 pb-1.5">
            <span className="text-sm select-none">🎯</span>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood">
              Mission &amp; Objectifs
            </h4>
          </div>
          <div className="leading-relaxed text-stone-800 font-sans whitespace-pre-line">
            {renderRichTextWithLinks(description)}
          </div>
        </div>
      )}

      {/* 2. Section Jalons & Avancées (Carnet de bord) */}
      {jalons.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b-2 border-dashed border-cordel-master-dark/20 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm select-none">🗓️</span>
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood">
                Jalons &amp; Avancées
              </h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-encre-noire/5 text-stone-600">
              {completedCount} / {jalons.length} terminés
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {jalons.map((jalon, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-[4px_6px_3px_5px] border transition-colors flex flex-col gap-1.5 ${
                  jalon.status === 'fait'
                    ? 'bg-emerald-50/70 border-[var(--color-cordel-vert,#2d6a4f)]/35'
                    : jalon.status === 'en_cours'
                    ? 'bg-amber-50/70 border-[var(--color-cordel-ocre,#c05621)]/35'
                    : 'bg-white border-encre-noire/15'
                }`}
              >
                {/* Ligne principale du jalon avec statut et date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black border shrink-0 ${
                        jalon.status === 'fait'
                          ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire/40'
                          : jalon.status === 'en_cours'
                          ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-encre-noire/40'
                          : 'bg-stone-100 text-stone-400 border-stone-300'
                      }`}
                      title={jalon.statusLabel}
                    >
                      {jalon.status === 'fait' ? '✓' : jalon.status === 'en_cours' ? '⏳' : '○'}
                    </span>

                    <span
                      className={`font-bold text-encre-noire ${
                        jalon.status === 'fait' ? 'line-through opacity-75' : ''
                      }`}
                    >
                      {jalon.titre}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                    {jalon.deadline && (
                      <span className="font-semibold text-stone-600 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                        📅 {jalon.deadline}
                      </span>
                    )}
                    <span
                      className={`font-black uppercase tracking-wider px-2 py-0.5 rounded text-[8.5px] ${
                        jalon.status === 'fait'
                          ? 'bg-[var(--color-cordel-vert,#2d6a4f)]/15 text-[var(--color-cordel-vert,#2d6a4f)]'
                          : jalon.status === 'en_cours'
                          ? 'bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)]'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {jalon.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Bloc Carnet de bord : Notes et détails multilignes */}
                {jalon.notes && (
                  <div className="mt-1 pl-7">
                    <div className="p-2.5 rounded-r-[4px] border-l-3 border-[var(--color-cordel-ocre,#c05621)] bg-amber-50/85 shadow-2xs text-[11px] text-stone-800 font-sans whitespace-pre-line leading-relaxed">
                      {renderRichTextWithLinks(jalon.notes)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Sections complémentaires (Bénévoles, Matériel, Contacts) */}
      {sections.length > 0 && (
        <div className="flex flex-col gap-3 pt-2">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="p-3 bg-white/70 border border-dashed border-encre-noire/20 rounded flex flex-col gap-1.5">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-cordel-wood">
                {sec.title}
              </h4>
              <div className="flex flex-col gap-1 text-[11.5px] text-stone-700 whitespace-pre-line">
                {sec.lines.map((l, lIdx) => (
                  <div key={lIdx}>{renderRichTextWithLinks(l)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
