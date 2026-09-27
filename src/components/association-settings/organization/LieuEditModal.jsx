import React, { useState } from 'react';
import AddressAutocomplete from '../../AddressAutocomplete';
import ManualMapMarkerModal from '../../agenda/ManualMapMarkerModal';
import CordelButton from '../../CordelButton';

/**
 * Modale / Formulaire d'édition ou création d'un lieu important avec coordonnées GPS.
 */
export default function LieuEditModal({ initialLieu, isOpen, onClose, onSave, saving }) {
  if (!isOpen) return null;

  const [nom, setNom] = useState(initialLieu?.nom || '');
  const [adresse, setAdresse] = useState(initialLieu?.adresse || '');
  const [notes, setNotes] = useState(initialLieu?.notes || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialLieu?.googleMapsUrl || '');
  const [latitude, setLatitude] = useState(initialLieu?.latitude || null);
  const [longitude, setLongitude] = useState(initialLieu?.longitude || null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nom.trim() || !adresse.trim()) {
      alert("Veuillez renseigner le nom et l'adresse complète.");
      return;
    }
    const finalUrl = googleMapsUrl.trim() || (latitude && longitude 
      ? `https://maps.google.com/?q=${latitude},${longitude}` 
      : `https://maps.google.com/?q=${encodeURIComponent(adresse.trim())}`);

    onSave({
      id: initialLieu?.id || `lieu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nom: nom.trim(),
      adresse: adresse.trim(),
      notes: notes.trim(),
      googleMapsUrl: finalUrl,
      latitude,
      longitude
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="bg-cordel-bg border-2 border-encre-noire rounded-lg shadow-xl p-5 max-w-lg w-full text-left flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        <h4 className="text-xs font-black uppercase text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2">
          {initialLieu?.id ? "✏️ Modifier le lieu" : "➕ Nouveau lieu habituel"}
        </h4>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Nom usuel du lieu *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Salle de répétition principale"
              required
              className="theme-input text-xs bg-white py-1.5 font-bold"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Adresse physique complète *</label>
            <AddressAutocomplete
              value={adresse}
              onChange={(val) => setAdresse(typeof val === 'string' ? val : val?.target?.value || '')}
              onPlaceSelected={(details) => {
                if (details) {
                  setAdresse(details.formattedAddress || details.name || adresse);
                  if (details.latitude && details.longitude) {
                    setLatitude(details.latitude);
                    setLongitude(details.longitude);
                  }
                }
              }}
              placeholder="Rechercher une adresse sur Google Maps..."
              className="theme-input text-xs bg-white py-1.5"
            />
          </div>

          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={() => setIsMapModalOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer"
            >
              📌 {latitude && longitude ? "Ajuster le repère sur la carte" : "Placer le repère sur la carte"}
            </button>
            {latitude && longitude && (
              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                ✓ Repère GPS : {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold text-cordel-master-dark">Instructions d'accès / Notes (Optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Digicode 45B, entrée côté cour"
              className="theme-input text-xs bg-white py-1.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded text-encre-noire cursor-pointer"
            >
              Annuler
            </button>
            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              disabled={saving}
              className="text-xs font-black uppercase px-4 py-1.5 cursor-pointer"
            >
              Enregistrer
            </CordelButton>
          </div>
        </form>
      </div>

      <ManualMapMarkerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        addressContext={adresse}
        onSave={({ latitude: newLat, longitude: newLng }) => {
          setLatitude(newLat);
          setLongitude(newLng);
          setIsMapModalOpen(false);
        }}
      />
    </div>
  );
}
