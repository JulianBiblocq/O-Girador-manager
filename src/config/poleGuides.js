/**
 * Fichier de Configuration Centralisé : poleGuides.js
 * 
 * Contient l'ensemble des guides d'aide contextuelle pour les pôles et onglets d'administration.
 * Guide les membres du bureau (Trésorier, Secrétaire, Mestre, Logistique, Lutherie, Costumerie, Studio)
 * dans leurs tâches quotidiennes et alimente la bannière InfoPoleBanner ainsi que le futur parcours guidé.
 * 
 * ⚠️ VUES MEMBRES SIMPLES EXCLUES :
 * Les espaces réservés aux adhérents simples (Accueil, Profil, Agenda membre, Matériel membre,
 * Vestiaire membre, Trombinoscope, Forum public, Varal membre) ne comportent PAS de bannière.
 */

// Liste explicite des onglets et pôles membres à exclure de toute bannière d'aide
const EXCLUDED_MEMBER_KEYS = new Set([
  'accueil',
  'mon-espace',
  'profil',
  'agenda',
  'materiel',
  'vestiaire',
  'trombinoscope',
  'forum',
  'varal',
  'dashboard'
]);

export const POLE_GUIDES = {
  // ==========================================
  // 1. PÔLE TRÉSORERIE & FINANCES
  // ==========================================
  tresorerie: {
    titre: "💰 Pôle Trésorerie & Finances",
    title: "💰 Pôle Trésorerie & Finances",
    description: "Pilotez la santé financière de l'association, contrôlez la rentabilité des événements et enregistrez les opérations comptables.",
    etapes: [
      "Vérifiez l'état des cotisations et relancez les adhérents en retard.",
      "Saisissez les recettes et dépenses courantes dans le journal des opérations.",
      "Examinez et remboursez les notes de frais kilométriques soumises.",
      "Générez les bilans et exports comptables pour l'assemblée générale."
    ],
    steps: [
      "Vérifiez l'état des cotisations et relancez les adhérents en retard.",
      "Saisissez les recettes et dépenses courantes dans le journal des opérations.",
      "Examinez et remboursez les notes de frais kilométriques soumises.",
      "Générez les bilans et exports comptables pour l'assemblée générale."
    ]
  },
  'dashboard-finance': {
    titre: "📊 Synthèse & Bilan Financier",
    title: "📊 Synthèse & Bilan Financier",
    description: "Aperçu global de la trésorerie, suivi des coordonnées bancaires officielles et répartition des flux budgétaires.",
    etapes: [
      "Consultez les soldes totaux et les coordonnées bancaires (IBAN/BIC) de l'association.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'exercice."
    ],
    steps: [
      "Consultez les soldes totaux et les coordonnées bancaires (IBAN/BIC) de l'association.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'exercice."
    ]
  },
  cotisations: {
    titre: "💳 Gestion des Cotisations Adhérents",
    title: "💳 Gestion des Cotisations Adhérents",
    description: "Suivez les règlements d'adhésion annuelle, configurez les formules tarifaires et organisez les relances.",
    etapes: [
      "Configurez les formules d'adhésion et tarifs annuels applicables aux membres.",
      "Filtrez la liste des adhérents pour repérer les règlements en attente ou partiels.",
      "Enregistrez les paiements perçus et émettez les reçus de cotisation."
    ],
    steps: [
      "Configurez les formules d'adhésion et tarifs annuels applicables aux membres.",
      "Filtrez la liste des adhérents pour repérer les règlements en attente ou partiels.",
      "Enregistrez les paiements perçus et émettez les reçus de cotisation."
    ]
  },
  'events-finances': {
    titre: "🎟️ Comptabilité Analytique des Prestations",
    title: "🎟️ Comptabilité Analytique des Prestations",
    description: "Suivi budgétaire dédié aux concerts, stages et événements pour calculer leur rentabilité nette.",
    etapes: [
      "Sélectionnez la prestation ou l'événement concerné dans la liste.",
      "Associez les contrats, devis signés, factures d'engagement et billetterie.",
      "Validez le bilan financier de la prestation une fois clôturée."
    ],
    steps: [
      "Sélectionnez la prestation ou l'événement concerné dans la liste.",
      "Associez les contrats, devis signés, factures d'engagement et billetterie.",
      "Validez le bilan financier de la prestation une fois clôturée."
    ]
  },
  'operations-diverses': {
    titre: "📝 Journal des Opérations Courantes",
    title: "📝 Journal des Opérations Courantes",
    description: "Saisie au fil de l'eau des entrées et sorties d'argent liées au fonctionnement de la troupe.",
    etapes: [
      "Cliquez sur « Nouvelle Opération » pour saisir une recette ou une dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse, reçu)."
    ],
    steps: [
      "Cliquez sur « Nouvelle Opération » pour saisir une recette ou une dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse, reçu)."
    ]
  },
  'frais-km': {
    titre: "🚗 Notes de Frais & Kilométrage",
    title: "🚗 Notes de Frais & Kilométrage",
    description: "Validation des déclarations de frais de déplacement et abandons de frais au titre du bénévolat.",
    etapes: [
      "Examinez les déclarations de trajet soumises par les adhérents.",
      "Vérifiez le barème kilométrique officiel et les justificatifs de péage.",
      "Approuvez pour virement bancaire ou comptabilisez en don bénévole."
    ],
    steps: [
      "Examinez les déclarations de trajet soumises par les adhérents.",
      "Vérifiez le barème kilométrique officiel et les justificatifs de péage.",
      "Approuvez pour virement bancaire ou comptabilisez en don bénévole."
    ]
  },
  'reports-exports': {
    titre: "📈 Rapports Comptables & Exports AG",
    title: "📈 Rapports Comptables & Exports AG",
    description: "Génération des états comptables synthétiques requis pour l'Assemblée Générale et les partenaires.",
    etapes: [
      "Sélectionnez l'exercice comptable à clôturer ou analyser.",
      "Générez le compte de résultat et le bilan financier officiel.",
      "Exportez les données au format PDF ou CSV pour le bureau et la banque."
    ],
    steps: [
      "Sélectionnez l'exercice comptable à clôturer ou analyser.",
      "Générez le compte de résultat et le bilan financier officiel.",
      "Exportez les données au format PDF ou CSV pour le bureau et la banque."
    ]
  },

  // ==========================================
  // 2. PÔLE SECRÉTARIAT & ADMINISTRATION
  // ==========================================
  secretariat: {
    titre: "🏛️ Pôle Secrétariat & Administration",
    title: "🏛️ Pôle Secrétariat & Administration",
    description: "Centre névralgique de la vie associative, de la gestion des membres, du registre des dates et des obligations légales.",
    etapes: [
      "Gérer l'annuaire des membres et les pièces justificatives.",
      "Tenir le registre des dates et convoquer la troupe.",
      "Organiser les assemblées générales et éditer les bilans d'activité."
    ],
    steps: [
      "Gérer l'annuaire des membres et les pièces justificatives.",
      "Tenir le registre des dates et convoquer la troupe.",
      "Organiser les assemblées générales et éditer les bilans d'activité."
    ]
  },
  'export-annu': {
    titre: "📄 Annuaire Adhérents & Exports Administratifs",
    title: "📄 Annuaire Adhérents & Exports Administratifs",
    description: "Fichier central des fiches membres avec outils d'exportation pour l'administration et la préfecture.",
    etapes: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et statuts d'adhésion.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités administratives."
    ],
    steps: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et statuts d'adhésion.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités administratives."
    ]
  },
  'studio-events': {
    titre: "📅 Registre des Dates & Convocations",
    title: "📅 Registre des Dates & Convocations",
    description: "Planification globale des répétitions, concerts, stages et suivi des convocations.",
    etapes: [
      "Programmez un nouvel événement avec lieu, horaires et consignes d'organisation.",
      "Supervisez le pointage des présences et inscriptions des membres.",
      "Envoyez les rappels de convocation et notifications à la troupe."
    ],
    steps: [
      "Programmez un nouvel événement avec lieu, horaires et consignes d'organisation.",
      "Supervisez le pointage des présences et inscriptions des membres.",
      "Envoyez les rappels de convocation et notifications à la troupe."
    ]
  },
  'reunion-manager': {
    titre: "📋 Gestion des Réunions & Compte-Rendus",
    title: "📋 Gestion des Réunions & Compte-Rendus",
    description: "Ordres du jour, prise de notes en séance et archivage des procès-verbaux de Conseil et d'AG.",
    etapes: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes en direct.",
      "Publiez le procès-verbal officiel validé à destination des administrateurs."
    ],
    steps: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes en direct.",
      "Publiez le procès-verbal officiel validé à destination des administrateurs."
    ]
  },
  'varal-secretariat': {
    titre: "🗂️ Varal Secrétariat & Documents Officiels",
    title: "🗂️ Varal Secrétariat & Documents Officiels",
    description: "Archives administratives, statuts déclarés, récépissés de préfecture et comptes-rendus d'assemblée générale.",
    etapes: [
      "Conservez les statuts officiels et les déclarations administratives de l'association.",
      "Classez les procès-verbaux de réunions et d'assemblées générales annuelles.",
      "Mettez à disposition les documents types et formulaires administratifs pour le bureau."
    ],
    steps: [
      "Conservez les statuts officiels et les déclarations administratives de l'association.",
      "Classez les procès-verbaux de réunions et d'assemblées générales annuelles.",
      "Mettez à disposition les documents types et formulaires administratifs pour le bureau."
    ]
  },
  'mestre-forum-channels': {
    titre: "📢 Administration des Salons Porte-voix",
    title: "📢 Administration des Salons Porte-voix",
    description: "Gestion des canaux de discussion thématiques et modération des espaces d'échange.",
    etapes: [
      "Créez de nouveaux salons par pupitre ou projet associatif spécial.",
      "Modérez les échanges et veillez au respect de la charte du groupe.",
      "Épinglez les annonces prioritaires en tête de discussion."
    ],
    steps: [
      "Créez de nouveaux salons par pupitre ou projet associatif spécial.",
      "Modérez les échanges et veillez au respect de la charte du groupe.",
      "Épinglez les annonces prioritaires en tête de discussion."
    ]
  },
  'activity-reports': {
    titre: "📊 Rapports d'Activité & Statistiques",
    title: "📊 Rapports d'Activité & Statistiques",
    description: "Analyse quantitative des heures de pratique, taux de présence et bilans de saison.",
    etapes: [
      "Visualisez les statistiques de présence et le volume d'heures de pratique.",
      "Générez les indicateurs chiffrés requis pour les dossiers de subvention.",
      "Compilez le rapport d'activité annuel pour l'Assemblée Générale."
    ],
    steps: [
      "Visualisez les statistiques de présence et le volume d'heures de pratique.",
      "Générez les indicateurs chiffrés requis pour les dossiers de subvention.",
      "Compilez le rapport d'activité annuel pour l'Assemblée Générale."
    ]
  },
  'secretariat-reports': {
    titre: "📊 Rapports & Bilan d'Assemblée Générale",
    title: "📊 Rapports & Bilan d'Assemblée Générale",
    description: "Consolidation des indicateurs de la saison (adhérents, pupitres, sorties, ateliers, finances) pour l'AG et les dossiers de subvention.",
    etapes: [
      "Sélectionnez la saison de référence ou définissez les dates libres d'analyse.",
      "Consultez les 4 blocs consolidés (Vie associative, Scène, Ateliers, Finances).",
      "Exportez la synthèse au format CSV tableur ou imprimez le rapport officiel."
    ],
    targets: [
      "reports-period-selector",
      "reports-blocks-grid",
      "reports-export-actions"
    ],
    steps: [
      "Sélectionnez la saison de référence ou définissez les dates libres d'analyse.",
      "Consultez les 4 blocs consolidés (Vie associative, Scène, Ateliers, Finances).",
      "Exportez la synthèse au format CSV tableur ou imprimez le rapport officiel."
    ]
  },
  'secretariat-documents': {
    titre: "📋 Chartes, Santé & Droits à l'Image",
    title: "📋 Chartes, Santé & Droits à l'Image",
    description: "Gestion des chartes associatives, consentements RGPD et certificats médicaux obligatoires.",
    etapes: [
      "Téléversez le modèle officiel de droit à l'image et d'aptitude médicale.",
      "Contrôlez la signature des chartes et documents obligatoires par les adhérents.",
      "Garantissez la conformité légale et statutaire de l'association."
    ],
    steps: [
      "Téléversez le modèle officiel de droit à l'image et d'aptitude médicale.",
      "Contrôlez la signature des chartes et documents obligatoires par les adhérents.",
      "Garantissez la conformité légale et statutaire de l'association."
    ]
  },
  'secretariat-lieux': {
    titre: "📍 Lieux, Salles & Types d'Événements",
    title: "📍 Lieux, Salles & Types d'Événements",
    description: "Répertoire des adresses de répétition, consignes d'accès, clés et catégories d'agenda.",
    etapes: [
      "Enregistrez les salles avec leurs coordonnées GPS précises et digicodes.",
      "Indiquez les consignes d'accès et les responsables de clés.",
      "Définissez les types d'activités et leurs couleurs associées pour l'agenda."
    ],
    steps: [
      "Enregistrez les salles avec leurs coordonnées GPS précises et digicodes.",
      "Indiquez les consignes d'accès et les responsables de clés.",
      "Définissez les types d'activités et leurs couleurs associées pour l'agenda."
    ]
  },

  // ==========================================
  // 3. PÔLE LOGISTIQUE & MATÉRIEL
  // ==========================================
  logistique: {
    titre: "📦 Pôle Logistique & Matériel",
    title: "📦 Pôle Logistique & Matériel",
    description: "Gestion du parc d'instruments, contrôle des prêts, composition des kits de pupitre et covoiturage.",
    etapes: [
      "Cataloguez et suivez l'état du matériel dans l'inventaire général.",
      "Configurez les pupitres, les kits d'accessoires et les convois de covoiturage.",
      "Centralisez les commandes d'achat et le suivi des approvisionnements."
    ],
    steps: [
      "Cataloguez et suivez l'état du matériel dans l'inventaire général.",
      "Configurez les pupitres, les kits d'accessoires et les convois de covoiturage.",
      "Centralisez les commandes d'achat et le suivi des approvisionnements."
    ]
  },
  inventory: {
    titre: "🛠️ Inventaire Général du Parc Matériel",
    title: "🛠️ Inventaire Général du Parc Matériel",
    description: "Registre exhaustif des instruments, housses, pieds et accessoires appartenant à l'association.",
    etapes: [
      "Consultez l'état matériel de chaque équipement (En service, Maintenance, HS).",
      "Affectez un instrument à un adhérent ou à un lieu de stockage.",
      "Renseignez les numéros de série et photographies d'identification."
    ],
    steps: [
      "Consultez l'état matériel de chaque équipement (En service, Maintenance, HS).",
      "Affectez un instrument à un adhérent ou à un lieu de stockage.",
      "Renseignez les numéros de série et photographies d'identification."
    ]
  },
  'logistics-pupitres': {
    titre: "🥁 Référentiel des Pupitres & Instruments",
    title: "🥁 Référentiel des Pupitres & Instruments",
    description: "Nomenclature musicale des pupitres et types d'instruments exploités par la troupe.",
    etapes: [
      "Consultez la liste des pupitres actifs et leurs attributions de couleurs.",
      "Définissez les types d'instruments associés à chaque pupitre.",
      "Harmonisez la terminologie musicale avec le séquenceur et les partitions."
    ],
    steps: [
      "Consultez la liste des pupitres actifs et leurs attributions de couleurs.",
      "Définissez les types d'instruments associés à chaque pupitre.",
      "Harmonisez la terminologie musicale avec le séquenceur et les partitions."
    ]
  },
  'logistics-kits': {
    titre: "🎒 Composition des Kits d'Accessoires",
    title: "🎒 Composition des Kits d'Accessoires",
    description: "Configuration des paquetages d'accessoires (housses, sangles, baguettes) indissociables des instruments.",
    etapes: [
      "Définissez les fournitures requises pour le kit de chaque pupitre.",
      "Liez les consommables nécessaires depuis le stock de fournitures.",
      "Vérifiez la complétion des paquetages avant attribution aux membres."
    ],
    steps: [
      "Définissez les fournitures requises pour le kit de chaque pupitre.",
      "Liez les consommables nécessaires depuis le stock de fournitures.",
      "Vérifiez la complétion des paquetages avant attribution aux membres."
    ]
  },
  'logistics-carpool': {
    titre: "🚗 Covoiturage, Convois & Véhicules",
    title: "🚗 Covoiturage, Convois & Véhicules",
    description: "Organisation des déplacements, gestion des véhicules transporteurs, capacités de coffre et frais de route.",
    etapes: [
      "Déclarez les véhicules disponibles et leur capacité d'emport d'instruments.",
      "Organisez les convois pour acheminer le matériel lors des concerts.",
      "Contrôlez les demandes de remboursement et l'application du barème kilométrique."
    ],
    steps: [
      "Déclarez les véhicules disponibles et leur capacité d'emport d'instruments.",
      "Organisez les convois pour acheminer le matériel lors des concerts.",
      "Contrôlez les demandes de remboursement et l'application du barème kilométrique."
    ]
  },
  orders: {
    titre: "🛒 Commandes & Achats Matériel",
    title: "🛒 Commandes & Achats Matériel",
    description: "Centralisation des demandes d'achat et suivi des livraisons de consommables auprès des fournisseurs.",
    etapes: [
      "Créez une nouvelle demande d'approvisionnement matériel.",
      "Suivez les devis et la validation budgétaire par le bureau.",
      "Validez la réception à la livraison pour incrémenter le stock."
    ],
    steps: [
      "Créez une nouvelle demande d'approvisionnement matériel.",
      "Suivez les devis et la validation budgétaire par le bureau.",
      "Validez la réception à la livraison pour incrémenter le stock."
    ]
  },

  // ==========================================
  // 4. PÔLE LUTHERIE & ARTISANAT INSTRUMENTAL
  // ==========================================
  lutherie: {
    titre: "🎻 Pôle Lutherie & Artisanat Instrumental",
    title: "🎻 Pôle Lutherie & Artisanat Instrumental",
    description: "Atelier de fabrication, de maintenance et de traçabilité du parc d'instruments de l'association.",
    etapes: [
      "Consulter les modèles et plans de fabrication.",
      "Usiner les pièces détachées et renseigner les fiches suiveuses.",
      "Assembler les instruments sur l'établi et procéder au baptême."
    ],
    steps: [
      "Consulter les modèles et plans de fabrication.",
      "Usiner les pièces détachées et renseigner les fiches suiveuses.",
      "Assembler les instruments sur l'établi et procéder au baptême."
    ]
  },
  'inventory-projects': {
    titre: "🔨 Établi d'assemblage & Chantiers",
    title: "🔨 Établi d'assemblage & Chantiers",
    description: "Suivi en direct du montage des instruments à partir des pièces usinées.",
    etapes: [
      "Ouvrir un nouveau conteneur d'assemblage selon un modèle.",
      "Assigner les pièces détachées requises disponibles en stock.",
      "Contrôler la complétion et baptiser l'instrument pour l'intégrer au parc actif."
    ],
    targets: [
      "lutherie-new-project-btn",
      "lutherie-project-slots",
      "lutherie-finalize-btn"
    ],
    steps: [
      "Ouvrir un nouveau conteneur d'assemblage selon un modèle.",
      "Assigner les pièces détachées requises disponibles en stock.",
      "Contrôler la complétion et baptiser l'instrument pour l'intégrer au parc actif."
    ]
  },
  'instrument-models': {
    titre: "📐 Modèles & Plans de fabrication",
    title: "📐 Modèles & Plans de fabrication",
    description: "Référentiel technique définissant la nomenclature des pièces, les étapes d'usinage et les tutoriels associés.",
    etapes: [
      "Consulter les plans d'assemblage des pupitres.",
      "Configurer les nomenclatures de pièces nécessaires.",
      "Exporter ou importer des bundles complets d'instruments."
    ],
    targets: [
      "lutherie-models-grid",
      "lutherie-model-blueprint",
      "lutherie-models-grid"
    ],
    steps: [
      "Consulter les plans d'assemblage des pupitres.",
      "Configurer les nomenclatures de pièces nécessaires.",
      "Exporter ou importer des bundles complets d'instruments."
    ]
  },
  'inventory-parts': {
    titre: "⚙️ Stock des Pièces détachées",
    title: "⚙️ Stock des Pièces détachées",
    description: "Traçabilité unitaire des éléments constitutifs (fûts, cerclages, peaux) en cours d'usinage ou disponibles.",
    etapes: [
      "Enregistrer une nouvelle pièce brute en stock.",
      "Suivre les étapes d'usinage et solliciter la validation d'atelier.",
      "Affecter les pièces terminées aux chantiers d'assemblage."
    ],
    targets: [
      "lutherie-new-part-btn",
      "lutherie-parts-table",
      "lutherie-parts-filters"
    ],
    steps: [
      "Enregistrer une nouvelle pièce brute en stock.",
      "Suivre les étapes d'usinage et solliciter la validation d'atelier.",
      "Affecter les pièces terminées aux chantiers d'assemblage."
    ]
  },
  'inventory-supplies': {
    titre: "🪵 Matières premières & Consommables",
    title: "🪵 Matières premières & Consommables",
    description: "Gestion au métrage, au poids ou au volume des fournitures brutes d'atelier.",
    etapes: [
      "Surveiller les niveaux de stock par seuil critique.",
      "Ajuster les quantités disponibles après chaque séance d'atelier.",
      "Déclencher une demande d'achat groupé en cas de besoin."
    ],
    steps: [
      "Surveiller les niveaux de stock par seuil critique.",
      "Ajuster les quantités disponibles après chaque séance d'atelier.",
      "Déclencher une demande d'achat groupé en cas de besoin."
    ]
  },
  'workshop-tools': {
    titre: "🧰 Parc d'Outillage d'Atelier",
    title: "🧰 Parc d'Outillage d'Atelier",
    description: "Inventaire des machines et outils, avec distinction entre outillage résident et équipement mobile.",
    etapes: [
      "Inventorier les machines et outils manuels.",
      "Indiquer si l'outil réside au local ou peut voyager en mallette.",
      "Suivre l'état d'usure et planifier l'entretien de l'outillage."
    ],
    steps: [
      "Inventorier les machines et outils manuels.",
      "Indiquer si l'outil réside au local ou peut voyager en mallette.",
      "Suivre l'état d'usure et planifier l'entretien de l'outillage."
    ]
  },
  'varal-lutherie': {
    titre: "📜 Varal Lutherie & Fiches Techniques",
    title: "📜 Varal Lutherie & Fiches Techniques",
    description: "Bibliothèque des tutoriels de fabrication, guides pas-à-pas et consignes d'atelier.",
    etapes: [
      "Consulter les guides illustrés par composant.",
      "Vérifier la liste des outils et matières requis par étape.",
      "Réviser les techniques via les QCM d'atelier."
    ],
    steps: [
      "Consulter les guides illustrés par composant.",
      "Vérifier la liste des outils et matières requis par étape.",
      "Réviser les techniques via les QCM d'atelier."
    ]
  },

  // ==========================================
  // 5. PÔLE COSTUMERIE & ARTISANAT TEXTILE
  // ==========================================
  costumerie: {
    titre: "🥻 Pôle Costumerie & Artisanat Textile",
    title: "🥻 Pôle Costumerie & Artisanat Textile",
    description: "Atelier de confection vestimentaire, gestion des tenues officielles, métrages de tissus et mensurations.",
    etapes: [
      "Définir les modèles officiels et les fiches de patronage.",
      "Suivre les chantiers de confection en cours sur l'établi.",
      "Gérer l'inventaire physique des costumes et les affectations aux danseurs/musiciens."
    ],
    steps: [
      "Définir les modèles officiels et les fiches de patronage.",
      "Suivre les chantiers de confection en cours sur l'établi.",
      "Gérer l'inventaire physique des costumes et les affectations aux danseurs/musiciens."
    ]
  },
  'wardrobe-projects': {
    titre: "🪡 Établi de Confection & Chantiers",
    title: "🪡 Établi de Confection & Chantiers",
    description: "Organisation de la confection sur mesure et du suivi d'avancement des pièces textiles.",
    etapes: [
      "Lister les projets de confection en cours (patrons, métrages de tissus).",
      "Affecter les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivre l'avancement des pièces jusqu'à l'intégration au vestiaire physique."
    ],
    targets: [
      "costumerie-new-project-btn",
      "costumerie-projects-grid",
      "costumerie-project-steps"
    ],
    steps: [
      "Lister les projets de confection en cours (patrons, métrages de tissus).",
      "Affecter les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivre l'avancement des pièces jusqu'à l'intégration au vestiaire physique."
    ]
  },
  'wardrobe-models': {
    titre: "🎨 Modèles de Costumes & Patrons",
    title: "🎨 Modèles de Costumes & Patrons",
    description: "Bibliothèque des tenues de scène avec découpage en pièces obligatoires et accessoires optionnels.",
    etapes: [
      "Définir les tenues officielles par pupitre et événement.",
      "Associer les fiches de patronage et métrages de tissu nécessaires.",
      "Consulter les fiches techniques de coupe et d'assemblage."
    ],
    targets: [
      "costumerie-models-cards",
      "costumerie-models-cards",
      "costumerie-models-cards"
    ],
    steps: [
      "Définir les tenues officielles par pupitre et événement.",
      "Associer les fiches de patronage et métrages de tissu nécessaires.",
      "Consulter les fiches techniques de coupe et d'assemblage."
    ]
  },
  'wardrobe-pieces': {
    titre: "👗 Vestiaire Physique & Tenues",
    title: "👗 Vestiaire Physique & Tenues",
    description: "Catalogue des tenues confectionnées, suivi des attributions et de l'état des vêtements de la troupe.",
    etapes: [
      "Vérifier la disponibilité des tenues par taille et type de costume.",
      "Assigner les éléments de costumes aux membres pour les prestations.",
      "Signaler les besoins de nettoyage ou de réparation."
    ],
    targets: [
      "costumerie-pieces-table",
      "costumerie-pieces-assign",
      "costumerie-pieces-table"
    ],
    steps: [
      "Vérifier la disponibilité des tenues par taille et type de costume.",
      "Assigner les éléments de costumes aux membres pour les prestations.",
      "Signaler les besoins de nettoyage ou de réparation."
    ]
  },
  'wardrobe-supplies': {
    titre: "🧵 Tissus & Mercerie",
    title: "🧵 Tissus & Mercerie",
    description: "Suivi des rouleaux de tissus, laizes, boutons, fils et élastiques de l'atelier couture.",
    etapes: [
      "Gérer les métrages de tissu en stock selon la laize.",
      "Contrôler les réserves de mercerie avant le lancement d'une série.",
      "Générer les demandes de réassort en commande groupée."
    ],
    steps: [
      "Gérer les métrages de tissu en stock selon la laize.",
      "Contrôler les réserves de mercerie avant le lancement d'une série.",
      "Générer les demandes de réassort en commande groupée."
    ]
  },
  'wardrobe-tools': {
    titre: "✂️ Machines & Matériel de Couture",
    title: "✂️ Machines & Matériel de Couture",
    description: "Parc des machines à coudre, surjeteuses, ciseaux tailleur et tables de repassage.",
    etapes: [
      "Répertorier les machines attribuées ou résidentes au local.",
      "Vérifier la disponibilité du matériel mobile pour les ateliers couture.",
      "Noter les révisions mécaniques et besoins d'aiguilles/fils."
    ],
    steps: [
      "Répertorier les machines attribuées ou résidentes au local.",
      "Vérifier la disponibilité du matériel mobile pour les ateliers couture.",
      "Noter les révisions mécaniques et besoins d'aiguilles/fils."
    ]
  },
  'wardrobe-sizes': {
    titre: "📏 Registre des Mensurations Adhérents",
    title: "📏 Registre des Mensurations Adhérents",
    description: "Fiches individuelles des gabarits et tailles pour l'ajustement optimal des tenues de concert.",
    etapes: [
      "Saisissez les mensurations transmises par les membres.",
      "Comparez les gabarits disponibles avec le stock de costumes.",
      "Anticipez la fabrication de tenues dans les tailles manquantes."
    ],
    steps: [
      "Saisissez les mensurations transmises par les membres.",
      "Comparez les gabarits disponibles avec le stock de costumes.",
      "Anticipez la fabrication de tenues dans les tailles manquantes."
    ]
  },
  'varal-costumerie': {
    titre: "🪡 Varal Costumerie & Tutoriels",
    title: "🪡 Varal Costumerie & Tutoriels",
    description: "Espace documentaire regroupant les patrons PDF, planches de découpe et consignes d'entretien des tenues.",
    etapes: [
      "Consulter les planches de patronage au format PDF.",
      "Suivre les instructions d'assemblage et d'ourlet pas-à-pas.",
      "Télécharger les consignes d'entretien et de lavage."
    ],
    steps: [
      "Consulter les planches de patronage au format PDF.",
      "Suivre les instructions d'assemblage et d'ourlet pas-à-pas.",
      "Télécharger les consignes d'entretien et de lavage."
    ]
  },

  // ==========================================
  // 6. PÔLE DIFFUSION & SPECTACLES
  // ==========================================
  diffusion: {
    titre: "🎷 Pôle Diffusion & Prestations Extérieures",
    title: "🎷 Pôle Diffusion & Prestations Extérieures",
    description: "Prospection des dates de concert, suivi des propositions commerciales et gestion du carnet d'organisateurs.",
    etapes: [
      "Suivez les opportunités de dates sur le tableau Kanban.",
      "Gérez les coordonnées des programmations culturelles et mairies.",
      "Établissez les fiches techniques et conventions de spectacle."
    ],
    steps: [
      "Suivez les opportunités de dates sur le tableau Kanban.",
      "Gérez les coordonnées des programmations culturelles et mairies.",
      "Établissez les fiches techniques et conventions de spectacle."
    ]
  },
  'gigs-pipeline': {
    titre: "📊 Pipeline des Prestations (Kanban)",
    title: "📊 Pipeline des Prestations (Kanban)",
    description: "Suivi visuel et chronologique des dates, du contact initial au concert réalisé.",
    etapes: [
      "Ajoutez les demandes entrantes dans la colonne « Premier contact ».",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocié et l'effectif requis."
    ],
    targets: [
      "gigs-add-button",
      "gigs-kanban-board",
      "gigs-kanban-board"
    ],
    steps: [
      "Ajoutez les demandes entrantes dans la colonne « Premier contact ».",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocié et l'effectif requis."
    ]
  },
  'diffusion-contacts': {
    titre: "📇 Carnet de Contacts CRM Programmation",
    title: "📇 Carnet de Contacts CRM Programmation",
    description: "Base de données relationnelle des organisateurs de festival, services culturels et diffuseurs.",
    etapes: [
      "Enregistrez les coordonnées précises des chargés de programmation.",
      "Consignez les comptes-rendus d'échanges téléphoniques et relances.",
      "Qualifiez les diffuseurs selon leurs périodes de programmation."
    ],
    targets: [
      "contacts-add-button",
      "contacts-filter-bar",
      "contacts-table"
    ],
    steps: [
      "Enregistrez les coordonnées précises des chargés de programmation.",
      "Consignez les comptes-rendus d'échanges téléphoniques et relances.",
      "Qualifiez les diffuseurs selon leurs périodes de programmation."
    ]
  },

  // ==========================================
  // 7. PÔLE STUDIO & COMMUNICATION
  // ==========================================
  studio: {
    titre: "📱 Pôle Studio & Communication",
    title: "📱 Pôle Studio & Communication",
    description: "Création graphique, gestion des réseaux sociaux, diffusion des infolettres et archives photographiques.",
    etapes: [
      "Concevez les visuels promotionnels pour les réseaux sociaux.",
      "Rédigez et diffusez les campagnes de newsletter de la troupe.",
      "Administrez la photothèque officielle des concerts et représentations."
    ],
    steps: [
      "Concevez les visuels promotionnels pour les réseaux sociaux.",
      "Rédigez et diffusez les campagnes de newsletter de la troupe.",
      "Administrez la photothèque officielle des concerts et représentations."
    ]
  },
  'studio-social': {
    titre: "📱 Réseaux Sociaux & Publications",
    title: "📱 Réseaux Sociaux & Publications",
    description: "Préparation et création des visuels et publications pour les réseaux sociaux (Instagram, Facebook).",
    etapes: [
      "Préparez les visuels pour les réseaux sociaux.",
      "Sélectionnez les dates importantes à annoncer.",
      "Générez le contenu prêt à publier."
    ],
    steps: [
      "Préparez les visuels pour les réseaux sociaux.",
      "Sélectionnez les dates importantes à annoncer.",
      "Générez le contenu prêt à publier."
    ]
  },
  newsletter: {
    titre: "📰 Générateur de Newsletter",
    title: "📰 Générateur de Newsletter",
    description: "Générateur de newsletter synthétique. Préparez le contenu des campagnes pour export vers Brevo.",
    etapes: [
      "Rédigez le message d'accueil de la campagne.",
      "Sélectionnez les prochaines dates à annoncer.",
      "Ajoutez les souvenirs et photos des événements passés.",
      "Validez et exportez le JSON pour Brevo."
    ],
    steps: [
      "Rédigez le message d'accueil de la campagne.",
      "Sélectionnez les prochaines dates à annoncer.",
      "Ajoutez les souvenirs et photos des événements passés.",
      "Validez et exportez le JSON pour Brevo."
    ]
  },
  'studio-communication': {
    titre: "✉️ Passerelle Emailing & Paramètres Brevo",
    title: "✉️ Passerelle Emailing & Paramètres Brevo",
    description: "Intégration de l'API Brevo, configuration des expéditeurs e-mails/DNS, et export CSV des abonnés.",
    etapes: [
      "Renseignez la clé API Brevo et l'adresse courriel d'expédition officielle.",
      "Configurez les enregistrements DNS (SPF / DKIM) pour assurer la délivrabilité.",
      "Exportez la liste des abonnés à la newsletter pour vos campagnes externes."
    ],
    steps: [
      "Renseignez la clé API Brevo et l'adresse courriel d'expédition officielle.",
      "Configurez les enregistrements DNS (SPF / DKIM) pour assurer la délivrabilité.",
      "Exportez la liste des abonnés à la newsletter pour vos campagnes externes."
    ]
  },
  'varal-photos': {
    titre: "📸 Passerelle Cloud & Varal Photos",
    title: "📸 Passerelle Cloud & Varal Photos",
    description: "Hub de stockage externe (Framaspace, Drive, Dropbox) : récolte de clichés par QR-Code et publication d'albums sur le Varal.",
    etapes: [
      "Configurez le lien Cloud racine de l'association (Framaspace / Drive) pour un accès direct.",
      "Associez les dossiers de dépôt public aux dates et générez les QR-Codes d'événement.",
      "Liez les albums finalisés pour synchroniser automatiquement les livrets sur le Varal Photos."
    ],
    targets: [
      "studio-cloud-root",
      "studio-events-media-table",
      "studio-varal-photos-rope"
    ],
    steps: [
      "Configurez le lien Cloud racine de l'association (Framaspace / Drive) pour un accès direct.",
      "Associez les dossiers de dépôt public aux dates et générez les QR-Codes d'événement.",
      "Liez les albums finalisés pour synchroniser automatiquement les livrets sur le Varal Photos."
    ]
  },

  // ==========================================
  // 8. PÔLE PÉDAGOGIE & TRANSMISSION
  // ==========================================
  pedagogie: {
    titre: "🎓 Pôle Pédagogie",
    title: "🎓 Pôle Pédagogie",
    description: "Pilotez le suivi pédagogique des adhérents, créez des ressources d'apprentissage et suivez leur progression.",
    etapes: [
      "Gérez la bibliothèque de ressources et les partitions interactives.",
      "Créez des QCM et quiz d'évaluation pour valider les acquis.",
      "Analysez les statistiques d'apprentissage de chaque membre."
    ],
    steps: [
      "Gérez la bibliothèque de ressources et les partitions interactives.",
      "Créez des QCM et quiz d'évaluation pour valider les acquis.",
      "Analysez les statistiques d'apprentissage de chaque membre."
    ]
  },
  'varal-manager': {
    titre: "📌 Varal Pédagogique & Partitions",
    title: "📌 Varal Pédagogique & Partitions",
    description: "Partitions musicales, livrets de Cordel, relevés de baque et supports audio d'apprentissage.",
    etapes: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les audios de travail et grilles rythmiques avec les membres.",
      "Administrez les fiches de chants et ressources téléchargeables."
    ],
    steps: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les audios de travail et grilles rythmiques avec les membres.",
      "Administrez les fiches de chants et ressources téléchargeables."
    ]
  },
  'mestre-pedagogy-qcm': {
    titre: "📝 Configuration des QCM & Quiz",
    title: "📝 Configuration des QCM & Quiz",
    description: "Créez et organisez les questionnaires d'évaluation théorique et culturelle.",
    etapes: [
      "Rédigez les questions et paramétrez les réponses correctes.",
      "Définissez le niveau de difficulté et l'instrument ciblé.",
      "Publiez le QCM pour le rendre accessible dans l'espace membre."
    ],
    steps: [
      "Rédigez les questions et paramétrez les réponses correctes.",
      "Définissez le niveau de difficulté et l'instrument ciblé.",
      "Publiez le QCM pour le rendre accessible dans l'espace membre."
    ]
  },
  'mestre-pedagogy-dashboard': {
    titre: "📊 Suivi et Analyse Pédagogique",
    title: "📊 Suivi et Analyse Pédagogique",
    description: "Supervisez la progression globale de la troupe et identifiez les notions à revoir en répétition.",
    etapes: [
      "Consultez les scores moyens par quiz et par pupitre.",
      "Identifiez les questions les plus fréquemment ratées.",
      "Adaptez vos ateliers et répétitions en fonction des résultats."
    ],
    steps: [
      "Consultez les scores moyens par quiz et par pupitre.",
      "Identifiez les questions les plus fréquemment ratées.",
      "Adaptez vos ateliers et répétitions en fonction des résultats."
    ]
  },

  // ==========================================
  // 9. PÔLE MESTRIA (DIRECTION ARTISTIQUE)
  // ==========================================
  mestre: {
    titre: "🎭 Pôle Mestria & Direction Artistique",
    title: "🎭 Pôle Mestria & Direction Artistique",
    description: "Espace de pilotage musical : castings par morceau, arrangements rythmiques, plans de scène et directives artistiques.",
    etapes: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et communiquez les consignes musicales."
    ],
    steps: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et communiquez les consignes musicales."
    ]
  },
  'mestre-orientation': {
    titre: "🎯 Orientation & Casting des Pupitres",
    title: "🎯 Orientation & Casting des Pupitres",
    description: "Gestion des équilibres de pupitres, validation des souhaits d'évolution et affectation des instruments.",
    etapes: [
      "Vérifiez l'équilibre et les quotas par pupitre via les jauges d'effectifs.",
      "Consultez la table des vœux et souhaits d'orientation des adhérents.",
      "Validez les affectations et attribuez les instruments pour la saison."
    ],
    targets: [
      "mestre-orientation-gauges",
      "mestre-orientation-table",
      "mestre-orientation-assignment"
    ],
    steps: [
      "Vérifiez l'équilibre et les quotas par pupitre via les jauges d'effectifs.",
      "Consultez la table des vœux et souhaits d'orientation des adhérents.",
      "Validez les affectations et attribuez les instruments pour la saison."
    ]
  },
  'mestre-events': {
    titre: "🎵 Conduite Artistique des Prestations",
    title: "🎵 Conduite Artistique des Prestations",
    description: "Supervision des baques joués, ordres de passage et consignes artistiques de concert.",
    etapes: [
      "Sélectionnez la date de spectacle dans l'agenda de la Mestria.",
      "Fixez la liste des baques joués et la séquence des morceaux.",
      "Renseignez les consignes de costume et d'instrumentation."
    ],
    steps: [
      "Sélectionnez la date de spectacle dans l'agenda de la Mestria.",
      "Fixez la liste des baques joués et la séquence des morceaux.",
      "Renseignez les consignes de costume et d'instrumentation."
    ]
  },
  'mestre-stage-layout': {
    titre: "📐 Disposition Scénique & Placement",
    title: "📐 Disposition Scénique & Placement",
    description: "Conception visuelle de l'implantation des pupitres sur les différents plateaux de spectacle.",
    etapes: [
      "Positionnez les pupitres et musiciens sur la grille scénique.",
      "Mobilisez et placez les musiciens présents depuis le roster latéral.",
      "Ajustez les dimensions de la scène et validez la configuration."
    ],
    targets: [
      "mestre-stage-grid",
      "mestre-stage-roster",
      "mestre-stage-grid"
    ],
    steps: [
      "Positionnez les pupitres et musiciens sur la grille scénique.",
      "Mobilisez et placez les musiciens présents depuis le roster latéral.",
      "Ajustez les dimensions de la scène et validez la configuration."
    ]
  },
  'mestre-categories': {
    titre: "🏷️ Catégories & Niveaux de Pratique",
    title: "🏷️ Catégories & Niveaux de Pratique",
    description: "Configuration des sections de pratique, niveaux et sous-groupes de la troupe (danse, percussions, ateliers débutants ou avancés).",
    etapes: [
      "Ajoutez une nouvelle section ou un niveau de pratique avec son code couleur.",
      "Consultez et ajustez la liste des catégories actives pour les convocations.",
      "Synchronisez les profils membres si nécessaire pour aligner les anciens libellés."
    ],
    steps: [
      "Ajoutez une nouvelle section ou un niveau de pratique avec son code couleur.",
      "Consultez et ajustez la liste des catégories actives pour les convocations.",
      "Synchronisez les profils membres si nécessaire pour aligner les anciens libellés."
    ]
  },
  'mestre-sequenceur': {
    titre: "🎧 Séquenceur Rythmique Pédagogique",
    title: "🎧 Séquenceur Rythmique Pédagogique",
    description: "Outil interactif de décomposition des baques, breaks, viradas et appels de maracatu.",
    etapes: [
      "Sélectionnez le morceau ou la séquence dans le catalogue audio et JSON.",
      "Configurez les métadonnées métronomiques et consignes de pupitres.",
      "Lancez le séquenceur comme support interactif d'entraînement."
    ],
    targets: [
      "mestre-sequenceur-list",
      "mestre-sequenceur-metadata",
      "mestre-sequenceur-list"
    ],
    steps: [
      "Sélectionnez le morceau ou la séquence dans le catalogue audio et JSON.",
      "Configurez les métadonnées métronomiques et consignes de pupitres.",
      "Lancez le séquenceur comme support interactif d'entraînement."
    ]
  },
  'mestre-mot-mestre': {
    titre: "📣 Directives & Annonces de la Mestria",
    title: "📣 Directives & Annonces de la Mestria",
    description: "Canal direct d'annonces de la direction artistique vers l'ensemble des musiciens.",
    etapes: [
      "Rédigez un mot d'orientation artistique ou un rappel de consigne.",
      "Notifiez la troupe sur les points d'effort rythmiques prioritaires.",
      "Consultez les archives des consignes de la direction artistique."
    ],
    steps: [
      "Rédigez un mot d'orientation artistique ou un rappel de consigne.",
      "Notifiez la troupe sur les points d'effort rythmiques prioritaires.",
      "Consultez les archives des consignes de la direction artistique."
    ]
  },

  // ==========================================
  // 10. PÔLE VITRINE PUBLIQUE
  // ==========================================
  vitrine: {
    titre: "🌐 Pôle Vitrine Publique & Communication",
    title: "🌐 Pôle Vitrine Publique & Communication",
    description: "Administration du site web public, des contenus de présentation, médias et référencement SEO.",
    etapes: [
      "Mettez à jour les textes de présentation et la biographie.",
      "Enrichissez la galerie photo/vidéo des prestations publiques.",
      "Ajustez les éléments de référencement pour Google."
    ],
    steps: [
      "Mettez à jour les textes de présentation et la biographie.",
      "Enrichissez la galerie photo/vidéo des prestations publiques.",
      "Ajustez les éléments de référencement pour Google."
    ]
  },
  'vitrine-general': {
    titre: "🌐 Général & Référencement SEO Vitrine",
    title: "🌐 Général & Référencement SEO Vitrine",
    description: "Configuration du titre du site, métadonnées Google et image de partage réseaux sociaux.",
    etapes: [
      "Renseignez le nom public officiel et le résumé d'accroche.",
      "Optimisez les balises méta et mots-clés de recherche.",
      "Vérifiez le visuel de partage Open Graph pour Facebook et WhatsApp."
    ],
    steps: [
      "Renseignez le nom public officiel et le résumé d'accroche.",
      "Optimisez les balises méta et mots-clés de recherche.",
      "Vérifiez le visuel de partage Open Graph pour Facebook et WhatsApp."
    ]
  },
  'vitrine-presentation': {
    titre: "📖 Contenu de Présentation & Historique",
    title: "📖 Contenu de Présentation & Historique",
    description: "Rédaction des pages d'accueil, historique de la roda et esprit de la troupe.",
    etapes: [
      "Rédigez l'histoire et les valeurs véhiculées par l'association.",
      "Présentez la Mestria et les sections rythmiques aux visiteurs.",
      "Soignez la mise en page des textes d'accueil."
    ],
    steps: [
      "Rédigez l'histoire et les valeurs véhiculées par l'association.",
      "Présentez la Mestria et les sections rythmiques aux visiteurs.",
      "Soignez la mise en page des textes d'accueil."
    ]
  },
  'vitrine-organisateur': {
    titre: "📄 Espace Organisateur & Fiche Technique Publique",
    title: "📄 Espace Organisateur & Fiche Technique Publique",
    description: "Documents téléchargeables et informations pratiques réservés aux diffuseurs culturels.",
    etapes: [
      "Mettez à jour le dossier de presse et la fiche technique en PDF.",
      "Indiquez les jauges modulables et conditions de déplacement.",
      "Insérez les boutons de contact direct pour les demandes de devis."
    ],
    steps: [
      "Mettez à jour le dossier de presse et la fiche technique en PDF.",
      "Indiquez les jauges modulables et conditions de déplacement.",
      "Insérez les boutons de contact direct pour les demandes de devis."
    ]
  },
  'vitrine-galerie': {
    titre: "📸 Galerie Photo & Vidéos de Concert",
    title: "📸 Galerie Photo & Vidéos de Concert",
    description: "Médiathèque des plus belles prises de vue des défilés et spectacles du groupe.",
    etapes: [
      "Téléversez des photos haute définition des concerts récents.",
      "Ajoutez les liens des vidéos intégrées depuis YouTube/Vimeo.",
      "Organisez les clichés par catégories d'événements."
    ],
    steps: [
      "Téléversez des photos haute définition des concerts récents.",
      "Ajoutez les liens des vidéos intégrées depuis YouTube/Vimeo.",
      "Organisez les clichés par catégories d'événements."
    ]
  },
  'vitrine-recrutement': {
    titre: "🤝 Informations Recrutement & Portes Ouvertes",
    title: "🤝 Informations Recrutement & Portes Ouvertes",
    description: "Espace d'accueil des futurs pratiquants avec dates de reprise et inscriptions.",
    etapes: [
      "Rédigez l'annonce de recrutement et les conditions d'accès.",
      "Indiquez les lieux, jours et horaires des répétitions débutants.",
      "Activez le formulaire de demande d'essai en ligne."
    ],
    steps: [
      "Rédigez l'annonce de recrutement et les conditions d'accès.",
      "Indiquez les lieux, jours et horaires des répétitions débutants.",
      "Activez le formulaire de demande d'essai en ligne."
    ]
  },
  'vitrine-reseaux': {
    titre: "📲 Réseaux Sociaux & Newsletter Publique",
    title: "📲 Réseaux Sociaux & Newsletter Publique",
    description: "Liens de redirection vers les profils officiels et module d'abonnement infolettre.",
    etapes: [
      "Saisissez les liens vers Instagram, Facebook et YouTube.",
      "Configurez le widget de collecte d'emails pour la newsletter.",
      "Testez les liens de redirection vers les plateformes sociales."
    ],
    steps: [
      "Saisissez les liens vers Instagram, Facebook et YouTube.",
      "Configurez le widget de collecte d'emails pour la newsletter.",
      "Testez les liens de redirection vers les plateformes sociales."
    ]
  },
  'vitrine-apparence': {
    titre: "🎨 Thème Visuel de la Vitrine Publique",
    title: "🎨 Thème Visuel de la Vitrine Publique",
    description: "Personnalisation des couleurs, polices et habillages graphiques du site vitrine.",
    etapes: [
      "Sélectionnez la palette de couleurs officielle de l'association.",
      "Prévisualisez le rendu visuel sur ordinateur et smartphone.",
      "Enregistrez les modifications d'apparence pour le site public."
    ],
    steps: [
      "Sélectionnez la palette de couleurs officielle de l'association.",
      "Prévisualisez le rendu visuel sur ordinateur et smartphone.",
      "Enregistrez les modifications d'apparence pour le site public."
    ]
  },

  // ==========================================
  // 11. PÔLE CONFIGURATION DU SYSTÈME
  // ==========================================
  config: {
    titre: "⚙️ Pôle Configuration du Système",
    title: "⚙️ Pôle Configuration du Système",
    description: "Paramètres administratifs : identité légale, interrupteurs des modules, sécurité et profils.",
    etapes: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les options de profil."
    ],
    steps: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les options de profil."
    ]
  },
  'config-identity': {
    titre: "🏛️ Identité Juridique & Composition du Bureau",
    title: "🏛️ Identité Juridique & Composition du Bureau",
    description: "Saisie des données administratives officielles (RNA, SIRET, siège social) et membres du Bureau.",
    etapes: [
      "Renseignez le nom légal, l'adresse officielle et la préfecture de rattachement.",
      "Déclarez la Présidence, Trésorerie, Secrétariat et Direction Artistique.",
      "Téléversez le logo haute définition et les signatures officielles."
    ],
    steps: [
      "Renseignez le nom légal, l'adresse officielle et la préfecture de rattachement.",
      "Déclarez la Présidence, Trésorerie, Secrétariat et Direction Artistique.",
      "Téléversez le logo haute définition et les signatures officielles."
    ]
  },
  'config-profile': {
    titre: "⚙️ Champs du Profil Adhérent",
    title: "⚙️ Champs du Profil Adhérent",
    description: "Création et gestion des champs personnalisés pour les profils membres.",
    etapes: [
      "Créez des champs texte, liste déroulante ou cases à cocher.",
      "Définissez si les champs sont obligatoires à l'inscription.",
      "Réorganisez l'ordre d'affichage des champs dans le profil."
    ],
    steps: [
      "Créez des champs texte, liste déroulante ou cases à cocher.",
      "Définissez si les champs sont obligatoires à l'inscription.",
      "Réorganisez l'ordre d'affichage des champs dans le profil."
    ]
  },
  'config-security': {
    titre: "🔒 Sécurité & Contrôle d'Accès",
    title: "🔒 Sécurité & Contrôle d'Accès",
    description: "Politique de sécurité, contrôle des connexions et gestion du mode passe-partout.",
    etapes: [
      "Supervisez les options d'authentification des utilisateurs.",
      "Activez si nécessaire le mode intervention technique (Break-Glass Mode).",
      "Contrôlez le journal de sécurité des actions administratives."
    ],
    steps: [
      "Supervisez les options d'authentification des utilisateurs.",
      "Activez si nécessaire le mode intervention technique (Break-Glass Mode).",
      "Contrôlez le journal de sécurité des actions administratives."
    ]
  },
  'config-modules': {
    titre: "🧩 Activation des Modules Applicatifs",
    title: "🧩 Activation des Modules Applicatifs",
    description: "Interrupteurs généraux pour afficher ou masquer les pôles selon les besoins du bureau.",
    etapes: [
      "Activez ou désactivez les pôles (Costumerie, Lutherie, Diffusion, Studio...).",
      "Masquez les fonctionnalités inutilisées pour simplifier l'interface.",
      "Enregistrez la grille des modules pour l'ensemble des membres."
    ],
    steps: [
      "Activez ou désactivez les pôles (Costumerie, Lutherie, Diffusion, Studio...).",
      "Masquez les fonctionnalités inutilisées pour simplifier l'interface.",
      "Enregistrez la grille des modules pour l'ensemble des membres."
    ]
  },
  'config-layout': {
    titre: "🎨 Thèmes Visuels & Apparence Cordel",
    title: "🎨 Thèmes Visuels & Apparence Cordel",
    description: "Sélection des palettes graphiques et personnalisation visuelle de la plateforme.",
    etapes: [
      "Basculez entre le thème crème Cordel et le mode sombre.",
      "Ajustez l'affichage des bordures sémantiques et des motifs.",
      "Appliquez le thème par défaut pour l'ensemble du bureau."
    ],
    steps: [
      "Basculez entre le thème crème Cordel et le mode sombre.",
      "Ajustez l'affichage des bordures sémantiques et des motifs.",
      "Appliquez le thème par défaut pour l'ensemble du bureau."
    ]
  }
};

