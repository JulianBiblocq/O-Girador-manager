/**
 * O-Girador - Modular Instrument Nomenclature Constants & Resolvers (Organizador Mirror)
 * Multi-style support (Maracatu, Capoeira, Samba) with immutable audio roles.
 */

export const DEFAULT_MARACATU_NOMENCLATURE = {
  alfaia_grave: 'Marcante',
  alfaia_medio: 'Meião',
  alfaia_agudo: 'Repique',
  caixa_baixo: 'Caixa',
  caixa_alto: 'Tarol',
  gongue: 'Gonguê',
  agbe: 'Agbê',
  mineiro: 'Mineiro',
  timbal: 'Timbal',
  apito: 'Apito',
  puxador: 'Puxador',
  coro: 'Coro',
  toada: 'Toada',
};

export const DEFAULT_NOMENCLATURE = DEFAULT_MARACATU_NOMENCLATURE;

export const PRESET_NOMENCLATURES = [
  {
    id: 'traditional_baque_virado',
    name: 'Baque Virado Traditionnel',
    description: 'Nomenclature standard de Recife (Marcante, Meião, Repique, Caixa, Tarol)',
    style: 'maracatu',
    mapping: {
      alfaia_grave: 'Marcante',
      alfaia_medio: 'Meião',
      alfaia_agudo: 'Repique',
      caixa_baixo: 'Caixa',
      caixa_alto: 'Tarol',
    },
  },
  {
    id: 'candomble_ketu',
    name: 'Tradition Candomblé / Tambores',
    description: 'Nomenclature rituelle des tambours (Rum, Rumpi, Lé)',
    style: 'maracatu',
    mapping: {
      alfaia_grave: 'Rum',
      alfaia_medio: 'Rumpi',
      alfaia_agudo: 'Lé',
      caixa_baixo: 'Caixa',
      caixa_alto: 'Tarol',
      gongue: 'Agogô',
    },
  },
  {
    id: 'universal_function',
    name: 'Organologique & Fonctionnel',
    description: 'Désignation par registre sonore (Grave, Médium, Aigu)',
    style: 'maracatu',
    mapping: {
      alfaia_grave: 'Alfaia Grave',
      alfaia_medio: 'Alfaia Médium',
      alfaia_agudo: 'Alfaia Aiguë',
      caixa_baixo: 'Caisse Basse',
      caixa_alto: 'Caisse Haute',
    },
  },
];

export const MARACATU_ROLES_LIST = [
  { key: 'alfaia_grave', defaultLabel: 'Marcante', category: 'Fût' },
  { key: 'alfaia_medio', defaultLabel: 'Meião', category: 'Fût' },
  { key: 'alfaia_agudo', defaultLabel: 'Repique', category: 'Fût' },
  { key: 'caixa_baixo', defaultLabel: 'Caixa', category: 'Caisse' },
  { key: 'caixa_alto', defaultLabel: 'Tarol', category: 'Caisse' },
  { key: 'gongue', defaultLabel: 'Gonguê', category: 'Métal' },
  { key: 'agbe', defaultLabel: 'Agbê', category: 'Secoué' },
  { key: 'mineiro', defaultLabel: 'Mineiro', category: 'Secoué' },
  { key: 'timbal', defaultLabel: 'Timbal', category: 'Main' },
  { key: 'apito', defaultLabel: 'Apito', category: 'Signal' },
  { key: 'puxador', defaultLabel: 'Puxador', category: 'Voix' },
  { key: 'coro', defaultLabel: 'Coro', category: 'Voix' },
  { key: 'toada', defaultLabel: 'Toada', category: 'Voix' },
];

export function normalizeGroupNomenclature(rawNomenclature, style = 'maracatu') {
  if (!rawNomenclature || typeof rawNomenclature !== 'object') {
    return {};
  }

  if (rawNomenclature[style] && typeof rawNomenclature[style] === 'object') {
    return rawNomenclature[style];
  }

  const flatResult = {};
  for (const role of MARACATU_ROLES_LIST) {
    const val = rawNomenclature[role.key];
    if (typeof val === 'string' && val.trim().length > 0) {
      flatResult[role.key] = val.trim();
    }
  }

  return flatResult;
}

export const VOICE_TO_ROLE_KEY = {
  'marcante': 'alfaia_grave',
  'meiao': 'alfaia_medio',
  'meião': 'alfaia_medio',
  'meian': 'alfaia_medio',
  'repique': 'alfaia_agudo',
  'grave': 'alfaia_grave',
  'medio': 'alfaia_medio',
  'médio': 'alfaia_medio',
  'medium': 'alfaia_medio',
  'médium': 'alfaia_medio',
  'agudo': 'alfaia_agudo',
  'alfaia_grave': 'alfaia_grave',
  'alfaia_medio': 'alfaia_medio',
  'alfaia_agudo': 'alfaia_agudo',
};

/**
 * Résout le libellé d'affichage pour une voix d'Alfaia ou un rôle technique.
 * @param {string} voice Clé technique canonique ('marcante', 'meião', 'repique', etc.)
 * @param {object} groupNomenclature Dictionnaire de nomenclature de l'association (plat ou { maracatu: { ... } })
 * @param {boolean} short Si true, tronque proprement à 4 caractères maximum sans artefact typographique
 * @returns {string} Libellé résolu
 */
export function getVoiceLabel(voice, groupNomenclature, short = false) {
  if (!voice || typeof voice !== 'string') return '';
  const cleanKey = voice.toLowerCase().trim();
  const roleKey = VOICE_TO_ROLE_KEY[cleanKey] || cleanKey;

  const normalizedNom = normalizeGroupNomenclature(groupNomenclature);
  const fullLabel = normalizedNom[roleKey]
    || (groupNomenclature && typeof groupNomenclature === 'object' && groupNomenclature[roleKey])
    || DEFAULT_NOMENCLATURE[roleKey]
    || voice;

  if (!short) {
    return fullLabel;
  }

  const trimmed = fullLabel.trim();
  if (trimmed.length <= 4) {
    return trimmed;
  }

  // Normalisation élégante pour Meião
  if (trimmed.toLowerCase() === 'meião' || trimmed.toLowerCase() === 'meiao') {
    return 'Meio';
  }

  // Troncature propre à 4 caractères maximum sans artefact typographique
  return trimmed.slice(0, 4).replace(/[^\p{L}\p{N}]+$/u, '');
}

/**
 * Résout le libellé d'un instrument ou d'un rôle d'après la nomenclature du groupe.
 * @param {string} key Clé technique du rôle ou nom de l'instrument
 * @param {object} groupNomenclature Dictionnaire de nomenclature du groupe
 * @returns {string} Libellé résolu ou valeur originale
 */
export function getInstrumentLabel(key, groupNomenclature) {
  if (!key || typeof key !== 'string') return '';
  const normalizedNom = normalizeGroupNomenclature(groupNomenclature);
  const cleanKey = key.toLowerCase().trim();
  const roleKey = VOICE_TO_ROLE_KEY[cleanKey] || cleanKey;
  return normalizedNom[roleKey] || normalizedNom[key] || DEFAULT_NOMENCLATURE[roleKey] || DEFAULT_NOMENCLATURE[key] || key;
}
