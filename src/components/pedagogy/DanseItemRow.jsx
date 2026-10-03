// Ligne d'un élément de Danse réel pour la synthèse pédagogique
// Fichier conforme à la règle anti-monolithe (< 200 lignes)

import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';

export default function DanseItemRow({
  item,
  revCount = 0,
  onProgramDirect = null,
  onPinNote = null
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const hasScore = item.score !== null;

  let bg = 'bg-neutral-200 text-neutral-700';
  if (hasScore) {
    if (item.score < 50) bg = 'bg-[var(--color-cordel-rouge)] text-white';
    else if (item.score < 75) bg = 'bg-[var(--color-cordel-ocre)] text-white';
    else bg = 'bg-[var(--color-cordel-vert)] text-white';
  }

  return (
    <>
      <tr className="hover:bg-neutral-100/50 transition-colors border-b border-encre-noire/10">
        <td className="p-2.5 font-bold text-encre-noire">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black">{item.titre}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-200/80 text-encre-noire">
                {item.tag}
              </span>
              {revCount > 0 && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30">
                  🙋 {revCount}
                </span>
              )}
            </div>
            <span className="text-[9.5px] font-semibold text-encre-noire/60">{item.subtitle}</span>
          </div>
        </td>

        <td className="p-2.5 text-center font-black">
          <span className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${bg} shadow-2xs`}>
            {hasScore ? `${item.score}%` : t('pedagogy.progress.nonEvalue')}
          </span>
        </td>

        <td className="p-2.5 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5">
            {item.figures?.length > 0 && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-encre-noire/30 rounded hover:bg-neutral-100 cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <span>{isOpen ? '▲' : '▼'}</span>
                <span>{item.figures.length} {t('pedagogy.progress.figures')}</span>
              </button>
            )}

            {onProgramDirect && (
              <button
                type="button"
                onClick={() => onProgramDirect({ titre: item.titre, discipline: '💃 Danse', id: item.id })}
                className="text-[10px] font-black px-1.5 py-1 bg-[var(--color-cordel-vert)] text-white border border-[#1b4332] rounded hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title={t('pedagogy.progress.programmerEnRepetition')}
              >
                ⚡
              </button>
            )}

            {onPinNote && (hasScore && (item.score < 75 || revCount > 0)) && (
              <button
                type="button"
                onClick={() => onPinNote(item.titre, 'Danse', revCount)}
                className="text-[10px] font-black px-1.5 py-1 bg-white text-encre-noire border border-encre-noire/30 rounded hover:bg-neutral-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title={t('pedagogy.progress.epinglerAuBlocNotes')}
              >
                📌
              </button>
            )}
          </div>
        </td>
      </tr>

      {isOpen && item.figures?.length > 0 && (
        <tr className="bg-pink-50/30 border-b-2 border-encre-noire/20 animate-fadeIn">
          <td colSpan={3} className="p-3 pl-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase text-pink-900 tracking-wider">{t('pedagogy.progress.figuresAssociees')}</span>
              <div className="flex flex-wrap gap-2">
                {item.figures.map((fig, idx) => (
                  <span key={idx} className="text-xs font-bold px-2.5 py-1 rounded bg-white border border-dashed border-pink-300 text-encre-noire shadow-2xs flex items-center gap-1">
                    <span>💃</span>
                    <span>{fig}</span>
                  </span>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
