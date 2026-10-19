/**
 * O-Girador - Modular Instrument Nomenclature & Official 2-Letter Abbreviations (< 150 lignes).
 * Multi-style support (Maracatu, Capoeira, Samba) with immutable audio roles.
 */

export const DEFAULT_MARACATU_NOMENCLATURE = {
  alfaia_grave: 'Marcante', alfaia_medio: 'Meião', alfaia_agudo: 'Repique',
  caixa_baixo: 'Caixa', caixa_alto: 'Tarol', gongue: 'Gonguê', agbe: 'Agbê',
  mineiro: 'Mineiro', timbal: 'Timbal', apito: 'Apito', puxador: 'Puxador', coro: 'Coro', toada: 'Toada'
};
export const DEFAULT_NOMENCLATURE = DEFAULT_MARACATU_NOMENCLATURE;

export const DEFAULT_MARACATU_NOMENCLATURE_ABBR = {
  alfaia_grave: 'Mc', alfaia_medio: 'Me', alfaia_agudo: 'Rp',
  caixa_baixo: 'Cx', caixa_alto: 'Tr', gongue: 'Gg', agbe: 'Ab',
  mineiro: 'Mi', timbal: 'Tb', apito: 'Ap', puxador: 'Px', coro: 'Co', toada: 'Td'
};
export const DEFAULT_NOMENCLATURE_ABBR = DEFAULT_MARACATU_NOMENCLATURE_ABBR;

export const PRESET_NOMENCLATURES = [
  {
    id: 'traditional_baque_virado',
    name: 'Baque Virado Traditionnel',
    description: 'Nomenclature standard de Recife (Marcante, Meião, Repique, Caixa, Tarol)',
    style: 'maracatu',
    mapping: { alfaia_grave: 'Marcante', alfaia_medio: 'Meião', alfaia_agudo: 'Repique', caixa_baixo: 'Caixa', caixa_alto: 'Tarol' },
    mappingAbbr: { alfaia_grave: 'Mc', alfaia_medio: 'Me', alfaia_agudo: 'Rp', caixa_baixo: 'Cx', caixa_alto: 'Tr' }
  },
  {
    id: 'candomble_ketu',
    name: 'Tradition Candomblé / Tambores',
    description: 'Nomenclature rituelle des tambours (Rum, Rumpi, Lé)',
    style: 'maracatu',
    mapping: { alfaia_grave: 'Rum', alfaia_medio: 'Rumpi', alfaia_agudo: 'Lé', caixa_baixo: 'Caixa', caixa_alto: 'Tarol', gongue: 'Agogô' },
    mappingAbbr: { alfaia_grave: 'Rm', alfaia_medio: 'Rp', alfaia_agudo: 'Le', caixa_baixo: 'Cx', caixa_alto: 'Tr', gongue: 'Ag' }
  },
  {
    id: 'universal_function',
    name: 'Organologique & Fonctionnel',
    description: 'Désignation par registre sonore (Grave, Médium, Aigu)',
    style: 'maracatu',
    mapping: { alfaia_grave: 'Alfaia Grave', alfaia_medio: 'Alfaia Médium', alfaia_agudo: 'Alfaia Aiguë', caixa_baixo: 'Caisse Basse', caixa_alto: 'Caisse Haute' },
    mappingAbbr: { alfaia_grave: 'Ag', alfaia_medio: 'Am', alfaia_agudo: 'Aa', caixa_baixo: 'Cb', caixa_alto: 'Ch' }
  }
];

export const MARACATU_ROLES_LIST = [
  { key: 'alfaia_grave', defaultLabel: 'Marcante', defaultAbbr: 'Mc', category: 'Fût Grave' },
  { key: 'alfaia_medio', defaultLabel: 'Meião', defaultAbbr: 'Me', category: 'Fût Médium' },
  { key: 'alfaia_agudo', defaultLabel: 'Repique', defaultAbbr: 'Rp', category: 'Fût Aigu' },
  { key: 'caixa_baixo', defaultLabel: 'Caixa', defaultAbbr: 'Cx', category: 'Caisse Claire' },
  { key: 'caixa_alto', defaultLabel: 'Tarol', defaultAbbr: 'Tr', category: 'Caisse Haute' },
  { key: 'gongue', defaultLabel: 'Gonguê', defaultAbbr: 'Gg', category: 'Cloche Métal' },
  { key: 'agbe', defaultLabel: 'Agbê', defaultAbbr: 'Ab', category: 'Secoué' },
  { key: 'mineiro', defaultLabel: 'Mineiro', defaultAbbr: 'Mi', category: 'Secoué' },
  { key: 'timbal', defaultLabel: 'Timbal', defaultAbbr: 'Tb', category: 'Main' },
  { key: 'apito', defaultLabel: 'Apito', defaultAbbr: 'Ap', category: 'Signal' },
  { key: 'puxador', defaultLabel: 'Puxador', defaultAbbr: 'Px', category: 'Voix' },
  { key: 'coro', defaultLabel: 'Coro', defaultAbbr: 'Co', category: 'Voix' },
  { key: 'toada', defaultLabel: 'Toada', defaultAbbr: 'Td', category: 'Voix' }
];

