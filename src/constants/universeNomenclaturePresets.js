/**
 * Référentiel des Presets, Rôles et Nomenclatures Multi-Univers
 * Écosystème O Girador — Organizad'Or
 */

import {
  DEFAULT_MARACATU_NOMENCLATURE,
  PRESET_NOMENCLATURES as MARACATU_PRESETS,
  MARACATU_ROLES_LIST
} from './nomenclature.js';

export { DEFAULT_MARACATU_NOMENCLATURE, MARACATU_ROLES_LIST };

/**
 * Nomenclature Batucada par défaut (Batucada Standard)
 */
export const DEFAULT_BATUCADA_NOMENCLATURE = {
  surdo_1: 'Surdo 1',
  surdo_2: 'Surdo 2',
  surdo_3: 'Surdo 3',
  repique: 'Repique',
  caixa: 'Caixa',
  tamborim: 'Tamborim',
  agogo: 'Agogô',
  chocalho: 'Chocalho',
  timba: 'Timbal',
  apito: 'Apito',
  direction: 'Directeur de batterie'
};

/**
 * Presets Batucada pour la percussion de rue
 */
export const BATUCADA_PRESETS = [
  {
    id: 'batucada_standard',
    name: 'Batucada Standard (Escola / Rue)',
    label: 'Batucada Standard (Escola / Rue)',
    description: 'Nomenclature standard de rue (Surdo 1, 2, 3, Repique, Caixa, Tamborim, Agogô, Chocalho, Timbal, Apito, Directeur de batterie)',
    style: 'batucada',
    mapping: {
      surdo_1: 'Surdo 1',
      surdo_2: 'Surdo 2',
      surdo_3: 'Surdo 3',
      repique: 'Repique',
      caixa: 'Caixa',
      tamborim: 'Tamborim',
      agogo: 'Agogô',
      chocalho: 'Chocalho',
      timba: 'Timbal',
      apito: 'Apito',
      direction: 'Directeur de batterie'
    }
  },
  {
    id: 'samba_reggae_bloco',
    name: 'Samba-Reggae / Bloco',
    label: 'Samba-Reggae / Bloco',
    description: 'Nomenclature Samba-Reggae & Blocos (Surdo Fundo, Surdo Resposta, Surdo Dobra, Repique, Caixa, Timbal)',
    style: 'batucada',
    mapping: {
      surdo_1: 'Surdo Fundo',
      surdo_2: 'Surdo Resposta',
      surdo_3: 'Surdo Dobra',
      repique: 'Repique',
      caixa: 'Caixa',
      timba: 'Timbal',
      agogo: 'Agogô',
      chocalho: 'Chocalho',
      tamborim: 'Tamborim',
      apito: 'Apito',
      direction: 'Directeur de batterie'
    }
  }
];

/**
 * Presets Samba Enredo / Bateria
 */
export const SAMBA_PRESETS = [
  {
    id: 'samba_enredo_escola',
    name: 'Samba Enredo / Escola',
    label: 'Samba Enredo / Escola',
    description: 'Nomenclature Samba Enredo / Escola de Samba (Surdo de Primeira, Segunda, Terceira, Repinique, Caixa de Guerra, Tarol, Tamborim, Cuíca, Chocalho, Agogô, Puxador)',
    style: 'samba',
    mapping: {
      surdo_1: 'Surdo de Primeira',
      surdo_2: 'Surdo de Segunda',
      surdo_3: 'Surdo de Terceira',
      repique: 'Repinique',
      caixa: 'Caixa de Guerra',
      tarol: 'Tarol',
      tamborim: 'Tamborim',
      timba: 'Cuíca',
      cuica: 'Cuíca',
      chocalho: 'Chocalho',
      agogo: 'Agogô',
      apito: 'Apito',
      direction: 'Mestre de Bateria'
    }
  }
];

/**
 * Rôles pour le preset "Batucada Standard (Escola / Rue)" (11 voix)
 */
