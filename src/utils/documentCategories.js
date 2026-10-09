/**
 * Configuration, normalisation et résolution des libellés de catégories du Varal Cordel.
 * Assure un affichage dynamique pour les cordes de projets (🎪 PROJET : ...)
 * et un cartouche de secours systématique (zéro titre vide).
 */

/**
 * Catégories natives du Varal Cordel avec leurs réglages par défaut.
 */
export const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Toadas', nom: 'Toadas', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'TutosFabrication', nom: 'Tutos Fabrication', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'PhotosPrestations', nom: 'Photos Prestations', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'ComptesRendus', nom: 'Documents administratifs', actif: true, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true },
  { id: 'TutorielsVideo', nom: 'Tutoriels Vidéo', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Costumerie', nom: 'Costumerie & Patrons', actif: false, activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false }
];

/**
 * Table de correspondances pour normaliser les identifiants et alias de catégories du Varal.
 */
export const CATEGORY_ALIASES = {
  // Tutoriels vidéo, instruments et pupitres
  tutos: 'TutorielsVideo',
  tuto: 'TutorielsVideo',
  tutoriels: 'TutorielsVideo',
  tutoriel: 'TutorielsVideo',
  tutosvideo: 'TutorielsVideo',
  tutos_video: 'TutorielsVideo',
  tutorielsvideo: 'TutorielsVideo',
  tutoriels_video: 'TutorielsVideo',
  videos: 'TutorielsVideo',
  video: 'TutorielsVideo',
  vidéos: 'TutorielsVideo',
  vidéo: 'TutorielsVideo',
  instruments: 'TutorielsVideo',
  pupitres: 'TutorielsVideo',
  pupitres_videos: 'TutorielsVideo',
  tutoriels_instruments: 'TutorielsVideo',
  // Chants et Toadas
  toadas: 'Toadas',
  chants: 'Toadas',
  paroles: 'Toadas',
  // Culture & histoire
  culture: 'Culture',
  histoire: 'Culture',
  // Fabrication & atelier
  tutosfabrication: 'TutosFabrication',
  tutos_fabrication: 'TutosFabrication',
  fabrication: 'TutosFabrication',
  lutherie: 'TutosFabrication',
  costumerie: 'TutosFabrication',
  costumes: 'TutosFabrication',
  // Photos et médias
  photosprestations: 'PhotosPrestations',
  photos_prestations: 'PhotosPrestations',
  photos: 'PhotosPrestations',
  medias: 'PhotosPrestations',
  // Administration et réunions
  comptesrendus: 'ComptesRendus',
  comptes_rendus: 'ComptesRendus',
  administratif: 'ComptesRendus',
  pv: 'ComptesRendus'
};

/**
 * Normalise un identifiant ou nom de catégorie brut vers sa clé canonique.
 * @param {string} rawCat - Chaîne de catégorie brute
 * @returns {string} Identifiant canonique de catégorie
 */
export function normalizeVaralCategoryId(rawCat) {
  if (!rawCat || typeof rawCat !== 'string') return '';
  const trimmed = rawCat.trim();
  if (trimmed.startsWith('projet_')) return trimmed;
  const key = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');
  return CATEGORY_ALIASES[key] || trimmed;
}

/**
 * Résout le titre formaté d'une corde de projet liée à un événement.
 * Format attendu : 🎪 PROJET : ${TITRE_EVENEMENT.toUpperCase()}
 * @param {Object} params - Paramètres de contexte
 * @returns {string} Titre formaté pour l'étiquette Cordel
 */
export function resolveProjectRopeLabel({ category, documents = [], events = [], allEventsMap = {} }) {
  const catId = typeof category === 'object' ? (category.id || '') : String(category || '');
  const eventId = catId.replace(/^projet_/, '').trim();

  // 1. Recherche par événement dans la map globale ou la liste des événements
  const event = (allEventsMap && allEventsMap[eventId]) || (Array.isArray(events) && events.find(e => e.id === eventId));
  let rawTitle = event?.titre || event?.title || event?.nom || '';

  // 2. Recherche dans les métadonnées de la catégorie elle-même
  if (!rawTitle && typeof category === 'object') {
    rawTitle = category.eventTitle || category.projetTitre || category.evenementTitre || category.title || category.nom || '';
  }

  // 3. Recherche dans les métadonnées des documents suspendus sur la corde
  if (!rawTitle && Array.isArray(documents) && documents.length > 0) {
    const docWithTitle = documents.find(d => d.eventTitle || d.projetTitre || d.evenementTitre || d.event?.titre || d.event?.title);
    if (docWithTitle) {
      rawTitle = docWithTitle.eventTitle || docWithTitle.projetTitre || docWithTitle.evenementTitre || docWithTitle.event?.titre || docWithTitle.event?.title || '';
    }
  }

  // 4. Nettoyage du titre des éventuels préfixes redondants
  const cleanTitle = rawTitle
    .replace(/^🎪\s*/i, '')
    .replace(/^PROJET\s*:\s*/i, '')
    .replace(/^Chantier\s*:\s*/i, '')
    .trim();

  if (cleanTitle) {
    return `🎪 PROJET : ${cleanTitle.toUpperCase()}`;
  }

  // Repli propre avec l'ID de l'événement si aucun titre n'est disponible
  return eventId ? `🎪 PROJET : ${eventId.replace(/_/g, ' ').toUpperCase()}` : '🎪 PROJET : ÉVÉNEMENT';
}

