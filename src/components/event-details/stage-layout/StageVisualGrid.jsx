import React from 'react';
import XiloAvatar from '../../XiloAvatar';
import StageInstrumentBadges from './StageInstrumentBadges';
import {
  getVisibleStageColumns,
  hasDancersOnStage,
  formatCompactMemberName,
  isStageDancer
} from './stageLayoutUtils';
import { getVoiceLabel } from '../../../constants/nomenclature';

/**
 * Composant de rendu de la grille visuelle de la scène
 * Gère l'affichage responsive, le format rectangulaire dense côté adhérent,
 * le nettoyage conditionnel des colonnes vides et de l'avant-scène,
 * et la mise en valeur contrastée du profil connecté.
 */
export default function StageVisualGrid({
  layout,
  activePlacements,
  presentMembers,
  currentUserId,
  groupNomenclature,
  getColorForInstrument,
  isEditingMode,
  readOnly,
  selectedMemberId,
  dragOverCellKey,
  onCellClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onUnplaceMember,
  t,
  onOpenFullscreen,
  isFullscreen = false
}) {
  // Détection des danseurs sur scène
  const hasDancers = hasDancersOnStage(activePlacements);
  const showDanceSection = isEditingMode || hasDancers;

  // Calcul des colonnes de percussion visibles (masquage automatique des colonnes vides en mode adhérent)
  const visibleCols = getVisibleStageColumns({
    totalCols: layout.cols || 5,
    activePlacements,
    isEditingMode
  });

  // Calcul des colonnes de danse visibles si l'avant-scène est affichée
  const totalDanceCols = layout.danceCols || 5;
  const occupiedDanceCols = Array.from({ length: totalDanceCols }, (_, i) => i + 1).filter((c) =>
    Object.values(activePlacements).some((pos) => pos.row < 0 && pos.col === c)
  );
  const visibleDanceCols = isEditingMode
    ? Array.from({ length: totalDanceCols }, (_, i) => i + 1)
    : occupiedDanceCols.length > 0
    ? occupiedDanceCols
    : [1];

  // Construction des cellules de la grille de percussion
  const gridCells = [];
  for (let r = 1; r <= (layout.rows || 5); r++) {
    for (const c of visibleCols) {
      gridCells.push({ row: r, col: c });
    }
  }

  // Formatage du rôle / nuance affiché sur la tuile
  const getRoleSnippet = (member, pos) => {
    if (!member) return '';
    const instLower = (member.instrument || '').toLowerCase();
    const isAlf = instLower.includes('alfaia');
    const isCx = instLower.includes('caixa') || instLower.includes('tarol');
    const assignedVoice = pos?.voice;

    if (isAlf && assignedVoice) {
      return `${member.instrument.split(' ')[0]} (${getVoiceLabel(assignedVoice, groupNomenclature, true)})`;
    }
    if (isCx && assignedVoice) {
      return assignedVoice.toLowerCase() === 'tarol' ? 'Tarol' : 'Caixa';
    }
    return member.instrument.split(' ')[0];
  };

  return (
    <div
      data-tour="mestre-stage-grid"
      className={`w-full flex flex-col items-center ${isEditingMode ? 'min-w-[500px] max-w-[560px] mx-auto overflow-x-auto pb-4' : 'max-w-[560px] mx-auto'}`}
    >
      {/* 1. En-tête des pupitres compacts */}
      <StageInstrumentBadges
        activePlacements={activePlacements}
        presentMembers={presentMembers}
        groupNomenclature={groupNomenclature}
      />

      {/* Barre supérieure : repère Avant-scène & Bouton Plein écran */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 px-1">
        <div className="text-[9px] uppercase tracking-wider font-extrabold text-cordel-wood/80 flex items-center gap-1">
          <span>▲</span>
          <span>{t?.('eventDetails.stageFront') || 'AVANT DE LA SCÈNE (PUBLIC)'}</span>
          <span>▲</span>
        </div>

        {/* Bouton de zoom / plein écran (affiché uniquement hors modale plein écran) */}
        {!isFullscreen && onOpenFullscreen && (
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded border border-encre-noire/30 bg-white/70 dark:bg-black/30 hover:bg-white text-encre-noire shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1 transition-all"
            title="Ouvrir le plan de scène en plein écran"
          >
            <span>🔍</span>
            <span>Agrandir</span>
          </button>
        )}
      </div>

      {/* 2. Zone Avant-scène / Danse (masquée en vue adhérent si aucun danseur placé) */}
      {showDanceSection && (
        <div className="w-full flex flex-col items-center mb-3 select-none bg-cordel-bg-light/20 dark:bg-black/20 p-2 sm:p-2.5 rounded border border-dashed border-cordel-wood/30">
          <span className="text-[8px] uppercase tracking-widest font-black text-cordel-wood mb-1.5 opacity-80">
            💃 Avant-scène / Danse
          </span>
          <div className="flex flex-col gap-1.5 w-full items-center">
            {(() => {
              const rowsList = [];
              for (let r = 1; r <= (layout.danceRows || 1); r++) {
                rowsList.push(-r);
              }
              return rowsList.map((rowVal) => (
                <div key={`dance-row-${rowVal}`} className="flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full">
                  {visibleDanceCols.map((c) => {
                    const cellKey = `dance-${rowVal}-${c}`;
                    const memberId = Object.keys(activePlacements).find(
                      (uid) => activePlacements[uid]?.row === rowVal && activePlacements[uid]?.col === c
                    );
                    const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
                    const isSelected = selectedMemberId && selectedMemberId === memberId;
                    const isDragOver = dragOverCellKey === cellKey;
                    const isCurrentUser = Boolean(currentUserId && memberId === currentUserId);

                    return (
                      <div
                        key={cellKey}
                        draggable={isEditingMode && !!member}
                        onDragStart={(e) => member && onDragStart?.(e, member.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={(e) => onDragOver?.(e, cellKey)}
                        onDragLeave={(e) => onDragLeave?.(e, cellKey)}
                        onDrop={(e) => onDrop?.(e, rowVal, c)}
                        onClick={() => !readOnly && onCellClick?.(rowVal, c)}
                        className={`
                          relative flex flex-col items-center justify-center p-1 rounded transition-all text-center
                          ${isEditingMode ? 'w-16 h-16 shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]' : 'w-14 sm:w-16 h-12 sm:h-14 shadow-sm'}
                          ${!readOnly ? (member ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default'}
                          ${
                            member
                              ? isCurrentUser
                                ? 'border-2 border-[var(--color-cordel-rouge,#8b2a1a)] ring-2 ring-[var(--color-cordel-rouge,#8b2a1a)]/50 shadow-md font-black z-20 scale-[1.02]'
                                : 'border-2 border-encre-noire/30 text-encre-noire'
                              : isEditingMode
                              ? 'border border-dashed border-cordel-wood/30 bg-orange-50/10 hover:bg-orange-100/20'
                              : 'border border-dashed border-cordel-wood/15 bg-orange-50/5'
                          }
                          ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                          ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
                        `}
                        style={member ? { backgroundColor: getColorForInstrument(member.instrument, 'pastel') } : undefined}
                        title={member ? `Danse : ${member.name}` : undefined}
                      >
                        {member ? (
                          <>
                            {isCurrentUser && (
                              <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[7px] font-black rounded-full uppercase tracking-tighter shadow z-30">
                                Toi
                              </span>
                            )}
                            <XiloAvatar
                              src={member.photoURL}
                              name={member.name}
                              size={16}
                              className="pointer-events-none mb-0.5 border border-encre-noire/10"
                            />
                            <span className="text-[8px] font-black leading-none truncate max-w-full">
                              {formatCompactMemberName(member.name)}
                            </span>
                            <span className="text-[6px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                              Danse
                            </span>

                            {/* Bouton de retrait en mode édition */}
                            {isEditingMode && (
                              <button
                                type="button"
                                onClick={(e) => onUnplaceMember?.(e, member.id)}
                                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[7px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                                title="Retirer"
                              >
                                ✕
                              </button>
                            )}
                          </>
                        ) : isEditingMode ? (
                          <span className="text-cordel-wood/40 text-[9px] font-black leading-none">+ Placer</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 3. Case Mestre dédiée, centrée devant la grille */}
      <div className="flex flex-col items-center mb-3 mt-0.5 select-none w-full">
        <span className="text-[8px] uppercase tracking-widest font-black text-cordel-wood mb-1 opacity-80">
          👑 Chef d'orchestre (Mestre)
        </span>
        {(() => {
          const cellKey = 'mestre-0-0';
          const mestreMemberId = Object.keys(activePlacements).find(
            (uid) => activePlacements[uid]?.row === 0 && activePlacements[uid]?.col === 0
          );
          const mestreMember = mestreMemberId ? presentMembers.find((m) => m.id === mestreMemberId) : null;
          const isSelected = selectedMemberId && selectedMemberId === mestreMemberId;
          const isDragOver = dragOverCellKey === cellKey;
          const isCurrentUser = Boolean(currentUserId && mestreMemberId === currentUserId);

          return (
            <div
              draggable={isEditingMode && !!mestreMember}
              onDragStart={(e) => mestreMember && onDragStart?.(e, mestreMember.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver?.(e, cellKey)}
              onDragLeave={(e) => onDragLeave?.(e, cellKey)}
              onDrop={(e) => onDrop?.(e, 0, 0)}
              onClick={() => onCellClick?.(0, 0)}
              className={`
                relative flex flex-col items-center justify-center p-1.5 rounded transition-all text-center
                ${isEditingMode ? 'w-20 h-20 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]' : 'w-24 h-14 sm:h-16 shadow-sm'}
                ${mestreMember ? (isEditingMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default') : isEditingMode ? 'cursor-pointer' : 'cursor-default'}
                ${
                  mestreMember
                    ? isCurrentUser
                      ? 'border-2 border-[var(--color-cordel-rouge,#8b2a1a)] ring-2 ring-[var(--color-cordel-rouge,#8b2a1a)]/50 shadow-md font-black z-20'
                      : 'border-double border-4 border-encre-noire/40 text-encre-noire'
                    : isEditingMode
                    ? 'border-2 border-dashed border-cordel-wood/40 bg-amber-50/20 hover:bg-amber-100/30'
                    : 'border border-dashed border-cordel-wood/20 bg-amber-50/5'
                }
                ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
              `}
              style={mestreMember ? { backgroundColor: getColorForInstrument(mestreMember.instrument, 'pastel') } : undefined}
              title={mestreMember ? `Mestre : ${mestreMember.name} (${mestreMember.instrument})` : undefined}
            >
              {mestreMember ? (
                <>
                  {isCurrentUser && (
                    <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[7px] font-black rounded-full uppercase tracking-tighter shadow z-30">
                      Toi
                    </span>
                  )}
                  <XiloAvatar
                    src={mestreMember.photoURL}
                    name={mestreMember.name}
                    size={20}
                    className="pointer-events-none mb-0.5 border border-encre-noire/10"
                  />
                  <span className="text-[8.5px] sm:text-[9.5px] font-black leading-none truncate max-w-full">
                    {formatCompactMemberName(mestreMember.name)}
                  </span>
                  <span className="text-[6.5px] sm:text-[7.5px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                    {getRoleSnippet(mestreMember, activePlacements[mestreMember.id])}
                  </span>

                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={(e) => onUnplaceMember?.(e, mestreMember.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                      title="Retirer le Mestre"
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : isEditingMode ? (
                <span className="text-cordel-wood/40 text-[10px] font-black leading-none">+ Mestre</span>
              ) : null}
            </div>
          );
        })()}
      </div>

      {/* 4. Grille des Percussions (adaptée à 100% largeur mobile sans débordement) */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${layout.rows || 5}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${visibleCols.length}, minmax(0, 1fr))`,
          gap: isEditingMode ? '8px' : '5px',
          width: '100%',
          maxWidth: '560px',
          ...(isEditingMode ? { aspectRatio: `${layout.cols} / ${layout.rows}` } : {})
        }}
        className={`p-2.5 sm:p-4 border-2 border-encre-noire bg-cordel-bg-light/10 dark:bg-black/15 rounded-[8px_12px_9px_11px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15)] relative select-none w-full`}
      >
        {gridCells.map(({ row, col }) => {
          const cellKey = `${row}-${col}`;
          const memberId = Object.keys(activePlacements).find(
            (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
          );
          const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
          const isSelected = selectedMemberId && selectedMemberId === memberId;
          const isDragOver = dragOverCellKey === cellKey;
          const isCurrentUser = Boolean(currentUserId && memberId === currentUserId);

          return (
            <div
              key={cellKey}
              draggable={isEditingMode && !!member}
              onDragStart={(e) => member && onDragStart?.(e, member.id)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => onDragOver?.(e, cellKey)}
              onDragLeave={(e) => onDragLeave?.(e, cellKey)}
              onDrop={(e) => onDrop?.(e, row, col)}
              onClick={() => !readOnly && onCellClick?.(row, col)}
              className={`
                relative flex flex-col items-center justify-center p-1 rounded transition-all text-center
                ${isEditingMode ? 'aspect-square' : 'min-h-[46px] h-12 sm:h-14'}
                ${!readOnly ? (member ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default'}
                ${
                  member
                    ? isCurrentUser
                      ? 'border-2 border-[var(--color-cordel-rouge,#8b2a1a)] ring-2 ring-[var(--color-cordel-rouge,#8b2a1a)]/50 shadow-md font-black z-20 scale-[1.02]'
                      : 'border-2 border-encre-noire/30 shadow-[1px_1px_0px_0px_#181716] text-encre-noire'
                    : isEditingMode
                    ? 'border-dashed border-encre-noire/15 bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/20 hover:scale-[1.01]'
                    : 'border border-dashed border-encre-noire/10 bg-white/10 dark:bg-black/5'
                }
                ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
              `}
              style={member ? { backgroundColor: getColorForInstrument(member.instrument, 'pastel') } : undefined}
              title={member ? `${member.name} (${member.instrument})` : undefined}
            >
              {member ? (
                <>
                  {isCurrentUser && (
                    <span className="absolute -top-1.5 -right-1 px-1 py-0.2 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white text-[7px] font-black rounded-full uppercase tracking-tighter shadow z-30">
                      Toi
                    </span>
                  )}
                  <XiloAvatar
                    src={member.photoURL}
                    name={member.name}
                    size={16}
                    className="hidden sm:block pointer-events-none mb-0.5 border border-encre-noire/10"
                  />
                  <span className="text-[8.5px] sm:text-[9.5px] font-black leading-tight truncate max-w-full">
                    {formatCompactMemberName(member.name)}
                  </span>
                  <span className="text-[6.5px] sm:text-[7.5px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                    {getRoleSnippet(member, activePlacements[member.id])}
                  </span>

                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={(e) => onUnplaceMember?.(e, member.id)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                      title="Retirer ce musicien"
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : isEditingMode ? (
                <span className="text-encre-noire/25 text-xs sm:text-sm font-black">+</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="text-[9px] uppercase tracking-wider font-extrabold text-cordel-wood/80 mt-2">
        {t?.('eventDetails.stageBack') || '▼ FOND DE LA SCÈNE ▼'}
      </div>
    </div>
  );
}
