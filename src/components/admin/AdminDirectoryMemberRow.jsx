import React from 'react';
import { isMemberArchived } from '../../utils/memberUtils';
import { getMemberPushDiagnosticBadge } from '../../utils/pushDiagnosticsUtils';

/**
 * Ligne d'un membre dans le tableau Annuaire & Export (`AdminExport.jsx`).
 * Affiche le statut Push ainsi que le badge de télé-diagnostic explicite pour les membres non-joignables.
 */
export default function AdminDirectoryMemberRow({
  member,
  getPratiquesList,
  tRole,
  t,
  actionLoadingId,
  canCreateMember,
  onToggleArchive
}) {
  const pratiques = getPratiquesList(member);
  const isArchived = isMemberArchived(member);
  const isLoading = actionLoadingId === member.id;
  const isPushReachable = Array.isArray(member.fcmTokens) && member.fcmTokens.length > 0;
  const pushDiag = getMemberPushDiagnosticBadge(member);

  return (
    <tr className="hover:bg-cordel-bg/40 transition-colors">
      <td className="px-2 py-2 md:px-4 md:py-2.5 font-bold truncate max-w-[150px]">
        {member.prenom} {member.nom}
      </td>
      <td className="px-2 py-2 md:px-4 md:py-2.5 truncate max-w-[200px]">
        {member.email}
      </td>
      <td className="px-2 py-2 md:px-4 md:py-2.5 whitespace-nowrap">
        {member.telephone || '-'}
      </td>
      <td className="px-2 py-2 md:px-4 md:py-2.5 whitespace-nowrap">
        <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] border-dashed">
          {member.role === 'membre' || !member.role
            ? member.genre === 'femme'
              ? t('secretariat.badgeMemberFem')
              : t('secretariat.badgeMemberMasc')
            : tRole(member.role, member.genre)}
        </span>
      </td>
      <td className="px-2 py-2 md:px-4 md:py-2.5 max-w-[240px]">
        {pratiques.length === 0 ? (
          <span className="opacity-50 text-[11px]">
            {member.statutActuel === 'en_attente' ? 'En attente' : '-'}
          </span>
        ) : (
          <div className="flex flex-wrap gap-1 items-center">
            {pratiques.map((pratique, pIdx) => {
              const isDanse = typeof pratique === 'string' && pratique.toLowerCase().includes('danse');
              return (
                <span
                  key={`${member.id}-prat-${pIdx}`}
                  className={`theme-stamp-badge ${
                    isDanse
                      ? 'theme-stamp-badge-ocre text-[8px] bg-amber-500/15 border-amber-800/40 text-amber-950 font-black'
                      : 'theme-stamp-badge-wood text-[8px]'
                  } px-1.5 py-0.5 normal-case font-bold inline-flex items-center gap-1 shadow-none`}
                >
                  {isDanse ? '💃' : '🥁'} {pratique}
                </span>
              );
            })}
          </div>
        )}
      </td>
      <td className="px-2 py-2 md:px-4 md:py-2.5 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          <span
            className={`theme-stamp-badge text-[7.5px] font-black px-1.5 py-0.5 ${
              isPushReachable
                ? 'bg-[var(--color-cordel-vert,#2d6a4f)]/15 border-[#2d6a4f]/40 text-[var(--color-cordel-vert,#2d6a4f)]'
                : 'bg-stone-200/80 border-stone-400/50 text-stone-700'
            }`}
            title={pushDiag.label}
          >
            {isPushReachable ? '🔔 Push' : `🔕 Muet · ${pushDiag.shortLabel}`}
          </span>
          {isArchived ? (
            <span className="theme-stamp-badge text-[7.5px] bg-red-600/15 border-red-700/40 text-red-900 dark:text-red-300 font-black px-1.5 py-0.5">
              🗄️ Archivé
            </span>
          ) : (
            <span className="theme-stamp-badge text-[7.5px] bg-[var(--color-cordel-vert)]/15 border-[#2d6a4f]/40 text-[var(--color-cordel-vert)] font-black px-1.5 py-0.5">
              Actif
            </span>
          )}
          {canCreateMember && (
            <button
              type="button"
              onClick={() => onToggleArchive(member)}
              disabled={isLoading}
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-colors border ${
                isArchived
                  ? 'bg-[var(--color-cordel-vert)]/10 hover:bg-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)] hover:text-white border-[#2d6a4f]/40'
                  : 'bg-cordel-wood/10 hover:bg-cordel-wood text-cordel-wood hover:text-white border-cordel-wood/30'
              }`}
              title={isArchived ? "Réintégrer ce membre dans l'association" : 'Archiver ce membre et suspendre son accès'}
            >
              {isLoading ? '...' : isArchived ? 'Désarchiver' : 'Archiver'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

