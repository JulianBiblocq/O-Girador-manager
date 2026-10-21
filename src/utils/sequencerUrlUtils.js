/**
 * Utilitaire de gestion des URLs et du SSO pour le Séquenceur O Girador.
 * Construit de manière robuste les liens profonds vers les fichiers distants,
 * les motifs (patterns), les sections ou les préréglages (presets),
 * et permet leur ouverture sécurisée via launchCrossApp.
 */

import { launchCrossApp } from './crossAppAuth';

/**
 * Construit l'URL complète de lancement du Séquenceur avec les paramètres appropriés.
 * Fonction polymorphe tolérante aux inversions d'arguments (baseUrl, item) ou (item, baseUrl).
 *
 * @param {string|Object} [arg1] - URL de base du Séquenceur ou objet Morceau
 * @param {Object|string} [arg2] - Morceau du répertoire, identifiant de ressource ou URL de base
 * @returns {string} URL prête à être ouverte
 */
export function buildSequencerUrl(arg1 = 'https://sequenciador.o-girador.com', arg2, options = {}) {
  let baseUrl = arg1;
  let item = arg2;
  let extraOptions = typeof options === 'object' && options !== null ? options : {};

  // Support polymorphique : inversion d'arguments tolérée si arg1 est un objet (morceau)
  if (typeof arg1 === 'object' && arg1 !== null) {
    item = arg1;
    baseUrl = typeof arg2 === 'string' && arg2.trim() ? arg2 : 'https://sequenciador.o-girador.com';
    if (typeof arg2 === 'object' && arg2 !== null) {
      extraOptions = arg2;
    }
  } else if (!baseUrl || typeof baseUrl !== 'string') {
    baseUrl = 'https://sequenciador.o-girador.com';
  }

  const base = baseUrl.trim();
  if (!item) return base;

  // Détection du mode cible ('danse' | 'percussion')
  const targetMode = extraOptions.mode || (typeof item === 'object' && item !== null ? item.mode : null);
  const appendMode = (url) => {
    if (!targetMode || typeof targetMode !== 'string' || !targetMode.trim()) return url;
    const cleanMode = targetMode.trim();
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}mode=${encodeURIComponent(cleanMode)}`;
  };

  const separator = base.includes('?') ? '&' : '?';

  // 1. Cas où l'argument est une chaîne brute
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return appendMode(base);
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return appendMode(`${base}${separator}file=${encodeURIComponent(trimmed)}`);
    }
    return appendMode(`${base}${separator}patternId=${encodeURIComponent(trimmed)}`);
  }

  // 2. Cas où l'argument est un objet (morceau de répertoire ou ressource séquenceur)
  const collectionType = item._collection || item.collection || item.preset?._collection;

  // Détection d'un fichier hébergé (Storage ou URL distante)
  const candidateFileUrl = item.fileUrl || item.sequenceurFileUrl || (typeof item.jsonUrl === 'string' && (item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://')) ? item.jsonUrl : null);
  if (candidateFileUrl && (candidateFileUrl.startsWith('http://') || candidateFileUrl.startsWith('https://'))) {
    return appendMode(`${base}${separator}file=${encodeURIComponent(candidateFileUrl)}`);
  }

  // Détection explicite de section
  const sectionId = item.sectionId || (collectionType === 'sections' || item.sequenceurType === 'sections' || item.preset?._collection === 'sections' ? (item.preset?.id || item.sequenceurId || item.id) : null);
  if (sectionId) {
    return appendMode(`${base}${separator}sectionId=${encodeURIComponent(sectionId)}`);
  }

  // Détection explicite de preset
  const presetId = item.loadPreset || item.presetId || (collectionType === 'presets' || item.sequenceurType === 'presets' || item.preset?._collection === 'presets' ? (item.preset?.id || item.sequenceurId || item.id) : null);
  if (presetId) {
    return appendMode(`${base}${separator}presetId=${encodeURIComponent(presetId)}`);
  }

  // Détection explicite de pattern / motif
  const patternId = item.patternId || item.sequenceurId || (collectionType === 'patterns' ? item.id : null) || item.id;
  if (patternId && !patternId.startsWith('http://') && !patternId.startsWith('https://')) {
    return appendMode(`${base}${separator}patternId=${encodeURIComponent(patternId)}`);
  }

  // Repli sur le champ jsonUrl brut s'il existe
  if (item.jsonUrl) {
    const isRemote = item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://');
    const param = isRemote ? 'file' : 'patternId';
    return appendMode(`${base}${separator}${param}=${encodeURIComponent(item.jsonUrl)}`);
  }

  return appendMode(base);
}

/**
 * Lance le Séquenceur avec SSO transparent et gestion des pop-ups navigateurs.
 *
 * @param {string} [baseUrl] - URL de base du Séquenceur
 * @param {Object|string} item - Morceau ou identifiant de ressource à charger
 * @param {Object} [options] - Options supplémentaires transmises à launchCrossApp (inclut mode: 'danse' | 'percussion')
 * @returns {Promise<void>}
 */
export async function openSequencerWithCrossApp(baseUrl, item, options = {}) {
  const targetUrl = buildSequencerUrl(baseUrl, item, options);
  return launchCrossApp(targetUrl, {
    appLabel: options.appLabel || 'le Séquenceur',
    ...options
  });
}
