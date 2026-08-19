/**
 * Utilitaires pour la génération et la gestion des URLs
 */

/**
 * Génère l'URL de la Vitrine (Site Public) dynamiquement.
 * Prend en compte le nom de domaine personnalisé de l'association si configuré.
 * 
 * @param {Object} urls - L'objet urls issu du TenantContext (contient mostrador et organizador)
 * @param {Object} associationSettings - Les paramètres de l'association (firestore)
 * @returns {string} L'URL finale vers la vitrine
 */
export function getVitrineUrl(urls, associationSettings = {}) {
  // Cas 1 : Domaine personnalisé configuré (ex: samambaia-maracatu.fr)
  if (associationSettings?.customDomains && Array.isArray(associationSettings.customDomains) && associationSettings.customDomains.length > 0) {
    const customDomain = associationSettings.customDomains[0];
    // On force en https si ce n'est pas déjà précisé
    return customDomain.startsWith('http') ? customDomain : `https://${customDomain}`;
  }

  // Cas 2 : Fallback SaaS (URL par défaut générée par le resolver, ex: https://mostrador.o-girador.com)
  return urls?.mostrador || '';
}
