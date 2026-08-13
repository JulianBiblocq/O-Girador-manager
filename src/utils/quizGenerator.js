/**
 * Moteur de Génération de Quiz Pédagogique
 * Prend en entrée les données d'une Fiche Pédagogique et génère des QCM.
 */

import { distractorPool } from '../data/distractorPool';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Utilitaire pour appliquer les surcharges manuelles du Mestre
const applyOverrides = (questions, overrides = {}) => {
  if (!overrides || Object.keys(overrides).length === 0) return questions;
  
  return questions.map(q => {
    if (overrides[q.id]) {
      // Fusionne la question générée avec la surcharge
      return { ...q, ...overrides[q.id] };
    }
    return q;
  });
};

// Utilitaire pour le Lexique Transversal
const getTransversalLexique = (allSheetsData = [], allSongs = []) => {
  const translations = new Set();
  
  // Extraire depuis les fiches d'atelier/culture (champ 'lexique' : [{pt, fr}])
  if (Array.isArray(allSheetsData)) {
    allSheetsData.forEach(sheet => {
      if (sheet.lexique && Array.isArray(sheet.lexique)) {
        sheet.lexique.forEach(w => {
          if (w.fr) translations.add(w.fr);
        });
      }
    });
  }

  // Extraire depuis les chants (champ 'notesLexique' : [{mot, explication}])
  if (Array.isArray(allSongs)) {
    allSongs.forEach(song => {
      if (song.notesLexique && Array.isArray(song.notesLexique)) {
        song.notesLexique.forEach(n => {
          if (n.explication) translations.add(n.explication);
        });
      }
    });
  }

  // Ajouter le vocabulaire spécialisé
  if (distractorPool.lexiqueSpecialise) {
    distractorPool.lexiqueSpecialise.forEach(item => {
      if (item.fr) translations.add(item.fr);
    });
  }

  return Array.from(translations);
};

