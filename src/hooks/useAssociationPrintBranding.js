// Hook léger de résolution du nom et logo d'association pour la couverture du Carnet (< 65 lignes).
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const brandingCache = new Map();

function extractBranding(data) {
  if (!data || typeof data !== 'object') return { groupName: '', logoUrl: '' };
  return {
    groupName: (data.nom || data.name || data.associationName || data.nomAssociation || '').trim(),
    logoUrl: (data.branding?.logoUrl || data.logoUrl || '').trim()
  };
}

export default function useAssociationPrintBranding(groupId, initialAssociationData = null) {
  const cleanId = typeof groupId === 'string' ? groupId.trim() : '';
  const [branding, setBranding] = useState(() => {
    if (initialAssociationData) return extractBranding(initialAssociationData);
    return brandingCache.get(cleanId) || { groupName: '', logoUrl: '' };
  });

  useEffect(() => {
    if (initialAssociationData) {
      setBranding(extractBranding(initialAssociationData));
      return undefined;
    }
    if (!cleanId) return undefined;
    if (brandingCache.has(cleanId)) {
      setBranding(brandingCache.get(cleanId));
      return undefined;
    }
    let mounted = true;
    getDoc(doc(db, 'associations', cleanId))
      .then((snap) => {
        if (!snap.exists()) return;
        const resolved = extractBranding(snap.data());
        brandingCache.set(cleanId, resolved);
        if (mounted) setBranding(resolved);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [cleanId, initialAssociationData]);

  return branding;
}
