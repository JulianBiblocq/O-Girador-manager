import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import ReunionAgendaManager from './ReunionAgendaManager';
import { useTranslation } from './LanguageContext';
import { XiloCalendar, XiloMegaphone } from './XiloIcons';
import XiloAvatar from './XiloAvatar';
const AddressAutocomplete = React.lazy(() => import('./AddressAutocomplete'));
import { calculateRoadDistance } from '../utils/googleMaps';

import { useEventRSVP } from '../hooks/useEventRSVP';
import { useEventCarpool, calculateCarStatus } from '../hooks/useEventCarpool';
import { useEventSetlist } from '../hooks/useEventSetlist';

import EventRSVPSection from './event-details/EventRSVPSection';
import EventCarpoolSection from './event-details/EventCarpoolSection';
import EventSetlistSection from './event-details/EventSetlistSection';
import EventReportSection from './event-details/EventReportSection';
import EventStageLayoutSection from './event-details/EventStageLayoutSection';

export default function EventDetails({ event, user, profileData, onNavigateToView, onClose, onPrev, onNext, viewMode, setViewMode, onGoToStageLayoutEditor }) {
  const { t } = useTranslation();
  const [isCalendarMenuOpen, setIsCalendarMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
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
    imageUrl: event.imageUrl || '',
    montantRecette: event.montantRecette !== undefined ? event.montantRecette.toString() : '',
    montantDepense: event.montantDepense !== undefined ? event.montantDepense.toString() : '',
    dateLimiteInscription: event.dateLimiteInscription || ''
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [indemniteKilometrique, setIndemniteKilometrique] = useState(0);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"]);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [enableCarpoolReimbursement, setEnableCarpoolReimbursement] = useState(true);
  const [reimbursementRule, setReimbursementRule] = useState('full_cars_only');
  const [assocSequenceurUrl, setAssocSequenceurUrl] = useState('');
  const [agendaRequireInstrument, setAgendaRequireInstrument] = useState(false);
  const [agendaEnableMaybeStatus, setAgendaEnableMaybeStatus] = useState(true);
  const [agendaEnableStageLayout, setAgendaEnableStageLayout] = useState(true);
  const [agendaEnableRevisionProgram, setAgendaEnableRevisionProgram] = useState(true);
  const [agendaEnableFinance, setAgendaEnableFinance] = useState(true);
  const [agendaEnableInscriptions, setAgendaEnableInscriptions] = useState(true);
  const [agendaEnableCarpool, setAgendaEnableCarpool] = useState(true);
  const [associationEventTypes, setAssociationEventTypes] = useState(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
  const [eventTypeConfigs, setEventTypeConfigs] = useState({});
  const [associationName, setAssociationName] = useState('');
  const [dressCodes, setDressCodes] = useState([]);

  const isPrestationRestricted = event.type === 'prestation' && event.niveauRequis === 'confirme' && profileData?.niveau !== 'confirme';

  // useEventRSVP hook
  const {
    status,
    setStatus,
    transport,
    setTransport,
    demandeRemboursementKm,
    setDemandeRemboursementKm,
    saving,
    instrumentChoisi,
    setInstrumentChoisi,
    isInstrumentLocked,
    existingResponse,
    selectedManualUserId,
    setSelectedManualUserId,
    selectedManualInstrument,
    setSelectedManualInstrument,
    isManualRegisterOpen,
    setIsManualRegisterOpen,
    savingManualRegistration,
    handleStatusChange,
    handleSave,
    handleValidatePending,
    handleManualRegister,
    handleManualUnregister,
    handleUpdateStatus,
    handleUpdateMemberInstrument,
    handleAddInviteExterne,
    handleRemoveInviteExterne
  } = useEventRSVP(event, user, profileData, allUsers, isPrestationRestricted, setToastMessage);

  // useEventCarpool hook
  const {
    showProposerForm,
    setShowProposerForm,
    voitureForm,
    setVoitureForm,
    joiningVoitureId,
    setJoiningVoitureId,
    joinForm,
    setJoinForm,
    submittingCovoit,
    handleProposerVoiture,
    handleConfirmJoin,
    handleQuitterVoiture,
    handleRetirerVoiture,
    handleToggleRemboursement,
    handleChercherPlace,
    handleAnnulerCherchePlace,
    handleAssignPassenger,
    handleRemovePassenger
  } = useEventCarpool({
    event,
    user,
    profileData,
    demandeRemboursementKm,
    setDemandeRemboursementKm,
    enableCarpoolReimbursement,
    reimbursementRule
  });

  // useEventSetlist hook
  const {
    setlist,
    setSetlist,
    newMorceauTitre,
    setNewMorceauTitre,
    newMorceauJsonFile,
    setNewMorceauJsonFile,
    fileInputKey,
    setFileInputKey,
    newMorceauNotes,
    setNewMorceauNotes,
    updatingSetlist,
    handleAddMorceau,
    handleRemoveMorceau
  } = useEventSetlist(event);

  useEffect(() => {
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
      imageUrl: event.imageUrl || '',
      requiresValidation: event.requiresValidation || false,
      montantRecette: event.montantRecette !== undefined ? event.montantRecette.toString() : '',
      montantDepense: event.montantDepense !== undefined ? event.montantDepense.toString() : '',
      dateLimiteInscription: event.dateLimiteInscription || '',
      tenueRequise: event.tenueRequise || ''
    });
  }, [event.id, event.type, event.montantRecette, event.montantDepense, event.dateLimiteInscription, event.tenueRequise]);

  // Load association settings
  useEffect(() => {
    if (!event.groupId) return;
    const assocRef = doc(db, 'associations', event.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nom) {
          setAssociationName(data.nom);
        }
        setIndemniteKilometrique(data.indemniteKilometrique || 0);
        setAdresseLocal(data.adresseLocal || '');
        setAssocSequenceurUrl(data.sequenceurUrl || '');
        setEnableCarpoolReimbursement(data.enableCarpoolReimbursement !== false);
        setReimbursementRule(data.reimbursementRule || 'full_cars_only');
        setAgendaRequireInstrument(data.agendaRequireInstrument || false);
        setAgendaEnableMaybeStatus(data.agendaEnableMaybeStatus !== false);
        setAgendaEnableStageLayout(data.agendaEnableStageLayout !== false);
        setAgendaEnableRevisionProgram(data.agendaEnableRevisionProgram !== false);
        setAgendaEnableFinance(data.agendaEnableFinance !== false);
        setAgendaEnableInscriptions(data.agendaEnableInscriptions !== false);
        setAgendaEnableCarpool(data.agendaEnableCarpool !== false);
        setEventTypeConfigs(data.eventTypeConfigs || {});
        if (Array.isArray(data.eventTypes) && data.eventTypes.length > 0) {
          setAssociationEventTypes(data.eventTypes);
        } else {
          setAssociationEventTypes(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
        }
        setDressCodes(data.dressCodes || []);
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
  }, [isPrestationRestricted, status, setStatus]);

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
    if (event.tenueRequise) detailsText += `\n👕 Tenue requise : ${event.tenueRequise}`;
    if (event.horairesPassages) detailsText += `\n⏱️ Horaires de passage : ${event.horairesPassages}`;
    if (event.horaireCovoiturage) detailsText += `\n🚗 Covoiturage : ${event.horaireCovoiturage}`;
    if (event.niveauRequis) {
      const musLvl = event.niveauRequis === 'aucun' ? 'Pas de musicien' :
                     event.niveauRequis === 'debutant' ? 'Débutant' :
                     event.niveauRequis === 'confirme' ? 'Confirmé' : 'Tout le monde';
      detailsText += `\n🎯 Niveau requis (Musique) : ${musLvl}`;
    }
    if (event.niveauDanseRequis) {
      const danseLvl = event.niveauDanseRequis === 'aucun' ? 'Pas de danse' :
                       event.niveauDanseRequis === 'debutant' ? 'Débutant' :
                       event.niveauDanseRequis === 'confirme' ? 'Confirmé' : 'Tout le monde';
      detailsText += `\n💃 Danse (Niveau requis) : ${danseLvl}`;
    }
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
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
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

    const prodIdName = (associationName || 'O Girador').replace(/[^a-zA-Z0-9 ]/g, '');
    const cleanUidDomain = (associationName || 'o-girador').toLowerCase().replace(/[^a-z0-9]/g, '-');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//${prodIdName}//Event Calendar//FR`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${event.id || Date.now()}@${cleanUidDomain}`,
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
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!event.id) return;

    const editType = editForm.type || 'repetition';
    const editConfig = eventTypeConfigs[editType] || {
      agendaRequireInstrument,
      agendaEnableMaybeStatus,
      agendaEnableStageLayout,
      agendaEnableRevisionProgram,
      agendaEnableCarpool,
      agendaEnableFinance,
      agendaEnableInscriptions,
      agendaEnableImage: true,
      agendaEnableOrdreDuJour: editType === 'reunion',
      agendaEnableAdresse: true,
      agendaEnableUrl: true
    };

    setSavingEvent(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        titre: editForm.titre,
        type: editForm.type,
        date: editForm.date,
        dateFin: editForm.dateFin || '',
        lieu: editConfig.agendaEnableAdresse ? editForm.lieu || '' : '',
        horairesPassages: (editForm.type === 'prestation') ? editForm.horairesPassages || '' : '',
        horaireCovoiturage: editConfig.agendaEnableCarpool ? editForm.horaireCovoiturage || '' : '',
        niveauRequis: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') ? editForm.niveauRequis || 'tous' : 'tous',
        niveauDanseRequis: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') ? editForm.niveauDanseRequis || 'aucun' : 'aucun',
        lienDocument: editConfig.agendaEnableOrdreDuJour ? editForm.lienDocument || '' : '',
        distanceAllerRetourKm: editConfig.agendaEnableCarpool ? (parseFloat(editForm.distanceAllerRetourKm) || 0) : 0,
        lienSocial: editConfig.agendaEnableUrl ? editForm.lienSocial || '' : '',
        imageUrl: editConfig.agendaEnableImage ? editForm.imageUrl || '' : '',
        requiresValidation: editConfig.agendaEnableInscriptions ? (editForm.requiresValidation || false) : false,
        montantRecette: editConfig.agendaEnableFinance ? (parseFloat(editForm.montantRecette) || 0) : 0,
        montantDepense: editConfig.agendaEnableFinance ? (parseFloat(editForm.montantDepense) || 0) : 0,
        dateLimiteInscription: editConfig.agendaEnableInscriptions ? editForm.dateLimiteInscription || '' : '',
        tenueRequise: editForm.tenueRequise || ''
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

  const handleDeleteEvent = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cet événement ?")) {
      return;
    }
    setSavingEvent(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await deleteDoc(eventRef);
      alert("Événement supprimé avec succès !");
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("EventDetails - Erreur de suppression événement :", err);
      alert("Erreur lors de la suppression de l'événement.");
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storagePath = `documents/${event.groupId}/events/${Date.now()}_${file.name}`;
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

  // Group presents by instrument for grouped presence list display
  const presentsByInstrument = {};
  if (event.inscriptions && event.inscriptions.length > 0) {
    event.inscriptions.forEach((ins) => {
      if (ins.status === 'present') {
        const userInfo = allUsers.find(u => u.id === ins.userId) || { id: ins.userId, prenom: ins.userName, nom: '', instrument: 'Autre' };
        const inst = ins.instrumentChoisi || userInfo.instrument || 'Autre';
        if (!presentsByInstrument[inst]) {
          presentsByInstrument[inst] = [];
        }
        presentsByInstrument[inst].push({
          ...userInfo,
          isInvite: false
        });
      }
    });
  }

  // Add external guests to grouped presence list
  if (event.invitesExternes && event.invitesExternes.length > 0) {
    event.invitesExternes.forEach((invite) => {
      const inst = invite.instrument || invite.fonction || 'Autre';
      if (!presentsByInstrument[inst]) {
        presentsByInstrument[inst] = [];
      }
      presentsByInstrument[inst].push({
        id: invite.id,
        prenom: invite.nom,
        nom: '',
        instrument: inst,
        photoURL: null,
        isInvite: true
      });
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

  const dateLimiteObj = event.dateLimiteInscription ? new Date(event.dateLimiteInscription) : null;
  const hasDateLimite = dateLimiteObj && !isNaN(dateLimiteObj.getTime());
  const formattedDateLimite = hasDateLimite
    ? dateLimiteObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const formattedTimeLimite = hasDateLimite
    ? dateLimiteObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isRegistrationDeadlinePassed = event.dateLimiteInscription
    ? new Date(event.dateLimiteInscription) < new Date()
    : false;

  const typeVariants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };

  const currentVariant = typeVariants[event.type] || 'default';

  const eventType = event.type || 'repetition';
  const currentConfig = eventTypeConfigs[eventType] || {
    agendaRequireInstrument,
    agendaEnableMaybeStatus,
    agendaEnableStageLayout,
    agendaEnableRevisionProgram,
    agendaEnableCarpool,
    agendaEnableFinance,
    agendaEnableInscriptions,
    agendaEnableImage: true,
    agendaEnableOrdreDuJour: eventType === 'reunion',
    agendaEnableAdresse: true,
    agendaEnableUrl: true
  };

  const editType = editForm.type || 'repetition';
  const editConfig = eventTypeConfigs[editType] || {
    agendaRequireInstrument,
    agendaEnableMaybeStatus,
    agendaEnableStageLayout,
    agendaEnableRevisionProgram,
    agendaEnableCarpool,
    agendaEnableFinance,
    agendaEnableInscriptions,
    agendaEnableImage: true,
    agendaEnableOrdreDuJour: editType === 'reunion',
    agendaEnableAdresse: true,
    agendaEnableUrl: true
  };

  const unregisteredUsers = allUsers
    .filter(u => u.prenom && !(event.inscriptions || []).some(ins => ins.userId === u.id))
    .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full relative">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#84967a] text-encre-noire border-2 border-encre-noire px-5 py-3 rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_#181716] font-bold text-xs uppercase tracking-wider animate-bounce select-none">
          {toastMessage}
        </div>
      )}
      {/* Header with back button, modifier button & navigation arrows */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2 select-none gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
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
          {setViewMode && (
            <div className="flex border border-encre-noire rounded-[4px_6px_3px_5px] overflow-hidden bg-cordel-bg shadow-[1px_1px_0px_0px_#181716] select-none text-[8px] font-black uppercase ml-1 sm:ml-2">
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
              <XiloMegaphone size={12} /> Préparer la publication
            </button>
            <button
              type="button"
              onClick={() => setIsEditingEvent(true)}
              className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer"
            >
              ✏️ Modifier
            </button>
            <CordelButton
              type="button"
              variant="rouge"
              onClick={handleDeleteEvent}
              className="text-[10px] px-3 py-1.5 uppercase font-black flex items-center gap-1"
            >
              🗑️ Supprimer
            </CordelButton>
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
                {associationEventTypes.map(type => (
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

              {/* Date limite d'inscription (optionnel) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {t('eventDetails.dateLimiteInscriptionLabel') || "Date limite d'inscription (optionnel)"}
                </label>
                <input
                  type="datetime-local"
                  value={editForm.dateLimiteInscription || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dateLimiteInscription: e.target.value }))}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50"
                />
              </div>

              {/* Lieu (Adresse) */}
              {editConfig.agendaEnableAdresse && (
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
                      value={editForm.lieu}
                      onChange={async (e) => {
                        const newLieu = e.target.value;
                        setEditForm(prev => ({ ...prev, lieu: newLieu }));
                        if (adresseLocal && newLieu) {
                          try {
                            const distanceKm = await calculateRoadDistance(adresseLocal, newLieu);
                            const distanceRoundTrip = Math.round(distanceKm * 2);
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
                  </React.Suspense>
                  {!adresseLocal && (
                    <span className="text-[9px] text-orange-600 font-bold leading-none mt-1 select-none">
                      ⚠️ Adresse du local non configurée dans les paramètres de l'association (calcul de distance inactif).
                    </span>
                  )}
                </div>
              )}

              {/* Distance A/R (Covoiturage) */}
              {editConfig.agendaEnableCarpool && (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'atelier') && (
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

                  {editConfig.agendaEnableCarpool && (
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
                </>
              )}

              {/* Stage & Atelier specific fields */}
              {editConfig.agendaEnableCarpool && (editForm.type === 'stage' || editForm.type === 'atelier') && (
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

              {/* Musique & Danse selectors */}
              {(editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') && (
                <>
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
                      <option value="aucun">{t('widgetAgenda.levelNone') || "Pas de musicien"}</option>
                      <option value="debutant">{t('widgetAgenda.levelDeb') || "Niveau débutant"}</option>
                      <option value="confirme">{t('widgetAgenda.levelConfirm') || "Niveau confirmé"}</option>
                      <option value="tous">{t('widgetAgenda.levelAll') || "Tout le monde"}</option>
                    </select>
                  </div>

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
                      <option value="tous">{t('widgetAgenda.danceLevelAll') || "Tout le monde"}</option>
                    </select>
                  </div>
                </>
              )}

              {/* Tenue requise */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Tenue requise / Dress Code (Optionnel)
                </label>
                <select
                  value={editForm.tenueRequise || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tenueRequise: e.target.value }))}
                  disabled={savingEvent}
                  className="theme-input w-full disabled:opacity-50 font-bold bg-cordel-bg-light"
                >
                  <option value="">-- Aucune tenue spécifiée --</option>
                  {dressCodes.map(dc => (
                    <option key={dc.id} value={dc.name}>{dc.name} ({dc.included})</option>
                  ))}
                </select>
              </div>

              {/* Ordre du jour */}
              {editConfig.agendaEnableOrdreDuJour && (
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

              {/* Lien réseau social */}
              {editConfig.agendaEnableUrl && (
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
              )}

              {/* Image de l'événement */}
              {editConfig.agendaEnableImage && (
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
              )}

              {/* Finances (Optionnel) */}
              {editConfig.agendaEnableFinance && (
                <div className="flex flex-col gap-3 pt-3 border-t border-dashed border-cordel-master-dark/15">
                  <h5 className="text-[10px] uppercase font-black tracking-widest text-cordel-wood">
                    Finances (Optionnel)
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Revenus de l'événement (Prestation payée, etc.)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editForm.montantRecette}
                        onChange={(e) => setEditForm(prev => ({ ...prev, montantRecette: e.target.value }))}
                        disabled={savingEvent}
                        placeholder="Ex : 500"
                        className="theme-input w-full disabled:opacity-50"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                        Coûts de l'événement (Location, professeur...)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editForm.montantDepense}
                        onChange={(e) => setEditForm(prev => ({ ...prev, montantDepense: e.target.value }))}
                        disabled={savingEvent}
                        placeholder="Ex : 150"
                        className="theme-input w-full disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Toggle */}
              {editConfig.agendaEnableInscriptions && (
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-cordel-master-dark/15">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editForm.requiresValidation || false}
                      onChange={(e) => setEditForm(prev => ({ ...prev, requiresValidation: e.target.checked }))}
                      disabled={savingEvent}
                      className="accent-cordel-wood scale-105"
                    />
                    <span>Inscriptions soumises à validation par l'administrateur</span>
                  </label>
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
            <CordelButton
              type="button"
              variant="rouge"
              useExtremeBorder={true}
              disabled={savingEvent}
              onClick={handleDeleteEvent}
              className="w-full mt-3 py-3 text-xs font-bold uppercase tracking-widest"
            >
              {savingEvent ? "Suppression..." : "🗑️ Supprimer l'événement"}
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
            <h3 className="font-bold text-lg leading-tight mt-0.5 mb-2 px-4">{event.titre}</h3>
            <p className="text-xs font-semibold leading-relaxed px-4">
              {hasDateFin ? (
                <span>📅 Du {formattedDate} {formattedTime ? `à ${formattedTime}` : ''} au {formattedDateFin} {formattedTimeFin ? `à ${formattedTimeFin}` : ''}</span>
              ) : (
                <span>📅 {formattedDate} {formattedTime ? `à ${formattedTime}` : ''}</span>
              )}
            </p>

            <div className="mt-3 pt-2.5 border-t border-dashed border-encre-noire/15 text-xs flex flex-col gap-1 font-semibold leading-relaxed px-4">
              {currentConfig.agendaEnableInscriptions && event.dateLimiteInscription && (
                <span className={isRegistrationDeadlinePassed ? "text-red-600 dark:text-red-400 font-extrabold" : "text-amber-700 dark:text-amber-400"}>
                  🔒 <strong>Date limite d'inscription :</strong> {formattedDateLimite} {formattedTimeLimite ? `à ${formattedTimeLimite}` : ''}
                  {isRegistrationDeadlinePassed && " (Closes)"}
                </span>
              )}
              {event.tenueRequise && (
                <span className="flex items-center gap-1.5 text-cordel-wood font-extrabold bg-amber-50/50 dark:bg-black/25 px-2 py-1.5 rounded border border-dashed border-cordel-master-dark/15 select-none mt-1 w-fit">
                  👕 <strong>Tenue requise :</strong> {event.tenueRequise}
                </span>
              )}
              {currentConfig.agendaEnableAdresse && event.lieu && (
                <span>📍 <strong>Lieu :</strong> {event.lieu}</span>
              )}
              {event.type === 'prestation' && event.horairesPassages && (
                <span>⏱️ <strong>Horaires de passage :</strong> {event.horairesPassages}</span>
              )}
              {currentConfig.agendaEnableCarpool && (event.type === 'prestation' || event.type === 'stage' || event.type === 'atelier') && event.horaireCovoiturage && (
                <span>🚗 <strong>Horaire de convoi :</strong> {event.horaireCovoiturage}</span>
              )}
              {(event.type === 'prestation' || event.type === 'stage' || event.type === 'repetition' || event.type === 'atelier') && (
                <span>🎯 <strong>Niveau requis (Musique) :</strong> {
                  event.niveauRequis === 'aucun' ? 'Pas de musicien' :
                  event.niveauRequis === 'debutant' ? `🌱 ${t('widgetAgenda.levelDeb') || 'Niveau débutant'}` :
                  event.niveauRequis === 'confirme' ? `🏆 ${t('widgetAgenda.levelConfirm') || 'Niveau confirmé'}` :
                  `👥 ${t('widgetAgenda.levelAll') || 'Tout le monde'}`
                }</span>
              )}
              {(event.type === 'prestation' || event.type === 'stage' || event.type === 'repetition' || event.type === 'atelier') && (
                <span>💃 <strong>Danse (Niveau requis) :</strong> {
                  event.niveauDanseRequis === 'debutant' ? `🌱 ${t('widgetAgenda.danceLevelDeb') || 'Niveau débutant'}` :
                  event.niveauDanseRequis === 'confirme' ? `🏆 ${t('widgetAgenda.danceLevelConfirm') || 'Niveau confirmé'}` :
                  event.niveauDanseRequis === 'tous' ? `👥 ${t('widgetAgenda.danceLevelAll') || 'Tout le monde'}` :
                  `❌ ${t('widgetAgenda.danceLevelNone') || 'Pas de danse'}`
                }</span>
              )}
              {currentConfig.agendaEnableOrdreDuJour && event.lienDocument && (
                <span className="truncate">
                  📄 <strong>Ordre du jour :</strong> <a href={event.lienDocument} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{event.lienDocument}</a>
                </span>
              )}
              {currentConfig.agendaEnableUrl && event.lienSocial && (
                <span className="truncate">
                  🔗 <strong>Lien social / Externe :</strong> <a href={event.lienSocial} target="_blank" rel="noopener noreferrer" className="text-cordel-wood hover:underline">{event.lienSocial}</a>
                </span>
              )}
              {currentConfig.agendaEnableImage && event.imageUrl && (
                <div className="mt-3.5 border-2 border-encre-noire rounded-[8px] overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] bg-white max-h-[300px] flex items-center justify-center">
                  <img src={event.imageUrl} alt={event.titre} className="max-w-full max-h-[300px] object-contain" />
                </div>
              )}
              {currentConfig.agendaEnableAdresse && event.lieu && (
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

          {isAuthorized && agendaEnableFinance && ((event.montantRecette && event.montantRecette > 0) || (event.montantDepense && event.montantDepense > 0)) && (
            <CordelCard variant="default" useExtremeBorder={true} className="py-4 mt-4 text-left border-dashed border-cordel-master-dark/40">
              <div className="px-4">
                <h4 className="text-xs uppercase tracking-widest font-black text-cordel-wood mb-2 flex items-center gap-1.5 font-sans">
                  💰 Bilan financier de l'événement (Admin)
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {event.montantRecette > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-cordel-master-dark">Revenus de l'événement</span>
                      <span className="text-sm font-black text-green-700">{event.montantRecette} €</span>
                    </div>
                  )}
                  {event.montantDepense > 0 && (
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-cordel-master-dark">Coûts de l'événement</span>
                      <span className="text-sm font-black text-red-700">{event.montantDepense} €</span>
                    </div>
                  )}
                </div>
                {event.montantRecette > 0 && event.montantDepense > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-dashed border-encre-noire/15 flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-cordel-master-dark">Bilan net</span>
                    <span className={`text-xs font-black ${event.montantRecette - event.montantDepense >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {event.montantRecette - event.montantDepense >= 0 ? '+' : ''}{event.montantRecette - event.montantDepense} €
                    </span>
                  </div>
                )}
              </div>
            </CordelCard>
          )}

          {currentConfig.agendaEnableInscriptions && (
            <EventRSVPSection
              event={event}
              user={user}
              profileData={profileData}
              status={status}
              saving={saving}
              isPrestationRestricted={isPrestationRestricted}
              existingResponse={existingResponse}
              instrumentChoisi={instrumentChoisi}
              setInstrumentChoisi={setInstrumentChoisi}
              isInstrumentLocked={isInstrumentLocked}
              transport={transport}
              demandeRemboursementKm={demandeRemboursementKm}
              isCalendarMenuOpen={isCalendarMenuOpen}
              setIsCalendarMenuOpen={setIsCalendarMenuOpen}
              handleStatusChange={handleStatusChange}
              handleSave={handleSave}
              handleAddToGoogleCalendar={handleAddToGoogleCalendar}
              handleDownloadIcs={handleDownloadIcs}
              getMemberInstrumentOptions={getMemberInstrumentOptions}
              getPupitreName={getPupitreName}
              presentsByInstrument={presentsByInstrument}
              allUsers={allUsers}
              isAuthorized={isAuthorized}
              handleValidatePending={handleValidatePending}
              handleUpdateMemberInstrument={handleUpdateMemberInstrument}
              isManualRegisterOpen={isManualRegisterOpen}
              setIsManualRegisterOpen={setIsManualRegisterOpen}
              unregisteredUsers={unregisteredUsers}
              selectedManualUserId={selectedManualUserId}
              setSelectedManualUserId={setSelectedManualUserId}
              selectedManualInstrument={selectedManualInstrument}
              setSelectedManualInstrument={setSelectedManualInstrument}
              savingManualRegistration={savingManualRegistration}
              handleManualRegister={handleManualRegister}
              handleManualUnregister={handleManualUnregister}
              isRegistrationDeadlinePassed={isRegistrationDeadlinePassed}
              t={t}
              agendaRequireInstrument={currentConfig.agendaRequireInstrument}
              agendaEnableMaybeStatus={currentConfig.agendaEnableMaybeStatus}
              handleAddInviteExterne={handleAddInviteExterne}
              handleRemoveInviteExterne={handleRemoveInviteExterne}
              instrumentsDisponibles={instrumentsDisponibles}
            />
          )}

          {currentConfig.agendaEnableStageLayout && (
            <EventStageLayoutSection
              event={event}
              user={user}
              profileData={profileData}
              allUsers={allUsers}
              isAuthorized={isAuthorized}
              t={t}
              readOnly={true}
              onGoToStageLayoutEditor={onGoToStageLayoutEditor}
            />
          )}

          {currentConfig.agendaEnableCarpool && (
            <EventCarpoolSection
              event={event}
              user={user}
              profileData={profileData}
              isAuthorized={isAuthorized}
              enableCarpoolReimbursement={enableCarpoolReimbursement}
              indemniteKilometrique={indemniteKilometrique}
              convoiDrivers={convoiDrivers}
              individualDrivers={individualDrivers}
              submittingCovoit={submittingCovoit}
              joiningVoitureId={joiningVoitureId}
              setJoiningVoitureId={setJoiningVoitureId}
              joinForm={joinForm}
              setJoinForm={setJoinForm}
              demandeRemboursementKm={demandeRemboursementKm}
              handleToggleRemboursement={handleToggleRemboursement}
              handleRetirerVoiture={handleRetirerVoiture}
              handleQuitterVoiture={handleQuitterVoiture}
              handleConfirmJoin={handleConfirmJoin}
              handleChercherPlace={handleChercherPlace}
              handleAnnulerCherchePlace={handleAnnulerCherchePlace}
              showProposerForm={showProposerForm}
              setShowProposerForm={setShowProposerForm}
              voitureForm={voitureForm}
              setVoitureForm={setVoitureForm}
              handleProposerVoiture={handleProposerVoiture}
              reimbursementRule={reimbursementRule}
              handleAssignPassenger={handleAssignPassenger}
              handleRemovePassenger={handleRemovePassenger}
            />
          )}

          {event.type !== 'reunion' && event.type !== 'atelier' && currentConfig.agendaEnableRevisionProgram && (
            <EventSetlistSection
              setlist={setlist}
              isAuthorized={isAuthorized}
              updatingSetlist={updatingSetlist}
              handleRemoveMorceau={handleRemoveMorceau}
              assocSequenceurUrl={assocSequenceurUrl}
              handleAddMorceau={handleAddMorceau}
              newMorceauTitre={newMorceauTitre}
              setNewMorceauTitre={setNewMorceauTitre}
              fileInputKey={fileInputKey}
              setNewMorceauJsonFile={setNewMorceauJsonFile}
              newMorceauNotes={newMorceauNotes}
              setNewMorceauNotes={setNewMorceauNotes}
            />
          )}

          {/* 💡 Reunion Specific Ordre du Jour & PDF minutes report manager */}
          {currentConfig.agendaEnableOrdreDuJour && (
            <>
              <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20">
                <ReunionAgendaManager 
                  event={event}
                  user={user}
                  profileData={profileData}
                />
              </div>
              <div className="mt-6 pt-6 border-t border-dashed border-cordel-master-dark/20">
                <EventReportSection 
                  event={event}
                  user={user}
                  profileData={profileData}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
