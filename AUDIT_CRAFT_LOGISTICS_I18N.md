# Audit Statique Exhaustif i18n — Pôles Logistique, Lutherie & Costumerie

> **Mode : LECTURE SEULE STRICTE**  
> Aucun fichier source, aucun dictionnaire de locale, aucun schéma ni règle Firebase n'ont été modifiés.  
> Analyse automatisée réalisée par inspection de l'AST Babel sur l'intégralité des composants des 3 ateliers.

---

## 📦 Pôle Logistique (Namespace : `logistics`)

**Volume détecté :** 237 chaînes brutes réparties sur 13 composant(s) nécessitant une intervention (3 composant(s) 100% propre(s)).

### ✅ Composants 100 % propres (0 chaîne en dur) :
- `src/components/inventory/InventoryItemModal.jsx`
- `src/components/inventory/InstrumentAttributionSection.jsx`
- `src/components/inventory/InstrumentVisualizer.jsx`

### ⚠️ Composants nécessitant une extraction :

#### 📄 `src/components/InventoryManager.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L294 | Configuration statique (propriété label) | `Instruments` | `logistics.instruments` |
| L295 | Configuration statique (propriété label) | `Pupitres` | `logistics.pupitres` |
| L296 | Configuration statique (propriété label) | `Kits & Accessoires` | `logistics.kitsAccessoires` |
| L297 | Configuration statique (propriété label) | `Covoiturage & Convois` | `logistics.covoiturageConvois` |
| L298 | Configuration statique (propriété label) | `Pièces Détachées` | `logistics.piecesDetachees` |
| L299 | Configuration statique (propriété label) | `Projets` | `logistics.projets` |
| L300 | Configuration statique (propriété label) | `Matières Premières` | `logistics.matieresPremieres` |
| L301 | Configuration statique (propriété label) | `Outillage` | `logistics.outillage` |
| L347 | Span / Badge | `⏳ Chargement de l'inventaire...` | `logistics.chargementDeLInventaire` |
| L508 | Titre | `🎺 Gestion des Pupitres & Catalogue des Instruments` | `logistics.gestionDesPupitresCatalogueDes` |
| L511 | Paragraphe | `Configurez les familles de pupitres, les attributions de couleurs et les modèles du parc instrumenta` | `logistics.configurezLesFamillesDePupitres` |
| L550 | Titre | `🎒 Accessoires & Kits par Pupitre (Housses, Sangles, Mailloches)` | `logistics.accessoiresKitsParPupitreHousses` |
| L553 | Paragraphe | `Configurez les kits de transport, housses, mailloches, sangles et accessoires opérationnels par pupi` | `logistics.configurezLesKitsDeTransport` |
| L586 | Titre | `🚗 Configuration Covoiturage & Convois` | `logistics.configurationCovoiturageConvois` |
| L589 | Paragraphe | `Gérez la flotte de véhicules de la troupe et le point de rassemblement habituel pour les départs en ` | `logistics.gerezLaFlotteDeVehicules` |

---

#### 📄 `src/components/inventory/InventoryItemCard.jsx` (13 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L78 | Span / Badge | `🎒 Kit:` | `logistics.kit` |
| L85 | Attribut title | `Prêt gracieux de l'association` | `logistics.pretGracieuxDeLAssociation` |
| L85 | Span / Badge | `🎁 Prêt gratuit` | `logistics.pretGratuit` |
| L90 | Attribut title | `Mis à disposition avec cotisation instrument` | `logistics.misADispositionAvecCotisation` |
| L90 | Span / Badge | `💳 Cotisation` | `logistics.cotisation` |
| L95 | Attribut title | `Instrument personnel du membre` | `logistics.instrumentPersonnelDuMembre` |
| L95 | Span / Badge | `👤 Personnel` | `logistics.personnel` |
| L128 | Span / Badge | `Nomenclature (Pièces) :` | `logistics.nomenclaturePieces` |
| L146 | Span / Badge | `🤝 Emprunté par :` | `logistics.empruntePar` |
| L150 | Span / Badge | `✅ En stock` | `logistics.enStock` |
| L161 | Attribut title | `Éditer` | `logistics.editer` |
| L170 | Attribut title | `Diagnostiquer (Réparation)` | `logistics.diagnostiquerReparation` |
| L179 | Attribut title | `Supprimer` | `logistics.supprimer` |

---

#### 📄 `src/components/inventory/InstrumentsDataTable.jsx` (46 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L67 | Attribut title | `Cliquer pour trier par Nom / Réf` | `logistics.cliquerPourTrierParNom` |
| L70 | Span / Badge | `Nom / Réf` | `logistics.nomRef` |
| L78 | Attribut title | `Cliquer pour trier par Famille / Type` | `logistics.cliquerPourTrierParFamille` |
| L81 | Span / Badge | `Famille / Type` | `logistics.familleType` |
| L89 | Attribut title | `Cliquer pour trier par Propriétaire` | `logistics.cliquerPourTrierParProprietaire` |
| L92 | Span / Badge | `Propriétaire` | `logistics.proprietaire` |
| L100 | Attribut title | `Cliquer pour trier par Localisation` | `logistics.cliquerPourTrierParLocalisation` |
| L103 | Span / Badge | `Localisation` | `logistics.localisation` |
| L111 | Attribut title | `Cliquer pour trier par État` | `logistics.cliquerPourTrierParEtat` |
| L114 | Span / Badge | `État` | `logistics.etat` |
| L122 | Attribut title | `Cliquer pour trier par Kit` | `logistics.cliquerPourTrierParKit` |
| L125 | Span / Badge | `Kit` | `logistics.kit` |
| L133 | Attribut title | `Cliquer pour trier par Statut / Prêt` | `logistics.cliquerPourTrierParStatut` |
| L136 | Span / Badge | `Statut / Prêt` | `logistics.statutPret` |
| L144 | Attribut title | `Cliquer pour trier par Assignations` | `logistics.cliquerPourTrierParAssignations` |
| L147 | Span / Badge | `Assignations` | `logistics.assignations` |
| L152 | En-tête th | `Actions` | `logistics.actions` |
| L182 | Attribut placeholder | `Nom de l'instrument` | `logistics.nomDeLInstrument` |
| L183 | Attribut title | `Cliquer pour modifier le nom` | `logistics.cliquerPourModifierLeNom` |
| L195 | Attribut title | `Modifier la famille d'instrument` | `logistics.modifierLaFamilleDInstrument` |
| L210 | Attribut title | `Modifier le propriétaire` | `logistics.modifierLeProprietaire` |
| L212 | Option select | `🏢 Association` | `logistics.association` |
| L213 | Attribut label | `Membres` | `logistics.membres` |
| L228 | Attribut title | `Modifier le lieu de stockage` | `logistics.modifierLeLieuDeStockage` |
| L230 | Option select | `📍 Local` | `logistics.local` |
| L231 | Attribut label | `Chez un membre` | `logistics.chezUnMembre` |
| L233 | Option select | `🏠 Chez` | `logistics.chez` |
| L252 | Attribut title | `Modifier l'état` | `logistics.modifierLEtat` |
| L289 | Attribut title | `Modifier le statut d'utilisation` | `logistics.modifierLeStatutDUtilisation` |
| L291 | Option select | `En stock` | `logistics.enStock` |
| L292 | Option select | `Emprunté` | `logistics.emprunte` |
| L293 | Option select | `En réparation` | `logistics.enReparation` |
| L303 | Attribut title | `Membre emprunteur` | `logistics.membreEmprunteur` |
| L305 | Option select | `🤝 Emprunteur...` | `logistics.emprunteur` |
| L318 | Attribut title | `Restituer l'instrument au local` | `logistics.restituerLInstrumentAuLocal` |
| L329 | Attribut title | `Prêt gracieux de l'association` | `logistics.pretGracieuxDeLAssociation` |
| L329 | Span / Badge | `🎁 Prêt gratuit` | `logistics.pretGratuit` |
| L334 | Attribut title | `Mis à disposition avec cotisation` | `logistics.misADispositionAvecCotisation` |
| L334 | Span / Badge | `💳 Cotisation` | `logistics.cotisation` |
| L339 | Attribut title | `Instrument personnel du membre` | `logistics.instrumentPersonnelDuMembre` |
| L339 | Span / Badge | `👤 Personnel` | `logistics.personnel` |
| L414 | Attribut title | `Assigner un membre en 1 clic` | `logistics.assignerUnMembreEn1` |
| L416 | Option select | `+ Assigner membre...` | `logistics.assignerMembre` |
| L440 | Attribut title | `Formulaire d'édition complet (assignations, kit, nomenclature...)` | `logistics.formulaireDEditionCompletAssignations` |
| L453 | Attribut title | `Diagnostiquer (Réparation en atelier)` | `logistics.diagnostiquerReparationEnAtelier` |
| L466 | Attribut title | `Supprimer définitivement de l'inventaire` | `logistics.supprimerDefinitivementDeLInventaire` |

---

#### 📄 `src/components/inventory/InstrumentEditModal.jsx` (25 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L70 | Attribut title | `Fermer le formulaire` | `logistics.fermerLeFormulaire` |
| L123 | Label de champ | `Modèle d'Instrument (Fabrication)` | `logistics.modeleDInstrumentFabrication` |
| L133 | Option select | `-- Aucun modèle spécifique --` | `logistics.aucunModeleSpecifique` |
| L144 | Label de champ | `État physique` | `logistics.etatPhysique` |
| L165 | Span / Badge | `Kit / Accessoires associés` | `logistics.kitAccessoiresAssocies` |
| L177 | Span / Badge | `Aucun kit d'accessoires configuré pour ce pupitre.` | `logistics.aucunKitDAccessoiresConfigure` |
| L230 | Label de champ | `Propriétaire` | `logistics.proprietaire` |
| L240 | Option select | `🏢 Association` | `logistics.association` |
| L242 | Option select | `Personnel :` | `logistics.personnel` |
| L249 | Label de champ | `Localisation Physique` | `logistics.localisationPhysique` |
| L259 | Option select | `📍 Local de l'association` | `logistics.localDeLAssociation` |
| L261 | Option select | `Chez :` | `logistics.chez` |
| L268 | Label de champ | `Statut de l'instrument` | `logistics.statutDeLInstrument` |
| L278 | Option select | `En stock` | `logistics.enStock` |
| L279 | Option select | `Emprunté` | `logistics.emprunte` |
| L280 | Option select | `En réparation` | `logistics.enReparation` |
| L287 | Label de champ | `Membre emprunteur` | `logistics.membreEmprunteur` |
| L297 | Option select | `-- Non spécifié --` | `logistics.nonSpecifie` |
| L315 | Label de champ | `Assignations (Membres réguliers désignés)` | `logistics.assignationsMembresReguliersDesignes` |
| L320 | Span / Badge | `Aucun membre disponible` | `logistics.aucunMembreDisponible` |
| L349 | Label de champ | `Nomenclature (Pièces détachées assignées à l'instrument)` | `logistics.nomenclaturePiecesDetacheesAssigneesA` |
| L358 | Span / Badge | `Aucune pièce disponible en stock.` | `logistics.aucunePieceDisponibleEnStock` |
| L402 | Label de champ | `📜 Historique des mouvements & prêts (` | `logistics.historiqueDesMouvementsPrets` |
| L432 | Bouton | `🗑️ Retirer` | `logistics.retirer` |
| L444 | Nœud JSX | `Annuler` | `logistics.annuler` |

---

