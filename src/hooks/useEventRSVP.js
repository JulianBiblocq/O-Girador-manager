import { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useFamilyMembers } from './useFamilyMembers';
import useConfirm from './useConfirm';

export function useEventRSVP(event, user, profileData, allUsers, isMusicLevelRestricted, setToastMessage) {
  const { confirm } = useConfirm();
  const existingResponse = (event.inscriptions || []).find(ins => ins.userId === user?.uid);

  const [status, setStatus] = useState(() => existingResponse 
    ? (existingResponse.status === 'pending' || existingResponse.status === 'refused' ? 'present' : existingResponse.status) 
    : 'confirm');
  
  const getInitialTransport = () => {
    if (!existingResponse) return 'propre';
    return existingResponse.transport === 'propose' ? 'propre' : (existingResponse.transport || 'propre');
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
    familyMembers.forEach(m => {
      const resp = (event.inscriptions || []).find(ins => ins.userId === m.id);
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
  }, [event.id, event.inscriptions, familyMembers]);

  // Sync state with event/user changes for main parent
  useEffect(() => {
    const resp = (event.inscriptions || []).find(ins => ins.userId === user?.uid);
    setStatus(resp 
      ? (resp.status === 'pending' || resp.status === 'refused' ? 'present' : resp.status) 
      : 'confirm');
    setTransport(resp ? (resp.transport === 'propose' ? 'propre' : (resp.transport || 'propre')) : 'propre');
    setDemandeRemboursementKm(resp ? resp.demandeRemboursementKm === true : false);
    setBesoinTransportInstrument(resp ? resp.besoinTransportInstrument === true : false);
    setInstrumentChoisi(resp?.instrumentChoisi || profileData?.instrument || profileData?.instrumentsJoues?.[0] || 'Autre');
  }, [event.id, user?.uid, profileData?.instrument, profileData?.instrumentsJoues, event.inscriptions]);

  const handleSave = async (e, overrideStatus = null, overrideOptions = {}) => {
    if (e && e.preventDefault) e.preventDefault();
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

    const targetStatus = overrideStatus !== null ? overrideStatus : status;

    if (isMusicLevelRestricted && targetStatus !== 'absent') {
      alert("🔒 Inscription restreinte. Rendez-vous dans la section 'Discussions et questions logistiques' en bas de page pour échanger avec l'organisation.");
      setSaving(false);
      return;
    }

    const targetInstrument = overrideOptions.instrumentChoisi !== undefined ? overrideOptions.instrumentChoisi : instrumentChoisi;
    const targetTransport = overrideOptions.transport !== undefined ? overrideOptions.transport : transport;
    const targetDemandeRemb = overrideOptions.demandeRemboursementKm !== undefined ? overrideOptions.demandeRemboursementKm : demandeRemboursementKm;
    const targetBesoinTransp = overrideOptions.besoinTransportInstrument !== undefined ? overrideOptions.besoinTransportInstrument : besoinTransportInstrument;

    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);

      const finalStatus = (targetStatus === 'present' && event.requiresValidation) ? 'pending' : targetStatus;
      const newResponse = {
        userId: user.uid,
        userName: `${profileData.prenom} ${profileData.nom}`,
        status: finalStatus,
        transport: targetStatus === 'present' ? targetTransport : null,
        places: 0,
        instruments: "",
        instrumentChoisi: targetStatus === 'present' ? targetInstrument : null,
        instrumentImposeParMestre: targetStatus === 'present' ? isInstrumentLocked : false,
        demandeRemboursementKm: (targetStatus === 'present' && targetTransport === 'propre') ? targetDemandeRemb : false,
        besoinTransportInstrument: targetStatus === 'present' ? targetBesoinTransp : false
      };

      updatedInscriptions.push(newResponse);

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      if (setToastMessage) {
        let msg = "Inscription validée (Présent)";
        if (finalStatus === 'pending') msg = "Inscription en attente de validation";
        else if (finalStatus === 'absent') msg = "Inscription enregistrée (Absent)";
        else if (finalStatus === 'confirm') msg = "Inscription enregistrée (À confirmer)";
        setToastMessage(msg);
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
          selected: newStatus !== 'absent',
          status: newStatus
        }
      };
    });
  };

  // Modifier l'instrument individuel pour un membre de la famille
  const handleFamilyMemberInstrumentChange = (memberId, newInstrument) => {
    setFamilyResponses(prev => {
      const current = prev[memberId] || { selected: true, status: 'present', instrumentChoisi: 'Autre' };
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
          userName: `${m.prenom} ${m.nom}`.trim(),
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

      if (setToastMessage) {
        setToastMessage("Inscriptions de la famille enregistrées !");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
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

      if (setToastMessage) {
        setToastMessage("Inscription retirée");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("EventDetails - Erreur désinscription manuelle :", error);
      alert("Erreur lors du retrait de l'inscription.");
    }
  };

  const handleUpdateStatus = async (targetUserId, newStatus) => {
    if (!event.id || !targetUserId) return;
    try {
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.map(ins => {
        if (ins.userId === targetUserId) {
          return { ...ins, status: newStatus };
        }
        return ins;
      });

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      if (setToastMessage) {
        setToastMessage("Statut mis à jour");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
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

      if (setToastMessage) {
        setToastMessage("Instrument mis à jour");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
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

      if (setToastMessage) {
        setToastMessage("Invité externe ajouté !");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
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
      if (setToastMessage) {
        setToastMessage("Invité externe retiré !");
        setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur lors du retrait de l'invité externe :", error);
      alert("Erreur lors du retrait de l'invité externe.");
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
    handleRemoveInviteExterne
  };
}
