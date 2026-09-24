import { launchCrossApp } from './crossAppAuth';

/**
 * Lanceur SSO vers sequenciador pour un palier d'entraînement spécifique.
 * Construit l'URL pré-paramétrée et l'ouvre via la passerelle SSO sans blocage pop-up.
 *
 * @param {string} presetId - Identifiant du preset séquenceur (ex: piece.sequenceurId)
 * @param {string} trainingId - Identifiant de l'entraînement dans /trainings
 * @param {number|string} stageIndex - Index du palier (0, 1, 2, ...)
 * @param {Object} [options] - Options supplémentaires de navigation
 * @param {string} [options.baseUrl] - URL de base du Séquenceur (défaut: https://sequenciador.o-girador.com)
 * @param {string} [options.appLabel] - Libellé affiché pendant la connexion SSO
 * @param {boolean} [options.forceSameTab] - Navigation dans le même onglet si souhaité
 * @returns {Promise<void>}
 */
export async function launchTrainingStage(presetId, trainingId, stageIndex = 0, options = {}) {
  const {
    baseUrl = 'https://sequenciador.o-girador.com',
    appLabel = 'sequenciador',
    forceSameTab = false
  } = options;

  if (!presetId) {
    console.warn("[trainingLauncher] Impossible de lancer l'entraînement : presetId manquant.");
    return;
  }

  const cleanBase = (baseUrl || 'https://sequenciador.o-girador.com').trim();
  const baseWithSlash = cleanBase.includes('?') || cleanBase.endsWith('/') ? cleanBase : `${cleanBase}/`;
  const separator = baseWithSlash.includes('?') ? '&' : '?';

  const targetUrl = `${baseWithSlash}${separator}presetId=${encodeURIComponent(presetId)}&trainingId=${encodeURIComponent(trainingId || '')}&stage=${encodeURIComponent(stageIndex ?? 0)}`;

  return launchCrossApp(targetUrl, {
    appLabel,
    forceSameTab
  });
}
