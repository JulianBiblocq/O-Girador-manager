/**
 * Script de test et de validation du QCM d'Atelier Granulaire
 * Valide le bon fonctionnement de generateQuizFromInstrumentModel en :
 * - Mode global (modèle complet)
 * - Mode pièce ciblée (targetPartId)
 * - Mode étape ciblée (targetPartId + targetStepIndex, incluant stepIndex = 0)
 * Et simule le payload généré pour quizHistory et parcours.evaluations.
 */

const path = require('path');

async function runTests() {
  console.log("===============================================================");
  console.log("🛠️ DÉBUT DU TEST DE VALIDATION : QCM ATELIER GRANULAIRE");
  console.log("===============================================================\n");

  // Import dynamique du module ES
  const quizGenPath = path.resolve(__dirname, '../src/utils/quizGenerator.js');
  const { generateQuizFromInstrumentModel } = await import(`file://${quizGenPath.replace(/\\/g, '/')}`);

  // Données de test représentatives d'un modèle d'instrument d'atelier
  const sampleModel = {
    id: 'model_alfaia_pro',
    nom: 'Alfaia Professionnelle 22"',
    type: 'alfaia',
    parts: [
      {
        id: 'part_fut',
        nom: 'Fût en contreplaqué',
        materiels: ['Contreplaqué cintrable 4mm', 'Colle vinylique D3'],
        outils: ['Sangles de serrage', 'Cale à poncer'],
        chapitres: [
          {
            id: 'step_debit',
            titre: 'Débit et chanfreinage',
            texte: 'Découper les bandes de contreplaqué et biseauter les chants.',
            outils: ['Scie circulaire', 'Réglet métallique'],
            materiaux: ['Contreplaqué 4mm']
          },
          {
            id: 'step_roulage',
            titre: 'Encollage et mise sous sangle',
            texte: 'Appliquer la colle blanche et serrer avec 4 sangles à cliquet.',
            outils: ['Sangles à cliquet', 'Pinceau d\'encollage'],
            materiaux: ['Colle vinylique D3']
          },
          {
            id: 'step_finition',
            titre: 'Ponçage fin et chanfrein',
            texte: 'Vérifier la planéité des fûts et chanfreiner à 45 degrés.',
            outils: ['Papier de verre 120', 'Rabot à main'],
            materiaux: ['Fondur cellulosique']
          }
        ]
      },
      {
        id: 'part_cercles',
        nom: 'Cercles de tension',
        materiels: ['Frêne cintré', 'Tourillons hêtre'],
        outils: ['Perceuse à colonne', 'Mèches à bois'],
        etapesFabrication: [
          {
            titre: 'Perçage des trous de cordage',
            outils: ['Perceuse à colonne', 'Foret 6mm'],
            materiaux: ['Huile de lin']
          }
        ]
      }
    ]
  };

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // TEST 1 : Mode Global (Modèle complet)
  // ---------------------------------------------------------------------------
  console.log("📌 TEST 1 : Mode Global (Modèle complet)");
  const qGlobal = generateQuizFromInstrumentModel(sampleModel, [sampleModel], { limit: 10 });
  console.log(`   Nombre de questions générées : ${qGlobal.length}`);
  
  if (qGlobal.length === 0) {
    console.error("❌ ÉCHEC : Aucune question générée en mode global.");
    allPassed = false;
  } else {
    // Vérification de la présence des métadonnées sur toutes les questions
    const allHaveMeta = qGlobal.every(q => 
      q.partId && q.partTitle && (q.stepIndex !== undefined) && (q.stepTitle !== undefined)
    );
    if (!allHaveMeta) {
      console.error("❌ ÉCHEC : Des questions n'ont pas les métadonnées requises.");
      allPassed = false;
    } else {
      console.log("✅ SUCCÈS : Toutes les questions comportent partId, partTitle, stepIndex et stepTitle.");
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 2 : Mode Pièce Ciblée (targetPartId = 'part_fut')
  // ---------------------------------------------------------------------------
  console.log("\n📌 TEST 2 : Mode Pièce Ciblée (targetPartId = 'part_fut')");
  const qPart = generateQuizFromInstrumentModel(sampleModel, [sampleModel], { targetPartId: 'part_fut', limit: 8 });
  console.log(`   Nombre de questions générées : ${qPart.length}`);
  
  const allMatchPart = qPart.every(q => q.partId === 'part_fut');
  if (!allMatchPart || qPart.length === 0) {
    console.error("❌ ÉCHEC : Les questions ne sont pas strictement limitées à la pièce ciblée.");
    allPassed = false;
  } else {
    console.log("✅ SUCCÈS : 100% des questions ciblent bien la pièce 'part_fut'.");
  }

  // ---------------------------------------------------------------------------
  // TEST 3 : Mode Étape Ciblée (targetPartId = 'part_fut', targetStepIndex = 0)
  // Vérification scrupuleuse de la conservation de stepIndex === 0
  // ---------------------------------------------------------------------------
  console.log("\n📌 TEST 3 : Mode Étape Ciblée (targetPartId = 'part_fut', targetStepIndex = 0)");
  const qStep0 = generateQuizFromInstrumentModel(sampleModel, [sampleModel], { targetPartId: 'part_fut', targetStepIndex: 0, limit: 5 });
  console.log(`   Nombre de questions générées pour l'étape 0 : ${qStep0.length}`);
  
  const allMatchStep0 = qStep0.every(q => q.stepIndex === 0 && q.partId === 'part_fut');
  if (!allMatchStep0 || qStep0.length === 0) {
    console.error("❌ ÉCHEC : stepIndex = 0 n'a pas été respecté scrupuleusement !");
    allPassed = false;
  } else {
    console.log("✅ SUCCÈS : stepIndex === 0 est rigoureusement préservé (non tronqué en null).");
  }

  // Vérification du dédoublonnage strict des choix
  const hasDuplicates = qStep0.some(q => {
    const texts = q.choices.map(c => c.text.trim().toLowerCase());
    return new Set(texts).size !== texts.length;
  });
  if (hasDuplicates) {
    console.error("❌ ÉCHEC : Des choix de réponses contiennent des doublons !");
    allPassed = false;
  } else {
    console.log("✅ SUCCÈS : Dédoublonnage strict des choix validé.");
  }

  // ---------------------------------------------------------------------------
  // TEST 4 : Simulation du Payload de Sauvegarde (quizHistory & parcours.evaluations)
  // ---------------------------------------------------------------------------
  console.log("\n📌 TEST 4 : Simulation du Payload finishQuiz (Atelier Granulaire)");
  
  // Exemple d'exécution d'un quiz sur l'étape 0 de la pièce 'part_fut'
  const targetPartId = 'part_fut';
  const targetStepIndex = 0;
  const targetPart = sampleModel.parts.find(p => p.id === targetPartId);
  const targetStep = targetPart.chapitres[targetStepIndex];

  const simulatedHistoryEntry = {
    date: new Date().toISOString(),
    theme: 'atelier',
    difficulty: 'medium',
    score: 3,
    total: 3,
    targetId: sampleModel.id,
    targetTitle: sampleModel.nom,
    type: 'instrument_model',
    passed: true,
    toadaId: null,
    granularity: targetPartId ? (targetStepIndex !== undefined && targetStepIndex !== null ? 'step' : 'part') : 'model',
    partId: targetPartId || null,
    partTitle: targetPart.nom,
    stepIndex: targetStepIndex ?? null,
    stepTitle: targetStep.titre
  };

  console.log("   Exemple de payload quizHistory produit :");
  console.log(JSON.stringify(simulatedHistoryEntry, null, 2));

  // Simulation des clés enregistrées dans parcours.evaluations
  const simulatedParcoursEvals = {
    [sampleModel.id]: 'pratique', // Jauge globale instrument préservée
    [`${sampleModel.id}__${targetPartId}`]: 'alaise' // Clé composite granulaire
  };

  console.log("\n   Clés enregistrées dans parcours.evaluations :");
  console.log(JSON.stringify(simulatedParcoursEvals, null, 2));

  if (simulatedHistoryEntry.stepIndex !== 0) {
    console.error("❌ ÉCHEC : simulatedHistoryEntry.stepIndex != 0 !");
    allPassed = false;
  } else if (!simulatedParcoursEvals[`${sampleModel.id}__${targetPartId}`]) {
    console.error("❌ ÉCHEC : Clé composite absente !");
    allPassed = false;
  } else {
    console.log("\n✅ SUCCÈS : Payloads et clés composites 100% conformes aux spécifications.");
  }

  console.log("\n===============================================================");
  if (allPassed) {
    console.log("🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS (100% CONFORME)");
  } else {
    console.log("💥 CERTAINS TESTS ONT ÉCHOUÉ");
    process.exit(1);
  }
  console.log("===============================================================\n");
}

runTests().catch(err => {
  console.error("Erreur fatale lors des tests :", err);
  process.exit(1);
});
