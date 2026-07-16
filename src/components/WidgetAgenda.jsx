import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import EventDetails from './EventDetails';

export default function WidgetAgenda({ role, isSystemAdmin, groupId, user, profileData }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const limit = isMobile ? 3 : 8;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = events.filter(e => {
    const eDate = new Date(e.date);
    return !isNaN(eDate.getTime()) && eDate >= today;
  });
  const visibleEvents = upcomingEvents.slice(0, limit);
  
  const [formData, setFormData] = useState({
    titre: '',
    type: 'concert', // 'concert', 'repetition', 'stage', 'reunion'
    date: '',
    lieu: '',
    horairesPassages: '',
    horaireCovoiturage: '',
    niveauRequis: 'tous',
    lienDocument: ''
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenForm = () => {
    setFormData({
      titre: '',
      type: 'concert',
      date: '',
      lieu: '',
      horairesPassages: '',
      horaireCovoiturage: '',
      niveauRequis: 'tous',
      lienDocument: ''
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
    if (!formData.titre || !formData.date) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'events'), {
        titre: formData.titre,
        type: formData.type,
        date: formData.date,
        groupId: groupId,
        inscriptions: [],
        lieu: formData.lieu || '',
        horairesPassages: formData.type === 'concert' ? formData.horairesPassages || '' : '',
        horaireCovoiturage: (formData.type === 'concert' || formData.type === 'stage') ? formData.horaireCovoiturage || '' : '',
        niveauRequis: formData.type === 'concert' ? formData.niveauRequis || 'tous' : 'tous',
        lienDocument: formData.type === 'reunion' ? formData.lienDocument || '' : ''
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
    concert: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft'
  };

  // Find the currently selected event inside the synchronized events state 
  // to feed the child component with real-time Firestore updates
  const activeEvent = selectedEvent 
    ? events.find(e => e.id === selectedEvent.id) || selectedEvent 
    : null;

  // Render Event Details view if a ticket is clicked
  if (activeEvent) {
    return (
      <EventDetails 
        event={activeEvent}
        user={user}
        profileData={profileData}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center pl-1 pr-1">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
          Dates à Venir
        </h3>
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
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                disabled={saving}
                className="theme-input w-full disabled:opacity-50"
              >
                <option value="concert">Concert (Ocre)</option>
                <option value="repetition">Répétition (Vert)</option>
                <option value="stage">Stage (Bleu)</option>
                <option value="reunion">Réunion (Kraft)</option>
              </select>
            </div>

             {/* Date Picker */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Date et heure
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

            {/* Lieu (Tous) */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Lieu
              </label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="Ex : Local de l'asso, Place de la Mairie..."
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Concert specific fields */}
            {formData.type === 'concert' && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Horaires des sets / passages
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

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Horaire de convoi (Départ local)
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

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Niveau requis
                  </label>
                  <select
                    name="niveauRequis"
                    value={formData.niveauRequis}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                  >
                    <option value="tous">Tous les niveaux (Débutants acceptés)</option>
                    <option value="confirme">Confirmés uniquement</option>
                  </select>
                </div>
              </>
            )}

            {/* Stage specific fields */}
            {formData.type === 'stage' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Horaire de convoi (Départ local)
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

            {/* Réunion specific fields */}
            {formData.type === 'reunion' && (
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
            <p className="text-xs opacity-75 font-semibold">Aucun événement planifié.</p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleEvents.map((event) => {
              const dateObj = new Date(event.date);
              const day = isNaN(dateObj.getTime()) ? '?' : dateObj.getDate();
              const month = isNaN(dateObj.getTime()) 
                ? '???' 
                : dateObj.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase().replace('.', '');
              const time = isNaN(dateObj.getTime())
                ? '--h--'
                : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              const variant = variants[event.type] || 'default';

              return (
                <div 
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
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
                  {/* Left Side: Date Block */}
                  <div className="w-20 shrink-0 flex flex-col justify-center items-center text-center border-r-2 border-dashed border-encre-noire/30 px-2 select-none">
                    <span className="text-2xl font-black tracking-tighter leading-none">{day}</span>
                    <span className="text-[10px] font-bold tracking-widest mt-0.5">{month}</span>
                    <span className="text-[9px] font-semibold opacity-75 mt-1">{time}</span>
                  </div>

                  {/* Right Side: Details */}
                  <div className="flex-1 p-4 flex flex-col justify-center text-left pl-5">
                    <h4 className="font-bold text-sm leading-tight mb-0.5">{event.titre}</h4>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
                        {event.type}
                      </span>
                      {/* Subscriptions counter */}
                      {event.inscriptions && event.inscriptions.length > 0 && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-encre-noire text-cordel-bg-light rounded-sm">
                          {event.inscriptions.filter(i => i.status === 'present').length} présents
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
        )
      )}
    </div>
  );
}
