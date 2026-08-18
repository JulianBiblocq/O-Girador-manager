import fs from 'fs';

let content = fs.readFileSync('src/utils/quizGenerator.js', 'utf8');

const regexes = [
  {
    find: /questionText: `Dans ce contexte : "\.\.\.\$\{phraseTrou\}\.\.\."`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.missingWordQuestion\", { phraseTrou }) : `Dans ce contexte : \"...${phraseTrou}...\"`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon mot Ǹtait "\$\{correctMot\}". Ce terme est important dans l'apprentissage.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.missingWordFeedback\", { correctWord: correctMot }) : `Le bon mot était \"${correctMot}\". Ce terme est important dans l'apprentissage.`,"
  },
  {
    find: /instruction: "Que signifie ce terme \/ Qu'est-ce que c'est \?",/g,
    replace: "instruction: config.t ? config.t(\"pedagogyQuiz.meaningInstruction\") : \"Que signifie ce terme / Qu'est-ce que c'est ?\","
  },
  {
    find: /instruction: "Que signifie ce mot en portugais \?",/g,
    replace: "instruction: config.t ? config.t(\"pedagogyQuiz.ptMeaningInstruction\") : \"Que signifie ce mot en portugais ?\","
  },
  {
    find: /questionText: `"\$\{item\.pt\}" correspond bien  : "\$\{item\.fr\}".`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.meaningQuestionTextPt\", { pt: item.pt, fr: item.fr }) : `\"${item.pt}\" correspond bien à : \"${item.fr}\".`,"
  },
  {
    find: /correctAnswerExplanation: `"\$\{item\.pt\}" signifie bien "\$\{item\.fr\}". Bravo !`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.meaningFeedbackPt\", { pt: item.pt, fr: item.fr }) : `\"${item.pt}\" signifie bien \"${item.fr}\". Bravo !`,"
  },
  {
    find: /questionText: `"\$\{item\.pt\}" signifie bien "\$\{item\.fr\}".`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.meaningQuestionTextFr\", { pt: item.pt, fr: item.fr }) : `\"${item.pt}\" signifie bien \"${item.fr}\".`,"
  },
  {
    find: /correctAnswerExplanation: "La signification est correcte.",/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.meaningFeedbackFr\") : \"La signification est correcte.\","
  },
  {
    find: /questionText: "De quel Orixǭ s'agit-il \?",/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.visualRiddleQuestion\") : `De quel Orixá s'agit-il ?`,"
  },
  {
    find: /correctAnswerExplanation: `C'est bien \$\{sheetData\.personnageOrisha\}\. Ses couleurs sont caractǸristiques\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.visualRiddleFeedback\", { personnage: sheetData.personnageOrisha }) : `C'est bien ${sheetData.personnageOrisha}. Ses couleurs sont caractéristiques.`,"
  },
  {
    find: /questionText: `Qui est \$\{sheetData\.personnageOrisha\} \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.identityQuestion\", { personnage: sheetData.personnageOrisha }) : `Qui est ${sheetData.personnageOrisha} ?`,"
  },
  {
    find: /correctAnswerExplanation: `\$\{sheetData\.personnageOrisha\} est : \$\{sheetData\.titre\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.identityFeedback\", { personnage: sheetData.personnageOrisha, titre: sheetData.titre }) : `${sheetData.personnageOrisha} est : ${sheetData.titre}.`,"
  },
  {
    find: /questionText: `Quel est le symbole sacrǸ \(outil\) associǸ  \$\{sheetData\.personnageOrisha \|\| 'cette\s*divinitǸ'\} \?`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.toolQuestion\", { personnage: sheetData.personnageOrisha }) : `Quel est le symbole sacré (outil) associé à ${sheetData.personnageOrisha} ?`,"
  },
  {
    find: /correctAnswerExplanation: `L'outil correct est : \$\{sheetData\.outilSacro\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.toolFeedback\", { outil: sheetData.outilSacro }) : `L'outil correct est : ${sheetData.outilSacro}.`,"
  },
  {
    find: /questionText: `Identifiez les couleurs sacrǸes de : \$\{sheetData\.personnageOrisha \|\| sheetData\.titre\}`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.colorsQuestion\", { personnage: sheetData.personnageOrisha || sheetData.titre }) : `Identifiez les couleurs sacrées de : ${sheetData.personnageOrisha || sheetData.titre}`,"
  },
  {
    find: /correctAnswerExplanation: `Vous deviez choisir les couleurs sacrǸes de \$\{sheetData\.personnageOrisha \|\| sheetData\.titre\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.colorsFeedback\", { personnage: sheetData.personnageOrisha || sheetData.titre }) : `Vous deviez choisir les couleurs sacrées de ${sheetData.personnageOrisha || sheetData.titre}.`,"
  },
  {
    find: /questionText: `Identifiez le symbole de axǸ \(tampon\) de : \$\{sheetData\.personnageOrisha \|\| sheetData\.titre\}`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.stampQuestion\", { personnage: sheetData.personnageOrisha || sheetData.titre }) : `Identifiez le symbole de axé (tampon) de : ${sheetData.personnageOrisha || sheetData.titre}`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon symbole est le Selo de AxǸ de \$\{sheetData\.personnageOrisha \|\| sheetData\.titre\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.stampFeedback\", { personnage: sheetData.personnageOrisha || sheetData.titre }) : `Le bon symbole est le Selo de Axé de ${sheetData.personnageOrisha || sheetData.titre}.`,"
  },
  {
    find: /correctAnswerExplanation: "Le geste correct est liǸ  l'Ǹnergie de la danse\.",/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.danceFeedback\") : \"Le geste correct est lié à l'énergie de la danse.\","
  },
  {
    find: /questionText: `Quel est l'ǸlǸment naturel associǸ  \$\{sheetData\.personnageOrisha\} \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.elementQuestion\", { personnage: sheetData.personnageOrisha }) : `Quel est l'élément naturel associé à ${sheetData.personnageOrisha} ?`,"
  },
  {
    find: /correctAnswerExplanation: `L'ǸlǸment naturel correct est \$\{sheetData\.elementNaturel\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.elementFeedback\", { element: sheetData.elementNaturel }) : `L'élément naturel correct est ${sheetData.elementNaturel}.`,"
  },
  {
    find: /questionText: `Dans quelle rǸgion ou ville trouve-t-on traditionnellement cette figure du Cortge\s*\(\$\{sheetData\.titre\}\) \?`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.regionQuestion\", { titre: sheetData.titre }) : `Dans quelle région ou ville trouve-t-on traditionnellement cette figure du Cortège (${sheetData.titre}) ?`,"
  },
  {
    find: /correctAnswerExplanation: `Cette figure est caractǸristique de \$\{sheetData\.villeRegion\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.regionFeedback\", { region: sheetData.villeRegion }) : `Cette figure est caractéristique de ${sheetData.villeRegion}.`,"
  },
  {
    find: /correctAnswerExplanation: `Son rle est : \$\{correctRole\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.roleFeedback\", { role: correctRole }) : `Son rôle est : ${correctRole}.`,"
  },
  {
    find: /questionText: `De quelle rǸgion\/ville est originaire la spǸcialitǸ '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.cuisineOriginQuestion\", { titre: sheetData.titre }) : `De quelle région/ville est originaire la spécialité '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `La spǸcialitǸ '\$\{sheetData\.titre\}' est originaire de \$\{sheetData\.villeRegion\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.cuisineOriginFeedback\", { titre: sheetData.titre, region: sheetData.villeRegion }) : `La spécialité '${sheetData.titre}' est originaire de ${sheetData.villeRegion}.`,"
  },
  {
    find: /questionText: `\? quel Orixǭ \(ou concept\) est traditionnellement associǸ le plat '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.cuisineOrixaQuestion\", { titre: sheetData.titre }) : `À quel Orixá (ou concept) est traditionnellement associé le plat '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `Ce plat est traditionnellement associǸ  \$\{sheetData\.personnageOrisha\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.cuisineOrixaFeedback\", { personnage: sheetData.personnageOrisha }) : `Ce plat est traditionnellement associé à ${sheetData.personnageOrisha}.`,"
  },
  {
    find: /questionText: `\? quelle Ǹpoque remonte l'origine de '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.cuisineEpoqueQuestion\", { titre: sheetData.titre }) : `À quelle époque remonte l'origine de '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `L'origine remonte  : \$\{sheetData\.epoque\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.cuisineEpoqueFeedback\", { epoque: sheetData.epoque }) : `L'origine remonte à : ${sheetData.epoque}.`,"
  },
  {
    find: /questionText: `Lequel de ces mots\/ingrǸdients est directement liǸ  la prǸparation de\s*'\$\{sheetData\.titre\}' \?`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.cuisineIngredientQuestion\", { titre: sheetData.titre }) : `Lequel de ces mots/ingrédients est directement lié à la préparation de '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le mot liǸ  cette prǸparation est bien : \$\{correctMot\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.cuisineIngredientFeedback\", { mot: correctMot }) : `Le mot lié à cette préparation est bien : ${correctMot}.`,"
  },
  {
    find: /questionText: `Dans quelle rǸgion\/ville le style '\$\{sheetData\.titre\}' a-t-il vu le jour \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.styleOriginQuestion\", { titre: sheetData.titre }) : `Dans quelle région/ville le style '${sheetData.titre}' a-t-il vu le jour ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le style '\$\{sheetData\.titre\}' est originaire de \$\{sheetData\.villeRegion\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.styleOriginFeedback\", { titre: sheetData.titre, region: sheetData.villeRegion }) : `Le style '${sheetData.titre}' est originaire de ${sheetData.villeRegion}.`,"
  },
  {
    find: /questionText: `\? quelle grande figure ou mouvement associe-t-on souvent le '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.styleFigureQuestion\", { titre: sheetData.titre }) : `À quelle grande figure ou mouvement associe-t-on souvent le '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le style est souvent associǸ  \$\{sheetData\.personnageOrisha\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.styleFigureFeedback\", { personnage: sheetData.personnageOrisha }) : `Le style est souvent associé à ${sheetData.personnageOrisha}.`,"
  },
  {
    find: /questionText: `\? quelle Ǹpoque le style '\$\{sheetData\.titre\}' s'est-il dǸveloppǸ \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.styleEpoqueQuestion\", { titre: sheetData.titre }) : `À quelle époque le style '${sheetData.titre}' s'est-il développé ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le style s'est dǸveloppǸ  l'Ǹpoque suivante : \$\{sheetData\.epoque\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.styleEpoqueFeedback\", { epoque: sheetData.epoque }) : `Le style s'est développé à l'époque suivante : ${sheetData.epoque}.`,"
  },
  {
    find: /questionText: `Dans quelle rǸgion du BrǸsil se situe principalement le territoire dǸcrit dans\s*'\$\{sheetData\.titre\}' \?`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.territoryGeoQuestion\", { titre: sheetData.titre }) : `Dans quelle région du Brésil se situe principalement le territoire décrit dans '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `Ce territoire se situe principalement dans la rǸgion \/ l'Ǹtat de : \$\{sheetData\.villeRegion\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.territoryGeoFeedback\", { region: sheetData.villeRegion }) : `Ce territoire se situe principalement dans la région / l'état de : ${sheetData.villeRegion}.`,"
  },
  {
    find: /questionText: `\? quelle Ǹpoque ou cycle Ǹconomique relie-t-on le dǸveloppement de la rǸgion de\s*'\$\{sheetData\.titre\}' \?`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.territoryEpoqueQuestion\", { titre: sheetData.titre }) : `À quelle époque ou cycle économique relie-t-on le développement de la région de '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `On relie ce territoire  : \$\{sheetData\.epoque\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.territoryEpoqueFeedback\", { epoque: sheetData.epoque }) : `On relie ce territoire à : ${sheetData.epoque}.`,"
  },
  {
    find: /questionText: `Quelle figure ou concept culturel est emblǸmatique de '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.territoryPopulationQuestion\", { titre: sheetData.titre }) : `Quelle figure ou concept culturel est emblématique de '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `La figure emblǸmatique est : \$\{sheetData\.personnageOrisha\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.territoryPopulationFeedback\", { personnage: sheetData.personnageOrisha }) : `La figure emblématique est : ${sheetData.personnageOrisha}.`,"
  },
  {
    find: /questionText: `Lequel de ces mots\/biomes est directement liǸ  '\$\{sheetData\.titre\}' \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.territoryLexiconQuestion\", { titre: sheetData.titre }) : `Lequel de ces mots/biomes est diretamente ligado a '${sheetData.titre}' ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le terme exact est bien : \$\{correctMot\}\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.territoryLexiconFeedback\", { mot: correctMot }) : `Le terme exact est bien : ${correctMot}.`,"
  },
  {
    find: /correctAnswerExplanation: `"\$\{item\.pt\}" signifie bien "\$\{item\.fr\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.meaningQuestionTextFr\", { pt: item.pt, fr: item.fr }) : `\"${item.pt}\" signifie bien \"${item.fr}\".`,"
  },
  {
    find: /questionText: `Quel est le signe du Mestre pour annoncer : \$\{sheetData\.titre\} \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.mestreSignQuestion\", { titre: sheetData.titre }) : `Quel est le signe du Mestre pour annoncer : ${sheetData.titre} ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon signe pour "\$\{sheetData\.titre\}" est celui affichǸ en vert\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.mestreSignFeedback\", { titre: sheetData.titre }) : `Le bon signe pour \"${sheetData.titre}\" est celui affiché en vert.`,"
  },
  {
    find: /questionText: `Identifiez le pattern rythmique correct pour : \$\{sheetData\.titre\}`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.rhythmPatternQuestion\", { titre: sheetData.titre }) : `Identifiez le pattern rythmique correct pour : ${sheetData.titre}`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon pattern pour "\$\{sheetData\.titre\}" est celui affichǸ en vert\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.rhythmPatternFeedback\", { titre: sheetData.titre }) : `Le bon pattern pour \"${sheetData.titre}\" est celui affiché en vert.`,"
  },
  {
    find: /correctAnswerExplanation: `Extrait : \$\{q\.correctAnswer\}`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.customQuestionExtract\", { extrait: q.correctAnswer }) : `Extrait : ${q.correctAnswer}`,"
  },
  {
    find: /questionText: `Quel est le rythme \(baque\) de la Toada "\$\{song\.titre\}" \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.songRhythmQuestion\", { titre: song.titre }) : `Quel est le rythme (baque) de la Toada \"${song.titre}\" ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le rythme de "\$\{song\.titre\}" est bien "\$\{song\.rythme\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.songRhythmFeedback\", { titre: song.titre, rythme: song.rythme }) : `Le rythme de \"${song.titre}\" est bien \"${song.rythme}\".`,"
  },
  {
    find: /questionText: `De quelle Naǜo provient la Toada "\$\{song\.titre\}" \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.songNacaoQuestion\", { titre: song.titre }) : `De quelle Nação provient la Toada \"${song.titre}\" ?`,"
  },
  {
    find: /correctAnswerExplanation: `Cette Toada provient bien de la "\$\{song\.nacao\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.songNacaoFeedback\", { nacao: song.nacao }) : `Cette Toada provient bien de la \"${song.nacao}\".`,"
  },
  {
    find: /questionText: `Dans ce chant, que signifie le mot "\$\{randomLexique\.mot\}" \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.songLexiconQuestion\", { mot: randomLexique.mot }) : `Dans ce chant, que signifie le mot \"${randomLexique.mot}\" ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le mot "\$\{randomLexique\.mot\}" signifie bien "\$\{randomLexique\.explication\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.songLexiconFeedback\", { mot: randomLexique.mot, explication: randomLexique.explication }) : `Le mot \"${randomLexique.mot}\" signifie bien \"${randomLexique.explication}\".`,"
  },
  {
    find: /questionText: `Identifiez le pattern rythmique jouǸ par le pupitre "\$\{patternObj\.cleanName\}" dans :\s*\$\{rhythmTitle\}`,/gm,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.seqPatternQuestion\", { pupitre: patternObj.cleanName, titre: rhythmTitle }) : `Identifiez le pattern rythmique joué par le pupitre \"${patternObj.cleanName}\" dans : ${rhythmTitle}`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon pattern pour "\$\{patternObj\.cleanName\}" est celui affichǸ en vert\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.seqPatternFeedback\", { pupitre: patternObj.cleanName }) : `Le bon pattern pour \"${patternObj.cleanName}\" est celui affiché en vert.`,"
  },
  {
    find: /questionText: `Quel est le signe du Mestre pour annoncer : \$\{signal\.titre\} \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.mestreSignQuestion\", { titre: signal.titre }) : `Quel est le signe du Mestre pour annoncer : ${signal.titre} ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le bon signe pour "\$\{signal\.titre\}" est celui affichǸ en vert\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.mestreSignFeedback\", { titre: signal.titre }) : `Le bon signe pour \"${signal.titre}\" est celui affiché en vert.`,"
  },
  {
    find: /correctAnswerExplanation: `Ce pas s'appelle bien "\$\{step\.nom\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.danceVisualFeedback\", { nom: step.nom }) : `Ce pas s'appelle bien \"${step.nom}\".`,"
  },
  {
    find: /questionText: `\? quelle famille appartient le pas "\$\{step\.nom\}" \?`,/g,
    replace: "questionText: config.t ? config.t(\"pedagogyQuiz.danceFamilyQuestion\", { nom: step.nom }) : `À quelle famille appartient le pas \"${step.nom}\" ?`,"
  },
  {
    find: /correctAnswerExplanation: `Le pas "\$\{step\.nom\}" appartient  la famille "\$\{step\.famille\}"\.`,/g,
    replace: "correctAnswerExplanation: config.t ? config.t(\"pedagogyQuiz.danceFamilyFeedback\", { nom: step.nom, famille: step.famille }) : `Le pas \"${step.nom}\" appartient à la famille \"${step.famille}\".`,"
  }
];

let replacedCount = 0;
for (const {find, replace} of regexes) {
  if (find.test(content)) {
    content = content.replace(find, replace);
    replacedCount++;
  }
}

fs.writeFileSync('src/utils/quizGenerator.js', content);
console.log(`Done regex replacement. Replaced ${replacedCount} patterns.`);
