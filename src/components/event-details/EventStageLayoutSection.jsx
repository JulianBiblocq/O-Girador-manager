import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { useInstrumentColor } from '../../hooks/useInstrumentColor';
import useConfirm from '../../hooks/useConfirm';
import { useGroupNomenclature } from '../../hooks/useGroupNomenclature';
import { getVoiceLabel } from '../../constants/nomenclature';
import UserStagePositionBanner from './stage-layout/UserStagePositionBanner';
import StageVisualGrid from './stage-layout/StageVisualGrid';
import StageLayoutFullscreenModal from './stage-layout/StageLayoutFullscreenModal';
import { toggleStaggeredRow } from './stage-layout/stageLayoutUtils';

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
  const { nomenclature: groupNomenclature } = useGroupNomenclature(profileData?.groupId || event?.groupId);
  const currentUserId = user?.uid || profileData?.uid || profileData?.id;

  // Vérifier if a layout exists
  const hasLayout = event.stageLayout?.placements && Object.keys(event.stageLayout.placements).length > 0;

  const canEditLayout = isAuthorized || profileData?.role === 'prof-danse' || profileData?.role === 'prof_danse';
  const isEditingMode = canEditLayout && !readOnly;

  // Accordion open/close state: default open for admins or if there is a layout
  const [isOpen, setIsOpen] = useState(canEditLayout || hasLayout);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const [layout, setLayout] = useState({
    rows: 5,
    cols: 5,
    danceRows: 1,
    danceCols: 5,
    staggeredRows: [],
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
        staggeredRows: event.stageLayout.staggeredRows || [],
        placements: event.stageLayout.placements || {}
      });
    } else {
      setLayout({
        rows: 5,
        cols: 5,
        danceRows: 1,
        danceCols: 5,
        staggeredRows: [],
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
        const instrument = ins.instrumentChoisi || userInfo.instrument || userInfo.instrumentPrincipal || 'Autre';
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

  // Détection du pupitre Caixas pour l'attribution Caixa vs Tarol
  const isCaixas = (member) => {
    if (!member) return false;
    const inst = (member.instrument || '').toLowerCase();
    return inst.includes('caixa') || inst.includes('tarol');
  };

  // Résolution de la voix/sous-instrument initial par défaut ou enregistré
  const getInitialVoiceForMember = (memberId) => {
    if (activePlacements[memberId]?.voice) {
      return activePlacements[memberId].voice.toLowerCase();
    }
    const member = presentMembers.find(m => m.id === memberId);
    const fullUserInfo = allUsers.find(u => u.id === memberId);
    const combinedStr = `${member?.instrument || ''} ${fullUserInfo?.instrument || ''} ${fullUserInfo?.instrumentPrincipal || ''}`.toLowerCase();

    // Caixas : Caixa vs Tarol
    if (combinedStr.includes('caixa') || combinedStr.includes('tarol')) {
      if (fullUserInfo?.sousInstrument) return fullUserInfo.sousInstrument.toLowerCase();
      if (fullUserInfo?.attributionCaixa) return fullUserInfo.attributionCaixa.toLowerCase();
      if (combinedStr.includes('tarol')) return 'tarol';
      return 'caixa';
    }

    // Alfaias : Marcante, Meião, Repique
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
      const isMemberCaixas = isCaixas(selectedMember);
      const voiceToAssign = (isMemberAlfaia || isMemberCaixas)
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
    const isMemberCaixas = isCaixas(member);
    const voiceToAssign = (isMemberAlfaia || isMemberCaixas)
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
        staggeredRows: [],
        placements: {}
      });
      setSelectedMemberId(null);
    }
  };

  const handleToggleStaggerRow = (rowIndex) => {
    setLayout((prev) => ({
      ...prev,
      staggeredRows: toggleStaggeredRow(rowIndex, prev.staggeredRows || [])
    }));
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
          staggeredRows: layout.staggeredRows || [],
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
          <span>🌐 {t ? (t('agenda.stagePublishedBadge') || 'Publié (visible par la troupe)') : 'Publié (visible par la troupe)'}</span>
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
        <span className="text-[10px] opacity-75">{isOpen ? `▲ ${t ? (t('agenda.btnHideStagePlan') || 'Masquer') : 'Masquer'}` : `▼ ${t ? (t('agenda.toggleExpand') || 'Afficher') : 'Afficher'}`}</span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-5 text-left">
          {/* Encart d'en-tête personnalisé "Ta position" (Action 1) */}
          <UserStagePositionBanner
            currentUserId={currentUserId}
            activePlacements={activePlacements}
            presentMembers={presentMembers}
            groupNomenclature={groupNomenclature}
            groupId={profileData?.groupId || event?.groupId}
          />

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
                                { key: 'marcante' },
                                { key: 'meião' },
                                { key: 'repique' }
                              ].map(({ key }) => {
                                const label = getVoiceLabel(key, groupNomenclature);
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
                      if (selectedUser && isCaixas(selectedUser)) {
                        const fullUserInfo = allUsers.find(u => u.id === selectedMemberId);
                        const defaultSousInst = fullUserInfo?.sousInstrument || fullUserInfo?.attributionCaixa || (
                          (selectedUser.instrument || '').toLowerCase().includes('tarol') ? 'tarol' : 'caixa'
                        );
                        const currentVoice = activePlacements[selectedMemberId]?.voice || pendingVoice || defaultSousInst.toLowerCase();

                        return (
                          <div className="flex flex-col gap-1.5 bg-white/60 dark:bg-black/40 p-2.5 rounded border border-dashed border-cordel-master-dark/20 mt-1">
                            <span className="text-[10px] font-black uppercase text-cordel-master-dark">
                              Instrument attribué pour la scène :
                            </span>
                            <div className="flex gap-4">
                              {[
                                { key: 'caixa', label: 'Caixa' },
                                { key: 'tarol', label: 'Tarol' }
                              ].map(({ key, label }) => {
                                const isSelected = (currentVoice || '').toLowerCase() === key;
                                return (
                                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`caixa-voice-${selectedMemberId}`}
                                      checked={isSelected}
                                      onChange={() => handleVoiceChange(key)}
                                      className="w-3.5 h-3.5 accent-cordel-wood cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-cordel-master-dark">
                                      {label}
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
            {/* Grille visuelle responsive de la scène (Actions 2, 3, 4) */}
            <div className="flex-1 w-full min-w-0">
              <StageVisualGrid
                layout={layout}
                activePlacements={activePlacements}
                presentMembers={presentMembers}
                currentUserId={currentUserId}
                groupNomenclature={groupNomenclature}
                getColorForInstrument={getColorForInstrument}
                isEditingMode={isEditingMode}
                readOnly={readOnly}
                selectedMemberId={selectedMemberId}
                dragOverCellKey={dragOverCellKey}
                onCellClick={handleCellClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onUnplaceMember={handleUnplaceMember}
                onToggleStaggerRow={handleToggleStaggerRow}
                t={t}
                onOpenFullscreen={() => setIsFullscreenOpen(true)}
                isFullscreen={false}
              />
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

      {/* Modale Plein Écran / Zoom à la demande (Action 3) */}
      <StageLayoutFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        eventTitle={event.title || event.nom || t?.('eventDetails.stageLayoutTitle') || 'Plan de Scène'}
      >
        <div className="w-full flex flex-col gap-3">
          <UserStagePositionBanner
            currentUserId={currentUserId}
            activePlacements={activePlacements}
            presentMembers={presentMembers}
            groupNomenclature={groupNomenclature}
            groupId={profileData?.groupId || event?.groupId}
          />
          <StageVisualGrid
            layout={layout}
            activePlacements={activePlacements}
            presentMembers={presentMembers}
            currentUserId={currentUserId}
            groupNomenclature={groupNomenclature}
            getColorForInstrument={getColorForInstrument}
            isEditingMode={false}
            readOnly={true}
            t={t}
            isFullscreen={true}
          />
        </div>
      </StageLayoutFullscreenModal>
    </CordelCard>
  );
}
