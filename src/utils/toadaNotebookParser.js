/**
 * toadaNotebookParser.js
 * Utilitaires de conversion bidirectionnelle entre rawTxtCode et les lignes du Cahier Ligné (< 110 lignes).
 */

export function parseNotebookFromTxt(rawTxtCode = '', rawPhonetic = '') {
  if (!rawTxtCode && !rawPhonetic) {
    return [{ id: 1, origText: '', phonText: '', isLinked: false, hasAnaSolo: false, hasAnaCoro: false }];
  }

  const origBlocks = (rawTxtCode || '').split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
  const phonBlocks = (rawPhonetic || '').split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
  const count = Math.max(origBlocks.length, phonBlocks.length, 1);
  const rows = [];

  for (let i = 0; i < count; i++) {
    const rawOrig = origBlocks[i] || '';
    const phonText = (phonBlocks[i] || '').split(/\r?\n/).map((l) => l.trim()).join('\n');

    let isLinked = false;
    let hasAnaSolo = false;
    let hasAnaCoro = false;

    const lines = rawOrig.split(/\r?\n/);
    const cleanedLines = lines.map((line, lIdx) => {
      let l = line.trim();
      if (lIdx === 0 && l.startsWith('/')) {
        isLinked = true;
        l = l.replace(/^\/\s*/, '');
      }

      if (l.startsWith('+')) {
        if (/^\+\s*\*[^*]+\*/.test(l)) {
          hasAnaSolo = true;
        } else {
          hasAnaCoro = true;
        }
        l = l.replace(/^\+\s*/, '');
      }

      if (/\*[^*]+\*\s*\+\s+/.test(l)) {
        hasAnaCoro = true;
        l = l.replace(/(\*[^*]+\*)\s*\+\s+/, '$1 ');
      }

      return l;
    });

    const origText = cleanedLines.join('\n');
    rows.push({
      id: Date.now() + i,
      origText,
      phonText,
      isLinked,
      hasAnaSolo,
      hasAnaCoro
    });
  }

  return rows.length > 0 ? rows : [{ id: 1, origText: '', phonText: '', isLinked: false, hasAnaSolo: false, hasAnaCoro: false }];
}

export function serializeNotebookToTxt(rows = []) {
  const origBlocks = [];
  const phonBlocks = [];

  for (const row of rows) {
    const orig = (row.origText || '').trim();
    const phon = (row.phonText || '').trim();
    if (!orig && !phon) continue;

    const hasBold = /\*[^*]+\*/.test(orig);
    const textWithoutBold = orig.replace(/\*[^*]+\*/g, '').replace(/\[[^\]]+\]/g, '').trim();
    const hasNormal = textWithoutBold.length > 0;

    const linePrefix = row.isLinked ? '/ ' : '';
    const soloAna = row.hasAnaSolo ? '+ ' : '';
    const coroAna = row.hasAnaCoro ? '+ ' : '';

    const lines = orig.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const formattedLines = lines.map((line, idx) => {
      let l = line;
      if (idx === 0) {
        if (hasBold && hasNormal) {
          l = l.replace(/(\*[^*]+\*)([ \t]*)(.*)/, (_, solo, sep, coro) => {
            return `${soloAna}${solo}${coro ? ` ${coroAna}${coro}` : ''}`;
          });
        } else if (hasBold && row.hasAnaSolo) {
          l = `+ ${l}`;
        } else if (hasNormal && row.hasAnaCoro) {
          l = `+ ${l}`;
        }
        return `${linePrefix}${l}`;
      }
      return ` ${l}`;
    });

    origBlocks.push(formattedLines.join('\n'));

    if (phon) {
      const indentedPhon = phon.split(/\r?\n/).map((l, idx) => (idx === 0 ? l.trim() : ` ${l.trim()}`)).join('\n');
      phonBlocks.push(indentedPhon);
    }
  }

  return {
    rawTxtCode: origBlocks.join('\n\n'),
    parolesPhonetiques: phonBlocks.join('\n\n')
  };
}