/**
 * Fonction de recherche du guide approprié pour un onglet ou un pôle donné.
 * Priorité accordée à l'onglet spécifique (tabId), avec repli sur le pôle général (poleId).
 * 
 * ⚠️ EXCLUSION DES VUES MEMBRES SIMPLES :
 * Si la clé correspond à un espace membre simple (profil, agenda, materiel, vestiaire membre,
 * trombinoscope, forum public, varal membre), retourne immédiatement null.
 * 
 * @param {string} tabId - Identifiant de l'onglet actif
 * @param {string} poleId - Identifiant du pôle actif
 * @returns {Object|null} Objet guide ou null si exclu / non configuré
 */
export function getPoleGuide(tabId, poleId) {
  // Exclusion stricte si l'onglet ou le pôle fait partie des espaces membres simples
  if ((tabId && EXCLUDED_MEMBER_KEYS.has(tabId)) || (poleId && EXCLUDED_MEMBER_KEYS.has(poleId) && !tabId)) {
    return null;
  }

  if (tabId && POLE_GUIDES[tabId]) {
    return POLE_GUIDES[tabId];
  }
  if (poleId && POLE_GUIDES[poleId] && !EXCLUDED_MEMBER_KEYS.has(poleId)) {
    return POLE_GUIDES[poleId];
  }
  return null;
}
