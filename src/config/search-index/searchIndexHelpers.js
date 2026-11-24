/**
 * Utilitaires partagés pour l'index bilingue (FR / PT-BR) de la Palette rapide Ctrl+K
 * dans Organizador (< 140 lignes).
 */

const POLE_LABELS_FALLBACK = {
  accueil: { fr: 'Accueil', pt: 'Início' },
  'mon-espace': { fr: 'Mon Espace', pt: 'Meu Espaço' },
  gouvernance: { fr: 'Gouvernance', pt: 'Governança' },
  secretariat: { fr: 'Secrétariat', pt: 'Secretaria' },
  diffusion: { fr: 'Diffusion', pt: 'Difusão' },
  tresorerie: { fr: 'Trésorerie', pt: 'Tesouraria' },
  logistique: { fr: 'Logistique', pt: 'Logística' },
  lutherie: { fr: 'Lutherie', pt: 'Luthieria' },
  costumerie: { fr: 'Costumerie', pt: 'Figurino' },
  studio: { fr: 'Studio', pt: 'Estúdio' },
  pedagogie: { fr: 'Pédagogie', pt: 'Pedagogia' },
  mestre: { fr: 'Mestria', pt: 'Mestria' },
  vitrine: { fr: 'Mostrador', pt: 'Mostrador' },
  config: { fr: 'Configuration', pt: 'Configuração' }
};

/** Normalise une chaîne en minuscules sans accents pour la recherche rapide. */
export function normalizeSearchToken(text) {
  if (!text || typeof text !== 'string') return '';
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Construit une entrée bilingue `{ fr, pt }` pour `SETTINGS_INDEX`. */
export function makeSearchItem({ id, poleId, tabId, requiredPole, requiredPermission, fr, pt }) {
  return {
    id,
    poleId,
    tabId,
    requiredPole: requiredPole || poleId,
    ...(requiredPermission ? { requiredPermission } : {}),
    title: { fr: fr.title, pt: pt.title },
    description: { fr: fr.description, pt: pt.description },
    keywords: { fr: fr.keywords || [], pt: pt.keywords || [] }
  };
}

/** Résout un champ texte `{ fr, pt }` ou chaîne selon la langue active. */
export function resolveSearchText(value, isPt = false) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return isPt ? (value.pt || value.fr || '') : (value.fr || value.pt || '');
}

/** Résout le nom humain traduit d'un pôle (zéro identifiant technique brut à l'écran). */
export function resolvePoleDisplayLabel(poleId, t, isPt = false) {
  if (!poleId) return '';
  const key = `poles.${poleId}`;
  const translated = typeof t === 'function' ? t(key) : '';
  if (translated && translated !== key) return translated;
  const fallback = POLE_LABELS_FALLBACK[poleId];
  return fallback ? (isPt ? fallback.pt : fallback.fr) : poleId;
}
