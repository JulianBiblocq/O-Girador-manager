import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose, XiloBox } from './XiloIcons';
import { useTranslation } from './LanguageContext';
import { fr } from '../locales/fr';

export default function OrdersManager({ groupId, onBack, role, isSystemAdmin, hasAccessLogistique }) {
  const { t } = useTranslation();

  const getArticleLabel = (articleKey) => {
    const trans = t(`widgetCommandes.articles.${articleKey}`);
    if (trans && trans !== `widgetCommandes.articles.${articleKey}`) {
      return trans;
    }
    // Try to find by matching value in french dict
    const frArticles = fr.widgetCommandes?.articles || {};
    const matchingKey = Object.keys(frArticles).find(k => frArticles[k] === articleKey);
    if (matchingKey) {
      return t(`widgetCommandes.articles.${matchingKey}`);
    }
    return articleKey; // fallback
  };
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReq, setLoadingReq] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isAdmin = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true;

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
      alert(t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    const confirmClose = window.confirm(
      t('ordersManager.confirmClose') || "Voulez-vous vraiment clôturer cette campagne de commandes ?"
    );
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
      alert(t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleValidateRequest = async (requestId, newStatus) => {
    setSaving(true);
    try {
      const requestRef = doc(db, 'campaignRequests', requestId);
      await updateDoc(requestRef, { status: newStatus });
    } catch (err) {
      console.error("OrdersManager - Erreur de validation de demande :", err);
      alert(t('common.saveError') || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAll = async () => {
    const pending = requests.filter(r => r.status !== 'validated');
    if (pending.length === 0) return;

    const confirmValidate = window.confirm(
      t('ordersManager.confirmValidateAll') || "Voulez-vous vraiment valider toutes les demandes en attente ?"
    );
    if (!confirmValidate) return;

    setSaving(true);
    try {
      await Promise.all(
        pending.map(r => {
          const requestRef = doc(db, 'campaignRequests', r.id);
          return updateDoc(requestRef, { status: 'validated' });
        })
      );
    } catch (err) {
      console.error("OrdersManager - Erreur de validation globale :", err);
      alert(t('common.saveError') || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  // Group and sum requests by article for supplier order (only validated requests)
  const validatedRequests = requests.filter(req => req.status === 'validated');

  const summary = validatedRequests.reduce((acc, req) => {
    const article = req.article || "Autre";
    const qty = parseInt(req.quantite, 10) || 0;
    if (!acc[article]) {
      acc[article] = {
        totalQty: 0,
        demands: []
      };
    }
    acc[article].totalQty += qty;
    acc[article].demands.push({
      userName: req.userName || t('ordersManager.unknownMember') || "Membre",
      qty,
      isPersonalOrder: req.isPersonalOrder
    });
    return acc;
  }, {});

  if (!isAdmin) {
    return (
      <>
        <div className="text-center py-12">
          <CordelCard variant="default" useExtremeBorder={true} className="p-8">
            <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('layoutEditor.accessDenied')}</h2>
            <p className="text-xs opacity-75 mt-3 leading-relaxed">
              {t('ordersManager.accessDeniedDesc')}
            </p>
            <div className="mt-6 flex justify-center">
              <CordelButton variant="default" onClick={onBack} className="text-xs">
                ← {t('common.back')}
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 text-left select-none">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
          <button 
            type="button" 
            onClick={selectedCampaign ? () => setSelectedCampaign(null) : onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {selectedCampaign ? `← ${t('ordersManager.campaignsList') || "Liste"}` : `← ${t('menu.dashboard') || "Tableau de bord"}`}
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-1">
            <XiloBox size={14} /> {t('ordersManager.title')}
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
                + {t('ordersManager.createCampaignTitle')}
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
                  <h4 className="text-xs uppercase font-extrabold text-cordel-wood">{t('ordersManager.newCampaign') || "Nouvelle campagne"}</h4>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('ordersManager.campaignTitleLabel')}</label>
                    <input 
                      type="text"
                      required
                      value={newCampaignTitle}
                      onChange={(e) => setNewCampaignTitle(e.target.value)}
                      disabled={saving}
                      placeholder={t('ordersManager.campaignTitlePlaceholder')}
                      className="theme-input text-xs py-1.5"
                    />
                  </div>
                  <CordelButton 
                    type="submit" 
                    variant="ocre" 
                    disabled={saving || !newCampaignTitle.trim()}
                    className="py-1.5 text-xs font-bold self-end px-4"
                  >
                    {t('ordersManager.createBtn')}
                  </CordelButton>
                </form>
              </CordelCard>
            )}

            {/* Campaign lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <h3 className="text-[10px] font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1">
                {t('ordersManager.campaignsList')}
              </h3>
              {campaigns.length === 0 ? (
                <CordelCard variant="default" className="p-6 text-center bg-cordel-bg opacity-75">
                  <p className="text-[10px] italic font-semibold">{t('ordersManager.noCampaigns') || "Aucune campagne de commande créée."}</p>
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
                        {t('ordersManager.createdOn') || "Créé le"} {new Date(c.dateCreation).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 select-none">
                      <span className={`theme-stamp-badge ${c.status === 'open' ? 'theme-stamp-badge-wood' : 'theme-stamp-badge-dark'} text-[8px]`}>
                        {c.status === 'open' ? `🟢 ${t('ordersManager.statusOpen')}` : `🔴 ${t('ordersManager.statusClosed')}`}
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
                {t('ordersManager.campaignStatus') || "Statut :"} {selectedCampaign.status === 'open' ? `🟢 ${t('ordersManager.statusOpenText') || "Commandes ouvertes"}` : `🔴 ${t('ordersManager.statusClosed')}`}
              </p>

              {selectedCampaign.status === 'open' && (
                <div className="mt-3.5 flex justify-start">
                  <CordelButton 
                    variant="default"
                    disabled={saving}
                    onClick={() => handleCloseCampaign(selectedCampaign.id)}
                    className="text-[9px] px-2.5 py-1 uppercase tracking-widest font-black text-red-600 dark:text-red-400 border-red-400/40"
                  >
                    🔒 {t('ordersManager.closeCampaignBtn')}
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
                    📊 {t('ordersManager.globalOrderTable') || "Tableau de Commande Globale (Articles Validés)"}
                  </h4>
                  {Object.keys(summary).length === 0 ? (
                    <p className="text-[10px] italic opacity-60">
                      {t('ordersManager.noValidatedRequests') || "Aucun article validé pour le moment. Valisez les demandes nominatives pour construire le tableau."}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {Object.entries(summary).map(([article, data]) => (
                        <li key={article} className="flex flex-col border-b border-dashed border-encre-noire/5 pb-2 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-encre-noire">{getArticleLabel(article)}</span>
                            <span className="theme-stamp-badge theme-stamp-badge-wood px-2 py-0.5 text-[9px]">
                              {t('ordersManager.totalQty') || "Total"} : {data.totalQty}
                            </span>
                          </div>
                          {/* List of requesters for this validated article */}
                          <div className="flex flex-wrap gap-1.5 mt-1.5 pl-2 border-l-2 border-cordel-wood/30">
                            {data.demands.map((demand, idx) => (
                              <span key={idx} className="text-[9px] font-semibold text-cordel-master-dark/80 bg-cordel-bg-light/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                {demand.userName} ({demand.qty}x)
                                {demand.isPersonalOrder ? (
                                  <span className="text-[7.5px] text-neutral-500 font-extrabold uppercase">({t('ordersManager.personalBadge') || "Perso"})</span>
                                ) : (
                                  <span className="text-[7.5px] text-cordel-wood font-extrabold uppercase">({t('ordersManager.suggestionBadge') || "Suggestion"})</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CordelCard>

                {/* 2. Detailed user demands */}
                <CordelCard variant="default" useExtremeBorder={false} className="py-4 px-5">
                  <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/15 pb-1 mb-2.5">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                      👤 {t('ordersManager.nominativeRequests')}
                    </h4>
                    {requests.some(r => r.status !== 'validated') && (
                      <CordelButton
                        variant="ocre"
                        onClick={handleValidateAll}
                        disabled={saving}
                        className="text-[8px] px-2.5 py-1 uppercase tracking-wider font-extrabold"
                      >
                        ✓ {t('ordersManager.validateAllBtn') || "Valider tout"}
                      </CordelButton>
                    )}
                  </div>
                  {requests.length === 0 ? (
                    <p className="text-[10px] italic opacity-60">{t('ordersManager.noDemands') || "Aucun membre n'a encore enregistré de besoin."}</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {requests.map((req) => (
                        <div key={req.id} className="text-xs p-2 rounded border border-dashed border-encre-noire/15 bg-cordel-bg-light/20 flex flex-col gap-0.5">
                          <div className="flex justify-between items-start font-bold">
                            <span className="text-cordel-wood flex items-center gap-1.5 flex-wrap">
                              {req.userName}
                              {req.isPersonalOrder ? (
                                <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] px-1 py-0.5 border-dashed">
                                  {t('ordersManager.personalBadge') || "Achat Perso"}
                                </span>
                              ) : (
                                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] px-1 py-0.5 border-dashed">
                                  {t('ordersManager.suggestionBadge') || "Suggestion"}
                                </span>
                              )}
                              {req.status === 'validated' ? (
                                <span className="theme-stamp-badge border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 text-[7px] px-1 py-0.5 border-dashed">
                                  {t('ordersManager.statusValidated') || "Validé"}
                                </span>
                              ) : (
                                <span className="theme-stamp-badge theme-stamp-badge-wood opacity-75 text-[7px] px-1 py-0.5 border-dashed">
                                  {t('ordersManager.statusPending') || "En attente"}
                                </span>
                              )}
                            </span>
                            <span className="text-encre-noire">{req.quantite}x {getArticleLabel(req.article)}</span>
                          </div>
                          {req.notes && (
                            <p className="text-[10px] italic text-encre-noire/70 mt-0.5 bg-[#fdfaf2] dark:bg-[#1a1816] px-1.5 py-0.5 rounded">
                              ✍️ {t('ordersManager.noteLabel') || "Note"} : {req.notes}
                            </p>
                          )}
                          <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-dashed border-encre-noire/5">
                            <span className="text-[8px] font-bold text-cordel-master-dark/50">
                              {req.status === 'validated' ? "✓ Validé" : "⏳ En attente"}
                            </span>
                            <div className="flex gap-1.5">
                              {req.status === 'validated' ? (
                                <button
                                  type="button"
                                  onClick={() => handleValidateRequest(req.id, 'pending')}
                                  disabled={saving}
                                  className="text-[8.5px] font-bold text-red-500 hover:text-red-700 bg-red-500/10 px-1.5 py-0.5 rounded border border-dashed border-red-300 cursor-pointer"
                                >
                                  {t('ordersManager.unvalidateBtn') || "Annuler"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleValidateRequest(req.id, 'validated')}
                                  disabled={saving}
                                  className="text-[8.5px] font-bold text-green-600 hover:text-green-800 bg-green-500/10 px-2 py-0.5 rounded border border-dashed border-green-300 cursor-pointer"
                                >
                                  {t('ordersManager.validateBtn') || "Valider"}
                                </button>
                              )}
                            </div>
                          </div>
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
    </>
  );
}
