/**
 * Utilitaire de formatage court des lieux pour les cartes, billets et vues résumées.
 * 
 * Étape 1 (Vérification d'objet & ID) : Résolution par objet/ID ou nom exact dans lieuxImportants sans modification.
 * Étape 2 (Vérification de chaîne simple) : Si l'adresse ne contient pas de virgule (ex: "Salle Pérou", "Local"), retourne la chaîne telle quelle.
 * Étape 3 (Adresse Google Maps complète) : Si (et seulement si) la chaîne contient des virgules (ex: "12 Rue de la Paix, 75000 Paris, France"), extrait et nettoie la Ville.
 * Étape 4 (Fallback) : En cas d'échec du parsing, retourne la chaîne brute d'origine plutôt qu'une chaîne vide ou mutilée.
 * 
 * @param {string|Object} locationInput - Chaîne d'adresse ou objet événement complet
 * @param {Array} lieuxImportants - Liste des lieux pré-enregistrés de l'association
 * @returns {string} Libellé court du lieu
 */
export function formatLocationShort(locationInput, lieuxImportants = []) {
  if (!locationInput) return '';

  const list = Array.isArray(lieuxImportants) ? lieuxImportants : [];

  // Étape 1 : Vérification d'objet & ID ou correspondance avec la liste pré-enregistrée
  let raw = '';
  let targetLieuId = null;

  if (typeof locationInput === 'object' && locationInput !== null) {
    targetLieuId = locationInput.lieuId || locationInput.lieu_id || null;
    raw = locationInput.lieu || locationInput.lieuSimple || locationInput.nom || '';
  } else if (typeof locationInput === 'string') {
    raw = locationInput;
  }

  raw = (typeof raw === 'string') ? raw.trim() : '';

  // 1a. Vérification si un lieuId correspond dans la liste des lieux importants
  if (targetLieuId && list.length > 0) {
    const foundById = list.find(l => l && l.id === targetLieuId);
    if (foundById) {
      const nomUsuel = foundById.nom || foundById.nomUsuel || foundById.name || '';
      if (nomUsuel) {
        return nomUsuel.trim();
      }
    }
  }

  // 1b. Vérification si la chaîne brute correspond à un lieu pré-enregistré dans lieuxImportants
  if (raw && list.length > 0) {
    const rawLower = raw.toLowerCase();
    for (const lieu of list) {
      if (!lieu) continue;
      const nom = (lieu.nom || lieu.nomUsuel || lieu.name || '').trim();
      const adr = (lieu.adresse || '').trim();
      const id = (lieu.id || '').trim();

      if (nom) {
        const nomLower = nom.toLowerCase();
        const adrLower = adr.toLowerCase();

        // Correspondance exacte sur le nom, l'ID ou l'adresse
        if (rawLower === nomLower || (id && rawLower === id.toLowerCase())) {
          return nom;
        }
        if (adr && (rawLower === adrLower || rawLower === `${nomLower} - ${adrLower}` || rawLower === `${nomLower} – ${adrLower}`)) {
          return nom;
        }
        if (rawLower.startsWith(`${nomLower} -`) || rawLower.startsWith(`${nomLower} –`)) {
          return nom;
        }
      }
    }
  }

  // Si nous n'avons pas de chaîne brute exploitable
  if (!raw) {
    return '';
  }

  let result = raw;

  // Étape 2 : Vérification de chaîne simple (sans virgule)
  if (!raw.includes(',')) {
    // Si la chaîne contient " - ", on extrait éventuellement le nom usuel avant tiret si valide
    if (raw.includes(' - ') || raw.includes(' – ')) {
      const parts = raw.split(/\s+[-–]\s+/);
      const possibleName = parts[0].trim();
      if (possibleName && !/^\d+\s+/.test(possibleName)) {
        result = possibleName;
      } else {
        result = raw;
      }
    } else {
      result = raw;
    }
  } else {
    // Étape 3 : Adresse Google Maps complète avec virgules
    const commaParts = raw.split(',').map(p => p.trim()).filter(Boolean);

    if (commaParts.length >= 2) {
      const countryRegex = /^(france|brésil|brasil|espagne|spain|portugal|belgique|belgium|suisse|switzerland|royaume-uni|united kingdom|uk|usa|united states)$/i;
      let targetIndex = commaParts.length - 1;

      // On écarte le pays s'il est présent à la fin
      if (countryRegex.test(commaParts[targetIndex]) && commaParts.length >= 2) {
        targetIndex--;
      }

      const cityPart = commaParts[targetIndex];

      // Nettoyage des chiffres (code postal) et espaces avec Regex propre
      const cityCleaned = cityPart
        .replace(/\d+/g, '')
        .replace(/\bcedex\b/gi, '')
        .trim();

      const streetKeywordsRegex = /^(rue|avenue|bd|boulevard|place|allée|chemin|impasse|route|squ|square)\s+/i;
      if (cityCleaned && !streetKeywordsRegex.test(cityCleaned)) {
        result = cityCleaned;
      } else {
        result = raw;
      }
    }
  }

  // Étape 4 : Fallback - retourne la chaîne d'origine plutôt qu'une chaîne vide ou mutilée
  if (!result || typeof result !== 'string') {
    result = raw;
  }

  return result;
}

