/**
 * Hook et utilitaires unifiés de résolution et synchronisation des membres
 * d'une association (Multi-Tenant strict avec support des profils historiques Samambaia).
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId } from '../utils/tenantUtils';
import { useTenantContext } from '../context/TenantContext';
import useGroupContext from './useGroupContext';

const INVALID_TECHNICAL_GROUP_IDS = new Set([
  'o-girador-7828c', 'o-girador-organizador', 'o-girador-mostrador',
  'organizador', 'mostrador', 'sequenciador', 'dancador', 'orquestrador', 'default', 'public'
]);

function isValidTenantId(val) {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return Boolean(trimmed) && !INVALID_TECHNICAL_GROUP_IDS.has(trimmed.toLowerCase());
}

/**
 * Résout l'identifiant canonique de l'association active en priorisant le profil authentifié
 * (comme dans SecretariatReportsView), puis la prop explicite et les contextes de groupe.
 */
export function resolveAssociationGroupId({ propGroupId, profileData, tenantGroupId, storedGroupId }) {
  const candidates = [profileData?.groupId, propGroupId, tenantGroupId, storedGroupId, 'Samambaia'];
  for (const candidate of candidates) {
    if (isValidTenantId(candidate)) {
      return canonicalizeGroupId(candidate.trim());
    }
  }
  return 'Samambaia';
}

/**
 * Génère toutes les variantes de casse nécessaires à la requête Firestore `where('groupId', 'in', ...)`.
 */
export function getAssociationGroupVariants(rawGroupId) {
  if (!rawGroupId || typeof rawGroupId !== 'string') return ['Samambaia', 'samambaia'];
  const clean = rawGroupId.trim();
  const canonical = canonicalizeGroupId(clean) || clean;
  const lower = canonical.toLowerCase();
  const upper = canonical.toUpperCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  return Array.from(new Set([canonical, clean, lower, capitalized, upper].filter(Boolean)));
}

/**
 * Vérifie si un document utilisateur appartient à l'association cible, avec support
 * des profils historiques de Samambaia dépourvus de champ `groupId` et isolation stricte.
 */
export function matchesAssociationTenant(userDoc, targetGroupId, docId = '') {
  if (!userDoc || !targetGroupId) return false;
  const id = docId || userDoc.id || '';
  if (String(id).startsWith('draft_') || userDoc.isNewDraft === true) return false;

  const targetLower = (canonicalizeGroupId(targetGroupId) || targetGroupId).trim().toLowerCase();
  const rawDocGroup = typeof userDoc.groupId === 'string' ? userDoc.groupId.trim() : '';
  if (!rawDocGroup) {
    return targetLower === 'samambaia';
  }
  const docCanonicalLower = (canonicalizeGroupId(rawDocGroup) || rawDocGroup).trim().toLowerCase();
  return docCanonicalLower === targetLower;
}

/**
 * Récupération ponctuelle (`getDocs`) des membres de l'association (source identique à Rapports & Bilan AG).
 */
export async function fetchAssociationMembersOnce(targetGroupId, transformMember = null) {
  if (!targetGroupId) return [];
  const variants = getAssociationGroupVariants(targetGroupId);
  const snap = await getDocs(query(collection(db, 'users'), where('groupId', 'in', variants)));
  const list = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!matchesAssociationTenant(data, targetGroupId, docSnap.id)) return;
    const item = typeof transformMember === 'function' ? transformMember(docSnap.id, data) : { id: docSnap.id, ...data };
    if (item) list.push(item);
  });
  list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  return list;
}

/**
 * Hook temps réel unifié (`getDocs` initial + `onSnapshot`) pour Annuaire & Exports et Admin Système.
 */
export function useAssociationMembers({ groupId: propGroupId, profileData, enabled = true, transformMember = null }) {
  const tenantCtx = useTenantContext();
  const groupCtx = useGroupContext(profileData);
  const transformRef = useRef(transformMember);
  transformRef.current = transformMember;

  const currentGroupId = useMemo(() => resolveAssociationGroupId({
    propGroupId, profileData, tenantGroupId: tenantCtx?.groupId, storedGroupId: groupCtx?.groupId
  }), [propGroupId, profileData, tenantCtx?.groupId, groupCtx?.groupId]);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGroupId || !enabled) {
      setMembers([]);
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);

    // 1. Chargement immédiat via getDocs (fiabilité identique à SecretariatReportsView)
    fetchAssociationMembersOnce(currentGroupId, transformRef.current).then((initialList) => {
      if (isMounted) {
        if (initialList.length > 0) setMembers((prev) => (initialList.length >= prev.length ? initialList : prev));
        setLoading(false);
      }
    }).catch(() => {});

    // 2. Écoute temps réel via onSnapshot sur toutes les variantes de casse du tenant
    const q = query(collection(db, 'users'), where('groupId', 'in', getAssociationGroupVariants(currentGroupId)));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!isMounted) return;
      const fetched = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!matchesAssociationTenant(data, currentGroupId, docSnap.id)) return;
        const item = typeof transformRef.current === 'function' ? transformRef.current(docSnap.id, data) : { id: docSnap.id, ...data };
        if (item) fetched.push(item);
      });
      fetched.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setMembers((prev) => (fetched.length === 0 && prev.length > 0 ? prev : fetched));
      setLoading(false);
    }, () => {
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; unsubscribe(); };
  }, [currentGroupId, enabled]);

  return { currentGroupId, members, setMembers, loading };
}
