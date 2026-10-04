import { useState, useEffect, useMemo, useRef } from 'react';
import { doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useFamilyMembers } from './useFamilyMembers';
import useConfirm from './useConfirm';
import { cleanFirestorePayload } from '../utils/firestoreUtils';
import { notifyMembersByTag } from '../utils/inAppNotificationService';
import {
  inspectDriverCarpoolSituation,
  buildDriverDepartureWarningMessage,
  applyCarpoolAbsenceCascade
} from '../utils/carpoolCascadeUtils';

/**
 * Vérifie si les inscriptions sont closes pour un événement.
 * 
 * Règles :
 * 1. Si dateLimiteInscription est renseignée : les inscriptions se ferment au passage de cette date.
 *    (Supporte le format YYYY-MM-DD jusqu'à 23h59:59 ou un format datetime ISO).
 * 2. Si dateLimiteInscription n'est pas renseignée : les inscriptions restent modifiables librement
 *    jusqu'à l'heure de début de l'événement (event.date ou event.dateDebut).
 * 
 * @param {Object|string} eventOrDeadline Objet event ou chaîne dateLimiteInscription
 * @param {string} [fallbackEventStart] Date de début de l'événement si le premier argument est une chaîne
 * @returns {boolean} true si la date limite / heure de début est dépassée, false sinon
 */
export const checkRegistrationDeadlinePassed = (eventOrDeadline, fallbackEventStart = null) => {
  let deadline = null;
  let eventStart = null;

  if (eventOrDeadline && typeof eventOrDeadline === 'object') {
    deadline = eventOrDeadline.dateLimiteInscription;
    eventStart = eventOrDeadline.date || eventOrDeadline.dateDebut;
  } else {
    deadline = eventOrDeadline;
    eventStart = fallbackEventStart;
  }

  // 1. Date limite d'inscription explicite
  if (deadline) {
    const deadlineDate = (typeof deadline === 'string' && deadline.length === 10)
      ? new Date(`${deadline}T23:59:59`)
      : new Date(deadline);
    if (!isNaN(deadlineDate.getTime())) {
      return new Date() > deadlineDate;
    }
  }

  // 2. Absence de date limite : libre jusqu'à l'heure de début de l'événement
  if (eventStart) {
    const startDate = new Date(eventStart);
    if (!isNaN(startDate.getTime())) {
      return new Date() > startDate;
    }
  }

  return false;
};

