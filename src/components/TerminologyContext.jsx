import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from './LanguageContext';
import { 
  getUniverseTerminology, 
  normalizeUniverseId,
  UNIVERSE_TERMINOLOGY 
} from '../constants/universeDefaults';

// Valeurs par défaut sécurisées pour usage hors Provider
const defaultTerminology = {
  universeId: 'maracatu',
  majoriteFeminine: false,
  terminology: UNIVERSE_TERMINOLOGY.maracatu,
  leaderLabel: "Mestre",
  leaderFemLabel: "Mestra",
  leaderDimLabel: "Mestrinho",
  leaderDimFemLabel: "Mestrinha",
  sectionLabel: "Pupitre",
  eventLabel: "Cortejo",
  songsLabel: "Toadas",
  playerLabel: "Batuqueiro",
  tPlural: (keyOrMasc, fem) => {
    if (fem !== undefined) return keyOrMasc;
    const entry = pluralsDictionary['fr']?.[keyOrMasc];
    return entry ? entry.masc : keyOrMasc;
  },
  tRole: (roleKey, gender) => {
    const normalizedRole = (roleKey || '').toLowerCase();
    const normalizedGender = (gender || '').toLowerCase();
    if (normalizedRole === 'mestrinho' || normalizedRole === 'mestrinha') {
      if (normalizedRole === 'mestrinha' || normalizedGender === 'femme') return "Mestrinha";
      return "Mestrinho";
    }
    const entry = rolesDictionary['fr']?.[normalizedRole];
    if (!entry) return roleKey;
    if (normalizedGender === 'femme') return entry.femme;
    if (normalizedGender === 'homme') return entry.homme;
    return entry.autre;
  }
};

const TerminologyContext = createContext(defaultTerminology);

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
    mestra: { homme: "Mestre", femme: "Mestra", autre: "Mestra" },
    mestrinho: { homme: "Mestrinho", femme: "Mestrinha", autre: "Mestrinho" },
    mestrinha: { homme: "Mestrinho", femme: "Mestrinha", autre: "Mestrinha" },
    'super-admin': { homme: "Administrateur", femme: "Administratrice", autre: "Administrateur" },
    admin: { homme: "Administrateur", femme: "Administratrice", autre: "Administrateur" },
    membre: { homme: "Adhérent", femme: "Adhérente", autre: "Membre" },
    tresorier: { homme: "Trésorier", femme: "Trésorière", autre: "Trésorier" },
    president: { homme: "Président", femme: "Présidente", autre: "Président" },
    batuqueiro: { homme: "Batuqueiro", femme: "Batuqueira", autre: "Batuqueiro" }
  },
  pt: {
    mestre: { homme: "Mestre", femme: "Mestra", autre: "Mestre" },
    mestra: { homme: "Mestre", femme: "Mestra", autre: "Mestra" },
    mestrinho: { homme: "Mestrinho", femme: "Mestrinha", autre: "Mestrinho" },
    mestrinha: { homme: "Mestrinho", femme: "Mestrinha", autre: "Mestrinha" },
    'super-admin': { homme: "Administrador", femme: "Administradora", autre: "Administrador" },
    admin: { homme: "Administrador", femme: "Administradora", autre: "Administrador" },
    membre: { homme: "Associado", femme: "Associada", autre: "Membro" },
    tresorier: { homme: "Tesoureiro", femme: "Tesoureira", autre: "Tesoureiro" },
    president: { homme: "Presidente", femme: "Presidente", autre: "Presidente" },
    batuqueiro: { homme: "Batuqueiro", femme: "Batuqueira", autre: "Batuqueiro" }
  }
};

export function TerminologyProvider({ majoriteFeminine = false, universeId = 'maracatu', children }) {
  const { locale } = useTranslation();
  const effectiveUniverse = useMemo(() => normalizeUniverseId(universeId), [universeId]);
  const term = useMemo(() => getUniverseTerminology(effectiveUniverse), [effectiveUniverse]);

  const tPlural = (keyOrMasc, fem) => {
    if (fem === undefined) {
      if (keyOrMasc === 'batuqueiros' || keyOrMasc === 'ritmistas' || keyOrMasc === 'players') {
        if (locale === 'pt') {
          return majoriteFeminine ? term.ptPluralFem : term.ptPluralMasc;
        }
        return majoriteFeminine ? term.pluralFem : term.pluralMasc;
      }
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

    // Rôles dynamiques contextualisés par univers (Batuqueiro / Ritmista / Capoeirista)
    if (normalizedRole === 'batuqueiro' || normalizedRole === 'ritmista' || normalizedRole === 'player' || normalizedRole === 'joueur') {
      if (normalizedGender === 'femme') return term.playerFem;
      if (normalizedGender === 'homme') return term.playerMasc;
      return majoriteFeminine ? term.playerFem : term.playerMasc;
    }

    // Titres de direction et déclinaisons : Mestre, Mestra, Mestrinho, Mestrinha
    if (normalizedRole === 'mestrinho' || normalizedRole === 'mestrinha') {
      if (normalizedRole === 'mestrinha' || normalizedGender === 'femme') {
        return term.leaderDimFem || "Mestrinha";
      }
      if (normalizedGender === 'homme') {
        return term.leaderDimMasc || "Mestrinho";
      }
      return majoriteFeminine ? (term.leaderDimFem || "Mestrinha") : (term.leaderDimMasc || "Mestrinho");
    }

    if (normalizedRole === 'mestre' || normalizedRole === 'mestra' || normalizedRole === 'leader') {
      if (normalizedRole === 'mestra' || normalizedGender === 'femme') {
        return term.leaderFem || term.leader;
      }
      if (normalizedGender === 'homme') {
        return term.leader;
      }
      return majoriteFeminine ? (term.leaderFem || term.leader) : term.leader;
    }

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

  const contextValue = useMemo(() => ({
    universeId: effectiveUniverse,
    majoriteFeminine,
    terminology: term,
    leaderLabel: majoriteFeminine ? (term.leaderFem || term.leader) : term.leader,
    leaderFemLabel: term.leaderFem || term.leader,
    leaderDimLabel: majoriteFeminine ? (term.leaderDimFem || "Mestrinha") : (term.leaderDimMasc || "Mestrinho"),
    leaderDimFemLabel: term.leaderDimFem || "Mestrinha",
    sectionLabel: term.section,
    eventLabel: term.event,
    songsLabel: term.songs,
    playerLabel: majoriteFeminine ? term.playerFem : term.playerMasc,
    tPlural,
    tRole
  }), [effectiveUniverse, majoriteFeminine, term, locale]);

  return (
    <TerminologyContext.Provider value={contextValue}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminologyContext() {
  const context = useContext(TerminologyContext);
  return context || defaultTerminology;
}
