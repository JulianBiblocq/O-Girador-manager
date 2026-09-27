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
 * @param {Object} inst 
 * @param {Array} logisticsKits 
 * @returns {string}
 */
export const getKitCompletionText = (inst, logisticsKits = []) => {
  if (!inst) return "-";
  const kit = (logisticsKits || []).find(k => k.pupitre === inst.type);
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
 * @param {Object} inst 
 * @param {Array} logisticsKits 
 * @returns {number}
 */
export const getKitCompletionRatio = (inst, logisticsKits = []) => {
  if (!inst) return -1;
  const kit = (logisticsKits || []).find(k => k.pupitre === inst.type);
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

