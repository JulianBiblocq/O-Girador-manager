import React, { useState } from 'react';
import AddressAutocomplete from './AddressAutocomplete';
import ManualMapMarkerModal from './agenda/ManualMapMarkerModal';

/**
 * Composant de sélection intelligente de lieu pour les formulaires d'événements (Agenda & Studio Réunions).
 * Propose une liste déroulante des lieux enregistrés ("Lieux importants" de l'association)
 * ainsi qu'une option de saisie libre / autocomplétion Google Maps.
 */
export default function LocationSelector({
  value = '',
  onChange,
  lieuxImportants = [],
  onPlaceSelected,
  placeholder = "Rechercher ou saisir l'adresse...",
  className = "theme-input text-xs w-full bg-white py-1.5"
}) {
  const list = Array.isArray(lieuxImportants) ? lieuxImportants : [];
  
  // Extraction sécurisée sous forme de chaîne de caractères
  const safeValue = typeof value === 'string' ? value : (value?.target?.value !== undefined ? String(value.target.value) : (value ? String(value) : ''));

  // Trouver si l'adresse actuelle correspond à un lieu enregistré
  const currentLieu = list.find(l => {
    if (!safeValue) return false;
    const valLower = safeValue.toLowerCase().trim();
    const nomLower = (l.nom || '').toLowerCase().trim();
    const adrLower = (l.adresse || '').toLowerCase().trim();
    const fullLower = `${nomLower} - ${adrLower}`;
    return valLower === nomLower || valLower === adrLower || valLower === fullLower;
  });

  const [selectedPresetId, setSelectedPresetId] = useState(currentLieu ? currentLieu.id : 'custom');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Lors de la sélection dans le menu déroulant
  const handleSelectPreset = (e) => {
    const lieuId = e.target.value;
    setSelectedPresetId(lieuId);

    if (lieuId === 'custom' || !lieuId) {
      // Saisie libre
      return;
    }

    const found = list.find(l => l.id === lieuId);
    if (found) {
      const fullText = found.nom && found.adresse ? `${found.nom} - ${found.adresse}` : (found.adresse || found.nom);
      if (onChange) {
        onChange(fullText, found);
      }
      if (onPlaceSelected) {
        onPlaceSelected({
          formattedAddress: found.adresse,
          name: found.nom,
          latitude: found.latitude,
          longitude: found.longitude,
          googleMapsUrl: found.googleMapsUrl,
          notes: found.notes
        });
      }
    }
  };

  const selectedPlaceNotes = list.find(l => l.id === selectedPresetId)?.notes;

  return (
    <div className="flex flex-col gap-2 text-left w-full select-none">
      {/* Menu déroulant des lieux enregistrés */}
      {list.length > 0 && (
        <div className="flex flex-col gap-1">
          <select
            value={selectedPresetId}
            onChange={handleSelectPreset}
            className="theme-input text-xs font-bold bg-amber-50/80 border border-amber-300 py-1.5 w-full rounded text-cordel-wood"
          >
            <option value="custom">✍️ Saisie libre / Autre adresse...</option>
            <optgroup label="📍 Lieux habituels de l'association">
              {list.map((lieu) => (
                <option key={lieu.id} value={lieu.id}>
                  📍 {lieu.nom} ({lieu.adresse})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {/* Champ d'adresse avec Autocomplétion Google Maps */}
      <AddressAutocomplete
        value={safeValue}
        onChange={(e) => {
          const stringVal = typeof e === 'string' ? e : (e?.target?.value !== undefined ? e.target.value : String(e || ''));
          setSelectedPresetId('custom');
          if (onChange) onChange(stringVal, null);
        }}
        onPlaceSelected={(placeDetails) => {
          if (onPlaceSelected) onPlaceSelected(placeDetails);
        }}
        placeholder={placeholder}
        className={className}
      />

      {/* Bouton pour ajuster manuellement le repère sur la carte */}
      <div className="flex justify-start select-none">
        <button
          type="button"
          onClick={() => setIsMapModalOpen(true)}
          className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer"
        >
          📌 Ajuster le repère sur la carte
        </button>
      </div>

      {/* Informations d'accès si un lieu enregistré avec des notes est sélectionné */}
      {selectedPresetId !== 'custom' && selectedPlaceNotes && (
        <div className="text-[10px] bg-amber-100/70 text-amber-900 p-2 rounded border border-amber-300 font-medium leading-relaxed">
          🔑 <strong>Instructions d'accès :</strong> {selectedPlaceNotes}
        </div>
      )}

      {/* Modale de positionnement manuel */}
      <ManualMapMarkerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        addressContext={safeValue}
        onSave={({ latitude: newLat, longitude: newLng }) => {
          if (onPlaceSelected) {
            onPlaceSelected({
              formattedAddress: safeValue,
              latitude: newLat,
              longitude: newLng,
              googleMapsUrl: `https://maps.google.com/?q=${newLat},${newLng}`
            });
          }
          setIsMapModalOpen(false);
        }}
      />
    </div>
  );
}
