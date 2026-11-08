/**
 * Dictionnaire Pédagogique Multi-Applications (FR ⇄ PT-BR) (< 140 lignes).
 * Croise le lexique consolidé des 5 applications de l'écosystème, les notesLexique
 * des Toadas/Fiches Culture du Varal et les namespaces musicaux de fr.js / pt.js.
 */

import { fr } from '../locales/fr.js';
import { pt } from '../locales/pt.js';
import { sanitizeQuizText, isValidTranslationPair, normalizeNoAccent } from './quizTextValidator.js';

export const CATEGORY_LABELS = {
  chant: 'Vocabulaire Cantador / Chant',
  rythme: 'Vocabulaire Sequenciador / Rythme',
  danse: 'Vocabulaire Dançador / Danse',
  roda: 'Vocabulaire Vie de Troupe & Roda',
  culture: 'Vocabulaire Culture & Toadas'
};

/** Lexique métier consolidé des 5 applications de l'écosystème [fr, pt, category, pronunciation, rawTerm]. */
const RAW_ECOSYSTEM_ENTRIES = [
  // 🎙️ Chant & Cantador : Puxador, Coro, Toada, Loa, Anacrouse / Levée, Tessiture / Ambitus, Mesure liée, Ton, Refrain, Appel vocal
  ['Chanteur soliste', 'Puxador', 'chant', 'pu-cha-dôr', 'Puxador'],
  ['Chœur', 'Coro', 'chant', 'kô-ru', 'Coro'],
  ['Chant traditionnel', 'Toada', 'chant', 'tô-a-da', 'Toada'],
  ['Louange chantée', 'Loa', 'chant', 'lô-a', 'Loa'],
  ['Levée vocale', 'Anacruse', 'chant', 'a-na-kru-zi', 'Anacrouse / Levée'],
  ['Ambitus vocal', 'Tessitura vocal', 'chant', 'tê-si-tu-ra vô-kaw', 'Tessiture / Ambitus'],
  ['Mesure liée', 'Compasso ligado', 'chant', 'kõ-pa-su li-ga-du', 'Mesure liée'],
  ['Tonalité', 'Tom musical', 'chant', 'tõ mu-zi-kaw', 'Ton'],
  ['Refrain', 'Refrão', 'chant', 'rê-frãw', 'Refrain'],
  ['Appel vocal', 'Chamada vocal', 'chant', 'cha-ma-da vô-kaw', 'Appel vocal'],
  // 🥁 Rythme & Sequenciador : Baque, Virada, Parada, Breque, Tempo / Andamento, Mesure / Compasso, Temps fort, Bacalhau, Mallet / Mailloche, Peau / Pele, Tirant / Tarraxa, Caisse claire / Caixa
  ['Phrase rythmique', 'Baque', 'rythme', 'ba-ki', 'Baque'],
  ['Variation rythmique', 'Virada', 'rythme', 'vi-ra-da', 'Virada'],
  ['Arrêt franc', 'Parada', 'rythme', 'pa-ra-da', 'Parada'],
  ['Coupure rythmique', 'Breque', 'rythme', 'brè-ki', 'Breque'],
  ['Tempo', 'Andamento', 'rythme', 'ã-da-mẽ-tu', 'Tempo / Andamento'],
  ['Mesure', 'Compasso', 'rythme', 'kõ-pa-su', 'Mesure / Compasso'],
  ['Temps fort', 'Tempo forte', 'rythme', 'tẽ-pu fór-tchi', 'Temps fort'],
  ['Baguette souple', 'Bacalhau', 'rythme', 'ba-ka-lyaw', 'Bacalhau'],
  ['Mailloche', 'Maceta', 'rythme', 'ma-sê-ta', 'Mallet / Mailloche'],
  ['Peau', 'Pele', 'rythme', 'pè-li', 'Peau / Pele'],
  ['Tirant', 'Tarraxa', 'rythme', 'ta-ra-cha', 'Tirant / Tarraxa'],
  ['Caisse claire', 'Caixa', 'rythme', 'kay-cha', 'Caisse claire / Caixa'],
  // 💃 Danse & Dançador : Chorégraphie / Coreografia, Pas de base / Passo base, Cortège / Cortejo, Placement / Formação, Tour / Giro, Orixá, Dama do Paço, Calunga
  ['Chorégraphie', 'Coreografia', 'danse', 'kô-rê-ô-gra-fi-a', 'Chorégraphie / Coreografia'],
  ['Pas de base', 'Passo base', 'danse', 'pa-su ba-zi', 'Pas de base / Passo base'],
  ['Cortège', 'Cortejo', 'danse', 'kôr-tê-ju', 'Cortège / Cortejo'],
  ['Placement', 'Formação', 'danse', 'fôr-ma-sãw', 'Placement / Formação'],
  ['Tour dansé', 'Giro', 'danse', 'ji-ru', 'Tour / Giro'],
  ['Divinité africaine', 'Orixá', 'danse', 'ô-ri-cha', 'Orixá'],
  ['Porteuse de calunga', 'Dama do Paço', 'danse', 'da-ma du pa-su', 'Dama do Paço'],
  ['Poupée sacrée', 'Calunga', 'danse', 'ka-lũ-ga', 'Calunga'],
  // 🤝 Vie de Troupe & Roda : Répétition / Ensaio, Point de rendez-vous / Ponto de encontro, Costume / Figurino, Échauffement / Aquecimento, Roda, Mestre, Apito
  ['Répétition', 'Ensaio', 'roda', 'ẽ-say-u', 'Répétition / Ensaio'],
  ['Point de rendez-vous', 'Ponto de encontro', 'roda', 'põ-tu dji ẽ-kõ-tru', 'Point de rendez-vous'],
  ['Costume', 'Figurino', 'roda', 'fi-gu-ri-nu', 'Costume / Figurino'],
  ['Échauffement', 'Aquecimento', 'roda', 'a-kê-si-mẽ-tu', 'Échauffement / Aquecimento'],
  ['Cercle de jeu', 'Roda', 'roda', 'rô-da', 'Roda'],
  ['Chef de batterie', 'Mestre', 'roda', 'mès-tri', 'Mestre'],
  ['Sifflet de direction', 'Apito', 'roda', 'a-pi-tu', 'Apito']
];

