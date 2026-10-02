# Audit Statique Exhaustif i18n — Pôle Mestria (Direction Artistique)

> **Mode : LECTURE SEULE STRICTE**  
> Aucun fichier source, aucun dictionnaire de locale, aucun schéma ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel sur l'intégralité des composants du Pôle Mestria.

---

## 🎭 Répertoire & Modales Associées (Catégorie : `repertoire` ➔ `mestre.repertoire.*`)

**Volume détecté :** 233 chaînes brutes réparties sur 19 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/MestreRepertoireView.jsx` (38 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L111 | Message runtime (showToast) | `Erreur lors de la modification du statut du répertoire.` | `mestre.repertoireErreurLorsDeLaModification` |
| L255 | Message runtime (alert) | `Erreur lors de la suppression.` | `mestre.repertoireErreurLorsDeLaSuppression` |
| L301 | Message runtime (showToast) | `Erreur lors de l'importation du morceau dans le Répertoire.` | `mestre.repertoireErreurLorsDeLImportation` |
| L351 | Message runtime (showToast) | `Erreur lors de la synchronisation avec le Séquenceur.` | `mestre.repertoireErreurLorsDeLaSynchronisation` |
| L481 | Span / Badge | `⏳ Chargement du répertoire vivant...` | `mestre.repertoireChargementDuRepertoireVivant` |
| L502 | Nœud JSX | `➕ Ajouter un premier morceau` | `mestre.repertoireAjouterUnPremierMorceau` |
| L527 | Attribut title | `Cliquer pour ouvrir et modifier la fiche de ce morceau` | `mestre.repertoireCliquerPourOuvrirEtModifier` |
| L572 | Span / Badge | `Audio` | `mestre.repertoireAudio` |
| L584 | Message runtime (showToast) | `La fiche de ce chant n'a pas pu être trouvée sur le Varal.` | `mestre.repertoireLaFicheDeCeChant` |
| L654 | Span / Badge | `Tablature vivante` | `mestre.repertoireTablatureVivante` |
| L672 | Attribut title | `Consulter l'aide-mémoire des signes du Mestre` | `mestre.repertoireConsulterLAideMemoireDes` |
| L675 | Span / Badge | `Signe` | `mestre.repertoireSigne` |
| L689 | Attribut title | `Afficher les entraînements associés` | `mestre.repertoireAfficherLesEntrainementsAssocies` |
| L692 | Span / Badge | `entraînement` | `mestre.repertoireEntrainement` |
| L699 | Span / Badge | `Autonome (joué de mémoire)` | `mestre.repertoireAutonomeJoueDeMemoire` |
| L711 | Span / Badge | `Audio de référence :` | `mestre.repertoireAudioDeReference` |
| L714 | Span / Badge | `✓ direct séquenceur` | `mestre.repertoireDirectSequenceur` |
| L716 | Span / Badge | `✓ direct toada` | `mestre.repertoireDirectToada` |
| L786 | Span / Badge | `✋ Signes :` | `mestre.repertoireSignes` |
| L837 | Span / Badge | `Entraînements (` | `mestre.repertoireEntrainements` |
| L839 | Span / Badge | `sequenciador` | `mestre.repertoireSequenciador` |
| L862 | Attribut title | `Ouvrir et travailler ce morceau dans le Séquenceur avec SSO` | `mestre.repertoireOuvrirEtTravaillerCeMorceau` |
| L904 | Attribut title | `Consulter et imprimer la tablature (calculée à la volée)` | `mestre.repertoireConsulterEtImprimerLaTablature` |
| L907 | Span / Badge | `Tablature` | `mestre.repertoireTablature` |
| L922 | Message runtime (showToast) | `La fiche de ce chant n'a pas pu être trouvée sur le Varal.` | `mestre.repertoireLaFicheDeCeChant` |
| L929 | Span / Badge | `Toada` | `mestre.repertoireToada` |
| L942 | Attribut title | `Consulter les fiches culturelles associées` | `mestre.repertoireConsulterLesFichesCulturellesAssociees` |
| L945 | Span / Badge | `fiches Culture` | `mestre.repertoireFichesCulture` |
| L962 | Attribut title | `Consulter la fiche culturelle du Varal associée` | `mestre.repertoireConsulterLaFicheCulturelleDu` |
| L965 | Span / Badge | `Fiche Culture` | `mestre.repertoireFicheCulture` |
| L975 | Attribut title | `Créer une fiche du Varal Culture pré-remplie avec le Contexte & Histoire du morceau (contexteHistori` | `mestre.repertoireCreerUneFicheDuVaral` |
| L978 | Span / Badge | `Fiche Culture` | `mestre.repertoireFicheCulture` |
| L991 | Attribut title | `Ajouter au fil conducteur d'une répétition ou d'un concert` | `mestre.repertoireAjouterAuFilConducteurD` |
| L992 | Nœud JSX | `➕ Programmer` | `mestre.repertoireProgrammer` |
| L1005 | Attribut title | `Modifier les informations` | `mestre.repertoireModifierLesInformations` |
| L1121 | Span / Badge | `Fiches Culturelles —` | `mestre.repertoireFichesCulturelles` |
| L1133 | Paragraphe | `Sélectionnez la fiche culturelle à consulter :` | `mestre.repertoireSelectionnezLaFicheCulturelleA` |
| L1155 | Span / Badge | `Consulter ↗` | `mestre.repertoireConsulter` |

---

#### 📄 `src/components/mestre/MestreRepertoireHeader.jsx` (11 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L30 | Span / Badge | `Direction Artistique —` | `mestre.repertoireDirectionArtistique` |
| L32 | Paragraphe | `Architecture réactive vivante liée au Séquenceur, au Varal et à Dançad'Or` | `mestre.repertoireArchitectureReactiveVivanteLieeAu` |
| L51 | Span / Badge | `Ouvert au groupe` | `mestre.repertoireOuvertAuGroupe` |
| L58 | Attribut title | `Masquer le répertoire aux adhérents` | `mestre.repertoireMasquerLeRepertoireAuxAdherents` |
| L59 | Bouton | `Masquer` | `mestre.repertoireMasquer` |
| L67 | Span / Badge | `Masqué` | `mestre.repertoireMasque` |
| L74 | Attribut title | `Ouvrir le répertoire aux adhérents` | `mestre.repertoireOuvrirLeRepertoireAuxAdherents` |
| L75 | Bouton | `Ouvrir` | `mestre.repertoireOuvrir` |
| L89 | Attribut title | `Affecter une vidéo à plusieurs morceaux du répertoire` | `mestre.repertoireAffecterUneVideoAPlusieurs` |
| L92 | Span / Badge | `Affecter vidéo par lot` | `mestre.repertoireAffecterVideoParLot` |
| L102 | Nœud JSX | `➕ Ajouter un morceau` | `mestre.repertoireAjouterUnMorceau` |

---