#### 📄 `src/components/inventory/RepairDiagnosticModal.jsx` (11 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L63 | Dialogue / Message (alert) | `Une erreur est survenue lors de l'échange de pièces.` | `logistics.uneErreurEstSurvenueLors` |
| L79 | Titre | `🩺 Diagnostic & Réparation :` | `logistics.diagnosticReparation` |
| L83 | Paragraphe | `Cet instrument est en réparation. Inspectez sa nomenclature ci-dessous et signalez les pièces défect` | `logistics.cetInstrumentEstEnReparation` |
| L90 | Span / Badge | `Cet instrument n'a aucune pièce structurelle enregistrée dans sa nomenclature.` | `logistics.cetInstrumentNAAucune` |
| L119 | Bouton | `⚠️ Remplacer` | `logistics.remplacer` |
| L127 | Span / Badge | `Pièce de rechange :` | `logistics.pieceDeRechange` |
| L130 | Nœud JSX | `Aucune pièce de type "` | `logistics.aucunePieceDeType` |
| L131 | Nœud JSX | `" disponible en stock.` | `logistics.disponibleEnStock` |
| L139 | Option select | `-- Sélectionner une pièce en stock --` | `logistics.selectionnerUnePieceEnStock` |
| L144 | Option select | `(État :` | `logistics.etat` |
| L152 | Nœud JSX | `Annuler` | `logistics.annuler` |

---

#### 📄 `src/components/inventory/InstrumentCautionFields.jsx` (1 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L90 | Attribut placeholder | `ex: CHQ-849201` | `logistics.exChq849201` |

---

#### 📄 `src/components/inventory/InventoryFilterBar.jsx` (12 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L36 | Attribut placeholder | `🔍 Rechercher un matériel...` | `logistics.rechercherUnMateriel` |
| L49 | Bouton | `Tous` | `logistics.tous` |
| L60 | Bouton | `Association` | `logistics.association` |
| L71 | Bouton | `Personnels` | `logistics.personnels` |
| L82 | Bouton | `🛠️ À réparer` | `logistics.aReparer` |
| L95 | Attribut title | `Vue Tableau` | `logistics.vueTableau` |
| L96 | Bouton | `📊 Liste` | `logistics.liste` |
| L103 | Attribut title | `Vue Cartes` | `logistics.vueCartes` |
| L104 | Bouton | `🎴 Cartes` | `logistics.cartes` |
| L114 | Attribut title | `Exporter l'inventaire au format CSV` | `logistics.exporterLInventaireAuFormat` |
| L115 | Bouton | `📥 CSV` | `logistics.csv` |
| L120 | Nœud JSX | `+ Nouveau Matériel` | `logistics.nouveauMateriel` |

---

#### 📄 `src/components/inventory/InventoryMovementsBanner.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L26 | Titre | `⏳ Mouvements en attente (` | `logistics.mouvementsEnAttente` |
| L75 | Attribut title | `Refuser le mouvement` | `logistics.refuserLeMouvement` |
| L83 | Bouton | `✅ Valider` | `logistics.valider` |

---

#### 📄 `src/components/OrdersManager.jsx` (36 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L64 | Dialogue / Message (alert) | `Image de l'article téléversée avec succès !` | `logistics.imageDeLArticleTeleversee` |
| L67 | Dialogue / Message (alert) | `Erreur lors du téléversement de l'image de l'article.` | `logistics.erreurLorsDuTeleversementDe` |
| L81 | Dialogue / Message (alert) | `Erreur lors de la sauvegarde des articles.` | `logistics.erreurLorsDeLaSauvegarde` |
| L305 | Dialogue / Message (alert) | `Erreur lors du réapprovisionnement.` | `logistics.erreurLorsDuReapprovisionnement` |
| L355 | Dialogue / Message (alert) | `Erreur lors de la suppression de la demande.` | `logistics.erreurLorsDeLaSuppression` |
| L386 | Dialogue / Message (alert) | `Erreur lors de la suppression de la campagne.` | `logistics.erreurLorsDeLaSuppression` |
| L517 | Attribut title | `Aucune commande groupée en cours` | `logistics.aucuneCommandeGroupeeEnCours` |
| L553 | Attribut title | `Supprimer cette campagne et toutes ses demandes` | `logistics.supprimerCetteCampagneEtToutes` |
| L600 | Titre | `📦 Constructeur de Campagne (Gestion des Articles)` | `logistics.constructeurDeCampagneGestionDes` |
| L606 | Paragraphe | `Aucun article configuré dans cette campagne. Utilisez le formulaire ci-dessous pour en ajouter.` | `logistics.aucunArticleConfigureDansCette` |
| L621 | Span / Badge | `Provenance :` | `logistics.provenance` |
| L622 | Span / Badge | `• Tarif :` | `logistics.tarif` |
| L633 | Bouton | `Modifier` | `logistics.modifier` |
| L640 | Bouton | `Supprimer` | `logistics.supprimer` |
| L658 | Label de champ | `Nom de l'article` | `logistics.nomDeLArticle` |
| L664 | Attribut placeholder | `Ex : Baguettes, Housse...` | `logistics.exBaguettesHousse` |
| L669 | Label de champ | `Provenance (Fournisseur/URL)` | `logistics.provenanceFournisseurUrl` |
| L674 | Attribut placeholder | `Ex : Contemporanea, URL...` | `logistics.exContemporaneaUrl` |
| L679 | Label de champ | `Tarif (€, optionnel)` | `logistics.tarifOptionnel` |
| L686 | Attribut placeholder | `Ex : 25 (vide = libre)` | `logistics.ex25VideLibre` |
| L694 | Label de champ | `Lien de l'image (URL)` | `logistics.lienDeLImageUrl` |
| L699 | Attribut placeholder | `Ex : https://site.com/image.jpg` | `logistics.exHttpsSiteComImage` |
| L704 | Label de champ | `Ou téléverser une photo` | `logistics.ouTeleverserUnePhoto` |
| L717 | Span / Badge | `✓ Photo prête` | `logistics.photoPrete` |
| L730 | Bouton | `Annuler` | `logistics.annuler` |
| L838 | Paragraphe | `💡 Suggestion :` | `logistics.suggestion` |
| L858 | Bouton | `📦 Réceptionner` | `logistics.receptionner` |
| L876 | Bouton | `Annuler réception` | `logistics.annulerReception` |
| L894 | Attribut title | `Supprimer cette demande` | `logistics.supprimerCetteDemande` |
| L913 | Titre | `📦 Réapprovisionnement Stock` | `logistics.reapprovisionnementStock` |
| L916 | Paragraphe | `L'article` | `logistics.lArticle` |
| L917 | Paragraphe | `correspond à la fourniture` | `logistics.correspondALaFourniture` |
| L920 | Span / Badge | `Voulez-vous ajouter` | `logistics.voulezVousAjouter` |
| L921 | Span / Badge | `au stock ?` | `logistics.auStock` |
| L928 | Nœud JSX | `Non, ignorer` | `logistics.nonIgnorer` |
| L931 | Nœud JSX | `Oui, réapprovisionner` | `logistics.ouiReapprovisionner` |

---

#### 📄 `src/components/orders/OrderPaymentControls.jsx` (12 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L37 | Dialogue / Message (alert) | `Veuillez saisir un montant facturé valide supérieur à 0 €.` | `logistics.veuillezSaisirUnMontantFacture` |
| L103 | Dialogue / Message (alert) | `Veuillez saisir un montant facturé valide supérieur à 0 € avant d'enregistrer le paiement.` | `logistics.veuillezSaisirUnMontantFacture` |
| L188 | Span / Badge | `🪙 Facturation & Virement :` | `logistics.facturationVirement` |
| L194 | Span / Badge | `🟢 Réglé` | `logistics.regle` |
| L198 | Span / Badge | `🟠 Virement attendu` | `logistics.virementAttendu` |
| L202 | Span / Badge | `⚪ Non facturé` | `logistics.nonFacture` |
| L211 | Label de champ | `Montant :` | `logistics.montant` |
| L235 | Attribut title | `Fixer le montant et envoyer un push FCM à l'adhérent` | `logistics.fixerLeMontantEtEnvoyer` |
| L236 | Bouton | `🔔 Notifier (` | `logistics.notifier` |
| L245 | Attribut title | `Valider la réception du virement et insérer la recette comptable` | `logistics.validerLaReceptionDuVirement` |
| L246 | Bouton | `✓ Marquer comme payé` | `logistics.marquerCommePaye` |
| L253 | Span / Badge | `Payé le` | `logistics.payeLe` |

---

#### 📄 `src/components/orders/MemberOrdersPaymentAlert.jsx` (9 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L79 | Dialogue / Message (alert) | `Erreur lors de la déclaration du virement.` | `logistics.erreurLorsDeLaDeclaration` |
| L104 | Titre | `Règlement attendu : Commande de matériel` | `logistics.reglementAttenduCommandeDeMateriel` |
| L107 | Paragraphe | `Vous devez régler` | `logistics.vousDevezRegler` |
| L108 | Paragraphe | `pour` | `logistics.pour` |
| L114 | Span / Badge | `🟠 En attente de virement` | `logistics.enAttenteDeVirement` |
| L122 | Span / Badge | `💡 Libellé requis :` | `logistics.libelleRequis` |
| L145 | Span / Badge | `Virement déclaré — En attente de pointage trésorier` | `logistics.virementDeclareEnAttenteDe` |
| L166 | Span / Badge | `Commandes groupées réglées (` | `logistics.commandesGroupeesReglees` |
| L185 | Span / Badge | `🟢 Réglé le` | `logistics.regleLe` |

---

#### 📄 `src/components/association-settings/blocks/AccessoriesKitsBlock.jsx` (14 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L71 | Dialogue / Message (alert) | `Erreur lors de la sauvegarde automatique du kit.` | `logistics.erreurLorsDeLaSauvegarde` |
| L160 | Titre | `Kits d'Accessoires (Logistique)` | `logistics.kitsDAccessoiresLogistique` |
| L161 | Span / Badge | `Sauvegarde auto...` | `logistics.sauvegardeAuto` |
| L163 | Paragraphe | `Associez des fournitures (ex: Housses, Sangles, Baguettes) à un type d'instrument (Pupitre). Lors de` | `logistics.associezDesFournituresExHousses` |
| L180 | Attribut title | `Éditer ce kit` | `logistics.editerCeKit` |
| L189 | Attribut title | `Retirer ce kit` | `logistics.retirerCeKit` |
| L209 | Nœud JSX | `Aucun kit d'accessoires configuré.` | `logistics.aucunKitDAccessoiresConfigure` |
| L216 | Label de champ | `Pupitre / Instrument Principal` | `logistics.pupitreInstrumentPrincipal` |
| L225 | Option select | `-- Choisir un instrument --` | `logistics.choisirUnInstrument` |
| L233 | Label de champ | `Sélectionnez les fournitures du kit` | `logistics.selectionnezLesFournituresDuKit` |
| L253 | Attribut placeholder | `🔍 Rechercher...` | `logistics.rechercher` |
| L261 | Span / Badge | `Aucune fourniture trouvée.` | `logistics.aucuneFournitureTrouvee` |
| L282 | Span / Badge | `en stock)` | `logistics.enStock` |
| L297 | Bouton | `Annuler` | `logistics.annuler` |

---

