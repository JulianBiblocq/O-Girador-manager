import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export const calculateCarStatus = (car, associationSettings) => {
  const passengers = car.passengers || [];

  const totalAlfayas = passengers.reduce((sum, p) => sum + (Number(p.alfayasCount) || 0), 0);
  const alfayasInTrunk = Math.min(totalAlfayas, Number(car.trunkAlfayaCapacity) || 0);
  const alfayasOnSeats = totalAlfayas - alfayasInTrunk;

  const physicalPassengers = passengers.reduce((sum, p) => sum + (p.isPassenger ? 1 : 0), 0);
  
  // Prise en compte des places réservées hors-association (caméraman, technicien...)
  const placesReserveesExternes = Number(car.placesReserveesExternes) || 0;
  const motifReserveesExternes = car.motifReserveesExternes || '';

  const occupiedSeats = physicalPassengers + alfayasOnSeats + placesReserveesExternes;
  const availableSeats = (Number(car.passengerSeats) || 0) - occupiedSeats;

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
    placesReserveesExternes,
    motifReserveesExternes,
    occupiedSeats,
    availableSeats,
    isFull,
    isEligibleForReimbursement,
    isOverbooked
  };
};

/**
 * Calcule la jauge de besoin en transport vs l'offre actuelle en convoi.
 * Permet d'ouvrir plusieurs voitures proportionnellement au nombre d'inscrits en attente.
 *
 * @param {Object} event Événement Firestore
 * @param {Array} voituresList Liste des voitures déclarées
 * @returns {Object} { demandeTransport, offreTransport, hasCarWithAvailableSeats, isCapacitySufficient }
 */
export const calculateCarpoolGauge = (event, voituresList = []) => {
  const presentInscriptions = (event?.inscriptions || []).filter(ins => ins.status === 'present');
  
  // Membres nécessitant une place en convoi
  const seekersFromInscriptions = presentInscriptions.filter(ins => {
    if (voituresList.some(v => v.chauffeurId === ins.userId)) return false;
    if (ins.transport === 'autonome' || (ins.transport === 'propre' && !ins.demandeRemboursementKm)) return false;
    return true;
  }).length;

  const inscriptionUserIds = new Set(presentInscriptions.map(ins => ins.userId));
  const seekersFromQueue = (event?.covoiturage?.recherchePlace || []).filter(
    p => !inscriptionUserIds.has(p.uid) && p.cherchePassager !== false
  ).length;

  const externalGuests = (event?.invitesExternes || []).length;
  const demandeTransport = seekersFromInscriptions + seekersFromQueue + externalGuests;

  // Offre totale nette en places passagers dans les voitures existantes
  const offreTransport = voituresList.reduce((sum, v) => {
    const seats = Number(v.passengerSeats) || 0;
    const ext = Number(v.placesReserveesExternes) || 0;
    return sum + Math.max(0, seats - ext);
  }, 0);

  const hasCarWithAvailableSeats = voituresList.some(v => {
    const status = calculateCarStatus(v, { enableCarpoolReimbursement: event?.enableCarpoolReimbursement !== false });
    return status.availableSeats > 0;
  });

  return {
    demandeTransport,
    offreTransport,
    hasCarWithAvailableSeats,
    isCapacitySufficient: offreTransport >= demandeTransport && hasCarWithAvailableSeats
  };
};

