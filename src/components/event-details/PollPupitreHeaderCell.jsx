import React from 'react';
import XiloAvatar from '../XiloAvatar';
import { useTranslation } from '../LanguageContext';

/**
 * En-tête de colonne par pupitre dans la matrice de répartition :
 * affiche le compteur des « Sans réponse », déplie leurs prénoms et permet de les relancer (< 80 lignes).
 */
export default function PollPupitreHeaderCell({
  pupitre,
  stats = {},
  isOpen = false,
  onToggleOpen,
  isSuperAdminOrMestre = false,
  isReminding = false,
  onRemindPupitre,
  t: propT
}) {
  const i18n = useTranslation();
  const t = propT || i18n.t;
  const unvoted = stats.totallyUnansweredMembers || [];
  const hasUnvoted = unvoted.length > 0;

  return (
    <th className="p-2 text-center border-r border-encre-noire/15 last:border-r-0 align-top">
      <div>{pupitre}</div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1 normal-case">
        {hasUnvoted ? (
          <button
            type="button"
            onClick={onToggleOpen}
            title={t('pollMatrix.unansweredHeaderTooltip')}
            className={`inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
              isOpen
                ? 'bg-[var(--color-cordel-ocre,#c05621)] text-white border-encre-noire'
                : 'bg-amber-50/90 text-[var(--color-cordel-ocre,#c05621)] border-amber-800/30 hover:bg-amber-100'
            }`}
          >
            {t('pollMatrix.unansweredShort', { count: unvoted.length })}
          </button>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-700/30 bg-emerald-50 text-[var(--color-cordel-vert,#2d6a4f)]">
            {t('pollMatrix.allVotedBadge')}
          </span>
        )}

        {hasUnvoted && isSuperAdminOrMestre && onRemindPupitre && (
          <button
            type="button"
            disabled={isReminding}
            onClick={() => onRemindPupitre(pupitre, unvoted)}
            title={t('pollMatrix.remindPupitreTooltip', { count: unvoted.length, pupitre })}
            className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded border border-encre-noire bg-cordel-bg text-cordel-wood hover:brightness-95 disabled:opacity-50 cursor-pointer transition-all"
          >
            {t('pollMatrix.remindPupitreBtn')}
          </button>
        )}
      </div>

      {isOpen && hasUnvoted && (
        <div className="mt-1 p-1.5 rounded bg-white border border-encre-noire/30 text-left normal-case font-semibold flex flex-wrap gap-1 justify-center">
          {unvoted.map((m) => (
            <span key={m.uid} className="inline-flex items-center gap-0.5 text-[8px] bg-amber-50 border border-amber-700/25 px-1 py-0.2 rounded text-encre-noire">
              <XiloAvatar src={m.photoURL} name={m.name} size={10} /> <span>{m.prenom}</span>
            </span>
          ))}
        </div>
      )}
    </th>
  );
}
