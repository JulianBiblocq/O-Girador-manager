import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import MemberTreasuryRow from './MemberTreasuryRow';
import { useTranslation } from './LanguageContext';

export default function TreasuryManager({ groupId, onBack, role, isSystemAdmin, hasAccessTresorerie }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [associationSettings, setAssociationSettings] = useState(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessTresorerie === true;

  const [activeTab, setActiveTab] = useState('cotisations'); // 'cotisations', 'transactions'
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'depense',
    montant: '',
    categorie: 'Matériel',
    libelle: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [savingTx, setSavingTx] = useState(false);

  useEffect(() => {
    if (!groupId || activeTab !== 'transactions') return;

    setLoadingTx(true);
    const txRef = collection(db, 'transactions');
    const q = query(txRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort chronologically desc
      fetched.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });
      setTransactions(fetched);
      setLoadingTx(false);
    }, (error) => {
      console.error("TreasuryManager - Erreur onSnapshot transactions :", error);
      setLoadingTx(false);
    });

    return () => unsubscribe();
  }, [groupId, activeTab]);

  const handleAddTx = async (e) => {
    e.preventDefault();
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
      setTxForm(prev => ({
        ...prev,
        montant: '',
        libelle: ''
      }));
    } catch (err) {
      console.error("TreasuryManager - Erreur addDoc transaction :", err);
      alert("Erreur lors de l'enregistrement de l'opération.");
    } finally {
      setSavingTx(false);
    }
  };

  const handleDeleteTx = async (txId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette opération ?")) return;
    try {
      await deleteDoc(doc(db, 'transactions', txId));
    } catch (err) {
      console.error("TreasuryManager - Erreur suppression transaction :", err);
      alert("Erreur lors de la suppression de l'opération.");
    }
  };

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

  // Calculations for stats
  const totalActive = members.length;
  const countPaid = members.filter(m => m.paymentStatus === 'paid').length;
  const countPartial = members.filter(m => m.paymentStatus === 'partial').length;
  const countUnpaid = members.filter(m => !m.paymentStatus || m.paymentStatus === 'unpaid').length;

  const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
    ? associationSettings.montantAdhesion 
    : (associationSettings?.montantCotisation || 0);

  const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
    ? associationSettings.optionsCotisation 
    : [];

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const status = member.paymentStatus || 'unpaid';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Export to Excel (CSV)
  const exportToCSV = () => {
    const headers = [
      t('widgetTreasury.tableMemberName') || "Nom du membre",
      t('widgetTreasury.tableBaseAdhesion') || "Adhésion de base",
      t('widgetTreasury.tableOptions') || "Options choisies",
      `${t('widgetTreasury.tableTotalDue') || "Total dû"} (€)`,
      t('widgetTreasury.tablePaymentStatus') || "Statut du paiement"
    ];
    const rows = filteredMembers.map(member => {
      const fullName = `${member.prenom || ''} ${member.nom || ''}`;
      
      const hasBase = member.adhesionBase !== false;
      const baseMembership = hasBase ? (t('common.yes') || "Oui") : (t('common.no') || "Non");

      const chosenOptionsList = (member.selectedOptions || [])
        .map(optId => {
          const opt = optionsCotisation.find(o => o.id === optId);
          return opt ? opt.nom : null;
        })
        .filter(Boolean)
        .join(', ');

      const baseAmount = hasBase ? parseFloat(baseAdhesionAmount) || 0 : 0;
      const optionsAmount = (member.selectedOptions || []).reduce((sum, optId) => {
        const opt = optionsCotisation.find(o => o.id === optId);
        return sum + (opt ? parseFloat(opt.montant) || 0 : 0);
      }, 0);
      const totalDue = baseAmount + optionsAmount;

      let paymentStatusStr = t('widgetTreasury.unpaid') || "Non payé";
      if (member.paymentStatus === 'paid') paymentStatusStr = t('widgetTreasury.upToDate') || "À jour";
      else if (member.paymentStatus === 'partial') paymentStatusStr = t('widgetTreasury.partial') || "Partiel";

      return [
        fullName,
        baseMembership,
        chosenOptionsList,
        totalDue,
        paymentStatusStr
      ];
    });

    // Excel CSV French support: UTF-8 BOM + semicolon separator
    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tresorerie_${groupId || 'membres'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('widgetTreasury.accessDenied') || "ACCÈS REFUSÉ"}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {t('widgetTreasury.accessDeniedDesc') || "Vous devez être administrateur pour accéder au module de trésorerie."}
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
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center">
          🪙 {t('widgetTreasury.dashboardTitle') || "Tableau de Bord Trésorerie"}
        </h2>
      </div>

      {/* Info card & Config display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed flex flex-col justify-center">
          <div>
            💰 {t('widgetTreasury.infoText')}
          </div>
        </div>
        
        <div className="border border-encre-noire/30 p-3 rounded-[4px_6px_3px_5px] bg-[var(--cordel-bg-light)] text-[10px] flex flex-col gap-1.5 justify-center shadow-[1.5px_1.5px_0px_0px_#181716]">
          <span className="font-bold text-cordel-wood uppercase tracking-wide">{t('widgetTreasury.activeConfig') || "Configuration Active :"}</span>
          <div>💵 {t('widgetTreasury.baseAdhesion') || "Adhésion base :"} <span className="font-black">{baseAdhesionAmount} €</span></div>
          {optionsCotisation.length > 0 && (
            <div className="flex flex-col gap-0.5 border-t border-dashed border-encre-noire/10 pt-1 mt-0.5">
              <span className="font-semibold text-cordel-master-dark">{t('widgetTreasury.options') || "Options :"}</span>
              {optionsCotisation.map(opt => (
                <div key={opt.id} className="pl-1.5">• {opt.nom} : <span className="font-bold">{opt.montant} €</span></div>
              ))}
            </div>
          )}
          <div className="truncate border-t border-dashed border-encre-noire/10 pt-1 mt-0.5">{t('widgetTreasury.link') || "🔗 Lien :"} <span className="font-semibold text-blue-600 dark:text-blue-400 select-all">{associationSettings?.lienPaiementExterne || "Aucun"}</span></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>{t('common.back')}</CordelButton>
        </CordelCard>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="border border-encre-noire/25 p-2 bg-white/40 dark:bg-black/10 rounded">
              <div className="text-[10px] uppercase font-bold text-cordel-master-dark opacity-60">{t('widgetTreasury.activeMembers')}</div>
              <div className="text-xl font-black text-encre-noire">{totalActive}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-green-100/35 dark:bg-green-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400 opacity-80">{t('widgetTreasury.upToDate')}</div>
              <div className="text-xl font-black text-green-700 dark:text-green-400">{countPaid}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-amber-100/35 dark:bg-amber-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 opacity-80">{t('widgetTreasury.partial')}</div>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400">{countPartial}</div>
            </div>
            <div className="border border-encre-noire/25 p-2 bg-red-100/35 dark:bg-red-950/15 rounded">
              <div className="text-[10px] uppercase font-bold text-red-700 dark:text-red-400 opacity-80">{t('widgetTreasury.unpaid')}</div>
              <div className="text-xl font-black text-red-700 dark:text-red-400">{countUnpaid}</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('cotisations')}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[4px_6px_3px_5px] transition-all cursor-pointer ${
                activeTab === 'cotisations'
                  ? 'bg-cordel-wood text-cordel-bg border-2 border-encre-noire shadow-none'
                  : 'bg-cordel-bg text-cordel-wood border border-encre-noire/30 hover:bg-cordel-hover shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none'
              }`}
            >
              🏷️ Cotisations des Membres
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-[4px_6px_3px_5px] transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-cordel-wood text-cordel-bg border-2 border-encre-noire shadow-none'
                  : 'bg-cordel-bg text-cordel-wood border border-encre-noire/30 hover:bg-cordel-hover shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none'
              }`}
            >
              💼 Opérations Diverses
            </button>
          </div>

          {activeTab === 'cotisations' ? (
            <>
              {/* Filters and Search Toolbar */}
              <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col md:flex-row gap-3 items-end">
                <div className="flex-1 flex flex-col gap-1 text-left w-full">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                    {t('widgetTreasury.searchLabel') || "🔍 Rechercher un membre"}
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('widgetTreasury.searchPlaceholder')}
                    className="theme-input w-full text-xs font-bold py-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left min-w-[150px] w-full md:w-auto">
                  <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
                    {t('widgetTreasury.statusLabel')}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  >
                    <option value="all">{t('widgetTreasury.allStatuses')}</option>
                    <option value="paid">{t('widgetTreasury.statusPaid')}</option>
                    <option value="partial">{t('widgetTreasury.statusPartial')}</option>
                    <option value="unpaid">{t('widgetTreasury.statusUnpaid')}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportToCSV}
                  className="text-[10px] font-black uppercase tracking-widest bg-[#84967a] hover:bg-[#728369] text-encre-noire border-2 border-encre-noire px-4 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto h-[34px]"
                >
                  {t('widgetTreasury.exportCSV')}
                </button>
              </CordelCard>

              {/* Members Table / List */}
              <div className="flex flex-col gap-3">
                {filteredMembers.length === 0 ? (
                  <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
                    <p className="text-xs font-bold opacity-75">{t('widgetTreasury.noMembers')}</p>
                  </CordelCard>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Table Header for Desktop */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-dashed border-cordel-master-dark/30 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood">
                      <div className="col-span-3 text-left">{t('widgetTreasury.tableMemberName')}</div>
                      <div className="col-span-2 text-center">{t('widgetTreasury.tableBaseAdhesion')}</div>
                      <div className="col-span-3 text-left">{t('widgetTreasury.tableOptions')}</div>
                      <div className="col-span-2 text-center">{t('widgetTreasury.tableTotalDue')}</div>
                      <div className="col-span-2 text-right">{t('widgetTreasury.tablePaymentStatus')}</div>
                    </div>

                    {/* Table Rows */}
                    {filteredMembers.map((member) => (
                      <MemberTreasuryRow
                        key={member.id}
                        member={member}
                        optionsCotisation={optionsCotisation}
                        baseAdhesionAmount={parseFloat(baseAdhesionAmount) || 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {/* Form */}
              <div className="col-span-1">
                <CordelCard variant="default" useExtremeBorder={true} className="p-4">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
                    Saisir une opération
                  </h4>
                  <form onSubmit={handleAddTx} className="flex flex-col gap-3 text-left">
                    {/* Date */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Date</label>
                      <input 
                        type="date"
                        value={txForm.date}
                        onChange={(e) => setTxForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                        disabled={savingTx}
                        className="theme-input w-full text-xs font-bold"
                      />
                    </div>

                    {/* Type */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Type</label>
                      <select
                        value={txForm.type}
                        onChange={(e) => setTxForm(prev => ({ ...prev, type: e.target.value }))}
                        required
                        disabled={savingTx}
                        className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
                      >
                        <option value="depense">Dépense (Débit)</option>
                        <option value="recette">Recette (Crédit)</option>
                      </select>
                    </div>

                    {/* Categorie */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Catégorie</label>
                      <select
                        value={txForm.categorie}
                        onChange={(e) => setTxForm(prev => ({ ...prev, categorie: e.target.value }))}
                        required
                        disabled={savingTx}
                        className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
                      >
                        <option value="Matériel">Matériel</option>
                        <option value="Intervenant">Intervenant</option>
                        <option value="Local">Local (Location...)</option>
                        <option value="Subvention">Subvention</option>
                        <option value="Don">Don</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    {/* Libellé */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Libellé</label>
                      <input 
                        type="text"
                        placeholder="Ex: Achat peaux Alfaia"
                        value={txForm.libelle}
                        onChange={(e) => setTxForm(prev => ({ ...prev, libelle: e.target.value }))}
                        required
                        disabled={savingTx}
                        className="theme-input w-full text-xs"
                      />
                    </div>

                    {/* Montant */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Montant (€)</label>
                      <input 
                        type="number"
                        min="0.01"
                        step="any"
                        placeholder="0.00"
                        value={txForm.montant}
                        onChange={(e) => setTxForm(prev => ({ ...prev, montant: e.target.value }))}
                        required
                        disabled={savingTx}
                        className="theme-input w-full text-xs"
                      />
                    </div>

                    <CordelButton 
                      type="submit"
                      variant="ocre"
                      useExtremeBorder={true}
                      disabled={savingTx}
                      className="w-full text-xs py-2 mt-2 font-bold uppercase tracking-wider"
                    >
                      {savingTx ? "Enregistrement..." : "Enregistrer"}
                    </CordelButton>
                  </form>
                </CordelCard>
              </div>

              {/* List */}
              <div className="col-span-2 flex flex-col gap-3">
                <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex-1">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
                    Opérations Enregistrées
                  </h4>
                  
                  {loadingTx ? (
                    <div className="flex justify-center items-center py-12">
                      <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-xs italic opacity-60 text-center py-8">Aucune opération libre saisie.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                      {/* Header Table */}
                      <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 px-1">
                        <div className="col-span-2 text-left">Date</div>
                        <div className="col-span-2 text-left">Catégorie</div>
                        <div className="col-span-4 text-left">Libellé</div>
                        <div className="col-span-3 text-right">Montant</div>
                        <div className="col-span-1 text-center"></div>
                      </div>

                      {/* Rows */}
                      {transactions.map(tx => {
                        const txDateStr = tx.date ? (tx.date.toDate ? tx.date.toDate().toISOString().split('T')[0] : String(tx.date).substring(0, 10)) : '';
                        return (
                          <div key={tx.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-encre-noire/5 py-2 px-1 hover:bg-cordel-hover/10 rounded">
                            <div className="col-span-2 font-semibold text-left">{txDateStr}</div>
                            <div className="col-span-2 text-left">
                              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-1.5 py-0.5">
                                {tx.categorie}
                              </span>
                            </div>
                            <div className="col-span-4 font-bold text-encre-noire dark:text-cordel-bg-light truncate text-left" title={tx.libelle}>
                              {tx.libelle}
                            </div>
                            <div className={`col-span-3 text-right font-black ${tx.type === 'recette' ? 'text-green-700' : 'text-red-700'}`}>
                              {tx.type === 'recette' ? '+' : '-'}{tx.montant} €
                            </div>
                            <div className="col-span-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteTx(tx.id)}
                                className="text-red-700 hover:text-red-900 font-bold hover:underline select-none text-[10px] cursor-pointer"
                                title="Supprimer cette opération"
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CordelCard>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