/**
 * Résout l'étiquette complète d'une corde du Varal avec cartouche de secours systématique.
 * Garantit qu'aucun conteneur de titre ne reste vide si une corde possède des documents.
 * @param {Object|string} category - Objet catégorie ou clé brute
 * @param {Function} t - Fonction de traduction i18n
 * @param {Array} documents - Documents suspendus sur cette corde
 * @param {Array} events - Liste des événements connus
 * @param {Object} allEventsMap - Dictionnaire des événements par ID
 * @returns {string} Libellé de titre majuscule prêt à l'affichage
 */
export function resolveVaralCategoryLabel(category, t = null, documents = [], events = [], allEventsMap = {}) {
  if (!category && (!documents || documents.length === 0)) return '';

  const id = typeof category === 'object' ? (category.id || '') : String(category || '');
  const rawNom = typeof category === 'object' ? (category.nom || category.label || category.name || '') : '';

  // 1. Détection prioritaire des cordes dynamiques de projet
  if (id.startsWith('projet_') || rawNom.startsWith('projet_') || category?.isProjectRope) {
    return resolveProjectRopeLabel({ category, documents, events, allEventsMap });
  }

  // 2. Documents administratifs et réunions
  if (id === 'ComptesRendus' || rawNom === 'ComptesRendus' || rawNom === 'Documents administratifs') {
    const translated = t ? (t('documents.Documents administratifs') || t('documents.ComptesRendus')) : null;
    return (translated || 'Documents administratifs').toUpperCase();
  }

  // 3. Tutoriels vidéo, instruments et pupitres (Alfaia, Gonguê, Caixa, Agbê)
  const normId = normalizeVaralCategoryId(id || rawNom);
  if (normId === 'TutorielsVideo') {
    const translated = t ? (t('documents.TutorielsVideo') || t('documents.Tutoriels')) : null;
    return (translated || rawNom || 'Tutoriels Vidéo').toUpperCase();
  }

  // 4. Résolution via dictionnaire de traduction i18n
  if (t && id) {
    const tById = t(`documents.${id}`);
    if (tById && tById !== `documents.${id}`) return String(tById).toUpperCase();
  }
  if (t && rawNom) {
    const tByNom = t(`documents.${rawNom}`);
    if (tByNom && tByNom !== `documents.${rawNom}`) return String(tByNom).toUpperCase();
  }

  // 5. Cartouche de secours systématique (Fallback) : ne JAMAIS laisser un cartouche vide
  const fallback = rawNom || (typeof category === 'object' ? (category.label || category.name) : '') || id.replace(/_/g, ' ');
  if (fallback && fallback.trim()) {
    return fallback.trim().toUpperCase();
  }

  // Secours ultime si la corde contient des documents mais aucun nom
  if (Array.isArray(documents) && documents.length > 0) {
    return 'DOCUMENTS';
  }

  return '';
}
/**
 * Résout le libellé d'une catégorie avec préfixe projet normalisé.
 * @param {string|Object} categoryKey - Identifiant ou objet catégorie
 * @param {string} [eventTitle] - Titre de l'événement associé
 */
export const getCategoryLabel = (categoryKey, eventTitle = '') => {
  if (!categoryKey) return 'DOCUMENTS';
  const catStr = typeof categoryKey === 'object' ? (categoryKey.id || categoryKey.nom || categoryKey.title || '') : String(categoryKey);
  if (!catStr) return 'DOCUMENTS';
  if (catStr.startsWith('projet_')) {
    const objNom = typeof categoryKey === 'object' && categoryKey.nom && !categoryKey.nom.startsWith('projet_') ? categoryKey.nom : '';
    const objTitle = typeof categoryKey === 'object' && categoryKey.title && !categoryKey.title.startsWith('projet_') ? categoryKey.title : '';
    const rawTitle = eventTitle || (typeof categoryKey === 'object' && (categoryKey.eventTitle || categoryKey.projetTitre)) || objNom || objTitle || catStr.replace('projet_', '');
    const clean = String(rawTitle).replace(/^🎪\s*/i, '').replace(/^PROJET\s*:\s*/i, '').trim();
    return `🎪 PROJET : ${(clean || catStr.replace('projet_', '')).toUpperCase()}`;
  }
  return catStr.replace(/_/g, ' ').toUpperCase();
};
