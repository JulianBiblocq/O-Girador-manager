/**
 * Utilitaires pour la résolution des instruments et de leurs pictogrammes Cordel (xylogravures).
 */

/**
 * Retourne le chemin du pictogramme SVG correspondant à un instrument ou un pupitre.
 * Gère les sous-voix (ex : Marcante, Meião, Repique pour l'Alfaia ; Tarol pour la Caixa)
 * et les familles liées (ex : Sementes pour Agbê).
 *
 * @param {string} instName Nom de l'instrument ou du pupitre
 * @returns {string} Chemin relatif vers le fichier SVG (dans /icones/)
 */
export const getInstrumentIconPath = (instName) => {
  if (!instName || typeof instName !== 'string') return '/favicon.svg';

  const name = instName.toLowerCase().trim();

  // 1. Danse
  if (name.includes('danse') || name.includes('dance')) {
    return '/icones/danse.svg';
  }

  // 2. Pupitre Alfaias et sous-voix (Marcante, Meião, Repique)
  if (
    name.includes('alfaia') ||
    name.includes('marcante') ||
    name.includes('meião') ||
    name.includes('meiao') ||
    name.includes('repique')
  ) {
    return '/icones/alfaia.svg';
  }

  // 3. Sementes / Agbê / Shekere
  if (
    name.includes('agbê') ||
    name.includes('agbe') ||
    name.includes('sementes') ||
    name.includes('shekere') ||
    name.includes('xequere')
  ) {
    return '/icones/agbe.svg';
  }

  // 4. Gonguê / Cloche
  if (name.includes('gonguê') || name.includes('gongue') || name.includes('cloche')) {
    return '/icones/gongue.svg';
  }

  // 5. Caixas / Tarol
  if (
    name.includes('caixa') ||
    name.includes('tarol') ||
    name.includes('caisse') ||
    name.includes('snare')
  ) {
    return '/icones/caixa.svg';
  }

  // 6. Chant / Voix / Chœur
  if (
    name.includes('chant') ||
    name.includes('voix') ||
    name.includes('singer') ||
    name.includes('micro') ||
    name.includes('vocal')
  ) {
    return '/icones/micro.svg';
  }

  // 7. Timbal
  if (name.includes('timbal') || name.includes('timbau')) {
    return '/icones/timbal.svg';
  }

  // 8. Mineiro / Ganza / Shaker
  if (name.includes('mineiro') || name.includes('ganza') || name.includes('shaker')) {
    return '/icones/mineiro.svg';
  }

  // 9. Apito / Rôle Mestre
  if (name.includes('apito') || name.includes('mestre') || name.includes('chef') || name.includes('sifflet')) {
    return '/icones/apito.svg';
  }

  // Par défaut, retourner le favicon si aucun pictogramme n'est trouvé
  return '/favicon.svg';
};

/**
 * Formate la liste des pratiques d'un membre (instruments de percussion et/ou danse).
 * Prise en compte rigoureuse des membres danseurs purs et polyvalents.
 *
 * @param {Object} user Données de profil du membre
 * @returns {string} Chaîne formatée (ex: "Caixa, Danse", "Danse", "En attente" ou "-")
 */
export const formatPratiques = (user) => {
  if (!user) return '-';
  const liste = [];
  // Récupérer les instruments (tableau ou string unique)
  if (Array.isArray(user.instrumentsJoues) && user.instrumentsJoues.length > 0) {
    liste.push(...user.instrumentsJoues);
  } else if (user.instrumentPrincipal) {
    liste.push(user.instrumentPrincipal);
  } else if (user.instrument && user.instrument !== 'En attente') {
    liste.push(user.instrument);
  }
  // Ajouter la Danse si le membre la pratique
  if (user.pratiqueDanse) {
    if (!liste.some(i => typeof i === 'string' && i.toLowerCase().trim() === 'danse')) {
      liste.push('Danse');
    }
  }
  return liste.length > 0 ? liste.join(', ') : (user.statutActuel === 'en_attente' ? 'En attente' : '-');
};

/**
 * Retourne le tableau des pratiques d'un membre pour affichage structuré (badges/tags).
 *
 * @param {Object} user Données de profil du membre
 * @returns {string[]} Liste des instruments et pratiques (incluant "Danse" si pratiquée)
 */
export const getPratiquesList = (user) => {
  if (!user) return [];
  const liste = [];
  if (Array.isArray(user.instrumentsJoues) && user.instrumentsJoues.length > 0) {
    liste.push(...user.instrumentsJoues);
  } else if (user.instrumentPrincipal) {
    liste.push(user.instrumentPrincipal);
  } else if (user.instrument && user.instrument !== 'En attente') {
    liste.push(user.instrument);
  }
  if (user.pratiqueDanse) {
    if (!liste.some(i => typeof i === 'string' && i.toLowerCase().trim() === 'danse')) {
      liste.push('Danse');
    }
  }
  return liste;
};

