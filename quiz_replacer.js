import fs from 'fs';

let content = fs.readFileSync('src/utils/quizGenerator.js', 'utf8');

const replacements = [
  // generateQuizFromSheet
  [`instruction: "Quel mot manque dans cette phrase ?"`, `instruction: config.t ? config.t("pedagogyQuiz.missingWordInstruction") : "Quel mot manque dans cette phrase ?"`],
  [`questionText: \`Dans ce contexte : "...\\$\\{sContext\\}..."\``, `questionText: config.t ? config.t("pedagogyQuiz.missingWordQuestion", { phraseTrou: sContext }) : \`Dans ce contexte : "...\\$\\{sContext\\}..."\``],
  [`correctAnswerExplanation: \`Le bon mot était "\\$\\{correctMot\\}". Ce terme est important dans l'apprentissage.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.missingWordFeedback", { correctWord: correctMot }) : \`Le bon mot était "\\$\\{correctMot\\}". Ce terme est important dans l'apprentissage.\``],
  
  [`instruction: "Que signifie ce terme / Qu'est-ce que c'est ?"`, `instruction: config.t ? config.t("pedagogyQuiz.meaningInstruction") : "Que signifie ce terme / Qu'est-ce que c'est ?"`],
  [`instruction: "Que signifie ce mot en portugais ?"`, `instruction: config.t ? config.t("pedagogyQuiz.ptMeaningInstruction") : "Que signifie ce mot en portugais ?"`],
  [`questionText: \`"\\$\\{item.pt\\}" correspond bien à : "\\$\\{item.fr\\}".\``, `questionText: config.t ? config.t("pedagogyQuiz.meaningQuestionTextPt", { pt: item.pt, fr: item.fr }) : \`"\\$\\{item.pt\\}" correspond bien à : "\\$\\{item.fr\\}".\``],
  [`correctAnswerExplanation: \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}". Bravo !\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.meaningFeedbackPt", { pt: item.pt, fr: item.fr }) : \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}". Bravo !\``],
  [`questionText: \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}".\``, `questionText: config.t ? config.t("pedagogyQuiz.meaningQuestionTextFr", { pt: item.pt, fr: item.fr }) : \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}".\``],
  [`correctAnswerExplanation: "La signification est correcte."`, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.meaningFeedbackFr") : "La signification est correcte."`],

  [`instruction: "Devinette visuelle"`, `instruction: config.t ? config.t("pedagogyQuiz.visualRiddleInstruction") : "Devinette visuelle"`],
  [`questionText: \`De quel Orixá s'agit-il ?\``, `questionText: config.t ? config.t("pedagogyQuiz.visualRiddleQuestion") : \`De quel Orixá s'agit-il ?\``],
  [`correctAnswerExplanation: \`C'est bien \\$\\{sheetData.personnageOrisha\\}. Ses couleurs sont caractéristiques.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.visualRiddleFeedback", { personnage: sheetData.personnageOrisha }) : \`C'est bien \\$\\{sheetData.personnageOrisha\\}. Ses couleurs sont caractéristiques.\``],
  
  [`instruction: "Identité"`, `instruction: config.t ? config.t("pedagogyQuiz.identityInstruction") : "Identité"`],
  [`questionText: \`Qui est \\$\\{sheetData.personnageOrisha\\} ?\``, `questionText: config.t ? config.t("pedagogyQuiz.identityQuestion", { personnage: sheetData.personnageOrisha }) : \`Qui est \\$\\{sheetData.personnageOrisha\\} ?\``],
  [`correctAnswerExplanation: \`\\$\\{sheetData.personnageOrisha\\} est : \\$\\{sheetData.titre\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.identityFeedback", { personnage: sheetData.personnageOrisha, titre: sheetData.titre }) : \`\\$\\{sheetData.personnageOrisha\\} est : \\$\\{sheetData.titre\\}.\``],

  [`instruction: "Outil sacré"`, `instruction: config.t ? config.t("pedagogyQuiz.toolInstruction") : "Outil sacré"`],
  [`questionText: \`Quel est le symbole sacré (outil) associé à \\$\\{sheetData.personnageOrisha\\} ?\``, `questionText: config.t ? config.t("pedagogyQuiz.toolQuestion", { personnage: sheetData.personnageOrisha }) : \`Quel est le symbole sacré (outil) associé à \\$\\{sheetData.personnageOrisha\\} ?\``],
  [`correctAnswerExplanation: \`L'outil correct est : \\$\\{sheetData.outilSacro\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.toolFeedback", { outil: sheetData.outilSacro }) : \`L'outil correct est : \\$\\{sheetData.outilSacro\\}.\``],

  [`instruction: "Couleurs du Blason"`, `instruction: config.t ? config.t("pedagogyQuiz.colorsInstruction") : "Couleurs du Blason"`],
  [`questionText: \`Identifiez les couleurs sacrées de : \\$\\{sheetData.personnageOrisha || sheetData.titre\\}\``, `questionText: config.t ? config.t("pedagogyQuiz.colorsQuestion", { personnage: sheetData.personnageOrisha || sheetData.titre }) : \`Identifiez les couleurs sacrées de : \\$\\{sheetData.personnageOrisha || sheetData.titre\\}\``],
  [`correctAnswerExplanation: \`Vous deviez choisir les couleurs sacrées de \\$\\{sheetData.personnageOrisha || sheetData.titre\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.colorsFeedback", { personnage: sheetData.personnageOrisha || sheetData.titre }) : \`Vous deviez choisir les couleurs sacrées de \\$\\{sheetData.personnageOrisha || sheetData.titre\\}.\``],

  [`instruction: "Symbole (Selo de Axé)"`, `instruction: config.t ? config.t("pedagogyQuiz.stampInstruction") : "Symbole (Selo de Axé)"`],
  [`questionText: \`Identifiez le symbole de axé (tampon) de : \\$\\{sheetData.personnageOrisha || sheetData.titre\\}\``, `questionText: config.t ? config.t("pedagogyQuiz.stampQuestion", { personnage: sheetData.personnageOrisha || sheetData.titre }) : \`Identifiez le symbole de axé (tampon) de : \\$\\{sheetData.personnageOrisha || sheetData.titre\\}\``],
  [`correctAnswerExplanation: \`Le bon symbole est le Selo de Axé de \\$\\{sheetData.personnageOrisha || sheetData.titre\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.stampFeedback", { personnage: sheetData.personnageOrisha || sheetData.titre }) : \`Le bon symbole est le Selo de Axé de \\$\\{sheetData.personnageOrisha || sheetData.titre\\}.\``],

  [`instruction: "Danse & Gestuelle"`, `instruction: config.t ? config.t("pedagogyQuiz.danceInstruction") : "Danse & Gestuelle"`],
  [`questionText: \`Quel geste ou mouvement caractérise cette figure culturelle ?\``, `questionText: config.t ? config.t("pedagogyQuiz.danceQuestion") : \`Quel geste ou mouvement caractérise cette figure culturelle ?\``],
  [`correctAnswerExplanation: "Le geste correct est lié à l'énergie de la danse."`, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.danceFeedback") : "Le geste correct est lié à l'énergie de la danse."`],

  [`instruction: "Élément Naturel"`, `instruction: config.t ? config.t("pedagogyQuiz.elementInstruction") : "Élément Naturel"`],
  [`questionText: \`Quel est l'élément naturel associé à \\$\\{sheetData.personnageOrisha\\} ?\``, `questionText: config.t ? config.t("pedagogyQuiz.elementQuestion", { personnage: sheetData.personnageOrisha }) : \`Quel est l'élément naturel associé à \\$\\{sheetData.personnageOrisha\\} ?\``],
  [`correctAnswerExplanation: \`L'élément naturel correct est \\$\\{sheetData.elementNaturel\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.elementFeedback", { element: sheetData.elementNaturel }) : \`L'élément naturel correct est \\$\\{sheetData.elementNaturel\\}.\``],

  [`instruction: "Territoire & Région"`, `instruction: config.t ? config.t("pedagogyQuiz.regionInstruction") : "Territoire & Région"`],
  [`questionText: \`Dans quelle région ou ville trouve-t-on traditionnellement cette figure du Cortège (\\$\\{sheetData.titre\\}) ?\``, `questionText: config.t ? config.t("pedagogyQuiz.regionQuestion", { titre: sheetData.titre }) : \`Dans quelle région ou ville trouve-t-on traditionnellement cette figure du Cortège (\\$\\{sheetData.titre\\}) ?\``],
  [`correctAnswerExplanation: \`Cette figure est caractéristique de \\$\\{sheetData.villeRegion\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.regionFeedback", { region: sheetData.villeRegion }) : \`Cette figure est caractéristique de \\$\\{sheetData.villeRegion\\}.\``],

  [`instruction: "Rôle dans le Cortège"`, `instruction: config.t ? config.t("pedagogyQuiz.roleInstruction") : "Rôle dans le Cortège"`],
  [`questionText: \`Quel est le rôle exact ou le titre de ce personnage dans le cortège ?\``, `questionText: config.t ? config.t("pedagogyQuiz.roleQuestion") : \`Quel est le rôle exact ou le titre de ce personnage dans le cortège ?\``],
  [`correctAnswerExplanation: \`Son rôle est : \\$\\{correctRole\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.roleFeedback", { role: correctRole }) : \`Son rôle est : \\$\\{correctRole\\}.\``],

  [`instruction: "Origine & Région"`, `instruction: config.t ? config.t("pedagogyQuiz.cuisineOriginInstruction") : "Origine & Région"`],
  [`questionText: \`De quelle région/ville est originaire la spécialité '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.cuisineOriginQuestion", { titre: sheetData.titre }) : \`De quelle région/ville est originaire la spécialité '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`La spécialité '\\$\\{sheetData.titre\\}' est originaire de \\$\\{sheetData.villeRegion\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.cuisineOriginFeedback", { titre: sheetData.titre, region: sheetData.villeRegion }) : \`La spécialité '\\$\\{sheetData.titre\\}' est originaire de \\$\\{sheetData.villeRegion\\}.\``],

  [`instruction: "Spiritualité & Offrande"`, `instruction: config.t ? config.t("pedagogyQuiz.cuisineOrixaInstruction") : "Spiritualité & Offrande"`],
  [`questionText: \`À quel Orixá (ou concept) est traditionnellement associé le plat '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.cuisineOrixaQuestion", { titre: sheetData.titre }) : \`À quel Orixá (ou concept) est traditionnellement associé le plat '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`Ce plat est traditionnellement associé à \\$\\{sheetData.personnageOrisha\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.cuisineOrixaFeedback", { personnage: sheetData.personnageOrisha }) : \`Ce plat est traditionnellement associé à \\$\\{sheetData.personnageOrisha\\}.\``],

  [`instruction: "Histoire & Époque"`, `instruction: config.t ? config.t("pedagogyQuiz.cuisineEpoqueInstruction") : "Histoire & Époque"`],
  [`questionText: \`À quelle époque remonte l'origine de '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.cuisineEpoqueQuestion", { titre: sheetData.titre }) : \`À quelle époque remonte l'origine de '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`L'origine remonte à : \\$\\{sheetData.epoque\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.cuisineEpoqueFeedback", { epoque: sheetData.epoque }) : \`L'origine remonte à : \\$\\{sheetData.epoque\\}.\``],

  [`instruction: "Ingrédients & Préparation"`, `instruction: config.t ? config.t("pedagogyQuiz.cuisineIngredientInstruction") : "Ingrédients & Préparation"`],
  [`questionText: \`Lequel de ces mots/ingrédients est directement lié à la préparation de '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.cuisineIngredientQuestion", { titre: sheetData.titre }) : \`Lequel de ces mots/ingrédients est directement lié à la préparation de '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`Le mot lié à cette préparation est bien : \\$\\{correctMot\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.cuisineIngredientFeedback", { mot: correctMot }) : \`Le mot lié à cette préparation est bien : \\$\\{correctMot\\}.\``],

  [`instruction: "Origine Géographique"`, `instruction: config.t ? config.t("pedagogyQuiz.styleOriginInstruction") : "Origine Géographique"`],
  [`questionText: \`Dans quelle région/ville le style '\\$\\{sheetData.titre\\}' a-t-il vu le jour ?\``, `questionText: config.t ? config.t("pedagogyQuiz.styleOriginQuestion", { titre: sheetData.titre }) : \`Dans quelle région/ville le style '\\$\\{sheetData.titre\\}' a-t-il vu le jour ?\``],
  [`correctAnswerExplanation: \`Le style '\\$\\{sheetData.titre\\}' est originaire de \\$\\{sheetData.villeRegion\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.styleOriginFeedback", { titre: sheetData.titre, region: sheetData.villeRegion }) : \`Le style '\\$\\{sheetData.titre\\}' est originaire de \\$\\{sheetData.villeRegion\\}.\``],

  [`instruction: "Figure Emblématique"`, `instruction: config.t ? config.t("pedagogyQuiz.styleFigureInstruction") : "Figure Emblématique"`],
  [`questionText: \`À quelle grande figure ou mouvement associe-t-on souvent le '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.styleFigureQuestion", { titre: sheetData.titre }) : \`À quelle grande figure ou mouvement associe-t-on souvent le '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`Le style est souvent associé à \\$\\{sheetData.personnageOrisha\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.styleFigureFeedback", { personnage: sheetData.personnageOrisha }) : \`Le style est souvent associé à \\$\\{sheetData.personnageOrisha\\}.\``],

  [`instruction: "Période d'apparition"`, `instruction: config.t ? config.t("pedagogyQuiz.styleEpoqueInstruction") : "Période d'apparition"`],
  [`questionText: \`À quelle époque le style '\\$\\{sheetData.titre\\}' s'est-il développé ?\``, `questionText: config.t ? config.t("pedagogyQuiz.styleEpoqueQuestion", { titre: sheetData.titre }) : \`À quelle époque le style '\\$\\{sheetData.titre\\}' s'est-il développé ?\``],
  [`correctAnswerExplanation: \`Le style s'est développé à l'époque suivante : \\$\\{sheetData.epoque\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.styleEpoqueFeedback", { epoque: sheetData.epoque }) : \`Le style s'est développé à l'époque suivante : \\$\\{sheetData.epoque\\}.\``],

  [`instruction: "Géographie / Région"`, `instruction: config.t ? config.t("pedagogyQuiz.territoryGeoInstruction") : "Géographie / Région"`],
  [`questionText: \`Dans quelle région du Brésil se situe principalement le territoire décrit dans '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.territoryGeoQuestion", { titre: sheetData.titre }) : \`Dans quelle région du Brésil se situe principalement le territoire décrit dans '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`Ce territoire se situe principalement dans la région / l'état de : \\$\\{sheetData.villeRegion\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.territoryGeoFeedback", { region: sheetData.villeRegion }) : \`Ce territoire se situe principalement dans la région / l'état de : \\$\\{sheetData.villeRegion\\}.\``],

  [`instruction: "Histoire / Économie"`, `instruction: config.t ? config.t("pedagogyQuiz.territoryEpoqueInstruction") : "Histoire / Économie"`],
  [`questionText: \`À quelle époque ou cycle économique relie-t-on le développement de la région de '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.territoryEpoqueQuestion", { titre: sheetData.titre }) : \`À quelle époque ou cycle économique relie-t-on le développement de la région de '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`On relie ce territoire à : \\$\\{sheetData.epoque\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.territoryEpoqueFeedback", { epoque: sheetData.epoque }) : \`On relie ce territoire à : \\$\\{sheetData.epoque\\}.\``],

  [`instruction: "Population / Concept"`, `instruction: config.t ? config.t("pedagogyQuiz.territoryPopulationInstruction") : "Population / Concept"`],
  [`questionText: \`Quelle figure ou concept culturel est emblématique de '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.territoryPopulationQuestion", { titre: sheetData.titre }) : \`Quelle figure ou concept culturel est emblématique de '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`La figure emblématique est : \\$\\{sheetData.personnageOrisha\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.territoryPopulationFeedback", { personnage: sheetData.personnageOrisha }) : \`La figure emblématique est : \\$\\{sheetData.personnageOrisha\\}.\``],

  [`instruction: "Lexique / Biome"`, `instruction: config.t ? config.t("pedagogyQuiz.territoryLexiconInstruction") : "Lexique / Biome"`],
  [`questionText: \`Lequel de ces mots/biomes est directement lié à '\\$\\{sheetData.titre\\}' ?\``, `questionText: config.t ? config.t("pedagogyQuiz.territoryLexiconQuestion", { titre: sheetData.titre }) : \`Lequel de ces mots/biomes est directement lié à '\\$\\{sheetData.titre\\}' ?\``],
  [`correctAnswerExplanation: \`Le terme exact est bien : \\$\\{correctMot\\}.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.territoryLexiconFeedback", { mot: correctMot }) : \`Le terme exact est bien : \\$\\{correctMot\\}.\``],

  [`instruction: "Que signifie ce terme (Culture / Maracatu) ?"`, `instruction: config.t ? config.t("pedagogyQuiz.meaningInstruction") : "Que signifie ce terme (Culture / Maracatu) ?"`],
  [`correctAnswerExplanation: \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.meaningQuestionTextFr", { pt: item.pt, fr: item.fr }) : \`"\\$\\{item.pt\\}" signifie bien "\\$\\{item.fr\\}".\``],

  [`instruction: "Signes du Mestre (Modèle C)"`, `instruction: config.t ? config.t("pedagogyQuiz.mestreSignModCInstruction") : "Signes du Mestre (Modèle C)"`],
  [`questionText: \`Quel est le signe du Mestre pour annoncer : \\$\\{sheetData.titre\\} ?\``, `questionText: config.t ? config.t("pedagogyQuiz.mestreSignQuestion", { titre: sheetData.titre }) : \`Quel est le signe du Mestre pour annoncer : \\$\\{sheetData.titre\\} ?\``],
  [`correctAnswerExplanation: \`Le bon signe pour "\\$\\{sheetData.titre\\}" est celui affiché en vert.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.mestreSignFeedback", { titre: sheetData.titre }) : \`Le bon signe pour "\\$\\{sheetData.titre\\}" est celui affiché en vert.\``],

  [`instruction: "Pattern Rythmique"`, `instruction: config.t ? config.t("pedagogyQuiz.rhythmPatternInstruction") : "Pattern Rythmique"`],
  [`questionText: \`Identifiez le pattern rythmique correct pour : \\$\\{sheetData.titre\\}\``, `questionText: config.t ? config.t("pedagogyQuiz.rhythmPatternQuestion", { titre: sheetData.titre }) : \`Identifiez le pattern rythmique correct pour : \\$\\{sheetData.titre\\}\``],
  [`correctAnswerExplanation: \`Le bon pattern pour "\\$\\{sheetData.titre\\}" est celui affiché en vert.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.rhythmPatternFeedback", { titre: sheetData.titre }) : \`Le bon pattern pour "\\$\\{sheetData.titre\\}" est celui affiché en vert.\``],

  [`instruction: "Question spécifique"`, `instruction: config.t ? config.t("pedagogyQuiz.customQuestionInstruction") : "Question spécifique"`],
  [`correctAnswerExplanation: \`Extrait : \\$\\{q.correctAnswer\\}\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.customQuestionExtract", { extrait: q.correctAnswer }) : \`Extrait : \\$\\{q.correctAnswer\\}\``],

  // generateQuizFromSong
  [`questionText: \`Quel est le rythme (baque) de la Toada "\\$\\{song.titre\\}" ?\``, `questionText: config.t ? config.t("pedagogyQuiz.songRhythmQuestion", { titre: song.titre }) : \`Quel est le rythme (baque) de la Toada "\\$\\{song.titre\\}" ?\``],
  [`instruction: "Identifie le rythme de ce chant."`, `instruction: config.t ? config.t("pedagogyQuiz.songRhythmInstruction") : "Identifie le rythme de ce chant."`],
  [`correctAnswerExplanation: \`Le rythme de "\\$\\{song.titre\\}" est bien "\\$\\{song.rythme\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.songRhythmFeedback", { titre: song.titre, rythme: song.rythme }) : \`Le rythme de "\\$\\{song.titre\\}" est bien "\\$\\{song.rythme\\}".\``],

  [`questionText: \`De quelle Nação provient la Toada "\\$\\{song.titre\\}" ?\``, `questionText: config.t ? config.t("pedagogyQuiz.songNacaoQuestion", { titre: song.titre }) : \`De quelle Nação provient la Toada "\\$\\{song.titre\\}" ?\``],
  [`instruction: "Identifie l'origine de ce chant."`, `instruction: config.t ? config.t("pedagogyQuiz.songNacaoInstruction") : "Identifie l'origine de ce chant."`],
  [`correctAnswerExplanation: \`Cette Toada provient bien de la "\\$\\{song.nacao\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.songNacaoFeedback", { nacao: song.nacao }) : \`Cette Toada provient bien de la "\\$\\{song.nacao\\}".\``],

  [`questionText: \`Dans ce chant, que signifie le mot "\\$\\{randomLexique.mot\\}" ?\``, `questionText: config.t ? config.t("pedagogyQuiz.songLexiconQuestion", { mot: randomLexique.mot }) : \`Dans ce chant, que signifie le mot "\\$\\{randomLexique.mot\\}" ?\``],
  [`instruction: "Trouve la bonne explication ou traduction."`, `instruction: config.t ? config.t("pedagogyQuiz.songLexiconInstruction") : "Trouve la bonne explication ou traduction."`],
  [`correctAnswerExplanation: \`Le mot "\\$\\{randomLexique.mot\\}" signifie bien "\\$\\{randomLexique.explication\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.songLexiconFeedback", { mot: randomLexique.mot, explication: randomLexique.explication }) : \`Le mot "\\$\\{randomLexique.mot\\}" signifie bien "\\$\\{randomLexique.explication\\}".\``],

  // generateQuizFromSequencerJson
  [`instruction: "Pattern Rythmique (Séquenceur)"`, `instruction: config.t ? config.t("pedagogyQuiz.seqPatternInstruction") : "Pattern Rythmique (Séquenceur)"`],
  [`questionText: \`Identifiez le pattern rythmique joué par le pupitre "\\$\\{patternObj.cleanName\\}" dans : \\$\\{rhythmTitle\\}\``, `questionText: config.t ? config.t("pedagogyQuiz.seqPatternQuestion", { pupitre: patternObj.cleanName, titre: rhythmTitle }) : \`Identifiez le pattern rythmique joué par le pupitre "\\$\\{patternObj.cleanName\\}" dans : \\$\\{rhythmTitle\\}\``],
  [`correctAnswerExplanation: \`Le bon pattern pour "\\$\\{patternObj.cleanName\\}" est celui affiché en vert.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.seqPatternFeedback", { pupitre: patternObj.cleanName }) : \`Le bon pattern pour "\\$\\{patternObj.cleanName\\}" est celui affiché en vert.\``],
  
  [`instruction: "Signes du Mestre"`, `instruction: config.t ? config.t("pedagogyQuiz.mestreSignInstruction") : "Signes du Mestre"`],
  [`questionText: \`Quel est le signe du Mestre pour annoncer : \\$\\{signal.titre\\} ?\``, `questionText: config.t ? config.t("pedagogyQuiz.mestreSignQuestion", { titre: signal.titre }) : \`Quel est le signe du Mestre pour annoncer : \\$\\{signal.titre\\} ?\``],
  [`correctAnswerExplanation: \`Le bon signe pour "\\$\\{signal.titre\\}" est celui affiché en vert.\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.mestreSignFeedback", { titre: signal.titre }) : \`Le bon signe pour "\\$\\{signal.titre\\}" est celui affiché en vert.\``],

  // generateQuizFromDancador
  [`questionText: "Comment s'appelle ce pas de danse ?"`, `questionText: config.t ? config.t("pedagogyQuiz.danceVisualQuestion") : "Comment s'appelle ce pas de danse ?"`],
  [`instruction: "Reconnaissance Visuelle"`, `instruction: config.t ? config.t("pedagogyQuiz.danceVisualInstruction") : "Reconnaissance Visuelle"`],
  [`correctAnswerExplanation: \`Ce pas s'appelle bien "\\$\\{step.nom\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.danceVisualFeedback", { nom: step.nom }) : \`Ce pas s'appelle bien "\\$\\{step.nom\\}".\``],

  [`questionText: \`À quelle famille appartient le pas "\\$\\{step.nom\\}" ?\``, `questionText: config.t ? config.t("pedagogyQuiz.danceFamilyQuestion", { nom: step.nom }) : \`À quelle famille appartient le pas "\\$\\{step.nom\\}" ?\``],
  [`instruction: "Famille de pas"`, `instruction: config.t ? config.t("pedagogyQuiz.danceFamilyInstruction") : "Famille de pas"`],
  [`correctAnswerExplanation: \`Le pas "\\$\\{step.nom\\}" appartient à la famille "\\$\\{step.famille\\}".\``, `correctAnswerExplanation: config.t ? config.t("pedagogyQuiz.danceFamilyFeedback", { nom: step.nom, famille: step.famille }) : \`Le pas "\\$\\{step.nom\\}" appartient à la famille "\\$\\{step.famille\\}".\``]
];

let newContent = content;
let replacedCount = 0;
for (const [search, replace] of replacements) {
  if (newContent.includes(search)) {
    newContent = newContent.replaceAll(search, replace);
    replacedCount++;
  } else {
    console.warn('Could not find:', search);
  }
}

fs.writeFileSync('src/utils/quizGenerator.js', newContent);
console.log('Done replacement. Replaced ' + replacedCount + ' strings out of ' + replacements.length);
