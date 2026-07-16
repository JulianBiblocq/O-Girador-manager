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
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
      if (!apiKey) {
        reject(new Error('Firebase API Key (VITE_FIREBASE_API_KEY) is missing in environment variables'));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps script loaded but window.google.maps is undefined'));
        }
      };

      script.onerror = (err) => {
        reject(err);
      };

      document.head.appendChild(script);
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
    return new Promise((resolve, reject) => {
      const service = new maps.DistanceMatrixService();
      
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: maps.TravelMode.DRIVING,
          unitSystem: maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status !== 'OK') {
            reject(new Error(`Distance Matrix service failed with status: ${status}`));
            return;
          }

          if (
            response &&
            response.rows &&
            response.rows[0] &&
            response.rows[0].elements &&
            response.rows[0].elements[0]
          ) {
            const element = response.rows[0].elements[0];
            
            if (element.status === 'OK') {
              // element.distance.value is in meters
              const distanceKm = element.distance.value / 1000;
              resolve(distanceKm);
            } else {
              reject(new Error(`Distance Matrix address matching failed: ${element.status}`));
            }
          } else {
            reject(new Error('Invalid response format from Distance Matrix service'));
          }
        }
      );
    });
  });
}
