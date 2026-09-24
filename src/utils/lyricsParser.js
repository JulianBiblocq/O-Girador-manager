/**
 * Utilitaire de découpage et d'analyse des paroles de toadas.
 * Permet de distinguer sur une même ligne ou sur plusieurs lignes :
 * - Le soliste (Puxador, texte en gras)
 * - Le chœur (Coro, texte normal / italique)
 */

export const parseLyricsString = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return htmlString;
  
  const isHtml = /<[a-z][\s\S]*>/i.test(htmlString);
  if (!isHtml) return htmlString;

  // 1. Environnement navigateur (DOM complet)
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = htmlString
      .replace(/<\/?(p|div)[^>]*>/gi, (match) => match.startsWith('</') ? '<br/>' : '')
      .replace(/&nbsp;/gi, ' ');
      
    const blocks = [];
    let currentLineSegments = [];
    let hasAnyPuxador = false;

    const commitLine = () => {
      const fullText = currentLineSegments.map((s) => s.text).join('').trim();
      if (!fullText) {
        if (blocks.length > 0 && blocks[blocks.length - 1] !== ' ') {
          blocks.push(' ');
        }
        currentLineSegments = [];
        return;
      }

      // Identifier si la ligne comporte des morceaux en gras (Puxador) et/ou en normal (Coro)
      const hasBold = currentLineSegments.some((s) => s.isBold && s.text.trim().length > 0);
      const hasNormal = currentLineSegments.some((s) => !s.isBold && s.text.trim().length > 0);

      if (hasBold && !hasNormal) {
        // Ligne 100% Puxador
        blocks.push({ puxador: fullText });
        hasAnyPuxador = true;
      } else if (!hasBold && hasNormal) {
        // Ligne 100% Coro
        blocks.push({ coro: fullText });
      } else if (hasBold && hasNormal) {
        // Ligne mixte : Puxador et Chœur sur la MÊME ligne
        blocks.push({
          isMixed: true,
          segments: [...currentLineSegments],
          puxador: currentLineSegments.filter((s) => s.isBold).map((s) => s.text).join(' ').trim(),
          coro: currentLineSegments.filter((s) => !s.isBold).map((s) => s.text).join(' ').trim()
        });
        hasAnyPuxador = true;
      }

      currentLineSegments = [];
    };

    const traverse = (node, isBold) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text) {
          if (currentLineSegments.length > 0 && currentLineSegments[currentLineSegments.length - 1].isBold === isBold) {
            currentLineSegments[currentLineSegments.length - 1].text += text;
          } else {
            currentLineSegments.push({ text, isBold });
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'br') {
          commitLine();
        } else {
          const tagName = node.tagName.toLowerCase();
          const isNodeBold = isBold || 
                             tagName === 'b' || 
                             tagName === 'strong' ||
                             (node.style && node.style.fontWeight && (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight, 10) >= 600)) ||
                             (node.classList && (node.classList.contains('font-bold') || node.classList.contains('font-black')));

          for (let i = 0; i < node.childNodes.length; i++) {
            traverse(node.childNodes[i], isNodeBold);
          }
        }
      }
    };

    traverse(div, false);
    commitLine();
    
    if (!hasAnyPuxador) {
      return htmlString; // Fallback au texte brut si aucun gras n'a été détecté
    }
    
    while (blocks.length > 0 && (typeof blocks[0] === 'string' && blocks[0].trim() === '')) {
      blocks.shift(); // Nettoyer les espaces vides initiaux
    }
    while (blocks.length > 0 && (typeof blocks[blocks.length - 1] === 'string' && blocks[blocks.length - 1].trim() === '')) {
      blocks.pop(); // Nettoyer les espaces vides de fin
    }
    
    return blocks;
  }

  // 2. Environnement serveur / script Node.js (sans objet document global)
  const lines = htmlString
    .replace(/>\s+</g, '><')
    .replace(/<\/?(p|div)[^>]*>/gi, (m) => m.startsWith('</') ? '\n' : '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .split('\n');

  const blocks = [];
  let hasAnyPuxador = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (blocks.length > 0 && blocks[blocks.length - 1] !== ' ') {
        blocks.push(' ');
      }
      continue;
    }

    const tagRegex = /<(strong|b)[^>]*>([\s\S]*?)<\/\1>|([^<]+)/gi;
    let match;
    const segments = [];

    while ((match = tagRegex.exec(line)) !== null) {
      if (match[2] !== undefined) {
        const text = match[2];
        if (text) segments.push({ text, isBold: true });
      } else if (match[3] !== undefined) {
        const text = match[3];
        if (text) segments.push({ text, isBold: false });
      }
    }

    const fullText = segments.map((s) => s.text).join('').trim();
    if (!fullText) {
      blocks.push(' ');
      continue;
    }

    const hasBold = segments.some((s) => s.isBold && s.text.trim().length > 0);
    const hasNormal = segments.some((s) => !s.isBold && s.text.trim().length > 0);

    if (hasBold && !hasNormal) {
      blocks.push({ puxador: fullText });
      hasAnyPuxador = true;
    } else if (!hasBold && hasNormal) {
      blocks.push({ coro: fullText });
    } else if (hasBold && hasNormal) {
      blocks.push({
        isMixed: true,
        segments: [...segments],
        puxador: segments.filter((s) => s.isBold).map((s) => s.text).join(' ').trim(),
        coro: segments.filter((s) => !s.isBold).map((s) => s.text).join(' ').trim()
      });
      hasAnyPuxador = true;
    }
  }

  if (!hasAnyPuxador) return htmlString;

  while (blocks.length > 0 && (typeof blocks[0] === 'string' && blocks[0].trim() === '')) {
    blocks.shift();
  }
  while (blocks.length > 0 && (typeof blocks[blocks.length - 1] === 'string' && blocks[blocks.length - 1].trim() === '')) {
    blocks.pop();
  }

  return blocks;
};
