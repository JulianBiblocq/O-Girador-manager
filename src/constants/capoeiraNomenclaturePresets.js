/**
 * Référentiel Capoeira (Regional & Angola) — Presets, Rôles et Nomenclature
 * Écosystème O Girador — Organizador
 */

export const DEFAULT_CAPOEIRA_NOMENCLATURE = {
  gunga: 'Berimbau Gunga',
  medio: 'Berimbau Médio',
  viola: 'Berimbau Viola',
  pandeiro: 'Pandeiro',
  atabaque: 'Atabaque',
  agogo: 'Agogô',
  reco_reco: 'Reco-Reco',
  chant: 'Chant / Ladainha',
  direction: 'Mestre de Roda'
};

export const CAPOEIRA_PRESETS = [
  {
    id: 'capoeira_regional_angola',
    name: 'Roda de Capoeira (Regional & Angola)',
    label: 'Roda de Capoeira (Regional & Angola)',
    description: 'Formation complète de Roda (Berimbau Gunga, Médio, Viola, Pandeiro, Atabaque, Agogô, Reco-Reco, Chant, Mestre de Roda)',
    style: 'capoeira',
    mapping: { ...DEFAULT_CAPOEIRA_NOMENCLATURE }
  },
  {
    id: 'capoeira_regional_charanga',
    name: 'Charanga Regional (Mestre Bimba)',
    label: 'Charanga Regional (Mestre Bimba)',
    description: 'Formation traditionnelle Regional (1 Berimbau et 2 Pandeiros)',
    style: 'capoeira',
    mapping: {
      gunga: 'Berimbau',
      pandeiro_1: 'Pandeiro 1',
      pandeiro_2: 'Pandeiro 2',
      chant: 'Cantador / Coro',
      direction: 'Mestre'
    }
  }
];

export const CAPOEIRA_ROLES_LIST = [
  { key: 'gunga', label: 'Berimbau Gunga', defaultLabel: 'Berimbau Gunga', category: 'Arc musical' },
  { key: 'medio', label: 'Berimbau Médio', defaultLabel: 'Berimbau Médio', category: 'Arc musical' },
  { key: 'viola', label: 'Berimbau Viola', defaultLabel: 'Berimbau Viola', category: 'Arc musical' },
  { key: 'pandeiro', label: 'Pandeiro', defaultLabel: 'Pandeiro', category: 'Cadre' },
  { key: 'atabaque', label: 'Atabaque', defaultLabel: 'Atabaque', category: 'Tambour' },
  { key: 'agogo', label: 'Agogô', defaultLabel: 'Agogô', category: 'Métal' },
  { key: 'reco_reco', label: 'Reco-Reco', defaultLabel: 'Reco-Reco', category: 'Raclé' },
  { key: 'chant', label: 'Chant / Ladainha', defaultLabel: 'Chant / Ladainha', category: 'Voix' },
  { key: 'direction', label: 'Mestre de Roda', defaultLabel: 'Mestre de Roda', category: 'Meneur' }
];