export const generateQuizFromSheet = (sheetData, allSheetsData = [], allSongsData = [], config = {}) => {
  const { difficulty = 'medium', customDistractors = {} } = config;
  const diffLevel = difficulty?.toLowerCase() || 'medium';
  const questions = [];

  if (!sheetData) return questions;

  allSheetsData = Array.isArray(allSheetsData) ? allSheetsData : [];
  allSongsData = Array.isArray(allSongsData) ? allSongsData : [];

  // Utilitaire pour puiser dans les viviers
  const getDistractors = (pools, needed = 3, currentVal = '') => {
    const result = [];
    for (const pool of pools) {
      const shuffled = shuffleArray(pool);
      for (const item of shuffled) {
        if (result.length >= needed) return result;
        if (!result.includes(item) && item.toLowerCase() !== currentVal.toLowerCase()) {
          result.push(item);
        }
      }
    }
    return result;
  };

  // 1. Génération de QCM Culture (Texte à trous via balises <strong> ou <b>)
  let fullTextContext = sheetData.content || '';
  if (Array.isArray(sheetData.chapitres)) {
    fullTextContext += ' ' + sheetData.chapitres.map(c => c.texte || '').join(' ');
  }

  if (fullTextContext) {
    const strongRegex = /<(strong|b)[^>]*>(.*?)<\/\1>/gi;
    let match;
    const allStrongWords = [];
    
    // Premier passage : récolte tous les mots en gras de la fiche courante
    let tempMatch;
    const tempRegex = /<(strong|b)[^>]*>(.*?)<\/\1>/gi;
    while ((tempMatch = tempRegex.exec(fullTextContext)) !== null) {
      const word = tempMatch[2].replace(/<[^>]+>/g, '').trim();
      if (word.length > 2 && !allStrongWords.includes(word)) {
        allStrongWords.push(word);
      }
    }

    // Récolte des mots dans les autres fiches par catégorie
    let otherWordsSameCategory = [];
    let otherWordsDifferentCategory = [];
    const isAtelier = sheetData.categorie?.toLowerCase() === 'atelier';

    if (Array.isArray(allSheetsData)) {
      allSheetsData.forEach(s => {
        if (s.id !== sheetData.id && s.content) {
          const sCategory = s.categorie?.toLowerCase();
          const isSameCat = (isAtelier && sCategory === 'atelier') || (!isAtelier && sCategory !== 'atelier');
          
          let sContext = s.content || '';
          if (Array.isArray(s.chapitres)) {
            sContext += ' ' + s.chapitres.map(c => c.texte || '').join(' ');
          }

          let tMatch;
          const tRegex = /<(strong|b)[^>]*>(.*?)<\/\1>/gi;
          while ((tMatch = tRegex.exec(sContext)) !== null) {
            const w = tMatch[2].replace(/<[^>]+>/g, '').trim();
            if (w.length > 2) {
              if (isSameCat) otherWordsSameCategory.push(w);
              else otherWordsDifferentCategory.push(w);
            }
          }
        }
      });
    }

    // Deuxième passage : on génère les questions
    while ((match = strongRegex.exec(fullTextContext)) !== null) {
      const correctWord = match[2].replace(/<[^>]+>/g, '').trim();
      if (correctWord.length <= 2) continue; // ignore les mots trop courts

      const index = match.index;
      const contextStart = Math.max(0, index - 60);
      const contextEnd = Math.min(fullTextContext.length, index + match[0].length + 60);
      
      let phrase = fullTextContext.substring(contextStart, contextEnd).replace(/<[^>]+>/g, ' '); 
      const phraseTrou = phrase.replace(new RegExp(correctWord, 'gi'), '______').trim();

      let wrongChoices = [];
      const isDate = /^\d{4}$/.test(correctWord);
      const isCapitalized = /^[A-Z][a-zà-ÿ]+/.test(correctWord); // Nom propre apparent

      if (isDate) {
        const correctYear = parseInt(correctWord, 10);
        const generateDates = (minDiff, maxDiff) => {
          const dates = new Set();
          let attempts = 0;
          while(dates.size < 5 && attempts < 50) {
            const sign = Math.random() > 0.5 ? 1 : -1;
            const diff = Math.floor(Math.random() * (maxDiff - minDiff + 1)) + minDiff;
            dates.add((correctYear + (sign * diff)).toString());
            attempts++;
          }
          return Array.from(dates);
        };

        if (diffLevel === 'expert' || diffLevel === 'mestre') {
          wrongChoices = getDistractors([generateDates(1, 3), generateDates(4, 10)], 3, correctWord);
        } else if (diffLevel === 'easy' || diffLevel === 'découverte') {
          wrongChoices = getDistractors([generateDates(30, 100), generateDates(10, 29)], 3, correctWord);
        } else {
          wrongChoices = getDistractors([generateDates(5, 15), generateDates(16, 29)], 3, correctWord);
        }
      } else {
        // Mots textuels (Lieux, Ateliers, Culture)
        const localPlaces = ['Recife', 'Olinda', 'São José', 'Peixinhos', 'Igarassu', 'Nazareth', 'Pernambouc'];
        const distantPlaces = (customDistractors.geographieEtVilles?.length > 0) ? customDistractors.geographieEtVilles : distractorPool.villesEtGeographie;
        const fallbackFails = (customDistractors.lutherieEtMateriaux?.length > 0) ? customDistractors.lutherieEtMateriaux : distractorPool.materiauxEtLutherie;

        if (diffLevel === 'expert' || diffLevel === 'mestre') {
          if (isAtelier) {
            // Mots de la MÊME fiche (même instrument) en priorité
            wrongChoices = getDistractors([allStrongWords, otherWordsSameCategory, fallbackFails], 3, correctWord);
          } else if (isCapitalized) {
            // Lieux limitrophes ou noms propres de la même fiche
            wrongChoices = getDistractors([localPlaces, allStrongWords, otherWordsSameCategory, distantPlaces, fallbackFails], 3, correctWord);
          } else {
            wrongChoices = getDistractors([allStrongWords, otherWordsSameCategory, fallbackFails], 3, correctWord);
          }
        } else if (diffLevel === 'easy' || diffLevel === 'découverte') {
          if (isCapitalized && !isAtelier) {
            wrongChoices = getDistractors([distantPlaces, otherWordsDifferentCategory, fallbackFails], 3, correctWord);
          } else {
            // Mots d'autres catégories
            wrongChoices = getDistractors([otherWordsDifferentCategory, otherWordsSameCategory, fallbackFails], 3, correctWord);
          }
        } else {
          // Confirmé
          wrongChoices = getDistractors([otherWordsSameCategory, allStrongWords, otherWordsDifferentCategory, fallbackFails], 3, correctWord);
        }
      }
      
      const choices = shuffleArray([
        { text: correctWord, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `culture_${index}`,
        type: 'culture',
        questionText: `Dans ce contexte : "...${phraseTrou}..."`,
        instruction: "Quel mot manque dans cette phrase ?",
        choices: choices,
        feedback: `Le bon mot était "${correctWord}". Ce terme est important dans l'apprentissage.`
      });
    }
  }

  // 2. Génération de QCM Lexique / Traduction (Transversal)
  if (sheetData.lexique && Array.isArray(sheetData.lexique) && sheetData.lexique.length > 0) {
    
    // On récolte toutes les traductions/explications possibles dans toute la base
    const allTranslations = getTransversalLexique(allSheetsData, allSongsData);

    sheetData.lexique.forEach((wordObj, i) => {
      if (!wordObj.pt || !wordObj.fr) return;
      
      let wrongChoices = allTranslations.filter(t => t.toLowerCase() !== wordObj.fr.toLowerCase());
      if (wrongChoices.length < 3) {
        // Fallback en dernier recours
        const fallbackFails = ['Tambour', 'Baguette', 'Danse', 'Couronne', 'Costume traditionnel', 'Instrument de percussion'];
        while (wrongChoices.length < 3) {
          const randomF = fallbackFails[Math.floor(Math.random() * fallbackFails.length)];
          if (!wrongChoices.includes(randomF) && randomF.toLowerCase() !== wordObj.fr.toLowerCase()) {
            wrongChoices.push(randomF);
          }
        }
      }

      wrongChoices = shuffleArray(wrongChoices).slice(0, 3);
      
      const choices = shuffleArray([
        { text: wordObj.fr, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      const isCulture = sheetData.type === 'culture_fiche';
      
      questions.push({
        id: `lexique_${i}`,
        type: 'lexique',
        questionText: wordObj.pt,
        instruction: isCulture ? "Que signifie ce terme / Qu'est-ce que c'est ?" : "Que signifie ce mot en portugais ?",
        choices: choices,
        feedback: isCulture ? `"${wordObj.pt}" correspond bien à : "${wordObj.fr}".` : `"${wordObj.pt}" signifie bien "${wordObj.fr}". Bravo !`
      });
    });
  }

  // 3. Questions spécifiques Fiche Culture (Orixás & Danse)
  if (sheetData.type === 'culture_fiche') {
    const isOrixa = sheetData.themeCulture === 'orixas';
    const isCortejo = (sheetData.themeCulture || '').toLowerCase().includes('cortejo') || (sheetData.themeCulture || '').toLowerCase().includes('cortège');
    const hasDanse = sheetData.danseData && (sheetData.danseData.nomDuGeste || sheetData.danseData.descriptionGeste);
    const hasElement = isOrixa && sheetData.elementNaturel;
    
    // Noms d'autres Orixás pour distracteurs
    const orixasNames = ['Oxum', 'Iansã', 'Xangô', 'Ogum', 'Oxóssi', 'Iemanjá', 'Nanã', 'Obaluaiê', 'Exu', 'Oxalá'];
    const stampsList = ['orixa', 'cuisine', 'histoire', 'musique', 'cortejo', 'territoire', 'folklore'];
    const colorsList = [['#EAB308'], ['#EF4444', '#FFFFFF'], ['#3B82F6'], ['#22C55E'], ['#A855F7'], ['#F97316']];

    // 3.1. Devinette Visuelle (Quel est cet Orixá ?)
    if (isOrixa && sheetData.personnageOrisha && sheetData.stampKey && sheetData.couleursTheme) {
      let wrongChoices = getDistractors([orixasNames], 3, sheetData.personnageOrisha);
      const choices = shuffleArray([
        { text: sheetData.personnageOrisha, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `visuel_orixa_${sheetData.id}`,
        type: 'devinette_visuelle',
        instruction: "Devinette visuelle",
        questionText: "De quel Orixá s'agit-il ?",
        visualElement: { type: 'orixaBadge', stampKey: sheetData.stampKey, couleurs: sheetData.couleursTheme },
        choices: choices,
        feedback: `C'est bien ${sheetData.personnageOrisha}. Ses couleurs sont caractéristiques.`
      });
    }

    // 3.1 Qui est [Orixa] ? (Sous-titre / Titre long)
    if (isOrixa && sheetData.personnageOrisha) {
      const allOtherOrixas = allSheetsData.filter(s => s.themeCulture === 'orixas' && s.id !== sheetData.id);
      let otherTitles = allOtherOrixas.map(s => {
        if (s.titre && s.personnageOrisha && s.titre.includes(s.personnageOrisha)) {
          return s.titre.replace(new RegExp(`${s.personnageOrisha}[,\\s-]*`, 'gi'), '').trim();
        }
        return s.titre || s.sousTitre;
      }).filter(Boolean);

      if (otherTitles.length < 3) {
        otherTitles = ['Le seigneur du feu et du tonnerre', 'Le guerrier de la paix', 'La reine de la mer', 'L\'enfant divin'];
      }

      let correctTitle = sheetData.titre;
      if (correctTitle.includes(sheetData.personnageOrisha)) {
        correctTitle = correctTitle.replace(new RegExp(`${sheetData.personnageOrisha}[,\\s-]*`, 'gi'), '').trim();
      }

      if (correctTitle) {
        const wrongChoices = shuffleArray(otherTitles).slice(0, 3);
        const choices = shuffleArray([
          { text: correctTitle, isCorrect: true },
          ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
        ]);

        questions.push({
          id: `qui_est_${sheetData.id}`,
          type: 'culture',
          instruction: "Identité",
          questionText: `Qui est ${sheetData.personnageOrisha} ?`,
          choices: choices,
          feedback: `${sheetData.personnageOrisha} est : ${correctTitle}.`
        });
      }
    }

    // 3.2 Outil / Symbole sacré
    if (isOrixa && sheetData.symbolesSacres) {
      let wrongChoices = ['Miroir et éventail', 'Arc et flèche', 'Épée de fer', 'Hache double (Oxê)', 'Balai de paille (Íroko)', 'Lance de combat', 'Poignard et bouclier'];
      wrongChoices = wrongChoices.filter(w => !w.toLowerCase().includes(sheetData.symbolesSacres.toLowerCase()));
      wrongChoices = shuffleArray(wrongChoices).slice(0, 3);

      const choices = shuffleArray([
        { text: sheetData.symbolesSacres, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `outil_${sheetData.id}`,
        type: 'culture',
        instruction: "Outil sacré",
        questionText: `Quel est le symbole sacré (outil) associé à ${sheetData.personnageOrisha || 'cette divinité'} ?`,
        choices: choices,
        feedback: `L'outil correct est : ${sheetData.symbolesSacres}.`
      });
    }

    // 3.3. Questions visuelles (Couleurs et Tampon séparés)
    if (isOrixa && (sheetData.stampKey || sheetData.iconeStamp)) {
      const correctStamp = sheetData.stampKey || sheetData.iconeStamp;
      const correctColors = sheetData.couleursTheme || [sheetData.hexPrimary || '#FFFFFF'];
      
      const allOtherOrixas = allSheetsData.filter(s => s.themeCulture === 'orixas' && s.id !== sheetData.id);

      // Q1: Couleurs
      let wrongColorsChoices = [];
      const allOtherColors = allOtherOrixas.map(s => s.couleursTheme || (s.hexPrimary ? [s.hexPrimary] : null)).filter(Boolean);
      const poolColors = allOtherColors.length >= 3 ? allOtherColors : [...allOtherColors, ...colorsList];
      
      let usedColorsStrs = new Set();
      usedColorsStrs.add(JSON.stringify(correctColors));
      for(let i=0; i<50; i++) {
        const rc = poolColors[Math.floor(Math.random() * poolColors.length)];
        const rcStr = JSON.stringify(rc);
        if (!usedColorsStrs.has(rcStr)) {
          wrongColorsChoices.push({ type: 'orixaBadge', stampKey: correctStamp, couleurs: rc });
          usedColorsStrs.add(rcStr);
        }
        if (wrongColorsChoices.length === 3) break;
      }
      while (wrongColorsChoices.length < 3) {
         wrongColorsChoices.push({ type: 'orixaBadge', stampKey: correctStamp, couleurs: [['#111111'], ['#999999'], ['#333333']][wrongColorsChoices.length] });
      }

      const visualChoicesColors = shuffleArray([
        { text: "Ces couleurs", isCorrect: true, visualElement: { type: 'orixaBadge', stampKey: correctStamp, couleurs: correctColors } },
        ...wrongColorsChoices.map((wc) => ({ text: "Ces couleurs", isCorrect: false, visualElement: wc }))
      ]);

      questions.push({
        id: `couleurs_blason_${sheetData.id}`,
        type: 'blason_orixa',
        instruction: "Couleurs du Blason",
        questionText: `Identifiez les couleurs sacrées de : ${sheetData.personnageOrisha || sheetData.titre}`,
        choices: visualChoicesColors,
        feedback: `Vous deviez choisir les couleurs sacrées de ${sheetData.personnageOrisha || 'cette divinité'}.`
      });

      // Q2: Tampon (Symbole de Axé)
      let wrongStampChoices = [];
      const allOtherStamps = allOtherOrixas.map(s => s.stampKey || s.iconeStamp).filter(Boolean);
      const poolStamps = allOtherStamps.length >= 3 ? allOtherStamps : [...allOtherStamps, 'orixa', 'cuisine', 'cortejo', 'histoire', 'musique'];
      
      let usedStamps = new Set();
      usedStamps.add(correctStamp);
      for(let i=0; i<50; i++) {
        const rs = poolStamps[Math.floor(Math.random() * poolStamps.length)];
        if (!usedStamps.has(rs)) {
          wrongStampChoices.push({ type: 'orixaBadge', stampKey: rs, couleurs: correctColors });
          usedStamps.add(rs);
        }
        if (wrongStampChoices.length === 3) break;
      }
      while (wrongStampChoices.length < 3) {
         wrongStampChoices.push({ type: 'orixaBadge', stampKey: 'axe-default', couleurs: correctColors });
      }

      const visualChoicesStamp = shuffleArray([
        { text: "Ce symbole", isCorrect: true, visualElement: { type: 'orixaBadge', stampKey: correctStamp, couleurs: correctColors } },
        ...wrongStampChoices.map((ws) => ({ text: "Ce symbole", isCorrect: false, visualElement: ws }))
      ]);

      questions.push({
        id: `tampon_blason_${sheetData.id}`,
        type: 'blason_orixa',
        instruction: "Symbole (Selo de Axé)",
        questionText: `Identifiez le symbole de axé (tampon) de : ${sheetData.personnageOrisha || sheetData.titre}`,
        choices: visualChoicesStamp,
        feedback: `Le bon symbole est le Selo de Axé de ${sheetData.personnageOrisha || 'cette divinité'}.`
      });
    }

    // 3.3. Question Gestuelle
    if (hasDanse) {
      const correctText = sheetData.danseData.nomDuGeste || sheetData.danseData.descriptionGeste.substring(0, 50) + "...";
      let wrongChoices = getDistractors([
        ['Giro (Tour)', 'Passo de Índio', 'Balanço', 'Avancée', 'Saut', 'Marche croisée', 'Ondes des bras']
      ], 3, correctText);
      
      const choices = shuffleArray([
        { text: correctText, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `geste_${sheetData.id}`,
        type: 'danse_geste',
        instruction: "Danse & Gestuelle",
        questionText: `Quel geste ou mouvement caractérise cette figure culturelle ?`,
        choices: choices,
        feedback: `Le geste correct est lié à l'énergie de la danse.`
      });
    }

    // 3.4. Du Geste à l'Élément
    if (hasElement) {
      let wrongChoices = getDistractors([
        ['Feu', 'Terre', 'Eaux douces', 'Océan', 'Air et Tempêtes', 'Forêt', 'Fer / Forge', 'Boue']
      ], 3, sheetData.elementNaturel);
      
      const choices = shuffleArray([
        { text: sheetData.elementNaturel, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `element_${sheetData.id}`,
        type: 'element_naturel',
        instruction: "Élément Naturel",
        questionText: `Quel est l'élément naturel associé à ${sheetData.personnageOrisha} ?`,
        choices: choices,
        feedback: `L'élément naturel correct est ${sheetData.elementNaturel}.`
      });
    }

    // 3.5 Questions Cortège : Géographie (Ville & Région)
    if (isCortejo && sheetData.villeRegion) {
      const allOtherPlaces = allSheetsData.map(s => s.villeRegion).filter(Boolean).filter(v => v !== sheetData.villeRegion);
      let wrongChoices = getDistractors([allOtherPlaces, ['Recife', 'Olinda', 'Nazaré da Mata', 'Salvador', 'Rio de Janeiro', 'Fortaleza']], 3, sheetData.villeRegion);
      
      const choices = shuffleArray([
        { text: sheetData.villeRegion, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `geo_cortejo_${sheetData.id}`,
        type: 'culture_geographie',
        instruction: "Territoire & Région",
        questionText: `Dans quelle région ou ville trouve-t-on traditionnellement cette figure du Cortège (${sheetData.titre}) ?`,
        choices: choices,
        feedback: `Cette figure est caractéristique de ${sheetData.villeRegion}.`
      });
    }

    // 3.6 Questions Cortège : Rôle / Titre (Identité)
    if (isCortejo && (sheetData.sousTitre || sheetData.titre)) {
      const allOtherRoles = allSheetsData
        .filter(s => ((s.themeCulture || '').toLowerCase().includes('cortejo') || (s.themeCulture || '').toLowerCase().includes('cortège')) && s.id !== sheetData.id)
        .map(s => s.sousTitre || s.titre)
        .filter(Boolean);
        
      const correctRole = sheetData.sousTitre || sheetData.titre;
      let wrongChoices = getDistractors([allOtherRoles, ['Le Roi', 'La Reine', 'Le Porte-Étendard', 'Batuqueiro', 'Caboclo de Lança', 'La Dame de Palais', 'Dama do Paço', 'Baiana']], 3, correctRole);

      const choices = shuffleArray([
        { text: correctRole, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `role_cortejo_${sheetData.id}`,
        type: 'culture_role',
        instruction: "Rôle dans le Cortège",
        questionText: `Quel est le rôle exact ou le titre de ce personnage dans le cortège ?`,
        choices: choices,
        feedback: `Son rôle est : ${correctRole}.`
      });
    }

    // 3.7 Cuisine : Templates
    const isCuisine = (sheetData.categorieFiche || '').toLowerCase() === 'cuisine' || (sheetData.themeCulture || '').toLowerCase() === 'cuisine';

    // 3.7.1 Cuisine : Origine / Région
    if (isCuisine && sheetData.villeRegion) {
      const allOtherPlaces = allSheetsData.map(s => s.villeRegion).filter(Boolean).filter(v => v !== sheetData.villeRegion);
      let wrongChoices = getDistractors([allOtherPlaces, ['Bahia', 'Pernambouc', 'Minas Gerais', 'Rio de Janeiro', 'Amazonie', 'São Paulo']], 3, sheetData.villeRegion);
      
      const choices = shuffleArray([
        { text: sheetData.villeRegion, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `cuisine_geo_${sheetData.id}`,
        type: 'cuisine_geographie',
        instruction: "Origine & Région",
        questionText: `De quelle région/ville est originaire la spécialité '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `La spécialité '${sheetData.titre}' est originaire de ${sheetData.villeRegion}.`
      });
    }

    // 3.7.2 Cuisine : Spiritualité / Offrande
    if (isCuisine && sheetData.personnageOrisha) {
      const allOtherOrishas = allSheetsData.map(s => s.personnageOrisha).filter(Boolean).filter(v => v !== sheetData.personnageOrisha);
      let wrongChoices = getDistractors([allOtherOrishas, ['Oxum', 'Iansã', 'Xangô', 'Ogum', 'Iemanjá', 'Oxalá', 'Exu']], 3, sheetData.personnageOrisha);
      
      const choices = shuffleArray([
        { text: sheetData.personnageOrisha, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `cuisine_orixa_${sheetData.id}`,
        type: 'cuisine_orixa',
        instruction: "Spiritualité & Offrande",
        questionText: `À quel Orixá (ou concept) est traditionnellement associé le plat '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `Ce plat est traditionnellement associé à ${sheetData.personnageOrisha}.`
      });
    }

    // 3.7.3 Cuisine : Époque
    if (isCuisine && sheetData.epoque) {
      const allOtherEpoques = allSheetsData.map(s => s.epoque).filter(Boolean).filter(v => v !== sheetData.epoque);
      let wrongChoices = getDistractors([allOtherEpoques, ['Époque coloniale', 'XIXe siècle', 'Période pré-colombienne', 'XXe siècle', 'Antiquité']], 3, sheetData.epoque);
      
      const choices = shuffleArray([
        { text: sheetData.epoque, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `cuisine_epoque_${sheetData.id}`,
        type: 'cuisine_epoque',
        instruction: "Histoire & Époque",
        questionText: `À quelle époque remonte l'origine de '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `L'origine remonte à : ${sheetData.epoque}.`
      });
    }

    // 3.7.4 Cuisine : Ingrédients / Vocabulaire
    if (isCuisine && sheetData.lexiqueMotsCles) {
      const motsCles = Array.isArray(sheetData.lexiqueMotsCles) 
        ? sheetData.lexiqueMotsCles 
        : (typeof sheetData.lexiqueMotsCles === 'string' ? sheetData.lexiqueMotsCles.split(',').map(m => m.trim()).filter(Boolean) : []);
        
      if (motsCles.length > 0) {
        const correctMot = motsCles[Math.floor(Math.random() * motsCles.length)];
        
        let allOtherMots = [];
        allSheetsData.filter(s => s.id !== sheetData.id && ((s.categorieFiche || '').toLowerCase() === 'cuisine' || (s.themeCulture || '').toLowerCase() === 'cuisine')).forEach(s => {
          if (s.lexiqueMotsCles) {
             const m = Array.isArray(s.lexiqueMotsCles) ? s.lexiqueMotsCles : (typeof s.lexiqueMotsCles === 'string' ? s.lexiqueMotsCles.split(',').map(x => x.trim()).filter(Boolean) : []);
             allOtherMots.push(...m);
          }
        });
        
        let wrongChoices = getDistractors([allOtherMots, ['Haricots noirs', 'Farine de manioc', 'Huile de palme (Dendê)', 'Lait de coco', 'Maïs', 'Piment']], 3, correctMot);
        
        const choices = shuffleArray([
          { text: correctMot, isCorrect: true },
          ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
        ]);

        questions.push({
          id: `cuisine_ingred_${sheetData.id}`,
          type: 'cuisine_ingredient',
          instruction: "Ingrédients & Préparation",
          questionText: `Lequel de ces mots/ingrédients est directement lié à la préparation de '${sheetData.titre}' ?`,
          choices: choices,
          feedback: `Le mot lié à cette préparation est bien : ${correctMot}.`
        });
      }
    }

    // 3.8 Styles de Musique : Templates
    const isStyleMusique = (sheetData.categorieFiche || '').toLowerCase() === 'styles de musique' || (sheetData.themeCulture || '').toLowerCase() === 'styles de musique';

    // 3.8.1 Styles de Musique : Origine / Région
    if (isStyleMusique && sheetData.villeRegion) {
      const allOtherPlaces = allSheetsData.map(s => s.villeRegion).filter(Boolean).filter(v => v !== sheetData.villeRegion);
      let wrongChoices = getDistractors([allOtherPlaces, ['Bahia', 'Pernambouc', 'Minas Gerais', 'Rio de Janeiro', 'Amazonie', 'São Paulo']], 3, sheetData.villeRegion);
      
      const choices = shuffleArray([
        { text: sheetData.villeRegion, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `style_geo_${sheetData.id}`,
        type: 'style_geographie',
        instruction: "Origine Géographique",
        questionText: `Dans quelle région/ville le style '${sheetData.titre}' a-t-il vu le jour ?`,
        choices: choices,
        feedback: `Le style '${sheetData.titre}' est originaire de ${sheetData.villeRegion}.`
      });
    }

    // 3.8.2 Styles de Musique : Figure emblématique
    if (isStyleMusique && sheetData.personnageOrisha) {
      const allOtherFigures = allSheetsData.map(s => s.personnageOrisha).filter(Boolean).filter(v => v !== sheetData.personnageOrisha);
      let wrongChoices = getDistractors([allOtherFigures, ['Chico Science', 'Lia de Itamaracá', 'Mestre Salustiano', 'Luiz Gonzaga', 'Naná Vasconcelos', 'Pixinguinha']], 3, sheetData.personnageOrisha);
      
      const choices = shuffleArray([
        { text: sheetData.personnageOrisha, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `style_figure_${sheetData.id}`,
        type: 'style_figure',
        instruction: "Figure Emblématique",
        questionText: `À quelle grande figure ou mouvement associe-t-on souvent le '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `Le style est souvent associé à ${sheetData.personnageOrisha}.`
      });
    }

    // 3.8.3 Styles de Musique : Période d'apparition
    if (isStyleMusique && sheetData.epoque) {
      const allOtherEpoques = allSheetsData.map(s => s.epoque).filter(Boolean).filter(v => v !== sheetData.epoque);
      let wrongChoices = getDistractors([allOtherEpoques, ['Années 1990', 'Début du XXe siècle', 'Époque coloniale', 'Années 1950', 'XIXe siècle']], 3, sheetData.epoque);
      
      const choices = shuffleArray([
        { text: sheetData.epoque, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `style_epoque_${sheetData.id}`,
        type: 'style_epoque',
        instruction: "Période d'apparition",
        questionText: `À quelle époque le style '${sheetData.titre}' s'est-il développé ?`,
        choices: choices,
        feedback: `Le style s'est développé à l'époque suivante : ${sheetData.epoque}.`
      });
    }

    // 3.9 Territoire : Templates
    const isTerritoire = (sheetData.categorieFiche || '').toLowerCase() === 'territoire' || (sheetData.themeCulture || '').toLowerCase() === 'territoire';

    // 3.9.1 Territoire : Géographie/Climat (villeRegion)
    if (isTerritoire && sheetData.villeRegion) {
      const allOtherPlaces = allSheetsData.map(s => s.villeRegion).filter(Boolean).filter(v => v !== sheetData.villeRegion);
      let wrongChoices = getDistractors([allOtherPlaces, ['Nordeste', 'Sudeste', 'Amazonie', 'Centre-Ouest', 'Sud', 'Pernambouc']], 3, sheetData.villeRegion);
      
      const choices = shuffleArray([
        { text: sheetData.villeRegion, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `territoire_geo_${sheetData.id}`,
        type: 'territoire_geographie',
        instruction: "Géographie / Région",
        questionText: `Dans quelle région du Brésil se situe principalement le territoire décrit dans '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `Ce territoire se situe principalement dans la région / l'état de : ${sheetData.villeRegion}.`
      });
    }

    // 3.9.2 Territoire : Histoire/Économie (epoque)
    if (isTerritoire && sheetData.epoque) {
      const allOtherEpoques = allSheetsData.map(s => s.epoque).filter(Boolean).filter(v => v !== sheetData.epoque);
      let wrongChoices = getDistractors([allOtherEpoques, ["Cycle de l'or", 'Cycle du sucre', 'Cycle du café', 'Époque contemporaine', 'Période pré-coloniale']], 3, sheetData.epoque);
      
      const choices = shuffleArray([
        { text: sheetData.epoque, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `territoire_epoque_${sheetData.id}`,
        type: 'territoire_epoque',
        instruction: "Histoire / Économie",
        questionText: `À quelle époque ou cycle économique relie-t-on le développement de la région de '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `On relie ce territoire à : ${sheetData.epoque}.`
      });
    }

    // 3.9.3 Territoire : Population/Concept (personnageOrisha)
    if (isTerritoire && sheetData.personnageOrisha) {
      const allOtherConcepts = allSheetsData.map(s => s.personnageOrisha).filter(Boolean).filter(v => v !== sheetData.personnageOrisha);
      let wrongChoices = getDistractors([allOtherConcepts, ['Sertanejo', 'Cangaceiro', 'Ribeirinho', 'Quilombola', 'Indigène']], 3, sheetData.personnageOrisha);
      
      const choices = shuffleArray([
        { text: sheetData.personnageOrisha, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `territoire_population_${sheetData.id}`,
        type: 'territoire_population',
        instruction: "Population / Concept",
        questionText: `Quelle figure ou concept culturel est emblématique de '${sheetData.titre}' ?`,
        choices: choices,
        feedback: `La figure emblématique est : ${sheetData.personnageOrisha}.`
      });
    }

    // 3.9.4 Territoire : Lexique (lexiqueMotsCles)
    if (isTerritoire && sheetData.lexiqueMotsCles) {
      const motsCles = Array.isArray(sheetData.lexiqueMotsCles) 
        ? sheetData.lexiqueMotsCles 
        : (typeof sheetData.lexiqueMotsCles === 'string' ? sheetData.lexiqueMotsCles.split(',').map(m => m.trim()).filter(Boolean) : []);
        
      if (motsCles.length > 0) {
        const correctMot = motsCles[Math.floor(Math.random() * motsCles.length)];
        
        let allOtherMots = [];
        allSheetsData.filter(s => s.id !== sheetData.id && ((s.categorieFiche || '').toLowerCase() === 'territoire' || (s.themeCulture || '').toLowerCase() === 'territoire')).forEach(s => {
          if (s.lexiqueMotsCles) {
             const m = Array.isArray(s.lexiqueMotsCles) ? s.lexiqueMotsCles : (typeof s.lexiqueMotsCles === 'string' ? s.lexiqueMotsCles.split(',').map(x => x.trim()).filter(Boolean) : []);
             allOtherMots.push(...m);
          }
        });
        
        let wrongChoices = getDistractors([allOtherMots, ['Caatinga', 'Sertão', 'Mangrove', 'Agreste', 'Cerrado', 'Forêt Atlantique']], 3, correctMot);
        
        const choices = shuffleArray([
          { text: correctMot, isCorrect: true },
          ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
        ]);

        questions.push({
          id: `territoire_lexique_${sheetData.id}`,
          type: 'territoire_lexique',
          instruction: "Lexique / Biome",
          questionText: `Lequel de ces mots/biomes est directement lié à '${sheetData.titre}' ?`,
          choices: choices,
          feedback: `Le terme exact est bien : ${correctMot}.`
        });
      }
    }
  }


  // 4. Questions bonus : Lexique spécialisé (Confirmé / Mestre)
  if (sheetData.type !== 'culture_fiche' && diffLevel !== 'easy' && diffLevel !== 'découverte' && distractorPool.lexiqueSpecialise) {
    // Prendre 1 terme au hasard
    const specialItems = shuffleArray([...distractorPool.lexiqueSpecialise]).slice(0, 1);
    const allTranslations = getTransversalLexique(allSheetsData, allSongsData);
    
    specialItems.forEach((item, i) => {
      let wrongChoices = allTranslations.filter(t => t.toLowerCase() !== item.fr.toLowerCase());
      if (wrongChoices.length < 3) wrongChoices = ['Tambour', 'Baguette', 'Danse', 'Couronne'];
      wrongChoices = shuffleArray(wrongChoices).slice(0, 3);
      
      const choices = shuffleArray([
        { text: item.fr, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `lexique_special_${item.pt.replace(/\s+/g, '_')}_${i}`,
        type: 'lexique_specialise',
        questionText: item.pt,
        instruction: "Que signifie ce terme (Culture / Maracatu) ?",
        choices: choices,
        feedback: `"${item.pt}" signifie bien "${item.fr}".`
      });
    });
  }

  let customAddedQuestions = [];

  // 5. Intégration des QCM personnalisés de la fiche (questionsQcm)
  if (sheetData.questionsQcm && Array.isArray(sheetData.questionsQcm)) {
    sheetData.questionsQcm.forEach((q, i) => {
      if (q.question && q.options && q.options.length > 1) {
        const choices = q.options.map((opt, idx) => ({
          text: opt,
          isCorrect: idx === parseInt(q.correctIndex, 10)
        }));
        
        customAddedQuestions.push({
          id: `custom_qcm_${sheetData.id}_${i}`,
          type: 'custom_culture',
          instruction: "Question spécifique",
          questionText: q.question,
          choices: shuffleArray(choices),
          feedback: q.extraitTexte ? `Extrait : ${q.extraitTexte}` : (choices.find(c => c.isCorrect)?.text || '')
        });
      }
    });
  }

  // On retourne les questions mélangées (priorité aux questions personnalisées), avec surcharges appliquées
  let finalQuestions = [...customAddedQuestions, ...shuffleArray(questions)];
  if (sheetData.type !== 'culture_fiche') {
    finalQuestions = finalQuestions.slice(0, 10);
  }
  return applyOverrides(finalQuestions, sheetData.quizOverrides);
};

export const generateQuizFromSong = (song, allSongs = [], allSheetsData = [], config = {}) => {
  const questions = [];
  if (!song) return questions;

  allSongs = Array.isArray(allSongs) ? allSongs : [];
  allSheetsData = Array.isArray(allSheetsData) ? allSheetsData : [];

  const { askRythme = true, askNacao = true, askTraduction = true, askLexique = true, difficulty = 'medium', customDistractors = {} } = config;
  const diffLevel = difficulty?.toLowerCase() || 'medium';

  // Helpers pour récupérer des distracteurs depuis allSongs
  const getDistractors = (field, currentVal, songContext) => {
    let allVals = allSongs.map(s => s[field]).filter(Boolean);
    
    let pool = [];

    if (diffLevel === 'expert' || diffLevel === 'mestre') {
      // Mestre : mêmes caractéristiques (ex: même nação pour trouver un rythme)
      if (field === 'rythme') {
        pool = allSongs.filter(s => s.nacao === songContext.nacao && s.rythme !== currentVal).map(s => s.rythme).filter(Boolean);
      } else if (field === 'nacao') {
        pool = allSongs.filter(s => s.rythme === songContext.rythme && s.nacao !== currentVal).map(s => s.nacao).filter(Boolean);
      }
      if (pool.length === 0) pool = allVals; // fallback
    } else if (diffLevel === 'easy' || diffLevel === 'découverte') {
      // Découverte : genres éloignés
      pool = (customDistractors.genresMusicaux?.length > 0) ? customDistractors.genresMusicaux : distractorPool.genresMusicauxHorsMaracatu;
    } else {
      // Confirmé : autres éléments du répertoire global
      pool = allVals;
    }

    // Nettoyage et unicité
    pool = [...new Set(pool)].filter(v => v.toLowerCase() !== currentVal?.toLowerCase());
    pool = shuffleArray(pool);
    
    const distractors = [];
    while (distractors.length < 3 && pool.length > 0) {
      distractors.push(pool.pop());
    }

    // Fallback 1: Piocher dans tout le répertoire
    if (distractors.length < 3) {
      const fallbackPool = shuffleArray([...new Set(allVals)]);
      while (distractors.length < 3 && fallbackPool.length > 0) {
        const f = fallbackPool.pop();
        if (!distractors.includes(f) && f.toLowerCase() !== currentVal?.toLowerCase()) {
          distractors.push(f);
        }
      }
    }
    
    // Fallback minimal absolu
    const defaultBaques = distractorPool.baquesFictifsEtSimilaires;
    const defaultOthers = ['Maracatu Nação', 'Caboclinho', 'Ciranda', 'Coco', 'Afoxé'];
    const customBaques = customDistractors.baquesPlausibles;
    const fallbacks = (field === 'rythme') 
      ? (customBaques?.length > 0 ? customBaques : defaultBaques) 
      : defaultOthers;
    while (distractors.length < 3) {
      const f = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      if (!distractors.includes(f) && f.toLowerCase() !== currentVal?.toLowerCase()) {
        distractors.push(f);
      }
    }
    return distractors.slice(0, 3);
  };

  // 1. Question sur le Rythme
  if (askRythme && song.rythme) {
    const wrongChoices = getDistractors('rythme', song.rythme, song);
    const choices = shuffleArray([
      { text: song.rythme, isCorrect: true },
      ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
    ]);
    questions.push({
      id: `song_rythme_${song.id}`,
      type: 'song_rythme',
      questionText: `Quel est le rythme (baque) de la Toada "${song.titre}" ?`,
      instruction: "Identifie le rythme de ce chant.",
      choices: choices,
      feedback: `Le rythme de "${song.titre}" est bien "${song.rythme}".`
    });
  }

  // 2. Question sur la Nação
  if (askNacao && song.nacao) {
    const wrongChoices = getDistractors('nacao', song.nacao, song);
    const choices = shuffleArray([
      { text: song.nacao, isCorrect: true },
      ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
    ]);
    questions.push({
      id: `song_nacao_${song.id}`,
      type: 'song_nacao',
      questionText: `De quelle Nação provient la Toada "${song.titre}" ?`,
      instruction: "Identifie l'origine de ce chant.",
      choices: choices,
      feedback: `Cette Toada provient bien de la "${song.nacao}".`
    });
  }

  // 3. Question sur le Lexique (Lexique Transversal)
  if (askLexique && song.notesLexique && song.notesLexique.length > 0) {
    // Collecter les mots de lexique de TOUTE la base (chants + fiches)
    const allLexiqueFr = getTransversalLexique(allSheetsData, allSongs);

    // Prendre un mot au hasard du lexique de la chanson
    const randomLexique = song.notesLexique[Math.floor(Math.random() * song.notesLexique.length)];
    if (randomLexique.mot && randomLexique.explication) {
      let wrongChoices = allLexiqueFr.filter(t => t.toLowerCase() !== randomLexique.explication.toLowerCase());
      wrongChoices = shuffleArray(wrongChoices).slice(0, 3);
      
      const fallbacks = ['Tambour', 'Baguette', 'Danse', 'Couronne'];
      while (wrongChoices.length < 3) {
        const randomF = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!wrongChoices.includes(randomF) && randomF.toLowerCase() !== randomLexique.explication.toLowerCase()) {
          wrongChoices.push(randomF);
        }
      }

      const choices = shuffleArray([
        { text: randomLexique.explication, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `song_lexique_${song.id}`, // ID déterministe pour permettre la surcharge
        type: 'song_lexique',
        questionText: `Dans ce chant, que signifie le mot "${randomLexique.mot}" ?`,
        instruction: "Trouve la bonne explication ou traduction.",
        choices: choices,
        feedback: `Le mot "${randomLexique.mot}" signifie bien "${randomLexique.explication}".`
      });
    }
  }

  // 4. Questions bonus : Lexique spécialisé (Confirmé / Mestre)
  if (diffLevel !== 'easy' && diffLevel !== 'découverte' && distractorPool.lexiqueSpecialise) {
    const specialItems = shuffleArray([...distractorPool.lexiqueSpecialise]).slice(0, 1);
    const allTranslations = getTransversalLexique(allSheetsData, allSongs);
    
    specialItems.forEach((item, i) => {
      let wrongChoices = allTranslations.filter(t => t.toLowerCase() !== item.fr.toLowerCase());
      if (wrongChoices.length < 3) wrongChoices = ['Tambour', 'Baguette', 'Danse', 'Couronne'];
      wrongChoices = shuffleArray(wrongChoices).slice(0, 3);
      
      const choices = shuffleArray([
        { text: item.fr, isCorrect: true },
        ...wrongChoices.map(w => ({ text: w, isCorrect: false }))
      ]);

      questions.push({
        id: `song_special_${item.pt.replace(/\s+/g, '_')}_${i}`,
        type: 'lexique_specialise',
        questionText: item.pt,
        instruction: "Que signifie ce terme (Culture / Maracatu) ?",
        choices: choices,
        feedback: `"${item.pt}" signifie bien "${item.fr}".`
      });
    });
  }

  let finalQuestions = shuffleArray(questions).slice(0, 10);
  return applyOverrides(finalQuestions, song.quizOverrides);
};

