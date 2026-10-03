# Rapport d'Audit Statique Exhaustif i18n — Pôle Pédagogie & Progression

> **Mode d'exécution :** Lecture Seule Stricte (Inspection AST Babel `@babel/parser` & `@babel/traverse`).  
> **Date de l'audit :** 3 octobre 2026  
> **Application cible :** `o-girador-organizador` (Front-End React / Tailwind CSS / Cordel)  
> **Données brutes générées :** [`scripts/audit_pedagogy_results.json`](file:///E:/o-girador/o-girador-organizador/scripts/audit_pedagogy_results.json)  
> **Script d'audit :** [`scripts/audit_pedagogy_i18n.mjs`](file:///E:/o-girador/o-girador-organizador/scripts/audit_pedagogy_i18n.mjs)

---

## 1. Vue d'Ensemble & Métriques Clés

L'inspection statique a scanné l'intégralité des composants, modales, modules élèves, écrans du Mestre et moteurs de quiz gravitant autour de la pédagogie, de l'apprentissage des morceaux, du Speed Trainer, du Défi Réflexe et du Conducteur à trous.

| Métrique | Valeur |
| :--- | :--- |
| **Total de fichiers audités** | **80 fichiers** |
| **Fichiers 100 % propres (i18n Ready / 0 texte en dur)** | **18 fichiers** (22,5 %) |
| **Fichiers comportant des chaînes brutes à traduire** | **62 fichiers** (77,5 %) |
| **Total général des chaînes brutes détectées** | **529 chaînes** |
| **Namespace racine cible recommandé** | `pedagogy.*` |

---

## 2. Décomposition par Sous-Périmètre

| Sous-Périmètre | Fichiers audités | Fichiers propres | Fichiers avec chaînes | Chaînes brutes |
| :--- | :---: | :---: | :---: | :---: |
| **1. Espace Pédagogie & Progression** (`src/components/pedagogy/` + Cartes) | 39 | 4 | 35 | **369** |
| **2. Espace Élève & Suivi Adhérent** (`src/components/student/` + Profil) | 5 | 0 | 5 | **68** |
| **3. Modales & Vues d'Apprentissage** (`src/components/member/`) | 10 | 2 | 8 | **41** |
| **4. Administration & Outils Pédagogiques Mestria** (`src/components/mestre/`) | 13 | 1 | 12 | **39** |
| **5. Moteurs de Génération & Évaluation** (`src/utils/` + Services) | 13 | 11 | 2 | **12** |
| **TOTAL GÉNÉRAL** | **80** | **18** | **62** | **529** |

---

## 3. Détail Exhaustif par Composant & Fichier

### 3.1. Espace Pédagogie & Progression (369 chaînes)
*Composants du Carnet d'Aisance, des Défis Réflexes, du Conducteur à trous, des toadas, de la danse et des statistiques d'entraînement.*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/pedagogy/MonCarnetAisance.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MonCarnetAisance.jsx) | ⚠️ À traduire | **49** | `"Excellent ! Tu maîtrises le sujet."`, `"⚡ Défis Rythmiques"`, `"🥁 Percussion"`, `"💃 Danse"`, `"← Retour au Carnet"` |
| [`src/components/pedagogy/ReflexGameModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/ReflexGameModal.jsx) | ⚠️ À traduire | **25** | `"Défi Réflexe : Temps 1"`, `"Clique sur le bon geste !"`, `"Score final"`, `"Temps écoulé"`, `"Recommencer"` |
| [`src/components/pedagogy/MestreQuizConfigManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MestreQuizConfigManager.jsx) | ⚠️ À traduire | **23** | `"Configuration du Quiz"`, `"Nombre de questions"`, `"Seuil de réussite (%)"`, `"Questions aléatoires"`, `"Enregistrer"` |
| [`src/components/pedagogy/QcmSignaux.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/QcmSignaux.jsx) | ⚠️ À traduire | **19** | `"Quel geste correspond à cet appel ?"`, `"Bravo, bonne réponse !"`, `"Erreur, réessaie !"`, `"Question suivante"` |
| [`src/components/pedagogy/AutoEvalQuiz.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/AutoEvalQuiz.jsx) | ⚠️ À traduire | **18** | `"Auto-évaluation"`, `"Je maîtrise totalement"`, `"En cours d'apprentissage"`, `"À revoir"`, `"Valider mon bilan"` |
| [`src/components/pedagogy/CultureFichesTable.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/CultureFichesTable.jsx) | ⚠️ À traduire | **16** | `"Fiches Culturelles"`, `"Origine historique"`, `"Tradition & Mythes"`, `"Lire la fiche complète"`, `"Aucune fiche"` |
| [`src/components/pedagogy/QuizDistractorManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/QuizDistractorManager.jsx) | ⚠️ À traduire | **16** | `"Gestion des Leurres / Distracteurs"`, `"Ajouter un leurre"`, `"Leurres personnalisés Mestre"`, `"Supprimer"` |
| [`src/components/pedagogy/EntrainementMacroAnalytics.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/EntrainementMacroAnalytics.jsx) | ⚠️ À traduire | **14** | `"Progression globale du groupe"`, `"Paliers validés"`, `"Taux d'assiduité Speed Trainer"`, `"Moyenne générale"` |
| [`src/components/pedagogy/MestreSignalsManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MestreSignalsManager.jsx) | ⚠️ À traduire | **14** | `"Répertoire des Signaux de Direction"`, `"Geste interactif"`, `"Mode Repère"`, `"Mode Pause"`, `"Surcharges Mestre"` |
| [`src/components/CultureCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/CultureCard.jsx) | ⚠️ À traduire | **14** | `"Fiche Culture"`, `"Contexte & Racines"`, `"Voir les détails"`, `"Personnages & Symboles"` |
| [`src/components/pedagogy/MestreToadasAnalytics.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MestreToadasAnalytics.jsx) | ⚠️ À traduire | **13** | `"Maîtrise des Toadas & Paroles"`, `"Couplets sus par cœur"`, `"Chant lead / Réponse chœur"`, `"Écoute audio"` |
| [`src/components/SongCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/SongCard.jsx) | ⚠️ À traduire | **12** | `"Paroles & Récitation"`, `"Verset"`, `"Refrain"`, `"Masquer les paroles pour m'entraîner"`, `"Écouter le chant"` |
| [`src/components/pedagogy/PedagogyDocumentsView.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/PedagogyDocumentsView.jsx) | ⚠️ À traduire | **11** | `"Documents pédagogiques"`, `"Tablatures"`, `"Partitions"`, `"Guides de jeu"`, `"Télécharger"` |
| [`src/components/pedagogy/PercussionRepertoireAnalytics.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/PercussionRepertoireAnalytics.jsx) | ⚠️ À traduire | **11** | `"Vue d'ensemble Répertoire"`, `"Paliers d'aisance pupitres"`, `"Morceaux prêts pour la scène"`, `"En répétition"` |
| [`src/components/pedagogy/ToadasTable.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/ToadasTable.jsx) | ⚠️ À traduire | **11** | `"Tableau des chants"`, `"Tonalité"`, `"Vitesse"`, `"Auteur / Tradition"`, `"Statut d'apprentissage"` |
| [`src/components/pedagogy/EntrainementSegmentsBar.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/EntrainementSegmentsBar.jsx) | ⚠️ À traduire | **10** | `"Segments d'entraînement"`, `"Palier atteint"`, `"Vitesse cible"`, `"BPM"`, `"Déverrouillé"` |
| [`src/components/pedagogy/DanseChoregraphieAnalytics.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/DanseChoregraphieAnalytics.jsx) | ⚠️ À traduire | **9** | `"Chorégraphies & Pas"`, `"Évolution corporelle"`, `"Figures d'ensemble"`, `"Synchronisation"` |
| [`src/components/pedagogy/AtelierModelPartsProgress.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/AtelierModelPartsProgress.jsx) | ⚠️ À traduire | **8** | `"Avancement de confection / lutherie"`, `"Pièces montées"`, `"Tutoriels terminés"`, `"Contrôle qualité"` |
| [`src/components/pedagogy/PercussionPieceRow.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/PercussionPieceRow.jsx) | ⚠️ À traduire | **8** | `"Progression par instrument"`, `"Non commencé"`, `"En cours"`, `"Acquis"`, `"Maîtrisé"` |
| [`src/components/pedagogy/DefisSummaryCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/DefisSummaryCard.jsx) | ⚠️ À traduire | **7** | `"Résumé des Défis"`, `"Défi Réflexe"`, `"Conducteur à trous"`, `"Speed Trainer"`, `"Meilleur score"` |
| [`src/components/pedagogy/BlindTestTrialModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/BlindTestTrialModal.jsx) | ⚠️ À traduire | **6** | `"Blind Test Maracatu"`, `"Écoute l'extrait audio"`, `"Quel est ce morceau ?"`, `"Temps restant"` |
| [`src/components/pedagogy/MonParcoursGuideBanner.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MonParcoursGuideBanner.jsx) | ⚠️ À traduire | **6** | `"Bienvenue dans ton parcours"`, `"Valide tes étapes au fil des répétitions"`, `"Consulter mes objectifs"` |
| [`src/components/pedagogy/RodaQuizStatsBanner.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/RodaQuizStatsBanner.jsx) | ⚠️ À traduire | **6** | `"Participation au Quiz de Roda"`, `"Bonnes réponses"`, `"Série en cours"`, `"Médaille d'or"` |
| [`src/components/pedagogy/ConductorGameModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/ConductorGameModal.jsx) | ⚠️ À traduire | **5** | `"Conducteur à trous"`, `"Reconstitue la grille"`, `"Glisse le bon signal"`, `"Vérifier ma partition"` |
| [`src/components/pedagogy/DanseItemRow.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/DanseItemRow.jsx) | ⚠️ À traduire | **5** | `"Figure de danse"`, `"Niveau requis"`, `"Vidéo repère"`, `"Validation du Mestre"` |
| [`src/components/pedagogy/TrainingCompactCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/TrainingCompactCard.jsx) | ⚠️ À traduire | **5** | `"Speed Trainer"`, `"Lancer le palier"`, `"Palier validé"`, `"Objectif tempo"`, `"Séquenciad'Or"` |
| [`src/components/pedagogy/conductor/ConductorSignalPickerSheet.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/conductor/ConductorSignalPickerSheet.jsx) | ⚠️ À traduire | **5** | `"Choisir un signal"`, `"Signaux du morceau"`, `"Leurres disponibles"`, `"Annuler la sélection"` |
| [`src/components/pedagogy/reflex/ReflexGameBoard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/reflex/ReflexGameBoard.jsx) | ⚠️ À traduire | **5** | `"Zone de jeu"`, `"Prépare-toi..."`, `"Temps restant"`, `"Manqué !"`, `"Coup parfait !"` |
| [`src/components/pedagogy/reflex/ReflexSignalBanner.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/reflex/ReflexSignalBanner.jsx) | ⚠️ À traduire | **5** | `"Geste déclenché"`, `"Temps 1 imminent"`, `"Tape maintenant !"`, `"Anticipation"` |
| [`src/components/pedagogy/CarnetPercussionSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/CarnetPercussionSection.jsx) | ⚠️ À traduire | **3** | `"Section Rythmique & Bateria"`, `"Rythmes de base"`, `"Variations & Viradas"` |
| [`src/components/pedagogy/conductor/ConductorAudioPlayer.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/conductor/ConductorAudioPlayer.jsx) | ⚠️ À traduire | **3** | `"Lecture témoin"`, `"Mute métronome"`, `"Boucle mesure"` |
| [`src/components/pedagogy/conductor/ConductorTimeline.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/conductor/ConductorTimeline.jsx) | ⚠️ À traduire | **3** | `"Ligne temporelle"`, `"Mesure"`, `"Signal positionné"` |
| [`src/components/pedagogy/SignauxTrialModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/SignauxTrialModal.jsx) | ⚠️ À traduire | **2** | `"Entraînement Signaux"`, `"Test rapide de mémorisation"` |
| [`src/components/pedagogy/DailyRevisionSession.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/DailyRevisionSession.jsx) | ⚠️ À traduire | **1** | `"Session de révision du jour"` |
| [`src/components/pedagogy/conductor/ConductorMeasureSlot.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/conductor/ConductorMeasureSlot.jsx) | ⚠️ À traduire | **1** | `"Déposer le geste ici"` |
| [`src/components/pedagogy/MonParcours.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/MonParcours.jsx) | ✨ Propre | **0** | *Déjà internationalisé via `t('...')`* |
| [`src/components/pedagogy/AtelierEntrainement.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/AtelierEntrainement.jsx) | ✨ Propre | **0** | *Déjà internationalisé via `t('...')`* |
| [`src/components/pedagogy/PatternVisualizer.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/PatternVisualizer.jsx) | ✨ Propre | **0** | *Composant technique pur (canvas / SVG)* |
| [`src/components/pedagogy/RodaQuizHeaderButton.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/pedagogy/RodaQuizHeaderButton.jsx) | ✨ Propre | **0** | *Déjà internationalisé via `t('...')`* |

