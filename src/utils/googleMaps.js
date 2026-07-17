let googleMapsPromise = null;

/**
 * Dynamically loads the Google Maps JS SDK with the Places library.
 * Reuses the same promise so the script tag is only injected once.
 */
export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window is undefined'));
  
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
        if (!apiKey) {
          reject(new Error('API Key (VITE_GOOGLE_MAPS_API_KEY or VITE_FIREBASE_API_KEY) is missing in environment variables'));
          return;
        }

        const callbackName = `__googleMapsCallback_${Math.random().toString(36).substring(2, 9)}`;
        window[callbackName] = () => {
          try {
            delete window[callbackName];
            if (window.google && window.google.maps) {
              resolve(window.google.maps);
            } else {
              reject(new Error('Google Maps script loaded but window.google.maps is undefined'));
            }
          } catch (callbackErr) {
            reject(callbackErr);
          }
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = (err) => {
          delete window[callbackName];
          reject(err || new Error('Failed to load Google Maps script tag'));
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
 * Calculates road distance in kilometers between an origin and destination address
 * using the Google Maps Distance Matrix service.
 * 
 * @param {string} origin 
 * @param {string} destination 
 * @returns {Promise<number>} Distance in kilometers
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
            reject(new Error(`Geocoding failed for "${addr}" with status: ${status}`));
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

    // Try DirectionsService first (more reliable, always enabled with core SDK)
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
            reject(new Error(`Directions service failed with status: ${status}`));
          }
        }
      );
    })
    .catch((directionsErr) => {
      console.warn("DirectionsService failed, trying DistanceMatrixService:", directionsErr);
      // Fallback 1: Try Distance Matrix
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
              reject(new Error(`Distance Matrix failed: ${errStatus}`));
            }
          }
        );
      });
    })
    .catch((matrixErr) => {
      console.warn("All road calculation services failed, falling back to Haversine straight-line distance:", matrixErr);
      // Fallback 2: Geocode both addresses and calculate Haversine distance
      return Promise.all([getCoords(origin), getCoords(destination)])
        .then(([coords1, coords2]) => {
          const R = 6371; // Earth's radius in km
          const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
          const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const haversineDist = R * c;
          
          // Estimate road distance by multiplying by a factor of 1.25
          const estimatedRoadDist = haversineDist * 1.25;
          return estimatedRoadDist;
        });
    });
  });
}
