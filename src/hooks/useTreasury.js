import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, deleteDoc, updateDoc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Helper local pour le calcul de l'occupation et éligibilité du covoiturage (identique à KilometricReimbursementManager et ReportsExports)
const calculateCarStatus = (car, associationSettings) => {
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
  return {
    isFull,
    isEligibleForReimbursement
  };
};

export function useTreasury(groupId) {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [events, setEvents] = useState([]);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignRequests, setCampaignRequests] = useState([]);
  const [helloAssoSignatureKey, setHelloAssoSignatureKey] = useState('');

  const [loadingStates, setLoadingStates] = useState({
    members: true,
    transactions: true,
    events: true,
    settings: true,
    campaigns: true,
    campaignRequests: true,
    credentials: true
  });

  const [error, setError] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  const [updatingEventId, setUpdatingEventId] = useState(null);

  const loading = Object.values(loadingStates).some(state => state === true);

  // Sync real-time data from Firestore
  useEffect(() => {
    if (!groupId) {
      setLoadingStates({
        members: false,
        transactions: false,
        events: false,
        settings: false,
        campaigns: false,
        campaignRequests: false,
        credentials: false
      });
      return;
    }

    // 1. Members
    const usersRef = collection(db, 'users');
    const qMembers = query(usersRef, where('groupId', '==', groupId));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const isActive = !data.statutActuel || data.statutActuel === 'active';
        if (isActive) {
          fetched.push({ id: docSnap.id, ...data });
        }
      });
      setMembers(fetched);
      setLoadingStates(prev => ({ ...prev, members: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching members:", err);
      setError("Erreur de chargement des membres.");
      setLoadingStates(prev => ({ ...prev, members: false }));
    });

    // 2. Transactions
    const txRef = collection(db, 'transactions');
    const qTx = query(txRef, where('groupId', '==', groupId));
    const unsubTx = onSnapshot(qTx, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort chronologically desc
      fetched.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      setTransactions(fetched);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching transactions:", err);
      setError("Erreur de chargement des transactions.");
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    });

    // 3. Events
    const eventsRef = collection(db, 'events');
    const qEvents = query(eventsRef, where('groupId', '==', groupId));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort chronologically desc
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
      setLoadingStates(prev => ({ ...prev, events: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching events:", err);
      setError("Erreur de chargement des événements.");
      setLoadingStates(prev => ({ ...prev, events: false }));
    });

    // 4. Association Settings
    const assocRef = doc(db, 'associations', groupId);
    const unsubSettings = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
      setLoadingStates(prev => ({ ...prev, settings: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching association settings:", err);
      setError("Erreur de chargement des paramètres.");
      setLoadingStates(prev => ({ ...prev, settings: false }));
    });

    // 5. Campaigns
    const campaignsRef = collection(db, 'campaigns');
    const qCampaigns = query(campaignsRef, where('groupId', '==', groupId));
    const unsubCampaigns = onSnapshot(qCampaigns, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCampaigns(fetched);
      setLoadingStates(prev => ({ ...prev, campaigns: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching campaigns:", err);
      setLoadingStates(prev => ({ ...prev, campaigns: false }));
    });

    // 6. CampaignRequests (orders)
    const requestsRef = collection(db, 'campaignRequests');
    const qRequests = query(requestsRef, where('groupId', '==', groupId));
    const unsubRequests = onSnapshot(qRequests, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setCampaignRequests(fetched);
      setLoadingStates(prev => ({ ...prev, campaignRequests: false }));
    }, (err) => {
      console.error("useTreasury - Error fetching campaignRequests:", err);
      setLoadingStates(prev => ({ ...prev, campaignRequests: false }));
    });

    // 7. HelloAsso Credentials
    const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
    getDoc(credentialsRef).then((docSnap) => {
      if (docSnap.exists()) {
        setHelloAssoSignatureKey(docSnap.data().helloAssoSignatureKey || '');
      }
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    }).catch(err => {
      console.error("useTreasury - Error fetching credentials :", err);
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    });

  }, [groupId]);

  // Operations
  const handleAddTx = async (txForm) => {
    if (!txForm.montant || !txForm.libelle) return;
    setSavingTx(true);
    try {
      const txDate = new Date(txForm.date);
      await addDoc(collection(db, 'transactions'), {
        groupId,
        date: Timestamp.fromDate(txDate),
        type: txForm.type,
        montant: parseFloat(txForm.montant) || 0,
        categorie: txForm.categorie,
        libelle: txForm.libelle
      });
    } catch (err) {
      console.error("useTreasury - Erreur addDoc transaction:", err);
      throw new Error("Erreur lors de l'enregistrement de l'opération.");
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    try {
      await deleteDoc(doc(db, 'transactions', txId));
    } catch (err) {
      console.error("useTreasury - Erreur suppression transaction:", err);
      throw new Error("Erreur lors de la suppression de l'opération.");
    }
  };

  const handleUpdateEventFinances = async (eventId, rec, dep) => {
    setUpdatingEventId(eventId);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        montantRecette: parseFloat(rec) || 0,
        montantDepense: parseFloat(dep) || 0
      });
    } catch (err) {
      console.error("useTreasury - Erreur update event finances:", err);
      throw new Error("Erreur lors de l'enregistrement.");
    } finally {
      setUpdatingEventId(null);
    }
  };

  const handleSaveAssociationSettings = async (updates, files = {}) => {
    setSavingSettings(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      const finalUpdates = { ...updates };

      // Upload files to Firebase Storage if provided
      if (files.droitImageFile && files.droitImageFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/droit_image.pdf`);
        const snap = await uploadBytes(docRef, files.droitImageFile);
        finalUpdates.droitImageDocUrl = await getDownloadURL(snap.ref);
      }

      if (files.aptitudeMedicaleFile && files.aptitudeMedicaleFile instanceof File) {
        const docRef = ref(storage, `documents/${groupId}/aptitude_medicale.pdf`);
        const snap = await uploadBytes(docRef, files.aptitudeMedicaleFile);
        finalUpdates.aptitudeMedicaleDocUrl = await getDownloadURL(snap.ref);
      }

      await updateDoc(assocRef, finalUpdates);

      // Save HelloAsso key if included in updates
      if (updates.helloAssoSignatureKey !== undefined) {
        const credentialsRef = doc(db, 'associations', groupId, 'private_settings', 'credentials');
        await setDoc(credentialsRef, {
          helloAssoSignatureKey: updates.helloAssoSignatureKey
        }, { merge: true });
        setHelloAssoSignatureKey(updates.helloAssoSignatureKey);
      }
    } catch (err) {
      console.error("useTreasury - Erreur update association settings:", err);
      throw new Error("Erreur lors de l'enregistrement de la configuration.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Finance logic compiler for the Dashboard
  const calculateGlobalBalance = (startDateStr, endDateStr) => {
    const entries = []; // Each entry is { date, category, label, amount, type: 'recette' | 'depense' }

    const start = startDateStr ? new Date(startDateStr) : null;
    const end = endDateStr ? new Date(endDateStr) : null;

    const isWithinRange = (dateInput) => {
      if (!dateInput) return false;
      const dateVal = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
      const dateStr = dateVal.toISOString().split('T')[0];
      if (start && dateStr < startDateStr) return false;
      if (end && dateStr > endDateStr) return false;
      return dateStr;
    };

    // 1. Cotisations members (Recettes)
    const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
      ? associationSettings.montantAdhesion 
      : (associationSettings?.montantCotisation || 0);

    const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
      ? associationSettings.optionsCotisation 
      : [];

    members.forEach(member => {
      const status = member.paymentStatus || 'unpaid';
      if (status === 'unpaid' || status === 'exempted') return;

      let paymentDateObj = null;
      if (member.dateSignatureDroitImage) {
        paymentDateObj = member.dateSignatureDroitImage;
      } else if (member.dateSignatureAttestationSante) {
        paymentDateObj = member.dateSignatureAttestationSante;
      } else {
        paymentDateObj = start ? start : new Date();
      }

      const dateStr = isWithinRange(paymentDateObj);
      if (!dateStr) return;

      const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim();
      const baseAmount = parseFloat(baseAdhesionAmount) || 0;

      // Base membership
      if (member.adhesionBase !== false && baseAmount > 0) {
        entries.push({
          date: dateStr,
          category: 'Cotisations',
          label: `Adhésion - ${fullName}${status === 'partial' ? ' (Partielle)' : ''}`,
          amount: baseAmount,
          type: 'recette'
        });
      }

      // Options
      (member.selectedOptions || []).forEach(optId => {
        const opt = optionsCotisation.find(o => o.id === optId);
        if (opt && (parseFloat(opt.montant) || 0) > 0) {
          entries.push({
            date: dateStr,
            category: 'Cotisations',
            label: `Option ${opt.nom} - ${fullName}`,
            amount: parseFloat(opt.montant) || 0,
            type: 'recette'
          });
        }
      });
    });

    // 2. Commandes groupées (Recettes)
    const ARTICLE_PRICES = {
      "Baguettes d'Alfaia (Grosses, Petites ou Bacalhau)": 15,
      "Baguettes de Caixa": 10,
      "Baguette de Gonguê": 12,
      "Peau de Caixa": 25,
      "Peau d'Alfaia (18\", 20\" ou 22\")": 35,
      "Housse de protection Alfaia (18\", 20\" ou 22\")": 45,
      "Housse de protection Caixa": 30,
      "Sangle": 20,
      "Étui à baguettes": 15,
      "Pantalon": 40,
      "Chemise": 35,
      "T-shirt Homme": 15,
      "T-shirt Femme": 15,
      "Autre": 0
    };

    campaigns.forEach(camp => {
      const dateStr = isWithinRange(camp.dateCreation);
      if (!dateStr) return;

      const campReqs = campaignRequests.filter(r => r.campaignId === camp.id);
      campReqs.forEach(req => {
        const itemPrice = req.prix || req.montant || ARTICLE_PRICES[req.article] || 0;
        const qty = req.quantite || 1;
        const credit = itemPrice * qty;

        if (credit > 0) {
          entries.push({
            date: dateStr,
            category: 'Commandes Groupées',
            label: `${req.article} (${qty}x) - ${req.userName || 'Membre'}`,
            amount: credit,
            type: 'depense'
          });
        }
      });
    });

    // 3. Événements (Recettes et Dépenses)
    events.forEach(event => {
      const dateStr = isWithinRange(event.date);
      if (!dateStr) return;

      const rec = Number(event.montantRecette) || 0;
      const dep = Number(event.montantDepense) || 0;

      let displayType = event.type;
      if (event.type === 'prestation') displayType = "Prestation";
      else if (event.type === 'repetition') displayType = "Répétition";
      else if (event.type === 'stage') displayType = "Stage";
      else if (event.type === 'atelier') displayType = "Atelier";
      else if (event.type === 'reunion') displayType = "Réunion";

      if (rec > 0) {
        entries.push({
          date: dateStr,
          category: 'Événements',
          label: `Revenus - ${event.titre || 'Événement'} (${displayType})`,
          amount: rec,
          type: 'recette'
        });
      }
      if (dep > 0) {
        entries.push({
          date: dateStr,
          category: 'Événements',
          label: `Frais - ${event.titre || 'Événement'} (${displayType})`,
          amount: dep,
          type: 'depense'
        });
      }
    });

    // 4. Frais Kilométriques (Dépenses)
    const indemniteKilometrique = associationSettings?.indemniteKilometrique || 0;
    const enableCarpoolReimbursement = associationSettings?.enableCarpoolReimbursement !== false;

    if (indemniteKilometrique > 0 && enableCarpoolReimbursement) {
      events.forEach(event => {
        const dateStr = isWithinRange(event.date);
        if (!dateStr) return;

        const distance = event.distanceAllerRetourKm || 0;
        if (distance <= 0) return;

        // Drivers in convoi
        const convoiDrivers = [];
        if (event.covoiturage?.voitures) {
          event.covoiturage.voitures.forEach(voiture => {
            if (voiture.chauffeurId && voiture.chauffeurNom) {
              const status = calculateCarStatus(voiture, associationSettings);
              const userIns = event.inscriptions?.find(ins => ins.userId === voiture.chauffeurId);
              const wantsRefund = userIns?.status === 'present' && userIns?.demandeRemboursementKm === true;

              convoiDrivers.push({
                id: voiture.chauffeurId,
                nom: voiture.chauffeurNom,
                isEligibleRefund: status.isEligibleForReimbursement && wantsRefund
              });
            }
          });
        }

        // Individual drivers
        const convoiChauffeurIds = new Set(convoiDrivers.map(d => d.id));
        const individualDrivers = [];
        if (event.inscriptions) {
          event.inscriptions.forEach(ins => {
            if (ins.status === 'present' && ins.transport === 'propre') {
              if (!convoiChauffeurIds.has(ins.userId)) {
                individualDrivers.push({
                  id: ins.userId,
                  nom: ins.userName || ins.nom || 'Membre',
                  isEligibleRefund: ins.demandeRemboursementKm === true
                });
              }
            }
          });
        }

        const allDrivers = [...convoiDrivers, ...individualDrivers];
        allDrivers.forEach(driver => {
          if (driver.isEligibleRefund) {
            const refundAmount = distance * indemniteKilometrique;
            if (refundAmount > 0) {
              entries.push({
                date: dateStr,
                category: 'Frais Kilométriques',
                label: `Remboursement Km ${driver.nom} - ${event.titre || 'Événement'}`,
                amount: refundAmount,
                type: 'depense'
              });
            }
          }
        });
      });
    }

    // 5. Opérations Diverses (Recettes et Dépenses)
    transactions.forEach(tx => {
      const dateStr = isWithinRange(tx.date);
      if (!dateStr) return;

      const amount = Number(tx.montant) || 0;
      if (amount <= 0) return;

      if (tx.type === 'recette') {
        entries.push({
          date: dateStr,
          category: 'Opérations Diverses',
          label: tx.libelle || `Opération Libre - Recette`,
          amount: amount,
          type: 'recette'
        });
      } else {
        entries.push({
          date: dateStr,
          category: 'Opérations Diverses',
          label: tx.libelle || `Opération Libre - Dépense`,
          amount: amount,
          type: 'depense'
        });
      }
    });

    // Compute totals
    const totalRecettes = entries.filter(e => e.type === 'recette').reduce((sum, e) => sum + e.amount, 0);
    const totalDepenses = entries.filter(e => e.type === 'depense').reduce((sum, e) => sum + e.amount, 0);
    const solde = totalRecettes - totalDepenses;

    // Group entries by category for dashboard breakdown
    const categoriesBreakdown = {
      recette: {
        'Cotisations': 0,
        'Événements': 0,
        'Opérations Diverses': 0
      },
      depense: {
        'Événements': 0,
        'Commandes Groupées': 0,
        'Frais Kilométriques': 0,
        'Opérations Diverses': 0
      }
    };

    entries.forEach(e => {
      if (categoriesBreakdown[e.type] && categoriesBreakdown[e.type][e.category] !== undefined) {
        categoriesBreakdown[e.type][e.category] += e.amount;
      }
    });

    return {
      entries,
      totalRecettes,
      totalDepenses,
      solde,
      categoriesBreakdown
    };
  };

  return {
    members,
    transactions,
    events,
    associationSettings,
    campaigns,
    campaignRequests,
    helloAssoSignatureKey,
    loading,
    error,
    savingSettings,
    savingTx,
    updatingEventId,
    handleAddTx,
    handleDeleteTx,
    handleUpdateEventFinances,
    handleSaveAssociationSettings,
    calculateGlobalBalance
  };
}
