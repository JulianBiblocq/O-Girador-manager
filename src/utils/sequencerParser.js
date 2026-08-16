/**
 * Parseur pour extraire les métadonnées pédagogiques depuis le JSON du séquenceur.
 * Utilisé par le module Mon Parcours (Élève) et le Fallback Mestre.
 */

export const parseSequencerJson = (jsonData) => {
  if (!jsonData) return { baguettes: null, unisonAlfaias: null };

  let baguettes = null;
  let unisonAlfaias = null;

  // 1. Analyse de la section info (prioritaire si explicitement défini)
  if (jsonData.info) {
    if (jsonData.info.baguettes) {
      baguettes = jsonData.info.baguettes;
    }
    if (jsonData.info.unisonAlfaias !== undefined) {
      unisonAlfaias = Boolean(jsonData.info.unisonAlfaias);
    }
  }

  // 2. Détection automatique du matériel (Bacalhau), instruments présents et patterns rythmiques
  let instrumentsPresents = [];
  let patterns = [];
  
  if (Array.isArray(jsonData.tracks)) {
    const instrumentsSet = new Set();
    let hasBacalhau = false;
    
    jsonData.tracks.forEach(track => {
      let trackName = (track.name || track.instrument || '').trim();
      if (trackName.toLowerCase().includes('bacalhau')) {
        hasBacalhau = true;
      }
      
      if (trackName) {
        // Clean up names like "Alfaia 1", "Caixa 2" -> "Alfaia", "Caixa"
        let cleanName = trackName.replace(/\s+\d+$/, '').trim();
        // Formater to capitalize first letter
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
        instrumentsSet.add(cleanName);
        
        // Extraire le pattern (les pas) pour ce track s'il existe
        if (Array.isArray(track.steps) && track.steps.length > 0) {
          patterns.push({
            instrumentName: trackName,
            cleanName: cleanName,
            steps: track.steps
          });
        }
      }
    });

    instrumentsPresents = Array.from(instrumentsSet);

    if (hasBacalhau && !baguettes) {
      baguettes = '1 grosse baguette + 1 bacalhau';
    }
  }

  return { baguettes, unisonAlfaias, instrumentsPresents, patterns };
};
