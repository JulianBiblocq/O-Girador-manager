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

  // État local masqué / affiché
  const [isHidden, setIsHidden] = useState(false);

  // Synchronisation de l'état masqué depuis le localStorage à chaque changement de clé
  useEffect(() => {
    if (!guideKey) {
      setIsHidden(false);
      return;
    }

    try {
      const storedState = localStorage.getItem(`pole_guide_hidden_${guideKey}`);
      setIsHidden(storedState === 'true');
    } catch (e) {
      // Gestion silencieuse si l'accès au localStorage est restreint
      setIsHidden(false);
    }
  }, [guideKey]);

  // Masquer la bannière d'aide pour la clé courante
  const hideBanner = useCallback(() => {
    if (!guideKey) return;
    setIsHidden(true);
    try {
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'true');
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [guideKey]);

  // Afficher / Réouvrir la bannière d'aide pour la clé courante
  const showBanner = useCallback(() => {
    if (!guideKey) return;
    setIsHidden(false);
    try {
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'false');
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
