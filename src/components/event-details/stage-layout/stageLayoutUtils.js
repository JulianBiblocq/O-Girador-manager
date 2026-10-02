/**
 * Utilitaires pour le plan de scène scénographique (Organizad'Or)
 * Gestion du calcul des positions, des voisins de proximité, du nettoyage conditionnel
 * et du compactage des cartouches d'instruments pour mobile.
 */

import { getVoiceLabel } from '../../../constants/nomenclature.js';

/**
 * Formate le nom d'un membre pour un affichage compact (ex: "Julien B.")
 * @param {string} fullName Nom complet du membre
 * @returns {string} Nom court optimisé
 */
export function formatCompactMemberName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return fullName.trim();
  const initial = parts[1][0] ? parts[1][0].toUpperCase() : '';
  return initial ? `${parts[0]} ${initial}.` : parts[0];
}

/**
 * Détermine si un membre est un danseur / une danseuse.
 * @param {object} member Informations du membre
 * @returns {boolean}
 */
export function isStageDancer(member) {
  if (!member) return false;
  const inst = (member.instrument || '').toLowerCase();
  return inst.includes('danse') || inst.includes('danseur') || inst.includes('danseuse');
}

/**
 * Résout le rôle exact d'un membre placé sur la scène (instrument et nuance de jeu).
 * Exemple : "Alfaia Marcante", "Alfaia Meião", "Caixa", "Tarol", "Danse", "Chef d'orchestre (Mestre)".
 *
 * @param {object} params
 * @param {object} params.member Données du membre
 * @param {object} params.placement Données de placement ({ row, col, voice })
 * @param {object} params.groupNomenclature Nomenclature personnalisée du groupe
 * @returns {string} Libellé exact du rôle et de la nuance
 */
export function resolveExactRole({ member, placement, groupNomenclature, t = null }) {
  if (!placement) {
    return member?.instrument || 'Participant';
  }

  // Cas 1 : Chef d'orchestre (Mestre) placé sur la case dédiée
  if (placement.row === 0 && placement.col === 0) {
    const baseInst = member?.instrument || 'Mestre';
    if (t) {
      return t('mestre.conductorRoleMestre', { instrument: baseInst });
    }
    return `Chef d'orchestre (Mestre) — ${baseInst}`;
  }

  // Cas 2 : Avant-scène / Danse
  if (placement.row < 0 || isStageDancer(member)) {
    return 'Danse';
  }

  const instLower = (member?.instrument || '').toLowerCase();
  const voice = placement.voice?.toLowerCase();

  // Cas 3 : Alfaias (Marcante, Meião, Repique)
  if (instLower.includes('alfaia')) {
    const voiceLabel = voice ? getVoiceLabel(voice, groupNomenclature, false) : 'Marcante';
    return `Alfaia ${voiceLabel}`;
  }

  // Cas 4 : Caixas (Caixa vs Tarol)
  if (instLower.includes('caixa') || instLower.includes('tarol')) {
    if (voice === 'tarol' || instLower.includes('tarol')) {
      return 'Tarol';
    }
    return 'Caixa';
  }

  // Cas 5 : Autre instrument spécifique (Agbê, Gonguê, Mineiro, etc.)
  return member?.instrument || 'Musicien';
}

/**
 * Calcule les repères de proximité immédiats (voisins directs gauche et droite sur la même rangée).
 * RÈGLE STRICTE : AUCUNE mention de numéro de rang ou de numéro de ligne.
 *
 * @param {object} params
 * @param {string} params.currentUserId Identifiant du membre connecté
 * @param {object} params.activePlacements Dictionnaire des placements actifs { [uid]: { row, col, voice } }
 * @param {Array} params.presentMembers Liste des membres présents avec id, name, instrument
 * @param {object} params.groupNomenclature Nomenclature du groupe
 * @returns {object|null} { leftNeighbor: { name, role }|null, rightNeighbor: { name, role }|null, isMestre: boolean }
 */
