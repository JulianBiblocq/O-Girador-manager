/**
 * Utilitaire de gestion des URLs et du SSO pour le Séquenceur O Girador.
 * Construit de manière robuste les liens profonds vers les fichiers distants,
 * les motifs (patterns), les sections ou les préréglages (presets),
 * et permet leur ouverture sécurisée via launchCrossApp.
 */

import { launchCrossApp } from './crossAppAuth';

/**
 * Construit l'URL complète de lancement du Séquenceur avec les paramètres appropriés.
 *
 * @param {string} [baseUrl] - URL de base du Séquenceur (ex: depuis les paramètres de l'association)
 * @param {Object|string} item - Morceau du répertoire ou identifiant de ressource
 * @returns {string} URL prête à être ouverte
 */
export function buildSequencerUrl(baseUrl = 'https://sequenceur.app', item) {
  const base = (baseUrl || 'https://sequenceur.app').trim();
  if (!item) return base;

  const separator = base.includes('?') ? '&' : '?';

  // 1. Cas où l'argument est une chaîne brute
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return base;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return `${base}${separator}file=${encodeURIComponent(trimmed)}`;
    }
    return `${base}${separator}patternId=${encodeURIComponent(trimmed)}`;
  }

  // 2. Cas où l'argument est un objet (morceau de répertoire ou ressource séquenceur)
  const collectionType = item._collection || item.collection || item.preset?._collection;

  // Détection d'un fichier hébergé (Storage ou URL distante)
  const candidateFileUrl = item.fileUrl || item.sequenceurFileUrl || (typeof item.jsonUrl === 'string' && (item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://')) ? item.jsonUrl : null);
  if (candidateFileUrl && (candidateFileUrl.startsWith('http://') || candidateFileUrl.startsWith('https://'))) {
    return `${base}${separator}file=${encodeURIComponent(candidateFileUrl)}`;
  }

  // Détection explicite de section
  const sectionId = item.sectionId || (collectionType === 'sections' || item.sequenceurType === 'sections' || item.preset?._collection === 'sections' ? (item.preset?.id || item.sequenceurId || item.id) : null);
  if (sectionId) {
    return `${base}${separator}sectionId=${encodeURIComponent(sectionId)}`;
  }

  // Détection explicite de preset
  const presetId = item.loadPreset || item.presetId || (collectionType === 'presets' || item.sequenceurType === 'presets' || item.preset?._collection === 'presets' ? (item.preset?.id || item.sequenceurId || item.id) : null);
  if (presetId) {
    return `${base}${separator}loadPreset=${encodeURIComponent(presetId)}`;
  }

  // Détection explicite de pattern / motif
  const patternId = item.patternId || item.sequenceurId || (collectionType === 'patterns' ? item.id : null) || item.id;
  if (patternId && !patternId.startsWith('http://') && !patternId.startsWith('https://')) {
    return `${base}${separator}patternId=${encodeURIComponent(patternId)}`;
  }

  // Repli sur le champ jsonUrl brut s'il existe
  if (item.jsonUrl) {
    const isRemote = item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://');
    const param = isRemote ? 'file' : 'patternId';
    return `${base}${separator}${param}=${encodeURIComponent(item.jsonUrl)}`;
  }

  return base;
}

/**
 * Lance le Séquenceur avec SSO transparent et gestion des pop-ups navigateurs.
 *
 * @param {string} [baseUrl] - URL de base du Séquenceur
 * @param {Object|string} item - Morceau ou identifiant de ressource à charger
 * @param {Object} [options] - Options supplémentaires transmises à launchCrossApp
 * @returns {Promise<void>}
 */
export async function openSequencerWithCrossApp(baseUrl, item, options = {}) {
  const targetUrl = buildSequencerUrl(baseUrl, item);
  return launchCrossApp(targetUrl, {
    appLabel: options.appLabel || 'le Séquenceur',
    ...options
  });
}
