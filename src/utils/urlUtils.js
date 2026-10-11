import { isDemoMode } from '../demo/demoManager.js';

/**
 * Utilitaires pour la génération et la gestion des URLs de l'écosystème O Girador.
 */

/**
 * Génère l'URL de la Vitrine publique (Mostrador) dynamiquement selon l'association courante.
 * 
 * Règles de résolution :
 * 1. En mode démonstration : renvoie la route vitrine locale `/demo?app=mostrador`.
 * 2. Si un nom de domaine personnalisé existe (customDomain ou premier élément de customDomains) :
 *    renvoie `https://${customDomain}`.
 * 3. Sinon (association sans domaine dédié) :
 *    renvoie l'URL mutualisée Mostrador avec le tenant explicite :
 *    `https://mostrador.o-girador.com/?tenant=${currentGroupId}`.
 * 
 * Signature polymorphe supportant :
 * - `getVitrineUrl(currentGroupId, associationSettings)`
 * - `getVitrineUrl(urls, associationSettings, currentGroupId)`
 * 
 * @param {string|Object} targetGroupIdOrUrls - Identifiant du groupe (ex: 'sambabulles') ou objet urls hérité
 * @param {Object} [associationSettings={}] - Paramètres Firestore de l'association (branding, customDomains, etc.)
 * @param {string} [explicitGroupId=null] - Identifiant explicite du groupe si le 1er paramètre est un objet urls
 * @returns {string} L'URL résolue vers la vitrine publique
 */
export function getVitrineUrl(targetGroupIdOrUrls, associationSettings = {}, explicitGroupId = null) {
  // Cas Démo : Redirection vers la vitrine démo locale
  if (isDemoMode()) {
    return '/demo?app=mostrador';
  }

  // Détermination souple et rétrocompatible du groupId et des réglages
  let currentGroupId = null;
  let settings = associationSettings || {};

  if (typeof targetGroupIdOrUrls === 'string' && targetGroupIdOrUrls.trim() !== '') {
    currentGroupId = targetGroupIdOrUrls.trim();
  } else if (targetGroupIdOrUrls && typeof targetGroupIdOrUrls === 'object') {
    // Si le premier paramètre est un objet contenant directement les paramètres ou le groupId
    if (targetGroupIdOrUrls.customDomain || targetGroupIdOrUrls.customDomains || targetGroupIdOrUrls.publicTheme) {
      settings = targetGroupIdOrUrls;
    }
    if (targetGroupIdOrUrls.groupId || targetGroupIdOrUrls.id || targetGroupIdOrUrls.associationId) {
      currentGroupId = targetGroupIdOrUrls.groupId || targetGroupIdOrUrls.id || targetGroupIdOrUrls.associationId;
    }
  }

  // Prise en compte du 3e argument explicite si fourni
  if (explicitGroupId && typeof explicitGroupId === 'string' && explicitGroupId.trim() !== '') {
    currentGroupId = explicitGroupId.trim();
  }

  // Repli sur les champs internes de l'objet settings si non trouvé
  if (!currentGroupId && settings) {
    currentGroupId = settings.groupId || settings.id || settings.associationId || null;
  }

  const cleanGroupId = currentGroupId ? String(currentGroupId).trim().toLowerCase() : '';

  // Cas 1 : Domaine personnalisé configuré (ex: mon-asso.fr ou www.mon-asso.fr)
  let customDomain = null;
  if (typeof settings?.customDomain === 'string' && settings.customDomain.trim() !== '') {
    customDomain = settings.customDomain.trim();
  } else if (Array.isArray(settings?.customDomains) && settings.customDomains.length > 0) {
    const firstDomain = settings.customDomains[0];
    if (typeof firstDomain === 'string' && firstDomain.trim() !== '') {
      customDomain = firstDomain.trim();
    }
  }

  // Priorité absolue pour Samambaia vers son domaine officiel configuré
  if (!customDomain && (cleanGroupId === 'samambaia' || String(settings?.name || settings?.nom || '').toLowerCase().includes('samambaia'))) {
    customDomain = 'https://samambaia-maracatu.fr';
  }

  if (customDomain) {
    const cleanDomain = customDomain.replace(/\/+$/, '');
    return cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')
      ? cleanDomain
      : `https://${cleanDomain}`;
  }

  // Cas 2 : URL mutualisée Mostrador avec identification explicite du tenant
  if (cleanGroupId) {
    return `https://mostrador.o-girador.com/?tenant=${encodeURIComponent(cleanGroupId)}`;
  }

  return 'https://mostrador.o-girador.com';
}
