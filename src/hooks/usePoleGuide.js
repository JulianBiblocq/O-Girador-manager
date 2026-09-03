import { useState, useEffect, useCallback } from 'react';
import { getPoleGuide } from '../config/poleGuides';

/**
 * Hook personnalisé React : usePoleGuide
 * 
 * Gère l'accès au contenu d'aide contextuelle pour l'onglet et le pôle courants,
 * ainsi que la persistance de l'état d'affichage (Masqué / Affiché) dans le localStorage.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {Object} { guide, isHidden, hideBanner, showBanner, toggleBanner }
 */
export function usePoleGuide(tabId, poleId) {
  // Clé d'identification unique de l'emplacement courant
  const guideKey = tabId || poleId;

  // Résolution du guide à partir du fichier de configuration
  const guide = getPoleGuide(tabId, poleId);

  // Fonction utilitaire pour lire l'état actuel depuis le localStorage
  const readStateFromStorage = useCallback(() => {
    if (!guideKey) return false;
    try {
      return localStorage.getItem(`pole_guide_hidden_${guideKey}`) === 'true';
    } catch (e) {
      return false;
    }
  }, [guideKey]);

  // État local masqué / affiché initialisé de manière synchrone
  const [isHidden, setIsHidden] = useState(readStateFromStorage);

  // Synchronisation de l'état masqué 
  useEffect(() => {
    // 1. Initialisation au changement de clé
    setIsHidden(readStateFromStorage());

    // 2. Gestion des événements synchronisés (Même fenêtre)
    const handleCustomChange = () => {
      setIsHidden(readStateFromStorage());
    };

    // 3. Gestion des événements synchronisés (Autres onglets du navigateur)
    const handleStorageChange = (e) => {
      if (e.key === `pole_guide_hidden_${guideKey}`) {
        setIsHidden(e.newValue === 'true');
      }
    };

    window.addEventListener('pole-guide-changed', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('pole-guide-changed', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [guideKey, readStateFromStorage]);

  // Masquer la bannière d'aide pour la clé courante
  const hideBanner = useCallback(() => {
    if (!guideKey) return;
    try {
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'true');
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [guideKey]);

  // Afficher / Réouvrir la bannière d'aide pour la clé courante
  const showBanner = useCallback(() => {
    if (!guideKey) return;
    try {
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'false');
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [guideKey]);

  // Basculer l'état masqué / affiché
  const toggleBanner = useCallback(() => {
    if (isHidden) {
      showBanner();
    } else {
      hideBanner();
    }
  }, [isHidden, showBanner, hideBanner]);

  return {
    guide,
    guideKey,
    isHidden,
    hideBanner,
    showBanner,
    toggleBanner
  };
}
