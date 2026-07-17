import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import EventStageLayoutSection from '../event-details/EventStageLayoutSection';

export default function MestreStageLayout({ groupId, user, profileData, selectedEventId, onSelectEventId }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all musical events for the dropdown list
  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, 'events'),
      where('groupId', '==', groupId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (['prestation', 'repetition', 'atelier'].includes(data.type)) {
          fetched.push({ id: docSnap.id, ...data });
        }
      });
      // Sort: recent/upcoming first
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Sync selected event object in real-time
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

  // Fetch all users in real-time (needed for stage layout positioning & avatar photo resolution)
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach(docSnap => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [groupId]);

  return (
    <div className="flex flex-col gap-5 text-left select-none w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-2">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🎭 {t('mestre.stageTitle') || "Plan de Scène Actif"}
        </h2>
        
        {/* Dropdown selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="stage-event-select" className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark whitespace-nowrap">
            {t('mestre.selectEventPrompt') || "Sélectionnez un événement :"}
          </label>
          <select
            id="stage-event-select"
            value={selectedEventId || ''}
            onChange={(e) => onSelectEventId(e.target.value)}
            className="theme-input text-[10px] font-bold py-1 px-3 bg-cordel-bg-light border-encre-noire/30"
          >
            <option value="">-- Choose Event --</option>
            {events.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.titre} ({evt.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeEvent ? (
        <div className="w-full">
          <EventStageLayoutSection
            event={activeEvent}
            user={user}
            profileData={profileData}
            allUsers={allUsers}
            isAuthorized={true}
            t={t}
          />
        </div>
      ) : (
        <CordelCard variant="default" useExtremeBorder={true} className="p-12 text-center">
          <p className="text-xs font-bold opacity-75">
            {t('mestre.noEventSelectedForStage') || "Veuillez sélectionner un événement ci-dessus ou depuis la liste des événements pour configurer le plan de scène."}
          </p>
        </CordelCard>
      )}
    </div>
  );
}
