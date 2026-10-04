import React, { useState } from 'react';
import AddressAutocomplete from '../../AddressAutocomplete';
import ManualMapMarkerModal from '../../agenda/ManualMapMarkerModal';
import CordelButton from '../../CordelButton';
import useModalEscape from '../../../hooks/useModalEscape';
import { useTranslation } from '../../LanguageContext';

/**
 * Modale / Formulaire d'édition ou création d'un lieu important avec coordonnées GPS.
 */
export default function LieuEditModal({ initialLieu, isOpen, onClose, onSave, saving }) {
  const { t } = useTranslation();
  const [nom, setNom] = useState(initialLieu?.nom || '');
  const [adresse, setAdresse] = useState(initialLieu?.adresse || '');
  const [notes, setNotes] = useState(initialLieu?.notes || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialLieu?.googleMapsUrl || '');
  const [latitude, setLatitude] = useState(initialLieu?.latitude ?? null);
  const [longitude, setLongitude] = useState(initialLieu?.longitude ?? null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Fermeture accessible avec touche Échap
  useModalEscape(isOpen, onClose, saving);

  // Réinitialisation ou synchronisation des états à chaque changement du lieu ou à l'ouverture
  React.useEffect(() => {
    if (isOpen) {
      setNom(initialLieu?.nom || '');
      setAdresse(initialLieu?.adresse || '');
      setNotes(initialLieu?.notes || '');
      setGoogleMapsUrl(initialLieu?.googleMapsUrl || '');
      setLatitude(initialLieu?.latitude ?? null);
      setLongitude(initialLieu?.longitude ?? null);
      setIsMapModalOpen(false);
    }
  }, [isOpen, initialLieu]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nom.trim() || !adresse.trim()) {
      alert(t('settings.organization.lieuEditModal.veuillezRenseignerLeNomEt'));
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
      <div className="bg-cordel-bg border-2 border-encre-noire rounded-lg shadow-xl max-w-lg w-full text-left flex flex-col max-h-[90dvh] overflow-hidden">
        {/* Étage 1 : Header fixe */}
        <div className="shrink-0 p-5 pb-3 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-cordel-wood">
            {initialLieu?.id ? t('settings.organization.lieuEditModal.modifierLeLieu') : t('settings.organization.lieuEditModal.nouveauLieuHabituel')}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-base cursor-pointer shrink-0"
            title={t('settings.organization.lieuEditModal.fermer')}
          >
            ✕
          </button>
        </div>

        {/* Étage 2 & 3 : Formulaire scrollable avec actions fixes */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 pt-3 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('settings.organization.lieuEditModal.nomUsuelDuLieu')}</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={t('settings.organization.lieuEditModal.exSalleDeRepetitionPrincipale')}
                required
                className="theme-input text-xs bg-white py-1.5 font-bold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('settings.organization.lieuEditModal.adressePhysiqueComplete')}</label>
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
                placeholder={t('settings.organization.lieuEditModal.rechercherUneAdresseSurGoogle')}
                className="theme-input text-xs bg-white py-1.5"
              />
            </div>

            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1 cursor-pointer"
              >
                📌 {latitude && longitude ? t('settings.organization.lieuEditModal.ajusterLeRepereSurLa') : t('settings.organization.lieuEditModal.placerLeRepereSurLa')}
              </button>
              {latitude && longitude && (
                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                  {t('settings.organization.lieuEditModal.repereGps')} {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('settings.organization.lieuEditModal.instructionsDAccesNotesOptionnel')}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('settings.organization.lieuEditModal.exDigicode45bEntreeCote')}
                className="theme-input text-xs bg-white py-1.5"
              />
            </div>
          </div>

          {/* Étage 3 : Actions fixes avec pb-safe */}
          <div className="shrink-0 flex justify-end gap-2 p-4 border-t border-dashed border-cordel-master-dark/20 bg-[var(--theme-bg)] pb-[max(env(safe-area-inset-bottom),1rem)]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded text-encre-noire cursor-pointer shrink-0"
            >
              {t('settings.organization.lieuEditModal.annuler')}
            </button>
            <CordelButton
              type="submit"
              variant="vert"
              useExtremeBorder={true}
              disabled={saving}
              className="text-xs font-black uppercase px-4 py-1.5 cursor-pointer shrink-0"
            >
              {t('settings.organization.lieuEditModal.enregistrer')}
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
