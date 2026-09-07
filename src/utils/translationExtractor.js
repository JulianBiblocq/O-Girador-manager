import { fr } from '../locales/fr.js';
import { pt } from '../locales/pt.js';

// Sections d'interface utilisateur à exclure formellement des QCM de traduction
const EXCLUDED_UI_CATEGORIES = new Set([
  'auth', 'admin', 'profile', 'association', 'settings', 'buttons',
  'notifications', 'megafone', 'calendar', 'rsvp', 'events', 'common',
  'forms', 'modals', 'dashboard', 'footer', 'errors', 'alerts', 'logs',
  'filter', 'nav', 'table', 'search', 'login', 'signup', 'register',
  'widgetmotmestre', 'associationsettings', 'systemadmin', 'export', 'import',
  'user', 'header'
]);

// Mots d'actions UI et libellés techniques génériques à exclure (ne sont pas du vocabulaire culturel)
const GENERIC_UI_WORDS = new Set([
  'enregistrer', 'sauvegarder', 'supprimer', 'annuler', 'modifier', 'éditer', 'editer',
  'fermer', 'connexion', 'déconnexion', 'mot de passe', 'rôle', 'role', 'invalide',
  'actif', 'inactif', 'suivant', 'précédent', 'retour', 'valider', 'salvar', 'excluir',
  'cancelar', 'entrar', 'sair', 'senha', 'cargo', 'papel', 'oui', 'non', 'sim', 'não'
]);

// Mots-clés indiquant une directive ou note de formulaire UI plutôt qu'un mot de vocabulaire
const UI_HINT_PATTERNS = [
  /\bex:/i, /\bex\./i, /\boptionnel/i, /\bopcional/i, /\bpar défaut/i, /\bpadrão/i,
  /\bnon modifiable/i, /\bnão editável/i, /\bformat\b/i, /\bobligatoire/i, /\bobrigatório/i,
  /\btélécharger/i, /\bbaixar/i, /\bcliquer/i, /\bclique/i, /\bhttp/i, /\bwww\./i
];

export const extractTranslationsForQuiz = () => {
  const dictionary = [];

  // Fonction récursive pour parcourir l'objet de traduction
  const traverse = (frObj, ptObj, categoryPath = '') => {
    for (const key in frObj) {
      if (typeof frObj[key] === 'object' && frObj[key] !== null) {
        // C'est une sous-catégorie, on descend d'un niveau
        traverse(frObj[key], ptObj?.[key] || {}, categoryPath ? `${categoryPath}.${key}` : key);
      } else {
        // C'est une traduction finale (string)
        const ptTranslation = ptObj?.[key];
        
        if (ptTranslation && typeof ptTranslation === 'string' && typeof frObj[key] === 'string') {
          let frText = frObj[key].trim();
          let ptText = ptTranslation.trim();

          const rootCategory = (categoryPath.split('.')[0] || '').toLowerCase();
          const keyLower = key.toLowerCase();

          // 1. Exclusion des sections d'interface pure ou des clés d'action UI
          if (
            EXCLUDED_UI_CATEGORIES.has(rootCategory) ||
            categoryPath.toLowerCase().includes('common.') ||
            categoryPath.toLowerCase().includes('.nav.') ||
            keyLower.includes('btn') ||
            keyLower.includes('button') ||
            keyLower.includes('save') ||
            keyLower.includes('delete') ||
            keyLower.includes('remove')
          ) {
            continue;
          }

          // 2. Exclusion des chaînes comportant des variables {count}, des URL ou des consignes techniques
          if (
            frText.includes('{') || ptText.includes('{') ||
            frText.includes('http') || ptText.includes('http') ||
            UI_HINT_PATTERNS.some(pat => pat.test(frText) || pat.test(ptText))
          ) {
            continue;
          }

          // 3. Nettoyage des parenthèses descriptives UI (ex: "Gonguê (Centre)" -> "Gonguê")
          const cleanFr = frText.replace(/\s*\([^)]*\)/g, '').trim();
          const cleanPt = ptText.replace(/\s*\([^)]*\)/g, '').trim();

          // Exclusion des termes techniques UI génériques
          if (
            GENERIC_UI_WORDS.has(cleanFr.toLowerCase()) ||
            GENERIC_UI_WORDS.has(cleanPt.toLowerCase())
          ) {
            continue;
          }

          // Si après nettoyage des parenthèses, les termes sont identiques (noms propres), on ignore
          if (cleanFr.toLowerCase() === cleanPt.toLowerCase()) {
            continue;
          }

          // 4. Exclusion si l'un contient l'autre dans des parenthèses (fuite directe)
          if (
            (frText.includes('(') && frText.toLowerCase().includes(cleanPt.toLowerCase())) ||
            (ptText.includes('(') && ptText.toLowerCase().includes(cleanFr.toLowerCase()))
          ) {
            continue;
          }

          // 5. On utilise la version épurée si elle reste valide et informative
          const finalFr = cleanFr.length >= 2 ? cleanFr : frText;
          const finalPt = cleanPt.length >= 2 ? cleanPt : ptText;

          // 6. Exclusion des phrases trop longues (on cible le vocabulaire et expressions de 1 à 4 mots)
          const frWordCount = finalFr.split(/\s+/).length;
          const ptWordCount = finalPt.split(/\s+/).length;

          if (
            finalFr.toLowerCase() !== finalPt.toLowerCase() &&
            finalFr.length >= 3 &&
            finalPt.length >= 3 &&
            frWordCount <= 4 &&
            ptWordCount <= 4
          ) {
            dictionary.push({
              key: categoryPath ? `${categoryPath}.${key}` : key,
              fr: finalFr,
              pt: finalPt,
              category: rootCategory || 'vocabulary'
            });
          }
        }
      }
    }
  };

  traverse(fr, pt);
  return dictionary;
};
