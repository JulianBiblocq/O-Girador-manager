/**
 * Utilitaire de formatage court des lieux pour les cartes, billets et vues résumées.
 * 
 * Règle 1 (Lieu enregistré) : Si l'événement ou la chaîne correspond à un lieu pré-enregistré
 * (via ID de lieu ou nom exact), ou au format "Nom usuel - Adresse", retourne uniquement le nom usuel (ex: "Local", "Ker Ivanic").
 * 
 * Règle 2 (Adresse libre / Google Maps) : S'il s'agit d'une adresse physique (ex: "12 Rue de la Paix, 75002 Paris, France"),
 * extrait et ne retourne que le nom de la ville (ex: "Paris", "Auray", "Vannes").
 * 
 * @param {string|Object} locationInput - Chaîne d'adresse ou objet événement complet
 * @param {Array} lieuxImportants - Liste des lieux pré-enregistrés de l'association
 * @returns {string} Libellé court du lieu
 */
export function formatLocationShort(locationInput, lieuxImportants = []) {
  if (!locationInput) return '';

  const list = Array.isArray(lieuxImportants) ? lieuxImportants : [];

  // 1. Si l'entrée est un objet événement, tentative de résolution directe via lieuId
  if (typeof locationInput === 'object' && locationInput !== null) {
    const targetLieuId = locationInput.lieuId || locationInput.lieu_id;
    if (targetLieuId && list.length > 0) {
      const foundById = list.find(l => l && l.id === targetLieuId);
      if (foundById && foundById.nom) {
        return foundById.nom.trim();
      }
    }
  }

  // Extraction de la chaîne de caractères brute du lieu
  let raw = typeof locationInput === 'string' 
    ? locationInput 
    : (locationInput.lieu || locationInput.lieuSimple || locationInput.nom || '');
    
  if (!raw || typeof raw !== 'string') return '';
  raw = raw.trim();

  // Règle 1a : Correspondance avec la liste des lieux importants configurés (par nom, adresse ou libellé combiné)
  for (const lieu of list) {
    if (!lieu) continue;
    const nom = (lieu.nom || '').trim();
    const adr = (lieu.adresse || '').trim();
    const id = (lieu.id || '').trim();
    
    if (nom) {
      const rawLower = raw.toLowerCase();
      const nomLower = nom.toLowerCase();
      const adrLower = adr.toLowerCase();

      if (rawLower === nomLower || (id && rawLower === id.toLowerCase())) {
        return nom;
      }
      if (adr && (rawLower === adrLower || rawLower === `${nomLower} - ${adrLower}` || rawLower === `${nomLower} – ${adrLower}`)) {
        return nom;
      }
      if (rawLower.startsWith(`${nomLower} -`) || rawLower.startsWith(`${nomLower} –`)) {
        return nom;
      }
      if (adr && adr.length > 5 && rawLower.includes(adrLower)) {
        return nom;
      }
    }
  }

  // Règle 1b : Format "Nom usuel - Adresse" (ex: "Local matériel - 12 Rue de la Musique, 75011 Paris")
  if (raw.includes(' - ') || raw.includes(' – ')) {
    const parts = raw.split(/\s+[-–]\s+/);
    const possibleName = parts[0].trim();
    // On s'assure que la partie initiale ressemble à un nom et non à un numéro de rue (ex: "12 Rue...")
    if (possibleName && !/^\d+\s+/.test(possibleName)) {
      return possibleName;
    }
  }

  // Règle 2 : Extraction intelligente du nom de la ville depuis une adresse Google Maps
  // Format habituel : "Numéro Rue, CodePostal Ville, Pays" ou "12 Rue du Verger, 56400 Auray, France"
  const commaParts = raw.split(',').map(p => p.trim()).filter(Boolean);

  if (commaParts.length >= 2) {
    // Élimination du pays si présent dans le dernier segment
    const countryRegex = /^(france|brésil|brasil|espagne|spain|portugal|belgique|belgium|suisse|switzerland|royaume-uni|united kingdom|uk|usa|united states)$/i;
    let targetIndex = commaParts.length - 1;

    if (countryRegex.test(commaParts[targetIndex]) && commaParts.length >= 2) {
      targetIndex--;
    }

    const candidatePart = commaParts[targetIndex];

    // Nettoyage du code postal (4 à 5 chiffres) et du terme CEDEX
    const cityCleaned = candidatePart
      .replace(/^\s*(?:\d{4,5}|cedex\s*\d*)\s*/i, '')
      .replace(/\s*(?:\d{4,5}|cedex\s*\d*)\s*$/i, '')
      .trim();

    // Si on a extrait un nom de ville valide (sans mots d'adresse de rue)
    const streetKeywordsRegex = /^(rue|avenue|bd|boulevard|place|allée|chemin|impasse|route|squ|square)\s+/i;
    if (cityCleaned && !streetKeywordsRegex.test(cityCleaned)) {
      return cityCleaned;
    }
  }

  // Fallback avec Expression Régulière : Recherche d'un code postal à 5 chiffres suivi du nom de la ville
  const postalCodeMatch = raw.match(/\b\d{5}\b\s*([A-Za-zÀ-ÖØ-öø-ÿ\s-]+)/);
  if (postalCodeMatch && postalCodeMatch[1]) {
    const cityCandidate = postalCodeMatch[1].trim().split(',')[0].replace(/france|brésil|brasil/i, '').trim();
    if (cityCandidate) return cityCandidate;
  }

  // Fallback générique : Si la chaîne est courte (< 28 caractères), on la conserve, sinon on tronque
  if (raw.length > 28) {
    return raw.substring(0, 28) + '...';
  }
  return raw;
}

