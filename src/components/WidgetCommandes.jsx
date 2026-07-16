import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose, XiloBox } from './XiloIcons';
import { useTerminologie } from '../hooks/useTerminologie';
import { useTranslation } from './LanguageContext';
import { fr } from '../locales/fr';

const ARTICLES_LIST = [
  "Baguettes d'Alfaia (Grosses, Petites ou Bacalhau)",
  "Baguettes de Caixa",
  "Baguette de Gonguê",
  "Peau de Caixa",
  "Peau d'Alfaia (18\", 20\" ou 22\")",
  "Housse de protection Alfaia (18\", 20\" ou 22\")",
  "Housse de protection Caixa",
  "Sangle",
  "Étui à baguettes",
  "Pantalon",
  "Chemise",
  "T-shirt Homme",
  "T-shirt Femme",
  "Autre"
];

export default function WidgetCommandes({ groupId, user, profileData }) {
  const { t, locale } = useTranslation();
  const { tRole } = useTerminologie();

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
  const [openCampaign, setOpenCampaign] = useState(null);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [article, setArticle] = useState(ARTICLES_LIST[0]);
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');

  // Sync open campaigns
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
        // Take the most recent open campaign
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
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

  // Sync user's requests for the open campaign
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
      querySnapshot.forEach((doc) => {
        fetched.push({
          id: doc.id,
          ...doc.data()
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

      // Smart pre-fill: If user orders T-Shirt and notes are empty, auto-fill their size
      if ((article === "T-shirt Homme" || article === "T-shirt Femme") && !finalNotes) {
        finalNotes = `Taille : ${profileData?.tailleTshirt || 'M'}`;
      }

      const payload = {
        campaignId: openCampaign.id,
        groupId,
        userId: user.uid,
        userName: `${profileData?.prenom || tRole('batuqueiro', profileData?.genre)} ${profileData?.nom || ''}`,
        article,
        quantite: parseInt(quantite, 10) || 1,
        notes: finalNotes
      };

      await addDoc(collection(db, 'campaignRequests'), payload);
      
      // Reset inputs
      setQuantite(1);
      setNotes('');
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
    }
  };

  // Determine helper text based on chosen article
  const isTshirtSelected = article === "T-shirt Homme" || article === "T-shirt Femme";
  const isAlfaiaSkinSelected = article === "Peau d'Alfaia (18\", 20\" ou 22\")" || article === "Housse de protection Alfaia (18\", 20\" ou 22\")";

  const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  if (!loading && !isAdmin && !openCampaign) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 text-left select-none">
      {/* Title */}
      <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase pl-1 flex items-center gap-1">
        <XiloBox size={14} /> {t('widgetCommandes.title') || "Commande Groupée"}
      </h3>

      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* No open campaigns */}
      {!loading && !openCampaign && (
        <CordelCard variant="default" className="p-4 text-center bg-cordel-bg opacity-75">
          <p className="text-[10px] italic font-semibold">{t('widgetCommandes.noCampaign') || "Aucune campagne active."}</p>
        </CordelCard>
      )}

      {/* Campaign open form */}
      {!loading && openCampaign && (
        <div className="flex flex-col gap-3">
          <CordelCard variant="ocre" useExtremeBorder={true} className="py-4 px-5">
            <h4 className="font-extrabold text-sm text-encre-noire leading-snug mb-1">
              {t('widgetCommandes.campaignTitle') || "Campagne :"} {openCampaign.titre}
            </h4>
            <p className="text-[8px] uppercase tracking-wider font-extrabold text-cordel-master-dark/70 border-b border-dashed border-cordel-master-dark/20 pb-2 mb-3">
              {t('widgetCommandes.subTitle') || "Vos besoins :"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Dropdown list of articles */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.articleLabel') || "Article"}</label>
                <select
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light"
                >
                  {ARTICLES_LIST.map((art) => (
                    <option key={art} value={art}>{getArticleLabel(art)}</option>
                  ))}
                </select>
              </div>

              {/* Helper notice */}
              {isTshirtSelected && (
                <div className="text-[9px] font-bold text-green-700 dark:text-green-400 bg-white/40 dark:bg-black/20 p-1.5 rounded border border-dashed border-green-300/50 leading-relaxed mt-0.5">
                  {t('widgetCommandes.tshirtNotice') ? t('widgetCommandes.tshirtNotice').replace('{{size}}', profileData?.tailleTshirt || 'M') : `Taille T-shirt : ${profileData?.tailleTshirt || 'M'}`}
                </div>
              )}

              {isAlfaiaSkinSelected && (
                <div className="text-[9px] font-bold text-cordel-wood bg-white/40 dark:bg-black/20 p-1.5 rounded border border-dashed border-cordel-wood/40 leading-relaxed mt-0.5 animate-pulse">
                  {t('widgetCommandes.alfaiaNotice') || "Précisez la taille en pouces dans les notes."}
                </div>
              )}

              {/* Quantité & Notes row */}
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

          {/* User's existing requests list */}
          {userRequests.length > 0 && (
            <CordelCard variant="default" useExtremeBorder={false} className="py-3 px-4">
              <h5 className="text-[9px] font-extrabold tracking-wider text-cordel-wood uppercase border-b border-dashed border-cordel-master-dark/15 pb-1 mb-2 flex items-center gap-1">
                <XiloBox size={12} /> {t('widgetCommandes.myRequests') || "Ma commande"}
              </h5>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {userRequests.map((req) => (
                  <div key={req.id} className="text-xs flex justify-between items-center py-1 border-b border-dashed border-encre-noire/5 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <span className="font-extrabold text-encre-noire">
                        {req.quantite} {t('widgetCommandes.unit') || "u"} {getArticleLabel(req.article)}
                      </span>
                      {req.notes && (
                        <p className="text-[9px] text-cordel-master-dark/70 font-semibold truncate">
                          {t('widgetCommandes.notesLabel') || "Note"} : {req.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req.id)}
                      className="p-1 border border-dashed border-red-400 hover:border-red-600 text-red-500 rounded cursor-pointer shrink-0 ml-2 flex items-center justify-center"
                      title="Retirer"
                    >
                      <XiloClose size={8} />
                    </button>
                  </div>
                ))}
              </div>
            </CordelCard>
          )}
        </div>
      )}
    </div>
  );
}
