import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '../firebase';
import LZString from 'lz-string';

// ============================================================================
// Interfaces et Typage (TypeScript)
// ============================================================================

export interface SequencerData {
  [key: string]: any; // Structure flexible pour les données JSON décompressées
}

export interface Pattern {
  id: string;
  ownerId: string;
  name: string;
  folder: string;
  visibility: string;
  data: SequencerData | null; // Les données JSON décompressées
}

export interface Section {
  id: string;
  ownerId: string;
  name: string;
  visibility: string;
  data: SequencerData | null;
}

export interface Exercise {
  id: string;
  ownerId: string;
  gameType: string;
  data: SequencerData | null;
}

export interface Progression {
  id: string;
  ownerId: string;
  data: SequencerData | null;
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Décompresse une chaîne compressée avec lz-string (decompressFromUTF16) 
 * pour restituer un objet JSON natif.
 * 
 * @param compressedData Chaîne de caractères compressée
 * @returns Objet JSON décompressé, ou null en cas d'erreur ou de données absentes
 */
export const decompressData = (compressedData: string | undefined): SequencerData | null => {
  if (!compressedData) return null;
  
  try {
    const decompressed = LZString.decompressFromUTF16(compressedData);
    if (!decompressed) {
      console.warn("La décompression lz-string a retourné un résultat vide.");
      return null;
    }
    return JSON.parse(decompressed);
  } catch (erreur) {
    console.error("Erreur lors de la décompression ou du parsing des données JSON :", erreur);
    return null;
  }
};

// ============================================================================
// Services de récupération de données Firestore
// ============================================================================

/**
 * Récupère les patterns de la base de données.
 * Cette fonction filtre pour n'obtenir que les patterns publics 
 * ET/OU ceux appartenant spécifiquement au Mestre demandé.
 * 
 * @param mestreId L'identifiant du Mestre (ownerId)
 * @returns Une liste de Patterns avec leurs données (champ data) décompressées
 */
export const fetchPatternsByMestre = async (mestreId: string): Promise<Pattern[]> => {
  try {
    const patternsRef = collection(db, 'patterns');
    
    // Requête pour combiner les conditions avec un OR
    const req = query(
      patternsRef,
      or(
        where('visibility', '==', 'public'),
        where('ownerId', '==', mestreId)
      )
    );

    const snapshot = await getDocs(req);
    const patterns: Pattern[] = [];

    snapshot.forEach((doc) => {
      const dataDoc = doc.data();
      patterns.push({
        id: doc.id,
        ownerId: dataDoc.ownerId || '',
        name: dataDoc.name || '',
        folder: dataDoc.folder || '',
        visibility: dataDoc.visibility || '',
        data: decompressData(dataDoc.data)
      });
    });

    return patterns;
  } catch (erreur) {
    console.error("Erreur lors de la récupération des patterns :", erreur);
    throw erreur;
  }
};