export const ECOSYSTEM_LEXICON = RAW_ECOSYSTEM_ENTRIES.map(([frTxt, ptTxt, category, pronunciation, rawTerm], idx) => ({
  key: `eco_${category}_${idx}`, fr: sanitizeQuizText(frTxt), pt: sanitizeQuizText(ptTxt),
  category, namespace: category, categoryLabel: CATEGORY_LABELS[category], pronunciation, rawTerm
}));

export const MUSICAL_I18N_NAMESPACES = ['repertoire', 'pedagogy', 'sequencer', 'vocal', 'dance', 'instruments', 'agenda'];

/** Génère le découpage syllabique ou la prononciation phonétique d'une expression portugaise. */
export const formatPortugueseSyllables = (ptText, explicitPronunciation = '') => {
  if (explicitPronunciation) return `[${explicitPronunciation}]`;
  const clean = sanitizeQuizText(ptText).toLowerCase();
  if (!clean) return '';
  return `[${clean.split(/\s+/).map((w) => w.replace(/([aeiouáéíóúâêôãõ]+[^aeiouáéíóúâêôãõ\s]?)(?=[bcdfghjklmnpqrstvwxyzç])/gi, '$1-')).join(' · ')}]`;
};

/** Cherche si un mot portugais apparaît dans une Toada du groupe et retourne son titre et le vers. */
export const findToadaVerseMatch = (termPt, songs = []) => {
  if (!termPt || !Array.isArray(songs) || songs.length === 0) return null;
  const words = normalizeNoAccent(termPt).split(/\s+/).filter((w) => w.length >= 3);
  if (words.length === 0) return null;
  for (const song of songs) {
    const title = sanitizeQuizText(song?.titre || song?.title || '');
    const lines = String(song?.paroles || song?.parolesOriginales || '').replace(/<[^>]+>/g, '\n').split('\n').map((l) => sanitizeQuizText(l)).filter((l) => l.length >= 5);
    for (const line of lines) {
      const normLine = normalizeNoAccent(line);
      if (words.some((w) => new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, 'u').test(normLine))) return { songTitle: title || 'Toada du groupe', verse: line };
    }
  }
  return null;
};

