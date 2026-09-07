import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveEffectiveUserTags } from '../utils/tagUtils';

/**
 * Contexte centralisé pour le Simulateur de Vue (Mode Impersonation / Test de vue).
 * Permet aux Super-Admins et Mestres de tester instantanément l'application avec les droits
 * d'un adhérent standard, d'un badge particulier ou d'un membre précis.
 *
 * SÉCURITÉ ABSOLUE : Zéro écriture Firestore (100% mémoire React).
 */
const ViewSimulatorContext = createContext(null);

export function ViewSimulatorProvider({ children, realProfileData, tagsDisponibles = [], groupId }) {
  // État d'activation du simulateur
  const [isSimulating, setIsSimulating] = useState(false);

  // Cible de simulation : { type: 'standard' | 'tag' | 'user', label: string, role: string, tags: string[], simulatedUser?: object }
  const [simulationTarget, setSimulationTarget] = useState(null);

  // Annuaire des membres du groupe pour la simulation nominative
  const [availableMembers, setAvailableMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const targetGroupId = groupId || realProfileData?.groupId;

  // Chargement réactif des membres actifs du groupe en lecture seule
  useEffect(() => {
    if (!targetGroupId) return;

    setLoadingMembers(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', targetGroupId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.statutActuel !== 'archived') {
          fetched.push({ id: docSnap.id, ...data });
        }
      });

      // Tri alphabétique par prénom puis nom
      fetched.sort((a, b) => {
        const nameA = `${a.prenom || ''} ${a.nom || ''}`.trim().toLowerCase();
        const nameB = `${b.prenom || ''} ${b.nom || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setAvailableMembers(fetched);
      setLoadingMembers(false);
    }, (err) => {
      console.warn("ViewSimulatorContext - Erreur lecture membres du groupe :", err);
      setLoadingMembers(false);
    });

    return () => unsubscribe();
  }, [targetGroupId]);

  /**
   * Calcul du profil utilisateur effectif :
   * - Si isSimulating est false : renvoie le profil réel sans modification.
   * - Si isSimulating est true : génère un profil virtuel isolé avec isSystemAdmin forcé à false.
   */
  const effectiveProfile = useMemo(() => {
    if (!isSimulating || !simulationTarget) {
      return realProfileData;
    }

    // 1. Simulation par adhérent précis (adopte son identité, ses tags et son rôle réel)
    if (simulationTarget.type === 'user' && simulationTarget.simulatedUser) {
      const u = simulationTarget.simulatedUser;
      return {
        ...realProfileData,
        uid: u.id || u.uid || 'simulated-user',
        prenom: u.prenom || 'Membre',
        nom: u.nom || 'Simulé',
        surnom: u.surnom || '',
        email: u.email || '',
        avatar: u.avatar || u.photoURL || '',
        photoURL: u.photoURL || u.avatar || '',
        role: u.role || 'membre',
        tags: Array.isArray(u.tags) ? u.tags : [],
        statutActuel: u.statutActuel || 'actif',
        instrumentPrincipal: u.instrumentPrincipal || u.pupitrePrincipal || '',
        pupitrePrincipal: u.pupitrePrincipal || u.instrumentPrincipal || '',
        isSystemAdmin: false, // Sécurité : JAMAIS d'accès admin système en simulation
        isNew: false,
        onboardingCompleted: true
      };
    }

    // 2. Simulation par badge / étiquette spécifique
    if (simulationTarget.type === 'tag') {
      return {
        ...realProfileData,
        uid: 'simulated-tag-user',
        prenom: 'Vue Badge',
        nom: simulationTarget.label || 'Étiquette',
        surnom: '',
        role: simulationTarget.role || 'membre',
        tags: Array.isArray(simulationTarget.tags) ? simulationTarget.tags : [simulationTarget.label],
        statutActuel: 'actif',
        instrumentPrincipal: 'Pupitre simulé',
        isSystemAdmin: false,
        isNew: false,
        onboardingCompleted: true
      };
    }

    // 3. Simulation Adhérent standard (aucun badge, rôle membre de base)
    return {
      ...realProfileData,
      uid: 'simulated-standard-user',
      prenom: 'Adhérent',
      nom: 'Standard',
      surnom: '',
      role: 'membre',
      tags: [],
      statutActuel: 'actif',
      instrumentPrincipal: 'Pupitre',
      isSystemAdmin: false,
      isNew: false,
      onboardingCompleted: true
    };
  }, [isSimulating, simulationTarget, realProfileData]);

  /**
   * Calcul des étiquettes effectives (avec prise en compte des héritages et résolutions de genre)
   */
  const effectiveUserTags = useMemo(() => {
    if (!effectiveProfile) return [];
    return resolveEffectiveUserTags(effectiveProfile.tags || [], tagsDisponibles);
  }, [effectiveProfile, tagsDisponibles]);

  /**
   * Active le mode simulation avec la cible fournie
   * @param {Object} target { type: 'standard' | 'tag' | 'user', label: string, role?: string, tags?: string[], simulatedUser?: object }
   */
  const startSimulation = (target) => {
    if (!target) return;
    setSimulationTarget(target);
    setIsSimulating(true);
  };

  /**
   * Désactive le mode simulation et restaure la vue administrateur réelle
   */
  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulationTarget(null);
  };

  const contextValue = {
    isSimulating,
    simulationTarget,
    effectiveProfile,
    effectiveUserTags,
    realProfileData,
    tagsDisponibles,
    availableMembers,
    loadingMembers,
    startSimulation,
    stopSimulation
  };

  return (
    <ViewSimulatorContext.Provider value={contextValue}>
      {children}
    </ViewSimulatorContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder à l'état du simulateur de vue.
 * Fournit un fallback sécurisé si utilisé en dehors du Provider.
 */
export function useViewSimulator() {
  const ctx = useContext(ViewSimulatorContext);
  if (!ctx) {
    return {
      isSimulating: false,
      simulationTarget: null,
      effectiveProfile: null,
      effectiveUserTags: [],
      realProfileData: null,
      tagsDisponibles: [],
      availableMembers: [],
      loadingMembers: false,
      startSimulation: () => {},
      stopSimulation: () => {}
    };
  }
  return ctx;
}
