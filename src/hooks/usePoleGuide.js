import { useState, useEffect, useCallback } from 'react';
import { getPoleGuide, POLE_GUIDES } from '../config/poleGuides';

/**
 * Fonction pure utilitaire : lecture synchrone de l'état masqué dans le localStorage.
 * Déportée en dehors du hook pour éviter des instanciations de callbacks et garantir
 * une stabilité absolue de l'ordre des hooks React.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {boolean} true si l'aide doit être masquée, false sinon
 */
function readHiddenState(tabId, poleId) {
  const guideKey = tabId || poleId;
  if (!guideKey || typeof window === 'undefined') return false;
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
  // Clé d'identification unique de l'emplacement courant
  const guideKey = tabId || poleId;

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

  // 3. Masquer la bannière d'aide pour l'onglet et la page courante
  const hideBanner = useCallback(() => {
    const currentKey = tabId || poleId;
    if (!currentKey || typeof window === 'undefined') return;
    try {
      if (tabId) {
        localStorage.setItem(`pole_guide_hidden_${tabId}`, 'true');
      }
      if (poleId && (!tabId || !POLE_GUIDES[tabId])) {
        localStorage.setItem(`pole_guide_hidden_${poleId}`, 'true');
      }
      localStorage.setItem(`pole_guide_hidden_${currentKey}`, 'true');
      setIsHidden(true);
      window.dispatchEvent(new Event('pole-guide-changed'));
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence dans localStorage", e);
    }
  }, [tabId, poleId]);

  // 4. Afficher / Réouvrir la bannière d'aide pour l'onglet courant
  const showBanner = useCallback(() => {
    const currentKey = tabId || poleId;
    if (!currentKey || typeof window === 'undefined') return;
    try {
      if (tabId) {
        localStorage.setItem(`pole_guide_hidden_${tabId}`, 'false');
      }
      if (poleId && (!tabId || !POLE_GUIDES[tabId])) {
        localStorage.setItem(`pole_guide_hidden_${poleId}`, 'false');
      }
      localStorage.setItem(`pole_guide_hidden_${currentKey}`, 'false');
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
