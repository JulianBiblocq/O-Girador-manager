import React, { useState, useRef, useEffect } from 'react';
import { useViewSimulator } from '../../context/ViewSimulatorContext';

/**
 * Icône SVG d'œil style Cordel (gravure sur bois / traits d'encre noire).
 */
export function CordelEyeIcon({ size = 18, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Contour en amande franc style xilogravure */}
      <path d="M2 12C4.5 7 8.5 4.5 12 4.5C15.5 4.5 19.5 7 22 12C19.5 17 15.5 19.5 12 19.5C8.5 19.5 4.5 17 2 12Z" />
      {/* Iris franc */}
      <circle cx="12" cy="12" r="3.6" strokeWidth="2.2" />
      {/* Pupille pleine */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Hachures de gravure supérieure et inférieure */}
      <line x1="12" y1="2" x2="12" y2="4" strokeWidth="1.8" />
      <line x1="7" y1="3" x2="8" y2="5" strokeWidth="1.5" />
      <line x1="17" y1="3" x2="16" y2="5" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Bouton et Menu Popover Cordel pour le Simulateur de Vue (Mode Impersonation / Test de vue).
 * Réservé exclusivement aux Super-Administrateurs et Mestres réels.
 */
export default function ViewSimulatorSelector() {
  const {
    isSimulating,
    simulationTarget,
    realProfileData,
    tagsDisponibles = [],
    availableMembers = [],
    loadingMembers,
    startSimulation,
    stopSimulation
  } = useViewSimulator();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const popoverRef = useRef(null);

  // Visibilité conditionnelle stricte : Super-Admin ou Mestre réel uniquement
  const isAuthorized = Boolean(
    realProfileData?.isSystemAdmin === true ||
    (realProfileData?.role || '').toLowerCase() === 'super-admin' ||
    (realProfileData?.role || '').toLowerCase() === 'mestre'
  );

  // Fermeture au clic à l'extérieur ou sur touche Échap
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthorized) {
    return null;
  }

  // 1. Activation de la simulation Adhérent standard
  const handleSimulateStandard = () => {
    startSimulation({
      type: 'standard',
      label: 'Adhérent standard',
      role: 'membre',
      tags: []
    });
    setIsOpen(false);
  };

  // 2. Activation de la simulation par Badge / Étiquette
  const handleSimulateTag = (e) => {
    e.preventDefault();
    if (!selectedTagId) return;

    const tagObj = tagsDisponibles.find(t => {
      const id = typeof t === 'string' ? t : (t.id || t.nomM);
      return id === selectedTagId;
    });

    const tagLabel = tagObj
      ? (typeof tagObj === 'string' ? tagObj : (tagObj.nomM || tagObj.id))
      : selectedTagId;

    const tagIdentifier = typeof tagObj === 'string' ? tagObj : (tagObj?.id || selectedTagId);

    startSimulation({
      type: 'tag',
      label: tagLabel,
      role: 'membre',
      tags: [tagIdentifier]
    });
    setIsOpen(false);
  };

  // 3. Activation de la simulation par Adhérent précis
  const handleSimulateUser = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const memberObj = availableMembers.find(m => m.id === selectedUserId);
    if (!memberObj) return;

    const memberName = memberObj.surnom
      ? `${memberObj.prenom || ''} ${memberObj.nom || ''} « ${memberObj.surnom} »`.trim()
      : `${memberObj.prenom || ''} ${memberObj.nom || ''}`.trim() || 'Membre';

    startSimulation({
      type: 'user',
      label: memberName,
      role: memberObj.role || 'membre',
      tags: Array.isArray(memberObj.tags) ? memberObj.tags : [],
      simulatedUser: memberObj
    });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Bouton de déclenchement (Icône Œil Cordel) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 sm:p-2 border-2 rounded-[5px_8px_4px_7px] transition-all cursor-pointer flex items-center justify-center gap-1 text-encre-noire select-none ${
          isSimulating
            ? 'bg-amber-400 border-encre-noire animate-pulse shadow-[2px_2px_0px_0px_#181716]'
            : 'border-dashed border-encre-noire/30 hover:border-encre-noire bg-cordel-bg shadow-[1px_1px_0px_0px_#181716] hover:bg-white'
        }`}
        title={
          isSimulating
            ? `Mode Test actif : ${simulationTarget?.label || ''} (Cliquer pour changer ou quitter)`
            : "Simulateur de vue (Tester la vue d'un adhérent ou d'un badge)"
        }
      >
        <CordelEyeIcon size={16} />
        {isSimulating && (
          <span className="hidden xl:inline text-[9px] font-black uppercase tracking-wider text-amber-950">
            Test : {simulationTarget?.label || 'Actif'}
          </span>
        )}
      </button>

      {/* Popover Cordel */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-88 p-4 bg-cordel-bg border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[3px_3px_0px_0px_#181716] z-[100] text-encre-noire animate-fadeIn">
          {/* En-tête du Popover */}
          <div className="flex items-start justify-between pb-2.5 mb-3 border-b-2 border-dashed border-cordel-master-dark/20">
            <div>
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide">
                <CordelEyeIcon size={14} />
                <span>Simulateur de Vue</span>
              </div>
              <div className="text-[10px] text-cordel-master-dark/75 font-medium">
                Auditer ce que voient les membres en direct
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-black text-cordel-master-dark hover:text-cordel-wood p-1 cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-3.5 text-xs">
            {/* 1. Option Adhérent standard */}
            <div className="flex flex-col gap-1 p-2 bg-cordel-bg-light border border-encre-noire/30 rounded-[5px_7px_4px_6px]">
              <div className="font-extrabold text-[11px] flex items-center gap-1">
                <span>🌱</span>
                <span>Adhérent standard</span>
              </div>
              <p className="text-[9.5px] text-cordel-master-dark/70">
                Vue de base sans aucun badge ni accès aux pôles administratifs.
              </p>
              <button
                type="button"
                onClick={handleSimulateStandard}
                className="mt-1 w-full py-1.5 px-2 bg-white hover:bg-neutral-100 border border-encre-noire rounded font-black text-[10px] uppercase tracking-wider text-center cursor-pointer shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px]"
              >
                Tester vue Adhérent standard
              </button>
            </div>

            {/* 2. Option Par Badge / Étiquette */}
            <form onSubmit={handleSimulateTag} className="flex flex-col gap-1.5 p-2 bg-cordel-bg-light border border-encre-noire/30 rounded-[5px_7px_4px_6px]">
              <div className="font-extrabold text-[11px] flex items-center gap-1">
                <span>🏷️</span>
                <span>Par Badge / Étiquette</span>
              </div>
              <p className="text-[9.5px] text-cordel-master-dark/70">
                Simule un membre portant uniquement cette étiquette.
              </p>
              <div className="flex gap-1.5 mt-0.5">
                <select
                  value={selectedTagId}
                  onChange={(e) => setSelectedTagId(e.target.value)}
                  className="flex-1 text-[10px] font-bold p-1 bg-white border border-encre-noire rounded cursor-pointer truncate"
                  required
                >
                  <option value="">-- Choisir un badge --</option>
                  {tagsDisponibles.map((tag) => {
                    const tagId = typeof tag === 'string' ? tag : (tag.id || tag.nomM);
                    const tagLabel = typeof tag === 'string'
                      ? tag
                      : (tag.nomF && tag.nomF !== tag.nomM ? `${tag.nomM} / ${tag.nomF}` : tag.nomM);
                    return (
                      <option key={tagId} value={tagId}>
                        {tagLabel}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="submit"
                  disabled={!selectedTagId}
                  className="py-1 px-2.5 bg-cordel-bg hover:bg-white border border-encre-noire rounded font-black text-[10px] uppercase cursor-pointer disabled:opacity-40 shadow-[1px_1px_0px_0px_#181716] shrink-0"
                >
                  Appliquer
                </button>
              </div>
            </form>

            {/* 3. Option Par Adhérent précis */}
            <form onSubmit={handleSimulateUser} className="flex flex-col gap-1.5 p-2 bg-cordel-bg-light border border-encre-noire/30 rounded-[5px_7px_4px_6px]">
              <div className="font-extrabold text-[11px] flex items-center gap-1">
                <span>👤</span>
                <span>Par Adhérent précis</span>
              </div>
              <p className="text-[9.5px] text-cordel-master-dark/70">
                Adopte l'identité, le pupitre et l'ensemble des badges réels du membre.
              </p>
              <div className="flex gap-1.5 mt-0.5">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loadingMembers}
                  className="flex-1 text-[10px] font-bold p-1 bg-white border border-encre-noire rounded cursor-pointer truncate"
                  required
                >
                  <option value="">
                    {loadingMembers ? "Chargement des membres..." : "-- Sélectionner un membre --"}
                  </option>
                  {availableMembers.map((m) => {
                    const fullName = `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Membre sans nom';
                    const detail = m.surnom ? `« ${m.surnom} »` : (m.instrumentPrincipal || m.role || '');
                    return (
                      <option key={m.id} value={m.id}>
                        {fullName} {detail ? `(${detail})` : ''}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="submit"
                  disabled={!selectedUserId || loadingMembers}
                  className="py-1 px-2.5 bg-cordel-bg hover:bg-white border border-encre-noire rounded font-black text-[10px] uppercase cursor-pointer disabled:opacity-40 shadow-[1px_1px_0px_0px_#181716] shrink-0"
                >
                  Adopter
                </button>
              </div>
            </form>

            {/* 4. Bouton Quitter (si simulation active) */}
            {isSimulating && (
              <div className="pt-2 border-t border-dashed border-cordel-master-dark/20">
                <button
                  type="button"
                  onClick={() => {
                    stopSimulation();
                    setIsOpen(false);
                  }}
                  className="w-full py-1.5 px-3 bg-cordel-wood text-cordel-bg-light hover:brightness-110 border-2 border-encre-noire rounded-[5px_7px_4px_6px] font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px]"
                >
                  ✕ Quitter la simulation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
