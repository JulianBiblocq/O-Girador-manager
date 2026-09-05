import React from 'react';

// Helper pour normaliser les chaînes (retirer les accents, mettre en minuscules)
const normalizeString = (str) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

// Fonction de détection sémantique des tranches
const getSliceKeyForSlot = (slotName, modelType) => {
  const norm = normalizeString(slotName);
  const mType = normalizeString(modelType);

  if (mType.includes('alfaia') || mType.includes('caixa')) {
    if (norm.includes('cerclage') && (norm.includes('haut') || norm.includes('frappe') || norm.includes('1'))) return 'top_hoop';
    if (norm.includes('cerclage') && (norm.includes('bas') || norm.includes('resonance') || norm.includes('2'))) return 'bottom_hoop';
    if (norm.includes('peau') && (norm.includes('haut') || norm.includes('frappe') || norm.includes('1'))) return 'top_skin';
    if (norm.includes('peau') && (norm.includes('bas') || norm.includes('resonance') || norm.includes('2'))) return 'bottom_skin';
    if (norm.includes('anneau') && (norm.includes('haut') || norm.includes('frappe') || norm.includes('1'))) return 'top_ring';
    if (norm.includes('anneau') && (norm.includes('bas') || norm.includes('resonance') || norm.includes('2'))) return 'bottom_ring';
    if (norm.includes('fut') || norm.includes('corps')) return 'shell';
    if (norm.includes('corde') || norm.includes('cordage')) return 'ropes';
  }
  
  if (mType.includes('agbe') || mType.includes('abe')) {
    if (norm.includes('col') || norm.includes('embouchure')) return 'neck';
    if (norm.includes('couronne') && (norm.includes('haut') || norm.includes('1'))) return 'top_crown';
    if (norm.includes('couronne') && (norm.includes('bas') || norm.includes('fermeture') || norm.includes('2'))) return 'bottom_crown';
    if (norm.includes('filet') || norm.includes('perle') || norm.includes('tissage')) return 'net';
    if (norm.includes('calebasse') || norm.includes('corps') || norm.includes('gourde')) return 'body';
  }

  if (mType.includes('mineiro')) {
    if (norm.includes('couvercle') && (norm.includes('gauche') || norm.includes('1'))) return 'left_lid';
    if (norm.includes('couvercle') && (norm.includes('droit') || norm.includes('2'))) return 'right_lid';
    if (norm.includes('tube') || norm.includes('corps')) return 'tube';
    if (norm.includes('graine') || norm.includes('bille')) return 'seeds';
  }

  if (mType.includes('gongue')) {
    if (norm.includes('cone') || norm.includes('cloche')) return 'cone';
    if (norm.includes('anneau') || norm.includes('ceinture')) return 'belt_ring';
    if (norm.includes('tige') || norm.includes('poignee')) return 'stem';
    if (norm.includes('fer plat') || norm.includes('genou')) return 'knee_plate';
  }

  return 'generic';
};

