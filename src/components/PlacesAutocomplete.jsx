import React, { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/googleMaps';

/**
 * PlacesAutocomplete component wraps a text input and hooks it
 * up with Google Maps Places Autocomplete SDK.
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

  useEffect(() => {
    let active = true;

    loadGoogleMaps().then((maps) => {
      if (!active || !inputRef.current) return;

      // Initialize the Google Autocomplete widget targeting address types
      autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
        types: ['geocode', 'establishment']
      });

      // Avoid focusing browser defaults or interference
      autocompleteRef.current.addListener('place_changed', () => {
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
      });
    }).catch((err) => {
      console.error("PlacesAutocomplete - Failed to load Google Maps SDK:", err);
    });

    return () => {
      active = false;
      if (autocompleteRef.current && window.google && window.google.maps) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [name, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    />
  );
}
