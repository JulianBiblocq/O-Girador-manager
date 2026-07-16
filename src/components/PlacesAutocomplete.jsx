import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

/**
 * PlacesAutocomplete component wraps a text input and hooks it
 * up with Google Maps Places Autocomplete SDK with error fallback.
 */
export default function PlacesAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  disabled, 
  name = 'lieu', 
  required = false 
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    // Detect Google Maps authentication failures (e.g. invalid key, billing, referers)
    const originalAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn("PlacesAutocomplete - Google Maps Authentication Failure detected!");
      if (active) {
        setHasError(true);
      }
      if (originalAuthFailure) {
        try {
          originalAuthFailure();
        } catch (e) {
          // ignore
        }
      }
    };

    loadGoogleMaps()
      .then((maps) => {
        if (!active || !inputRef.current) return;

        try {
          // Initialize the Google Autocomplete widget targeting address types
          autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
            types: ['geocode', 'establishment']
          });

          // Avoid focusing browser defaults or interference
          autocompleteRef.current.addListener('place_changed', () => {
            try {
              const place = autocompleteRef.current.getPlace();
              
              if (place && place.formatted_address) {
                onChange({
                  target: {
                    name: name,
                    value: place.formatted_address
                  }
                });
              } else if (place && place.name) {
                onChange({
                  target: {
                    name: name,
                    value: place.name
                  }
                });
              }
            } catch (eventErr) {
              console.error("PlacesAutocomplete - Error during place_changed listener:", eventErr);
              if (active) setHasError(true);
            }
          });
        } catch (initErr) {
          console.error("PlacesAutocomplete - Error creating Autocomplete instance:", initErr);
          if (active) setHasError(true);
        }
      })
      .catch((err) => {
        console.error("PlacesAutocomplete - Failed to load Google Maps SDK:", err);
        if (active) setHasError(true);
      });

    return () => {
      active = false;
      // Restore original auth failure hook
      window.gm_authFailure = originalAuthFailure;
      
      if (autocompleteRef.current && window.google && window.google.maps) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [name, onChange]);

  if (hasError) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          required={required}
        />
        <span className="text-[9px] text-red-600 font-bold leading-none mt-1 select-none">
          Google Maps inactif, veuillez taper l'adresse manuellement.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        required={required}
      />
      <span className="text-[9px] text-cordel-master-dark/60 font-semibold leading-none mt-1 select-none">
        Saisissez pour chercher l'adresse
      </span>
    </div>
  );
}
