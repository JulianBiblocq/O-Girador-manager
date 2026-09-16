/**
 * Données factices initiales du Mode Démo
 * Association vitrine : « Maracatu Na Chuva » (Locoal-Mendon, Ria d'Étel)
 *
 * Troupe complète de 18+ membres couvrant l'ensemble des pupitres et rôles,
 * avec logo vectoriel circulaire O Girador Na Chuva.
 */

// Utilitaire pour simuler un Timestamp Firestore avec support de .toDate()
export const createDemoTimestamp = (isoDateString) => {
  const dateObj = new Date(isoDateString);
  const seconds = Math.floor(dateObj.getTime() / 1000);
  return {
    seconds,
    nanoseconds: 0,
    toDate: () => new Date(dateObj.getTime()),
    toISOString: () => dateObj.toISOString(),
    valueOf: () => dateObj.getTime()
  };
};

export const DEMO_GROUP_ID = 'maracatu-na-chuva';

export const INITIAL_DEMO_DATA = {
  // 1. Informations de l'association vitrine
  associations: [
    {
      id: DEMO_GROUP_ID,
      nom: 'Maracatu Na Chuva',
      rna: 'W561009999',
      siret: '89123456700012',
      ville: "Locoal-Mendon (Ria d'Étel)",
      adresseLocal: "Hangar de l'Isthme, Locoal-Mendon",
      universe: 'maracatu',
      devise: 'Quand le baque réchauffe le crachin',
      branding: {
        appName: 'Maracatu Na Chuva',
        colors: {
          background: '#f4ecd8',
          primary: '#c05621',
          secondary: '#2d6a4f',
          text: '#181716'
        },
        logoUrl: '/brandings/logo-nachuva-girador.svg'
      },
      majoriteFeminine: true,
      activerPresenceEnLigne: true,
      onboardingCompleted: true,
      enabledModules: null,
      tagsDisponibles: [
        'batuqueiro',
        'danseur',
        'referent',
        'bureau',
        'lutherie',
        'costumerie',
        'covoit',
        'tresorier',
        'secretaire',
        'mestre'
      ],
      instrumentsDisponibles: [
        'Alfaia Marcante',
        'Alfaia Meião',
        'Alfaia Repique',
        'Caixa',
        'Gonguê',
        'Mineiro',
        'Agbê',
        'Danse'
      ],
      linkedInstruments: [
        { name: 'Alfaias', instruments: ['Alfaia Marcante', 'Alfaia Meião', 'Alfaia Repique'] },
        { name: 'Sementes', instruments: ['Agbê', 'Mineiro'] }
      ],
      fieldsConfig: {
        niveaux: { enabled: true },
        telephone: { enabled: true },
        instruments: { enabled: true },
        cotisation: { enabled: true }
      },
      // Paramètres financiers et comptes bancaires initiaux du mode démo
      bankAccounts: [
        {
          id: 'acc_courant',
          name: 'Compte Courant',
          balance: 2450.00,
          threshold: 500,
          updatedAt: '2026-09-01'
        },
        {
          id: 'acc_livreta',
          name: 'Livret Associatif',
          balance: 3200.00,
          threshold: 1000,
          updatedAt: '2026-09-01'
        },
        {
          id: 'acc_caisse',
          name: 'Caisse liquide',
          balance: 115.00,
          threshold: 50,
          updatedAt: '2026-09-01'
        }
      ],
      montantAdhesion: 60,
      montantCotisation: 60,
      montantCautionDefaut: 150,
      categoriesTransactions: [
        'Prestations',
        'Adhésions',
        'Subventions',
        'Matériel',
        'Lutherie',
        'Assurance',
        'Intervenant',
        'Local',
        'Autre'
      ],
      optionsCotisation: [
        { id: 'opt_costume', nom: 'Location Costume Scène', montant: 20 },
        { id: 'opt_stage', nom: 'Accès Masterclasses', montant: 30 }
      ],
      mentionTVA: 'Association loi 1901 exonérée de TVA (art. 261-7-1 du CGI)',
      ribIban: 'FR76 1234 5678 9012 3456 7890 123',
      iban: 'FR76 1234 5678 9012 3456 7890 123',
      titulaireCompte: 'Association Maracatu Na Chuva',
      domiciliationBancaire: "Crédit Maritime — Agence d'Étel",
      adresseSiegeSocial: "Hangar associatif de l'Isthme, 56550 Locoal-Mendon",
      adresse: "Hangar associatif de l'Isthme, 56550 Locoal-Mendon",
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      forfaitHeuresAdmin: 120,
      forfaitHeuresArtisanat: 80,
      vitrineViews: 340,
      agReports: {
        motPresidence: "Au rythme des marées de la Ria d'Étel, la saison 2025-2026 a confirmé la vigueur de notre troupe. Grâce aux 19 batuqueiras et batuqueiros mobilisés, nous portons haut les couleurs du Maracatu de Baque Virado en Morbihan.",
        motTresorier: "L'exercice comptable se clôture avec un excédent net d'exploitation de +1 205,00 €. Notre gestion rigoureuse permet de financer les investissements en peaux de chèvre et housses étanches en toile cirée jaune."
      },
      customDomains: [],
      // Configuration complète de la Vitrine Publique (Mostrador)
      publicTheme: {
        isPublished: true,
        associationName: 'Maracatu Na Chuva',
        primaryColor: '#c05621',
        secondaryColor: '#2d6a4f',
        backgroundColor: '#FAF6EE',
        textColor: '#181716',
        buttonBgColor: '#c05621',
        buttonTextColor: '#FFFFFF',
        headingFont: 'Oswald',
        bodyFont: 'Roboto',
        logoUrl: '/brandings/logo-nachuva-girador.svg',
        publicCatchphrase: 'Quand le baque réchauffe le crachin',
        heroCatchphrase: 'Quand le baque réchauffe le crachin',
        publicDescription: "Troupe de Maracatu de Baque Virado basée à Locoal-Mendon, au cœur de la Ria d'Étel. Percussions puissantes des alfaias, rythmes ancestraux du Pernambouc et convivialité bretonne.",
        aboutText: "Née sur les rives de la Ria d'Étel, l'association Maracatu Na Chuva fait résonner la culture populaire du Nordeste brésilien en Morbihan. De la Cale de Pen Mané aux carnavals bretons, nos 19 batuqueiras et batuqueiros partagent une énergie communicative.",
        publicContactEmail: 'contact@maracatu-nachuva.bzh',
        publicContactPhone: '06 01 02 03 04',
        heroOverlayOpacity: 25,
        afficherVieAssociative: true,
        afficherRecrutement: true,
        afficherGalerie: true,
        afficherAgenda: true,
        enableOrganizerSection: true,
        afficherNewsletter: true,
        titreRecrutement: 'Rejoignez la troupe !',
        texteRecrutement: "Ateliers hebdomadaires au Hangar associatif de l'Isthme à Locoal-Mendon. Que vous soyez débutant(e) ou percussionniste aguerri(e), venez tester une séance d'essai !",
        lienRecrutement: '#contact',
        texteBoutonRecrutement: 'Prendre contact',
        showRecrutementCtaIcon: true,
        activerHelloAssoRecrutement: false,
        heroCtaText: 'Prochaines dates',
        heroCtaLink: '#agenda',
        showHeroCtaIcon: true,
        heroCtaIcon: '📅',
        vitrineTexts: {
          titrePresentation: 'Qui sommes-nous ?',
          accrochePresentation: "Découvrez la puissance du Maracatu de Baque Virado, nos alfaias traditionnelles et la chaleur du Nordeste au cœur de la Ria d'Étel.",
          badgeVieAssociative: 'Notre Quotidien',
          titreVieAssociative: 'Vie Associative & Répétitions',
          badgeGalerie: 'Photos & Prestations',
          titreGalerie: 'En Images',
          accrocheGalerie: 'Instantanés de nos sorties, cortejos et résidences de travail en Bretagne sud.',
          titreAgenda: 'Prochaines Dates & Prestations',
          accrocheAgenda: 'Événements ouverts au public. Venez vibrer au son des tambours !',
          badgeProgrammer: 'Espace Organisateur & Programmateurs',
          titreProgrammer: 'Nous Programmer / Fiche Technique',
          accrocheProgrammer: 'Festivals, carnavals, fêtes maritimes ou manifestations culturelles : découvrez nos formules déambulatoires et scéniques.',
          titreContactReseaux: 'Contact & Réservations',
          accrocheContactReseaux: "Un projet de spectacle, un atelier d'initiation ou une question ? Écrivez-nous !",
          badgeNewsletter: 'Infolettre de la Ria',
          titreNewsletter: "Abonnez-vous à l'actualité de la troupe",
          accrocheNewsletter: 'Recevez les dates de nos prochains concerts et nos ateliers portes ouvertes.'
        },
        socialLinks: {
          facebook: 'https://facebook.com',
          instagram: 'https://instagram.com',
          youtube: 'https://youtube.com'
        },
        bureauMembres: [
          { nom: 'Mestre da Ria', role: 'Direction artistique & Président' },
          { nom: 'Rozenn Le Guen', role: 'Secrétaire générale' },
          { nom: 'Malo Kergourlay', role: 'Trésorier' }
        ],
        directionArtistique: [
          { nom: 'Mestre da Ria', role: 'Mestre de Baque' }
        ]
      }
    }
  ],

  // 2. Effectif complet de la troupe (19 profils réalistes)
  users: [
    // 1. Mestre da Ria (Mestre / Admin - Exonéré)
    {
      id: 'demo_mestre_nachuva',
      uid: 'demo_mestre_nachuva',
      nom: 'da Ria',
      prenom: 'Mestre',
      surnom: 'O Mestre',
      displayName: 'Mestre da Ria',
      email: 'mestre@maracatu-nachuva.bzh',
      telephone: '06 01 02 03 04',
      role: 'admin',
      isMestre: true,
      isSystemAdmin: false,
      instrumentsJoues: ['Alfaia Marcante', 'Gonguê', 'Caixa'],
      instrumentPrincipal: 'Alfaia Marcante',
      niveau: 'referent',
      cotisationStatut: 'exonere',
      cotisationStatus: 'exonere',
      paymentStatus: 'exempted',
      adhesionBase: false,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseRue: "Hangar de l'Isthme",
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['mestre', 'referent', 'batuqueiro', 'bureau'],
      photoURL: '/brandings/logo-nachuva-girador.svg',
      avatarUrl: '/brandings/logo-nachuva-girador.svg',
      quizHistory: [
        {
          date: '2026-09-06T18:00:00.000Z',
          theme: 'toadas',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_toada_ria_do_norte',
          targetTitle: 'Toada da Ria do Norte',
          type: 'song',
          passed: true,
          toadaId: 'demo_doc_toada_ria_do_norte'
        },
        {
          date: '2026-09-07T18:30:00.000Z',
          theme: 'orixas',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_culture_iemanja',
          targetTitle: "Iemanjá, Reine des Marées et de l'Océan",
          type: 'sheet',
          passed: true
        },
        {
          date: '2026-09-08T19:00:00.000Z',
          theme: 'atelier',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_tuto_tension_cordages',
          targetTitle: "Matage et tension des cordages marins face à l'humidité saline",
          type: 'sheet',
          passed: true
        }
      ],
      evaluations: {
        demo_doc_toada_ria_do_norte: 'referent',
        demo_doc_toada_estrela_brilhante: 'referent',
        demo_doc_tuto_tension_cordages: 'referent',
        demo_doc_culture_iemanja: 'referent'
      }
    },

    // 2. Malo Kergourlay (Trésorier, Référent Lutherie, Alfaia Marcante - À jour)
    {
      id: 'demo_user_malo_kergourlay',
      uid: 'demo_user_malo_kergourlay',
      nom: 'Kergourlay',
      prenom: 'Malo',
      surnom: "L'Artisan",
      displayName: 'Malo Kergourlay',
      email: 'malo.kergourlay@maracatu-nachuva.bzh',
      telephone: '06 11 22 33 44',
      role: 'admin',
      isMestre: false,
      instrumentsJoues: ['Alfaia Marcante', 'Alfaia Meião'],
      instrumentPrincipal: 'Alfaia Marcante',
      niveau: 'referent',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['tresorier', 'bureau', 'lutherie', 'batuqueiro', 'referent'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg',
      quizHistory: [
        {
          date: '2026-09-09T18:15:00.000Z',
          theme: 'toadas',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_toada_ria_do_norte',
          targetTitle: 'Toada da Ria do Norte',
          type: 'song',
          passed: true,
          toadaId: 'demo_doc_toada_ria_do_norte'
        },
        {
          date: '2026-09-10T19:00:00.000Z',
          theme: 'atelier',
          difficulty: 'medium',
          score: 3,
          total: 4,
          targetId: 'demo_doc_tuto_tension_cordages',
          targetTitle: "Matage et tension des cordages marins face à l'humidité saline",
          type: 'sheet',
          passed: true
        }
      ],
      evaluations: {
        demo_doc_toada_ria_do_norte: 'alaise',
        demo_doc_tuto_tension_cordages: 'alaise'
      }
    },

    // 3. Rozenn Le Guen (Secrétaire, Caixa - À jour)
    {
      id: 'demo_user_rozenn_leguen',
      uid: 'demo_user_rozenn_leguen',
      nom: 'Le Guen',
      prenom: 'Rozenn',
      surnom: 'La Vigie',
      displayName: 'Rozenn Le Guen',
      email: 'rozenn.leguen@maracatu-nachuva.bzh',
      telephone: '06 22 33 44 55',
      role: 'admin',
      isMestre: false,
      instrumentsJoues: ['Caixa', 'Gonguê'],
      instrumentPrincipal: 'Caixa',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56410',
      adresseVille: 'Étel',
      tags: ['secretaire', 'bureau', 'batuqueiro'],
      photoURL: '/icones/caixa.svg',
      avatarUrl: '/icones/caixa.svg',
      quizHistory: [
        {
          date: '2026-09-11T17:45:00.000Z',
          theme: 'toadas',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_toada_estrela_brilhante',
          targetTitle: 'Baque da Estrela Brilhante',
          type: 'song',
          passed: true,
          toadaId: 'demo_doc_toada_estrela_brilhante'
        },
        {
          date: '2026-09-12T18:20:00.000Z',
          theme: 'orixas',
          difficulty: 'medium',
          score: 4,
          total: 4,
          targetId: 'demo_doc_culture_iemanja',
          targetTitle: "Iemanjá, Reine des Marées et de l'Océan",
          type: 'sheet',
          passed: true
        }
      ],
      evaluations: {
        demo_doc_toada_estrela_brilhante: 'alaise',
        demo_doc_culture_iemanja: 'referent'
      }
    },

    // 4. Yann-Bento Guégan (Alfaia Marcante - À jour)
    {
      id: 'demo_user_yann_bento',
      uid: 'demo_user_yann_bento',
      nom: 'Guégan',
      prenom: 'Yann-Bento',
      surnom: 'Bento',
      displayName: 'Yann-Bento Guégan',
      email: 'yann-bento.guegan@maracatu-nachuva.bzh',
      telephone: '06 33 44 55 66',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Alfaia Marcante', 'Tarol'],
      instrumentPrincipal: 'Alfaia Marcante',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Belz',
      tags: ['batuqueiro', 'covoit'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg',
      quizHistory: [
        {
          date: '2026-09-13T16:30:00.000Z',
          theme: 'toadas',
          difficulty: 'medium',
          score: 3,
          total: 4,
          targetId: 'demo_doc_toada_ria_do_norte',
          targetTitle: 'Toada da Ria do Norte',
          type: 'song',
          passed: true,
          toadaId: 'demo_doc_toada_ria_do_norte'
        }
      ],
      evaluations: {
        demo_doc_toada_ria_do_norte: 'pratique'
      }
    },

    // 5. Gurvan Cariou (Alfaia Marcante, prêt asso: true - En attente)
    {
      id: 'demo_user_gurvan_cariou',
      uid: 'demo_user_gurvan_cariou',
      nom: 'Cariou',
      prenom: 'Gurvan',
      surnom: 'Gugu',
      displayName: 'Gurvan Cariou',
      email: 'gurvan.cariou@maracatu-nachuva.bzh',
      telephone: '06 44 55 66 77',
      role: 'membre',
      isMestre: false,
      pretAsso: true,
      instrumentsJoues: ['Alfaia Marcante'],
      instrumentPrincipal: 'Alfaia Marcante',
      niveau: 'intermediaire',
      cotisationStatut: 'en_attente',
      cotisationStatus: 'en_attente',
      paymentStatus: 'unpaid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56680',
      adresseVille: 'Plouhinec',
      tags: ['batuqueiro'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg'
    },

    // 6. Ronan Le Bihan (Alfaia Meião - À jour)
    {
      id: 'demo_user_ronan_lebihan',
      uid: 'demo_user_ronan_lebihan',
      nom: 'Le Bihan',
      prenom: 'Ronan',
      surnom: 'Bihan',
      displayName: 'Ronan Le Bihan',
      email: 'ronan.lebihan@maracatu-nachuva.bzh',
      telephone: '06 55 66 77 88',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Alfaia Meião', 'Alfaia Marcante'],
      instrumentPrincipal: 'Alfaia Meião',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56400',
      adresseVille: 'Auray',
      tags: ['batuqueiro'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg'
    },

    // 7. Titouan Morel (Alfaia Meião - À jour)
    {
      id: 'demo_user_titouan_morel',
      uid: 'demo_user_titouan_morel',
      nom: 'Morel',
      prenom: 'Titouan',
      surnom: 'Ti-Morel',
      displayName: 'Titouan Morel',
      email: 'titouan.morel@maracatu-nachuva.bzh',
      telephone: '06 66 77 88 99',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Alfaia Meião'],
      instrumentPrincipal: 'Alfaia Meião',
      niveau: 'intermediaire',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56690',
      adresseVille: 'Landévant',
      tags: ['batuqueiro'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg'
    },

    // 8. Brieuc Jaffré (Alfaia Repique - À jour)
    {
      id: 'demo_user_brieuc_jaffre',
      uid: 'demo_user_brieuc_jaffre',
      nom: 'Jaffré',
      prenom: 'Brieuc',
      surnom: 'Briac',
      displayName: 'Brieuc Jaffré',
      email: 'brieuc.jaffre@maracatu-nachuva.bzh',
      telephone: '06 77 88 99 00',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Alfaia Repique', 'Tarol'],
      instrumentPrincipal: 'Alfaia Repique',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56100',
      adresseVille: 'Lorient',
      tags: ['batuqueiro'],
      photoURL: '/icones/alfaia.svg',
      avatarUrl: '/icones/alfaia.svg'
    },

    // 9. Soig-Tiago Kersauson (Référent Caixa - À jour)
    {
      id: 'demo_user_soig_tiago',
      uid: 'demo_user_soig_tiago',
      nom: 'Kersauson',
      prenom: 'Soig-Tiago',
      surnom: 'Tiago',
      displayName: 'Soig-Tiago Kersauson',
      email: 'soig-tiago.kersauson@maracatu-nachuva.bzh',
      telephone: '06 88 99 00 11',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Caixa', 'Tarol'],
      instrumentPrincipal: 'Caixa',
      niveau: 'referent',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['batuqueiro', 'referent'],
      photoURL: '/icones/caixa.svg',
      avatarUrl: '/icones/caixa.svg'
    },

    // 10. Anaïs Rio (Caixa - À jour)
    {
      id: 'demo_user_anais_rio',
      uid: 'demo_user_anais_rio',
      nom: 'Rio',
      prenom: 'Anaïs',
      surnom: 'Naïg',
      displayName: 'Anaïs Rio',
      email: 'anais.rio@maracatu-nachuva.bzh',
      telephone: '06 99 00 11 22',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Caixa'],
      instrumentPrincipal: 'Caixa',
      niveau: 'intermediaire',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56400',
      adresseVille: 'Auray',
      tags: ['batuqueiro'],
      photoURL: '/icones/caixa.svg',
      avatarUrl: '/icones/caixa.svg'
    },

    // 11. Gwendal Tanguy (Caixa - À jour)
    {
      id: 'demo_user_gwendal_tanguy',
      uid: 'demo_user_gwendal_tanguy',
      nom: 'Tanguy',
      prenom: 'Gwendal',
      surnom: 'Gwen',
      displayName: 'Gwendal Tanguy',
      email: 'gwendal.tanguy@maracatu-nachuva.bzh',
      telephone: '06 02 13 24 35',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Caixa', 'Alfaia Meião'],
      instrumentPrincipal: 'Caixa',
      niveau: 'debutant',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56400',
      adresseVille: 'Ploemel',
      tags: ['batuqueiro'],
      photoURL: '/icones/caixa.svg',
      avatarUrl: '/icones/caixa.svg'
    },

    // 12. Youenn-Caboclo Bellec (Gonguê, Mineiro - À jour)
    {
      id: 'demo_user_youenn_caboclo',
      uid: 'demo_user_youenn_caboclo',
      nom: 'Bellec',
      prenom: 'Youenn-Caboclo',
      surnom: 'Caboclo',
      displayName: 'Youenn-Caboclo Bellec',
      email: 'youenn-caboclo.bellec@maracatu-nachuva.bzh',
      telephone: '06 13 24 35 46',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Gonguê', 'Mineiro'],
      instrumentPrincipal: 'Gonguê',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['batuqueiro'],
      photoURL: '/icones/gongue.svg',
      avatarUrl: '/icones/gongue.svg'
    },

    // 13. Kelig Le Gall (Gonguê - À jour)
    {
      id: 'demo_user_kelig_legall',
      uid: 'demo_user_kelig_legall',
      nom: 'Le Gall',
      prenom: 'Kelig',
      surnom: 'Kelig',
      displayName: 'Kelig Le Gall',
      email: 'kelig.legall@maracatu-nachuva.bzh',
      telephone: '06 24 35 46 57',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Gonguê'],
      instrumentPrincipal: 'Gonguê',
      niveau: 'intermediaire',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Belz',
      tags: ['batuqueiro'],
      photoURL: '/icones/gongue.svg',
      avatarUrl: '/icones/gongue.svg'
    },

    // 14. Nolwenn-Iara Cariou (Référente Agbê - À jour)
    {
      id: 'demo_user_nolwenn_iara',
      uid: 'demo_user_nolwenn_iara',
      nom: 'Cariou',
      prenom: 'Nolwenn-Iara',
      surnom: 'Iara',
      displayName: 'Nolwenn-Iara Cariou',
      email: 'nolwenn-iara.cariou@maracatu-nachuva.bzh',
      telephone: '06 35 46 57 68',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Agbê', 'Gonguê'],
      instrumentPrincipal: 'Agbê',
      niveau: 'referent',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['batuqueiro', 'referent'],
      photoURL: '/icones/agbe.svg',
      avatarUrl: '/icones/agbe.svg'
    },

    // 15. Klervi Eveno (Agbê - À jour)
    {
      id: 'demo_user_klervi_eveno',
      uid: 'demo_user_klervi_eveno',
      nom: 'Eveno',
      prenom: 'Klervi',
      surnom: 'Klervi',
      displayName: 'Klervi Eveno',
      email: 'klervi.eveno@maracatu-nachuva.bzh',
      telephone: '06 46 57 68 79',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Agbê'],
      instrumentPrincipal: 'Agbê',
      niveau: 'intermediaire',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56340',
      adresseVille: 'Carnac',
      tags: ['batuqueiro'],
      photoURL: '/icones/agbe.svg',
      avatarUrl: '/icones/agbe.svg'
    },

    // 16. Maëlys Robic (Agbê - En attente)
    {
      id: 'demo_user_maelys_robic',
      uid: 'demo_user_maelys_robic',
      nom: 'Robic',
      prenom: 'Maëlys',
      surnom: 'Maë',
      displayName: 'Maëlys Robic',
      email: 'maelys.robic@maracatu-nachuva.bzh',
      telephone: '06 57 68 79 80',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Agbê', 'Mineiro'],
      instrumentPrincipal: 'Agbê',
      niveau: 'debutant',
      cotisationStatut: 'en_attente',
      cotisationStatus: 'en_attente',
      paymentStatus: 'unpaid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56410',
      adresseVille: 'Étel',
      tags: ['batuqueiro'],
      photoURL: '/icones/agbe.svg',
      avatarUrl: '/icones/agbe.svg'
    },

    // 17. Gaëlle-Dandara Le Gall (Dama do Paço, Danse - À jour)
    {
      id: 'demo_user_gaelle_dandara',
      uid: 'demo_user_gaelle_dandara',
      nom: 'Le Gall',
      prenom: 'Gaëlle-Dandara',
      surnom: 'Dandara',
      displayName: 'Gaëlle-Dandara Le Gall',
      email: 'gaelle-dandara.legall@maracatu-nachuva.bzh',
      telephone: '06 68 79 80 91',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: ['Agbê'],
      instrumentPrincipal: 'Danse',
      pratiqueDanse: true,
      niveauDanse: 'avance',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['danseur', 'dama-do-paco', 'costumerie'],
      photoURL: '/icones/danse.svg',
      avatarUrl: '/icones/danse.svg'
    },

    // 18. Solène Tanguy (Baiana, Danse - À jour)
    {
      id: 'demo_user_solene_tanguy',
      uid: 'demo_user_solene_tanguy',
      nom: 'Tanguy',
      prenom: 'Solène',
      surnom: 'Baiana Sol',
      displayName: 'Solène Tanguy',
      email: 'solene.tanguy@maracatu-nachuva.bzh',
      telephone: '06 79 80 91 02',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: [],
      instrumentPrincipal: 'Danse',
      pratiqueDanse: true,
      niveauDanse: 'intermediaire',
      niveau: 'intermediaire',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56400',
      adresseVille: 'Auray',
      tags: ['danseur', 'baiana'],
      photoURL: '/icones/danse.svg',
      avatarUrl: '/icones/danse.svg'
    },

    // 19. Alexandre Dréan (Porta-Estandarte, Danse - À jour)
    {
      id: 'demo_user_alexandre_drean',
      uid: 'demo_user_alexandre_drean',
      nom: 'Dréan',
      prenom: 'Alexandre',
      surnom: 'Alex Estandarte',
      displayName: 'Alexandre Dréan',
      email: 'alexandre.drean@maracatu-nachuva.bzh',
      telephone: '06 80 91 02 13',
      role: 'membre',
      isMestre: false,
      instrumentsJoues: [],
      instrumentPrincipal: 'Danse',
      pratiqueDanse: true,
      niveauDanse: 'avance',
      niveau: 'avance',
      cotisationStatut: 'a_jour',
      cotisationStatus: 'a_jour',
      paymentStatus: 'paid',
      adhesionBase: true,
      droitImage: true,
      aptitudeMedicale: true,
      groupId: DEMO_GROUP_ID,
      onboardingCompleted: true,
      isNew: false,
      adresseCP: '56550',
      adresseVille: 'Locoal-Mendon',
      tags: ['danseur', 'porta-estandarte'],
      photoURL: '/icones/danse.svg',
      avatarUrl: '/icones/danse.svg'
    }
  ],

  // 3. Événements (Répétition ordinaire et Concert d'Automne avec RSVP, covoiturage et plan de scène)
  events: [
    // Événement 1 — Répétition ordinaire (Hebdomadaire)
    {
      id: 'demo_event_repe_01',
      groupId: DEMO_GROUP_ID,
      titre: 'Répétition générale sous le Hangar',
      type: 'repetition',
      date: '2026-10-02',
      dateDebut: '2026-10-02T19:30:00',
      dateFin: '2026-10-02T22:00:00',
      lieu: "Hangar associatif de l'Isthme, Locoal-Mendon",
      isPublic: false,
      statut: 'a_venir',
      statutPublication: 'approuve',
      horairesPassages: '19h30 - 22h00',
      description: "Répétition d'ensemble hebdomadaire pour caler les viradas et la synchronisation cordes/percussions.",
      imageUrl: '/brandings/logo-nachuva-girador.svg',
      includesPercussion: true,
      includesDance: true,
      enableCarpool: false,
      enableInscriptions: true,
      programme: ['Toada da Ria', 'Baque de Luanda', 'Virada do Vento'],
      setlist: [
        {
          id: 'morceau_toada_ria',
          titre: 'Toada da Ria',
          notes: 'Tempo modéré, soigner l’attaque des alfaias marcantes'
        },
        {
          id: 'morceau_baque_luanda',
          titre: 'Baque de Luanda',
          notes: 'Virada rapide avec réponse des caixas'
        },
        {
          id: 'morceau_virada_vento',
          titre: 'Virada do Vento',
          notes: 'Final énergique avec tutti et roulements de repique'
        }
      ],
      // Inscriptions détaillées (14 présents, 3 absents avec motif, 2 en attente)
      inscriptions: [
        // 14 Présents
        {
          userId: 'demo_mestre_nachuva',
          userName: 'Mestre da Ria',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_malo_kergourlay',
          userName: 'Malo Kergourlay',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_rozenn_leguen',
          userName: 'Rozenn Le Guen',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_yann_bento',
          userName: 'Yann-Bento Guégan',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_gurvan_cariou',
          userName: 'Gurvan Cariou',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_ronan_lebihan',
          userName: 'Ronan Le Bihan',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Meião'
        },
        {
          userId: 'demo_user_titouan_morel',
          userName: 'Titouan Morel',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Meião'
        },
        {
          userId: 'demo_user_brieuc_jaffre',
          userName: 'Brieuc Jaffré',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Repique'
        },
        {
          userId: 'demo_user_soig_tiago',
          userName: 'Soig-Tiago Kersauson',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_anais_rio',
          userName: 'Anaïs Rio',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_youenn_caboclo',
          userName: 'Youenn-Caboclo Bellec',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Gonguê'
        },
        {
          userId: 'demo_user_nolwenn_iara',
          userName: 'Nolwenn-Iara Cariou',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Agbê'
        },
        {
          userId: 'demo_user_klervi_eveno',
          userName: 'Klervi Eveno',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Agbê'
        },
        {
          userId: 'demo_user_gaelle_dandara',
          userName: 'Gaëlle-Dandara Le Gall',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Danse'
        },
        // 3 Absents avec motif explicite
        {
          userId: 'demo_user_gwendal_tanguy',
          userName: 'Gwendal Tanguy',
          status: 'absent',
          motifRefus: "Garde d'astreinte pompier volontaire",
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_kelig_legall',
          userName: 'Kelig Le Gall',
          status: 'absent',
          motifRefus: 'Déplacement professionnel à Quimper',
          instrumentChoisi: 'Gonguê'
        },
        {
          userId: 'demo_user_maelys_robic',
          userName: 'Maëlys Robic',
          status: 'absent',
          motifRefus: 'Examen universitaire le lendemain matin',
          instrumentChoisi: 'Agbê'
        },
        // 2 En attente de confirmation
        {
          userId: 'demo_user_solene_tanguy',
          userName: 'Solène Tanguy',
          status: 'confirm',
          instrumentChoisi: 'Danse'
        },
        {
          userId: 'demo_user_alexandre_drean',
          userName: 'Alexandre Dréan',
          status: 'confirm',
          instrumentChoisi: 'Danse'
        }
      ],
      attendees: {
        demo_mestre_nachuva: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_malo_kergourlay: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_rozenn_leguen: { statut: 'present', instrument: 'Caixa' },
        demo_user_yann_bento: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_gurvan_cariou: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_ronan_lebihan: { statut: 'present', instrument: 'Alfaia Meião' },
        demo_user_titouan_morel: { statut: 'present', instrument: 'Alfaia Meião' },
        demo_user_brieuc_jaffre: { statut: 'present', instrument: 'Alfaia Repique' },
        demo_user_soig_tiago: { statut: 'present', instrument: 'Caixa' },
        demo_user_anais_rio: { statut: 'present', instrument: 'Caixa' },
        demo_user_gwendal_tanguy: { statut: 'absent', motif: "Garde d'astreinte pompier volontaire" },
        demo_user_youenn_caboclo: { statut: 'present', instrument: 'Gonguê' },
        demo_user_kelig_legall: { statut: 'absent', motif: 'Déplacement professionnel à Quimper' },
        demo_user_nolwenn_iara: { statut: 'present', instrument: 'Agbê' },
        demo_user_klervi_eveno: { statut: 'present', instrument: 'Agbê' },
        demo_user_maelys_robic: { statut: 'absent', motif: 'Examen universitaire le lendemain matin' },
        demo_user_gaelle_dandara: { statut: 'present', instrument: 'Danse' },
        demo_user_solene_tanguy: { statut: 'a_confirmer', instrument: 'Danse' },
        demo_user_alexandre_drean: { statut: 'a_confirmer', instrument: 'Danse' }
      }
    },

    // Événement 2 — Prestation publique (Temps fort)
    {
      id: 'demo_event_concert_01',
      groupId: DEMO_GROUP_ID,
      titre: "Concert d'Automne — Fête de la Ria",
      type: 'prestation',
      subType: 'concert',
      date: '2026-10-24',
      dateDebut: '2026-10-24T16:00:00',
      dateFin: '2026-10-24T23:30:00',
      lieu: "Cale de Pen Mané, Ria d'Étel",
      isPublic: true,
      description: "Cortejo d'ouverture et set scénique face à la ria. Tenue officielle : chemise blanche et rubans ocres.",
      tenueRequise: 'Chemise blanche et rubans ocres',
      horairesPassages: '17h30 (Cortejo) • 21h00 (Set scénique face à la ria)',
      statut: 'a_venir',
      statutPublication: 'approuve',
      cachet: 1500,
      imageUrl: '/brandings/logo-nachuva-girador.svg',
      includesPercussion: true,
      includesDance: true,
      enableCarpool: true,
      distanceAllerRetourKm: 42,
      enableInscriptions: true,
      isStageLayoutPublished: true,

      // Covoiturage configuré avec 3 véhicules
      covoiturage: {
        voitures: [
          {
            id: 'voiture_yann_bento',
            chauffeurId: 'demo_user_yann_bento',
            chauffeurNom: 'Yann-Bento Guégan',
            lieuDepart: 'Auray (Gare)',
            passengerSeats: 4,
            trunkAlfayaCapacity: 3,
            materielCharge: '3 alfaias',
            materielTransporte: 'Alfaias Marcantes & Caixas',
            passengers: [
              {
                uid: 'demo_user_yann_bento',
                nom: 'Yann-Bento Guégan',
                isPassenger: true,
                alfayasCount: 1,
                instrument: 'Alfaia Marcante'
              },
              {
                uid: 'demo_user_rozenn_leguen',
                nom: 'Rozenn Le Guen',
                isPassenger: true,
                alfayasCount: 0,
                instrument: 'Caixa'
              },
              {
                uid: 'demo_user_gurvan_cariou',
                nom: 'Gurvan Cariou',
                isPassenger: true,
                alfayasCount: 1,
                instrument: 'Alfaia Marcante'
              }
            ]
          },
          {
            id: 'voiture_malo_kergourlay',
            chauffeurId: 'demo_user_malo_kergourlay',
            chauffeurNom: 'Malo Kergourlay',
            lieuDepart: 'Hennebont',
            passengerSeats: 5,
            trunkAlfayaCapacity: 4,
            materielCharge: '4 alfaias',
            materielTransporte: 'Alfaias Marcantes & Meiões',
            passengers: [
              {
                uid: 'demo_user_malo_kergourlay',
                nom: 'Malo Kergourlay',
                isPassenger: true,
                alfayasCount: 1,
                instrument: 'Alfaia Marcante'
              },
              {
                uid: 'demo_user_ronan_lebihan',
                nom: 'Ronan Le Bihan',
                isPassenger: true,
                alfayasCount: 1,
                instrument: 'Alfaia Meião'
              },
              {
                uid: 'demo_user_titouan_morel',
                nom: 'Titouan Morel',
                isPassenger: true,
                alfayasCount: 1,
                instrument: 'Alfaia Meião'
              },
              {
                uid: 'demo_user_soig_tiago',
                nom: 'Soig-Tiago Kersauson',
                isPassenger: true,
                alfayasCount: 0,
                instrument: 'Caixa'
              }
            ]
          },
          {
            id: 'voiture_gaelle_dandara',
            chauffeurId: 'demo_user_gaelle_dandara',
            chauffeurNom: 'Gaëlle-Dandara Le Gall',
            lieuDepart: 'Lorient',
            passengerSeats: 4,
            trunkAlfayaCapacity: 0,
            materielCharge: 'Malles costumes, calunga, estandarte',
            materielTransporte: 'Matériel Danse & Estandarte',
            passengers: [
              {
                uid: 'demo_user_gaelle_dandara',
                nom: 'Gaëlle-Dandara Le Gall',
                isPassenger: true,
                alfayasCount: 0,
                instrument: 'Danse'
              },
              {
                uid: 'demo_user_solene_tanguy',
                nom: 'Solène Tanguy',
                isPassenger: true,
                alfayasCount: 0,
                instrument: 'Danse'
              },
              {
                uid: 'demo_user_alexandre_drean',
                nom: 'Alexandre Dréan',
                isPassenger: true,
                alfayasCount: 0,
                instrument: 'Danse'
              }
            ]
          }
        ],
        recherchePlace: []
      },

      // Plan de scène avec grille (Devant: Danse/Agbês, Médian: Caixas/Gonguês, Fond: Alfaias, Mestre au centre)
      stageLayout: {
        rows: 3,
        cols: 6,
        danceRows: 1,
        danceCols: 5,
        placements: {
          // Case Mestre réservée { row: 0, col: 0 }
          demo_mestre_nachuva: { row: 0, col: 0, voice: 'marcante' },

          // Avant-scène Danse (row: -1)
          demo_user_solene_tanguy: { row: -1, col: 1 },
          demo_user_gaelle_dandara: { row: -1, col: 3 },
          demo_user_alexandre_drean: { row: -1, col: 5 },

          // Rang 1 (Devant scène / Sementes) : Les 3 Agbês
          demo_user_nolwenn_iara: { row: 1, col: 2 },
          demo_user_klervi_eveno: { row: 1, col: 3 },
          demo_user_maelys_robic: { row: 1, col: 4 },

          // Rang 2 (Médian) : Caixas & Gonguês
          demo_user_youenn_caboclo: { row: 2, col: 1 },
          demo_user_kelig_legall: { row: 2, col: 2 },
          demo_user_soig_tiago: { row: 2, col: 3, voice: 'caixa' },
          demo_user_anais_rio: { row: 2, col: 4, voice: 'caixa' },
          demo_user_gwendal_tanguy: { row: 2, col: 5, voice: 'caixa' },
          demo_user_rozenn_leguen: { row: 2, col: 6, voice: 'caixa' },

          // Rang 3 (Fond de scène) : Alfaias Marcantes, Meiões, Repiques
          demo_user_malo_kergourlay: { row: 3, col: 1, voice: 'marcante' },
          demo_user_yann_bento: { row: 3, col: 2, voice: 'marcante' },
          demo_user_gurvan_cariou: { row: 3, col: 3, voice: 'marcante' },
          demo_user_ronan_lebihan: { row: 3, col: 4, voice: 'meião' },
          demo_user_titouan_morel: { row: 3, col: 5, voice: 'meião' },
          demo_user_brieuc_jaffre: { row: 3, col: 6, voice: 'repique' }
        }
      },

      // Inscriptions pour les 17 membres présents confirmés
      inscriptions: [
        {
          userId: 'demo_mestre_nachuva',
          userName: 'Mestre da Ria',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_malo_kergourlay',
          userName: 'Malo Kergourlay',
          status: 'present',
          transport: 'propose_voiture',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_rozenn_leguen',
          userName: 'Rozenn Le Guen',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_yann_bento',
          userName: 'Yann-Bento Guégan',
          status: 'present',
          transport: 'propose_voiture',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_gurvan_cariou',
          userName: 'Gurvan Cariou',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Alfaia Marcante'
        },
        {
          userId: 'demo_user_ronan_lebihan',
          userName: 'Ronan Le Bihan',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Alfaia Meião'
        },
        {
          userId: 'demo_user_titouan_morel',
          userName: 'Titouan Morel',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Alfaia Meião'
        },
        {
          userId: 'demo_user_brieuc_jaffre',
          userName: 'Brieuc Jaffré',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Alfaia Repique'
        },
        {
          userId: 'demo_user_soig_tiago',
          userName: 'Soig-Tiago Kersauson',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_anais_rio',
          userName: 'Anaïs Rio',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_gwendal_tanguy',
          userName: 'Gwendal Tanguy',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Caixa'
        },
        {
          userId: 'demo_user_youenn_caboclo',
          userName: 'Youenn-Caboclo Bellec',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Gonguê'
        },
        {
          userId: 'demo_user_kelig_legall',
          userName: 'Kelig Le Gall',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Gonguê'
        },
        {
          userId: 'demo_user_nolwenn_iara',
          userName: 'Nolwenn-Iara Cariou',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Agbê'
        },
        {
          userId: 'demo_user_klervi_eveno',
          userName: 'Klervi Eveno',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Agbê'
        },
        {
          userId: 'demo_user_maelys_robic',
          userName: 'Maëlys Robic',
          status: 'present',
          transport: 'autonome',
          instrumentChoisi: 'Agbê'
        },
        {
          userId: 'demo_user_gaelle_dandara',
          userName: 'Gaëlle-Dandara Le Gall',
          status: 'present',
          transport: 'propose_voiture',
          instrumentChoisi: 'Danse'
        },
        {
          userId: 'demo_user_solene_tanguy',
          userName: 'Solène Tanguy',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Danse'
        },
        {
          userId: 'demo_user_alexandre_drean',
          userName: 'Alexandre Dréan',
          status: 'present',
          transport: 'cherche_place',
          instrumentChoisi: 'Danse'
        }
      ],
      attendees: {
        demo_mestre_nachuva: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_malo_kergourlay: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_rozenn_leguen: { statut: 'present', instrument: 'Caixa' },
        demo_user_yann_bento: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_gurvan_cariou: { statut: 'present', instrument: 'Alfaia Marcante' },
        demo_user_ronan_lebihan: { statut: 'present', instrument: 'Alfaia Meião' },
        demo_user_titouan_morel: { statut: 'present', instrument: 'Alfaia Meião' },
        demo_user_brieuc_jaffre: { statut: 'present', instrument: 'Alfaia Repique' },
        demo_user_soig_tiago: { statut: 'present', instrument: 'Caixa' },
        demo_user_anais_rio: { statut: 'present', instrument: 'Caixa' },
        demo_user_gwendal_tanguy: { statut: 'present', instrument: 'Caixa' },
        demo_user_youenn_caboclo: { statut: 'present', instrument: 'Gonguê' },
        demo_user_kelig_legall: { statut: 'present', instrument: 'Gonguê' },
        demo_user_nolwenn_iara: { statut: 'present', instrument: 'Agbê' },
        demo_user_klervi_eveno: { statut: 'present', instrument: 'Agbê' },
        demo_user_maelys_robic: { statut: 'present', instrument: 'Agbê' },
        demo_user_gaelle_dandara: { statut: 'present', instrument: 'Danse' },
        demo_user_solene_tanguy: { statut: 'present', instrument: 'Danse' },
        demo_user_alexandre_drean: { statut: 'present', instrument: 'Danse' }
      }
    },

    // Événement 3 — Assemblée Générale Ordinaire (Rentrée 2026)
    {
      id: 'demo_event_ag_rentree_2026',
      groupId: DEMO_GROUP_ID,
      titre: "Assemblée Générale Ordinaire — Rentrée 2026",
      type: 'reunion',
      date: '2026-09-05',
      dateDebut: '2026-09-05T18:30:00',
      dateFin: '2026-09-05T21:00:00',
      heureDebut: '18:30',
      heureFin: '21:00',
      duree: 2.5,
      lieu: "Salle polyvalente de l'Isthme, Locoal-Mendon",
      isPublic: false,
      statut: 'termine',
      status: 'termine',
      statutPublication: 'approuve',
      compteRenduStatus: 'publie',
      description: "Assemblée Générale de rentrée : bilan moral, approbation des comptes annuels, budget prévisionnel matériel étanche et calendrier des sorties de la Ria.",
      imageUrl: '/brandings/logo-nachuva-girador.svg',
      ordreDuJour: [
        'Rapport moral du Mestre da Ria',
        'Bilan financier et approbation des comptes par Malo Kergourlay',
        'Vote du budget prévisionnel : confection des housses d\'alfaias en toile cirée jaune et peaux de chèvre',
        'Calendrier des sorties : Fête de la Ria et ateliers de fabrication'
      ],
      pointsOrdreDuJour: [
        {
          id: 'pt_1',
          titre: 'Rapport moral du Mestre da Ria',
          notesCR: "Bilan positif de la saison écoulée avec un effectif consolidé de 19 adhérents investis sur l'ensemble des pupitres. La dynamique collective autour des répétitions à l'Isthme de Locoal-Mendon et l'accueil des nouveaux batuqueiros témoignent de la vitalité du baque en terre morbihannaise."
        },
        {
          id: 'pt_2',
          titre: 'Bilan financier et approbation des comptes par Malo Kergourlay',
          notesCR: "Présentation des comptes de l'exercice : les recettes s'élèvent à 2 240,00 € (cotisations, acompte de prestation et subvention) pour 1 035,00 € de dépenses d'exploitation (matériel étanche, peaux de chèvre et assurance). Le solde de gestion dégage un excédent net de +1 205,00 €, permettant de consolider la trésorerie de sécurité."
        },
        {
          id: 'pt_3',
          titre: "Vote du budget prévisionnel : confection des housses d'alfaias en toile cirée jaune et peaux de chèvre",
          notesCR: "Approbation de l'investissement de 450,00 € pour la confection de 12 housses protectrices en toile cirée jaune imperméable face aux embruns marins, et 275,00 € pour le renouvellement des peaux de chèvre et cordages de lutherie."
        },
        {
          id: 'pt_4',
          titre: 'Calendrier des sorties : Fête de la Ria et ateliers de fabrication',
          notesCR: "Confirmation de la prestation phare du 24 octobre à la Cale de Pen Mané (Fête de la Ria d'Étel) avec cortejo et set scénique. Organisation de sessions de matage de cordages et confection bénévole au Hangar."
        }
      ],
      resolutions: [
        { titre: 'Approbation des comptes 2025-2026', vote: 'Unanimité (19 voix pour)' },
        { titre: 'Acquisition des équipements étanches pour pupitre percussions', vote: 'Unanimité (19 voix pour)' }
      ],
      quorum: '16 membres présents, 3 représentés — Quorum atteint (100 %)',
      inscriptions: [
        { userId: 'demo_mestre_nachuva', userName: 'Mestre da Ria', status: 'present' },
        { userId: 'demo_user_malo_kergourlay', userName: 'Malo Kergourlay', status: 'present' },
        { userId: 'demo_user_rozenn_leguen', userName: 'Rozenn Le Guen', status: 'present' },
        { userId: 'demo_user_yann_bento', userName: 'Yann-Bento Guégan', status: 'present' },
        { userId: 'demo_user_gurvan_cariou', userName: 'Gurvan Cariou', status: 'excuse', notes: 'Pouvoir remis au Mestre da Ria' },
        { userId: 'demo_user_ronan_lebihan', userName: 'Ronan Le Bihan', status: 'present' },
        { userId: 'demo_user_titouan_morel', userName: 'Titouan Morel', status: 'excuse', notes: 'Pouvoir remis à Ronan Le Bihan' },
        { userId: 'demo_user_brieuc_jaffre', userName: 'Brieuc Jaffré', status: 'present' },
        { userId: 'demo_user_soig_tiago', userName: 'Soïg Tiago', status: 'present' },
        { userId: 'demo_user_anais_rio', userName: 'Anaïs Rio', status: 'present' },
        { userId: 'demo_user_gwendal_tanguy', userName: 'Gwendal Tanguy', status: 'excuse', notes: 'Pouvoir remis à Rozenn Le Guen' },
        { userId: 'demo_user_youenn_caboclo', userName: 'Youenn Caboclo', status: 'present' },
        { userId: 'demo_user_kelig_legall', userName: 'Kelig Le Gall', status: 'present' },
        { userId: 'demo_user_nolwenn_iara', userName: 'Nolwenn Iara', status: 'present' },
        { userId: 'demo_user_klervi_eveno', userName: 'Klervi Eveno', status: 'present' },
        { userId: 'demo_user_maelys_robic', userName: 'Maëlys Robic', status: 'present' },
        { userId: 'demo_user_gaelle_dandara', userName: 'Gaëlle Dandara', status: 'present' },
        { userId: 'demo_user_solene_tanguy', userName: 'Solène Tanguy', status: 'present' },
        { userId: 'demo_user_alexandre_drean', userName: 'Alexandre Dréan', status: 'present' }
      ]
    }
  ],

  // 4. Trésorerie (Solde fictif : 2 850 € = 2 100 + 1 200 - 450)
  treasury: [
    {
      id: 'demo_tx_initial',
      groupId: DEMO_GROUP_ID,
      titre: 'Report de solde saison précédente',
      description: "Solde créditeur au démarrage de l'exercice",
      montant: 2100,
      type: 'recette',
      categorie: 'Cotisations',
      date: '2026-09-01',
      statut: 'valide',
      timestamp: createDemoTimestamp('2026-09-01T10:00:00.000Z')
    },
    {
      id: 'demo_tx_prestation',
      groupId: DEMO_GROUP_ID,
      titre: "Recette prestation fête maritime d'Étel",
      description: "Acompte d'engagement versé par le comité des fêtes de la ria",
      montant: 1200,
      type: 'recette',
      categorie: 'Prestations',
      date: '2026-09-05',
      statut: 'valide',
      timestamp: createDemoTimestamp('2026-09-05T14:30:00.000Z')
    },
    {
      id: 'demo_tx_housses',
      groupId: DEMO_GROUP_ID,
      titre: "Housses d'alfaias en toile cirée jaune imperméable",
      description: 'Confection sur mesure pour protéger les peaux animales des embruns salins',
      montant: -450,
      type: 'depense',
      categorie: 'Matériel',
      date: '2026-09-12',
      statut: 'valide',
      timestamp: createDemoTimestamp('2026-09-12T16:00:00.000Z')
    }
  ],

  // 5. Varal culturel & pédagogique
  varal: [
    {
      id: 'demo_varal_toada',
      groupId: DEMO_GROUP_ID,
      titre: 'Toada da Ria do Norte',
      category: 'toadas',
      type: 'toada',
      description: "Toada traditionnelle du domaine public adaptée aux marées et brumes de la Ria d'Étel.",
      paroles: "Ó marinheiro, olha a onda do mar...\nNa Ria de Étel o baque vai ecoar!\nQuando o crachin cai na beira do cais,\nO Maracatu Na Chuva não para jamais.",
      auteur: 'Domaine Public / Maracatu Na Chuva',
      tags: ['toada', 'chant', 'maracatu', 'bretagne'],
      date: '2026-09-01',
      timestamp: createDemoTimestamp('2026-09-01T12:00:00.000Z')
    },
    {
      id: 'demo_varal_lutherie',
      groupId: DEMO_GROUP_ID,
      titre: 'Tension des cordages marins sur alfaias en milieu humide',
      category: 'lutherie',
      type: 'tutoriel',
      description: "Guide technique : comment maintenir la tension des peaux de chèvre face aux variations hygrométriques de l'isthme.",
      contenu: "Recommandations : Utiliser un cordage polypropylène imputrescible à faible allongement (drisse 6mm) et veiller à retendre les clés de tension après chaque sortie côtière.",
      tags: ['lutherie', 'alfaia', 'cordage', 'entretien'],
      date: '2026-09-03',
      timestamp: createDemoTimestamp('2026-09-03T15:00:00.000Z')
    }
  ],

  // 6. Inventaire des instruments
  inventory: [
    {
      id: 'demo_inv_alfaia_1',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia 22" - Mor Braz',
      type: 'Alfaia',
      taille: '22"',
      etat: 'bon',
      notes: 'Fût en contreplaqué marin, peau de chèvre épaisse.',
      assigneA: 'demo_mestre_nachuva'
    },
    {
      id: 'demo_inv_alfaia_2',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia 20" - Étel',
      type: 'Alfaia',
      taille: '20"',
      etat: 'tres_bon',
      notes: 'Toile cirée jaune étanche.',
      assigneA: 'demo_user_yann_bento'
    },
    {
      id: 'demo_inv_alfaia_3',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia 20" - Prêt Asso Isthme',
      type: 'Alfaia',
      taille: '20"',
      etat: 'bon',
      notes: "Instrument d'initiation prêté pour la saison.",
      assigneA: 'demo_user_gurvan_cariou'
    },
    {
      id: 'demo_inv_alfaia_4',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia Meião 18" - Saint-Cado',
      type: 'Alfaia',
      taille: '18"',
      etat: 'tres_bon',
      assigneA: 'demo_user_ronan_lebihan'
    },
    {
      id: 'demo_inv_alfaia_5',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia Repique 16" - Crachin',
      type: 'Alfaia',
      taille: '16"',
      etat: 'bon',
      assigneA: 'demo_user_brieuc_jaffre'
    },
    {
      id: 'demo_inv_caixa_1',
      groupId: DEMO_GROUP_ID,
      nom: 'Caixa 14" - Timbre Inox',
      type: 'Caixa',
      taille: '14"',
      etat: 'tres_bon',
      assigneA: 'demo_user_soig_tiago'
    },
    {
      id: 'demo_inv_caixa_2',
      groupId: DEMO_GROUP_ID,
      nom: 'Caixa 14" - Belz',
      type: 'Caixa',
      taille: '14"',
      etat: 'bon',
      assigneA: 'demo_user_anais_rio'
    },
    {
      id: 'demo_inv_gongue_1',
      groupId: DEMO_GROUP_ID,
      nom: 'Gonguê Campana Lourde',
      type: 'Gonguê',
      etat: 'tres_bon',
      assigneA: 'demo_user_youenn_caboclo'
    },
    {
      id: 'demo_inv_agbe_1',
      groupId: DEMO_GROUP_ID,
      nom: 'Agbê Calebasse Ostréicole',
      type: 'Agbê',
      etat: 'bon',
      assigneA: 'demo_user_nolwenn_iara'
    }
  ],

  // 7. Modèles d'instruments (Varal Lutherie)
  instrumentModels: [
    {
      id: 'demo_model_alfaia_maracatu',
      groupId: DEMO_GROUP_ID,
      nom: 'Alfaia Maracatu Côtière',
      category: 'percussions',
      description: 'Tambour traditionnel du Maracatu de Baque Virado adapté aux conditions maritimes.',
      dimensions: 'Diamètre 20" - Hauteur 45cm',
      materiaux: 'Fût bois léger, peaux naturelles, cordages marins 6mm'
    }
  ],

  // 8. Canaux de discussion Porte-voix
  forumChannels: [
    {
      id: 'demo_channel_general',
      groupId: DEMO_GROUP_ID,
      nom: 'général',
      description: 'Discussions générales de Maracatu Na Chuva',
      isDefault: true
    },
    {
      id: 'demo_channel_covoit',
      groupId: DEMO_GROUP_ID,
      nom: 'covoiturage-ria',
      description: 'Coordination des transports pour les prestations et répétitions',
      isDefault: false
    }
  ],

  // 9. Réunions
  reunions: [
    {
      id: 'demo_reunion_ca',
      groupId: DEMO_GROUP_ID,
      titre: "Conseil d'équipage — Saison 2026/2027",
      date: '2026-09-02',
      ordreDuJour: 'Validation du budget cirés, calendrier des sorties sur la Ria et accueil des nouveaux arrivants.',
      statut: 'termine'
    },
    {
      id: 'demo_doc_pv_ag_rentree_2026',
      groupId: DEMO_GROUP_ID,
      titre: "Assemblée Générale Ordinaire — Rentrée 2026",
      type: 'reunion',
      date: '2026-09-05',
      dateDebut: '2026-09-05T18:30:00',
      dateFin: '2026-09-05T21:00:00',
      heureDebut: '18:30',
      heureFin: '21:00',
      duree: 2.5,
      lieu: "Salle polyvalente de l'Isthme, Locoal-Mendon",
      ordreDuJour: [
        'Rapport moral du Mestre da Ria',
        'Bilan financier et approbation des comptes par Malo Kergourlay',
        'Vote du budget prévisionnel : confection des housses d\'alfaias en toile cirée jaune et peaux de chèvre',
        'Calendrier des sorties : Fête de la Ria et ateliers de fabrication'
      ],
      pointsOrdreDuJour: [
        {
          id: 'pt_1',
          titre: 'Rapport moral du Mestre da Ria',
          notesCR: "Bilan positif de la saison écoulée avec un effectif consolidé de 19 adhérents investis sur l'ensemble des pupitres. La dynamique collective autour des répétitions à l'Isthme de Locoal-Mendon et l'accueil des nouveaux batuqueiros témoignent de la vitalité du baque en terre morbihannaise."
        },
        {
          id: 'pt_2',
          titre: 'Bilan financier et approbation des comptes par Malo Kergourlay',
          notesCR: "Présentation des comptes de l'exercice : les recettes s'élèvent à 2 240,00 € (cotisations, acompte de prestation et subvention) pour 1 035,00 € de dépenses d'exploitation (matériel étanche, peaux de chèvre et assurance). Le solde de gestion dégage un excédent net de +1 205,00 €, permettant de consolider la trésorerie de sécurité."
        },
        {
          id: 'pt_3',
          titre: "Vote du budget prévisionnel : confection des housses d'alfaias en toile cirée jaune et peaux de chèvre",
          notesCR: "Approbation de l'investissement de 450,00 € pour la confection de 12 housses protectrices en toile cirée jaune imperméable face aux embruns marins, et 275,00 € pour le renouvellement des peaux de chèvre et cordages de lutherie."
        },
        {
          id: 'pt_4',
          titre: 'Calendrier des sorties : Fête de la Ria et ateliers de fabrication',
          notesCR: "Confirmation de la prestation phare du 24 octobre à la Cale de Pen Mané (Fête de la Ria d'Étel) avec cortejo et set scénique. Organisation de sessions de matage de cordages et confection bénévole au Hangar."
        }
      ],
      resolutions: [
        { titre: 'Approbation des comptes 2025-2026', vote: 'Unanimité (19 voix pour)' },
        { titre: 'Acquisition des équipements étanches pour pupitre percussions', vote: 'Unanimité (19 voix pour)' }
      ],
      quorum: '16 membres présents, 3 représentés — Quorum atteint (100 %)',
      statut: 'termine',
      status: 'termine',
      compteRenduStatus: 'publie'
    }
  ],

  // 10. Trésorerie & Écritures comptables (Historique réaliste équilibré)
  transactions: [
    {
      id: 'demo_tx_01_presta_ria',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-05',
      timestamp: createDemoTimestamp('2026-09-05T10:00:00.000Z'),
      type: 'recette',
      categorie: 'Prestations',
      libelle: "Prestation « Fête de la Ria » (Acompte 50%)",
      montant: 600.00,
      statut: 'valide',
      modePaiement: 'virement'
    },
    {
      id: 'demo_tx_02_cotisations',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-08',
      timestamp: createDemoTimestamp('2026-09-08T14:30:00.000Z'),
      type: 'recette',
      categorie: 'Adhésions',
      libelle: "Cotisations annuelles adhérents (Virement groupé)",
      montant: 1140.00,
      statut: 'valide',
      modePaiement: 'virement'
    },
    {
      id: 'demo_tx_03_subvention',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-12',
      timestamp: createDemoTimestamp('2026-09-12T09:15:00.000Z'),
      type: 'recette',
      categorie: 'Subventions',
      libelle: "Subvention municipale d'animation locale",
      montant: 500.00,
      statut: 'valide',
      modePaiement: 'virement'
    },
    {
      id: 'demo_tx_04_housses',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-15',
      timestamp: createDemoTimestamp('2026-09-15T11:00:00.000Z'),
      type: 'depense',
      categorie: 'Matériel',
      libelle: "Confection de 12 housses d'alfaias en toile cirée jaune étanche",
      montant: 450.00,
      statut: 'valide',
      modePaiement: 'carte'
    },
    {
      id: 'demo_tx_05_lutherie',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-18',
      timestamp: createDemoTimestamp('2026-09-18T16:20:00.000Z'),
      type: 'depense',
      categorie: 'Lutherie',
      libelle: "Lot de peaux de chèvre naturelles & cordage pré-étiré",
      montant: 275.00,
      statut: 'valide',
      modePaiement: 'virement'
    },
    {
      id: 'demo_tx_06_assurance',
      groupId: DEMO_GROUP_ID,
      date: '2026-09-22',
      timestamp: createDemoTimestamp('2026-09-22T08:45:00.000Z'),
      type: 'depense',
      categorie: 'Assurance',
      libelle: "Assurance annuelle responsabilité civile et instruments",
      montant: 310.00,
      statut: 'valide',
      modePaiement: 'prelevement'
    }
  ],

  // 11. Varal Pédagogique & Fiches (Toadas, Lutherie & Culture Afro-Brésilienne)
  documents: [
    // Fiche 1 : « Toada da Ria do Norte » (Corde 1 : Toadas & Répertoire traditionnel)
    {
      id: 'demo_doc_toada_ria_do_norte',
      groupId: DEMO_GROUP_ID,
      titre: 'Toada da Ria do Norte',
      type: 'song',
      categorie: 'Toadas',
      nacao: 'Maracatu Na Chuva',
      rythme: 'Baque Luanda',
      bpm: 96,
      dateAjout: '2026-09-01',
      isPublic: true,
      isHidden: false,
      isArchived: false,
      excludeFromPedagogy: false,
      parolesOriginales: [
        { puxador: 'O vento sopra forte na barra de Belz', coro: '' },
        { puxador: 'Ouvindo o tambor que ecoa no mar', coro: '' },
        { puxador: '', coro: 'Maracatu Na Chuva vai navegar\nCom a força das águas da Ria do Norte!' },
        { puxador: 'Chuva fina na pele, calor no coração', coro: '' },
        { puxador: 'O batuque desperta toda a multidão', coro: '' },
        { puxador: '', coro: 'Maracatu Na Chuva vai navegar\nCom a força das águas da Ria do Norte!' }
      ],
      parolesPhonetiques: [
        { puxador: 'Ou ventou soprâ forté na barra dé Belz', coro: '' },
        { puxador: 'Ouvindo ou tambor ké ékô-a nou mar', coro: '' },
        { puxador: '', coro: 'Marakatou Na Chouva vaï navégar\nKon a forssa daz agouaz da Ria dou Norté!' },
        { puxador: 'Chouva fina na pélé, kalor nou korassan', coro: '' },
        { puxador: 'Ou batouké déspèr-ta toda a moultidan', coro: '' },
        { puxador: '', coro: 'Marakatou Na Chouva vaï navégar\nKon a forssa daz agouaz da Ria dou Norté!' }
      ],
      traduction: "Le vent souffle fort sur la barre de Belz,\nEn écoutant le tambour qui résonne dans la mer.\nMaracatu Na Chuva va naviguer,\nAvec la force des eaux de la Ria du Nord !\nBruine fine sur la peau, chaleur dans le cœur,\nLe battement réveille toute la foule.\nMaracatu Na Chuva va naviguer,\nAvec la force des eaux de la Ria du Nord !",
      notesLexique: [
        { mot: 'Baque', explication: 'Le battement rythmique et la pulsation sacrée du Maracatu' },
        { mot: 'Toada', explication: 'Chant poétique traditionnel guidé par le puxador et repris par le chœur' },
        { mot: 'Crachin', explication: 'Bruine marine typique de Bretagne accompagnant les tambours' },
        { mot: 'Puxador', explication: 'Chanteur principal qui mène la toada et lance les répons au chœur' }
      ],
      anecdote: "Composée sur la rive de Saint-Cado sous un ciel de bruine typiquement breton, cette toada mêle l'appel maritime de la Ria d'Étel à la cadence lourde des alfaias de Recife."
    },

    // Fiche 2 : « Baque da Estrela Brilhante » (Corde 1 : Toadas & Répertoire traditionnel)
    {
      id: 'demo_doc_toada_estrela_brilhante',
      groupId: DEMO_GROUP_ID,
      titre: 'Baque da Estrela Brilhante',
      type: 'song',
      categorie: 'Toadas',
      nacao: 'Estrela Brilhante',
      rythme: 'Baque Virado',
      bpm: 108,
      dateAjout: '2026-09-02',
      isPublic: true,
      isHidden: false,
      isArchived: false,
      excludeFromPedagogy: false,
      parolesOriginales: [
        { puxador: 'Minha Estrela Brilhante que reluz no céu', coro: '' },
        { puxador: 'Clareia as águas do nosso batel', coro: '' },
        { puxador: '', coro: 'Brilha, brilha no mar profundo\nMaracatu guerreiro que ganhou o mundo!' },
        { puxador: 'Na pancada do tambor o chão vai tremer', coro: '' },
        { puxador: 'Com a bênção da Rainha nós vamos vencer', coro: '' },
        { puxador: '', coro: 'Brilha, brilha no mar profundo\nMaracatu guerreiro que ganhou o mundo!' }
      ],
      parolesPhonetiques: [
        { puxador: 'Minha Estréla Brilyanté ké rélous nou sèw', coro: '' },
        { puxador: 'Klaré-ya az agouaz dou nossou batèl', coro: '' },
        { puxador: '', coro: 'Brilya, brilya nou mar profoundou\nMarakatou guérrérô ké ganyô ou moundou!' },
        { puxador: 'Na pankada dou tambor ou chan vaï trémèr', coro: '' },
        { puxador: 'Kon a benssan da Rainha noz vamoz venssèr', coro: '' },
        { puxador: '', coro: 'Brilya, brilya nou mar profoundou\nMarakatou guérrérô ké ganyou ou moundou!' }
      ],
      traduction: "Mon Étoile Brillante qui scintille au ciel,\nIllumine les eaux de notre navire.\nBrille, brille dans la mer profonde,\nMaracatu guerrier qui a conquis le monde !\nAu fracas du tambour le sol va trembler,\nAvec la bénédiction de la Reine nous allons triompher.\nBrille, brille dans la mer profonde,\nMaracatu guerrier qui a conquis le monde !",
      notesLexique: [
        { mot: 'Batel', explication: 'Petite embarcation maritime traditionnelle naviguant sur les estuaires' },
        { mot: 'Pancada', explication: "Frappe percutante de mailloche sur la peau de l'alfaia" },
        { mot: 'Reluzir', explication: 'Scintiller intensément comme une étoile guidant les marins' }
      ],
      anecdote: "Chant traditionnel du domaine public hérité des cortèges centenaires de Recife, rendant hommage à l'astre guide et aux souverains du Maracatu."
    },

    // Fiche 3 : « Matage et tension des cordages marins face à l'humidité saline » (Corde 2 : Lutherie & Entretien)
    {
      id: 'demo_doc_tuto_tension_cordages',
      groupId: DEMO_GROUP_ID,
      titre: "Matage et tension des cordages marins face à l'humidité saline",
      sousTitre: 'Entretien & Lutherie maritime',
      type: 'culture_fiche',
      categorie: 'TutosFabrication',
      categorieFiche: 'Lutherie & Entretien',
      themeCulture: 'atelier',
      stampKey: 'atelier',
      iconeStamp: 'atelier',
      dateAjout: '2026-09-03',
      isPublic: true,
      isHidden: false,
      isArchived: false,
      excludeFromPedagogy: false,
      outils: ['tourne-à-gauche', 'pince étau', 'cale en bois dur', 'maillet en bois'],
      materiaux: [
        'Cordage pré-étiré en polyester maritime 6mm',
        "Cire d'abeille pure",
        'Peau de chèvre naturelle'
      ],
      chapitres: [
        {
          id: 'chap_1',
          sousTitre: '1. Diagnostic et impact de l humidité saline',
          texte: "En climat côtier et sous le crachin, les <strong>peaux naturelles de chèvre</strong> absorbent l'humidité ambiante et perdent jusqu'à 35% de leur tension. Les cordages synthétiques marins permettent de compenser cette perte sans risquer la rupture."
        },
        {
          id: 'chap_2',
          sousTitre: '2. Outillage requis pour l intervention',
          texte: "Munissez-vous impérativement des trois outils clés : un <strong>tourne-à-gauche</strong> pour vriller les boucles de tension, une <strong>pince étau</strong> à mors protégés pour maintenir la tension sans écraser le cordage, et une <strong>cale en bois dur</strong> servant de levier d'appui contre le fût."
        },
        {
          id: 'chap_3',
          sousTitre: '3. Procédure pas-à-pas de matage',
          texte: "Effectuez d'abord une pré-tension manuelle en zig-zag. Bloquez le cordage avec la <strong>pince étau</strong>. Insérez le <strong>tourne-à-gauche</strong> dans la maille et tournez d'un quart de tour en prenant appui sur la <strong>cale en bois dur</strong>. Frappez légèrement le cercle avec le maillet pour harmoniser les tensions périphériques."
        },
        {
          id: 'chap_4',
          sousTitre: '4. Protection et imperméabilisation',
          texte: "Appliquez une fine couche de <strong>cire d'abeille pure</strong> sur le pourtour de la peau et les cordes pour créer un film hydrophobe protecteur contre les embruns marins."
        }
      ],
      anecdote: "Les batucadas côtières du Morbihan utilisent des cordages de drisse pré-étirés issus du nautisme pour garantir une note basse constante même après deux heures sous la pluie.",
      lexique: [
        { pt: 'Aperto', fr: 'Tensionnement et serrage minutieux des cordages du tambour' },
        { pt: 'Aro', fr: 'Cercle de tension supérieur ou inférieur maintenant la peau sur le fût' },
        { pt: 'Corda marinheira', fr: 'Cordage maritime résistant au sel marin et aux variations hygrométriques' }
      ]
    },

    // Fiche 4 : « Iemanjá, Reine des Marées et de l'Océan » (Corde 3 : Histoire & Culture Afro-Brésilienne)
    {
      id: 'demo_doc_culture_iemanja',
      groupId: DEMO_GROUP_ID,
      titre: "Iemanjá, Reine des Marées et de l'Océan",
      sousTitre: 'Mère des Orixás et protectrice des marins',
      personnageOrisha: 'Iemanjá',
      themeCulture: 'orixas',
      categorieFiche: 'Spiritualité & Orixás',
      stampKey: 'orixa',
      iconeStamp: 'orixa',
      type: 'culture_fiche',
      categorie: 'Culture',
      dateAjout: '2026-09-04',
      isPublic: true,
      isHidden: false,
      isArchived: false,
      excludeFromPedagogy: false,
      couleursTheme: ['#87CEEB', '#F0F8FF'],
      hexPrimary: '#87CEEB',
      hexSecondary: '#F0F8FF',
      elementNaturel: 'Océan et eaux salées',
      symbolesSacres: 'Abebé (miroir rituel en métal blanc), éventail et coquillages marins',
      syncretisme: 'Notre-Dame des Navigateurs / Stella Maris',
      villeRegion: 'Salvador da Bahia & Côtes du Nordeste',
      epoque: 'Tradition ancestrale yoruba',
      chapitres: [
        {
          id: 'chap_1',
          sousTitre: 'Origines et puissance maritime',
          texte: "Grande divinité des eaux salées issue du panthéon <strong>yoruba</strong>, <strong>Iemanjá</strong> est la protectrice bienveillante des pêcheurs, des matelots et de tous ceux qui bravent les mers. Dans le Maracatu, son énergie fluide apaise la frénésie du baque et bénit les tambours avant le grand départ du cortège."
        },
        {
          id: 'chap_2',
          sousTitre: 'Attributs et couleurs sacrées',
          texte: "Ses couleurs emblématiques sont le <strong>bleu clair</strong> et le <strong>blanc argenté</strong>, rappelant le ressac de l'écume sur le sable. Son emblème sacré est l'<strong>Abebé</strong>, un miroir rond en métal blanc serti de motifs marins par lequel elle veille sur les âmes voyageuses."
        },
        {
          id: 'chap_3',
          sousTitre: 'Syncrétisme et festivités',
          texte: "Fêtée chaque année le 2 février, elle est associée par syncrétisme à <strong>Notre-Dame des Navigateurs</strong>. Des milliers de fidèles déposent dans l'océan des corbeilles chargées de fleurs blanches, de miroirs et de parfums."
        }
      ],
      danseData: {
        nomDuGeste: 'Ondulation des Vagues (Dança das Ondas)',
        descriptionGeste: "Mouvements amples et continus des bras imitant le flux et le reflux de la marée, bassin relâché et pieds ancrés dans le sol sableux.",
        motsClesCorps: 'Bras, épaules, ondulation dorsale'
      },
      anecdote: "À Locoal-Mendon, la troupe dépose symboliquement une rose blanche dans la Ria d'Étel au premier crachin d'automne en guise d'hommage à la Reine des Marées.",
      lexique: [
        { pt: 'Abebé', fr: 'Miroir sacré en métal blanc orné de symboles marins porté par Iemanjá' },
        { pt: 'Odoyá', fr: 'Salutation sacrée et respectueuse adressée à Iemanjá' },
        { pt: 'Marejada', fr: 'Mouvement de houle et de ressac de la mer inspirant le balancement des jupes' },
        { pt: 'Ialorixá', fr: 'Prêtresse et mère spirituelle guidant les rituels et les offrandes à la mer' }
      ]
    },

    // Document 5 : Statuts officiels de l'association (Corde : Administratif)
    {
      id: 'demo_doc_statuts_nachuva',
      groupId: DEMO_GROUP_ID,
      titre: 'Statuts constitutifs — Maracatu Na Chuva',
      type: 'statuts',
      typeDoc: 'statuts',
      categorie: 'Administratif',
      categoryId: 'Administratif',
      dateCreation: '2024-10-12',
      dateAjout: '2024-10-12',
      annee: '2024',
      resume: "Statuts de l'association régie par la loi du 1er juillet 1901, ayant pour objet la pratique, la transmission et le rayonnement des rythmes et danses du Maracatu de Baque Virado dans le pays d'Auray et sur le bassin de la ria d'Étel.",
      siegeSocial: "Hangar associatif de l'Isthme, Locoal-Mendon",
      description: "Statuts constitutifs déposés en sous-préfecture de Lorient le 12 octobre 2024. Association loi 1901.",
      signataires: [
        { nom: 'Mestre da Ria', role: 'Président' },
        { nom: 'Rozenn Le Guen', role: 'Secrétaire' },
        { nom: 'Malo Kergourlay', role: 'Trésorier' }
      ],
      contenuTexte: `ARTICLE 1 : DÉNOMINATION
Il est fondé entre les adhérents aux présents statuts une association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901, ayant pour titre : « MARACATU NA CHUVA ».

ARTICLE 2 : OBJET CULTUREL
Cette association a pour objet la pratique, la transmission, l'apprentissage collectif et le rayonnement des rythmes, chants et danses traditionnels du Maracatu de Baque Virado, ainsi que l'organisation de manifestations artistiques, ateliers de lutherie et actions d'éducation populaire dans le pays d'Auray et sur le bassin de la ria d'Étel.

ARTICLE 3 : SIÈGE SOCIAL
Le siège social est fixé au : Hangar associatif de l'Isthme, 56550 Locoal-Mendon. Il pourra être transféré par simple décision du Conseil d'Administration.

ARTICLE 6 : COTISATIONS ET INSTRUMENTS
Chaque membre s'acquitte d'une cotisation annuelle fixée par l'Assemblée Générale. Les instruments du parc associatif sont gérés collectivement et mis à disposition des membres pour les répétitions et prestations.`,
      texte: `ARTICLE 1 : DÉNOMINATION\nIl est fondé entre les adhérents aux présents statuts une association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901, ayant pour titre : « MARACATU NA CHUVA ».\n\nARTICLE 2 : OBJET CULTUREL\nCette association a pour objet la pratique, la transmission, l'apprentissage collectif et le rayonnement des rythmes, chants et danses traditionnels du Maracatu de Baque Virado, ainsi que l'organisation de manifestations artistiques, ateliers de lutherie et actions d'éducation populaire dans le pays d'Auray et sur le bassin de la ria d'Étel.\n\nARTICLE 3 : SIÈGE SOCIAL\nLe siège social est fixé au : Hangar associatif de l'Isthme, 56550 Locoal-Mendon. Il pourra être transféré par simple décision du Conseil d'Administration.\n\nARTICLE 6 : COTISATIONS ET INSTRUMENTS\nChaque membre s'acquitte d'une cotisation annuelle fixée par l'Assemblée Générale. Les instruments du parc associatif sont gérés collectivement et mis à disposition des membres pour les répétitions et prestations.`,
      points: [
        {
          id: 'art_1',
          titre: 'Article 1 — Dénomination',
          notesCR: "Il est fondé entre les adhérents aux présents statuts une association régie par la loi du 1er juillet 1901 et le décret du 16 août 1901, ayant pour titre : « MARACATU NA CHUVA »."
        },
        {
          id: 'art_2',
          titre: 'Article 2 — Objet culturel',
          notesCR: "Cette association a pour objet la pratique, la transmission, l'apprentissage collectif et le rayonnement des rythmes, chants et danses traditionnels du Maracatu de Baque Virado, ainsi que l'organisation de manifestations artistiques, ateliers de lutherie et actions d'éducation populaire dans le pays d'Auray et sur le bassin de la ria d'Étel."
        },
        {
          id: 'art_3',
          titre: 'Article 3 — Siège social',
          notesCR: "Le siège social est fixé au : Hangar associatif de l'Isthme, 56550 Locoal-Mendon. Il pourra être transféré par simple décision du Conseil d'Administration."
        },
        {
          id: 'art_6',
          titre: 'Article 6 — Cotisations et instruments',
          notesCR: "Chaque membre s'acquitte d'une cotisation annuelle fixée par l'Assemblée Générale. Les instruments du parc associatif sont gérés collectivement et mis à disposition des membres pour les répétitions et prestations."
        }
      ],
      isPublic: true,
      isHidden: false,
      isArchived: false
    },

    // Document 6 : Procès-Verbal d'Assemblée Générale de rentrée (Corde : ComptesRendus)
    {
      id: 'demo_doc_pv_ag_rentree_2026',
      groupId: DEMO_GROUP_ID,
      titre: "Procès-Verbal d'Assemblée Générale Ordinaire — Rentrée 2026",
      type: 'compte_rendu',
      typeDoc: 'compte_rendu',
      categorie: 'ComptesRendus',
      categoryId: 'ComptesRendus',
      date: '2026-09-05T18:30:00',
      dateAjout: '2026-09-05',
      annee: '2026',
      lieu: "Salle polyvalente de l'Isthme, Locoal-Mendon",
      quorum: '16 membres présents, 3 représentés — Quorum atteint (100 %)',
      description: "Procès-verbal de l'Assemblée Générale Ordinaire de rentrée 2026. Bilan moral, approbation des comptes et votes d'investissements.",
      presents: [
        'Mestre da Ria', 'Malo Kergourlay', 'Rozenn Le Guen', 'Yann-Bento Guégan',
        'Ronan Le Bihan', 'Brieuc Jaffré', 'Soïg Tiago', 'Anaïs Rio',
        'Youenn Caboclo', 'Kelig Le Gall', 'Nolwenn Iara', 'Klervi Eveno',
        'Maëlys Robic', 'Gaëlle Dandara', 'Solène Tanguy', 'Alexandre Dréan'
      ],
      representes: [
        'Gurvan Cariou (pouvoir à Mestre da Ria)',
        'Titouan Morel (pouvoir à Ronan Le Bihan)',
        'Gwendal Tanguy (pouvoir à Rozenn Le Guen)'
      ],
      ordreDuJour: [
        'Rapport moral du Mestre da Ria',
        'Bilan financier et approbation des comptes par Malo Kergourlay',
        'Vote du budget prévisionnel : confection des housses d\'alfaias en toile cirée jaune et peaux de chèvre',
        'Calendrier des sorties : Fête de la Ria et ateliers de fabrication'
      ],
      resolutions: [
        { titre: 'Approbation des comptes 2025-2026', vote: 'Unanimité (19 voix pour)' },
        { titre: 'Acquisition des équipements étanches pour pupitre percussions', vote: 'Unanimité (19 voix pour)' }
      ],
      points: [
        {
          id: 'pt_1',
          titre: '1. Rapport moral du Mestre da Ria',
          notesCR: "Bilan positif de la saison écoulée avec un effectif consolidé de 19 adhérents investis sur l'ensemble des pupitres. La dynamique collective autour des répétitions à l'Isthme de Locoal-Mendon et l'accueil des nouveaux batuqueiros témoignent de la vitalité du baque en terre morbihannaise."
        },
        {
          id: 'pt_2',
          titre: '2. Bilan financier et approbation des comptes par Malo Kergourlay',
          notesCR: "Présentation des comptes de l'exercice : les recettes s'élèvent à 2 240,00 € (cotisations, acompte de prestation et subvention) pour 1 035,00 € de dépenses d'exploitation (matériel étanche, peaux de chèvre et assurance). Le solde de gestion dégage un excédent net de +1 205,00 €, permettant de consolider la trésorerie de sécurité."
        },
        {
          id: 'pt_3',
          titre: "3. Vote du budget prévisionnel : confection des housses d'alfaias en toile cirée jaune et peaux de chèvre",
          notesCR: "Approbation de l'investissement de 450,00 € pour la confection de 12 housses protectrices en toile cirée jaune imperméable face aux embruns marins, et 275,00 € pour le renouvellement des peaux de chèvre et cordages de lutherie."
        },
        {
          id: 'pt_4',
          titre: '4. Calendrier des sorties : Fête de la Ria et ateliers de fabrication',
          notesCR: "Confirmation de la prestation phare du 24 octobre à la Cale de Pen Mané (Fête de la Ria d'Étel) avec cortejo et set scénique. Organisation de sessions de matage de cordages et confection bénévole au Hangar."
        }
      ],
      texte: "L'Assemblée Générale Ordinaire de l'association « Maracatu Na Chuva » s'est tenue le samedi 5 septembre 2026 à 18h30 à la Salle polyvalente de l'Isthme à Locoal-Mendon.\n\nQuorum : 16 membres présents, 3 représentés (100% des adhérents). Quorum atteint.\n\nRésolutions votées à l'unanimité (19 voix pour) :\n1. Approbation des comptes 2025-2026\n2. Acquisition des équipements étanches pour pupitre percussions",
      isPublic: true,
      isHidden: false,
      isArchived: false
    }
  ],

  // 12. Parcours pédagogiques pré-remplis pour alimenter les matrices et graphes d'aisance
  parcours: [
    {
      id: `demo_mestre_nachuva_${DEMO_GROUP_ID}`,
      groupId: DEMO_GROUP_ID,
      userId: 'demo_mestre_nachuva',
      evaluations: {
        demo_doc_toada_ria_do_norte: 'referent',
        demo_doc_toada_estrela_brilhante: 'referent',
        demo_doc_tuto_tension_cordages: 'referent',
        demo_doc_culture_iemanja: 'referent'
      },
      revisionsDemandees: {}
    },
    {
      id: DEMO_GROUP_ID,
      groupId: DEMO_GROUP_ID,
      userId: 'demo_mestre_nachuva',
      evaluations: {
        demo_doc_toada_ria_do_norte: 'referent',
        demo_doc_toada_estrela_brilhante: 'referent',
        demo_doc_tuto_tension_cordages: 'referent',
        demo_doc_culture_iemanja: 'referent'
      },
      revisionsDemandees: {}
    },
    {
      id: `demo_user_malo_kergourlay_${DEMO_GROUP_ID}`,
      groupId: DEMO_GROUP_ID,
      userId: 'demo_user_malo_kergourlay',
      evaluations: {
        demo_doc_toada_ria_do_norte: 'alaise',
        demo_doc_tuto_tension_cordages: 'alaise'
      },
      revisionsDemandees: {}
    },
    {
      id: `demo_user_rozenn_leguen_${DEMO_GROUP_ID}`,
      groupId: DEMO_GROUP_ID,
      userId: 'demo_user_rozenn_leguen',
      evaluations: {
        demo_doc_toada_estrela_brilhante: 'alaise',
        demo_doc_culture_iemanja: 'referent'
      },
      revisionsDemandees: {}
    },
    {
      id: `demo_user_yann_bento_${DEMO_GROUP_ID}`,
      groupId: DEMO_GROUP_ID,
      userId: 'demo_user_yann_bento',
      evaluations: {
        demo_doc_toada_ria_do_norte: 'pratique'
      },
      revisionsDemandees: {}
    }
  ]
};

// Alias de compatibilité ascendante pour les composants interrogeant 'treasury' ou 'varal'
INITIAL_DEMO_DATA.treasury = INITIAL_DEMO_DATA.transactions;
INITIAL_DEMO_DATA.varal = INITIAL_DEMO_DATA.documents;

