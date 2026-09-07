import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

/**
 * Composant de bannière affichant l'état de l'abonnement.
 * S'affiche en rouge si l'abonnement est échu (lecture seule), 
 * ou en info pour la période d'essai.
 */
export default function SubscriptionBanner({ licenseInfo, profileData }) {
  const { isReadOnly, message, status, isTrial, trialDaysRemaining } = licenseInfo;
  const [loading, setLoading] = useState(false);

  if (!isReadOnly && !isTrial) return null;

  const isAdmin = profileData && ['admin', 'super-admin', 'mestre'].includes(profileData.role);

  const handleManageSubscription = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const createPortalSession = httpsCallable(functions, 'createStripePortalSession');
      const result = await createPortalSession({
        groupId: profileData.groupId,
        returnUrl: window.location.href
      });
      if (result.data && result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      console.error("Erreur lors de la création de la session Stripe:", err);
      alert("Impossible d'accéder au portail de paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full p-3 text-center text-sm font-bold shadow-md z-50 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all ${
      isReadOnly 
        ? 'bg-red-600 text-white border-b-4 border-red-800' 
        : 'bg-orange-100 text-orange-800 border-b-2 border-orange-300'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{isReadOnly ? '⚠️' : '⏱️'}</span>
        <span>{message}</span>
      </div>
      
      {isAdmin && isReadOnly && (
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="px-4 py-1.5 bg-white text-red-700 rounded shadow hover:bg-stone-100 active:scale-95 transition-transform font-extrabold uppercase text-xs"
        >
          {loading ? 'Redirection...' : 'Régulariser mon abonnement'}
        </button>
      )}
      
      {isAdmin && isTrial && trialDaysRemaining <= 7 && (
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="px-4 py-1.5 bg-orange-600 text-white rounded shadow hover:bg-orange-700 active:scale-95 transition-transform font-extrabold uppercase text-xs"
        >
          {loading ? 'Redirection...' : 'Passer en Premium'}
        </button>
      )}
    </div>
  );
}