#### 📄 `src/components/profile/UserMateriel.jsx` (40 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L114 | Dialogue / Message (alert) | `Veuillez sélectionner un membre pour le transfert.` | `logistics.veuillezSelectionnerUnMembrePour` |
| L154 | Dialogue / Message (alert) | `Erreur lors de l'envoi de la déclaration.` | `logistics.erreurLorsDeLEnvoi` |
| L225 | Dialogue / Message (alert) | `Erreur lors du signalement de casse.` | `logistics.erreurLorsDuSignalementDe` |
| L241 | Span / Badge | `Détail des pièces (Nomenclature) :` | `logistics.detailDesPiecesNomenclature` |
| L246 | Span / Badge | `En réparation` | `logistics.enReparation` |
| L248 | Span / Badge | `OK` | `logistics.ok` |
| L277 | Span / Badge | `⏳ Chargement de votre matériel...` | `logistics.chargementDeVotreMateriel` |
| L331 | Span / Badge | `Stock Association` | `logistics.stockAssociation` |
| L341 | Span / Badge | `Kit :` | `logistics.kit` |
| L355 | Bouton | `⚠️ Signaler une casse` | `logistics.signalerUneCasse` |
| L360 | Span / Badge | `⏳ En attente de validation logistique` | `logistics.enAttenteDeValidationLogistique` |
| L367 | Bouton | `🔄 Déclarer un mouvement` | `logistics.declarerUnMouvement` |
| L396 | Span / Badge | `Au Local` | `logistics.auLocal` |
| L425 | Titre | `🔄 Déclarer un mouvement` | `logistics.declarerUnMouvement` |
| L429 | Nœud JSX | `Instrument :` | `logistics.instrument` |
| L435 | Span / Badge | `Attention :` | `logistics.attention` |
| L435 | Nœud JSX | `Vous vous apprêtez à transférer cet instrument avec son kit complet :` | `logistics.vousVousAppretezATransferer` |
| L441 | Label de champ | `Type de mouvement` | `logistics.typeDeMouvement` |
| L450 | Option select | `J'ai rendu cet instrument au local` | `logistics.jAiRenduCetInstrument` |
| L451 | Option select | `Je l'ai transmis à un autre membre` | `logistics.jeLAiTransmisA` |
| L457 | Label de champ | `Membre cible` | `logistics.membreCible` |
| L467 | Option select | `-- Choisir un membre --` | `logistics.choisirUnMembre` |
| L476 | Label de champ | `Observations (Optionnel)` | `logistics.observationsOptionnel` |
| L482 | Attribut placeholder | `Ex: Il manque une baguette, la fermeture de la housse est coincée...` | `logistics.exIlManqueUneBaguette` |
| L489 | Nœud JSX | `Annuler` | `logistics.annuler` |
| L517 | Titre | `Signaler une casse` | `logistics.signalerUneCasse` |
| L521 | Paragraphe | `Sur l'instrument` | `logistics.surLInstrument` |
| L527 | Label de champ | `Que souhaitez-vous signaler ?` | `logistics.queSouhaitezVousSignaler` |
| L534 | Option select | `L'instrument entier / Je ne sais pas` | `logistics.lInstrumentEntierJeNe` |
| L538 | Option select | `(En stock)` | `logistics.enStock` |
| L544 | Option select | `(Modèle)` | `logistics.modele` |
| L564 | Span / Badge | `Bonne nouvelle :` | `logistics.bonneNouvelle` |
| L564 | Nœud JSX | `L'atelier dispose de` | `logistics.lAtelierDisposeDe` |
| L564 | Nœud JSX | `pièce(s) de type "` | `logistics.pieceSDeType` |
| L564 | Nœud JSX | `" en stock pour un remplacement éventuel.` | `logistics.enStockPourUnRemplacement` |
| L570 | Span / Badge | `Information :` | `logistics.information` |
| L570 | Nœud JSX | `L'atelier n'a actuellement aucune pièce de type "` | `logistics.lAtelierNAActuellement` |
| L570 | Nœud JSX | `" en stock. Le responsable logistique sera notifié.` | `logistics.enStockLeResponsableLogistique` |
| L580 | Label de champ | `Description du problème` | `logistics.descriptionDuProbleme` |
| L585 | Attribut placeholder | `Expliquez ce qui est cassé ou défectueux...` | `logistics.expliquezCeQuiEstCasse` |

---

## 📦 Pôle Lutherie & Artisanat Instrumental (Namespace : `lutherie`)

**Volume détecté :** 300 chaînes brutes réparties sur 13 composant(s) nécessitant une intervention (0 composant(s) 100% propre(s)).

### ⚠️ Composants nécessitant une extraction :

#### 📄 `src/components/inventory/InventoryProjectsView.jsx` (55 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L332 | Dialogue / Message (alert) | `Une erreur est survenue lors de la clôture du chantier.` | `lutherie.uneErreurEstSurvenueLors` |
| L337 | Nœud JSX | `Chargement de l'atelier...` | `lutherie.chargementDeLAtelier` |
| L348 | Paragraphe | `Modèle introuvable. Il a peut-être été supprimé.` | `lutherie.modeleIntrouvableIlAPeut` |
| L349 | Nœud JSX | `Retour` | `lutherie.retour` |
| L491 | Titre | `Projet :` | `lutherie.projet` |
| L492 | Paragraphe | `Modèle :` | `lutherie.modele` |
| L497 | Span / Badge | `👤 Artisan :` | `lutherie.artisan` |
| L509 | Option select | `-- Projet collectif (Atelier) --` | `lutherie.projetCollectifAtelier` |
| L518 | Bouton | `Fermer le projet` | `lutherie.fermerLeProjet` |
| L530 | Span / Badge | `Pièces & Phases requises` | `lutherie.piecesPhasesRequises` |
| L532 | Span / Badge | `validée` | `lutherie.validee` |
| L539 | Bouton | `🖼️ Schéma` | `lutherie.schema` |
| L545 | Bouton | `📋 Liste` | `lutherie.liste` |
| L600 | Nœud JSX | `🥁 Clôturer l'assemblage & Baptiser l'instrument` | `lutherie.cloturerLAssemblageBaptiserL` |
| L615 | Titre | `Mallette de la séance (` | `lutherie.malletteDeLaSeance` |
| L615 | Titre | `phase` | `lutherie.phase` |
| L620 | Attribut title | `Vider la mallette de séance` | `lutherie.viderLaMalletteDeSeance` |
| L621 | Bouton | `Vider` | `lutherie.vider` |
| L630 | Nœud JSX | `🛠️ Outils à emporter (` | `lutherie.outilsAEmporter` |
| L654 | Attribut title | `Emplacement / Atelier de l'outil` | `lutherie.emplacementAtelierDeLOutil` |
| L660 | Span / Badge | `Non inventorié` | `lutherie.nonInventorie` |
| L669 | Span / Badge | `Aucun outil requis pour les phases sélectionnées` | `lutherie.aucunOutilRequisPourLes` |
| L676 | Nœud JSX | `📦 Matériaux & Fournitures (` | `lutherie.materiauxFournitures` |
| L700 | Span / Badge | `Non répertorié` | `lutherie.nonRepertorie` |
| L709 | Span / Badge | `Aucun matériau requis pour les phases sélectionnées` | `lutherie.aucunMateriauRequisPourLes` |
| L721 | Span / Badge | `Programmer cet atelier sur l'Agenda` | `lutherie.programmerCetAtelierSurL` |
| L730 | Span / Badge | `Mallette de la séance d'atelier` | `lutherie.malletteDeLaSeanceD` |
| L732 | Paragraphe | `Cliquez sur le bouton` | `lutherie.cliquezSurLeBouton` |
| L733 | Nœud JSX | `"+ Mallette séance"` | `lutherie.malletteSeance` |
| L733 | Paragraphe | `à côté d'une ou plusieurs phases pour préparer la liste des outils et matériaux à emporter pour votr` | `lutherie.aCoteDUneOu` |
| L740 | Titre | `Feuille de route` | `lutherie.feuilleDeRoute` |
| L742 | Paragraphe | `Liste consolidée pour les` | `lutherie.listeConsolideePourLes` |
| L743 | Nœud JSX | `pièces restant à fabriquer` | `lutherie.piecesRestantAFabriquer` |
| L748 | Titre | `🛒 Matériaux & Fournitures` | `lutherie.materiauxFournitures` |
| L749 | Span / Badge | `Aucun` | `lutherie.aucun` |
| L768 | Span / Badge | `Non répertorié` | `lutherie.nonRepertorie` |
| L780 | Titre | `🧰 Outils à préparer` | `lutherie.outilsAPreparer` |
| L781 | Span / Badge | `Aucun` | `lutherie.aucun` |
| L798 | Attribut title | `Emplacement / Atelier de l'outil` | `lutherie.emplacementAtelierDeLOutil` |
| L804 | Span / Badge | `Non répertorié` | `lutherie.nonRepertorie` |
| L877 | Titre | `🛠️ L'Atelier (Projets en cours)` | `lutherie.lAtelierProjetsEnCours` |
| L880 | Paragraphe | `Assemblez des pièces pour créer de nouveaux instruments.` | `lutherie.assemblezDesPiecesPourCreer` |
| L888 | Nœud JSX | `+ Démarrer un projet` | `lutherie.demarrerUnProjet` |
| L896 | Titre | `Nouveau projet d'assemblage` | `lutherie.nouveauProjetDAssemblage` |
| L900 | Attribut placeholder | `Nom de l'instrument (ex: Alfaia N°12)` | `lutherie.nomDeLInstrumentEx` |
| L912 | Option select | `-- Choisir un Modèle du Varal --` | `lutherie.choisirUnModeleDuVaral` |
| L922 | Option select | `-- Artisan : Projet collectif (Atelier) --` | `lutherie.artisanProjetCollectifAtelier` |
| L930 | Bouton | `Annuler` | `lutherie.annuler` |
| L931 | Bouton | `Créer` | `lutherie.creer` |
| L939 | Span / Badge | `Aucun projet en cours dans l'atelier.` | `lutherie.aucunProjetEnCoursDans` |
| L955 | Span / Badge | `Modèle :` | `lutherie.modele` |
| L968 | Span / Badge | `Progression assemblage` | `lutherie.progressionAssemblage` |
| L969 | Span / Badge | `pièces` | `lutherie.pieces` |
| L983 | Bouton | `Ouvrir l'établi` | `lutherie.ouvrirLEtabli` |
| L989 | Bouton | `Annuler` | `lutherie.annuler` |

---

#### 📄 `src/components/inventory/AssemblySlotItem.jsx` (14 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L165 | Attribut title | `Ouvrir le tutoriel complet dans le Varal` | `lutherie.ouvrirLeTutorielCompletDans` |
| L167 | Bouton | `Voir le tutoriel (` | `lutherie.voirLeTutoriel` |
| L167 | Bouton | `étapes)` | `lutherie.etapes` |
| L187 | Span / Badge | `Assigné :` | `lutherie.assigne` |
| L194 | Attribut title | `Désassigner cette pièce du projet` | `lutherie.desassignerCettePieceDuProjet` |
| L195 | Bouton | `Retirer` | `lutherie.retirer` |
| L209 | Span / Badge | `Continuer :` | `lutherie.continuer` |
| L217 | Option select | `-- Piocher dans le stock (` | `lutherie.piocherDansLeStock` |
| L219 | Option select | `⭐ Continuer :` | `lutherie.continuer` |
| L220 | Option select | `(pièce du projet)` | `lutherie.pieceDuProjet` |
| L240 | Span / Badge | `Continuer :` | `lutherie.continuer` |
| L243 | Span / Badge | `⏳ En attente de fourniture` | `lutherie.enAttenteDeFourniture` |
| L285 | Span / Badge | `Progression de fabrication` | `lutherie.progressionDeFabrication` |
| L365 | Bouton | `Ouvrir la fiche tutoriel complète` | `lutherie.ouvrirLaFicheTutorielComplete` |

