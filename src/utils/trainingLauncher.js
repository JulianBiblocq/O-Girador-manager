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
 * ou null s'il est absent ou indéterminé (pour laisser Sequenciador afficher sa propre sélection).
 *
 * Exemples de normalisation :
 * - « Marcante (alfaia) » -> « marcante »
 * - « Meião » -> « meiao »
 * - « Caixa » -> « caixa »
 * - « Alfaia Repique » -> « repique »
 * - « Gonguê » -> « gongue »
 * - « Agbê » -> « agbe »
 * - « Timbal » -> « timbal »
 *
 * @param {Object|string} [profileData] - Données de profil utilisateur ou nom de pupitre brut
 * @returns {string|null} Rôle normalisé pour Sequenciador ou null si non défini
 */
export function resolveUserSequencerRole(profileData) {
  if (!profileData) return null;

  let raw = '';
  if (typeof profileData === 'string') {
    raw = profileData;
  } else if (typeof profileData === 'object') {
    raw = String(
      profileData.instrumentPrincipal ||
      profileData.instrument ||
      profileData.instrumentRole ||
      profileData.pupitre ||
      profileData.pupitrePrincipal ||
      profileData.role ||
      (Array.isArray(profileData.instrumentsJoues) && profileData.instrumentsJoues[0]) ||
      ''
    );
  }

  // Normalisation : minuscules, décomposition NFD et suppression des accents diacritiques
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (!normalized) return null;

  // Détection précise par famille / pupitre traditionnel
  if (
    normalized.includes('caixa') ||
    normalized.includes('tarol') ||
    normalized.includes('caisse') ||
    normalized.includes('snare')
  ) {
    return 'caixa';
  }
  if (normalized.includes('marcante')) {
    return 'marcante';
  }
  if (normalized.includes('meiao')) {
    return 'meiao';
  }
  if (normalized.includes('repique')) {
    return 'repique';
  }
  if (
    normalized.includes('gongue') ||
    normalized.includes('cloche') ||
    normalized.includes('campana')
  ) {
    return 'gongue';
  }
  if (
    normalized.includes('agbe') ||
    normalized.includes('abe') ||
    normalized.includes('semente') ||
    normalized.includes('shekere') ||
    normalized.includes('xequere')
  ) {
    return 'agbe';
  }
  if (normalized.includes('timbal') || normalized.includes('timbau')) {
    return 'timbal';
  }

  // Instrument non reconnu parmi les 7 pupitres de jeu (ex. danse, chant ou indéterminé)
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

  const baseWithSlash = (baseUrl || 'https://sequenciador.o-girador.com').trim().replace(/\/+$/, '') + '/';
  const targetUrl = `${baseWithSlash}?presetId=${encodeURIComponent(sequenceurId)}`;

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
 * https://sequenciador.o-girador.com/?presetId=${presetId}&role=${userRole}&tocarJunto=1&baseOnly=1
 * Avec trainingId et stage si le lancement provient d'un palier d'entraînement précis :
 * https://sequenciador.o-girador.com/?presetId=${presetId}&trainingId=${trainingId}&stage=${stageIndex}&role=${userRole}&tocarJunto=1&baseOnly=1
 *
 * Si le rôle utilisateur est vide ou absent, le paramètre role est omis et Sequenciador
 * affichera lui-même sa modale de sélection de pupitre.
 *
 * @param {string} presetId - Identifiant du preset séquenceur (ex: piece.sequenceurId)
 * @param {string} [trainingId] - Identifiant de l'entraînement dans /trainings
 * @param {number|string} [stageIndex=0] - Index du palier (0, 1, 2, ...)
 * @param {Object} [options] - Options supplémentaires de navigation
 * @param {string} [options.role] - Rôle/pupitre en sourdine (ex: 'caixa', 'marcante', ...)
 * @param {number|boolean} [options.tocarJunto=1] - Activation du mode « Tocar Junto » (défaut: 1)
 * @param {number|boolean} [options.baseOnly=1] - Activation du mode boucle de base (défaut: 1)
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
    tocarJunto = 1,
    baseOnly = 1
  } = options;

  if (!presetId) {
    console.warn("[trainingLauncher] Impossible de lancer l'entraînement : presetId manquant.");
    return;
  }

  const baseWithSlash = (baseUrl || 'https://sequenciador.o-girador.com').trim().replace(/\/+$/, '') + '/';
  const params = new URLSearchParams();
  params.set('presetId', presetId);

  // Inclure trainingId et stage si le lancement provient d'un entraînement précis
  if (trainingId) {
    params.set('trainingId', trainingId);
    if (stageIndex !== undefined && stageIndex !== null) {
      params.set('stage', String(stageIndex));
    }
  }

  // Rôle de l'adhérent s'il a été identifié
  if (role && typeof role === 'string' && role.trim()) {
    params.set('role', role.trim());
  }

  // Paramètres d'entraînement interactif Tocar Junto
  if (tocarJunto !== undefined && tocarJunto !== null) {
    params.set('tocarJunto', tocarJunto === true ? '1' : String(tocarJunto));
  }
  if (baseOnly !== undefined && baseOnly !== null) {
    params.set('baseOnly', baseOnly === true ? '1' : String(baseOnly));
  }

  const targetUrl = `${baseWithSlash}?${params.toString()}`;

  return launchCrossApp(targetUrl, {
    appLabel,
    forceSameTab
  });
}
