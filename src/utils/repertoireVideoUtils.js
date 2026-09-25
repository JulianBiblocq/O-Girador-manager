/**
 * Utilitaires de classification et de normalisation des vidéos du répertoire (< 180 lignes).
 * Gère la hiérarchie à 2 niveaux (Familles d'instruments + Sous-voix et Vidéos Live).
 */

// Familles canoniques et mots-clés d'association
export const FAMILIES_CONFIG = [
  {
    id: 'alfaias',
    label: 'Alfaias',
    icon: '🥁',
    keywords: ['alfaia', 'marcante', 'meiao', 'meião', 'repique']
  },
  {
    id: 'caixas',
    label: 'Caixas',
    icon: '🥁',
    keywords: ['caixa', 'tarol', 'guerra']
  },
  {
    id: 'gongue',
    label: 'Gonguê',
    icon: '🔔',
    keywords: ['gongue', 'gonguê', 'campana', 'cloche']
  },
  {
    id: 'sementes',
    label: 'Sementes',
    icon: '🪇',
    keywords: ['agbe', 'agbê', 'mineiro', 'shekere', 'xequere', 'xequerê', 'ganza', 'ganzá', 'chocalho', 'abê', 'abe', 'semente']
  }
];

export const LIVE_FAMILY = {
  id: 'live_ensemble',
  label: '🎪 Live / Ensemble',
  icon: '🎪',
  isLive: true
};

/**
 * Normalise un objet vidéo avec rétrocompatibilité complète.
 */
export function normalizeVideoItem(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return null;
    return { url: trimmed, titre: 'Vidéo', instruments: [], isLiveOrGlobal: true };
  }
  const url = (v.url || '').trim();
  if (!url) return null;

  let instruments = [];
  if (Array.isArray(v.instruments)) {
    instruments = v.instruments.map((i) => (i || '').trim()).filter(Boolean);
  } else if (typeof v.instruments === 'string' && v.instruments.trim()) {
    instruments = v.instruments.split(',').map((i) => i.trim()).filter(Boolean);
  } else if (v.pupitre) {
    instruments = [v.pupitre.trim()];
  }

  const isLiveOrGlobal = Boolean(
    v.isLiveOrGlobal ||
    instruments.length === 0 ||
    instruments.some((i) => {
      const low = i.toLowerCase();
      return low.includes('tous') || low.includes('globale') || low.includes('ensemble') || low.includes('live');
    })
  );

  return {
    id: v.id || `vid_${Math.random().toString(36).substr(2, 9)}`,
    url,
    titre: (v.titre || '').trim(),
    instruments,
    isLiveOrGlobal
  };
}

/**
 * Associe un nom d'instrument à une famille canonique.
 */
export function matchInstrumentFamily(instrumentName) {
  if (!instrumentName) return null;
  const low = instrumentName.toLowerCase().trim();

  for (const fam of FAMILIES_CONFIG) {
    if (fam.keywords.some((k) => low.includes(k))) {
      return fam.id;
    }
  }
  return null;
}

/**
 * Regroupe les vidéos d'un morceau en familles de niveau 1 et sous-vidéos de niveau 2.
 * @param {Array} videos - Tableau de vidéos brutes ou normalisées
 * @param {string} defaultVideoUrl - URL de secours historique
 * @param {Array} instrumentsList - Pupitres configurés dans l'association
 * @returns {Array} Liste des blocs de niveau 1 avec leurs sous-vidéos
 */
export function groupVideosByFamily(videos = [], defaultVideoUrl = '', _instrumentsList = []) {
  const normalized = [];

  if (Array.isArray(videos)) {
    videos.forEach((v) => {
      const norm = normalizeVideoItem(v);
      if (norm) normalized.push(norm);
    });
  }

  // Fallback URL par défaut si aucune vidéo
  if (normalized.length === 0 && defaultVideoUrl && typeof defaultVideoUrl === 'string' && defaultVideoUrl.trim()) {
    normalized.push({
      id: 'default_video',
      url: defaultVideoUrl.trim(),
      titre: 'Vidéo du morceau',
      instruments: [],
      isLiveOrGlobal: true
    });
  }

  if (normalized.length === 0) return [];

  // Mappage par blocs
  const familyMap = new Map();

  // Initialisation des blocs prédéfinis
  FAMILIES_CONFIG.forEach((f) => {
    familyMap.set(f.id, { ...f, videos: [] });
  });
  familyMap.set(LIVE_FAMILY.id, { ...LIVE_FAMILY, videos: [] });

  // Affectation des vidéos aux blocs
  normalized.forEach((video) => {
    if (video.isLiveOrGlobal || video.instruments.length === 0) {
      familyMap.get(LIVE_FAMILY.id).videos.push(video);
      return;
    }

    let matchedAny = false;
    const assignedFamilies = new Set();

    video.instruments.forEach((inst) => {
      const famId = matchInstrumentFamily(inst);
      if (famId && familyMap.has(famId)) {
        assignedFamilies.add(famId);
        matchedAny = true;
      }
    });

    if (matchedAny) {
      assignedFamilies.forEach((fId) => {
        familyMap.get(fId).videos.push(video);
      });
    } else {
      // Si l'instrument est spécifique mais hors des 4 grandes familles, créer un bloc dédié ou repli sur Live
      const customName = video.instruments[0] || 'Autre';
      const customId = `custom_${customName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      if (!familyMap.has(customId)) {
        familyMap.set(customId, {
          id: customId,
          label: customName,
          icon: '🎶',
          videos: []
        });
      }
      familyMap.get(customId).videos.push(video);
    }
  });

  // Filtrer pour ne conserver que les blocs qui contiennent au moins une vidéo
  const activeBlocks = [];
  familyMap.forEach((block) => {
    if (block.videos.length > 0) {
      activeBlocks.push(block);
    }
  });

  return activeBlocks;
}

/**
 * Détermine l'ID du bloc actif par défaut selon l'instrument de l'utilisateur.
 */
export function getDefaultActiveBlockId(blocks = [], userInstrument = '') {
  if (!blocks || blocks.length === 0) return '';
  if (blocks.length === 1) return blocks[0].id;

  const userInstNorm = (userInstrument || '').toLowerCase().trim();

  // 1. Chercher si la famille de l'instrument de l'utilisateur est disponible
  if (userInstNorm) {
    const userFamId = matchInstrumentFamily(userInstNorm);
    if (userFamId) {
      const match = blocks.find((b) => b.id === userFamId);
      if (match) return match.id;
    }
    // Match direct par label
    const directMatch = blocks.find((b) => b.label.toLowerCase().includes(userInstNorm));
    if (directMatch) return directMatch.id;
  }

  // 2. À défaut, le bloc "Live / Ensemble"
  const liveBlock = blocks.find((b) => b.id === LIVE_FAMILY.id);
  if (liveBlock) return liveBlock.id;

  // 3. À défaut, le premier bloc disponible
  return blocks[0].id;
}
