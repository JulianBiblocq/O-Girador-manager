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