#### 📄 `src/components/mestre/RepertoirePieceModal.jsx` (57 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L479 | Message runtime (alert) | `Le fichier audio est trop volumineux (maximum 25 Mo).` | `mestre.repertoireLeFichierAudioEstTrop` |
| L493 | Message runtime (alert) | `Erreur lors de l'envoi du fichier audio.` | `mestre.repertoireErreurLorsDeLEnvoi` |
| L766 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L793 | Attribut title | `Injecter le titre de la toada sélectionnée` | `mestre.repertoireInjecterLeTitreDeLa` |
| L795 | Span / Badge | `💡 Suggérer «` | `mestre.repertoireSuggerer` |
| L812 | Span / Badge | `Correspondances détectées :` | `mestre.repertoireCorrespondancesDetectees` |
| L823 | Attribut title | `Lier au Preset Séquenceur détecté` | `mestre.repertoireLierAuPresetSequenceurDetecte` |
| L825 | Span / Badge | `🥁 Lier au Preset «` | `mestre.repertoireLierAuPreset` |
| L833 | Attribut title | `Lier à la Toada détectée` | `mestre.repertoireLierALaToadaDetectee` |
| L835 | Span / Badge | `🗣️ Lier à la Toada «` | `mestre.repertoireLierALaToada` |
| L843 | Attribut title | `Lier à la chorégraphie Dançad'Or détectée` | `mestre.repertoireLierALaChoregraphieDancad` |
| L845 | Span / Badge | `💃 Lier à la Danse «` | `mestre.repertoireLierALaDanse` |
| L853 | Attribut title | `Lier à la fiche Varal Culture détectée` | `mestre.repertoireLierALaFicheVaral` |
| L855 | Span / Badge | `📖 Lier à la Culture «` | `mestre.repertoireLierALaCulture` |
| L920 | Paragraphe | `La validation est libre : un morceau peut être prêt même sans ressource externe attachée.` | `mestre.repertoireLaValidationEstLibreUn` |
| L965 | Span / Badge | `🔗 Liaisons transversales vivantes (Varal, Séquenceur, Danse)` | `mestre.repertoireLiaisonsTransversalesVivantesVaralSequenceur` |
| L1048 | Attribut title | `Cliquer pour utiliser le nom de cette toada comme titre du morceau` | `mestre.repertoireCliquerPourUtiliserLeNom` |
| L1051 | Span / Badge | `Définir comme titre :` | `mestre.repertoireDefinirCommeTitre` |
| L1060 | Attribut title | `Consulter les paroles complètes de ce chant` | `mestre.repertoireConsulterLesParolesCompletesDe` |
| L1063 | Span / Badge | `Lire les paroles de «` | `mestre.repertoireLireLesParolesDe` |
| L1089 | Attribut label | `⭐ 🎛️ Préréglages Complets (Presets - Audio & Tablature en direct)` | `mestre.repertoirePrereglagesCompletsPresetsAudioTablature` |
| L1100 | Attribut label | `📑 Séquences & Arrangements (Sections)` | `mestre.repertoireSequencesArrangementsSections` |
| L1109 | Attribut label | `🥁 Motifs individuels & Fichiers JSON` | `mestre.repertoireMotifsIndividuelsFichiersJson` |
| L1118 | Span / Badge | `Liaison vivante : audio, BPM, signes et tablature seront lus en direct depuis ce preset.` | `mestre.repertoireLiaisonVivanteAudioBpmSignes` |
| L1128 | Span / Badge | `Audio de référence` | `mestre.repertoireAudioDeReference` |
| L1135 | Attribut title | `Dissocier cet enregistrement audio personnalisé` | `mestre.repertoireDissocierCetEnregistrementAudioPersonnalise` |
| L1136 | Bouton | `Effacer` | `mestre.repertoireEffacer` |
| L1152 | Attribut label | `🎧 Masters Audio & Enregistrements du Séquenceur` | `mestre.repertoireMastersAudioEnregistrementsDuSequenceur` |
| L1162 | Attribut label | `🔗 Audio personnalisé` | `mestre.repertoireAudioPersonnalise` |
| L1163 | Option select | `🎵 Fichier lié (` | `mestre.repertoireFichierLie` |
| L1183 | Span / Badge | `ou` | `mestre.repertoireOu` |
| L1195 | Span / Badge | `🔗 Coller une URL` | `mestre.repertoireCollerUneUrl` |
| L1202 | Span / Badge | `▶ Pré-écoute de l'audio :` | `mestre.repertoirePreEcouteDeLAudio` |
| L1265 | Span / Badge | `💃 Chorégraphie liée` | `mestre.repertoireChoregraphieLiee` |
| L1271 | Span / Badge | `fiche(s) culture` | `mestre.repertoireFicheSCulture` |
| L1275 | Span / Badge | `Aucune liaison transversale active` | `mestre.repertoireAucuneLiaisonTransversaleActive` |
| L1291 | Span / Badge | `Tablature résolue du Séquenceur` | `mestre.repertoireTablatureResolueDuSequenceur` |
| L1317 | Span / Badge | `🎬 Vidéo de référence & Histoire culturelle` | `mestre.repertoireVideoDeReferenceHistoireCulturelle` |
| L1324 | Attribut title | `Créer une fiche sur le Varal Culture pré-remplie avec ces informations` | `mestre.repertoireCreerUneFicheSurLe` |
| L1347 | Span / Badge | `Lien vidéo YouTube propre au morceau` | `mestre.repertoireLienVideoYoutubePropreAu` |
| L1354 | Bouton | `Effacer` | `mestre.repertoireEffacer` |
| L1379 | Attribut title | `Choisir parmi les playlists YouTube configurées de l'association` | `mestre.repertoireChoisirParmiLesPlaylistsYoutube` |
| L1381 | Span / Badge | `🎬 Choisir parmi nos vidéos` | `mestre.repertoireChoisirParmiNosVideos` |
| L1387 | Span / Badge | `Vidéo YouTube reconnue (ID :` | `mestre.repertoireVideoYoutubeReconnueId` |
| L1397 | Span / Badge | `Notes d'histoire & contexte artistique` | `mestre.repertoireNotesDHistoireContexteArtistique` |
| L1404 | Bouton | `Effacer` | `mestre.repertoireEffacer` |
| L1414 | Attribut placeholder | `Renseignez l'histoire spécifique, la nation d'origine ou l'inspiration du morceau...` | `mestre.repertoireRenseignezLHistoireSpecifiqueLa` |
| L1422 | Span / Badge | `🎬 Vidéo principale configurée` | `mestre.repertoireVideoPrincipaleConfiguree` |
| L1426 | Span / Badge | `Pas de vidéo principale` | `mestre.repertoirePasDeVideoPrincipale` |
| L1429 | Span / Badge | `📜 Contexte historique renseigné` | `mestre.repertoireContexteHistoriqueRenseigne` |
| L1458 | Span / Badge | `✌️ Signes du Mestre associés` | `mestre.repertoireSignesDuMestreAssocies` |
| L1481 | Span / Badge | `signe(s) configuré(s)` | `mestre.repertoireSigneSConfigureS` |
| L1484 | Span / Badge | `Aucun signe du Mestre associé` | `mestre.repertoireAucunSigneDuMestreAssocie` |
| L1524 | Span / Badge | `Aucune note particulière` | `mestre.repertoireAucuneNoteParticuliere` |
| L1546 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |
| L1590 | Span / Badge | `Chant & Paroles` | `mestre.repertoireChantParoles` |
| L1598 | Attribut title | `Fermer` | `mestre.repertoireFermer` |

---

#### 📄 `src/components/mestre/RepertoirePieceStatusSelector.jsx` (5 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L136 | Attribut title | `Modifier le statut de la saison : Au programme / En préparation / Au frigo` | `mestre.repertoireModifierLeStatutDeLa` |
| L146 | Nœud JSX | `Statut de la saison` | `mestre.repertoireStatutDeLaSaison` |
| L161 | Span / Badge | `Au programme cette année` | `mestre.repertoireAuProgrammeCetteAnnee` |
| L177 | Span / Badge | `En préparation / Chantier` | `mestre.repertoireEnPreparationChantier` |
| L193 | Span / Badge | `Au frigo / Archives` | `mestre.repertoireAuFrigoArchives` |

---

#### 📄 `src/components/mestre/ProgramPieceModal.jsx` (10 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L194 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L220 | Span / Badge | `🎵 Audio lié` | `mestre.repertoireAudioLie` |
| L224 | Span / Badge | `🗣️ Toada liée` | `mestre.repertoireToadaLiee` |
| L225 | Span / Badge | `💃 Danse liée` | `mestre.repertoireDanseLiee` |
| L227 | Span / Badge | `📖 Culture liée` | `mestre.repertoireCultureLiee` |
| L230 | Span / Badge | `Morceau autonome (sans ressource externe)` | `mestre.repertoireMorceauAutonomeSansRessourceExterne` |
| L248 | Paragraphe | `Chargement de l'agenda...` | `mestre.repertoireChargementDeLAgenda` |
| L275 | Label de champ | `Consignes & Notes d'intention pour la séance (optionnel)` | `mestre.repertoireConsignesNotesDIntentionPour` |
| L280 | Attribut placeholder | `Ex: Travailler l'appel du Mestre, caler le tempo à 120 BPM, vérifier la relance des caixas...` | `mestre.repertoireExTravaillerLAppelDu` |
| L296 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |

---

#### 📄 `src/components/mestre/ProgramRehearsalModal.jsx` (12 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L158 | Span / Badge | `Programmer en répétition` | `mestre.repertoireProgrammerEnRepetition` |
| L164 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L181 | Span / Badge | `demande` | `mestre.repertoireDemande` |
| L181 | Span / Badge | `d'élèves` | `mestre.repertoireDEleves` |
| L187 | Span / Badge | `% maîtrise` | `mestre.repertoireMaitrise` |
| L206 | Label de champ | `1. Choisir la répétition cible *` | `mestre.repertoire1ChoisirLaRepetitionCible` |
| L210 | Nœud JSX | `Recherche des répétitions à venir...` | `mestre.repertoireRechercheDesRepetitionsAVenir` |
| L214 | Nœud JSX | `⚠️ Aucune répétition planifiée dans l'Agenda à compter d'aujourd'hui. Veuillez d'abord créer une rép` | `mestre.repertoireAucuneRepetitionPlanifieeDansL` |
| L239 | Label de champ | `2. Note d'intention pour le fil conducteur (modifiable)` | `mestre.repertoire2NoteDIntentionPour` |
| L247 | Attribut placeholder | `Ex: Travailler le calage rythmique et le pont vers le chant...` | `mestre.repertoireExTravaillerLeCalageRythmique` |
| L250 | Span / Badge | `Cette note apparaîtra directement dans l'onglet « Fil conducteur » de l'événement.` | `mestre.repertoireCetteNoteApparaitraDirectementDans` |
| L262 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |

