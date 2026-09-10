/**
 * Référentiel des routes et réglages pour la Palette de commande universelle (Ctrl + K)
 * Permet aux responsables, membres du bureau et porteurs de badges d'accéder
 * instantanément à un pôle, sous-menu ou outil précis de l'application.
 */

export const SETTINGS_INDEX = [
  // ==========================================
  // 1. TRÉSORERIE
  // ==========================================
  {
    id: 'tresorerie-dashboard',
    title: 'Synthèse Financière',
    description: 'Tableau de bord de la trésorerie, solde global et graphiques',
    keywords: ['tresorerie', 'argent', 'solde', 'banque', 'bilan', 'compta', 'finances', 'recettes', 'depenses'],
    poleId: 'tresorerie',
    tabId: 'dashboard-finance',
    requiredPole: 'tresorerie'
  },
  {
    id: 'tresorerie-cotisations',
    title: 'Cotisations & Adhésions',
    description: 'Suivi des cotisations adhérents, statuts de paiement et HelloAsso',
    keywords: ['cotisations', 'adhesions', 'adherents', 'paiement', 'helloasso', 'tarifs', 'reglement', 'cheque', 'especes', 'virement'],
    poleId: 'tresorerie',
    tabId: 'cotisations',
    requiredPole: 'tresorerie'
  },
  {
    id: 'tresorerie-events',
    title: 'Finances des Événements',
    description: 'Budgets de dates, billetterie, cachets de prestations et marges',
    keywords: ['evenements', 'prestations', 'cachet', 'facturation', 'billetterie', 'devis', 'contrat', 'rentabilite'],
    poleId: 'tresorerie',
    tabId: 'events-finances',
    requiredPole: 'tresorerie'
  },
  {
    id: 'tresorerie-operations',
    title: 'Opérations & Factures',
    description: 'Journal des recettes, achats matériels, factures et notes de frais',
    keywords: ['operations', 'depenses', 'factures', 'justificatifs', 'achats', 'notes de frais', 'remboursement', 'comptabilite'],
    poleId: 'tresorerie',
    tabId: 'operations-diverses',
    requiredPole: 'tresorerie'
  },
  {
    id: 'tresorerie-frais-km',
    title: 'Frais Kilométriques',
    description: 'Déclarations des frais de transport et indemnités de déplacement',
    keywords: ['frais km', 'kilometrique', 'deplacement', 'trajet', 'voiture', 'peage', 'carburant', 'essence', 'remboursement'],
    poleId: 'tresorerie',
    tabId: 'frais-km',
    requiredPole: 'tresorerie'
  },
  {
    id: 'tresorerie-reports',
    title: 'Exports & Rapports Comptables',
    description: 'Exportation des écritures comptables CSV / Excel et bilan annuel',
    keywords: ['exports', 'rapports', 'excel', 'csv', 'expert comptable', 'bilan annuel', 'comptabilite', 'grand livre'],
    poleId: 'tresorerie',
    tabId: 'reports-exports',
    requiredPole: 'tresorerie'
  },

  // ==========================================
  // 2. SECRÉTARIAT
  // ==========================================
  {
    id: 'secretariat-annuaire',
    title: 'Annuaire des Membres',
    description: 'Liste complète des adhérents, coordonnées, fiches d\'urgence et export',
    keywords: ['annuaire', 'membres', 'adherents', 'contacts', 'telephones', 'emails', 'adresses', 'inscriptions', 'trombi'],
    poleId: 'secretariat',
    tabId: 'export-annu',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-dates',
    title: 'Registre des Dates & Prestations',
    description: 'Historique et calendrier des engagements officiels de la troupe',
    keywords: ['dates', 'registre', 'prestations', 'evenements', 'calendrier', 'engagements', 'concerts', 'sorties'],
    poleId: 'secretariat',
    tabId: 'studio-events',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-reunions',
    title: 'Réunions & Ordres du Jour',
    description: 'Planification des réunions, convocations, votes et procès-verbaux',
    keywords: ['reunions', 'ag', 'pv', 'proces verbal', 'convocation', 'ordre du jour', 'emargement', 'votes', 'seances'],
    poleId: 'secretariat',
    tabId: 'reunion-manager',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-varal',
    title: 'Varal Officiel Secrétariat',
    description: 'Documents administratifs officiels, statuts, récépissés et conventions',
    keywords: ['varal', 'documents', 'statuts', 'prefecture', 'assurance', 'rib', 'conventions', 'administratif'],
    poleId: 'secretariat',
    tabId: 'varal-secretariat',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-salons',
    title: 'Canaux du Porte-voix',
    description: 'Configuration et modération des salons de discussion publics',
    keywords: ['porte voix', 'canaux', 'salons', 'forum', 'moderation', 'discussions', 'communication interne'],
    poleId: 'secretariat',
    tabId: 'mestre-forum-channels',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-activite',
    title: 'Journal d\'Activité (CSV)',
    description: 'Historique technique des événements, présences et actions réalisées',
    keywords: ['journal', 'activite', 'logs', 'historique', 'csv', 'audit', 'tracabilite'],
    poleId: 'secretariat',
    tabId: 'activity-reports',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-bilans-ag',
    title: 'Bilans & Rapports AG',
    description: 'Préparation et archivage des rapports moral et d\'activité de l\'Assemblée Générale',
    keywords: ['rapport ag', 'assemblee generale', 'bilan moral', 'activite', 'rapport annuel', 'bureau'],
    poleId: 'secretariat',
    tabId: 'secretariat-reports',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-ressources',
    title: 'Ressources & Liens Secrétariat',
    description: 'Fiches pratiques, modèles de courriers et liens administratifs utiles',
    keywords: ['ressources', 'liens', 'fiches', 'modeles', 'courriers', 'templates'],
    poleId: 'secretariat',
    tabId: 'secretariat-documents',
    requiredPole: 'secretariat'
  },
  {
    id: 'secretariat-lieux',
    title: 'Lieux & Salles de Répétition',
    description: 'Gestion des adresses, salles de répétition, contacts mairies et relances',
    keywords: ['lieux', 'salles', 'repetition', 'adresses', 'mairies', 'reservation', 'relances'],
    poleId: 'secretariat',
    tabId: 'secretariat-lieux',
    requiredPole: 'secretariat'
  },

  // ==========================================
  // 3. GOUVERNANCE (CONSEIL D'ADMINISTRATION)
  // ==========================================
  {
    id: 'gouvernance-ca-reunions',
    title: 'Réunions du CA & PV',
    description: 'Comptes-rendus, décisions stratégiques et délibérations du Conseil d\'Administration',
    keywords: ['gouvernance', 'conseil administration', 'ca', 'deliberations', 'decisions', 'pv ca'],
    poleId: 'gouvernance',
    tabId: 'ca-reunions',
    requiredPole: 'gouvernance'
  },
  {
    id: 'gouvernance-ca-reports',
    title: 'Bilans & Rapports AG du CA',
    description: 'Validation collégiale des rapports du Conseil d\'Administration pour l\'AG',
    keywords: ['gouvernance', 'rapport ag', 'ca', 'bilan d orientation'],
    poleId: 'gouvernance',
    tabId: 'ca-reports',
    requiredPole: 'gouvernance'
  },
  {
    id: 'gouvernance-ca-documents',
    title: 'Statuts & Registre du CA',
    description: 'Textes fondamentaux, règlement intérieur et déclaration en préfecture',
    keywords: ['statuts', 'reglement interieur', 'registre', 'charte', 'declaration', 'prefecture'],
    poleId: 'gouvernance',
    tabId: 'ca-documents',
    requiredPole: 'gouvernance'
  },
  {
    id: 'gouvernance-ca-finances',
    title: 'Synthèse Financière du Bureau',
    description: 'Vue macro-économique et arbitrages budgétaires pour le CA',
    keywords: ['finances bureau', 'budget prev', 'arbitrage', 'ca', 'tresorerie ca'],
    poleId: 'gouvernance',
    tabId: 'ca-finances',
    requiredPole: 'gouvernance'
  },

  // ==========================================
  // 4. DIFFUSION & TOURNÉES
  // ==========================================
  {
    id: 'diffusion-gigs',
    title: 'Suivi des Prestations (Pipeline)',
    description: 'Devis, prospection, contrats signés, cachets et fiches techniques',
    keywords: ['diffusion', 'prestations', 'pipeline', 'contrats', 'devis', 'organisateurs', 'concerts', 'festivals', 'cachets'],
    poleId: 'diffusion',
    tabId: 'gigs-pipeline',
    requiredPole: 'diffusion'
  },
  {
    id: 'diffusion-crm',
    title: 'Carnet de Contacts CRM',
    description: 'Annuaire des programmateurs, mairies, festivals et partenaires de diffusion',
    keywords: ['crm', 'contacts', 'programmateurs', 'festivals', 'mairies', 'partenaires', 'carnet', 'relances'],
    poleId: 'diffusion',
    tabId: 'diffusion-contacts',
    requiredPole: 'diffusion'
  },

  // ==========================================
  // 5. LOGISTIQUE & MATÉRIEL
  // ==========================================
  {
    id: 'logistique-inventory',
    title: 'Parc d\'Instruments & Inventaire',
    description: 'Inventaire de tous les tambours, états, numéros de série et attributions',
    keywords: ['instruments', 'parc', 'inventaire', 'tambours', 'alfaias', 'caixas', 'gongues', 'etats', 'prets'],
    poleId: 'logistique',
    tabId: 'inventory',
    requiredPole: 'logistique'
  },
  {
    id: 'logistique-pupitres',
    title: 'Pupitres de Percussion',
    description: 'Configuration des sections instrumentales (Alfaias, Caixas, Gonguê, Agbê, etc.)',
    keywords: ['pupitres', 'sections', 'alfaias', 'caixas', 'gongues', 'agbes', 'repartage', 'composition'],
    poleId: 'logistique',
    tabId: 'logistics-pupitres',
    requiredPole: 'logistique'
  },
  {
    id: 'logistique-kits',
    title: 'Accessoires & Kits Scéniques',
    description: 'Baguettes, mailloches, sangles, housses, pieds et câblage scénique',
    keywords: ['kits', 'accessoires', 'baguettes', 'mailloches', 'sangles', 'housses', 'talabartes', 'sono'],
    poleId: 'logistique',
    tabId: 'logistics-kits',
    requiredPole: 'logistique'
  },
  {
    id: 'logistique-convois',
    title: 'Covoiturage & Convois',
    description: 'Organisation des véhicules de transport pour le matériel lourd et les batteurs',
    keywords: ['covoiturage', 'convois', 'camion', 'utilitaire', 'transport', 'vehicules', 'chargement'],
    poleId: 'logistique',
    tabId: 'logistics-carpool',
    requiredPole: 'logistique'
  },
  {
    id: 'logistique-commandes',
    title: 'Commandes Groupées',
    description: 'Achats groupés de matériel, instruments brésiliens et pièces pour les membres',
    keywords: ['commandes', 'achats groupes', 'bresil', 'fournisseurs', 'livraisons', 'boutique'],
    poleId: 'logistique',
    tabId: 'orders',
    requiredPole: 'logistique'
  },

  // ==========================================
  // 6. LUTHERIE & RÉPARATION
  // ==========================================
  {
    id: 'lutherie-etabli',
    title: 'Établi & Chantiers Lutherie',
    description: 'Suivi des instruments en réparation, changements de peaux et réglages de tension',
    keywords: ['lutherie', 'reparation', 'chantiers', 'etabli', 'futs', 'tirants', 'peaux', 'accordage'],
    poleId: 'lutherie',
    tabId: 'inventory-projects',
    requiredPole: 'lutherie'
  },
  {
    id: 'lutherie-models',
    title: 'Modèles d\'Instruments',
    description: 'Fiches techniques, dimensions, essences de bois et spécifications des tambours',
    keywords: ['modeles', 'instruments', 'fiches techniques', 'dimensions', 'diametres', 'pouces', 'plans'],
    poleId: 'lutherie',
    tabId: 'instrument-models',
    requiredPole: 'lutherie'
  },
  {
    id: 'lutherie-parts',
    title: 'Pièces Détachées Lutherie',
    description: 'Crochets, cerclages, cordages, tirants et quincaillerie pour fûts',
    keywords: ['pieces detachees', 'cerclages', 'crochets', 'cordes', 'tirants', 'visserie', 'quincaillerie'],
    poleId: 'lutherie',
    tabId: 'inventory-parts',
    requiredPole: 'lutherie'
  },
  {
    id: 'lutherie-supplies',
    title: 'Matières Premières',
    description: 'Peaux naturelles (chèvre, veau), cuir, vernis, huiles et cordes en lin/chanvre',
    keywords: ['matieres premieres', 'peaux', 'cuir', 'cordages', 'vernis', 'chanvre', 'lin', 'huile'],
    poleId: 'lutherie',
    tabId: 'inventory-supplies',
    requiredPole: 'lutherie'
  },
  {
    id: 'lutherie-tools',
    title: 'Outillage de Lutherie',
    description: 'Clés de serrage, outils de perçage, ponceuses et établi d\'artisan',
    keywords: ['outillage', 'outils', 'cles', 'perceuse', 'ponceuse', 'rabot', 'atelier lutherie'],
    poleId: 'lutherie',
    tabId: 'workshop-tools',
    requiredPole: 'lutherie'
  },
  {
    id: 'lutherie-varal',
    title: 'Varal Lutherie',
    description: 'Tutoriels d\'accordage, plans de fabrication et manuels d\'entretien',
    keywords: ['varal lutherie', 'tutoriels', 'plans', 'fabrication', 'entretien tambours'],
    poleId: 'lutherie',
    tabId: 'varal-lutherie',
    requiredPole: 'lutherie'
  },

  // ==========================================
  // 7. COSTUMERIE & SCÉNOGRAPHIE
  // ==========================================
  {
    id: 'costumerie-projets',
    title: 'Établi de Confection Couture',
    description: 'Chantiers de création des tenues de scène, découpe et assemblage',
    keywords: ['costumerie', 'couture', 'confection', 'etabli', 'tenues de scene', 'projets', 'costumes'],
    poleId: 'costumerie',
    tabId: 'wardrobe-projects',
    requiredPole: 'costumerie'
  },
  {
    id: 'costumerie-models',
    title: 'Modèles & Patrons de Costumes',
    description: 'Patrons de coupe, fiches de style, palettes de couleurs et guides de confection',
    keywords: ['patrons', 'modeles costumes', 'fiches de coupe', 'palette couleurs', 'charte textile'],
    poleId: 'costumerie',
    tabId: 'wardrobe-models',
    requiredPole: 'costumerie'
  },
  {
    id: 'costumerie-pieces',
    title: 'Vestiaire Physique',
    description: 'Stock des costumes finis, attribution par batteur et retours de scène',
    keywords: ['vestiaire', 'costumes', 'tenues', 'stock', 'attributions', 'chemises', 'pantalons', 'jupes'],
    poleId: 'costumerie',
    tabId: 'wardrobe-pieces',
    requiredPole: 'costumerie'
  },
  {
    id: 'costumerie-supplies',
    title: 'Tissus & Mercerie',
    description: 'Rouleaux de tissu, fils, boutons, fermetures, rubans et élastiques',
    keywords: ['tissus', 'mercerie', 'fils', 'bobines', 'boutons', 'fermetures', 'rubans', 'tissu wax'],
    poleId: 'costumerie',
    tabId: 'wardrobe-supplies',
    requiredPole: 'costumerie'
  },
  {
    id: 'costumerie-tools',
    title: 'Machines & Outils de Couture',
    description: 'Machines à coudre, surjeteuses, ciseaux tailleur, fers et mannequins',
    keywords: ['machines a coudre', 'surjeteuse', 'ciseaux', 'fer a repasser', 'mannequin', 'outils couture'],
    poleId: 'costumerie',
    tabId: 'wardrobe-tools',
    requiredPole: 'costumerie'
  },
  {
    id: 'costumerie-sizes',
    title: 'Tailles & Mensurations',
    description: 'Fiches de mensurations des adhérents pour l\'ajustement personnalisé des tenues',
    keywords: ['mensurations', 'tailles', 'tour de taille', 'stature', 'confection sur mesure'],
    poleId: 'costumerie',
    tabId: 'wardrobe-sizes',
    requiredPole: 'costumerie'
  },

  // ==========================================
  // 8. STUDIO & COMMUNICATION
  // ==========================================
  {
    id: 'studio-social',
    title: 'Studio Social & Réseaux',
    description: 'Publications, kit de communication, visuels et calendrier éditorial',
    keywords: ['studio', 'reseaux sociaux', 'instagram', 'facebook', 'visuels', 'affiches', 'communication'],
    poleId: 'studio',
    tabId: 'studio-social',
    requiredPole: 'studio'
  },
  {
    id: 'studio-newsletter',
    title: 'Campagnes Newsletter',
    description: 'Envois d\'e-mails aux abonnés, suivi des ouvertures et synchronisation Brevo',
    keywords: ['newsletter', 'emailing', 'brevo', 'campagnes', 'abonnés', 'diffusion email', 'mailing'],
    poleId: 'studio',
    tabId: 'newsletter',
    requiredPole: 'studio'
  },
  {
    id: 'studio-communication',
    title: 'Communication & Vidéo à la une',
    description: 'Configuration du serveur d\'e-mails, clé API Brevo et sélection de la vidéo à la une',
    keywords: ['communication', 'video a la une', 'brevo', 'smtp', 'api key', 'youtube accueil', 'emailing config'],
    poleId: 'studio',
    tabId: 'studio-communication',
    requiredPole: 'studio'
  },
  {
    id: 'studio-varal-photos',
    title: 'Varal Photos & Galerie Cloud',
    description: 'Albums photos de prestations, lien Nextcloud Framaspace et QR-Code de récolte',
    keywords: ['photos', 'albums', 'varal photos', 'galerie', 'framaspace', 'nextcloud', 'cliches', 'qr code'],
    poleId: 'studio',
    tabId: 'varal-photos',
    requiredPole: 'studio'
  },

  // ==========================================
  // 9. MESTRIA & PÉDAGOGIE
  // ==========================================
  {
    id: 'mestre-repertoire',
    title: 'Répertoire & Toadas',
    description: 'Paroles, arrangements rythmiques, puxadors et morceaux traditionnels',
    keywords: ['repertoire', 'toadas', 'paroles', 'chansons', 'rythmes', 'chants', 'mestre', 'batuque'],
    poleId: 'mestre',
    tabId: 'mestre-repertoire',
    requiredPole: 'mestre'
  },
  {
    id: 'mestre-categories',
    title: 'Catégories de Pratique',
    description: 'Niveaux d\'apprentissage, critères de progression et passages de pupitres',
    keywords: ['categories', 'niveaux', 'progression', 'debutant', 'confirme', 'pratique', 'pedagogie'],
    poleId: 'mestre',
    tabId: 'mestre-categories',
    requiredPole: 'mestre'
  },
  {
    id: 'mestre-orientation',
    title: 'Casting & Orientation Pupitres',
    description: 'Attribution des musiciens sur scène selon le format et les balances scéniques',
    keywords: ['casting', 'orientation', 'pupitres', 'equipe scene', 'disposition', 'selection batteurs'],
    poleId: 'mestre',
    tabId: 'mestre-orientation',
    requiredPole: 'mestre'
  },
  {
    id: 'mestre-stage',
    title: 'Plan de Scène',
    description: 'Disposition géométrique des percussionnistes et chanteurs sur scène',
    keywords: ['plan de scene', 'scene', 'placement', 'geometrie', 'formation', 'disposition'],
    poleId: 'mestre',
    tabId: 'mestre-stage-layout',
    requiredPole: 'mestre'
  },
  {
    id: 'mestre-sequenceur',
    title: 'Séquenceur & Boîte à Rythmes',
    description: 'Simulateur polyrythmique interactif pour décomposer les variations de baques',
    keywords: ['sequenceur', 'polyrythmie', 'rythmes', 'tempo', 'metronome', 'baques', 'variations'],
    poleId: 'mestre',
    tabId: 'mestre-sequenceur',
    requiredPole: 'mestre'
  },
  {
    id: 'mestre-mot',
    title: 'Annonces & Mot du Mestre',
    description: 'Message inspirant et mot d\'ordre officiel affiché en haut du tableau de bord',
    keywords: ['mot du mestre', 'message mestre', 'annonces', 'consignes', 'axe', 'editorial'],
    poleId: 'mestre',
    tabId: 'mestre-mot-mestre',
    requiredPole: 'mestre'
  },
  {
    id: 'pedagogie-qcm',
    title: 'QCM & Auto-Évaluations',
    description: 'Quiz interactifs de rythme, écoute instrumentale et culture musicale',
    keywords: ['qcm', 'quiz', 'auto evaluation', 'test', 'connaissances', 'pedagogie', 'rythme'],
    poleId: 'pedagogie',
    tabId: 'mestre-pedagogy-qcm',
    requiredPole: 'pedagogie'
  },
  {
    id: 'pedagogie-dashboard',
    title: 'Suivi & Analyse Pédagogique',
    description: 'Progression des adhérents, taux de réussite aux quiz et carnets de bord',
    keywords: ['suivi pedagogique', 'progression eleves', 'statistiques quiz', 'reussite', 'evaluations'],
    poleId: 'pedagogie',
    tabId: 'mestre-pedagogy-dashboard',
    requiredPole: 'pedagogie'
  },

  // ==========================================
  // 10. CONFIGURATION DE L'ASSOCIATION
  // ==========================================
  {
    id: 'config-identity',
    title: 'Identité de l\'Association & Logo',
    description: 'Nom officiel, acronyme, logo SVG/PNG, coordonnées et description publique',
    keywords: ['configuration', 'identite', 'logo', 'nom association', 'coordonnees', 'slogan', 'description'],
    poleId: 'config',
    tabId: 'config-identity',
    requiredPole: 'config'
  },
  {
    id: 'config-security',
    title: 'Badges & Matrice de Permissions',
    description: 'Attribution des badges de responsabilité et droits d\'accès aux pôles',
    keywords: ['badges', 'permissions', 'securite', 'matrice', 'droits', 'acces', 'roles', 'responsables'],
    poleId: 'config',
    tabId: 'config-security',
    requiredPole: 'config'
  },
  {
    id: 'config-layout',
    title: 'Apparence & Thème de Couleurs',
    description: 'Palette chromatique de l\'association, personnalisation et terminologie',
    keywords: ['apparence', 'theme', 'couleurs', 'design', 'personnalisation', 'style cordel', 'terminologie'],
    poleId: 'config',
    tabId: 'config-layout',
    requiredPole: 'config'
  },
  {
    id: 'config-member-layout',
    title: 'Vue Membre, Ordre & Vidéo à la une',
    description: 'Ordre d\'affichage des blocs de l\'accueil adhérent, position des anniversaires et vidéo à la une',
    keywords: ['vue membre', 'ordre', 'affichage', 'disposition', 'widgets', 'layout', 'accueil', 'video', 'video a la une', 'anniversaires', 'tableau de bord', 'reorganisation'],
    poleId: 'config',
    tabId: 'config-member-layout',
    requiredPole: 'config'
  },
  {
    id: 'config-profile',
    title: 'Inscription & Profils Membres',
    description: 'Champs du formulaire d\'adhésion, informations médicales et RGPD',
    keywords: ['inscription', 'formulaire adhesion', 'profils', 'champs', 'rgpd', 'sante', 'reglement'],
    poleId: 'config',
    tabId: 'config-profile',
    requiredPole: 'config'
  },
  {
    id: 'config-modules',
    title: 'Modules & Fonctionnalités',
    description: 'Activation ou masquage des modules (Trésorerie, Lutherie, Costumerie, etc.)',
    keywords: ['modules', 'fonctionnalites', 'activer', 'desactiver', 'options', 'options avancees'],
    poleId: 'config',
    tabId: 'config-modules',
    requiredPole: 'config'
  },
  {
    id: 'config-tambours',
    title: 'Configuration des Tambours',
    description: 'Définition des fûts, nomenclatures des instruments et pupitres de la troupe',
    keywords: ['tambours', 'instruments config', 'nomenclature', 'alfaias', 'caixas', 'tarol'],
    poleId: 'config',
    tabId: 'config-tambours',
    requiredPole: 'config'
  },
  {
    id: 'config-system',
    title: 'Administration Système',
    description: 'Panneau technique de maintenance, sauvegardes et configuration SaaS',
    keywords: ['systeme', 'admin systeme', 'super admin', 'maintenance', 'sauvegardes', 'technique'],
    poleId: 'config',
    tabId: 'system-admin',
    requiredPole: 'config',
    requiredPermission: 'systemAdmin'
  },
  {
    id: 'config-tags',
    title: 'Gestionnaire d\'Étiquettes',
    description: 'Création et personnalisation des étiquettes et badges de l\'association',
    keywords: ['etiquettes', 'tags', 'gestionnaire tags', 'badges', 'creer badge', 'couleurs tags'],
    poleId: 'config',
    tabId: 'tag-manager',
    requiredPole: 'config'
  }
];
