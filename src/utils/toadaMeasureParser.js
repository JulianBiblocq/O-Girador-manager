/**
 * Utilitaire de découpage, analyse et sérialisation des toadas par mesure (.txt).
 * Gère 1 paragraphe = 1 mesure, anacrouse (+), mesure liée (/),
 * accords harmoniques [Dm7], Puxador (*gras*) / Coro et retours visuels.
 * Rétrocompatible 100 % avec le format HTML TipTap hérité.
 */

// Regex pour extraire les accords entre crochets : [Dm7], [C#m], [G/B]
const CHORD_REGEX = /\[([A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*)\]/g;

/**
 * Analyse une ligne de texte pour séparer les syllabes/mots et leurs accords associés.
 * @param {string} lineText - Ligne brute avec accords éventuels
 * @returns {Array<{ text: string, chord: string|null, isPuxador: boolean }>}
 */
export function parseLineWithChords(lineText) {
  if (!lineText) return [];
  const segments = [];
  let remaining = lineText;
  let currentChord = null;

  while (remaining.length > 0) {
    const match = CHORD_REGEX.exec(remaining);
    if (!match) {
      if (remaining.length > 0) {
        segments.push({ text: remaining, chord: currentChord });
      }
      break;
    }

    const chordIndex = match.index;
    const textBefore = remaining.slice(0, chordIndex);
    if (textBefore.length > 0 || currentChord) {
      segments.push({ text: textBefore, chord: currentChord });
    }

    currentChord = match[1];
    remaining = remaining.slice(chordIndex + match[0].length);
    CHORD_REGEX.lastIndex = 0;
  }

  // Traitement du Puxador (*gras*) dans les segments
  return segments.flatMap((seg) => {
    const parts = seg.text.split(/(\*[^*]+\*)/g);
    let chordAssigned = false;
    return parts.filter(Boolean).map((part) => {
      const isBold = part.startsWith('*') && part.endsWith('*');
      const cleanText = isBold ? part.slice(1, -1) : part;
      const assignedChord = !chordAssigned ? seg.chord : null;
      if (assignedChord) chordAssigned = true;
      return { text: cleanText, chord: assignedChord, isPuxador: isBold };
    });
  });
}

/**
 * Analyse un contenu brut de toada (texte ou HTML) en liste structurée de mesures.
 * @param {string} rawText - Contenu brut de la toada
 * @returns {{ isMeasureFormat: boolean, measures: Array, rawHtml?: string }}
 */
export function parseToadaMeasures(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { isMeasureFormat: false, measures: [] };
  }

  // Détection du format HTML hérité TipTap
  const isHtml = /<[a-z][\s\S]*>/i.test(rawText);
  if (isHtml) {
    return { isMeasureFormat: false, rawHtml: rawText, measures: [] };
  }

  // Découpage par paragraphe : un double saut de ligne sépare chaque mesure
  const paragraphs = rawText.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return { isMeasureFormat: false, measures: [] };
  }

  const measures = paragraphs.map((para, index) => {
    let cleanPara = para;
    let hasAnacrusis = false;
    let isLinked = false;

    // Détection Anacrouse (+) en tête de mesure
    if (cleanPara.startsWith('+')) {
      hasAnacrusis = true;
      cleanPara = cleanPara.slice(1).trimStart();
    }

    // Détection Mesure liée (/) en tête de mesure
    if (cleanPara.startsWith('/')) {
      isLinked = true;
      cleanPara = cleanPara.slice(1).trimStart();
    }

    // Découpage en lignes pour identifier les retours visuels (lignes avec espace initial)
    const rawLines = para.split(/\r?\n/);
    const lines = rawLines.map((line, lIdx) => {
      const isVisualBreak = lIdx > 0 && /^\s+/.test(line);
      let lineContent = line.trim();
      if (lIdx === 0) {
        if (lineContent.startsWith('+') || lineContent.startsWith('/')) {
          lineContent = lineContent.slice(1).trimStart();
        }
      }
      return {
        isVisualBreak,
        segments: parseLineWithChords(lineContent),
        rawLine: lineContent
      };
    }).filter(l => l.rawLine.length > 0);

    const hasChords = lines.some((l) => l.segments.some((s) => Boolean(s.chord)));

    return {
      measureNumber: index + 1,
      hasAnacrusis,
      isLinked,
      hasChords,
      lines
    };
  });

  return { isMeasureFormat: true, measures };
}

/**
 * Nettoie une mesure pour l'affichage épuré élève (retire +, /, crochets d'accords et astérisques).
 */
export function cleanMeasureTextForStudent(text) {
  if (!text) return '';
  return text
    .replace(/^\s*[+/]\s*/, '')
    .replace(CHORD_REGEX, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}