export function formatRoleAbbr(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function normalizeGroupNomenclature(rawNomenclature, style = 'maracatu') {
  if (!rawNomenclature || typeof rawNomenclature !== 'object') return {};
  if (rawNomenclature[style] && typeof rawNomenclature[style] === 'object') return rawNomenclature[style];
  const flatResult = {};
  for (const role of MARACATU_ROLES_LIST) {
    const val = rawNomenclature[role.key];
    if (typeof val === 'string' && val.trim().length > 0) flatResult[role.key] = val.trim();
  }
  return flatResult;
}

export function normalizeGroupNomenclatureAbbr(rawAbbr, style = 'maracatu') {
  if (!rawAbbr || typeof rawAbbr !== 'object') return {};
  if (rawAbbr[style] && typeof rawAbbr[style] === 'object') return rawAbbr[style];
  const flatResult = {};
  for (const role of MARACATU_ROLES_LIST) {
    const val = rawAbbr[role.key];
    if (typeof val === 'string' && val.trim().length > 0) flatResult[role.key] = formatRoleAbbr(val);
  }
  return flatResult;
}

export const VOICE_TO_ROLE_KEY = {
  marcante: 'alfaia_grave', meiao: 'alfaia_medio', meião: 'alfaia_medio', meian: 'alfaia_medio',
  repique: 'alfaia_agudo', grave: 'alfaia_grave', medio: 'alfaia_medio', médio: 'alfaia_medio',
  medium: 'alfaia_medio', médium: 'alfaia_medio', agudo: 'alfaia_agudo',
  alfaia_grave: 'alfaia_grave', alfaia_medio: 'alfaia_medio', alfaia_agudo: 'alfaia_agudo'
};

/**
 * Résout le libellé d'affichage pour une voix d'Alfaia ou un rôle technique.
 * Supporte le mode court (abréviation officielle 2 lettres, ex: Mc, Me, Rp).
 */
export function getVoiceLabel(voice, groupNomenclature, short = false, groupNomenclatureAbbr = null) {
  if (!voice || typeof voice !== 'string') return '';
  const cleanKey = voice.toLowerCase().trim();
  const roleKey = VOICE_TO_ROLE_KEY[cleanKey] || cleanKey;

  const normalizedNom = normalizeGroupNomenclature(groupNomenclature);
  const fullLabel = normalizedNom[roleKey]
    || (groupNomenclature && typeof groupNomenclature === 'object' && groupNomenclature[roleKey])
    || DEFAULT_NOMENCLATURE[roleKey]
    || voice;

  if (!short) return fullLabel;

  // 1. Priorité aux abréviations officielles (2 lettres) si groupNomenclatureAbbr est fourni
  if (groupNomenclatureAbbr && typeof groupNomenclatureAbbr === 'object') {
    const normalizedAbbr = normalizeGroupNomenclatureAbbr(groupNomenclatureAbbr);
    const customAbbr = normalizedAbbr[roleKey]
      || groupNomenclatureAbbr[roleKey]
      || (groupNomenclatureAbbr.maracatu && groupNomenclatureAbbr.maracatu[roleKey]);
    if (customAbbr && typeof customAbbr === 'string') return formatRoleAbbr(customAbbr);
    if (DEFAULT_NOMENCLATURE_ABBR[roleKey]) return DEFAULT_NOMENCLATURE_ABBR[roleKey];
  }

  // 2. Troncature propre historique (ex: cartouches Alfaias "Marc." et "Meio.")
  const trimmed = fullLabel.trim();
  if (trimmed.length <= 4) return trimmed;
  if (trimmed.toLowerCase() === 'meião' || trimmed.toLowerCase() === 'meiao') return 'Meio';
  return trimmed.slice(0, 4).replace(/[^\p{L}\p{N}]+$/u, '');
}

export function getInstrumentLabel(key, groupNomenclature) {
  if (!key || typeof key !== 'string') return '';
  const normalizedNom = normalizeGroupNomenclature(groupNomenclature);
  const cleanKey = key.toLowerCase().trim();
  const roleKey = VOICE_TO_ROLE_KEY[cleanKey] || cleanKey;
  return normalizedNom[roleKey] || normalizedNom[key] || DEFAULT_NOMENCLATURE[roleKey] || DEFAULT_NOMENCLATURE[key] || key;
}
