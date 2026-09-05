import { useState, useEffect, useCallback } from 'react';
import { getPoleGuide, POLE_GUIDES } from '../config/poleGuides';

/**
 * Hook personnalisé React : usePoleGuide
 * 
 * Gère l'accès au contenu d'aide contextuelle pour l'onglet et le pôle courants,
 * ainsi que la persistance infaillible de l'état d'affichage (Masqué / Affiché) dans le localStorage.
 * 
 * Garantit que lorsqu'un utilisateur clique sur "Compris / Masquer", l'aide ne se rouvre JAMAIS
 * lorsqu'il revient sur cet onglet ou cette vue, tout en permettant une réouverture manuelle
 * via la petite icône d'ampoule 💡.
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

  // Fonction de lecture de l'état masqué dans le localStorage
  const readStateFromStorage = useCallback(() => {
    if (!guideKey) return false;
    try {
      // 1. Vérification pour l'onglet spécifique
      if (tabId && localStorage.getItem(`pole_guide_hidden_${tabId}`) === 'true') {
        return true;
      }
      // 2. Vérification pour la clé directe
      if (localStorage.getItem(`pole_guide_hidden_${guideKey}`) === 'true') {
        return true;
      }
      // 3. Si l'aide affichée est celle du pôle global
      if (poleId && (!tabId || !POLE_GUIDES[tabId]) && localStorage.getItem(`pole_guide_hidden_${poleId}`) === 'true') {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }, [guideKey, tabId, poleId]);

  // Suivi de la clé précédente pour mise à jour synchrone dès le rendu
  const [prevGuideKey, setPrevGuideKey] = useState(guideKey);
  const [isHidden, setIsHidden] = useState(readStateFromStorage);

  // Synchronisation immédiate pendant le render React lors d'un changement d'onglet
  if (prevGuideKey !== guideKey) {
    setPrevGuideKey(guideKey);
    setIsHidden(readStateFromStorage());
  }

  // Écoute des événements de synchronisation (changement dans d'autres fenêtres ou composants)
  useEffect(() => {
    const handleCustomChange = () => {
      setIsHidden(readStateFromStorage());
    };

    const handleStorageChange = (e) => {
      if (
        e.key === `pole_guide_hidden_${guideKey}` ||
        (tabId && e.key === `pole_guide_hidden_${tabId}`) ||
        (poleId && e.key === `pole_guide_hidden_${poleId}`)
      ) {
        setIsHidden(readStateFromStorage());
      }
    };

    window.addEventListener('pole-guide-changed', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('pole-guide-changed', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [guideKey, tabId, poleId, readStateFromStorage]);

  // Masquer la bannière d'aide pour l'onglet et la page courante
  const hideBanner = useCallback(() => {
    if (!guideKey) return;
    try {
      if (tabId) {
        localStorage.setItem(`pole_guide_hidden_${tabId}`, 'true');
      }
      if (poleId && (!tabId || !POLE_GUIDES[tabId])) {
        localStorage.setItem(`pole_guide_hidden_${poleId}`, 'true');
      }
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'true');
      setIsHidden(true);
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [guideKey, tabId, poleId]);

  // Afficher / Réouvrir la bannière d'aide pour l'onglet courant
  const showBanner = useCallback(() => {
    if (!guideKey) return;
    try {
      if (tabId) {
        localStorage.setItem(`pole_guide_hidden_${tabId}`, 'false');
      }
      if (poleId && (!tabId || !POLE_GUIDES[tabId])) {
        localStorage.setItem(`pole_guide_hidden_${poleId}`, 'false');
      }
      localStorage.setItem(`pole_guide_hidden_${guideKey}`, 'false');
      setIsHidden(false);
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [guideKey, tabId, poleId]);

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