export const BATUCADA_STANDARD_ROLES = [
  { key: 'surdo_1', label: 'Surdo 1', defaultLabel: 'Surdo 1', category: 'Surdo' },
  { key: 'surdo_2', label: 'Surdo 2', defaultLabel: 'Surdo 2', category: 'Surdo' },
  { key: 'surdo_3', label: 'Surdo 3', defaultLabel: 'Surdo 3', category: 'Surdo' },
  { key: 'repique', label: 'Repique', defaultLabel: 'Repique', category: 'Fût aigu' },
  { key: 'caixa', label: 'Caixa', defaultLabel: 'Caixa', category: 'Caisse' },
  { key: 'tamborim', label: 'Tamborim', defaultLabel: 'Tamborim', category: 'Cadre' },
  { key: 'agogo', label: 'Agogô', defaultLabel: 'Agogô', category: 'Métal' },
  { key: 'chocalho', label: 'Chocalho', defaultLabel: 'Chocalho', category: 'Secoué' },
  { key: 'timba', label: 'Timbal', defaultLabel: 'Timbal', category: 'Main' },
  { key: 'apito', label: 'Apito', defaultLabel: 'Apito', category: 'Signal' },
  { key: 'direction', label: 'Directeur de batterie', defaultLabel: 'Directeur de batterie', category: 'Meneur' }
];

/**
 * Rôles pour le preset "Samba-Reggae / Bloco"
 */
export const SAMBA_REGGAE_ROLES = [
  { key: 'surdo_1', label: 'Surdo Fundo', defaultLabel: 'Surdo Fundo', category: 'Surdo' },
  { key: 'surdo_2', label: 'Surdo Resposta', defaultLabel: 'Surdo Resposta', category: 'Surdo' },
  { key: 'surdo_3', label: 'Surdo Dobra', defaultLabel: 'Surdo Dobra', category: 'Surdo' },
  { key: 'repique', label: 'Repique', defaultLabel: 'Repique', category: 'Fût aigu' },
  { key: 'caixa', label: 'Caixa', defaultLabel: 'Caixa', category: 'Caisse' },
  { key: 'timba', label: 'Timbal', defaultLabel: 'Timbal', category: 'Main' },
  { key: 'agogo', label: 'Agogô', defaultLabel: 'Agogô', category: 'Métal' },
  { key: 'chocalho', label: 'Chocalho', defaultLabel: 'Chocalho', category: 'Secoué' },
  { key: 'tamborim', label: 'Tamborim', defaultLabel: 'Tamborim', category: 'Cadre' },
  { key: 'apito', label: 'Apito', defaultLabel: 'Apito', category: 'Signal' },
  { key: 'direction', label: 'Directeur de batterie', defaultLabel: 'Directeur de batterie', category: 'Meneur' }
];

/**
 * Rôles pour le preset "Samba Enredo / Escola"
 */
export const SAMBA_ENREDO_ROLES = [
  { key: 'surdo_1', label: 'Surdo de Primeira', defaultLabel: 'Surdo de Primeira', category: 'Surdo' },
  { key: 'surdo_2', label: 'Surdo de Segunda', defaultLabel: 'Surdo de Segunda', category: 'Surdo' },
  { key: 'surdo_3', label: 'Surdo de Terceira', defaultLabel: 'Surdo de Terceira', category: 'Surdo' },
  { key: 'repique', label: 'Repinique', defaultLabel: 'Repinique', category: 'Fût aigu' },
  { key: 'caixa', label: 'Caixa de Guerra', defaultLabel: 'Caixa de Guerra', category: 'Caisse' },
  { key: 'tarol', label: 'Tarol', defaultLabel: 'Tarol', category: 'Caisse' },
  { key: 'tamborim', label: 'Tamborim', defaultLabel: 'Tamborim', category: 'Cadre' },
  { key: 'cuica', label: 'Cuíca', defaultLabel: 'Cuíca', category: 'Friction' },
  { key: 'chocalho', label: 'Chocalho', defaultLabel: 'Chocalho', category: 'Secoué' },
  { key: 'agogo', label: 'Agogô', defaultLabel: 'Agogô', category: 'Métal' },
  { key: 'apito', label: 'Apito', defaultLabel: 'Apito', category: 'Signal' },
  { key: 'direction', label: 'Mestre de Bateria', defaultLabel: 'Mestre de Bateria', category: 'Meneur' }
];

/**
 * Pupitres liés par défaut selon l'univers
 */
export const UNIVERSE_DEFAULT_LINKED_INSTRUMENTS = {
  batucada: [
    { name: 'Surdos', instruments: ['Surdo 1', 'Surdo 2', 'Surdo 3'] }
  ],
  samba: [
    { name: 'Surdos', instruments: ['Surdo 1', 'Surdo 2', 'Surdo 3'] }
  ],
  sambareggae: [
    { name: 'Surdos', instruments: ['Surdo Fundo', 'Surdo Dobra', 'Surdo Resposta'] }
  ],
  maracatu: []
};

