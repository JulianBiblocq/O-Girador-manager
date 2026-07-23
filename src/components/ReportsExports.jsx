import React, { useState, useEffect, useCallback } from 'react';
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

export default function ReportsExports({ groupId, role, isSystemAdmin, hasAccessTresorerie, profileData, onBack, isEmbedded }) {
  const { t } = useTranslation();
  
  // Set default dates to school year (Sep 1st of current/previous year to Aug 31st of current/next year)
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? currentYear : currentYear - 1;
  const defaultStartDate = `${startYear}-09-01`;
  const defaultEndDate = `${startYear + 1}-08-31`;

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [exportingAccounting, setExportingAccounting] = useState(false);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Load association settings for pricing & km refund configurations
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    getDoc(assocRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAssociationSettings(data);
        if (Array.isArray(data.bankAccounts)) {
          setBankAccounts(data.bankAccounts);
        }
      }
    }).catch(err => {
      console.error("ReportsExports - Error loading association settings:", err);
    });
  }, [groupId]);

  // Load & compute live accounting ledger entries
  const fetchLedgerData = useCallback(async () => {
    if (!groupId || !startDate || !endDate) return;
    setLoadingLedger(true);

    try {
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

      const entries = [];

      // 1. Process Events
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

        if (Array.isArray(event.budgetRecettes) && event.budgetRecettes.length > 0) {
          event.budgetRecettes.forEach(item => {
            const amount = Number(item.montant) || 0;
            if (amount > 0) {
              entries.push({
                id: `evt_rec_${event.id}_${item.intitule}`,
                date: eventDateStr,
                category: `Événement (${displayType})`,
                label: `${item.intitule || 'Recette'} - ${event.titre || 'Événement'}`,
                debit: 0,
                credit: amount
              });
            }
          });
        } else if (rec > 0) {
          entries.push({
            id: `evt_rec_${event.id}`,
            date: eventDateStr,
            category: `Événement (${displayType})`,
            label: `Revenus - ${event.titre || 'Événement'}`,
            debit: 0,
            credit: rec
          });
        }

        if (Array.isArray(event.budgetDepenses) && event.budgetDepenses.length > 0) {
          event.budgetDepenses.forEach(item => {
            const amount = Number(item.montant) || 0;
            if (amount > 0) {
              entries.push({
                id: `evt_dep_${event.id}_${item.intitule}`,
                date: eventDateStr,
                category: `Frais Événement`,
                label: `${item.intitule || 'Dépense'} - ${event.titre || 'Événement'}`,
                debit: amount,
                credit: 0
              });
            }
          });
        } else if (dep > 0) {
          entries.push({
            id: `evt_dep_${event.id}`,
            date: eventDateStr,
            category: `Frais Événement`,
            label: `Coûts - ${event.titre || 'Événement'}`,
            debit: dep,
            credit: 0
          });
        }
      });

      // 2. Process Cotisations
      const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
        ? associationSettings.montantAdhesion 
        : (associationSettings?.montantCotisation || 0);

      const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
        ? associationSettings.optionsCotisation 
        : [];

      users.forEach(member => {
        const status = member.paymentStatus || 'unpaid';
        if (status === 'unpaid') return;

        let paymentDateObj = null;
        if (member.dateSignatureDroitImage) {
          paymentDateObj = member.dateSignatureDroitImage.toDate();
        } else if (member.dateSignatureAttestationSante) {
          paymentDateObj = member.dateSignatureAttestationSante.toDate();
        } else {
          paymentDateObj = new Date(startDate);
        }

        const paymentDateStr = paymentDateObj.toISOString().split('T')[0];
        const isWithinRange = paymentDateStr >= startDate && paymentDateStr <= endDate;
        if (!isWithinRange) return;

        const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim();
        const baseAmount = parseFloat(baseAdhesionAmount) || 0;

        if (member.adhesionBase !== false && baseAmount > 0) {
          entries.push({
            id: `cot_base_${member.id}`,
            date: paymentDateStr,
            category: "Cotisation (Adhésion)",
            label: `Adhésion de ${fullName}${status === 'partial' ? ' (Partielle)' : ''}`,
            debit: 0,
            credit: baseAmount
          });
        }

        (member.selectedOptions || []).forEach(optId => {
          const opt = optionsCotisation.find(o => o.id === optId);
          if (opt && (parseFloat(opt.montant) || 0) > 0) {
            entries.push({
              id: `cot_opt_${member.id}_${optId}`,
              date: paymentDateStr,
              category: "Cotisation (Option)",
              label: `Option ${opt.nom} - ${fullName}`,
              debit: 0,
              credit: parseFloat(opt.montant) || 0
            });
          }
        });
      });

      // 3. Process Group Orders
      campaigns.forEach(camp => {
        const campDateStr = camp.dateCreation ? camp.dateCreation.substring(0, 10) : '';
        const isWithinRange = campDateStr && campDateStr >= startDate && campDateStr <= endDate;
        if (!isWithinRange) return;

        const campReqs = requests.filter(r => r.campaignId === camp.id);
        campReqs.forEach(req => {
          const itemPrice = req.prix || req.montant || ARTICLE_PRICES[req.article] || 0;
          const qty = req.quantite || 1;
          const credit = itemPrice * qty;

          if (credit > 0) {
            entries.push({
              id: `cmd_${req.id}`,
              date: campDateStr,
              category: "Commande Groupée",
              label: `${req.article} (${qty}x) - ${req.userName || 'Membre'}`,
              debit: credit,
              credit: 0
            });
          }
        });
      });

      // 4. Process Kilometric Reimbursements
      const indemniteKilometrique = associationSettings?.indemniteKilometrique || 0;
      const enableCarpoolReimbursement = associationSettings?.enableCarpoolReimbursement !== false;

      if (indemniteKilometrique > 0 && enableCarpoolReimbursement) {
        events.forEach(event => {
          const eventDateStr = event.date ? event.date.substring(0, 10) : '';
          const isWithinRange = eventDateStr && eventDateStr >= startDate && eventDateStr <= endDate;
          if (!isWithinRange) return;

          const distance = event.distanceAllerRetourKm || 0;
          if (distance <= 0) return;

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
                  id: `km_${event.id}_${driver.id}`,
                  date: eventDateStr,
                  category: "Défraiement Covoiturage",
                  label: `Remboursement Km ${driver.nom} - ${event.titre || 'Événement'}`,
                  debit: refundAmount,
                  credit: 0
                });
              }
            }
          });
        });
      }

      // 5. Process Manual Transactions
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
          entries.push({
            id: `tx_${tx.id}`,
            date: txDateStr,
            category: `Opérations Diverses (Recette - ${tx.categorie || 'Autre'})`,
            label: tx.libelle || 'Recette',
            debit: 0,
            credit: amount
          });
        } else {
          entries.push({
            id: `tx_${tx.id}`,
            date: txDateStr,
            category: `Opérations Diverses (Dépense - ${tx.categorie || 'Autre'})`,
            label: tx.libelle || 'Dépense',
            debit: amount,
            credit: 0
          });
        }
      });

      // Sort entries chronologically
      entries.sort((a, b) => new Date(a.date) - new Date(b.date));
      setLedgerEntries(entries);

    } catch (err) {
      console.error("ReportsExports - Error building ledger entries:", err);
    } finally {
      setLoadingLedger(false);
    }
  }, [groupId, startDate, endDate, associationSettings]);

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  // Filter ledger entries by search query
  const filteredEntries = ledgerEntries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      entry.date.includes(q) ||
      (entry.category && entry.category.toLowerCase().includes(q)) ||
      (entry.label && entry.label.toLowerCase().includes(q))
    );
  });

  const totalCredit = filteredEntries.reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);
  const totalDebit = filteredEntries.reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);
  const soldePeriode = totalCredit - totalDebit;

  const handleExportAccounting = async () => {
    if (ledgerEntries.length === 0) {
      alert("Aucune écriture comptable trouvée pour cette période.");
      return;
    }
    setExportingAccounting(true);
    try {
      const headers = ["Date", "Catégorie", "Libellé", "Débit (-)", "Crédit (+)"];
      const rows = ledgerEntries.map(entry => [
        entry.date,
        entry.category,
        entry.label,
        entry.debit > 0 ? entry.debit.toString() : '',
        entry.credit > 0 ? entry.credit.toString() : ''
      ]);

      const totalSoldeBancaire = bankAccounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
      const tresorerieProjetee = totalSoldeBancaire + soldePeriode;

      const formatCsvDate = (isoString) => {
        if (!isoString) return "-";
        try {
          const date = new Date(isoString);
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return "-";
        }
      };

      const csvLines = [
        headers,
        ...rows,
        ["", "", "", "", ""],
        ["SITUATION DE TRÉSORERIE", "", "", "", ""],
        ["Indicateur", "Montant (€)", "", "", ""],
        ["Total Solde Bancaire Actuel", totalSoldeBancaire.toFixed(2), "", "", ""],
        ["Impact Opérationnel (Bilan de la Période)", soldePeriode.toFixed(2), "", "", ""],
        ["Trésorerie Projetée", tresorerieProjetee.toFixed(2), "", "", ""],
        ["", "", "", "", ""],
        ["Détail des Comptes Bancaires", "", "", "", ""],
        ["Nom du Compte", "Solde Actuel (€)", "Seuil Critique (€)", "Dernière Mise à jour", ""],
        ...bankAccounts.map(acc => [
          acc.name || "Compte sans nom",
          (parseFloat(acc.balance) || 0).toFixed(2),
          (parseFloat(acc.threshold) || 0).toFixed(2),
          formatCsvDate(acc.updatedAt),
          ""
        ])
      ];

      const csvContent = "\uFEFF" + csvLines
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
    <div className={`flex flex-col text-left select-none w-full ${isEmbedded ? 'gap-4' : 'gap-6 max-w-4xl mx-auto'}`}>
      {/* Header */}
      {!isEmbedded && (
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
      )}

      {/* Intro info box */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        📊 <strong>Grand Livre Comptable en Direct</strong> : Visualisez le bilan de votre association pour la période choisie avant d'exporter les données au format CSV (Excel, LibreOffice, Google Sheets).
      </div>

      {/* Date Filters & Actions Card */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-dashed border-cordel-master-dark/15 pb-2">
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            📅 Période du Bilan
          </h3>
          <CordelButton
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleExportAccounting}
            disabled={exportingAccounting || ledgerEntries.length === 0}
            className="text-xs px-3 py-1.5 font-black uppercase tracking-wider shrink-0"
          >
            {exportingAccounting ? "Génération..." : "📥 Exporter en CSV"}
          </CordelButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Date de début
            </label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="theme-input w-full font-bold text-xs"
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
              className="theme-input w-full font-bold text-xs"
            />
          </div>
        </div>
      </CordelCard>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-encre-noire/20 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-[5px_3px_6px_4px] text-center shadow-xs">
          <div className="text-[9px] uppercase font-black text-green-800 dark:text-green-300 opacity-80 tracking-wider">Total Recettes (+)</div>
          <div className="text-xl font-black text-green-700 dark:text-green-300 mt-0.5">{totalCredit.toFixed(2)} €</div>
        </div>
        <div className="border border-encre-noire/20 p-3 bg-red-50/50 dark:bg-red-950/20 rounded-[4px_6px_3px_5px] text-center shadow-xs">
          <div className="text-[9px] uppercase font-black text-red-800 dark:text-red-300 opacity-80 tracking-wider">Total Dépenses (-)</div>
          <div className="text-xl font-black text-red-700 dark:text-red-300 mt-0.5">{totalDebit.toFixed(2)} €</div>
        </div>
        <div className={`border-2 border-encre-noire p-3 rounded-[6px_4px_5px_3px] text-center shadow-[2px_2px_0px_0px_#181716] ${soldePeriode >= 0 ? 'bg-[#e2ecc8] dark:bg-emerald-950/30' : 'bg-[#f7d6d0] dark:bg-rose-950/30'}`}>
          <div className="text-[9px] uppercase font-black text-encre-noire tracking-wider">Solde Période</div>
          <div className={`text-xl font-black mt-0.5 ${soldePeriode >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {soldePeriode >= 0 ? '+' : ''}{soldePeriode.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Live Table Container */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3">
        {/* Table Search & Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
              📜 Grand Livre Comptable en Direct
            </h3>
            <span className="text-[10px] font-black text-cordel-master-dark/60 bg-cordel-bg-light px-2 py-0.5 rounded border border-encre-noire/15">
              {filteredEntries.length} écriture{filteredEntries.length > 1 ? 's' : ''}
            </span>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Filtrer par libellé, membre..."
            className="theme-input text-xs font-semibold py-1 px-2.5 w-full sm:w-64 bg-cordel-bg-light"
          />
        </div>

        {/* Live Table */}
        {loadingLedger ? (
          <div className="flex justify-center items-center py-10">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Calcul du grand livre en cours...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center bg-white/40 border border-dashed border-cordel-master-dark/20 rounded">
            <p className="text-xs opacity-70 font-bold">
              {searchQuery ? "Aucune écriture comptable ne correspond à votre recherche." : "Aucune écriture comptable sur cette période."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-encre-noire rounded-md bg-white dark:bg-black/10 shadow-xs max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-cordel-wood text-white sticky top-0 z-10 text-[10px] uppercase font-black tracking-wider select-none">
                <tr>
                  <th className="p-2 border-b border-encre-noire">Date</th>
                  <th className="p-2 border-b border-encre-noire">Catégorie</th>
                  <th className="p-2 border-b border-encre-noire">Libellé / Détail</th>
                  <th className="p-2 border-b border-encre-noire text-right text-red-200">Débit (-)</th>
                  <th className="p-2 border-b border-encre-noire text-right text-green-200">Crédit (+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-encre-noire/15 text-[11px] font-semibold">
                {filteredEntries.map((entry) => {
                  const isDebit = entry.debit > 0;
                  const isCredit = entry.credit > 0;

                  return (
                    <tr key={entry.id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors">
                      <td className="p-2 whitespace-nowrap font-mono text-[10px] text-cordel-master-dark/70">
                        {entry.date}
                      </td>
                      <td className="p-2">
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isCredit 
                            ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-400/40' 
                            : 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-400/40'
                        }`}>
                          {entry.category}
                        </span>
                      </td>
                      <td className="p-2 font-bold text-encre-noire dark:text-cordel-bg-light">
                        {entry.label}
                      </td>
                      <td className="p-2 text-right font-mono font-black text-red-700 dark:text-red-400">
                        {isDebit ? `${entry.debit.toFixed(2)} €` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-black text-green-700 dark:text-green-400">
                        {isCredit ? `${entry.credit.toFixed(2)} €` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer Row */}
              <tfoot className="bg-cordel-bg-light border-t-2 border-encre-noire text-[11px] font-black sticky bottom-0 z-10">
                <tr>
                  <td colSpan={3} className="p-2 uppercase text-cordel-wood">Total Période</td>
                  <td className="p-2 text-right font-mono text-red-800">{totalDebit.toFixed(2)} €</td>
                  <td className="p-2 text-right font-mono text-green-800">{totalCredit.toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
