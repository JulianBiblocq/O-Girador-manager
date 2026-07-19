import React, { useState, useEffect, useRef } from 'react';
import CordelCard from '../CordelCard';
import { loadGoogleMaps } from '../../utils/googleMaps';
const AddressAutocomplete = React.lazy(() => import('../AddressAutocomplete'));

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
    reimbursementRule = 'full_cars_only',
    dressCodes = []
  } = formData;

  const [newDressCodeName, setNewDressCodeName] = useState('');
  const [newDressCodeIncluded, setNewDressCodeIncluded] = useState('');

  const handleAddDressCode = () => {
    if (!newDressCodeName.trim()) return;
    const currentList = dressCodes || [];
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: newDressCodeName.trim(),
      included: newDressCodeIncluded.trim()
    };
    handleChange('dressCodes', [...currentList, newItem]);
    setNewDressCodeName('');
    setNewDressCodeIncluded('');
  };

  const handleRemoveDressCode = (id) => {
    const currentList = dressCodes || [];
    const updated = currentList.filter(item => item.id !== id);
    handleChange('dressCodes', updated);
  };

  const handleAddressSelect = async (addressData) => {
    const address = typeof addressData === 'string' ? addressData : addressData.address;
    handleChange({ target: { name: 'pointRassemblementDefaut', value: address } });
    if (!address || address.trim() === "") return;
    try {
      const results = await geocodeByAddress(address);
      if (results && results.length > 0) {
        await getLatLng(results[0]);
      }
    } catch (error) {
      console.error("Geocoding ignoré pour cette saisie :", error);
    }
  };

  return (
    <>
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🚗 Covoiturage, Départ & Défraiements
        </h3>
        <div className="flex flex-col gap-3.5">
          {/* Activer/Désactiver le remboursement */}
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
            <div className="flex flex-col gap-3.5 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1">
              {/* Tarif Km */}
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

              {/* Adresse du Local */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Adresse du local / Point de rassemblement par défaut
                </label>
                <React.Suspense fallback={
                  <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                    ⏳ Chargement du champ adresse...
                  </div>
                }>
                  <AddressAutocomplete 
                    name="pointRassemblementDefaut"
                    value={formData.pointRassemblementDefaut || ""}
                    onChange={handleChange}
                    onSelect={handleAddressSelect}
                    placeholder="ex: 12 Rue du Maracatu, 75000 Paris"
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                  />
                </React.Suspense>
                <div className="mt-2">
                  <GoogleMapsPreview address={formData.pointRassemblementDefaut || ""} />
                </div>
              </div>

              {/* Règle de remboursement */}
              <div className="flex flex-col gap-1 text-left">
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

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          👔 Vestiaire : Tenues types (Marque Blanche)
        </h3>
        
        <div className="flex flex-col gap-4 text-left">
          <span className="text-[10px] italic opacity-85">
            Définissez les tenues officielles de votre association. Les adhérents pourront se référer à ces codes vestimentaires.
          </span>

          <div className="flex flex-col gap-2.5">
            {dressCodes.length === 0 ? (
              <span className="italic opacity-60 text-xs text-center py-2">
                Aucune tenue type configurée pour le moment.
              </span>
            ) : (
              <div className="flex flex-col gap-2">
                {dressCodes.map((dc) => (
                  <div key={dc.id} className="flex justify-between items-center bg-white/40 dark:bg-black/25 p-2.5 rounded border border-dashed border-cordel-master-dark/15 text-xs font-bold">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-cordel-wood font-extrabold uppercase text-[10px]">{dc.name}</span>
                      <span className="text-[10px] opacity-75 font-semibold">Pièces : {dc.included || "Aucune spécifiée"}</span>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleRemoveDressCode(dc.id)}
                      className="text-red-600 hover:text-red-800 font-bold ml-3 cursor-pointer text-sm"
                      title="Supprimer cette tenue"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3.5 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1">
            <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[9px]">
              ➕ Ajouter une nouvelle tenue type
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Nom de la tenue
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={newDressCodeName}
                  onChange={(e) => setNewDressCodeName(e.target.value)}
                  placeholder="ex: Costume Blanc"
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Pièces incluses
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={newDressCodeIncluded}
                  onChange={(e) => setNewDressCodeIncluded(e.target.value)}
                  placeholder="ex: Pantalon, Chemise, Ceinture"
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
              </div>
            </div>

            <div className="flex justify-end mt-1">
              <button
                type="button"
                disabled={saving || !newDressCodeName.trim()}
                onClick={handleAddDressCode}
                className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer disabled:opacity-50"
              >
                Ajouter la tenue
              </button>
            </div>
          </div>
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
            console.error("Détail Erreur Map : composant ou effet inactif lors du retour du chargement SDK");
            return;
          }
          if (!mapRef.current) {
            console.error("Détail Erreur Map : mapRef.current est null/inactif");
            return;
          }
          try {
            const coordinateRegex = /^[-+]?([1-9]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
            const isCoords = coordinateRegex.test(address.trim());

            const handleMapInit = (location) => {
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
            };

            if (isCoords) {
              const parts = address.split(',').map(s => parseFloat(s.trim()));
              const location = { lat: parts[0], lng: parts[1] };
              handleMapInit(location);
            } else {
              const geocoder = new maps.Geocoder();
              geocoder.geocode({ address }, (results, status) => {
                if (!active) return;
                try {
                  if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    handleMapInit(location);
                  } else {
                    console.error(`Geocoding failed with status: ${status}`);
                    setMapError(`Impossible de localiser cette adresse sur la carte (Erreur Google : ${status})`);
                  }
                } catch (mapInitErr) {
                  console.error("Détail Erreur Map :", mapInitErr);
                  setMapError("Erreur lors de l'initialisation de la carte");
                }
              });
            }
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
