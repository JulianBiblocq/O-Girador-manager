import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloScroll } from './XiloIcons';
import { useTranslation } from './LanguageContext';

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

export default function ReportsExports({ groupId, role, isSystemAdmin, hasAccessTresorerie, profileData, onBack }) {
  const { t } = useTranslation();
  
  // Set default dates to school year (Sep 1st of current/previous year to Aug 31st of current/next year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
  const defaultStartDate = `${startYear}-09-01`;
  const defaultEndDate = `${startYear + 1}-08-31`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  
  const [eventTypes, setEventTypes] = useState({
    prestation: true,
    repetition: true,
    stage: true,
    atelier: true,
    reunion: true
  });

  const [exportingActivity, setExportingActivity] = useState(false);
  const [exportingAccounting, setExportingAccounting] = useState(false);
  const [associationSettings, setAssociationSettings] = useState(null);

  // Load association settings for pricing & km refund configurations
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    getDoc(assocRef).then((snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
    }).catch(err => {
      console.error("ReportsExports - Error loading association settings:", err);
    });
  }, [groupId]);

  const handleCheckboxChange = (type) => {
    setEventTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleExportActivity = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une date de début et de fin.");
      return;
    }
    setExportingActivity(true);
    try {
      // Fetch events
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);
      
      const fetchedEvents = [];
      querySnapshot.forEach((docSnap) => {
        fetchedEvents.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Filter events by date range and type
      const filteredEvents = fetchedEvents.filter(event => {
        const eventDateStr = event.date ? event.date.substring(0, 10) : '';
        const matchesDate = eventDateStr && eventDateStr >= startDate && eventDateStr <= endDate;
        const matchesType = eventTypes[event.type] === true;
        return matchesDate && matchesType;
      });

      // Sort chronologically
      filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Build CSV content
      const headers = ["Date", "Titre", "Type", "Lieu", "Nombre de présents"];
      const rows = filteredEvents.map(event => {
        const dateStr = event.date ? event.date.substring(0, 10) : '';
        const presentCount = (event.inscriptions || []).filter(i => i.status === 'present').length;
        
        let displayType = event.type;
        if (event.type === 'prestation') displayType = "Prestation";
        else if (event.type === 'repetition') displayType = "Répétition";
        else if (event.type === 'stage') displayType = "Stage";
        else if (event.type === 'atelier') displayType = "Atelier";
        else if (event.type === 'reunion') displayType = "Réunion";

        return [
          dateStr,
          event.titre || '',
          displayType,
          event.lieu || '',
          presentCount.toString()
        ];
      });

      // Excel-friendly CSV formatting (semicolon separator, UTF-8 BOM)
      const csvContent = "\uFEFF" + [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Bilan_Activite_${startDate}_au_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("ReportsExports - Error exporting activity:", error);
      alert("Erreur lors de la génération de l'export d'activité.");
    } finally {
      setExportingActivity(false);
    }
  };

  const handleExportAccounting = async () => {
    if (!startDate || !endDate) {
      alert("Veuillez sélectionner une date de début et de fin.");
      return;
    }
    setExportingAccounting(true);
    try {
      // 1. Fetch all datasets from Firestore
      const eventsRef = collection(db, 'events');
      const usersRef = collection(db, 'users');
      const campaignsRef = collection(db, 'campaigns');
      const requestsRef = collection(db, 'campaignRequests');
      const transactionsRef = collection(db, 'transactions');

      const [eventsSnap, usersSnap, campaignsSnap, requestsSnap, transactionsSnap] = await Promise.all([
        getDocs(query(eventsRef, where('groupId', '==', groupId))),
        getDocs(query(usersRef, where('groupId', '==', groupId))),
        getDocs(query(campaignsRef, where('groupId', '==', groupId))),
        getDocs(query(requestsRef, where('groupId', '==', groupId))),
        getDocs(query(transactionsRef, where('groupId', '==', groupId)))
      ]);

      const events = [];
      eventsSnap.forEach(d => events.push({ id: d.id, ...d.data() }));

      const users = [];
      usersSnap.forEach(d => users.push({ id: d.id, ...d.data() }));

      const campaigns = [];
      campaignsSnap.forEach(d => campaigns.push({ id: d.id, ...d.data() }));

      const requests = [];
      requestsSnap.forEach(d => requests.push({ id: d.id, ...d.data() }));

      const transactions = [];
      transactionsSnap.forEach(d => transactions.push({ id: d.id, ...d.data() }));

      const ledgerEntries = []; // Each entry is { date, category, label, debit, credit }

      // 2. Process Events (montantRecette, montantDepense)
      events.forEach(event => {
        const eventDateStr = event.date ? event.date.substring(0, 10) : '';
        const isWithinRange = eventDateStr && eventDateStr >= startDate && eventDateStr <= endDate;
        if (!isWithinRange) return;

        let displayType = event.type;
        if (event.type === 'prestation') displayType = "Prestation";
        else if (event.type === 'repetition') displayType = "Répétition";
        else if (event.type === 'stage') displayType = "Stage";
        else if (event.type === 'atelier') displayType = "Atelier";
        else if (event.type === 'reunion') displayType = "Réunion";

        const rec = Number(event.montantRecette) || 0;
        const dep = Number(event.montantDepense) || 0;

        if (rec > 0) {
          ledgerEntries.push({
            date: eventDateStr,
            category: `Événement (${displayType})`,
            label: `Revenus - ${event.titre || 'Événement'}`,
            debit: '',
            credit: rec
          });
        }
        if (dep > 0) {
          ledgerEntries.push({
            date: eventDateStr,
            category: `Frais Événement`,
            label: `Coûts - ${event.titre || 'Événement'}`,
            debit: dep,
            credit: ''
          });
        }
      });

      // 3. Process Cotisations (paid/partial memberships + selected options)
      const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
        ? associationSettings.montantAdhesion 
        : (associationSettings?.montantCotisation || 0);

      const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
        ? associationSettings.optionsCotisation 
        : [];

      users.forEach(member => {
        const status = member.paymentStatus || 'unpaid';
        if (status === 'unpaid') return; // Only process paid or partial payments

        // Determine signature / payment date
        let paymentDateObj = null;
        if (member.dateSignatureDroitImage) {
          paymentDateObj = member.dateSignatureDroitImage.toDate();
        } else if (member.dateSignatureAttestationSante) {
          paymentDateObj = member.dateSignatureAttestationSante.toDate();
        } else {
          // Fallback: start of selected period
          paymentDateObj = new Date(startDate);
        }

        const paymentDateStr = paymentDateObj.toISOString().split('T')[0];
        const isWithinRange = paymentDateStr >= startDate && paymentDateStr <= endDate;
        if (!isWithinRange) return;

        const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim();
        const baseAmount = parseFloat(baseAdhesionAmount) || 0;

        // Base membership credit
        if (member.adhesionBase !== false && baseAmount > 0) {
          ledgerEntries.push({
            date: paymentDateStr,
            category: "Cotisation (Adhésion)",
            label: `Adhésion de ${fullName}${status === 'partial' ? ' (Partielle)' : ''}`,
            debit: '',
            credit: baseAmount
          });
        }

        // Selected options credit
        (member.selectedOptions || []).forEach(optId => {
          const opt = optionsCotisation.find(o => o.id === optId);
          if (opt && (parseFloat(opt.montant) || 0) > 0) {
            ledgerEntries.push({
              date: paymentDateStr,
              category: "Cotisation (Option)",
              label: `Option ${opt.nom} - ${fullName}`,
              debit: '',
              credit: parseFloat(opt.montant) || 0
            });
          }
        });
      });

      // 4. Process Group Orders (campaignRequests)
      campaigns.forEach(camp => {
        const campDateStr = camp.dateCreation ? camp.dateCreation.substring(0, 10) : '';
        const isWithinRange = campDateStr && campDateStr >= startDate && campDateStr <= endDate;
        if (!isWithinRange) return;

        // Filter requests related to this campaign
        const campReqs = requests.filter(r => r.campaignId === camp.id);

        campReqs.forEach(req => {
          const itemPrice = req.prix || req.montant || ARTICLE_PRICES[req.article] || 0;
          const qty = req.quantite || 1;
          const credit = itemPrice * qty;

          if (credit > 0) {
            ledgerEntries.push({
              date: campDateStr,
              category: "Commande Groupée",
              label: `${req.article} (${qty}x) - ${req.userName || 'Membre'}`,
              debit: '',
              credit: credit
            });
          }
        });
      });

      // 5. Process Kilometric Reimbursements / Carpool Refunds
      const indemniteKilometrique = associationSettings?.indemniteKilometrique || 0;
      const enableCarpoolReimbursement = associationSettings?.enableCarpoolReimbursement !== false;

      if (indemniteKilometrique > 0 && enableCarpoolReimbursement) {
        events.forEach(event => {
          const eventDateStr = event.date ? event.date.substring(0, 10) : '';
          const isWithinRange = eventDateStr && eventDateStr >= startDate && eventDateStr <= endDate;
          if (!isWithinRange) return;

          const distance = event.distanceAllerRetourKm || 0;
          if (distance <= 0) return;

          // Extract convoi drivers
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

          // Extract individual drivers
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
                ledgerEntries.push({
                  date: eventDateStr,
                  category: "Défraiement Covoiturage",
                  label: `Remboursement Km ${driver.nom} - ${event.titre || 'Événement'}`,
                  debit: refundAmount,
                  credit: ''
                });
              }
            }
          });
        });
      }

      // 5.5. Process manual transactions (Opérations Diverses)
      transactions.forEach(tx => {
        let txDateStr = '';
        if (tx.date) {
          if (typeof tx.date.toDate === 'function') {
            txDateStr = tx.date.toDate().toISOString().split('T')[0];
          } else if (tx.date instanceof Date) {
            txDateStr = tx.date.toISOString().split('T')[0];
          } else {
            txDateStr = String(tx.date).substring(0, 10);
          }
        }
        
        const isWithinRange = txDateStr && txDateStr >= startDate && txDateStr <= endDate;
        if (!isWithinRange) return;

        const amount = Number(tx.montant) || 0;
        if (amount <= 0) return;

        if (tx.type === 'recette') {
          ledgerEntries.push({
            date: txDateStr,
            category: `Opération Diverses (Recette - ${tx.categorie})`,
            label: tx.libelle || 'Recette',
            debit: '',
            credit: amount
          });
        } else {
          ledgerEntries.push({
            date: txDateStr,
            category: `Opération Diverses (Dépense - ${tx.categorie})`,
            label: tx.libelle || 'Dépense',
            debit: amount,
            credit: ''
          });
        }
      });

      // 6. Sort all ledger entries chronologically
      ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

      // 7. Format CSV & Trigger Download
      const headers = ["Date", "Catégorie", "Libellé", "Débit (-)", "Crédit (+)"];
      const rows = ledgerEntries.map(entry => [
        entry.date,
        entry.category,
        entry.label,
        entry.debit !== '' ? entry.debit.toString() : '',
        entry.credit !== '' ? entry.credit.toString() : ''
      ]);

      const csvContent = "\uFEFF" + [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Grand_Livre_Comptable_${startDate}_au_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("ReportsExports - Error exporting accounting:", error);
      alert("Erreur lors de la génération du grand livre comptable.");
    } finally {
      setExportingAccounting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ {t('common.back') || "Retour"}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloScroll size={16} /> Rapports & Exports
        </h2>
      </div>

      {/* Intro info box */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        📊 Ce module permet d'extraire les données d'activité et de comptabilité pour une période choisie. Il vous aide à préparer vos rapports moraux et financiers pour vos Assemblées Générales de fin de saison. Les exports sont générés sous forme de fichiers tableurs CSV compatibles avec Microsoft Excel, LibreOffice et Google Sheets.
      </div>

      {/* Date Filters Card */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1 mb-1">
          📅 Choix de la Période
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de début
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="theme-input w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de fin
            </label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="theme-input w-full"
            />
          </div>
        </div>
      </CordelCard>

      {/* Grid of exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export 1: Bilan d'Activité */}
        <CordelCard variant="default" useExtremeBorder={false} className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-1.5">
              🎭 Bilan d'Activité
            </h4>
            <p className="text-[10px] leading-relaxed opacity-85">
              Génère la liste des événements survenus pendant la période spécifiée avec les détails de présence. Idéal pour votre rapport d'activité.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Types d'événements à inclure :</span>
              <div className="flex flex-col gap-1.5 pl-1">
                {Object.keys(eventTypes).map(type => (
                  <label key={type} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={eventTypes[type]}
                      onChange={() => handleCheckboxChange(type)}
                      className="accent-cordel-wood scale-105"
                    />
                    <span className="capitalize">
                      {type === 'prestation' ? "Prestations" :
                       type === 'repetition' ? "Répétitions" :
                       type === 'stage' ? "Stages" :
                       type === 'atelier' ? "Ateliers" :
                       type === 'reunion' ? "Réunions" : type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleExportActivity}
              disabled={exportingActivity}
              className="w-full text-xs py-2.5 font-bold uppercase tracking-wider"
            >
              {exportingActivity ? "Génération..." : "📄 Exporter l'Activité (CSV)"}
            </CordelButton>
          </div>
        </CordelCard>

        {/* Export 2: Bilan Comptable */}
        <CordelCard variant="default" useExtremeBorder={false} className="p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <h4 className="text-[11px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-1.5">
              💰 Bilan Comptable
            </h4>
            <p className="text-[10px] leading-relaxed opacity-85">
              Compile toutes les transactions de la période pour construire un **Grand Livre Comptable**.
            </p>
            <div className="flex flex-col gap-2 text-[10px] bg-cordel-bg-light/10 border border-dashed border-cordel-master-dark/10 p-3 rounded leading-relaxed">
              <span className="font-bold text-cordel-wood">Écritures incluses :</span>
              <ul className="list-disc pl-4 flex flex-col gap-1">
                <li>🟢 **Recettes d'Événements** (Prestations payées, etc.)</li>
                <li>🔴 **Frais d'Événements** (Professeurs, locations...)</li>
                <li>🟢 **Cotisations & Options** payées par les membres</li>
                <li>🟢 **Commandes Groupées** passées par la troupe</li>
                <li>🔴 **Défraiements Kilométriques** à rembourser aux covoitureurs</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6">
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleExportAccounting}
              disabled={exportingAccounting}
              className="w-full text-xs py-2.5 font-bold uppercase tracking-wider"
            >
              {exportingAccounting ? "Génération..." : "📊 Exporter la Comptabilité (CSV)"}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    </div>
  );
}
