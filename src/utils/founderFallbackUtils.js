import { canonicalizeGroupId, getLastKnownTenantId } from './tenantUtils.js';

/**
 * Résout l'identifiant d'association d'un profil de secours administrateur sans jamais écraser
 * un `groupId` existant par une chaîne vide, ni injecter d'association codée en dur.
 * Ordre strict : `profileDoc?.groupId || resolvedTenantId || og_last_tenant_id || ''`.
 */
export function resolveAdminFallbackGroupId(profileDoc = null, resolvedTenantId = '') {
  const raw = profileDoc?.groupId || resolvedTenantId || getLastKnownTenantId() || '';
  return raw ? (canonicalizeGroupId(raw) || raw) : '';
}

/**
 * Construit un profil de secours résilient en cas d'indisponibilité réseau temporaire
 * pour un compte administrateur système, sans aucun nom d'association codé en dur.
 */
export function buildFounderEmergencyProfile({
  currentUser,
  profileDoc = null,
  resolvedTenantId = '',
  associationName = ''
}) {
  const uid = currentUser?.uid || profileDoc?.uid || profileDoc?.id || '';
  const resolvedGroupId = resolveAdminFallbackGroupId(profileDoc, resolvedTenantId);
  const resolvedGroupName = profileDoc?.groupName || associationName || '';

  return {
    ...(profileDoc || {}),
    uid,
    id: uid,
    email: currentUser?.email || profileDoc?.email || '',
    firstName: profileDoc?.firstName || profileDoc?.prenom || 'Julian',
    lastName: profileDoc?.lastName || profileDoc?.nom || 'Biblocq',
    prenom: profileDoc?.prenom || 'Julian',
    nom: profileDoc?.nom || 'Biblocq',
    displayName: currentUser?.displayName || profileDoc?.displayName || 'Julian Biblocq',
    groupId: resolvedGroupId,
    groupName: resolvedGroupName,
    role: profileDoc?.role || 'mestre',
    isSystemAdmin: true,
    canViewAll: true,
    paymentStatus: 'exempt',
    cotisationStatus: 'exonere',
    isCotisationExoneree: true,
    onboardingCompleted: true,
    isNew: false,
    tags: Array.isArray(profileDoc?.tags) && profileDoc.tags.length > 0
      ? profileDoc.tags
      : ['Visiteur', 'Mestre', 'Direction', 'Bureau', 'CA', 'Exonéré', 'Fondateur', 'Webmaster'],
    photoURL: currentUser?.photoURL || profileDoc?.photoURL || ''
  };
}
