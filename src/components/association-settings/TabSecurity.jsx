import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import PermissionsGuideBox from '../PermissionsGuideBox';
import { formatTagGender, getTagId } from '../../utils/tagUtils';
import { useTranslation } from '../LanguageContext';

const PERMISSION_POLES = [
  {
    id: "gouvernance",
    label: "🏛️ Gouvernance",
    labelKey: "settings.security.tabSecurity.gouvernance",
    desc: "Pilotage stratégique, réunions et délibérations du Conseil d'Administration",
    descKey: "settings.security.tabSecurity.pilotageStrategiqueReunionsEtDeliberations",
    tabs: [
      {
        id: "ca-reunions",
        label: "Réunions & PV",
        labelKey: "settings.security.tabSecurity.reunionsPv",
        desc: "Ordres du jour, délibérations et procès-verbaux de réunions",
        descKey: "settings.security.tabSecurity.ordresDuJourDeliberationsEt"
      },
      {
        id: "ca-reports",
        label: "Bilans & Rapports AG",
        labelKey: "settings.security.tabSecurity.bilansRapportsAg",
        desc: "Consolidation multi-pôles et bilans pour l'Assemblée Générale",
        descKey: "settings.security.tabSecurity.consolidationMultiPolesEtBilans"
      },
      {
        id: "ca-documents",
        label: "Registre & Statuts",
        labelKey: "settings.security.tabSecurity.registreStatuts",
        desc: "Documents officiels, statuts, règlement intérieur et PV officiels",
        descKey: "settings.security.tabSecurity.documentsOfficielsStatutsReglementInterieur"
      },
      {
        id: "ca-finances",
        label: "Synthèse Financière",
        labelKey: "settings.security.tabSecurity.syntheseFinanciere",
        desc: "Aperçu global des comptes, trésorerie et synthèses financières",
        descKey: "settings.security.tabSecurity.apercuGlobalDesComptesTresorerie"
      },
      {
        id: "ca-prestations",
        label: "Dates & Engagements",
        labelKey: "settings.security.tabSecurity.datesEngagements",
        desc: "Suivi stratégique des prestations, devis et engagements",
        descKey: "settings.security.tabSecurity.suiviStrategiqueDesPrestationsDevis"
      }
    ]
  },
  {
    id: "secretariat",
    label: "📋 Secrétariat",
    labelKey: "settings.security.tabSecurity.secretariat",
    desc: "Gestion statutaire, annuaire, bilans d'activité, registre des dates et documents officiels",
    descKey: "settings.security.tabSecurity.gestionStatutaireAnnuaireBilansD",
    tabs: [
      {
        id: "export-annu",
        label: "Annuaire & Exports",
        labelKey: "settings.security.tabSecurity.annuaireExports",
        desc: "Accès à la liste des adhérents et export CSV/Excel",
        descKey: "settings.security.tabSecurity.accesALaListeDes"
      },
      {
        id: "secretariat-reports",
        label: "Rapports & Bilan AG",
        labelKey: "settings.security.tabSecurity.rapportsBilanAg",
        desc: "Bilan d'activité AG et extraction CSV des présences",
        descKey: "settings.security.tabSecurity.bilanDActiviteAgEt"
      },
      {
        id: "studio-events",
        label: "Registre des dates",
        labelKey: "settings.security.tabSecurity.registreDesDates",
        desc: "Tableau d'édition rapide et globale des événements",
        descKey: "settings.security.tabSecurity.tableauDEditionRapideEt"
      },
      {
        id: "varal-secretariat",
        label: "Documents officiels",
        labelKey: "settings.security.tabSecurity.documentsOfficiels",
        desc: "Documents administratifs et comptes-rendus officiels",
        descKey: "settings.security.tabSecurity.documentsAdministratifsEtComptesRendus"
      },
      {
        id: "secretariat-documents",
        label: "Chartes, Santé & Liens",
        labelKey: "settings.security.tabSecurity.chartesSanteLiens",
        desc: "Gestion des chartes, droits à l'image RGPD, attestations médicales et liens cloud",
        descKey: "settings.security.tabSecurity.gestionDesChartesDroitsA"
      }
    ]
  },
  {
    id: "diffusion",
    label: "🎷 Diffusion",
    labelKey: "settings.security.tabSecurity.diffusion",
    desc: "Suivi des prestations, opportunités de concerts et pipeline CRM",
    descKey: "settings.security.tabSecurity.suiviDesPrestationsOpportunitesDe",
    tabs: [
      {
        id: "gigs-pipeline",
        label: "Suivi des Prestations",
        labelKey: "settings.security.tabSecurity.suiviDesPrestations",
        desc: "Gestion de l'entonnoir des prestations (demandes, devis, options, factures)",
        descKey: "settings.security.tabSecurity.gestionDeLEntonnoirDes"
      }
    ]
  },
  {
    id: "tresorerie",
    label: "🪙 Trésorerie",
    labelKey: "settings.security.tabSecurity.tresorerie",
    desc: "Gestion financière, cotisations et frais kilométriques",
    descKey: "settings.security.tabSecurity.gestionFinanciereCotisationsEtFrais",
    tabs: [
      {
        id: "dashboard-finance",
        label: "Synthèse",
        labelKey: "settings.security.tabSecurity.synthese",
        desc: "Aperçu global de la trésorerie et synthèses",
        descKey: "settings.security.tabSecurity.apercuGlobalDeLaTresorerie"
      },
      {
        id: "cotisations",
        label: "Cotisations",
        labelKey: "settings.security.tabSecurity.cotisations",
        desc: "Suivi et enregistrement des adhésions et cotisations",
        descKey: "settings.security.tabSecurity.suiviEtEnregistrementDesAdhesions"
      },
      {
        id: "events-finances",
        label: "Événements",
        labelKey: "settings.security.tabSecurity.evenements",
        desc: "Suivi financier dédié aux prestations et événements",
        descKey: "settings.security.tabSecurity.suiviFinancierDedieAuxPrestations"
      },
      {
        id: "operations-diverses",
        label: "Opérations",
        labelKey: "settings.security.tabSecurity.operations",
        desc: "Saisie des recettes et dépenses courantes hors événements",
        descKey: "settings.security.tabSecurity.saisieDesRecettesEtDepenses"
      },
      {
        id: "frais-km",
        label: "Frais",
        labelKey: "settings.security.tabSecurity.frais",
        desc: "Validation et remboursement des indemnités kilométriques",
        descKey: "settings.security.tabSecurity.validationEtRemboursementDesIndemnites"
      },
      {
        id: "reports-exports",
        label: "Exports",
        labelKey: "settings.security.tabSecurity.exports",
        desc: "Génération du grand livre et exports comptables",
        descKey: "settings.security.tabSecurity.generationDuGrandLivreEt"
      }
    ]
  },
  {
    id: "logistique",
    label: "📦 Logistique",
    labelKey: "settings.security.tabSecurity.logistique",
    desc: "Inventaire du parc d'instruments, commandes groupées, convois et malles régie",
    descKey: "settings.security.tabSecurity.inventaireDuParcDInstruments",
    tabs: [
      {
        id: "inventory",
        label: "Parc Instruments & Cautions",
        labelKey: "settings.security.tabSecurity.parcInstrumentsCautions",
        desc: "Gestion du parc d'instruments, cautions et état du matériel",
        descKey: "settings.security.tabSecurity.gestionDuParcDInstruments"
      },
      {
        id: "orders",
        label: "Commandes Groupées",
        labelKey: "settings.security.tabSecurity.commandesGroupees",
        desc: "Suivi des achats et commandes de matériel",
        descKey: "settings.security.tabSecurity.suiviDesAchatsEtCommandes"
      },
      {
        id: "logistics-carpool",
        label: "Convois & Flotte Véhicules",
        labelKey: "settings.security.tabSecurity.convoisFlotteVehicules",
        desc: "Point de départ convoi, barème km et règles de transport",
        descKey: "settings.security.tabSecurity.pointDeDepartConvoiBareme"
      },
      {
        id: "logistics-kits",
        label: "Malles Régie & Trousses Secours",
        labelKey: "settings.security.tabSecurity.mallesRegieTroussesSecours",
        desc: "Gestion des malles régie, trousses de secours, maquillage et outillage",
        descKey: "settings.security.tabSecurity.gestionDesMallesRegieTrousses"
      }
    ]
  },
  {
    id: "lutherie",
    label: "🪚 Lutherie & Atelier",
    labelKey: "settings.security.tabSecurity.lutherieAtelier",
    desc: "Artisanat, modèles d'instruments, établi, pièces détachées et outillage",
    descKey: "settings.security.tabSecurity.artisanatModelesDInstrumentsEtabli",
    tabs: [
      {
        id: "inventory-projects",
        label: "Établi & chantiers",
        labelKey: "settings.security.tabSecurity.etabliChantiers",
        desc: "Suivi des chantiers de fabrication et réparations lourdes",
        descKey: "settings.security.tabSecurity.suiviDesChantiersDeFabrication"
      },
      {
        id: "instrument-models",
        label: "Modèles d'instruments",
        labelKey: "settings.security.tabSecurity.modelesDInstruments",
        desc: "Fiches techniques, nomenclatures et gabarits de fabrication",
        descKey: "settings.security.tabSecurity.fichesTechniquesNomenclaturesEtGabarits"
      },
      {
        id: "inventory-parts",
        label: "Pièces détachées",
        labelKey: "settings.security.tabSecurity.piecesDetachees",
        desc: "Gestion des stocks de fûts, cercles, peaux et accastillage",
        descKey: "settings.security.tabSecurity.gestionDesStocksDeFuts"
      },
      {
        id: "inventory-supplies",
        label: "Matières premières",
        labelKey: "settings.security.tabSecurity.matieresPremieres",
        desc: "Suivi des cordes, tirants, vernis et consommables",
        descKey: "settings.security.tabSecurity.suiviDesCordesTirantsVernis"
      },
      {
        id: "workshop-tools",
        label: "Outillage",
        labelKey: "settings.security.tabSecurity.outillage",
        desc: "Inventaire des outils et machines de l'atelier",
        descKey: "settings.security.tabSecurity.inventaireDesOutilsEtMachines"
      },
      {
        id: "varal-lutherie",
        label: "Varal Lutherie",
        labelKey: "settings.security.tabSecurity.varalLutherie",
        desc: "Tutoriels et plans de fabrication artisanale",
        descKey: "settings.security.tabSecurity.tutorielsEtPlansDeFabrication"
      },
      {
        id: "canValidateWorkshopSteps",
        label: "Validation d'atelier & Fiche suiveuse",
        labelKey: "settings.security.tabSecurity.validationDAtelierFicheSuiveuse",
        desc: "Autorise à valider les étapes d'usinage et à demander des retouches sur l'établi",
        descKey: "settings.security.tabSecurity.autoriseAValiderLesEtapes"
      }
    ]
  },
  {
    id: "costumerie",
    label: "🧵 Costumerie",
    labelKey: "settings.security.tabSecurity.costumerie",
    desc: "Artisanat textile, confection des tenues, patrons, tissus et mensurations",
    descKey: "settings.security.tabSecurity.artisanatTextileConfectionDesTenues",
    tabs: [
      {
        id: "wardrobe-projects",
        label: "Établi de confection",
        labelKey: "settings.security.tabSecurity.etabliDeConfection",
        desc: "Suivi des projets et chantiers couture en cours",
        descKey: "settings.security.tabSecurity.suiviDesProjetsEtChantiers"
      },
      {
        id: "wardrobe-models",
        label: "Modèles & Patrons",
        labelKey: "settings.security.tabSecurity.modelesPatrons",
        desc: "Gestion des modèles de costumes et pièces requises",
        descKey: "settings.security.tabSecurity.gestionDesModelesDeCostumes"
      },
      {
        id: "wardrobe-pieces",
        label: "Vestiaire physique",
        labelKey: "settings.security.tabSecurity.vestiairePhysique",
        desc: "Stock unitaire des tenues, état et prêts aux membres",
        descKey: "settings.security.tabSecurity.stockUnitaireDesTenuesEtat"
      },
      {
        id: "wardrobe-supplies",
        label: "Tissus & Mercerie",
        labelKey: "settings.security.tabSecurity.tissusMercerie",
        desc: "Gestion des rouleaux de tissus, fils, boutons et consommables",
        descKey: "settings.security.tabSecurity.gestionDesRouleauxDeTissus"
      },
      {
        id: "wardrobe-tools",
        label: "Machines & Outils",
        labelKey: "settings.security.tabSecurity.machinesOutils",
        desc: "Inventaire des machines à coudre, surjeteuses et outils",
        descKey: "settings.security.tabSecurity.inventaireDesMachinesACoudre"
      },
      {
        id: "wardrobe-sizes",
        label: "Tailles & Mensurations",
        labelKey: "settings.security.tabSecurity.taillesMensurations",
        desc: "Tableau des tailles et mensurations des danseurs et musiciens",
        descKey: "settings.security.tabSecurity.tableauDesTaillesEtMensurations"
      },
      {
        id: "varal-costumerie",
        label: "Varal Costumerie",
        labelKey: "settings.security.tabSecurity.varalCostumerie",
        desc: "Patrons de coupe et fiches techniques de couture",
        descKey: "settings.security.tabSecurity.patronsDeCoupeEtFiches"
      }
    ]
  },
  {
    id: "studio",
    label: "Studio",
    labelKey: "settings.security.tabSecurity.studio",
    desc: "Communication externe, réseaux sociaux, lettres d'info et photothèque",
    descKey: "settings.security.tabSecurity.communicationExterneReseauxSociauxLettres",
    tabs: [
      {
        id: "annonces-publish",
        label: "Le Mégaphone (Annonces)",
        labelKey: "settings.security.tabSecurity.leMegaphoneAnnonces",
        desc: "Autorise à rédiger, publier et gérer les annonces officielles sur le tableau de bord (ex: CA, Modérateur, Communication)",
        descKey: "settings.security.tabSecurity.autoriseARedigerPublierEt"
      },
      {
        id: "studio-social",
        label: "Réseaux & Médias",
        labelKey: "settings.security.tabSecurity.reseauxMedias",
        desc: "Gestion et publication sur les réseaux sociaux",
        descKey: "settings.security.tabSecurity.gestionEtPublicationSurLes"
      },
      {
        id: "newsletter",
        label: "Lettres d'info",
        labelKey: "settings.security.tabSecurity.lettresDInfo",
        desc: "Création et envoi de lettres d'information",
        descKey: "settings.security.tabSecurity.creationEtEnvoiDeLettres"
      },
      {
        id: "varal-photos",
        label: "Médiathèque Photos",
        labelKey: "settings.security.tabSecurity.mediathequePhotos",
        desc: "Dépôts et albums photos partagés des prestations",
        descKey: "settings.security.tabSecurity.depotsEtAlbumsPhotosPartages"
      },
      {
        id: "studio-communication",
        label: "Communication & Brevo",
        labelKey: "settings.security.tabSecurity.communicationBrevo",
        desc: "Vidéo à la une, synchronisation Brevo, Cloud Functions et exports",
        descKey: "settings.security.tabSecurity.videoALaUneSynchronisation"
      },
      {
        id: "studio-lexique",
        label: "Lexique & Mentions",
        labelKey: "settings.security.tabSecurity.lexiqueMentions",
        desc: "Dictionnaire des termes musicaux, mentions légales et lexique",
        descKey: "settings.security.tabSecurity.dictionnaireDesTermesMusicauxMentions"
      }
    ]
  },
  {
    id: "pedagogie",
    label: "📚 Pédagogie",
    labelKey: "settings.security.tabSecurity.pedagogie",
    desc: "Transmission musicale, parcours et Varal pédagogique",
    descKey: "settings.security.tabSecurity.transmissionMusicaleParcoursEtVaral",
    tabs: [
      {
        id: "varal-manager",
        label: "Varal Pédagogique",
        labelKey: "settings.security.tabSecurity.varalPedagogique",
        desc: "Toadas, fiches de culture et tutoriels vidéo",
        descKey: "settings.security.tabSecurity.toadasFichesDeCultureEt"
      },
      {
        id: "mestre-pedagogy-qcm",
        label: "QCM & Quiz",
        labelKey: "settings.security.tabSecurity.qcmQuiz",
        desc: "Gestion des questionnaires et seuils de validation",
        descKey: "settings.security.tabSecurity.gestionDesQuestionnairesEtSeuils"
      },
      {
        id: "mestre-pedagogy-dashboard",
        label: "Suivi & Analyse",
        labelKey: "settings.security.tabSecurity.suiviAnalyse",
        desc: "Visualisation de la progression et aisance des adhérents",
        descKey: "settings.security.tabSecurity.visualisationDeLaProgressionEt"
      }
    ]
  },
  {
    id: "mestre",
    label: "🥁 Mestria",
    labelKey: "settings.security.tabSecurity.mestria",
    desc: "Direction artistique et plan de scène",
    descKey: "settings.security.tabSecurity.directionArtistiqueEtPlanDe",
    tabs: [
      {
        id: "mestre-repertoire",
        label: "Répertoire",
        labelKey: "settings.security.tabSecurity.repertoire",
        desc: "Gestion de la setlist de saison et statut des morceaux",
        descKey: "settings.security.tabSecurity.gestionDeLaSetlistDe"
      },
      {
        id: "mestre-categories",
        label: "Catégories de pratique",
        labelKey: "settings.security.tabSecurity.categoriesDePratique",
        desc: "Gestion des sections et niveaux de pratique de la troupe",
        descKey: "settings.security.tabSecurity.gestionDesSectionsEtNiveaux"
      },
      {
        id: "mestre-orientation",
        label: "Casting",
        labelKey: "settings.security.tabSecurity.casting",
        desc: "Gestion des affectations d'instruments et vœux d'évolution",
        descKey: "settings.security.tabSecurity.gestionDesAffectationsDInstruments"
      },
      {
        id: "mestre-events",
        label: "Événements",
        labelKey: "settings.security.tabSecurity.evenements",
        desc: "Vue mestre détaillée des événements et présences",
        descKey: "settings.security.tabSecurity.vueMestreDetailleeDesEvenements"
      },
      {
        id: "mestre-stage-layout",
        label: "Plan de Scène",
        labelKey: "settings.security.tabSecurity.planDeScene",
        desc: "Création et disposition visuelle du placement scénique",
        descKey: "settings.security.tabSecurity.creationEtDispositionVisuelleDu"
      },
      {
        id: "mestre-mot-mestre",
        label: "Annonces",
        labelKey: "settings.security.tabSecurity.annonces",
        desc: "Publication des communications officielles du Mestre",
        descKey: "settings.security.tabSecurity.publicationDesCommunicationsOfficiellesDu"
      }
    ]
  },
  {
    id: "vitrine",
    label: "🌐 Vitrine Publique",
    labelKey: "settings.security.tabSecurity.vitrinePublique",
    desc: "Autorisations de prévisualisation en mode brouillon et d'administration de la vitrine",
    descKey: "settings.security.tabSecurity.autorisationsDePrevisualisationEnMode",
    tabs: [
      {
        id: "vitrine-preview",
        label: "Vitrine — Prévisualisation (Mode Brouillon)",
        labelKey: "settings.security.tabSecurity.vitrinePrevisualisationModeBrouillon",
        desc: "Permet d'accéder à la vitrine lorsque isPublished est à false (mode en construction)",
        descKey: "settings.security.tabSecurity.permetDAccederALa"
      },
      {
        id: "vitrine-edit",
        label: "Vitrine — Édition & Configuration",
        labelKey: "settings.security.tabSecurity.vitrineEditionConfiguration",
        desc: "Permet d'accéder au pôle d'administration de la Vitrine (textes, formules, images, SEO, etc.)",
        descKey: "settings.security.tabSecurity.permetDAccederAuPole"
      }
    ]
  },
  {
    id: "config",
    label: "⚙️ Configuration",
    labelKey: "settings.security.tabSecurity.configuration",
    desc: "Paramètres institutionnels de l'association, identité, sécurité, modules et profils",
    descKey: "settings.security.tabSecurity.parametresInstitutionnelsDeLAssociation",
    tabs: [
      {
        id: "config-identity",
        label: "Identité légale & Juridique",
        labelKey: "settings.security.tabSecurity.identiteLegaleJuridique",
        desc: "SIRET, RNA, siège social, signatures et coordonnées bancaires",
        descKey: "settings.security.tabSecurity.siretRnaSiegeSocialSignatures"
      },
      {
        id: "config-profile",
        label: "Inscription, Profils & Lieux/Agenda",
        labelKey: "settings.security.tabSecurity.inscriptionProfilsLieuxAgenda",
        desc: "Formulaire d'inscription, cycles annuels, salles clés et catégories d'agenda",
        descKey: "settings.security.tabSecurity.formulaireDInscriptionCyclesAnnuels"
      },
      {
        id: "config-security",
        label: "Badges, Rôles & Sécurité",
        labelKey: "settings.security.tabSecurity.badgesRolesSecurite",
        desc: "Matrice RBAC des rôles et permissions par pôle",
        descKey: "settings.security.tabSecurity.matriceRbacDesRolesEt"
      },
      {
        id: "config-comms",
        label: "Communication, E-mails & Automatisations",
        labelKey: "settings.security.tabSecurity.communicationEMailsAutomatisations",
        desc: "Configuration expéditeur, API Brevo, DNS et règles de relance automatique",
        descKey: "settings.security.tabSecurity.configurationExpediteurApiBrevoDns"
      },
      {
        id: "config-modules",
        label: "Modules SaaS, Apparence & Médias",
        labelKey: "settings.security.tabSecurity.modulesSaasApparenceMedias",
        desc: "Activation des pôles, nomenclature des tambours, logo et playlists",
        descKey: "settings.security.tabSecurity.activationDesPolesNomenclatureDes"
      }
    ]
  }
];

