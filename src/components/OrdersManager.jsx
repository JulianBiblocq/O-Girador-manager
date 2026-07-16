import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose } from './XiloIcons';

export default function OrdersManager({ groupId, onBack, role, isSystemAdmin }) {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReq, setLoadingReq] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isAdmin = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization of campaigns
  useEffect(() => {
    if (!groupId) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
        });
      });
      // Sort by dateCreation desc
      fetched.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
      setCampaigns(fetched);
      setLoading(false);
    }, (error) => {
      console.error("OrdersManager - Erreur onSnapshot campaigns :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Sync requests when a campaign is selected
  useEffect(() => {
    if (!selectedCampaign) {
      setRequests([]);
      return;
    }

    setLoadingReq(true);
    const requestsRef = collection(db, 'campaignRequests');
    const q = query(requestsRef, where('campaignId', '==', selectedCampaign.id));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRequests(fetched);
      setLoadingReq(false);
    }, (error) => {
      console.error("OrdersManager - Erreur onSnapshot requests :", error);
      setLoadingReq(false);
    });

    return () => unsubscribe();
  }, [selectedCampaign]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!groupId || !newCampaignTitle.trim()) return;

    setSaving(true);
    try {
      const payload = {
        groupId,
        titre: newCampaignTitle.trim(),
        status: 'open',
        dateCreation: new Date().toISOString()
      };

      await addDoc(collection(db, 'campaigns'), payload);
      setNewCampaignTitle('');
      setIsCreating(false);
    } catch (err) {
      console.error("OrdersManager - Erreur creation campagne :", err);
      alert("Erreur lors de la création de la campagne.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    const confirmClose = window.confirm("Voulez-vous vraiment clôturer cette campagne de commandes ? Plus aucun membre ne pourra ajouter ou modifier ses demandes.");
    if (!confirmClose) return;

    setSaving(true);
    try {
      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, { status: 'closed' });
      // Update selected campaign reference if open
      if (selectedCampaign && selectedCampaign.id === campaignId) {
        setSelectedCampaign(prev => ({ ...prev, status: 'closed' }));
      }
    } catch (err) {
      console.error("OrdersManager - Erreur de clôture :", err);
      alert("Erreur lors de la clôture.");
    } finally {
      setSaving(false);
    }
  };

  // Group and sum requests by article for supplier order
  const summary = requests.reduce((acc, req) => {
    const article = req.article || "Autre";
    const qty = parseInt(req.quantite, 10) || 0;
    acc[article] = (acc[article] || 0) + qty;
    return acc;
  }, {});

  if (!isAdmin) {
    return (
      <LayoutShell>
        <div className="text-center py-12">
          <CordelCard variant="default" useExtremeBorder={true} className="p-8">
            <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
            <p className="text-xs opacity-75 mt-3 leading-relaxed">
              Vous devez être administrateur pour gérer les campagnes de commandes groupées.
            </p>
            <div className="mt-6 flex justify-center">
              <CordelButton variant="default" onClick={onBack} className="text-xs">
                ⬅️ Retour
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="flex flex-col gap-4 text-left select-none">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={selectedCampaign ? () => setSelectedCampaign(null) : onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            {selectedCampaign ? "⬅️ Liste" : "⬅️ Dashboard"}
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
            📦 Commandes Groupées
          </h2>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        )}

        {/* CAMPAIGN LIST VIEW */}
        {!loading && !selectedCampaign && (
          <div className="flex flex-col gap-3">
            {/* Create Trigger */}
            {!isCreating ? (
              <CordelButton 
                variant="ocre" 
                useExtremeBorder={true}
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 font-bold uppercase tracking-widest text-xs"
              >
                + Ouvrir une Campagne
              </CordelButton>
            ) : (
              <CordelCard variant="default" useExtremeBorder={true} className="p-4 relative">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={saving}
                  className="absolute top-2 right-2 p-1 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center"
                >
                  <XiloClose size={8} />
                </button>
                <form onSubmit={handleCreateCampaign} className="flex flex-col gap-3">
                  <h4 className="text-xs uppercase font-extrabold text-cordel-wood">Nouvelle campagne</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Titre de la campagne</label>
                    <input 
                      type="text"
                      required
                      value={newCampaignTitle}
                      onChange={(e) => setNewCampaignTitle(e.target.value)}
                      disabled={saving}
                      placeholder="Ex : Commandes Printemps 2026..."
                      className="theme-input text-xs py-1.5"
                    />
                  </div>
                  <CordelButton 
                    type="submit" 
                    variant="ocre" 
                    disabled={saving || !newCampaignTitle.trim()}
                    className="py-1.5 text-xs font-bold self-end px-4"
                  >
                    Ouvrir la campagne
                  </CordelButton>
                </form>
              </CordelCard>
            )}

            {/* Campaign lists */}
            <div className="flex flex-col gap-2 mt-1">
              <h3 className="text-[10px] font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1">
                Campagnes Récentes
              </h3>
              {campaigns.length === 0 ? (
                <CordelCard variant="default" className="p-6 text-center bg-cordel-bg opacity-75">
                  <p className="text-[10px] italic font-semibold">Aucune campagne de commande créée.</p>
                </CordelCard>
              ) : (
                campaigns.map((c) => (
                  <CordelCard 
                    key={c.id} 
                    variant={c.status === 'open' ? 'ocre' : 'default'}
                    useExtremeBorder={c.status === 'open'}
                    className="p-4 cursor-pointer hover:brightness-[1.02] active:scale-[0.99] transition-all flex justify-between items-center bg-cordel-bg border-l-4 border-l-cordel-wood"
                    onClick={() => setSelectedCampaign(c)}
                  >
                    <div className="text-left min-w-0">
                      <h4 className="font-extrabold text-sm text-encre-noire leading-tight truncate">
                        {c.titre}
                      </h4>
                      <span className="text-[8px] font-bold text-cordel-master-dark/70">
                        Créé le {new Date(c.dateCreation).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 select-none">
                      <span className={`theme-stamp-badge ${c.status === 'open' ? 'theme-stamp-badge-wood' : 'theme-stamp-badge-dark'} text-[8px]`}>
                        {c.status === 'open' ? '🟢 EN COURS' : '🔴 CLÔTURÉE'}
                      </span>
                    </div>
                  </CordelCard>
                ))
              )}
            </div>
          </div>
        )}

        {/* DETAILED CAMPAIGN VIEW */}
        {!loading && selectedCampaign && (
          <div className="flex flex-col gap-4">
            
            {/* Summary card */}
            <CordelCard variant={selectedCampaign.status === 'open' ? 'ocre' : 'default'} useExtremeBorder={true} className="p-4 text-left relative">
              <h3 className="font-extrabold text-base text-encre-noire leading-tight">
                {selectedCampaign.titre}
              </h3>
              <p className="text-[9px] font-bold text-cordel-master-dark/75 mt-1 select-none">
                Statut : {selectedCampaign.status === 'open' ? '🟢 Commandes ouvertes aux membres' : '🔴 Clôturée'}
              </p>

              {selectedCampaign.status === 'open' && (
                <div className="mt-3.5 flex justify-start">
                  <CordelButton 
                    variant="default"
                    disabled={saving}
                    onClick={() => handleCloseCampaign(selectedCampaign.id)}
                    className="text-[9px] px-2.5 py-1 uppercase tracking-widest font-black text-red-600 dark:text-red-400 border-red-400/40"
                  >
                    🔒 Clôturer la Campagne
                  </CordelButton>
                </div>
              )}
            </CordelCard>

            {loadingReq ? (
              <div className="flex justify-center items-center py-6">
                <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
              </div>
            ) : (
              <>
                {/* 1. Summed totals per article (Supplier Ready) */}
                <CordelCard variant="default" useExtremeBorder={false} className="py-4 px-5">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-2.5">
                    📊 Synthèse Agrégée (Commande Fournisseur)
                  </h4>
                  {Object.keys(summary).length === 0 ? (
                    <p className="text-[10px] italic opacity-60">Aucun article demandé pour le moment.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {Object.entries(summary).map(([article, qty]) => (
                        <li key={article} className="flex justify-between items-center text-xs font-bold border-b border-dashed border-encre-noire/5 pb-1.5 last:border-0 last:pb-0">
                          <span className="text-encre-noire">{article}</span>
                          <span className="theme-stamp-badge theme-stamp-badge-wood px-2 py-0.5 text-[9px]">
                            Total : {qty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CordelCard>

                {/* 2. Detailed user demands */}
                <CordelCard variant="default" useExtremeBorder={false} className="py-4 px-5">
                  <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-2.5">
                    👤 Demandes Nominatives Détaillées
                  </h4>
                  {requests.length === 0 ? (
                    <p className="text-[10px] italic opacity-60">Aucun membre n'a encore enregistré de besoin.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                      {requests.map((req) => (
                        <div key={req.id} className="text-xs p-2 rounded border border-dashed border-encre-noire/15 bg-cordel-bg-light/20 flex flex-col gap-0.5">
                          <div className="flex justify-between items-start font-bold">
                            <span className="text-cordel-wood">{req.userName}</span>
                            <span className="text-encre-noire">{req.quantite}x {req.article}</span>
                          </div>
                          {req.notes && (
                            <p className="text-[10px] italic text-encre-noire/70 mt-0.5 bg-[#fdfaf2] dark:bg-[#1a1816] px-1.5 py-0.5 rounded">
                              ✍️ Note : {req.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CordelCard>
              </>
            )}

          </div>
        )}

      </div>
    </LayoutShell>
  );
}
