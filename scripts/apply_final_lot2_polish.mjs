// Polissage final chirurgical pour les 21 fichiers restants du Lot 2
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
    .replace(/>\s*maîtrisé\s*</g, ">{t('pedagogy.carnet.maitriseMinuscule')}<")
    .replace(/>\s*palier\s*</g, ">{t('pedagogy.carnet.palier')}<")
    .replace(`: "S'entraîner maintenant"`, `: t('pedagogy.carnet.sEntrainerMaintenant')`)
    .replace(`: 'S\\'entraîner maintenant'`, `: t('pedagogy.carnet.sEntrainerMaintenant')`)
    .replace(/>\s*Réflexes & Conventions\s*</g, ">{t('pedagogy.carnet.reflexesConventions')}<")
    .replace(/>\s*signaux validés \(Maîtrisé\)\s*</g, ">{t('pedagogy.carnet.signauxValidesMaitrise')}<")
    .replace(/>\s*signaux validés\s*</g, ">{t('pedagogy.carnet.signauxValides')}<")
    .replace(
      /💃 Évalue ton aisance chorégraphique sur chacun des rythmes[\s\S]*?visuellement\./,
      `{t('pedagogy.carnet.evalueTonAisanceChoregraphique')}`
    );
});

// 2. AutoEvalQuiz.jsx
updateFile('src/components/pedagogy/AutoEvalQuiz.jsx', (code) => {
  return code
    .replace(/>\s*🧠 Quiz :\s*</g, ">{t('pedagogy.progress.quiz')}<")
    .replace(/>\s*Tu as obtenu\s*</g, ">{t('pedagogy.progress.tuAsObtenu')}<")
    .replace(/>\s*bonne\(s\) réponse\(s\) sur\s*</g, ">{t('pedagogy.progress.bonnesReponsesSur')}<");
});

