import { useState, useEffect, useCallback } from 'react';
import { getPoleGuide, POLE_GUIDES } from '../config/poleGuides.js';

/**
 * Résolution déterministe de la clé de guide correspondant au contenu affiché.
 * Priorise l'onglet dédié s'il possède un guide dans POLE_GUIDES,
 * sinon se replie sur le pôle parent ou le premier identifiant disponible.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {string} Clé unique du guide
 */
export function getGuideKey(tabId, poleId) {
  if (tabId && POLE_GUIDES[tabId]) return tabId;
  if (poleId && POLE_GUIDES[poleId]) return poleId;
  return tabId || poleId || '';
}

/**
 * Fonction pure utilitaire : lecture synchrone et immédiate de l'état masqué dans le localStorage.
 * Déportée en dehors du hook pour garantir un premier rendu sans sursaut visuel.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {boolean} true si l'aide doit être masquée, false sinon
 */
export function readHiddenState(tabId, poleId) {
  if (typeof window === 'undefined') return true;
  const guideKey = getGuideKey(tabId, poleId);
  if (!guideKey) return true;
  try {
    // Si l'utilisateur a explicitement demandé d'afficher ce guide ('false'), alors isHidden = false
    if (
      localStorage.getItem(`pole_guide_hidden_${guideKey}`) === 'false' ||
      (tabId && localStorage.getItem(`pole_guide_hidden_${tabId}`) === 'false') ||
      (poleId && localStorage.getItem(`pole_guide_hidden_${poleId}`) === 'false')
    ) {
      return false;
    }
    // Par défaut, l'aide reste masquée : elle ne s'ouvre que lorsque l'utilisateur clique sur le bouton 💡
    return true;
  } catch (e) {
    return true;
  }
}

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
 * @returns {Object} { guide, guideKey, isHidden, hideBanner, showBanner, toggleBanner }
 */
export function usePoleGuide(tabId, poleId) {
  // Clé d'identification unique et résolue du guide
  const guideKey = getGuideKey(tabId, poleId);

  // Résolution du guide à partir du fichier de configuration
  const guide = getPoleGuide(tabId, poleId);

  // 1. Initialisation synchrone de l'état masqué depuis le localStorage
  const [isHidden, setIsHidden] = useState(() => readHiddenState(tabId, poleId));

  // 2. Synchronisation réactive au changement d'onglet ou lors d'événements de stockage
  useEffect(() => {
    setIsHidden(readHiddenState(tabId, poleId));

    const handleSync = () => {
      setIsHidden(readHiddenState(tabId, poleId));
    };

    window.addEventListener('pole-guide-changed', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('pole-guide-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [tabId, poleId]);

  // 3. Masquer la bannière d'aide immédiatement avec persistance locale
  const hideBanner = useCallback(() => {
    const key = getGuideKey(tabId, poleId);
    if (!key || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`pole_guide_hidden_${key}`, 'true');
      if (tabId) localStorage.setItem(`pole_guide_hidden_${tabId}`, 'true');
      if (poleId) localStorage.setItem(`pole_guide_hidden_${poleId}`, 'true');
      setIsHidden(true);
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [tabId, poleId]);

  // 4. Afficher / Réouvrir la bannière d'aide pour l'onglet courant
  const showBanner = useCallback(() => {
    const key = getGuideKey(tabId, poleId);
    if (!key || typeof window === 'undefined') return;
    try {
      localStorage.setItem(`pole_guide_hidden_${key}`, 'false');
      if (tabId) localStorage.setItem(`pole_guide_hidden_${tabId}`, 'false');
      if (poleId) localStorage.setItem(`pole_guide_hidden_${poleId}`, 'false');
      setIsHidden(false);
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [tabId, poleId]);

  // 5. Basculer l'état masqué / affiché
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
