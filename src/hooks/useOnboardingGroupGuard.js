import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  canonicalizeGroupId,
  isValidTenantIdentifier,
  resolveCanonicalGroupFromFirestore,
  saveLastKnownTenantId
} from '../utils/tenantUtils';
import { resolveResilientGroupId, setStoredGroupId } from './useGroupContext';

/**
 * Hook de garde multi-associations pour `Onboarding.jsx` :
 * - Résout la casse canonique exacte (`docSnap.id`) via `Promise.allSettled` avant toute écriture.
 * - Refuse tout identifiant vide ou inexistant afin d'interdire la création de comptes orphelins.
 * - Charge la configuration d'inscription de l'association validée.
 */
export function useOnboardingGroupGuard({ profileData, branding, defaultFieldsConfig }) {
  const [candidateGroupId, setCandidateGroupId] = useState(() => {
    const fromProfile = profileData?.groupId;
    if (isValidTenantIdentifier(fromProfile)) return canonicalizeGroupId(fromProfile);
    const resilient = resolveResilientGroupId();
    return isValidTenantIdentifier(resilient.groupId) ? canonicalizeGroupId(resilient.groupId) : '';
  });

  const [verifiedGroupId, setVerifiedGroupId] = useState('');
  const [isResolvingGroup, setIsResolvingGroup] = useState(() => Boolean(candidateGroupId));
  const [groupError, setGroupError] = useState('');

  const [fieldsConfig, setFieldsConfig] = useState(null);
  const [nomAssociation, setNomAssociation] = useState(branding?.nomAssociation || branding?.nom || branding?.name || '');
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(['Alfaia', 'Caixa', 'Tarol', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Chant']);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [droitImageDocUrl, setDroitImageDocUrl] = useState('');
  const [aptitudeMedicaleDocUrl, setAptitudeMedicaleDocUrl] = useState('');
  const [demanderDroitImage, setDemanderDroitImage] = useState(false);
  const [demanderAttestationSante, setDemanderAttestationSante] = useState(false);

  useEffect(() => {
    if (isValidTenantIdentifier(profileData?.groupId) && !candidateGroupId) {
      setCandidateGroupId(canonicalizeGroupId(profileData.groupId));
    }
  }, [profileData?.groupId, candidateGroupId]);

  useEffect(() => {
    let isMounted = true;
    if (!isValidTenantIdentifier(candidateGroupId)) {
      setVerifiedGroupId('');
      setIsResolvingGroup(false);
      setFieldsConfig(defaultFieldsConfig);
      return () => { isMounted = false; };
    }

    setIsResolvingGroup(true);
    setGroupError('');

    resolveCanonicalGroupFromFirestore(db, candidateGroupId)
      .then((res) => {
        if (!isMounted) return;
        if (res.exists && res.canonicalId) {
          const data = res.data || {};
          setVerifiedGroupId(res.canonicalId);
          setStoredGroupId(res.canonicalId);
          saveLastKnownTenantId(res.canonicalId);
          if (data.nomAssociation || data.nom || data.name) {
            setNomAssociation(data.nomAssociation || data.nom || data.name);
          }
          setDemanderDroitImage(Boolean(data.demanderDroitImage));
          setDemanderAttestationSante(Boolean(data.demanderAttestationSante));
          if (Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0) {
            setInstrumentsDisponibles(data.instrumentsDisponibles);
          }
          if (Array.isArray(data.linkedInstruments)) {
            setLinkedInstruments(data.linkedInstruments);
          }
          setFieldsConfig(data.fieldsConfig ? { ...defaultFieldsConfig, ...data.fieldsConfig } : defaultFieldsConfig);
          setDroitImageDocUrl(data.droitImageDocUrl || '');
          setAptitudeMedicaleDocUrl(data.aptitudeMedicaleDocUrl || '');
        } else if (res.networkError) {
          const fallbackCanonical = canonicalizeGroupId(candidateGroupId);
          setVerifiedGroupId(fallbackCanonical);
          setFieldsConfig(defaultFieldsConfig);
        } else {
          setVerifiedGroupId('');
          setStoredGroupId(null);
          setGroupError("Aucune association trouvée avec ce code. Vérifiez l'orthographe ou demandez le lien d'invitation à votre Bureau.");
          setFieldsConfig(defaultFieldsConfig);
        }
      })
      .finally(() => {
        if (isMounted) setIsResolvingGroup(false);
      });

    return () => { isMounted = false; };
  }, [candidateGroupId, defaultFieldsConfig]);

  const selectManualGroup = useCallback((rawCode) => {
    const clean = String(rawCode || '').trim();
    if (!clean) return;
    setGroupError('');
    setCandidateGroupId(clean);
  }, []);

  return {
    verifiedGroupId,
    isResolvingGroup,
    groupError,
    selectManualGroup,
    fieldsConfig,
    nomAssociation,
    instrumentsDisponibles,
    linkedInstruments,
    droitImageDocUrl,
    aptitudeMedicaleDocUrl,
    demanderDroitImage,
    demanderAttestationSante
  };
}
