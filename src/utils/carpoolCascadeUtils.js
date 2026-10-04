/**
 * Utilitaires pour la gestion en cascade du covoiturage lors du désistement ou de la modification de présence d'un membre.
 *
 * Garantit l'absence d'orphelins :
 * - Libération immédiate des places passagers et instruments.
 * - Retrait de la file d'attente recherchePlace.
 * - Bascule automatique des passagers et matériels en recherche de place lors du retrait d'un véhicule.
 */

/**
 * Analyse la situation de covoiturage d'un membre sur un événement.
 * Détecte s'il est conducteur, s'il a des passagers ou des instruments tiers assignés.
 *
 * @param {Object} event Objet événement complet ou objet covoiturage
 * @param {string} userId Identifiant unique du membre à analyser
 * @returns {Object} Diagnostic du rôle et des tiers assignés dans le véhicule
 */
export const inspectDriverCarpoolSituation = (event, userId) => {
  if (!userId) {
    return {
      isDriver: false,
      driverCar: null,
      hasThirdParty: false,
      passengersCount: 0,
      instrumentsCount: 0,
      thirdPartyPassengers: [],
      thirdPartyItems: []
    };
  }

  const covoiturage = event?.covoiturage || (Array.isArray(event?.voitures) ? event : null);
  const voitures = Array.isArray(covoiturage?.voitures) ? covoiturage.voitures : [];
  const driverCar = voitures.find(v => v.chauffeurId === userId) || null;

  if (!driverCar) {
    return {
      isDriver: false,
      driverCar: null,
      hasThirdParty: false,
      passengersCount: 0,
      instrumentsCount: 0,
      thirdPartyPassengers: [],
      thirdPartyItems: []
    };
  }

  const allItems = driverCar.passengers || driverCar.passagers || [];
  // Éléments tiers assignés dans le véhicule (exclut le conducteur lui-même s'il y figure)
  const thirdPartyItems = allItems.filter(p => p && p.uid !== userId);

  // Passagers physiques tiers (isPassenger !== false)
  const thirdPartyPassengers = thirdPartyItems.filter(p => p.isPassenger !== false);
  const passengersCount = thirdPartyPassengers.length;

  // Instruments tiers (alfaias transportées pour tiers ou transport d'instrument seul)
  const instrumentsCount = thirdPartyItems.reduce((sum, p) => {
    const alfayas = Number(p.alfayasCount) || 0;
    const isInstrumentOnly = p.isPassenger === false;
    return sum + (alfayas > 0 ? alfayas : (isInstrumentOnly ? 1 : 0));
  }, 0);

  const hasThirdParty = thirdPartyItems.length > 0 || passengersCount > 0 || instrumentsCount > 0;

  return {
    isDriver: true,
    driverCar,
    hasThirdParty,
    passengersCount,
    instrumentsCount,
    thirdPartyPassengers,
    thirdPartyItems
  };
};

/**
 * Construit le message préventif de confirmation Cordel pour un conducteur ayant des passagers/instruments.
 *
 * @param {Object} situation Diagnostic produit par inspectDriverCarpoolSituation
 * @returns {string} Message formaté
 */
export const buildDriverDepartureWarningMessage = (situation) => {
  const { passengersCount = 0, instrumentsCount = 0 } = situation || {};

  const parts = [];
  if (passengersCount > 0) {
    parts.push(`${passengersCount} passager${passengersCount > 1 ? 's' : ''}`);
  }
  if (instrumentsCount > 0) {
    parts.push(`${instrumentsCount} instrument${instrumentsCount > 1 ? 's' : ''}`);
  }

  const countDesc = parts.length > 0 ? parts.join(' et ') : 'des passagers ou instruments';

  return `Tu as ${countDesc} inscrit(s) dans ton véhicule. En te déclarant absent, ta voiture sera retirée et tes passagers basculeront automatiquement en recherche de place. Confirmer ?`;
};

