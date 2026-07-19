import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { useInstrumentColor } from '../../hooks/useInstrumentColor';

export default function EventStageLayoutSection({
  event,
  user,
  profileData,
  allUsers,
  isAuthorized,
  t,
  readOnly = false,
  onGoToStageLayoutEditor
}) {
  const { getColorForInstrument } = useInstrumentColor(profileData?.groupId);
  // Check if a layout exists
  const hasLayout = event.stageLayout?.placements && Object.keys(event.stageLayout.placements).length > 0;

  const canEditLayout = isAuthorized || profileData?.role === 'prof-danse' || profileData?.role === 'prof_danse';
  const isEditingMode = canEditLayout && !readOnly;

  // Accordion open/close state: default open for admins or if there is a layout
  const [isOpen, setIsOpen] = useState(canEditLayout || hasLayout);

  const [layout, setLayout] = useState({
    rows: 5,
    cols: 5,
    danceRows: 1,
    danceCols: 5,
    placements: {}
  });

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync state with event.stageLayout changes
  useEffect(() => {
    if (event.stageLayout) {
      setLayout({
        rows: event.stageLayout.rows || 5,
        cols: event.stageLayout.cols || 5,
        danceRows: event.stageLayout.danceRows || 1,
        danceCols: event.stageLayout.danceCols || 5,
        placements: event.stageLayout.placements || {}
      });
    } else {
      setLayout({
        rows: 5,
        cols: 5,
        danceRows: 1,
        danceCols: 5,
        placements: {}
      });
    }
  }, [event.id, event.stageLayout]);

  // Extract present members and external guests
  const presentMembers = [
    ...(event.inscriptions || [])
      .filter((ins) => ins.status === 'present')
      .map((ins) => {
        const userInfo = allUsers.find((u) => u.id === ins.userId) || {};
        const instrument = ins.instrumentChoisi || userInfo.instrument || 'Autre';
        return {
          id: ins.userId,
          name: ins.userName || `${userInfo.prenom} ${userInfo.nom}`,
          photoURL: userInfo.photoURL || '',
          instrument
        };
      }),
    ...(event.invitesExternes || []).map((guest) => ({
      id: guest.id,
      name: `${guest.nom} [Invité]`,
      photoURL: '',
      instrument: guest.instrument || guest.fonction || 'Autre',
      isInvite: true
    }))
  ];

  // Filter out any placements of members who are no longer registered as present
  const presentUserIds = new Set(presentMembers.map((m) => m.id));
  const activePlacements = {};
  Object.entries(layout.placements).forEach(([uid, pos]) => {
    if (presentUserIds.has(uid)) {
      activePlacements[uid] = pos;
    }
  });

  // List of present members that are not yet placed on the stage
  const unplacedMembers = presentMembers.filter((m) => !activePlacements[m.id]);

  // Group unplaced members by instrument for cleaner selection sidebar
  const groupedUnplaced = {};
  unplacedMembers.forEach((member) => {
    if (!groupedUnplaced[member.instrument]) {
      groupedUnplaced[member.instrument] = [];
    }
    groupedUnplaced[member.instrument].push(member);
  });

  // Instrument color mapping matching the project design system
  const getInstrumentColorClass = (inst) => {
    return 'border-encre-noire/30 text-encre-noire';
  };

  // Helper to format names to fits in grid cells (e.g. "Julien B.")
  const formatMemberName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  const handleCellClick = (row, col) => {
    if (!isEditingMode) return;

    // Find if there is a member at these coordinates
    const placedMemberId = Object.keys(activePlacements).find(
      (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
    );

    if (selectedMemberId) {
      // Validate pupitre for Dance row (row < 0)
      if (row < 0) {
        const selectedMember = presentMembers.find(m => m.id === selectedMemberId);
        const isDancer = selectedMember && (
          selectedMember.instrument === 'Danse' ||
          selectedMember.instrument === 'danse' ||
          selectedMember.instrument === 'danseur' ||
          selectedMember.instrument === 'danseuse' ||
          selectedMember.instrument.toLowerCase().includes('danse')
        );
        if (!isDancer) {
          alert("⚠️ Seuls les danseurs et danseuses peuvent être placés sur l'Avant-Scène.");
          return;
        }
      }

      // Place selected member
      const newPlacements = { ...activePlacements };

      // Swap or clear old position if they were already placed
      newPlacements[selectedMemberId] = { row, col };

      // Unplace the previous member who was in this cell
      if (placedMemberId && placedMemberId !== selectedMemberId) {
        delete newPlacements[placedMemberId];
      }

      setLayout((prev) => ({ ...prev, placements: newPlacements }));
      setSelectedMemberId(null);
    } else if (placedMemberId) {
      // Select placed member to move them
      setSelectedMemberId(placedMemberId);
    }
  };

  const handleUnplaceMember = (e, userId) => {
    e.stopPropagation();
    if (!isEditingMode) return;

    const newPlacements = { ...activePlacements };
    delete newPlacements[userId];
    setLayout((prev) => ({ ...prev, placements: newPlacements }));
    if (selectedMemberId === userId) {
      setSelectedMemberId(null);
    }
  };

  const handleRowsChange = (e) => {
    const val = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
    // Clear out of bounds placements but keep row 0 (Mestre)
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.row === 0 || pos.row <= val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, rows: val, placements: filteredPlacements }));
  };

  const handleColsChange = (e) => {
    const val = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
    // Clear out of bounds placements but keep col 0 (Mestre)
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.col === 0 || pos.col <= val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, cols: val, placements: filteredPlacements }));
  };

  const handleDanceRowsChange = (e) => {
    const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.row >= 0 || pos.row >= -val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, danceRows: val, placements: filteredPlacements }));
  };

  const handleDanceColsChange = (e) => {
    const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 5));
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.row >= 0 || pos.col <= val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, danceCols: val, placements: filteredPlacements }));
  };

  const handleResetLayout = () => {
    if (window.confirm(t('eventDetails.confirmReset') || "Êtes-vous sûr de vouloir réinitialiser le plan de scène ?")) {
      setLayout({
        rows: 5,
        cols: 5,
        danceRows: 1,
        danceCols: 5,
        placements: {}
      });
      setSelectedMemberId(null);
    }
  };

  const handleSaveLayout = async () => {
    if (!event.id) return;
    setSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        stageLayout: {
          rows: layout.rows,
          cols: layout.cols,
          danceRows: layout.danceRows || 1,
          danceCols: layout.danceCols || 5,
          placements: activePlacements
        }
      });
      alert(t('eventDetails.saveLayoutSuccess') || "Plan de scène enregistré !");
    } catch (err) {
      console.error("Error saving stage layout:", err);
      alert(t('eventDetails.saveLayoutError') || "Erreur lors de l'enregistrement du plan de scène.");
    } finally {
      setSaving(false);
    }
  };

  // Build grid cells to render
  const gridCells = [];
  for (let r = 1; r <= layout.rows; r++) {
    for (let c = 1; c <= layout.cols; c++) {
      gridCells.push({ row: r, col: c });
    }
  }

  // If no layout is defined and in readOnly mode, display creation prompt for admins
  if (readOnly && !hasLayout) {
    if (!canEditLayout) {
      return null; // hide completely for normal members if no layout is defined
    }
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="text-center py-4 flex flex-col items-center gap-3">
          <span className="text-xs font-bold opacity-60">🎭 Aucun plan de scène n'a encore été configuré pour cet événement.</span>
          {onGoToStageLayoutEditor && (
            <button
              type="button"
              onClick={() => onGoToStageLayoutEditor(event.id)}
              className="text-[10px] font-black uppercase bg-cordel-ocre text-encre-noire border border-encre-noire px-4 py-2 rounded shadow-[2px_2px_0px_0px_#181716] cursor-pointer hover:brightness-95"
            >
              🛠️ Créer le plan de scène dans l'Espace Mestre
            </button>
          )}
        </div>
      </CordelCard>
    );
  }

  // If not admin and there is no layout saved, do not show the section
  if (!isAuthorized && !hasLayout) {
    return null;
  }

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
      {/* Header / Toggle Accordion Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          🎭 {t('eventDetails.stageLayoutTitle') || "Plan de Scène / Cortejo"}
        </span>
        <span className="text-[10px] opacity-75">{isOpen ? '▲ Masquer' : '▼ Afficher'}</span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-5 text-left">
          {/* Link to Mestre Space Editor when in readOnly mode */}
          {readOnly && canEditLayout && onGoToStageLayoutEditor && (
            <div className="flex justify-end -mb-2">
              <button
                type="button"
                onClick={() => onGoToStageLayoutEditor(event.id)}
                className="text-[10px] font-black uppercase bg-cordel-ocre text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer hover:brightness-95 flex items-center gap-1.5"
              >
                🛠️ Placer / Modifier dans l'Espace Mestre
              </button>
            </div>
          )}

          {/* Grid Settings & Instructions for admin */}
          {isEditingMode && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15 text-xs w-full">
              <div className="flex flex-col gap-2.5 w-full md:w-auto">
                <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] mb-1 block">
                  ⚙️ {t('eventDetails.stageLayoutConfig') || "Configuration de la grille"}
                </span>
                <div className="flex flex-col gap-2">
                  {/* Percussion line */}
                  <div className="flex gap-4 items-center">
                    <span className="font-extrabold text-[10px] uppercase text-cordel-wood w-24">🥁 Percussions :</span>
                    <label className="flex items-center gap-2 font-bold text-[11px]">
                      Lignes:
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={layout.rows}
                        onChange={handleRowsChange}
                        className="theme-input py-0.5 px-1.5 w-12 text-center"
                      />
                    </label>
                    <label className="flex items-center gap-2 font-bold text-[11px]">
                      Colonnes:
                      <input
                        type="number"
                        min="2"
                        max="10"
                        value={layout.cols}
                        onChange={handleColsChange}
                        className="theme-input py-0.5 px-1.5 w-12 text-center"
                      />
                    </label>
                  </div>
                  {/* Danse line */}
                  <div className="flex gap-4 items-center">
                    <span className="font-extrabold text-[10px] uppercase text-cordel-wood w-24">💃 Danse :</span>
                    <label className="flex items-center gap-2 font-bold text-[11px]">
                      Lignes:
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={layout.danceRows || 1}
                        onChange={handleDanceRowsChange}
                        className="theme-input py-0.5 px-1.5 w-12 text-center"
                      />
                    </label>
                    <label className="flex items-center gap-2 font-bold text-[11px]">
                      Colonnes:
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={layout.danceCols || 5}
                        onChange={handleDanceColsChange}
                        className="theme-input py-0.5 px-1.5 w-12 text-center"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <span className="text-[10px] leading-relaxed italic opacity-85">
                  {t('eventDetails.stageLayoutHelp') || "👉 Sélectionnez un membre ci-dessous, puis cliquez sur une case de la grille pour le placer."}
                </span>
                {selectedMemberId && (
                  <div className="bg-amber-100 border border-amber-400 text-amber-950 font-extrabold px-3 py-1.5 rounded flex items-center justify-between text-[11px]">
                    <span>
                      Placement en cours : {presentMembers.find(m => m.id === selectedMemberId)?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberId(null)}
                      className="text-red-700 hover:text-red-900 font-bold ml-3 cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main layout view: Grid and list */}
          <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
            {/* The Visual Stage Layout Grid */}
            <div className="flex-1 w-full overflow-x-auto pb-4">
              <div className="w-full min-w-[500px] max-w-[560px] mx-auto flex flex-col items-center">
              <div className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 mb-2">
                {t('eventDetails.stageFront') || "▲ AVANT DE LA SCÈNE (PUBLIC) ▲"}
              </div>

              {/* Zone Avant-scène / Danse */}
              <div className="w-full flex flex-col items-center mb-4 select-none bg-cordel-bg-light/20 p-2.5 rounded border border-dashed border-cordel-wood/30">
                <span className="text-[8px] uppercase tracking-widest font-black text-cordel-wood mb-2 opacity-80">
                  💃 Avant-scène / Danse
                </span>
                <div className="flex flex-col gap-2 w-full items-center">
                  {(() => {
                    const rowsList = [];
                    for (let r = 1; r <= (layout.danceRows || 1); r++) {
                      rowsList.push(-r);
                    }
                    return rowsList.map((rowVal) => (
                      <div key={`dance-row-${rowVal}`} className="flex gap-2 justify-center">
                        {(() => {
                          const colsList = [];
                          for (let c = 1; c <= (layout.danceCols || 5); c++) {
                            colsList.push(c);
                          }
                          return colsList.map((c) => {
                            const memberId = Object.keys(activePlacements).find(
                              (uid) => activePlacements[uid]?.row === rowVal && activePlacements[uid]?.col === c
                            );
                            const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
                            const isSelected = selectedMemberId && selectedMemberId === memberId;

                            return (
                              <div
                                key={`dance-${rowVal}-${c}`}
                                onClick={() => !readOnly && handleCellClick(rowVal, c)}
                                className={`
                                  relative flex flex-col items-center justify-center p-1 rounded border transition-all text-center
                                  w-16 h-16 shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]
                                  ${!readOnly ? 'cursor-pointer' : 'cursor-default'}
                                  ${member 
                                    ? `${getInstrumentColorClass(member.instrument)} border-2` 
                                    : 'border-dashed border-cordel-wood/30 bg-orange-50/10 hover:bg-orange-100/20'}
                                  ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                                `}
                                style={member ? { backgroundColor: getColorForInstrument(member.instrument, 'pastel') } : undefined}
                                title={member ? `Danse : ${member.name}` : `Emplacement Danse ${Math.abs(rowVal)}, ${c}`}
                              >
                                {member ? (
                                  <>
                                    <XiloAvatar
                                      src={member.photoURL}
                                      name={member.name}
                                      size={18}
                                      className="pointer-events-none mb-0.5 border border-encre-noire/10"
                                    />
                                    <span className="text-[8px] font-black leading-none truncate max-w-full">
                                      {formatMemberName(member.name)}
                                    </span>
                                    <span className="text-[6px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                                      Danse
                                    </span>
                                    
                                    {/* Admin remove placement button */}
                                    {isEditingMode && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleUnplaceMember(e, member.id)}
                                        className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[7px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                                        title="Retirer"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  isEditingMode ? (
                                    <span className="text-cordel-wood/40 text-[9px] font-black leading-none">+ Placer</span>
                                  ) : (
                                    <span className="text-neutral-400/50 text-[8px] italic">Vide</span>
                                  )
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Case Mestre dédiée, centrée devant la grille */}
              <div className="flex flex-col items-center mb-5 mt-1 select-none">
                <span className="text-[8px] uppercase tracking-widest font-black text-cordel-wood mb-1 opacity-80">
                  👑 Chef d'orchestre (Mestre)
                </span>
                {(() => {
                  const mestreMemberId = Object.keys(activePlacements).find(
                    (uid) => activePlacements[uid]?.row === 0 && activePlacements[uid]?.col === 0
                  );
                  const mestreMember = mestreMemberId ? presentMembers.find((m) => m.id === mestreMemberId) : null;
                  const isSelected = selectedMemberId && selectedMemberId === mestreMemberId;

                  return (
                    <div
                      onClick={() => handleCellClick(0, 0)}
                      className={`
                        relative flex flex-col items-center justify-center p-2 rounded border-2 transition-all cursor-pointer text-center
                        w-20 h-20 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]
                        ${mestreMember 
                          ? `${getInstrumentColorClass(mestreMember.instrument)} border-double border-4` 
                          : 'border-dashed border-cordel-wood/40 bg-amber-50/20 hover:bg-amber-100/30'}
                        ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                      `}
                      style={mestreMember ? { backgroundColor: getColorForInstrument(mestreMember.instrument, 'pastel') } : undefined}
                      title={mestreMember ? `Mestre : ${mestreMember.name} (${mestreMember.instrument})` : "Case Mestre"}
                    >
                      {mestreMember ? (
                        <>
                          <XiloAvatar
                            src={mestreMember.photoURL}
                            name={mestreMember.name}
                            size={24}
                            className="pointer-events-none mb-1 border border-encre-noire/10"
                          />
                          <span className="text-[9px] font-black leading-none truncate max-w-full">
                            {formatMemberName(mestreMember.name)}
                          </span>
                          <span className="text-[7px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                            {mestreMember.instrument.split(' ')[0]}
                          </span>
                          
                          {/* Admin remove placement button */}
                          {isEditingMode && (
                            <button
                              type="button"
                              onClick={(e) => handleUnplaceMember(e, mestreMember.id)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                              title="Retirer le Mestre"
                            >
                              ✕
                            </button>
                          )}
                        </>
                      ) : (
                        isEditingMode ? (
                          <span className="text-cordel-wood/40 text-[10px] font-black leading-none">+ Mestre</span>
                        ) : (
                          <span className="text-neutral-400/50 text-[9px] italic">Vide</span>
                        )
                      )}
                    </div>
                  );
                })()}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
                  gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
                  gap: '8px',
                  width: '100%',
                  aspectRatio: `${layout.cols} / ${layout.rows}`,
                  maxWidth: '560px',
                }}
                className="p-4 border-2 border-encre-noire bg-cordel-bg-light/10 rounded-[8px_12px_9px_11px] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.15)] relative select-none"
              >
                {gridCells.map(({ row, col }) => {
                  const memberId = Object.keys(activePlacements).find(
                    (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
                  );
                  const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
                  const isSelected = selectedMemberId && selectedMemberId === memberId;

                  return (
                    <div
                      key={`${row}-${col}`}
                      onClick={() => !readOnly && handleCellClick(row, col)}
                      className={`
                        relative flex flex-col items-center justify-center p-1 rounded border transition-all aspect-square text-center
                        ${!readOnly ? 'cursor-pointer' : 'cursor-default'}
                        ${member 
                          ? `${getInstrumentColorClass(member.instrument)} border-2 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]` 
                          : 'border-dashed border-encre-noire/15 bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/20 hover:scale-[1.01]'}
                        ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                      `}
                      style={member ? { backgroundColor: getColorForInstrument(member.instrument, 'pastel') } : undefined}
                      title={member ? `${member.name} (${member.instrument})` : `Cellule L${row}-C${col}`}
                    >
                      {member ? (
                        <>
                          <XiloAvatar
                            src={member.photoURL}
                            name={member.name}
                            size={20}
                            className="hidden sm:block pointer-events-none mb-0.5 border border-encre-noire/10"
                          />
                          <span className="text-[9px] sm:text-[10px] font-black leading-none truncate max-w-full">
                            {formatMemberName(member.name)}
                          </span>
                          <span className="text-[7px] sm:text-[8px] opacity-75 font-semibold leading-none mt-0.5 uppercase truncate max-w-full">
                            {member.instrument.split(' ')[0]}
                          </span>
                          
                          {/* Admin remove placement cross button */}
                          {isEditingMode && (
                            <button
                              type="button"
                              onClick={(e) => handleUnplaceMember(e, member.id)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[8px] font-black flex items-center justify-center border border-encre-noire shadow hover:bg-red-800 transition-colors cursor-pointer"
                              title="Retirer ce musicien"
                            >
                              ✕
                            </button>
                          )}
                        </>
                      ) : (
                        isEditingMode && (
                          <span className="text-encre-noire/25 text-xs sm:text-sm font-black">+</span>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 mt-2">
                {t('eventDetails.stageBack') || "▼ FOND DE LA SCÈNE ▼"}
              </div>
            </div>
          </div>

            {/* List of present members to place (only visible in edit mode) */}
            {isEditingMode && (
              <div className="w-full lg:w-80 lg:max-w-[320px] flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15 text-xs self-stretch shrink-0">
                <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] border-b border-dashed border-encre-noire/10 pb-1 flex justify-between">
                  <span>👥 {t('eventDetails.stageLayoutUnplaced') || "Membres à placer"}</span>
                  <span className="opacity-70 font-semibold">({unplacedMembers.length})</span>
                </span>

                <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {Object.keys(groupedUnplaced).length === 0 ? (
                    <span className="italic opacity-60 text-[11px] text-center my-4">
                      Tous les membres présents ont été placés.
                    </span>
                  ) : (
                    Object.keys(groupedUnplaced).map((inst) => (
                      <div key={inst} className="flex flex-col gap-1">
                        <strong className="text-[10px] text-cordel-wood opacity-85 mb-0.5">{inst}</strong>
                        <div className="flex flex-col gap-1.5 pl-1.5">
                          {groupedUnplaced[inst].map((member) => {
                            const isCurrentlySelected = selectedMemberId === member.id;
                            return (
                              <button
                                type="button"
                                key={member.id}
                                onClick={() => setSelectedMemberId(member.id)}
                                className={`
                                  w-full text-left inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-semibold transition-all cursor-pointer select-none
                                  ${getInstrumentColorClass(member.instrument)}
                                  ${isCurrentlySelected 
                                    ? 'ring-2 ring-cordel-wood font-black translate-x-[2px] shadow-none' 
                                    : 'border-dashed border-encre-noire/10 hover:translate-x-[1px]'}
                                  `}
                                  style={{ backgroundColor: getColorForInstrument(member.instrument, 'pastel') }}
                              >
                                <XiloAvatar src={member.photoURL} name={member.name} size={16} />
                                <span className="truncate">{member.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons for admin */}
          {isEditingMode && (
            <div className="flex gap-3 mt-1.5 border-t border-dashed border-cordel-master-dark/15 pt-3">
              <CordelButton
                type="button"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving}
                onClick={handleSaveLayout}
                className="text-[10px] uppercase font-black px-4 py-2 flex items-center gap-1 shadow hover:brightness-95"
              >
                {saving ? "..." : "💾"} {t('eventDetails.stageLayoutSave') || "Enregistrer le plan"}
              </CordelButton>

              <button
                type="button"
                onClick={handleResetLayout}
                className="text-[10px] font-black uppercase bg-neutral-200 border border-encre-noire px-4 py-2 rounded shadow active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-300 cursor-pointer"
              >
                🔄 {t('eventDetails.stageLayoutReset') || "Réinitialiser"}
              </button>
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
