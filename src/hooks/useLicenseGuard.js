import { useMemo } from 'react';

/**
 * Hook pour évaluer l'état de la licence et l'accès en lecture seule.
 * Protège contre le blocage des comptes historiques (absence d'objet subscription).
 * 
 * @param {Object} associationSettings - Les paramètres de l'association depuis Firestore
 * @returns {Object} { isReadOnly, status, plan, isTrial, message }
 */
export default function useLicenseGuard(associationSettings) {
  return useMemo(() => {
    // Règle de non-régression stricte : on ne bloque jamais un ancien tenant sans abonnement
    if (!associationSettings || !associationSettings.subscription) {
      return {
        isReadOnly: false,
        status: 'exempt',
        plan: 'exempt',
        isTrial: false,
        message: null
      };
    }

    const { subscription } = associationSettings;
    const { status, plan, trialEndsAt } = subscription;
    
    // Vérification du statut bloquant
    const isReadOnly = ['past_due', 'expired', 'canceled'].includes(status);
    
    // Détection de la période d'essai active
    const isTrial = plan === 'trial' && status === 'active';
    let trialDaysRemaining = 0;
    
    if (isTrial && trialEndsAt) {
      const end = new Date(trialEndsAt).getTime();
      const now = Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    let message = null;
    if (isReadOnly) {
      if (status === 'past_due') {
        message = 'Paiement en échec. Votre espace est passé en lecture seule. Veuillez régulariser votre situation.';
      } else if (status === 'expired' || status === 'canceled') {
        message = 'Abonnement échu ou annulé. Espace en lecture seule.';
      }
    } else if (isTrial) {
      message = `Période d'essai (${trialDaysRemaining} jours restants).`;
    }

    return {
      isReadOnly,
      status,
      plan,
      isTrial,
      trialDaysRemaining,
      message
    };
  }, [associationSettings]);
}
