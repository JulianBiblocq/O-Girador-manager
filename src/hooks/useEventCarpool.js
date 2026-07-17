import { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';

export const calculateCarStatus = (car, associationSettings) => {
  const passengers = car.passengers || [];

  const totalAlfayas = passengers.reduce((sum, p) => sum + (Number(p.alfayasCount) || 0), 0);
  const alfayasInTrunk = Math.min(totalAlfayas, Number(car.trunkAlfayaCapacity) || 0);
  const alfayasOnSeats = totalAlfayas - alfayasInTrunk;

  const physicalPassengers = passengers.reduce((sum, p) => sum + (p.isPassenger ? 1 : 0), 0);
  
  const occupiedSeats = physicalPassengers + alfayasOnSeats;
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
    occupiedSeats,
    availableSeats,
    isFull,
    isEligibleForReimbursement,
    isOverbooked
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

        const currentInscriptions = eventData.inscriptions || [];
        const updatedInscriptions = currentInscriptions.map(ins => {
          if (ins.userId === user.uid) {
            return { ...ins, transport: 'propre' };
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
    handleAnnulerCherchePlace
  };
}
