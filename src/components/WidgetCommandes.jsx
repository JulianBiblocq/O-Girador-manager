import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import EmptyState from './EmptyState';
import { XiloBox } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { fr } from '../locales/fr';
import MemberOrdersPaymentAlert from './orders/MemberOrdersPaymentAlert';
import WidgetUserOrderRequestsList from './orders/WidgetUserOrderRequestsList';
import WidgetGroupOrders from './WidgetGroupOrders';

export default function WidgetCommandes({ groupId, user, profileData }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();

  const getArticleLabel = (articleKey) => {
    const trans = t(`widgetCommandes.articles.${articleKey}`);
    if (trans && trans !== `widgetCommandes.articles.${articleKey}`) {
      return trans;
    }
    const frArticles = fr.widgetCommandes?.articles || {};
    const matchingKey = Object.keys(frArticles).find(k => frArticles[k] === articleKey);
    if (matchingKey) {
      return t(`widgetCommandes.articles.${matchingKey}`);
    }
    return articleKey;
  };

  const [openCampaign, setOpenCampaign] = useState(null);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // États du formulaire de commande
  const catalog = useMemo(() => openCampaign?.articles || [], [openCampaign?.articles]);
  const [suggestion, setSuggestion] = useState('');
  const [article, setArticle] = useState('');
  const [selectedTaille, setSelectedTaille] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');
  const [isPersonalOrder, setIsPersonalOrder] = useState(false);

  // Réinitialiser l'article sélectionné au chargement du catalogue
  useEffect(() => {
    if (catalog.length > 0 && !catalog.some(c => c.nom === article)) {
      setArticle(catalog[0].nom);
    }
  }, [catalog, article]);

  // Réinitialiser la taille sélectionnée au changement d'article
  useEffect(() => {
    const artObj = catalog.find(item => item.nom === article);
    if (artObj && artObj.tailles && artObj.tailles.length > 0) {
      setSelectedTaille(artObj.tailles[0]);
    } else {
      setSelectedTaille('');
    }
  }, [article, catalog]);

  // Synchronisation des campagnes ouvertes
  useEffect(() => {
    if (!groupId) {
      setOpenCampaign(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const campaignsRef = collection(db, 'campaigns');
    const q = query(campaignsRef, where('groupId', '==', groupId), where('status', '==', 'open'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const list = [];
        querySnapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation));
        setOpenCampaign(list[0]);
      } else {
        setOpenCampaign(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("WidgetCommandes - Erreur onSnapshot campaigns :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Synchronisation des commandes de l'utilisateur pour la campagne ouverte
  useEffect(() => {
    if (!openCampaign || !user?.uid) {
      setUserRequests([]);
      return;
    }

    const requestsRef = collection(db, 'campaignRequests');
    const q = query(
      requestsRef,
      where('campaignId', '==', openCampaign.id),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setUserRequests(fetched);
    }, (error) => {
      console.error("WidgetCommandes - Erreur onSnapshot requests :", error);
    });

    return () => unsubscribe();
  }, [openCampaign, user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!openCampaign || !user?.uid || !article) return;

    setSaving(true);
    try {
      let finalNotes = notes.trim();
      const artObj = catalog.find(item => item.nom === article);

      if (selectedTaille) {
        if (finalNotes) {
          finalNotes = `Taille : ${selectedTaille} - ${finalNotes}`;
        } else {
          finalNotes = `Taille : ${selectedTaille}`;
        }
      } else if ((article === "T-shirt Homme" || article === "T-shirt Femme") && !finalNotes) {
        finalNotes = `Taille : ${profileData?.tailleTshirt || 'M'}`;
      }

      const payload = {
        campaignId: openCampaign.id,
        groupId,
        userId: user.uid,
        userName: `${profileData?.prenom || tRole('batuqueiro', profileData?.genre)} ${profileData?.nom || ''}`,
        article,
        quantite: parseInt(quantite, 10) || 1,
        notes: finalNotes,
        suggestion: suggestion.trim() || '',
        isPersonalOrder: isPersonalOrder,
        status: 'pending',
        userRole: profileData?.role || 'batuqueiro',
        isSuggestion: !isPersonalOrder,
        prix: artObj ? (parseFloat(artObj.prix) || 0) : 0,
        taille: selectedTaille || null
      };

      await addDoc(collection(db, 'campaignRequests'), payload);

      setQuantite(1);
      setNotes('');
      setSuggestion('');
      setIsPersonalOrder(false);
    } catch (err) {
      console.error("WidgetCommandes - Erreur d'ajout :", err);
      alert("Erreur lors de l'enregistrement de votre demande.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'campaignRequests', requestId));
    } catch (err) {
      console.error("WidgetCommandes - Erreur de suppression :", err);
      alert("Erreur lors de la suppression de votre demande de commande.");
    }
  };

  const isTshirtSelected = article === "T-shirt Homme" || article === "T-shirt Femme";
  const isAlfaiaSkinSelected = article === "Peau d'Alfaia (18\", 20\" ou 22\")" || article === "Housse de protection Alfaia (18\", 20\" ou 22\")";

  const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  if (!loading && !isAdmin && !openCampaign) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 text-left select-none">
      {/* Titre affiché uniquement hors campagne active (chargement ou état vide admin) */}
      {!openCampaign && (
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1 flex items-center gap-1">
          <XiloBox size={14} /> {t('widgetCommandes.title') || "Commande Groupée"}
        </h3>
      )}

      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Aucune campagne ouverte */}
      {!loading && !openCampaign && (
        <EmptyState
          icon="🛍️"
          title="Aucune campagne active"
          description="Aucune commande groupée n'est ouverte pour le moment. Revenez bientôt ou contactez l'équipe logistique."
        />
      )}

      {/* Accordéon repliable / dépliable de la campagne ouverte */}
      {!loading && openCampaign && (
        <WidgetGroupOrders campaign={openCampaign}>
          <CordelCard variant="ocre" useExtremeBorder={true} className="py-4 px-5">
            <h4 className="font-extrabold text-sm text-encre-noire leading-snug mb-1">
              {t('widgetCommandes.campaignTitle') || "Campagne :"} {openCampaign.titre || openCampaign.title}
            </h4>
            <p className="text-[8px] uppercase tracking-wider font-extrabold text-cordel-master-dark/70 border-b border-dashed border-cordel-master-dark/20 pb-2 mb-3">
              {t('widgetCommandes.subTitle') || "Vos besoins :"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Liste déroulante des articles */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.articleLabel') || "Article"}</label>
                <select
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
                >
                  {catalog.map((item) => (
                    <option key={item.nom} value={item.nom}>
                      {getArticleLabel(item.nom)} {item.prix > 0 ? `(${item.prix}€)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aperçu image de l'article sélectionné */}
              {(() => {
                const artObj = catalog.find(item => item.nom === article);
                if (artObj && artObj.imageUrl) {
                  return (
                    <div className="mt-2 mb-1 w-full max-w-[200px] aspect-square rounded border-2 border-encre-noire overflow-hidden bg-white shadow-md mx-auto flex items-center justify-center">
                      <img src={artObj.imageUrl} alt={artObj.nom} className="w-full h-full object-cover" />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Déclinaisons / Tailles */}
              {(() => {
                const artObj = catalog.find(item => item.nom === article);
                if (artObj && artObj.tailles && artObj.tailles.length > 0) {
                  return (
                    <div className="flex flex-col gap-1 mt-0.5 text-left">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Taille / Déclinaison</label>
                      <select
                        value={selectedTaille}
                        onChange={(e) => setSelectedTaille(e.target.value)}
                        disabled={saving}
                        className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light w-full"
                      >
                        {artObj.tailles.map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })()}

              {isTshirtSelected && !selectedTaille && (
                <div className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-white/40 dark:bg-black/20 p-1.5 rounded border border-dashed border-green-300/50 leading-relaxed mt-0.5">
                  {t('widgetCommandes.tshirtNotice') ? t('widgetCommandes.tshirtNotice').replace('{{size}}', profileData?.tailleTshirt || 'M') : `Taille T-shirt : ${profileData?.tailleTshirt || 'M'}`}
                </div>
              )}

              {isAlfaiaSkinSelected && !selectedTaille && (
                <div className="text-[9px] font-bold text-cordel-wood bg-white/40 dark:bg-black/20 p-1.5 rounded border border-dashed border-cordel-wood/40 leading-relaxed mt-0.5 animate-pulse">
                  {t('widgetCommandes.alfaiaNotice') || "Précisez la taille en pouces dans les notes."}
                </div>
              )}

              {/* Quantité & Notes */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1 col-span-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.qtyLabel') || "Quantité"}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantite}
                    onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    disabled={saving}
                    className="theme-input text-xs py-1 px-2 font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.notesLabel') || "Notes"}</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    placeholder={isAlfaiaSkinSelected ? "Ex : 22 pouces..." : "Précisions..."}
                    className="theme-input text-xs py-1 px-2 font-semibold"
                  />
                </div>
              </div>

              {/* Suggestion ou demande spéciale */}
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Suggérer un autre article ou demande spéciale (Optionnel)
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  disabled={saving}
                  placeholder="Ex : J'aimerais suggérer un autre article ou préciser une demande spéciale..."
                  className="theme-input text-xs py-1.5 px-2 min-h-[50px] resize-y font-semibold"
                />
              </div>

              {/* Case à cocher commande personnelle */}
              <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPersonalOrder"
                    checked={isPersonalOrder}
                    onChange={(e) => setIsPersonalOrder(e.target.checked)}
                    disabled={saving}
                    className="accent-cordel-wood scale-105 cursor-pointer"
                  />
                  <label htmlFor="isPersonalOrder" className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark cursor-pointer select-none">
                    {t('widgetCommandes.personalOrderLabel') || "Ceci est une commande personnelle"}
                  </label>
                </div>
                <span className="text-[8px] font-bold text-cordel-master-dark/65 pl-5">
                  {isPersonalOrder
                    ? (t('widgetCommandes.personalOrderDesc') || "Achat à vos frais personnels.")
                    : (t('widgetCommandes.suggestionOrderDesc') || "Suggestion d'achat pour le parc de l'association.")
                  }
                </span>
              </div>

              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving || !article}
                className="w-full py-2 font-bold uppercase tracking-widest text-[10px] mt-1"
              >
                {saving ? (t('widgetCommandes.adding') || "Envoi...") : (t('widgetCommandes.addBtn') || "Commander")}
              </CordelButton>
            </form>
          </CordelCard>

          {/* Alertes de paiement pour commandes de matériel */}
          <MemberOrdersPaymentAlert
            groupId={groupId}
            currentUser={user}
            profileData={profileData}
          />

          {/* Liste des demandes enregistrées par l'utilisateur */}
          <WidgetUserOrderRequestsList
            userRequests={userRequests}
            catalog={catalog}
            getArticleLabel={getArticleLabel}
            onDeleteRequest={handleDeleteRequest}
          />
        </WidgetGroupOrders>
      )}
    </div>
  );
}
