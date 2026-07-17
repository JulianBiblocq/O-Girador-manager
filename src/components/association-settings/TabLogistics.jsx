import React, { useState, useEffect, useRef } from 'react';
import CordelCard from '../CordelCard';
import { loadGoogleMaps } from '../../utils/googleMaps';
const PlacesAutocomplete = React.lazy(() => import('../PlacesAutocomplete'));

const geocodeByAddress = async (address) => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results) {
        resolve(results);
      } else {
        reject(new Error(`Geocoding failed with status: ${status}`));
      }
    });
  });
};

const getLatLng = async (geocodeResult) => {
  if (geocodeResult && geocodeResult.geometry && geocodeResult.geometry.location) {
    const loc = geocodeResult.geometry.location;
    return {
      lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
      lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
    };
  }
  throw new Error("No location found in geocode result");
};

export default function TabLogistics({
  formData,
  handleChange,
  saving,
  t
}) {
  const {
    indemniteKilometrique = 0,
    enableCarpoolReimbursement = true,
    defaultDepartureLocation = '',
    reimbursementRule = 'full_cars_only'
  } = formData;

  const handleAddressChange = (newAddress) => {
    handleChange({ target: { name: 'pointRassemblementDefaut', value: newAddress } });
  };

  const handleAddressSelect = async (selectedAddress) => {
    handleChange({ target: { name: 'pointRassemblementDefaut', value: selectedAddress } });
    if (!selectedAddress || selectedAddress.trim() === "") return;
    try {
      const results = await geocodeByAddress(selectedAddress);
      if (results && results.length > 0) {
        const latLng = await getLatLng(results[0]);
      }
    } catch (error) {
      console.warn("Geocoding ignoré pour cette saisie :", error);
    }
  };

  return (
    <>
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🚗 Point de départ & Remboursements
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Tarif de remboursement par kilomètre (€/km)
            </label>
            <input 
              type="number"
              step="0.01"
              min="0"
              value={indemniteKilometrique}
              onChange={(e) => handleChange('indemniteKilometrique', parseFloat(e.target.value) || 0)}
              placeholder="ex: 0.40"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          <div className="flex flex-col gap-1 text-left border-t border-dashed border-cordel-master-dark/15 pt-3">
            <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Adresse du local / Point de rassemblement par défaut
            </label>
            <React.Suspense fallback={
              <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                ⏳ Chargement du champ adresse...
              </div>
            }>
              <PlacesAutocomplete 
                name="pointRassemblementDefaut"
                value={formData.pointRassemblementDefaut || ""}
                onChange={handleAddressChange}
                onSelect={handleAddressSelect}
                placeholder="ex: 12 Rue du Maracatu, 75000 Paris"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </React.Suspense>
            <div className="mt-3">
              <GoogleMapsPreview address={formData.pointRassemblementDefaut || ""} />
            </div>
          </div>
        </div>
      </CordelCard>

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🚗 Covoiturage & Défraiements
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={enableCarpoolReimbursement}
              onChange={(e) => handleChange('enableCarpoolReimbursement', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              id="enableCarpoolReimbursement"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="enableCarpoolReimbursement" className="text-xs font-bold text-encre-noire cursor-pointer">
                Activer le calcul automatique des défraiements kilométriques
              </label>
            </div>
          </div>

          {enableCarpoolReimbursement && (
            <div className="flex flex-col gap-3 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Lieu de départ de référence (ex: Local de l'association)
                </label>
                <input 
                  type="text"
                  value={defaultDepartureLocation}
                  onChange={(e) => handleChange('defaultDepartureLocation', e.target.value || '')}
                  placeholder="Ex: Local de l'association, Mairie..."
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Règle d'éligibilité au remboursement
                </label>
                <select 
                  value={reimbursementRule}
                  onChange={(e) => handleChange('reimbursementRule', e.target.value)}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
                >
                  <option value="all_drivers">Souple : Tous les conducteurs sont éligibles</option>
                  <option value="full_cars_only">Strict : Uniquement les voitures pleines - inclut le calcul de volume des instruments</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </CordelCard>
    </>
  );
}

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
          if (!active) {
            console.warn("Détail Erreur Map : composant ou effet inactif lors du retour du chargement SDK");
            return;
          }
          if (!mapRef.current) {
            console.warn("Détail Erreur Map : mapRef.current est null/inactif");
            return;
          }
          try {
            const geocoder = new maps.Geocoder();
            geocoder.geocode({ address }, (results, status) => {
              if (!active) return;
              try {
                if (status === 'OK' && results[0]) {
                  const location = results[0].geometry.location;
                  const map = new maps.Map(mapRef.current, {
                    center: location,
                    zoom: 15,
                    disableDefaultUI: true,
                    zoomControl: true,
                  });
                  new maps.Marker({
                    position: location,
                    map,
                    title: address,
                  });
                  setMapError(null);
                } else {
                  console.warn(`Geocoding failed with status: ${status}`);
                  setMapError(`Impossible de localiser cette adresse sur la carte (Erreur Google : ${status})`);
                }
              } catch (mapInitErr) {
                console.error("Détail Erreur Map :", mapInitErr);
                setMapError("Erreur lors de l'initialisation de la carte");
              }
            });
          } catch (geocoderErr) {
            console.error("Détail Erreur Map :", geocoderErr);
            setMapError("Erreur lors de la préparation de la localisation");
          }
        })
        .catch((err) => {
          console.error("Détail Erreur Map :", err);
          setMapError("Erreur lors du chargement de la carte");
        });
    } catch (outerErr) {
      console.error("Détail Erreur Map :", outerErr);
      setMapError("Erreur inattendue de chargement");
    }

    return () => {
      active = false;
    };
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
