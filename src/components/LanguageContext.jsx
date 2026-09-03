import React, { useState, useEffect } from 'react';
import { fr } from '../locales/fr';
import { pt } from '../locales/pt';
import { LanguageContext } from '../context/languageContext';

const translations = { fr, pt };

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved === 'fr' || saved === 'pt') return saved;
    
    // Auto-detect browser language
    const browserLang = navigator.language || '';
    if (browserLang.toLowerCase().startsWith('pt')) {
      return 'pt';
    }
    return 'fr';
  });

  useEffect(() => {
    localStorage.setItem('preferredLanguage', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const toggleLanguage = () => {
    setLocale(prev => (prev === 'fr' ? 'pt' : 'fr'));
  };

  const t = (path, params) => {
    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Option de repli vers le français si la clé de traduction est manquante
        let fallbackValue = translations['fr'];
        for (const fKey of keys) {
          if (fallbackValue && fallbackValue[fKey] !== undefined) {
            fallbackValue = fallbackValue[fKey];
          } else {
            fallbackValue = path; // Retourne le chemin brut si non trouvé
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }

    // Remplacement dynamique des variables dans la chaîne (ex: {day})
    if (typeof value === 'string' && params !== undefined && params !== null) {
      if (typeof params === 'object') {
        Object.keys(params).forEach((paramKey) => {
          value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
        });
      } else {
        value = value.replace(/\{day\}/g, String(params)).replace(/\{0\}/g, String(params));
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