export function useEventCarpool({
  event,
  user,
  profileData,
  demandeRemboursementKm,
  setDemandeRemboursementKm,
  enableCarpoolReimbursement,
  reimbursementRule
}) {
  const [showProposerForm, setShowProposerForm] = useState(false);
  
  // Pré-remplissage depuis le profil membre
  const defaultSeats = profileData?.defaultPassengerSeats !== undefined ? profileData.defaultPassengerSeats : 3;
  const defaultTrunk = profileData?.defaultTrunkCapacity !== undefined ? profileData.defaultTrunkCapacity : 1;

  const [voitureForm, setVoitureForm] = useState({
    passengerSeats: defaultSeats,
    trunkAlfayaCapacity: defaultTrunk,
    placesReserveesExternes: 0,
    motifReserveesExternes: '',
    materielCharge: '',
    materielTransporte: ''
  });

  const [joiningVoitureId, setJoiningVoitureId] = useState(null);
  const [joinForm, setJoinForm] = useState({
    isPassenger: true,
    alfayasCount: 0
  });
  const [submittingCovoit, setSubmittingCovoit] = useState(false);

  const handleProposerVoiture = async (e) => {
    if (e) e.preventDefault();
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

        // Règle proportionnelle : vérifier si la capacité actuelle est déjà suffisante
        const gauge = calculateCarpoolGauge(eventData, voitures);
        const isUserAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

        if (!isUserAuthorized && gauge.isCapacitySufficient) {
          throw new Error(
            `Capacité suffisante pour les inscrits actuels (${gauge.offreTransport} places offertes pour ${gauge.demandeTransport} demandées). Veuillez compléter les véhicules existants avant d'en ouvrir un nouveau.`
          );
        }

        const newVoiture = {
          id: `voiture_${user.uid}`,
          chauffeurId: user.uid,
          chauffeurNom: `${profileData?.prenom} ${profileData?.nom}`,
          passengerSeats: parseInt(voitureForm.passengerSeats, 10) || 0,
          trunkAlfayaCapacity: parseInt(voitureForm.trunkAlfayaCapacity, 10) || 0,
          placesReserveesExternes: Math.max(0, parseInt(voitureForm.placesReserveesExternes, 10) || 0),
          motifReserveesExternes: (voitureForm.motifReserveesExternes || '').trim(),
          materielCharge: (voitureForm.materielCharge || '').trim(),
          materielTransporte: (voitureForm.materielTransporte || '').trim(),
          passengers: []
        };

        const recherchePlace = (currentCovoit.recherchePlace || []).filter(item => item.uid !== user.uid);

        const currentInscriptions = eventData.inscriptions || [];
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.userId === user.uid) {
            return { ...ins, transport: 'propose_voiture' };
          }
          return ins;
        });

        transaction.update(eventRef, {
          covoiturage: {
            voitures: [...voitures, newVoiture],
            recherchePlace: recherchePlace
          },
          inscriptions: updatedInscriptions
        });
      });

      setShowProposerForm(false);
      setVoitureForm({
        passengerSeats: defaultSeats,
        trunkAlfayaCapacity: defaultTrunk,
        placesReserveesExternes: 0,
        motifReserveesExternes: '',
        materielCharge: '',
        materielTransporte: ''
      });
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

        const currentInscriptions = eventData.inscriptions || [];
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.userId === user.uid) {
            return {
              ...ins,
              demandeRemboursementKm: false
            };
          }
          return ins;
        });

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: recherchePlace
          },
          inscriptions: updatedInscriptions
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

  const handleToggleRemboursement = async (e) => {
    const newValue = e.target.checked;
    setDemandeRemboursementKm(newValue);

    if (!user?.uid) return;

    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentInscriptions = eventData.inscriptions || [];
        
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.userId === user.uid) {
            return {
              ...ins,
              demandeRemboursementKm: newValue
            };
          }
          return ins;
        });

        transaction.update(eventRef, {
          inscriptions: updatedInscriptions
        });
      });
    } catch (err) {
      console.error("EventDetails - Erreur handleToggleRemboursement :", err);
      alert("Erreur lors de la mise à jour de la demande de remboursement.");
      setDemandeRemboursementKm(!newValue);
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleChercherPlace = async (options = {}) => {
    if (!user?.uid) return;
    const { cherchePassager = true, chercheInstrument = false } = options;

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

        // Retirer existing entry to autoriser mise à jour de type
        recherchePlace = recherchePlace.filter(p => p.uid !== user.uid);

        const updatedVoitures = voitures.map(voiture => ({
          ...voiture,
          passengers: (voiture.passengers || voiture.passagers || []).filter(p => p.uid !== user.uid)
        }));

        recherchePlace.push({
          uid: user.uid,
          nom: `${profileData?.prenom} ${profileData?.nom}`,
          cherchePassager: !!cherchePassager,
          chercheInstrument: !!chercheInstrument
        });

        const currentInscriptions = eventData.inscriptions || [];
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.userId === user.uid) {
            return { ...ins, transport: 'cherche' };
          }
          return ins;
        });

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: recherchePlace
          },
          inscriptions: updatedInscriptions
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

  const handleAssignPassenger = async (voitureId, passengerUid, passengerNom, isInvite) => {
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
        const recherchePlace = currentCovoit.recherchePlace || [];

        const freshVoiture = voitures.find(v => v.id === voitureId);
        if (!freshVoiture) {
          throw new Error("Ce véhicule n'est plus disponible.");
        }

        const cleanPassengers = (freshVoiture.passengers || []).filter(p => p.uid !== passengerUid);
        const candidatePassenger = {
          uid: passengerUid,
          nom: passengerNom,
          isPassenger: true,
          alfayasCount: 0,
          isInvite: !!isInvite
        };

        const freshSimulatedCar = {
          ...freshVoiture,
          passengers: [...cleanPassengers, candidatePassenger]
        };

        const freshStatus = calculateCarStatus(freshSimulatedCar, { 
          enableCarpoolReimbursement: !!eventData.enableCarpoolReimbursement, 
          reimbursementRule: eventData.reimbursementRule || 'full_cars_only' 
        });

        if (freshStatus.isOverbooked) {
          throw new Error("Plus assez de place dans cette voiture !");
        }

        // Mise à jour de la liste des voitures
        const updatedVoitures = voitures.map(v => {
          if (v.id === voitureId) {
            return {
              ...v,
              passengers: [...cleanPassengers, candidatePassenger]
            };
          }
          return v;
        });

        // Retirer de la liste d'attente si présent
        const updatedRecherchePlace = recherchePlace.filter(p => p.uid !== passengerUid);

        // Mettre à jour les inscriptions s'il s'agit d'un membre (pas d'un invité externe)
        let updatedInscriptions = eventData.inscriptions || [];
        if (!isInvite) {
          updatedInscriptions = updatedInscriptions.map(ins => {
            if (ins.userId === passengerUid) {
              return { ...ins, transport: 'covoit' };
            }
            return ins;
          });
        }

        transaction.update(eventRef, {
          covoiturage: {
            voitures: updatedVoitures,
            recherchePlace: updatedRecherchePlace
          },
          inscriptions: updatedInscriptions
        });
      });
    } catch (err) {
      console.error("Erreur d'assignation du passager :", err);
      alert(err.message || "Erreur lors de l'assignation du passager.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  const handleRemovePassenger = async (voitureId, passengerUid) => {
    setSubmittingCovoit(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      await runTransaction(db, async (transaction) => {
        const eventDocSnap = await transaction.get(eventRef);
        if (!eventDocSnap.exists()) return;

        const eventData = eventDocSnap.data();
        const currentCovoit = eventData.covoiturage || { voitures: [], recherchePlace: [] };
        const voitures = currentCovoit.voitures || [];

        const voiture = voitures.find(v => v.id === voitureId);
        if (!voiture) return;

        // Déterminer si le passager est un invité
        const passengerObj = (voiture.passengers || []).find(p => p.uid === passengerUid);
        const isInvite = passengerObj ? !!passengerObj.isInvite : false;

        const cleanP = (voiture.passengers || []).filter(p => p.uid !== passengerUid);

        const updatedVoitures = voitures.map(v => {
          if (v.id === voitureId) {
            return {
              ...v,
              passengers: cleanP
            };
          }
          return v;
        });

        // Mettre à jour les inscriptions s'il s'agissait d'un membre
        let updatedInscriptions = eventData.inscriptions || [];
        if (!isInvite) {
          updatedInscriptions = updatedInscriptions.map(ins => {
            if (ins.userId === passengerUid) {
              return { ...ins, transport: '' }; // réinitialiser
            }
            return ins;
          });
        }

        transaction.update(eventRef, {
          covoiturage: {
            ...currentCovoit,
            voitures: updatedVoitures
          },
          inscriptions: updatedInscriptions
        });
      });
    } catch (err) {
      console.error("Error removing passenger:", err);
      alert("Erreur lors du retrait du passager.");
    } finally {
      setSubmittingCovoit(false);
    }
  };

  return {
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
  };
}
