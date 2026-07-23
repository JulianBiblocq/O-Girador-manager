import React, { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import { useTranslation } from './LanguageContext';

export default function WidgetTreasury({ groupId, profileData }) {
  const { t } = useTranslation();
  const [montantCotisation, setMontantCotisation] = useState(0);
  const [montantAdhesion, setMontantAdhesion] = useState(0);
  const [optionsCotisation, setOptionsCotisation] = useState([]);
  const [lienPaiementExterne, setLienPaiementExterne] = useState('');
  const [instructionsPaiement, setInstructionsPaiement] = useState('');
  const [loading, setLoading] = useState(true);

  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const paymentStatus = profileData?.paymentStatus || 'unpaid';

  // Détection du retour de paiement HelloAsso (?payment=success, ?checkout=success...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
      
      const isSuccess = searchParams.get('payment') === 'success' || 
                        searchParams.get('checkout') === 'success' || 
                        searchParams.get('status') === 'success' ||
                        hashParams.get('payment') === 'success' ||
                        hashParams.get('checkout') === 'success';

      if (isSuccess) {
        setShowSuccessBanner(true);
        // Auto-rafraîchissement après 1.5s pour vérifier le résultat de la fonction
        const timer = setTimeout(() => {
          if (profileData?.uid || profileData?.id) {
            handleRefreshStatus();
          }
        }, 1500);

        // Nettoyage de l'URL pour ne pas laisser le paramètre indéfiniment
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
          // ignore
        }
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const adhesionVal = data.montantAdhesion !== undefined ? data.montantAdhesion : (data.montantCotisation || 0);
        setMontantAdhesion(adhesionVal);
        setMontantCotisation(adhesionVal);
        setOptionsCotisation(Array.isArray(data.optionsCotisation) ? data.optionsCotisation : []);
        setLienPaiementExterne(data.lienPaiementExterne || '');
        setInstructionsPaiement(data.instructionsPaiement || '');
      }
      setLoading(false);
    }, (error) => {
      console.error("WidgetTreasury - Error fetching association settings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handlePayClick = () => {
    if (!lienPaiementExterne) {
      alert("Le lien de paiement n'a pas encore été configuré par l'association.");
      return;
    }

    try {
      const returnUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?payment=success`);
      const userEmail = profileData?.email ? encodeURIComponent(profileData.email) : '';
      const userUid = (profileData?.uid || profileData?.id) ? encodeURIComponent(profileData.uid || profileData.id) : '';

      const hasQuery = lienPaiementExterne.includes('?');
      const separator = hasQuery ? '&' : '?';
      const finalUrl = `${lienPaiementExterne}${separator}email=${userEmail}&uid=${userUid}&returnUrl=${returnUrl}`;

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.open(lienPaiementExterne, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRefreshStatus = async () => {
    const userUid = profileData?.uid || profileData?.id;
    if (!userUid) return;
    setIsRefreshing(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userUid));
      if (userDoc.exists()) {
        const freshData = userDoc.data();
        if (freshData.paymentStatus === 'paid') {
          setShowSuccessBanner(false);
        }
      }
    } catch (err) {
      console.error("WidgetTreasury - Error refreshing status:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex justify-center items-center">
        <span className="text-[10px] uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
      </CordelCard>
    );
  }

  const renderStatusBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="theme-stamp-badge theme-stamp-badge-wood bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400 border-green-700/35 uppercase text-[9px] font-black tracking-wider select-none px-2 py-0.5">
            ✅ À jour
          </span>
        );
      case 'exempted':
        return (
          <span className="theme-stamp-badge theme-stamp-badge-wood bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400 border-blue-700/35 uppercase text-[9px] font-black tracking-wider select-none px-2 py-0.5">
            💙 Exonéré
          </span>
        );
      case 'partial':
        return (
          <span className="theme-stamp-badge theme-stamp-badge-wood bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border-amber-700/35 uppercase text-[9px] font-black tracking-wider select-none px-2 py-0.5 animate-pulse">
            ⚠️ Partiel
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="theme-stamp-badge theme-stamp-badge-wood bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border-red-700/35 uppercase text-[9px] font-black tracking-wider select-none px-2 py-0.5">
            ❌ Non payé
          </span>
        );
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left">
      {/* Bandeau de succès Fallback UI si de retour de paiement HelloAsso */}
      {showSuccessBanner && (
        <div className="bg-green-100 border-l-4 border-green-600 text-green-900 dark:bg-green-950/40 dark:text-green-300 p-3 rounded text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-1 animate-fadeIn border border-green-200">
          <p className="font-bold leading-snug">
            💳 {t('helloAsso.successMessage') || "Paiement validé par HelloAsso ! La mise à jour de votre profil peut prendre quelques instants."}
          </p>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="px-3 py-1.5 font-black uppercase tracking-wider text-[10px] bg-green-700 hover:bg-green-800 text-white rounded border border-green-900 shadow cursor-pointer transition-all shrink-0"
          >
            {isRefreshing ? '🔄 ...' : `🔄 ${t('helloAsso.refreshButton') || "Rafraîchir mon statut"}`}
          </button>
        </div>
      )}

      {/* Title */}
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          🪙 {t('widgetTreasury.title') || "Adhésion & cotisation"}
        </h3>
        {renderStatusBadge()}
      </div>

      {paymentStatus === 'paid' || paymentStatus === 'exempted' ? (
        <div className="flex flex-col gap-2 py-2">
          <p className="text-xs font-bold text-encre-noire dark:text-cordel-bg-light">
            {paymentStatus === 'exempted'
              ? "🎉 Vous êtes exonéré de cotisation pour cette année."
              : "🎉 Axé ! Votre cotisation est entièrement réglée pour cette année."}
          </p>
          <p className="text-[10px] font-semibold text-cordel-master-dark/60 leading-relaxed">
            {paymentStatus === 'exempted'
              ? "Votre statut d'exonération a été validé par l'administration de l'association."
              : "Merci de votre soutien à l'association. Votre participation contribue au bon fonctionnement de la Roda et à l'entretien du matériel."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 bg-white/40 dark:bg-black/10 p-3 rounded border border-encre-noire/15 text-xs">
            <div className="flex justify-between items-center pb-1.5 border-b border-dashed border-encre-noire/15 last:border-0 last:pb-0">
              <span className="text-[10px] uppercase font-bold text-cordel-master-dark">
                Adhésion de base :
              </span>
              <span className="font-extrabold text-cordel-wood">
                {montantAdhesion} €
              </span>
            </div>
            
            {optionsCotisation.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed border-encre-noire/15">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                  Options disponibles :
                </span>
                <div className="flex flex-col gap-1 pl-1">
                  {optionsCotisation.map((opt) => (
                    <div key={opt.id} className="flex justify-between items-center text-[10px] font-semibold text-encre-noire dark:text-cordel-bg-light/90">
                      <span>• {opt.nom || "Option"}</span>
                      <span className="font-extrabold text-cordel-wood">{opt.montant || 0} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {instructionsPaiement && (
            <div className="flex flex-col gap-1.5 text-left">
              <span className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Instructions de l'association :
              </span>
              <div className="text-[10px] font-semibold text-encre-noire dark:text-cordel-bg-light/90 border-l-2 border-dashed border-cordel-wood pl-2.5 py-1 whitespace-pre-line leading-relaxed">
                {instructionsPaiement}
              </div>
            </div>
          )}

          {lienPaiementExterne ? (
            <button
              type="button"
              onClick={handlePayClick}
              className="w-full py-2.5 font-extrabold flex items-center justify-center gap-2 bg-[#d99f4d] text-encre-noire border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] hover:scale-[1.01] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all text-xs cursor-pointer select-none"
            >
              💳 Payer ma cotisation
            </button>
          ) : (
            <div className="text-[9px] italic text-red-700 dark:text-red-400 font-bold text-center bg-red-100/20 p-2 border border-dashed border-red-700/20 rounded">
              ⚠️ Le lien de paiement en ligne n'est pas encore disponible. Contactez un mestre/administrateur.
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
