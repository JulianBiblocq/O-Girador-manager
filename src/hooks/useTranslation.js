// Hook personnalisé useTranslation pour la gestion des traductions bilingues (FR / PT)
import { useContext } from 'react';
import { LanguageContext } from '../context/languageContext';

/**
 * Hook personnalisé consommant le contexte linguistique global.
 * Conforme à la règle modulaire et à l'architecture Fast Refresh de Vite.
 */
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
