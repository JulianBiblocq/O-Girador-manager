/**
 * Point d'entrée utilitaire centralisé pour le Trombinoscope et la résolution des pupitres principaux / étiquettes.
 * Ré-exporte l'ensemble des fonctions de `src/components/trombinoscope/trombinoscopeUtils.js`.
 */
export {
  FIVE_PUPITRES,
  isDanseMember,
  isMestreMember,
  isRenfortMember,
  isChantReferent,
  isPedagogicalTag,
  isDefaultMemberBadge,
  resolveMemberPrimaryPupitre,
  extractMemberBadges,
  resolveMemberInstrumentSubtitle,
  formatBirthdayShort,
  formatMemberLevel,
  resolveMemberLevel,
  getEffectiveMemberTags,
  isInstitutionalTag,
  getCanonicalTagKey,
  resolvePedagogicalRoles
} from '../components/trombinoscope/trombinoscopeUtils';

