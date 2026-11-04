import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import EmptyState from './EmptyState';
import { XiloBox } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { fr } from '../locales/fr';
import MemberOrdersPaymentAlert from './orders/MemberOrdersPaymentAlert';
import WidgetUserOrderRequestsList from './orders/WidgetUserOrderRequestsList';
import CampaignOrderForm from './orders/CampaignOrderForm';
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

      {/* Accordéon repliable / dépliable de la campagne ouverte fusionné dans une seule CordelCard */}
      {!loading && openCampaign && (
        <WidgetGroupOrders
          campaign={openCampaign}
          footer={
            <>
              <MemberOrdersPaymentAlert
                groupId={groupId}
                currentUser={user}
                profileData={profileData}
              />
              <WidgetUserOrderRequestsList
                userRequests={userRequests}
                catalog={catalog}
                getArticleLabel={getArticleLabel}
                onDeleteRequest={handleDeleteRequest}
              />
            </>
          }
        >
          <CampaignOrderForm
            catalog={catalog}
            article={article}
            setArticle={setArticle}
            selectedTaille={selectedTaille}
            setSelectedTaille={setSelectedTaille}
            quantite={quantite}
            setQuantite={setQuantite}
            notes={notes}
            setNotes={setNotes}
            suggestion={suggestion}
            setSuggestion={setSuggestion}
            isPersonalOrder={isPersonalOrder}
            setIsPersonalOrder={setIsPersonalOrder}
            saving={saving}
            handleSubmit={handleSubmit}
            getArticleLabel={getArticleLabel}
            profileData={profileData}
            t={t}
          />
        </WidgetGroupOrders>
      )}
    </div>
  );
}
