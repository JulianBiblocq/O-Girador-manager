// Utilitaires purs de normalisation, comparaison et stockage des préférences d'impression Toada (< 130 lignes).
import { cleanFirestorePayload } from './firestoreUtils.js';
import { DEFAULT_PRINT_MARGINS, normalizePrintMargins, arePrintMarginsEqual } from './toadaPrintMarginsUtils.js';

export const TOADA_PRINT_STORAGE_KEY = 'og_toada_print_prefs_v1';
export const VALID_FORMATS = ['A5', 'A4', 'A3'];
export const VALID_COLUMNS_MODES = ['auto', 'single-centered', 'two-columns'];
export const VALID_SORT_MODES = ['title', 'rhythm', 'nacao'];

export const BUILTIN_TOADA_PRINT_PRESETS = [
  { id: 'complet', icon: '📖', labelKey: 'toadaPrint.presetComplet', sections: { original: true, phonetic: true, translation: true, lexicon: true, anecdote: true } },
  { id: 'etude', icon: '🇧🇷', labelKey: 'toadaPrint.presetEtude', sections: { original: true, phonetic: false, translation: true, lexicon: false, anecdote: true } },
  { id: 'pupitre', icon: '🎤', labelKey: 'toadaPrint.presetPupitre', sections: { original: true, phonetic: false, translation: false, lexicon: false, anecdote: false } }
];

export const DEFAULT_SONGBOOK_OPTIONS = {
  includeCover: true,
  includeToc: true,
  sortBy: 'title',
  startOnOddPage: false,
  subtitle: ''
};

export const DEFAULT_TOADA_PRINT_CONFIG = {
  format: 'A4',
  sections: { ...BUILTIN_TOADA_PRINT_PRESETS[0].sections },
  lyricsColumnsMode: 'auto',
  bwMode: false,
  margins: { ...DEFAULT_PRINT_MARGINS },
  songbookOptions: { ...DEFAULT_SONGBOOK_OPTIONS }
};

export function normalizePrintSections(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_TOADA_PRINT_CONFIG.sections };
  const pick = (canon, legacy, fallback = true) => {
    if (typeof raw[canon] === 'boolean') return raw[canon];
    return typeof raw[legacy] === 'boolean' ? raw[legacy] : fallback;
  };
  return {
    original: pick('original', 'originale', true),
    phonetic: pick('phonetic', 'phonetique', true),
    translation: pick('translation', 'traduction', true),
    lexicon: pick('lexicon', 'lexique', true),
    anecdote: typeof raw.anecdote === 'boolean' ? raw.anecdote : true
  };
}

export function normalizeSongbookOptions(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SONGBOOK_OPTIONS };
  return {
    includeCover: typeof raw.includeCover === 'boolean' ? raw.includeCover : true,
    includeToc: typeof raw.includeToc === 'boolean' ? raw.includeToc : true,
    sortBy: VALID_SORT_MODES.includes(raw.sortBy) ? raw.sortBy : 'title',
    startOnOddPage: Boolean(raw.startOnOddPage),
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle.slice(0, 80) : ''
  };
}

export function normalizePrintConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_TOADA_PRINT_CONFIG,
      sections: { ...DEFAULT_TOADA_PRINT_CONFIG.sections },
      margins: { ...DEFAULT_PRINT_MARGINS },
      songbookOptions: { ...DEFAULT_SONGBOOK_OPTIONS }
    };
  }
  return {
    format: VALID_FORMATS.includes(raw.format) ? raw.format : 'A4',
    sections: normalizePrintSections(raw.sections || raw.printSections),
    lyricsColumnsMode: VALID_COLUMNS_MODES.includes(raw.lyricsColumnsMode) ? raw.lyricsColumnsMode : 'auto',
    bwMode: Boolean(raw.bwMode ?? raw.isBW),
    margins: normalizePrintMargins(raw.margins),
    songbookOptions: normalizeSongbookOptions(raw.songbookOptions)
  };
}

export function normalizeCustomPresets(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim())
    .slice(0, 2)
    .map((item, idx) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `preset_${idx + 1}`,
      name: item.name.trim().slice(0, 24),
      config: normalizePrintConfig(item.config)
    }));
}

export function buildPersistedToadaPrintPrefs({ defaultConfig = null, customPresets = [], updatedAt } = {}) {
  return cleanFirestorePayload({
    defaultConfig: defaultConfig ? normalizePrintConfig(defaultConfig) : undefined,
    customPresets: normalizeCustomPresets(customPresets),
    updatedAt: updatedAt || new Date().toISOString()
  }, { removeNull: true });
}

export function arePrintConfigsEqual(a, b) {
  if (!a || !b) return false;
  const na = normalizePrintConfig(a);
  const nb = normalizePrintConfig(b);
  return (
    na.format === nb.format &&
    na.bwMode === nb.bwMode &&
    na.lyricsColumnsMode === nb.lyricsColumnsMode &&
    arePrintMarginsEqual(na.margins, nb.margins) &&
    Object.keys(na.sections).every((k) => na.sections[k] === nb.sections[k]) &&
    na.songbookOptions.includeCover === nb.songbookOptions.includeCover &&
    na.songbookOptions.includeToc === nb.songbookOptions.includeToc &&
    na.songbookOptions.sortBy === nb.songbookOptions.sortBy &&
    na.songbookOptions.startOnOddPage === nb.songbookOptions.startOnOddPage
  );
}

export function detectActiveBuiltinPreset(sections) {
  const norm = normalizePrintSections(sections);
  const match = BUILTIN_TOADA_PRINT_PRESETS.find((p) => Object.keys(p.sections).every((k) => p.sections[k] === norm[k]));
  return match ? match.id : null;
}

export function resolveToadaPrintDensity({ activeLangCount = 2, hasBottomSections = true }) {
  if (!hasBottomSections) return 'pupitre';
  return activeLangCount <= 1 ? 'comfort' : 'compact';
}