---

#### 📄 `src/components/mestre/RepertoireCulturePicker.jsx` (5 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L131 | Span / Badge | `liée` | `mestre.repertoireLiee` |
| L142 | Attribut title | `Créer une fiche sur le Varal Culture pré-remplie` | `mestre.repertoireCreerUneFicheSurLe` |
| L177 | Attribut title | `Détacher cette fiche culturelle` | `mestre.repertoireDetacherCetteFicheCulturelle` |
| L186 | Paragraphe | `Aucune fiche culturelle liée pour le moment. Cochez les fiches correspondantes ci-dessous.` | `mestre.repertoireAucuneFicheCulturelleLieePour` |
| L212 | Attribut title | `Effacer la recherche` | `mestre.repertoireEffacerLaRecherche` |

---

#### 📄 `src/components/mestre/RepertoireModalNavArrows.jsx` (6 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L84 | Attribut aria-label | `Morceau précédent` | `mestre.repertoireMorceauPrecedent` |
| L91 | Span / Badge | `Précédent (` | `mestre.repertoirePrecedent` |
| L97 | Span / Badge | `Raccourci : touche ←` | `mestre.repertoireRaccourciTouche` |
| L121 | Attribut aria-label | `Morceau suivant` | `mestre.repertoireMorceauSuivant` |
| L128 | Span / Badge | `Suivant (` | `mestre.repertoireSuivant` |
| L134 | Span / Badge | `Raccourci : touche →` | `mestre.repertoireRaccourciTouche` |

---

#### 📄 `src/components/mestre/RepertoireVideoModal.jsx` (7 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L37 | Attribut title | `Ouvrir dans un nouvel onglet` | `mestre.repertoireOuvrirDansUnNouvelOnglet` |
| L40 | Span / Badge | `Plein écran externe` | `mestre.repertoirePleinEcranExterne` |
| L46 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L62 | Nœud JSX | `Votre navigateur ne supporte pas la lecture directe de vidéos.` | `mestre.repertoireVotreNavigateurNeSupportePas` |
| L76 | Paragraphe | `Impossible d'intégrer ce lien directement dans l'application.` | `mestre.repertoireImpossibleDIntegrerCeLien` |
| L84 | Nœud JSX | `Ouvrir la vidéo dans un nouvel onglet ↗` | `mestre.repertoireOuvrirLaVideoDansUn` |
| L99 | Nœud JSX | `Fermer` | `mestre.repertoireFermer` |

---

#### 📄 `src/components/mestre/RepertoireVideosPicker.jsx` (8 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L104 | Attribut title | `Choisir parmi les vidéos de l'asso` | `mestre.repertoireChoisirParmiLesVideosDe` |
| L106 | Span / Badge | `🎬 Vidéos asso` | `mestre.repertoireVideosAsso` |
| L122 | Nœud JSX | `Aucune vidéo rattachée pour le moment.` | `mestre.repertoireAucuneVideoRattacheePourLe` |
| L145 | Span / Badge | `Vidéo #` | `mestre.repertoireVideo` |
| L159 | Span / Badge | `Live / Captation` | `mestre.repertoireLiveCaptation` |
| L172 | Attribut title | `Supprimer cette vidéo` | `mestre.repertoireSupprimerCetteVideo` |
| L184 | Span / Badge | `Libellé :` | `mestre.repertoireLibelle` |
| L211 | Span / Badge | `Lien URL :` | `mestre.repertoireLienUrl` |

---

#### 📄 `src/components/mestre/SignalZoomModal.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L28 | Span / Badge | `Signal` | `mestre.repertoireSignal` |
| L39 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L73 | Nœud JSX | `Fermer` | `mestre.repertoireFermer` |

---

#### 📄 `src/components/mestre/TablatureModal.jsx` (6 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L52 | Span / Badge | `Partition textuelle monospace générée depuis le Séquenceur` | `mestre.repertoirePartitionTextuelleMonospaceGenereeDepuis` |
| L62 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L77 | Attribut title | `Lancer l'impression papier de cette tablature` | `mestre.repertoireLancerLImpressionPapierDe` |
| L91 | Attribut title | `Copier l'intégralité du texte dans le presse-papier` | `mestre.repertoireCopierLIntegraliteDuTexte` |
| L98 | Span / Badge | `Astuce : défilement horizontal disponible pour les longues mesures.` | `mestre.repertoireAstuceDefilementHorizontalDisponiblePour` |
| L127 | Nœud JSX | `Fermer` | `mestre.repertoireFermer` |

---

#### 📄 `src/components/mestre/VideoInstrumentCheckboxes.jsx` (5 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L64 | Span / Badge | `Classée dans le bloc « Live / Ensemble »` | `mestre.repertoireClasseeDansLeBlocLive` |
| L77 | Span / Badge | `(Tous pupitres / vue générale)` | `mestre.repertoireTousPupitresVueGenerale` |
| L82 | Span / Badge | `sélectionné` | `mestre.repertoireSelectionne` |
| L92 | Attribut title | `Associer à tous les instruments` | `mestre.repertoireAssocierATousLesInstruments` |
| L100 | Attribut title | `Décocher tous les instruments` | `mestre.repertoireDecocherTousLesInstruments` |

---

#### 📄 `src/components/mestre/WorkshopEditorModal.jsx` (24 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L45 | Message runtime (alert) | `Veuillez sélectionner un fichier image (JPG, PNG, WebP).` | `mestre.repertoireVeuillezSelectionnerUnFichierImage` |
| L62 | Message runtime (alert) | `Erreur lors du téléversement de l'image.` | `mestre.repertoireErreurLorsDuTeleversementDe` |
| L81 | Message runtime (alert) | `Veuillez sélectionner un fichier au format PDF.` | `mestre.repertoireVeuillezSelectionnerUnFichierAu` |
| L98 | Message runtime (alert) | `Erreur lors du téléversement du document PDF.` | `mestre.repertoireErreurLorsDuTeleversementDu` |
| L164 | Span / Badge | `🧵 Éditeur de Tutoriel Atelier Couture` | `mestre.repertoireEditeurDeTutorielAtelierCouture` |
| L175 | Attribut title | `Fermer (Échap)` | `mestre.repertoireFermerEchap` |
| L194 | Label de champ | `Titre du Tutoriel` | `mestre.repertoireTitreDuTutoriel` |
| L203 | Attribut placeholder | `ex: Tutoriel : Bracelets de Maracatu` | `mestre.repertoireExTutorielBraceletsDeMaracatu` |
| L209 | Label de champ | `Coût estimé (€)` | `mestre.repertoireCoutEstime` |
| L219 | Attribut placeholder | `ex: 15.00` | `mestre.repertoireEx1500` |
| L228 | Label de champ | `Description courte / Résumé` | `mestre.repertoireDescriptionCourteResume` |
| L236 | Attribut placeholder | `ex: Fiche de confection complète des bracelets dorés et rubans` | `mestre.repertoireExFicheDeConfectionComplete` |
| L242 | Label de champ | `Statut de publication` | `mestre.repertoireStatutDePublication` |
| L260 | Label de champ | `Liste du matériel nécessaire & Fournitures` | `mestre.repertoireListeDuMaterielNecessaireFournitures` |
| L268 | Attribut placeholder | `ex: 2m de tissu satin rouge, Fil doré N°40, 10 boutons à pression...` | `mestre.repertoireEx2mDeTissuSatin` |
| L275 | Label de champ | `Instructions & Étapes de fabrication` | `mestre.repertoireInstructionsEtapesDeFabrication` |
| L283 | Attribut placeholder | `Détaillez les étapes pas-à-pas pour coudre la pièce...` | `mestre.repertoireDetaillezLesEtapesPasA` |
| L290 | Label de champ | `Lien Vidéo Tutoriel (YouTube, Vimeo, Google Drive...)` | `mestre.repertoireLienVideoTutorielYoutubeVimeo` |
| L306 | Label de champ | `📸 Galerie de Photos & Schémas (` | `mestre.repertoireGalerieDePhotosSchemas` |
| L330 | Attribut title | `Supprimer cette photo` | `mestre.repertoireSupprimerCettePhoto` |
| L343 | Label de champ | `📄 Patrons Couture PDF & Fiches Techniques (` | `mestre.repertoirePatronsCouturePdfFichesTechniques` |
| L369 | Attribut title | `Supprimer ce document` | `mestre.repertoireSupprimerCeDocument` |
| L370 | Bouton | `✕ Supprimer` | `mestre.repertoireSupprimer` |
| L388 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |

---

