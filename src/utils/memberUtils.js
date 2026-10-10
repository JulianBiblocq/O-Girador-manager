/**
 * Utilitaires pour les profils et adhérents (Niveaux Cordel et Unification).
 */

/**
 * Normalise et formate le libellé du niveau d'un membre.
 * Gère la rétrocompatibilité des données historiques :
 * - "La référence" (confirmés / anciens : 'confirme', 'confirmé', 'reference', 'la_reference', '2')
 * - "La relève" (débutants / nouveaux : 'debutant', 'débutant', 'releve', 'la_releve', '1')
 * Bannit tout fallback automatique qui forçait "Débutant".
 *
 * @param {string|number} niveau Niveau brut stocké
 * @returns {string|null} "La référence", "La relève", valeur personnalisée, ou null
 */
export const formatMemberLevel = (niveau) => {
  if (!niveau) return null;
  const clean = String(niveau).toLowerCase().trim();

  // Cas "La référence" (confirmés / anciens)
  if (['confirme', 'confirmé', 'reference', 'la_reference', 'la référence', '2'].includes(clean)) {
    return 'La référence';
  }

  // Cas "La relève" (débutants / nouveaux)
  if (['debutant', 'débutant', 'releve', 'la_releve', 'la relève', '1'].includes(clean)) {
    return 'La relève';
  }

  return String(niveau).trim() || null;
};

/**
 * Résout le niveau global ou prioritaire d'un membre.
 *
 * @param {Object} member Objet données membre
 * @returns {string|null} "La référence", "La relève" ou null
 */
export const resolveMemberLevel = (member) => {
  if (!member) return null;

  // 1. Niveau explicite direct
  const directLevel = member.niveau || member.level || member.niveauMusique;
  if (directLevel && directLevel !== 'aucun') {
    const formatted = formatMemberLevel(directLevel);
    if (formatted) return formatted;
  }

  // 2. Niveaux par instrument (selon instrument principal ou premier instrument)
  if (member.niveauxParInstrument && typeof member.niveauxParInstrument === 'object') {
    const primaryInst = member.instrumentPrincipal || member.instrument;
    if (primaryInst && member.niveauxParInstrument[primaryInst]) {
      const formatted = formatMemberLevel(member.niveauxParInstrument[primaryInst]);
      if (formatted) return formatted;
    }
    for (const val of Object.values(member.niveauxParInstrument)) {
      if (val && val !== 'aucun') {
        const formatted = formatMemberLevel(val);
        if (formatted) return formatted;
      }
    }
  }

  // 3. Niveau danse si pupitre danse
  if (member.niveauDanse && member.niveauDanse !== 'aucun') {
    return formatMemberLevel(member.niveauDanse);
  }

  return null;
};

/**
 * Détecte si une étiquette correspond à un rôle institutionnel clé de l'association
 * (Présidence, Bureau, C.A., Trésorerie, Secrétariat).
 *
 * @param {string|object} tag Étiquette brute ou objet
 * @returns {boolean} true s'il s'agit d'une étiquette institutionnelle
 */
/**
 * Retourne la clé canonique unifiée d'une étiquette pour comparaison et déduplication stricte.
 * Unifie "C.A.", "CA", "Conseil d'administration" -> "ca"
 * Unifie "Bureau" -> "bureau"
 * Unifie "Président", "Présidente" -> "president"
 * Unifie "Trésorier", "Trésorière" -> "tresorier"
 * Unifie "Secrétaire" -> "secretaire"
 * Ne confond JAMAIS le pôle "Secrétariat" avec le titre "Secrétaire".
 *
 * @param {string|object} tag Étiquette brute ou objet
 * @returns {string} Clé canonique normalisée en minuscules
 */
