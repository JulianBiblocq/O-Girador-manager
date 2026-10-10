/**
 * Référentiel centralisé des Univers Culturels, Instruments par défaut et Vocabulaire métier
 * Écosystème O Girador — Organizad'Or
 */

export const UNIVERSE_DEFAULT_INSTRUMENTS = {
  maracatu: [
    "Alfaia",
    "Caixa",
    "Tarol",
    "Gonguê",
    "Agbê",
    "Mineiro",
    "Timbal",
    "Chant",
    "Danse"
  ],
  batucada: [
    "Surdo 1",
    "Surdo 2",
    "Surdo 3",
    "Repique",
    "Caixa",
    "Timba",
    "Chocalho",
    "Tambourin",
    "Agogô",
    "Chant",
    "Danse"
  ],
  sambareggae: [
    "Surdo Fundo",
    "Surdo Dobra",
    "Surdo Resposta",
    "Repique",
    "Timbal",
    "Caixa",
    "Chant",
    "Danse"
  ],
  samba: [
    "Surdo 1 (Primeira)",
    "Surdo 2 (Segunda)",
    "Surdo 3 (Terceira)",
    "Caixa de Guerra",
    "Tarol",
    "Repinique",
    "Tamborim",
    "Chocalho",
    "Cuíca",
    "Agogô",
    "Chant",
    "Passistas"
  ],
  capoeira: [
    "Berimbau Gunga",
    "Berimbau Médio",
    "Berimbau Viola",
    "Pandeiro",
    "Atabaque",
    "Agogô",
    "Chant"
  ]
};

export const UNIVERSE_TERMINOLOGY = {
  maracatu: {
    id: 'maracatu',
    name: 'Maracatu de Baque Virado',
    playerMasc: "Batuqueiro",
    playerFem: "Batuqueira",
    pluralMasc: "Les batuqueiros",
    pluralFem: "Les batuqueiras",
    ptPluralMasc: "Os batuqueiros",
    ptPluralFem: "As batuqueiras",
    leader: "Mestre",
    leaderFem: "Mestra",
    leaderDimMasc: "Mestrinho",
    leaderDimFem: "Mestrinha",
    section: "Pupitre",
    event: "Cortejo",
    songs: "Toadas"
  },
  batucada: {
    id: 'batucada',
    name: 'Batucada',
    playerMasc: "Batuqueiro",
    playerFem: "Batuqueira",
    pluralMasc: "Les batuqueiros",
    pluralFem: "Les batuqueiras",
    ptPluralMasc: "Os batuqueiros",
    ptPluralFem: "As batuqueiras",
    leader: "Mestre",
    leaderFem: "Mestra",
    leaderDimMasc: "Mestrinho",
    leaderDimFem: "Mestrinha",
    section: "Pupitre",
    event: "Défilé de rue",
    songs: "Morceaux"
  },
  sambareggae: {
    id: 'sambareggae',
    name: 'Samba-Reggae & Blocos Afro',
    playerMasc: "Batuqueiro",
    playerFem: "Batuqueira",
    pluralMasc: "Les batuqueiros",
    pluralFem: "Les batuqueiras",
    ptPluralMasc: "Os batuqueiros",
    ptPluralFem: "As batuqueiras",
    leader: "Mestre",
    leaderFem: "Mestra",
    leaderDimMasc: "Mestrinho",
    leaderDimFem: "Mestrinha",
    section: "Pupitre",
    event: "Défilé de rue",
    songs: "Morceaux"
  },
  samba: {
    id: 'samba',
    name: 'Bateria & Samba',
    playerMasc: "Ritmista",
    playerFem: "Ritmista",
    pluralMasc: "Les ritmistas",
    pluralFem: "Les ritmistas",
    ptPluralMasc: "Os ritmistas",
    ptPluralFem: "As ritmistas",
    leader: "Mestre de Bateria",
    leaderFem: "Mestra de Bateria",
    leaderDimMasc: "Mestrinho de Bateria",
    leaderDimFem: "Mestrinha de Bateria",
    section: "Naipe",
    event: "Desfile",
    songs: "Sambas-Enredo"
  },
  capoeira: {
    id: 'capoeira',
    name: 'Capoeira Regional & Angola',
    playerMasc: "Capoeirista",
    playerFem: "Capoeirista",
    pluralMasc: "Les capoeiristes",
    pluralFem: "Les capoeiristes",
    ptPluralMasc: "Os capoeiristas",
    ptPluralFem: "As capoeiristas",
    leader: "Mestre",
    leaderFem: "Mestra",
    leaderDimMasc: "Mestrinho",
    leaderDimFem: "Mestrinha",
    section: "Roda",
    event: "Roda",
    songs: "Ladainhas"
  }
};

/**
 * Normalise l'identifiant d'univers avec repli strict sur 'maracatu'
 * @param {string} universeId 
 * @returns {'maracatu' | 'batucada' | 'sambareggae' | 'samba' | 'capoeira'}
 */
export function normalizeUniverseId(universeId) {
  if (!universeId || typeof universeId !== 'string') return 'maracatu';
  const clean = universeId.trim().toLowerCase();
  if (UNIVERSE_DEFAULT_INSTRUMENTS[clean]) {
    return clean;
  }
  return 'maracatu';
}

/**
 * Récupère la liste des instruments par défaut selon l'univers
 * @param {string} universeId 
 * @returns {string[]}
 */
export function getUniverseDefaultInstruments(universeId) {
  const norm = normalizeUniverseId(universeId);
  return [...(UNIVERSE_DEFAULT_INSTRUMENTS[norm] || UNIVERSE_DEFAULT_INSTRUMENTS.maracatu)];
}

/**
 * Récupère le dictionnaire de terminologie selon l'univers
 * @param {string} universeId 
 * @returns {typeof UNIVERSE_TERMINOLOGY['maracatu']}
 */
export function getUniverseTerminology(universeId) {
  const norm = normalizeUniverseId(universeId);
  return UNIVERSE_TERMINOLOGY[norm] || UNIVERSE_TERMINOLOGY.maracatu;
}
