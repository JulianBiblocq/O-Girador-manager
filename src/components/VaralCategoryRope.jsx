/**
 * Re-export proxy et utilitaire de libellé pour le Varal Cordel.
 * Assure la compatibilité des imports directs depuis src/components/VaralCategoryRope.
 */
import VaralCategoryRopeOriginal, { getCategoryLabel as getCategoryLabelOriginal } from './documents/varal/VaralCategoryRope';
import { getCategoryLabel as getCategoryLabelUtil } from '../utils/documentCategories';

export const getCategoryLabel = (categoryKey, eventTitle) => {
  if (typeof getCategoryLabelOriginal === 'function') {
    return getCategoryLabelOriginal(categoryKey, eventTitle);
  }
  if (typeof getCategoryLabelUtil === 'function') {
    return getCategoryLabelUtil(categoryKey, eventTitle);
  }
  if (!categoryKey) return 'DOCUMENTS';
  const catStr = typeof categoryKey === 'object' ? (categoryKey.id || categoryKey.nom || '') : String(categoryKey);
  if (catStr.startsWith('projet_')) {
    return `🎪 PROJET : ${(eventTitle || catStr.replace('projet_', '')).toUpperCase()}`;
  }
  return catStr.replace(/_/g, ' ').toUpperCase();
};

export default VaralCategoryRopeOriginal;
