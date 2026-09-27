import React, { useState, useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../../../utils/googleMaps';
import AddressAutocomplete from '../../AddressAutocomplete';

const geocodeByAddress = async (address) => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
  const isCoords = coordinateRegex.test(address.trim());

  return new Promise((resolve, reject) => {
    const request = isCoords ? (() => {
      const parts = address.split(',').map(s => parseFloat(s.trim()));
      return { location: { lat: parts[0], lng: parts[1] } };
    })() : { address };

    geocoder.geocode(request, (results, status) => {
      if (status === 'OK' && results) {
        resolve(results);
      } else {
        reject(new Error(`Geocoding failed with status: ${status}`));
      }
    });
  });
};

function GoogleMapsPreview({ address }) {
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!address || address.trim() === '') {
      setMapError(null);
      return;
    }

    let active = true;
    try {
      loadGoogleMaps()
        .then((maps) => {
          if (!active || !mapRef.current) return;
          try {
            const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
            const isCoords = coordinateRegex.test(address.trim());

            const handleMapInit = (location) => {
              const map = new maps.Map(mapRef.current, {
                center: location,
                zoom: 15,
                disableDefaultUI: true,
                zoomControl: true,
                mapId: 'DEMO_MAP_ID',
              });

              if (maps.marker && maps.marker.AdvancedMarkerElement) {
                new maps.marker.AdvancedMarkerElement({ position: location, map, title: address });
              } else {
                new maps.Marker({ position: location, map, title: address });
              }
              setMapError(null);
            };

            if (isCoords) {
              const parts = address.split(',').map(s => parseFloat(s.trim()));
              handleMapInit({ lat: parts[0], lng: parts[1] });
            } else {
              const geocoder = new maps.Geocoder();
              geocoder.geocode({ address }, (results, status) => {
                if (!active) return;
                if (status === 'OK' && results[0]) {
                  handleMapInit(results[0].geometry.location);
                } else {
                  setMapError(`Impossible de localiser cette adresse sur la carte (${status})`);
                }
              });
            }
          } catch (err) {
            setMapError("Erreur d'initialisation de la carte");
          }
        })
        .catch(() => setMapError("Erreur de chargement Google Maps"));
    } catch {
      setMapError("Erreur inattendue");
    }

    return () => { active = false; };
  }, [address]);

  if (!address || address.trim() === '') {
    return (
      <div className="w-full h-32 bg-cordel-bg-light border border-dashed border-encre-noire/15 rounded flex items-center justify-center text-[10px] text-encre-noire/60 font-bold select-none">
        📍 Saisissez une adresse pour afficher la carte
      </div>
    );
  }

  return (
    <div className="relative w-full h-44 rounded border border-encre-noire shadow-sm overflow-hidden bg-cordel-bg-light">
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-600 font-bold bg-red-50/50 p-3 text-center">
          ⚠️ {mapError}
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full" />
      )}
    </div>
  );
}

/**
 * Accordéon replié par défaut pour le point de départ du local et la carte GPS
 */
export default function DepartureLocationAccordion({
  formData = {},
  handleChange,
  saving = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddressSelect = async (addressData) => {
    const address = typeof addressData === 'string' ? addressData : addressData.address;
    handleChange({ target: { name: 'pointRassemblementDefaut', value: address } });
    if (!address || address.trim() === "") return;
    try {
      await geocodeByAddress(address);
    } catch (error) {
      console.warn("Geocoding ignoré pour cette saisie :", error);
    }
  };

  const currentAddress = formData.pointRassemblementDefaut || "";

  return (
    <div className="border border-dashed border-cordel-master-dark/25 rounded-[6px_4px_8px_5px] p-3 bg-cordel-bg-light/50 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">📍</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Point de ralliement habituel
          </span>
          {currentAddress && !isOpen && (
            <span className="text-[10px] font-semibold text-cordel-master-dark/70 truncate max-w-xs">
              ({currentAddress})
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:text-encre-noire px-2.5 py-1 rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white cursor-pointer transition-all shadow-2xs flex items-center gap-1"
        >
          <span>🗺️ {isOpen ? "Masquer la carte ▴" : "Voir le point de départ du local ▾"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/15 text-left animate-fadeIn">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Adresse du local / Point de rassemblement des départs en convoi
          </label>
          <React.Suspense fallback={
            <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
              ⏳ Chargement du champ adresse...
            </div>
          }>
            <AddressAutocomplete 
              name="pointRassemblementDefaut"
              value={currentAddress}
              onChange={handleChange}
              onSelect={handleAddressSelect}
              placeholder="ex: 12 Rue du Maracatu, 75000 Paris"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </React.Suspense>
          <div className="mt-1">
            <GoogleMapsPreview address={currentAddress} />
          </div>
        </div>
      )}
    </div>
  );
}
