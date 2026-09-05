/**
 * Utilitaire : secretariatMetrics.js
 * 
 * Module de calcul pur (sans état ni appels réseau directs) pour les indicateurs consolidés du Secrétariat :
 * 1. Ancrage communal et répartition géographique (critère subvention Cerfa n° 12156).
 * 2. Cumul d'heures d'activité collective, de représentations publiques et valorisation du bénévolat Cerfa.
 * 3. Mesure d'audience, sollicitations et conversion issues de la Vitrine publique.
 */

/**
 * Nettoie une chaîne de caractères (supprime les accents, met en minuscules, retire les espaces superflus).
 * 
 * @param {string} str 
 * @returns {string}
 */
export const normalizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Harmonise et normalise le nom d'un pupitre ou instrument pour les rapports et bilans consolidés.
 * Prévient les scissions et doublons dus aux écarts de casse (ex: "caixa" vs "Caixa") ou aux variantes orthographiques.
 * 
 * @param {string} rawName Nom brut du pupitre ou instrument
 * @returns {string} Nom canonique normalisé
 */
export const normalizePupitreName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return 'Non défini';
  const trimmed = rawName.trim();
  if (!trimmed) return 'Non défini';

  const lower = trimmed.toLowerCase();
  if (lower === 'non défini' || lower === 'non defini' || lower === 'aucun' || lower === 'undefined') {
    return 'Non défini';
  }

  // Correspondances canoniques Maracatu / O-Girador
  if (lower === 'caixa' || lower === 'caixas' || lower === 'caisse' || lower === 'caisse claire') return 'Caixa';
  if (lower === 'alfaia' || lower === 'alfaias') return 'Alfaia';
  if (lower === 'agbe' || lower === 'agbê' || lower === 'agbes' || lower === 'agbês') return 'Agbê';
  if (lower === 'gongue' || lower === 'gonguê' || lower === 'gongues' || lower === 'gonguês') return 'Gonguê';
  if (lower === 'tarol' || lower === 'tarols') return 'Tarol';
  if (lower === 'mineiro' || lower === 'mineiros') return 'Mineiro';
  if (lower === 'timbal' || lower === 'timbau' || lower === 'timbals') return 'Timbal';
  if (lower === 'chant' || lower === 'chants' || lower === 'voix') return 'Chant';
  if (lower === 'danse' || lower === 'danses') return 'Danse';
  if (lower === 'mestre') return 'Mestre';

  // Capitalisation standard de la première lettre
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Extrait le code postal et le nom présumé de la commune depuis une adresse textuelle.
 * 
 * @param {string} addressStr 
 * @returns {{ postalCode: string|null, city: string|null }}
 */
export const extractPostalCodeAndCity = (addressStr) => {
  if (!addressStr || typeof addressStr !== 'string') {
    return { postalCode: null, city: null };
  }

  // Expression régulière pour capturer les codes postaux français (Métropole + Corse + DROM-COM)
  const cpRegex = /\b(2[AB]|\d{2})\d{3}\b/;
  const match = addressStr.match(cpRegex);

  if (!match) {
    return { postalCode: null, city: null };
  }

  const postalCode = match[0];
  const postCpText = addressStr.slice(match.index + postalCode.length).trim();

  // Extraction de la ville juste après le code postal
  let city = null;
  if (postCpText) {
    // Nettoyage de la ponctuation résiduelle au début (virgules, tirets)
    const cleaned = postCpText.replace(/^[\s,;.-]+/, '');
    // Récupérer le premier segment avant une éventuelle virgule, saut de ligne ou parenthèse
    const firstSegment = cleaned.split(/[\r\n,;()]/)[0].trim();
    if (firstSegment) {
      city = firstSegment;
    }
  }

  return { postalCode, city };
};

/**
 * Calcule les statistiques territoriales des membres (ancrage communal).
 * 
 * @param {Array<Object>} members Liste brute des membres de l'association
 * @param {string} associationAddress Adresse du siège social de l'association
 * @returns {Object} Statistiques d'ancrage communal et top 5 des communes
 */
