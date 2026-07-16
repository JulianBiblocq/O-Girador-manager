import React, { createContext, useContext } from 'react';
import { useTranslation } from './LanguageContext';

const TerminologyContext = createContext();

// Dictionnaire des pluriels standardisés
export const pluralsDictionary = {
  fr: {
    inscrits: { masc: "Tous les inscrits", fem: "Toutes les inscrites" },
    batuqueiros: { masc: "Les batuqueiros", fem: "Les batuqueiras" }
  },
  pt: {
    inscrits: { masc: "Todos os inscritos", fem: "Todas as inscritas" },
    batuqueiros: { masc: "Os batuqueiros", fem: "As batuqueiras" }
  }
};

// Dictionnaire des rôles standardisés
export const rolesDictionary = {
  fr: {
    mestre: { homme: "Mestre", femme: "Mestra", autre: "Mestre" },
    'super-admin': { homme: "Administrateur", femme: "Administratrice", autre: "Administrateur" },
    membre: { homme: "Adhérent", femme: "Adhérente", autre: "Membre" },
    tresorier: { homme: "Trésorier", femme: "Trésorière", autre: "Trésorier" },
    president: { homme: "Président", femme: "Présidente", autre: "Président" },
    batuqueiro: { homme: "Batuqueiro", femme: "Batuqueira", autre: "Batuqueiro" }
  },
  pt: {
    mestre: { homme: "Mestre", femme: "Mestra", autre: "Mestre" },
    'super-admin': { homme: "Administrador", femme: "Administradora", autre: "Administrador" },
    membre: { homme: "Associado", femme: "Associada", autre: "Membro" },
    tresorier: { homme: "Tesoureiro", femme: "Tesoureira", autre: "Tesoureiro" },
    president: { homme: "Presidente", femme: "Presidente", autre: "Presidente" },
    batuqueiro: { homme: "Batuqueiro", femme: "Batuqueira", autre: "Batuqueiro" }
  }
};

export function TerminologyProvider({ majoriteFeminine = false, children }) {
  const { locale } = useTranslation();
  
  const tPlural = (keyOrMasc, fem) => {
    if (fem === undefined) {
      const langDict = pluralsDictionary[locale] || pluralsDictionary['fr'];
      const entry = langDict[keyOrMasc];
      if (entry) {
        return majoriteFeminine ? entry.fem : entry.masc;
      }
      return keyOrMasc;
    }
    return majoriteFeminine ? fem : keyOrMasc;
  };

  const tRole = (roleKey, gender) => {
    const normalizedRole = (roleKey || '').toLowerCase();
    const normalizedGender = (gender || '').toLowerCase();

    const langDict = rolesDictionary[locale] || rolesDictionary['fr'];
    const entry = langDict[normalizedRole];
    if (!entry) {
      return roleKey;
    }

    if (normalizedGender === 'femme') {
      return entry.femme;
    }
    if (normalizedGender === 'homme') {
      return entry.homme;
    }
    return entry.autre;
  };

  return (
    <TerminologyContext.Provider value={{ majoriteFeminine, tPlural, tRole }}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminologyContext() {
  const context = useContext(TerminologyContext);
  if (!context) {
    throw new Error('useTerminologyContext must be used within a TerminologyProvider');
  }
  return context;
}
