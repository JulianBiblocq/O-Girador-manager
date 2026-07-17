import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

/**
 * PlacesAutocomplete component wraps Google Maps Places AutocompleteElement
 * (the modern Places Web Component) with React controlled state integration.
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
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const cleanupInputRef = useRef(null);
  const cleanupSelectRef = useRef(null);
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
        if (!active || !containerRef.current) return;

        try {
          // Create the modern PlaceAutocompleteElement web component programmatically
          const placeAutocomplete = new maps.places.PlaceAutocompleteElement();
          placeAutocomplete.style.width = '100%';
          
          // Style the custom element directly using standard host properties
          placeAutocomplete.style.setProperty('border', '2px solid var(--cordel-border)');
          placeAutocomplete.style.setProperty('background-color', 'var(--cordel-master-bg)');
          placeAutocomplete.style.setProperty('color', 'var(--cordel-text)');
          placeAutocomplete.style.setProperty('border-radius', '4px 8px 3px 6px');
          placeAutocomplete.style.setProperty('font-weight', '600');
          placeAutocomplete.style.setProperty('font-size', '0.875rem');
          
          // Mount the component in our container
          containerRef.current.replaceChildren(placeAutocomplete);
          autocompleteRef.current = placeAutocomplete;

          // Helper to find the internal input element within the Shadow DOM
          const findInnerInput = () => {
            if (placeAutocomplete.inputElement instanceof HTMLInputElement) {
              return placeAutocomplete.inputElement;
            }
            if (placeAutocomplete.shadowRoot) {
              const input = placeAutocomplete.shadowRoot.querySelector('input');
              if (input) return input;
            }
            for (const prop in placeAutocomplete) {
              try {
                if (placeAutocomplete[prop] instanceof HTMLInputElement) {
                  return placeAutocomplete[prop];
                }
              } catch (e) {}
            }
            return null;
          };

          // Set the initial value and attach raw input event listener
          const initInput = (attempts = 0) => {
            if (!active) return;
            const input = findInnerInput();
            if (input) {
              input.value = value || '';
              placeAutocomplete.placeholder = placeholder || '';
              
              const handleInput = (e) => {
                onChange({
                  target: {
                    name: name,
                    value: e.target.value
                  }
                });
              };
              input.addEventListener('input', handleInput);
              
              cleanupInputRef.current = () => {
                input.removeEventListener('input', handleInput);
              };
            } else if (attempts < 10) {
              // Retry in next frame if shadow DOM is still assembling
              setTimeout(() => initInput(attempts + 1), 50);
            }
          };

          initInput();

          // Listen for selection events (handles both the new gmp-select and fallback gmp-placeselect)
          const handleSelect = async (event) => {
            try {
              let place = null;
              if (event.placePrediction) {
                place = event.placePrediction.toPlace();
              } else if (event.place) {
                place = event.place;
              }

              if (place) {
                // Fetch the required address fields
                await place.fetchFields({
                  fields: ['formattedAddress', 'displayName']
                });

                const addr = place.formattedAddress || place.formatted_address;
                const nameVal = place.displayName || place.name;
                const finalVal = addr || nameVal;

                if (finalVal) {
                  const input = findInnerInput();
                  if (input) {
                    input.value = finalVal;
                  }

                  onChange({
                    target: {
                      name: name,
                      value: finalVal
                    }
                  });
                }
              }
            } catch (err) {
              console.error("PlacesAutocomplete - Error resolving selected place details:", err);
            }
          };

          placeAutocomplete.addEventListener('gmp-select', handleSelect);
          placeAutocomplete.addEventListener('gmp-placeselect', handleSelect);

          cleanupSelectRef.current = () => {
            placeAutocomplete.removeEventListener('gmp-select', handleSelect);
            placeAutocomplete.removeEventListener('gmp-placeselect', handleSelect);
          };

        } catch (initErr) {
          console.error("PlacesAutocomplete - Error creating PlaceAutocompleteElement:", initErr);
          if (active) setHasError(true);
        }
      })
      .catch((err) => {
        console.error("PlacesAutocomplete - Failed to load Google Maps SDK:", err);
        if (active) setHasError(true);
      });

    return () => {
      active = false;
      window.gm_authFailure = originalAuthFailure;
      
      if (cleanupInputRef.current) {
        cleanupInputRef.current();
      }
      if (cleanupSelectRef.current) {
        cleanupSelectRef.current();
      }
    };
  }, [name, onChange]); // Value omitted intentionally to avoid component recreation on keystroke

  // Sync value from parent state when changed programmatically (e.g. form resets)
  useEffect(() => {
    if (!autocompleteRef.current) return;
    
    const findInnerInput = () => {
      const gmp = autocompleteRef.current;
      if (!gmp) return null;
      if (gmp.inputElement instanceof HTMLInputElement) {
        return gmp.inputElement;
      }
      if (gmp.shadowRoot) {
        const input = gmp.shadowRoot.querySelector('input');
        if (input) return input;
      }
      for (const prop in gmp) {
        try {
          if (gmp[prop] instanceof HTMLInputElement) {
            return gmp[prop];
          }
        } catch (e) {}
      }
      return null;
    };

    const input = findInnerInput();
    if (input && input.value !== (value || '')) {
      input.value = value || '';
    }
  }, [value]);

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
      {/* Container where the PlaceAutocompleteElement will be dynamically mounted */}
      <div ref={containerRef} className="w-full min-h-[38px] flex items-center" />
      <span className="text-[9px] text-cordel-master-dark/60 font-semibold leading-none mt-1 select-none">
        Saisissez pour chercher l'adresse
      </span>
    </div>
  );
}
