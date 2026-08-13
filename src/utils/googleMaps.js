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
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly&chargement de=async&callback=${callbackName}`;
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

  // Normalisation sous forme de chaîne de caractères ou coordonnées
  const parseStr = (val) => {
    if (typeof val === 'string') return val;
    if (val?.latitude && val?.longitude) return `${val.latitude},${val.longitude}`;
    if (val?.lat && val?.lng) return `${val.lat},${val.lng}`;
    if (val?.formattedAddress) return val.formattedAddress;
    if (val?.name) return val.name;
    return String(val || '');
  };

  const originStr = parseStr(origin);
  const destStr = parseStr(destination);

  if (!originStr.trim() || !destStr.trim()) {
    return Promise.resolve(0);
  }

  return loadGoogleMaps().then((maps) => {
    const geocoder = new maps.Geocoder();

    const getCoords = async (addr) => {
      const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      const trimmed = addr.trim();
      if (coordinateRegex.test(trimmed)) {
        const parts = trimmed.split(',').map(s => parseFloat(s.trim()));
        return { lat: parts[0], lng: parts[1] };
      }
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address: trimmed }, (results, status) => {
          if (status === 'OK' && results && results[0] && results[0].geometry && results[0].geometry.location) {
            const loc = results[0].geometry.location;
            resolve({
              lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
              lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
            });
          } else {
            reject(new Error(`Géocodage introuvable pour "${addr}"`));
          }
        });
      });
    };

    // Calcul direct par géocodage + Haversine (multiplicateur routier 1.25)
    return Promise.all([getCoords(originStr), getCoords(destStr)])
      .then(([coords1, coords2]) => {
        const R = 6371; // Rayon terrestre en km
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const haversineDist = R * c;
        
        // Estimation de la distance routière en km (arrondie au dixième)
        return Math.round(haversineDist * 1.25 * 10) / 10;
      })
      .catch((err) => {
        console.warn("Distance par géocodage indisponible :", err.message);
        return 0;
      });
  });
}