/**
 * Résout les presets de nomenclature selon l'univers
 */
export function getUniverseNomenclaturePresets(universeId) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada' || norm === 'sambareggae') {
    return BATUCADA_PRESETS;
  }
  if (norm === 'samba') {
    return SAMBA_PRESETS;
  }
  return MARACATU_PRESETS;
}

/**
 * Résout la liste des rôles / voix selon l'univers et le preset sélectionné
 */
export function getUniverseRolesList(universeId, presetId) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada' || norm === 'sambareggae') {
    if (presetId === 'samba_reggae_bloco') {
      return SAMBA_REGGAE_ROLES;
    }
    return BATUCADA_STANDARD_ROLES;
  }
  if (norm === 'samba') {
    if (presetId === 'samba_enredo_escola') {
      return SAMBA_ENREDO_ROLES;
    }
    return BATUCADA_STANDARD_ROLES;
  }
  return MARACATU_ROLES_LIST;
}

/**
 * Résout la nomenclature par défaut selon l'univers
 */
export function getDefaultUniverseNomenclature(universeId) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada' || norm === 'samba' || norm === 'sambareggae') {
    return DEFAULT_BATUCADA_NOMENCLATURE;
  }
  return DEFAULT_MARACATU_NOMENCLATURE;
}

/**
 * Titre dynamique du bandeau d'en-tête selon l'univers
 * Respecte strictement l'intitulé demandé pour Maracatu et s'adapte aux autres univers.
 */
export function getUniverseAccordionTitle(universeId, presetLabel) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada') {
    if (presetLabel && presetLabel !== 'Batucada Standard (Escola / Rue)' && presetLabel !== 'batucada_standard') {
      return `Pupitres & nomenclature (${presetLabel})`;
    }
    return 'Pupitres & nomenclature (Batucada / Samba de rue)';
  }
  if (norm === 'sambareggae') {
    return presetLabel ? `Pupitres & nomenclature (${presetLabel})` : 'Pupitres & nomenclature (Samba-Reggae / Bloco)';
  }
  if (norm === 'samba') {
    return presetLabel ? `Pupitres & nomenclature (${presetLabel})` : 'Pupitres & nomenclature (Bateria / Escola de Samba)';
  }
  if (norm === 'capoeira') {
    return presetLabel ? `Instruments & nomenclature (${presetLabel})` : 'Instruments & nomenclature (Roda de Capoeira)';
  }
  // Maracatu strict : maintenir rigoureusement l'intitulé demandé
  if (presetLabel && presetLabel !== 'Baque Virado Traditionnel' && presetLabel !== 'traditional_baque_virado') {
    return `Pupitres, tambours & nomenclature (${presetLabel})`;
  }
  return 'Pupitres, tambours & nomenclature (Baque Virado Traditionnel)';
}

/**
 * Titre de l'onglet interne nomenclature selon l'univers
 */
export function getUniverseNomenclatureTabTitle(universeId) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada' || norm === 'samba') {
    return '🎵 Nomenclature & Voix (Surdo 1, 2, 3...)';
  }
  if (norm === 'sambareggae') {
    return '🎵 Nomenclature & Voix (Surdo Fundo, Dobra...)';
  }
  if (norm === 'capoeira') {
    return '🎵 Nomenclature & Voix (Gunga, Médio, Viola...)';
  }
  return '🎵 Nomenclature & Voix (Marcante, Meião...)';
}

/**
 * Sous-titre indicatif pour les accordéons compacts
 */
export function getUniverseNomenclatureSubTitle(universeId) {
  const norm = (universeId || 'maracatu').toLowerCase().trim();
  if (norm === 'batucada' || norm === 'samba') {
    return '(Surdo 1, 2, 3, Repique, Caixa, Tamborim...)';
  }
  if (norm === 'sambareggae') {
    return '(Surdo Fundo, Dobra, Resposta, Timbal...)';
  }
  if (norm === 'capoeira') {
    return '(Berimbau Gunga, Médio, Viola, Pandeiro...)';
  }
  return '(Marcante, Meião, Caixas, Voix...)';
}
