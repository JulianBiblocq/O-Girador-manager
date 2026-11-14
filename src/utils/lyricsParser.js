/**
 * Utilitaire de découpage et d'analyse des paroles de toadas (< 145 lignes).
 * Distingue le soliste (Puxador, gras) du chœur (Coro, normal) tout en préservant
 * intégralement les balises syllabiques `<u>...</u>` (DOM navigateur & Node/SSR).
 */

const stripUnderlineForEmptyCheck = (s = '') => s.replace(/<\/?u\b[^>]*>/gi, '').trim();

const pushSegmentText = (segments, text, isBold) => {
  if (!text) return;
  if (segments.length > 0 && segments[segments.length - 1].isBold === isBold) {
    segments[segments.length - 1].text += text;
  } else {
    segments.push({ text, isBold });
  }
};

const finalizeLineBlock = (segments, blocks) => {
  const fullText = segments.map((s) => s.text).join('').trim();
  if (!stripUnderlineForEmptyCheck(fullText)) {
    if (blocks.length > 0 && blocks[blocks.length - 1] !== ' ') blocks.push(' ');
    return false;
  }
  const hasBold = segments.some((s) => s.isBold && stripUnderlineForEmptyCheck(s.text).length > 0);
  const hasNormal = segments.some((s) => !s.isBold && stripUnderlineForEmptyCheck(s.text).length > 0);
  if (hasBold && !hasNormal) {
    blocks.push({ puxador: fullText });
    return true;
  }
  if (!hasBold && hasNormal) {
    blocks.push({ coro: fullText });
    return false;
  }
  blocks.push({
    isMixed: true,
    segments: [...segments],
    puxador: segments.filter((s) => s.isBold).map((s) => s.text).join(' ').trim(),
    coro: segments.filter((s) => !s.isBold).map((s) => s.text).join(' ').trim(),
  });
  return true;
};

const trimOuterBlankBlocks = (blocks) => {
  while (blocks.length > 0 && typeof blocks[0] === 'string' && blocks[0].trim() === '') blocks.shift();
  while (blocks.length > 0 && typeof blocks[blocks.length - 1] === 'string' && blocks[blocks.length - 1].trim() === '') blocks.pop();
  return blocks;
};

export const parseLyricsString = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  if (!/<[a-z][\s\S]*>/i.test(htmlString)) return htmlString;

  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = htmlString
      .replace(/<\/?(p|div)[^>]*>/gi, (m) => (m.startsWith('</') ? '<br/>' : ''))
      .replace(/&nbsp;/gi, ' ');

    const blocks = [];
    let currentSegments = [], hasAnyPuxador = false;
    const commit = () => {
      if (finalizeLineBlock(currentSegments, blocks)) hasAnyPuxador = true;
      currentSegments = [];
    };

    const traverse = (node, isBold) => {
      if (node.nodeType === Node.TEXT_NODE) {
        pushSegmentText(currentSegments, node.textContent, isBold);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'br') { commit(); return; }
        const isNodeBold = isBold || tag === 'b' || tag === 'strong' ||
          Boolean(node.style?.fontWeight && (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight, 10) >= 600)) ||
          Boolean(node.classList && (node.classList.contains('font-bold') || node.classList.contains('font-black')));
        if (tag === 'u') pushSegmentText(currentSegments, '<u>', isNodeBold);
        for (let i = 0; i < node.childNodes.length; i++) traverse(node.childNodes[i], isNodeBold);
        if (tag === 'u') pushSegmentText(currentSegments, '</u>', isNodeBold);
      }
    };

    traverse(div, false);
    commit();
    return hasAnyPuxador ? trimOuterBlankBlocks(blocks) : htmlString;
  }

  const lines = htmlString
    .replace(/>\s+</g, '><')
    .replace(/<\/?(p|div)[^>]*>/gi, (m) => (m.startsWith('</') ? '\n' : ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .split('\n');

  const blocks = [];
  let hasAnyPuxador = false;
  const tagRegex = /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>|((?:<\/?u\b[^>]*>|[^<])+)/gi;

  for (const line of lines) {
    if (!stripUnderlineForEmptyCheck(line)) {
      if (blocks.length > 0 && blocks[blocks.length - 1] !== ' ') blocks.push(' ');
      continue;
    }
    const segments = [];
    let match;
    tagRegex.lastIndex = 0;
    while ((match = tagRegex.exec(line)) !== null) {
      if (match[2] !== undefined) pushSegmentText(segments, match[2], true);
      else if (match[3] !== undefined) pushSegmentText(segments, match[3], false);
    }
    if (finalizeLineBlock(segments, blocks)) hasAnyPuxador = true;
  }

  return hasAnyPuxador ? trimOuterBlankBlocks(blocks) : htmlString;
};
