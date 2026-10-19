import { parseToadaMeasureText } from './toadaMeasureParser.js';
import { toadaToCleanHtml } from './toadaSerializer.js';

/**
 * Utilitaire de formatage et persistance rétrocompatible pour les chants Toada (< 75 lignes).
 * Sépare le code brut .txt (rawTxtCode & structuredMeasures) du HTML propre pour les élèves (parolesOriginales).
 */
export function formatToadaSongData(songData = {}) {
  const isHtml = /<[a-z][\s\S]*>/i.test(songData.parolesOriginales || '');
  let rawTxtCode = songData.rawTxtCode || '';
  let parolesOriginales = songData.parolesOriginales || '';
  let structuredMeasures = songData.structuredMeasures || [];

  // Si l'utilisateur a saisi du texte brut de mesures
  if (!isHtml && parolesOriginales.trim()) {
    rawTxtCode = parolesOriginales;
    structuredMeasures = parseToadaMeasureText(rawTxtCode);
    parolesOriginales = toadaToCleanHtml(rawTxtCode);
  } else if (rawTxtCode.trim()) {
    // Si rawTxtCode est déjà fourni (ex: import cantador ou édition)
    structuredMeasures = parseToadaMeasureText(rawTxtCode);
    if (!isHtml) {
      parolesOriginales = toadaToCleanHtml(rawTxtCode);
    }
  }

  const sig = songData.signature || songData.timeSignature || '4/4';

  return {
    ...songData,
    rawTxtCode,
    structuredMeasures,
    parolesOriginales,
    signature: sig,
    timeSignature: sig,
    bpmDefaut: songData.bpmDefaut || '',
    tonaliteDefaut: songData.tonaliteDefaut || ''
  };
}
