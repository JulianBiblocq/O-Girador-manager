import { UNIVERSE_DEFAULT_INSTRUMENTS, normalizeUniverseId } from '../../constants/universeDefaults.js';

/**
 * Constantes et utilitaires partagés pour la gestion de l'inventaire matériel et instrumental.
 */

export const INSTRUMENT_TYPES = [
  'Alfaia', 
  'Caixa', 
  'Agbê', 
  'Gonguê', 
  'Mineiro', 
  'Apito', 
  'Timbal', 
  'Autre'
];

export const ETAT_OPTIONS = [
  'Neuf', 
  'Bon', 
  'À réparer'
];

export const INSTRUMENT_ICONS = {
  Alfaia: 'icones/alfaia.svg',
  Caixa: 'icones/caixa.svg',
  Agbê: 'icones/agbe.svg',
  Gonguê: 'icones/gongue.svg',
  Mineiro: 'icones/mineiro.svg',
  Apito: 'icones/apito.svg',
  Timbal: 'icones/timbal.svg',
  Autre: 'favicon.svg'
};

/**
 * Résout dynamiquement l'icône appropriée pour un type d'instrument multi-univers
 * @param {string} type 
 * @returns {string} Chemin de l'icône SVG
 */
export const getInstrumentIcon = (type) => {
  if (!type) return 'favicon.svg';
  if (INSTRUMENT_ICONS[type]) return INSTRUMENT_ICONS[type];
  const lower = String(type).trim().toLowerCase();
  if (lower.includes('surdo') || lower.includes('alfaia') || lower.includes('zabumba') || lower.includes('fût') || lower.includes('fut')) return 'icones/alfaia.svg';
  if (lower.includes('caixa') || lower.includes('tarol') || lower.includes('repique') || lower.includes('repinique') || lower.includes('tamborim') || lower.includes('cuica') || lower.includes('cuíca')) return 'icones/caixa.svg';
  if (lower.includes('agogo') || lower.includes('agogô') || lower.includes('gongue') || lower.includes('gonguê') || lower.includes('cloche')) return 'icones/gongue.svg';
  if (lower.includes('agbe') || lower.includes('agbê') || lower.includes('xequere') || lower.includes('shekere')) return 'icones/agbe.svg';
  if (lower.includes('chocalho') || lower.includes('mineiro') || lower.includes('ganza') || lower.includes('ganzá')) return 'icones/mineiro.svg';
  if (lower.includes('timbal') || lower.includes('timba') || lower.includes('atabaque')) return 'icones/timbal.svg';
  if (lower.includes('apito') || lower.includes('sifflet')) return 'icones/apito.svg';
  return 'favicon.svg';
};

/**
 * Résout dynamiquement la liste des types d'instruments disponibles pour l'association.
 * - Priorité 1 : les instruments / pupitres configurés dans l'association (instrumentsDisponibles ou nomenclature active).
 * - Priorité 2 : presets de l'univers actif (universeNomenclaturePresets / universeDefaults).
 * - Priorité 3 : secours historique INSTRUMENT_TYPES.
 * Conserve toujours l'option 'Autre' à la fin et dédoublonne sans distinction de casse.
 *
 * @param {Object} [association] Données de configuration de l'association
 * @param {string} [universeId] Identifiant de l'univers actif
 * @returns {string[]} Liste ordonnée des types d'instruments
 */