#### 📄 `src/components/mestre/CreateCultureFicheModal.jsx` (20 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L148 | Titre | `Créer la fiche Varal Culture` | `mestre.repertoireCreerLaFicheVaralCulture` |
| L151 | Span / Badge | `Passerelle automatique depuis «` | `mestre.repertoirePasserelleAutomatiqueDepuis` |
| L161 | Attribut title | `Fermer` | `mestre.repertoireFermer` |
| L177 | Label de champ | `Titre de la fiche Culture` | `mestre.repertoireTitreDeLaFicheCulture` |
| L187 | Attribut placeholder | `Ex: Baque de Luanda, Maracatu de Baque Virado...` | `mestre.repertoireExBaqueDeLuandaMaracatu` |
| L192 | Label de champ | `Catégorie` | `mestre.repertoireCategorie` |
| L201 | Option select | `📖 Histoire` | `mestre.repertoireHistoire` |
| L202 | Option select | `🥁 Musique & Danse` | `mestre.repertoireMusiqueDanse` |
| L203 | Option select | `👑 Tradition & Cour` | `mestre.repertoireTraditionCour` |
| L204 | Option select | `🌿 Orixás` | `mestre.repertoireOrixas` |
| L205 | Option select | `📍 Territoire` | `mestre.repertoireTerritoire` |
| L214 | Span / Badge | `Vidéo YouTube associée` | `mestre.repertoireVideoYoutubeAssociee` |
| L227 | Span / Badge | `Lien YouTube valide reconnu (ID :` | `mestre.repertoireLienYoutubeValideReconnuId` |
| L237 | Span / Badge | `Chapitre introductif / Histoire` | `mestre.repertoireChapitreIntroductifHistoire` |
| L245 | Attribut placeholder | `Titre du chapitre` | `mestre.repertoireTitreDuChapitre` |
| L255 | Attribut placeholder | `Rédigez ou complétez le contexte historique, les origines, la nation ou l'anecdote de ce morceau...` | `mestre.repertoireRedigezOuCompletezLeContexte` |
| L264 | Span / Badge | `Le saviez-vous ? (Anecdote facultative)` | `mestre.repertoireLeSaviezVousAnecdoteFacultative` |
| L272 | Attribut placeholder | `Ex: Cette chanson était traditionnellement chantée au lever du soleil...` | `mestre.repertoireExCetteChansonEtaitTraditionnellement` |
| L278 | Span / Badge | `🔗 La fiche sera automatiquement enregistrée sur le Varal et liée à ce morceau.` | `mestre.repertoireLaFicheSeraAutomatiquementEnregistree` |
| L290 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |

---

#### 📄 `src/components/repertoire/BatchAssignVideoModal.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L132 | Span / Badge | `1. Pupitres cibles ou Répétition générale` | `mestre.repertoire1PupitresCiblesOuRepetition` |
| L152 | Span / Badge | `déjà présent` | `mestre.repertoireDejaPresent` |
| L161 | Nœud JSX | `Annuler` | `mestre.repertoireAnnuler` |

---

#### 📄 `src/components/repertoire/BatchAssignVideoSource.jsx` (11 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L22 | Span / Badge | `Source de la vidéo` | `mestre.repertoireSourceDeLaVideo` |
| L29 | Attribut title | `Piocher une vidéo parmi les playlists de l'association` | `mestre.repertoirePiocherUneVideoParmiLes` |
| L32 | Span / Badge | `Piocher dans mes playlists` | `mestre.repertoirePiocherDansMesPlaylists` |
| L44 | Span / Badge | `Afficher les vidéos de mes playlists` | `mestre.repertoireAfficherLesVideosDeMes` |
| L55 | Attribut title | `Cliquer pour changer de vidéo depuis vos playlists` | `mestre.repertoireCliquerPourChangerDeVideo` |
| L60 | Attribut alt | `Miniature` | `mestre.repertoireMiniature` |
| L63 | Span / Badge | `Changer` | `mestre.repertoireChanger` |
| L72 | Attribut title | `Cliquer pour choisir depuis vos playlists` | `mestre.repertoireCliquerPourChoisirDepuisVos` |
| L76 | Span / Badge | `Playlists` | `mestre.repertoirePlaylists` |
| L101 | Attribut title | `Parcourir les playlists YouTube` | `mestre.repertoireParcourirLesPlaylistsYoutube` |
| L104 | Span / Badge | `Playlists` | `mestre.repertoirePlaylists` |

---

#### 📄 `src/components/repertoire/PieceVideoSection.jsx` (1 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L162 | Attribut title | `Ouvrir la vidéo dans un nouvel onglet` | `mestre.repertoireOuvrirLaVideoDansUn` |

---

#### 📄 `src/components/repertoire/RepertoirePasserelleButton.jsx` (1 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L90 | Span / Badge | `Fiche Répertoire :` | `mestre.repertoireFicheRepertoire` |

---

## 🎭 Passerelle Séquenciad'Or, Presets & Signes (Catégorie : `sequenceur` ➔ `mestre.sequenceur.*`)

**Volume détecté :** 39 chaînes brutes réparties sur 4 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/RepertoireUnlinkedPresetsBanner.jsx` (6 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L29 | Span / Badge | `preset` | `mestre.sequenceurPreset` |
| L29 | Span / Badge | `du Séquenceur non répertorié` | `mestre.sequenceurDuSequenceurNonRepertorie` |
| L32 | Paragraphe | `Des morceaux complets existent dans le Séquenceur sans fiche associée dans le Répertoire de saison.` | `mestre.sequenceurDesMorceauxCompletsExistentDans` |
| L69 | Span / Badge | `Preset complet` | `mestre.sequenceurPresetComplet` |
| L73 | Span / Badge | `🎵 Audio` | `mestre.sequenceurAudio` |
| L79 | Span / Badge | `BPM` | `mestre.sequenceurBpm` |

---

#### 📄 `src/components/mestre/RepertoireTrainingsManager.jsx` (8 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L131 | Span / Badge | `Entraînements rattachés au morceau` | `mestre.sequenceurEntrainementsRattachesAuMorceau` |
| L134 | Span / Badge | `rattaché` | `mestre.sequenceurRattache` |
| L140 | Paragraphe | `Les entraînements du preset sequenciador sont détectés automatiquement. Cliquez sur` | `mestre.sequenceurLesEntrainementsDuPresetSequenciador` |
| L141 | Paragraphe | `pour détacher un entraînement ou utilisez le sélecteur pour en associer d'autres.` | `mestre.sequenceurPourDetacherUnEntrainementOu` |
| L171 | Span / Badge | `manuel` | `mestre.sequenceurManuel` |
| L182 | Attribut title | `Détacher cet entraînement du morceau` | `mestre.sequenceurDetacherCetEntrainementDuMorceau` |
| L191 | Paragraphe | `Aucun entraînement rattaché à ce morceau pour le moment.` | `mestre.sequenceurAucunEntrainementRattacheACe` |
| L216 | Option select | `BPM)` | `mestre.sequenceurBpm` |

---

#### 📄 `src/components/mestre/RepertoireSinaisDoMestreEditor.jsx` (10 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L184 | Label de champ | `Signes du Mestre associés (` | `mestre.sequenceurSignesDuMestreAssocies` |
| L212 | Bouton | `Tout effacer` | `mestre.sequenceurToutEffacer` |
| L274 | Attribut title | `Supprimer ce signe` | `mestre.sequenceurSupprimerCeSigne` |
| L290 | Span / Badge | `Bibliothèque des Signes du Mestre (` | `mestre.sequenceurBibliothequeDesSignesDuMestre` |
| L296 | Label de champ | `Mesure :` | `mestre.sequenceurMesure` |
| L313 | Attribut placeholder | `Filtrer les gestes (ex: opanijé, luanda, samba...)` | `mestre.sequenceurFiltrerLesGestesExOpanije` |
| L320 | Nœud JSX | `Chargement des signaux...` | `mestre.sequenceurChargementDesSignaux` |
| L324 | Nœud JSX | `Aucun signe ne correspond dans la bibliothèque.` | `mestre.sequenceurAucunSigneNeCorrespondDans` |
| L407 | Attribut placeholder | `Mesure` | `mestre.sequenceurMesure` |
| L427 | Nœud JSX | `Ajouter` | `mestre.sequenceurAjouter` |

---

