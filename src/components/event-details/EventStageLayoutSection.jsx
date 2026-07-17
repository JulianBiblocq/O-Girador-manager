import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';

export default function EventStageLayoutSection({
  event,
  user,
  profileData,
  allUsers,
  isAuthorized,
  t
}) {
  // Check if a layout exists
  const hasLayout = event.stageLayout?.placements && Object.keys(event.stageLayout.placements).length > 0;

  // Accordion open/close state: default open for admins or if there is a layout
  const [isOpen, setIsOpen] = useState(isAuthorized || hasLayout);

  const [layout, setLayout] = useState({
    rows: 5,
    cols: 5,
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
        placements: event.stageLayout.placements || {}
      });
    } else {
      setLayout({
        rows: 5,
        cols: 5,
        placements: {}
      });
    }
  }, [event.id, event.stageLayout]);

  // Extract present members
  const presentMembers = (event.inscriptions || [])
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
    });

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
    if (!inst) return 'theme-bg-default border-encre-noire/30';
    const name = inst.toLowerCase();
    if (name.includes('alfaia')) return 'theme-bg-kraft border-amber-900/30 text-encre-noire';
    if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return 'theme-bg-jaune border-yellow-600/30 text-encre-noire';
    if (name.includes('gonguê') || name.includes('gongue')) return 'theme-bg-ocre border-amber-600/30 text-encre-noire';
    if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return 'theme-bg-bleu border-blue-600/30 text-encre-noire';
    if (name.includes('chant') || name.includes('voix') || name.includes('singer')) return 'theme-bg-vert border-green-600/30 text-encre-noire';
    if (name.includes('danse') || name.includes('dance')) return 'theme-bg-violet border-purple-600/30 text-white';
    if (name.includes('timbal') || name.includes('apito') || name.includes('chef')) return 'theme-bg-orange border-orange-600/30 text-encre-noire';
    return 'theme-bg-default border-encre-noire/30 text-encre-noire';
  };

  // Helper to format names to fits in grid cells (e.g. "Julien B.")
  const formatMemberName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.split(' ');
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  const handleCellClick = (row, col) => {
    if (!isAuthorized) return;

    // Find if there is a member at these coordinates
    const placedMemberId = Object.keys(activePlacements).find(
      (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
    );

    if (selectedMemberId) {
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
    if (!isAuthorized) return;

    const newPlacements = { ...activePlacements };
    delete newPlacements[userId];
    setLayout((prev) => ({ ...prev, placements: newPlacements }));
    if (selectedMemberId === userId) {
      setSelectedMemberId(null);
    }
  };

  const handleRowsChange = (e) => {
    const val = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
    // Clear out of bounds placements
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.row <= val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, rows: val, placements: filteredPlacements }));
  };

  const handleColsChange = (e) => {
    const val = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
    // Clear out of bounds placements
    const filteredPlacements = {};
    Object.entries(activePlacements).forEach(([uid, pos]) => {
      if (pos.col <= val) {
        filteredPlacements[uid] = pos;
      }
    });
    setLayout((prev) => ({ ...prev, cols: val, placements: filteredPlacements }));
  };

  const handleResetLayout = () => {
    if (window.confirm(t('eventDetails.confirmReset') || "Êtes-vous sûr de vouloir réinitialiser le plan de scène ?")) {
      setLayout({
        rows: 5,
        cols: 5,
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
          {/* Grid Settings & Instructions for admin */}
          {isAuthorized && (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15 text-xs">
              <div className="flex flex-col gap-1.5">
                <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px]">
                  ⚙️ {t('eventDetails.stageLayoutConfig') || "Configuration de la grille"}
                </span>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 font-bold text-[11px]">
                    Lignes:
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={layout.rows}
                      onChange={handleRowsChange}
                      className="theme-input py-1 px-2 w-16 text-center"
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
                      className="theme-input py-1 px-2 w-16 text-center"
                    />
                  </label>
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
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* The Visual Stage Layout Grid */}
            <div className="flex-1 w-full flex flex-col items-center">
              <div className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 mb-2">
                {t('eventDetails.stageFront') || "▲ AVANT DE LA SCÈNE (PUBLIC) ▲"}
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
                      onClick={() => handleCellClick(row, col)}
                      className={`
                        relative flex flex-col items-center justify-center p-1 rounded border transition-all cursor-pointer aspect-square text-center
                        ${member 
                          ? `${getInstrumentColorClass(member.instrument)} border-2 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]` 
                          : 'border-dashed border-encre-noire/15 bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/20 hover:scale-[1.01]'}
                        ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                      `}
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
                          {isAuthorized && (
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
                        isAuthorized && (
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

            {/* List of present members to place (only visible in edit mode) */}
            {isAuthorized && (
              <div className="w-full lg:w-60 flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15 text-xs self-stretch">
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
          {isAuthorized && (
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
