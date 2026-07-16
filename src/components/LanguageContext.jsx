import React, { createContext, useContext, useState, useEffect } from 'react';
import { fr } from '../locales/fr';
import { pt } from '../locales/pt';

const LanguageContext = createContext();

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

  const t = (path) => {
    const keys = path.split('.');
    let value = translations[locale];
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        // Fallback to French if translation key is missing
        let fallbackValue = translations['fr'];
        for (const fKey of keys) {
          if (fallbackValue && fallbackValue[fKey] !== undefined) {
            fallbackValue = fallbackValue[fKey];
          } else {
            fallbackValue = path; // Return path if not found
            break;
          }
        }
        return fallbackValue;
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

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