export function getProximityNeighbors({ currentUserId, activePlacements, presentMembers, groupNomenclature }) {
  if (!currentUserId || !activePlacements[currentUserId]) {
    return null;
  }

  const myPlacement = activePlacements[currentUserId];
  const myRow = myPlacement.row;
  const myCol = myPlacement.col;

  // Cas spécifique du Mestre (row 0, col 0) : position centrale isolée devant la troupe
  if (myRow === 0 && myCol === 0) {
    return {
      isMestre: true,
      leftNeighbor: null,
      rightNeighbor: null,
      specialPositionNote: 'Devant la scène, au centre face à la troupe'
    };
  }

  // Recherche de tous les membres placés sur la même rangée exacte
  const sameRowPlacements = Object.entries(activePlacements)
    .filter(([uid, pos]) => uid !== currentUserId && pos.row === myRow)
    .map(([uid, pos]) => {
      const member = presentMembers.find(m => m.id === uid);
      const role = resolveExactRole({ member, placement: pos, groupNomenclature });
      return {
        id: uid,
        col: pos.col,
        name: member?.name || 'Musicien',
        shortName: formatCompactMemberName(member?.name || 'Musicien'),
        role
      };
    });

  // Voisin direct à gauche (colonne inférieure la plus proche sur la même rangée)
  const leftCandidates = sameRowPlacements
    .filter(p => p.col < myCol)
    .sort((a, b) => b.col - a.col); // Décroissant pour avoir le plus proche en premier
  const leftNeighbor = leftCandidates.length > 0 ? leftCandidates[0] : null;

  // Voisin direct à droite (colonne supérieure la plus proche sur la même rangée)
  const rightCandidates = sameRowPlacements
    .filter(p => p.col > myCol)
    .sort((a, b) => a.col - b.col); // Croissant pour avoir le plus proche en premier
  const rightNeighbor = rightCandidates.length > 0 ? rightCandidates[0] : null;

  return {
    isMestre: false,
    leftNeighbor,
    rightNeighbor
  };
}

/**
 * Détermine la liste des colonnes visibles pour la grille de percussion.
 * En mode membre (lecture seule), les colonnes entièrement vides de musiciens sont masquées.
 * En mode édition Mestre, toutes les colonnes de 1 à totalCols restent visibles.
 *
 * @param {object} params
 * @param {number} params.totalCols Nombre total de colonnes configurées
 * @param {object} params.activePlacements Placements actifs
 * @param {boolean} params.isEditingMode Mode édition activé ou non
 * @returns {number[]} Liste des indices de colonnes visibles (1-indexé)
 */
export function getVisibleStageColumns({ totalCols, activePlacements, isEditingMode }) {
  const allCols = Array.from({ length: totalCols }, (_, i) => i + 1);

  // En mode édition Mestre, aucune colonne n'est masquée afin de permettre les placements
  if (isEditingMode) {
    return allCols;
  }

  // En mode lecture seule Adhérent : repérer les colonnes contenant au moins un musicien de percussion (row >= 1)
  const occupiedCols = allCols.filter(col => {
    return Object.values(activePlacements).some(pos => pos.row >= 1 && pos.col === col);
  });

  // Si aucune colonne n'est occupée du tout, conserver la grille standard
  return occupiedCols.length > 0 ? occupiedCols : allCols;
}

/**
 * Vérifie si au moins un danseur ou participant est positionné sur l'avant-scène (row < 0).
 * @param {object} activePlacements
 * @returns {boolean}
 */
export function hasDancersOnStage(activePlacements) {
  if (!activePlacements) return false;
  return Object.values(activePlacements).some(pos => pos.row < 0);
}

/**
 * Calcule les statistiques d'instruments et génère des cartouches d'étiquettes ultra-compactes
 * avec abréviations courtes (ex: "4 Marc. | 1 Meio. | 1 Rep.") évitant les débordements d'écran.
 *
 * @param {object} params
 * @param {object} params.activePlacements Placements actifs
 * @param {Array} params.presentMembers Membres présents
 * @param {object} params.groupNomenclature Nomenclature personnalisée
 * @returns {object} { alfaiasBadge: string|null, caixasBadge: string|null, dancersBadge: string|null, totalPlaced: number }
 */
