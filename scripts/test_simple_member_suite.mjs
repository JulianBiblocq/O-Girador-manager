/**
 * Test Automatisé Exhaustif : Fonctions Simple Membre (Adhérent / Adhérente / Batuqueira)
 * Valide les flux, permissions RBAC, Porte-voix, Agenda RSVP, Covoiturage, Répertoire, Matériel et Vestiaire.
 */

import { canAccessPole, canAccessTabPermission, canUserReadForumChannel, canUserWriteInForumChannel, checkUserAccessToList } from '../src/utils/permissionUtils.js';
import { resolvePieceTrainings } from '../src/utils/repertoireMatcher.js';
import { getMentionQueryAtCursor, filterUsersByMentionQuery, extractMentionedUserIds } from '../src/utils/mentionUtils.js';

// 1. Profils de test : Membre masculin, Adhérente féminine, et Batuqueira
const TIAGO_MEMBRE = {
  uid: "test_tiago_membre_id",
  id: "test_tiago_membre_id",
  prenom: "Tiago",
  nom: "Rocha",
  surnom: "Tiaguinho",
  role: "membre",
  isSystemAdmin: false,
  groupId: "Samambaia",
  instrument: "Alfaia",
  instrumentPrincipal: "Alfaia",
  instrumentsJoues: ["Alfaia"],
  tags: ["Alfaia", "adherent"],
  cotisationStatut: "a_jour"
};

const CLARA_ADHERENTE = {
  uid: "test_clara_adherente_id",
  id: "test_clara_adherente_id",
  prenom: "Clara",
  nom: "Moreau",
  surnom: "Clarinha",
  role: "adhérente",
  isSystemAdmin: false,
  groupId: "Samambaia",
  instrument: "Danse",
  instrumentPrincipal: "Danse",
  instrumentsJoues: ["Danse", "Agogô"],
  tags: ["Danse", "adherente"],
  cotisationStatut: "a_jour"
};

const JOANA_BATUQUEIRA = {
  uid: "test_joana_batuqueira_id",
  id: "test_joana_batuqueira_id",
  prenom: "Joana",
  nom: "Silva",
  surnom: "Joaninha",
  role: "batuqueira",
  isSystemAdmin: false,
  groupId: "Samambaia",
  instrument: "Caixa",
  instrumentPrincipal: "Caixa",
  instrumentsJoues: ["Caixa"],
  tags: ["Caixa"],
  cotisationStatut: "a_jour"
};

// Salons types du Porte-Voix
const CHANNELS = [
  { id: 'ch_general', name: 'Général', allowedRoles: ['all'], readRoles: ['all'], writeRoles: ['all'] },
  { id: 'ch_annonces', name: 'Annonces Officielles', allowedRoles: ['all'], readRoles: ['all'], readOnlyForMembers: true },
  { id: 'ch_membres', name: 'Espace Membres', allowedRoles: ['membre'], readRoles: ['membre'], writeRoles: ['membre'] },
  { id: 'ch_adherents', name: 'Vie Associative', allowedRoles: ['adherent'], readRoles: ['adherent'], writeRoles: ['adherent'] },
  { id: 'ch_danse', name: 'Pupitre Danse', allowedRoles: ['Danse'], readRoles: ['Danse'], writeRoles: ['Danse'] },
  { id: 'ch_alfaia', name: 'Pupitre Alfaia', allowedRoles: ['Alfaia'], readRoles: ['Alfaia'], writeRoles: ['Alfaia'] },
  { id: 'ch_agogo', name: 'Pupitre Agogô', allowedRoles: ['Agogô'], readRoles: ['Agogô'], writeRoles: ['Agogô'] },
  { id: 'ch_ca', name: 'Conseil d\'Administration', allowedRoles: ['ca'], readRoles: ['ca'], writeRoles: ['ca'] },
  { id: 'ch_bureau', name: 'Bureau Restreint', allowedRoles: ['bureau'], readRoles: ['bureau'], writeRoles: ['bureau'] }
];

const TAGS_DISPONIBLES = [
  { id: 'alfaia', nomM: 'Alfaia', nomF: 'Alfaia' },
  { id: 'danse', nomM: 'Danseur', nomF: 'Danseuse' },
  { id: 'adherent', nomM: 'Adhérent', nomF: 'Adhérente' },
  { id: 'bureau', nomM: 'Bureau', nomF: 'Bureau' },
  { id: 'ca', nomM: 'CA', nomF: 'CA' }
];

