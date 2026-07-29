import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import AddressAutocomplete from '../AddressAutocomplete';
import ManualMapMarkerModal from '../agenda/ManualMapMarkerModal';

/**
 * Composant d'administration des Lieux Importants de l'association (Configuration).
 * Permet de gérer le répertoire centralisé des salles, locaux et lieux habituels (CRUD).
 */
export default function TabLieux({ formData, handleChange, saving, t }) {
  const lieuxImportants = Array.isArray(formData.lieuxImportants) ? formData.lieuxImportants : [];

  // État local pour le formulaire d'ajout / édition
  const [editingId, setEditingId] = useState(null);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Ouvrir le formulaire en mode édition
  const handleEdit = (lieu) => {
    setEditingId(lieu.id);
    setNom(lieu.nom || '');
    setAdresse(lieu.adresse || '');
    setGoogleMapsUrl(lieu.googleMapsUrl || '');
    setNotes(lieu.notes || '');
    setLatitude(lieu.latitude || null);
    setLongitude(lieu.longitude || null);
    setIsFormOpen(true);
  };

  // Réinitialiser le formulaire
  const handleResetForm = () => {
    setEditingId(null);
    setNom('');
    setAdresse('');
    setGoogleMapsUrl('');
    setNotes('');
    setLatitude(null);
    setLongitude(null);
    setIsFormOpen(false);
  };

  // Sauvegarder (Ajout ou Modification) un lieu
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nom.trim() || !adresse.trim()) {
      alert("Veuillez renseigner au minimum le nom usuel et l'adresse complète.");
      return;
    }

    const updatedList = [...lieuxImportants];

    if (editingId) {
      // Modification d'un lieu existant
      const idx = updatedList.findIndex(l => l.id === editingId);
      if (idx !== -1) {
        updatedList[idx] = {
          ...updatedList[idx],
          nom: nom.trim(),
          adresse: adresse.trim(),
          googleMapsUrl: googleMapsUrl.trim() || (latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : `https://maps.google.com/?q=${encodeURIComponent(adresse.trim())}`),
          notes: notes.trim(),
          latitude: latitude || updatedList[idx].latitude || null,
          longitude: longitude || updatedList[idx].longitude || null
        };
      }
    } else {
      // Ajout d'un nouveau lieu
      const newLieu = {
        id: `lieu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        nom: nom.trim(),
        adresse: adresse.trim(),
        googleMapsUrl: googleMapsUrl.trim() || (latitude && longitude ? `https://maps.google.com/?q=${latitude},${longitude}` : `https://maps.google.com/?q=${encodeURIComponent(adresse.trim())}`),
        notes: notes.trim(),
        latitude: latitude || null,
        longitude: longitude || null
      };
      updatedList.push(newLieu);
    }

    handleChange('lieuxImportants', updatedList);
    handleResetForm();
  };

  // Supprimer un lieu
  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce lieu de la liste des lieux importants ?")) {
      const updatedList = lieuxImportants.filter(l => l.id !== id);
      handleChange('lieuxImportants', updatedList);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              📍 Lieux Clés & Salles Clé en main
            </h3>
            <p className="text-[10px] opacity-75 mt-0.5 leading-relaxed">
              Gérez le répertoire centralisé des lieux habituels (salles de répétitions, local, salles de réunion, scènes principales). Ils apparaîtront en sélection rapide dans tous les formulaires d'événements.
            </p>
          </div>

          {!isFormOpen && (
            <CordelButton
              variant="vert"
              useExtremeBorder={true}
              onClick={() => {
                handleResetForm();
                setIsFormOpen(true);
              }}
              className="text-xs font-extrabold uppercase px-3 py-1.5"
            >
              ＋ Ajouter un lieu
            </CordelButton>
          )}
        </div>

        {/* Formulaire d'ajout / édition */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-cordel-bg-light/60 rounded border border-cordel-master-dark/20 my-2">
            <h4 className="text-xs font-extrabold uppercase text-cordel-wood">
              {editingId ? "✏️ Modifier le lieu" : "➕ Nouveau lieu important"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Nom usuel */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Nom usuel du lieu *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Salle de répétition principale / Local Matériel"
                  required
                  className="theme-input text-xs bg-white py-1.5 font-bold"
                />
              </div>

              {/* Adresse avec Autocomplétion Google */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Adresse physique complète *
                </label>
                <AddressAutocomplete
                  value={typeof adresse === 'string' ? adresse : (adresse?.target?.value || '')}
                  onChange={(e) => {
                    const stringVal = typeof e === 'string' ? e : (e?.target?.value !== undefined ? e.target.value : String(e || ''));
                    setAdresse(stringVal);
                  }}
                  onPlaceSelected={(placeDetails) => {
                    if (placeDetails) {
                      setAdresse(placeDetails.formattedAddress || placeDetails.name || adresse);
                      if (placeDetails.latitude && placeDetails.longitude) {
                        setLatitude(placeDetails.latitude);
                        setLongitude(placeDetails.longitude);
                        setGoogleMapsUrl(`https://maps.google.com/?q=${placeDetails.latitude},${placeDetails.longitude}`);
                      }
                    }
                  }}
                  placeholder="Rechercher une adresse sur Google Maps..."
                  className="theme-input text-xs bg-white py-1.5"
                />

                <div className="flex flex-col items-start gap-1 mt-1 select-none">
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    📌 Placer ou ajuster le repère sur la carte manuellement
                  </button>
                  {latitude && longitude && (
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                      ✅ Coordonnées GPS ajustées : {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
                    </span>
                  )}
                </div>
              </div>

              {/* Lien Google Maps */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lien Google Maps / GPS (Optionnel)
                </label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="theme-input text-xs bg-white py-1.5"
                />
              </div>

              {/* Notes d'accès */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Instructions d'accès / Notes (Optionnel)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Digicode 45B, 2ème étage à droite, entrée parc"
                  className="theme-input text-xs bg-white py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded text-encre-noire cursor-pointer"
              >
                Annuler
              </button>
              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                className="text-xs font-extrabold uppercase px-4 py-1.5"
              >
                {editingId ? "Enregistrer les modifications" : "Ajouter le lieu"}
              </CordelButton>
            </div>
          </form>
        )}

        {/* Liste des lieux enregistrés */}
        {lieuxImportants.length === 0 ? (
          <div className="p-6 text-center italic text-xs opacity-60 bg-white/40 rounded border border-dashed border-cordel-master-dark/20">
            Aucun lieu enregistré pour le moment. Cliquez sur "Ajouter un lieu" pour créer votre répertoire.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lieuxImportants.map((lieu) => (
              <div key={lieu.id} className="p-3.5 bg-white/80 rounded border border-cordel-master-dark/20 flex flex-col justify-between gap-2 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-cordel-wood flex items-center gap-1.5">
                      📍 {lieu.nom}
                    </h4>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(lieu)}
                        className="text-[10px] font-bold text-blue-700 hover:underline px-1 cursor-pointer"
                      >
                        ✏️ Édit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lieu.id)}
                        className="text-[10px] font-bold text-red-700 hover:underline px-1 cursor-pointer"
                      >
                        🗑️ Suppr
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold text-encre-noire leading-snug">
                    {lieu.adresse}
                  </p>

                  {lieu.notes && (
                    <p className="text-[10px] bg-amber-50 text-amber-900 p-1.5 rounded border border-amber-200 mt-1 italic">
                      🔑 <strong>Accès :</strong> {lieu.notes}
                    </p>
                  )}
                </div>

                {lieu.googleMapsUrl && (
                  <div className="pt-2 border-t border-dashed border-encre-noire/10 flex justify-end">
                    <a
                      href={lieu.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9.5px] font-extrabold uppercase text-cordel-master-dark hover:underline flex items-center gap-1"
                    >
                      🗺️ Voir sur Google Maps ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CordelCard>

      {/* Section 2: Grille de correspondance des lieux par défaut par type d'événement */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
        <div className="border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            🎯 Lieux par Défaut selon le Type d'Événement
          </h3>
          <p className="text-[10px] opacity-75 mt-0.5 leading-relaxed">
            Associez un lieu habituel par défaut à chaque type d'événement (réunion, répétition, stage, atelier, prestation). Lors de la création d'un événement, le lieu sera automatiquement pré-rempli.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {(Array.isArray(formData.eventTypes) && formData.eventTypes.length > 0
            ? formData.eventTypes
            : ['reunion', 'repetition', 'stage', 'atelier', 'prestation']
          ).map((typeKey) => {
            const currentLieuId = (formData.defaultLocationsByEventType || {})[typeKey] || '';

            // Libellé propre pour chaque type d'événement
            const typeLabels = {
              reunion: "🤝 Réunions & AG",
              repetition: "🥁 Répétitions",
              stage: "🎓 Stages",
              atelier: "🛠️ Ateliers",
              prestation: "🎭 Prestations & Concerts"
            };

            const labelText = typeLabels[typeKey] || `Événement: ${typeKey.toUpperCase()}`;

            return (
              <div key={typeKey} className="p-3 bg-white/70 rounded border border-cordel-master-dark/20 flex flex-col gap-1.5 shadow-sm">
                <label className="text-[9.5px] uppercase font-black tracking-wider text-cordel-wood">
                  {labelText}
                </label>
                <select
                  value={currentLieuId}
                  onChange={(e) => {
                    const newLieuId = e.target.value;
                    const updated = {
                      ...(formData.defaultLocationsByEventType || {}),
                      [typeKey]: newLieuId
                    };
                    handleChange('defaultLocationsByEventType', updated);
                  }}
                  className="theme-input text-xs font-bold py-1.5 bg-white border border-cordel-master-dark/30"
                >
                  <option value="">🚫 Aucun (Saisie manuelle)</option>
                  {lieuxImportants.map((lieu) => (
                    <option key={lieu.id} value={lieu.id}>
                      📍 {lieu.nom} ({lieu.adresse})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </CordelCard>

      {/* Modale de positionnement manuel sur la carte */}
      <ManualMapMarkerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={latitude}
        initialLng={longitude}
        addressContext={adresse}
        onSave={({ latitude: newLat, longitude: newLng }) => {
          setLatitude(newLat);
          setLongitude(newLng);
          setGoogleMapsUrl(`https://maps.google.com/?q=${newLat},${newLng}`);
          setIsMapModalOpen(false);
        }}
      />
    </div>
  );
}
