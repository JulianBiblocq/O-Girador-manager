// Utilitaires de filtrage, tri, indexation (#01...) et regroupement du Carnet de chants (< 100 lignes).

export function getSongTitle(song) {
  return (song?.titre || '').trim();
}

export function getSongRhythm(song) {
  return (song?.rythme || song?.baque || song?.toadaData?.rythme || '').trim();
}

export function getSongNacao(song) {
  return (song?.nacao || song?.nation || song?.ecole || song?.toadaData?.nation || '').trim();
}

export function formatSongbookIndex(indexOneBased) {
  const n = Number(indexOneBased) || 0;
  if (n <= 0) return '';
  return `#${String(n).padStart(2, '0')}`;
}

export function filterSongbookCandidates(songs = [], { includeArchived = false } = {}) {
  if (!Array.isArray(songs)) return [];
  return songs.filter((s) => {
    if (!s || s.isHidden === true) return false;
    if (!includeArchived && s.isArchived === true) return false;
    return true;
  });
}

function compareText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'fr', { sensitivity: 'base' });
}

export function sortAndIndexSongbookSongs(songs = [], { sortBy = 'title' } = {}) {
  const list = Array.isArray(songs) ? [...songs] : [];
  list.sort((a, b) => {
    if (sortBy === 'rhythm') {
      const ra = getSongRhythm(a);
      const rb = getSongRhythm(b);
      if (ra !== rb) {
        if (!ra) return 1;
        if (!rb) return -1;
        return compareText(ra, rb);
      }
    } else if (sortBy === 'nacao') {
      const na = getSongNacao(a);
      const nb = getSongNacao(b);
      if (na !== nb) {
        if (!na) return 1;
        if (!nb) return -1;
        return compareText(na, nb);
      }
    }
    return compareText(getSongTitle(a), getSongTitle(b));
  });

  return list.map((song, idx) => ({
    song,
    index: idx + 1,
    formattedIndex: formatSongbookIndex(idx + 1)
  }));
}

export function groupIndexedSongsForToc(indexedSongs = [], sortBy = 'title', fallbackGroupLabel = 'Traditionnel') {
  if (sortBy !== 'rhythm' && sortBy !== 'nacao') {
    return [{ groupTitle: null, items: indexedSongs }];
  }
  const groups = [];
  const byKey = new Map();
  for (const item of indexedSongs) {
    const rawGroup = sortBy === 'rhythm' ? getSongRhythm(item.song) : getSongNacao(item.song);
    const label = rawGroup || fallbackGroupLabel;
    if (!byKey.has(label)) {
      const bucket = { groupTitle: label, items: [] };
      byKey.set(label, bucket);
      groups.push(bucket);
    }
    byKey.get(label).items.push(item);
  }
  return groups;
}

// Bascule l'identifiant d'un chant dans l'ensemble des exclusions du Carnet.
export function toggleExcludedSongId(prevSet, id) {
  const next = new Set(prevSet);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

// Prépare la sélection complète (candidats, identifiants retenus et liste indexée) du Carnet.
export function buildSongbookSelection(songs = [], { includeArchived = false, excludedIds = new Set(), sortBy = 'title' } = {}) {
  const candidateSongs = filterSongbookCandidates(songs, { includeArchived });
  const selectedSongs = candidateSongs.filter((s) => !excludedIds.has(s.id));
  const selectedIds = new Set(selectedSongs.map((s) => s.id));
  const indexedSongs = sortAndIndexSongbookSongs(selectedSongs, { sortBy });
  return { candidateSongs, selectedIds, indexedSongs };
}