/** Construit le corpus bilingue complet (Écosystème + Toadas/Culture Varal + i18n musical). */
export const buildPedagogicalLexiconPool = ({ songs = [], sheets = [], includeI18n = true, maxWords = 4 } = {}) => {
  const pool = [...ECOSYSTEM_LEXICON];
  const seen = new Set(pool.map((p) => `${normalizeNoAccent(p.fr)}||${normalizeNoAccent(p.pt)}`));
  const pushPair = (frVal, ptVal, category, key, extra = {}) => {
    if (!isValidTranslationPair(frVal, ptVal, maxWords)) return;
    const cleanFr = sanitizeQuizText(frVal), cleanPt = sanitizeQuizText(ptVal);
    if (/[:?!/]/.test(cleanFr) || /[:?!/]/.test(cleanPt)) return;
    const sig = `${normalizeNoAccent(cleanFr)}||${normalizeNoAccent(cleanPt)}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    pool.push({
      key, fr: cleanFr, pt: cleanPt, category, namespace: category,
      categoryLabel: CATEGORY_LABELS[category] || CATEGORY_LABELS.culture,
      pronunciation: extra.pronunciation || '', songTitle: extra.songTitle || null, verse: extra.verse || null
    });
  };
  [...(Array.isArray(songs) ? songs : []), ...(Array.isArray(sheets) ? sheets : [])].forEach((doc, dIdx) => {
    const list = Array.isArray(doc?.notesLexique) ? doc.notesLexique : (Array.isArray(doc?.lexique) ? doc.lexique : []);
    list.forEach((it, iIdx) => pushPair(it?.explication || it?.fr, it?.mot || it?.pt, doc?.type === 'song' ? 'chant' : 'culture', `doc_${dIdx}_${iIdx}`, {
      songTitle: doc?.type === 'song' ? sanitizeQuizText(doc?.titre || '') : null
    }));
  });
  if (includeI18n) {
    const mapNs = { vocal: 'chant', sequencer: 'rythme', instruments: 'rythme', dance: 'danse', repertoire: 'rythme', pedagogy: 'culture', agenda: 'roda' };
    const skipKey = /^(btn|tooltip|placeholder|error|confirm|cancel|delete|remove|edit|save|close|back|search|filter|loading|empty|no[A-Z]|is[A-Z]|has[A-Z])/i;
    const walk = (fObj, pObj, ns, pStr) => {
      if (!fObj || !pObj || typeof fObj !== 'object' || typeof pObj !== 'object') return;
      for (const k of Object.keys(fObj)) {
        if (skipKey.test(k)) continue;
        if (ns === 'agenda' && !/scene|cortejo|cortège|roda|echauffement|échauffement|repetition|répétition|costume|figurino|rendez|horaire/i.test(k + String(fObj[k]))) continue;
        if (typeof fObj[k] === 'string' && typeof pObj[k] === 'string') pushPair(fObj[k], pObj[k], mapNs[ns] || 'culture', `${ns}.${pStr}${k}`);
        else if (typeof fObj[k] === 'object' && !Array.isArray(fObj[k])) walk(fObj[k], pObj[k], ns, `${pStr}${k}.`);
      }
    };
    MUSICAL_I18N_NAMESPACES.forEach((ns) => walk(fr[ns], pt[ns], ns, ''));
  }
  return pool;
};