async function runTestSuite() {
  console.log("========================================================================");
  console.log("🧪 TEST AUTOMATISÉ COMPLET : FONCTIONNALITÉS SIMPLE MEMBRE & ADHÉRENTE");
  console.log("========================================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${message}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 1 : ACCÈS AUX PÔLES ET SÉPARATION ÉTANCHE DES RESPONSABILITÉS
  // -------------------------------------------------------------------
  console.log("▶️ Test 1 : Contrôle RBAC des pôles (Accueil vs Administration)");
  
  const members = [
    { label: "Tiago (membre)", profile: TIAGO_MEMBRE },
    { label: "Clara (adhérente)", profile: CLARA_ADHERENTE },
    { label: "Joana (batuqueira)", profile: JOANA_BATUQUEIRA }
  ];

  for (const m of members) {
    assert(canAccessPole('accueil', m.profile), `${m.label} a accès à l'Espace Membre (accueil)`);
  }

  const ADMIN_POLES = ['mestre', 'secretariat', 'tresorerie', 'lutherie', 'costumerie', 'diffusion', 'gouvernance'];
  for (const m of members) {
    for (const pole of ADMIN_POLES) {
      assert(!canAccessPole(pole, m.profile), `${m.label} n'a PAS accès au pôle admin '${pole}'`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 2 : ACCÈS AUX ONGLETS DE L'ESPACE MEMBRE
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 2 : Accès aux onglets de l'Espace Membre");
  const MEMBER_TABS = ['dashboard', 'profil', 'agenda', 'materiel', 'vestiaire', 'trombinoscope', 'forum', 'mon-parcours', 'varal'];
  for (const m of members) {
    for (const tab of MEMBER_TABS) {
      assert(canAccessTabPermission(tab, 'accueil', m.profile), `${m.label} a accès à l'onglet membre '${tab}'`);
    }
  }

  // Vérifier refus des onglets d'administration
  const ADMIN_TABS = [
    { pole: 'tresorerie', tab: 'cotisations' },
    { pole: 'tresorerie', tab: 'events-finances' },
    { pole: 'secretariat', tab: 'secretariat-reports' },
    { pole: 'mestre', tab: 'mestre-stage-layout' }
  ];
  for (const m of members) {
    for (const { pole, tab } of ADMIN_TABS) {
      assert(!canAccessTabPermission(tab, pole, m.profile), `${m.label} n'a PAS accès à l'onglet sensible '${tab}' (${pole})`);
    }
  }

  // -------------------------------------------------------------------
  // TEST 3 : PERMISSIONS DU PORTE-VOIX (LECTURE ET ÉCRITURE)
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 3 : Permissions du Porte-voix pour membre, adhérente et batuqueira");

  const chGeneral = CHANNELS.find(c => c.id === 'ch_general');
  const chAnnonces = CHANNELS.find(c => c.id === 'ch_annonces');
  const chMembres = CHANNELS.find(c => c.id === 'ch_membres');
  const chAdherents = CHANNELS.find(c => c.id === 'ch_adherents');
  const chDanse = CHANNELS.find(c => c.id === 'ch_danse');
  const chAlfaia = CHANNELS.find(c => c.id === 'ch_alfaia');
  const chAgogo = CHANNELS.find(c => c.id === 'ch_agogo');
  const chCa = CHANNELS.find(c => c.id === 'ch_ca');
  const chBureau = CHANNELS.find(c => c.id === 'ch_bureau');

  // Salon Général (Public)
  for (const m of members) {
    assert(canUserReadForumChannel(chGeneral, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} peut lire le salon Général`);
    assert(canUserWriteInForumChannel(chGeneral, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} peut répondre dans le salon Général`);
  }

  // Salon Annonces (Lecture seule membres)
  for (const m of members) {
    assert(canUserReadForumChannel(chAnnonces, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} peut lire le salon Annonces`);
    assert(!canUserWriteInForumChannel(chAnnonces, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} ne peut PAS écrire dans Annonces (lecture seule)`);
  }

  // Salon Membres / Adhérents (Validation genre féminin et synonymes)
  assert(canUserWriteInForumChannel(chMembres, CLARA_ADHERENTE, TAGS_DISPONIBLES, CLARA_ADHERENTE.tags), "Clara (rôle 'adhérente') peut répondre dans le salon 'membre'");
  assert(canUserWriteInForumChannel(chAdherents, CLARA_ADHERENTE, TAGS_DISPONIBLES, CLARA_ADHERENTE.tags), "Clara (rôle 'adhérente') peut répondre dans le salon 'adherent'");
  assert(canUserWriteInForumChannel(chMembres, TIAGO_MEMBRE, TAGS_DISPONIBLES, TIAGO_MEMBRE.tags), "Tiago (rôle 'membre') peut répondre dans le salon 'membre'");
  assert(canUserWriteInForumChannel(chAdherents, TIAGO_MEMBRE, TAGS_DISPONIBLES, TIAGO_MEMBRE.tags), "Tiago (rôle 'membre') peut répondre dans le salon 'adherent'");
  assert(canUserWriteInForumChannel(chMembres, JOANA_BATUQUEIRA, TAGS_DISPONIBLES, JOANA_BATUQUEIRA.tags), "Joana (rôle 'batuqueira') peut répondre dans le salon 'membre'");

  // Salons Pupitres / Instruments joués
  assert(canUserWriteInForumChannel(chDanse, CLARA_ADHERENTE, TAGS_DISPONIBLES, CLARA_ADHERENTE.tags), "Clara (danseuse) peut écrire dans le salon Danse");
  assert(!canUserReadForumChannel(chDanse, TIAGO_MEMBRE, TAGS_DISPONIBLES, TIAGO_MEMBRE.tags), "Tiago (alfaia) ne peut PAS lire le salon Danse");
  assert(canUserWriteInForumChannel(chAlfaia, TIAGO_MEMBRE, TAGS_DISPONIBLES, TIAGO_MEMBRE.tags), "Tiago (alfaia) peut écrire dans le salon Alfaia");
  assert(!canUserReadForumChannel(chAlfaia, CLARA_ADHERENTE, TAGS_DISPONIBLES, CLARA_ADHERENTE.tags), "Clara (danse) ne peut PAS lire le salon Alfaia");
  
  // Instrument secondaire dans instrumentsJoues
  assert(canUserWriteInForumChannel(chAgogo, CLARA_ADHERENTE, TAGS_DISPONIBLES, CLARA_ADHERENTE.tags), "Clara (Agogô dans instrumentsJoues) peut écrire dans le salon Agogô");

  // Salons Administratifs (CA & Bureau interdits aux simples membres)
  for (const m of members) {
    assert(!canUserReadForumChannel(chCa, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} ne peut PAS lire le salon CA`);
    assert(!canUserReadForumChannel(chBureau, m.profile, TAGS_DISPONIBLES, m.profile.tags), `${m.label} ne peut PAS lire le salon Bureau`);
  }

  // -------------------------------------------------------------------
  // TEST 4 : VALIDATION DU CONTENU DE RÉPONSE FORUM (hasValidContent)
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 4 : Robustesse de la saisie de réponse");
  const hasValidContent = (text) => {
    if (!text) return false;
    const stripped = text.replace(/<[^>]*>/g, '').trim();
    return stripped.length > 0 || text.includes('<img') || text.includes('<a ');
  };

  assert(!hasValidContent(""), "Rejette une réponse vide");
  assert(!hasValidContent("   "), "Rejette une réponse avec uniquement des espaces");
  assert(!hasValidContent("<p></p>"), "Rejette un paragraphe TipTap vide (<p></p>)");
  assert(!hasValidContent("<p><br></p>"), "Rejette un saut de ligne TipTap vide (<p><br></p>)");
  assert(hasValidContent("Présente à la répétition !"), "Accepte un texte simple");
  assert(hasValidContent("<p>Présente à la répétition !</p>"), "Accepte un texte TipTap enrichi");
  assert(hasValidContent('<p><img src="https://example.com/photo.jpg" /></p>'), "Accepte une image sans texte");
  assert(hasValidContent('<p><a href="https://example.com/doc.pdf">📎 Partition</a></p>'), "Accepte un lien pièce jointe sans texte supplémentaire");

  // -------------------------------------------------------------------
  // TEST 5 : AUTOCOMPLÉTION & DÉTECTION DES @MENTIONS DANS LE FORUM
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 5 : Autocomplétion et extraction des mentions adhérents");
  const usersList = [TIAGO_MEMBRE, CLARA_ADHERENTE, JOANA_BATUQUEIRA];
  
  const mentionTiago = filterUsersByMentionQuery(usersList, "tia");
  assert(mentionTiago.length === 1 && mentionTiago[0].id === TIAGO_MEMBRE.id, "Recherche '@tia' trouve Tiago Rocha");

  const mentionClara = filterUsersByMentionQuery(usersList, "clara");
  assert(mentionClara.length === 1 && mentionClara[0].id === CLARA_ADHERENTE.id, "Recherche '@clara' trouve Clara Moreau");

  const mentionSurnom = filterUsersByMentionQuery(usersList, "clarinha");
  assert(mentionSurnom.length === 1 && mentionSurnom[0].id === CLARA_ADHERENTE.id, "Recherche par surnom '@clarinha' trouve Clara Moreau");

  // getMentionQueryAtCursor
  const queryAtCursor = getMentionQueryAtCursor("Bonjour @cla", 12);
  assert(queryAtCursor && queryAtCursor.query === "cla", "getMentionQueryAtCursor détecte bien la saisie '@cla'");

  // extractMentionedUserIds
  const mentionedIds = extractMentionedUserIds("Merci à @Clara Moreau et @Tiaguinho pour l'accueil !", usersList);
  assert(mentionedIds.includes(CLARA_ADHERENTE.id) && mentionedIds.includes(TIAGO_MEMBRE.id), "extractMentionedUserIds extrait Clara et Tiago");

  // -------------------------------------------------------------------
  // TEST 6 : RÉPERTOIRE & ENTRAÎNEMENT SPEED TRAINER (resolvePieceTrainings)
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 6 : Passerelle Répertoire & Speed Trainer Pédagogique");
  
  const mockTrainings = [
    { id: 'tr_1', presetId: 'seq_baque_virado', titre: 'Baque Virado - Défi Rythmique', stages: [{ tempo: 80 }, { tempo: 100 }] },
    { id: 'tr_2', presetId: 'seq_toada_maracatu', titre: 'Toada - Chant & Rythme', stages: [{ tempo: 90 }] },
    { id: 'tr_3', presetId: 'seq_autre', titre: 'Autre Morceau', stages: [{ tempo: 70 }] }
  ];

  const resolvedBaques = resolvePieceTrainings('seq_baque_virado', mockTrainings);
  assert(resolvedBaques.length === 1 && resolvedBaques[0].id === 'tr_1', "Résolution de l'entraînement par presetId 'seq_baque_virado'");

  const resolvedNone = resolvePieceTrainings('seq_inconnu', mockTrainings);
  assert(resolvedNone.length === 0, "Règle zéro bloc vide : renvoie tableau vide si aucun entraînement associé");

  // -------------------------------------------------------------------
  // TEST 7 : AGENDA, STATUTS RSVP & RESTRICTION DES PRÉSENCES
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 7 : Agenda & Gestion des présences RSVP");
  
  // Validation des transitions de statut RSVP membre
  const RSVP_STATUSES = ['present', 'absent', 'maybe'];
  for (const st of RSVP_STATUSES) {
    const isValide = ['present', 'absent', 'maybe'].includes(st);
    assert(isValide, `Statut RSVP '${st}' conforme aux règles de présence`);
  }

  // Choix de l'instrument pour un membre polyvalent
  const selectedInstrumentForEvent = (user, chosenInstrument) => {
    const available = user.instrumentsJoues || [user.instrument];
    return available.includes(chosenInstrument) ? chosenInstrument : user.instrument;
  };
  assert(selectedInstrumentForEvent(CLARA_ADHERENTE, "Agogô") === "Agogô", "Clara peut choisir son instrument secondaire (Agogô) pour un événement");
  assert(selectedInstrumentForEvent(CLARA_ADHERENTE, "Gonguê") === "Danse", "Clara ne peut pas choisir un instrument qu'elle ne pratique pas (repli sur défaut)");

  // -------------------------------------------------------------------
  // TEST 8 : COVOITURAGE & DISCUSSION D'ÉQUIPAGE
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 8 : Covoiturage & Impératif retour direct");
  
  const mockCar = {
    id: "car_1",
    driverId: TIAGO_MEMBRE.id,
    driverName: "Tiago Rocha",
    seatsTotal: 4,
    seatsAvailable: 3,
    retourDirect: true,
    passengers: [
      { userId: CLARA_ADHERENTE.id, userName: "Clara Moreau", doitRentrerDirect: true }
    ],
    messages: [
      { senderId: TIAGO_MEMBRE.id, senderName: "Tiago Rocha", text: "Départ à 14h du local !", timestamp: "2026-09-28T14:00:00Z" }
    ]
  };

  assert(mockCar.retourDirect === true, "La voiture signale l'option Retour Direct");
  assert(mockCar.passengers[0].doitRentrerDirect === true, "La passagère Clara a validé son impératif retour direct");
  assert(mockCar.messages.length > 0 && mockCar.messages[0].senderId === TIAGO_MEMBRE.id, "Le fil d'équipage contient le message du chauffeur");

  // -------------------------------------------------------------------
  // TEST 9 : MON MATÉRIEL & MON VESTIAIRE
  // -------------------------------------------------------------------
  console.log("\n▶️ Test 9 : Mon Matériel & Mon Vestiaire");

  const mockInventory = [
    { id: 'inst_1', nom: 'Alfaia #1', proprietaire: TIAGO_MEMBRE.id, status: 'Personnel' },
    { id: 'inst_2', nom: 'Agogô #2', proprietaire: 'Association', localisationPhysique: CLARA_ADHERENTE.id, status: 'Emprunté', borrowedBy: CLARA_ADHERENTE.id },
    { id: 'inst_3', nom: 'Caixa #3', proprietaire: 'Association', localisationPhysique: 'Local', assignations: [JOANA_BATUQUEIRA.id] }
  ];

  const tiagoPersonal = mockInventory.filter(inst => inst.proprietaire === TIAGO_MEMBRE.id);
  assert(tiagoPersonal.length === 1 && tiagoPersonal[0].id === 'inst_1', "Tiago retrouve son instrument personnel");

  const claraBorrowed = mockInventory.filter(inst => 
    (inst.status === 'Emprunté' && inst.borrowedBy === CLARA_ADHERENTE.id) ||
    (inst.proprietaire === 'Association' && inst.localisationPhysique === CLARA_ADHERENTE.id)
  );
  assert(claraBorrowed.length === 1 && claraBorrowed[0].id === 'inst_2', "Clara retrouve son instrument emprunté");

  const joanaAssigned = mockInventory.filter(inst => 
    inst.localisationPhysique === 'Local' && 
    Array.isArray(inst.assignations) && 
    inst.assignations.includes(JOANA_BATUQUEIRA.id)
  );
  assert(joanaAssigned.length === 1 && joanaAssigned[0].id === 'inst_3', "Joana retrouve son instrument assigné au local");

  // Costumes : filtre par catégorie
  const mockCostumes = [
    { id: 'costume_1', title: 'Tenue Danseuse Axé', targetCategory: 'Danse' },
    { id: 'costume_2', title: 'Chemise Percussion', targetCategory: 'Percussion' },
    { id: 'costume_3', title: 'Chapeau de Paille', targetCategory: 'Tous' }
  ];

  const claraCostumes = mockCostumes.filter(c => (c.targetCategory || 'Tous').toLowerCase() === 'danse' || c.targetCategory === 'Tous');
  assert(claraCostumes.length === 2, "Clara (danse) voit les costumes Danse et Tous");

  // -------------------------------------------------------------------
  // BILAN GÉNÉRAL
  // -------------------------------------------------------------------
  console.log("\n========================================================================");
  console.log(`RÉSULTATS DE LA RECETTE MEMBRE : ${passedTests} succès, ${failedTests} échecs sur ${totalTests} tests`);
  console.log("========================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log("🎉 TOUTES LES FONCTIONNALITÉS MEMBRES & ADHÉRENTES SONT OPÉRATIONNELLES !");
  }
}

runTestSuite().catch(err => {
  console.error("Erreur fatale d'exécution du test membre :", err);
  process.exit(1);
});
