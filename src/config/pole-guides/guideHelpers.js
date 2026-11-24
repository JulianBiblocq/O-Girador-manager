/**
 * Utilitaires partagés des guides contextuels bilingues (FR / PT-BR) dans Organizador.
 * Garantit l'exclusion des vues membres simples et la rétrocompatibilité des propriétés.
 */

export const EXCLUDED_MEMBER_KEYS = new Set([
  'accueil',
  'mon-espace',
  'profil',
  'materiel',
  'vestiaire',
  'trombinoscope',
  'varal',
  'dashboard'
]);

/**
 * Construit un objet guide 100 % bilingue `{ fr, pt }` tout en exposant
 * les propriétés `titre` et `etapes` pour la rétrocompatibilité des composants.
 */
export function makeGuide({ fr, pt, targets = [] }) {
  return {
    title: { fr: fr.title, pt: pt.title },
    titre: fr.title,
    description: { fr: fr.description, pt: pt.description },
    steps: { fr: fr.steps, pt: pt.steps },
    etapes: fr.steps,
    ...(targets.length > 0 ? { targets } : {})
  };
}

/**
 * Construit un guide « Double Vue » (Vue Adhérent & Vue Responsable / Mestre)
 * 100 % bilingue `{ fr, pt }`.
 */
export function makeDoubleViewGuide({ id, poleName, title, description, memberGuide, managerGuide, targets = [] }) {
  const frSteps = (managerGuide?.workflowSteps || []).map((ws) => `${ws.title.fr} : ${ws.desc.fr}`);
  const ptSteps = (managerGuide?.workflowSteps || []).map((ws) => `${ws.title.pt} : ${ws.desc.pt}`);
  return {
    id,
    poleName,
    title,
    titre: title.fr,
    description,
    steps: { fr: frSteps, pt: ptSteps },
    etapes: frSteps,
    memberGuide,
    managerGuide,
    ...(targets.length > 0 ? { targets } : {})
  };
}

/** Résout une valeur bilingue `{ fr, pt }` ou chaîne simple selon la langue active. */
export function resolveLocalizedGuideText(value, isPt = false) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return isPt ? (value.pt || value.fr || '') : (value.fr || value.pt || '');
}

/** Résout une liste d'étapes bilingues `{ fr: [], pt: [] }` ou tableau de `{ fr, pt }`. */
export function resolveLocalizedGuideSteps(stepsValue, isPt = false) {
  if (!stepsValue) return [];
  if (Array.isArray(stepsValue)) {
    return stepsValue.map((item) => resolveLocalizedGuideText(item, isPt)).filter(Boolean);
  }
  const list = isPt ? (stepsValue.pt || stepsValue.fr) : (stepsValue.fr || stepsValue.pt);
  return Array.isArray(list) ? list : [];
}
