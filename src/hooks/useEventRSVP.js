import { useState, useEffect } from 'react';
import { doc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export function useEventRSVP(event, user, profileData, allUsers, isPrestationRestricted, setToastMessage) {
  const existingResponse = (event.inscriptions || []).find(ins => ins.userId === user.uid);

  const [status, setStatus] = useState(() => existingResponse 
    ? (existingResponse.status === 'pending' || existingResponse.status === 'refused' ? 'present' : existingResponse.status) 
    : 'confirm');
  
  const getInitialTransport = () => {
    if (!existingResponse) return 'propre';
    return existingResponse.transport === 'propose' ? 'propre' : (existingResponse.transport || 'propre');
  };
  const [transport, setTransport] = useState(getInitialTransport());
  const [demandeRemboursementKm, setDemandeRemboursementKm] = useState(existingResponse ? existingResponse.demandeRemboursementKm === true : false);
  const [saving, setSaving] = useState(false);

  const [instrumentChoisi, setInstrumentChoisi] = useState(() => {
    if (existingResponse?.instrumentChoisi) {
      return existingResponse.instrumentChoisi;
    }
    return profileData?.instrument || 'Autre';
  });

  const isInstrumentLocked = !!existingResponse?.instrumentImposeParMestre;

  const [selectedManualUserId, setSelectedManualUserId] = useState('');
  const [selectedManualInstrument, setSelectedManualInstrument] = useState('');
  const [isManualRegisterOpen, setIsManualRegisterOpen] = useState(false);
  const [savingManualRegistration, setSavingManualRegistration] = useState(false);

  // Sync state with event/user changes
  useEffect(() => {
    const resp = (event.inscriptions || []).find(ins => ins.userId === user.uid);
    setStatus(resp 
      ? (resp.status === 'pending' || resp.status === 'refused' ? 'present' : resp.status) 
      : 'confirm');
    setTransport(resp ? (resp.transport === 'propose' ? 'propre' : (resp.transport || 'propre')) : 'propre');
    setDemandeRemboursementKm(resp ? resp.demandeRemboursementKm === true : false);
    setInstrumentChoisi(resp?.instrumentChoisi || profileData?.instrument || 'Autre');
  }, [event.id, user.uid, profileData?.instrument, event.inscriptions]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (event.status === 'annule') {
      alert("Les inscriptions sont désactivées car l'événement est annulé.");
      return;
    }
    setSaving(true);

    const isRegistrationDeadlinePassed = event.dateLimiteInscription
      ? new Date(event.dateLimiteInscription) < new Date()
      : false;
    const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

    if (isRegistrationDeadlinePassed && !isAuthorized) {
      alert("Les inscriptions pour cet événement sont closes.");
      setSaving(false);
      return;
    }

    if (isPrestationRestricted && status !== 'absent') {
      alert("Cette prestation est réservée aux musiciens confirmés.");
      setSaving(false);
      return;
    }

    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);

      const finalStatus = (status === 'present' && event.requiresValidation) ? 'pending' : status;
      const newResponse = {
        userId: user.uid,
        userName: `${profileData.prenom} ${profileData.nom}`,
        status: finalStatus,
        transport: status === 'present' ? transport : null,
        places: 0,
        instruments: "",
        instrumentChoisi: status === 'present' ? instrumentChoisi : null,
        instrumentImposeParMestre: status === 'present' ? isInstrumentLocked : false,
        demandeRemboursementKm: (status === 'present' && transport === 'propre') ? demandeRemboursementKm : false
      };

      updatedInscriptions.push(newResponse);

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      if (setToastMessage) {
        setToastMessage(finalStatus === 'pending' ? "Inscription en attente de validation" : "Inscription validée");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("EventDetails - Erreur lors de la sauvegarde RSVP :", error);
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

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      if (setToastMessage) {
        setToastMessage(targetStatus === 'present' ? "Inscription validée" : "Inscription refusée");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
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
        userName: `${targetUser.prenom} ${targetUser.nom}`,
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
      if (setToastMessage) {
        setToastMessage("Membre inscrit avec succès !");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("EventDetails - Erreur lors de l'inscription manuelle :", error);
      alert("Erreur lors de l'inscription manuelle du membre.");
    } finally {
      setSavingManualRegistration(false);
    }
  };

  const handleManualUnregister = async (userId) => {
    if (!event.id) return;
    if (!window.confirm("Êtes-vous sûr de vouloir désinscrire ce membre ?")) {
      return;
    }
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== userId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });
      if (setToastMessage) {
        setToastMessage("Membre désinscrit avec succès !");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("EventDetails - Erreur lors de la désinscription manuelle :", error);
      alert("Erreur lors de la désinscription du membre.");
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

  return {
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
    handleUpdateMemberInstrument
  };
}
