import { getCanonicalTagKey, getEffectiveMemberTags, isMemberCaOrBureau } from './memberUtils';

/**
 * Résout la configuration de confidentialité d'une réunion ou d'un document de compte-rendu
 * avec rétrocompatibilité complète pour les réunions existantes (audience / portee).
 */
export function resolveReunionPrivacyConfig(eventOrDoc = {}) {
  const rawTarget = eventOrDoc?.targetGroup || (
    (eventOrDoc?.audience === 'ca' || eventOrDoc?.portee === 'ca') ? 'ca' : 'all'
  );
  const targetGroup = rawTarget === 'publique' ? 'all' : rawTarget;

  let reunionPrivacyMode = eventOrDoc?.reunionPrivacyMode;
  if (!reunionPrivacyMode || !['public', 'transparent', 'huis_clos'].includes(reunionPrivacyMode)) {
    if (targetGroup === 'all') {
      reunionPrivacyMode = 'public';
    } else if (targetGroup === 'bureau') {
      reunionPrivacyMode = 'huis_clos';
    } else {
      reunionPrivacyMode = 'transparent';
    }
  }

  const hideAgendaFromNonTarget = reunionPrivacyMode === 'huis_clos'
    ? true
    : Boolean(eventOrDoc?.hideAgendaFromNonTarget);

  const audience = (targetGroup === 'all' && reunionPrivacyMode === 'public') ? 'publique' : 'ca';

  return {
    targetGroup,
    reunionPrivacyMode,
    hideAgendaFromNonTarget,
    audience,
    portee: audience
  };
}

/**
 * Retourne les préréglages automatiques ("Zéro prise de tête") lorsqu'un admin choisit un groupe convoqué.
 */
export function getDefaultPrivacyForTargetGroup(targetGroup = 'all') {
  const normalized = (!targetGroup || targetGroup === 'publique') ? 'all' : targetGroup;
  if (normalized === 'all') {
    return {
      targetGroup: 'all',
      reunionPrivacyMode: 'public',
      hideAgendaFromNonTarget: false,
      audience: 'publique',
      portee: 'publique',
      pollRestrictionType: 'aucun',
      pollTarget: ''
    };
  }
  if (normalized === 'ca') {
    return {
      targetGroup: 'ca',
      reunionPrivacyMode: 'transparent',
      hideAgendaFromNonTarget: false,
      audience: 'ca',
      portee: 'ca',
      pollRestrictionType: 'tag',
      pollTarget: 'CA'
    };
  }
  return {
    targetGroup: normalized,
    reunionPrivacyMode: 'huis_clos',
    hideAgendaFromNonTarget: true,
    audience: 'ca',
    portee: 'ca',
    pollRestrictionType: 'tag',
    pollTarget: normalized === 'bureau' ? 'Bureau' : normalized
  };
}

/**
 * Retourne le nom lisible du groupe convoqué (ex: "Bureau", "CA", "Conseil d'Administration").
 */
export function getTargetGroupDisplayName(targetGroup = 'all', tagsDisponibles = [], longFormat = false) {
  if (!targetGroup || targetGroup === 'all' || targetGroup === 'publique') {
    return "Toute l'association";
  }
  if (targetGroup === 'ca') {
    return longFormat ? "Conseil d'Administration" : 'CA';
  }
  if (targetGroup === 'bureau') {
    return 'Bureau';
  }
  const found = (Array.isArray(tagsDisponibles) ? tagsDisponibles : []).find((t) => {
    if (typeof t === 'string') return t.toLowerCase() === String(targetGroup).toLowerCase();
    return (
      String(t?.id || '').toLowerCase() === String(targetGroup).toLowerCase() ||
      String(t?.nomM || t?.nom || t?.label || '').toLowerCase() === String(targetGroup).toLowerCase()
    );
  });
  if (found) {
    return typeof found === 'string' ? found : (found.nomM || found.nom || found.label || targetGroup);
  }
  return targetGroup;
}

/**
 * Génère la phrase récapitulative dynamique pour rassurer l'administrateur sous le sélecteur.
 */