export const computeTerritorialStats = (members = [], associationAddress = '') => {
  const { postalCode: siegeCP, city: siegeVille } = extractPostalCodeAndCity(associationAddress);
  const normalizedSiegeVille = normalizeString(siegeVille);

  let totalAudited = 0;
  let communeMembersCount = 0;
  let externalMembersCount = 0;

  // Dictionnaire de regroupement des communes pour le Top 5
  const communesMap = {};

  const activeMembers = members.filter(m => !m.statutActuel || m.statutActuel === 'active');

  activeMembers.forEach((member) => {
    const cp = (member.adresseCP || member.adresseCodePostal || '').trim();
    const rawVille = (member.adresseVille || '').trim();
    const normalizedMemberVille = normalizeString(rawVille);

    // Un membre est audité s'il a au moins un code postal ou une ville renseignée
    if (cp || rawVille) {
      totalAudited++;

      // Détection de l'ancrage communal (match sur code postal OU nom de commune)
      const isSameCP = Boolean(siegeCP && cp && cp === siegeCP);
      const isSameCity = Boolean(normalizedSiegeVille && normalizedMemberVille && normalizedMemberVille === normalizedSiegeVille);

      if (isSameCP || isSameCity) {
        communeMembersCount++;
      } else {
        externalMembersCount++;
      }

      // Regroupement pour le classement des communes
      const keyVille = normalizedMemberVille || (cp ? `CP ${cp}` : 'Inconnue');
      const displayLabel = rawVille 
        ? rawVille.charAt(0).toUpperCase() + rawVille.slice(1).toLowerCase() 
        : (cp ? `CP ${cp}` : 'Inconnue');

      if (!communesMap[keyVille]) {
        communesMap[keyVille] = {
          name: displayLabel,
          count: 0
        };
      }
      communesMap[keyVille].count++;
    }
  });

  // Tri et formatage des 5 communes les plus représentées
  const topCommunes = Object.values(communesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      ville: item.name,
      count: item.count,
      percent: totalAudited > 0 ? Math.round((item.count / totalAudited) * 100) : 0
    }));

  const communeMembersPercent = totalAudited > 0 
    ? Math.round((communeMembersCount / totalAudited) * 100) 
    : 0;

  const externalMembersPercent = totalAudited > 0 
    ? Math.round((externalMembersCount / totalAudited) * 100) 
    : 0;

  return {
    totalAudited,
    totalActiveMembers: activeMembers.length,
    communeMembersCount,
    communeMembersPercent,
    externalMembersCount,
    externalMembersPercent,
    topCommunes,
    siegeCP,
    siegeVille: siegeVille || (siegeCP ? `CP ${siegeCP}` : null)
  };
};

/**
 * Détermine la durée en heures d'un événement à partir de ses données.
 * Tolère les formats 'heureDebut'/'heureFin' (ex: "14:00"), les dates ISO ou les dates JS.
 * 
 * @param {Object} event Événement à analyser
 * @returns {number} Durée en heures
 */
export const calculateEventDurationHours = (event = {}) => {
  // 1. Analyse des champs 'heureDebut' et 'heureFin'
  const timeRegex = /^([0-1]?\d|2[0-3])[:hH]([0-5]\d)$/;
  const hDeb = event.heureDebut && typeof event.heureDebut === 'string' ? event.heureDebut.trim() : null;
  const hFin = event.heureFin && typeof event.heureFin === 'string' ? event.heureFin.trim() : null;

  if (hDeb && hFin) {
    const matchDeb = hDeb.match(timeRegex);
    const matchFin = hFin.match(timeRegex);
    if (matchDeb && matchFin) {
      const minutesDeb = parseInt(matchDeb[1], 10) * 60 + parseInt(matchDeb[2], 10);
      let minutesFin = parseInt(matchFin[1], 10) * 60 + parseInt(matchFin[2], 10);
      // Prise en compte d'un événement qui se termine après minuit
      if (minutesFin < minutesDeb) {
        minutesFin += 24 * 60;
      }
      const diffMinutes = minutesFin - minutesDeb;
      if (diffMinutes > 0 && diffMinutes <= 24 * 60) {
        return Math.round((diffMinutes / 60) * 10) / 10;
      }
    }
  }

  // 2. Analyse des dates complètes 'date' / 'dateFin' avec horaires ISO
  if (event.date && event.dateFin) {
    const d1 = new Date(event.date);
    const d2 = new Date(event.dateFin);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diffMs = d2.getTime() - d1.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours <= 48) {
        return Math.round(diffHours * 10) / 10;
      }
    }
  }

  // 3. Durée déclarative explicite 'duree' (en heures ou minutes)
  if (event.duree) {
    const parsed = parseFloat(event.duree);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 24) {
      return parsed;
    }
  }

  // 4. Durées par défaut selon le type d'événement
  const type = event.type || 'autre';
  if (type === 'repetition' || type === 'reunion') {
    return 2.0; // 2 heures par défaut pour une répétition ou réunion
  }
  return 4.0; // 4 heures par défaut pour une prestation scénique, un stage ou un atelier
};

