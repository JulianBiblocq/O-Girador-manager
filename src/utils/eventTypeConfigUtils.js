/**
 * Utilitaires pour la configuration des types d'événements dans l'Agenda
 * Fournit les fonctions de résolution de presets par défaut, détection d'émojis
 * et génération de résumés textuels pour les fiches et accordéons.
 */

/**
 * Retourne l'émoji représentatif selon l'intitulé du type d'événement.
 * 
 * @param {string} type Identifiant ou libellé du type
 * @returns {string} Émoji
 */
export function getEventTypeEmoji(type = '') {
  const normalized = String(type).trim().toLowerCase();
  if (['prestation', 'concert', 'spectacle', 'festival', 'parade'].includes(normalized)) return '🎭';
  if (normalized.includes('repetition') || normalized.includes('répétition')) return '🥁';
  if (normalized.includes('stage')) return '🥋';
  if (normalized.includes('atelier') || normalized.includes('lutherie')) return '🛠️';
  if (normalized.includes('reunion') || normalized.includes('réunion') || normalized.includes('assemblee')) return '📋';
  return '📅';
}

/**
 * Résout la configuration effective avec des valeurs par défaut intelligentes selon la nature du type.
 * 
 * @param {string} type Nom du type
 * @param {object} rawConfig Configuration brute enregistrée
 * @returns {object} Configuration résolue
 */
export function resolveTypeEffectiveConfig(type = '', rawConfig = {}) {
  const norm = String(type).trim().toLowerCase();
  const isPresta = ['prestation', 'concert', 'spectacle', 'festival', 'parade'].includes(norm);
  const isRepet = norm.includes('repetition') || norm.includes('répétition');
  const isStage = norm.includes('stage');
  const isAtelier = norm.includes('atelier');
  const isReunion = norm.includes('reunion') || norm.includes('réunion');

  return {
    enableRoadbook: rawConfig.enableRoadbook !== undefined
      ? Boolean(rawConfig.enableRoadbook)
      : (isPresta || isStage),
    activerRecolteMedias: rawConfig.activerRecolteMedias !== undefined
      ? Boolean(rawConfig.activerRecolteMedias)
      : isPresta,
    enableVideoDrop: rawConfig.enableVideoDrop !== undefined
      ? Boolean(rawConfig.enableVideoDrop)
      : (rawConfig.activerDepotVideo !== undefined
        ? Boolean(rawConfig.activerDepotVideo)
        : (isAtelier || isRepet || isStage)),
    activerDepotVideo: rawConfig.activerDepotVideo !== undefined
      ? Boolean(rawConfig.activerDepotVideo)
      : (rawConfig.enableVideoDrop !== undefined
        ? Boolean(rawConfig.enableVideoDrop)
        : (isAtelier || isRepet || isStage)),
    enableStageLayout: rawConfig.enableStageLayout !== undefined
      ? Boolean(rawConfig.enableStageLayout)
      : (rawConfig.agendaEnableStageLayout !== undefined
        ? Boolean(rawConfig.agendaEnableStageLayout)
        : (isPresta || isStage)),
    enableRevisionProgram: rawConfig.enableRevisionProgram !== undefined
      ? Boolean(rawConfig.enableRevisionProgram)
      : (rawConfig.agendaEnableRevisionProgram !== undefined
        ? Boolean(rawConfig.agendaEnableRevisionProgram)
        : (isRepet || isStage || isPresta)),
    enableCarpool: rawConfig.enableCarpool !== undefined
      ? Boolean(rawConfig.enableCarpool)
      : (!isReunion && !isAtelier),
    includesPercussion: rawConfig.includesPercussion !== undefined
      ? Boolean(rawConfig.includesPercussion)
      : !isReunion,
    includesDance: rawConfig.includesDance !== undefined
      ? Boolean(rawConfig.includesDance)
      : (isPresta || isRepet || isStage),
    requiresValidation: rawConfig.requiresValidation !== undefined
      ? Boolean(rawConfig.requiresValidation)
      : false,
    hasCommissionsByDefault: rawConfig.hasCommissionsByDefault !== undefined
      ? Boolean(rawConfig.hasCommissionsByDefault)
      : (isPresta || isStage),
    defaultDeadlineHours: rawConfig.defaultDeadlineHours !== undefined
      ? rawConfig.defaultDeadlineHours
      : '',
    defaultDropUrl: rawConfig.defaultDropUrl || ''
  };
}

/**
 * Construit la liste textuelle résumée des modules activés pour l'en-tête replié.
 * 
 * @param {object} config Configuration résolue
 * @returns {string} Résumé avec puces
 */
export function buildConfigSummary(config = {}) {
  const badges = [];
  if (config.enableRoadbook) badges.push('📄 Feuille de route');
  if (config.activerRecolteMedias) badges.push('📸 Photos');
  if (config.enableVideoDrop || config.activerDepotVideo) badges.push('📹 Vidéos');
  if (config.enableStageLayout) badges.push('📐 Plan de scène');
  if (config.enableRevisionProgram) badges.push('🎵 Séquenceur');
  if (config.enableCarpool) badges.push('🚗 Covoit');
  if (config.includesPercussion) badges.push('🥁 Percu');
  if (config.includesDance) badges.push('💃 Danse');
  if (config.hasCommissionsByDefault) badges.push('🎪 Commissions');
  if (config.requiresValidation) badges.push('🔒 Valid. admin');
  if (config.defaultDeadlineHours && Number(config.defaultDeadlineHours) > 0) {
    badges.push(`⏳ Délai ${config.defaultDeadlineHours}h`);
  }

  if (badges.length === 0) return 'Aucun module par défaut';
  return badges.join(' • ');
}