export function getAvailableInstrumentTypes(association = {}, universeId) {
  const effectiveUniverse = normalizeUniverseId(universeId || association?.universeId || association?.universe || 'maracatu');
  
  let candidates = [];

  // Priorité 1 : instrumentsDisponibles de l'association
  if (Array.isArray(association?.instrumentsDisponibles) && association.instrumentsDisponibles.length > 0) {
    candidates = association.instrumentsDisponibles.filter(inst => {
      const lower = String(inst).trim().toLowerCase();
      return lower && lower !== 'danse' && lower !== 'chant' && lower !== 'passistas';
    });
  }

  // Si vide, tenter la nomenclature active de l'association
  if (candidates.length === 0 && association?.nomenclature) {
    const nomMap = association.nomenclature[effectiveUniverse] || association.nomenclature;
    if (nomMap && typeof nomMap === 'object') {
      const vals = Object.values(nomMap).filter(v => typeof v === 'string' && v.trim().length > 0);
      if (vals.length > 0) {
        candidates = vals.filter(inst => {
          const lower = String(inst).trim().toLowerCase();
          return lower && lower !== 'danse' && lower !== 'chant' && lower !== 'passistas';
        });
      }
    }
  }

  // Priorité 2 : Fallback sur les presets de l'univers actif
  if (candidates.length === 0) {
    const defaultInsts = UNIVERSE_DEFAULT_INSTRUMENTS[effectiveUniverse] || UNIVERSE_DEFAULT_INSTRUMENTS.maracatu;
    if (Array.isArray(defaultInsts) && defaultInsts.length > 0) {
      candidates = defaultInsts.filter(inst => {
        const lower = String(inst).trim().toLowerCase();
        return lower && lower !== 'danse' && lower !== 'chant' && lower !== 'passistas';
      });
    }
  }

  // Priorité 3 : Secours historique INSTRUMENT_TYPES
  if (candidates.length === 0) {
    candidates = [...INSTRUMENT_TYPES];
  }

  // Dédoublonnage et maintien de 'Autre' en fin de liste
  const result = [];
  const seen = new Set();

  for (const item of candidates) {
    if (!item) continue;
    const trimmed = String(item).trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'autre' || seen.has(lower)) continue;
    seen.add(lower);
    result.push(trimmed);
  }

  // Toujours ajouter 'Autre' à la fin
  result.push('Autre');

  return result;
}

/**
 * Retourne le libellé traduit pour le type d'instrument.
 * @param {string} type 
 * @param {Function} t 
 * @returns {string}
 */
export const getInstrumentTypeLabel = (type, t) => {
  if (type === 'Autre') {
    return (t && t('inventory.other')) || 'Autre';
  }
  return type || '';
};

/**
 * Retourne le libellé traduit pour l'état d'un instrument.
 * @param {string} etat 
 * @param {Function} t 
 * @returns {string}
 */
export const getEtatLabel = (etat, t) => {
  switch (etat) {
    case 'Neuf': 
      return (t && t('inventory.etatNeuf')) || 'Neuf';
    case 'Bon': 
      return (t && t('inventory.etatBon')) || 'Bon';
    case 'À réparer': 
    case 'Para consertar':
      return (t && t('inventory.etatRepair')) || 'À réparer';
    default: 
      return etat || '';
  }
};

/**
 * Calcule le texte d'avancement d'un kit d'accessoires (ex: "Complet", "Vide", "2/4" ou "-").
 * Comparaison insensible à la casse et aux espaces.
 * @param {Object} inst 
 * @param {Array} logisticsKits 
 * @returns {string}
 */
export const getKitCompletionText = (inst, logisticsKits = []) => {
  if (!inst) return "-";
  const instTypeNorm = (inst.type || '').trim().toLowerCase();
  const kit = (logisticsKits || []).find(k => (k.pupitre || '').trim().toLowerCase() === instTypeNorm);
  if (!kit || !Array.isArray(kit.accessories) || kit.accessories.length === 0) return "-";
  
  const checked = Array.isArray(inst.kitChecklist) ? inst.kitChecklist : [];
  // Gestion compatible selon la structure des accessories (string ID ou objet { supplyId, name })
  const validChecked = checked.filter(acc => {
    return kit.accessories.some(kAcc => (typeof kAcc === 'string' ? kAcc === acc : kAcc.supplyId === acc));
  }).length;

  if (validChecked === kit.accessories.length) return "Complet";
  if (validChecked === 0) return "Vide";
  return `${validChecked}/${kit.accessories.length}`;
};

/**
 * Calcule le ratio numérique (0 à 1) de complétion du kit d'accessoires.
 * Comparaison insensible à la casse et aux espaces.
 * @param {Object} inst 
 * @param {Array} logisticsKits 
 * @returns {number}
 */
export const getKitCompletionRatio = (inst, logisticsKits = []) => {
  if (!inst) return -1;
  const instTypeNorm = (inst.type || '').trim().toLowerCase();
  const kit = (logisticsKits || []).find(k => (k.pupitre || '').trim().toLowerCase() === instTypeNorm);
  if (!kit || !Array.isArray(kit.accessories) || kit.accessories.length === 0) return -1;
  
  const checked = Array.isArray(inst.kitChecklist) ? inst.kitChecklist : [];
  const validChecked = checked.filter(acc => {
    return kit.accessories.some(kAcc => (typeof kAcc === 'string' ? kAcc === acc : kAcc.supplyId === acc));
  }).length;

  return validChecked / kit.accessories.length;
};