---

#### 📄 `src/components/inventory/InstrumentBaptismModal.jsx` (14 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L21 | Dialogue / Message (alert) | `Le nom ou numéro d'inventaire est requis.` | `lutherie.leNomOuNumeroD` |
| L34 | Titre | `Baptême de l'Instrument` | `lutherie.baptemeDeLInstrument` |
| L36 | Paragraphe | `Finalisez l'assemblage et intégrez l'instrument au parc officiel.` | `lutherie.finalisezLAssemblageEtIntegrez` |
| L45 | Label de champ | `Modèle (Lecture seule)` | `lutherie.modeleLectureSeule` |
| L55 | Label de champ | `Nom / N° d'inventaire *` | `lutherie.nomNDInventaire` |
| L63 | Attribut placeholder | `ex. Alfaia #6 — La Roazhon` | `lutherie.exAlfaia6LaRoazhon` |
| L69 | Label de champ | `Localisation Physique` | `lutherie.localisationPhysique` |
| L76 | Attribut placeholder | `ex. Local, Camion, chez un membre...` | `lutherie.exLocalCamionChezUn` |
| L81 | Label de champ | `Propriétaire` | `lutherie.proprietaire` |
| L88 | Attribut placeholder | `Association ou nom d'un membre` | `lutherie.associationOuNomDUn` |
| L93 | Label de champ | `Kit d'accessoires initial` | `lutherie.kitDAccessoiresInitial` |
| L99 | Attribut placeholder | `Sangle, housse, mailloches...` | `lutherie.sangleHousseMailloches` |
| L104 | Nœud JSX | `Annuler` | `lutherie.annuler` |
| L107 | Nœud JSX | `Créer l'instrument` | `lutherie.creerLInstrument` |

---

#### 📄 `src/components/inventory/ImportModelWizardModal.jsx` (21 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L208 | Nœud JSX | `pièces répertoriées` | `lutherie.piecesRepertoriees` |
| L209 | Nœud JSX | `images embarquées dans l'archive` | `lutherie.imagesEmbarqueesDansLArchive` |
| L210 | Nœud JSX | `• Format détecté :` | `lutherie.formatDetecte` |
| L215 | Nœud JSX | `Suivant ➔` | `lutherie.suivant` |
| L224 | Paragraphe | `Le modèle requiert ces matières premières. Si elles manquent dans votre association, vous pouvez les` | `lutherie.leModeleRequiertCesMatieres` |
| L230 | Span / Badge | `Aucune fourniture déclarée ou format legacy.` | `lutherie.aucuneFournitureDeclareeOuFormat` |
| L241 | Span / Badge | `✅ En stock` | `lutherie.enStock` |
| L251 | Label de champ | `Créer la fiche` | `lutherie.creerLaFiche` |
| L262 | Nœud JSX | `⬅ Retour` | `lutherie.retour` |
| L263 | Nœud JSX | `Suivant ➔` | `lutherie.suivant` |
| L273 | Paragraphe | `Même principe pour l'outillage requis (marteaux, scies...).` | `lutherie.memePrincipePourLOutillage` |
| L279 | Span / Badge | `Aucun outil déclaré ou format legacy.` | `lutherie.aucunOutilDeclareOuFormat` |
| L290 | Span / Badge | `✅ Disponible` | `lutherie.disponible` |
| L300 | Label de champ | `Créer l'outil` | `lutherie.creerLOutil` |
| L311 | Nœud JSX | `⬅ Retour` | `lutherie.retour` |
| L312 | Nœud JSX | `🚀 Importer le modèle` | `lutherie.importerLeModele` |
| L333 | Titre | `📦 Assistant d'Importation` | `lutherie.assistantDImportation` |
| L340 | Span / Badge | `1. Inspection` | `lutherie.1Inspection` |
| L342 | Span / Badge | `2. Fournitures` | `lutherie.2Fournitures` |
| L344 | Span / Badge | `3. Outillage` | `lutherie.3Outillage` |
| L349 | Nœud JSX | `Lecture de l'archive...` | `lutherie.lectureDeLArchive` |

---

#### 📄 `src/components/varal/InstrumentModelsManager.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L32 | Dialogue / Message (alert) | `Erreur lors de la sauvegarde du modèle.` | `lutherie.erreurLorsDeLaSauvegarde` |
| L48 | Dialogue / Message (alert) | `Erreur lors de la suppression.` | `lutherie.erreurLorsDeLaSuppression` |
| L75 | Dialogue / Message (alert) | `🎉 Félicitations ! Votre partage a rapporté 25 Points d'Axé à votre association.` | `lutherie.felicitationsVotrePartageARapporte` |
| L82 | Dialogue / Message (alert) | `Erreur lors de la modification de l'état public.` | `lutherie.erreurLorsDeLaModification` |
| L92 | Dialogue / Message (alert) | `Une erreur est survenue lors de la création du bundle.` | `lutherie.uneErreurEstSurvenueLors` |
| L111 | Nœud JSX | `Chargement des modèles...` | `lutherie.chargementDesModeles` |
| L115 | Nœud JSX | `Accès non autorisé à cette section.` | `lutherie.accesNonAutoriseACette` |
| L136 | Titre | `Modèles d'Instruments & Tutos` | `lutherie.modelesDInstrumentsTutos` |
| L139 | Label de champ | `📥 Importer Master Bundle` | `lutherie.importerMasterBundle` |
| L147 | Nœud JSX | `+ Créer un Modèle` | `lutherie.creerUnModele` |
| L153 | Nœud JSX | `Gérez ici la "recette" de fabrication de vos instruments (les pièces requises, le matériel, les outi` | `lutherie.gerezIciLaRecetteDe` |
| L159 | Span / Badge | `Aucun modèle d'instrument défini pour le moment.` | `lutherie.aucunModeleDInstrumentDefini` |
| L179 | Nœud JSX | `Pièces à fabriquer` | `lutherie.piecesAFabriquer` |
| L193 | Bouton | `Éditer` | `lutherie.editer` |
| L199 | Bouton | `Supprimer` | `lutherie.supprimer` |

---

#### 📄 `src/components/inventory/InventoryPartsView.jsx` (66 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L98 | Configuration statique (propriété name) | `currentStepIndex` | `lutherie.currentstepindex` |
| L101 | Configuration statique (propriété name) | `statutEtape` | `lutherie.statutetape` |
| L103 | Configuration statique (propriété name) | `statutEtape` | `lutherie.statutetape` |
| L122 | Configuration statique (propriété name) | `partId` | `lutherie.partid` |
| L123 | Configuration statique (propriété name) | `typePiece` | `lutherie.typepiece` |
| L125 | Configuration statique (propriété name) | `nom` | `lutherie.nom` |
| L128 | Configuration statique (propriété name) | `partId` | `lutherie.partid` |
| L139 | Configuration statique (propriété name) | `partId` | `lutherie.partid` |
| L140 | Configuration statique (propriété name) | `typePiece` | `lutherie.typepiece` |
| L143 | Configuration statique (propriété name) | `partId` | `lutherie.partid` |
| L146 | Configuration statique (propriété name) | `typePiece` | `lutherie.typepiece` |
| L148 | Configuration statique (propriété name) | `nom` | `lutherie.nom` |
| L173 | Label de champ | `Affectation actuelle` | `lutherie.affectationActuelle` |
| L178 | Span / Badge | `Information en lecture seule` | `lutherie.informationEnLectureSeule` |
| L186 | Span / Badge | `⚡ Lot de` | `lutherie.lotDe` |
| L187 | Span / Badge | `pièces groupées` | `lutherie.piecesGroupees` |
| L189 | Span / Badge | `Cette référence compte` | `lutherie.cetteReferenceCompte` |
| L190 | Span / Badge | `unités groupées. Vous pouvez la scinder pour créer` | `lutherie.unitesGroupeesVousPouvezLa` |
| L190 | Span / Badge | `pièces distinctes et les affecter chacune à un projet différent.` | `lutherie.piecesDistinctesEtLesAffecter` |
| L204 | Bouton | `⚡ Scinder en` | `lutherie.scinderEn` |
| L205 | Bouton | `pièces` | `lutherie.pieces` |
| L212 | Label de champ | `Nom / Référence de la pièce` | `lutherie.nomReferenceDeLaPiece` |
| L221 | Attribut placeholder | `Ex: Calebasse Agbê ou Fût Alfaia` | `lutherie.exCalebasseAgbeOuFut` |
| L229 | Label de champ | `Modèle d'instrument (Ref)` | `lutherie.modeleDInstrumentRef` |
| L239 | Option select | `-- Indépendant / Aucun modèle --` | `lutherie.independantAucunModele` |
| L252 | Label de champ | `Pièce du modèle (` | `lutherie.pieceDuModele` |
| L262 | Option select | `-- Sélectionnez une pièce du modèle --` | `lutherie.selectionnezUnePieceDuModele` |
| L268 | Option select | `+ Autre / Saisie personnalisée...` | `lutherie.autreSaisiePersonnalisee` |
| L274 | Label de champ | `Catégorie / Type de pièce` | `lutherie.categorieTypeDePiece` |
| L284 | Configuration statique (propriété name) | `partId` | `lutherie.partid` |
| L285 | Configuration statique (propriété name) | `typePiece` | `lutherie.typepiece` |
| L289 | Bouton | `↺ Choisir dans le modèle` | `lutherie.choisirDansLeModele` |
| L310 | Label de champ | `État` | `lutherie.etat` |
| L326 | Label de champ | `Quantité` | `lutherie.quantite` |
| L331 | Span / Badge | `pièces distinctes (#1 à #` | `lutherie.piecesDistinctes1A` |
| L346 | Span / Badge | `Chaque pièce sera créée de façon autonome et numérotée pour être affectée individuellement à un proj` | `lutherie.chaquePieceSeraCreeeDe` |
| L357 | Label de champ | `Étape de fabrication` | `lutherie.etapeDeFabrication` |
| L379 | Option select | `Étape` | `lutherie.etape` |
| L383 | Option select | `✅ Prête / Terminée (Toutes étapes validées)` | `lutherie.preteTermineeToutesEtapesValidees` |
| L392 | Span / Badge | `Étape` | `lutherie.etape` |
| L420 | Attribut placeholder | `Index d'usinage (ex: 0)` | `lutherie.indexDUsinageEx0` |
| L427 | Label de champ | `Statut` | `lutherie.statut` |
| L443 | Label de champ | `Notes Atelier` | `lutherie.notesAtelier` |
| L451 | Attribut placeholder | `Particularités, cotes, essence de bois...` | `lutherie.particularitesCotesEssenceDeBois` |
| L463 | Bouton | `🗑️ Retirer` | `lutherie.retirer` |
| L475 | Nœud JSX | `Annuler` | `lutherie.annuler` |
| L497 | Attribut placeholder | `Rechercher une pièce...` | `lutherie.rechercherUnePiece` |
| L508 | Option select | `Toutes les pièces` | `lutherie.toutesLesPieces` |
| L509 | Option select | `🟢 Libres uniquement` | `lutherie.libresUniquement` |
| L510 | Option select | `🟠 En projet d'assemblage` | `lutherie.enProjetDAssemblage` |
| L511 | Option select | `🔵 Montées sur instrument` | `lutherie.monteesSurInstrument` |
| L519 | Nœud JSX | `+ Ajouter Pièce` | `lutherie.ajouterPiece` |
| L528 | En-tête th | `Nom / Réf` | `lutherie.nomRef` |
| L530 | En-tête th | `Affectation` | `lutherie.affectation` |
| L531 | En-tête th | `État` | `lutherie.etat` |
| L532 | En-tête th | `Statut` | `lutherie.statut` |
| L533 | En-tête th | `Avancement` | `lutherie.avancement` |
| L534 | En-tête th | `Actions` | `lutherie.actions` |
| L540 | Nœud JSX | `Aucune pièce détachée trouvée.` | `lutherie.aucunePieceDetacheeTrouvee` |
| L561 | Span / Badge | `Lot de` | `lutherie.lotDe` |
| L567 | Nœud JSX | `Modèle :` | `lutherie.modele` |
| L601 | Span / Badge | `Terminée (` | `lutherie.terminee` |
| L623 | Span / Badge | `Étape` | `lutherie.etape` |
| L663 | Span / Badge | `Scinder` | `lutherie.scinder` |
| L670 | Attribut title | `Modifier la pièce` | `lutherie.modifierLaPiece` |
| L677 | Attribut title | `Supprimer la pièce` | `lutherie.supprimerLaPiece` |