/**
 * Applique le nettoyage en cascade du covoiturage et des inscriptions pour un membre se déclarant absent.
 * Fonction pure sans effet de bord, idéale pour les transactions Firestore.
 *
 * Règles :
 * 1. Passager ou demandeur : retrait silencieux de la voiture où il était inscrit et de recherchePlace.
 * 2. Conducteur sans tiers : retrait direct du véhicule.
 * 3. Conducteur avec tiers : retrait du véhicule, bascule de tous les passagers tiers dans recherchePlace
 *    et des instruments tiers en recherche matériel, avec mise à jour de leur transport d'inscription.
 *
 * @param {Object} covoiturage Données covoiturage actuelles ({ voitures, recherchePlace })
 * @param {Array} inscriptions Liste actuelle des inscriptions de l'événement
 * @param {string} userId Identifiant du membre concerné
 * @returns {Object} { updatedCovoiturage, updatedInscriptions }
 */
export const applyCarpoolAbsenceCascade = (covoiturage = {}, inscriptions = [], userId) => {
  if (!userId) {
    return {
      updatedCovoiturage: covoiturage,
      updatedInscriptions: inscriptions
    };
  }

  const rawVoitures = Array.isArray(covoiturage?.voitures) ? covoiturage.voitures : [];
  const rawRecherche = Array.isArray(covoiturage?.recherchePlace) ? covoiturage.recherchePlace : [];
  const rawInscriptions = Array.isArray(inscriptions) ? inscriptions : [];

  let updatedRecherche = [...rawRecherche];
  let updatedInscriptions = [...rawInscriptions];

  // 1. Recherche du véhicule conduit par le membre
  const driverCar = rawVoitures.find(v => v.chauffeurId === userId);

  if (driverCar) {
    const thirdPartyItems = (driverCar.passengers || driverCar.passagers || []).filter(p => p && p.uid !== userId);

    thirdPartyItems.forEach(p => {
      const isPhysicalPassenger = p.isPassenger !== false;
      const hasInstruments = Boolean(p.isPassenger === false || Number(p.alfayasCount) > 0);
      const existingIndex = updatedRecherche.findIndex(r => r.uid === p.uid);

      if (existingIndex >= 0) {
        updatedRecherche[existingIndex] = {
          ...updatedRecherche[existingIndex],
          cherchePassager: updatedRecherche[existingIndex].cherchePassager || isPhysicalPassenger,
          chercheInstrument: updatedRecherche[existingIndex].chercheInstrument || hasInstruments,
          doitRentrerDirect: updatedRecherche[existingIndex].doitRentrerDirect || Boolean(p.doitRentrerDirect)
        };
      } else {
        updatedRecherche.push({
          uid: p.uid,
          nom: p.nom || p.name || 'Membre',
          cherchePassager: isPhysicalPassenger,
          chercheInstrument: hasInstruments,
          doitRentrerDirect: Boolean(p.doitRentrerDirect),
          ...(p.isInvite ? { isInvite: true } : {})
        });
      }

      // Bascule du transport des passagers membres vers la recherche de place
      if (!p.isInvite) {
        updatedInscriptions = updatedInscriptions.map(ins => {
          if (ins.userId === p.uid && ins.transport !== 'cherche_place' && ins.transport !== 'cherche') {
            return {
              ...ins,
              transport: 'cherche_place'
            };
          }
          return ins;
        });
      }
    });
  }

  // 2. Retrait du véhicule conduit par userId ET libération de sa place s'il était passager ailleurs
  const updatedVoitures = rawVoitures
    .filter(v => v.chauffeurId !== userId)
    .map(v => {
      const currentPassengers = v.passengers || v.passagers || [];
      const hasUser = currentPassengers.some(p => p && p.uid === userId);
      if (!hasUser) return v;
      return {
        ...v,
        passengers: currentPassengers.filter(p => p && p.uid !== userId)
      };
    });

  // 3. Retrait de userId de la liste d'attente recherchePlace
  updatedRecherche = updatedRecherche.filter(p => p && p.uid !== userId);

  // 4. Réinitialisation des attributs de transport pour l'inscription de userId
  let memberFound = false;
  updatedInscriptions = updatedInscriptions.map(ins => {
    if (ins.userId === userId) {
      memberFound = true;
      return {
        ...ins,
        status: 'absent',
        transport: null,
        demandeRemboursementKm: false,
        besoinTransportInstrument: false,
        places: 0,
        instruments: "",
        instrumentChoisi: null
      };
    }
    return ins;
  });

  return {
    updatedCovoiturage: {
      ...covoiturage,
      voitures: updatedVoitures,
      recherchePlace: updatedRecherche
    },
    updatedInscriptions
  };
};
