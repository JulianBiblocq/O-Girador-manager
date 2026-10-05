import { launchCrossApp } from './crossAppAuth.js';

/**
 * Liste officielle des 7 pupitres traditionnels supportés pour l'entraînement par le Séquenceur.
 * Conserve strictement les noms de pupitres traditionnels.
 */
export const SEQUENCIADOR_ROLES = [
  { id: 'caixa', label: 'Caixa', icon: '/icones/caixa.svg' },
  { id: 'marcante', label: 'Marcante', icon: '/icones/alfaia.svg' },
  { id: 'meiao', label: 'Meião', icon: '/icones/alfaia.svg' },
  { id: 'repique', label: 'Repique', icon: '/icones/alfaia.svg' },
  { id: 'gongue', label: 'Gonguê', icon: '/icones/gongue.svg' },
  { id: 'agbe', label: 'Agbê', icon: '/icones/agbe.svg' },
  { id: 'timbal', label: 'Timbal', icon: '/icones/timbal.svg' },
];

/**
 * Résout et normalise l'instrument principal du profil adhérent.
 * Retourne l'un des 7 rôles normalisés (caixa, marcante, meiao, repique, gongue, agbe, timbal)
 * ou null s'il est absent ou indéterminé (pour déclencher la micro-modale de secours).
 *
 * @param {Object} [profileData] - Données de profil utilisateur
 * @returns {string|null} Rôle normalisé ou null
 */
export function resolveUserSequencerRole(profileData) {
  if (!profileData) return null;
  const raw = String(
    profileData.instrumentPrincipal ||
    profileData.instrument ||
    profileData.pupitre ||
    (Array.isArray(profileData.instrumentsJoues) && profileData.instrumentsJoues[0]) ||
    ''
  ).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (!raw) return null;

  // Détection précise par famille / pupitre
  if (raw.includes('caixa') || raw.includes('tarol') || raw.includes('caisse') || raw.includes('snare')) return 'caixa';
  if (raw.includes('marcante')) return 'marcante';
  if (raw.includes('meiao')) return 'meiao';
  if (raw.includes('repique')) return 'repique';
  if (raw.includes('gongue') || raw.includes('cloche')) return 'gongue';
  if (raw.includes('agbe') || raw.includes('semente') || raw.includes('shekere') || raw.includes('xequere')) return 'agbe';
  if (raw.includes('timbal') || raw.includes('timbau')) return 'timbal';

  // Si c'est juste "alfaia" ou autre sans distinction de pupitre, retourner null pour laisser choisir dans la modale
  return null;
}

/**
 * Lanceur SSO vers sequenciador pour l'écoute globale d'un morceau de référence.
 * Ouvre Sequenciador en mode lecture complète (toutes pistes actives, pas de mode entraînement).
 * Règle stricte : Ne passer aucun paramètre role, tocarJunto, baseOnly ni trainingId.
 *
 * @param {string} sequenceurId - Identifiant du preset séquenceur (ex: piece.sequenceurId)
 * @param {Object} [options] - Options supplémentaires
 * @param {string} [options.baseUrl] - URL de base du Séquenceur (défaut: https://sequenciador.o-girador.com)
 * @param {string} [options.appLabel] - Libellé affiché pendant la connexion SSO
 * @param {boolean} [options.forceSameTab] - Navigation dans le même onglet si souhaité
 * @returns {Promise<void>}
 */
export async function launchGlobalSequencer(sequenceurId, options = {}) {
  const {
    baseUrl = 'https://sequenciador.o-girador.com',
    appLabel = 'sequenciador',
    forceSameTab = false
  } = options;

  if (!sequenceurId) {
    console.warn("[trainingLauncher] Impossible de lancer le Séquenceur : sequenceurId manquant.");
    return;
  }

  const cleanBase = (baseUrl || 'https://sequenciador.o-girador.com').trim().replace(/\/+$/, '');
  const targetUrl = `${cleanBase}/?presetId=${encodeURIComponent(sequenceurId)}`;

  return launchCrossApp(targetUrl, {
    appLabel,
    forceSameTab
  });
}

/**
 * Lanceur SSO vers sequenciador pour un palier d'entraînement spécifique (« Tocar Junto »).
 * Construit l'URL pré-paramétrée et l'ouvre via la passerelle SSO sans blocage pop-up.
 *
 * Format attendu :
 * https://sequenciador.o-girador.com/?presetId=${presetId}&trainingId=${trainingId}&stage=${stageIndex}&role=${userRole}&tocarJunto=1&baseOnly=1
 *
 * @param {string} presetId - Identifiant du preset séquenceur (ex: piece.sequenceurId)
 * @param {string} trainingId - Identifiant de l'entraînement dans /trainings
 * @param {number|string} stageIndex - Index du palier (0, 1, 2, ...)
 * @param {Object} [options] - Options supplémentaires de navigation
 * @param {string} [options.role] - Rôle/pupitre en sourdine (ex: 'caixa', 'marcante', ...)
 * @param {number|boolean} [options.tocarJunto] - Activation du mode « Tocar Junto » (défaut: 1)
 * @param {number|boolean} [options.baseOnly] - Activation du mode boucle de base (défaut: 1)
 * @param {string} [options.baseUrl] - URL de base du Séquenceur (défaut: https://sequenciador.o-girador.com)
 * @param {string} [options.appLabel] - Libellé affiché pendant la connexion SSO
 * @param {boolean} [options.forceSameTab] - Navigation dans le même onglet si souhaité
 * @returns {Promise<void>}
 */
export async function launchTrainingStage(presetId, trainingId, stageIndex = 0, options = {}) {
  const {
    baseUrl = 'https://sequenciador.o-girador.com',
    appLabel = 'sequenciador',
    forceSameTab = false,
    role,
    tocarJunto,
    baseOnly
  } = options;

  if (!presetId) {
    console.warn("[trainingLauncher] Impossible de lancer l'entraînement : presetId manquant.");
    return;
  }

  const cleanBase = (baseUrl || 'https://sequenciador.o-girador.com').trim().replace(/\/+$/, '');
  const params = new URLSearchParams();
  params.set('presetId', presetId);
  if (trainingId) {
    params.set('trainingId', trainingId);
  }
  params.set('stage', String(stageIndex ?? 0));

  if (role) {
    params.set('role', role);
  }
  if (tocarJunto !== undefined && tocarJunto !== null) {
    params.set('tocarJunto', tocarJunto === true ? '1' : String(tocarJunto));
  }
  if (baseOnly !== undefined && baseOnly !== null) {
    params.set('baseOnly', baseOnly === true ? '1' : String(baseOnly));
  }

  const targetUrl = `${cleanBase}/?${params.toString()}`;

  return launchCrossApp(targetUrl, {
    appLabel,
    forceSameTab
  });
}
