import { doc, getDoc } from 'firebase/firestore';
import {
  isValidTenantIdentifier,
  canonicalizeGroupId,
  registerCanonicalGroupId,
  saveLastKnownTenantId
} from './tenantUtils.js';

/**
 * Évalue la complétude métier d'un document `associations/{id}` afin de privilégier
 * systématiquement la fiche maîtresse complète face à un éventuel squelette partiel.
 */
function scoreAssociationDoc(data) {
  if (!data || typeof data !== 'object') return 0;
  const hasCoreIdentity = Boolean(data.nom || data.name || data.ownerUid || data.createdAt);
  return (hasCoreIdentity ? 1000 : 0) + Object.keys(data).length;
}

/**
 * Résout de manière asynchrone et sans race condition l'identifiant canonique exact (`docSnap.id`)
 * d'une association dans Firestore via `Promise.allSettled` sur `[clean, lower, capitalized]`.
 *
 * @param {Object} dbInstance - Instance Firestore
 * @param {string} rawGroupId - Identifiant brut (ex: issu de `?groupe=` en minuscules)
 * @param {Object} [options]
 * @param {boolean} [options.persistLastTenant=true] - Mémoriser dans `og_last_tenant_id` si valide
 * @returns {Promise<{ exists: boolean, canonicalId: string|null, data: Object|null, networkError: boolean }>}
 */
export async function resolveCanonicalGroupFromFirestore(dbInstance, rawGroupId, options = {}) {
  const { persistLastTenant = true } = options;
  if (!dbInstance || !isValidTenantIdentifier(rawGroupId)) {
    return { exists: false, canonicalId: null, data: null, networkError: false };
  }

  const clean = rawGroupId.trim();
  const lower = clean.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const candidates = Array.from(new Set([canonicalizeGroupId(clean), clean, lower, capitalized])).filter(Boolean);

  const settled = await Promise.allSettled(
    candidates.map((candidateId) => getDoc(doc(dbInstance, 'associations', candidateId)))
  );

  const validSnaps = settled
    .filter((res) => res.status === 'fulfilled' && res.value && res.value.exists())
    .map((res) => res.value);

  if (validSnaps.length > 0) {
    validSnaps.sort((a, b) => scoreAssociationDoc(b.data()) - scoreAssociationDoc(a.data()));
    const winner = validSnaps[0];
    registerCanonicalGroupId(winner.id);
    if (persistLastTenant) {
      saveLastKnownTenantId(winner.id);
    }
    return {
      exists: true,
      canonicalId: winner.id,
      data: winner.data() || {},
      networkError: false
    };
  }

  const anyFulfilled = settled.some((res) => res.status === 'fulfilled');
  return {
    exists: false,
    canonicalId: null,
    data: null,
    networkError: !anyFulfilled
  };
}
