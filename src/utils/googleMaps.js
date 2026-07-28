let googleMapsPromise = null;

/**
 * Charge dynamiquement le SDK Google Maps JS avec la bibliothèque Places.
 * Réutilise la même promesse pour ne pas injecter plusieurs balises script.
 */
export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window est indéfini'));
  
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey) {
          reject(new Error('La clé d\'API (VITE_GOOGLE_MAPS_API_KEY ou VITE_FIREBASE_API_KEY) est absente des variables d\'environnement'));
          return;
        }

        const callbackName = `__googleMapsCallback_${Math.random().toString(36).substring(2, 9)}`;
        window[callbackName] = () => {
          try {
            delete window[callbackName];
            if (window.google && window.google.maps) {
              resolve(window.google.maps);
            } else {
              reject(new Error('Script Google Maps chargé mais window.google.maps est indéfini'));
            }
          } catch (callbackErr) {
            reject(callbackErr);
          }
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&loading=async&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = (err) => {
          delete window[callbackName];
          reject(err || new Error('Échec du chargement de la balise script Google Maps'));
        };

        document.head.appendChild(script);
      } catch (err) {
        reject(err);
      }
    });
  }

  return googleMapsPromise;
}

/**
 * Calcule la distance routière en kilomètres entre une adresse d'origine et de destination
 * en utilisant le service Google Maps Distance Matrix.
 * 
 * @param {string} origin 
 * @param {string} destination 
 * @returns {Promise<number>} Distance en kilomètres
 */
export function calculateRoadDistance(origin, destination) {
  if (!origin || !destination) {
    return Promise.resolve(0);
  }

  return loadGoogleMaps().then((maps) => {
    const geocoder = new maps.Geocoder();

    const getCoords = async (addr) => {
      const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      if (coordinateRegex.test(addr.trim())) {
        const parts = addr.split(',').map(s => parseFloat(s.trim()));
        return { lat: parts[0], lng: parts[1] };
      }
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: addr }, (results, status) => {
          if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
            const loc = results[0].geometry.location;
            resolve({
              lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
              lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
            });
          } else {
            reject(new Error(`Géocodage échoué pour "${addr}" avec le statut : ${status}`));
          }
        });
      });
    };

    const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
    const parseLocation = (str) => {
      if (coordinateRegex.test(str.trim())) {
        const parts = str.split(',').map(s => parseFloat(s.trim()));
        return new maps.LatLng(parts[0], parts[1]);
      }
      return str;
    };

    const originLoc = parseLocation(origin);
    const destLoc = parseLocation(destination);

    // Essayer d'abord le service d'itinéraires DirectionsService (le plus fiable)
    return new Promise((resolve, reject) => {
      const directionsService = new maps.DirectionsService();
      directionsService.route(
        {
          origin: originLoc,
          destination: destLoc,
          travelMode: maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result && result.routes && result.routes[0]) {
            const route = result.routes[0];
            let totalDistanceMeters = 0;
            for (let i = 0; i < route.legs.length; i++) {
              totalDistanceMeters += route.legs[i].distance.value;
            }
            const distanceKm = totalDistanceMeters / 1000;
            resolve(distanceKm);
          } else {
            reject(new Error(`Service d'itinéraires échoué avec le statut : ${status}`));
          }
        }
      );
    })
    .catch((directionsErr) => {
      console.error("Échec DirectionsService, tentative avec DistanceMatrixService :", directionsErr);
      // Secours 1 : Essayer la matrice de distance (Distance Matrix)
      return new Promise((resolve, reject) => {
        const service = new maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [originLoc],
            destinations: [destLoc],
            travelMode: maps.TravelMode.DRIVING,
            unitSystem: maps.UnitSystem.METRIC,
          },
          (response, status) => {
            if (
              status === 'OK' &&
              response &&
              response.rows &&
              response.rows[0] &&
              response.rows[0].elements &&
              response.rows[0].elements[0] &&
              response.rows[0].elements[0].status === 'OK'
            ) {
              const element = response.rows[0].elements[0];
              const distanceKm = element.distance.value / 1000;
              resolve(distanceKm);
            } else {
              const errStatus = response?.rows?.[0]?.elements?.[0]?.status || status;
              reject(new Error(`Distance Matrix a échoué : ${errStatus}`));
            }
          }
        );
      });
    })
    .catch((matrixErr) => {
      console.error("Échec des services routiers, calcul de secours en vol d'oiseau (Haversine) :", matrixErr);
      // Secours 2 : Géocoder les deux adresses et calculer la distance à vol d'oiseau (formule de Haversine)
      return Promise.all([getCoords(origin), getCoords(destination)])
        .then(([coords1, coords2]) => {
          const R = 6371; // Rayon de la Terre en km
          const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
          const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const haversineDist = R * c;
          
          // Estimation de la distance routière en appliquant un coefficient multiplicateur de 1.25
          const estimatedRoadDist = haversineDist * 1.25;
          return estimatedRoadDist;
        });
    });
  });
}