export const getCanonicalTagKey = (tag) => {
  if (!tag) return '';
  const raw = typeof tag === 'object' ? (tag.id || tag.nomM || tag.nom || tag.label || '') : String(tag);
  const clean = String(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\.\-_\'’]/g, '')
    .trim();

  if (clean === 'ca' || clean === 'conseildadministration' || clean.includes('conseildadministration')) return 'ca';
  if (clean === 'bureau') return 'bureau';
  if (clean === 'president' || clean === 'presidente' || clean === 'presidence') return 'president';
  if (clean === 'tresorier' || clean === 'tresoriere' || clean === 'tresorerie') return 'tresorier';
  if (clean === 'secretaire') return 'secretaire';
  return clean;
};

/**
 * Détecte si une étiquette correspond à un rôle institutionnel clé de l'association
 * (Présidence, Bureau, C.A., Trésorerie, Secrétariat du bureau).
 *
 * @param {string|object} tag Étiquette brute ou objet
 * @returns {boolean} true s'il s'agit d'une étiquette institutionnelle
 */
export const isInstitutionalTag = (tag) => {
  if (!tag) return false;
  const canonical = getCanonicalTagKey(tag);
  return ['president', 'bureau', 'ca', 'tresorier', 'secretaire'].includes(canonical);
};

/**
 * Résout les étiquettes effectives d'un membre en appliquant la hiérarchie institutionnelle automatique :
 * - Si le membre est officiellement Président(e) / Trésorier(e) / Secrétaire :
 *   reçoit automatiquement les badges parents 'Bureau' et 'C.A.' (le Bureau fait d'office partie du C.A.).
 * - Ne promeut JAMAIS un membre ayant l'étiquette d'activité "Secrétariat" au titre électif de "Secrétaire".
 * - Bannit rigoureusement toute duplication (ex: "C.A.", "CA", "Bureau").
 *
 * @param {Object} member Objet données membre
 * @returns {Array<string|object>} Liste des étiquettes effectives dédupliquées (directes + héritées)
 */
export const getEffectiveMemberTags = (member) => {
  if (!member) return [];

  const rawTags = Array.isArray(member.tags) ? member.tags : [];
  const baseTags = [];
  const seenCanonicalKeys = new Set();

  rawTags.forEach((t) => {
    if (!t) return;
    const key = getCanonicalTagKey(t);
    if (key && !seenCanonicalKeys.has(key)) {
      seenCanonicalKeys.add(key);
      baseTags.push(t);
    }
  });

  const rawRole = String(member.roleOfficiel || member.role || '').toLowerCase().trim();
  const isFemme = member.genre === 'F' || member.genre === 'femme' || member.genre === 'feminin';

  // 1. Détection de la présidence (rôle officiel ou étiquette spécifique)
  const isPresident =
    rawRole === 'president' ||
    rawRole === 'président' ||
    seenCanonicalKeys.has('president');

  // 2. Détection de la trésorerie (rôle officiel ou étiquette spécifique)
  const isTresorier =
    rawRole === 'tresorier' ||
    rawRole === 'trésorier' ||
    seenCanonicalKeys.has('tresorier');

  // 3. Détection du secrétariat (STRICTEMENT le rôle officiel ou l'étiquette 'Secrétaire', JAMAIS 'Secrétariat')
  const isSecretaire =
    rawRole === 'secretaire' ||
    rawRole === 'secrétaire' ||
    seenCanonicalKeys.has('secretaire');

  // 4. Détection du Bureau (exécutif restreint)
  const isBureau =
    isPresident ||
    isTresorier ||
    isSecretaire ||
    rawRole === 'bureau' ||
    seenCanonicalKeys.has('bureau');

  // 5. Attribution automatique des badges institutionnels hérités (SANS DUPLICATION)
  if (isPresident && !seenCanonicalKeys.has('president')) {
    seenCanonicalKeys.add('president');
    baseTags.push(isFemme ? 'Présidente' : 'Président');
  }
  if (isTresorier && !seenCanonicalKeys.has('tresorier')) {
    seenCanonicalKeys.add('tresorier');
    baseTags.push(isFemme ? 'Trésorière' : 'Trésorier');
  }
  if (isSecretaire && !seenCanonicalKeys.has('secretaire')) {
    seenCanonicalKeys.add('secretaire');
    baseTags.push('Secrétaire');
  }
  if (isBureau) {
    if (!seenCanonicalKeys.has('bureau')) {
      seenCanonicalKeys.add('bureau');
      baseTags.push('Bureau');
    }
    // Tout membre du Bureau fait partie d'office du Conseil d'Administration (C.A.)
    if (!seenCanonicalKeys.has('ca')) {
      seenCanonicalKeys.add('ca');
      baseTags.push('C.A.');
    }
  }

  // 6. Rôles pédagogiques effectifs (Mestre / Mestra de danse)
  const { badgeLabel } = resolvePedagogicalRoles(member);
  if (badgeLabel) {
    const pedaKey = getCanonicalTagKey(badgeLabel);
    if (pedaKey && !seenCanonicalKeys.has(pedaKey)) {
      seenCanonicalKeys.add(pedaKey);
      baseTags.push(badgeLabel);
    }
  }

  return baseTags;
};

/**
 * Résout les distinctions pédagogiques et artistiques d'un membre (Mestre de Batucada, Mestra/Mestre de Danse)
 * basées sur ses étiquettes (tags) effectives et sa pratique, et non pas sur son rôle technique dans l'application.
 *
 * @param {Object} member
 * @returns {{
 *   isMestreBatucada: boolean,
 *   isMestreDanse: boolean,
 *   pedagogicalTitle: string|null,
 *   badgeLabel: string|null,
 *   icon: string|null
 * }}
 */
export const resolvePedagogicalRoles = (member) => {
  if (!member) {
    return {
      isMestreBatucada: false,
      isMestreDanse: false,
      pedagogicalTitle: null,
      badgeLabel: null,
      icon: null
    };
  }

  const tags = Array.isArray(member.tags) ? member.tags : [];
  const normalizedTags = tags.map(t => {
    const raw = typeof t === 'object' ? (t.nom || t.label || t.id || '') : String(t);
    return raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  });

  const firstName = String(member.prenom || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const primaryInst = String(member.instrumentPrincipal || member.instrument || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const isFemale = member.genre === 'F' || member.genre === 'femme' || member.genre === 'feminin' ||
    firstName === 'amandine' || firstName === 'irene' || firstName.includes('amandine') || firstName.includes('irene');

  // 1. Détection Mestra / Mestre de Danse :
  // - Tag ou instrument lié à la danse et à l'encadrement/mestre/prof
  // - Ou tag 'mestre'/'mestra' avec pratique de la danse ou pupitre danse
  // - Ou Amandine / Irène (maîtresses de danse référentes de l'association)
  const hasDanseTeachingTag = normalizedTags.some(t =>
    (t.includes('danse') || t.includes('dance')) &&
    (t.includes('mestre') || t.includes('mestra') || t.includes('prof') || t.includes('enseign') || t.includes('maitr') || t.includes('responsable') || t.includes('referent'))
  ) || (
    (primaryInst.includes('danse') || primaryInst.includes('dance')) &&
    (primaryInst.includes('mestre') || primaryInst.includes('mestra') || primaryInst.includes('prof'))
  );

  const isDancerWithMestreTag = (
    normalizedTags.some(t => t === 'mestre' || t === 'mestra' || t.startsWith('mestre ') || t.startsWith('mestra ') || t.includes('prof')) ||
    primaryInst === 'mestre' || primaryInst === 'mestra'
  ) && (
    member.primaryPupitreId === 'danse' ||
    member.pratiqueDanse === true ||
    primaryInst.includes('danse')
  );

  const isNamedDanseMestra = (
    firstName === 'amandine' ||
    firstName === 'irene' ||
    firstName.includes('amandine') ||
    firstName.includes('irene')
  );

  const isMestreDanse = hasDanseTeachingTag || isDancerWithMestreTag || isNamedDanseMestra;

  // 2. Détection Mestre de Batucada :
  // - Tag ou instrument 'mestre', 'mestre batucada', 'direction musicale', etc. (hors danse)
  // - Ne se base PAS uniquement sur role === 'mestre' de l'application
  const hasBatucMestreTag = normalizedTags.some(t => {
    if (t.includes('danse') || t.includes('dance')) return false;
    return (
      t === 'mestre' ||
      t === 'mestra' ||
      t.includes('mestre batucada') ||
      t.includes('mestre de batucada') ||
      t.includes('direction musicale') ||
      t.includes('chef d\'orchestre') ||
      t.includes('prof batucada') ||
      t.includes('prof percussion') ||
      t.includes('professeur percussion')
    );
  }) || (
    !primaryInst.includes('danse') && (
      primaryInst === 'mestre' ||
      primaryInst === 'mestre batucada' ||
      primaryInst === 'direction musicale'
    )
  );

  const isMestreBatucada = !isMestreDanse && hasBatucMestreTag;

  let pedagogicalTitle = null;
  let badgeLabel = null;
  let icon = null;

  if (isMestreDanse) {
    pedagogicalTitle = isFemale ? 'Mestra de danse' : 'Mestre de danse';
    badgeLabel = isFemale ? 'Mestra de danse' : 'Mestre de danse';
    icon = '💃👑';
  } else if (isMestreBatucada) {
    pedagogicalTitle = isFemale ? 'Mestra' : 'Mestre';
    badgeLabel = isFemale ? 'Mestra' : 'Mestre';
    icon = '👑';
  }

  return {
    isMestreBatucada,
    isMestreDanse,
    pedagogicalTitle,
    badgeLabel,
    icon
  };
};

/**
 * Détermine si un membre possède le statut CA ou Bureau (porteur d'un badge CA, Bureau,
 * Président, Trésorier, Secrétaire ou d'un rôle d'administration étendu).
 *
 * @param {Object} profile Profil ou données du membre
 * @param {Array} userTags Étiquettes additionnelles (optionnel)
 * @returns {boolean} true si le membre a accès aux contenus restreints CA / Bureau
 */
export const isMemberCaOrBureau = (profile, userTags = []) => {
  if (!profile && (!userTags || userTags.length === 0)) return false;
  const role = String(profile?.role || '').toLowerCase().trim();
  if (role === 'mestre' || role === 'super-admin' || role === 'admin' || role === 'bureau' || role === 'ca' || role === 'secretaire') {
    return true;
  }
  if (profile?.isSystemAdmin === true) return true;

  const effectiveTags = getEffectiveMemberTags(profile || {});
  const combined = [
    ...effectiveTags,
    ...(Array.isArray(userTags) ? userTags : [])
  ];

  return combined.some(t => {
    const k = getCanonicalTagKey(t);
    return k === 'ca' || k === 'bureau' || k === 'president' || k === 'tresorier' || k === 'secretaire';
  });
};
