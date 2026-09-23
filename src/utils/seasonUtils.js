/**
 * Utilitaires pour la gestion et le calcul des saisons associatives et exercices comptables.
 * 
 * Ce module gère deux rythmes temporels distincts et paramétrables par association :
 * 1. La Saison d'Activité / Artistique (ateliers, répétitions, agenda, notes de frais, répertoires).
 *    Par défaut : Septembre (mois 9). Si configuré sur Janvier (mois 1), la saison est l'année civile.
 * 2. L'Exercice Administratif / Comptable (bilan d'AG, grand livre de trésorerie, Cerfa 12156).
 *    Par défaut : Janvier (mois 1).
 */

/**
 * Mois de démarrage par défaut de la saison d'activité (1 = Janvier, ..., 9 = Septembre, ..., 12 = Décembre).
 */
export const DEFAULT_SEASON_START_MONTH = 9;

/**
 * Mois de démarrage par défaut de l'exercice comptable (1 = Janvier, ..., 12 = Décembre).
 */
export const DEFAULT_FISCAL_START_MONTH = 1;

/**
 * Fonction interne de formatage sur deux chiffres (ex: 9 -> "09").
 * 
 * @param {number|string} n Nombre à formater
 * @returns {string} Chaîne sur 2 chiffres
 */
function padZero(n) {
  return String(n).padStart(2, '0');
}

/**
 * Normalise un objet date d'entrée (Date, Timestamp Firestore, chaîne ISO ou timestamp numérique).
 * 
 * @param {string|Date|object|number} dateInput Entrée de date
 * @returns {Date|null} Objet Date JavaScript valide ou null
 */
function parseDateInput(dateInput) {
  if (!dateInput) return null;

  let d;
  if (typeof dateInput === 'object' && dateInput !== null && typeof dateInput.toDate === 'function') {
    // Cas d'un Timestamp Firestore
    d = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string') {
    // Si la date est au format YYYY-MM-DD, parse direct pour éviter les décalages de fuseau horaire
    const parts = dateInput.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexé
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date(dateInput);
    }
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else {
    d = new Date(dateInput);
  }

  return isNaN(d?.getTime()) ? null : d;
}

/**
 * Calcule l'identifiant de la saison d'activité (ex. "2026-2027" ou "2026") à partir d'une date donnée.
 * 
 * Règle :
 * - Si startMonth === 1 (année civile) : renvoie l'année seule `${year}` (ex. "2026").
 * - Si startMonth > 1 (ex. 9 pour Septembre) :
 *   - Mois >= startMonth : Saison = `${year}-${year + 1}`
 *   - Mois < startMonth : Saison = `${year - 1}-${year}`
 * 
 * @param {string|Date|object|number} dateInput Date sous forme d'objet Date, string YYYY-MM-DD ou Timestamp Firestore
 * @param {number} [startMonth=9] Mois de début de la saison d'activité (1 à 12, défaut: 9)
 * @returns {string} Identifiant de saison ("AAAA-AAAA" ou "AAAA")
 */