---

### 3.2. Espace Élève & Suivi Adhérent (68 chaînes)
*Composants d'évaluation interactive de l'élève, suivi des toadas et livrets de fabrication.*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/student/AutoEvalQuizContainer.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/student/AutoEvalQuizContainer.jsx) | ⚠️ À traduire | **35** | `"Questionnaire d'Auto-Évaluation"`, `"Choisis la réponse qui te correspond"`, `"Résultat de ta session"`, `"Points d'effort recommandés"`, `"Fermer le quiz"` |
| [`src/components/profile/PieceTutorialModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/profile/PieceTutorialModal.jsx) | ⚠️ À traduire | **16** | `"Tutoriel Couture & Lutherie"`, `"Matériel requis"`, `"Étapes d'assemblage"`, `"Patrons & Fichiers PDF"`, `"Fermer (Échap)"` |
| [`src/components/student/StudentToadasProgress.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/student/StudentToadasProgress.jsx) | ⚠️ À traduire | **11** | `"Progression Vocale Adhérent"`, `"Toadas apprises"`, `"Chants en cours d'assimilation"`, `"Enregistrer ma voix"` |
| [`src/components/student/FirestoreMediaRenderer.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/student/FirestoreMediaRenderer.jsx) | ⚠️ À traduire | **4** | `"Chargement du média..."`, `"Impossible de charger le fichier"`, `"Aperçu indisponible"`, `"Ouvrir dans un nouvel onglet"` |
| [`src/components/profile/StudentInstrumentsWorkshop.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/profile/StudentInstrumentsWorkshop.jsx) | ⚠️ À traduire | **2** | `"Atelier Instrumental de l'Adhérent"`, `"Suivi de mon instrument personnel"` |

