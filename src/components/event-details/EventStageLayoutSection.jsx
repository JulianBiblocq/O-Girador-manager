import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { useInstrumentColor } from '../../hooks/useInstrumentColor';
import useConfirm from '../../hooks/useConfirm';

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
  const { confirm } = useConfirm();
  const { getColorForInstrument } = useInstrumentColor(profileData?.groupId);
  // Vérifier if a layout exists
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
  const [pendingVoice, setPendingVoice] = useState(null);
  const [draggedMemberId, setDraggedMemberId] = useState(null);
  const [dragOverCellKey, setDragOverCellKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(event.isStageLayoutPublished || false);

  // Raccourci clavier Échap pour désélectionner immédiatement le membre en cours
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedMemberId) {
        setSelectedMemberId(null);
        setPendingVoice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMemberId]);

  // Synchroniser state with event.stageLayout changes
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
    setIsPublished(event.isStageLayoutPublished || false);
  }, [event.id, event.stageLayout, event.isStageLayoutPublished]);

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

  // Filtrer out any placements of members who are no longer registered as present
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

  // Fonction utilitaire pour formater les noms pour les cellules de la grille (ex: "Julien B.")
  const formatMemberName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return fullName.trim();
    const initial = parts[1][0] ? parts[1][0].toUpperCase() : '';
    return initial ? `${parts[0]} ${initial}.` : parts[0];
  };

  // Détection des danseurs pour l'avant-scène
  const isDancer = (member) => {
    if (!member) return false;
    const inst = (member.instrument || '').toLowerCase();
    return inst.includes('danse') || inst.includes('danseur') || inst.includes('danseuse');
  };

  // Détection des Alfaias pour l'attribution des voix de fond
  const isAlfaia = (member) => {
    if (!member) return false;
    const inst = (member.instrument || '').toLowerCase();
    return inst.includes('alfaia');
  };

  // Résolution de la voix initiale par défaut ou enregistrée pour une Alfaia
  const getInitialVoiceForMember = (memberId) => {
    if (activePlacements[memberId]?.voice) {
      return activePlacements[memberId].voice.toLowerCase();
    }
    const member = presentMembers.find(m => m.id === memberId);
    const fullUserInfo = allUsers.find(u => u.id === memberId);
    const combinedStr = `${member?.instrument || ''} ${fullUserInfo?.instrument || ''}`.toLowerCase();
    if (combinedStr.includes('repique')) return 'repique';
    if (combinedStr.includes('meiao') || combinedStr.includes('meião') || combinedStr.includes('meian')) return 'meião';
    if (fullUserInfo?.competencesAlfaia && fullUserInfo.competencesAlfaia.length > 0) {
      const firstComp = fullUserInfo.competencesAlfaia[0].toLowerCase();
      if (firstComp.includes('repique')) return 'repique';
      if (firstComp.includes('meiao') || firstComp.includes('meião')) return 'meião';
      return 'marcante';
    }
    return 'marcante';
  };

  // Bascule de sélection d'un membre (cliquer pour sélectionner, re-cliquer pour désélectionner)
  const handleSelectMember = (memberId) => {
    if (!isEditingMode) return;
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
      setPendingVoice(null);
    } else {
      setSelectedMemberId(memberId);
      setPendingVoice(getInitialVoiceForMember(memberId));
    }
  };

  // Changement interactif de la voix d'Alfaia avec mise à jour immédiate
  const handleVoiceChange = (voiceLower) => {
    setPendingVoice(voiceLower);
    if (selectedMemberId && activePlacements[selectedMemberId]) {
      setLayout((prev) => ({
        ...prev,
        placements: {
          ...prev.placements,
          [selectedMemberId]: {
            ...prev.placements[selectedMemberId],
            voice: voiceLower
          }
        }
      }));
    }
  };

  // Gestion du clic sur une case de la grille
  const handleCellClick = (row, col) => {
    if (!isEditingMode) return;

    // Vérifier si un membre est déjà présent sur cette case
    const placedMemberId = Object.keys(activePlacements).find(
      (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
    );

    // 1. Si on clique sur une case déjà occupée
    if (placedMemberId) {
      if (selectedMemberId === placedMemberId) {
        // Re-clic sur le membre sélectionné : on le désélectionne sans rien changer
        setSelectedMemberId(null);
        setPendingVoice(null);
        return;
      }
      // On sélectionne ce membre pour lui définir son rôle/voix ou le déplacer
      setSelectedMemberId(placedMemberId);
      setPendingVoice(activePlacements[placedMemberId]?.voice || getInitialVoiceForMember(placedMemberId));
      return;
    }

    // 2. Si on clique sur une case vide et qu'un membre était sélectionné : on le place et on désélectionne
    if (selectedMemberId) {
      if (row < 0) {
        const selectedMember = presentMembers.find(m => m.id === selectedMemberId);
        if (!isDancer(selectedMember)) {
          alert("⚠️ Seuls les danseurs et danseuses peuvent être placés sur l'Avant-Scène.");
          return;
        }
      }

      const newPlacements = { ...activePlacements };
      const selectedMember = presentMembers.find(m => m.id === selectedMemberId);
      const isMemberAlfaia = isAlfaia(selectedMember);
      const voiceToAssign = isMemberAlfaia
        ? (pendingVoice || activePlacements[selectedMemberId]?.voice || getInitialVoiceForMember(selectedMemberId))
        : undefined;

      newPlacements[selectedMemberId] = {
        row,
        col,
        ...(voiceToAssign ? { voice: voiceToAssign } : {})
      };

      setLayout((prev) => ({ ...prev, placements: newPlacements }));
      // Désélection automatique dès que le membre est posé sur la grille
      setSelectedMemberId(null);
      setPendingVoice(null);
    }
  };

  // =========================================================================
  // GESTION DU GLISSER-DÉPOSER (HTML5 DRAG AND DROP)
  // =========================================================================
  const handleDragStart = (e, memberId) => {
    if (!isEditingMode) return;
    e.dataTransfer.setData('text/plain', memberId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedMemberId(memberId);
    setSelectedMemberId(memberId);
    setPendingVoice(getInitialVoiceForMember(memberId));
  };

  const handleDragEnd = () => {
    setDraggedMemberId(null);
    setDragOverCellKey(null);
  };

  const handleDragOver = (e, cellKey) => {
    if (!isEditingMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCellKey !== cellKey) {
      setDragOverCellKey(cellKey);
    }
  };

  const handleDragLeave = (e, cellKey) => {
    if (dragOverCellKey === cellKey) {
      setDragOverCellKey(null);
    }
  };

  const handleDrop = (e, targetRow, targetCol) => {
    if (!isEditingMode) return;
    e.preventDefault();
    setDragOverCellKey(null);

    const memberId = e.dataTransfer.getData('text/plain') || draggedMemberId || selectedMemberId;
    if (!memberId) return;

    // Validation danse pour l'avant-scène (row < 0)
    if (targetRow < 0) {
      const member = presentMembers.find(m => m.id === memberId);
      if (!isDancer(member)) {
        alert("⚠️ Seuls les danseurs et danseuses peuvent être placés sur l'Avant-Scène.");
        setDraggedMemberId(null);
        return;
      }
    }

    const newPlacements = { ...activePlacements };
    const currentPos = activePlacements[memberId];

    // Identifier qui est actuellement sur la case cible
    const occupantId = Object.keys(activePlacements).find(
      uid => activePlacements[uid]?.row === targetRow && activePlacements[uid]?.col === targetCol
    );

    const member = presentMembers.find(m => m.id === memberId);
    const isMemberAlfaia = isAlfaia(member);
    const voiceToAssign = isMemberAlfaia
      ? (activePlacements[memberId]?.voice || pendingVoice || getInitialVoiceForMember(memberId))
      : undefined;

    if (occupantId && occupantId !== memberId) {
      if (currentPos) {
        // Échange de positions (Swap) entre deux musiciens déjà sur scène
        newPlacements[occupantId] = {
          ...newPlacements[occupantId],
          row: currentPos.row,
          col: currentPos.col
        };
        newPlacements[memberId] = {
          ...newPlacements[memberId],
          row: targetRow,
          col: targetCol,
          ...(voiceToAssign ? { voice: voiceToAssign } : {})
        };
      } else {
        // Le membre vient de la liste des non-placés : l'occupant retourne dans la liste
        delete newPlacements[occupantId];
        newPlacements[memberId] = {
          row: targetRow,
          col: targetCol,
          ...(voiceToAssign ? { voice: voiceToAssign } : {})
        };
      }
    } else {
      // La case cible était vide
      newPlacements[memberId] = {
        row: targetRow,
        col: targetCol,
        ...(voiceToAssign ? { voice: voiceToAssign } : {})
      };
    }

    setLayout(prev => ({ ...prev, placements: newPlacements }));
    setDraggedMemberId(null);
    setSelectedMemberId(null);
    setPendingVoice(null);
  };

  const handleUnplaceMember = (e, userId) => {
    e.stopPropagation();
    if (!isEditingMode) return;

    const newPlacements = { ...activePlacements };
    delete newPlacements[userId];
    setLayout((prev) => ({ ...prev, placements: newPlacements }));
    if (selectedMemberId === userId) {
      setSelectedMemberId(null);
      setPendingVoice(null);
    }
  };

  const handleRowsChange = (e) => {
    const val = Math.max(2, Math.min(10, parseInt(e.target.value) || 5));
    // Effacer out of bounds placements but keep row 0 (Mestre)
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
    // Effacer out of bounds placements but keep col 0 (Mestre)
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

  const handleResetLayout = async () => {
    const isOk = await confirm({
      title: "Réinitialiser le plan de scène",
      message: t('eventDetails.confirmReset') || "Êtes-vous sûr de vouloir réinitialiser le plan de scène ?",
      confirmText: "Oui, réinitialiser",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (isOk) {
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
        isStageLayoutPublished: isPublished,
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

  // Build grid cells to afficher
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
    <CordelCard 
      variant="default" 
      useExtremeBorder={true} 
      className={`py-4 px-5 select-none ${isAuthorized && !isPublished ? 'bg-amber-50/40 border-dashed border-2 border-amber-600/50' : ''}`}
    >
      {/* Header / Basculer Accordion Button */}
      {isAuthorized && !isPublished && (
        <div className="mb-3 px-3 py-1.5 bg-amber-100 border border-amber-500 text-amber-900 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2 w-fit shadow-[1.5px_1.5px_0px_0px_#181716]">
          <span>🔒 Brouillon / Masqué aux adhérents</span>
        </div>
      )}
      {isAuthorized && isPublished && (
        <div className="mb-3 px-3 py-1.5 bg-emerald-100 border border-emerald-500 text-emerald-900 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-2 w-fit shadow-[1.5px_1.5px_0px_0px_#181716]">
          <span>🌐 Publié (Visible par la troupe)</span>
        </div>
      )}
      
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
                  <div className="flex flex-col gap-2 w-full">
                    <div className="bg-amber-100 border border-amber-400 text-amber-950 font-extrabold px-3 py-1.5 rounded flex items-center justify-between text-[11px] shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <span>🎯</span>
                        <span>
                          {activePlacements[selectedMemberId] ? "Membre sélectionné :" : "Placement en cours :"} <strong>{presentMembers.find(m => m.id === selectedMemberId)?.name}</strong>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setSelectedMemberId(null); setPendingVoice(null); }}
                        className="text-red-700 hover:text-red-900 font-bold ml-3 px-2 py-0.5 rounded bg-red-100/60 hover:bg-red-200 border border-red-300 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                        title="Désélectionner (ou touche Échap)"
                      >
                        ✕ Désélectionner
                      </button>
                    </div>
                    {(() => {
                      const selectedUser = presentMembers.find(m => m.id === selectedMemberId);
                      if (selectedUser && isAlfaia(selectedUser)) {
                        const fullUserInfo = allUsers.find(u => u.id === selectedMemberId);
                        const competences = fullUserInfo?.competencesAlfaia || ['marcante'];
                        const currentVoice = activePlacements[selectedMemberId]?.voice || pendingVoice || getInitialVoiceForMember(selectedMemberId);
                        
                        return (
                          <div className="flex flex-col gap-1.5 bg-white/60 dark:bg-black/40 p-2.5 rounded border border-dashed border-cordel-master-dark/20 mt-1">
                            <span className="text-[10px] font-black uppercase text-cordel-master-dark">
                              Voix attribuée pour la scène :
                            </span>
                            <div className="flex gap-4">
                              {[
                                { key: 'marcante', label: 'Marcante' },
                                { key: 'meião', label: 'Meião' },
                                { key: 'repique', label: 'Repique' }
                              ].map(({ key, label }) => {
                                const isCompetent = competences.includes(key);
                                const isSelectedVoice = currentVoice === key;
                                return (
                                  <label key={key} className={`flex items-center gap-1.5 cursor-pointer ${!isCompetent ? 'opacity-65' : ''}`}>
                                    <input
                                      type="radio"
                                      name={`alfaia-voice-${selectedMemberId}`}
                                      checked={isSelectedVoice}
                                      onChange={() => handleVoiceChange(key)}
                                      className="w-3.5 h-3.5 accent-cordel-wood cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-cordel-master-dark">
                                      {label} {!isCompetent && <span className="text-[9px] opacity-60">(hors profil)</span>}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main layout view: Grid and list */}
          <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
            {/* The Visual Stage Layout Grid */}
            <div data-tour="mestre-stage-grid" className="flex-1 w-full overflow-x-auto pb-4">
              <div className="w-full min-w-[500px] max-w-[560px] mx-auto flex flex-col items-center">
                            {(() => {
                let marcante = 0; let meiao = 0; let repique = 0;
                Object.entries(activePlacements).forEach(([uid, pos]) => {
                  const m = presentMembers.find(x => x.id === uid);
                  if (m && m.instrument.toLowerCase().includes('alfaia')) {
                    if (pos.voice === 'marcante') marcante++;
                    else if (pos.voice === 'meião') meiao++;
                    else if (pos.voice === 'repique') repique++;
                  }
                });
                const total = marcante + meiao + repique;
                if (total > 0) {
                  return (
                    <div className="w-full flex justify-center mb-4">
                      <div className="bg-cordel-wood/10 border border-cordel-wood text-cordel-wood text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-2">
                        <span>🥁 Alfaias affectés :</span>
                        <span>{marcante} Marc.</span>
                        <span className="opacity-50">|</span>
                        <span>{meiao} Meio.</span>
                        <span className="opacity-50">|</span>
                        <span>{repique} Rep.</span>
                        <span className="opacity-50">|</span>
                        <span>(Total : {total})</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
                            const cellKey = `dance-${rowVal}-${c}`;
                            const memberId = Object.keys(activePlacements).find(
                              (uid) => activePlacements[uid]?.row === rowVal && activePlacements[uid]?.col === c
                            );
                            const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
                            const isSelected = selectedMemberId && selectedMemberId === memberId;
                            const isDragOver = dragOverCellKey === cellKey;

                            return (
                              <div
                                key={cellKey}
                                draggable={isEditingMode && !!member}
                                onDragStart={(e) => member && handleDragStart(e, member.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, cellKey)}
                                onDragLeave={(e) => handleDragLeave(e, cellKey)}
                                onDrop={(e) => handleDrop(e, rowVal, c)}
                                onClick={() => !readOnly && handleCellClick(rowVal, c)}
                                className={`
                                  relative flex flex-col items-center justify-center p-1 rounded border transition-all text-center
                                  w-16 h-16 shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]
                                  ${!readOnly ? (member ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default'}
                                  ${member 
                                    ? `${getInstrumentColorClass(member.instrument)} border-2` 
                                    : 'border-dashed border-cordel-wood/30 bg-orange-50/10 hover:bg-orange-100/20'}
                                  ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                                  ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
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
                                    
                                    {/* Admin retirer placement button */}
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
                  const cellKey = 'mestre-0-0';
                  const mestreMemberId = Object.keys(activePlacements).find(
                    (uid) => activePlacements[uid]?.row === 0 && activePlacements[uid]?.col === 0
                  );
                  const mestreMember = mestreMemberId ? presentMembers.find((m) => m.id === mestreMemberId) : null;
                  const isSelected = selectedMemberId && selectedMemberId === mestreMemberId;
                  const isDragOver = dragOverCellKey === cellKey;

                  return (
                    <div
                      draggable={isEditingMode && !!mestreMember}
                      onDragStart={(e) => mestreMember && handleDragStart(e, mestreMember.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, cellKey)}
                      onDragLeave={(e) => handleDragLeave(e, cellKey)}
                      onDrop={(e) => handleDrop(e, 0, 0)}
                      onClick={() => handleCellClick(0, 0)}
                      className={`
                        relative flex flex-col items-center justify-center p-2 rounded border-2 transition-all text-center
                        w-20 h-20 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]
                        ${mestreMember ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                        ${mestreMember 
                          ? `${getInstrumentColorClass(mestreMember.instrument)} border-double border-4` 
                          : 'border-dashed border-cordel-wood/40 bg-amber-50/20 hover:bg-amber-100/30'}
                        ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                        ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
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
                            {mestreMember.instrument.split(' ')[0]}{mestreMember.instrument.toLowerCase().includes('alfaia') && activePlacements[mestreMember.id]?.voice ? ` (${activePlacements[mestreMember.id].voice.toLowerCase().startsWith('mei') ? 'Meio.' : activePlacements[mestreMember.id].voice.toLowerCase().startsWith('rep') ? 'Rep.' : 'Marc.'})` : ''}
                          </span>
                          
                          {/* Admin retirer placement button */}
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
                  const cellKey = `${row}-${col}`;
                  const memberId = Object.keys(activePlacements).find(
                    (uid) => activePlacements[uid]?.row === row && activePlacements[uid]?.col === col
                  );
                  const member = memberId ? presentMembers.find((m) => m.id === memberId) : null;
                  const isSelected = selectedMemberId && selectedMemberId === memberId;
                  const isDragOver = dragOverCellKey === cellKey;

                  return (
                    <div
                      key={cellKey}
                      draggable={isEditingMode && !!member}
                      onDragStart={(e) => member && handleDragStart(e, member.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, cellKey)}
                      onDragLeave={(e) => handleDragLeave(e, cellKey)}
                      onDrop={(e) => handleDrop(e, row, col)}
                      onClick={() => !readOnly && handleCellClick(row, col)}
                      className={`
                        relative flex flex-col items-center justify-center p-1 rounded border transition-all aspect-square text-center
                        ${!readOnly ? (member ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer') : 'cursor-default'}
                        ${member 
                          ? `${getInstrumentColorClass(member.instrument)} border-2 shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.03]` 
                          : 'border-dashed border-encre-noire/15 bg-white/20 dark:bg-black/10 hover:bg-white/40 dark:hover:bg-black/20 hover:scale-[1.01]'}
                        ${isSelected ? 'ring-2 ring-cordel-wood scale-[1.03] outline-none z-10' : ''}
                        ${isDragOver ? 'ring-3 ring-[#2d6a4f] bg-emerald-100/70 scale-105 z-20' : ''}
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
                            {member.instrument.split(' ')[0]}{member.instrument.toLowerCase().includes('alfaia') && activePlacements[member.id]?.voice ? ` (${activePlacements[member.id].voice.toLowerCase().startsWith('mei') ? 'Meio.' : activePlacements[member.id].voice.toLowerCase().startsWith('rep') ? 'Rep.' : 'Marc.'})` : ''}
                          </span>
                          
                          {/* Admin retirer placement cross button */}
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
              <div data-tour="mestre-stage-roster" className="w-full lg:w-80 lg:max-w-[320px] flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-3.5 rounded border border-dashed border-encre-noire/15 text-xs self-stretch shrink-0">
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
                                draggable={isEditingMode}
                                onDragStart={(e) => handleDragStart(e, member.id)}
                                onDragEnd={handleDragEnd}
                                onClick={() => handleSelectMember(member.id)}
                                className={`
                                  w-full text-left inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-semibold transition-all cursor-grab active:cursor-grabbing select-none
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
            <div className="flex flex-col sm:flex-row gap-3 mt-1.5 border-t border-dashed border-cordel-master-dark/15 pt-3 justify-between sm:items-center">
              <label className="flex items-center gap-2 text-[11px] font-bold text-cordel-wood cursor-pointer bg-white/40 dark:bg-black/20 p-2 rounded border border-dashed border-encre-noire/15">
                <input 
                  type="checkbox" 
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                Publier le plan de scène dans l'agenda
              </label>

              <div className="flex gap-3">
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
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