---

#### 📄 `src/components/inventory/PartAssignmentBadge.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L11 | Span / Badge | `Disponible` | `lutherie.disponible` |
| L20 | Span / Badge | `En Projet` | `lutherie.enProjet` |
| L33 | Span / Badge | `Montée` | `lutherie.montee` |

---

#### 📄 `src/components/inventory/PartHistoryLogs.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L26 | Span / Badge | `Journal des contrôles & logs (` | `lutherie.journalDesControlesLogs` |
| L65 | Span / Badge | `Étape` | `lutherie.etape` |
| L76 | Span / Badge | `Par :` | `lutherie.par` |

---

#### 📄 `src/components/inventory/PartWorkflowModal.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L183 | Span / Badge | `Pièce assignée :` | `lutherie.pieceAssignee` |
| L187 | Span / Badge | `Étape` | `lutherie.etape` |
| L192 | Span / Badge | `Terminée ✅ (` | `lutherie.terminee` |
| L210 | Span / Badge | `Étape` | `lutherie.etape` |
| L227 | Attribut title | `Tester mes connaissances sur cette étape de fabrication` | `lutherie.testerMesConnaissancesSurCette` |
| L230 | Span / Badge | `Quiz de l'étape` | `lutherie.quizDeLEtape` |
| L250 | Span / Badge | `Outils :` | `lutherie.outils` |
| L256 | Span / Badge | `Matériaux :` | `lutherie.materiaux` |
| L266 | Span / Badge | `Remarques d'atelier :` | `lutherie.remarquesDAtelier` |
| L294 | Nœud JSX | `Fermer maintenant` | `lutherie.fermerMaintenant` |
| L313 | Span / Badge | `⏳ En attente de vérification par un Mestre` | `lutherie.enAttenteDeVerificationPar` |
| L317 | Span / Badge | `Espace Mestre / Validateur` | `lutherie.espaceMestreValidateur` |
| L322 | Nœud JSX | `🔄 Retouche` | `lutherie.retouche` |
| L332 | Attribut placeholder | `Consigne pour la retouche...` | `lutherie.consignePourLaRetouche` |
| L355 | Nœud JSX | `Cette pièce est prête et terminée !` | `lutherie.cettePieceEstPreteEt` |

---

#### 📄 `src/components/inventory/SuppliesListView.jsx` (32 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L74 | Dialogue / Message (alert) | `Erreur lors de l'enregistrement de la fourniture. Veuillez vérifier vos droits d'accès.` | `lutherie.erreurLorsDeLEnregistrement` |
| L127 | Nœud JSX | `Chargement des fournitures...` | `lutherie.chargementDesFournitures` |
| L134 | Titre | `📦 Stock Matériaux & Accessoires (` | `lutherie.stockMateriauxAccessoires` |
| L154 | Span / Badge | `Matières premières requises par les tutoriels du Varal :` | `lutherie.matieresPremieresRequisesParLes` |
| L181 | Label de champ | `Nom de l'article *` | `lutherie.nomDeLArticle` |
| L189 | Attribut placeholder | `Ex: Calebasse, Corde nylon` | `lutherie.exCalebasseCordeNylon` |
| L196 | Label de champ | `Catégorie` | `lutherie.categorie` |
| L197 | Attribut placeholder | `Ex: Corderie, Bois, Végétal` | `lutherie.exCorderieBoisVegetal` |
| L200 | Label de champ | `Stock initial` | `lutherie.stockInitial` |
| L204 | Label de champ | `Unité` | `lutherie.unite` |
| L206 | Option select | `Unités` | `lutherie.unites` |
| L207 | Option select | `Mètres` | `lutherie.metres` |
| L208 | Option select | `Bobines` | `lutherie.bobines` |
| L209 | Option select | `Kg` | `lutherie.kg` |
| L210 | Option select | `Litres` | `lutherie.litres` |
| L214 | Label de champ | `Seuil Critique` | `lutherie.seuilCritique` |
| L218 | Label de champ | `Format Achat` | `lutherie.formatAchat` |
| L219 | Attribut placeholder | `Ex: Lot de 10` | `lutherie.exLotDe10` |
| L222 | Label de champ | `Fournisseur` | `lutherie.fournisseur` |
| L226 | Label de champ | `Lien d'achat (URL)` | `lutherie.lienDAchatUrl` |
| L245 | En-tête th | `Article` | `lutherie.article` |
| L246 | En-tête th | `Catégorie` | `lutherie.categorie` |
| L247 | En-tête th | `Stock` | `lutherie.stock` |
| L248 | En-tête th | `Fournisseur` | `lutherie.fournisseur` |
| L249 | En-tête th | `Actions` | `lutherie.actions` |
| L262 | Span / Badge | `📖 Tuto Varal` | `lutherie.tutoVaral` |
| L286 | Span / Badge | `⚠️ Stock Critique` | `lutherie.stockCritique` |
| L309 | Span / Badge | `🛒 Commander` | `lutherie.commander` |
| L317 | Attribut title | `Éditer` | `lutherie.editer` |
| L318 | Bouton | `Éditer` | `lutherie.editer` |
| L324 | Attribut title | `Supprimer` | `lutherie.supprimer` |
| L338 | Nœud JSX | `Aucune fourniture enregistrée pour le domaine "` | `lutherie.aucuneFournitureEnregistreePourLe` |

---

#### 📄 `src/components/inventory/WorkshopToolsListView.jsx` (26 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L88 | Dialogue / Message (alert) | `Erreur lors de l'enregistrement de l'outil. Veuillez vérifier vos droits d'accès.` | `lutherie.erreurLorsDeLEnregistrement` |
| L121 | Nœud JSX | `Chargement de l'outillage...` | `lutherie.chargementDeLOutillage` |
| L128 | Titre | `🛠️ Matériel & Outillage (` | `lutherie.materielOutillage` |
| L135 | Attribut placeholder | `Rechercher un outil...` | `lutherie.rechercherUnOutil` |
| L145 | Option select | `Tous` | `lutherie.tous` |
| L146 | Option select | `Résidents locaux` | `lutherie.residentsLocaux` |
| L147 | Option select | `Mobiles` | `lutherie.mobiles` |
| L167 | Span / Badge | `Outils requis par les tutoriels du Varal :` | `lutherie.outilsRequisParLesTutoriels` |
| L194 | Label de champ | `Nom de l'outil *` | `lutherie.nomDeLOutil` |
| L202 | Attribut placeholder | `Ex: Scie fine, Ciseau à bois` | `lutherie.exScieFineCiseauA` |
| L210 | Label de champ | `Emplacement / Gardien` | `lutherie.emplacementGardien` |
| L217 | Attribut placeholder | `Ex: Atelier de Dorian, Local...` | `lutherie.exAtelierDeDorianLocal` |
| L225 | Label de champ | `État initial` | `lutherie.etatInitial` |
| L227 | Option select | `Neuf` | `lutherie.neuf` |
| L228 | Option select | `Bon` | `lutherie.bon` |
| L229 | Option select | `À réparer` | `lutherie.aReparer` |
| L235 | Label de champ | `Résident au local (non mobile)` | `lutherie.residentAuLocalNonMobile` |
| L261 | Span / Badge | `📖 Requis en tutoriel` | `lutherie.requisEnTutoriel` |
| L270 | Attribut title | `Éditer` | `lutherie.editer` |
| L271 | Bouton | `Éditer` | `lutherie.editer` |
| L277 | Attribut title | `Supprimer cet outil` | `lutherie.supprimerCetOutil` |
| L287 | Span / Badge | `À emmener` | `lutherie.aEmmener` |
| L318 | Option select | `Neuf` | `lutherie.neuf` |
| L319 | Option select | `Bon` | `lutherie.bon` |
| L320 | Option select | `À réparer` | `lutherie.aReparer` |
| L328 | Nœud JSX | `Aucun outil ne correspond à votre recherche.` | `lutherie.aucunOutilNeCorrespondA` |

---

#### 📄 `src/components/profile/StudentInstrumentsWorkshop.jsx` (21 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L91 | Nœud JSX | `Chargement de votre atelier...` | `lutherie.chargementDeVotreAtelier` |
| L135 | Paragraphe | `Modèle :` | `lutherie.modele` |
| L136 | Paragraphe | `) • Progression terminée :` | `lutherie.progressionTerminee` |
| L136 | Paragraphe | `pièces` | `lutherie.pieces` |
| L144 | Nœud JSX | `← Retour à mes projets` | `lutherie.retourAMesProjets` |
| L152 | Nœud JSX | `Conseil d'atelier :` | `lutherie.conseilDAtelier` |
| L152 | Paragraphe | `Dépliez les étapes de chaque pièce pour suivre les consignes et ouvrir le tutoriel du Varal. Quand v` | `lutherie.depliezLesEtapesDeChaque` |
| L152 | Nœud JSX | `soumettre votre étape au Mestre` | `lutherie.soumettreVotreEtapeAuMestre` |
| L159 | Span / Badge | `Composants de votre instrument` | `lutherie.composantsDeVotreInstrument` |
| L161 | Span / Badge | `terminés` | `lutherie.termines` |
| L243 | Titre | `Mes Instruments en Fabrication` | `lutherie.mesInstrumentsEnFabrication` |
| L245 | Paragraphe | `Instruments qui vous sont nominativement attribués pour votre apprentissage ou votre équipement.` | `lutherie.instrumentsQuiVousSontNominativement` |
| L254 | Paragraphe | `Vous n'avez pas encore d'instrument personnel en cours de fabrication.` | `lutherie.vousNAvezPasEncore` |
| L257 | Paragraphe | `Rapprochez-vous de votre Mestre pour qu'il vous attribue un projet d'instrument (Alfaia, Agbê, Gongo` | `lutherie.rapprochezVousDeVotreMestre` |
| L274 | Span / Badge | `Modèle :` | `lutherie.modele` |
| L278 | Span / Badge | `Mon Instrument` | `lutherie.monInstrument` |
| L286 | Span / Badge | `Assemblage des pièces` | `lutherie.assemblageDesPieces` |
| L302 | Nœud JSX | `Ouvrir mon Établi →` | `lutherie.ouvrirMonEtabli` |
| L319 | Titre | `Projets Collectifs de l'Atelier (` | `lutherie.projetsCollectifsDeLAtelier` |
| L321 | Paragraphe | `Instruments construits pour le parc commun de l'association.` | `lutherie.instrumentsConstruitsPourLeParc` |
| L340 | Span / Badge | `Consulter →` | `lutherie.consulter` |