export default function InstrumentVisualizer({ modelType, slots, assignedMap, inventoryParts, onSelectPiece }) {
  // Prépare un dictionnaire des états visuels des tranches
  const sliceStates = {};
  
  slots.forEach(slot => {
    const sliceKey = getSliceKeyForSlot(slot.nom || slot.slotLabel, modelType);
    let status = 'unassigned';
    let progressLabel = 'Non entamé';
    
    const invId = assignedMap[slot.slotId];
    if (invId) {
      const invPart = inventoryParts.find(p => p.id === invId);
      if (invPart) {
        const currentStep = invPart.currentStepIndex || 0;
        const totalSteps = slot.chapitres?.length || 1;
        const statutEtape = invPart.statutEtape || 'en_cours';

        if (statutEtape === 'a_valider' || statutEtape === 'en_attente_controle') {
          status = 'to_control';
          progressLabel = `À contrôler (Étape ${currentStep + 1}/${totalSteps})`;
        } else if (statutEtape === 'terminee' || (statutEtape === 'valide' && currentStep >= totalSteps - 1) || totalSteps === 0) {
          status = 'finished';
          progressLabel = 'Terminé';
        } else {
          status = 'in_progress';
          progressLabel = `En cours (Étape ${currentStep + 1}/${totalSteps})`;
        }
      }
    }

    sliceStates[sliceKey] = {
      slot,
      status,
      label: `${slot.nom || slot.slotLabel} - ${progressLabel}`
    };
  });

  const getStyleForStatus = (status) => {
    switch (status) {
      case 'unassigned':
        return 'stroke-cordel-master-dark/40 stroke-dashed fill-transparent stroke-[2px] opacity-70';
      case 'in_progress':
        return 'fill-cordel-ocre text-white stroke-cordel-master-dark stroke-[2px]';
      case 'to_control':
        return 'fill-cordel-ocre animate-pulse stroke-cordel-rouge stroke-[3px] shadow-[0_0_8px_#c05621]';
      case 'finished':
        return 'fill-cordel-vert stroke-cordel-master-dark stroke-[2px]';
      default:
        return 'stroke-cordel-master-dark/20 stroke-dashed fill-transparent stroke-[1px] opacity-50'; // Default styling for slices not found in slots
    }
  };

  const getInteractiveClass = (status) => {
    // Les tranches non définies ne sont pas interactives
    if (status === undefined) return '';
    return 'hover:scale-[1.02] transform-origin-center transition-transform cursor-pointer hover:brightness-110 drop-shadow-sm';
  };

  const handleClick = (sliceKey) => {
    if (sliceStates[sliceKey] && onSelectPiece) {
      onSelectPiece(sliceStates[sliceKey].slot);
    }
  };

  const renderSVG = () => {
    const mType = normalizeString(modelType);

    if (mType.includes('alfaia') || mType.includes('caixa')) {
      return (
        <svg viewBox="0 0 200 240" className="w-full h-auto max-h-[400px] preserveAspectRatio-xMidYMid">
          <defs>
            <pattern id="wood-texture" patternUnits="userSpaceOnUse" width="10" height="40">
              <path d="M 0 0 C 3 10, 7 20, 0 40" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          
          <g transform="translate(10, 10)">
            {/* Cordage */}
            <path 
              d="M 20 20 L 30 180 M 50 20 L 40 180 M 80 20 L 60 180 M 110 20 L 100 180 M 140 20 L 130 180 M 170 20 L 150 180" 
              className={`vector-rope ${getStyleForStatus(sliceStates.ropes?.status)} ${getInteractiveClass(sliceStates.ropes?.status)}`}
              onClick={() => handleClick('ropes')}
            >
              <title>{sliceStates.ropes?.label || "Cordage (Introuvable)"}</title>
            </path>
            
            {/* Fût */}
            <rect x="25" y="40" width="130" height="120" rx="10" ry="20"
              className={`vector-shell ${getStyleForStatus(sliceStates.shell?.status)} ${getInteractiveClass(sliceStates.shell?.status)}`}
              onClick={() => handleClick('shell')}
            >
              <title>{sliceStates.shell?.label || "Fût central (Introuvable)"}</title>
            </rect>
            
            {/* Anneau bas */}
            <ellipse cx="90" cy="165" rx="75" ry="15"
              className={`vector-ring ${getStyleForStatus(sliceStates.bottom_ring?.status)} ${getInteractiveClass(sliceStates.bottom_ring?.status)}`}
              onClick={() => handleClick('bottom_ring')}
            >
              <title>{sliceStates.bottom_ring?.label || "Anneau inférieur (Introuvable)"}</title>
            </ellipse>

            {/* Peau résonance */}
            <path d="M 15 170 C 15 190, 165 190, 165 170" 
              className={`vector-skin ${getStyleForStatus(sliceStates.bottom_skin?.status)} ${getInteractiveClass(sliceStates.bottom_skin?.status)}`}
              onClick={() => handleClick('bottom_skin')}
            >
              <title>{sliceStates.bottom_skin?.label || "Peau de résonance (Introuvable)"}</title>
            </path>

            {/* Cerclage bas */}
            <rect x="10" y="165" width="160" height="15" rx="5" ry="5"
              className={`vector-hoop ${getStyleForStatus(sliceStates.bottom_hoop?.status)} ${getInteractiveClass(sliceStates.bottom_hoop?.status)}`}
              onClick={() => handleClick('bottom_hoop')}
            >
              <title>{sliceStates.bottom_hoop?.label || "Cerclage inférieur (Introuvable)"}</title>
            </rect>
            
            {/* Anneau haut */}
            <ellipse cx="90" cy="35" rx="75" ry="15"
              className={`vector-ring ${getStyleForStatus(sliceStates.top_ring?.status)} ${getInteractiveClass(sliceStates.top_ring?.status)}`}
              onClick={() => handleClick('top_ring')}
            >
              <title>{sliceStates.top_ring?.label || "Anneau supérieur (Introuvable)"}</title>
            </ellipse>
            
            {/* Peau frappe */}
            <path d="M 15 30 C 15 10, 165 10, 165 30" 
              className={`vector-skin ${getStyleForStatus(sliceStates.top_skin?.status)} ${getInteractiveClass(sliceStates.top_skin?.status)}`}
              onClick={() => handleClick('top_skin')}
            >
              <title>{sliceStates.top_skin?.label || "Peau de frappe (Introuvable)"}</title>
            </path>

            {/* Cerclage haut */}
            <rect x="10" y="20" width="160" height="15" rx="5" ry="5"
              className={`vector-hoop ${getStyleForStatus(sliceStates.top_hoop?.status)} ${getInteractiveClass(sliceStates.top_hoop?.status)}`}
              onClick={() => handleClick('top_hoop')}
            >
              <title>{sliceStates.top_hoop?.label || "Cerclage supérieur (Introuvable)"}</title>
            </rect>

          </g>
        </svg>
      );
    }

    if (mType.includes('agbe') || mType.includes('abe')) {
      return (
        <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[400px] preserveAspectRatio-xMidYMid">
          <g transform="translate(10, 10)">
            {/* Col / Embouchure */}
            <rect x="80" y="20" width="40" height="40" rx="5" ry="5"
              className={`vector-neck ${getStyleForStatus(sliceStates.neck?.status)} ${getInteractiveClass(sliceStates.neck?.status)}`}
              onClick={() => handleClick('neck')}
            >
              <title>{sliceStates.neck?.label || "Col / Embouchure (Introuvable)"}</title>
            </rect>
            
            {/* Corps de la calebasse */}
            <ellipse cx="100" cy="150" rx="80" ry="90"
              className={`vector-body ${getStyleForStatus(sliceStates.body?.status)} ${getInteractiveClass(sliceStates.body?.status)}`}
              onClick={() => handleClick('body')}
            >
              <title>{sliceStates.body?.label || "Calebasse (Introuvable)"}</title>
            </ellipse>

            {/* Couronne haute */}
            <ellipse cx="100" cy="80" rx="50" ry="10"
              className={`vector-crown ${getStyleForStatus(sliceStates.top_crown?.status)} ${getInteractiveClass(sliceStates.top_crown?.status)}`}
              onClick={() => handleClick('top_crown')}
            >
              <title>{sliceStates.top_crown?.label || "Couronne haute (Introuvable)"}</title>
            </ellipse>
            
            {/* Filet tissé */}
            <path d="M 50 80 Q 20 150 30 220 L 170 220 Q 180 150 150 80 Z" 
              className={`vector-net ${getStyleForStatus(sliceStates.net?.status)} ${getInteractiveClass(sliceStates.net?.status)} opacity-80`}
              fillOpacity="0.8"
              onClick={() => handleClick('net')}
            >
              <title>{sliceStates.net?.label || "Filet / Tissage (Introuvable)"}</title>
            </path>
            
            {/* Couronne de fermeture */}
            <ellipse cx="100" cy="220" rx="70" ry="15"
              className={`vector-crown ${getStyleForStatus(sliceStates.bottom_crown?.status)} ${getInteractiveClass(sliceStates.bottom_crown?.status)}`}
              onClick={() => handleClick('bottom_crown')}
            >
              <title>{sliceStates.bottom_crown?.label || "Couronne de fermeture (Introuvable)"}</title>
            </ellipse>
          </g>
        </svg>
      );
    }

    if (mType.includes('mineiro')) {
      return (
        <svg viewBox="0 0 300 150" className="w-full h-auto max-h-[300px] preserveAspectRatio-xMidYMid">
          <g transform="translate(10, 30)">
            {/* Graines (indiquées en dessous, optionnel, on les met dans la boîte) */}
            <rect x="50" y="60" width="180" height="20" rx="10" ry="10"
              className={`vector-seeds ${getStyleForStatus(sliceStates.seeds?.status)} ${getInteractiveClass(sliceStates.seeds?.status)}`}
              onClick={() => handleClick('seeds')}
            >
              <title>{sliceStates.seeds?.label || "Graines (Introuvable)"}</title>
            </rect>

            {/* Tube principal */}
            <rect x="40" y="20" width="200" height="60" rx="5" ry="5"
              className={`vector-tube ${getStyleForStatus(sliceStates.tube?.status)} ${getInteractiveClass(sliceStates.tube?.status)}`}
              fillOpacity="0.7"
              onClick={() => handleClick('tube')}
            >
              <title>{sliceStates.tube?.label || "Tube (Introuvable)"}</title>
            </rect>
            
            {/* Couvercle gauche */}
            <rect x="20" y="15" width="20" height="70" rx="8" ry="8"
              className={`vector-lid ${getStyleForStatus(sliceStates.left_lid?.status)} ${getInteractiveClass(sliceStates.left_lid?.status)}`}
              onClick={() => handleClick('left_lid')}
            >
              <title>{sliceStates.left_lid?.label || "Couvercle gauche (Introuvable)"}</title>
            </rect>

            {/* Couvercle droit */}
            <rect x="240" y="15" width="20" height="70" rx="8" ry="8"
              className={`vector-lid ${getStyleForStatus(sliceStates.right_lid?.status)} ${getInteractiveClass(sliceStates.right_lid?.status)}`}
              onClick={() => handleClick('right_lid')}
            >
              <title>{sliceStates.right_lid?.label || "Couvercle droit (Introuvable)"}</title>
            </rect>
          </g>
        </svg>
      );
    }

    if (mType.includes('gongue')) {
      return (
        <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[400px] preserveAspectRatio-xMidYMid">
          <g transform="translate(50, 10)">
            {/* Cône / Cloche */}
            <path d="M 50 20 L 10 120 L 90 120 Z" 
              className={`vector-cone ${getStyleForStatus(sliceStates.cone?.status)} ${getInteractiveClass(sliceStates.cone?.status)}`}
              onClick={() => handleClick('cone')}
            >
              <title>{sliceStates.cone?.label || "Cône / Cloche (Introuvable)"}</title>
            </path>
            
            {/* Tige */}
            <rect x="45" y="120" width="10" height="120" rx="3" ry="3"
              className={`vector-stem ${getStyleForStatus(sliceStates.stem?.status)} ${getInteractiveClass(sliceStates.stem?.status)}`}
              onClick={() => handleClick('stem')}
            >
              <title>{sliceStates.stem?.label || "Tige / Manche (Introuvable)"}</title>
            </rect>
            
            {/* Anneau de ceinture */}
            <circle cx="20" cy="150" r="15" 
              className={`vector-ring ${getStyleForStatus(sliceStates.belt_ring?.status)} ${getInteractiveClass(sliceStates.belt_ring?.status)}`}
              fill="none" strokeWidth="4"
              onClick={() => handleClick('belt_ring')}
            >
              <title>{sliceStates.belt_ring?.label || "Anneau de ceinture (Introuvable)"}</title>
            </circle>

            {/* Fer plat / genou */}
            <path d="M 20 240 C 20 220, 80 220, 80 240 L 70 260 L 30 260 Z" 
              className={`vector-plate ${getStyleForStatus(sliceStates.knee_plate?.status)} ${getInteractiveClass(sliceStates.knee_plate?.status)}`}
              onClick={() => handleClick('knee_plate')}
            >
              <title>{sliceStates.knee_plate?.label || "Fer plat de genou (Introuvable)"}</title>
            </path>
          </g>
        </svg>
      );
    }

    // VUE GENERIQUE (empilement vertical de boîtes)
    return (
      <svg viewBox="0 0 200 300" className="w-full h-auto max-h-[400px] preserveAspectRatio-xMidYMid">
        <g transform="translate(10, 10)">
          {slots.map((slot, index) => {
            const key = getSliceKeyForSlot(slot.nom || slot.slotLabel, modelType);
            const state = sliceStates[key] || {};
            const h = 40;
            const y = index * (h + 10);
            return (
              <g key={index} transform={`translate(0, ${y})`}
                 className={`${getInteractiveClass(state.status)}`}
                 onClick={() => handleClick(key)}
              >
                <rect x="20" y="0" width="140" height={h} rx="5" ry="5"
                  className={getStyleForStatus(state.status)}
                />
                <text x="90" y="25" textAnchor="middle" className="text-[10px] font-bold fill-current" 
                      fill={state.status === 'in_progress' || state.status === 'to_control' || state.status === 'finished' ? '#fff' : '#000'}
                      opacity={state.status === 'unassigned' ? 0.5 : 1}>
                  {slot.nom || slot.slotLabel}
                </text>
                <title>{state.label || (slot.nom || slot.slotLabel)}</title>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  return (
    <div className="w-full flex justify-center items-center p-4 bg-[url('/img/kraft-texture.png')] bg-cover border border-cordel-master-dark/20 rounded shadow-inner">
      {renderSVG()}
    </div>
  );
}