export function getCompactInstrumentStats({ activePlacements, presentMembers, groupNomenclature }) {
  let marcante = 0;
  let meiao = 0;
  let repique = 0;
  let caixaCount = 0;
  let tarolCount = 0;
  let danceCount = 0;

  Object.entries(activePlacements).forEach(([uid, pos]) => {
    const member = presentMembers.find(m => m.id === uid);
    if (!member) return;

    if (pos.row < 0 || isStageDancer(member)) {
      danceCount++;
      return;
    }

    const instLower = (member.instrument || '').toLowerCase();
    const voiceLower = (pos.voice || '').toLowerCase();

    if (instLower.includes('alfaia')) {
      if (voiceLower.includes('repique') || voiceLower.includes('agudo')) {
        repique++;
      } else if (voiceLower.includes('meiao') || voiceLower.includes('meião') || voiceLower.includes('medio') || voiceLower.includes('médio')) {
        meiao++;
      } else {
        marcante++;
      }
    } else if (instLower.includes('caixa') || instLower.includes('tarol')) {
      if (voiceLower === 'tarol' || instLower.includes('tarol')) {
        tarolCount++;
      } else {
        caixaCount++;
      }
    }
  });

  const totalAlfaias = marcante + meiao + repique;
  const totalCaixas = caixaCount + tarolCount;

  // Libellés abrégés selon la nomenclature
  const labelMarcShort = getVoiceLabel('marcante', groupNomenclature, true) || 'Marc';
  const labelMeioShort = getVoiceLabel('meião', groupNomenclature, true) || 'Meio';
  const labelRepShort = getVoiceLabel('repique', groupNomenclature, true) || 'Rep';

  // Format compact pour Alfaias : "4 Marc. | 1 Meio. | 1 Rep."
  let alfaiasText = null;
  if (totalAlfaias > 0) {
    const parts = [];
    if (marcante > 0 || (meiao === 0 && repique === 0)) parts.push(`${marcante} ${labelMarcShort}.`);
    if (meiao > 0) parts.push(`${meiao} ${labelMeioShort}.`);
    if (repique > 0) parts.push(`${repique} ${labelRepShort}.`);
    alfaiasText = parts.join(' | ');
  }

  // Format compact pour Caixas : "3 Caixa | 1 Tarol" ou "3 Cx. | 1 Tar."
  let caixasText = null;
  if (totalCaixas > 0) {
    const parts = [];
    if (caixaCount > 0) parts.push(`${caixaCount} Cx.`);
    if (tarolCount > 0) parts.push(`${tarolCount} Tar.`);
    caixasText = parts.join(' | ');
  }

  let danceText = null;
  if (danceCount > 0) {
    danceText = `${danceCount} Danse`;
  }

  return {
    alfaiasBadge: alfaiasText,
    caixasBadge: caixasText,
    danceBadge: danceText,
    totalAlfaias,
    totalCaixas,
    totalDance: danceCount,
    totalPlaced: Object.keys(activePlacements).length
  };
}

/**
 * Détermine si une rangée (positive pour percussion, négative pour danse) est configurée en quinconce.
 * Supporte indifféremment un tableau d'index (ex: [1, 3] ou ['1', '3', '-1']) ou un objet ({ 1: true }).
 *
 * @param {number|string} rowIndex Index de la ligne
 * @param {Array|object} staggeredRows Liste ou dictionnaire des lignes en quinconce
 * @returns {boolean} Vrai si la ligne est en quinconce
 */
export function isRowStaggered(rowIndex, staggeredRows) {
  if (!staggeredRows) return false;
  if (Array.isArray(staggeredRows)) {
    return staggeredRows.some((r) => String(r) === String(rowIndex));
  }
  if (typeof staggeredRows === 'object') {
    return Boolean(staggeredRows[rowIndex] || staggeredRows[String(rowIndex)]);
  }
  return false;
}

/**
 * Bascule l'état en quinconce d'une rangée et renvoie le tableau mis à jour.
 *
 * @param {number|string} rowIndex Index de la ligne à basculer
 * @param {Array} staggeredRows Tableau actuel des lignes en quinconce
 * @returns {Array} Nouveau tableau avec l'index ajouté ou retiré
 */
export function toggleStaggeredRow(rowIndex, staggeredRows = []) {
  const current = Array.isArray(staggeredRows) ? staggeredRows : [];
  const exists = current.some((r) => String(r) === String(rowIndex));
  if (exists) {
    return current.filter((r) => String(r) !== String(rowIndex));
  }
  return [...current, rowIndex];
}