export function useEventRSVP(event, user, profileData, allUsers, isMusicLevelRestricted, setToastMessage) {
  const { confirm } = useConfirm();
  const existingResponse = (event?.inscriptions || []).find(ins => ins.userId === user?.uid);

  // Référence pour le timer d'alerte toast et nettoyage au démontage
  const toastTimeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Déclencheur sécurisé des notifications toast
  const triggerToast = (msg) => {
    if (!setToastMessage) return;
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const [status, setStatus] = useState(() => existingResponse 
    ? (existingResponse.status === 'pending' || existingResponse.status === 'refused' ? 'present' : existingResponse.status) 
    : 'confirm');
  
  const getInitialTransport = () => {
    if (!existingResponse?.transport) return 'autonome';
    const t = existingResponse.transport;
    if (t === 'cherche' || t === 'cherche_place') return 'cherche_place';
    if (t === 'propose' || t === 'propose_voiture') return 'propose_voiture';
    return 'autonome';
  };
  const [transport, setTransport] = useState(getInitialTransport());
  const [demandeRemboursementKm, setDemandeRemboursementKm] = useState(existingResponse ? existingResponse.demandeRemboursementKm === true : false);
  const [besoinTransportInstrument, setBesoinTransportInstrument] = useState(existingResponse ? existingResponse.besoinTransportInstrument === true : false);
  const [saving, setSaving] = useState(false);

  const [instrumentChoisi, setInstrumentChoisi] = useState(() => {
    if (existingResponse?.instrumentChoisi) {
      return existingResponse.instrumentChoisi;
    }
    if (profileData?.pratiqueDanse === true && !profileData?.pratiquePercussion) {
      return 'Danse';
    }
    return profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre';
  });

  const isInstrumentLocked = !!existingResponse?.instrumentImposeParMestre;

  const [selectedManualUserId, setSelectedManualUserId] = useState('');
  const [selectedManualInstrument, setSelectedManualInstrument] = useState('');
  const [isManualRegisterOpen, setIsManualRegisterOpen] = useState(false);
  const [savingManualRegistration, setSavingManualRegistration] = useState(false);

  // Récupération des membres de la famille (ayants droit rattachés au parent)
  const { dependents } = useFamilyMembers(user, profileData?.groupId);

  // Liste de tous les membres gérables de la famille (Parent + Dépendants)
  const familyMembers = useMemo(() => {
    if (!user?.uid) return [];
    const parentMember = {
      id: user.uid,
      prenom: profileData?.prenom || '',
      nom: profileData?.nom || '',
      isParent: true,
      isDependent: false,
      instrument: profileData?.instrument || '',
      instrumentsJoues: profileData?.instrumentsJoues || [],
      niveauMusique: profileData?.niveauMusique || profileData?.niveau || 'aucun',
      niveauDanse: profileData?.niveauDanse || 'aucun'
    };
    return [parentMember, ...(dependents || [])];
  }, [user?.uid, profileData?.prenom, profileData?.nom, profileData?.instrument, profileData?.instrumentsJoues, profileData?.niveauMusique, profileData?.niveau, profileData?.niveauDanse, dependents]);

  // État des réponses d'inscription famille : { [memberId]: { selected, status, instrumentChoisi } }
  const [familyResponses, setFamilyResponses] = useState({});

  useEffect(() => {
    const initial = {};
    (familyMembers || []).forEach(m => {
      const resp = (event?.inscriptions || []).find(ins => ins.userId === m.id);
      const isSelected = !!resp && resp.status !== 'absent';
      const mStatus = resp 
        ? (resp.status === 'pending' || resp.status === 'refused' ? 'present' : resp.status) 
        : (m.isParent ? status : 'absent');
      const isDanseOnly = m.pratiqueDanse === true && !m.pratiquePercussion;
      const defaultInst = isDanseOnly ? 'Danse' : (m.instrument || (m.instrumentsJoues?.[0]) || 'Autre');
      const mInst = resp?.instrumentChoisi || defaultInst;

      initial[m.id] = {
        selected: isSelected,
        status: mStatus,
        instrumentChoisi: mInst
      };
    });
    setFamilyResponses(initial);
  }, [event?.id, event?.inscriptions, familyMembers, status]);

  // Synchroniser state with event/user changes for main parent
  useEffect(() => {
    const resp = (event?.inscriptions || []).find(ins => ins.userId === user?.uid);
    setStatus(resp 
      ? (resp.status === 'pending' || resp.status === 'refused' ? 'present' : resp.status) 
      : 'confirm');
    
    if (resp?.transport) {
      const t = resp.transport;
      if (t === 'cherche' || t === 'cherche_place') setTransport('cherche_place');
      else if (t === 'propose' || t === 'propose_voiture') setTransport('propose_voiture');
      else setTransport('autonome');
    } else {
      setTransport('autonome');
    }

    setDemandeRemboursementKm(resp ? resp.demandeRemboursementKm === true : false);
    setBesoinTransportInstrument(resp ? resp.besoinTransportInstrument === true : false);
    setInstrumentChoisi(resp?.instrumentChoisi || profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre');
  }, [event?.id, user?.uid, profileData?.instrument, profileData?.instrumentsJoues, event?.inscriptions]);

  const handleSave = async (e, overrideStatus = null, overrideOptions = {}) => {
    if (e && e.preventDefault) e.preventDefault();
    if (event?.status === 'annule') {
      alert("Les inscriptions sont désactivées car l'événement est annulé.");
      return;
    }
    if (!event?.id) return;
    setSaving(true);

    const isRegistrationDeadlinePassed = checkRegistrationDeadlinePassed(event);
    const isAuthorized = profileData?.role === 'mestre' ||
      profileData?.role === 'super-admin' ||
      profileData?.role === 'admin' ||
      profileData?.role === 'bureau' ||
      profileData?.role === 'ca' ||
      profileData?.isSystemAdmin === true ||
      (profileData?.tags || []).some(t => ['bureau', 'admin', 'direction', 'organisateur', 'ca'].includes(t?.toLowerCase?.()));

    const targetStatus = overrideStatus !== null ? overrideStatus : status;

    if (isRegistrationDeadlinePassed && !isAuthorized) {
      if (targetStatus === 'absent' && existingResponse?.status === 'present') {
        return handleLateCancellation(overrideOptions.messageText || '');
      }
      if (targetStatus === 'present' && existingResponse?.status !== 'present') {
        return handleLateRegistration({
          message: overrideOptions.messageText || '',
          instrumentChoisi: overrideOptions.instrumentChoisi
        });
      }
      alert("Les inscriptions pour cet événement sont closes.");
      setSaving(false);
      return;
    }

    if (isMusicLevelRestricted && targetStatus !== 'absent') {
      alert("🔒 Inscription restreinte. Rendez-vous dans la section 'Discussions et questions logistiques' en bas de page pour échanger avec l'organisation.");
      setSaving(false);
      return;
    }

    const defaultInstrument = profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre';
    const targetInstrument = (overrideOptions.instrumentChoisi !== undefined && overrideOptions.instrumentChoisi !== null)
      ? overrideOptions.instrumentChoisi
      : (instrumentChoisi || defaultInstrument);
    const targetTransport = overrideOptions.transport !== undefined ? overrideOptions.transport : transport;
    const targetDemandeRemb = overrideOptions.demandeRemboursementKm !== undefined ? overrideOptions.demandeRemboursementKm : demandeRemboursementKm;
    const targetBesoinTransp = overrideOptions.besoinTransportInstrument !== undefined ? overrideOptions.besoinTransportInstrument : besoinTransportInstrument;

    // Vérification préventive pour les conducteurs avec passagers ou instruments tiers lors du passage à Absent
    if (targetStatus === 'absent' && user?.uid) {
      const situation = inspectDriverCarpoolSituation(event, user.uid);
      if (situation.isDriver && situation.hasThirdParty) {
        const warningMsg = buildDriverDepartureWarningMessage(situation);
        const isConfirmed = await confirm({
          title: "Passagers dans votre véhicule",
          message: warningMsg,
          confirmText: "Confirmer l'absence",
          cancelText: "Annuler",
          variant: "warning"
        });
        if (!isConfirmed) {
          // Annulation : rétablir le statut d'origine et stopper l'opération
          if (existingResponse?.status) {
            setStatus(existingResponse.status === 'pending' || existingResponse.status === 'refused' ? 'present' : existingResponse.status);
          }
          setSaving(false);
          return;
        }
      }
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      const memberName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Membre';
      const finalStatus = (targetStatus === 'present' && event.requiresValidation) ? 'pending' : targetStatus;

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) {
          throw new Error("L'événement n'existe plus !");
        }

        const freshEvent = eventDocSnap.data();
        const currentInscriptions = freshEvent.inscriptions || [];
        const currentCovoit = freshEvent.covoiturage || { voitures: [], recherchePlace: [] };

        let finalInscriptions = [];
        let finalCovoit = currentCovoit;

        if (targetStatus === 'absent') {
          // Cascade automatique de nettoyage covoiturage (libération passager, retrait voiture, bascule passagers/instruments orphelins)
          const cascade = applyCarpoolAbsenceCascade(currentCovoit, currentInscriptions, user.uid);
          finalCovoit = cascade.updatedCovoiturage;
          finalInscriptions = cascade.updatedInscriptions;

          const existingIdx = finalInscriptions.findIndex(ins => ins.userId === user.uid);
          const absentEntry = {
            userId: user.uid,
            userName: memberName,
            status: finalStatus,
            transport: null,
            places: 0,
            instruments: "",
            instrumentChoisi: null,
            instrumentImposeParMestre: false,
            demandeRemboursementKm: false,
            besoinTransportInstrument: false
          };
          if (existingIdx >= 0) {
            finalInscriptions[existingIdx] = {
              ...finalInscriptions[existingIdx],
              ...absentEntry
            };
          } else {
            finalInscriptions.push(absentEntry);
          }
        } else {
          // Statut Présent ou À confirmer
          finalInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);
          const newResponse = {
            userId: user.uid,
            userName: memberName,
            status: finalStatus,
            transport: targetStatus === 'present' ? targetTransport : null,
            places: 0,
            instruments: "",
            instrumentChoisi: targetStatus === 'present' ? targetInstrument : null,
            instrumentImposeParMestre: targetStatus === 'present' ? isInstrumentLocked : false,
            demandeRemboursementKm: (targetStatus === 'present' && targetTransport === 'propose_voiture') ? targetDemandeRemb : false,
            besoinTransportInstrument: targetStatus === 'present' ? targetBesoinTransp : false
          };
          finalInscriptions.push(newResponse);

          // Gestion de la file d'attente recherchePlace
          let recherchePlace = [...(currentCovoit.recherchePlace || [])];
          if (targetStatus === 'present' && targetTransport === 'cherche_place') {
            const existingIdx = recherchePlace.findIndex(p => p.uid === user.uid);
            if (existingIdx >= 0) {
              recherchePlace[existingIdx] = {
                ...recherchePlace[existingIdx],
                cherchePassager: true,
                chercheInstrument: !!targetBesoinTransp
              };
            } else {
              recherchePlace.push({
                uid: user.uid,
                nom: memberName,
                cherchePassager: true,
                chercheInstrument: !!targetBesoinTransp
              });
            }
          } else if (targetTransport === 'autonome' || targetStatus !== 'present') {
            recherchePlace = recherchePlace.filter(p => p.uid !== user.uid);
          }

          finalCovoit = {
            ...currentCovoit,
            recherchePlace
          };
        }

        const eventUpdates = {
          inscriptions: finalInscriptions,
          covoiturage: finalCovoit
        };

        transaction.update(eventRef, cleanFirestorePayload(eventUpdates));
      });

      // Synchronisation du state local après succès de la transaction
      if (targetStatus === 'present' && !instrumentChoisi) {
        setInstrumentChoisi(targetInstrument);
      }
      setStatus(targetStatus);

      let msg = "Inscription validée (Présent)";
      if (finalStatus === 'pending') msg = "Inscription en attente de validation";
      else if (finalStatus === 'absent') msg = "Inscription enregistrée (Absent)";
      else if (finalStatus === 'confirm') msg = "Inscription enregistrée (À confirmer)";
      triggerToast(msg);
    } catch (error) {
      console.error("EventDetails - Erreur lors de la sauvegarde RSVP :", error);
      alert("Erreur lors de l'enregistrement de votre inscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await handleSave(null, newStatus);
  };

  // Basculer la sélection (case à cocher) pour un membre de la famille
  const handleToggleFamilyMemberSelection = (memberId) => {
    setFamilyResponses(prev => {
      const current = prev[memberId] || { selected: false, status: 'present', instrumentChoisi: 'Autre' };
      const newSelected = !current.selected;
      return {
        ...prev,
        [memberId]: {
          ...current,
          selected: newSelected,
          status: newSelected ? (current.status === 'absent' ? 'present' : current.status) : 'absent'
        }
      };
    });
  };

  // Modifier le statut individuel pour un membre de la famille
  const handleFamilyMemberStatusChange = (memberId, newStatus) => {
    setFamilyResponses(prev => {
      const current = prev[memberId] || { selected: false, status: 'present', instrumentChoisi: 'Autre' };
      return {
        ...prev,
        [memberId]: {
          ...current,
          status: newStatus
        }
      };
    });
  };

  // Modifier l'instrument d'un membre de la famille
  const handleFamilyMemberInstrumentChange = (memberId, newInstrument) => {
    setFamilyResponses(prev => {
      const current = prev[memberId] || { selected: false, status: 'present', instrumentChoisi: 'Autre' };
      return {
        ...prev,
        [memberId]: {
          ...current,
          instrumentChoisi: newInstrument
        }
      };
    });
  };

  // Sauvegarder les réponses d'inscription de tous les membres de la famille dans Firestore
  const handleFamilySave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (event?.status === 'annule') {
      alert("Les inscriptions sont désactivées car l'événement est annulé.");
      return;
    }
    if (!event?.id) return;
    setSaving(true);

    const isRegistrationDeadlinePassed = checkRegistrationDeadlinePassed(event);
    const isAuthorized = profileData?.role === 'mestre' ||
      profileData?.role === 'super-admin' ||
      profileData?.role === 'admin' ||
      profileData?.role === 'bureau' ||
      profileData?.role === 'ca' ||
      profileData?.isSystemAdmin === true ||
      (profileData?.tags || []).some(t => ['bureau', 'admin', 'direction', 'organisateur', 'ca'].includes(t?.toLowerCase?.()));

    if (isRegistrationDeadlinePassed && !isAuthorized) {
      alert("Les inscriptions pour cet événement sont closes.");
      setSaving(false);
      return;
    }

    try {
      const currentInscriptions = event.inscriptions || [];
      const familyIds = new Set(familyMembers.map(m => m.id));
      const updatedInscriptions = currentInscriptions.filter(ins => !familyIds.has(ins.userId));

      familyMembers.forEach(m => {
        const mResp = familyResponses[m.id];
        if (!mResp) return;

        const mSelected = mResp.selected;
        const mStatus = mSelected ? (mResp.status === 'absent' ? 'present' : mResp.status) : 'absent';

        if (m.isParent) {
          setStatus(mStatus);
        }

        const finalStatus = (mStatus === 'present' && event.requiresValidation) ? 'pending' : mStatus;

        updatedInscriptions.push({
          userId: m.id,
          userName: `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Membre',
          status: finalStatus,
          transport: m.isParent && mStatus === 'present' ? transport : null,
          places: 0,
          instruments: "",
          instrumentChoisi: mStatus === 'present' ? (mResp.instrumentChoisi || m.instrument || 'Autre') : null,
          instrumentImposeParMestre: m.isParent ? isInstrumentLocked : false,
          demandeRemboursementKm: m.isParent && mStatus === 'present' && transport === 'propre' ? demandeRemboursementKm : false,
          besoinTransportInstrument: m.isParent && mStatus === 'present' ? besoinTransportInstrument : false
        });
      });

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      triggerToast("Inscriptions de la famille enregistrées !");
    } catch (error) {
      console.error("EventDetails - Erreur lors de la sauvegarde RSVP famille :", error);
      alert("Erreur lors de l'enregistrement de votre inscription.");
    } finally {
      setSaving(false);
    }
  };

  const handleValidatePending = async (userId, targetStatus) => {
    if (!event.id) return;
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.map(ins => {
        if (ins.userId === userId) {
          return { ...ins, status: targetStatus };
        }
        return ins;
      });

      // Synchroniser avec les éventuelles demandes de modification d'inscription en attente
      const currentRequests = event.demandesModificationInscription || [];
      const updatedRequests = currentRequests.map(req => {
        if (req.userId === userId && req.status === 'pending') {
          return { ...req, status: targetStatus === 'present' ? 'accepted' : 'rejected' };
        }
        return req;
      });

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions,
        demandesModificationInscription: updatedRequests
      });

      triggerToast(targetStatus === 'present' ? "Inscription validée" : "Inscription refusée");
    } catch (error) {
      console.error("EventDetails - Erreur de validation d'inscription :", error);
      alert("Erreur lors de la validation de l'inscription.");
    }
  };

  const handleManualRegister = async (e) => {
    if (e) e.preventDefault();
    if (!event.id) return;
    if (!selectedManualUserId) {
      alert("Veuillez sélectionner un membre.");
      return;
    }
    const targetUser = allUsers.find(u => u.id === selectedManualUserId);
    if (!targetUser) {
      alert("Membre introuvable.");
      return;
    }

    setSavingManualRegistration(true);

    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== targetUser.id);

      const chosenInstrument = selectedManualInstrument || targetUser.instrument || 'Autre';
      const newResponse = {
        userId: targetUser.id,
        userName: `${targetUser.prenom || ''} ${targetUser.nom || ''}`.trim() || 'Membre',
        status: 'present',
        transport: null,
        places: 0,
        instruments: "",
        instrumentChoisi: chosenInstrument,
        instrumentImposeParMestre: false,
        demandeRemboursementKm: false
      };

      updatedInscriptions.push(newResponse);

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      setSelectedManualUserId('');
      setSelectedManualInstrument('');
      setIsManualRegisterOpen(false);
      triggerToast("Membre inscrit avec succès !");
    } catch (error) {
      console.error("EventDetails - Erreur inscription manuelle :", error);
      alert("Erreur lors de l'inscription du membre.");
    } finally {
      setSavingManualRegistration(false);
    }
  };

  const handleManualUnregister = async (targetUserId) => {
    if (!event.id || !targetUserId) return;
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== targetUserId);

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      triggerToast("Inscription retirée");
    } catch (error) {
      console.error("EventDetails - Erreur désinscription manuelle :", error);
      alert("Erreur lors du retrait de l'inscription.");
    }
  };

  const handleUpdateStatus = async (targetUserId, newStatus) => {
    if (!event.id || !targetUserId) return;
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const freshEvent = eventDocSnap.data();
        const currentInscriptions = freshEvent.inscriptions || [];
        const currentCovoit = freshEvent.covoiturage || { voitures: [], recherchePlace: [] };

        let updatedInscriptions = [];
        let updatedCovoit = currentCovoit;

        if (newStatus === 'absent') {
          const cascade = applyCarpoolAbsenceCascade(currentCovoit, currentInscriptions, targetUserId);
          updatedCovoit = cascade.updatedCovoiturage;
          updatedInscriptions = cascade.updatedInscriptions;

          const memberFound = updatedInscriptions.some(ins => ins.userId === targetUserId);
          if (!memberFound) {
            const userObj = (allUsers || []).find(u => u.id === targetUserId || u.uid === targetUserId);
            const name = userObj ? (`${userObj.prenom || ''} ${userObj.nom || ''}`.trim() || userObj.displayName || 'Membre') : 'Membre';
            updatedInscriptions.push({
              userId: targetUserId,
              userName: name,
              status: 'absent',
              transport: null,
              places: 0,
              instruments: "",
              instrumentChoisi: null,
              instrumentImposeParMestre: false,
              demandeRemboursementKm: false
            });
          }
        } else {
          let memberFound = false;
          updatedInscriptions = currentInscriptions.map(ins => {
            if (ins.userId === targetUserId) {
              memberFound = true;
              const userObj = allUsers.find(u => u.id === targetUserId || u.uid === targetUserId);
              const safeInst = ins.instrumentChoisi || userObj?.instrument || userObj?.instrumentsJoues?.[0] || 'Autre';
              return {
                ...ins,
                status: newStatus,
                instrumentChoisi: newStatus === 'present' ? safeInst : null
              };
            }
            return ins;
          });

          if (!memberFound) {
            const userObj = (allUsers || []).find(u => u.id === targetUserId || u.uid === targetUserId);
            const name = userObj ? (`${userObj.prenom || ''} ${userObj.nom || ''}`.trim() || userObj.displayName || 'Membre') : 'Membre';
            const safeInst = userObj?.instrument || userObj?.instrumentsJoues?.[0] || 'Autre';
            updatedInscriptions.push({
              userId: targetUserId,
              userName: name,
              status: newStatus,
              transport: null,
              places: 0,
              instruments: "",
              instrumentChoisi: newStatus === 'present' ? safeInst : null,
              instrumentImposeParMestre: false,
              demandeRemboursementKm: false
            });
          }
        }

        transaction.update(eventRef, cleanFirestorePayload({
          inscriptions: updatedInscriptions,
          covoiturage: updatedCovoit
        }));
      });

      triggerToast("Statut mis à jour");
    } catch (error) {
      console.error("EventDetails - Erreur mise à jour statut :", error);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };


  const handleUpdateMemberInstrument = async (targetUserId, newInstrument) => {
    if (!event.id || !targetUserId) return;
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.map(ins => {
        if (ins.userId === targetUserId) {
          return { ...ins, instrumentChoisi: newInstrument };
        }
        return ins;
      });

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      triggerToast("Instrument mis à jour");
    } catch (error) {
      console.error("EventDetails - Erreur mise à jour instrument :", error);
      alert("Erreur lors de la mise à jour de l'instrument.");
    }
  };

  const handleAddInviteExterne = async (nom, fonction, instrument) => {
    if (!event.id) return;
    try {
      const currentInvites = event.invitesExternes || [];
      const newInvite = {
        id: `invite_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        nom,
        fonction,
        instrument,
        addedBy: user.uid,
        addedAt: new Date().toISOString()
      };
      const updatedInvites = [...currentInvites, newInvite];

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        invitesExternes: updatedInvites
      });

      triggerToast("Invité externe ajouté !");
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'invité externe :", error);
      alert("Erreur lors de l'ajout de l'invité externe.");
    }
  };

  const handleRemoveInviteExterne = async (inviteId) => {
    if (!event.id) return;
    const isOk = await confirm({
      title: "Retirer l'invité",
      message: "Êtes-vous sûr de vouloir retirer cet invité ?",
      confirmText: "Oui, retirer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    try {
      const currentInvites = event.invitesExternes || [];
      const updatedInvites = currentInvites.filter(inv => inv.id !== inviteId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        invitesExternes: updatedInvites
      });
      triggerToast("Invité externe retiré !");
    } catch (error) {
      console.error("Erreur lors du retrait de l'invité externe :", error);
      alert("Erreur lors du retrait de l'invité externe.");
    }
  };

  // Permet à un adhérent de demander une modification d'inscription au bureau (ex: après deadline ou pour ajuster sa présence)
  const handleRequestRegistrationChange = async (requestedStatus, messageText = '') => {
    if (!event?.id || !user?.uid) return;
    setSaving(true);
    try {
      const currentRequests = event.demandesModificationInscription || [];
      // On conserve les anciennes requêtes déjà traitées, mais on remplace toute demande en attente du même utilisateur
      const otherRequests = currentRequests.filter(req => req.userId !== user.uid || req.status !== 'pending');

      const safeInstrument = instrumentChoisi || profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre';
      const newRequest = {
        id: `req_${user.uid}_${Date.now()}`,
        userId: user.uid,
        userName: `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Membre',
        userEmail: user?.email || '',
        userAvatar: profileData?.photoURL || profileData?.avatar || null,
        currentStatus: existingResponse?.status || 'non_inscrit',
        requestedStatus, // 'present' | 'absent'
        instrumentChoisi: requestedStatus === 'present' ? safeInstrument : null,
        transport: requestedStatus === 'present' ? transport : null,
        besoinTransportInstrument: requestedStatus === 'present' ? !!besoinTransportInstrument : false,
        demandeRemboursementKm: (requestedStatus === 'present' && transport === 'propose_voiture') ? !!demandeRemboursementKm : false,
        message: (messageText || '').trim(),
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      const updatedRequests = [...otherRequests, newRequest];
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        demandesModificationInscription: updatedRequests
      });

      triggerToast("Demande transmise au bureau avec succès !");
    } catch (error) {
      console.error("Erreur lors de la soumission de la demande de modification :", error);
      alert("Erreur lors de l'envoi de la demande au bureau.");
    } finally {
      setSaving(false);
    }
  };

  // Permet à un membre d'annuler sa demande en attente
  const handleCancelRegistrationChangeRequest = async (requestId) => {
    if (!event?.id || !user?.uid) return;
    try {
      const currentRequests = event.demandesModificationInscription || [];
      const updatedRequests = currentRequests.filter(r => r.id !== requestId && r.userId !== user.uid);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        demandesModificationInscription: updatedRequests
      });
      triggerToast("Demande de modification annulée.");
    } catch (error) {
      console.error("Erreur lors de l'annulation de la demande :", error);
      alert("Erreur lors de l'annulation de la demande.");
    }
  };

  // Traitement d'une demande par un membre du bureau ou administrateur
  const handleProcessRegistrationChangeRequest = async (requestItem, action) => {
    if (!event?.id || !requestItem) return;
    try {
      const currentRequests = event.demandesModificationInscription || [];
      const updatedRequests = currentRequests.map(r => {
        if (r.id === requestItem.id) {
          return {
            ...r,
            status: action === 'accept' ? 'accepted' : 'rejected',
            processedAt: new Date().toISOString(),
            processedBy: user.uid
          };
        }
        return r;
      });

      const eventUpdates = {
        demandesModificationInscription: updatedRequests
      };

      // Si acceptée, mise à jour effective du tableau des inscriptions
      if (action === 'accept') {
        const currentInscriptions = event.inscriptions || [];
        const otherInscriptions = currentInscriptions.filter(ins => ins.userId !== requestItem.userId);

        const newResponse = {
          userId: requestItem.userId,
          userName: requestItem.userName,
          status: requestItem.requestedStatus,
          transport: requestItem.requestedStatus === 'present' ? requestItem.transport : null,
          places: 0,
          instruments: "",
          instrumentChoisi: requestItem.requestedStatus === 'present' ? (requestItem.instrumentChoisi || 'Autre') : null,
          instrumentImposeParMestre: false,
          demandeRemboursementKm: (requestItem.requestedStatus === 'present' && requestItem.transport === 'propose_voiture') ? !!requestItem.demandeRemboursementKm : false,
          besoinTransportInstrument: requestItem.requestedStatus === 'present' ? !!requestItem.besoinTransportInstrument : false
        };

        eventUpdates.inscriptions = [...otherInscriptions, newResponse];

        // Retrait de la recherche de covoiturage si la personne passe absente
        if (requestItem.requestedStatus !== 'present' && event.covoiturage?.recherchePlace) {
          const freshRecherche = (event.covoiturage.recherchePlace || []).filter(p => p.uid !== requestItem.userId);
          if (freshRecherche.length !== event.covoiturage.recherchePlace.length) {
            eventUpdates.covoiturage = {
              ...event.covoiturage,
              recherchePlace: freshRecherche
            };
          }
        }
      }

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, cleanFirestorePayload(eventUpdates));

      triggerToast(action === 'accept' ? "Demande validée et inscription mise à jour !" : "Demande refusée.");
    } catch (error) {
      console.error("Erreur lors du traitement de la demande de modification :", error);
      alert("Erreur lors du traitement de la demande.");
    }
  };

  /**
   * Cas 1 — Annulation tardive (Passage de Présent ➔ Absent après la date limite) :
   * Enregistre le désistement avec le motif et l'horodatage, et notifie les Mestres et responsables.
   *
   * @param {string} messageText Mot ou explication laissé par l'adhérent
   */
  const handleLateCancellation = async (messageText = '') => {
    if (!event?.id || !user?.uid) return;
    setSaving(true);

    // Vérification préventive pour les conducteurs avec passagers ou instruments tiers
    const situation = inspectDriverCarpoolSituation(event, user.uid);
    if (situation.isDriver && situation.hasThirdParty) {
      const warningMsg = buildDriverDepartureWarningMessage(situation);
      const isConfirmed = await confirm({
        title: "Passagers dans votre véhicule",
        message: warningMsg,
        confirmText: "Confirmer l'absence",
        cancelText: "Annuler",
        variant: "warning"
      });
      if (!isConfirmed) {
        setSaving(false);
        return;
      }
    }

    try {
      const memberName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Membre';
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) {
          throw new Error("L'événement n'existe plus !");
        }

        const freshEvent = eventDocSnap.data();
        const currentInscriptions = freshEvent.inscriptions || [];
        const currentCovoit = freshEvent.covoiturage || { voitures: [], recherchePlace: [] };

        const cascade = applyCarpoolAbsenceCascade(currentCovoit, currentInscriptions, user.uid);
        let updatedInscriptions = cascade.updatedInscriptions;

        const cancelledResponse = {
          userId: user.uid,
          userName: memberName,
          status: 'absent',
          transport: null,
          places: 0,
          instruments: "",
          instrumentChoisi: null,
          instrumentImposeParMestre: false,
          demandeRemboursementKm: false,
          besoinTransportInstrument: false,
          motifAnnulationTardive: (messageText || '').trim(),
          dateAnnulationTardive: new Date().toISOString()
        };

        const existingIdx = updatedInscriptions.findIndex(ins => ins.userId === user.uid);
        if (existingIdx >= 0) {
          updatedInscriptions[existingIdx] = {
            ...updatedInscriptions[existingIdx],
            ...cancelledResponse
          };
        } else {
          updatedInscriptions.push(cancelledResponse);
        }

        const eventUpdates = {
          inscriptions: updatedInscriptions,
          covoiturage: cascade.updatedCovoiturage
        };

        transaction.update(eventRef, cleanFirestorePayload(eventUpdates));
      });

      setStatus('absent');

      // Déclenchement de la notification in-app aux Mestres et responsables de date
      try {
        const eventTitle = event.titre || event.title || 'Sortie';
        await notifyMembersByTag({
          groupId: event.groupId || profileData?.groupId,
          tags: ['mestre', 'admin', 'bureau', 'direction', 'organisateur'],
          title: `⚠️ Désistement tardif : ${memberName}`,
          message: messageText?.trim()
            ? `${memberName} s'est désisté de "${eventTitle}" : "${messageText.trim()}"`
            : `${memberName} a annulé sa participation après date limite pour "${eventTitle}".`,
          targetUrl: `/app/agenda?eventId=${event.id}&tab=rsvp`,
          icon: '⚠️',
          priority: 'high'
        });
      } catch (notifErr) {
        console.warn("useEventRSVP - Échec notification désistement tardif :", notifErr);
      }

      triggerToast("Désistement enregistré. Les organisateurs ont été prévenus.");
    } catch (error) {
      console.error("useEventRSVP - Erreur lors de l'annulation tardive :", error);
      alert("Erreur lors de l'enregistrement de votre désistement.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cas 2 — Inscription tardive (Demande de place après date limite) :
   * Enregistre l'adhérent avec le statut 'en_attente_tardive' (sans incrémenter les quotas validés)
   * et alerte les responsables pour arbitrage depuis la régie.
   *
   * @param {Object} params { message, instrumentChoisi }
   */
  const handleLateRegistration = async ({ message = '', instrumentChoisi: reqInstrument = null } = {}) => {
    if (!event?.id || !user?.uid) return;
    setSaving(true);

    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);
      const memberName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Membre';

      const chosenInst = reqInstrument || instrumentChoisi || profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre';

      const lateResponse = {
        userId: user.uid,
        userName: memberName,
        status: 'en_attente_tardive',
        transport: null,
        places: 0,
        instruments: "",
        instrumentChoisi: chosenInst,
        instrumentImposeParMestre: false,
        demandeRemboursementKm: false,
        besoinTransportInstrument: false,
        messageDemandeTardive: (message || '').trim(),
        dateDemandeTardive: new Date().toISOString()
      };

      updatedInscriptions.push(lateResponse);

      // Inscription miroir dans demandesModificationInscription pour compatibilité avec le bureau
      const currentRequests = event.demandesModificationInscription || [];
      const otherRequests = currentRequests.filter(req => req.userId !== user.uid || req.status !== 'pending');
      const newRequest = {
        id: `req_${user.uid}_${Date.now()}`,
        userId: user.uid,
        userName: memberName,
        userEmail: user?.email || '',
        userAvatar: profileData?.photoURL || profileData?.avatar || null,
        currentStatus: existingResponse?.status || 'non_inscrit',
        requestedStatus: 'present',
        instrumentChoisi: chosenInst,
        transport: null,
        message: (message || '').trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        isLateRequest: true
      };

      const eventUpdates = {
        inscriptions: updatedInscriptions,
        demandesModificationInscription: [...otherRequests, newRequest]
      };

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, cleanFirestorePayload(eventUpdates));

      setStatus('en_attente_tardive');

      // Alerte in-app aux responsables de date et mestres
      try {
        const eventTitle = event.titre || event.title || 'Sortie';
        await notifyMembersByTag({
          groupId: event.groupId || profileData?.groupId,
          tags: ['mestre', 'admin', 'bureau', 'direction', 'organisateur'],
          title: `🎟️ Inscription tardive : ${memberName}`,
          message: message?.trim()
            ? `${memberName} demande une place pour "${eventTitle}" : "${message.trim()}"`
            : `${memberName} demande une place après date limite pour "${eventTitle}".`,
          targetUrl: `/app/agenda?eventId=${event.id}&tab=rsvp`,
          icon: '🎟️',
          priority: 'normal'
        });
      } catch (notifErr) {
        console.warn("useEventRSVP - Échec notification inscription tardive :", notifErr);
      }

      triggerToast("Demande de place transmise aux responsables !");
    } catch (error) {
      console.error("useEventRSVP - Erreur lors de l'inscription tardive :", error);
      alert("Erreur lors de l'envoi de votre demande.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Annulation par le membre de sa demande de place tardive en attente.
   */
  const handleCancelLateRegistration = async () => {
    if (!event?.id || !user?.uid) return;
    setSaving(true);
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);
      const currentRequests = event.demandesModificationInscription || [];
      const updatedRequests = currentRequests.filter(req => req.userId !== user.uid || req.status !== 'pending');

      const eventUpdates = {
        inscriptions: updatedInscriptions,
        demandesModificationInscription: updatedRequests
      };

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, cleanFirestorePayload(eventUpdates));

      setStatus('absent');
      triggerToast("Demande de place annulée.");
    } catch (error) {
      console.error("useEventRSVP - Erreur annulation demande tardive :", error);
      alert("Erreur lors de l'annulation de la demande.");
    } finally {
      setSaving(false);
    }
  };

  return {
    status,
    setStatus,
    transport,
    setTransport,
    demandeRemboursementKm,
    setDemandeRemboursementKm,
    besoinTransportInstrument,
    setBesoinTransportInstrument,
    saving,
    instrumentChoisi,
    setInstrumentChoisi,
    isInstrumentLocked,
    existingResponse,
    dependents,
    familyMembers,
    familyResponses,
    handleToggleFamilyMemberSelection,
    handleFamilyMemberStatusChange,
    handleFamilyMemberInstrumentChange,
    handleFamilySave,
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
    handleRemoveInviteExterne,
    handleRequestRegistrationChange,
    handleCancelRegistrationChangeRequest,
    handleProcessRegistrationChangeRequest,
    handleLateCancellation,
    handleLateRegistration,
    handleCancelLateRegistration
  };
}
