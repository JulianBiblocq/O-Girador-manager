import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';
import { useTranslation } from './LanguageContext';

/**
 * AddressAutocomplete component wraps Google Maps Places AutocompleteElement
 * (the modern Places Web Component) with React controlled state integration.
 * It decouples change/select callbacks using React refs to prevent input freezing
 * due to parent re-rendering cycles.
 */
export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder, 
  className, 
  disabled, 
  name = 'address', 
  required = false 
}) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const cleanupInputRef = useRef(null);
  const cleanupSelectRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isValidSelected, setIsValidSelected] = useState(true);

  // Store callbacks in refs to prevent recreating Google Maps elements
  // when parent handlers change (e.g., inline functions or un-memoized handlers).
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Helper to find the internal input element within the shadow DOM of PlaceAutocompleteElement
  const findInnerInput = (gmpElement) => {
    const el = gmpElement || autocompleteRef.current;
    if (!el) return null;
    if (el.inputElement instanceof HTMLInputElement) {
      return el.inputElement;
    }
    if (el.shadowRoot) {
      const input = el.shadowRoot.querySelector('input');
      if (input) return input;
    }
    for (const prop in el) {
      try {
        if (el[prop] instanceof HTMLInputElement) {
          return el[prop];
        }
      } catch (e) {}
    }
    return null;
  };

  useEffect(() => {
    let active = true;

    // Detect Google Maps authentication failures (e.g. invalid key, billing, referers)
    const originalAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.error("AddressAutocomplete - Google Maps Authentication Failure detected!");
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
          
          // Style configuration is handled by index.css (.theme-address-autocomplete or gmp-place-autocomplete tag)
          placeAutocomplete.classList.add('theme-address-autocomplete');

          // Mount the component in our container
          containerRef.current.replaceChildren(placeAutocomplete);
          autocompleteRef.current = placeAutocomplete;

          // Set the initial value and attach raw input event listener
          const initInput = (attempts = 0) => {
            if (!active) return;
            const input = findInnerInput(placeAutocomplete);
            if (input) {
              input.value = value || '';
              placeAutocomplete.placeholder = placeholder || '';
              if (required) {
                input.required = true;
              }
              
              const handleInput = (e) => {
                const val = e.target.value;
                if (required || val.trim() !== '') {
                  setIsValidSelected(false);
                  input.setCustomValidity(t('addressAutocomplete.selectGoogleSuggestion'));
                } else {
                  setIsValidSelected(true);
                  input.setCustomValidity("");
                }

                if (onChangeRef.current) {
                  onChangeRef.current({
                    target: {
                      name: name,
                      value: val
                    }
                  });
                }
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

          // Listen for selection events
          const handleSelect = async (event) => {
            try {
              let place = null;
              if (event.placePrediction) {
                place = event.placePrediction.toPlace();
              } else if (event.place) {
                place = event.place;
              }

              if (place) {
                // Fetch the required address fields (including addressComponents)
                await place.fetchFields({
                  fields: ['formattedAddress', 'displayName', 'addressComponents']
                });

                const addr = place.formattedAddress || place.formatted_address;
                const nameVal = place.displayName || place.name;
                const finalVal = addr || nameVal;

                if (finalVal) {
                  const input = findInnerInput(placeAutocomplete);
                  if (input) {
                    input.value = finalVal;
                    input.setCustomValidity("");
                  }
                  setIsValidSelected(true);

                  if (onChangeRef.current) {
                    onChangeRef.current({
                      target: {
                        name: name,
                        value: finalVal
                      }
                    });
                  }

                  if (onSelectRef.current) {
                    // Extract structured address parts
                    const components = place.addressComponents || [];
                    const getComponent = (types) => {
                      const comp = components.find(c => c.types && c.types.some(t => types.includes(t)));
                      return comp ? (comp.longText || comp.long_name || comp.shortText || comp.short_name || '') : '';
                    };

                    const streetNumber = getComponent(['street_number']);
                    const route = getComponent(['route']);
                    const zipcode = getComponent(['postal_code']);
                    const city = getComponent(['locality', 'sublocality']);
                    
                    const street = [streetNumber, route].filter(Boolean).join(' ');

                    onSelectRef.current({
                      address: finalVal,
                      street: street || finalVal,
                      zipcode: zipcode,
                      city: city,
                      rawPlace: place
                    });
                  }
                }
              }
            } catch (err) {
              console.error("AddressAutocomplete - Error resolving selected place details:", err);
            }
          };

          placeAutocomplete.addEventListener('gmp-select', handleSelect);
          placeAutocomplete.addEventListener('gmp-placeselect', handleSelect);

          cleanupSelectRef.current = () => {
            placeAutocomplete.removeEventListener('gmp-select', handleSelect);
            placeAutocomplete.removeEventListener('gmp-placeselect', handleSelect);
          };

        } catch (initErr) {
          console.error("AddressAutocomplete - Error creating PlaceAutocompleteElement:", initErr);
          if (active) setHasError(true);
        }
      })
      .catch((err) => {
        console.error("AddressAutocomplete - Failed to load Google Maps SDK:", err);
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
  }, [name]); // Removed onChangeRef, onSelectRef, and value from dependencies

  // Sync value from parent state when changed programmatically (e.g. form resets)
  useEffect(() => {
    if (!autocompleteRef.current) return;
    const input = findInnerInput();
    if (input) {
      if (input.value !== (value || '')) {
        input.value = value || '';
      }
      input.setCustomValidity("");
      setIsValidSelected(true);
    }
  }, [value]);

  if (hasError) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={(e) => {
            if (onChangeRef.current) onChangeRef.current(e);
          }}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          required={required}
        />
        <span className="text-[9px] text-red-600 font-bold leading-none mt-1 select-none">
          {t('addressAutocomplete.mapsInactive')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full text-left">
      <div ref={containerRef} className="w-full min-h-[38px] flex items-center" />
      {!isValidSelected && value && value.trim() !== '' && (
        <span className="text-[9px] text-amber-700 font-extrabold leading-none mt-1 select-none animate-pulse">
          {t('addressAutocomplete.selectGoogleSuggestionWarning')}
        </span>
      )}
      {isValidSelected && (
        <span className="text-[9px] text-cordel-master-dark/60 font-semibold leading-none mt-1 select-none">
          {t('addressAutocomplete.typeToSearch')}
        </span>
      )}
    </div>
  );
}
