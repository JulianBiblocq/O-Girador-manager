import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { isPastEvent } from '../../utils/dateUtils';
import { formatLocationShort } from '../../utils/locationUtils';

const formatDateWithDay = (dateStr, locale, includeYear = true) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const weekday = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'fr-FR', { weekday: 'short' }).format(date).toUpperCase().replace('.', '');
  
  const options = includeYear 
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' };
  
  const dateParts = new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'fr-FR', options).format(date);
  return `${weekday} ${dateParts}`;
};

export default function MestreEvents({ groupId, onSelectForStage, onOpenDetails }) {
  const { t, locale } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('upcoming'); // 'upcoming' (default), 'past', 'all'
  const [lieuxImportants, setLieuxImportants] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    const q = query(
      collection(db, 'events'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Restrict to Prestations, Répétitions, Ateliers
        if (['prestation', 'repetition', 'atelier'].includes(data.type)) {
          fetched.push({ id: docSnap.id, ...data });
        }
      });
      setEvents(fetched);
      setLoading(false);
    }, (error) => {
      console.error("MestreEvents - Erreur snapshot :", error);
      setLoading(false);
    });

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

  const filteredEvents = events.filter(evt => {
    const isPast = isPastEvent(evt);
    if (timeFilter === 'upcoming') return !isPast;
    if (timeFilter === 'past') return isPast;
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (timeFilter === 'past') {
      return new Date(b.dateFin || b.date) - new Date(a.dateFin || a.date);
    }
    return new Date(a.date) - new Date(b.date);
  });

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'prestation':
        return 'theme-bg-ocre text-encre-noire border-amber-900/30';
      case 'repetition':
        return 'theme-bg-vert text-encre-noire border-green-900/30';
      case 'atelier':
        return 'theme-bg-jaune text-encre-noire border-yellow-700/30';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const getTranslatedType = (type) => {
    switch (type) {
      case 'prestation': return t('common.typePrestation') || 'Prestation';
      case 'repetition': return t('common.typeRepetition') || 'Répétition';
      case 'atelier': return t('common.typeAtelier') || 'Atelier';
      default: return type;
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🎭 {t('mestre.eventsTitle') || "Direction Musicale - Liste des Événements"}
        </h2>

        {/* Temporal Filter Selector */}
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : sortedEvents.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-8 text-center">
          <p className="text-xs font-bold opacity-75">{t('mestre.noEvents') || "Aucune prestation, répétition ou atelier trouvé."}</p>
        </CordelCard>
      ) : (
        <div className="w-full max-w-full overflow-x-auto border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-cordel-bg-light">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-encre-noire bg-cordel-master-light/50 font-black uppercase text-[10px] tracking-wider text-cordel-wood select-none">
                <th className="p-1.5 md:p-3 border-r border-encre-noire/15">{t('mestre.eventDate') || "Date"}</th>
                <th className="p-1.5 md:p-3 border-r border-encre-noire/15">{t('mestre.eventTitle') || "Événement"}</th>
                <th className="p-1.5 md:p-3 border-r border-encre-noire/15">{t('mestre.eventType') || "Type"}</th>
                <th className="p-1.5 md:p-3 border-r border-encre-noire/15">{t('mestre.eventLocation') || "Lieu"}</th>
                <th className="p-1.5 md:p-3 border-r border-encre-noire/15 text-center">{t('mestre.eventInscriptions') || "Inscriptions"}</th>
                <th className="p-1.5 md:p-3 text-center">{t('common.actions') || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((evt) => {
                const insList = evt.inscriptions || [];
                const presentCount = insList.filter(ins => ins.status === 'present').length + (evt.invitesExternes || []).length;
                const totalRegistered = insList.filter(ins => ins.status !== 'absent').length;

                return (
                  <tr key={evt.id} className="border-b border-encre-noire/15 hover:bg-cordel-master-light/10 transition-colors">
                    <td className="p-1.5 md:p-3 border-r border-encre-noire/15 font-bold whitespace-nowrap">
                      {formatDateWithDay(evt.date, locale, true)}
                    </td>
                    <td className="p-1.5 md:p-3 border-r border-encre-noire/15 font-extrabold text-encre-noire">
                      {evt.titre}
                    </td>
                    <td className="p-1.5 md:p-3 border-r border-encre-noire/15">
                      <span className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9px] ${getTypeBadgeClass(evt.type)}`}>
                        {getTranslatedType(evt.type)}
                      </span>
                    </td>
                    <td className="p-1.5 md:p-3 border-r border-encre-noire/15 truncate max-w-[150px]" title={evt.lieu}>
                      {evt.lieu ? (
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <span>📍</span>
                          <span>{formatLocationShort(evt, lieuxImportants)}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-1.5 md:p-3 border-r border-encre-noire/15 text-center font-bold">
                      <span className="text-green-700 dark:text-green-400">{presentCount}</span>
                      <span className="opacity-40 font-normal mx-0.5">/</span>
                      <span className="opacity-70">{totalRegistered}</span>
                    </td>
                    <td className="p-1.5 md:p-3 text-center flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <CordelButton
                        type="button"
                        variant="ocre"
                        useExtremeBorder={false}
                        className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-black"
                        onClick={() => onSelectForStage(evt)}
                      >
                        🎭 {t('mestre.actionStageLayout') || "Plan de scène"}
                      </CordelButton>
                      <CordelButton
                        type="button"
                        variant="default"
                        useExtremeBorder={false}
                        className="py-1 px-2.5 text-[9px] uppercase tracking-wider font-black bg-cordel-bg hover:bg-neutral-100"
                        onClick={() => onOpenDetails(evt)}
                      >
                        🔍 {t('mestre.actionDetails') || "Détails"}
                      </CordelButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
