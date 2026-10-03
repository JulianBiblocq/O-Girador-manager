/**
 * Application automatique des traductions Pédagogie Lot 1
 * 27 fichiers cibles / 160 chaînes brutes
 *
 * Sous-périmètre 2 : Espace Élève (5 fichiers)
 * Sous-périmètre 3 : Modales d'Apprentissage (8 fichiers)
 * Sous-périmètre 4 : Administration Mestria (12 fichiers)
 * Sous-périmètre 5 : Moteurs & Évaluation (2 fichiers)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function ensureUseTranslation(content, importRelativePath = '../LanguageContext') {
  let modified = content;

  // 1. Vérifier l'import
  if (!modified.includes('useTranslation')) {
    const importRegex = /import\s+[^;]+;\n/;
    const match = modified.match(importRegex);
    if (match) {
      modified = modified.replace(match[0], `${match[0]}import { useTranslation } from '${importRelativePath}';\n`);
    } else {
      modified = `import { useTranslation } from '${importRelativePath}';\n` + modified;
    }
  }

  // 2. Vérifier l'instanciation const { t } = useTranslation();
  if (!modified.includes('const { t } = useTranslation()') && !modified.includes('const { t,') && !modified.includes('{ t } = useTranslation')) {
    const fnRegex = /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/;
    const fnMatch = modified.match(fnRegex);
    if (fnMatch) {
      modified = modified.replace(fnMatch[0], `${fnMatch[0]}\n  const { t } = useTranslation();`);
    } else {
      const arrowRegex = /(export\s+const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
      const arrowMatch = modified.match(arrowRegex);
      if (arrowMatch) {
        modified = modified.replace(arrowMatch[0], `${arrowMatch[0]}\n  const { t } = useTranslation();`);
      }
    }
  }

  return modified;
}

// Map des transformations spécifiques par fichier
const fileTransforms = [
  // ==========================================
  // PÉRIMÈTRE 2 : ESPACE ÉLÈVE (5 fichiers)
  // ==========================================
  {
    file: 'src/components/student/AutoEvalQuizContainer.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`alert("Pas assez de données pour générer ce type de quiz.");`, `alert(t('pedagogy.student.notEnoughData'));`);
      res = res.replace(`{step !== 'HOME' && !isExamMode ? "Retour" : "✕ Quitter"}`, `{step !== 'HOME' && !isExamMode ? t('pedagogy.student.back') : "✕ Quitter"}`);
      res = res.replace(`Auto-évaluation\n`, `{t('pedagogy.student.autoEvaluation')}\n`);
      res = res.replace(`Auto-évaluation\r\n`, `{t('pedagogy.student.autoEvaluation')}\r\n`);
      res = res.replace(`Testez vos connaissances sur le répertoire, le vocabulaire et la culture de notre Nação.`, `{t('pedagogy.student.testezVosConnaissancesSur')}`);
      res = res.replace(`<strong>Où réviser avant de se tester ?</strong><br/>\n              Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !`,
        `<strong>{t('pedagogy.student.ouReviserAvantDe')}</strong><br/>\n              {t('pedagogy.student.toutLeMaterielPedagogique')} <strong>{t('pedagogy.student.varalsCordesALinge')}</strong> {t('pedagogy.student.situesToutEnBas')}`);
      res = res.replace(`<strong>Où réviser avant de se tester ?</strong><br/>\r\n              Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !`,
        `<strong>{t('pedagogy.student.ouReviserAvantDe')}</strong><br/>\r\n              {t('pedagogy.student.toutLeMaterielPedagogique')} <strong>{t('pedagogy.student.varalsCordesALinge')}</strong> {t('pedagogy.student.situesToutEnBas')}`);
      res = res.replace(`Défi du jour\n`, `{t('pedagogy.student.defiDuJour')}\n`);
      res = res.replace(`Défi du jour\r\n`, `{t('pedagogy.student.defiDuJour')}\r\n`);
      res = res.replace(`Un mélange de toutes les thématiques pour réviser efficacement !`, `{t('pedagogy.student.unMelangeDeToutes')}`);
      res = res.replace(`🚀 Lancer le Défi Mix (`, `{t('pedagogy.student.lancerLeDefiMix')}`);
      res = res.replace(`Entraînement par Thème\n`, `{t('pedagogy.student.entrainementParTheme')}\n`);
      res = res.replace(`Entraînement par Thème\r\n`, `{t('pedagogy.student.entrainementParTheme')}\r\n`);
      res = res.replace(`🌱 Débutant`, `{t('pedagogy.student.debutant')}`);
      res = res.replace(`🥁 Confirmé`, `{t('pedagogy.student.confirme')}`);
      res = res.replace(`🏆 Expert`, `{t('pedagogy.student.expert')}`);
      res = res.replace(`🎤 Toadas (Progression)`, `{t('pedagogy.student.toadasProgression')}`);
      res = res.replace(`Réviser le répertoire et suivre votre jauge de Nação.`, `{t('pedagogy.student.reviserLeRepertoireEt')}`);
      res = res.replace(`🇧🇷 Traduction`, `{t('pedagogy.student.traduction')}`);
      res = res.replace(`Tester votre vocabulaire (Français / Portugais).`, `{t('pedagogy.student.testerVotreVocabulaireFrancais')}`);
      res = res.replace(`📚 Culture`, `{t('pedagogy.student.culture')}`);
      res = res.replace(`Questions sur l'histoire et les fondamentaux.`, `{t('pedagogy.student.questionsSurLHistoire')}`);
      res = res.replace(`🛠️ Atelier`, `{t('pedagogy.student.atelier')}`);
      res = res.replace(`Révisions techniques sur la couture et fabrication.`, `{t('pedagogy.student.revisionsTechniquesSurLa')}`);
      res = res.replace(`💃 Danse (Dançador)`, `{t('pedagogy.student.danseDancador')}`);
      res = res.replace(`Reconnaissance visuelle des pas et familles.`, `{t('pedagogy.student.reconnaissanceVisuelleDesPas')}`);
      res = res.replace(`Génération du QCM en cours...`, `{t('pedagogy.student.generationDuQcmEn')}`);
      res = res.replace(`alt="Illustration de la question"`, `alt={t('pedagogy.student.illustrationDeLaQuestion')}`);
      res = res.replace(`isSuccess ? "✅ Bien joué !" : "🌱 Presque !"`, `isSuccess ? t('pedagogy.student.bienJoue') : t('pedagogy.student.presque')`);
      res = res.replace(`La bonne réponse était :`, `{t('pedagogy.student.laBonneReponseEtait')}`);
      res = res.replace(`Bilan du Quiz\n`, `{t('pedagogy.student.bilanDuQuiz')}\n`);
      res = res.replace(`Bilan du Quiz\r\n`, `{t('pedagogy.student.bilanDuQuiz')}\r\n`);
      res = res.replace(`Enregistrement du score...`, `{t('pedagogy.student.enregistrementDuScore')}`);
      res = res.replace(`À réviser :`, `{t('pedagogy.student.aReviser')}`);
      res = res.replace(`{isExamMode ? "Terminer" : "Retour à l'Accueil"}`, `{isExamMode ? t('pedagogy.student.terminer') : t('pedagogy.student.retourALAccueil')}`);
      return res;
    }
  },
  {
    file: 'src/components/student/FirestoreMediaRenderer.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Chargement du média...`, `{t('pedagogy.student.chargementDuMedia')}`);
      res = res.replace(`Erreur : {error}`, `{t('pedagogy.student.erreur')} {error}`);
      res = res.replace(`Visuel : {trackName}`, `{t('pedagogy.student.visuel')} {trackName}`);
      res = res.replace(`Aucun aperçu disponible pour ce média.`, `{t('pedagogy.student.aucunApercuDisponiblePour')}`);
      return res;
    }
  },
  {
    file: 'src/components/student/StudentToadasProgress.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Maîtrise de la Nação\n`, `{t('pedagogy.student.maitriseDeLaNacao')}\n`);
      res = res.replace(`Maîtrise de la Nação\r\n`, `{t('pedagogy.student.maitriseDeLaNacao')}\r\n`);
      res = res.replace(`Progression globale basée sur vos auto-évaluations ciblées par Toada.`, `{t('pedagogy.student.progressionGlobaleBaseeSur')}`);
      res = res.replace(`<strong>Où écouter et lire les toadas ?</strong><br/>\n              Avant de tester tes connaissances, retrouve tous les chants (audios, paroles, traductions) dans le <strong>Varal des Toadas</strong>, situé tout en bas de la page d'accueil !`,
        `<strong>{t('pedagogy.student.ouEcouterEtLire')}</strong><br/>\n              {t('pedagogy.student.avantDeTesterTes')} <strong>{t('pedagogy.student.varalDesToadas')}</strong>{t('pedagogy.student.situeToutEnBas')}`);
      res = res.replace(`<strong>Où écouter et lire les toadas ?</strong><br/>\r\n              Avant de tester tes connaissances, retrouve tous les chants (audios, paroles, traductions) dans le <strong>Varal des Toadas</strong>, situé tout en bas de la page d'accueil !`,
        `<strong>{t('pedagogy.student.ouEcouterEtLire')}</strong><br/>\r\n              {t('pedagogy.student.avantDeTesterTes')} <strong>{t('pedagogy.student.varalDesToadas')}</strong>{t('pedagogy.student.situeToutEnBas')}`);
      res = res.replace(`Novice</span>`, `{t('pedagogy.student.novice')}</span>`);
      res = res.replace(`Détail du Répertoire ({activeSongs.length} Chants)`, `{t('pedagogy.student.detailDuRepertoire')}{activeSongs.length} {t('pedagogy.student.chants')}`);
      res = res.replace(`🎯 Réviser ce chant`, `{t('pedagogy.student.reviserCeChant')}`);
      res = res.replace(`Aucune Toada trouvée dans le répertoire actif.`, `{t('pedagogy.student.aucuneToadaTrouveeDans')}`);
      return res;
    }
  },
  {
    file: 'src/components/profile/StudentInstrumentsWorkshop.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`{model?.nom || 'Inconnu'}`, `{model?.nom || t('pedagogy.student.inconnu')}`);
      res = res.replace(`{model?.nom || 'Instrument'}`, `{model?.nom || t('pedagogy.student.instrument')}`);
      return res;
    }
  },
  {
    file: 'src/components/profile/PieceTutorialModal.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`🧵 Fiche Livret Atelier Couture`, `{t('pedagogy.student.ficheLivretAtelierCouture')}`);
      res = res.replace(`Coût : {cost} €`, `{t('pedagogy.student.cout')} {cost} €`);
      res = res.replace(`title="Fermer (Échap)"`, `title={t('pedagogy.student.fermerEchap')}`);
      res = res.replace(`Élément de costume :`, `{t('pedagogy.student.elementDeCostume')}`);
      res = res.replace(`★ Obligatoire`, `{t('pedagogy.student.obligatoire')}`);
      res = res.replace(`Optionnel</span>`, `{t('pedagogy.student.optionnel')}</span>`);
      res = res.replace(`<strong>Remarque / Matériaux spécifiques :</strong>`, `<strong>{t('pedagogy.student.remarqueMateriauxSpecifiques')}</strong>`);
      res = res.replace(`🧵 Matériel Nécessaire`, `{t('pedagogy.student.materielNecessaire')}`);
      res = res.replace(`📜 Étapes de Fabrication pas à pas`, `{t('pedagogy.student.etapesDeFabricationPas')}`);
      res = res.replace(`🎬 Vidéo de démonstration pas à pas`, `{t('pedagogy.student.videoDeDemonstrationPas')}`);
      res = res.replace(`title="Vidéo tutoriel"`, `title={t('pedagogy.student.videoTutoriel')}`);
      res = res.replace(`🖼️ Photos & Schémas de Montage ({images.length})`, `{t('pedagogy.student.photosSchemasDeMontage')}{images.length})`);
      res = res.replace(`🔍 Voir l'image`, `{t('pedagogy.student.voirLImage')}`);
      res = res.replace(`📄 Documents Joints (PDF)`, `{t('pedagogy.student.documentsJointsPdf')}`);
      res = res.replace(`Ouvrir ↗`, `{t('pedagogy.student.ouvrir')}`);
      res = res.replace(`Fermer la fiche`, `{t('pedagogy.student.fermerLaFiche')}`);
      return res;
    }
  },

  // ==========================================
  // PÉRIMÈTRE 3 : MODALES D'APPRENTISSAGE (8 fichiers)
  // ==========================================
  {
    file: 'src/components/member/PieceLyricsModal.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Aucune parole renseignée pour ce morceau.`, `{t('pedagogy.modals.aucuneParoleRenseigneePour')}`);
      res = res.replace(`>Fermer</CordelButton>`, `>{t('pedagogy.modals.fermer')}</CordelButton>`);
      res = res.replace(`Paroles du morceau`, `{t('pedagogy.modals.parolesDuMorceau')}`);
      return res;
    }
  },
  {
    file: 'src/components/member/PieceCultureModal.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Aucune notice culturelle rédigée pour l'instant.`, `{t('pedagogy.modals.aucuneNoticeCulturelleRedigee')}`);
      res = res.replace(`Origine & Contexte culturel`, `{t('pedagogy.modals.origineContexteCulturel')}`);
      res = res.replace(`Fiches ({piece.cultureFiches.length})`, `{t('pedagogy.modals.fiches')}{piece.cultureFiches.length})`);
      return res;
    }
  },
  {
    file: 'src/components/member/PieceSignalsModal.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Signes & Conventions du Mestre`, `{t('pedagogy.modals.signesConventionsDuMestre')}`);
      res = res.replace(`Aucun appel ou signal particulier configuré pour ce morceau.`, `{t('pedagogy.modals.aucunAppelOuSignal')}`);
      res = res.replace(`{signalsCount} convention{signalsCount > 1 ? 's' : ''} et geste{signalsCount > 1 ? 's' : ''} du Mestre`,
        `{signalsCount} {t('pedagogy.modals.convention')}{signalsCount > 1 ? 's' : ''} {t('pedagogy.modals.etGeste')}{signalsCount > 1 ? 's' : ''} {t('pedagogy.modals.duMestre')}`);
      res = res.replace(`Aide-mémoire de jeu`, `{t('pedagogy.modals.aideMemoireDeJeu')}`);
      res = res.replace(`Geste :`, `{t('pedagogy.modals.geste')} :`);
      res = res.replace(`Mesure :`, `{t('pedagogy.modals.mesure')} :`);
      return res;
    }
  },
  {
    file: 'src/components/member/PieceAisanceSection.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`{pieceTrainings.length} entraînement{pieceTrainings.length > 1 ? 's' : ''}`,
        `{pieceTrainings.length} {t('pedagogy.modals.entrainement')}{pieceTrainings.length > 1 ? 's' : ''}`);
      res = res.replace(`BPM)</span>`, `{t('pedagogy.modals.bpm')}</span>`);
      return res;
    }
  },
  {
    file: 'src/components/member/MemberPieceCard.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`label: 'Découverte'`, `label: t('pedagogy.modals.decouverte')`);
      res = res.replace(`label: 'En pratique'`, `label: t('pedagogy.modals.enPratique')`);
      res = res.replace(`label: "À l'aise"`, `label: t('pedagogy.modals.aLAise')`);
      res = res.replace(`label: 'Référent'`, `label: t('pedagogy.modals.referent')`);
      res = res.replace(`title="Mon niveau d'aisance personnel"`, `title={t('pedagogy.modals.monNiveauDAisance')}`);
      return res;
    }
  },
  {
    file: 'src/components/member/MemberPieceUnfoldedContent.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Notes du Mestre`, `{t('pedagogy.modals.notesDuMestre')}`);
      res = res.replace(`Écouter l'audio`, `{t('pedagogy.modals.ecouterLAudio')}`);
      res = res.replace(`title="Consulter les paroles complètes du chant"`, `title={t('pedagogy.modals.consulterLesParolesCompletes')}`);
      res = res.replace(`<span>Paroles</span>`, `<span>{t('pedagogy.modals.paroles')}</span>`);
      res = res.replace(`title="Consulter la fiche culturelle"`, `title={t('pedagogy.modals.consulterLaFicheCulturelle')}`);
      res = res.replace(`<span>Culture & Histoire</span>`, `<span>{t('pedagogy.modals.cultureHistoire')}</span>`);
      res = res.replace(`title="Consulter la tablature complète"`, `title={t('pedagogy.modals.consulterLaTablatureComplete')}`);
      res = res.replace(`<span>Tablature</span>`, `<span>{t('pedagogy.modals.tablature')}</span>`);
      res = res.replace(`title="Consulter l'aide-mémoire des signes du Mestre"`, `title={t('pedagogy.modals.consulterLAideMemoire')}`);
      res = res.replace(`<span>Signes du Mestre</span>`, `<span>{t('pedagogy.modals.signesDuMestre')}</span>`);
      res = res.replace(`<span>Danse :</span>`, `<span>{t('pedagogy.modals.danse')}</span>`);
      res = res.replace(`<span>Chorégraphie</span>`, `<span>{t('pedagogy.modals.choregraphie')}</span>`);
      res = res.replace(`title="Ouvrir le morceau dans le Séquenceur"`, `title={t('pedagogy.modals.ouvrirLeMorceauDans')}`);
      res = res.replace(`<span>Séquenceur</span>`, `<span>{t('pedagogy.modals.sequenceur')}</span>`);
      res = res.replace(`title="Lancer le QCM Focus Répertoire pour réviser ce morceau"`, `title={t('pedagogy.modals.lancerLeQcmFocus')}`);
      res = res.replace(`<span>Réviser ce morceau</span>`, `<span>{t('pedagogy.modals.reviserCeMorceau')}</span>`);
      return res;
    }
  },
  {
    file: 'src/components/member/MemberRepertoireHeader.jsx',
    transform(content) {
      let res = ensureUseTranslation(content, '../LanguageContext');
      res = res.replace(`Répertoire de la Saison`, `{t('pedagogy.modals.repertoireDeLaSaison')}`);
      return res;
    }
  },
  {
    file: 'src/components/member/MemberRepertoireView.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`Chargement du répertoire...`, `{t('pedagogy.modals.chargementDuRepertoire')}`);
      res = res.replace(`Aucun morceau n'est actuellement au programme de la saison.`, `{t('pedagogy.modals.aucunMorceauNEst')}`);
      return res;
    }
  },

  // ==========================================
  // PÉRIMÈTRE 4 : ADMINISTRATION MESTRIA (12 fichiers)
  // ==========================================
  {
    file: 'src/components/mestre/MestrePedagogyDashboard.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`purgingE2E ? '⏳ Purge en cours...' : '🗑️ Purger de la base'`,
        `purgingE2E ? t('pedagogy.admin.purgeEnCours') : t('pedagogy.admin.purgerDeLaBase')`);
      res = res.replace(`purgingE2E ? '⏳ Purge en cours...' : '🗑️ Purger les artefacts E2E de Firestore'`,
        `purgingE2E ? t('pedagogy.admin.purgeEnCours') : t('pedagogy.admin.purgerLesArtefactsE2e')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/MestrePedagogyNotepad.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`{selectedNotes.size > 1 ? 'ont' : 'a'}`, `{selectedNotes.size > 1 ? t('pedagogy.admin.ont') : 'a'}`);
      res = res.replace(`ev.titre || ev.title || 'Répétition'`, `ev.titre || ev.title || t('pedagogy.admin.repetition')`);
      res = res.replace(`pushing ? 'Ajout...' : 'Valider'`, `pushing ? t('pedagogy.admin.ajout') : t('pedagogy.admin.valider')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/MestreAutoEvalConfig.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`{ key: 'monParcoursCulture', label: 'Culture', isDefaultFalse: false }`,
        `{ key: 'monParcoursCulture', label: t('pedagogy.admin.culture'), isDefaultFalse: false }`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/CustomQuizConfigPanel.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`isQuizPublished ? '✅ Publié' : 'Brouillon'`, `isQuizPublished ? t('pedagogy.admin.publie') : t('pedagogy.admin.brouillon')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/CreateCultureFicheModal.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`piece.titre || 'le morceau'`, `piece.titre || t('pedagogy.admin.leMorceau')`);
      res = res.replace(`isSubmitting ? "Création..." : "✨ Créer & Lier la Fiche"`,
        `isSubmitting ? t('pedagogy.admin.creation') : t('pedagogy.admin.creerLierLaFiche')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/RepertoireSinaisDoMestreEditor.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`isPickerOpen ? '▲ Fermer sélecteur' : '➕ Ajouter un signe'`,
        `isPickerOpen ? t('pedagogy.admin.fermerSelecteur') : t('pedagogy.admin.ajouterUnSigne')`);
      res = res.replace(`isSequenced\n          ? "Signaux de commandement et conventions par mesure (départ, virada, break, coupure). Suggérés depuis le Séquenceur ou positionnés à la main."\n          : "Signaux de commandement du Mestre associés à ce rythme (départ, virada, coupure...)."\n`,
        `isSequenced\n          ? t('pedagogy.admin.signauxDeCommandementEt')\n          : t('pedagogy.admin.signauxDeCommandementDu')\n`);
      res = res.replace(`isSequenced\r\n          ? "Signaux de commandement et conventions par mesure (départ, virada, break, coupure). Suggérés depuis le Séquenceur ou positionnés à la main."\r\n          : "Signaux de commandement du Mestre associés à ce rythme (départ, virada, coupure...)."\r\n`,
        `isSequenced\r\n          ? t('pedagogy.admin.signauxDeCommandementEt')\r\n          : t('pedagogy.admin.signauxDeCommandementDu')\r\n`);
      res = res.replace(`isSequenced\n            ? "Aucun signe rattaché pour l'instant. Liez un Preset pour les suggérer automatiquement ou cliquez sur [ ➕ Ajouter un signe ]."\n            : "Aucun signe rattaché pour l'instant. Cliquez sur [ ➕ Ajouter un signe ] pour associer des gestes du Mestre."\n`,
        `isSequenced\n            ? t('pedagogy.admin.noSignalsPreset')\n            : t('pedagogy.admin.noSignalsSimple')\n`);
      res = res.replace(`isSequenced\r\n            ? "Aucun signe rattaché pour l'instant. Liez un Preset pour les suggérer automatiquement ou cliquez sur [ ➕ Ajouter un signe ]."\r\n            : "Aucun signe rattaché pour l'instant. Cliquez sur [ ➕ Ajouter un signe ] pour associer des gestes du Mestre."\r\n`,
        `isSequenced\r\n            ? t('pedagogy.admin.noSignalsPreset')\r\n            : t('pedagogy.admin.noSignalsSimple')\r\n`);
      res = res.replace(`isSelected ? '✓ Associé' : '+ Associer'`, `isSelected ? t('pedagogy.admin.associe') : t('pedagogy.admin.associer')`);
      res = res.replace(`isCustomInputOpen ? 'Masquer convention libre' : '✏️ Ajouter un appel texte sur mesure (sans geste catalogué)'`,
        `isCustomInputOpen ? t('pedagogy.admin.masquerConventionLibre') : t('pedagogy.admin.ajouterUnAppelTexte')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/reflex/SignalReflexCard.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`'Timbal'`, `t('pedagogy.admin.timbal')`);
      res = res.replace(`isFixed ? '🔒 Figé' : '🔓 Dynamique'`, `isFixed ? t('pedagogy.admin.fige') : t('pedagogy.admin.dynamique')`);
      res = res.replace(`"(Inattention)"`, `t('pedagogy.admin.inattention')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/RepertoireTrainingsManager.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`auto</span>`, `{t('pedagogy.admin.autoTag')}</span>`);
      res = res.replace(`➕ Associer un autre entraînement existant...`, `{t('pedagogy.admin.associateOther')}`);
      res = res.replace(`Tous les entraînements du groupe sont déjà rattachés`, `{t('pedagogy.admin.allTrainingsLinked')}`);
      res = res.replace(`Entraînement :`, `{t('pedagogy.admin.trainingWord')} :`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/RepertoireCulturePicker.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`searchTerm || activeCategory !== 'Toutes'\n              ? 'Aucune fiche culturelle ne correspond à votre filtre.'\n              : 'Aucune fiche culturelle disponible dans le Varal Culture.'`,
        `searchTerm || activeCategory !== 'Toutes'\n              ? t('pedagogy.admin.aucuneFicheCulturelleNe')\n              : t('pedagogy.admin.aucuneFicheCulturelleDisponible')`);
      res = res.replace(`searchTerm || activeCategory !== 'Toutes'\r\n              ? 'Aucune fiche culturelle ne correspond à votre filtre.'\r\n              : 'Aucune fiche culturelle disponible dans le Varal Culture.'`,
        `searchTerm || activeCategory !== 'Toutes'\r\n              ? t('pedagogy.admin.aucuneFicheCulturelleNe')\r\n              : t('pedagogy.admin.aucuneFicheCulturelleDisponible')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/RepertoireVideosPicker.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`expandedIds.size === videos.length ? 'Tout replier' : 'Tout déplier'`,
        `expandedIds.size === videos.length ? t('pedagogy.admin.toutReplier') : t('pedagogy.admin.toutDeplier')`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/SignalZoomModal.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`Signe du Mestre`, `{t('pedagogy.admin.signeDuMestre')}`);
      return res;
    }
  },
  {
    file: 'src/components/mestre/VideoInstrumentCheckboxes.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`isLiveOrGlobal ? '✓ Actif' : '○ Non'`, `isLiveOrGlobal ? t('pedagogy.admin.actif') : t('pedagogy.admin.non')`);
      return res;
    }
  },

  // ==========================================
  // PÉRIMÈTRE 5 : MOTEURS & ÉVALUATION (2 fichiers)
  // ==========================================
  {
    file: 'src/utils/conductorGameUtils.js',
    transform(content) {
      let res = content;
      res = res.replace(`name: 'Appel de départ'`, `name: 'Appel de départ', labelKey: 'pedagogy.engine.appelDeDepart'`);
      res = res.replace(`name: 'Appel Virada 1'`, `name: 'Appel Virada 1', labelKey: 'pedagogy.engine.appelVirada1'`);
      res = res.replace(`name: 'Appel Virada 2'`, `name: 'Appel Virada 2', labelKey: 'pedagogy.engine.appelVirada2'`);
      res = res.replace(`name: 'Parada / Break'`, `name: 'Parada / Break', labelKey: 'pedagogy.engine.paradaBreak'`);
      res = res.replace(`name: 'Reprise de Baque'`, `name: 'Reprise de Baque', labelKey: 'pedagogy.engine.repriseDeBaque'`);
      res = res.replace(`name: 'Coupure finale'`, `name: 'Coupure finale', labelKey: 'pedagogy.engine.coupureFinale'`);
      res = res.replace(`name: 'Accélération'`, `name: 'Accélération', labelKey: 'pedagogy.engine.acceleration'`);
      res = res.replace(`name: 'Appel Voix / Toada'`, `name: 'Appel Voix / Toada', labelKey: 'pedagogy.engine.appelVoixToada'`);
      return res;
    }
  },
  {
    file: 'src/utils/pedagogyDashboardCalculations.js',
    transform(content) {
      let res = content;
      res = res.replace(`label: 'Alfaias'`, `label: 'Alfaias', labelKey: 'pedagogy.engine.alfaias'`);
      res = res.replace(`label: 'Caixas'`, `label: 'Caixas', labelKey: 'pedagogy.engine.caixas'`);
      res = res.replace(`label: 'Métaux / Gonguê'`, `label: 'Métaux / Gonguê', labelKey: 'pedagogy.engine.metauxGongue'`);
      res = res.replace(`label: 'Agbês'`, `label: 'Agbês', labelKey: 'pedagogy.engine.agbes'`);
      return res;
    }
  }
];

console.log('🔄 Application des remplacements i18n sur les 27 fichiers...\n');

let successCount = 0;
let errorCount = 0;

for (const tf of fileTransforms) {
  const filePath = path.join(rootDir, tf.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable : ${tf.file}`);
    errorCount++;
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const modified = tf.transform(original);

  if (original === modified) {
    console.warn(`⚠️ Aucune modification détectée pour : ${tf.file}`);
  } else {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`✅ Mis à jour : ${tf.file}`);
    successCount++;
  }
}

console.log(`\n🎉 Bilan des remplacements : ${successCount} fichiers modifiés avec succès, ${errorCount} erreurs.`);
