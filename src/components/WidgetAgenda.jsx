import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
const EventDetails = React.lazy(() => import('./EventDetails'));
import CalendarGrid from './CalendarGrid';
import EventCreateForm from './agenda/EventCreateForm';
import EmptyState from './EmptyState';
import AgendaFilterBar from './agenda/AgendaFilterBar';
import EventDisciplineBadges from './agenda/EventDisciplineBadges';
import { useTranslation } from './LanguageContext';
import { XiloCalendar, XiloEye, XiloEyeOff } from './XiloIcons';
import { calculateRoadDistance } from '../utils/googleMaps';
import { splitEventsByTime } from '../utils/dateUtils';
import { getSocialVideoThumbnail } from '../utils/videoUtils';

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
  setSelectedEvent: propSetSelectedEvent,
  isFullPage = false
}) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [localSelectedEvent, setLocalSelectedEvent] = useState(null);
  const selectedEvent = propSelectedEvent !== undefined ? propSelectedEvent : localSelectedEvent;
  const setSelectedEvent = propSetSelectedEvent !== undefined ? propSetSelectedEvent : setLocalSelectedEvent;
  const [showAll, setShowAll] = useState(isFullPage);
  const [showPastHistory, setShowPastHistory] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' ou 'list' ou 'grid'
  const [disciplineFilter, setDisciplineFilter] = useState('all'); // 'all' | 'percussion' | 'dance'
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [hiddenTypes, setHiddenTypes] = useState([]);
  
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [eventTypes, setEventTypes] = useState(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
  const [agendaEnableFinance, setAgendaEnableFinance] = useState(true);
  const [agendaEnableVolunteerShifts, setAgendaEnableVolunteerShifts] = useState(true);
  const [eventTypeConfigs, setEventTypeConfigs] = useState({});
  const [dressCodes, setDressCodes] = useState([]);

  // Synchronisation des paramètres de l'association pour l'adresse locale et le tarif kilométrique par défaut
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
    }, (err) => {
      console.error("WidgetAgenda - Erreur snapshot assocRef :", err);
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

  // Split and sort events into upcoming (chronological) and past (antichronological)
  const { upcomingEvents, pastEvents } = splitEventsByTime(events);

  const filterFn = (e) => {
    // Discipline filter (percussion vs dance)
    if (disciplineFilter === 'percussion' && !e.includesPercussion) return false;
    if (disciplineFilter === 'dance' && !e.includesDance) return false;

    // Type filter
    if (hiddenTypes.includes(e.type)) return false;
    if (selectedTypeFilter !== 'all' && selectedTypeFilter !== 'custom') {
      return e.type === selectedTypeFilter;
    }
    return true;
  };

  const filteredUpcoming = upcomingEvents.filter(filterFn);
  const filteredPast = pastEvents.filter(filterFn);  // Affichage par défaut : événements à venir uniquement. Si l'historique est activé, inclure les événements passés.
  const displayEvents = useMemo(() => {
    if (showPastHistory) {
      return events;
    }
    return events.filter(ev => {
      if (!ev.date) return false;
      const evDate = new Date(ev.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return evDate >= today;
    });
  }, [events, showPastHistory]);

  const activeFilteredEvents = showPastHistory
    ? [...filteredUpcoming, ...filteredPast]
    : filteredUpcoming;

  const visibleEvents = (isFullPage || showAll || showPastHistory)
    ? activeFilteredEvents
    : activeFilteredEvents.slice(0, limit);
  
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
    volunteerShifts: [],
    includesPercussion: false,
    includesDance: false,
    enableCarpool: true,
    enableInscriptions: true,
    description: '',
    latitude: null,
    longitude: null
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
      dateLimiteInscription: '',
      includesPercussion: false,
      includesDance: false,
      enableCarpool: true,
      description: ''
    });
    setIsAdding(true);
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
    if (!formData.titre) return;

    if (formData.isPoll) {
      const validDates = (formData.pollDates || []).filter(d => d && d.trim() !== '');
      if (validDates.length < 2) {
        alert("Veuillez renseigner au moins 2 dates différentes pour le sondage.");
        return;
      }
    } else if (!formData.date) {
      alert("Veuillez spécifier la date de l'événement.");
      return;
    }

    const activeType = formData.type || 'repetition';
    const rawConfig = eventTypeConfigs[activeType] || {};
    const activeConfig = {
      agendaRequireInstrument: rawConfig.agendaRequireInstrument || false,
      agendaEnableMaybeStatus: rawConfig.agendaEnableMaybeStatus !== false,
      agendaEnableStageLayout: rawConfig.agendaEnableStageLayout !== false,
      agendaEnableRevisionProgram: rawConfig.agendaEnableRevisionProgram !== false,
      agendaEnableCarpool: (rawConfig.agendaEnableCarpool !== false) && (formData.enableCarpool !== false),
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
      const createSingleDoc = async (dateVal, isPollMode = false, pollGroupId = null, optionIndex = 1, totalOptions = 1) => {
        await addDoc(collection(db, 'events'), {
          titre: formData.titre,
          type: formData.type,
          date: dateVal,
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
          status: isPollMode ? 'sondage' : 'confirme',
          ...(isPollMode ? {
            pollGroupId: pollGroupId,
            optionIndex: optionIndex,
            totalOptions: totalOptions,
            pollRestrictionType: formData.pollRestrictionType || 'aucun',
            pollTarget: formData.pollTarget || '',
            votes: {}
          } : {}),
          lienSocial: activeConfig.agendaEnableUrl ? formData.lienSocial || '' : '',
          imageUrl: activeConfig.agendaEnableImage ? formData.imageUrl || '' : '',
          requiresValidation: activeConfig.agendaEnableInscriptions ? (formData.requiresValidation || false) : false,
          montantRecette: activeConfig.agendaEnableFinance ? ((formData.budgetRecettes || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0)) : 0,
          montantDepense: activeConfig.agendaEnableFinance ? ((formData.budgetDepenses || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0)) : 0,
          budgetRecettes: activeConfig.agendaEnableFinance ? (formData.budgetRecettes || []) : [],
          budgetDepenses: activeConfig.agendaEnableFinance ? (formData.budgetDepenses || []) : [],
          dateLimiteInscription: activeConfig.agendaEnableInscriptions ? formData.dateLimiteInscription || '' : '',
          tenueRequise: formData.tenueRequise || '',
          volunteerShifts: formData.volunteerShifts || [],
          includesPercussion: formData.includesPercussion || false,
          includesDance: formData.includesDance || false,
          enableCarpool: formData.enableCarpool !== false,
          enableInscriptions: formData.enableInscriptions !== false,
          description: formData.description || '',
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null
        });
      };

      if (formData.isPoll) {
        const validDates = (formData.pollDates || []).filter(d => d && d.trim() !== '');
        const pollGroupId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        for (let i = 0; i < validDates.length; i++) {
          await createSingleDoc(validDates[i], true, pollGroupId, i + 1, validDates.length);
        }
      } else {
        await createSingleDoc(formData.date, false);
      }

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
      <div className="flex flex-wrap justify-between items-center pl-1 pr-1 w-full gap-2">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left flex items-center gap-1.5">
          <XiloCalendar size={16} /> {t('widgetAgenda.title')}
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          {!loading && !isAdding && (
            <div className="flex items-center border-2 border-encre-noire rounded-[6px_9px_5px_8px] overflow-hidden bg-cordel-bg shadow-[2px_2px_0px_0px_#181716] select-none text-xs font-extrabold uppercase">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 cursor-pointer transition-all flex items-center gap-1.5 ${
                  viewMode === 'cards' 
                    ? 'bg-cordel-wood text-white font-black' 
                    : 'bg-cordel-bg-light text-encre-noire hover:bg-amber-100/60'
                }`}
                title={t('widgetAgenda.viewCardsTooltip') || "Affichage en cartes"}
              >
                <span className="text-sm">🎴</span>
                <span>{t('widgetAgenda.viewCards') || "Cartes"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 cursor-pointer transition-all border-l-2 border-encre-noire flex items-center gap-1.5 ${
                  viewMode === 'list' 
                    ? 'bg-cordel-wood text-white font-black' 
                    : 'bg-cordel-bg-light text-encre-noire hover:bg-amber-100/60'
                }`}
                title={t('widgetAgenda.viewListTooltip') || "Affichage en liste"}
              >
                <span className="text-sm">📋</span>
                <span>{t('widgetAgenda.viewList') || "Liste"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 cursor-pointer transition-all border-l-2 border-encre-noire flex items-center gap-1.5 ${
                  viewMode === 'grid' 
                    ? 'bg-cordel-wood text-white font-black' 
                    : 'bg-cordel-bg-light text-encre-noire hover:bg-amber-100/60'
                }`}
                title={t('widgetAgenda.viewGridTooltip') || "Affichage en calendrier (Grille)"}
              >
                <span className="text-sm">📅</span>
                <span>{t('widgetAgenda.viewGrid') || "Grille"}</span>
              </button>
            </div>
          )}

          {!loading && isAuthorized && !isAdding && (
            <CordelButton 
              variant="default" 
              onClick={handleOpenForm} 
              className="text-xs px-3 py-1.5 uppercase tracking-widest font-black"
            >
              {t('widgetAgenda.addBtn') || "+ Ajouter"}
            </CordelButton>
          )}
        </div>
      </div>

      {/* Event Filters (Visible when not loading and not adding) */}
      {!loading && !isAdding && (
        <AgendaFilterBar
          disciplineFilter={disciplineFilter}
          setDisciplineFilter={setDisciplineFilter}
          selectedTypeFilter={selectedTypeFilter}
          setSelectedTypeFilter={setSelectedTypeFilter}
          hiddenTypes={hiddenTypes}
          setHiddenTypes={setHiddenTypes}
          eventTypes={eventTypes}
          t={t}
        />
      )}

      {/* Loading Skeleton Grid with strict min-height */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[420px] animate-pulse select-none my-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-cordel-master-dark/5 border-2 border-dashed border-cordel-master-dark/15 rounded-[8px_12px_9px_11px] p-4 h-[130px] flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cordel-master-dark/20 rounded-md shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-cordel-master-dark/20 rounded w-2/3" />
                  <div className="h-3 bg-cordel-master-dark/15 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-cordel-master-dark/15 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Create Event Form (Visible when isAdding is true) */}
      {!loading && isAdding && (
        <EventCreateForm
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleCloseForm={handleCloseForm}
          saving={saving}
          dressCodes={dressCodes}
          createConfig={activeConfig}
          rawCreateConfig={rawConfig}
          associationEventTypes={eventTypes}
          adresseLocal={adresseLocal}
          t={t}
        />
      )}

      {/* Events List (Visible when not loading and not adding) */}
      {!loading && !isAdding && (
        visibleEvents.length === 0 ? (
          <EmptyState
            icon="📅"
            title={t('widgetAgenda.noEvents') || "Aucun événement prévu pour le moment"}
            description="L'agenda est vide pour cette période. Organisez une répétition, une prestation, un stage ou une réunion en un clic !"
            actionLabel={isAuthorized ? "+ Créer mon premier événement" : null}
            onAction={isAuthorized ? () => setIsAdding(true) : null}
          />
        ) : viewMode === 'grid' ? (
          <CalendarGrid 
            events={events} 
            onSelectEvent={handleSelectEvent} 
            t={t} 
          />
        ) : viewMode === 'list' ? (
          <div className="w-full max-w-full overflow-x-auto border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-cordel-bg-light">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-encre-noire bg-cordel-master-light/10 font-black uppercase text-[9px] tracking-wider text-cordel-wood select-none">
                  <th className="p-1.5 md:p-2.5 border-r border-encre-noire/15">{t('common.date')}</th>
                  <th className="p-1.5 md:p-2.5 border-r border-encre-noire/15">{t('mestre.eventTitle')}</th>
                  <th className="p-1.5 md:p-2.5 border-r border-encre-noire/15">{t('common.type')}</th>
                  <th className="p-1.5 md:p-2.5 border-r border-encre-noire/15">{t('common.location')}</th>
                  <th className="p-1.5 md:p-2.5 text-center">{t('widgetAgenda.presence')}</th>
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
                      <td className="p-1.5 md:p-2.5 border-r border-encre-noire/15 font-bold whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="p-1.5 md:p-2.5 border-r border-encre-noire/15 font-extrabold text-encre-noire">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{event.titre}</span>
                          <EventDisciplineBadges event={event} compact={true} />
                        </div>
                        {event.status === 'annule' && (
                          <span className="text-red-600 font-bold ml-1.5 uppercase text-[8px] border border-red-600 px-1 rounded select-none">
                            ANNULÉ
                          </span>
                        )}
                        {event.status === 'a_confirmer' && (
                          <span className="text-orange-600 font-bold ml-1.5 uppercase text-[8px] border border-orange-600 px-1 rounded select-none">
                            À CONFIRMER
                          </span>
                        )}
                        {event.status === 'sondage' && (
                          <span className="text-amber-900 bg-amber-100 border border-amber-500 font-black ml-1.5 uppercase text-[8px] px-1.5 py-0.5 rounded select-none shadow-sm inline-flex items-center gap-1">
                            📊 SONDAGE (Opt. {event.optionIndex || 1}/{event.totalOptions || 1}) {event.pollTarget ? `• ${event.pollTarget}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 md:p-2.5 border-r border-encre-noire/15">
                        <span className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[8px] theme-bg-${variant}`}>
                          {event.type}
                        </span>
                      </td>
                      <td className="p-1.5 md:p-2.5 border-r border-encre-noire/15 truncate max-w-[180px]" title={event.lieu}>
                        {event.lieu || '-'}
                      </td>
                      <td className="p-1.5 md:p-2.5 text-center font-bold whitespace-nowrap">
                        {(() => {
                          if (event.enableInscriptions === false) return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">📢 Informatif</span>;
                          if (userStatus === 'present') return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-black badge-status-present">Présent ({presentCount})</span>;
                          if (userStatus === 'absent') return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-black badge-status-absent">Absent ({presentCount})</span>;
                          if (userStatus === 'confirm') return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-black badge-status-confirm">À confirmer ({presentCount})</span>;
                          if (userStatus === 'pending') return <span className="inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold badge-status-pending">En attente ({presentCount})</span>;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1 overflow-visible">
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
                      cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[2px_2px_0px_0px_#181716] transition-all
                    `}
                  >
                    {/* Effet tampon gros statut en biais */}
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
                    {event.status === 'a_confirmer' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
                        <span 
                          style={{ transform: 'rotate(-15deg)' }}
                          className="text-orange-600 dark:text-orange-400 border-[3.5px] border-orange-600 dark:border-orange-400 px-5 py-1.5 rounded-lg font-black text-[15px] tracking-widest uppercase opacity-80 bg-white/5 dark:bg-black/5"
                        >
                          À CONFIRMER
                        </span>
                      </div>
                    )}
                    {event.status === 'sondage' && (
                      <div className="absolute top-2 right-2 flex gap-1 select-none z-10">
                        <span className="text-amber-900 bg-amber-100/90 border border-amber-600 font-black uppercase text-[8px] px-2 py-0.5 rounded shadow-sm">
                          📊 SONDAGE ({event.optionIndex || 1}/{event.totalOptions || 1}) {event.pollTarget ? `• ${event.pollTarget}` : ''}
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
                                {event.type}
                              </span>
                              <EventDisciplineBadges event={event} />
                            </div>
                            {/* Connected User Attendance Badge */}
                            {(() => {
                              if (event.enableInscriptions === false) {
                                return <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px_6px_3px_5px] uppercase tracking-wider bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 leading-none select-none">📢 Informatif</span>;
                              }
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
                          {event.enableInscriptions !== false && ((event.inscriptions && event.inscriptions.length > 0) || (event.invitesExternes && event.invitesExternes.length > 0)) && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-encre-noire text-cordel-bg-light rounded-sm self-end shrink-0">
                              {((event.inscriptions || []).filter(i => i.status === 'present').length) + ((event.invitesExternes || []).length)} {t('common.presentCountLabel')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thumbnail (Miniature) avec support vidéo et badge Play filigrane */}
                      {(() => {
                        const videoUrl = event.socialVideoUrl || event.videoUrl;
                        const thumbnailCandidate = event.socialThumbnailUrl || (videoUrl ? getSocialVideoThumbnail(videoUrl) : null) || event.imageUrl;
                        const isVideo = Boolean(videoUrl || event.socialThumbnailUrl);

                        return (
                          <div 
                            className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded border border-encre-noire/30 bg-[#fdfaf2] dark:bg-[#1f1b18] overflow-hidden flex items-center justify-center select-none shadow-[1px_1px_0px_0px_#181716] relative group cursor-pointer"
                            onClick={(e) => {
                              if (videoUrl) {
                                e.stopPropagation();
                                window.open(videoUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            title={videoUrl ? `Regarder la vidéo (${videoUrl})` : t('common.visual')}
                          >
                            {thumbnailCandidate ? (
                              <img 
                                src={thumbnailCandidate} 
                                alt={t('common.visual')} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
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

                            {/* Icône Play (▶️) filigrane discrète superposée pour les événements avec vidéo */}
                            {isVideo && (
                              <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-all group-hover:bg-black/50">
                                <div className="w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center text-[10px] font-black shadow-md border border-white/70 transform group-hover:scale-110 transition-transform">
                                  ▶
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Ticket Circular Cut-out notches (blends dynamically with theme background using var(--cordel-bg)) */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-r-2 border-encre-noire"></div>
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--cordel-bg)] border-l-2 border-encre-noire"></div>
                  </div>
                );
              })}
            </div>
            
            {filteredUpcoming.length > limit && !showPastHistory && (
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

            {/* Discrete Past Events History Toggle Button */}
            {filteredPast.length > 0 && (
              <div className="flex justify-center mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20">
                <button
                  type="button"
                  onClick={() => setShowPastHistory(prev => !prev)}
                  className="text-[10px] font-black uppercase tracking-wider bg-cordel-bg-light text-cordel-wood border-2 border-encre-noire px-3.5 py-1.5 rounded-[6px_9px_5px_8px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-amber-100/60 cursor-pointer transition-all flex items-center gap-1.5 select-none"
                >
                  <span>
                    {showPastHistory
                      ? (t('agendaTemporal.hidePastHistory') || "📜 Cacher l'historique des événements passés")
                      : `${t('agendaTemporal.seePastHistory') || "📜 Voir l'historique des événements passés"} (${filteredPast.length})`
                    }
                  </span>
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