// 3. MestreToadasAnalytics.jsx
updateFile('src/components/pedagogy/MestreToadasAnalytics.jsx', (code) => {
  return code
    .replace(
      /Vue consolidée des scores d'auto-évaluation[\s\S]*?Expert = max 100%\)\./,
      `{t('pedagogy.progress.vueConsolideeDesScores')}`
    )
    .replace(/>\s*Priorité #\s*</g, ">{t('pedagogy.progress.priorite')}<")
    .replace(/>\s*Score global :\s*</g, ">{t('pedagogy.progress.scoreGlobal')}<")
    .replace(/>\s*demande\s*</g, ">{t('pedagogy.progress.demande')}<")
    .replace(/>\s*d'élèves\s*</g, ">{t('pedagogy.progress.dEleves')}<");
});

// 4. AtelierModelPartsProgress.jsx
updateFile('src/components/pedagogy/AtelierModelPartsProgress.jsx', (code) => {
  return code
    .replace(`Nomenclature & Pièces usinées (`, `{t('pedagogy.cards.nomenclaturePiecesUsinees')}`)
    .replace(/>\s*maîtrisée\s*</g, ">{t('pedagogy.cards.maitrisee')}<")
    .replace(/>\s*étape\s*</g, ">{t('pedagogy.cards.etape')}<")
    .replace(/>\s*d'usinage\s*</g, ">{t('pedagogy.cards.dUsinage')}<")
    .replace(/>\s*• Mat\. :\s*</g, ">{t('pedagogy.cards.mat')}<");
});

// 5. CultureFichesTable.jsx
updateFile('src/components/pedagogy/CultureFichesTable.jsx', (code) => {
  return code
    .replace(`Tous (`, `{t('pedagogy.progress.tous')}`)
    .replace(`Aucune fiche culturelle trouvée pour cette thématique (`, `{t('pedagogy.progress.aucuneFicheCulturelleTrouvee')}`);
});

// 6. DanseChoregraphieAnalytics.jsx
updateFile('src/components/pedagogy/DanseChoregraphieAnalytics.jsx', (code) => {
  return code
    .replace(`Chorégraphies & Éléments de Danse (`, `{t('pedagogy.progress.choregraphiesElementsDeDanse')}`)
    .replace(/>\s*adhérent\s*</g, ">{t('pedagogy.progress.adherent')}<");
});

// 7. DanseItemRow.jsx
updateFile('src/components/pedagogy/DanseItemRow.jsx', (code) => {
  return code.replace(/>\s*figures\s*</g, ">{t('pedagogy.progress.figures')}<");
});

// 8. EntrainementMacroAnalytics.jsx
updateFile('src/components/pedagogy/EntrainementMacroAnalytics.jsx', (code) => {
  return code
    .replace(`Tous les pupitres (`, `{t('pedagogy.carnet.tousLesPupitres')}`)
    .replace(/>\s*membres engagés\s*</g, ">{t('pedagogy.carnet.membresEngages')}<")
    .replace(/>\s*Sur\s*</g, ">{t('pedagogy.carnet.sur')}<")
    .replace(/>\s*morceau\s*</g, ">{t('pedagogy.carnet.morceau')}<")
    .replace(/>\s*actif\s*</g, ">{t('pedagogy.carnet.actif')}<")
    .replace(/>\s*paliers\)\s*</g, ">{t('pedagogy.carnet.paliersFermante')}<");
});

// 9. EntrainementSegmentsBar.jsx
updateFile('src/components/pedagogy/EntrainementSegmentsBar.jsx', (code) => {
  return code
    .replace(/>\s*adhérents\s*</g, ">{t('pedagogy.carnet.adherents')}<")
    .replace(/>\s*membre\s*</g, ">{t('pedagogy.carnet.membre')}<");
});

// 10. PedagogyDocumentsView.jsx
updateFile('src/components/pedagogy/PedagogyDocumentsView.jsx', (code) => {
  return code
    .replace(`🎵 Toadas (`, `{t('pedagogy.cards.toadasParenthese')}`)
    .replace(`📖 Culture & Histoire (`, `{t('pedagogy.cards.cultureHistoireParenthese')}`);
});

// 11. PercussionPieceRow.jsx
updateFile('src/components/pedagogy/PercussionPieceRow.jsx', (code) => {
  return code
    .replace(/>\s*var\.\s*</g, ">{t('pedagogy.progress.varAbrev')}<")
    .replace(`Détail des Variations & Conventions (`, `{t('pedagogy.progress.detailDesVariations')}`);
});

// 12. PercussionRepertoireAnalytics.jsx
updateFile('src/components/pedagogy/PercussionRepertoireAnalytics.jsx', (code) => {
  return code
    .replace(`Matrice Percussion de Saison (`, `{t('pedagogy.progress.matricePercussionDeSaison')}`)
    .replace(/>\s*morceaux\)\s*</g, ">{t('pedagogy.progress.morceauxFermante')}<")
    .replace(/>\s*< 50% Fragile\s*</g, ">{t('pedagogy.progress.taux50Fragile')}<")
    .replace(/>\s*Détail & Actions\s*</g, ">{t('pedagogy.progress.detailEtActions')}<");
});

// 13. QcmSignaux.jsx
updateFile('src/components/pedagogy/QcmSignaux.jsx', (code) => {
  return code
    .replace(/>\s*Question\s*</g, ">{t('pedagogy.reflex.question')}<")
    .replace(`: "Signal du Mestre"`, `: t('pedagogy.reflex.signalDuMestre')`)
    .replace(`: 'Signal du Mestre'`, `: t('pedagogy.reflex.signalDuMestre')`);
});

// 14. QuizDistractorManager.jsx
updateFile('src/components/pedagogy/QuizDistractorManager.jsx', (code) => {
  return code.replace(
    /Gérez les fausses réponses \(distracteurs\)[\s\S]*?QCM variés !/,
    `{t('pedagogy.progress.gerezLesFaussesReponses')}`
  );
});

// 15. ReflexGameModal.jsx
updateFile('src/components/pedagogy/ReflexGameModal.jsx', (code) => {
  return code
    .replace(
      /Le Mestre peut configurer les signaux et conventions depuis le panneau « Mestria > Répertoire »\./,
      `{t('pedagogy.reflex.leMestrePeutConfigurer')}`
    )
    .replace(/>\s*défi\s*</g, ">{t('pedagogy.reflex.defi')}<")
    .replace(/>\s*« Temps 1 »\s*</g, ">{t('pedagogy.reflex.temps1')}<")
    .replace(`: "▶ Lancer l'écoute"`, `: t('pedagogy.reflex.lancerLEcoute')`)
    .replace(`: '▶ Lancer l\\'écoute'`, `: t('pedagogy.reflex.lancerLEcoute')`);
});

// 16. TrainingCompactCard.jsx
updateFile('src/components/pedagogy/TrainingCompactCard.jsx', (code) => {
  return code
    .replace(/>\s*Cible :\s*</g, ">{t('pedagogy.carnet.cible')}<")
    .replace(/>\s*BPM •\s*</g, ">{t('pedagogy.carnet.bpmSeparateur')}<")
    .replace(/>\s*palier\s*</g, ">{t('pedagogy.carnet.palier')}<");
});

// 17. ConductorAudioPlayer.jsx
updateFile('src/components/pedagogy/conductor/ConductorAudioPlayer.jsx', (code) => {
  return code
    .replace(`: "Prêt à l'écoute"`, `: t('pedagogy.reflex.pretALEcoute')`)
    .replace(`: 'Prêt à l\\'écoute'`, `: t('pedagogy.reflex.pretALEcoute')`);
});

// 18. ConductorSignalPickerSheet.jsx
updateFile('src/components/pedagogy/conductor/ConductorSignalPickerSheet.jsx', (code) => {
  return code
    .replace(`Signal à la Mesure`, `{t('pedagogy.reflex.signalALaMesure')}`)
    .replace(`Retirer le signal de la mesure`, `{t('pedagogy.reflex.retirerLeSignalDeLa')}`);
});

// 19. ConductorTimeline.jsx
updateFile('src/components/pedagogy/conductor/ConductorTimeline.jsx', (code) => {
  return code
    .replace(`Frise Chronologique (`, `{t('pedagogy.reflex.friseChronologique')}`)
    .replace(/>\s*mesures\)\s*</g, ">{t('pedagogy.reflex.mesuresFermante')}<");
});

// 20. ReflexGameBoard.jsx
updateFile('src/components/pedagogy/reflex/ReflexGameBoard.jsx', (code) => {
  return code.replace(/>\s*Option\s*</g, ">{t('pedagogy.reflex.option')}<");
});

// 21. CultureCard.jsx
updateFile('src/components/CultureCard.jsx', (code) => {
  return code
    .replace(/>\s*🌿 Élément :\s*</g, ">{t('pedagogy.cards.element')}<")
    .replace(/>\s*⚔️ Symboles :\s*</g, ">{t('pedagogy.cards.symboles')}<");
});
