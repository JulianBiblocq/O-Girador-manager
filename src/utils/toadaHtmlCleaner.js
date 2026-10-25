/**
 * toadaHtmlCleaner.js
 * Nettoyage automatique des balises HTML historiques (<p>, <br>, <strong>)
 * pour afficher un texte propre sans code brut dans les formulaires (< 60 lignes).
 */

export function cleanHistoricalHtml(input = '') {
  if (!input || typeof input !== 'string') return '';
  if (!/<[a-z][\s\S]*>/i.test(input)) return input;

  return input
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '*$1*')
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?p[^>]*>/gi, '\n')
    .replace(/<\/?div[^>]*>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
