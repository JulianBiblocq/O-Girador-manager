import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Service de provisionnement initial (Seed) d'une nouvelle association (Tenant)
 * Injecte les données de base métiers (Varal, Inventaire, Modules) lors de la validation de l'onboarding.
 * 
 * @param {string} groupId - ID de l'association
 * @param {object} baseData - Données existantes à fusionner
 * @returns {Promise<void>}
 */
export const seedNewTenant = async (groupId, baseData = {}) => {
  if (!groupId) throw new Error("groupId requis pour le provisionnement.");

  const assocRef = doc(db, 'associations', groupId);

  // 1. Catégories standards du Varal (Documents)
  const defaultVaralCategories = [
    { id: 'repertoire', nom: 'Partitions & Morceaux', activerUploadPublic: false },
    { id: 'pedagogie', nom: 'Tutoriels & Pédagogie', activerUploadPublic: false },
    { id: 'reunions', nom: 'Comptes-rendus & CA', activerUploadPublic: false },
    { id: 'administratif', nom: 'Documents administratifs', activerUploadPublic: false }
  ];

  // 2. Catégories standards d'Inventaire (Logistique)
  const defaultInventoryCategories = [
    'Matériel scénique',
    'Instruments & Accessoires',
    'Sonorisation',
    'Costumes & Tenues'
  ];

  // 3. Activation des modules recommandés (socle universel)
  const defaultModules = {
    gouvernance: true,
    logistique: true,
    reunions: true,
    forum: true,
    // Laisser false pour les modules optionnels spécifiques (ex: lutherie, mestre) 
    // s'ils ne sont pas explicitement activés par le profil ou manuellement.
  };

  const seedData = {
    varalCategories: baseData.varalCategories || defaultVaralCategories,
    inventoryCategories: baseData.inventoryCategories || defaultInventoryCategories,
    modules: {
      ...defaultModules,
      ...(baseData.modules || {})
    },
    subscription: {
      plan: 'trial',
      status: 'active',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    }
  };

  // setDoc avec merge: true garantit qu'on n'écrase pas l'abonnement ou les infos d'inscription existantes
  await setDoc(assocRef, seedData, { merge: true });
};
