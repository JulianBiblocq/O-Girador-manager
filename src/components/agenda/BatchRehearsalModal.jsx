import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { getCurrentSeason, getSeasonDateRange, DEFAULT_SEASON_START_MONTH } from '../../utils/seasonUtils';
import BatchRehearsalTemplateForm from './BatchRehearsalTemplateForm';
import BatchRehearsalDateSelector from './BatchRehearsalDateSelector';

/**
 * Modale Cordel : Générateur de répétitions groupées dans l'agenda
 * Conforme à la règle anti-monolithe (< 200 lignes).
 */
export default function BatchRehearsalModal({
  isOpen,
  onClose,
  groupId,
  lieuxImportants = [],
  defaultLocationsByEventType = {},
  adresseLocal = '',
  saisonDebutMois = DEFAULT_SEASON_START_MONTH,
  onSuccess
}) {
  const [selectedDay, setSelectedDay] = useState(4); // 4 = Jeudi par défaut
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Plage de dates par défaut (de la date du jour jusqu'à la fin de la saison courante)
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentSeason = getCurrentSeason(saisonDebutMois);
    const range = getSeasonDateRange(currentSeason, saisonDebutMois);
    return {
      start: todayStr,
      end: range?.endDate || `${today.getFullYear() + 1}-06-30`
    };
  });

  // Gabarit initial pré-rempli
  const [template, setTemplate] = useState(() => {
    const defaultLieuId = defaultLocationsByEventType?.repetition;
    let initialLieu = adresseLocal || '';
    let initialLieuId = null;
    let initialLat = null;
    let initialLng = null;

    if (defaultLieuId) {
      const found = lieuxImportants.find(l => l.id === defaultLieuId);
      if (found) {
        initialLieu = found.nom && found.adresse ? `${found.nom} - ${found.adresse}` : (found.adresse || found.nom);
        initialLieuId = found.id;
        initialLat = found.latitude || null;
        initialLng = found.longitude || null;
      }
    }

    return {
      titre: 'Répétition',
      heureDebut: '19:30',
      heureFin: '22:00',
      lieu: initialLieu,
      lieuId: initialLieuId,
      latitude: initialLat,
      longitude: initialLng,
      includesPercussion: true,
      includesDance: true,
      isPublic: false,
      enableCarpool: false,
      description: ''
    };
  });

  // Calcul dynamique de toutes les occurrences correspondant au jour choisi dans la plage
  const occurrences = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];
    const list = [];
    const current = new Date(dateRange.start + 'T00:00:00');
    const end = new Date(dateRange.end + 'T23:59:59');

    if (isNaN(current.getTime()) || isNaN(end.getTime()) || current > end) return [];

    while (current <= end) {
      if (current.getDay() === selectedDay) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        list.push(`${yyyy}-${mm}-${dd}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [dateRange.start, dateRange.end, selectedDay]);

  // Toutes les occurrences sont cochées par défaut à chaque modification de la liste d'occurrences
  const [selectedDates, setSelectedDates] = useState([]);
  useEffect(() => {
    setSelectedDates(occurrences);
  }, [occurrences]);

  if (!isOpen) return null;

  // Création groupée avec Firestore writeBatch
  const handleBatchCreate = async () => {
    if (!groupId) return;
    if (selectedDates.length === 0) {
      alert("Veuillez cocher au moins une date de répétition.");
      return;
    }

    setSaving(true);
    try {
      const CHUNK_SIZE = 400; // Limite de 500 opérations Firestore
      for (let i = 0; i < selectedDates.length; i += CHUNK_SIZE) {
        const chunk = selectedDates.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((dateStr) => {
          const newDocRef = doc(collection(db, 'events'));
          const eventData = {
            groupId: String(groupId),
            type: 'repetition',
            titre: (template.titre || 'Répétition').trim(),
            date: `${dateStr}T${template.heureDebut || '19:30'}`,
            dateDebut: `${dateStr}T${template.heureDebut || '19:30'}`,
            dateFin: `${dateStr}T${template.heureFin || '22:00'}`,
            lieu: template.lieu || '',
            lieuId: template.lieuId || null,
            latitude: template.latitude !== undefined && template.latitude !== null ? Number(template.latitude) : null,
            longitude: template.longitude !== undefined && template.longitude !== null ? Number(template.longitude) : null,
            includesPercussion: template.includesPercussion !== false,
            includesDance: template.includesDance !== false,
            isPublic: Boolean(template.isPublic),
            enableCarpool: Boolean(template.enableCarpool),
            enableInscriptions: true,
            status: 'confirme',
            setlist: [],
            inscriptions: [],
            description: template.description || '',
            volunteerShifts: [],
            requiresValidation: false,
            montantRecette: 0,
            montantDepense: 0,
            budgetDepenses: [],
            activerRecolteMedias: false,
            publierSurVaral: false
          };
          batch.set(newDocRef, eventData);
        });

        await batch.commit();
      }

      const count = selectedDates.length;
      setToastMsg(`✓ ${count} répétition${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} à l'agenda avec succès !`);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erreur lors de la création en lot des répétitions :", err);
      alert("Une erreur est survenue lors de la création des répétitions. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-3xl max-h-[92vh] flex flex-col p-4 sm:p-6 bg-cordel-card-bg border-2 border-encre-noire shadow-[4px_6px_0px_0px_#181716] overflow-hidden"
      >
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-cordel-master-dark/25 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-cordel-wood">
                Planifier une série de répétitions
              </h3>
              <p className="text-[11px] font-bold text-cordel-master-dark/75">
                Générez en un clic les répétitions de la saison et personnalisez les exceptions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full border-2 border-encre-noire bg-white hover:bg-neutral-100 flex items-center justify-center text-sm font-black cursor-pointer shadow-2xs"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 scrollbar-thin">
          <BatchRehearsalTemplateForm
            template={template}
            setTemplate={setTemplate}
            lieuxImportants={lieuxImportants}
          />

          <BatchRehearsalDateSelector
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            dateRange={dateRange}
            setDateRange={setDateRange}
            occurrences={occurrences}
            selectedDates={selectedDates}
            setSelectedDates={setSelectedDates}
          />
        </div>

        {/* Pied d'action */}
        <div className="mt-4 pt-3 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-cordel-master-dark/80">
            {selectedDates.length > 0
              ? `${selectedDates.length} document(s) événement seront créés dans l'agenda.`
              : 'Aucune date sélectionnée.'}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <CordelButton
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-none text-xs px-4 py-2 font-bold uppercase tracking-wider"
            >
              Annuler
            </CordelButton>

            <button
              type="button"
              onClick={handleBatchCreate}
              disabled={saving || selectedDates.length === 0}
              className={`flex-1 sm:flex-none px-5 py-2 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire transition-all cursor-pointer shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center justify-center gap-2 ${
                saving || selectedDates.length === 0
                  ? 'bg-neutral-300 text-neutral-500 border-neutral-400 cursor-not-allowed shadow-none'
                  : 'bg-[var(--color-cordel-vert)] text-white hover:brightness-110'
              }`}
            >
              {saving ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Créer les {selectedDates.length} répétitions</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toast confirmation discret */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[var(--color-cordel-vert)] text-white text-xs font-black uppercase tracking-wider rounded-lg border-2 border-encre-noire shadow-[3px_3px_0px_0px_#181716] animate-bounce">
            {toastMsg}
          </div>
        )}
      </CordelCard>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
