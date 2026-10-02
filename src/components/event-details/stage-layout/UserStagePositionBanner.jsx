import React from 'react';
import { useTranslation } from '../../LanguageContext';
import { resolveExactRole, getProximityNeighbors } from './stageLayoutUtils';
import { useInstrumentColor } from '../../../hooks/useInstrumentColor';

/**
 * Encart personnalisé "Ta position" affiché en haut du plan de scène
 * Permet au membre connecté de repérer instantanément son rôle exact
 * et ses voisins directs immédiats (gauche et droite), sans aucune mention de numéro de rang ou de ligne.
 *
 * @param {object} props
 * @param {string} props.currentUserId Identifiant de l'utilisateur connecté
 * @param {object} props.activePlacements Placements actifs { [uid]: { row, col, voice } }
 * @param {Array} props.presentMembers Liste des membres présents
 * @param {object} props.groupNomenclature Nomenclature personnalisée de l'association
 * @param {string} props.groupId Identifiant du groupe pour la palette de couleurs
 */
export default function UserStagePositionBanner({
  currentUserId,
  activePlacements,
  presentMembers,
  groupNomenclature,
  groupId
}) {
  const { t } = useTranslation();
  const { getColorForInstrument } = useInstrumentColor(groupId);

  if (!currentUserId || !activePlacements || !activePlacements[currentUserId]) {
    return null;
  }

  const myPlacement = activePlacements[currentUserId];
  const myMemberInfo = presentMembers.find((m) => m.id === currentUserId);
  const myExactRole = resolveExactRole({
    member: myMemberInfo,
    placement: myPlacement,
    groupNomenclature
  });

  const proximity = getProximityNeighbors({
    currentUserId,
    activePlacements,
    presentMembers,
    groupNomenclature
  });

  const memberInstrumentColor = myMemberInfo?.instrument
    ? getColorForInstrument(myMemberInfo.instrument, 'pastel')
    : undefined;

  return (
    <div
      data-testid="user-stage-position-banner"
      className="w-full bg-cordel-bg-light/40 dark:bg-black/25 border-2 border-cordel-wood/40 rounded-[8px_12px_7px_11px] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#181716] flex flex-col gap-2 transition-all animate-fadeIn"
    >
      {/* Ligne 1 : Titre et Rôle exact */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-cordel-wood/20 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-cordel-wood uppercase tracking-wider">
          <span className="text-sm">📍</span>
          <span>{t ? (t('agenda.yourPosition') || 'Ta position') : 'Ta position'}</span>
        </div>

        <div
          className="px-2.5 py-0.5 rounded-full border border-encre-noire/30 text-encre-noire text-[11px] font-black shadow-[1px_1px_0px_0px_#181716] flex items-center gap-1"
          style={memberInstrumentColor ? { backgroundColor: memberInstrumentColor } : { backgroundColor: '#fef3c7' }}
        >
          <span>🎵</span>
          <span>{myExactRole}</span>
        </div>
      </div>

      {/* Ligne 2 : Repères de proximité immédiats (uniquement voisins gauche / droite) */}
      {proximity && (
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase font-bold text-encre-noire/60 tracking-wider">
            {t ? (t('agenda.directCuesAroundYou') || 'Repères directs à tes côtés :') : 'Repères directs à tes côtés :'}
          </span>

          {proximity.isMestre ? (
            <div className="text-[11px] font-bold text-cordel-wood italic">
              👑 {proximity.specialPositionNote || (t ? (t('agenda.centerStageFrontNotice') || 'Devant la scène, au centre face à la troupe') : 'Devant la scène, au centre face à la troupe')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px]">
              {/* Voisin de gauche */}
              <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/30 px-2 py-1 rounded border border-dashed border-encre-noire/15">
                <span className="text-xs">⬅️</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] uppercase font-bold opacity-60 leading-none">À ta gauche</span>
                  <span className="font-extrabold text-encre-noire truncate leading-tight">
                    {proximity.leftNeighbor ? proximity.leftNeighbor.name : 'Bord de scène'}
                  </span>
                  {proximity.leftNeighbor && (
                    <span className="text-[8px] font-semibold text-cordel-wood opacity-80 truncate leading-none">
                      {proximity.leftNeighbor.role}
                    </span>
                  )}
                </div>
              </div>

              {/* Voisin de droite */}
              <div className="flex items-center gap-1.5 bg-white/60 dark:bg-black/30 px-2 py-1 rounded border border-dashed border-encre-noire/15">
                <span className="text-xs">➡️</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] uppercase font-bold opacity-60 leading-none">À ta droite</span>
                  <span className="font-extrabold text-encre-noire truncate leading-tight">
                    {proximity.rightNeighbor ? proximity.rightNeighbor.name : 'Bord de scène'}
                  </span>
                  {proximity.rightNeighbor && (
                    <span className="text-[8px] font-semibold text-cordel-wood opacity-80 truncate leading-none">
                      {proximity.rightNeighbor.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