---

### 3.3. Modales & Vues d'Apprentissage par Morceau (41 chaînes)
*Affichage des paroles masquables, culture, galerie des gestes et accordéons adhérents.*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/member/MemberPieceUnfoldedContent.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/MemberPieceUnfoldedContent.jsx) | ⚠️ À traduire | **16** | `"Signaux de direction"`, `"Paroles & Récitation"`, `"Fiche Culture"`, `"Paliers Speed Trainer"`, `"Défi Réflexe"`, `"Conducteur à trous"` |
| [`src/components/member/PieceSignalsModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/PieceSignalsModal.jsx) | ⚠️ À traduire | **8** | `"Galerie des Gestes & Signaux du Morceau"`, `"Visualisation pas-à-pas"`, `"Appel d'entrée"`, `"Virada"`, `"Break"` |
| [`src/components/member/MemberPieceCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/MemberPieceCard.jsx) | ⚠️ À traduire | **5** | `"Morceau du répertoire"`, `"Vitesse d'exécution"`, `"Voir les détails pédagogiques"`, `"Mon niveau d'aisance"` |
| [`src/components/member/PieceCultureModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/PieceCultureModal.jsx) | ⚠️ À traduire | **4** | `"Fiche Culturelle du Morceau"`, `"Origines & Contexte"`, `"Fermer (Échap)"`, `"Lancer le Mini-Quiz Culture"` |
| [`src/components/member/PieceLyricsModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/PieceLyricsModal.jsx) | ⚠️ À traduire | **3** | `"Paroles du Morceau"`, `"Mode Récitation (Masquer)"`, `"Afficher le texte complet"` |
| [`src/components/member/PieceAisanceSection.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/PieceAisanceSection.jsx) | ⚠️ À traduire | **2** | `"Mon niveau sur ce morceau"`, `"Paliers validés sur Séquenciad'Or"` |
| [`src/components/member/MemberRepertoireView.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/MemberRepertoireView.jsx) | ⚠️ À traduire | **2** | `"Mon Carnet de Morceaux"`, `"Filtrer par discipline"` |
| [`src/components/member/MemberRepertoireHeader.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/MemberRepertoireHeader.jsx) | ⚠️ À traduire | **1** | `"Répertoire des Adhérents"` |
| [`src/components/member/PieceQuizModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/PieceQuizModal.jsx) | ✨ Propre | **0** | *Déjà internationalisé via `t('...')`* |
| [`src/components/member/MemberMediaModals.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/member/MemberMediaModals.jsx) | ✨ Propre | **0** | *Composant routeur sans chaîne en dur* |

---

### 3.4. Administration & Outils Pédagogiques Mestria (39 chaînes)
*Cockpit du Mestre, arbitrages pédagogiques, éditeur de gestes et paramètres des quiz.*

| Composant / Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/components/mestre/RepertoireSinaisDoMestreEditor.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/RepertoireSinaisDoMestreEditor.jsx) | ⚠️ À traduire | **10** | `"Édition des Signaux Mestre"`, `"Définir un geste interactif"`, `"Ajouter des leurres"`, `"Enregistrer les surcharges"` |
| [`src/components/mestre/MestrePedagogyDashboard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/MestrePedagogyDashboard.jsx) | ⚠️ À traduire | **4** | `"Cockpit Pédagogique du Mestre"`, `"Statistiques d'aisance globale"`, `"Alertes adhérents en difficulté"` |
| [`src/components/mestre/MestrePedagogyNotepad.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/MestrePedagogyNotepad.jsx) | ⚠️ À traduire | **4** | `"Bloc-Notes Pédagogique"`, `"Consignes de la semaine"`, `"Axes de travail répète"` |
| [`src/components/mestre/reflex/SignalReflexCard.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/reflex/SignalReflexCard.jsx) | ⚠️ À traduire | **4** | `"Carte Signal Défi Réflexe"`, `"Paramètres de réactivité"`, `"Délai de réponse (ms)"` |
| [`src/components/mestre/RepertoireTrainingsManager.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/RepertoireTrainingsManager.jsx) | ⚠️ À traduire | **4** | `"Gestion des Entraînements Speed Trainer"`, `"Presets Séquenciad'Or associés"`, `"Lier un nouvel entraînement"` |
| [`src/components/mestre/CreateCultureFicheModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/CreateCultureFicheModal.jsx) | ⚠️ À traduire | **3** | `"Créer une Fiche Culturelle"`, `"Titre de la fiche"`, `"Contenu pédagogique"` |
| [`src/components/mestre/CustomQuizConfigPanel.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/CustomQuizConfigPanel.jsx) | ⚠️ À traduire | **2** | `"Panneau de configuration avancée Quiz"`, `"Pondération des questions"` |
| [`src/components/mestre/RepertoireCulturePicker.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/RepertoireCulturePicker.jsx) | ⚠️ À traduire | **2** | `"Sélectionner une fiche culture"`, `"Associer à ce morceau"` |
| [`src/components/mestre/RepertoireVideosPicker.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/RepertoireVideosPicker.jsx) | ⚠️ À traduire | **2** | `"Vidéos pédagogiques"`, `"Lien YouTube ou Varal"` |
| [`src/components/mestre/VideoInstrumentCheckboxes.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/VideoInstrumentCheckboxes.jsx) | ⚠️ À traduire | **2** | `"Pupitres concernés par la vidéo"`, `"Tous les pupitres"` |
| [`src/components/mestre/MestreAutoEvalConfig.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/MestreAutoEvalConfig.jsx) | ⚠️ À traduire | **1** | `"Configuration de l'Auto-Évaluation"` |
| [`src/components/mestre/SignalZoomModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/SignalZoomModal.jsx) | ⚠️ À traduire | **1** | `"Zoom sur le Signal"` |
| [`src/components/mestre/TablatureModal.jsx`](file:///E:/o-girador/o-girador-organizador/src/components/mestre/TablatureModal.jsx) | ✨ Propre | **0** | *Déjà internationalisé via `t('...')`* |

---

### 3.5. Moteurs de Génération & Logique d'Évaluation (12 chaînes)
*Algorithmes de calcul, générateurs de quiz, parsers et utilitaires techniques.*

| Fichier | Statut | Nombre de chaînes | Exemples de chaînes détectées |
| :--- | :---: | :---: | :--- |
| [`src/utils/conductorGameUtils.js`](file:///E:/o-girador/o-girador-organizador/src/utils/conductorGameUtils.js) | ⚠️ À traduire | **8** | `"Appel de départ"`, `"Appel Virada 1"`, `"Appel Virada 2"`, `"Parada / Break"`, `"Reprise de Baque"`, `"Coupure finale"` |
| [`src/utils/pedagogyDashboardCalculations.js`](file:///E:/o-girador/o-girador-organizador/src/utils/pedagogyDashboardCalculations.js) | ⚠️ À traduire | **4** | `"Alfaias"`, `"Caixas"`, `"Métaux / Gonguê"`, `"Agbês"` *(libellés statiques de regroupement)* |
| [`src/utils/quizGenerator.js`](file:///E:/o-girador/o-girador-organizador/src/utils/quizGenerator.js) | ✨ Propre | **0** | *Générateur dynamique déjà branché sur `quizI18nEngine.js`* |
| [`src/utils/quizI18nEngine.js`](file:///E:/o-girador/o-girador-organizador/src/utils/quizI18nEngine.js) | ✨ Propre | **0** | *Moteur de questions déjà bilingue FR/PT* |
| [`src/utils/quizSanitizer.js`](file:///E:/o-girador/o-girador-organizador/src/utils/quizSanitizer.js) | ✨ Propre | **0** | *Assainisseur de quiz purement fonctionnel* |
| [`src/utils/translationQuizEngine.js`](file:///E:/o-girador/o-girador-organizador/src/utils/translationQuizEngine.js) | ✨ Propre | **0** | *Moteur de quiz vocabulaire déjà paramétré* |
| [`src/utils/gameQuizGenerator.js`](file:///E:/o-girador/o-girador-organizador/src/utils/gameQuizGenerator.js) | ✨ Propre | **0** | *Générateur sans chaîne en dur* |
| [`src/utils/reflexGameUtils.js`](file:///E:/o-girador/o-girador-organizador/src/utils/reflexGameUtils.js) | ✨ Propre | **0** | *Calculateur temporel et logique d'arbitrage Mestre pure* |
| [`src/utils/aisanceStagesUtils.js`](file:///E:/o-girador/o-girador-organizador/src/utils/aisanceStagesUtils.js) | ✨ Propre | **0** | *Calculateurs de paliers Speed Trainer purs* |
| [`src/utils/spacedRepetitionEngine.js`](file:///E:/o-girador/o-girador-organizador/src/utils/spacedRepetitionEngine.js) | ✨ Propre | **0** | *Algorithme de Leitner pur* |
| [`src/utils/toadaProgressEngine.js`](file:///E:/o-girador/o-girador-organizador/src/utils/toadaProgressEngine.js) | ✨ Propre | **0** | *Moteur de calcul de rétention vocale pur* |
| [`src/utils/trainingLauncher.js`](file:///E:/o-girador/o-girador-organizador/src/utils/trainingLauncher.js) | ✨ Propre | **0** | *Passerelle SSO Séquenciad'Or sans texte UI* |
| [`src/services/aisanceService.js`](file:///E:/o-girador/o-girador-organizador/src/services/aisanceService.js) | ✨ Propre | **0** | *Service Firestore partagé (lecture/écriture aisance)* |

---

## 4. Architecture Recommandée pour le Dictionnaire `pedagogy`

Toutes les clés proposées dans `scripts/audit_pedagogy_results.json` respectent une hiérarchie modulaire et sémantique :

```javascript
// Structure dans src/locales/fr.js et src/locales/pt.js
export const fr = {
  // ...
  pedagogy: {
    // 1. Carnet d'Aisance & Progression
    progression: {
      monCarnetAisance: {
        title: "Mon Carnet d'Aisance",
        excellent: "Excellent ! Tu maîtrises le sujet.",
        replay: "🔄 Rejouer",
        close: "✕ Fermer",
        correct: "✅ Correct !",
        rhythmChallenges: "⚡ Défis Rythmiques",
        percussion: "🥁 Percussion",
        dance: "💃 Danse",
        backToCarnet: "← Retour au Carnet"
      },
      reflexGame: {
        title: "Défi Réflexe : Temps 1",
        instruction: "Tape sur le bon signal dès qu'il apparaît !",
        perfect: "Coup parfait !",
        missed: "Manqué !"
      },
      conductor: {
        title: "Conducteur à trous",
        dragSignal: "Glisse le bon signal dans la mesure",
        checkScore: "Vérifier la partition"
      },
      speedTrainer: {
        launchStage: "Lancer le palier",
        stageCompleted: "Palier validé avec succès !"
      }
    },

    // 2. Espace Élève / Adhérent
    student: {
      autoEval: {
        title: "Questionnaire d'Auto-Évaluation",
        submit: "Enregistrer mon bilan"
      },
      tutorial: {
        title: "Tutoriel d'Apprentissage",
        materials: "Matériel requis",
        instructions: "Consignes pas-à-pas"
      },
      toadasProgress: {
        title: "Maîtrise des Toadas & Paroles",
        recordVoice: "Enregistrer ma voix"
      }
    },

    // 3. Fiches Morceaux & Apprentissage
    repertoireLearning: {
      lyrics: {
        recitationMode: "Mode Récitation (Masquer)",
        showFull: "Afficher le texte complet"
      },
      culture: {
        viewSheet: "Fiche Culturelle",
        launchMiniQuiz: "Lancer le Mini-Quiz Culture"
      },
      signals: {
        galleryTitle: "Galerie des Signaux du Morceau"
      }
    },

    // 4. Espace Mestre
    mestreAdmin: {
      cockpit: "Cockpit Pédagogique du Mestre",
      notepad: "Bloc-Notes Pédagogique",
      sinaisEditor: "Édition des Signaux Mestre",
      distractorManager: "Gestion des Leurres / Distracteurs"
    },

    // 5. Signaux génériques & Groupes d'instruments
    engines: {
      signals: {
        startCall: "Appel de départ",
        virada1: "Appel Virada 1",
        virada2: "Appel Virada 2",
        paradaBreak: "Parada / Break",
        baqueResume: "Reprise de Baque",
        finalCut: "Coupure finale"
      }
    }
  }
};
```

---

## 5. Synthèse & Prochaines Étapes Conseillées

1. **Validation de l'Audit :**
   - 0 régression applicative constatée (audit en lecture seule stricte).
   - Fichier de données brutes prêt pour automatisation de traduction : [`scripts/audit_pedagogy_results.json`](file:///E:/o-girador/o-girador-organizador/scripts/audit_pedagogy_results.json).
2. **Phase suivante (Injection i18n) :**
   - Créer une table de correspondance bilingue Français / Portugais (Brésil).
   - Injecter le namespace `pedagogy` dans `src/locales/fr.js` et `src/locales/pt.js`.
   - Remplacer les 529 chaînes brutes par des appels `t('pedagogy...')` de manière incrémentale par sous-domaine (Progression -> Élève -> Morceau -> Mestria).
