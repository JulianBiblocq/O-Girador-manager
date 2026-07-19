import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
const EventDetails = React.lazy(() => import('./EventDetails'));
import CalendarGrid from './CalendarGrid';
import { useTranslation } from './LanguageContext';
import { XiloCalendar } from './XiloIcons';
import EventBudgetEditor from './event-details/EventBudgetEditor';
const AddressAutocomplete = React.lazy(() => import('./AddressAutocomplete'));
import { calculateRoadDistance } from '../utils/googleMaps';
const formatDateWithDay = (dateStr, includeYear = true) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).toUpperCase().replace('.', '');
  
  if (includeYear) {
    const dateParts = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
    return `${weekday} ${dateParts}`;
  } else {
    const datePartsNoYear = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    }).format(date);
    return `${weekday} ${datePartsNoYear}`;
  }
};

export default function WidgetAgenda({
  role,
  isSystemAdmin,
  groupId,
  user,
  profileData,
  onFocusModeChange,
  onNavigateToView,
  selectedEvent: propSelectedEvent,
  setSelectedEvent: propSetSelectedEvent
}) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState('upload');
  const [localSelectedEvent, setLocalSelectedEvent] = useState(null);
  const selectedEvent = propSelectedEvent !== undefined ? propSelectedEvent : localSelectedEvent;
  const setSelectedEvent = propSetSelectedEvent !== undefined ? propSetSelectedEvent : setLocalSelectedEvent;
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'list'
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [eventTypes, setEventTypes] = useState(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
  const [agendaEnableFinance, setAgendaEnableFinance] = useState(true);
  const [agendaEnableVolunteerShifts, setAgendaEnableVolunteerShifts] = useState(true);
  const [eventTypeConfigs, setEventTypeConfigs] = useState({});
  const [dressCodes, setDressCodes] = useState([]);

  // Sync association settings to get default local address and km rate
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdresseLocal(data.adresseLocal || '');
        setAgendaEnableFinance(data.agendaEnableFinance !== false);
        setAgendaEnableVolunteerShifts(data.agendaEnableVolunteerShifts !== false);
        setEventTypeConfigs(data.eventTypeConfigs || {});
        if (Array.isArray(data.eventTypes) && data.eventTypes.length > 0) {
          setEventTypes(data.eventTypes);
        } else {
          setEventTypes(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
        }
        setDressCodes(data.dressCodes || []);
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const limit = isMobile ? 5 : 9;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(e => {
    const eDate = new Date(e.date);
    return !isNaN(eDate.getTime()) && eDate >= today;
  });
  const visibleEvents = showAll ? upcomingEvents : upcomingEvents.slice(0, limit);
  
  const [formData, setFormData] = useState({
    titre: '',
    type: 'prestation', // 'prestation', 'repetition', 'stage', 'reunion', 'atelier'
    date: '',
    dateFin: '',
    lieu: '',
    horairesPassages: '',
    horaireCovoiturage: '',
    niveauRequis: 'tous',
    niveauDanseRequis: 'aucun',
    lienDocument: '',
    distanceAllerRetourKm: '',
    lienSocial: '',
    imageUrl: '',
    requiresValidation: false,
    dateLimiteInscription: '',
    tenueRequise: '',
    volunteerShifts: []
  });

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization with Firestore events collection
  useEffect(() => {
    if (!groupId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEvents = [];
      querySnapshot.forEach((doc) => {
        fetchedEvents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Local sorting in JavaScript chronologically to avoid needing index composites on Firestore
      const sortedEvents = fetchedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(sortedEvents);
      setLoading(false);
    }, (error) => {
      console.error("WidgetAgenda - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Calculate distance automatically if address (lieu) changes
    if (name === 'lieu') {
      if (adresseLocal && value) {
        try {
          const distanceKm = await calculateRoadDistance(adresseLocal, value);
          const distanceRoundTrip = Math.round(distanceKm * 2);
          setFormData((prev) => ({ ...prev, distanceAllerRetourKm: distanceRoundTrip.toString() }));
        } catch (err) {
          console.error("Distance Matrix calculation failed on creation:", err);
        }
      }
    }
  };

  const handleOpenForm = () => {
    setImageMode('upload');
    setFormData({
      titre: '',
      type: 'prestation',
      date: '',
      dateFin: '',
      lieu: '',
      horairesPassages: '',
      horaireCovoiturage: '',
      niveauRequis: 'tous',
      niveauDanseRequis: 'aucun',
      lienDocument: '',
      distanceAllerRetourKm: '',
      lienSocial: '',
      imageUrl: '',
      requiresValidation: false,
      montantRecette: '',
      montantDepense: '',
      budgetRecettes: [],
      budgetDepenses: [],
      dateLimiteInscription: ''
    });
    setIsAdding(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storagePath = `documents/${groupId}/events/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
      alert(t('widgetAgenda.uploadSuccess') || "Image téléversée !");
    } catch (error) {
      console.error("WidgetAgenda - Erreur upload image :", error);
      alert(t('widgetAgenda.uploadError') || "Erreur lors du téléversement de l'image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCloseForm = () => {
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId) {
      alert("Erreur : Aucun groupe (groupId) n'est associé à votre compte. Veuillez utiliser un lien d'invitation de groupe.");
      return;
    }
    if (!formData.titre || !formData.date) return;

    const activeType = formData.type || 'repetition';
    const rawConfig = eventTypeConfigs[activeType] || {};
    const activeConfig = {
      agendaRequireInstrument: rawConfig.agendaRequireInstrument || false,
      agendaEnableMaybeStatus: rawConfig.agendaEnableMaybeStatus !== false,
      agendaEnableStageLayout: rawConfig.agendaEnableStageLayout !== false,
      agendaEnableRevisionProgram: rawConfig.agendaEnableRevisionProgram !== false,
      agendaEnableCarpool: rawConfig.agendaEnableCarpool !== false,
      agendaEnableFinance: rawConfig.agendaEnableFinance !== undefined ? rawConfig.agendaEnableFinance : agendaEnableFinance,
      agendaEnableInscriptions: rawConfig.agendaEnableInscriptions !== false,
      agendaEnableImage: rawConfig.agendaEnableImage !== false,
      agendaEnableOrdreDuJour: rawConfig.agendaEnableOrdreDuJour !== undefined ? rawConfig.agendaEnableOrdreDuJour : (activeType === 'reunion'),
      agendaEnableAdresse: rawConfig.agendaEnableAdresse !== false,
      agendaEnableUrl: rawConfig.agendaEnableUrl !== false,
      agendaEnableVolunteerShifts: rawConfig.agendaEnableVolunteerShifts !== undefined ? rawConfig.agendaEnableVolunteerShifts : (agendaEnableVolunteerShifts && (activeType === 'prestation' || activeType === 'stage'))
    };

    setSaving(true);
    try {
      await addDoc(collection(db, 'events'), {
        titre: formData.titre,
        type: formData.type,
        date: formData.date,
        dateFin: formData.dateFin || '',
        groupId: groupId,
        inscriptions: [],
        lieu: activeConfig.agendaEnableAdresse ? formData.lieu || '' : '',
        horairesPassages: formData.type === 'prestation' ? formData.horairesPassages || '' : '',
        horaireCovoiturage: activeConfig.agendaEnableCarpool ? formData.horaireCovoiturage || '' : '',
        niveauRequis: formData.type === 'prestation' ? formData.niveauRequis || 'tous' : 'tous',
        niveauDanseRequis: (formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'repetition' || formData.type === 'atelier') ? formData.niveauDanseRequis || 'aucun' : 'aucun',
        lienDocument: activeConfig.agendaEnableOrdreDuJour ? formData.lienDocument || '' : '',
        distanceAllerRetourKm: activeConfig.agendaEnableCarpool ? (parseFloat(formData.distanceAllerRetourKm) || 0) : 0,
        status: 'confirme',
        lienSocial: activeConfig.agendaEnableUrl ? formData.lienSocial || '' : '',
        imageUrl: activeConfig.agendaEnableImage ? formData.imageUrl || '' : '',
        requiresValidation: activeConfig.agendaEnableInscriptions ? (formData.requiresValidation || false) : false,
        montantRecette: activeConfig.agendaEnableFinance ? ((formData.budgetRecettes || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0)) : 0,
        montantDepense: activeConfig.agendaEnableFinance ? ((formData.budgetDepenses || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0)) : 0,
        budgetRecettes: activeConfig.agendaEnableFinance ? (formData.budgetRecettes || []) : [],
        budgetDepenses: activeConfig.agendaEnableFinance ? (formData.budgetDepenses || []) : [],
        dateLimiteInscription: activeConfig.agendaEnableInscriptions ? formData.dateLimiteInscription || '' : '',
        tenueRequise: formData.tenueRequise || '',
        volunteerShifts: formData.volunteerShifts || []
      });
      setIsAdding(false);
    } catch (error) {
      console.error("WidgetAgenda - Erreur addDoc :", error);
      alert("Erreur lors de la création de l'événement.");
    } finally {
      setSaving(false);
    }
  };

  const variants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };

  // Find the currently selected event inside the synchronized events state 
  // to feed the child component with real-time Firestore updates
  const activeEvent = selectedEvent 
    ? events.find(e => e.id === selectedEvent.id) || selectedEvent 
    : null;

  const currentIndex = activeEvent ? events.findIndex(e => e.id === activeEvent.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < events.length - 1;

  const handlePrevEvent = () => {
    if (hasPrev) {
      setSelectedEvent(events[currentIndex - 1]);
    }
  };

  const handleNextEvent = () => {
    if (hasNext) {
      setSelectedEvent(events[currentIndex + 1]);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    if (onFocusModeChange) {
      onFocusModeChange(true);
    }
  };

  // Render Event Details view if a ticket is clicked
  if (activeEvent) {
    return (
      <React.Suspense fallback={
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
            Chargement des détails...
          </span>
        </div>
      }>
        <EventDetails 
          event={activeEvent}
          user={user}
          profileData={profileData}
          onNavigateToView={onNavigateToView}
          viewMode={viewMode}
          setViewMode={(mode) => {
            setViewMode(mode);
            setSelectedEvent(null);
            if (onFocusModeChange) {
              onFocusModeChange(false);
            }
          }}
          onClose={() => {
            setSelectedEvent(null);
            if (onFocusModeChange) {
              onFocusModeChange(false);
            }
          }}
          onPrev={hasPrev ? handlePrevEvent : null}
          onNext={hasNext ? handleNextEvent : null}
        />
      </React.Suspense>
    );
  }

  const activeType = formData.type || 'repetition';
  const rawConfig = eventTypeConfigs[activeType] || {};
  const activeConfig = {
    agendaRequireInstrument: rawConfig.agendaRequireInstrument || false,
    agendaEnableMaybeStatus: rawConfig.agendaEnableMaybeStatus !== false,
    agendaEnableStageLayout: rawConfig.agendaEnableStageLayout !== false,
    agendaEnableRevisionProgram: rawConfig.agendaEnableRevisionProgram !== false,
    agendaEnableCarpool: rawConfig.agendaEnableCarpool !== false,
    agendaEnableFinance: rawConfig.agendaEnableFinance !== undefined ? rawConfig.agendaEnableFinance : agendaEnableFinance,
    agendaEnableInscriptions: rawConfig.agendaEnableInscriptions !== false,
    agendaEnableImage: rawConfig.agendaEnableImage !== false,
    agendaEnableOrdreDuJour: rawConfig.agendaEnableOrdreDuJour !== undefined ? rawConfig.agendaEnableOrdreDuJour : (activeType === 'reunion'),
    agendaEnableAdresse: rawConfig.agendaEnableAdresse !== false,
    agendaEnableUrl: rawConfig.agendaEnableUrl !== false,
    agendaEnableVolunteerShifts: rawConfig.agendaEnableVolunteerShifts !== undefined ? rawConfig.agendaEnableVolunteerShifts : (agendaEnableVolunteerShifts && (activeType === 'prestation' || activeType === 'stage'))
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center pl-1 pr-1 w-full gap-2">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left flex items-center gap-1">
          <XiloCalendar size={14} /> {t('widgetAgenda.title')}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {!loading && !isAdding && (
            <div className="flex border border-encre-noire rounded-[4px_6px_3px_5px] overflow-hidden bg-cordel-bg shadow-[1px_1px_0px_0px_#181716] select-none text-[8px] font-black uppercase">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2 py-0.5 cursor-pointer transition-colors ${viewMode === 'cards' ? 'bg-cordel-master-dark text-cordel-bg-light' : 'bg-cordel-bg-light text-encre-noire hover:bg-neutral-100'}`}
              >
                🎴 <span className="hidden sm:inline">Cartes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2 py-0.5 cursor-pointer transition-colors ${viewMode === 'list' ? 'bg-cordel-master-dark text-cordel-bg-light' : 'bg-cordel-bg-light text-encre-noire hover:bg-neutral-100'}`}
              >
                📋 <span className="hidden sm:inline">Liste</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2 py-0.5 cursor-pointer transition-colors ${viewMode === 'grid' ? 'bg-cordel-master-dark text-cordel-bg-light' : 'bg-cordel-bg-light text-encre-noire hover:bg-neutral-100'}`}
              >
                📅 <span className="hidden sm:inline">Grille</span>
              </button>
            </div>
          )}

          {!loading && isAuthorized && !isAdding && (
            <CordelButton 
              variant="default" 
              onClick={handleOpenForm} 
              className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
            >
              + Ajouter
            </CordelButton>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Create Event Form (Visible when isAdding is true) */}
      {!loading && isAdding && (
        <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
          <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
            Créer un événement
          </h4>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Titre de l'événement
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="Ex : Carnaval ou Répétition"
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Type Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('widgetAgenda.typeLabel') || "Type"}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={saving}
                className="theme-input w-full disabled:opacity-50"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'prestation' ? (t('widgetAgenda.typePrestation') || "Prestation (Ocre)") :
                     type === 'repetition' ? (t('widgetAgenda.typeRepetition') || "Répétition (Vert)") :
                     type === 'stage' ? (t('widgetAgenda.typeStage') || "Stage (Bleu)") :
                     type === 'atelier' ? (t('widgetAgenda.typeAtelier') || "Atelier (Jaune)") :
                     type === 'reunion' ? (t('widgetAgenda.typeReunion') || "Réunion (Kraft)") :
                     type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

             {/* Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Date et heure de début
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={saving}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Date Fin Picker (optionnel) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Date et heure de fin (optionnel)
              </label>
              <input
                type="datetime-local"
                name="dateFin"
                value={formData.dateFin}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Date limite d'inscription (optionnel) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('eventDetails.dateLimiteInscriptionLabel') || "Date limite d'inscription (optionnel)"}
              </label>
              <input
                type="datetime-local"
                name="dateLimiteInscription"
                value={formData.dateLimiteInscription || ''}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Lieu (Adresse) */}
            {activeConfig.agendaEnableAdresse && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lieu
                </label>
                <React.Suspense fallback={
                  <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                    ⏳ Chargement du champ adresse...
                  </div>
                }>
                  <AddressAutocomplete
                    name="lieu"
                    value={formData.lieu}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    placeholder="Ex : Local de l'asso, Place de la Mairie..."
                    className="theme-input w-full disabled:opacity-50"
                  />
                </React.Suspense>
                {!adresseLocal && (
                  <span className="text-[9px] text-orange-600 font-bold leading-none mt-1 select-none">
                    ⚠️ Adresse du local non configurée dans les paramètres de l'association (calcul de distance inactif).
                  </span>
                )}
              </div>
            )}

            {/* Distance A/R (Covoiturage) */}
            {activeConfig.agendaEnableCarpool && (formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'atelier') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.distanceLabel') || "Distance Aller-Retour en Km (Covoiturage)"}
                </label>
                <input
                  type="number"
                  name="distanceAllerRetourKm"
                  min="0"
                  value={formData.distanceAllerRetourKm}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Ex : 120"
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>
            )}

            {/* Prestation specific fields */}
            {formData.type === 'prestation' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('widgetAgenda.passagesLabel') || "Horaires des passages (Optionnel)"}
                  </label>
                  <input
                    type="text"
                    name="horairesPassages"
                    value={formData.horairesPassages}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Ex : 1er set 14h, 2ème set 16h"
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>

                {activeConfig.agendaEnableCarpool && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('widgetAgenda.carpoolingLabel') || "Horaire Covoiturage (Optionnel)"}
                    </label>
                    <input
                      type="time"
                      name="horaireCovoiturage"
                      value={formData.horaireCovoiturage}
                      onChange={handleChange}
                      disabled={saving}
                      className="theme-input w-full disabled:opacity-50"
                    />
                  </div>
                )}
              </>
            )}

            {/* Stage & Atelier specific fields */}
            {activeConfig.agendaEnableCarpool && (formData.type === 'stage' || formData.type === 'atelier') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.carpoolingLabel') || "Horaire Covoiturage (Optionnel)"}
                </label>
                <input
                  type="time"
                  name="horaireCovoiturage"
                  value={formData.horaireCovoiturage}
                  onChange={handleChange}
                  disabled={saving}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>
            )}

            {/* Musique (Niveau requis) for Prestation, Stage, Répétition, and Atelier */}
            {(formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'repetition' || formData.type === 'atelier') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.reqLevelLabel') || "Niveau requis (Musique)"}
                </label>
                <select
                  name="niveauRequis"
                  value={formData.niveauRequis}
                  onChange={handleChange}
                  disabled={saving}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="aucun">{t('widgetAgenda.levelNone') || "Pas de musicien"}</option>
                  <option value="debutant">{t('widgetAgenda.levelDeb') || "Niveau débutant"}</option>
                  <option value="confirme">{t('widgetAgenda.levelConfirm') || "Niveau confirmé"}</option>
                  <option value="tous">{t('widgetAgenda.levelAll') || "Tout le monde"}</option>
                </select>
              </div>
            )}

            {/* Dance Level Selector for Prestation, Stage, Répétition, and Atelier */}
            {(formData.type === 'prestation' || formData.type === 'stage' || formData.type === 'repetition' || formData.type === 'atelier') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.danceLevelLabel') || "Danse (Niveau requis)"}
                </label>
                <select
                  name="niveauDanseRequis"
                  value={formData.niveauDanseRequis}
                  onChange={handleChange}
                  disabled={saving}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="aucun">{t('widgetAgenda.danceLevelNone') || "Pas de danse"}</option>
                  <option value="debutant">{t('widgetAgenda.danceLevelDeb') || "Niveau débutant"}</option>
                  <option value="confirme">{t('widgetAgenda.danceLevelConfirm') || "Niveau confirmé"}</option>
                  <option value="tous">{t('widgetAgenda.danceLevelAll') || "Tout le monde"}</option>
                </select>
              </div>
            )}

            {/* Tenue requise */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Tenue requise / Dress Code (Optionnel)
              </label>
              <select
                name="tenueRequise"
                value={formData.tenueRequise || ''}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
              >
                <option value="">-- Aucune tenue spécifiée --</option>
                {dressCodes.map(dc => (
                  <option key={dc.id} value={dc.name}>{dc.name} ({dc.included})</option>
                ))}
              </select>
            </div>

            {/* Ordre du jour */}
            {activeConfig.agendaEnableOrdreDuJour && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lien du document d'ordre du jour
                </label>
                <input
                  type="url"
                  name="lienDocument"
                  value={formData.lienDocument}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Ex : https://docs.google.com/..."
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>
            )}

            {/* Lien réseau social / Événement externe (Optionnel) */}
            {activeConfig.agendaEnableUrl && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.lienSocialLabel') || "Lien réseau social / Événement externe (URL)"}
                </label>
                <input
                  type="url"
                  name="lienSocial"
                  value={formData.lienSocial || ''}
                  onChange={handleChange}
                  disabled={saving || uploadingImage}
                  placeholder="https://..."
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>
            )}

            {/* Affiche de l'événement / Image (Optionnel) */}
            {activeConfig.agendaEnableImage && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.imageUrlLabel') || "Image de l'événement / Affiche"}
                </label>
                
                {/* Mode Selector */}
                <div className="flex gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => setImageMode('upload')}
                    className={`text-[9px] uppercase font-black px-2.5 py-1 rounded border transition-all ${
                      imageMode === 'upload'
                        ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                        : 'bg-white/40 border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-white/60'
                    }`}
                  >
                    📸 Upload classique
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode('url')}
                    className={`text-[9px] uppercase font-black px-2.5 py-1 rounded border transition-all ${
                      imageMode === 'url'
                        ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                        : 'bg-white/40 border-dashed border-cordel-master-dark/20 text-cordel-master-dark/70 hover:bg-white/60'
                    }`}
                  >
                    🔗 Lien URL externe
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {formData.imageUrl && (
                    <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-[1px_1px_0px_0px_rgba(26,26,26,0.15)]">
                      <img src={formData.imageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {imageMode === 'upload' ? (
                    <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-2 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 select-none">
                      {uploadingImage ? (
                        <>⏳ {t('widgetAgenda.uploadingImage') || "Téléversement..."}</>
                      ) : (
                        <>📸 Choisir un fichier</>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={saving || uploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                      disabled={saving}
                      placeholder="Collez l'URL de l'image (ex: https://site.com/affiche.jpg)"
                      className="theme-input text-xs py-1.5 px-2 flex-1"
                    />
                  )}

                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="text-[10px] font-bold text-red-700 hover:underline select-none"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Finances (Optionnel) */}
            {activeConfig.agendaEnableFinance && (
              <div className="flex flex-col gap-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
                <h5 className="text-[10px] uppercase font-black tracking-widest text-cordel-wood">
                  Finances (Optionnel)
                </h5>
                <EventBudgetEditor
                  budgetRecettes={formData.budgetRecettes}
                  onChangeRecettes={(items) => setFormData(prev => ({ ...prev, budgetRecettes: items }))}
                  budgetDepenses={formData.budgetDepenses}
                  onChangeDepenses={(items) => setFormData(prev => ({ ...prev, budgetDepenses: items }))}
                  disabled={saving}
                />
              </div>
            )}

            {/* Validation Toggle */}
            {activeConfig.agendaEnableInscriptions && (
              <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="requiresValidation"
                    checked={formData.requiresValidation || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresValidation: e.target.checked }))}
                    disabled={saving}
                    className="accent-cordel-wood scale-105"
                  />
                  <span>Inscriptions soumises à validation par l'administrateur</span>
                </label>
              </div>
            )}

            {/* Créneaux de Bénévolat / Logistique */}
            {activeConfig.agendaEnableVolunteerShifts && (
              <div className="flex flex-col gap-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
                <h5 className="text-[10px] uppercase font-black tracking-widest text-cordel-wood flex justify-between items-center">
                  <span>🤝 Créneaux de Bénévolat / Logistique ({formData.volunteerShifts?.length || 0})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newShifts = [...(formData.volunteerShifts || [])];
                      newShifts.push({
                        id: Math.random().toString(36).substr(2, 9),
                        nomTache: '',
                        horaires: '',
                        inscrits: []
                      });
                      setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                    }}
                    className="text-[9px] font-black uppercase bg-cordel-vert text-encre-noire border border-encre-noire px-2 py-1 rounded cursor-pointer hover:brightness-95 shadow-[1px_1px_0px_0px_#181716]"
                  >
                    ➕ Ajouter un créneau
                  </button>
                </h5>

                <div className="flex flex-col gap-3">
                  {(!formData.volunteerShifts || formData.volunteerShifts.length === 0) ? (
                    <span className="text-[10px] italic opacity-60 text-center py-2">Aucun créneau configuré pour le moment.</span>
                  ) : (
                    formData.volunteerShifts.map((shift, idx) => (
                      <div key={shift.id || idx} className="flex flex-col sm:flex-row gap-2.5 p-3.5 bg-cordel-bg-light/20 border border-dashed border-encre-noire/10 rounded items-end">
                        <div className="flex-1 flex flex-col gap-1 w-full">
                          <label className="text-[9px] uppercase font-bold tracking-wider opacity-85">Nom de la tâche</label>
                          <input
                            type="text"
                            value={shift.nomTache}
                            placeholder="Ex : Montage du Stand"
                            onChange={(e) => {
                              const newShifts = [...formData.volunteerShifts];
                              newShifts[idx].nomTache = e.target.value;
                              setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                            }}
                            className="theme-input py-1 px-2 text-xs w-full"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-1 w-full">
                          <label className="text-[9px] uppercase font-bold tracking-wider opacity-85">Horaires</label>
                          <input
                            type="text"
                            value={shift.horaires}
                            placeholder="Ex : 14:00 - 16:00"
                            onChange={(e) => {
                              const newShifts = [...formData.volunteerShifts];
                              newShifts[idx].horaires = e.target.value;
                              setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                            }}
                            className="theme-input py-1 px-2 text-xs w-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newShifts = formData.volunteerShifts.filter((_, sIdx) => sIdx !== idx);
                            setFormData(prev => ({ ...prev, volunteerShifts: newShifts }));
                          }}
                          className="text-[9px] font-black uppercase bg-cordel-rouge text-white border border-encre-noire px-2.5 py-2.5 rounded cursor-pointer hover:bg-red-800 shadow-[1px_1px_0px_0px_#181716] shrink-0"
                          title="Supprimer ce créneau"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-2">
              <CordelButton 
                type="button"
                variant="default" 
                onClick={handleCloseForm} 
                disabled={saving}
                className="text-xs px-4 py-2"
              >
                Annuler
              </CordelButton>
              <CordelButton 
                type="submit"
                variant="ocre" 
                useExtremeBorder={true}
                disabled={saving}
                className="text-xs px-4 py-2"
              >
                {saving ? "Envoi..." : "Valider"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Events List (Visible when not loading and not adding) */}
      {!loading && !isAdding && (
        visibleEvents.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 text-center">
            <p className="text-xs opacity-75 font-semibold">{t('widgetAgenda.noEvents')}</p>
          </CordelCard>
        ) : viewMode === 'grid' ? (
          <CalendarGrid 
            events={events} 
            onSelectEvent={handleSelectEvent} 
            t={t} 
          />
        ) : viewMode === 'list' ? (
          <div className="w-full overflow-x-auto border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-cordel-bg-light">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-encre-noire bg-cordel-master-light/10 font-black uppercase text-[9px] tracking-wider text-cordel-wood select-none">
                  <th className="p-2.5 border-r border-encre-noire/15">Date</th>
                  <th className="p-2.5 border-r border-encre-noire/15">Événement</th>
                  <th className="p-2.5 border-r border-encre-noire/15">Type</th>
                  <th className="p-2.5 border-r border-encre-noire/15">Lieu</th>
                  <th className="p-2.5 text-center">Présence</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((event) => {
                  const dateObj = new Date(event.date);
                  const formattedDate = isNaN(dateObj.getTime())
                    ? '?'
                    : formatDateWithDay(event.date, true);
                  
                  const variant = variants[event.type] || 'kraft';
                  const insList = event.inscriptions || [];
                  const userInscription = insList.find(ins => ins.userId === user.uid);
                  const userStatus = userInscription ? userInscription.status : null;
                  
                  // Inscriptions stats
                  const presentCount = insList.filter(i => i.status === 'present').length + (event.invitesExternes || []).length;

                  return (
                    <tr 
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className={`border-b border-encre-noire/15 hover:bg-cordel-master-light/5 transition-colors cursor-pointer ${event.status === 'annule' ? 'opacity-50' : ''}`}
                    >
                      <td className="p-2.5 border-r border-encre-noire/15 font-bold whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="p-2.5 border-r border-encre-noire/15 font-extrabold text-encre-noire">
                        {event.titre}
                        {event.status === 'annule' && (
                          <span className="text-red-600 font-bold ml-1.5 uppercase text-[8px] border border-red-600 px-1 rounded select-none">
                            ANNULÉ
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 border-r border-encre-noire/15">
                        <span className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[8px] theme-bg-${variant}`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-encre-noire/15 truncate max-w-[180px]" title={event.lieu}>
                        {event.lieu || '-'}
                      </td>
                      <td className="p-2.5 text-center font-bold whitespace-nowrap">
                        {(() => {
                          if (userStatus === 'present') return <span className="text-green-700 dark:text-green-400 font-black">Présent ({presentCount})</span>;
                          if (userStatus === 'absent') return <span className="text-red-700 dark:text-red-400 font-black">Absent ({presentCount})</span>;
                          if (userStatus === 'pending') return <span className="text-yellow-600 dark:text-yellow-400 font-black">En attente ({presentCount})</span>;
                          return <span className="text-neutral-500 font-bold">Sans réponse ({presentCount})</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleEvents.map((event) => {
                const dateObj = new Date(event.date);
                const day = isNaN(dateObj.getTime()) ? '?' : dateObj.getDate();
                const month = isNaN(dateObj.getTime()) 
                  ? '???' 
                  : dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
                const time = isNaN(dateObj.getTime())
                  ? '--h--'
                  : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                const variant = variants[event.type] || 'kraft';

                return (
                  <div 
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={`
                      relative overflow-hidden
                      border-2 border-encre-noire
                      theme-bg-${variant}
                      shadow-[4px_4px_0px_0px_#181716]
                      rounded-[8px_12px_9px_11px]
                      flex items-stretch
                      min-h-[90px]
                      cursor-pointer hover:scale-[1.01] active:scale-95 transition-all
                    `}
                  >
                    {/* Effet tampon gros "ANNULÉ" en biais */}
                    {event.status === 'annule' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                        <span 
                          style={{ transform: 'rotate(-15deg)' }}
                          className="text-red-600 dark:text-red-500 border-[3.5px] border-red-600 dark:border-red-500 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5"
                        >
                          ANNULÉ
                        </span>
                      </div>
                    )}

                    {/* Left Side: Date Block */}
                    <div className="w-20 shrink-0 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-encre-noire/30 px-2 select-none">
                      <span className="text-2xl font-black tracking-tighter leading-none">{day}</span>
                      <span className="text-[10px] font-bold tracking-widest mt-0.5">{month}</span>
                      <span className="text-[9px] font-semibold opacity-75 mt-1">{time}</span>
                    </div>

                    {/* Right Side: Details */}
                    <div className="flex-1 p-4 flex items-center gap-4 text-left pl-5">
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-2 mb-0.5">
                          <h4 className="font-bold text-sm leading-tight">{event.titre}</h4>
                        </div>
                        <span className="text-[9px] font-extrabold text-encre-noire/70 mb-1 leading-none select-none">
                          {event.dateFin ? (
                            `Du ${formatDateWithDay(event.date, true)} au ${formatDateWithDay(event.dateFin, false)}`
                          ) : (
                            `${formatDateWithDay(event.date, true)}`
                          )}
                        </span>
                        <div className="flex justify-between items-center mt-1.5 border-t border-dashed border-encre-noire/10 pt-1.5 gap-2">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
                              {event.type}
                            </span>
                            {/* Connected User Attendance Badge */}
                            {(() => {
                              const userInscription = (event.inscriptions || []).find(ins => ins.userId === user.uid);
                              const userStatus = userInscription ? userInscription.status : null;
                              if (userStatus === 'present') {
                                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-present leading-none select-none">{t('common.present')}</span>;
                              } else if (userStatus === 'pending') {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider bg-yellow-100 text-yellow-800 border border-yellow-300 leading-none select-none">En attente de validation</span>;
                              } else if (userStatus === 'refused') {
                                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-absent leading-none select-none">Refusé</span>;
                              } else if (userStatus === 'absent') {
                                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-absent leading-none select-none">{t('common.absent')}</span>;
                              } else if (userStatus === 'confirm') {
                                return <span className="text-[8px] font-black px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-confirm leading-none select-none">{t('common.toConfirm')}</span>;
                              } else {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider badge-status-pending leading-none select-none">{t('common.pending')}</span>;
                              }
                            })()}
                          </div>
                          
                          {/* Subscriptions counter */}
                          {((event.inscriptions && event.inscriptions.length > 0) || (event.invitesExternes && event.invitesExternes.length > 0)) && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-encre-noire text-cordel-bg-light rounded-sm self-end shrink-0">
                              {((event.inscriptions || []).filter(i => i.status === 'present').length) + ((event.invitesExternes || []).length)} {t('common.presentCountLabel')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thumbnail (Miniature) */}
                      <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded border border-encre-noire/30 bg-[#fdfaf2] dark:bg-[#1f1b18] overflow-hidden flex items-center justify-center select-none shadow-[1px_1px_0px_0px_#181716]">
                        {event.imageUrl ? (
                          <img 
                            src={event.imageUrl} 
                            alt="Visual" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-lg opacity-40 grayscale select-none">
                            {event.type === 'prestation' ? '🎭' :
                             event.type === 'repetition' ? '🥁' :
                             event.type === 'stage' ? '🎓' :
                             event.type === 'atelier' ? '🔨' :
                             event.type === 'reunion' ? '📅' : '📆'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Circular Cut-out notches (blends dynamically with theme background using var(--cordel-bg)) */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-r-2 border-encre-noire"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-l-2 border-encre-noire"></div>
                  </div>
                );
              })}
            </div>
            
            {upcomingEvents.length > limit && (
              <div className="flex justify-center mt-3">
                <CordelButton 
                  variant="default"
                  onClick={() => setShowAll(!showAll)}
                  className="text-[10px] px-3 py-1.5 uppercase tracking-widest font-black"
                >
                  {showAll ? t('widgetAgenda.seeLessEvents') : t('widgetAgenda.seeAllEvents')}
                </CordelButton>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
