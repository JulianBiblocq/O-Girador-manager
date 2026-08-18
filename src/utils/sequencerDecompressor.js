import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LZString from 'lz-string';

/**
 * Récupère un pattern depuis la collection "patterns" et le décompresse.
 * 
 * @param {string} id L'identifiant du document pattern dans Firestore.
 * @returns {Promise<{ patternData: any, audioUrl: string | null, rawDoc: any }>}
 */
export const fetchAndDecompressPattern = async (id) => {
  try {
    const docRef = doc(db, 'patterns', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const compressedData = data.data;
      const audioUrl = data.audioUrl || null;
      
      let patternData = null;
      if (compressedData) {
        try {
          const decompressedStr = LZString.decompressFromBase64(compressedData);
          if (decompressedStr) {
            patternData = JSON.parse(decompressedStr);
          }
        } catch (parseError) {
          console.error("Erreur lors de la décompression ou du parsing du pattern :", parseError);
        }
      }

      return {
        patternData,
        audioUrl,
        rawDoc: data
      };
    } else {
      console.warn(`Aucun pattern trouvé pour l'ID : ${id}`);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du pattern depuis Firestore :", error);
    throw error;
  }
};