---

#### 📄 `src/components/profile/MonAtelier.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L17 | Configuration statique (propriété label) | `🥁 Instruments` | `lutherie.instruments` |
| L18 | Configuration statique (propriété label) | `🧵 Vestiaire & Costumes` | `lutherie.vestiaireCostumes` |
| L19 | Configuration statique (propriété label) | `📚 Édition & Reliure` | `lutherie.editionReliure` |
| L29 | Titre | `L'Atelier d'Artisanat` | `lutherie.lAtelierDArtisanat` |
| L33 | Paragraphe | `Espace de fabrication collective et d'apprentissage manuel : construisez vos instruments, confection` | `lutherie.espaceDeFabricationCollectiveEt` |
| L42 | Bouton | `← Accueil` | `lutherie.accueil` |
| L90 | Titre | `Atelier Reliure & Édition Artisanale` | `lutherie.atelierReliureEditionArtisanale` |
| L93 | Paragraphe | `Cet atelier accueillera très prochainement les tutoriels de confection et d'impression pour :` | `lutherie.cetAtelierAccueilleraTresProchainement` |
| L97 | Nœud JSX | `Impression & reliure à la japonaise` | `lutherie.impressionReliureALaJaponaise` |
| L97 | Nœud JSX | `des carnets de toadas et paroles de l'association.` | `lutherie.desCarnetsDeToadasEt` |
| L98 | Nœud JSX | `Tirage et gravure sur bois (Xilogravura)` | `lutherie.tirageEtGravureSurBois` |
| L98 | Nœud JSX | `pour les couvertures et affiches culturelles.` | `lutherie.pourLesCouverturesEtAffiches` |
| L99 | Nœud JSX | `Planches de chants et accords` | `lutherie.planchesDeChantsEtAccords` |
| L99 | Nœud JSX | `à glisser dans votre housse d'instrument.` | `lutherie.aGlisserDansVotreHousse` |
| L102 | Span / Badge | `Module en préparation • Bientôt disponible` | `lutherie.moduleEnPreparationBientotDisponible` |

---

## 📦 Pôle Costumerie & Artisanat Textile (Namespace : `costumerie`)

**Volume détecté :** 250 chaînes brutes réparties sur 12 composant(s) nécessitant une intervention (1 composant(s) 100% propre(s)).

### ✅ Composants 100 % propres (0 chaîne en dur) :
- `src/components/profile/CostumeChecklist.jsx`

### ⚠️ Composants nécessitant une extraction :

#### 📄 `src/components/mestre/WardrobeManager.jsx` (60 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L164 | Dialogue / Message (alert) | `Erreur lors de l'enregistrement de la pièce.` | `costumerie.erreurLorsDeLEnregistrement` |
| L195 | Dialogue / Message (alert) | `Erreur de suppression.` | `costumerie.erreurDeSuppression` |
| L222 | Dialogue / Message (alert) | `Erreur d'enregistrement.` | `costumerie.erreurDEnregistrement` |
| L250 | Dialogue / Message (alert) | `Erreur de suppression.` | `costumerie.erreurDeSuppression` |
| L258 | Titre | `🚨 ACCÈS REFUSÉ` | `costumerie.accesRefuse` |
| L261 | Paragraphe | `Vous n'avez pas accès au module Vestiaire de l'association.` | `costumerie.vousNAvezPasAcces` |
| L265 | Nœud JSX | `⬅️ Retour` | `costumerie.retour` |
| L278 | Nœud JSX | `← Retour` | `costumerie.retour` |
| L281 | Span / Badge | `🧵 Gestion de la Costumerie` | `costumerie.gestionDeLaCostumerie` |
| L303 | Span / Badge | `Établi de confection` | `costumerie.etabliDeConfection` |
| L317 | Span / Badge | `Stock & Prêts` | `costumerie.stockPrets` |
| L331 | Span / Badge | `Tissus & Mercerie` | `costumerie.tissusMercerie` |
| L345 | Span / Badge | `Outillage` | `costumerie.outillage` |
| L359 | Span / Badge | `Mensurations` | `costumerie.mensurations` |
| L388 | Titre | `📦 Stock physique & Emprunts de pièces` | `costumerie.stockPhysiqueEmpruntsDePieces` |
| L392 | Span / Badge | `Total :` | `costumerie.total` |
| L393 | Span / Badge | `pièce` | `costumerie.piece` |
| L393 | Span / Badge | `répertoriée` | `costumerie.repertoriee` |
| L424 | Attribut placeholder | `ex: Jupe, Chemise, Chapeau` | `costumerie.exJupeChemiseChapeau` |
| L430 | Label de champ | `Taille` | `costumerie.taille` |
| L437 | Option select | `XS` | `costumerie.xs` |
| L441 | Option select | `XL` | `costumerie.xl` |
| L442 | Option select | `XXL` | `costumerie.xxl` |
| L447 | Label de champ | `État` | `costumerie.etat` |
| L454 | Option select | `Neuf` | `costumerie.neuf` |
| L455 | Option select | `Bon` | `costumerie.bon` |
| L456 | Option select | `Moyen` | `costumerie.moyen` |
| L457 | Option select | `Abîmé` | `costumerie.abime` |
| L462 | Label de champ | `Statut` | `costumerie.statut` |
| L469 | Option select | `Au local` | `costumerie.auLocal` |
| L470 | Option select | `Emprunté` | `costumerie.emprunte` |
| L471 | Option select | `En réparation` | `costumerie.enReparation` |
| L477 | Label de champ | `Emprunteur` | `costumerie.emprunteur` |
| L485 | Option select | `Sélectionner un membre...` | `costumerie.selectionnerUnMembre` |
| L516 | En-tête th | `Emprunteur` | `costumerie.emprunteur` |
| L523 | Nœud JSX | `L'inventaire des costumes est vide.` | `costumerie.lInventaireDesCostumesEst` |
| L557 | Bouton | `Éditer` | `costumerie.editer` |
| L564 | Bouton | `Supprimer` | `costumerie.supprimer` |
| L584 | Span / Badge | `Projets couture :` | `costumerie.projetsCouture` |
| L585 | Span / Badge | `projet` | `costumerie.projet` |
| L585 | Span / Badge | `en cours` | `costumerie.enCours` |
| L610 | Label de champ | `Nom du projet` | `costumerie.nomDuProjet` |
| L617 | Attribut placeholder | `ex: Nouvelles Jupes Blanches` | `costumerie.exNouvellesJupesBlanches` |
| L623 | Label de champ | `Coût estimé (€)` | `costumerie.coutEstime` |
| L630 | Attribut placeholder | `ex: 150.00` | `costumerie.ex15000` |
| L636 | Label de champ | `Statut` | `costumerie.statut` |
| L643 | Option select | `À commencer` | `costumerie.aCommencer` |
| L644 | Option select | `En cours` | `costumerie.enCours` |
| L645 | Option select | `Terminé` | `costumerie.termine` |
| L650 | Label de champ | `Besoins / Accessoires (Métrage de tissu, fils, boutons...)` | `costumerie.besoinsAccessoiresMetrageDeTissu` |
| L655 | Attribut placeholder | `ex: 20m de Tissu Coton Blanc, Fil résistant blanc, 15m de Ceinture élastique...` | `costumerie.ex20mDeTissuCoton` |
| L679 | En-tête th | `Projet` | `costumerie.projet` |
| L680 | En-tête th | `Besoins répertoriés` | `costumerie.besoinsRepertories` |
| L681 | En-tête th | `Coût estimé` | `costumerie.coutEstime` |
| L682 | En-tête th | `Statut` | `costumerie.statut` |
| L683 | En-tête th | `Actions` | `costumerie.actions` |
| L689 | Nœud JSX | `Aucun projet couture pour le moment.` | `costumerie.aucunProjetCouturePourLe` |
| L697 | Span / Badge | `Aucun besoin saisi` | `costumerie.aucunBesoinSaisi` |
| L710 | Bouton | `Éditer` | `costumerie.editer` |
| L717 | Bouton | `Supprimer` | `costumerie.supprimer` |

---

#### 📄 `src/components/mestre/CostumesAdminManager.jsx` (35 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L146 | Dialogue / Message (alert) | `Veuillez saisir un titre pour le costume.` | `costumerie.veuillezSaisirUnTitrePour` |
| L199 | Titre | `🎭 Gestion des Costumes & Pièces` | `costumerie.gestionDesCostumesPieces` |
| L202 | Paragraphe | `Définissez les costumes de la troupe, associez leurs pièces et les instructions de l'Atelier Couture` | `costumerie.definissezLesCostumesDeLa` |
| L212 | Nœud JSX | `+ Créer un Costume` | `costumerie.creerUnCostume` |
| L219 | Nœud JSX | `⏳ Chargement des costumes...` | `costumerie.chargementDesCostumes` |
| L222 | Paragraphe | `Aucun costume créé. Cliquez sur "+ Créer un Costume" pour commencer.` | `costumerie.aucunCostumeCreeCliquezSur` |
| L245 | Bouton | `✏️ Éditer` | `costumerie.editer` |
| L266 | Span / Badge | `Pièces associées (` | `costumerie.piecesAssociees` |
| L270 | Span / Badge | `Aucune pièce liée.` | `costumerie.aucunePieceLiee` |
| L311 | Attribut title | `Fermer (Échap)` | `costumerie.fermerEchap` |
| L323 | Label de champ | `Titre du Costume *` | `costumerie.titreDuCostume` |
| L330 | Attribut placeholder | `Ex: Costume Blanc Percussion` | `costumerie.exCostumeBlancPercussion` |
| L339 | Label de champ | `Catégorie Cible` | `costumerie.categorieCible` |
| L348 | Option select | `💃 Danse` | `costumerie.danse` |
| L349 | Option select | `🥁 Percussion` | `costumerie.percussion` |
| L350 | Option select | `🌐 Tous les pupitres` | `costumerie.tousLesPupitres` |
| L357 | Label de champ | `Description (facultative)` | `costumerie.descriptionFacultative` |
| L363 | Attribut placeholder | `Description du costume, événements associés...` | `costumerie.descriptionDuCostumeEvenementsAssocies` |
| L372 | Titre | `📌 Pièces composant ce costume (` | `costumerie.piecesComposantCeCostume` |
| L379 | Span / Badge | `Aucune pièce ajoutée pour le moment.` | `costumerie.aucunePieceAjouteePourLe` |
| L397 | Bouton | `Éditer` | `costumerie.editer` |
| L404 | Bouton | `Supprimer` | `costumerie.supprimer` |
| L421 | Attribut placeholder | `Nom de la pièce (ex: Jupe Roda)...` | `costumerie.nomDeLaPieceEx` |
| L431 | Option select | `👑 Tête / Accessoire haut` | `costumerie.teteAccessoireHaut` |
| L432 | Option select | `👕 Torse / Haut` | `costumerie.torseHaut` |
| L433 | Option select | `👖 Jambes / Bas` | `costumerie.jambesBas` |
| L434 | Option select | `👟 Pieds / Chaussures` | `costumerie.piedsChaussures` |
| L435 | Option select | `🎒 Accessoire / Portatif` | `costumerie.accessoirePortatif` |
| L447 | Span / Badge | `Pièce obligatoire pour ce costume` | `costumerie.pieceObligatoirePourCeCostume` |
| L456 | Attribut placeholder | `Description / Matériaux (ex: Fait avec des perles de l'association)` | `costumerie.descriptionMateriauxExFaitAvec` |
| L464 | Label de champ | `🧵 Liaison avec un tutoriel de l'Atelier Couture` | `costumerie.liaisonAvecUnTutorielDe` |
| L472 | Option select | `-- Aucun tutoriel lié --` | `costumerie.aucunTutorielLie` |
| L477 | Span / Badge | `Lier cette pièce à un tutoriel débloque le bouton "Tutoriel de fabrication" sur la fiche du membre.` | `costumerie.lierCettePieceAUn` |
| L489 | Nœud JSX | `+ Valider cette pièce` | `costumerie.validerCettePiece` |
| L504 | Nœud JSX | `Annuler` | `costumerie.annuler` |