export function getReunionPrivacySummaryText({
  targetGroup = 'all',
  reunionPrivacyMode = 'public',
  hideAgendaFromNonTarget = false,
  tagsDisponibles = []
}) {
  const groupLabel = getTargetGroupDisplayName(targetGroup, tagsDisponibles, false);

  if (reunionPrivacyMode === 'huis_clos') {
    return `🔒 Guichet fermé : Seuls les membres porteurs du badge [${groupLabel}] verront ce sondage et cette date dans l'agenda. L'ordre du jour et le compte-rendu resteront strictement privés.`;
  }
  if (reunionPrivacyMode === 'transparent') {
    if (hideAgendaFromNonTarget) {
      return `🛡️ Demi-huis clos : Les adhérents voient que la réunion a lieu dans l'agenda, mais seuls les membres du [${groupLabel}] peuvent voter au sondage et consulter l'ordre du jour / compte-rendu.`;
    }
    return `👁️ Transparence : Tous les adhérents voient la date et l'ordre du jour, mais seuls les membres du [${groupLabel}] peuvent voter au sondage et émarger.`;
  }
  return '🌍 Réunion publique : Tous les adhérents voient la réunion, peuvent voter, proposer des sujets à l\'ordre du jour et lire le compte-rendu.';
}

/**
 * Vérifie si un utilisateur appartient au groupe convoqué (targetGroup) d'une réunion.
 */
export function isUserInReunionTargetGroup(eventOrConfig, profileData, effectiveUserTags = [], options = {}) {
  const config = eventOrConfig?.reunionPrivacyMode !== undefined && eventOrConfig?.targetGroup !== undefined
    ? eventOrConfig
    : resolveReunionPrivacyConfig(eventOrConfig);

  const { targetGroup } = config;
  if (!targetGroup || targetGroup === 'all' || targetGroup === 'publique') return true;
  if (options?.breakGlassActive === true) return true;
  if (!profileData) return false;

  // Super-Admin ou Mestre hors simulation d'un profil restreint
  if (
    !options?.isSimulating &&
    (profileData.role === 'super-admin' || profileData.isSystemAdmin === true || profileData.role === 'mestre')
  ) {
    return true;
  }

  const combinedTags = Array.from(new Set([
    ...(Array.isArray(effectiveUserTags) ? effectiveUserTags : []),
    ...getEffectiveMemberTags(profileData)
  ]));

  if (targetGroup === 'ca') {
    return isMemberCaOrBureau(profileData, combinedTags);
  }

  const canonicalSet = new Set(combinedTags.map((t) => getCanonicalTagKey(t)).filter(Boolean));
  const roleLower = String(profileData.role || '').trim().toLowerCase();

  if (targetGroup === 'bureau') {
    return (
      roleLower === 'bureau' ||
      canonicalSet.has('bureau') ||
      canonicalSet.has('president') ||
      canonicalSet.has('tresorier') ||
      canonicalSet.has('secretaire')
    );
  }

  const targetCanonical = getCanonicalTagKey(targetGroup);
  const targetLower = String(targetGroup).trim().toLowerCase();
  return (
    canonicalSet.has(targetCanonical) ||
    combinedTags.some((t) => String(typeof t === 'object' ? (t.id || t.nomM || t.nom || '') : t).trim().toLowerCase() === targetLower)
  );
}

/**
 * Indique si l'utilisateur peut voir la réunion (ou son créneau de sondage) dans l'Agenda.
 */
export function canUserSeeReunionInAgenda(event, profileData, effectiveUserTags = [], options = {}) {
  if (!event || event.type !== 'reunion') return true;
  const config = resolveReunionPrivacyConfig(event);
  if (config.reunionPrivacyMode === 'huis_clos') {
    return isUserInReunionTargetGroup(config, profileData, effectiveUserTags, options);
  }
  return true;
}

/**
 * Indique si l'utilisateur peut voter au sondage et s'inscrire / émarger à la réunion.
 */
export function canUserParticipateInReunion(event, profileData, effectiveUserTags = [], options = {}) {
  if (!event || event.type !== 'reunion') return true;
  const config = resolveReunionPrivacyConfig(event);
  if (config.reunionPrivacyMode === 'public' || config.targetGroup === 'all') return true;
  return isUserInReunionTargetGroup(config, profileData, effectiveUserTags, options);
}

/**
 * Indique si l'utilisateur a le droit de consulter l'ordre du jour, la boîte à idées et le compte-rendu.
 */
export function canUserSeeReunionReportAndAgenda(event, profileData, effectiveUserTags = [], options = {}) {
  if (!event || (event.type && event.type !== 'reunion' && event.type !== 'reunion_pv' && event.typeDoc !== 'reunion' && event.categoryId !== 'ComptesRendus')) {
    return true;
  }
  const config = resolveReunionPrivacyConfig(event);
  if (config.reunionPrivacyMode === 'huis_clos' || config.hideAgendaFromNonTarget === true) {
    return isUserInReunionTargetGroup(config, profileData, effectiveUserTags, options);
  }
  return true;
}