export default function TabSecurity({
  formData,
  handleChange,
  saving,
  t,
  onNavigateToTagManager
}) {
  const { t: translate } = useTranslation();
  const tFunc = t || translate;
  const { permissionsMatrice = {}, tagsDisponibles = [] } = formData;

  // État local des accordéons de pôles : TOUS FERMÉS PAR DÉFAUT à l'ouverture
  const [openPoles, setOpenPoles] = useState({
    gouvernance: false,
    secretariat: false,
    diffusion: false,
    tresorerie: false,
    logistique: false,
    lutherie: false,
    costumerie: false,
    studio: false,
    pedagogie: false,
    mestre: false,
    vitrine: false,
    config: false
  });

  // Initialisation par défaut des permissions du Pôle Gouvernance si non encore configurées
  useEffect(() => {
    if (!tagsDisponibles || tagsDisponibles.length === 0) return;
    const governanceTabs = ['ca-reunions', 'ca-reports', 'ca-documents', 'ca-finances', 'ca-prestations'];
    const hasAnyGovConfig = governanceTabs.some(tabId => permissionsMatrice[tabId] !== undefined) || permissionsMatrice['gouvernance'] !== undefined;

    if (!hasAnyGovConfig) {
      // Badges prioritaires de gouvernance (CA, Bureau, Présidence, Direction, Conseil)
      const defaultGovTagIds = tagsDisponibles
        .filter(t => {
          const name = (typeof t === 'string' ? t : (t.nomM || t.label || t.id || '')).toLowerCase();
          return name.includes('ca') || name.includes('bureau') || name.includes('présid') || name.includes('presid') || name.includes('direction') || name.includes('conseil');
        })
        .map(t => getTagId(t));

      if (defaultGovTagIds.length > 0) {
        // Pré-assignation automatique sur le pôle gouvernance entier
        handleChange('permissionsMatrice', {
          ...permissionsMatrice,
          gouvernance: defaultGovTagIds
        });
      }
    }
  }, [tagsDisponibles]);

  // Basculer l'état ouvert/fermé d'un accordéon de pôle
  const togglePoleAccordion = (poleId) => {
    setOpenPoles(prev => ({
      ...prev,
      [poleId]: !prev[poleId]
    }));
  };

  // Déplier tous les accordéons
  const expandAll = () => {
    const allOpen = {};
    PERMISSION_POLES.forEach(pole => {
      allOpen[pole.id] = true;
    });
    setOpenPoles(allOpen);
  };

  // Replier tous les accordéons
  const collapseAll = () => {
    const allClosed = {};
    PERMISSION_POLES.forEach(pole => {
      allClosed[pole.id] = false;
    });
    setOpenPoles(allClosed);
  };

  // Basculer une permission (ajouter ou retirer une étiquette sur une cible donnée)
  const handleTogglePermission = (targetId, tagId, checked) => {
    const currentTags = permissionsMatrice[targetId] || [];
    let updatedTags;

    if (checked) {
      updatedTags = [...new Set([...currentTags, tagId])];
    } else {
      updatedTags = currentTags.filter(id => id !== tagId);
    }

    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [targetId]: updatedTags
    });
  };

  // Basculer all badges for a specific tab
  const handleToggleAllTabBadges = (tabId, selectAll) => {
    const allTagIds = tagsDisponibles.map(t => getTagId(t));
    const updatedTags = selectAll ? allTagIds : [];
    handleChange('permissionsMatrice', {
      ...permissionsMatrice,
      [tabId]: updatedTags
    });
  };

  // Fonction utilitaire pour afficher les cases à cocher de badges pour une cible (tabId ou poleId)
  const renderTagCheckboxes = (targetId, parentPoleId = null) => {
    const assignedTags = permissionsMatrice[targetId] || [];
    const poleLevelTags = parentPoleId ? (permissionsMatrice[parentPoleId] || []) : [];

    return tagsDisponibles.map(tag => {
      const tagId = getTagId(tag);
      const isChecked = assignedTags.includes(tagId) || (typeof tag === 'string' && assignedTags.includes(tag));
      const isInheritedFromPole = Boolean(
        parentPoleId && (poleLevelTags.includes(tagId) || (typeof tag === 'string' && poleLevelTags.includes(tag)))
      );
      const formattedLabel = formatTagGender(tag, null, formData?.majoriteFeminine, tagsDisponibles);

      return (
        <label key={tagId} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold select-none hover:opacity-85">
          <input 
            type="checkbox"
            checked={isChecked || isInheritedFromPole}
            disabled={saving || isInheritedFromPole}
            onChange={(e) => handleTogglePermission(targetId, tagId, e.target.checked)}
            className="rounded cursor-pointer w-3.5 h-3.5 accent-[var(--cordel-wood)] disabled:opacity-60"
          />
          <span 
            className={`theme-stamp-badge text-[8.5px] py-0.5 normal-case tracking-normal transition-all ${
              isInheritedFromPole
                ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-2xs font-extrabold'
                : isChecked 
                  ? 'theme-stamp-badge-wood bg-cordel-wood text-white border-encre-noire' 
                  : 'theme-stamp-badge-wood opacity-70'
            }`}
            title={isInheritedFromPole ? (tFunc('tabSecurity.inheritedTooltip') || "Ce badge bénéficie déjà d'un accès illimité via l'attribution globale au Pôle entier") : undefined}
          >
            {formattedLabel} {isInheritedFromPole && (tFunc('tabSecurity.inheritedSuffix') || '✓ (Pôle)')}
          </span>
        </label>
      );
    });
  };

  // Calcul du résumé des permissions assignées pour un pôle (global pôle + par onglet)
  const countAssignedTabsInPole = (pole) => {
    const poleAssigned = permissionsMatrice[pole.id] || [];
    const poleAssignedCount = Array.isArray(poleAssigned) ? poleAssigned.length : 0;

    let tabRestrictedCount = 0;
    pole.tabs.forEach(tab => {
      const tabAssigned = permissionsMatrice[tab.id] || [];
      if (Array.isArray(tabAssigned) && tabAssigned.length > 0) {
        tabRestrictedCount++;
      }
    });

    return { poleAssignedCount, tabRestrictedCount };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Raccourci vers le Gestionnaire d'Étiquettes et sa Vue Inversée */}
      {onNavigateToTagManager && (
        <div data-tour="config-security-pin" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] select-none text-left">
          <div className="flex flex-col">
            <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
              <span>🏷️</span>
              <span>{tFunc('settings.security.tabSecurity.gestionnaireDEtiquettesVueInversee') || tFunc('tabSecurity.shortcutTitle') || "Gestionnaire d'Étiquettes & Vue Inversée"}</span>
            </span>
            <span className="text-[10px] text-cordel-master-dark/80 font-medium mt-0.5">
              {tFunc('settings.security.tabSecurity.creerOuModifierLesRoles') || tFunc('tabSecurity.shortcutDesc') || "Créer ou modifier les rôles (ex. Trésorier, CA), auditer les membres porteurs et dissocier les étiquettes."}
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToTagManager}
            className="px-3.5 py-1.5 bg-cordel-wood text-cordel-bg-light border-2 border-encre-noire rounded-[4px_7px_5px_6px] font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-110 active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 transition-transform"
          >
            <span>🏷️</span>
            <span>{tFunc('settings.security.tabSecurity.ouvrirLesBadgesVueInversee') || tFunc('tabSecurity.shortcutBtn') || "Ouvrir les Badges & Vue Inversée →"}</span>
          </button>
        </div>
      )}

      {/* Permanent Explanatory Guide Box (fermé par défaut) */}
      <div data-tour="config-security-guide">
        <PermissionsGuideBox defaultOpen={false} onNavigateToTagManager={onNavigateToTagManager} />
      </div>

      <div data-tour="config-security-matrix">
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood text-left flex items-center gap-2">
          <span>🪢</span> {tFunc('settings.security.tabSecurity.matriceDesPermissionsParPole') || tFunc('tabSecurity.matrixTitle') || "Matrice des Permissions (Par Pôle & Par Onglet)"}
        </h3>

        {/* Accordion Global Controls */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer select-none"
          >
            📂 {tFunc('settings.security.tabSecurity.toutOuvrir') || tFunc('tabSecurity.expandAll') || "Tout ouvrir"}
          </button>
          <span className="text-[9px] opacity-40">|</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer select-none"
          >
            📁 {tFunc('settings.security.tabSecurity.toutFermer') || tFunc('tabSecurity.collapseAll') || "Tout fermer"}
          </button>
        </div>
      </div>

      <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed mb-4 text-left">
        {tFunc('settings.security.tabSecurity.attribuezLAccesGlobalA') || tFunc('tabSecurity.matrixDesc') || "Attribuez l'accès global à un pôle entier (recommandé pour une gestion rapide) ou affinez les autorisations onglet par onglet pour chaque étiquette/rôle."}
      </p>

      {tagsDisponibles.length === 0 ? (
        <div className="text-[10px] italic text-red-700 bg-red-100/20 p-3 border border-dashed border-red-700/20 rounded text-left">
          ⚠️ {tFunc('settings.security.tabSecurity.aucuneEtiquetteBadgeNEst') || tFunc('tabSecurity.noTagsWarning') || "Aucune étiquette/badge n'est configuré pour cette association. Veuillez d'abord créer des badges dans le Gestionnaire de Badges."}
        </div>
      ) : (
        <div className="flex flex-col gap-3 text-left">
          {PERMISSION_POLES.map((pole) => {
            const isOpen = !!openPoles[pole.id];
            const { poleAssignedCount, tabRestrictedCount } = countAssignedTabsInPole(pole);

            return (
              <div 
                key={pole.id}
                className="border-2 border-encre-noire rounded-[6px_10px_6px_8px] overflow-hidden bg-cordel-bg-light shadow-[2px_2px_0px_0px_#181716] transition-all"
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => togglePoleAccordion(pole.id)}
                  className="w-full px-3 py-2.5 bg-cordel-master-light/20 hover:bg-cordel-master-light/35 flex items-center justify-between cursor-pointer border-b border-encre-noire/15 select-none text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-encre-noire">{pole.labelKey ? (tFunc(pole.labelKey) || pole.label) : pole.label}</span>

                    {/* Badge indicateur d'accès global au pôle */}
                    {poleAssignedCount > 0 && (
                      <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--color-cordel-vert,#2d6a4f)]/15 text-[var(--color-cordel-vert,#2d6a4f)] border border-[var(--color-cordel-vert,#2d6a4f)]/30 flex items-center gap-1">
                        <span>🏛️</span>
                        <span>{(tFunc('tabSecurity.entirePoleBadges') || '{count} badge(s) pôle entier').replace('{count}', poleAssignedCount)}</span>
                      </span>
                    )}

                    {/* Badge indicateur d'onglets restreints */}
                    <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-full bg-cordel-wood/15 text-cordel-wood border border-cordel-wood/30">
                      {(tFunc('tabSecurity.configuredTabs') || '{count} / {total} onglet(s) configuré(s)').replace('{count}', tabRestrictedCount).replace('{total}', pole.tabs.length)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cordel-wood">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="p-3 bg-white/50 dark:bg-black/10 flex flex-col gap-3.5">
                    <p className="text-[9.5px] italic text-cordel-master-dark/60 font-medium">
                      {pole.descKey ? (tFunc(pole.descKey) || pole.desc) : pole.desc}
                    </p>

                    {/* BLOC 1 : Accès Global au Pôle Entier */}
                    <div className="p-3 border-2 border-stone-800/80 bg-amber-50/70 dark:bg-stone-900/60 rounded-[6px] flex flex-col gap-2.5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🏛️</span>
                            <span className="text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-100">
                              {(tFunc('tabSecurity.globalPoleAccess') || 'Accès Global au Pôle Entier ({pole})').replace('{pole}', pole.labelKey ? (tFunc(pole.labelKey) || pole.label) : pole.label)}
                            </span>
                          </div>
                          <p className="text-[9px] text-stone-600 dark:text-stone-400 font-medium mt-0.5">
                            {tFunc('settings.security.tabSecurity.cochezUneEtiquetteIciPour') || tFunc('tabSecurity.globalPoleDesc') || "Cochez une étiquette ici pour lui accorder l'accès d'office à l'ensemble du pôle et à tous ses onglets en une seule fois."}
                          </p>
                        </div>

                        {/* Actions rapides sur le pôle entier */}
                        <div className="flex items-center gap-1.5 text-[8px] font-extrabold shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleAllTabBadges(pole.id, true)}
                            disabled={saving}
                            className="px-2 py-1 rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                            title={tFunc('settings.security.tabSecurity.accorderLAccesATout') || "Accorder l'accès à tout le pôle pour toutes les étiquettes"}
                          >
                            <span>✓</span>
                            <span>{tFunc('settings.security.tabSecurity.toutLePole') || tFunc('tabSecurity.entirePoleBtn') || "Tout le Pôle"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAllTabBadges(pole.id, false)}
                            disabled={saving}
                            className="px-2 py-1 rounded bg-stone-200 text-stone-700 border border-stone-300 hover:bg-stone-300 active:scale-95 transition-all cursor-pointer"
                            title={tFunc('settings.security.tabSecurity.retirerLesAccesGlobauxAccordes') || "Retirer les accès globaux accordés à ce pôle"}
                          >
                            {tFunc('settings.security.tabSecurity.aucun') || tFunc('tabSecurity.noneBtn') || "Aucun"}
                          </button>
                        </div>
                      </div>

                      {/* Cases à cocher des badges au niveau du Pôle entier */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-stone-400/30">
                        {renderTagCheckboxes(pole.id)}
                      </div>
                    </div>

                    {/* SÉPARATEUR : Onglets spécifiques */}
                    <div className="flex items-center gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
                        📑 {tFunc('settings.security.tabSecurity.restrictionsParOngletSpecifique') || tFunc('tabSecurity.tabRestrictionsTitle') || "Restrictions par Onglet Spécifique"}
                      </span>
                      <span className="text-[8.5px] text-stone-500 italic hidden sm:inline">
                        {tFunc('settings.security.tabSecurity.pourAttribuerUnAccesPartiel') || tFunc('tabSecurity.tabRestrictionsDesc') || "(Pour attribuer un accès partiel aux membres n'ayant pas l'accès global au pôle)"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {pole.tabs.map((tab) => {
                        return (
                          <div 
                            key={tab.id}
                            className="p-2.5 border border-dashed border-cordel-master-dark/20 rounded bg-cordel-bg/40 flex flex-col gap-2"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-[10.5px] font-extrabold text-encre-noire">
                                  📑 {tab.labelKey ? (tFunc(tab.labelKey.startsWith('settings.') ? tab.labelKey : `poles.${tab.labelKey}`) || tab.label) : tab.label}
                                </span>
                                {(tab.descKey || tab.desc) && (
                                  <span className="text-[8.5px] text-cordel-master-dark/65 block font-medium">
                                    {tab.descKey ? (tFunc(tab.descKey.startsWith('settings.') ? tab.descKey : `poles.${tab.descKey}`) || tab.desc) : tab.desc}
                                  </span>
                                )}
                              </div>

                              {/* Quick vérifier/uncheck tab buttons */}
                              <div className="flex gap-1.5 text-[8px] font-extrabold">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAllTabBadges(tab.id, true)}
                                  className="px-1.5 py-0.5 rounded bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/20 hover:bg-cordel-wood/20 cursor-pointer"
                                  title={tFunc('settings.security.tabSecurity.cocherTousLesBadgesPour') || "Cocher tous les badges pour cet onglet"}
                                >
                                  {tFunc('settings.security.tabSecurity.tous') || tFunc('tabSecurity.allBtn') || "Tous"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAllTabBadges(tab.id, false)}
                                  className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 border border-neutral-300 hover:bg-neutral-300 cursor-pointer"
                                  title={tFunc('settings.security.tabSecurity.decocherTousLesBadgesPour') || "Décocher tous les badges pour cet onglet"}
                                >
                                  {tFunc('settings.security.tabSecurity.aucun') || tFunc('tabSecurity.noneBtn') || "Aucun"}
                                </button>
                              </div>
                            </div>

                            {/* Badge checkboxes list avec indication d'héritage du pôle */}
                            <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed border-cordel-master-dark/10">
                              {renderTagCheckboxes(tab.id, pole.id)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CordelCard>
    </div>
    </div>
  );
}