---

#### 📄 `src/components/mestre/CostumeSizesTable.jsx` (13 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L22 | Titre | `🚨 ACCÈS REFUSÉ` | `costumerie.accesRefuse` |
| L25 | Paragraphe | `Vous n'avez pas l'autorisation d'accéder au tableau des tailles et mensurations du Vestiaire.` | `costumerie.vousNAvezPasL` |
| L68 | Titre | `👔 Tableau des Tailles / Vestiaire` | `costumerie.tableauDesTaillesVestiaire` |
| L72 | Span / Badge | `Membre` | `costumerie.membre` |
| L72 | Span / Badge | `au total` | `costumerie.auTotal` |
| L80 | Span / Badge | `👕 Synthèse des Tailles Hauts / T-Shirts` | `costumerie.syntheseDesTaillesHautsT` |
| L97 | Span / Badge | `👖 Synthèse des Tailles Bas / Pantalons` | `costumerie.syntheseDesTaillesBasPantalons` |
| L119 | Attribut placeholder | `Rechercher par nom, prénom ou instrument...` | `costumerie.rechercherParNomPrenomOu` |
| L130 | En-tête th | `Membre` | `costumerie.membre` |
| L131 | En-tête th | `Pupitre` | `costumerie.pupitre` |
| L132 | En-tête th | `Taille T-Shirt` | `costumerie.tailleTShirt` |
| L133 | En-tête th | `Taille Pantalon` | `costumerie.taillePantalon` |
| L139 | Nœud JSX | `Aucun membre trouvé correspondant à la recherche.` | `costumerie.aucunMembreTrouveCorrespondantA` |

---

#### 📄 `src/components/profile/MonVestiaire.jsx` (22 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L182 | Titre | `🎭 Mon Vestiaire & Garde-Robe` | `costumerie.monVestiaireGardeRobe` |
| L185 | Paragraphe | `Mannequin d'habillage visuel, validation de vos pièces et Atelier Couture.` | `costumerie.mannequinDHabillageVisuelValidation` |
| L190 | Nœud JSX | `← Retour` | `costumerie.retour` |
| L207 | Bouton | `Tous les Costumes (` | `costumerie.tousLesCostumes` |
| L218 | Bouton | `💃 Danse` | `costumerie.danse` |
| L229 | Bouton | `🥁 Percussion` | `costumerie.percussion` |
| L244 | Bouton | `🎨 Mannequin` | `costumerie.mannequin` |
| L255 | Bouton | `📋 Liste` | `costumerie.liste` |
| L264 | Span / Badge | `⏳ Chargement de votre vestiaire...` | `costumerie.chargementDeVotreVestiaire` |
| L321 | Span / Badge | `✅ Costume Validé !` | `costumerie.costumeValide` |
| L326 | Nœud JSX | `Progression :` | `costumerie.progression` |
| L327 | Nœud JSX | `obligatoire(s)` | `costumerie.obligatoireS` |
| L354 | Span / Badge | `Pièces requises (` | `costumerie.piecesRequises` |
| L359 | Span / Badge | `Aucune pièce définie pour ce costume.` | `costumerie.aucunePieceDefiniePourCe` |
| L404 | Attribut title | `Voir le tutoriel de fabrication dans l'Atelier Couture` | `costumerie.voirLeTutorielDeFabrication` |
| L405 | Bouton | `🧵 Tutoriel de fabrication` | `costumerie.tutorielDeFabrication` |
| L432 | Span / Badge | `📌 Élément de costume` | `costumerie.elementDeCostume` |
| L443 | Attribut title | `Fermer (Échap)` | `costumerie.fermerEchap` |
| L453 | Span / Badge | `Location:` | `costumerie.location` |
| L457 | Span / Badge | `★ Obligatoire` | `costumerie.obligatoire` |
| L461 | Span / Badge | `Optionnel` | `costumerie.optionnel` |
| L503 | Nœud JSX | `🧵 Tutoriel de fabrication` | `costumerie.tutorielDeFabrication` |

---

#### 📄 `src/components/profile/CostumeVisualizer.jsx` (3 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L66 | Span / Badge | `🎨 Mannequin d'Habillage Visuel` | `costumerie.mannequinDHabillageVisuel` |
| L69 | Paragraphe | `Cliquez sur un marqueur du corps ou du panier pour valider une pièce et voir son tutoriel.` | `costumerie.cliquezSurUnMarqueurDu` |
| L123 | Nœud JSX | `Panier` | `costumerie.panier` |

---

#### 📄 `src/components/profile/PostEventCostumeReturnModal.jsx` (15 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L155 | Titre | `Retour des Costumes` | `costumerie.retourDesCostumes` |
| L168 | Attribut title | `Fermer` | `costumerie.fermer` |
| L175 | Nœud JSX | `Merci pour ta participation à cette prestation ! Afin d'assurer le suivi de la garde-robe collective` | `costumerie.merciPourTaParticipationA` |
| L183 | Span / Badge | `Statut actuel enregistré :` | `costumerie.statutActuelEnregistre` |
| L184 | Span / Badge | `. Tu peux le modifier ci-dessous si la situation a évolué.` | `costumerie.tuPeuxLeModifierCi` |
| L192 | Label de champ | `Choisis une option :` | `costumerie.choisisUneOption` |
| L215 | Span / Badge | `Rendu au bac / malle collective` | `costumerie.renduAuBacMalleCollective` |
| L217 | Span / Badge | `J'ai replié et rangé mon costume propre dans le bac ou la cantine collective après la sortie.` | `costumerie.jAiReplieEtRange` |
| L242 | Span / Badge | `En lavage à domicile` | `costumerie.enLavageADomicile` |
| L244 | Span / Badge | `J'ai emporté mon costume à la maison pour le laver. Je m'engage à le rapporter propre à la prochaine` | `costumerie.jAiEmporteMonCostume` |
| L269 | Span / Badge | `Retouche / réparation nécessaire` | `costumerie.retoucheReparationNecessaire` |
| L271 | Span / Badge | `Un élément a été abîmé (bouton décousu, déchirure, ornement détaché, tâche tenace...).` | `costumerie.unElementAEteAbime` |
| L281 | Label de champ | `Description du problème pour l'Atelier Couture * :` | `costumerie.descriptionDuProblemePourL` |
| L288 | Attribut placeholder | `Ex : Bouton manquant sur la chemise côté gauche, couture défaite au bas de la jupe...` | `costumerie.exBoutonManquantSurLa` |
| L316 | Nœud JSX | `Fermer` | `costumerie.fermer` |

---

#### 📄 `src/components/profile/AtelierCouture.jsx` (19 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L165 | Dialogue / Message (alert) | `Erreur lors de la suppression du tutoriel.` | `costumerie.erreurLorsDeLaSuppression` |
| L177 | Titre | `🧵 Atelier Couture & Bibliothèque de Tutoriels` | `costumerie.atelierCoutureBibliothequeDeTutoriels` |
| L180 | Paragraphe | `Fiches techniques multimédias, liste du matériel, patrons et tutoriels vidéo de confection.` | `costumerie.fichesTechniquesMultimediasListeDu` |
| L193 | Nœud JSX | `+ Créer un Tutoriel` | `costumerie.creerUnTutoriel` |
| L204 | Nœud JSX | `Retour` | `costumerie.retour` |
| L213 | Span / Badge | `⏳ Chargement des tutoriels...` | `costumerie.chargementDesTutoriels` |
| L240 | Span / Badge | `Coût :` | `costumerie.cout` |
| L265 | Attribut title | `Modifier ce tutoriel` | `costumerie.modifierCeTutoriel` |
| L266 | Bouton | `✏️ Éditer` | `costumerie.editer` |
| L273 | Attribut title | `Supprimer ce tutoriel` | `costumerie.supprimerCeTutoriel` |
| L293 | Titre | `🧵 Matériel Nécessaire` | `costumerie.materielNecessaire` |
| L305 | Titre | `📜 Étapes de Fabrication pas à pas` | `costumerie.etapesDeFabricationPasA` |
| L317 | Titre | `🎬 Tutoriel Vidéo de démonstration` | `costumerie.tutorielVideoDeDemonstration` |
| L335 | Titre | `🎨 Patrons & Images de démonstration (` | `costumerie.patronsImagesDeDemonstration` |
| L346 | Nœud JSX | `🔍 Agrrandir` | `costumerie.agrrandir` |
| L358 | Titre | `📄 Documents Joints (PDF / Patrons à imprimer)` | `costumerie.documentsJointsPdfPatronsA` |
| L371 | Span / Badge | `Ouvrir / Télécharger ↗` | `costumerie.ouvrirTelecharger` |
| L420 | Titre | `🧵 Matériel Nécessaire` | `costumerie.materielNecessaire` |
| L429 | Titre | `📜 Étapes de Fabrication pas à pas` | `costumerie.etapesDeFabricationPasA` |

---

#### 📄 `src/components/profile/CollectiveWorkshopView.jsx` (31 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L139 | Titre | `🧵 Atelier Costumes & Confections` | `costumerie.atelierCostumesConfections` |
| L142 | Span / Badge | `Parc Mutualisé` | `costumerie.parcMutualise` |
| L146 | Paragraphe | `Costumes confectionnés pour le stock associatif de la troupe, suivi de vos réalisations et accès aux` | `costumerie.costumesConfectionnesPourLeStock` |
| L151 | Nœud JSX | `← Retour` | `costumerie.retour` |
| L170 | Span / Badge | `Fiches Techniques Atelier` | `costumerie.fichesTechniquesAtelier` |
| L173 | Span / Badge | `Tutoriels pas-à-pas, vidéos et listes de matériel` | `costumerie.tutorielsPasAPasVideos` |
| L178 | Span / Badge | `Ouvrir →` | `costumerie.ouvrir` |
| L194 | Span / Badge | `Patrons & Documents Varal` | `costumerie.patronsDocumentsVaral` |
| L197 | Span / Badge | `Patrons de couture téléchargeables, PDF et fiches` | `costumerie.patronsDeCoutureTelechargeablesPdf` |
| L202 | Span / Badge | `Consulter →` | `costumerie.consulter` |
| L212 | Span / Badge | `Mes Confections pour la Troupe` | `costumerie.mesConfectionsPourLaTroupe` |
| L215 | Titre | `Pièces apportées au stock commun` | `costumerie.piecesApporteesAuStockCommun` |
| L218 | Paragraphe | `Déclarez ici le nombre de pièces de costumes ou d'accessoires que vous avez cousues ou décorées pour` | `costumerie.declarezIciLeNombreDe` |
| L240 | Bouton | `OK` | `costumerie.ok` |
| L260 | Attribut title | `Diminuer` | `costumerie.diminuer` |
| L268 | Attribut title | `Cliquer pour modifier directement le nombre` | `costumerie.cliquerPourModifierDirectementLe` |
| L283 | Attribut title | `Ajouter une pièce confectionnée` | `costumerie.ajouterUnePieceConfectionnee` |
| L296 | Span / Badge | `💡 Vous n'avez pas encore déclaré de pièces pour le stock collectif. Participez aux prochains chanti` | `costumerie.vousNAvezPasEncore` |
| L299 | Span / Badge | `Merci pour votre contribution au stock collectif ! Chaque pièce renforce l'autonomie et l'éclat de l` | `costumerie.merciPourVotreContributionAu` |
| L303 | Span / Badge | `Formidable investissement ! Vous faites partie des artisans piliers du vestiaire de l'association.` | `costumerie.formidableInvestissementVousFaitesPartie` |
| L314 | Titre | `Chantier Collectif de la Troupe` | `costumerie.chantierCollectifDeLaTroupe` |
| L319 | Span / Badge | `projet(s) enregistré(s)` | `costumerie.projetSEnregistreS` |
| L324 | Nœud JSX | `⏳ Chargement des projets textiles...` | `costumerie.chargementDesProjetsTextiles` |
| L329 | Paragraphe | `Aucun chantier couture spécifique n'est ouvert pour le moment.` | `costumerie.aucunChantierCoutureSpecifiqueN` |
| L332 | Paragraphe | `Les confections libres sont les bienvenues pour renouveler les basiques (chemises blanches, bracelet` | `costumerie.lesConfectionsLibresSontLes` |
| L373 | Nœud JSX | `Besoins :` | `costumerie.besoins` |
| L380 | Span / Badge | `Budget prévu :` | `costumerie.budgetPrevu` |
| L396 | Titre | `Tutoriels & Fiches de Confection` | `costumerie.tutorielsFichesDeConfection` |
| L401 | Span / Badge | `fiche(s)` | `costumerie.ficheS` |
| L428 | Span / Badge | `Libre` | `costumerie.libre` |
| L435 | Bouton | `Voir fiche →` | `costumerie.voirFiche` |

