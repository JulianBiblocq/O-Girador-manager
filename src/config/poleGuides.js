/**
 * Fichier de Configuration Centralisé : poleGuides.js
 * 
 * Contient l'ensemble des guides d'aide contextuelle pour les pôles et onglets d'administration.
 * Guide les membres du bureau (Trésorier, Secrétaire, Mestre, Logistique) dans leurs tâches quotidiennes.
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
    description: "Aperçu global et instantané de la trésorerie, du solde disponible et de la répartition des flux budgétaires.",
    etapes: [
      "Consultez les soldes totaux et les graphiques d'évolution financière.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'association."
    ],
    steps: [
      "Consultez les soldes totaux et les graphiques d'évolution financière.",
      "Identifiez la répartition des postes de recettes et de dépenses principales.",
      "Comparez le réalisé avec le budget prévisionnel de l'association."
    ]
  },
  cotisations: {
    titre: "💳 Gestion des Cotisations Adhérents",
    title: "💳 Gestion des Cotisations Adhérents",
    description: "Suivez les paiements d'adhésion annuelle et organisez les relances des cotisations en attente.",
    etapes: [
      "Filtrez la liste des membres pour repérer les règlements en attente.",
      "Enregistrez les paiements perçus (chèque, virement, espèces, pass).",
      "Émettez les reçus de cotisation et envoyez les rappels automatiques."
    ],
    steps: [
      "Filtrez la liste des membres pour repérer les règlements en attente.",
      "Enregistrez les paiements perçus (chèque, virement, espèces, pass).",
      "Émettez les reçus de cotisation et envoyez les rappels automatiques."
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
      "Cliquez sur 'Nouvelle Opération' pour saisir une recette ou dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse)."
    ],
    steps: [
      "Cliquez sur 'Nouvelle Opération' pour saisir une recette ou dépense.",
      "Sélectionnez le tiers, le mode de paiement et la catégorie comptable.",
      "Attachez le justificatif scanné (facture, ticket de caisse)."
    ]
  },
  'frais-km': {
    titre: "🚗 Notes de Frais & Kilométrage",
    title: "🚗 Notes de Frais & Kilométrage",
    description: "Validation des déclarations de frais de déplacement et abandons de frais par bénévolat.",
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
  // 2. PÔLE SECRÉTARIAT / TROUPE
  // ==========================================
  troupe: {
    titre: "👥 Pôle Secrétariat & Administration Troupe",
    title: "👥 Pôle Secrétariat & Administration Troupe",
    description: "Supervisez le registre officiel des membres, l'attribution des badges et la répartition par pupitres.",
    etapes: [
      "Consultez et complétez l'annuaire complet des adhérents.",
      "Gérez l'attribution des badges de rôle (Bureau, CA, Pupitre).",
      "Équilibrez les effectifs musiciens par section d'instrument."
    ],
    steps: [
      "Consultez et complétez l'annuaire complet des adhérents.",
      "Gérez l'attribution des badges de rôle (Bureau, CA, Pupitre).",
      "Équilibrez les effectifs musiciens par section d'instrument."
    ]
  },
  'export-annu': {
    titre: "📄 Annuaire Adhérents & Exports Administratifs",
    title: "📄 Annuaire Adhérents & Exports Administratifs",
    description: "Fichier central des fiches membres avec outils d'exportation pour l'administration et la préfecture.",
    etapes: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et informations médicales/droit à l'image.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités."
    ],
    steps: [
      "Recherchez ou filtrez les adhérents par statut, rôle ou pupitre.",
      "Mettez à jour les coordonnées de contact et informations médicales/droit à l'image.",
      "Téléchargez l'annuaire au format CSV ou Excel pour les formalités."
    ]
  },
  'tag-manager': {
    titre: "🏷️ Gestion des Badges & Permissions System",
    title: "🏷️ Gestion des Badges & Permissions System",
    description: "Configuration des étiquettes et des permissions d'accès aux modules d'administration de l'outil.",
    etapes: [
      "Créez de nouvelles étiquettes personnalisées pour le groupe.",
      "Assignez ou retirez les badges aux profil des adhérents.",
      "Associez les droits d'accès aux modules pour chaque badge."
    ],
    steps: [
      "Créez de nouvelles étiquettes personnalisées pour le groupe.",
      "Assignez ou retirez les badges aux profil des adhérents.",
      "Associez les droits d'accès aux modules pour chaque badge."
    ]
  },
  instruments: {
    titre: "🥁 Effectifs & Répartition par Pupitre",
    title: "🥁 Effectifs & Répartition par Pupitre",
    description: "Organisation visuelle des musiciens et danseurs par section (Alfaias, Agogôs, Caixas, Abês, Mestre).",
    etapes: [
      "Visualisez l'effectif actuel par instrument principal.",
      "Déclarez les instruments secondaires ou doubles compétences.",
      "Identifiez les besoins d'intégration pour les portes ouvertes."
    ],
    steps: [
      "Visualisez l'effectif actuel par instrument principal.",
      "Déclarez les instruments secondaires ou doubles compétences.",
      "Identifiez les besoins d'intégration pour les portes ouvertes."
    ]
  },

  // ==========================================
  // 3. PÔLE LOGISTIQUE & MATÉRIEL
  // ==========================================
  logistique: {
    titre: "📦 Pôle Logistique & Matériel",
    title: "📦 Pôle Logistique & Matériel",
    description: "Gestion du parc d'instruments, contrôle du matériel prêté et passage des commandes de réapprovisionnement.",
    etapes: [
      "Cataloguez et suivez l'état du matériel dans l'inventaire.",
      "Contrôlez les prêts d'instruments individuels confiés aux membres.",
      "Saisissez les besoins en consommables (peaux, baguettes, mailloches)."
    ],
    steps: [
      "Cataloguez et suivez l'état du matériel dans l'inventaire.",
      "Contrôlez les prêts d'instruments individuels confiés aux membres.",
      "Saisissez les besoins en consommables (peaux, baguettes, mailloches)."
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
  'orders-manager': {
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
  // 4. PÔLE VESTIAIRE & COSTUMES
  // ==========================================
  vestiaire: {
    titre: "🥻 Pôle Vestiaire & Costumes",
    title: "🥻 Pôle Vestiaire & Costumes",
    description: "Inventaire du parc de tenues de scène, atelier de confection artisanale et fiches de mensurations.",
    etapes: [
      "Gérez l'inventaire des costumes complets et accessoires de défilé.",
      "Suivez les projets de création et retouches dans l'Atelier Couture.",
      "Tenez à jour le registre des mensurations des musiciens et danseurs."
    ],
    steps: [
      "Gérez l'inventaire des costumes complets et accessoires de défilé.",
      "Suivez les projets de création et retouches dans l'Atelier Couture.",
      "Tenez à jour le registre des mensurations des musiciens et danseurs."
    ]
  },
  'wardrobe-inventory': {
    titre: "👗 Inventaire des Costumes & Tenues",
    title: "👗 Inventaire des Costumes & Tenues",
    description: "Catalogue des tenues de scène, suivi des attributions et de l'état des vêtements de la troupe.",
    etapes: [
      "Vérifiez la disponibilité des tenues par taille et type de costume.",
      "Assignez les éléments de costumes aux membres pour les prestations.",
      "Signalez les besoins de nettoyage ou de réparation."
    ],
    steps: [
      "Vérifiez la disponibilité des tenues par taille et type de costume.",
      "Assignez les éléments de costumes aux membres pour les prestations.",
      "Signalez les besoins de nettoyage ou de réparation."
    ]
  },
  'wardrobe-couture': {
    titre: "🪡 Atelier Couture & Fabrication",
    title: "🪡 Atelier Couture & Fabrication",
    description: "Organisation de la confection sur mesure et de l'entretien du vestiaire de l'association.",
    etapes: [
      "Listez les projets de confection en cours (patrons, métrages de tissus).",
      "Affectez les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivez l'avancement des pièces jusqu'à l'intégration au vestiaire."
    ],
    steps: [
      "Listez les projets de confection en cours (patrons, métrages de tissus).",
      "Affectez les tâches de découpe et d'assemblage aux couturiers volontaires.",
      "Suivez l'avancement des pièces jusqu'à l'intégration au vestiaire."
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

  // ==========================================
  // 5. PÔLE DIFFUSION & SPECTACLES
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
      "Ajoutez les demandes entrantes dans la colonne 'Premier contact'.",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocier et l'effectif requis."
    ],
    steps: [
      "Ajoutez les demandes entrantes dans la colonne 'Premier contact'.",
      "Faites évoluer la carte (Devis envoyé, Option posée, Contrat signé).",
      "Saisissez le montant du cachet négocier et l'effectif requis."
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
    steps: [
      "Enregistrez les coordonnées précises des chargés de programmation.",
      "Consignez les comptes-rendus d'échanges téléphoniques et relances.",
      "Qualifiez les diffuseurs selon leurs périodes de programmation."
    ]
  },

  // ==========================================
  // 6. PÔLE STUDIO & VIE ASSOCIATIVE
  // ==========================================
  studio: {
    titre: "📅 Pôle Studio & Organisation Interne",
    title: "📅 Pôle Studio & Organisation Interne",
    description: "Coordination du calendrier des répétitions, rédaction des PV de réunion et animation de la vie associative.",
    etapes: [
      "Organisez les créneaux de répétitions et événements internes.",
      "Rédigez et diffusez les compte-rendus de réunions du Bureau et du CA.",
      "Administrez le fil d'actualité Varal et les salons de discussion."
    ],
    steps: [
      "Organisez les créneaux de répétitions et événements internes.",
      "Rédigez et diffusez les compte-rendus de réunions du Bureau et du CA.",
      "Administrez le fil d'actualité Varal et les salons de discussion."
    ]
  },
  'studio-events': {
    titre: "📅 Calendrier & Inscriptions Événements",
    title: "📅 Calendrier & Inscriptions Événements",
    description: "Création des séances de répétition, stages et convocations aux événements de l'association.",
    etapes: [
      "Programmez un événement avec son lieu, ses horaires et consignes.",
      "Supervisez le suivi des inscriptions et présences des membres.",
      "Envoyez les rappels de convocation par email ou notification."
    ],
    steps: [
      "Programmez un événement avec son lieu, ses horaires et consignes.",
      "Supervisez le suivi des inscriptions et présences des membres.",
      "Envoyez les rappels de convocation par email ou notification."
    ]
  },
  'studio-social': {
    titre: "📱 Réseaux Sociaux & Publications",
    title: "📱 Réseaux Sociaux & Publications",
    description: "Préparation et création des visuels et publications pour les réseaux sociaux (Instagram, Facebook). Sélectionnez des visuels, des dates et générez le contenu prêt à publier.",
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
  'reunion-manager': {
    title: "📋 Gestion des Réunions & Compte-Rendus",
    description: "Ordres du jour, prise de notes et archivage des procès-verbaux de séance.",
    etapes: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes de séance.",
      "Publiez le procès-verbal signé à destination des administrateurs."
    ],
    steps: [
      "Préparez les points d'ordre du jour avant la tenue de la réunion.",
      "Consignez les débats et les résultats des votes de séance.",
      "Publiez le procès-verbal signé à destination des administrateurs."
    ]
  },
  'varal-manager': {
    titre: "📌 Gestion Documentaire & Varal",
    title: "📌 Gestion Documentaire & Varal",
    description: "Gestion des documents officiels, livrets de Cordel, partitions et médias. Modération et publication d'actualités sur le panneau d'affichage.",
    etapes: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les documents officiels et administratifs avec les membres.",
      "Administrez les médias et ressources téléchargeables."
    ],
    steps: [
      "Gérez et organisez les livrets de Cordel et partitions musicales.",
      "Partagez les documents officiels et administratifs avec les membres.",
      "Administrez les médias et ressources téléchargeables."
    ]
  },
  'newsletter': {
    titre: "📰 Générateur de Newsletter",
    title: "📰 Générateur de Newsletter",
    description: "Générateur de newsletter synthétique. Sélectionnez les dates importantes et les derniers événements pour préparer le contenu à exporter vers votre service d'envoi (Brevo).",
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
  'activity-reports': {
    titre: "📊 Rapports d'Activité & Statistiques",
    title: "📊 Rapports d'Activité & Statistiques",
    description: "Analyse quantitative des heures de pratique, taux de présence et bilans de saison.",
    etapes: [
      "Visualisez les statistiques de présence et le volume d'heures de jeu.",
      "Générez les indicateurs chiffrés pour les dossiers de subvention.",
      "Compilez le rapport d'activité annuel pour l'Assemblée Générale."
    ],
    steps: [
      "Visualisez les statistiques de présence et le volume d'heures de jeu.",
      "Générez les indicateurs chiffrés pour les dossiers de subvention.",
      "Compilez le rapport d'activité annuel pour l'Assemblée Générale."
    ]
  },
  'mestre-forum-channels': {
    titre: "📢 Administration des Salons Porte-voix",
    title: "📢 Administration des Salons Porte-voix",
    description: "Gestion des canaux de discussion thématiques et modération des espaces de communication.",
    etapes: [
      "Créez de nouveaux salons par pupitre ou projet spécial.",
      "Modérez les messages et veillez au respect de la charte.",
      "Fixez les sujets de discussion prioritaires."
    ],
    steps: [
      "Créez de nouveaux salons par pupitre ou projet spécial.",
      "Modérez les messages et veillez au respect de la charte.",
      "Fixez les sujets de discussion prioritaires."
    ]
  },

  // ==========================================
  // 7. PÔLE MESTRIA (DIRECTION ARTISTIQUE)
  // ==========================================
  mestre: {
    titre: "🎭 Pôle Mestria & Direction Artistique",
    title: "🎭 Pôle Mestria & Direction Artistique",
    description: "Espace de pilotage musical : castings par morceau, arrangements rythmiques, plans de scène et ateliers.",
    etapes: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et préparez les supports pédagogiques."
    ],
    steps: [
      "Définissez les morceaux du répertoire et les castings par date.",
      "Configurez la disposition des musiciens sur le plan de scène.",
      "Exploitez le Séquenceur et préparez les supports pédagogiques."
    ]
  },
  'mestre-orientation': {
    titre: "🎭 Castings & Distribution des Rôles",
    title: "🎭 Castings & Distribution des Rôles",
    description: "Attribution des postes clés (solistes, maires de baque, moustiques) morceau par morceau.",
    etapes: [
      "Sélectionnez le morceau du répertoire à attribuer.",
      "Désignez les meneurs de pupitres et solistes pour les prestations.",
      "Validez la composition de la troupe avant les répétitions générales."
    ],
    steps: [
      "Sélectionnez le morceau du répertoire à attribuer.",
      "Désignez les meneurs de pupitres et solistes pour les prestations.",
      "Validez la composition de la troupe avant les répétitions générales."
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
      "Positionnez les Alfaias, Caixas, Agogôs, Abês et Mestria sur la grille.",
      "Adaptez la disposition selon les contraintes de taille de scène.",
      "Exportez la fiche d'implantation pour l'équipe technique du festival."
    ],
    steps: [
      "Positionnez les Alfaias, Caixas, Agogôs, Abês et Mestria sur la grille.",
      "Adaptez la disposition selon les contraintes de taille de scène.",
      "Exportez la fiche d'implantation pour l'équipe technique du festival."
    ]
  },
  'mestre-sequenceur': {
    titre: "🎧 Séquenceur Rythmique Pédagogique",
    title: "🎧 Séquenceur Rythmique Pédagogique",
    description: "Outil interactif de décomposition des baques, breaks, viradas et appels de maracatu.",
    etapes: [
      "Choisissez le baque à étudier (Trovão, Luanda, Estrela, etc.).",
      "Écoutez et décortiquez la polyrythmie entre les pupitres.",
      "Utilisez le séquenceur comme support de répétition et d'apprentissage."
    ],
    steps: [
      "Choisissez le baque à étudier (Trovão, Luanda, Estrela, etc.).",
      "Écoutez et décortiquez la polyrythmie entre les pupitres.",
      "Utilisez le séquenceur comme support de répétition et d'apprentissage."
    ]
  },
  'mestre-workshops': {
    titre: "🥁 Ateliers Pédagogiques & Perfectionnement",
    title: "🥁 Ateliers Pédagogiques & Perfectionnement",
    description: "Planification des séances de formation technique et suivi d'évolution des pratiquants.",
    etapes: [
      "Définissez le programme des ateliers par niveau ou pupitre.",
      "Évaluez la maîtrise des frappes et la mémorisation des baques.",
      "Programmez les exercices de perfectionnement à travailler chez soi."
    ],
    steps: [
      "Définissez le programme des ateliers par niveau ou pupitre.",
      "Évaluez la maîtrise des frappes et la mémorisation des baques.",
      "Programmez les exercices de perfectionnement à travailler chez soi."
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
  // 8. PÔLE VITRINE PUBLIQUE
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
  // 9. PÔLE CONFIGURATION DU SYSTÈME
  // ==========================================
  config: {
    titre: "⚙️ Pôle Configuration du Système",
    title: "⚙️ Pôle Configuration du Système",
    description: "Paramètres administratifs : identité légale, interrupteurs des modules, sécurité et documents.",
    etapes: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les modèles de factures."
    ],
    steps: [
      "Complétez l'identité juridique et la composition du bureau.",
      "Activez ou masquez les modules selon votre fonctionnement.",
      "Configurez les paramètres de sécurité et les modèles de factures."
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
  'config-communication': {
    titre: "✉️ Configuration des Communications & Emails",
    title: "✉️ Configuration des Communications & Emails",
    description: "Paramétrage des adresses d'expédition et des gabarits de messages automatiques.",
    etapes: [
      "Définissez l'adresse courriel d'expédition par défaut de l'association.",
      "Personnalisez les modèles de courriels de convocation et relance.",
      "Vérifiez l'intégration des signatures en bas de message."
    ],
    steps: [
      "Définissez l'adresse courriel d'expédition par défaut de l'association.",
      "Personnalisez les modèles de courriels de convocation et relance.",
      "Vérifiez l'intégration des signatures en bas de message."
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
      "Activez ou désactivez les pôles (Vestiaire, Diffusion, Studio...).",
      "Masquez les fonctionnalités inutilisées pour simplifier l'interface.",
      "Enregistrez la grille des modules pour l'ensemble des membres."
    ],
    steps: [
      "Activez ou désactivez les pôles (Vestiaire, Diffusion, Studio...).",
      "Masquez les fonctionnalités inutilisées pour simplifier l'interface.",
      "Enregistrez la grille des modules pour l'ensemble des membres."
    ]
  },
  'config-logistics': {
    titre: "📦 Covoiturage & Matériel",
    title: "📦 Covoiturage & Matériel",
    description: "Paramétrage des règles de covoiturage, des mensurations de costumes et des kits.",
    etapes: [
      "Activez ou désactivez les options de remboursement du covoiturage.",
      "Gérez les options de vestiaire et de mensurations.",
      "Configurez les accessoires et pièces détachées pour l'inventaire."
    ],
    steps: [
      "Activez ou désactivez les options de remboursement du covoiturage.",
      "Gérez les options de vestiaire et de mensurations.",
      "Configurez les accessoires et pièces détachées pour l'inventaire."
    ]
  },
  'config-automations': {
    titre: "🤖 Automatisations & Formulaires",
    title: "🤖 Automatisations & Formulaires",
    description: "Automatisation de la liaison entre les formulaires d'inscription et les types d'événements.",
    etapes: [
      "Sélectionnez un formulaire d'inscription existant (HelloAsso, Google Forms...).",
      "Associez-le à un type d'événement spécifique (Ateliers, Stages).",
      "Définissez les messages automatiques à envoyer aux inscrits."
    ],
    steps: [
      "Sélectionnez un formulaire d'inscription existant (HelloAsso, Google Forms...).",
      "Associez-le à un type d'événement spécifique (Ateliers, Stages).",
      "Définissez les messages automatiques à envoyer aux inscrits."
    ]
  },
  'config-documents': {
    titre: "📋 Chartes, Santé & Fils",
    title: "📋 Chartes, Santé & Fils",
    description: "Configuration des documents administratifs obligatoires et des catégories du Varal.",
    etapes: [
      "Téléversez le modèle de certificat de droit à l'image et d'aptitude médicale.",
      "Vérifiez l'arbre des catégories du Varal pour organiser vos ressources."
    ],
    steps: [
      "Téléversez le modèle de certificat de droit à l'image et d'aptitude médicale.",
      "Vérifiez l'arbre des catégories du Varal pour organiser vos ressources."
    ]
  },
  'config-finance': {
    titre: "🪙 Configuration Trésorerie & HelloAsso",
    title: "🪙 Configuration Trésorerie & HelloAsso",
    description: "Configuration des cotisations, tarifs d'adhésion et des coordonnées bancaires.",
    etapes: [
      "Saisissez l'IBAN et les informations bancaires de l'association.",
      "Définissez le montant des cotisations et adhésions.",
      "Renseignez votre clé API HelloAsso pour automatiser le suivi."
    ],
    steps: [
      "Saisissez l'IBAN et les informations bancaires de l'association.",
      "Définissez le montant des cotisations et adhésions.",
      "Renseignez votre clé API HelloAsso pour automatiser le suivi."
    ]
  },
  'config-agenda': {
    titre: "📅 Paramètres de l'Agenda & Légendes",
    title: "📅 Paramètres de l'Agenda & Légendes",
    description: "Catégories d'activités (Concerts, Répétitions, Stages) et leurs couleurs associées.",
    etapes: [
      "Définissez les types d'événements applicables à l'agenda.",
      "Attribuez une couleur distinctive à chaque type d'activité.",
      "Configurez la synchronisation du calendrier."
    ],
    steps: [
      "Définissez les types d'événements applicables à l'agenda.",
      "Attribuez une couleur distinctive à chaque type d'activité.",
      "Configurez la synchronisation du calendrier."
    ]
  },
  'config-lieux': {
    titre: "📍 Lieux & Salles de Répétition",
    title: "📍 Lieux & Salles de Répétition",
    description: "Répertoire des adresses habituelles de répétitions et consignes d'accès aux salles.",
    etapes: [
      "Enregistrez les salles avec leurs coordonnées GPS précises.",
      "Indiquez les codes d'accès, digicodes et responsables de clés.",
      "Associez les salles aux événements de l'agenda."
    ],
    steps: [
      "Enregistrez les salles avec leurs coordonnées GPS précises.",
      "Indiquez les codes d'accès, digicodes et responsables de clés.",
      "Associez les salles aux événements de l'agenda."
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
  },

  // ==========================================
  // 10. CONSOLE SYSTEM ADMIN
  // ==========================================
  'system-admin': {
    titre: "🛠️ Console d'Administration Système",
    title: "🛠️ Console d'Administration Système",
    description: "Outil de diagnostic et de gestion technique avancé réservé aux super-administrateurs.",
    etapes: [
      "Contrôlez les demandes de nouveaux membres en attente de validation.",
      "Supervisez l'état de la base Firestore et des variables d'environnement.",
      "Exécutez les scripts de maintenance ou de migration de données."
    ],
    steps: [
      "Contrôlez les demandes de nouveaux membres en attente de validation.",
      "Supervisez l'état de la base Firestore et des variables d'environnement.",
      "Exécutez les scripts de maintenance ou de migration de données."
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
