import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import EventReportSection from './event-details/EventReportSection';
import { useTranslation } from './LanguageContext';
import { XiloCalendar } from './XiloIcons';

export default function ReunionManager({ groupId, user, profileData, onBack }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Creation form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'secretaire' || 
    profileData?.isSystemAdmin === true;

  // Fetch only reunion-type events in real-time
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId), where('type', '==', 'reunion'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      // Sort by date desc
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
      setLoading(false);
    }, (error) => {
      console.error("ReunionManager - Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleCreateReunion = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    setIsSubmitting(true);
    try {
      const dateTimeStr = `${date}T${time}:00`;
      const newEvent = {
        titre: title.trim(),
        date: dateTimeStr,
        type: 'reunion',
        groupId: groupId,
        pointsOrdreDuJour: [],
        compteRenduStatus: 'brouillon',
        compteRenduApprovals: {},
        suggestionsOrdreDuJour: [],
        inscriptions: [],
        lieu: 'Salle de réunion / En ligne',
        horairesPassages: '',
        imageUrl: '',
        requiresValidation: false,
        dateLimiteInscription: ''
      };

      const docRef = await addDoc(collection(db, 'events'), newEvent);
      setTitle('');
      setDate('');
      setTime('');
      setSelectedEventId(docRef.id); // Auto select the new meeting
      alert("Réunion créée avec succès !");
    } catch (err) {
      console.error("ReunionManager - Error creating meeting:", err);
      alert("Erreur lors de la création de la réunion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'publie':
        return <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px]">📜 ARCHIVÉ</span>;
      case 'attente_relecture':
        return <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] animate-pulse">⏳ RELECTURE</span>;
      default:
        return <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] opacity-75">✏️ BROUILLON</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${formattedDate} à ${hours}h${minutes}`;
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={selectedEventId ? () => setSelectedEventId('') : onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ {selectedEventId ? "Liste des réunions" : t('common.back') || "Retour"}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloCalendar size={16} /> Gestionnaire de Réunions
        </h2>
      </div>

      {selectedEventId && selectedEvent ? (
        /* Event report editor detail view */
        <div className="flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light/30">
            <h3 className="text-sm font-black text-encre-noire">
              📅 {selectedEvent.titre}
            </h3>
            <p className="text-[10px] font-bold text-cordel-wood uppercase mt-1">
              {formatDate(selectedEvent.date)}
            </p>
          </CordelCard>
          
          <EventReportSection 
            event={selectedEvent} 
            user={user} 
            profileData={profileData} 
          />
        </div>
      ) : (
        /* Listing & Creation Form View */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Direct Creation Form */}
          {isAdmin && (
            <div className="md:col-span-4">
              <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood border-b border-dashed border-encre-noire/10 pb-2">
                  📅 Créer une Réunion
                </h3>
                
                <form onSubmit={handleCreateReunion} className="flex flex-col gap-3 text-xs">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Titre de la réunion
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Ex: Assemblée Générale Ordinaire"
                      className="theme-input bg-white w-full py-1.5"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Jour
                    </label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="theme-input bg-white w-full py-1.5"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Heure
                    </label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="theme-input bg-white w-full py-1.5"
                    />
                  </div>

                  <CordelButton 
                    variant="ocre" 
                    type="submit" 
                    disabled={isSubmitting}
                    className="text-xs py-2 mt-2 font-bold w-full"
                  >
                    {isSubmitting ? "Création..." : "Créer la réunion"}
                  </CordelButton>
                </form>
              </CordelCard>
            </div>
          )}

          {/* Right Column: Meetings List */}
          <div className={isAdmin ? "md:col-span-8 flex flex-col gap-4" : "col-span-12 flex flex-col gap-4"}>
            <p className="text-xs opacity-75 leading-relaxed">
              Consultez et gérez l'ordre du jour, la dictée de notes et les statuts de validation pour toutes les réunions de l'association.
            </p>

            {loading ? (
              <div className="text-center py-12">
                <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
                  Chargement des réunions...
                </span>
              </div>
            ) : events.length === 0 ? (
              <CordelCard className="p-8 text-center bg-white/50 border-dashed">
                <p className="text-xs italic opacity-60">Aucune réunion répertoriée pour le moment.</p>
              </CordelCard>
            ) : (
              <CordelCard className="p-0 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                        <th className="py-2.5 px-3">Titre de la Réunion</th>
                        <th className="py-2.5 px-3">Date et Heure</th>
                        <th className="py-2.5 px-3">Statut CR</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => (
                        <tr 
                          key={ev.id} 
                          className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-bold text-encre-noire">
                            {ev.titre}
                          </td>
                          <td className="py-3 px-3 font-semibold opacity-85">
                            {formatDate(ev.date)}
                          </td>
                          <td className="py-3 px-3">
                            {getStatusBadge(ev.compteRenduStatus)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedEventId(ev.id)}
                              className="text-[10px] font-black uppercase bg-neutral-100 hover:bg-neutral-200 text-encre-noire border border-encre-noire/30 px-3 py-1 rounded"
                            >
                              Gérer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CordelCard>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
