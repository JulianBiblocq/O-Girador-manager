// Lanceur SSO et générateur de Deep Links vers Dançador (<= 90 lignes)
import { launchCrossApp } from './crossAppAuth.js';
import { getEcosystemUrl } from '../constants/ecosystemUrls.js';

/**
 * Construit l'URL Deep Link vers Dançador (pas isolé /player/step/:stepId ou chorégraphie ?choreoId=).
 *
 * @param {Object} [params]
 * @param {string} [params.choreoId] - Identifiant de la chorégraphie
 * @param {string} [params.stepId] - Identifiant d'un pas isolé
 * @param {string} [params.groupId] - Identifiant du groupe / association
 * @returns {string} URL complète vers Dançador
 */
export function buildDancadorUrl({ choreoId, stepId, groupId } = {}) {
  const cleanStepId = stepId ? String(stepId).trim() : '';
  const cleanChoreoId = choreoId ? String(choreoId).trim() : '';
  const cleanGroupId = groupId ? String(groupId).trim() : '';

  if (cleanStepId) {
    const params = new URLSearchParams();
    if (cleanGroupId) params.set('groupId', cleanGroupId);
    if (cleanChoreoId) params.set('choreoId', cleanChoreoId);
    const qs = params.toString();
    return getEcosystemUrl('dancador', `/player/step/${encodeURIComponent(cleanStepId)}${qs ? `?${qs}` : ''}`);
  }

  if (cleanChoreoId) {
    const params = new URLSearchParams();
    params.set('choreoId', cleanChoreoId);
    if (cleanGroupId) params.set('groupId', cleanGroupId);
    return getEcosystemUrl('dancador', `?${params.toString()}`);
  }

  const fallbackQs = cleanGroupId ? `?groupId=${encodeURIComponent(cleanGroupId)}` : '';
  return getEcosystemUrl('dancador', fallbackQs);
}

/**
 * Ouvre Dançador via la passerelle SSO transversale sur un pas isolé ou une chorégraphie.
 *
 * @param {Object} [params] - { choreoId, stepId, groupId }
 * @param {Object} [options] - Options SSO (appLabel, forceSameTab, dryRun)
 * @returns {Promise<string>} URL cible résolue
 */
export async function launchDancador({ choreoId, stepId, groupId } = {}, options = {}) {
  const targetUrl = buildDancadorUrl({ choreoId, stepId, groupId });
  if (typeof window !== 'undefined' && !options.dryRun) {
    await launchCrossApp(targetUrl, {
      appLabel: options.appLabel || 'Dançador',
      forceSameTab: Boolean(options.forceSameTab),
      ...options,
    });
  }
  return targetUrl;
}

