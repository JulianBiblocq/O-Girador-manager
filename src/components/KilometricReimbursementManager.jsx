import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { XiloCar, XiloCoin } from './XiloIcons';

// Algorithme de calcul de l'occupation et éligibilité du véhicule
const calculateCarStatus = (car, associationSettings) => {
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

  return {
    isFull,
    isEligibleForReimbursement
  };
};

export default function KilometricReimbursementManager({ groupId, onBack, role, isSystemAdmin, hasAccessTresorerie }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'members', 'events'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null); // stores member or event ID to expand details

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessTresorerie === true;

  // 1. Charger les paramètres de l'association
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
    }, (err) => {
      console.error("KilometricReimbursementManager - Error fetching association settings:", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Charger les membres actifs
  useEffect(() => {
    if (!groupId || !isAuthorized) {
      setLoading(false);
      return;
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const isActive = !data.statutActuel || data.statutActuel === 'active';
        if (isActive) {
          fetched.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      setMembers(fetched);
    }, (err) => {
      console.error("KilometricReimbursementManager - Error fetching users:", err);
    });
    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // 3. Charger tous les événements de l'association
  useEffect(() => {
    if (!groupId || !isAuthorized) {
      setLoading(false);
      return;
    }
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Sort chronologically desc
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
      setLoading(false);
    }, (err) => {
      console.error("KilometricReimbursementManager - Error fetching events:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('widgetTreasury.accessDenied') || "ACCÈS REFUSÉ"}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous devez être administrateur ou trésorier pour accéder aux remboursements kilométriques.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ {t('common.back')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const indemniteKilometrique = associationSettings?.indemniteKilometrique || 0;
  const enableCarpoolReimbursement = associationSettings?.enableCarpoolReimbursement !== false;
  const reimbursementRule = associationSettings?.reimbursementRule || 'full_cars_only';

  // 4. Traitement des remboursements kilométriques
  const compileReimbursements = () => {
    const memberMap = new Map(); // userId -> { memberName, trips: [], totalKm: 0, totalRefund: 0 }
    const eventList = []; // list of { eventId, eventTitle, eventDate, totalKm, totalRefund, drivers: [] }

    events.forEach(event => {
      const distance = event.distanceAllerRetourKm || 0;
      if (distance <= 0) return;

      // Extract drivers in the convoi
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
              isEligibleRefund: status.isEligibleForReimbursement && wantsRefund,
              type: 'convoi'
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
                isEligibleRefund: ins.demandeRemboursementKm === true,
                type: 'individuel'
              });
            }
          }
        });
      }

      const allEventDrivers = [...convoiDrivers, ...individualDrivers];
      let eventKm = 0;
      let eventRefund = 0;
      const driversDetails = [];

      allEventDrivers.forEach(driver => {
        const isEligible = driver.isEligibleRefund && enableCarpoolReimbursement;
        const refundAmount = isEligible ? distance * indemniteKilometrique : 0;
        const kmAmount = isEligible ? distance : 0;

        eventKm += kmAmount;
        eventRefund += refundAmount;

        driversDetails.push({
          id: driver.id,
          nom: driver.nom,
          type: driver.type,
          isEligible,
          refundAmount
        });

        // Add to memberMap
        if (!memberMap.has(driver.id)) {
          memberMap.set(driver.id, {
            id: driver.id,
            nom: driver.nom,
            trips: [],
            totalKm: 0,
            totalRefund: 0
          });
        }

        const mData = memberMap.get(driver.id);
        mData.trips.push({
          eventId: event.id,
          title: event.titre || event.title || 'Événement',
          date: event.date,
          type: driver.type,
          distance,
          isEligible,
          refundAmount
        });
        mData.totalKm += kmAmount;
        mData.totalRefund += refundAmount;
      });

      if (allEventDrivers.length > 0) {
        eventList.push({
          id: event.id,
          title: event.titre || event.title || 'Événement',
          date: event.date,
          totalKm: eventKm,
          totalRefund: eventRefund,
          drivers: driversDetails
        });
      }
    });

    const memberList = Array.from(memberMap.values());
    // Sort members by refund amount desc
    memberList.sort((a, b) => b.totalRefund - a.totalRefund);

    return { memberList, eventList };
  };

  const { memberList, eventList } = compileReimbursements();

  // Filter members by search query
  const filteredMemberList = memberList.filter(m => 
    m.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute grand totals
  const totalRefundedKm = memberList.reduce((sum, m) => sum + m.totalKm, 0);
  const totalRefundedAmount = memberList.reduce((sum, m) => sum + m.totalRefund, 0);
  const totalTripsCount = memberList.reduce((sum, m) => sum + m.trips.filter(t => t.isEligible).length, 0);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Chauffeur / Membre",
      "Nombre de trajets remboursés",
      "Total Kilomètres",
      "Indemnité due (€)"
    ];

    const rows = memberList.map(m => [
      m.nom,
      m.trips.filter(t => t.isEligible).length,
      m.totalKm,
      m.totalRefund.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `remboursements_km_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          ⬅️ {t('common.back')}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloCar size={16} /> {t('menu.kilometricReimbursement') || "Remboursements Kilométriques"}
        </h2>
      </div>

      {/* Info card & Config display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed flex flex-col justify-center">
          <div>
            🚗 Ce module compile les demandes de remboursement de frais de déplacement calculées automatiquement lors des événements. Un trajet en convoi n'est remboursé que s'il est considéré comme complet (selon la règle active). Les trajets individuels sont toujours comptabilisés s'ils sont signalés comme déplacements par propres moyens.
          </div>
        </div>
        
        <div className="border border-encre-noire/30 p-3 rounded-[4px_6px_3px_5px] bg-[var(--cordel-bg-light)] text-[10px] flex flex-col gap-1.5 justify-center shadow-[1.5px_1.5px_0px_0px_#181716]">
          <span className="font-bold text-cordel-wood uppercase tracking-wide">Configuration Active :</span>
          <div>💵 Tarif kilométrique : <span className="font-black">{indemniteKilometrique.toFixed(2)} €/km</span></div>
          <div>🔌 Covoiturage actif : <span className="font-black">{enableCarpoolReimbursement ? "Oui" : "Non"}</span></div>
          <div>⚙️ Règle de remboursement : <span className="font-black">
            {reimbursementRule === 'full_cars_only' ? "Véhicules complets uniquement" : "Tous les conducteurs"}
          </span></div>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-cordel-master-dark/20 pb-2">
        <button
          onClick={() => { setActiveTab('summary'); setExpandedRow(null); }}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
            activeTab === 'summary' 
              ? 'bg-cordel-wood text-cordel-bg-light border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
              : 'border border-dashed border-cordel-master-dark/35 text-encre-noire hover:bg-cordel-hover'
          }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => { setActiveTab('members'); setExpandedRow(null); }}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
            activeTab === 'members' 
              ? 'bg-cordel-wood text-cordel-bg-light border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
              : 'border border-dashed border-cordel-master-dark/35 text-encre-noire hover:bg-cordel-hover'
          }`}
        >
          Par Membre ({memberList.length})
        </button>
        <button
          onClick={() => { setActiveTab('events'); setExpandedRow(null); }}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] cursor-pointer transition-all ${
            activeTab === 'events' 
              ? 'bg-cordel-wood text-cordel-bg-light border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]' 
              : 'border border-dashed border-cordel-master-dark/35 text-encre-noire hover:bg-cordel-hover'
          }`}
        >
          Par Événement ({eventList.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
            Chargement des calculs...
          </span>
        </div>
      ) : (
        <>
          {activeTab === 'summary' && (
            <div className="flex flex-col gap-6">
              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">Trajets éligibles</span>
                  <span className="text-xl font-black text-cordel-wood">{totalTripsCount}</span>
                </CordelCard>
                <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">Kilomètres parcourus</span>
                  <span className="text-xl font-black text-cordel-wood">{totalRefundedKm.toFixed(0)} km</span>
                </CordelCard>
                <CordelCard className="p-4 flex flex-col gap-1 items-center bg-white/50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">Montant total à défraier</span>
                  <span className="text-xl font-black text-green-700">{totalRefundedAmount.toFixed(2)} €</span>
                </CordelCard>
              </div>

              {/* Top drivers list summary */}
              <CordelCard variant="default" className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2 mb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                    Résumé des remboursements dus
                  </h3>
                  {memberList.length > 0 && (
                    <CordelButton variant="default" onClick={handleExportCSV} className="text-[9px] py-1 px-2.5">
                      📥 Exporter CSV (Excel)
                    </CordelButton>
                  )}
                </div>

                {memberList.length === 0 ? (
                  <p className="text-xs italic opacity-60 text-center py-4">Aucune demande de défraiement calculée sur la période.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {memberList.slice(0, 5).map(m => (
                      <div key={m.id} className="flex justify-between items-center text-xs border-b border-dashed border-encre-noire/10 pb-1 mb-1 last:border-none last:pb-0 last:mb-0">
                        <span className="font-semibold text-encre-noire">{m.nom}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] opacity-75 font-medium">{m.totalKm.toFixed(0)} km</span>
                          <span className="font-black text-green-700">{m.totalRefund.toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                    {memberList.length > 5 && (
                      <button 
                        onClick={() => setActiveTab('members')}
                        className="text-[10px] font-bold text-center text-cordel-wood hover:underline mt-2 self-center"
                      >
                        Voir tous les membres ({memberList.length}) →
                      </button>
                    )}
                  </div>
                )}
              </CordelCard>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="w-full">
                <input 
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 text-xs border border-encre-noire/30 rounded focus:border-cordel-wood focus:outline-none bg-white/80"
                />
              </div>

              {/* Members table */}
              <CordelCard className="p-0 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                        <th className="py-2.5 px-3">Membre / Conducteur</th>
                        <th className="py-2.5 px-3 text-center">Trajets</th>
                        <th className="py-2.5 px-3 text-center">Distance Cumulée</th>
                        <th className="py-2.5 px-3 text-right">Remboursement</th>
                        <th className="py-2.5 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMemberList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center italic opacity-60">
                            Aucun conducteur trouvé.
                          </td>
                        </tr>
                      ) : (
                        filteredMemberList.map(m => {
                          const isExpanded = expandedRow === m.id;
                          return (
                            <React.Fragment key={m.id}>
                              <tr 
                                onClick={() => setExpandedRow(isExpanded ? null : m.id)}
                                className={`border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover cursor-pointer transition-colors ${
                                  isExpanded ? 'bg-cordel-hover/50' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 font-bold text-encre-noire">{m.nom}</td>
                                <td className="py-2.5 px-3 text-center font-semibold">
                                  {m.trips.filter(t => t.isEligible).length}
                                </td>
                                <td className="py-2.5 px-3 text-center font-semibold">{m.totalKm.toFixed(0)} km</td>
                                <td className="py-2.5 px-3 text-right font-black text-green-700">
                                  {m.totalRefund.toFixed(2)} €
                                </td>
                                <td className="py-2.5 px-3 text-center text-[10px] text-cordel-wood font-black">
                                  {isExpanded ? '▼ Fermer' : '▶ Détails'}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-white/30">
                                  <td colSpan={5} className="py-3 px-6 border-b border-dashed border-encre-noire/25">
                                    <div className="flex flex-col gap-2">
                                      <h4 className="text-[10px] font-black uppercase text-cordel-wood tracking-wide">
                                        Détail des trajets de {m.nom}
                                      </h4>
                                      <div className="flex flex-col gap-1.5 border border-dashed border-encre-noire/10 p-2.5 rounded bg-white/40">
                                        {m.trips.map((trip, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-dashed border-encre-noire/5 pb-1 mb-1 last:border-none last:pb-0 last:mb-0">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-encre-noire">{trip.title}</span>
                                              <span className="text-[9px] opacity-60">
                                                {new Date(trip.date).toLocaleDateString('fr-FR', {
                                                  day: 'numeric', month: 'short', year: 'numeric'
                                                })} • Mode: {trip.type === 'convoi' ? '🚗 Convoi' : '🚶 Propres Moyens'}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className="opacity-70 font-semibold">{trip.distance} km</span>
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                                trip.isEligible 
                                                  ? 'bg-green-50 border-green-500 text-green-800'
                                                  : 'bg-neutral-50 border-neutral-300 text-neutral-600'
                                              }`}>
                                                {trip.isEligible ? `${trip.refundAmount.toFixed(2)} €` : 'Non éligible'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CordelCard>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="flex flex-col gap-4">
              {/* Events table */}
              <CordelCard className="p-0 overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Titre de l'événement</th>
                        <th className="py-2.5 px-3 text-center">Conducteurs</th>
                        <th className="py-2.5 px-3 text-right">Remboursement Total</th>
                        <th className="py-2.5 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center italic opacity-60">
                            Aucun trajet enregistré sur les événements.
                          </td>
                        </tr>
                      ) : (
                        eventList.map(e => {
                          const isExpanded = expandedRow === e.id;
                          return (
                            <React.Fragment key={e.id}>
                              <tr 
                                onClick={() => setExpandedRow(isExpanded ? null : e.id)}
                                className={`border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover cursor-pointer transition-colors ${
                                  isExpanded ? 'bg-cordel-hover/50' : ''
                                }`}
                              >
                                <td className="py-2.5 px-3 font-semibold">
                                  {new Date(e.date).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: '2-digit', year: 'numeric'
                                  })}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-encre-noire">{e.title}</td>
                                <td className="py-2.5 px-3 text-center font-semibold">
                                  {e.drivers.filter(d => d.isEligible).length} / {e.drivers.length}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-green-700">
                                  {e.totalRefund.toFixed(2)} €
                                </td>
                                <td className="py-2.5 px-3 text-center text-[10px] text-cordel-wood font-black">
                                  {isExpanded ? '▼ Fermer' : '▶ Détails'}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-white/30">
                                  <td colSpan={5} className="py-3 px-6 border-b border-dashed border-encre-noire/25">
                                    <div className="flex flex-col gap-2">
                                      <h4 className="text-[10px] font-black uppercase text-cordel-wood tracking-wide">
                                        Frais de déplacement détaillés de l'événement
                                      </h4>
                                      <div className="flex flex-col gap-1.5 border border-dashed border-encre-noire/10 p-2.5 rounded bg-white/40">
                                        {e.drivers.map((driver, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-[11px] border-b border-dashed border-encre-noire/5 pb-1 mb-1 last:border-none last:pb-0 last:mb-0">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-encre-noire">{driver.nom}</span>
                                              <span className="text-[9px] opacity-60">
                                                Mode: {driver.type === 'convoi' ? '🚗 Convoi' : '🚶 Propres Moyens'}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                                                driver.isEligible 
                                                  ? 'bg-green-50 border-green-500 text-green-800'
                                                  : 'bg-neutral-50 border-neutral-300 text-neutral-600'
                                              }`}>
                                                {driver.isEligible ? `${driver.refundAmount.toFixed(2)} €` : 'Non éligible'}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CordelCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
