/**
 * Utilitaires de conversion typographique Unicode et manipulation de curseur.
 * 
 * Permet d'appliquer des transformations Unicode (Math Bold / Math Italic)
 * et d'insérer des émoticônes à la position du curseur tout en préservant
 * l'intégrité du texte et la compatibilité sur tous les réseaux sociaux.
 */

/**
 * Convertit une chaîne de caractères en glyphes Unicode Mathematical Bold (Gras).
 * Prend en charge les majuscules (A-Z), minuscules (a-z) et chiffres (0-9).
 *
 * @param {string} text Texte à transformer
 * @returns {string} Texte converti en caractères gras Unicode
 */
export function toUnicodeBold(text) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Majuscules A-Z (65 à 90) -> U+1D400 à U+1D419
    if (code >= 65 && code <= 90) {
      result += String.fromCodePoint(0x1D400 + (code - 65));
    }
    // Minuscules a-z (97 à 122) -> U+1D41A à U+1D433
    else if (code >= 97 && code <= 122) {
      result += String.fromCodePoint(0x1D41A + (code - 97));
    }
    // Chiffres 0-9 (48 à 57) -> U+1D7CE à U+1D7D7
    else if (code >= 48 && code <= 57) {
      result += String.fromCodePoint(0x1D7CE + (code - 48));
    }
    // Autres caractères conservés à l'identique (accents, ponctuations, espaces)
    else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Convertit une chaîne de caractères en glyphes Unicode Mathematical Italic (Italique).
 * Prend en charge les majuscules (A-Z) et minuscules (a-z).
 * Note : La lettre minuscule 'h' utilise la constante de Planck (U+210E) conformément au standard Unicode.
 *
 * @param {string} text Texte à transformer
 * @returns {string} Texte converti en caractères italiques Unicode
 */
export function toUnicodeItalic(text) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Majuscules A-Z (65 à 90) -> U+1D434 à U+1D44D
    if (code >= 65 && code <= 90) {
      result += String.fromCodePoint(0x1D434 + (code - 65));
    }
    // Exception Unicode standard pour 'h' (104) -> U+210E (ℎ)
    else if (code === 104) {
      result += '\u210E';
    }
    // Minuscules a-z (97 à 122 hors 'h') -> U+1D44E à U+1D467
    else if (code >= 97 && code <= 122) {
      result += String.fromCodePoint(0x1D44E + (code - 97));
    }
    // Autres caractères conservés à l'identique
    else {
      result += text[i];
    }
  }
  return result;
}

/**
 * Applique une transformation Unicode ('bold' ou 'italic') sur une plage de sélection.
 *
 * @param {string} fullText Texte complet
 * @param {number} selectionStart Début de la sélection
 * @param {number} selectionEnd Fin de la sélection
 * @param {'bold' | 'italic'} formatType Type de formatage
 * @returns {{ newText: string, newStart: number, newEnd: number, applied: boolean }}
 */
export function applyUnicodeTransformation(fullText, selectionStart, selectionEnd, formatType) {
  if (selectionStart === undefined || selectionEnd === undefined || selectionStart === selectionEnd) {
    return {
      newText: fullText,
      newStart: selectionStart,
      newEnd: selectionEnd,
      applied: false
    };
  }

  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);

  const before = fullText.slice(0, start);
  const target = fullText.slice(start, end);
  const after = fullText.slice(end);

  const transformed = formatType === 'bold' ? toUnicodeBold(target) : toUnicodeItalic(target);
  const newText = before + transformed + after;
  const newStart = start;
  const newEnd = start + transformed.length;

  return {
    newText,
    newStart,
    newEnd,
    applied: true
  };
}

/**
 * Insère une émoticône ou une sous-chaîne à la position actuelle du curseur.
 *
 * @param {string} fullText Texte complet actuel
 * @param {number} selectionStart Début de la sélection / position curseur
 * @param {number} selectionEnd Fin de la sélection / position curseur
 * @param {string} textToInsert Texte ou emoji à insérer
 * @returns {{ newText: string, newCursorPos: number }}
 */
export function insertTextAtCursor(fullText, selectionStart, selectionEnd, textToInsert) {
  const currentText = fullText || '';
  const start = typeof selectionStart === 'number' ? selectionStart : currentText.length;
  const end = typeof selectionEnd === 'number' ? selectionEnd : currentText.length;

  const before = currentText.slice(0, start);
  const after = currentText.slice(end);

  const newText = before + textToInsert + after;
  const newCursorPos = start + textToInsert.length;

  return {
    newText,
    newCursorPos
  };
}
