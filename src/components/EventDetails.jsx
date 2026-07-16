import React, { useState, useEffect } from 'react';
import { doc, updateDoc, runTransaction, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import ReunionAgendaManager from './ReunionAgendaManager';

export default function EventDetails({ event, user, profileData, onClose }) {
  // Find if the user has already responded to this event
  const existingResponse = (event.inscriptions || []).find(ins => ins.userId === user.uid);

  const [status, setStatus] = useState(existingResponse ? existingResponse.status : 'confirm'); // 'present', 'absent', 'confirm'
  const [transport, setTransport] = useState(existingResponse ? existingResponse.transport || 'propre' : 'propre'); // 'propre', 'cherche', 'propose'
  const [places, setPlaces] = useState(existingResponse ? existingResponse.places || 0 : 0);
  const [instruments, setInstruments] = useState(existingResponse ? existingResponse.instruments || '' : '');
  const [saving, setSaving] = useState(false);
  
  const [allUsers, setAllUsers] = useState([]);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editForm, setEditForm] = useState({
    titre: event.titre || '',
    date: event.date || '',
    lieu: event.lieu || '',
    horairesPassages: event.horairesPassages || '',
    horaireCovoiturage: event.horaireCovoiturage || '',
    niveauRequis: event.niveauRequis || 'tous',
    lienDocument: event.lienDocument || ''
  });
  const [savingEvent, setSavingEvent] = useState(false);

  const isConcertRestricted = event.type === 'concert' && event.niveauRequis === 'confirme' && profileData?.niveau === 'debutant';

  // Sync users list to fetch instruments and names in real-time
  useEffect(() => {
    if (!event.groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', event.groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach(docSnap => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [event.groupId]);

  // Enforce absent status if concert is restricted for beginners
  useEffect(() => {
    if (isConcertRestricted && status !== 'absent') {
      setStatus('absent');
    }
  }, [isConcertRestricted]);

  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  const [setlist, setSetlist] = useState(event.setlist || []);
  const [newMorceauTitre, setNewMorceauTitre] = useState('');
  const [newMorceauUrl, setNewMorceauUrl] = useState('');
  const [newMorceauNotes, setNewMorceauNotes] = useState('');
  const [updatingSetlist, setUpdatingSetlist] = useState(false);

  const [showProposerForm, setShowProposerForm] = useState(false);
  const [voitureForm, setVoitureForm] = useState({
    placesPassagers: 3,
    placesAlfaias: '',
    materielCharge: ''
  });
  const [submittingCovoit, setSubmittingCovoit] = useState(false);

  const handleProposerVoiture = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) {
          throw new Error("L'événement n'existe plus !");
        }

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const voitures = currentCovoit.voitures || [];

        if (voitures.some(v => v.chauffeurId === user.uid)) {
          throw new Error("Vous proposez déjà une voiture pour cet événement.");
        }

        const newVoiture = {
          id: `voiture_${user.uid}`,
          chauffeurId: user.uid,
          chauffeurNom: `${profileData?.prenom} ${profileData?.nom}`,
          placesPassagers: parseInt(voitureForm.placesPassagers) || 0,
          placesAlfaias: voitureForm.placesAlfaias.trim(),
          materielCharge: voitureForm.materielCharge.trim(),
          passagers: []
        };

        const recherchePlace = (currentCovoit.recherchePlace || []).filter(item => item.uid !== user.uid);

        transaction.update(eventRef, {
          covoiturage: {
            voitures: [...voitures, newVoiture],
            recherchePlace: recherchePlace
          }
        });
      });

      setShowProposerForm(false);
      setVoitureForm({ placesPassagers: 3, placesAlfaias: '', materielCharge: '' });
      alert("Votre voiture a été ajoutée au convoi !");
    } catch (err) {
      console.error("EventDetails - Erreur handleProposerVoiture :", err);
      alert(err.message || "Erreur lors de l'ajout de votre voiture.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleRejoindreVoiture = async (voitureId) => {
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) {
          throw new Error("L'événement n'existe plus !");
        }

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const voitures = currentCovoit.voitures || [];

        const targetVoiture = voitures.find(v => v.id === voitureId);
        if (!targetVoiture) {
          throw new Error("Ce véhicule n'est plus disponible.");
        }

        if (targetVoiture.passagers.length >= targetVoiture.placesPassagers) {
          throw new Error("Désolé, cette voiture vient d'être remplie !");
        }

        const updatedVoitures = voitures.map(voiture => {
          const cleanPassagers = voiture.passagers.filter(p => p.uid !== user.uid);
          
          if (voiture.id === voitureId) {
            return {
              ...voiture,
              passagers: [...cleanPassagers, { uid: user.uid, nom: `${profileData?.prenom} ${profileData?.nom}` }]
            };
          }
          return {
            ...voiture,
            passagers: cleanPassagers
          };
        });

        const recherchePlace = (currentCovoit.recherchePlace || []).filter(item => item.uid !== user.uid);

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: recherchePlace
          }
        });
      });

    } catch (err) {
      console.error("EventDetails - Erreur handleRejoindreVoiture :", err);
      alert(err.message || "Erreur lors de la réservation.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleQuitterVoiture = async (voitureId) => {
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const voitures = currentCovoit.voitures || [];

        const updatedVoitures = voitures.map(voiture => {
          if (voiture.id === voitureId) {
            return {
              ...voiture,
              passagers: voiture.passagers.filter(p => p.uid !== user.uid)
            };
          }
          return voiture;
        });

        transaction.update(eventRef, {
          covoiturage: {
            ...currentCovoit,
            voitures: updatedVoitures
          }
        });
      });

    } catch (err) {
      console.error("EventDetails - Erreur handleQuitterVoiture :", err);
      alert("Erreur lors de l'annulation.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleRetirerVoiture = async (voitureId) => {
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const voitures = currentCovoit.voitures || [];

        const voitureToDelete = voitures.find(v => v.id === voitureId);
        if (!voitureToDelete) return;

        const passengersToQueue = voitureToDelete.passagers || [];
        
        let recherchePlace = currentCovoit.recherchePlace || [];
        passengersToQueue.forEach(p => {
          if (!recherchePlace.some(r => r.uid === p.uid)) {
            recherchePlace.push(p);
          }
        });

        const updatedVoitures = voitures.filter(v => v.id !== voitureId);

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: recherchePlace
          }
        });
      });

      alert("Votre véhicule a été retiré du convoi.");
    } catch (err) {
      console.error("EventDetails - Erreur handleRetirerVoiture :", err);
      alert("Erreur lors du retrait de votre voiture.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleChercherPlace = async () => {
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        let recherchePlace = currentCovoit.recherchePlace || [];
        const voitures = currentCovoit.voitures || [];

        if (recherchePlace.some(p => p.uid === user.uid)) {
          return;
        }

        const updatedVoitures = voitures.map(voiture => ({
          ...voiture,
          passagers: voiture.passagers.filter(p => p.uid !== user.uid)
        }));

        recherchePlace.push({ uid: user.uid, nom: `${profileData?.prenom} ${profileData?.nom}` });

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: recherchePlace
          }
        });
      });

    } catch (err) {
      console.error("EventDetails - Erreur handleChercherPlace :", err);
      alert("Erreur lors de l'inscription en liste d'attente.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleAnnulerCherchePlace = async () => {
    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const recherchePlace = (currentCovoit.recherchePlace || []).filter(p => p.uid !== user.uid);

        transaction.update(eventRef, {
          covoiturage: {
            ...currentCovoit,
            recherchePlace: recherchePlace
          }
        });
      });

    } catch (err) {
      console.error("EventDetails - Erreur handleAnnulerCherchePlace :", err);
      alert("Erreur lors de l'annulation de la recherche.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleAddMorceau = async (e) => {
    e.preventDefault();
    if (!newMorceauTitre.trim()) return;

    setUpdatingSetlist(true);
    try {
      const updatedSetlist = [
        ...setlist,
        {
          id: `morceau_${Date.now()}`,
          titre: newMorceauTitre.trim(),
          sequenceurUrl: newMorceauUrl.trim(),
          notes: newMorceauNotes.trim()
        }
      ];

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });

      setSetlist(updatedSetlist);
      setNewMorceauTitre('');
      setNewMorceauUrl('');
      setNewMorceauNotes('');
    } catch (err) {
      console.error("EventDetails - Erreur handleAddMorceau :", err);
      alert("Erreur lors de l'ajout du morceau.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleRemoveMorceau = async (morceauId) => {
    setUpdatingSetlist(true);
    try {
      const updatedSetlist = setlist.filter(m => m.id !== morceauId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });
      setSetlist(updatedSetlist);
    } catch (err) {
      console.error("EventDetails - Erreur handleRemoveMorceau :", err);
      alert("Erreur lors de la suppression.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleTransportChange = (e) => {
    setTransport(e.target.value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (isConcertRestricted && status !== 'absent') {
      alert("Ce concert est réservé aux musiciens confirmés.");
      return;
    }

    try {
      // 1. Read existing inscriptions and filter out current user's past response
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);

      // 2. Add the new updated response object
      const newResponse = {
        userId: user.uid,
        userName: `${profileData.prenom} ${profileData.nom}`,
        status: status,
        transport: status === 'present' ? transport : null,
        places: status === 'present' && transport === 'propose' ? parseInt(places) || 0 : 0,
        instruments: status === 'present' && transport === 'propose' ? instruments : ""
      };

      updatedInscriptions.push(newResponse);

      // 3. Write update back to Firestore
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      console.log("EventDetails - Inscription RSVP enregistrée avec succès !");
      onClose();
    } catch (error) {
      console.error("EventDetails - Erreur lors de la sauvegarde RSVP :", error);
      alert("Erreur lors de l'enregistrement de votre inscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!event.id) return;
    setSavingEvent(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        titre: editForm.titre,
        date: editForm.date,
        lieu: editForm.lieu || '',
        horairesPassages: editForm.horairesPassages || '',
        horaireCovoiturage: editForm.horaireCovoiturage || '',
        niveauRequis: editForm.niveauRequis || 'tous',
        lienDocument: editForm.lienDocument || ''
      });
      setIsEditingEvent(false);
      alert("Événement mis à jour avec succès !");
    } catch (err) {
      console.error("EventDetails - Erreur de modification événement :", err);
      alert("Erreur lors de l'enregistrement de l'événement.");
    } finally {
      setSavingEvent(false);
    }
  };

  // Group presents by instrument for grouped presence list display
  const presentsByInstrument = {};
  if (event.inscriptions && event.inscriptions.length > 0) {
    event.inscriptions.forEach((ins) => {
      if (ins.status === 'present') {
        const userInfo = allUsers.find(u => u.id === ins.userId) || { prenom: ins.userName, nom: '', instrument: 'Autre' };
        const inst = userInfo.instrument || 'Autre';
        if (!presentsByInstrument[inst]) {
          presentsByInstrument[inst] = [];
        }
        presentsByInstrument[inst].push(userInfo);
      }
    });
  }

  // Date parsing for visual header
  const dateObj = new Date(event.date);
  const formattedDate = isNaN(dateObj.getTime()) 
    ? 'Date inconnue' 
    : dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const typeVariants = {
    concert: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft'
  };

  const currentVariant = typeVariants[event.type] || 'default';

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header with back button & modifier button */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none">
        <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs">
          ← Retour
        </CordelButton>
        <span className="panel-title text-sm font-extrabold tracking-wider text-cordel-wood uppercase">
          Détails Événement
        </span>
        {isAuthorized && !isEditingEvent && (
          <button
            type="button"
            onClick={() => setIsEditingEvent(true)}
            className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer"
          >
            ✏️ Modifier
          </button>
        )}
        {isAuthorized && isEditingEvent && (
          <button
            type="button"
            onClick={() => setIsEditingEvent(false)}
            className="text-[10px] font-black uppercase bg-neutral-200 border border-encre-noire px-3 py-1 rounded"
          >
            Annuler
          </button>
        )}
      </div>

      {isEditingEvent ? (
        <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={true} className="py-5 px-6 text-left">
            <h3 className="panel-title text-base font-bold mb-4 text-cordel-wood">
              Modifier l'événement
            </h3>

            <div className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Titre de l'événement
                </label>
                <input
                  type="text"
                  value={editForm.titre}
                  onChange={(e) => setEditForm(prev => ({ ...prev, titre: e.target.value }))}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Date et heure
                </label>
                <input
                  type="datetime-local"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Lieu */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lieu
                </label>
                <input
                  type="text"
                  value={editForm.lieu}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lieu: e.target.value }))}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Concert specific fields */}
              {event.type === 'concert' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Horaires des sets / passages
                    </label>
                    <input
                      type="text"
                      value={editForm.horairesPassages}
                      onChange={(e) => setEditForm(prev => ({ ...prev, horairesPassages: e.target.value }))}
                      disabled={savingEvent}
                      className="theme-input w-full disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Horaire de convoi (Départ local)
                    </label>
                    <input
                      type="time"
                      value={editForm.horaireCovoiturage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, horaireCovoiturage: e.target.value }))}
                      disabled={savingEvent}
                      className="theme-input w-full disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Niveau requis
                    </label>
                    <select
                      value={editForm.niveauRequis}
                      onChange={(e) => setEditForm(prev => ({ ...prev, niveauRequis: e.target.value }))}
                      disabled={savingEvent}
                      className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                    >
                      <option value="tous">Tous les niveaux (Débutants acceptés)</option>
                      <option value="confirme">Confirmés uniquement</option>
                    </select>
                  </div>
                </>
              )}

              {/* Stage specific fields */}
              {event.type === 'stage' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Horaire de convoi (Départ local)
                  </label>
                  <input
                    type="time"
                    value={editForm.horaireCovoiturage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, horaireCovoiturage: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Reunion specific fields */}
              {event.type === 'reunion' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Lien du document d'ordre du jour
                  </label>
                  <input
                    type="url"
                    value={editForm.lienDocument}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lienDocument: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={savingEvent}
              className="w-full mt-5 py-3 text-xs font-bold uppercase tracking-widest"
            >
              {savingEvent ? "Modification..." : "Enregistrer les modifications"}
            </CordelButton>
          </CordelCard>
        </form>
      ) : (
        <>

      {/* Event General Info Card */}
      <CordelCard variant={currentVariant} useExtremeBorder={true} className="py-4">
        <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
          {event.type}
        </span>
        <h3 className="font-bold text-lg leading-tight mt-0.5 mb-2">{event.titre}</h3>
        <p className="text-xs font-semibold leading-relaxed">
          📅 {formattedDate} {formattedTime ? `à ${formattedTime}` : ''}
        </p>

        {/* New fields display */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-encre-noire/15 text-xs flex flex-col gap-1 font-semibold leading-relaxed">
          {event.lieu && (
            <span>📍 <strong>Lieu :</strong> {event.lieu}</span>
          )}
          {event.type === 'concert' && event.horairesPassages && (
            <span>⏱️ <strong>Horaires de passage :</strong> {event.horairesPassages}</span>
          )}
          {(event.type === 'concert' || event.type === 'stage') && event.horaireCovoiturage && (
            <span>🚗 <strong>Horaire de convoi :</strong> {event.horaireCovoiturage}</span>
          )}
          {event.type === 'concert' && (
            <span>🎯 <strong>Niveau requis :</strong> {event.niveauRequis === 'confirme' ? '🏆 Confirmés uniquement' : '👥 Tous les niveaux'}</span>
          )}
          {event.type === 'reunion' && event.lienDocument && (
            <span className="truncate">
              📄 <strong>Ordre du jour :</strong> <a href={event.lienDocument} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{event.lienDocument}</a>
            </span>
          )}
        </div>
      </CordelCard>

      {/* RSVP Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
            Votre présence
          </h4>
          
          {/* Status Selection Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={saving || isConcertRestricted}
              onClick={() => handleStatusChange('present')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'present' 
                  ? 'theme-bg-vert font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
                ${isConcertRestricted ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              Présent
            </button>
            
            <button
              type="button"
              disabled={saving}
              onClick={() => handleStatusChange('absent')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'absent' 
                  ? 'bg-cordel-wood text-cordel-bg-light font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
              `}
            >
              Absent
            </button>

            <button
              type="button"
              disabled={saving || isConcertRestricted}
              onClick={() => handleStatusChange('confirm')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'confirm' 
                  ? 'theme-bg-ocre font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
                ${isConcertRestricted ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              À confirmer
            </button>
          </div>

          {/* Restriction warning message */}
          {isConcertRestricted && (
            <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
              🚫 Concert réservé aux musiciens confirmés.
            </div>
          )}

          {/* Conditional Transport Options (Only visible when present) */}
          {status === 'present' && (
            <div className="flex flex-col gap-4 border-t border-dashed border-cordel-master-dark/20 pt-4 mt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
                Logistique Covoiturage
              </h4>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="propre"
                    checked={transport === 'propre'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>J'y vais par mes propres moyens</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="cherche"
                    checked={transport === 'cherche'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>Je cherche une place</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="propose"
                    checked={transport === 'propose'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>Je propose ma voiture</span>
                </label>
              </div>

              {/* Conditional Inputs if "propose ma voiture" */}
              {transport === 'propose' && (
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-cordel-wood/30 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Places passagers disponibles
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={places}
                      onChange={(e) => setPlaces(e.target.value)}
                      required
                      disabled={saving}
                      className="theme-input w-24 text-center disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Espace instruments (Alfaia, Caisses, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2 Alfaias + 1 Tarol"
                      value={instruments}
                      onChange={(e) => setInstruments(e.target.value)}
                      required
                      disabled={saving}
                      className="theme-input w-full disabled:opacity-50 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CordelCard>

        {/* Validation Button */}
        <CordelButton 
          variant="ocre" 
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3"
        >
          {saving ? "Validation..." : "Valider mon inscription"}
        </CordelButton>
      </form>

      {/* 👥 Tableau nominatif des présences */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
          👥 Tableau de présence / Inscriptions
        </h4>

        {/* Grouped by instrument for concert, repetition, stage */}
        {(event.type === 'concert' || event.type === 'repetition' || event.type === 'stage') ? (
          Object.keys(presentsByInstrument).length === 0 ? (
            <p className="text-[11px] italic opacity-60">Aucun membre présent pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2.5 bg-[#fdfaf2] dark:bg-[#1a1816] p-3.5 rounded border border-dashed border-encre-noire/15 text-left">
              {Object.keys(presentsByInstrument).map(inst => {
                const list = presentsByInstrument[inst];
                const namesString = list.map(u => `${u.prenom} ${u.nom}`).join(', ');
                return (
                  <div key={inst} className="text-xs leading-normal">
                    <strong className="text-cordel-wood">🥁 {inst} ({list.length}) :</strong> <span className="opacity-90 font-bold">{namesString}</span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Simple lists for reunion */
          <div className="flex flex-col gap-3.5 bg-[#fdfaf2] dark:bg-[#1a1816] p-3.5 rounded border border-dashed border-encre-noire/15 text-xs text-left">
            <div>
              <strong className="text-green-600 block border-b border-dashed border-green-500/10 pb-0.5 mb-1">
                ✅ Présents ({(event.inscriptions || []).filter(i => i.status === 'present').length})
              </strong>
              <p className="opacity-90 font-bold leading-normal">
                {(event.inscriptions || []).filter(i => i.status === 'present').map(i => i.userName).join(', ') || 'Aucun'}
              </p>
            </div>
            <div>
              <strong className="text-red-600 block border-b border-dashed border-red-500/10 pb-0.5 mb-1">
                ❌ Absents ({(event.inscriptions || []).filter(i => i.status === 'absent').length})
              </strong>
              <p className="opacity-90 font-bold leading-normal">
                {(event.inscriptions || []).filter(i => i.status === 'absent').map(i => i.userName).join(', ') || 'Aucun'}
              </p>
            </div>
            <div>
              <strong className="text-amber-600 block border-b border-dashed border-amber-500/10 pb-0.5 mb-1">
                ⏳ À confirmer ({(event.inscriptions || []).filter(i => i.status === 'confirm').length})
              </strong>
              <p className="opacity-90 font-bold leading-normal">
                {(event.inscriptions || []).filter(i => i.status === 'confirm').map(i => i.userName).join(', ') || 'Aucun'}
              </p>
            </div>
          </div>
        )}
      </CordelCard>

      {/* Setlist & Séquenceur de l'événement */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
          🎵 Programme de révision / Setlist
        </h4>

        {setlist.length === 0 ? (
          <p className="text-[11px] italic opacity-60">Aucun morceau ou rythme programmé pour cet événement.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {setlist.map((morceau) => (
              <div 
                key={morceau.id}
                className="text-xs p-3 rounded border border-dashed border-encre-noire/15 bg-[#fdfaf2] dark:bg-[#1a1816] flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-encre-noire text-sm">{morceau.titre}</span>
                  {isAuthorized && (
                    <button
                      type="button"
                      disabled={updatingSetlist}
                      onClick={() => handleRemoveMorceau(morceau.id)}
                      className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none"
                      title="Retirer de la setlist"
                    >
                      ✕ Retirer
                    </button>
                  )}
                </div>

                {morceau.notes && (
                  <p className="text-[11px] text-encre-noire/70 bg-white/40 dark:bg-black/20 p-1.5 rounded italic">
                    💡 {morceau.notes}
                  </p>
                )}

                {morceau.sequenceurUrl && (
                  <a
                    href={morceau.sequenceurUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                  >
                    🎧 Travailler ce rythme (Séquenceur)
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulaire d'ajout pour les Admins */}
        {isAuthorized && (
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2">
              ➕ Ajouter un morceau / rythme
            </h5>
            <form onSubmit={handleAddMorceau} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <input 
                  type="text"
                  placeholder="Titre du morceau (ex: Baque de Luanda)"
                  value={newMorceauTitre}
                  onChange={(e) => setNewMorceauTitre(e.target.value)}
                  disabled={updatingSetlist}
                  required
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input 
                  type="url"
                  placeholder="URL Séquenceur (ex: https://sequenceur.app/...)"
                  value={newMorceauUrl}
                  onChange={(e) => setNewMorceauUrl(e.target.value)}
                  disabled={updatingSetlist}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input 
                  type="text"
                  placeholder="Notes de révision (ex: Tempo 120, variations A et B)"
                  value={newMorceauNotes}
                  onChange={(e) => setNewMorceauNotes(e.target.value)}
                  disabled={updatingSetlist}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <CordelButton
                variant="ocre"
                useExtremeBorder={true}
                disabled={updatingSetlist || !newMorceauTitre.trim()}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
              >
                {updatingSetlist ? "Enregistrement..." : "Ajouter au programme"}
              </CordelButton>
            </form>
          </div>
        )}
      </CordelCard>

      {/* 🚗 Convoi & Covoiturage (uniquement concert et stage) */}
      {(event.type === 'concert' || event.type === 'stage') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            🚗 Convoi & Covoiturage (Départ du local)
          </h4>

          {/* Cars Grid */}
          <div className="flex flex-col gap-3">
            {(event.covoiturage?.voitures || []).length === 0 ? (
              <p className="text-[11px] italic opacity-60">Aucun chauffeur ne s'est encore déclaré pour cet événement.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(event.covoiturage.voitures).map((voiture) => {
                  const isUserChauffeur = voiture.chauffeurId === user.uid;
                  const isUserPassager = voiture.passagers.some(p => p.uid === user.uid);
                  const occupancy = voiture.passagers.length;
                  const capacity = voiture.placesPassagers;

                  return (
                    <div 
                      key={voiture.id}
                      className="border-2 border-encre-noire bg-cordel-bg rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] p-3 text-left relative flex flex-col justify-between min-h-[140px] text-xs"
                    >
                      <div>
                        {/* Chauffeur header */}
                        <div className="flex justify-between items-start font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
                          <span className="text-cordel-wood text-sm truncate pr-2">
                            👤 Chauffeur : {voiture.chauffeurNom}
                          </span>
                          <span className="shrink-0 text-encre-noire whitespace-nowrap">
                            🧑‍🤝‍🧑 {occupancy}/{capacity} places
                          </span>
                        </div>

                        {/* Cargo items */}
                        <div className="flex flex-col gap-1 text-[11px] font-semibold text-encre-noire opacity-90 mb-2">
                          {voiture.placesAlfaias && (
                            <span className="flex items-center gap-1.5">
                              🥁 <strong className="text-cordel-wood">Coffre (Alfaias) :</strong> {voiture.placesAlfaias}
                            </span>
                          )}
                          {voiture.materielCharge && (
                            <span className="flex items-center gap-1.5">
                              📦 <strong className="text-cordel-wood">Matériel asso :</strong> {voiture.materielCharge}
                            </span>
                          )}
                        </div>

                        {/* Passengers listing */}
                        {voiture.passagers.length > 0 && (
                          <div className="bg-[#fdfaf2] dark:bg-[#1a1816] border border-dashed border-encre-noire/10 rounded p-1.5 mb-3">
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 block mb-0.5">Passagers :</span>
                            <p className="text-[11px] font-bold leading-normal truncate">
                              {voiture.passagers.map(p => p.nom).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-2 mt-auto">
                        {isUserChauffeur ? (
                          <button
                            type="button"
                            disabled={submittingCovoit}
                            onClick={() => handleRetirerVoiture(voiture.id)}
                            className="text-[9px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2 py-1 rounded"
                          >
                            Retirer ma voiture
                          </button>
                        ) : isUserPassager ? (
                          <button
                            type="button"
                            disabled={submittingCovoit}
                            onClick={() => handleQuitterVoiture(voiture.id)}
                            className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2 py-1 rounded"
                          >
                            Quitter la voiture
                          </button>
                        ) : (
                          occupancy < capacity && (
                            <button
                              type="button"
                              disabled={submittingCovoit}
                              onClick={() => handleRejoindreVoiture(voiture.id)}
                              className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                            >
                              S'inscrire
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waiting List queue */}
          <div className="mt-5 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5 flex justify-between items-center">
              <span>📋 Membres en recherche de place</span>
              {!(event.covoiturage?.recherchePlace || []).some(p => p.uid === user.uid) ? (
                <button
                  type="button"
                  disabled={submittingCovoit}
                  onClick={handleChercherPlace}
                  className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-[#ece4d0] border border-encre-noire px-2 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]"
                >
                  Je cherche une place
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submittingCovoit}
                  onClick={handleAnnulerCherchePlace}
                  className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 border border-encre-noire px-2 py-1 rounded"
                >
                  Annuler ma recherche
                </button>
              )}
            </h5>

            {(event.covoiturage?.recherchePlace || []).length === 0 ? (
              <p className="text-[11px] italic opacity-60">Aucun membre en recherche de place actuellement.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(event.covoiturage.recherchePlace).map((p) => (
                  <span 
                    key={p.uid}
                    className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed"
                  >
                    ⏳ {p.nom}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Proposer ma voiture button/form */}
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left">
            {!showProposerForm ? (
              <button
                type="button"
                onClick={() => setShowProposerForm(true)}
                className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center"
              >
                🚗 Proposer ma voiture pour le trajet
              </button>
            ) : (
              <form onSubmit={handleProposerVoiture} className="flex flex-col gap-3 bg-[#fdfaf2] dark:bg-[#1a1816] p-4 rounded border border-dashed border-encre-noire/15">
                <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood">
                  Proposer un véhicule
                </h5>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Places passagers libres
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max="8"
                      value={voitureForm.placesPassagers}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, placesPassagers: parseInt(e.target.value) || 0 }))}
                      disabled={submittingCovoit}
                      required
                      className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Volume coffre (Alfaias)
                    </label>
                    <input 
                      type="text"
                      placeholder="Ex: 2 grosses alfaias"
                      value={voitureForm.placesAlfaias}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, placesAlfaias: e.target.value }))}
                      disabled={submittingCovoit}
                      className="theme-input text-xs font-bold py-1 bg-cordel-bg-light"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Matériel collectif pris en charge
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: sac de baguettes, 3 caixas..."
                    value={voitureForm.materielCharge}
                    onChange={(e) => setVoitureForm(prev => ({ ...prev, materielCharge: e.target.value }))}
                    disabled={submittingCovoit}
                    className="theme-input text-xs font-bold py-1 bg-cordel-bg-light"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowProposerForm(false)}
                    disabled={submittingCovoit}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded bg-neutral-200 hover:bg-neutral-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCovoit}
                    className="text-[10px] font-black uppercase tracking-widest bg-cordel-vert border border-encre-noire px-3.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                  >
                    {submittingCovoit ? "Envoi..." : "Valider"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </CordelCard>
      )}

      {/* 💡 Reunion Specific Ordre du Jour & PDF minutes report manager */}
      {event.type === 'reunion' && (
        <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20">
          <ReunionAgendaManager 
            event={event}
            user={user}
            profileData={profileData}
          />
        </div>
      )}
      </>
      )}
    </div>
  );
}
