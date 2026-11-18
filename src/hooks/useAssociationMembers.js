/**
 * Hook et utilitaires unifiés de résolution et synchronisation des membres
 * d'une association (isolation SaaS Multi-Associations stricte).
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId, isValidTenantIdentifier, buildGroupVariants } from '../utils/tenantUtils';
import { useTenantContext } from '../context/TenantContext';
import useGroupContext from './useGroupContext';

/**
 * Résout l'identifiant canonique de l'association active sans aucun repli codé en dur.
 */
export function resolveAssociationGroupId({ propGroupId, profileData, tenantGroupId, storedGroupId }) {
  const candidates = [profileData?.groupId, propGroupId, tenantGroupId, storedGroupId];
  for (const candidate of candidates) {
    if (isValidTenantIdentifier(candidate)) {
      return canonicalizeGroupId(candidate.trim());
    }
  }
  return null;
}

/**
 * Génère dynamiquement toutes les variantes de casse nécessaires à `where('groupId', 'in', ...)`.
 */
export function getAssociationGroupVariants(rawGroupId) {
  return buildGroupVariants(rawGroupId);
}

/**
 * Vérifie si un document utilisateur appartient strictement à l'association cible.
 */
export function matchesAssociationTenant(userDoc, targetGroupId, docId = '') {
  if (!userDoc || !targetGroupId) return false;
  const id = docId || userDoc.id || '';
  if (String(id).startsWith('draft_') || userDoc.isNewDraft === true) return false;

  const targetLower = (canonicalizeGroupId(targetGroupId) || targetGroupId).trim().toLowerCase();
  const rawDocGroup = typeof userDoc.groupId === 'string' ? userDoc.groupId.trim() : '';
  if (!rawDocGroup || !targetLower) return false;

  const docCanonicalLower = (canonicalizeGroupId(rawDocGroup) || rawDocGroup).trim().toLowerCase();
  return docCanonicalLower === targetLower;
}

/**
 * Récupération ponctuelle (`getDocs`) des membres de l'association.
 */
export async function fetchAssociationMembersOnce(targetGroupId, transformMember = null) {
  const variants = getAssociationGroupVariants(targetGroupId);
  if (variants.length === 0) return [];
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
    const variants = getAssociationGroupVariants(currentGroupId);
    if (!currentGroupId || !enabled || variants.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);

    fetchAssociationMembersOnce(currentGroupId, transformRef.current).then((initialList) => {
      if (isMounted) {
        if (initialList.length > 0) setMembers((prev) => (initialList.length >= prev.length ? initialList : prev));
        setLoading(false);
      }
    }).catch(() => {});

    const q = query(collection(db, 'users'), where('groupId', 'in', variants));
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
