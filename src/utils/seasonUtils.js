/**
 * Utilitaires pour la gestion et le calcul des saisons associatives.
 * 
 * Règle associative : La saison débute le 1er septembre et s'achève le 31 août.
 * - Mois >= 8 (septembre, octobre, novembre, décembre) : Saison = `${Y}-${Y+1}`
 * - Mois < 8 (janvier à août) : Saison = `${Y-1}-${Y}`
 */

/**
 * Calcule l'identifiant de la saison (ex. "2026-2027") à partir d'une date donnée.
 * 
 * @param {string|Date|object} dateInput Date sous forme d'objet Date, string YYYY-MM-DD ou Timestamp Firestore
 * @returns {string} Identifiant de saison sous format "AAAA-AAAA"
 */
export function getSeasonFromDate(dateInput) {
  if (!dateInput) {
    return getCurrentSeason();
  }

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
  } else {
    d = new Date(dateInput);
  }

  // Vérification de la validité de la date
  if (isNaN(d.getTime())) {
    return getCurrentSeason();
  }

  const month = d.getMonth(); // 0 = Janvier, 8 = Septembre
  const year = d.getFullYear();

  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Retourne la saison associative actuellement en cours.
 * 
 * @returns {string} Saison courante (ex. "2026-2027")
 */
export function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Vérifie si une saison donnée est strictement antérieure à la saison de référence (ou courante).
 * 
 * @param {string} season Saison à tester (ex. "2025-2026")
 * @param {string} [referenceSeason] Saison de comparaison (par défaut, la saison courante)
 * @returns {boolean} Vrai si la saison est passée
 */
export function isPastSeason(season, referenceSeason = getCurrentSeason()) {
  if (!season || !referenceSeason) return false;
  const startYear = parseInt(season.split('-')[0], 10);
  const refStartYear = parseInt(referenceSeason.split('-')[0], 10);
  if (isNaN(startYear) || isNaN(refStartYear)) return false;
  return startYear < refStartYear;
}

/**
 * Génère la liste des options de saisons disponibles pour les filtres et sélecteurs,
 * triée de manière antéchronologique (la plus récente d'abord).
 * 
 * @param {string} currentSeason Saison active
 * @param {Array<string>} [additionalSeasons=[]] Liste des saisons issues des données existantes
 * @returns {Array<string>} Liste unique des saisons triées par ordre décroissant
 */
export function getSeasonOptions(currentSeason = getCurrentSeason(), additionalSeasons = []) {
  const seasonsSet = new Set();
  if (currentSeason) {
    seasonsSet.add(currentSeason);
    // On ajoute également au moins les 2 saisons passées par défaut
    const startYear = parseInt(currentSeason.split('-')[0], 10);
    if (!isNaN(startYear)) {
      seasonsSet.add(`${startYear - 1}-${startYear}`);
      seasonsSet.add(`${startYear - 2}-${startYear - 1}`);
    }
  }

  // Ajout des saisons trouvées dans les notes de frais existantes
  if (Array.isArray(additionalSeasons)) {
    additionalSeasons.forEach(s => {
      if (s && typeof s === 'string' && s.includes('-')) {
        seasonsSet.add(s.trim());
      }
    });
  }

  // Tri par année de début décroissante (ex. 2026-2027 avant 2025-2026)
  return Array.from(seasonsSet).sort((a, b) => {
    const yearA = parseInt(a.split('-')[0], 10) || 0;
    const yearB = parseInt(b.split('-')[0], 10) || 0;
    return yearB - yearA;
  });
}