#### 📄 `src/components/mestre/reflex/SignalReflexCard.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L11 | Config statique (label) | `Gonguê` | `mestre.sequenceurGongue` |
| L13 | Config statique (label) | `Marcante` | `mestre.sequenceurMarcante` |
| L14 | Config statique (label) | `Agbê` | `mestre.sequenceurAgbe` |
| L115 | Titre | `Mesure` | `mestre.sequenceurMesure` |
| L118 | Paragraphe | `Temps 1 ciblé :` | `mestre.sequenceurTemps1Cible` |
| L119 | Nœud JSX | `Mesure` | `mestre.sequenceurMesure` |
| L134 | Bouton | `🎯 Défi interactif` | `mestre.sequenceurDefiInteractif` |
| L145 | Bouton | `👁️ Simple repère` | `mestre.sequenceurSimpleRepere` |
| L157 | Span / Badge | `Aperçu pour le pupitre :` | `mestre.sequenceurApercuPourLePupitre` |
| L178 | Attribut title | `Générer 3 nouvelles variations de leurres` | `mestre.sequenceurGenerer3NouvellesVariationsDe` |
| L181 | Span / Badge | `Renouveler` | `mestre.sequenceurRenouveler` |
| L204 | Span / Badge | `Bonne Tablature (Temps 1 Mesure` | `mestre.sequenceurBonneTablatureTemps1Mesure` |
| L216 | Span / Badge | `Leurre #` | `mestre.sequenceurLeurre` |
| L230 | Paragraphe | `Ce signal s'affichera sous forme de repère visuel à la mesure` | `mestre.sequenceurCeSignalSAfficheraSous` |
| L231 | Paragraphe | `sans interrompre le son.` | `mestre.sequenceurSansInterrompreLeSon` |

---

## 🎭 Orientation, Casting & Disciplines (Catégorie : `casting` ➔ `mestre.casting.*`)

**Volume détecté :** 83 chaînes brutes réparties sur 3 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/MestreOrientationCasting.jsx` (56 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L542 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L556 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L589 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L609 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L632 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L652 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L681 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L718 | Message runtime (alert) | `Erreur de sauvegarde de la voix d'Alfaia` | `mestre.castingErreurDeSauvegardeDeLa` |
| L747 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L768 | Message runtime (alert) | `Erreur de sauvegarde` | `mestre.castingErreurDeSauvegarde` |
| L786 | Message runtime (alert) | `Message envoyé !` | `mestre.castingMessageEnvoye` |
| L789 | Message runtime (alert) | `Erreur lors de l'envoi.` | `mestre.castingErreurLorsDeLEnvoi` |
| L819 | Message runtime (alert) | `Erreur lors de la validation de l'orientation.` | `mestre.castingErreurLorsDeLaValidation` |
| L829 | Message runtime (alert) | `Aucun membre à exporter.` | `mestre.castingAucunMembreAExporter` |
| L926 | Span / Badge | `Voix Alfaia :` | `mestre.castingVoixAlfaia` |
| L966 | Message runtime (alert) | `Erreur de sauvegarde de l'attribution Caixas` | `mestre.castingErreurDeSauvegardeDeL` |
| L979 | Span / Badge | `Attribution Caixas :` | `mestre.castingAttributionCaixas` |
| L1011 | Paragraphe | `Chargement du Tableau d'Orientation & Casting...` | `mestre.castingChargementDuTableauDOrientation` |
| L1029 | Span / Badge | `Orientation, Casting & Pupitres` | `mestre.castingOrientationCastingPupitres` |
| L1031 | Paragraphe | `Tableau de bord de répartition des pupitres et validation directe des vœux par la Mestria.` | `mestre.castingTableauDeBordDeRepartition` |
| L1040 | Span / Badge | `Non affecté` | `mestre.castingNonAffecte` |
| L1045 | Span / Badge | `Vœux formulés` | `mestre.castingVUxFormules` |
| L1054 | Span / Badge | `📊 Quotas & Effectifs par Pupitre (Cliquez pour filtrer)` | `mestre.castingQuotasEffectifsParPupitreCliquez` |
| L1097 | Span / Badge | `🔗 Lié` | `mestre.castingLie` |
| L1102 | Span / Badge | `Actif` | `mestre.castingActif` |
| L1129 | Span / Badge | `⚠️ Effectif vide` | `mestre.castingEffectifVide` |
| L1143 | Titre | `📋 Tableau d'Affectation` | `mestre.castingTableauDAffectation` |
| L1155 | Bouton | `Tous (` | `mestre.castingTous` |
| L1166 | Span / Badge | `⏳ Vœux en attente` | `mestre.castingVUxEnAttente` |
| L1181 | Span / Badge | `💃 Section Danse` | `mestre.castingSectionDanse` |
| L1194 | Attribut placeholder | `🔍 Rechercher un membre ou vœu...` | `mestre.castingRechercherUnMembreOuV` |
| L1206 | Attribut title | `Exporter les affectations et vœux au format CSV (Excel)` | `mestre.castingExporterLesAffectationsEtV` |
| L1208 | Span / Badge | `📥 Exporter (CSV)` | `mestre.castingExporterCsv` |
| L1218 | En-tête th | `Membre` | `mestre.castingMembre` |
| L1219 | En-tête th | `Inst. Maîtrisé (Historique)` | `mestre.castingInstMaitriseHistorique` |
| L1220 | En-tête th | `Orientation Saison & Vœux` | `mestre.castingOrientationSaisonVUx` |
| L1221 | En-tête th | `Danse & Niveau` | `mestre.castingDanseNiveau` |
| L1227 | Nœud JSX | `Aucun membre ne correspond aux critères de recherche.` | `mestre.castingAucunMembreNeCorrespondAux` |
| L1267 | Bouton | `✉️ MP` | `mestre.castingMp` |
| L1284 | Span / Badge | `Inst. Principal` | `mestre.castingInstPrincipal` |
| L1295 | Option select | `-- Aucun --` | `mestre.castingAucun` |
| L1313 | Option select | `- Niv. -` | `mestre.castingNiv` |
| L1334 | Span / Badge | `Dispo en secours` | `mestre.castingDispoEnSecours` |
| L1348 | Span / Badge | `2ème Inst. Historique` | `mestre.casting2emeInstHistorique` |
| L1359 | Option select | `-- Aucun --` | `mestre.castingAucun` |
| L1376 | Option select | `- Niv. -` | `mestre.castingNiv` |
| L1397 | Span / Badge | `Dispo en secours` | `mestre.castingDispoEnSecours` |
| L1417 | Span / Badge | `Vœux actuels :` | `mestre.castingVUxActuels` |
| L1436 | Span / Badge | `Souhaite changer` | `mestre.castingSouhaiteChanger` |
| L1453 | Span / Badge | `🔄 Poursuite (` | `mestre.castingPoursuite` |
| L1467 | Span / Badge | `Apprentissage Saison :` | `mestre.castingApprentissageSaison` |
| L1479 | Option select | `-- Aucun --` | `mestre.castingAucun` |
| L1497 | Option select | `-- Niveau --` | `mestre.castingNiveau` |
| L1517 | Span / Badge | `Dispo en secours` | `mestre.castingDispoEnSecours` |
| L1541 | Option select | `Non inscrit(e)` | `mestre.castingNonInscritE` |
| L1542 | Option select | `💃 Débutant` | `mestre.castingDebutant` |

---

#### 📄 `src/components/mestre/MestreCustomCategories.jsx` (17 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L70 | Message runtime (alert) | `Cette catégorie de pratique existe déjà !` | `mestre.castingCetteCategorieDePratiqueExiste` |
| L181 | Paragraphe | `Chargement des catégories de pratique...` | `mestre.castingChargementDesCategoriesDePratique` |
| L194 | Span / Badge | `Mestria` | `mestre.castingMestria` |
| L196 | Span / Badge | `Catégories de pratique` | `mestre.castingCategoriesDePratique` |
| L199 | Titre | `Catégories & Niveaux de Pratique` | `mestre.castingCategoriesNiveauxDePratique` |
| L201 | Paragraphe | `Configurez les sections, niveaux ou groupes de pratique (ex : Débutants, Avancés, Danse, Percussion,` | `mestre.castingConfigurezLesSectionsNiveauxOu` |
| L212 | Nœud JSX | `⬅️ Retour` | `mestre.castingRetour` |
| L220 | Titre | `➕ Ajouter une nouvelle catégorie` | `mestre.castingAjouterUneNouvelleCategorie` |
| L226 | Label de champ | `Intitulé de la section ou du niveau` | `mestre.castingIntituleDeLaSectionOu` |
| L240 | Attribut placeholder | `Ex: Section Danse Avancée, Percussion Pro, Débutants 1ère année...` | `mestre.castingExSectionDanseAvanceePercussion` |
| L247 | Label de champ | `Couleur de badge` | `mestre.castingCouleurDeBadge` |
| L267 | Span / Badge | `Palette Cordel :` | `mestre.castingPaletteCordel` |
| L290 | Nœud JSX | `+ Ajouter la catégorie` | `mestre.castingAjouterLaCategorie` |
| L300 | Titre | `📋 Catégories configurées (` | `mestre.castingCategoriesConfigurees` |
| L303 | Span / Badge | `Utilisées dans l'agenda, les castings et les filtres trombinoscope` | `mestre.castingUtiliseesDansLAgendaLes` |
| L310 | Paragraphe | `Aucune catégorie de pratique enregistrée pour l'instant.` | `mestre.castingAucuneCategorieDePratiqueEnregistree` |
| L336 | Span / Badge | `🔄 Mettre à jour rétroactivement les anciens profils membres qui utilisent encore les intitulés par ` | `mestre.castingMettreAJourRetroactivementLes` |

