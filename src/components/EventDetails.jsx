import React, { useState, useEffect } from 'react';
import { doc, updateDoc, runTransaction, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import ReunionAgendaManager from './ReunionAgendaManager';
import { useTranslation } from './LanguageContext';
import { XiloCalendar } from './XiloIcons';
import XiloAvatar from './XiloAvatar';
import PlacesAutocomplete from './PlacesAutocomplete';
import { calculateRoadDistance } from '../utils/googleMaps';

// Algorithme de calcul de l'occupation du véhicule
const calculateCarStatus = (car, associationSettings) => {
  // On s'assure que car.passengers est un tableau
  const passengers = car.passengers || [];

  // Calcul du volume des Alfaias
  const totalAlfayas = passengers.reduce((sum, p) => sum + (Number(p.alfayasCount) || 0), 0);
  const alfayasInTrunk = Math.min(totalAlfayas, Number(car.trunkAlfayaCapacity) || 0);
  const alfayasOnSeats = totalAlfayas - alfayasInTrunk;

  // Calcul des passagers physiques
  const physicalPassengers = passengers.reduce((sum, p) => sum + (p.isPassenger ? 1 : 0), 0);
  
  // Occupation totale et places restantes
  const occupiedSeats = physicalPassengers + alfayasOnSeats;
  const availableSeats = (Number(car.passengerSeats) || 0) - occupiedSeats;

  // Statuts d'éligibilité et de blocage
  const isFull = availableSeats === 0;
  
  let isEligibleForReimbursement = false;
  if (associationSettings?.enableCarpoolReimbursement !== false) {
    const rule = associationSettings?.reimbursementRule || 'full_cars_only';
    if (rule === 'all_drivers') {
      isEligibleForReimbursement = true;
    } else {
      isEligibleForReimbursement = isFull;
    }
  }

  const isOverbooked = availableSeats < 0;

  return {
    totalAlfayas,
    alfayasInTrunk,
    alfayasOnSeats,
    physicalPassengers,
    occupiedSeats,
    availableSeats,
    isFull,
    isEligibleForReimbursement,
    isOverbooked
  };
};

export default function EventDetails({ event, user, profileData, onNavigateToView, onClose, onPrev, onNext }) {
  const { t } = useTranslation();
  // Find if the user has already responded to this event
  const existingResponse = (event.inscriptions || []).find(ins => ins.userId === user.uid);

  const [status, setStatus] = useState(existingResponse ? existingResponse.status : 'confirm'); // 'present', 'absent', 'confirm'
  const [transport, setTransport] = useState(existingResponse ? existingResponse.transport || 'propre' : 'propre'); // 'propre', 'cherche', 'propose'
  const [places, setPlaces] = useState(existingResponse ? existingResponse.places || 0 : 0);
  const [instruments, setInstruments] = useState(existingResponse ? existingResponse.instruments || '' : '');
  const [saving, setSaving] = useState(false);
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);

  useEffect(() => {
    const resp = (event.inscriptions || []).find(ins => ins.userId === user.uid);
    setStatus(resp ? resp.status : 'confirm');
    setTransport(resp ? resp.transport || 'propre' : 'propre');
    setPlaces(resp ? resp.places || 0 : 0);
    setInstruments(resp ? resp.instruments || '' : '');
    
    setInstrumentChoisi(resp?.instrumentChoisi || profileData?.instrument || 'Autre');
    setIsEditingEvent(false);
    
    setEditForm({
      titre: event.titre || '',
      type: event.type || 'repetition',
      date: event.date || '',
      dateFin: event.dateFin || '',
      lieu: event.lieu || '',
      horairesPassages: event.horairesPassages || '',
      horaireCovoiturage: event.horaireCovoiturage || '',
      niveauRequis: event.niveauRequis || 'tous',
      niveauDanseRequis: event.niveauDanseRequis || 'aucun',
      lienDocument: event.lienDocument || '',
      distanceAllerRetourKm: event.distanceAllerRetourKm || '',
      lienSocial: event.lienSocial || '',
      imageUrl: event.imageUrl || ''
    });
    setSetlist(event.setlist || []);
  }, [event.id, user.uid, profileData?.instrument, event.type]);

  const formatToUTCISO8601 = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}${s}Z`;
  };

  const getEventDetailsText = () => {
    let detailsText = `Type d'événement : ${event.type || ''}`;
    if (event.lieu) detailsText += `\n📍 Lieu : ${event.lieu}`;
    if (event.horairesPassages) detailsText += `\n⏱️ Horaires de passage : ${event.horairesPassages}`;
    if (event.horaireCovoiturage) detailsText += `\n🚗 Covoiturage : ${event.horaireCovoiturage}`;
    if (event.niveauRequis) detailsText += `\n🎯 Niveau requis (Musique) : ${event.niveauRequis === 'confirme' ? 'Confirmés' : 'Tous'}`;
    if (event.niveauDanseRequis && event.niveauDanseRequis !== 'aucun') detailsText += `\n💃 Danse (Niveau requis) : ${event.niveauDanseRequis === 'confirme' ? 'Confirmés' : 'Débutants'}`;
    if (event.lienDocument) detailsText += `\n📄 Document / Ordre du jour : ${event.lienDocument}`;
    return detailsText;
  };

  const handleAddToGoogleCalendar = () => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      alert("Impossible d'ajouter à l'agenda : date invalide.");
      return;
    }
    const startStr = formatToUTCISO8601(eventDate);
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default duration
    const endStr = formatToUTCISO8601(endDate);

    const title = encodeURIComponent(event.titre || 'Événement Roda');
    const dates = `${startStr}/${endStr}`;
    const details = encodeURIComponent(getEventDetailsText());
    const location = encodeURIComponent(event.lieu || '');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      alert("Impossible de générer le fichier iCal : date invalide.");
      return;
    }
    const startStr = formatToUTCISO8601(eventDate);
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
    const endStr = formatToUTCISO8601(endDate);
    const stampStr = formatToUTCISO8601(new Date());

    const summary = event.titre || 'Événement Roda';
    const description = getEventDetailsText().replace(/\n/g, '\\n');
    const location = event.lieu || '';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//O Girador//Event Calendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${event.id || Date.now()}@o-girador`,
      `DTSTAMP:${stampStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (event.titre || 'evenement').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${cleanTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [instrumentChoisi, setInstrumentChoisi] = useState(() => {
    if (existingResponse?.instrumentChoisi) {
      return existingResponse.instrumentChoisi;
    }
    return profileData?.instrument || 'Autre';
  });

  const isInstrumentLocked = !!existingResponse?.instrumentImposeParMestre;
  
  const [allUsers, setAllUsers] = useState([]);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [editForm, setEditForm] = useState({
    titre: event.titre || '',
    type: event.type || 'repetition',
    date: event.date || '',
    lieu: event.lieu || '',
    horairesPassages: event.horairesPassages || '',
    horaireCovoiturage: event.horaireCovoiturage || '',
    niveauRequis: event.niveauRequis || 'tous',
    niveauDanseRequis: event.niveauDanseRequis || 'aucun',
    lienDocument: event.lienDocument || '',
    distanceAllerRetourKm: event.distanceAllerRetourKm || '',
    lienSocial: event.lienSocial || '',
    imageUrl: event.imageUrl || ''
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storagePath = `events/${event.groupId}/uploads/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setEditForm(prev => ({ ...prev, imageUrl: downloadURL }));
      alert(t('widgetAgenda.uploadSuccess') || "Image téléversée !");
    } catch (error) {
      console.error("EventDetails - Erreur upload image :", error);
      alert(t('widgetAgenda.uploadError') || "Erreur lors du téléversement de l'image.");
    } finally {
      setUploadingImage(false);
    }
  };
  const [indemniteKilometrique, setIndemniteKilometrique] = useState(0);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"]);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [enableCarpoolReimbursement, setEnableCarpoolReimbursement] = useState(true);
  const [reimbursementRule, setReimbursementRule] = useState('full_cars_only');

  useEffect(() => {
    if (!event.groupId) return;
    const assocRef = doc(db, 'associations', event.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIndemniteKilometrique(data.indemniteKilometrique || 0);
        setAdresseLocal(data.adresseLocal || '');
        setAssocSequenceurUrl(data.sequenceurUrl || '');
        setEnableCarpoolReimbursement(data.enableCarpoolReimbursement !== false);
        setReimbursementRule(data.reimbursementRule || 'full_cars_only');
        if (Array.isArray(data.instrumentsDisponibles)) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        }
        if (Array.isArray(data.linkedInstruments)) {
          const normalized = data.linkedInstruments.map(link => {
            if (Array.isArray(link)) {
              return { name: '', instruments: link };
            } else if (link && typeof link === 'object') {
              if (Array.isArray(link.instruments)) {
                return { name: link.name || '', instruments: link.instruments };
              } else if (link.inst1 && link.inst2) {
                return { name: link.name || '', instruments: [link.inst1, link.inst2] };
              }
            }
            return null;
          }).filter(Boolean);
          setLinkedInstruments(normalized);
        } else {
          setLinkedInstruments([]);
        }
      }
    });
    return () => unsubscribe();
  }, [event.groupId]);

  const isPrestationRestricted = event.type === 'prestation' && event.niveauRequis === 'confirme' && profileData?.niveau === 'debutant';

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

  // Enforce absent status if prestation is restricted for beginners
  useEffect(() => {
    if (isPrestationRestricted && status !== 'absent') {
      setStatus('absent');
    }
  }, [isPrestationRestricted]);

  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  const getPupitreName = (inst) => {
    if (!inst) return null;
    const parts = inst.split(' + ').map(p => p.trim());
    const match = linkedInstruments.find(group => {
      const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      if (groupInsts.length !== parts.length) return false;
      const sortedGroup = [...groupInsts].sort();
      const sortedParts = [...parts].sort();
      return sortedGroup.every((val, idx) => val === sortedParts[idx]);
    });
    if (match && match.name) return match.name;

    if (parts.length === 1) {
      const containingGroup = linkedInstruments.find(group => {
        const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
        return groupInsts.includes(parts[0]) && group.name;
      });
      if (containingGroup) return containingGroup.name;
    }
    return null;
  };

  const getMemberInstrumentOptions = (mInfo) => {
    const base = mInfo?.instrumentsJoues && mInfo.instrumentsJoues.length > 0
      ? [...mInfo.instrumentsJoues]
      : [...instrumentsDisponibles];
    
    // Add combined option if they are polyvalent and have linked instruments
    if (mInfo?.instrumentsJoues && mInfo.instrumentsJoues.length > 1) {
      linkedInstruments.forEach(link => {
        const instrumentsArray = link.instruments || (Array.isArray(link) ? link : [link.inst1, link.inst2]);
        const hasAll = instrumentsArray.every(inst => mInfo.instrumentsJoues.includes(inst));
        if (hasAll) {
          const combined = instrumentsArray.join(' + ');
          if (!base.includes(combined)) {
            base.push(combined);
          }
        }
      });
    }
    return base;
  };

  const [setlist, setSetlist] = useState(event.setlist || []);
  const [newMorceauTitre, setNewMorceauTitre] = useState('');
  const [newMorceauJsonFile, setNewMorceauJsonFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [assocSequenceurUrl, setAssocSequenceurUrl] = useState('');
  const [newMorceauNotes, setNewMorceauNotes] = useState('');
  const [updatingSetlist, setUpdatingSetlist] = useState(false);

  const [showProposerForm, setShowProposerForm] = useState(false);
  const [voitureForm, setVoitureForm] = useState({
    passengerSeats: 3,
    trunkAlfayaCapacity: 0,
    materielCharge: ''
  });
  const [joiningVoitureId, setJoiningVoitureId] = useState(null);
  const [joinForm, setJoinForm] = useState({
    isPassenger: true,
    alfayasCount: 0
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
          passengerSeats: parseInt(voitureForm.passengerSeats) || 0,
          trunkAlfayaCapacity: parseInt(voitureForm.trunkAlfayaCapacity) || 0,
          materielCharge: voitureForm.materielCharge.trim(),
          passengers: []
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
      setVoitureForm({ passengerSeats: 3, trunkAlfayaCapacity: 0, materielCharge: '' });
      alert("Votre voiture a été ajoutée au convoi !");
    } catch (err) {
      console.error("EventDetails - Erreur handleProposerVoiture :", err);
      alert(err.message || "Erreur lors de l'ajout de votre voiture.");
    } finally {
      setSubmittingCovoit(false);
    }
  };



  const handleConfirmJoin = async (voiture) => {
    if (!user?.uid) return;

    // Simuler l'ajout pour vérifier la capacité
    const cleanPassengers = (voiture.passengers || []).filter(p => p.uid !== user.uid);
    const candidatePassenger = {
      uid: user.uid,
      nom: `${profileData?.prenom} ${profileData?.nom}`,
      isPassenger: joinForm.isPassenger,
      alfayasCount: joinForm.alfayasCount
    };
    const simulatedCar = {
      ...voiture,
      passengers: [...cleanPassengers, candidatePassenger]
    };

    const status = calculateCarStatus(simulatedCar, { enableCarpoolReimbursement, reimbursementRule });

    if (status.isOverbooked) {
      alert("❌ Impossible de rejoindre : pas assez de place pour vous et/ou vos instruments !");
      return;
    }

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

        const freshVoiture = voitures.find(v => v.id === voiture.id);
        if (!freshVoiture) {
          throw new Error("Ce véhicule n'est plus disponible.");
        }

        const freshCleanPassengers = (freshVoiture.passengers || []).filter(p => p.uid !== user.uid);
        const freshSimulatedCar = {
          ...freshVoiture,
          passengers: [...freshCleanPassengers, candidatePassenger]
        };

        const freshStatus = calculateCarStatus(freshSimulatedCar, { enableCarpoolReimbursement, reimbursementRule });
        if (freshStatus.isOverbooked) {
          throw new Error("Désolé, cette voiture vient d'être remplie par un autre passager ou instrument !");
        }

        const updatedVoitures = voitures.map(v => {
          const cleanP = (v.passengers || []).filter(p => p.uid !== user.uid);
          if (v.id === voiture.id) {
            return {
              ...v,
              passengers: [...cleanP, candidatePassenger]
            };
          }
          return {
            ...v,
            passengers: cleanP
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

      setJoiningVoitureId(null);
    } catch (err) {
      console.error("EventDetails - Erreur handleConfirmJoin :", err);
      alert(err.message || "Erreur lors de l'inscription.");
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
            const cleanP = (voiture.passengers || voiture.passagers || []).filter(p => p.uid !== user.uid);
            return {
              ...voiture,
              passengers: cleanP
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

        const passengersToQueue = voitureToDelete.passengers || voitureToDelete.passagers || [];
        
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
          passengers: (voiture.passengers || voiture.passagers || []).filter(p => p.uid !== user.uid)
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
      let jsonUrl = '';
      if (newMorceauJsonFile) {
        const fileRef = ref(storage, `associations/${event.groupId}/events/${event.id}/setlist/${Date.now()}_${newMorceauJsonFile.name}`);
        const snapshot = await uploadBytes(fileRef, newMorceauJsonFile);
        jsonUrl = await getDownloadURL(snapshot.ref);
      }

      const updatedSetlist = [
        ...setlist,
        {
          id: `morceau_${Date.now()}`,
          titre: newMorceauTitre.trim(),
          notes: newMorceauNotes.trim(),
          jsonUrl: jsonUrl
        }
      ];

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });

      setSetlist(updatedSetlist);
      setNewMorceauTitre('');
      setNewMorceauNotes('');
      setNewMorceauJsonFile(null);
      setFileInputKey(prev => prev + 1);
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
    if (event.status === 'annule') {
      alert("Les inscriptions sont désactivées car l'événement est annulé.");
      return;
    }
    setSaving(true);

    if (isPrestationRestricted && status !== 'absent') {
      alert("Cette prestation est réservée aux musiciens confirmés.");
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
        instruments: status === 'present' && transport === 'propose' ? instruments : "",
        instrumentChoisi: status === 'present' ? instrumentChoisi : null,
        instrumentImposeParMestre: status === 'present' ? isInstrumentLocked : false
      };

      updatedInscriptions.push(newResponse);

      // 3. Write update back to Firestore
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      setToastMessage("Inscription validée");
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
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
        type: editForm.type,
        date: editForm.date,
        dateFin: editForm.dateFin || '',
        lieu: editForm.lieu || '',
        horairesPassages: (editForm.type === 'prestation') ? editForm.horairesPassages || '' : '',
        horaireCovoiturage: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') ? editForm.horaireCovoiturage || '' : '',
        niveauRequis: (editForm.type === 'prestation') ? editForm.niveauRequis || 'tous' : 'tous',
        niveauDanseRequis: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') ? editForm.niveauDanseRequis || 'aucun' : 'aucun',
        lienDocument: (editForm.type === 'reunion') ? editForm.lienDocument || '' : '',
        distanceAllerRetourKm: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') ? (parseFloat(editForm.distanceAllerRetourKm) || 0) : 0,
        lienSocial: editForm.lienSocial || '',
        imageUrl: editForm.imageUrl || ''
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

  const handlePreparePublication = () => {
    const newUrl = `${window.location.pathname}?eventId=${event.id}`;
    window.history.pushState({}, '', newUrl);
    if (onNavigateToView) {
      onNavigateToView('studio-social');
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!event.id) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        status: newStatus
      });
      alert(`Statut de l'événement mis à jour : ${newStatus === 'annule' ? 'Annulé' : 'Maintenu'}`);
    } catch (err) {
      console.error("EventDetails - Erreur de modification statut :", err);
      alert("Erreur lors de la modification du statut.");
    }
  };

  const handleUpdateMemberInstrument = async (userId, newInstrument, impose) => {
    try {
      const eventRef = doc(db, 'events', event.id);
      await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error("L'événement n'existe plus !");
        }
        const currentInscriptions = eventDoc.data().inscriptions || [];
        const updated = currentInscriptions.map(ins => {
          if (ins.userId === userId) {
            return {
              ...ins,
              instrumentChoisi: newInstrument,
              instrumentImposeParMestre: impose
            };
          }
          return ins;
        });
        transaction.update(eventRef, { inscriptions: updated });
      });
    } catch (err) {
      console.error("EventDetails - Erreur handleUpdateMemberInstrument :", err);
      alert("Erreur lors de la modification de l'instrument.");
    }
  };

  // Group presents by instrument for grouped presence list display
  const presentsByInstrument = {};
  if (event.inscriptions && event.inscriptions.length > 0) {
    event.inscriptions.forEach((ins) => {
      if (ins.status === 'present') {
        const userInfo = allUsers.find(u => u.id === ins.userId) || { prenom: ins.userName, nom: '', instrument: 'Autre' };
        const inst = ins.instrumentChoisi || userInfo.instrument || 'Autre';
        if (!presentsByInstrument[inst]) {
          presentsByInstrument[inst] = [];
        }
        presentsByInstrument[inst].push(userInfo);
      }
    });
  }

  // Extract convoi drivers and individual drivers
  const convoiDrivers = [];
  if (event.covoiturage?.voitures) {
    event.covoiturage.voitures.forEach(voiture => {
      if (voiture.chauffeurId && voiture.chauffeurNom) {
        const carStatus = calculateCarStatus(voiture, { enableCarpoolReimbursement, reimbursementRule });
        convoiDrivers.push({
          id: voiture.chauffeurId,
          nom: voiture.chauffeurNom,
          isEligibleRefund: carStatus.isEligibleForReimbursement
        });
      }
    });
  }

  const convoiChauffeurIds = new Set(convoiDrivers.map(d => d.id));
  const individualDrivers = [];
  if (event.inscriptions) {
    event.inscriptions.forEach(ins => {
      if (ins.status === 'present' && ins.transport === 'propre') {
        if (!convoiChauffeurIds.has(ins.userId)) {
          individualDrivers.push({
            id: ins.userId,
            nom: ins.userName
          });
        }
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

  const dateFinObj = event.dateFin ? new Date(event.dateFin) : null;
  const hasDateFin = dateFinObj && !isNaN(dateFinObj.getTime());
  const formattedDateFin = hasDateFin
    ? dateFinObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const formattedTimeFin = hasDateFin
    ? dateFinObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const typeVariants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };

  const currentVariant = typeVariants[event.type] || 'default';

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full relative">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#84967a] text-encre-noire border-2 border-encre-noire px-5 py-3 rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_#181716] font-bold text-xs uppercase tracking-wider animate-bounce select-none">
          {toastMessage}
        </div>
      )}
      {/* Header with back button, modifier button & navigation arrows */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none gap-2">
        <div className="flex items-center gap-1.5">
          <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs font-black">
            ← {t('common.back')}
          </CordelButton>
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center justify-center select-none"
              title="Événement précédent"
            >
              ◀
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center justify-center select-none"
              title="Événement suivant"
            >
              ▶
            </button>
          )}
        </div>
        <span className="panel-title text-sm font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-1">
          <XiloCalendar size={14} /> {t('eventDetails.title')}
        </span>
        {isAuthorized && !isEditingEvent && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePreparePublication}
              className="text-[10px] font-black uppercase bg-cordel-ocre text-black border border-encre-noire px-3 py-1 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
            >
              📢 Préparer la publication
            </button>
            <button
              type="button"
              onClick={() => setIsEditingEvent(true)}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer"
            >
              ✏️ Modifier
            </button>
          </div>
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

              {/* Type Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.typeLabel') || "Type"}
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="prestation">{t('widgetAgenda.typePrestation') || "Prestation (Ocre)"}</option>
                  <option value="repetition">{t('widgetAgenda.typeRepetition') || "Répétition (Vert)"}</option>
                  <option value="stage">{t('widgetAgenda.typeStage') || "Stage (Bleu)"}</option>
                  <option value="atelier">{t('widgetAgenda.typeAtelier') || "Atelier (Jaune)"}</option>
                  <option value="reunion">{t('widgetAgenda.typeReunion') || "Réunion (Kraft)"}</option>
                </select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Date et heure de début
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

              {/* Date Fin (optionnel) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Date et heure de fin (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={editForm.dateFin || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateFin: e.target.value }))}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Lieu */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lieu
                </label>
                <PlacesAutocomplete
                  name="lieu"
                  value={editForm.lieu}
                  onChange={async (e) => {
                    const newLieu = e.target.value;
                    setEditForm(prev => ({ ...prev, lieu: newLieu }));
                    if (adresseLocal && newLieu) {
                      try {
                        const distanceKm = await calculateRoadDistance(adresseLocal, newLieu);
                        const distanceRoundTrip = Math.round(distanceKm * 2 * 100) / 100;
                        setEditForm(prev => ({ ...prev, distanceAllerRetourKm: distanceRoundTrip.toString() }));
                      } catch (err) {
                        console.error("Distance Matrix calculation failed on edit:", err);
                      }
                    }
                  }}
                  required
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Distance A/R (Prestation, Stage & Atelier) */}
              {(editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('widgetAgenda.distanceLabel') || "Distance Aller-Retour (Km)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.distanceAllerRetourKm}
                    onChange={(e) => setEditForm(prev => ({ ...prev, distanceAllerRetourKm: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50"
                  />
                </div>
              )}

              {/* Prestation specific fields */}
              {editForm.type === 'prestation' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      {t('widgetAgenda.passagesLabel') || "Horaires des passages (Optionnel)"}
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
                      {t('widgetAgenda.carpoolingLabel') || "Horaire Covoiturage (Optionnel)"}
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
                      {t('widgetAgenda.reqLevelLabel') || "Niveau requis (Musique)"}
                    </label>
                    <select
                      value={editForm.niveauRequis}
                      onChange={(e) => setEditForm(prev => ({ ...prev, niveauRequis: e.target.value }))}
                      disabled={savingEvent}
                      className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                    >
                      <option value="tous">{t('widgetAgenda.levelAll') || "Tous les niveaux"}</option>
                      <option value="confirme">{t('widgetAgenda.levelConfirm') || "Confirmés uniquement"}</option>
                    </select>
                  </div>
                </>
              )}

              {/* Stage & Atelier specific fields */}
              {(editForm.type === 'stage' || editForm.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('widgetAgenda.carpoolingLabel') || "Horaire Covoiturage (Optionnel)"}
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

              {/* Dance Level Selector for Prestation, Stage, Répétition, and Atelier */}
              {(editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    {t('widgetAgenda.danceLevelLabel') || "Danse (Niveau requis)"}
                  </label>
                  <select
                    value={editForm.niveauDanseRequis}
                    onChange={(e) => setEditForm(prev => ({ ...prev, niveauDanseRequis: e.target.value }))}
                    disabled={savingEvent}
                    className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                  >
                    <option value="aucun">{t('widgetAgenda.danceLevelNone') || "Pas de danse"}</option>
                    <option value="debutant">{t('widgetAgenda.danceLevelDeb') || "Niveau débutant"}</option>
                    <option value="confirme">{t('widgetAgenda.danceLevelConfirm') || "Niveau confirmé"}</option>
                  </select>
                </div>
              )}

              {/* Reunion specific fields */}
              {editForm.type === 'reunion' && (
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

              {/* Lien réseau social / Événement externe */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.lienSocialLabel') || "Lien réseau social / Événement externe (URL)"}
                </label>
                <input
                  type="url"
                  value={editForm.lienSocial || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lienSocial: e.target.value }))}
                  disabled={savingEvent || uploadingImage}
                  placeholder="https://..."
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Image de l'événement / Affiche */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('widgetAgenda.imageUrlLabel') || "Image de l'événement / Affiche"}
                </label>
                <div className="flex items-center gap-3">
                  {editForm.imageUrl && (
                    <div className="w-14 h-14 border border-encre-noire rounded-[4px] overflow-hidden bg-white shrink-0 shadow-[1px_1px_0px_0px_rgba(26,26,26,0.15)]">
                      <img src={editForm.imageUrl} alt="Affiche preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-2 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 select-none">
                    {uploadingImage ? (
                      <>⏳ {t('widgetAgenda.uploadingImage') || "Téléversement..."}</>
                    ) : (
                      <>📸 {t('widgetAgenda.imageUrlLabel') || "Image / Affiche"}</>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={savingEvent || uploadingImage}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {editForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                      className="text-[10px] font-bold text-red-700 hover:underline select-none"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
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

        {/* Admin Status Panel */}
        {isAuthorized && !isEditingEvent && (
          <div className="flex items-center justify-between gap-3 p-3 bg-cordel-bg border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] mb-4">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase text-cordel-wood">Statut de l'événement</span>
              <span className="text-xs font-black uppercase">
                {event.status === 'annule' ? (
                  <span className="text-red-600">❌ Annulé</span>
                ) : (
                  <span className="text-green-700">✅ Validé / Maintenu</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleUpdateStatus('confirme')}
                disabled={event.status !== 'annule'}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-[4px_6px_3px_5px] transition-all cursor-pointer select-none ${
                  event.status !== 'annule'
                    ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-green-100 text-green-800 border border-green-800 hover:bg-green-200 active:translate-x-[0.5px] active:translate-y-[0.5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:shadow-none'
                }`}
              >
                Maintenir
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('annule')}
                disabled={event.status === 'annule'}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-[4px_6px_3px_5px] transition-all cursor-pointer select-none ${
                  event.status === 'annule'
                    ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-red-100 text-red-800 border border-red-800 hover:bg-red-200 active:translate-x-[0.5px] active:translate-y-[0.5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:shadow-none'
                }`}
              >
                Annuler l'événement
              </button>
            </div>
          </div>
        )}

        {/* Event General Info Card */}
        <CordelCard variant={currentVariant} useExtremeBorder={true} className="py-4">
          <div className="flex justify-between items-start px-4">
            <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
              {event.type}
            </span>
            {event.status === 'annule' && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded tracking-wider select-none shrink-0 leading-none">
                🚫 Annulé
              </span>
            )}
          </div>
        <h3 className="font-bold text-lg leading-tight mt-0.5 mb-2">{event.titre}</h3>
        <p className="text-xs font-semibold leading-relaxed">
          {hasDateFin ? (
            <span>📅 Du {formattedDate} {formattedTime ? `à ${formattedTime}` : ''} au {formattedDateFin} {formattedTimeFin ? `à ${formattedTimeFin}` : ''}</span>
          ) : (
            <span>📅 {formattedDate} {formattedTime ? `à ${formattedTime}` : ''}</span>
          )}
        </p>

        {/* New fields display */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-encre-noire/15 text-xs flex flex-col gap-1 font-semibold leading-relaxed">
          {event.lieu && (
            <span>📍 <strong>Lieu :</strong> {event.lieu}</span>
          )}
          {event.type === 'prestation' && event.horairesPassages && (
            <span>⏱️ <strong>Horaires de passage :</strong> {event.horairesPassages}</span>
          )}
          {(event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && event.horaireCovoiturage && (
            <span>🚗 <strong>Horaire de convoi :</strong> {event.horaireCovoiturage}</span>
          )}
          {event.type === 'prestation' && (
            <span>🎯 <strong>Niveau requis (Musique) :</strong> {event.niveauRequis === 'confirme' ? t('widgetAgenda.levelConfirm') || '🏆 Confirmés uniquement' : t('widgetAgenda.levelAll') || '👥 Tous les niveaux'}</span>
          )}
          {(event.type === 'prestation' || event.type === 'stage' || event.type === 'repetition' || event.type === 'atelier') && (
            <span>💃 <strong>Danse (Niveau requis) :</strong> {
              event.niveauDanseRequis === 'debutant' ? `🌱 ${t('widgetAgenda.danceLevelDeb') || 'Niveau débutant'}` :
              event.niveauDanseRequis === 'confirme' ? `🏆 ${t('widgetAgenda.danceLevelConfirm') || 'Niveau confirmé'}` :
              `❌ ${t('widgetAgenda.danceLevelNone') || 'Pas de danse'}`
            }</span>
          )}
          {event.type === 'reunion' && event.lienDocument && (
            <span className="truncate">
              📄 <strong>Ordre du jour :</strong> <a href={event.lienDocument} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{event.lienDocument}</a>
            </span>
          )}
          {event.lienSocial && (
            <span className="truncate">
              🔗 <strong>Lien social / Externe :</strong> <a href={event.lienSocial} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{event.lienSocial}</a>
            </span>
          )}
          {event.imageUrl && (
            <div className="mt-3.5 border-2 border-encre-noire rounded-[8px] overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] bg-white max-h-[300px] flex items-center justify-center">
              <img src={event.imageUrl} alt={event.titre} className="max-w-full max-h-[300px] object-contain" />
            </div>
          )}
          {event.lieu && (
            <div className="mt-3.5 border-2 border-encre-noire rounded-[8px] overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] bg-white h-[200px]">
              <iframe
                title="Google Maps"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.lieu)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
            </div>
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
              disabled={saving || isPrestationRestricted || event.status === 'annule'}
              onClick={() => handleStatusChange('present')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'present' 
                  ? 'theme-bg-vert font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                ${(isPrestationRestricted || event.status === 'annule') ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              Présent
            </button>
            
            <button
              type="button"
              disabled={saving || event.status === 'annule'}
              onClick={() => handleStatusChange('absent')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'absent' 
                  ? 'bg-cordel-wood text-cordel-bg-light font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                ${event.status === 'annule' ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              Absent
            </button>

            <button
              type="button"
              disabled={saving || isPrestationRestricted || event.status === 'annule'}
              onClick={() => handleStatusChange('confirm')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'confirm' 
                  ? 'theme-bg-ocre font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-cordel-hover'}
                ${(isPrestationRestricted || event.status === 'annule') ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              À confirmer
            </button>
          </div>

          {/* Cancellation warning message */}
          {event.status === 'annule' && (
            <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
              🚫 Les inscriptions sont fermées car cet événement a été annulé.
            </div>
          )}

          {/* Restriction warning message */}
          {isPrestationRestricted && (
            <div className="text-[11px] font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2.5 rounded border border-dashed border-red-500/30 flex items-center justify-center gap-1.5 mt-1 select-none">
              🚫 Prestation réservée aux musiciens confirmés.
            </div>
          )}

          {/* Conditional Transport Options (Only visible when present) */}
          {status === 'present' && (
            <div className="flex flex-col gap-4 border-t border-dashed border-cordel-master-dark/20 pt-4 mt-2">
              
              {/* Choice of Instrument for Polyvalents or locked notice */}
              {(isInstrumentLocked || (profileData?.instrumentsJoues && profileData.instrumentsJoues.length > 1)) && (
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
                    Choix d'Instrument
                  </h4>
                  {isInstrumentLocked ? (
                    <div className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-2.5 rounded border border-dashed border-blue-500/30 flex items-center justify-center gap-1.5 select-none leading-relaxed">
                      Le Mestre a défini ton instrument pour cette date : {instrumentChoisi}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-left">
                      <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                        Avec quel instrument vas-tu jouer pour cet événement ?
                      </label>
                      <select
                        value={instrumentChoisi}
                        onChange={(e) => setInstrumentChoisi(e.target.value)}
                        disabled={saving}
                        className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                      >
                        {(() => {
                          const options = getMemberInstrumentOptions(profileData);
                          if (instrumentChoisi && !options.includes(instrumentChoisi)) {
                            options.push(instrumentChoisi);
                          }
                          return options.map((inst) => {
                            const pupitreName = getPupitreName(inst);
                            return (
                              <option key={inst} value={inst}>
                                {pupitreName ? `${inst} (${pupitreName})` : inst}
                              </option>
                            );
                          });
                        })()}
                      </select>
                    </div>
                  )}
                  <div className="border-b border-dashed border-cordel-master-dark/20 my-2" />
                </div>
              )}

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

        {/* Action Buttons: Validation & Calendar Sync */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
          <CordelButton 
            variant="ocre" 
            useExtremeBorder={true}
            disabled={saving || event.status === 'annule'}
            type="submit"
            className="flex-1 py-3"
          >
            {saving ? "Validation..." : "Valider mon inscription"}
          </CordelButton>

          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setIsCalendarMenuOpen(!isCalendarMenuOpen)}
              className="w-full py-3 text-xs font-bold uppercase tracking-wider bg-cordel-bg-light text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] hover:bg-cordel-hover active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5 cursor-pointer h-full min-h-[46px]"
            >
              📅 Ajouter à mon agenda
            </button>
            
            {isCalendarMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsCalendarMenuOpen(false)}
                />
                <div className="absolute right-0 bottom-full mb-2 w-full min-w-[180px] bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[3px_3px_0px_0px_#181716] py-1.5 z-50 flex flex-col text-left">
                  <button
                     type="button"
                     onClick={() => {
                       handleAddToGoogleCalendar();
                       setIsCalendarMenuOpen(false);
                     }}
                     className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                  >
                     🔵 Google Agenda
                  </button>
                  <div className="border-t border-dashed border-encre-noire/15 my-0.5" />
                  <button
                     type="button"
                     onClick={() => {
                       handleDownloadIcs();
                       setIsCalendarMenuOpen(false);
                     }}
                     className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                  >
                     🍏 Apple / Outlook (.ics)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>

      {/* 👥 Tableau nominatif des présences */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
          👥 Tableau de présence / Inscriptions
        </h4>

        {/* Grouped by instrument for prestation, repetition, stage, atelier */}
        {(event.type === 'prestation' || event.type === 'repetition' || event.type === 'stage' || event.type === 'atelier') ? (
          Object.keys(presentsByInstrument).length === 0 ? (
            <p className="text-[11px] italic opacity-60">Aucun membre présent pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-2.5 theme-inner-panel p-3.5 rounded text-left">
              {Object.keys(presentsByInstrument).map(inst => {
                const list = presentsByInstrument[inst];
                const isLinked = inst.includes(' + ');
                return (
                  <div key={inst} className="text-xs leading-normal">
                    <strong className="text-cordel-wood block mb-1">
                      🥁 {(() => {
                        const pupitreName = getPupitreName(inst);
                        return pupitreName ? `${inst} (${pupitreName})` : inst;
                      })()} ({list.length})
                      {isLinked && (() => {
                        const count = inst.split(' + ').length;
                        const badgeText = count > 2 
                          ? (t('eventDetails.multiRole') || "Multi-Rôles")
                          : (t('eventDetails.doubleRole') || "Double Rôle");
                        return (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[8px] font-extrabold uppercase border border-amber-600/30 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-sm inline-block select-none leading-none">
                            {badgeText}
                          </span>
                        );
                      })()} :
                    </strong>
                    <div className="flex flex-wrap gap-1.5 items-center pl-4">
                      {list.map(u => (
                        <div key={u.id || `${u.prenom}-${u.nom}`} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                          <XiloAvatar src={u.photoURL} name={`${u.prenom} ${u.nom}`} size={18} />
                          <span>{u.prenom} {u.nom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-3.5 theme-inner-panel p-3.5 rounded text-xs text-left">
            <div>
              <strong className="text-green-600 block border-b border-dashed border-green-500/10 pb-0.5 mb-1">
                ✅ Présents ({(event.inscriptions || []).filter(i => i.status === 'present').length})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'present').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                    </div>
                  );
                })}
                {(event.inscriptions || []).filter(i => i.status === 'present').length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
            <div>
              <strong className="text-red-600 block border-b border-dashed border-red-500/10 pb-0.5 mb-1">
                ❌ Absents ({(event.inscriptions || []).filter(i => i.status === 'absent').length})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'absent').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                    </div>
                  );
                })}
                {(event.inscriptions || []).filter(i => i.status === 'absent').length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
            <div>
              <strong className="text-amber-600 block border-b border-dashed border-amber-500/10 pb-0.5 mb-1">
                ⏳ À confirmer ({(event.inscriptions || []).filter(i => i.status === 'confirm').length})
              </strong>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {(event.inscriptions || []).filter(i => i.status === 'confirm').map(i => {
                  const userInfo = allUsers.find(u => u.id === i.userId) || {};
                  return (
                    <div key={i.userId} className="inline-flex items-center gap-1.5 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded border border-dashed border-encre-noire/10 text-xs font-semibold text-encre-noire">
                      <XiloAvatar src={userInfo.photoURL} name={i.userName} size={18} />
                      <span>{i.userName}</span>
                    </div>
                  );
                })}
                {(event.inscriptions || []).filter(i => i.status === 'confirm').length === 0 && <span className="opacity-60 italic">Aucun</span>}
              </div>
            </div>
          </div>
        )}

        {isAuthorized && (event.inscriptions || []).filter(i => i.status === 'present').length > 0 && (
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left flex flex-col gap-3">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-1">
              🛠️ Gestion des instruments par Mestre
            </h5>
            <div className="flex flex-col gap-2.5 bg-white/40 dark:bg-black/20 p-3 rounded border border-dashed border-encre-noire/15">
              {(event.inscriptions || [])
                .filter(ins => ins.status === 'present')
                .map(ins => {
                  const userInfo = allUsers.find(u => u.id === ins.userId) || {};
                  const memberInstruments = getMemberInstrumentOptions(userInfo);
                  
                  const currentInst = ins.instrumentChoisi || userInfo.instrument || 'Autre';
                  const isLocked = !!ins.instrumentImposeParMestre;

                  return (
                    <div key={ins.userId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-dashed border-encre-noire/10 pb-2 last:border-0 last:pb-0 text-xs">
                      <span className="font-bold text-encre-noire truncate sm:max-w-[180px] flex items-center gap-1.5">
                        <XiloAvatar src={userInfo.photoURL} name={ins.userName} size={20} />
                        <span>{ins.userName}</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={currentInst}
                          onChange={(e) => handleUpdateMemberInstrument(ins.userId, e.target.value, isLocked)}
                          className="theme-input text-[11px] font-bold py-1 bg-cordel-bg-light"
                        >
                          {!memberInstruments.includes(currentInst) && (() => {
                            const pupitreName = getPupitreName(currentInst);
                            return (
                              <option value={currentInst}>
                                {pupitreName ? `${currentInst} (${pupitreName})` : currentInst}
                              </option>
                            );
                          })()}
                          {memberInstruments.map(inst => {
                            const pupitreName = getPupitreName(inst);
                            return (
                              <option key={inst} value={inst}>
                                {pupitreName ? `${inst} (${pupitreName})` : inst}
                              </option>
                            );
                          })}
                        </select>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[10px] uppercase select-none">
                          <input
                            type="checkbox"
                            checked={isLocked}
                            onChange={(e) => handleUpdateMemberInstrument(ins.userId, currentInst, e.target.checked)}
                            className="scale-95 cursor-pointer"
                          />
                          <span>Imposer</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CordelCard>

      {/* 🚗 Frais de déplacement / Convoi (uniquement pour les administrateurs pour prestation, stage & atelier) */}
      {isAuthorized && (event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 select-none">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
            {enableCarpoolReimbursement ? "🚗 Frais de déplacement (Admin)" : "🚗 Covoiturage & Convoi (Admin)"}
          </h4>
          <div className="text-xs flex flex-col gap-2.5 text-left theme-inner-panel p-3.5 rounded">
            {enableCarpoolReimbursement && (
              <>
                <div className="border-b border-dashed border-encre-noire/10 pb-2 mb-1 text-[11px] font-bold text-encre-noire/80">
                  ℹ️ Distance estimée : {event.distanceAllerRetourKm || 0} km A/R - Indemnité prévue : {((event.distanceAllerRetourKm || 0) * indemniteKilometrique).toFixed(2)} €
                </div>
                <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1">
                  <span>Distance A/R :</span>
                  <span>{event.distanceAllerRetourKm || 0} km</span>
                </div>
                <div className="flex justify-between font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
                  <span>Tarif Km :</span>
                  <span>{indemniteKilometrique.toFixed(2)} €/km</span>
                </div>
              </>
            )}

            {/* 1. Catégorie : Convoi / Covoiturage */}
            <div className="mt-2">
              <strong className="text-cordel-wood uppercase text-[10px] tracking-wider block border-b border-dashed border-cordel-master-dark/10 pb-0.5 mb-1.5">
                🚗 Chauffeurs du Convoi ({convoiDrivers.length})
              </strong>
              {convoiDrivers.length === 0 ? (
                <p className="text-[11px] italic opacity-60 pl-2">Aucun conducteur déclaré dans le convoi.</p>
              ) : (
                <div className="flex flex-col gap-1.5 pl-2">
                  {convoiDrivers.map(driver => {
                    const refund = driver.isEligibleRefund ? (event.distanceAllerRetourKm || 0) * indemniteKilometrique : 0;
                    return (
                      <div key={driver.id} className="flex flex-col gap-0.5 border-b border-dashed border-encre-noire/5 pb-1 mb-1 last:border-none">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold">{driver.nom}</span>
                          {enableCarpoolReimbursement && (
                            <span className="font-black text-cordel-wood">
                              {refund > 0 ? `${refund.toFixed(2)} €` : "0.00 €"}
                            </span>
                          )}
                        </div>
                        {enableCarpoolReimbursement && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {driver.isEligibleRefund ? (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-green-100 border border-green-400 text-green-800 px-1.5 py-0.5 rounded select-none">
                                ✅ Complète - Éligible Remboursement
                              </span>
                            ) : (
                              <span className="text-[8px] font-black uppercase tracking-wider bg-neutral-100 border border-neutral-300 text-neutral-600 px-1.5 py-0.5 rounded select-none">
                                ❌ Incomplète - Non éligible
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {enableCarpoolReimbursement && event.distanceAllerRetourKm > 0 && indemniteKilometrique > 0 && (
                    <div className="text-right text-[11px] font-bold text-encre-noire opacity-80 mt-1">
                      Sous-total : {(convoiDrivers.filter(d => d.isEligibleRefund).length * event.distanceAllerRetourKm * indemniteKilometrique).toFixed(2)} €
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Catégorie : Trajets Individuels (Propres Moyens) */}
            <div className="mt-3">
              <strong className="text-cordel-wood uppercase text-[10px] tracking-wider block border-b border-dashed border-cordel-master-dark/10 pb-0.5 mb-1.5">
                🚶 Trajets Individuels / Propres moyens ({individualDrivers.length})
              </strong>
              {individualDrivers.length === 0 ? (
                <p className="text-[11px] italic opacity-60 pl-2">Aucun trajet individuel déclaré.</p>
              ) : (
                <div className="flex flex-col gap-1.5 pl-2">
                  {individualDrivers.map(driver => {
                    const refund = (event.distanceAllerRetourKm || 0) * indemniteKilometrique;
                    return (
                      <div key={driver.id} className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/5 pb-1 mb-1 last:border-none">
                        <span className="font-semibold">{driver.nom}</span>
                        {enableCarpoolReimbursement && (
                          <span className="font-black text-cordel-wood">
                            {refund > 0 ? `${refund.toFixed(2)} €` : "0.00 €"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {enableCarpoolReimbursement && event.distanceAllerRetourKm > 0 && indemniteKilometrique > 0 && (
                    <div className="text-right text-[11px] font-bold text-encre-noire opacity-80 mt-1">
                      Sous-total : {(individualDrivers.length * event.distanceAllerRetourKm * indemniteKilometrique).toFixed(2)} €
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Total Cumulé */}
            {enableCarpoolReimbursement && event.distanceAllerRetourKm > 0 && indemniteKilometrique > 0 && (convoiDrivers.length > 0 || individualDrivers.length > 0) && (
              <div className="border-t border-double border-encre-noire/25 pt-2.5 mt-3 flex justify-between items-center font-black text-sm text-encre-noire">
                <span>Total Général :</span>
                <span className="text-cordel-wood">
                  {((convoiDrivers.filter(d => d.isEligibleRefund).length + individualDrivers.length) * event.distanceAllerRetourKm * indemniteKilometrique).toFixed(2)} €
                </span>
              </div>
            )}
          </div>
        </CordelCard>
      )}

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
                className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-1.5"
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

                {(() => {
                  let targetUrl = '';
                  if (morceau.jsonUrl) {
                    const baseUrl = assocSequenceurUrl || 'https://sequenceur.app';
                    targetUrl = baseUrl.includes('?') 
                      ? `${baseUrl}&file=${encodeURIComponent(morceau.jsonUrl)}`
                      : `${baseUrl}?file=${encodeURIComponent(morceau.jsonUrl)}`;
                  } else if (morceau.sequenceurUrl) {
                    targetUrl = morceau.sequenceurUrl;
                  }

                  if (!targetUrl) return null;

                  return (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                    >
                      🎧 Travailler ce rythme (Séquenceur)
                    </a>
                  );
                })()}
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

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Fichier de configuration du morceau (.json)
                </label>
                <input 
                  key={fileInputKey}
                  type="file"
                  accept=".json"
                  onChange={(e) => setNewMorceauJsonFile(e.target.files[0])}
                  disabled={updatingSetlist}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
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

      {/* 🚗 Convoi & Covoiturage (uniquement prestation, stage et atelier) */}
      {(event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && (
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
                  const status = calculateCarStatus(voiture, { enableCarpoolReimbursement, reimbursementRule });
                  const isUserChauffeur = voiture.chauffeurId === user.uid;
                  const isUserPassager = (voiture.passengers || voiture.passagers || []).some(p => p.uid === user.uid);
                  const passengersList = voiture.passengers || voiture.passagers || [];

                  return (
                    <div 
                      key={voiture.id}
                      className={`border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[2px_2px_0px_0px_#181716] p-3 text-left relative flex flex-col justify-between min-h-[140px] text-xs transition-all ${
                        enableCarpoolReimbursement && status.isFull ? 'bg-green-50/50 border-green-700' : 'bg-cordel-bg'
                      }`}
                    >
                      <div>
                        {/* Chauffeur header */}
                        <div className="flex justify-between items-start font-bold border-b border-dashed border-encre-noire/10 pb-1 mb-1.5">
                          <span className="text-cordel-wood text-sm truncate pr-2">
                            👤 Chauffeur : {voiture.chauffeurNom}
                          </span>
                          <span className="shrink-0 text-encre-noire whitespace-nowrap">
                            🚗 Libres : {status.availableSeats}/{voiture.passengerSeats || 0}
                          </span>
                        </div>

                        {/* Eligibility badge */}
                        {enableCarpoolReimbursement && status.isEligibleForReimbursement && (
                          <div className="mb-2">
                            <span className="inline-block bg-green-100 text-green-800 text-[8px] px-2 py-0.5 rounded font-black border border-green-300 uppercase tracking-wide">
                              {reimbursementRule === 'all_drivers' ? "✅ Éligible Défraiement" : "✅ Complète - Éligible Remboursement"}
                            </span>
                          </div>
                        )}

                        {/* Cargo items */}
                        <div className="flex flex-col gap-1 text-[11px] font-semibold text-encre-noire opacity-90 mb-2">
                          <span className="flex items-center gap-1.5">
                            🥁 <strong className="text-cordel-wood">Coffre (Alfayas) :</strong> {status.alfayasInTrunk}/{voiture.trunkAlfayaCapacity || 0}
                          </span>
                          {status.alfayasOnSeats > 0 && (
                            <span className="flex items-center gap-1.5 text-amber-700">
                              ⚠️ <strong className="text-amber-800">Alfayas sur sièges :</strong> {status.alfayasOnSeats}
                            </span>
                          )}
                          {voiture.materielCharge && (
                            <span className="flex items-center gap-1.5">
                              📦 <strong className="text-cordel-wood">Matériel asso :</strong> {voiture.materielCharge}
                            </span>
                          )}
                        </div>

                        {/* Passengers listing */}
                        {passengersList.length > 0 && (
                          <div className="theme-inner-panel rounded p-1.5 mb-3">
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-60 block mb-0.5">Participants :</span>
                            <ul className="list-disc pl-3 text-[11px] font-bold leading-normal">
                              {passengersList.map((p, idx) => {
                                const details = [];
                                if (p.isPassenger !== false) {
                                  details.push("Passager");
                                } else {
                                  details.push("Instrument seul");
                                }
                                if (p.alfayasCount > 0) {
                                  details.push(`${p.alfayasCount} Alfaya${p.alfayasCount > 1 ? 's' : ''}`);
                                }
                                return (
                                  <li key={idx}>
                                    {p.nom} <span className="text-[9px] font-semibold text-cordel-master-dark/70">({details.join(', ')})</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Action buttons / inline form */}
                      <div className="flex flex-col gap-2 mt-auto">
                        {joiningVoitureId === voiture.id && (
                          <div className="reservation-form mt-2 p-2 bg-white/60 dark:bg-black/20 rounded border border-dashed border-encre-noire/25 text-[11px] font-bold">
                            <label className="flex items-center gap-2 mb-2 select-none cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={joinForm.isPassenger} 
                                onChange={(e) => setJoinForm(prev => ({ ...prev, isPassenger: e.target.checked }))} 
                                className="w-3.5 h-3.5 border border-encre-noire bg-white rounded"
                              />
                              <span>Je monte dans la voiture (1 place)</span>
                            </label>
                            
                            <label className="flex items-center justify-between gap-2">
                              <span>Nombre d'Alfayas transportées :</span>
                              <input 
                                type="number" 
                                min="0" 
                                max="5"
                                value={joinForm.alfayasCount} 
                                onChange={(e) => setJoinForm(prev => ({ ...prev, alfayasCount: Math.max(0, parseInt(e.target.value) || 0) }))}
                                className="theme-input text-xs font-bold py-0.5 px-1.5 w-12 text-center bg-white"
                              />
                            </label>
                            
                            <div className="flex gap-2 justify-end mt-3">
                              <button 
                                type="button"
                                onClick={() => setJoiningVoitureId(null)}
                                className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2 py-1 rounded"
                              >
                                Annuler
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleConfirmJoin(voiture)}
                                className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                              >
                                Confirmer ma place
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-1">
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
                            joiningVoitureId !== voiture.id && (
                              <button
                                type="button"
                                disabled={submittingCovoit}
                                onClick={() => {
                                  setJoiningVoitureId(voiture.id);
                                  setJoinForm({ isPassenger: true, alfayasCount: 0 });
                                }}
                                className="text-[9px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716]"
                              >
                                S'inscrire
                              </button>
                            )
                          )}
                        </div>
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
                  className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-cordel-hover border border-encre-noire px-2 py-1 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]"
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
              <form onSubmit={handleProposerVoiture} className="flex flex-col gap-3 theme-inner-panel p-4 rounded">
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
                      value={voitureForm.passengerSeats}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, passengerSeats: parseInt(e.target.value) || 0 }))}
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
                      type="number"
                      min="0"
                      max="10"
                      value={voitureForm.trunkAlfayaCapacity}
                      onChange={(e) => setVoitureForm(prev => ({ ...prev, trunkAlfayaCapacity: parseInt(e.target.value) || 0 }))}
                      disabled={submittingCovoit}
                      required
                      className="theme-input text-xs font-bold py-1 text-center bg-cordel-bg-light"
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