/**
 * Calcule le cumul des heures de représentations publiques et la valorisation du bénévolat Cerfa.
 * 
 * @param {Array<Object>} events Liste des événements filtrés sur la période
 * @param {number} activeMembersCount Nombre de membres actifs
 * @param {Object} [settings={}] Paramètres associatifs (forfaits administratifs/artisanaux)
 * @returns {Object} Cumuls d'heures de jeu public, activité collective et bénévolat Cerfa
 */
export const computeVolunteeringAndActivity = (events = [], activeMembersCount = 0, settings = {}) => {
  let totalPublicPlayingHours = 0;
  let totalCollectiveVolunteerHours = 0;
  let totalPrestationVolunteerHours = 0;
  let eventsAuditedCount = 0;

  // Filtrer les événements annulés ou non confirmés
  const validEvents = events.filter(e => {
    if (!e) return false;
    const status = (e.status || '').toLowerCase();
    if (status === 'annule' || status === 'refuse' || status === 'option') return false;
    return true;
  });

  validEvents.forEach(event => {
    eventsAuditedCount++;
    const duration = calculateEventDurationHours(event);

    // Calcul des présents effectifs
    const presentsCount = (event.inscriptions || []).filter(i => i.status === 'present').length 
      + ((event.invitesExternes || []).length);

    // Heures-participants cumulées
    const participantHours = duration * presentsCount;
    totalCollectiveVolunteerHours += participantHours;

    // Cumul spécifique pour les prestations publiques
    if (event.type === 'prestation') {
      totalPublicPlayingHours += duration;
      totalPrestationVolunteerHours += participantHours;
    }
  });

  // Forfaits annuels déclaratifs valorisables dans le formulaire Cerfa 12156
  const forfaitHeuresAdmin = Number(settings.forfaitHeuresAdmin) || 120; // Réunions de bureau, comptabilité, déclarations
  const forfaitHeuresArtisanat = Number(settings.forfaitHeuresArtisanat) || 80; // Fabrication, accordage, couture bénévole

  // Total général valorisé Cerfa
  const totalCerfaVolunteerHours = Math.round(
    (totalCollectiveVolunteerHours + forfaitHeuresAdmin + forfaitHeuresArtisanat) * 10
  ) / 10;

  return {
    totalPublicPlayingHours: Math.round(totalPublicPlayingHours * 10) / 10,
    totalCollectiveVolunteerHours: Math.round(totalCollectiveVolunteerHours * 10) / 10,
    totalPrestationVolunteerHours: Math.round(totalPrestationVolunteerHours * 10) / 10,
    forfaitHeuresAdmin,
    forfaitHeuresArtisanat,
    totalCerfaVolunteerHours,
    eventsAuditedCount
  };
};

/**
 * Analyse l'audience et les retombées de la Vitrine publique (demandes de devis et conversions).
 * 
 * @param {Array<Object>} gigs Liste des dossiers de diffusion
 * @param {number} vitrineViews Nombre global de consultations de la vitrine
 * @param {Function} isWithinRange Fonction de vérification de date
 * @returns {Object} Indicateurs d'audience et de conversion vitrine
 */
export const computeAudienceAndDiffusion = (gigs = [], vitrineViews = 0, isWithinRange = () => true) => {
  // Filtrer les dossiers issus de la vitrine publique créés dans la période
  const vitrineGigs = gigs.filter(gig => {
    if (!gig) return false;
    const isVitrine = gig.source === 'vitrine_publique';
    if (!isVitrine) return false;

    // Vérification de la date de création du dossier
    const gigDate = gig.createdAt || gig.date;
    return isWithinRange(gigDate);
  });

  const vitrineRequestsTotal = vitrineGigs.length;

  // Statuts considérés comme ayant converti la demande en démarche concrète
  const convertingStatuses = ['3_devis', '4_contrat', '5_facture', '6_paye', '6_valide'];

  let vitrineRequestsConverted = 0;
  vitrineGigs.forEach(gig => {
    const st = String(gig.status || '').toLowerCase();
    const isConverted = convertingStatuses.some(statusId => st.includes(statusId));
    if (isConverted) {
      vitrineRequestsConverted++;
    }
  });

  const conversionRate = vitrineRequestsTotal > 0 
    ? Math.round((vitrineRequestsConverted / vitrineRequestsTotal) * 100) 
    : 0;

  return {
    vitrineViews: Number(vitrineViews) || 0,
    vitrineRequestsTotal,
    vitrineRequestsConverted,
    conversionRate
  };
};
