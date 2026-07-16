import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';

export default function TreasuryManager({ groupId, onBack, role, isSystemAdmin }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [associationSettings, setAssociationSettings] = useState(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Load association settings (fee amount, payment link, instructions)
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    getDoc(assocRef).then((snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
    }).catch(err => {
      console.error("TreasuryManager - Error fetching association settings:", err);
    });
  }, [groupId]);

  // Load active members of the association
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMembers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Default to active if statutActuel is missing or empty
        const isActive = !data.statutActuel || data.statutActuel === 'active';
        if (isActive) {
          fetchedMembers.push({
            id: doc.id,
            ...data
          });
        }
      });

      setMembers(fetchedMembers);
      setLoading(false);
    }, (err) => {
      console.error("TreasuryManager - Firestore error:", err);
      setError("Erreur lors du chargement des membres.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleUpdateStatus = async (memberId, newStatus) => {
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        paymentStatus: newStatus
      });
    } catch (err) {
      console.error("TreasuryManager - Error updating payment status:", err);
      alert("Impossible de modifier le statut de paiement : " + (err.message || err));
    }
  };

  // Calculations for stats
  const totalActive = members.length;
  const countPaid = members.filter(m => m.paymentStatus === 'paid').length;
  const countPartial = members.filter(m => m.paymentStatus === 'partial').length;
  const countUnpaid = members.filter(m => !m.paymentStatus || m.paymentStatus === 'unpaid').length;

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const status = member.paymentStatus || 'unpaid';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous devez être administrateur pour accéder au module de trésorerie.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ Retour
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ Retour
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center">
          🪙 Tableau de Bord Trésorerie
        </h2>
      </div>

      {/* Info card & Config display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed flex flex-col justify-center">
          <div>
            💰 Suivez les cotisations de vos membres actifs. La méthode de paiement est configurée dans les paramètres de l'association. Les modifications apportées aux statuts des membres sont enregistrées en temps réel.
          </div>
        </div>
        
        <div className="border border-encre-noire/30 p-3 rounded-[4px_6px_3px_5px] bg-[var(--cordel-bg-light)] text-[10px] flex flex-col gap-1.5 justify-center shadow-[1.5px_1.5px_0px_0px_#181716]">
          <span className="font-bold text-cordel-wood uppercase tracking-wide">Configuration Active :</span>
          <div>💵 Adhésion base : <span className="font-black">{associationSettings?.montantAdhesion !== undefined ? associationSettings.montantAdhesion : (associationSettings?.montantCotisation || 0)} €</span></div>
          {associationSettings?.optionsCotisation && associationSettings.optionsCotisation.length > 0 && (
            <div className="flex flex-col gap-0.5 border-t border-dashed border-encre-noire/10 pt-1 mt-0.5">
              <span className="font-semibold text-cordel-master-dark">Options :</span>
              {associationSettings.optionsCotisation.map(opt => (
                <div key={opt.id} className="pl-1.5">• {opt.nom} : <span className="font-bold">{opt.montant} €</span></div>
              ))}
            </div>
          )}
          <div className="truncate border-t border-dashed border-encre-noire/10 pt-1 mt-0.5">🔗 Lien : <span className="font-semibold text-blue-600 dark:text-blue-400 select-all">{associationSettings?.lienPaiementExterne || "Aucun"}</span></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>Retour</CordelButton>
        </CordelCard>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="border border-encre-noire/25 p-2 bg-white/40 dark:bg-black/10 rounded">
              <div className="text-[10px] uppercase font-bold text-cordel-master-dark opacity-60">Membres Actifs</div>
              <div className="text-xl font-black text-encre-noire">{totalActive}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-green-100/35 dark:bg-green-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400 opacity-80">À Jour</div>
              <div className="text-xl font-black text-green-700 dark:text-green-400">{countPaid}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-amber-100/35 dark:bg-amber-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 opacity-80">Partiel</div>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400">{countPartial}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-red-100/35 dark:bg-red-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 opacity-80">Non Payé</div>
              <div className="text-xl font-black text-red-700 dark:text-red-400">{countUnpaid}</div>
            </div>
          </div>

          {/* Filters and Search Toolbar */}
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                🔍 Rechercher un membre
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Entrez un prénom ou nom..."
                className="theme-input w-full text-xs font-bold py-1.5"
              />
            </div>

            <div className="flex flex-col gap-1 text-left min-w-[150px]">
              <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
              >
                <option value="all">Tous les statuts</option>
                <option value="paid">À jour ✅</option>
                <option value="partial">Partiel ⚠️</option>
                <option value="unpaid">Non payé ❌</option>
              </select>
            </div>
          </CordelCard>

          {/* Members Table / List */}
          <div className="flex flex-col gap-3">
            {filteredMembers.length === 0 ? (
              <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
                <p className="text-xs font-bold opacity-75">Aucun membre ne correspond aux critères.</p>
              </CordelCard>
            ) : (
              <div className="grid gap-3">
                {filteredMembers.map((member) => {
                  const fullName = `${member.prenom || ''} ${member.nom || ''}`;
                  const currentStatus = member.paymentStatus || 'unpaid';

                  return (
                    <CordelCard 
                      key={member.id} 
                      variant="default" 
                      useExtremeBorder={false}
                      className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-cordel-bg"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <XiloAvatar src={member.photoURL} name={fullName} size={40} />
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-xs text-encre-noire">
                            {fullName}
                          </span>
                          <span className="text-[9px] font-semibold text-cordel-master-dark/65 truncate max-w-[180px] sm:max-w-xs select-all">
                            {member.email}
                          </span>
                          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-1 self-start select-none">
                            {tRole(member.role || 'membre', member.genre)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Status Dropdown Selector */}
                      <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 border-dashed border-cordel-master-dark/10 pt-3 sm:pt-0 justify-between sm:justify-end">
                        <span className="text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">Statut de paiement :</span>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleUpdateStatus(member.id, e.target.value)}
                          className={`theme-input text-[10px] font-black py-1.5 px-3 bg-cordel-bg-light cursor-pointer rounded-[4px_6px_3px_5px] border-2 ${
                            currentStatus === 'paid' 
                              ? 'border-green-600/40 text-green-700 dark:text-green-400' 
                              : currentStatus === 'partial' 
                                ? 'border-amber-600/40 text-amber-700 dark:text-amber-400' 
                                : 'border-red-600/40 text-red-700 dark:text-red-400'
                          }`}
                        >
                          <option value="unpaid">❌ Non payé</option>
                          <option value="partial">⚠️ Partiel</option>
                          <option value="paid">✅ À jour</option>
                        </select>
                      </div>
                    </CordelCard>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
