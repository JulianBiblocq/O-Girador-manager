import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to convert hex colors to a softer pastel version (for readable backgrounds)
export function getPastelColor(hex, opacity = 0.12) {
  if (!hex || hex === 'transparent') return 'rgba(140, 133, 123, 0.12)';
  
  // Clean hex prefix
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  
  if (cleanHex.length !== 6) return 'rgba(140, 133, 123, 0.12)';
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function useInstrumentColor(groupId) {
  const [pupitresColors, setPupitresColors] = useState({});

  useEffect(() => {
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPupitresColors(data.pupitresColors || {});
      }
    }, (error) => {
      console.error("useInstrumentColor - Error listening to association:", error);
    });

    return () => unsubscribe();
  }, [groupId]);

  const getColorForInstrument = (instrumentName, format = 'pastel') => {
    if (!instrumentName) {
      return format === 'pastel' ? 'rgba(140, 133, 123, 0.12)' : '#8c857b';
    }

    // Default mapping for fallback colors (in case not configured in DB)
    const defaultColors = {
      'mestre': '#8b2a1a',
      'agbê': '#d99f4d',
      'caixa': '#2d4a36',
      'caixas': '#2d4a36',
      'alfaia': '#6e473b',
      'alfaias': '#6e473b',
      'chant': '#3b5d6e',
      'danse': '#8c857b'
    };

    const cleanName = instrumentName.trim().toLowerCase();
    
    // Find matching configuration
    let foundHex = null;
    
    // Exact match in database colors (case insensitive)
    const dbKey = Object.keys(pupitresColors).find(
      key => key.toLowerCase() === cleanName
    );
    if (dbKey) {
      foundHex = pupitresColors[dbKey];
    }
    
    // Fallback: look if the instrument name is a substring of a database key or vice-versa
    if (!foundHex) {
      const matchKey = Object.keys(pupitresColors).find(
        key => cleanName.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanName)
      );
      if (matchKey) {
        foundHex = pupitresColors[matchKey];
      }
    }
    
    // Fallback to static defaults
    if (!foundHex) {
      const defaultKey = Object.keys(defaultColors).find(
        key => cleanName.includes(key) || key.includes(cleanName)
      );
      foundHex = defaultKey ? defaultColors[defaultKey] : '#8c857b';
    }

    return format === 'pastel' ? getPastelColor(foundHex) : foundHex;
  };

  return {
    pupitresColors,
    getColorForInstrument
  };
}
