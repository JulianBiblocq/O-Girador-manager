import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase'; // Assurez-vous d'avoir initialisé l'application Firebase

const db = getFirestore(app);

export const telemetryService = {
  /**
   * Envoie une erreur au Hub Central (Orquestrador)
   * @param {Error|String} error - L'erreur interceptée
   * @param {String} context - Le composant ou l'action où l'erreur s'est produite
   * @param {String} groupId - L'ID de l'association (si l'utilisateur est connecté)
   */
  logError: async (error, context = 'global', groupId = 'anonymous') => {
    try {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : null;

      await addDoc(collection(db, 'hub_system_errors'), {
        // Identifiant de l'application (Séquenceur, Manager, Vitrine ou Dançador)
        appId: 'manager', 
        
        groupId: groupId,
        error: errorMsg,
        stack: errorStack,
        context: context,
        timestamp: serverTimestamp(),
        resolved: false
      });
      
      console.log('Télémétrie : Erreur remontée à l\'Orquestrador.');
    } catch (err) {
      console.error('Échec de l\'envoi de la télémétrie:', err);
    }
  }
};