---

#### 📄 `src/components/association-settings/blocks/WardrobeBlock.jsx` (11 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L31 | Titre | `👔 Vestiaire : Tenues types (Marque Blanche)` | `costumerie.vestiaireTenuesTypesMarqueBlanche` |
| L36 | Span / Badge | `Définissez les tenues officielles de votre association. Les adhérents pourront se référer à ces code` | `costumerie.definissezLesTenuesOfficiellesDe` |
| L42 | Span / Badge | `Aucune tenue type configurée pour le moment.` | `costumerie.aucuneTenueTypeConfigureePour` |
| L51 | Span / Badge | `Pièces :` | `costumerie.pieces` |
| L58 | Attribut title | `Supprimer cette tenue` | `costumerie.supprimerCetteTenue` |
| L69 | Span / Badge | `➕ Ajouter une nouvelle tenue type` | `costumerie.ajouterUneNouvelleTenueType` |
| L75 | Label de champ | `Nom de la tenue` | `costumerie.nomDeLaTenue` |
| L83 | Attribut placeholder | `ex: Costume Blanc` | `costumerie.exCostumeBlanc` |
| L89 | Label de champ | `Pièces incluses` | `costumerie.piecesIncluses` |
| L97 | Attribut placeholder | `ex: Pantalon, Chemise, Ceinture` | `costumerie.exPantalonChemiseCeinture` |
| L109 | Bouton | `Ajouter la tenue` | `costumerie.ajouterLaTenue` |

---

#### 📄 `src/components/association-settings/modules/WardrobeMemberModeCard.jsx` (7 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L10 | Configuration statique (propriété label) | `Garde-robe personnelle` | `costumerie.gardeRobePersonnelle` |
| L20 | Configuration statique (propriété label) | `Confection collective & Atelier` | `costumerie.confectionCollectiveAtelier` |
| L30 | Configuration statique (propriété label) | `Désactivé (Masqué pour les membres)` | `costumerie.desactiveMasquePourLesMembres` |
| L51 | Titre | `👗 Mode du Vestiaire Adhérent` | `costumerie.modeDuVestiaireAdherent` |
| L54 | Paragraphe | `Définissez comment les adhérents interagissent avec les costumes au sein de votre association.` | `costumerie.definissezCommentLesAdherentsInteragissent` |
| L58 | Span / Badge | `Actuel :` | `costumerie.actuel` |
| L116 | Nœud JSX | `Mode actif pour la troupe` | `costumerie.modeActifPourLaTroupe` |

---

#### 📄 `src/components/documents/CostumerieDocumentsTable.jsx` (17 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L57 | Span / Badge | `Patrons & Fiches de Confection` | `costumerie.patronsFichesDeConfection` |
| L60 | Paragraphe | `Fiches de coupe, patrons téléchargeables, métrages et guides de confection de la troupe.` | `costumerie.fichesDeCoupePatronsTelechargeables` |
| L71 | Bouton | `🪢 Vue Varal` | `costumerie.vueVaral` |
| L82 | Nœud JSX | `➕ Nouveau patron / fiche` | `costumerie.nouveauPatronFiche` |
| L97 | Bouton | `⬅️ Annuler et revenir au tableau de couture` | `costumerie.annulerEtRevenirAuTableau` |
| L116 | Nœud JSX | `Aucun patron ou fiche de confection enregistré pour le moment.` | `costumerie.aucunPatronOuFicheDe` |
| L124 | En-tête th | `Nom du costume / pièce` | `costumerie.nomDuCostumePiece` |
| L125 | En-tête th | `Patron PDF joint` | `costumerie.patronPdfJoint` |
| L126 | En-tête th | `Actions` | `costumerie.actions` |
| L161 | Span / Badge | `Aucun fichier` | `costumerie.aucunFichier` |
| L169 | Attribut title | `Consulter la fiche` | `costumerie.consulterLaFiche` |
| L170 | Bouton | `👁️ Voir` | `costumerie.voir` |
| L178 | Attribut title | `Télécharger le patron PDF` | `costumerie.telechargerLePatronPdf` |
| L179 | Bouton | `⬇️ Patron` | `costumerie.patron` |
| L189 | Attribut title | `Modifier cette fiche` | `costumerie.modifierCetteFiche` |
| L190 | Bouton | `✏️ Éditer` | `costumerie.editer` |
| L197 | Attribut title | `Supprimer la fiche` | `costumerie.supprimerLaFiche` |

---

#### 📄 `src/components/event-details/EventWardrobeSummaryCard.jsx` (17 chaînes brutes)

| Ligne | Contexte | Texte brut détecté | Clé suggérée |
| :---: | :--- | :--- | :--- |
| L215 | Titre | `Bilan du Vestiaire Post-Prestation` | `costumerie.bilanDuVestiairePostPrestation` |
| L219 | Paragraphe | `Réconciliation des tenues de scène et suivi des retours au local.` | `costumerie.reconciliationDesTenuesDeScene` |
| L226 | Span / Badge | `Déclarations :` | `costumerie.declarations` |
| L259 | Span / Badge | `Au bac asso` | `costumerie.auBacAsso` |
| L265 | Paragraphe | `Déposées au local dans la malle commune après la sortie.` | `costumerie.deposeesAuLocalDansLa` |
| L274 | Span / Badge | `Lavage maison` | `costumerie.lavageMaison` |
| L280 | Paragraphe | `Emportées par les membres pour entretien à domicile.` | `costumerie.emporteesParLesMembresPour` |
| L289 | Span / Badge | `À retoucher` | `costumerie.aRetoucher` |
| L295 | Paragraphe | `Signalées avec une réparation ou un accroc à traiter.` | `costumerie.signaleesAvecUneReparationOu` |
| L305 | Titre | `Signalements pour l'Atelier Couture (` | `costumerie.signalementsPourLAtelierCouture` |
| L329 | Titre | `Membres en attente de déclaration (` | `costumerie.membresEnAttenteDeDeclaration` |
| L332 | Span / Badge | `🎉 Toutes les déclarations ont été reçues !` | `costumerie.toutesLesDeclarationsOntEte` |
| L363 | Span / Badge | `Déjà relancé aujourd'hui ✅` | `costumerie.dejaRelanceAujourdHui` |
| L390 | Span / Badge | `Action groupée de gestion du bac :` | `costumerie.actionGroupeeDeGestionDu` |
| L392 | Paragraphe | `Bascule simultanément les` | `costumerie.basculeSimultanementLes` |
| L393 | Paragraphe | `tenues déposées au bac en statut « Au sale / À laver » dans l'inventaire physique.` | `costumerie.tenuesDeposeesAuBacEn` |
| L399 | Span / Badge | `✅ Bac traité (` | `costumerie.bacTraite` |

---

## 📊 Récapitulatif Chiffré Global

| Pôle d'Activité | Namespace | Fichiers Analysés | Fichiers 100% Propres | Fichiers avec chaînes brutes | Total Chaînes Brutes |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Pôle Logistique** | `logistics` | 16 | 3 | 13 | **237** |
| **Pôle Lutherie & Artisanat Instrumental** | `lutherie` | 13 | 0 | 13 | **300** |
| **Pôle Costumerie & Artisanat Textile** | `costumerie` | 13 | 1 | 12 | **250** |
| **TOTAL GÉNÉRAL** | — | **42** | **4** | **38** | **787** |

### 🎯 Synthèse des composants 100% propres vs à traiter

- **Composants 100 % conformes (4 fichiers) :**
  - `src/components/inventory/InventoryItemModal.jsx`
  - `src/components/inventory/InstrumentAttributionSection.jsx`
  - `src/components/inventory/InstrumentVisualizer.jsx`
  - `src/components/profile/CostumeChecklist.jsx`

- **Composants à internationaliser (38 fichiers, 787 chaînes brutes au total) :**
  - **Logistique (13 fichiers, 237 chaînes) :** `InventoryManager.jsx` (15), `InventoryItemCard.jsx` (13), `InstrumentsDataTable.jsx` (46), `InstrumentEditModal.jsx` (25), `RepairDiagnosticModal.jsx` (11), `InstrumentCautionFields.jsx` (1), `InventoryFilterBar.jsx` (12), `InventoryMovementsBanner.jsx` (3), `OrdersManager.jsx` (36), `OrderPaymentControls.jsx` (12), `MemberOrdersPaymentAlert.jsx` (9), `AccessoriesKitsBlock.jsx` (14), `UserMateriel.jsx` (40).
  - **Lutherie (13 fichiers, 300 chaînes) :** `InventoryProjectsView.jsx` (55), `AssemblySlotItem.jsx` (14), `InstrumentBaptismModal.jsx` (14), `ImportModelWizardModal.jsx` (21), `InstrumentModelsManager.jsx` (15), `InventoryPartsView.jsx` (66), `PartAssignmentBadge.jsx` (3), `PartHistoryLogs.jsx` (3), `PartWorkflowModal.jsx` (15), `SuppliesListView.jsx` (32), `WorkshopToolsListView.jsx` (26), `StudentInstrumentsWorkshop.jsx` (21), `MonAtelier.jsx` (15).
  - **Costumerie (12 fichiers, 250 chaînes) :** `WardrobeManager.jsx` (60), `CostumesAdminManager.jsx` (35), `CostumeSizesTable.jsx` (13), `MonVestiaire.jsx` (22), `CostumeVisualizer.jsx` (3), `PostEventCostumeReturnModal.jsx` (15), `AtelierCouture.jsx` (19), `CollectiveWorkshopView.jsx` (31), `WardrobeBlock.jsx` (11), `WardrobeMemberModeCard.jsx` (7), `CostumerieDocumentsTable.jsx` (17), `EventWardrobeSummaryCard.jsx` (17).