export function getSeasonFromDate(dateInput, startMonth = DEFAULT_SEASON_START_MONTH) {
  const sm = Number(startMonth) >= 1 && Number(startMonth) <= 12 
    ? Number(startMonth) 
    : DEFAULT_SEASON_START_MONTH;

  const d = parseDateInput(dateInput);
  if (!d) {
    return getCurrentSeason(sm);
  }

  const month = d.getMonth() + 1; // 1 = Janvier, ..., 12 = Décembre
  const year = d.getFullYear();

  // Si la saison démarre en janvier, c'est l'année civile
  if (sm === 1) {
    return `${year}`;
  }

  if (month >= sm) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Retourne la saison associative actuellement en cours selon le mois de démarrage configuré.
 * 
 * @param {number} [startMonth=9] Mois de début de la saison d'activité (1 à 12, défaut: 9)
 * @returns {string} Saison courante (ex. "2026-2027" ou "2026")
 */
export function getCurrentSeason(startMonth = DEFAULT_SEASON_START_MONTH) {
  return getSeasonFromDate(new Date(), startMonth);
}

/**
 * Retourne la plage exacte de dates [startDate, endDate] (format YYYY-MM-DD)
 * couvrant l'ensemble des 12 mois de la saison spécifiée.
 * 
 * @param {string} [season] Identifiant de saison (ex. "2026-2027" ou "2026"). Par défaut la saison active.
 * @param {number} [startMonth=9] Mois de début de saison (1 à 12, défaut: 9)
 * @returns {{ startDate: string, endDate: string }} Dates ISO de début et de fin
 */
export function getSeasonDateRange(season, startMonth = DEFAULT_SEASON_START_MONTH) {
  const sm = Number(startMonth) >= 1 && Number(startMonth) <= 12 
    ? Number(startMonth) 
    : DEFAULT_SEASON_START_MONTH;

  const targetSeason = season && typeof season === 'string' && season.trim()
    ? season.trim()
    : getCurrentSeason(sm);

  // Année de départ
  let startYear;
  let endYear;

  if (targetSeason.includes('-')) {
    const parts = targetSeason.split('-');
    startYear = parseInt(parts[0], 10);
    endYear = parseInt(parts[1], 10) || (startYear + 1);
  } else {
    startYear = parseInt(targetSeason, 10);
    endYear = sm === 1 ? startYear : startYear + 1;
  }

  if (isNaN(startYear)) {
    startYear = new Date().getFullYear();
    endYear = sm === 1 ? startYear : startYear + 1;
  }

  // Cas 1 : Année civile complète (1er Janvier au 31 Décembre)
  if (sm === 1) {
    return {
      startDate: `${startYear}-01-01`,
      endDate: `${startYear}-12-31`
    };
  }

  // Cas 2 : Saison à cheval sur 2 années civiles (ex: Septembre à Août)
  const startMonthStr = padZero(sm);
  const endMonth = sm - 1; // 1-indexé (ex: 8 pour Août si début en Septembre)
  const endMonthStr = padZero(endMonth);

  // Le jour 0 du mois M (en base 1) retourne le dernier jour du mois M
  const lastDayOfMonth = new Date(endYear, endMonth, 0).getDate();
  const endDayStr = padZero(lastDayOfMonth);

  return {
    startDate: `${startYear}-${startMonthStr}-01`,
    endDate: `${endYear}-${endMonthStr}-${endDayStr}`
  };
}

/**
 * Calcule la plage exacte de dates de l'exercice comptable (exercice en cours ou N-1).
 * 
 * @param {string|Date|object|number} [referenceDate=new Date()] Date de référence
 * @param {number} [fiscalStartMonth=1] Mois de début d'exercice (1 = Janvier, 9 = Septembre, etc.)
 * @param {number} [offsetYears=0] Décalage en années (0 = en cours, -1 = N-1, +1 = N+1)
 * @returns {{ startDate: string, endDate: string, fiscalYearLabel: string }} Plage et libellé
 */
export function getFiscalYearDateRange(
  referenceDate = new Date(),
  fiscalStartMonth = DEFAULT_FISCAL_START_MONTH,
  offsetYears = 0
) {
  const fsm = Number(fiscalStartMonth) >= 1 && Number(fiscalStartMonth) <= 12 
    ? Number(fiscalStartMonth) 
    : DEFAULT_FISCAL_START_MONTH;

  const d = parseDateInput(referenceDate) || new Date();
  const currentMonth = d.getMonth() + 1;
  const currentYear = d.getFullYear();
  const offset = Number(offsetYears) || 0;

  let startYear;

  if (fsm === 1) {
    // Exercice aligné sur l'année civile
    startYear = currentYear + offset;
    return {
      startDate: `${startYear}-01-01`,
      endDate: `${startYear}-12-31`,
      fiscalYearLabel: `${startYear}`
    };
  }

  // Exercice décalé (ex: 1er Septembre au 31 Août)
  if (currentMonth >= fsm) {
    startYear = currentYear + offset;
  } else {
    startYear = currentYear - 1 + offset;
  }

  const endYear = startYear + 1;
  const endMonth = fsm - 1;
  const lastDay = new Date(endYear, endMonth, 0).getDate();

  return {
    startDate: `${startYear}-${padZero(fsm)}-01`,
    endDate: `${endYear}-${padZero(endMonth)}-${padZero(lastDay)}`,
    fiscalYearLabel: `${startYear}-${endYear}`
  };
}

/**
 * Vérifie si une saison donnée est strictement antérieure à la saison de référence (ou courante).
 * Compatible avec les formats "AAAA-AAAA" et "AAAA".
 * 
 * @param {string} season Saison à tester (ex. "2025-2026" ou "2025")
 * @param {string} [referenceSeason] Saison de comparaison (par défaut, la saison courante en septembre)
 * @returns {boolean} Vrai si la saison est passée
 */
export function isPastSeason(season, referenceSeason = getCurrentSeason()) {
  if (!season || !referenceSeason) return false;
  const startYear = parseInt(String(season).split('-')[0], 10);
  const refStartYear = parseInt(String(referenceSeason).split('-')[0], 10);
  if (isNaN(startYear) || isNaN(refStartYear)) return false;
  return startYear < refStartYear;
}

/**
 * Génère la liste des options de saisons disponibles pour les filtres et sélecteurs,
 * triée de manière antéchronologique (la plus récente d'abord).
 * 
 * @param {string} [currentSeason=getCurrentSeason()] Saison active
 * @param {Array<string>} [additionalSeasons=[]] Liste des saisons issues des données existantes
 * @returns {Array<string>} Liste unique des saisons triées par ordre décroissant
 */
export function getSeasonOptions(currentSeason = getCurrentSeason(), additionalSeasons = []) {
  const seasonsSet = new Set();

  if (currentSeason) {
    const trimmed = String(currentSeason).trim();
    seasonsSet.add(trimmed);

    // On ajoute également au moins les 2 saisons passées par défaut
    const startYear = parseInt(trimmed.split('-')[0], 10);
    if (!isNaN(startYear)) {
      if (trimmed.includes('-')) {
        seasonsSet.add(`${startYear - 1}-${startYear}`);
        seasonsSet.add(`${startYear - 2}-${startYear - 1}`);
      } else {
        seasonsSet.add(`${startYear - 1}`);
        seasonsSet.add(`${startYear - 2}`);
      }
    }
  }

  // Ajout des saisons trouvées dans les données existantes (ex. notes de frais)
  if (Array.isArray(additionalSeasons)) {
    additionalSeasons.forEach(s => {
      if (s && typeof s === 'string') {
        const clean = s.trim();
        if (clean.length >= 4) {
          seasonsSet.add(clean);
        }
      }
    });
  }

  // Tri par année de début décroissante (ex. 2026-2027 avant 2025-2026, ou 2026 avant 2025)
  return Array.from(seasonsSet).sort((a, b) => {
    const yearA = parseInt(String(a).split('-')[0], 10) || 0;
    const yearB = parseInt(String(b).split('-')[0], 10) || 0;
    return yearB - yearA;
  });
}

/**
 * Retourne l'identifiant de la saison précédente (N-1) pour une saison donnée.
 * Gère à la fois le format "AAAA-AAAA" et le format "AAAA".
 * 
 * @param {string} season Saison de référence (ex. "2026-2027" ou "2026")
 * @returns {string} Saison précédente (ex. "2025-2026" ou "2025")
 */
export function getPreviousSeason(season) {
  if (!season) return '';
  const trimmed = String(season).trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    const startYear = parseInt(parts[0], 10);
    if (!isNaN(startYear)) {
      return `${startYear - 1}-${startYear}`;
    }
  } else {
    const year = parseInt(trimmed, 10);
    if (!isNaN(year)) {
      return `${year - 1}`;
    }
  }
  return season;
}

