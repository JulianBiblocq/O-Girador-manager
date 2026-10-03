import fs from 'fs';
import path from 'path';

function updateFile(relPath, fn) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Fichier introuvable : ${relPath}`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const updated = fn(content);
  if (content !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✅ Mis à jour : ${relPath}`);
  } else {
    console.log(`⚠️ Pas de changement : ${relPath}`);
  }
}

// 1. MonCarnetAisance.jsx
updateFile('src/components/pedagogy/MonCarnetAisance.jsx', (code) => {
  return code
    .replace(/maîtrisé(\{activeSeasonTrainings\.length > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.maitriseMinuscule')}$1")
    .replace(/palier(\{stages\.length > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.palier')}$1")
    .replace(/Réflexes &amp; Conventions/g, "{t('pedagogy.carnet.reflexesConventions')}")
    .replace(/signaux validés \(Maîtrisé\)/g, "{t('pedagogy.carnet.signauxValidesMaitrise')}")
    .replace(/signaux validés/g, "{t('pedagogy.carnet.signauxValides')}");
});

// 2. AutoEvalQuiz.jsx
updateFile('src/components/pedagogy/AutoEvalQuiz.jsx', (code) => {
  return code
    .replace(/🧠 Quiz : /g, "{t('pedagogy.progress.quiz')} ")
    .replace(
      /Tu as obtenu \{score\} bonne\(s\) réponse\(s\) sur \{questions\.length\} !/g,
      "{t('pedagogy.progress.tuAsObtenu')} {score} {t('pedagogy.progress.bonnesReponsesSur')} {questions.length} !"
    );
});

// 3. MestreToadasAnalytics.jsx
updateFile('src/components/pedagogy/MestreToadasAnalytics.jsx', (code) => {
  return code
    .replace(/Priorité #\{i \+ 1\}/g, "{t('pedagogy.progress.priorite')}{i + 1}")
    .replace(/Score global : \{t\.globalScore\}%/g, "{t('pedagogy.progress.scoreGlobal')} {t.globalScore}%")
    .replace(/demande(\{reqCount > 1 \? 's' : ''\}) d'élèves/g, "{t('pedagogy.progress.demande')}$1 {t('pedagogy.progress.dEleves')}")
    .replace(/demande(\{revisionsCountMap\[row\.songId\] > 1 \? 's' : ''\})/g, "{t('pedagogy.progress.demande')}$1");
});

// 4. AtelierModelPartsProgress.jsx
updateFile('src/components/pedagogy/AtelierModelPartsProgress.jsx', (code) => {
  return code
    .replace(/Nomenclature &amp; Pièces usinées \(\{parts\.length\}\)/g, "{t('pedagogy.cards.nomenclaturePiecesUsinees')}{parts.length})")
    .replace(/maîtrisée(\{evaluatedPartsCount > 1 \? 's' : ''\})/g, "{t('pedagogy.cards.maitrisee')}$1")
    .replace(/⚙️ \{steps\.length\} étape(\{steps\.length > 1 \? 's' : ''\}) d'usinage/g, "⚙️ {steps.length} {t('pedagogy.cards.etape')}$1 {t('pedagogy.cards.dUsinage')}")
    .replace(/• Mat\. : /g, "{t('pedagogy.cards.mat')} ");
});

// 5. DanseChoregraphieAnalytics.jsx
updateFile('src/components/pedagogy/DanseChoregraphieAnalytics.jsx', (code) => {
  return code
    .replace(/Chorégraphies &amp; Éléments de Danse \(\{itemsWithScores\.length\}\)/g, "{t('pedagogy.progress.choregraphiesElementsDeDanse')}{itemsWithScores.length})")
    .replace(/\{danseUsers\.length\} adhérent(\{danseUsers\.length > 1 \? 's' : ''\}) Danse/g, "{danseUsers.length} {t('pedagogy.progress.adherent')}$1 Danse");
});

// 6. DanseItemRow.jsx
updateFile('src/components/pedagogy/DanseItemRow.jsx', (code) => {
  return code.replace(/\{item\.figures\.length\} figures/g, "{item.figures.length} {t('pedagogy.progress.figures')}");
});

// 7. EntrainementMacroAnalytics.jsx
updateFile('src/components/pedagogy/EntrainementMacroAnalytics.jsx', (code) => {
  return code
    .replace(/\{metrics\.activeCount\} \/ \{totalMembers\} membres engagés/g, "{metrics.activeCount} / {totalMembers} {t('pedagogy.carnet.membresEngages')}")
    .replace(
      /Sur \{resolvedTrainings\.length\} morceau(\{resolvedTrainings\.length > 1 \? 'x' : ''\}) actif(\{resolvedTrainings\.length > 1 \? 's' : ''\})/g,
      "{t('pedagogy.carnet.sur')} {resolvedTrainings.length} {t('pedagogy.carnet.morceau')}$1 {t('pedagogy.carnet.actif')}$2"
    )
    .replace(/\(\{stagesCount\} paliers\)/g, "({stagesCount} {t('pedagogy.carnet.paliersFermante')}");
});

// 8. EntrainementSegmentsBar.jsx
updateFile('src/components/pedagogy/EntrainementSegmentsBar.jsx', (code) => {
  return code
    .replace(/\{totalMembers\} adhérents/g, "{totalMembers} {t('pedagogy.carnet.adherents')}")
    .replace(/membre(\{segments\.decouverte > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.membre')}$1")
    .replace(/membre(\{segments\.pratique > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.membre')}$1")
    .replace(/membre(\{segments\.alaise > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.membre')}$1")
    .replace(/membre(\{segments\.referent > 1 \? 's' : ''\})/g, "{t('pedagogy.carnet.membre')}$1");
});

// 9. PercussionPieceRow.jsx
updateFile('src/components/pedagogy/PercussionPieceRow.jsx', (code) => {
  return code
    .replace(/\{variations\.length\} var\./g, "{variations.length} {t('pedagogy.progress.varAbrev')}")
    .replace(/Détail des Variations &amp; Conventions \(\{variations\.length\}\) :/g, "{t('pedagogy.progress.detailDesVariations')}{variations.length}) :");
});

// 10. PercussionRepertoireAnalytics.jsx
updateFile('src/components/pedagogy/PercussionRepertoireAnalytics.jsx', (code) => {
  return code
    .replace(/\{seasonPieces\.length\} morceaux\)/g, "{seasonPieces.length} {t('pedagogy.progress.morceauxFermante')}")
    .replace(/&lt; 50% Fragile/g, "{t('pedagogy.progress.taux50Fragile')}")
    .replace(/Détail &amp; Actions/g, "{t('pedagogy.progress.detailEtActions')}");
});

// 11. QcmSignaux.jsx
updateFile('src/components/pedagogy/QcmSignaux.jsx', (code) => {
  return code
    .replace(/Question \{currentIndex \+ 1\} \/ \{questions\.length\}/g, "{t('pedagogy.reflex.question')} {currentIndex + 1} / {questions.length}")
    .replace(/"Signal du Mestre"/g, "t('pedagogy.reflex.signalDuMestre')");
});

// 12. ReflexGameModal.jsx
updateFile('src/components/pedagogy/ReflexGameModal.jsx', (code) => {
  return code
    .replace(/Le Mestre peut configurer les signaux et conventions depuis le panneau « Mestria &gt; Répertoire »\./g, "{t('pedagogy.reflex.leMestrePeutConfigurer')}")
    .replace(/\{interactiveSignals\.length\} défi(\{interactiveSignals\.length > 1 \? 's' : ''\}) « Temps 1 »/g, "{interactiveSignals.length} {t('pedagogy.reflex.defi')}$1 {t('pedagogy.reflex.temps1')}");
});

// 13. TrainingCompactCard.jsx
updateFile('src/components/pedagogy/TrainingCompactCard.jsx', (code) => {
  return code
    .replace(/Cible : \{t\.targetBpm\} BPM/g, "{t('pedagogy.carnet.cible')} {t.targetBpm} BPM")
    .replace(
      /\{t\.startBpm\} ➔ \{t\.targetBpm\} BPM • \{t\.stagesCount \|\| stages\.length\} palier/g,
      "{t.startBpm} ➔ {t.targetBpm} {t('pedagogy.carnet.bpmSeparateur')} {t.stagesCount || stages.length} {t('pedagogy.carnet.palier')}"
    );
});

// 14. ConductorTimeline.jsx
updateFile('src/components/pedagogy/conductor/ConductorTimeline.jsx', (code) => {
  return code.replace(/\{totalMeasures\} mesures\)/g, "{totalMeasures} {t('pedagogy.reflex.mesuresFermante')}");
});

// 15. ReflexGameBoard.jsx
updateFile('src/components/pedagogy/reflex/ReflexGameBoard.jsx', (code) => {
  return code.replace(/Option \{idx \+ 1\}/g, "{t('pedagogy.reflex.option')} {idx + 1}");
});

// 16. CultureCard.jsx
updateFile('src/components/CultureCard.jsx', (code) => {
  return code
    .replace(/🌿 Élément : /g, "{t('pedagogy.cards.element')} ")
    .replace(/⚔️ Symboles : /g, "{t('pedagogy.cards.symboles')} ");
});
