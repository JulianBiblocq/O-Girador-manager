import { fr } from '../locales/fr';
import { pt } from '../locales/pt';

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
          const frText = frObj[key].trim();
          const ptText = ptTranslation.trim();
          
          // Filtrer : 
          // 1. Textes identiques (souvent des noms propres, etc.)
          // 2. Textes trop courts (moins de 3 caractères)
          // 3. Variables dans le texte (ex: {day}, {count} => on évite pour les quiz simples)
          if (
            frText.toLowerCase() !== ptText.toLowerCase() &&
            frText.length >= 3 &&
            ptText.length >= 3 &&
            !frText.includes('{') && 
            !ptText.includes('{')
          ) {
            dictionary.push({
              key: categoryPath ? `${categoryPath}.${key}` : key,
              fr: frText,
              pt: ptText,
              category: categoryPath.split('.')[0] || 'common' // On prend la racine comme catégorie
            });
          }
        }
      }
    }
  };

  traverse(fr, pt);
  return dictionary;
};
