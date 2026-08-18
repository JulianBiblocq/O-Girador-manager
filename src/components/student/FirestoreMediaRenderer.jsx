import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import LZString from 'lz-string';
import PatternVisualizer from '../pedagogy/PatternVisualizer';

export default function FirestoreMediaRenderer({ url }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!url || !url.startsWith('firestore:')) {
          throw new Error('URL invalide');
        }

        const parts = url.split(':');
        const type = parts[1]; // 'pattern' ou 'section'
        const id = parts[2];
        const collectionName = type === 'pattern' ? 'patterns' : 'sections';

        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Document introuvable');
        }

        const docData = docSnap.data();
        const compressedData = docData.data;
        
        let parsedData = null;
        if (compressedData) {
          // Dans o-girador, le séquenceur compresse souvent en Base64 ou UTF16
          let decompressedStr = LZString.decompressFromBase64(compressedData);
          if (!decompressedStr) {
             decompressedStr = LZString.decompressFromUTF16(compressedData);
          }
          
          if (decompressedStr) {
            parsedData = JSON.parse(decompressedStr);
          }
        }

        setData({
          audioUrl: docData.audioUrl || null,
          patternData: parsedData,
          type
        });

      } catch (err) {
        console.error('Erreur FirestoreMediaRenderer:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (loading) {
    return <div className="text-center p-4 text-xs font-bold text-cordel-master-dark opacity-60 animate-pulse">Chargement du média...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-xs font-bold text-cordel-rouge">Erreur : {error}</div>;
  }

  if (!data) return null;

  // Extraction du pattern visuel (limité au premier instrument pour ne pas surcharger)
  let stepsToVisualize = null;
  let trackName = '';
  
  if (data.patternData && data.patternData.tracks && data.patternData.tracks.length > 0) {
    // Si c'est une section (complexe), on prend la première piste non vide
    // Si c'est un pattern, il n'y a souvent qu'une piste de toute façon
    const track = data.patternData.tracks.find(t => t.steps && t.steps.length > 0) || data.patternData.tracks[0];
    if (track && Array.isArray(track.steps)) {
      stepsToVisualize = track.steps;
      trackName = track.name || 'Instrument 1';
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full my-4 animate-fadeIn">
      {/* Lecteur Audio (s'il existe) */}
      {data.audioUrl && (
        <audio controls src={data.audioUrl} className="w-full max-w-sm rounded-full border-2 border-cordel-wood/20 shadow-sm" />
      )}

      {/* Grille Visuelle */}
      {stepsToVisualize && (
        <div className="flex flex-col items-center w-full mt-2">
          <span className="text-[10px] font-black uppercase text-encre-noire/50 mb-2">
            Visuel : {trackName}
          </span>
          <div className="w-full overflow-x-auto max-w-full pb-2 scrollbar-thin flex justify-center">
             <PatternVisualizer patternArray={stepsToVisualize} beatResolution={4} />
          </div>
        </div>
      )}
      
      {!data.audioUrl && !stepsToVisualize && (
        <div className="text-[10px] text-encre-noire/40 italic">Aucun aperçu disponible pour ce média.</div>
      )}
    </div>
  );
}
