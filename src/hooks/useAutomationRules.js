import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook useAutomationRules
 * Gère la synchronisation en temps réel et les opérations CRUD
 * sur les règles d'automatisation et de relance sous associations/{groupId}/automation_rules
 * 
 * @param {string} groupId Identifiant de l'association
 * @returns {Object} { rules, loading, addRule, updateRule, deleteRule, toggleRuleActive }
 */
export function useAutomationRules(groupId) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const rulesRef = collection(db, 'associations', groupId, 'automation_rules');
    const q = query(rulesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRules = [];
      snapshot.forEach((docSnap) => {
        fetchedRules.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      
      // Tri en JavaScript pour éviter que les règles sans createdAt disparaissent à cause de Firestore
      fetchedRules.sort((a, b) => {
        const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return dateB - dateA;
      });
      
      setRules(fetchedRules);
      setLoading(false);
    }, (error) => {
      console.error("useAutomationRules - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Ajouter une nouvelle règle d'automatisation
  const addRule = async (ruleData) => {
    if (!groupId) return;

    try {
      const rulesRef = collection(db, 'associations', groupId, 'automation_rules');
      await addDoc(rulesRef, {
        titre: ruleData.titre || 'Nouvelle Règle',
        typeEvenementCible: ruleData.typeEvenementCible || 'tous',
        publicCible: ruleData.publicCible || 'tous',
        joursAvant: parseInt(ruleData.joursAvant, 10) || 1,
        pointDeReference: ruleData.pointDeReference || 'registrationDeadline', // 'registrationDeadline' ou 'eventDate'
        titreNotification: ruleData.titreNotification || 'Rappel Événement',
        messageNotification: ruleData.messageNotification || 'N’oubliez pas de répondre pour {{nomEvenement}} !',
        isActive: ruleData.isActive !== false,
        createdAt: serverTimestamp(),
        groupId: groupId
      });
    } catch (error) {
      console.error("useAutomationRules - Erreur ajout règle :", error);
      throw error;
    }
  };

  // Modifier une règle existante
  const updateRule = async (ruleId, ruleData) => {
    if (!groupId || !ruleId) return;

    try {
      const ruleRef = doc(db, 'associations', groupId, 'automation_rules', ruleId);
      await updateDoc(ruleRef, {
        titre: ruleData.titre,
        typeEvenementCible: ruleData.typeEvenementCible || 'tous',
        publicCible: ruleData.publicCible || 'tous',
        joursAvant: parseInt(ruleData.joursAvant, 10) || 1,
        pointDeReference: ruleData.pointDeReference,
        titreNotification: ruleData.titreNotification,
        messageNotification: ruleData.messageNotification,
        isActive: ruleData.isActive !== false
      });
    } catch (error) {
      console.error("useAutomationRules - Erreur modification règle :", error);
      throw error;
    }
  };

  // Supprimer une règle
  const deleteRule = async (ruleId) => {
    if (!groupId || !ruleId) return;

    try {
      const ruleRef = doc(db, 'associations', groupId, 'automation_rules', ruleId);
      await deleteDoc(ruleRef);
    } catch (error) {
      console.error("useAutomationRules - Erreur suppression règle :", error);
      throw error;
    }
  };

  // Activer / Désactiver une règle
  const toggleRuleActive = async (ruleId, currentIsActive) => {
    if (!groupId || !ruleId) return;

    try {
      const ruleRef = doc(db, 'associations', groupId, 'automation_rules', ruleId);
      await updateDoc(ruleRef, {
        isActive: !currentIsActive
      });
    } catch (error) {
      console.error("useAutomationRules - Erreur bascule statut règle :", error);
      throw error;
    }
  };

  return {
    rules,
    loading,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleActive
  };
}