/**
 * Régimes de mise à disposition d'un instrument.
 */
export const REGIME_ATTRIBUTION_OPTIONS = [
  { id: 'pret_gratuit', label: 'Prêt gracieux association', desc: 'Ne génère aucune ligne de paiement' },
  { id: 'cotisation', label: 'Mis à disposition avec cotisation instrument', desc: 'Facturé avec la cotisation instrument' },
  { id: 'personnel', label: 'Instrument personnel du membre', desc: 'Propriété directe du membre' }
];

/**
 * Statuts possibles pour le dépôt de garantie / caution.
 */
export const CAUTION_STATUS_OPTIONS = [
  { id: 'non_requise', label: 'Non requise' },
  { id: 'en_attente', label: 'En attente' },
  { id: 'recue', label: 'Reçue' },
  { id: 'restituee', label: 'Restituée' }
];

/**
 * Types de moyen de garantie de la caution.
 */
export const CAUTION_TYPES = [
  { id: 'cheque', label: 'Chèque' },
  { id: 'especes', label: 'Espèces' },
  { id: 'virement', label: 'Virement' }
];

/**
 * Retourne le libellé du régime de mise à disposition.
 * @param {string} regime
 * @param {Function} [t]
 * @returns {string}
 */
export const getRegimeLabel = (regime, t) => {
  switch (regime) {
    case 'pret_gratuit':
      return (t && t('inventory.regimePretGratuit')) || 'Prêt gracieux association';
    case 'cotisation':
      return (t && t('inventory.regimeCotisation')) || 'Mis à disposition avec cotisation';
    case 'personnel':
      return (t && t('inventory.regimePersonnel')) || 'Instrument personnel';
    default:
      return (t && t('inventory.regimePretGratuit')) || 'Prêt gracieux association';
  }
};

/**
 * Normalise l'attribution et la caution d'un instrument avec rétrocompatibilité totale.
 * @param {Object} inst - Instrument issu de Firestore ou du formulaire
 * @returns {{ regimeMiseADisposition: string, cautionRequise: boolean, caution: Object }}
 */
export const normalizeInstrumentAttribution = (inst) => {
  if (!inst) {
    return {
      regimeMiseADisposition: 'pret_gratuit',
      cautionRequise: false,
      caution: {
        montant: 150,
        statut: 'non_requise',
        type: 'cheque',
        referencePiece: '',
        dateReception: null,
        encaisse: false
      }
    };
  }

  // Déduction du régime par défaut pour les instruments existants
  const isPersonal = inst.proprietaire && inst.proprietaire !== 'Association';
  const regime = inst.regimeMiseADisposition || (isPersonal ? 'personnel' : 'pret_gratuit');

  // Détection rétrocompatible de l'exigence de caution
  const rawCaution = inst.caution || {};
  let cautionRequise = false;
  if (inst.cautionRequise !== undefined) {
    cautionRequise = Boolean(inst.cautionRequise);
  } else if (rawCaution.statut && rawCaution.statut !== 'non_requise') {
    cautionRequise = true;
  }

  const cautionStatut = cautionRequise
    ? (rawCaution.statut && rawCaution.statut !== 'non_requise' ? rawCaution.statut : 'en_attente')
    : 'non_requise';

  const refPiece = rawCaution.referencePiece || rawCaution.reference || '';
  const typeGarantie = rawCaution.type || rawCaution.typeGarantie || 'cheque';

  return {
    regimeMiseADisposition: regime,
    cautionRequise,
    caution: {
      montant: rawCaution.montant !== undefined && rawCaution.montant !== null ? Number(rawCaution.montant) : 150,
      statut: cautionStatut,
      type: typeGarantie,
      referencePiece: refPiece,
      reference: refPiece, // Rétrocompatibilité
      typeGarantie: typeGarantie, // Rétrocompatibilité
      dateReception: rawCaution.dateReception || null,
      dateRestitution: rawCaution.dateRestitution || null,
      encaisse: Boolean(rawCaution.encaisse)
    }
  };
};

