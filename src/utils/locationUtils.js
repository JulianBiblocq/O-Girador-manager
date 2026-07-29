/**
 * Utilitaire de formatage court des lieux pour les cartes, billets et vues résumées.
 * 
 * Règle 1 (Lieu enregistré) : Si le lieu correspond à un lieu pré-enregistré dans l'association,
 * ou au format "Nom - Adresse", retourne uniquement le nom usuel (ex: "Local matériel", "Ker Ivanic").
 * 
 * Règle 2 (Adresse libre / Google Maps) : S'il s'agit d'une adresse physique (ex: "12 Rue de la Paix, 75002 Paris, France"),
 * extrait et ne retourne que le nom de la ville (ex: "Paris", "Auray", "Vannes").
 * 
 * @param {string|Object} locationInput - Chaîne ou objet lieu de l'événement
 * @param {Array} lieuxImportants - Liste des lieux habituels de l'association
 * @returns {string} Libellé court du lieu
 */
export function formatLocationShort(locationInput, lieuxImportants = []) {
  if (!locationInput) return '';

  let raw = typeof locationInput === 'string' 
    ? locationInput 
    : (locationInput.lieu || locationInput.lieuSimple || locationInput.nom || '');
    
  if (!raw || typeof raw !== 'string') return '';
  raw = raw.trim();

  // Règle 1a : Format "Nom usuel - Adresse" (ex: "Local matériel - 12 Rue de la Musique, 75011 Paris")
  if (raw.includes(' - ')) {
    const parts = raw.split(' - ');
    const possibleName = parts[0].trim();
    if (possibleName) return possibleName;
  }

  // Règle 1b : Correspondance avec la liste des lieux importants configurés
  const list = Array.isArray(lieuxImportants) ? lieuxImportants : [];
  for (const lieu of list) {
    if (!lieu) continue;
    const nom = (lieu.nom || '').trim();
    const adr = (lieu.adresse || '').trim();
    
    if (nom && (raw === nom || raw.toLowerCase() === nom.toLowerCase())) {
      return nom;
    }
    if (nom && adr && (raw === `${nom} - ${adr}` || raw.toLowerCase() === `${nom.toLowerCase()} - ${adr.toLowerCase()}`)) {
      return nom;
    }
    if (nom && adr && raw.toLowerCase().includes(adr.toLowerCase())) {
      return nom;
    }
  }

  // Règle 2 : Extraction intelligente du nom de la ville depuis une adresse Google Maps
  // Format habituel : "Numéro Rue, CodePostal Ville, Pays" (ex: "12 Rue du Verger, 56400 Auray, France")
  const commaParts = raw.split(',').map(p => p.trim()).filter(Boolean);

  if (commaParts.length >= 2) {
    let targetPart = commaParts[commaParts.length - 1]; // ex: "France" ou "56400 Auray"
    
    // Si le dernier élément est le pays ("France", "Brésil", etc.), on prend l'élément précédent
    const isCountry = ['france', 'brasil', 'brésil', 'espagne', 'portugal', 'belgique', 'suisse'].includes(targetPart.toLowerCase());
    if (isCountry && commaParts.length >= 2) {
      targetPart = commaParts[commaParts.length - 2];
    }

    // Extraction du nom de ville en enlevant le code postal (5 chiffres en France)
    const cityCleaned = targetPart.replace(/^\d{5}\s*/, '').replace(/\s*\d{5}$/, '').trim();
    if (cityCleaned) {
      return cityCleaned;
    }
  }

  // Fallback avec Expression Régulière : Recherche un code postal à 5 chiffres suivi de la ville
  const postalCodeMatch = raw.match(/\d{5}\s+([A-Za-zÀ-ÖØ-öø-ÿ\s-]+)/);
  if (postalCodeMatch && postalCodeMatch[1]) {
    const cityCandidate = postalCodeMatch[1].trim().split(',')[0].trim();
    if (cityCandidate) return cityCandidate;
  }

  // Fallback générique : Si la chaîne est courte (< 28 caractères), on la conserve, sinon on tronque
  if (raw.length > 28) {
    return raw.substring(0, 28) + '...';
  }
  return raw;
}