---

#### 📄 `src/components/mestre/CategoryCardItem.jsx` (10 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L40 | Message runtime (alert) | `Une autre catégorie de pratique porte déjà cet intitulé !` | `mestre.castingUneAutreCategorieDePratique` |
| L70 | Span / Badge | `✏️ Modifier la catégorie` | `mestre.castingModifierLaCategorie` |
| L73 | Span / Badge | `(Entrée pour valider, Échap pour annuler)` | `mestre.castingEntreePourValiderEchapPour` |
| L79 | Label de champ | `Nouvel intitulé` | `mestre.castingNouvelIntitule` |
| L90 | Attribut placeholder | `Ex: Première année, Plus d'un an...` | `mestre.castingExPremiereAnneePlusD` |
| L103 | Attribut title | `Choisir une couleur` | `mestre.castingChoisirUneCouleur` |
| L125 | Nœud JSX | `Annuler` | `mestre.castingAnnuler` |
| L135 | Nœud JSX | `💾 Valider` | `mestre.castingValider` |
| L166 | Attribut title | `Modifier l'intitulé et la couleur de cette catégorie` | `mestre.castingModifierLIntituleEtLa` |
| L175 | Attribut title | `Supprimer cette catégorie` | `mestre.castingSupprimerCetteCategorie` |

---

## 🎭 Régie Scénique & Plateau (Catégorie : `stageLayout` ➔ `mestre.stageLayout.*`)

**Volume détecté :** 34 chaînes brutes réparties sur 2 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/MestreStageLayout.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L220 | Span / Badge | `Publié` | `mestre.stageLayoutPublie` |
| L229 | Span / Badge | `Brouillon` | `mestre.stageLayoutBrouillon` |
| L236 | Span / Badge | `À créer` | `mestre.stageLayoutACreer` |
| L255 | Nœud JSX | `← Liste des événements` | `mestre.stageLayoutListeDesEvenements` |
| L277 | Label de champ | `Changer :` | `mestre.stageLayoutChanger` |
| L300 | Attribut title | `Ouvrir les détails complets de cet événement` | `mestre.stageLayoutOuvrirLesDetailsCompletsDe` |
| L301 | Nœud JSX | `🔍 Détails` | `mestre.stageLayoutDetails` |
| L328 | Span / Badge | `Direction Artistique — Plans de Scène & Cortejo` | `mestre.stageLayoutDirectionArtistiquePlansDeScene` |
| L330 | Paragraphe | `Sélectionnez une prestation pour concevoir ou modifier la disposition scénique de la troupe` | `mestre.stageLayoutSelectionnezUnePrestationPourConcevoir` |
| L386 | Bouton | `🎭 Prestations & Sorties (` | `mestre.stageLayoutPrestationsSorties` |
| L398 | Bouton | `📐 Avec plan de scène (` | `mestre.stageLayoutAvecPlanDeScene` |
| L410 | Bouton | `👥 Tous les événements (` | `mestre.stageLayoutTousLesEvenements` |
| L418 | Span / Badge | `⏳ Chargement des dates...` | `mestre.stageLayoutChargementDesDates` |
| L436 | Nœud JSX | `Afficher tous les événements` | `mestre.stageLayoutAfficherTousLesEvenements` |
| L451 | En-tête th | `Plan de scène` | `mestre.stageLayoutPlanDeScene` |

---

#### 📄 `src/components/event-details/EventStageLayoutSection.jsx` (19 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L249 | Message runtime (alert) | `⚠️ Seuls les danseurs et danseuses peuvent être placés sur l'Avant-Scène.` | `mestre.stageLayoutSeulsLesDanseursEtDanseuses` |
| L319 | Message runtime (alert) | `⚠️ Seuls les danseurs et danseuses peuvent être placés sur l'Avant-Scène.` | `mestre.stageLayoutSeulsLesDanseursEtDanseuses` |
| L498 | Span / Badge | `🎭 Aucun plan de scène n'a encore été configuré pour cet événement.` | `mestre.stageLayoutAucunPlanDeSceneN` |
| L504 | Bouton | `🛠️ Créer le plan de scène dans l'Espace Mestre` | `mestre.stageLayoutCreerLePlanDeScene` |
| L527 | Span / Badge | `🔒 Brouillon / Masqué aux adhérents` | `mestre.stageLayoutBrouillonMasqueAuxAdherents` |
| L565 | Bouton | `🛠️ Placer / Modifier dans l'Espace Mestre` | `mestre.stageLayoutPlacerModifierDansLEspace` |
| L581 | Span / Badge | `🥁 Percussions :` | `mestre.stageLayoutPercussions` |
| L582 | Label de champ | `Lignes:` | `mestre.stageLayoutLignes` |
| L593 | Label de champ | `Colonnes:` | `mestre.stageLayoutColonnes` |
| L607 | Span / Badge | `💃 Danse :` | `mestre.stageLayoutDanse` |
| L608 | Label de champ | `Lignes:` | `mestre.stageLayoutLignes` |
| L619 | Label de champ | `Colonnes:` | `mestre.stageLayoutColonnes` |
| L650 | Attribut title | `Désélectionner (ou touche Échap)` | `mestre.stageLayoutDeselectionnerOuToucheEchap` |
| L651 | Bouton | `✕ Désélectionner` | `mestre.stageLayoutDeselectionner` |
| L664 | Span / Badge | `Voix attribuée pour la scène :` | `mestre.stageLayoutVoixAttribueePourLaScene` |
| L686 | Span / Badge | `(hors profil)` | `mestre.stageLayoutHorsProfil` |
| L704 | Span / Badge | `Instrument attribué pour la scène :` | `mestre.stageLayoutInstrumentAttribuePourLaScene` |
| L779 | Span / Badge | `Tous les membres présents ont été placés.` | `mestre.stageLayoutTousLesMembresPresentsOnt` |
| L829 | Label de champ | `Publier le plan de scène dans l'agenda` | `mestre.stageLayoutPublierLePlanDeScene` |

---

## 🎭 Consignes Artistiques & Mot du Mestre (Catégorie : `editorial` ➔ `mestre.editorial.*`)

**Volume détecté :** 12 chaînes brutes réparties sur 1 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/MestreMotMestre.jsx` (12 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L56 | Message runtime (alert) | `Le mot du Mestre a été mis à jour avec succès !` | `mestre.editorialLeMotDuMestreA` |
| L76 | Titre | `Gestion du Mot du Mestre` | `mestre.editorialGestionDuMotDuMestre` |
| L91 | Span / Badge | `Publier et afficher sur le tableau de bord des membres` | `mestre.editorialPublierEtAfficherSurLe` |
| L97 | Label de champ | `Message du Mestre (Éditeur)` | `mestre.editorialMessageDuMestreEditeur` |
| L105 | Attribut placeholder | `Rédigez votre message à l'attention des membres...` | `mestre.editorialRedigezVotreMessageAL` |
| L113 | Label de champ | `Signature / Auteur du message` | `mestre.editorialSignatureAuteurDuMessage` |
| L120 | Attribut placeholder | `Ex : Mestre, L'équipe...` | `mestre.editorialExMestreLEquipe` |
| L128 | Label de champ | `🚀 Bouton d'action / Call to Action (Optionnel)` | `mestre.editorialBoutonDActionCallTo` |
| L133 | Label de champ | `Texte du bouton` | `mestre.editorialTexteDuBouton` |
| L141 | Attribut placeholder | `Ex : Mettre à jour mon profil` | `mestre.editorialExMettreAJourMon` |
| L146 | Label de champ | `Page / Route de redirection` | `mestre.editorialPageRouteDeRedirection` |
| L154 | Attribut placeholder | `Ex : /profil ou mestre-orientation` | `mestre.editorialExProfilOuMestreOrientation` |

---

## 🎭 Pédagogie & Évaluations du Mestre (Catégorie : `pedagogy` ➔ `mestre.pedagogy.*`)

**Volume détecté :** 103 chaînes brutes réparties sur 4 composant(s) nécessitant une intervention (0 composant(s) 100% conforme(s)).

### ⚠️ Composants contenant des textes bruts :

