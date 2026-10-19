/**
 * Utilitaire de découpage et analyse des toadas par mesure (.txt) (< 145 lignes).
 * Gère 1 paragraphe = 1 mesure, anacrouse (+), mesure liée (/),
 * sections ([Intro], [Refrain]...), accords [Dm7], Puxador (*gras*) / Coro.
 */

// Regex pour extraire les accords entre crochets : [Dm7], [C#m], [G/B]
export const CHORD_REGEX = /\[([A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*)\]/g;

// Regex pour identifier une section : [Intro], [Partie 1], [Refrain]... (exclut les accords seuls)
export const SECTION_HEADER_REGEX = /^\s*\[(?!(?:[A-G][b#]?(?:m|maj|min|dim|aug|sus|[0-9]|b5|#5|\/[A-G][b#]?)*)\])([^\]]+)\]\s*$/i;

export function isSectionHeader(line) {
  if (!line || typeof line !== 'string') return false;
  return SECTION_HEADER_REGEX.test(line.trim());
}

export function parseLineWithChords(lineText) {
  if (!lineText) return [];
  const segments = [];
  let remaining = lineText;
  let currentChord = null;

  while (remaining.length > 0) {
    const match = CHORD_REGEX.exec(remaining);
    if (!match) {
      if (remaining.length > 0) segments.push({ text: remaining, chord: currentChord });
      break;
    }
    const chordIndex = match.index;
    const textBefore = remaining.slice(0, chordIndex);
    if (textBefore.length > 0 || currentChord) segments.push({ text: textBefore, chord: currentChord });
    currentChord = match[1];
    remaining = remaining.slice(chordIndex + match[0].length);
    CHORD_REGEX.lastIndex = 0;
  }

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

export function parseToadaMeasures(rawText) {
  if (!rawText || typeof rawText !== 'string') return { isMeasureFormat: false, measures: [], sections: [] };
  const isHtml = /<[a-z][\s\S]*>/i.test(rawText);
  if (isHtml) return { isMeasureFormat: false, rawHtml: rawText, measures: [], sections: [] };

  const paragraphs = rawText.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return { isMeasureFormat: false, measures: [], sections: [] };

  const sections = [];
  let currentSection = { name: '', measures: [] };
  let globalMeasureIdx = 0;

  for (const para of paragraphs) {
    const lines = para.split(/\r?\n/);
    const firstLine = lines[0]?.trim();
    if (isSectionHeader(firstLine)) {
      if (currentSection.measures.length > 0 || currentSection.name) sections.push(currentSection);
      const sectionName = firstLine.replace(/^\s*\[|\]\s*$/g, '').trim();
      currentSection = { name: sectionName, measures: [] };
      if (lines.length === 1) continue;
      lines.shift();
    }

    let cleanPara = lines.join('\n');
    let hasAnacrusis = cleanPara.startsWith('+');
    let isLinked = cleanPara.startsWith('/');
    if (hasAnacrusis || isLinked) cleanPara = cleanPara.slice(1).trimStart();

    const parsedLines = lines.map((line, lIdx) => {
      const isVisualBreak = lIdx > 0 && /^\s+/.test(line);
      let lineContent = line.trim();
      if (lIdx === 0 && (lineContent.startsWith('+') || lineContent.startsWith('/'))) {
        lineContent = lineContent.slice(1).trimStart();
      }
      return { isVisualBreak, segments: parseLineWithChords(lineContent), rawLine: lineContent };
    }).filter((l) => l.rawLine.length > 0);

    globalMeasureIdx++;
    const measureObj = {
      measureNumber: globalMeasureIdx,
      hasAnacrusis,
      isLinked,
      hasChords: parsedLines.some((l) => l.segments.some((s) => Boolean(s.chord))),
      lines: parsedLines,
      rawContent: cleanPara
    };
    currentSection.measures.push(measureObj);
  }

  if (currentSection.measures.length > 0 || currentSection.name) sections.push(currentSection);
  const flatMeasures = sections.flatMap((s) => s.measures);
  return { isMeasureFormat: true, measures: flatMeasures, sections };
}

export const parseToadaMeasureText = (text) => parseToadaMeasures(text).measures;

export function cleanMeasureTextForStudent(text) {
  if (!text) return '';
  return text
    .replace(/^\s*[+/]\s*/, '')
    .replace(CHORD_REGEX, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}
