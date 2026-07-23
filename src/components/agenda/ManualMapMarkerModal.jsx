import React, { useEffect, useRef, useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { loadGoogleMaps } from '../../utils/googleMaps';

/**
 * ManualMapMarkerModal component allows admins to position a draggable pin
 * on a Google Map when an address lookup is imprecise or for specific lieu-dit locations.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen Whether modal is visible
 * @param {Function} props.onClose Modal close handler
 * @param {Function} props.onSave Callback receiving { latitude, longitude }
 * @param {number|null} props.initialLat Initial latitude
 * @param {number|null} props.initialLng Initial longitude
 * @param {string} props.addressContext Text address to geocode as fallback center
 */
export default function ManualMapMarkerModal({
  isOpen,
  onClose,
  onSave,
  initialLat,
  initialLng,
  addressContext = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const [coords, setCoords] = useState({
    lat: initialLat ? Number(initialLat) : null,
    lng: initialLng ? Number(initialLng) : null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setLoading(true);
    setError('');

    // Default center fallback (France center)
    const defaultCenter = { lat: 46.603354, lng: 1.888334 };
    let startCenter = defaultCenter;
    let startZoom = 6;

    if (initialLat && initialLng) {
      startCenter = { lat: Number(initialLat), lng: Number(initialLng) };
      startZoom = 16;
    }

    loadGoogleMaps()
      .then(async (maps) => {
        if (!active || !mapRef.current) return;

        // Try geocoding addressContext if no coordinates provided
        if ((!initialLat || !initialLng) && addressContext.trim()) {
          try {
            const geocoder = new maps.Geocoder();
            const result = await new Promise((resolve) => {
              geocoder.geocode({ address: addressContext }, (results, status) => {
                if (status === 'OK' && results && results[0]?.geometry?.location) {
                  const loc = results[0].geometry.location;
                  resolve({
                    lat: loc.lat(),
                    lng: loc.lng()
                  });
                } else {
                  resolve(null);
                }
              });
            });

            if (result) {
              startCenter = result;
              startZoom = 15;
              if (active && (!coords.lat || !coords.lng)) {
                setCoords(result);
              }
            }
          } catch (geoErr) {
            console.warn("Geocoding address context failed:", geoErr);
          }
        }

        if (!active || !mapRef.current) return;

        const map = new maps.Map(mapRef.current, {
          center: startCenter,
          zoom: startZoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true
        });
        mapInstanceRef.current = map;

        const markerPos = (initialLat && initialLng) || (startCenter.lat !== defaultCenter.lat)
          ? startCenter
          : startCenter;

        const marker = new maps.Marker({
          position: markerPos,
          map: map,
          draggable: true,
          title: "Glissez ce marqueur jusqu'à la position exacte"
        });
        markerInstanceRef.current = marker;

        if (!coords.lat || !coords.lng) {
          setCoords(markerPos);
        }

        // Listen for drag end
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            setCoords({ lat: pos.lat(), lng: pos.lng() });
          }
        });

        // Listen for map click to reposition marker
        map.addListener('click', (e) => {
          if (e.latLng) {
            const clickLat = e.latLng.lat();
            const clickLng = e.latLng.lng();
            marker.setPosition(e.latLng);
            setCoords({ lat: clickLat, lng: clickLng });
          }
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("ManualMapMarkerModal - Failed to load Google Maps SDK:", err);
        if (active) {
          setError("Impossible de charger la carte Google Maps.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (coords.lat !== null && coords.lng !== null) {
      onSave({
        latitude: parseFloat(coords.lat.toFixed(6)),
        longitude: parseFloat(coords.lng.toFixed(6))
      });
      onClose();
    } else {
      alert("Veuillez positionner un marqueur sur la carte.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl flex flex-col gap-3 p-4 select-none relative">
        <div className="flex justify-between items-center border-b border-dashed border-encre-noire/20 pb-2">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            📌 Placer le Marqueur sur la Carte
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-xs font-black px-2 py-0.5 rounded bg-cordel-bg border border-encre-noire hover:bg-red-100 text-red-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] font-semibold text-encre-noire opacity-80 text-left leading-relaxed">
          💡 <strong>Instruction</strong> : Faites glisser le marqueur rouge ou cliquez directement n'importe où sur la carte pour définir l'emplacement exact de l'événement.
        </p>

        {/* Map Container */}
        <div className="relative w-full h-[360px] rounded-[6px] border-2 border-encre-noire overflow-hidden bg-cordel-master-light/20">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 z-10">
              <span className="text-xs font-black uppercase tracking-wider animate-pulse text-cordel-wood">
                ⏳ Chargement de la carte interactive...
              </span>
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-bold text-red-600 bg-red-50">
              ⚠️ {error}
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
          )}
        </div>

        {/* Coordinates status */}
        <div className="flex justify-between items-center text-xs bg-cordel-bg p-2 rounded border border-dashed border-encre-noire/20 font-bold">
          <span>Coordonnées sélectionnées :</span>
          <span className="font-mono text-cordel-wood text-xs">
            {coords.lat !== null && coords.lng !== null 
              ? `Lat: ${coords.lat.toFixed(5)} | Lng: ${coords.lng.toFixed(5)}`
              : "Aucune position"}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 mt-2">
          <CordelButton variant="default" type="button" onClick={onClose} className="text-xs py-2 px-4">
            Annuler
          </CordelButton>
          <CordelButton variant="ocre" type="button" onClick={handleConfirm} className="text-xs py-2 px-4 font-black">
            ✅ Valider cette position
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
