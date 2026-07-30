import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventsDataGrid from './EventsDataGrid';
import { useTranslation } from '../LanguageContext';
import { isPastEvent } from '../../utils/dateUtils';

export default function StudioEventsManager({ groupId, onBack }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming'); // 'upcoming' (default), 'past', 'all'
  const [updatingEventId, setUpdatingEventId] = useState(null);
  const [updatingField, setUpdatingField] = useState(null);
  const [lastNotification, setLastNotification] = useState(null);
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [defaultLocationsByEventType, setDefaultLocationsByEventType] = useState({});

  // Real-time listener for events in the group
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });

        setEvents(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("StudioEventsManager - Erreur snapshot Firestore :", error);
        setLoading(false);
      }
    );

    // Chargement des lieux importants de l'association
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLieuxImportants(Array.isArray(data.lieuxImportants) ? data.lieuxImportants : []);
        setDefaultLocationsByEventType(data.defaultLocationsByEventType && typeof data.defaultLocationsByEventType === 'object' ? data.defaultLocationsByEventType : {});
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAssoc();
    };
  }, [groupId]);

  // Update single field in Firestore dynamically
  const handleUpdateField = async (eventId, fieldName, newValue) => {
    setUpdatingEventId(eventId);
    setUpdatingField(fieldName);

    try {
      const eventRef = doc(db, 'events', eventId);
      const updates = { [fieldName]: newValue };
      if (fieldName === 'lieuSimple' || fieldName === 'lieu') {
        updates.lieu = newValue;
        updates.lieuSimple = newValue;
      }
      await updateDoc(eventRef, updates);

      const targetEvent = events.find(e => e.id === eventId);
      setLastNotification({
        message: `Événement "${targetEvent?.titre || 'Événement'}" - ${fieldName} mis à jour.`,
        type: 'success'
      });
      setTimeout(() => setLastNotification(null), 3000);
    } catch (err) {
      console.error(`StudioEventsManager - Erreur mise à jour ${fieldName}:`, err);
      setLastNotification({
        message: "Erreur lors de la mise à jour dans la base de données.",
        type: 'error'
      });
      setTimeout(() => setLastNotification(null), 4000);
    } finally {
      setUpdatingEventId(null);
      setUpdatingField(null);
    }
  };

  // Quick field toggle in Firestore
  const handleToggleField = async (eventId, fieldName, currentValue) => {
    return handleUpdateField(eventId, fieldName, !currentValue);
  };

  // Filter events by search, type, and temporal state
  const filteredEvents = events.filter((ev) => {
    const titleMatch = (ev.titre || '').toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = (ev.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const lieuMatch = (ev.lieu || ev.lieuSimple || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || descMatch || lieuMatch;

    const matchesType = typeFilter === 'all' || ev.type === typeFilter;

    const isPast = isPastEvent(ev);
    let matchesTime = true;
    if (timeFilter === 'upcoming') matchesTime = !isPast;
    if (timeFilter === 'past') matchesTime = isPast;

    return matchesSearch && matchesType && matchesTime;
  });

  // Intelligent sorting:
  // - Upcoming events: chronological ascending (nearest event first)
  // - Past events: antichronological descending (most recent past event first)
  const sortedFilteredEvents = [...filteredEvents].sort((a, b) => {
    if (timeFilter === 'past') {
      return new Date(b.dateFin || b.date) - new Date(a.dateFin || a.date);
    }
    return new Date(a.date) - new Date(b.date);
  });

  // Extract unique event types for filtering
  const availableTypes = Array.from(new Set(events.map((e) => e.type).filter(Boolean)));

  // Counters
  const countTotal = events.length;
  const countPercussion = events.filter((e) => e.includesPercussion).length;
  const countDance = events.filter((e) => e.includesDance).length;
  const countValidation = events.filter((e) => e.requiresValidation).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-2 sm:px-4 py-4">
      {/* Header card */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs font-bold uppercase tracking-wider text-cordel-master-dark hover:underline select-none mr-2"
                >
                  ← {t('common.back') || 'Retour'}
                </button>
              )}
              <h2 className="panel-title text-xl font-black text-cordel-wood flex items-center gap-2">
                📅 Gestion des événements
              </h2>
            </div>
            <p className="text-xs text-cordel-master-dark/70 font-medium mt-1">
              Tableau de bord d'édition rapide et globale des événements pour l'administration.
            </p>
          </div>

          {/* Quick Statistics Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs select-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-bold">
              Total : {countTotal}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 font-bold">
              <img src="/icones/alfaia.svg" alt="Perc" className="w-3 h-3 object-contain dark:invert" />
              Perc: {countPercussion}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-pink-100 dark:bg-pink-950/60 text-pink-900 dark:text-pink-200 border border-pink-300 dark:border-pink-700/60 font-bold">
              💃 Danse: {countDance}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 font-bold">
              🔒 Validation: {countValidation}
            </span>
          </div>
        </div>

        {/* Live status notification toast */}
        {lastNotification && (
          <div
            className={`mt-4 p-2.5 rounded border text-xs font-bold transition-all ${
              lastNotification.type === 'error'
                ? 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/80 dark:text-red-200'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200'
            }`}
          >
            ⚡ {lastNotification.message}
          </div>
        )}

        {/* Filter bar */}
        <div className="mt-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-4 border-t border-dashed border-cordel-master-dark/15">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Rechercher par titre, lieu..."
                className="theme-input w-full text-xs py-1.5 px-3"
              />
            </div>

            {/* Selector: Afficher : [ À venir (Défaut) | Passés | Tous ] */}
            <div className="flex items-center gap-1 shrink-0 w-full sm:w-auto overflow-x-auto select-none">
              <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/60 shrink-0 mr-1">
                {t('agendaTemporal.filterLabel') || "Afficher :"}
              </span>
              <button
                type="button"
                onClick={() => setTimeFilter('upcoming')}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${
                  timeFilter === 'upcoming'
                    ? 'bg-cordel-wood text-white border border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                    : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10'
                }`}
              >
                {t('agendaTemporal.upcoming') || "À venir (Défaut)"}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('past')}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${
                  timeFilter === 'past'
                    ? 'bg-cordel-wood text-white border border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                    : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10'
                }`}
              >
                {t('agendaTemporal.past') || "Passés"}
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded transition-all cursor-pointer ${
                  timeFilter === 'all'
                    ? 'bg-cordel-wood text-white border border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                    : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10'
                }`}
              >
                {t('agendaTemporal.all') || "Tous"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/60 shrink-0">
              Type :
            </span>
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-cordel-wood text-white border border-encre-noire'
                  : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10'
              }`}
            >
              Tous ({events.length})
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded capitalize transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-cordel-wood text-white border border-encre-noire'
                    : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10'
                }`}
              >
                {type} ({events.filter((e) => e.type === type).length})
              </button>
            ))}
          </div>
        </div>
      </CordelCard>

      {/* Main Table view */}
      {loading ? (
        <CordelCard variant="default" className="py-12 text-center">
          <div className="text-sm font-bold text-cordel-wood animate-pulse flex items-center justify-center gap-2">
            ⏳ Chargement des événements en direct...
          </div>
        </CordelCard>
      ) : (
        <EventsDataGrid
          events={sortedFilteredEvents}
          onUpdateField={handleUpdateField}
          onToggleField={handleToggleField}
          updatingEventId={updatingEventId}
          updatingField={updatingField}
          lieuxImportants={lieuxImportants}
          defaultLocationsByEventType={defaultLocationsByEventType}
        />
      )}
    </div>
  );
}
