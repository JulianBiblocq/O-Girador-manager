import React, { useState, useEffect } from 'react';
import { fr } from '../locales/fr';
import { pt } from '../locales/pt';
import { LanguageContext } from '../context/languageContext';

const translations = { fr, pt };

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    try {
      const saved = localStorage.getItem('preferredLanguage');
      if (saved === 'fr' || saved === 'pt') return saved;
      
      // Détection automatique de la langue du navigateur
      const browserLang = typeof navigator !== 'undefined' ? (navigator.language || '') : '';
      if (browserLang.toLowerCase().startsWith('pt')) {
        return 'pt';
      }
    } catch {}
    return 'fr';
  });

  useEffect(() => {
    try {
      localStorage.setItem('preferredLanguage', locale);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const toggleLanguage = () => {
    setLocale(prev => (prev === 'fr' ? 'pt' : 'fr'));
  };

  const t = (path, fallbackOrParams, maybeParams) => {
    const fallbackStr = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
    const interpParams =
      maybeParams !== undefined && maybeParams !== null
        ? maybeParams
        : fallbackStr === undefined
          ? fallbackOrParams
          : undefined;

    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Repli vers le français si la clé de traduction est manquante dans la langue active
        let fallbackValue = translations['fr'];
        for (const fKey of keys) {
          if (fallbackValue && fallbackValue[fKey] !== undefined) {
            fallbackValue = fallbackValue[fKey];
          } else {
            fallbackValue = fallbackStr && fallbackStr.trim().length > 0 ? fallbackStr : undefined;
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }

    // Remplacement dynamique des variables dans la chaîne (ex: {name} ou {{name}})
    if (typeof value === 'string' && interpParams !== undefined && interpParams !== null) {
      if (typeof interpParams === 'object') {
        Object.keys(interpParams).forEach((paramKey) => {
          const replacement = interpParams[paramKey];
          if (replacement !== undefined && replacement !== null) {
            value = value.replace(new RegExp(`\\{\\{?${paramKey}\\}\\}?`, 'g'), String(replacement));
          }
        });
      } else {
        value = value.replace(/\{\{?(day|0)\}\}?/g, String(interpParams));
      }
    }

    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Ré-exportation pour compatibilité ascendante totale
export { useTranslation } from '../hooks/useTranslation';
