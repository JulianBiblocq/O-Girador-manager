import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventStageLayoutSection from '../event-details/EventStageLayoutSection';
import { isPastEvent } from '../../utils/dateUtils';
import { formatLocationShort } from '../../utils/locationUtils';

/**
 * Formate une date avec le jour de la semaine abrégé en majuscules.
 */
const formatDateWithDay = (dateStr, locale, includeYear = true) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekday = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'fr-FR', { weekday: 'short' })
    .format(date)
    .toUpperCase()
    .replace('.', '');

  const options = includeYear
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' };

  const dateParts = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'fr-FR', options).format(date);
  return `${weekday} ${dateParts}`;
};

/**
 * Composant unifié Plan de Scène & Cortejo (Mestria).
 * Intègre la vue tableau des dates alignées avec filtrage intelligent (Prestations par défaut)
 * et l'éditeur graphique de disposition scénique en flux continu.
 */
export default function MestreStageLayout({
  groupId,
  user,
  profileData,
  selectedEventId,
  onSelectEventId,
  onOpenDetails
}) {
  const { t, locale } = useTranslation();
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres d'affichage du tableau
  const [timeFilter, setTimeFilter] = useState('upcoming'); // 'upcoming' (défaut), 'past', 'all'
  const [stageFilter, setStageFilter] = useState('prestation'); // 'prestation' (défaut), 'with_stage', 'all'

  // Récupération en temps réel de tous les événements musicaux du groupe
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);

    const q = query(collection(db, 'events'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Restreindre aux types musicaux et scéniques
          if (['prestation', 'repetition', 'atelier', 'stage'].includes(data.type)) {
            fetched.push({ id: docSnap.id, ...data });
          }
        });
        setEvents(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("MestreStageLayout - Erreur écoute événements :", error);
        setLoading(false);
      }
    );

    // Lieux importants pour affichage court
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLieuxImportants(Array.isArray(data.lieuxImportants) ? data.lieuxImportants : []);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAssoc();
    };
  }, [groupId]);

  // Synchronisation en direct de l'événement actif sélectionné
  useEffect(() => {
    if (!selectedEventId) {
      setActiveEvent(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'events', selectedEventId), (docSnap) => {
      if (docSnap.exists()) {
        setActiveEvent({ id: docSnap.id, ...docSnap.data() });
      } else {
        setActiveEvent(null);
      }
    });
    return () => unsubscribe();
  }, [selectedEventId]);

  // Récupération de tous les membres pour la résolution des avatars et noms du plan de scène
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Vérification si un événement a déjà un plan de scène configuré
  const hasStageLayout = (evt) => {
    const placements = evt?.stageLayout?.placements;
    return Boolean(evt?.isStageLayoutPublished || (placements && Object.keys(placements).length > 0));
  };

  // Compteurs dynamiques selon le filtre temporel actif
  const counts = useMemo(() => {
    const timeFiltered = events.filter((evt) => {
      const isPast = isPastEvent(evt);
      if (timeFilter === 'upcoming') return !isPast;
      if (timeFilter === 'past') return isPast;
      return true;
    });

    let presta = 0;
    let withStage = 0;

    timeFiltered.forEach((evt) => {
      const hasLayout = hasStageLayout(evt);
      if (evt.type === 'prestation' || hasLayout) presta++;
      if (hasLayout) withStage++;
    });

    return {
      prestation: presta,
      withStage: withStage,
      all: timeFiltered.length
    };
  }, [events, timeFilter]);

  // Filtrage et tri des événements pour le tableau
  const displayEvents = useMemo(() => {
    const filtered = events.filter((evt) => {
      // 1. Filtre temporel
      const isPast = isPastEvent(evt);
      if (timeFilter === 'upcoming' && isPast) return false;
      if (timeFilter === 'past' && !isPast) return false;

      // 2. Filtre de scénographie / type
      const hasLayout = hasStageLayout(evt);
      if (stageFilter === 'prestation') {
        // Affiche les prestations ainsi que tout événement ayant déjà un plan de scène commencé
        return evt.type === 'prestation' || hasLayout;
      }
      if (stageFilter === 'with_stage') {
        return hasLayout;
      }
      return true;
    });

    // Tri chronologique
    return filtered.sort((a, b) => {
      if (timeFilter === 'past') {
        return new Date(b.dateFin || b.date) - new Date(a.dateFin || a.date);
      }
      return new Date(a.date) - new Date(b.date);
    });
  }, [events, timeFilter, stageFilter]);

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'prestation':
        return 'theme-bg-ocre text-encre-noire border-amber-900/30';
      case 'repetition':
        return 'theme-bg-vert text-encre-noire border-green-900/30';
      case 'atelier':
      case 'stage':
        return 'theme-bg-jaune text-encre-noire border-yellow-700/30';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const getTranslatedType = (type) => {
    switch (type) {
      case 'prestation':
        return t('widgetAgenda.typePrestation') || 'Prestation';
      case 'repetition':
        return t('widgetAgenda.typeRepetition') || 'Répétition';
      case 'atelier':
        return t('widgetAgenda.typeAtelier') || 'Atelier';
      case 'stage':
        return 'Stage';
      default:
        return type;
    }
  };

  // Rendu du badge de statut du plan de scène
  const renderStageStatusBadge = (evt) => {
    if (evt.isStageLayoutPublished) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px_6px_3px_5px] text-[9.5px] font-black uppercase bg-green-100 text-green-900 border border-green-300">
          <span>🟢</span>
          <span>Publié</span>
        </span>
      );
    }
    const placements = evt?.stageLayout?.placements;
    if (placements && Object.keys(placements).length > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px_6px_3px_5px] text-[9.5px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
          <span>🟡</span>
          <span>Brouillon</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px_6px_3px_5px] text-[9.5px] font-bold uppercase text-stone-500 bg-stone-100 border border-stone-200">
        <span>⚪</span>
        <span>À créer</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-5 text-left select-none w-full max-w-5xl mx-auto">
      {/* VUE 1 : ÉDITEUR GRAPHIQUE DU PLAN DE SCÈNE ACTIF */}
      {activeEvent ? (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Barre d'action supérieure en mode éditeur */}
          <div className="p-3 bg-white border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <CordelButton
                type="button"
                variant="default"
                useExtremeBorder={false}
                onClick={() => onSelectEventId('')}
                className="py-1 px-3 text-xs font-black uppercase tracking-wider bg-stone-100 hover:bg-stone-200 border border-encre-noire/30 shrink-0"
              >
                ← Liste des événements
              </CordelButton>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-extrabold text-encre-noire uppercase tracking-wide">
                    🎭 {activeEvent.titre}
                  </h3>
                  <span className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9px] ${getTypeBadgeClass(activeEvent.type)}`}>
                    {getTranslatedType(activeEvent.type)}
                  </span>
                  {renderStageStatusBadge(activeEvent)}
                </div>
                <span className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
                  📅 {formatDateWithDay(activeEvent.date, locale, true)} {activeEvent.lieu ? `• 📍 ${formatLocationShort(activeEvent, lieuxImportants)}` : ''}
                </span>
              </div>
            </div>

            {/* Sélecteur rapide d'événement en haut à droite */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <label htmlFor="stage-quick-select" className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark/70 whitespace-nowrap">
                Changer :
              </label>
              <select
                id="stage-quick-select"
                value={selectedEventId || ''}
                onChange={(e) => onSelectEventId(e.target.value)}
                className="theme-input text-[10px] font-bold py-1 px-2.5 bg-cordel-bg-light border border-encre-noire/30 rounded w-full md:w-auto cursor-pointer"
              >
                {displayEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    [{getTranslatedType(evt.type)}] {evt.titre} ({evt.date})
                  </option>
                ))}
              </select>

              {onOpenDetails && (
                <CordelButton
                  type="button"
                  variant="default"
                  useExtremeBorder={false}
                  onClick={() => onOpenDetails(activeEvent)}
                  className="py-1 px-2 text-[10px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-neutral-100 shrink-0"
                  title="Ouvrir les détails complets de cet événement"
                >
                  🔍 Détails
                </CordelButton>
              )}
            </div>
          </div>

          {/* Section éditeur de scène */}
          <div data-tour="mestre-stage-grid" className="w-full">
            <EventStageLayoutSection
              event={activeEvent}
              user={user}
              profileData={profileData}
              allUsers={allUsers}
              isAuthorized={true}
              t={t}
            />
          </div>
        </div>
      ) : (
        /* VUE 2 : TABLEAU DES DATES AVEC FILTRAGE DES PRESTATIONS & PLANS DE SCÈNE */
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* En-tête de la section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
            <div>
              <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
                <span>🎭</span>
                <span>Direction Artistique — Plans de Scène &amp; Cortejo</span>
              </h2>
              <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
                Sélectionnez une prestation pour concevoir ou modifier la disposition scénique de la troupe
              </p>
            </div>

            {/* Filtre temporel */}
            <div className="flex items-center gap-1 shrink-0 select-none">
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

          {/* Barre de filtrage par type / plan de scène */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setStageFilter('prestation')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
                stageFilter === 'prestation'
                  ? 'bg-amber-600 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
              }`}
            >
              🎭 Prestations &amp; Sorties ({counts.prestation})
            </button>

            <button
              type="button"
              onClick={() => setStageFilter('with_stage')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
                stageFilter === 'with_stage'
                  ? 'bg-green-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
              }`}
            >
              📐 Avec plan de scène ({counts.withStage})
            </button>

            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
                stageFilter === 'all'
                  ? 'bg-stone-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
              }`}
            >
              👥 Tous les événements ({counts.all})
            </button>
          </div>

          {/* Tableau des dates alignées */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
                ⏳ Chargement des dates...
              </span>
            </div>
          ) : displayEvents.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={true} className="p-10 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">🎭</span>
              <p className="text-xs font-bold opacity-75">
                {stageFilter === 'prestation'
                  ? "Aucune prestation trouvée. Basculez sur « Tous les événements » pour configurer le plan de scène d'une répétition ou d'un stage."
                  : "Aucun événement ne correspond à ce filtre."}
              </p>
              {stageFilter !== 'all' && (
                <CordelButton
                  type="button"
                  variant="ocre"
                  onClick={() => setStageFilter('all')}
                  className="py-1 px-3 text-xs font-black uppercase tracking-wider mt-1"
                >
                  Afficher tous les événements
                </CordelButton>
              )}
            </CordelCard>
          ) : (
            <div className="w-full max-w-full overflow-x-auto border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-cordel-bg-light">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-encre-noire bg-cordel-master-light/50 font-black uppercase text-[10px] tracking-wider text-cordel-wood select-none">
                    <th className="p-2 md:p-3 border-r border-encre-noire/15">{t('mestre.eventDate') || "Date"}</th>
                    <th className="p-2 md:p-3 border-r border-encre-noire/15">{t('mestre.eventTitle') || "Événement"}</th>
                    <th className="p-2 md:p-3 border-r border-encre-noire/15">{t('mestre.eventType') || "Type"}</th>
                    <th className="p-2 md:p-3 border-r border-encre-noire/15">{t('mestre.eventLocation') || "Lieu"}</th>
                    <th className="p-2 md:p-3 border-r border-encre-noire/15 text-center">{t('mestre.eventInscriptions') || "Inscriptions"}</th>
                    <th className="p-2 md:p-3 border-r border-encre-noire/15 text-center">Plan de scène</th>
                    <th className="p-2 md:p-3 text-center">{t('common.actions') || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayEvents.map((evt) => {
                    const insList = evt.inscriptions || [];
                    const presentCount = insList.filter((ins) => ins.status === 'present').length + (evt.invitesExternes || []).length;
                    const totalRegistered = insList.filter((ins) => ins.status !== 'absent').length;

                    return (
                      <tr
                        key={evt.id}
                        className="border-b border-encre-noire/15 hover:bg-cordel-master-light/10 transition-colors"
                      >
                        <td className="p-2 md:p-3 border-r border-encre-noire/15 font-bold whitespace-nowrap">
                          {formatDateWithDay(evt.date, locale, true)}
                        </td>
                        <td className="p-2 md:p-3 border-r border-encre-noire/15 font-extrabold text-encre-noire">
                          {evt.titre}
                        </td>
                        <td className="p-2 md:p-3 border-r border-encre-noire/15">
                          <span className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9px] ${getTypeBadgeClass(evt.type)}`}>
                            {getTranslatedType(evt.type)}
                          </span>
                        </td>
                        <td className="p-2 md:p-3 border-r border-encre-noire/15 truncate max-w-[150px]" title={evt.lieu}>
                          {evt.lieu ? (
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <span>📍</span>
                              <span>{formatLocationShort(evt, lieuxImportants)}</span>
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2 md:p-3 border-r border-encre-noire/15 text-center font-bold">
                          <span className="text-green-700 dark:text-green-400">{presentCount}</span>
                          <span className="opacity-40 font-normal mx-0.5">/</span>
                          <span className="opacity-70">{totalRegistered}</span>
                        </td>
                        <td className="p-2 md:p-3 border-r border-encre-noire/15 text-center">
                          {renderStageStatusBadge(evt)}
                        </td>
                        <td className="p-2 md:p-3 text-center flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <CordelButton
                            type="button"
                            variant="ocre"
                            useExtremeBorder={false}
                            className="py-1 px-3 text-[9.5px] uppercase tracking-wider font-black"
                            onClick={() => onSelectEventId(evt.id)}
                          >
                            🎭 {t('mestre.actionStageLayout') || "Plan de scène"}
                          </CordelButton>
                          {onOpenDetails && (
                            <CordelButton
                              type="button"
                              variant="default"
                              useExtremeBorder={false}
                              className="py-1 px-2.5 text-[9.5px] uppercase tracking-wider font-black bg-cordel-bg hover:bg-neutral-100"
                              onClick={() => onOpenDetails(evt)}
                            >
                              🔍 {t('mestre.actionDetails') || "Détails"}
                            </CordelButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