#### 📄 `src/components/mestre/MestrePedagogyDashboard.jsx` (31 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L558 | Message runtime (alert) | `Toutes les évaluations ont été remises à zéro avec succès.` | `mestre.pedagogyToutesLesEvaluationsOntEte` |
| L561 | Message runtime (alert) | `Erreur lors de la remise à zéro.` | `mestre.pedagogyErreurLorsDeLaRemise` |
| L676 | Message runtime (alert) | `Erreur lors de la suppression des données de test.` | `mestre.pedagogyErreurLorsDeLaSuppression` |
| L684 | Nœud JSX | `Accès réservé au Mestre et à l'équipe pédagogique.` | `mestre.pedagogyAccesReserveAuMestreEt` |
| L710 | Span / Badge | `Épinglé :` | `mestre.pedagogyEpingle` |
| L727 | Nœud JSX | `élément(s) de test E2E détecté(s) :` | `mestre.pedagogyElementSDeTestE2e` |
| L727 | Span / Badge | `Ces séquences issues des tests automatisés sont automatiquement masquées de vos pupitres et de la Da` | `mestre.pedagogyCesSequencesIssuesDesTests` |
| L735 | Attribut title | `Supprimer définitivement tous les artefacts de tests E2E de la base Firestore` | `mestre.pedagogySupprimerDefinitivementTousLesArtefacts` |
| L752 | Attribut aria-label | `Points chauds de répétition` | `mestre.pedagogyPointsChaudsDeRepetition` |
| L765 | Nœud JSX | `Analyse des points chauds...` | `mestre.pedagogyAnalyseDesPointsChauds` |
| L769 | Nœud JSX | `✨ Aucun point critique sous 60%. Tous les rythmes et chants évalués sont au vert !` | `mestre.pedagogyAucunPointCritiqueSous60` |
| L781 | Span / Badge | `Priorité #` | `mestre.pedagogyPriorite` |
| L804 | Attribut title | `Programmer directement dans le fil conducteur de la prochaine répétition` | `mestre.pedagogyProgrammerDirectementDansLeFil` |
| L814 | Attribut title | `Épingler directement dans le bloc-notes de répétition` | `mestre.pedagogyEpinglerDirectementDansLeBloc` |
| L830 | Attribut aria-label | `Résultats aux défis de la troupe` | `mestre.pedagogyResultatsAuxDefisDeLa` |
| L842 | Attribut aria-label | `Matrices d'aisance par discipline` | `mestre.pedagogyMatricesDAisanceParDiscipline` |
| L856 | Span / Badge | `Percussion` | `mestre.pedagogyPercussion` |
| L882 | Span / Badge | `Chants & Toadas` | `mestre.pedagogyChantsToadas` |
| L895 | Span / Badge | `Entraînements (` | `mestre.pedagogyEntrainements` |
| L906 | Attribut title | `Administration annuelle` | `mestre.pedagogyAdministrationAnnuelle` |
| L909 | Span / Badge | `Saison` | `mestre.pedagogySaison` |
| L914 | Nœud JSX | `Calcul des matrices pédagogiques en cours...` | `mestre.pedagogyCalculDesMatricesPedagogiquesEn` |
| L977 | Span / Badge | `Remise à zéro annuelle` | `mestre.pedagogyRemiseAZeroAnnuelle` |
| L979 | Paragraphe | `Pour préparer la nouvelle saison, vous pouvez remettre à zéro l'ensemble des évaluations de tous les` | `mestre.pedagogyPourPreparerLaNouvelleSaison` |
| L986 | Bouton | `🔄 Réinitialiser les compteurs` | `mestre.pedagogyReinitialiserLesCompteurs` |
| L994 | Span / Badge | `Dépollution des tests automatisés (E2E)` | `mestre.pedagogyDepollutionDesTestsAutomatisesE2e` |
| L996 | Paragraphe | `Si des tests automatisés ont généré des séquences temporaires, des motifs de test ou des évaluations` | `mestre.pedagogySiDesTestsAutomatisesOnt` |
| L1009 | Span / Badge | `élément(s) de test actuellement détecté(s)` | `mestre.pedagogyElementSDeTestActuellement` |
| L1023 | Attribut aria-label | `Bloc-notes persistant et ordre du jour de répétition` | `mestre.pedagogyBlocNotesPersistantEtOrdre` |
| L1028 | Span / Badge | `Ordre du jour & Bloc-notes de répétition` | `mestre.pedagogyOrdreDuJourBlocNotes` |
| L1030 | Span / Badge | `Persisté dans Firestore • Passerelle directe vers l'Agenda` | `mestre.pedagogyPersisteDansFirestorePasserelleDirecte` |

---

#### 📄 `src/components/mestre/MestrePedagogyNotepad.jsx` (17 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L136 | Titre | `📌 Bloc-Notes` | `mestre.pedagogyBlocNotes` |
| L139 | Paragraphe | `À Travailler en Répétition` | `mestre.pedagogyATravaillerEnRepetition` |
| L146 | Nœud JSX | `Chargement...` | `mestre.pedagogyChargement` |
| L149 | Nœud JSX | `Aucun point épinglé.` | `mestre.pedagogyAucunPointEpingle` |
| L172 | Span / Badge | `Épinglé par` | `mestre.pedagogyEpinglePar` |
| L179 | Attribut title | `Supprimer cette note` | `mestre.pedagogySupprimerCetteNote` |
| L196 | Nœud JSX | `📅 Programmer (` | `mestre.pedagogyProgrammer` |
| L208 | Span / Badge | `Ajouter à une répétition` | `mestre.pedagogyAjouterAUneRepetition` |
| L211 | Paragraphe | `Les` | `mestre.pedagogyLes` |
| L212 | Paragraphe | `note` | `mestre.pedagogyNote` |
| L212 | Paragraphe | `sélectionnée` | `mestre.pedagogySelectionnee` |
| L212 | Paragraphe | `ser` | `mestre.pedagogySer` |
| L212 | Paragraphe | `ajoutée` | `mestre.pedagogyAjoutee` |
| L212 | Paragraphe | `au fil conducteur de la répétition choisie.` | `mestre.pedagogyAuFilConducteurDeLa` |
| L221 | Option select | `-- Aucune répétition à venir trouvée --` | `mestre.pedagogyAucuneRepetitionAVenirTrouvee` |
| L224 | Option select | `-- Choisir une répétition --` | `mestre.pedagogyChoisirUneRepetition` |
| L239 | Nœud JSX | `Annuler` | `mestre.pedagogyAnnuler` |

---

#### 📄 `src/components/mestre/MestreAutoEvalConfig.jsx` (36 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L256 | Nœud JSX | `Accès refusé.` | `mestre.pedagogyAccesRefuse` |
| L259 | Config statique (label) | `Visibilité des Onglets` | `mestre.pedagogyVisibiliteDesOnglets` |
| L260 | Config statique (label) | `Visibilité des Rythmes` | `mestre.pedagogyVisibiliteDesRythmes` |
| L261 | Config statique (label) | `Configuration Globale QCM` | `mestre.pedagogyConfigurationGlobaleQcm` |
| L262 | Config statique (label) | `QCM Percussion` | `mestre.pedagogyQcmPercussion` |
| L263 | Config statique (label) | `QCM Danse` | `mestre.pedagogyQcmDanse` |
| L264 | Config statique (label) | `QCM Chant` | `mestre.pedagogyQcmChant` |
| L265 | Config statique (label) | `QCM Atelier` | `mestre.pedagogyQcmAtelier` |
| L266 | Config statique (label) | `QCM Culture` | `mestre.pedagogyQcmCulture` |
| L267 | Config statique (label) | `Signaux du Maître` | `mestre.pedagogySignauxDuMaitre` |
| L268 | Config statique (label) | `Banque de Leurres` | `mestre.pedagogyBanqueDeLeurres` |
| L276 | Titre | `📝 Auto-Évaluation` | `mestre.pedagogyAutoEvaluation` |
| L279 | Paragraphe | `Paramétrez la difficulté des auto-évaluations, les questions personnalisées par pupitre et la config` | `mestre.pedagogyParametrezLaDifficulteDesAuto` |
| L307 | Nœud JSX | `Chargement des configurations...` | `mestre.pedagogyChargementDesConfigurations` |
| L314 | Titre | `Visibilité des onglets dans Mon Parcours` | `mestre.pedagogyVisibiliteDesOngletsDansMon` |
| L317 | Paragraphe | `Activez ou désactivez les onglets visibles par les élèves dans leur espace Mon Parcours.` | `mestre.pedagogyActivezOuDesactivezLesOnglets` |
| L323 | Config statique (label) | `Percussion` | `mestre.pedagogyPercussion` |
| L325 | Config statique (label) | `Chant` | `mestre.pedagogyChant` |
| L326 | Config statique (label) | `Atelier (Fabrication/Entretien)` | `mestre.pedagogyAtelierFabricationEntretien` |
| L328 | Config statique (label) | `Défis rythmiques (Entraînements & Réflexes)` | `mestre.pedagogyDefisRythmiquesEntrainementsReflexes` |
| L343 | Span / Badge | `Afficher l'onglet "` | `mestre.pedagogyAfficherLOnglet` |
| L347 | Span / Badge | `Désactivé par défaut. Révèle l'onglet des programmes métronomiques et défis de réaction dans Mon Par` | `mestre.pedagogyDesactiveParDefautReveleL` |
| L361 | Titre | `Visibilité des Rythmes (QCM & Carnet d'Aisance)` | `mestre.pedagogyVisibiliteDesRythmesQcmCarnet` |
| L364 | Paragraphe | `Décochez les "petites boucles" ou patterns sans valeur pédagogique pour les masquer totalement de l'` | `mestre.pedagogyDecochezLesPetitesBouclesOu` |
| L390 | Message runtime (alert) | `Erreur lors de la sauvegarde.` | `mestre.pedagogyErreurLorsDeLaSauvegarde` |
| L399 | Span / Badge | `Masqué` | `mestre.pedagogyMasque` |
| L428 | Titre | `1. Sélection` | `mestre.pedagogy1Selection` |
| L445 | Titre | `2. Questions Personnalisées` | `mestre.pedagogy2QuestionsPersonnalisees` |
| L467 | Titre | `1. Sélection (Danse)` | `mestre.pedagogy1SelectionDanse` |
| L483 | Titre | `2. Questions Personnalisées` | `mestre.pedagogy2QuestionsPersonnalisees` |
| L505 | Titre | `1. Sélection Chant` | `mestre.pedagogy1SelectionChant` |
| L521 | Titre | `2. Questions Personnalisées` | `mestre.pedagogy2QuestionsPersonnalisees` |
| L541 | Titre | `1. Sélection Fiche Atelier` | `mestre.pedagogy1SelectionFicheAtelier` |
| L560 | Titre | `2. Questions Personnalisées` | `mestre.pedagogy2QuestionsPersonnalisees` |
| L580 | Titre | `1. Sélection Fiche Culture` | `mestre.pedagogy1SelectionFicheCulture` |
| L596 | Titre | `2. Questions Personnalisées` | `mestre.pedagogy2QuestionsPersonnalisees` |

---

#### 📄 `src/components/mestre/CustomQuizConfigPanel.jsx` (19 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L134 | Paragraphe | `Sélectionnez un élément à gauche pour configurer son QCM.` | `mestre.pedagogySelectionnezUnElementAGauche` |
| L143 | Span / Badge | `Visibilité Élèves (Mon Parcours)` | `mestre.pedagogyVisibiliteElevesMonParcours` |
| L161 | Span / Badge | `Signal du Maître Associé` | `mestre.pedagogySignalDuMaitreAssocie` |
| L169 | Option select | `-- Aucun signal --` | `mestre.pedagogyAucunSignal` |
| L177 | Span / Badge | `Questions actives pour :` | `mestre.pedagogyQuestionsActivesPour` |
| L183 | Paragraphe | `Aucune question personnalisée pour cet élément.` | `mestre.pedagogyAucuneQuestionPersonnaliseePourCet` |
| L192 | Nœud JSX | `Audio attaché` | `mestre.pedagogyAudioAttache` |
| L206 | Attribut title | `Supprimer la question` | `mestre.pedagogySupprimerLaQuestion` |
| L219 | Nœud JSX | `✓ Question ajoutée !` | `mestre.pedagogyQuestionAjoutee` |
| L224 | Span / Badge | `+ Nouvelle Question` | `mestre.pedagogyNouvelleQuestion` |
| L232 | Bouton | `⚡ Générer auto.` | `mestre.pedagogyGenererAuto` |
| L241 | Attribut placeholder | `La question (ex: Quel est ce pattern ?)` | `mestre.pedagogyLaQuestionExQuelEst` |
| L248 | Label de champ | `Audio / Média lié (Optionnel)` | `mestre.pedagogyAudioMediaLieOptionnel` |
| L254 | Option select | `-- Aucun média (Texte uniquement) --` | `mestre.pedagogyAucunMediaTexteUniquement` |
| L268 | Attribut placeholder | `La BONNE réponse` | `mestre.pedagogyLaBonneReponse` |
| L277 | Attribut placeholder | `Fausse réponse 1` | `mestre.pedagogyFausseReponse1` |
| L285 | Attribut placeholder | `Fausse réponse 2 (opt)` | `mestre.pedagogyFausseReponse2Opt` |
| L292 | Attribut placeholder | `Fausse réponse 3 (opt)` | `mestre.pedagogyFausseReponse3Opt` |
| L296 | Nœud JSX | `Ajouter au Quiz` | `mestre.pedagogyAjouterAuQuiz` |

---

## 📊 Récapitulatif Chiffré Global — Pôle Mestria

| Sous-Module Mestria | Catégorie / Préfixe | Fichiers Inspectés | Fichiers 100% Conformes | Fichiers avec textes bruts | Total Chaînes Brutes |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Répertoire & Modales Associées** | `mestre.repertoire` | 19 | 0 | 19 | **233** |
| **Passerelle Séquenciad'Or, Presets & Signes** | `mestre.sequenceur` | 4 | 0 | 4 | **39** |
| **Orientation, Casting & Disciplines** | `mestre.casting` | 3 | 0 | 3 | **83** |
| **Régie Scénique & Plateau** | `mestre.stageLayout` | 2 | 0 | 2 | **34** |
| **Consignes Artistiques & Mot du Mestre** | `mestre.editorial` | 1 | 0 | 1 | **12** |
| **Pédagogie & Évaluations du Mestre** | `mestre.pedagogy` | 4 | 0 | 4 | **103** |
| **TOTAL PÔLE MESTRIA** | — | **33** | **0** | **33** | **504** |

### 🎯 Synthèse des composants 100% conformes vs à traiter

- **Composants 100 % conformes (0 fichier(s)) :**
  *(Aucun fichier entièrement vierge de texte brut dans le périmètre initial analysé)*

- **Composants à internationaliser (33 fichiers, 504 chaînes brutes au total) :**
  - `src/components/mestre/MestreRepertoireView.jsx` (38 chaînes brutes)
  - `src/components/mestre/MestreRepertoireHeader.jsx` (11 chaînes brutes)
  - `src/components/mestre/RepertoirePieceModal.jsx` (57 chaînes brutes)
  - `src/components/mestre/RepertoirePieceStatusSelector.jsx` (5 chaînes brutes)
  - `src/components/mestre/ProgramPieceModal.jsx` (10 chaînes brutes)
  - `src/components/mestre/ProgramRehearsalModal.jsx` (12 chaînes brutes)
  - `src/components/mestre/RepertoireCulturePicker.jsx` (5 chaînes brutes)
  - `src/components/mestre/RepertoireModalNavArrows.jsx` (6 chaînes brutes)
  - `src/components/mestre/RepertoireVideoModal.jsx` (7 chaînes brutes)
  - `src/components/mestre/RepertoireVideosPicker.jsx` (8 chaînes brutes)
  - `src/components/mestre/SignalZoomModal.jsx` (3 chaînes brutes)
  - `src/components/mestre/TablatureModal.jsx` (6 chaînes brutes)
  - `src/components/mestre/VideoInstrumentCheckboxes.jsx` (5 chaînes brutes)
  - `src/components/mestre/WorkshopEditorModal.jsx` (24 chaînes brutes)
  - `src/components/mestre/CreateCultureFicheModal.jsx` (20 chaînes brutes)
  - `src/components/repertoire/BatchAssignVideoModal.jsx` (3 chaînes brutes)
  - `src/components/repertoire/BatchAssignVideoSource.jsx` (11 chaînes brutes)
  - `src/components/repertoire/PieceVideoSection.jsx` (1 chaînes brutes)
  - `src/components/repertoire/RepertoirePasserelleButton.jsx` (1 chaînes brutes)
  - `src/components/mestre/RepertoireUnlinkedPresetsBanner.jsx` (6 chaînes brutes)
  - `src/components/mestre/RepertoireTrainingsManager.jsx` (8 chaînes brutes)
  - `src/components/mestre/RepertoireSinaisDoMestreEditor.jsx` (10 chaînes brutes)
  - `src/components/mestre/reflex/SignalReflexCard.jsx` (15 chaînes brutes)
  - `src/components/mestre/MestreOrientationCasting.jsx` (56 chaînes brutes)
  - `src/components/mestre/MestreCustomCategories.jsx` (17 chaînes brutes)
  - `src/components/mestre/CategoryCardItem.jsx` (10 chaînes brutes)
  - `src/components/mestre/MestreStageLayout.jsx` (15 chaînes brutes)
  - `src/components/event-details/EventStageLayoutSection.jsx` (19 chaînes brutes)
  - `src/components/mestre/MestreMotMestre.jsx` (12 chaînes brutes)
  - `src/components/mestre/MestrePedagogyDashboard.jsx` (31 chaînes brutes)
  - `src/components/mestre/MestrePedagogyNotepad.jsx` (17 chaînes brutes)
  - `src/components/mestre/MestreAutoEvalConfig.jsx` (36 chaînes brutes)
  - `src/components/mestre/CustomQuizConfigPanel.jsx` (19 chaînes brutes)
