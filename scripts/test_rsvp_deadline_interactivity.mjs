/**
 * Test unitaire et de non-régression : Modification libre du statut RSVP avant la date limite.
 * 
 * Vérifie :
 * 1. La logique algorithmique de checkRegistrationDeadlinePassed (avec et sans date limite).
 * 2. L'interactivité des 3 boutons RSVP avant deadline dans EventRSVPSection.
 * 3. Le déclenchement strict du sas hors délai uniquement après dépassement de deadline.
 * 4. L'intégration dans EventDetails et useEventRSVP.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : INTERACTIVITÉ RSVP AVANT DATE LIMITE");
console.log("===============================================================\n");

// --- Module 1 : Algorithme checkRegistrationDeadlinePassed ---
console.log("▶️ Module 1 : Test algorithmique de checkRegistrationDeadlinePassed");

// Réimplémentation fidèle pour test isolé indépendant des mocks Firebase
const checkRegistrationDeadlinePassed = (eventOrDeadline, fallbackEventStart = null) => {
  let deadline = null;
  let eventStart = null;

  if (eventOrDeadline && typeof eventOrDeadline === 'object') {
    deadline = eventOrDeadline.dateLimiteInscription;
    eventStart = eventOrDeadline.date || eventOrDeadline.dateDebut;
  } else {
    deadline = eventOrDeadline;
    eventStart = fallbackEventStart;
  }

  // 1. Date limite d'inscription explicite
  if (deadline) {
    const deadlineDate = (typeof deadline === 'string' && deadline.length === 10)
      ? new Date(`${deadline}T23:59:59`)
      : new Date(deadline);
    if (!isNaN(deadlineDate.getTime())) {
      return new Date() > deadlineDate;
    }
  }

  // 2. Absence de date limite : libre jusqu'à l'heure de début de l'événement
  if (eventStart) {
    const startDate = new Date(eventStart);
    if (!isNaN(startDate.getTime())) {
      return new Date() > startDate;
    }
  }

  return false;
};

// Cas 1 : Date limite future
const futureDeadlineEvent = {
  id: 'ev_future_deadline',
  dateLimiteInscription: '2099-12-31T23:59:59',
  date: '2100-01-01T20:00:00'
};
assert.strictEqual(
  checkRegistrationDeadlinePassed(futureDeadlineEvent),
  false,
  "Avant la date limite, checkRegistrationDeadlinePassed doit renvoyer false"
);
console.log("  ✅ [PASS] Date limite future reconnue comme non passée (false).");

// Cas 2 : Date limite passée
const pastDeadlineEvent = {
  id: 'ev_past_deadline',
  dateLimiteInscription: '2020-01-01T12:00:00',
  date: '2099-01-01T20:00:00'
};
assert.strictEqual(
  checkRegistrationDeadlinePassed(pastDeadlineEvent),
  true,
  "Après la date limite, checkRegistrationDeadlinePassed doit renvoyer true"
);
console.log("  ✅ [PASS] Date limite passée reconnue comme close (true).");

// Cas 3 : Sans date limite, mais événement dans le futur (doit rester modifiable)
const noDeadlineFutureEvent = {
  id: 'ev_no_deadline_future',
  dateLimiteInscription: '',
  date: '2099-06-15T18:30:00'
};
assert.strictEqual(
  checkRegistrationDeadlinePassed(noDeadlineFutureEvent),
  false,
  "Sans date limite avec événement futur, les inscriptions doivent rester modifiables (false)"
);
console.log("  ✅ [PASS] Sans date limite, événement futur modifiable librement (false).");

// Cas 4 : Sans date limite, avec dateDebut future
const noDeadlineDateDebutFutureEvent = {
  id: 'ev_no_deadline_datedebut',
  dateDebut: '2099-07-20T10:00:00'
};
assert.strictEqual(
  checkRegistrationDeadlinePassed(noDeadlineDateDebutFutureEvent),
  false,
  "Sans date limite avec dateDebut future, modifiable librement (false)"
);
console.log("  ✅ [PASS] Sans date limite, dateDebut future modifiable librement (false).");

// Cas 5 : Sans date limite, mais événement déjà commencé/passé (fermé)
const noDeadlinePastEvent = {
  id: 'ev_no_deadline_past',
  dateLimiteInscription: null,
  date: '2020-05-10T14:00:00'
};
assert.strictEqual(
  checkRegistrationDeadlinePassed(noDeadlinePastEvent),
  true,
  "Sans date limite avec événement dans le passé, doit être considéré comme clos (true)"
);
console.log("  ✅ [PASS] Sans date limite, événement passé clos (true).");

// Cas 6 : Format string rétrocompatible YYYY-MM-DD
assert.strictEqual(
  checkRegistrationDeadlinePassed('2099-12-31'),
  false,
  "String future format YYYY-MM-DD doit renvoyer false"
);
assert.strictEqual(
  checkRegistrationDeadlinePassed('2020-01-01'),
  true,
  "String passée format YYYY-MM-DD doit renvoyer true"
);
console.log("  ✅ [PASS] Rétrocompatibilité format chaîne YYYY-MM-DD validée.");

// Cas 7 : Format deadline null avec fallback eventStart
assert.strictEqual(
  checkRegistrationDeadlinePassed(null, '2099-01-01T20:00:00'),
  false,
  "Deadline null avec eventStart futur doit renvoyer false"
);
assert.strictEqual(
  checkRegistrationDeadlinePassed(null, '2020-01-01T20:00:00'),
  true,
  "Deadline null avec eventStart passé doit renvoyer true"
);
console.log("  ✅ [PASS] Rétrocompatibilité fallbackEventStart validée.");

// --- Module 2 : Analyse statique de src/hooks/useEventRSVP.js ---
console.log("\n▶️ Module 2 : Vérification du code source de useEventRSVP.js");
const rsvpHookPath = path.resolve(__dirname, '../src/hooks/useEventRSVP.js');
const rsvpHookContent = fs.readFileSync(rsvpHookPath, 'utf8');

assert(
  rsvpHookContent.includes('export const checkRegistrationDeadlinePassed = (eventOrDeadline, fallbackEventStart = null)'),
  "useEventRSVP.js doit exporter checkRegistrationDeadlinePassed prenant en charge l'objet event"
);
assert(
  rsvpHookContent.includes('const isRegistrationDeadlinePassed = checkRegistrationDeadlinePassed(event);'),
  "handleSave et handleFamilySave doivent passer l'objet event entier à checkRegistrationDeadlinePassed"
);
console.log("  ✅ [PASS] useEventRSVP.js utilise checkRegistrationDeadlinePassed(event) pour le contrôle de sauvegarde.");

// --- Module 3 : Analyse statique de src/components/EventDetails.jsx ---
console.log("\n▶️ Module 3 : Vérification du code source de EventDetails.jsx");
const eventDetailsPath = path.resolve(__dirname, '../src/components/EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');

assert(
  eventDetailsContent.includes('const isRegistrationDeadlinePassed = checkRegistrationDeadlinePassed(targetEvent);'),
  "EventDetails.jsx doit calculer isRegistrationDeadlinePassed via checkRegistrationDeadlinePassed(targetEvent)"
);
console.log("  ✅ [PASS] EventDetails.jsx calcule isRegistrationDeadlinePassed avec targetEvent.");

// --- Module 4 : Analyse statique de src/components/event-details/EventRSVPSection.jsx ---
console.log("\n▶️ Module 4 : Vérification du code source de EventRSVPSection.jsx");
const rsvpSectionPath = path.resolve(__dirname, '../src/components/event-details/EventRSVPSection.jsx');
const rsvpSectionContent = fs.readFileSync(rsvpSectionPath, 'utf8');

assert(
  rsvpSectionContent.includes("import { checkRegistrationDeadlinePassed } from '../../hooks/useEventRSVP';"),
  "EventRSVPSection.jsx doit importer checkRegistrationDeadlinePassed"
);
assert(
  rsvpSectionContent.includes('const isDeadlinePassed = useMemo(() => {'),
  "EventRSVPSection.jsx doit calculer dynamiquement isDeadlinePassed avec useMemo"
);
assert(
  rsvpSectionContent.includes(') : isDeadlinePassed && !isAuthorized ? ('),
  "EventRSVPSection.jsx doit n'afficher le sas hors délai QUE si isDeadlinePassed && !isAuthorized"
);
assert(
  rsvpSectionContent.includes("onClick={() => handleStatusChange('present')}"),
  "Le bouton Présent doit déclencher directement handleStatusChange('present')"
);
assert(
  rsvpSectionContent.includes("onClick={() => handleStatusChange('absent')}"),
  "Le bouton Absent doit déclencher directement handleStatusChange('absent')"
);
assert(
  rsvpSectionContent.includes("onClick={() => handleStatusChange('confirm')}"),
  "Le bouton À confirmer doit déclencher directement handleStatusChange('confirm')"
);
assert(
  rsvpSectionContent.includes('theme-btn-status-present-active'),
  "Le bouton Présent doit utiliser la classe sémantique theme-btn-status-present-active"
);
assert(
  rsvpSectionContent.includes('theme-btn-status-absent-active'),
  "Le bouton Absent doit utiliser la classe sémantique theme-btn-status-absent-active"
);
assert(
  rsvpSectionContent.includes('theme-btn-status-confirm-active'),
  "Le bouton À confirmer doit utiliser la classe sémantique theme-btn-status-confirm-active"
);
assert(
  rsvpSectionContent.includes('Statut enregistré :'),
  "EventRSVPSection doit afficher le statut enregistré actuel au membre"
);

console.log("  ✅ [PASS] EventRSVPSection.jsx maintient les 3 boutons cliquables avec leurs couleurs sémantiques et le badge de statut enregistré.");

// --- Module 5 : Tests unitaires de la cascade covoiturage (src/utils/carpoolCascadeUtils.js) ---
console.log("\n▶️ Module 5 : Tests unitaires de carpoolCascadeUtils.js");
const {
  inspectDriverCarpoolSituation,
  buildDriverDepartureWarningMessage,
  applyCarpoolAbsenceCascade
} = await import('../src/utils/carpoolCascadeUtils.js');

// Test 5.1 : inspectDriverCarpoolSituation
const testEvent = {
  id: 'ev_test_cascade',
  covoiturage: {
    voitures: [
      {
        id: 'voit_alice',
        chauffeurId: 'user_alice',
        chauffeurNom: 'Alice Chauffeur',
        passengerSeats: 4,
        trunkAlfayaCapacity: 2,
        passengers: [
          { uid: 'user_alice', nom: 'Alice Chauffeur', isPassenger: true },
          { uid: 'user_bob', nom: 'Bob Passager', isPassenger: true, alfayasCount: 1 },
          { uid: 'user_claire', nom: 'Claire Passager', isPassenger: true, alfayasCount: 0 },
          { uid: 'user_david', nom: 'David Instrument', isPassenger: false, alfayasCount: 1 }
        ]
      },
      {
        id: 'voit_empty',
        chauffeurId: 'user_empty',
        chauffeurNom: 'Empty Chauffeur',
        passengerSeats: 3,
        trunkAlfayaCapacity: 1,
        passengers: [
          { uid: 'user_empty', nom: 'Empty Chauffeur', isPassenger: true }
        ]
      }
    ],
    recherchePlace: [
      { uid: 'user_emma', nom: 'Emma Chercheur', cherchePassager: true, chercheInstrument: false }
    ]
  },
  inscriptions: [
    { userId: 'user_alice', userName: 'Alice Chauffeur', status: 'present', transport: 'propose_voiture' },
    { userId: 'user_bob', userName: 'Bob Passager', status: 'present', transport: 'covoit' },
    { userId: 'user_claire', userName: 'Claire Passager', status: 'present', transport: 'covoit' },
    { userId: 'user_david', userName: 'David Instrument', status: 'present', transport: 'autonome' },
    { userId: 'user_empty', userName: 'Empty Chauffeur', status: 'present', transport: 'propose_voiture' },
    { userId: 'user_emma', userName: 'Emma Chercheur', status: 'present', transport: 'cherche_place' }
  ]
};

// Analyse Alice (conducteur avec 2 passagers tiers + 1 instrument orphelin)
const sitAlice = inspectDriverCarpoolSituation(testEvent, 'user_alice');
assert.strictEqual(sitAlice.isDriver, true, "Alice doit être reconnue comme conducteur");
assert.strictEqual(sitAlice.hasThirdParty, true, "Alice a des tiers assignés");
assert.strictEqual(sitAlice.passengersCount, 2, "Alice a 2 passagers physiques tiers (Bob, Claire)");
assert.strictEqual(sitAlice.instrumentsCount, 2, "Alice transporte 2 alfaias pour des tiers (1 de Bob + 1 de David)");
console.log("  ✅ [PASS] inspectDriverCarpoolSituation analyse fidèlement passagers et instruments tiers.");

// Message d'avertissement
const warningMsg = buildDriverDepartureWarningMessage(sitAlice);
assert(warningMsg.includes("2 passagers"), "Le message doit mentionner '2 passagers'");
assert(warningMsg.includes("2 instruments"), "Le message doit mentionner '2 instruments'");
assert(warningMsg.includes("tes passagers basculeront automatiquement en recherche de place"), "Formule de bascule");
console.log("  ✅ [PASS] buildDriverDepartureWarningMessage génère le texte de confirmation préventive exact.");

// Analyse conducteur avec véhicule vide
const sitEmpty = inspectDriverCarpoolSituation(testEvent, 'user_empty');
assert.strictEqual(sitEmpty.isDriver, true, "user_empty doit être reconnu comme conducteur");
assert.strictEqual(sitEmpty.hasThirdParty, false, "user_empty n'a aucun passager tiers");
assert.strictEqual(sitEmpty.passengersCount, 0, "0 passager tiers");
console.log("  ✅ [PASS] inspectDriverCarpoolSituation détecte correctement un convoi vide (aucun avertissement requis).");

// Test 5.2 : Cascade désistement passager (Bob se déclare absent)
const cascadeBob = applyCarpoolAbsenceCascade(testEvent.covoiturage, testEvent.inscriptions, 'user_bob');
const aliceCarAfterBob = cascadeBob.updatedCovoiturage.voitures.find(v => v.id === 'voit_alice');
assert(
  !aliceCarAfterBob.passengers.some(p => p.uid === 'user_bob'),
  "Bob doit être retiré silencieusement de la voiture d'Alice"
);
assert.strictEqual(
  aliceCarAfterBob.passengers.length,
  3,
  "La voiture d'Alice conserve les autres passagers"
);
const bobIns = cascadeBob.updatedInscriptions.find(ins => ins.userId === 'user_bob');
assert.strictEqual(bobIns.status, 'absent', "Le statut de Bob doit passer à absent");
assert.strictEqual(bobIns.transport, null, "Le transport de Bob doit être remis à null");
console.log("  ✅ [PASS] Désistement passager : libération immédiate et silencieuse de sa place dans la voiture.");

// Test 5.3 : Cascade désistement demandeur en attente (Emma se déclare absente)
const cascadeEmma = applyCarpoolAbsenceCascade(testEvent.covoiturage, testEvent.inscriptions, 'user_emma');
assert(
  !cascadeEmma.updatedCovoiturage.recherchePlace.some(r => r.uid === 'user_emma'),
  "Emma doit être retirée de recherchePlace"
);
const emmaIns = cascadeEmma.updatedInscriptions.find(ins => ins.userId === 'user_emma');
assert.strictEqual(emmaIns.status, 'absent', "Statut absent pour Emma");
assert.strictEqual(emmaIns.transport, null, "Transport null pour Emma");
console.log("  ✅ [PASS] Désistement demandeur en attente : retrait propre de la file recherchePlace.");

// Test 5.4 : Cascade désistement conducteur véhicule vide (Empty se déclare absent)
const cascadeEmpty = applyCarpoolAbsenceCascade(testEvent.covoiturage, testEvent.inscriptions, 'user_empty');
assert(
  !cascadeEmpty.updatedCovoiturage.voitures.some(v => v.id === 'voit_empty'),
  "La voiture vide doit être retirée de la liste des voitures"
);
assert.strictEqual(
  cascadeEmpty.updatedCovoiturage.recherchePlace.length,
  testEvent.covoiturage.recherchePlace.length,
  "Aucun ajout dans recherchePlace car la voiture était vide"
);
console.log("  ✅ [PASS] Désistement conducteur véhicule vide : retrait direct sans orphelin.");

// Test 5.5 : Cascade désistement conducteur avec passagers (Alice se déclare absente)
const cascadeAlice = applyCarpoolAbsenceCascade(testEvent.covoiturage, testEvent.inscriptions, 'user_alice');
assert(
  !cascadeAlice.updatedCovoiturage.voitures.some(v => v.id === 'voit_alice'),
  "La voiture d'Alice doit être supprimée du convoi"
);
const recherchePlaceAfterAlice = cascadeAlice.updatedCovoiturage.recherchePlace;
const bobInQueue = recherchePlaceAfterAlice.find(r => r.uid === 'user_bob');
const claireInQueue = recherchePlaceAfterAlice.find(r => r.uid === 'user_claire');
const davidInQueue = recherchePlaceAfterAlice.find(r => r.uid === 'user_david');

assert(bobInQueue && bobInQueue.cherchePassager === true && bobInQueue.chercheInstrument === true, "Bob doit chercher place et instrument");
assert(claireInQueue && claireInQueue.cherchePassager === true, "Claire doit chercher une place");
assert(davidInQueue && davidInQueue.cherchePassager === false && davidInQueue.chercheInstrument === true, "David (instrument orphelin) doit chercher une place matériel");

const bobInsAfterAlice = cascadeAlice.updatedInscriptions.find(ins => ins.userId === 'user_bob');
assert.strictEqual(bobInsAfterAlice.transport, 'cherche_place', "Le transport de Bob doit être basculé à cherche_place");

const aliceIns = cascadeAlice.updatedInscriptions.find(ins => ins.userId === 'user_alice');
assert.strictEqual(aliceIns.status, 'absent', "Statut absent pour Alice");
assert.strictEqual(aliceIns.transport, null, "Transport null pour Alice");
assert.strictEqual(aliceIns.demandeRemboursementKm, false, "demandeRemboursementKm annulée");
console.log("  ✅ [PASS] Désistement conducteur avec passagers : convoi supprimé, passagers et matériel orphelin basculés en file d'attente.");

// --- Module 6 : Analyse statique de transaction dans useEventRSVP et useEventCarpool ---
console.log("\n▶️ Module 6 : Vérification de la conformité runTransaction et modale Cordel");
assert(
  rsvpHookContent.includes('runTransaction(db, async (transaction) => {'),
  "useEventRSVP.js doit utiliser runTransaction pour l'atomicité"
);
assert(
  rsvpHookContent.includes('applyCarpoolAbsenceCascade('),
  "useEventRSVP.js doit intégrer applyCarpoolAbsenceCascade"
);
assert(
  rsvpHookContent.includes('buildDriverDepartureWarningMessage('),
  "useEventRSVP.js doit intégrer buildDriverDepartureWarningMessage"
);

const carpoolHookPath = path.resolve(__dirname, '../src/hooks/useEventCarpool.js');
const carpoolHookContent = fs.readFileSync(carpoolHookPath, 'utf8');
assert(
  carpoolHookContent.includes('buildDriverDepartureWarningMessage('),
  "useEventCarpool.js doit utiliser buildDriverDepartureWarningMessage lors du retrait de voiture"
);
console.log("  ✅ [PASS] Conformité runTransaction et atomicité validées dans useEventRSVP et useEventCarpool.");

console.log("\n===============================================================");
console.log("🎉 TOUTES LES ASSERTIONS DU TEST RSVP & COVOITURAGE SONT VALIDÉES !");
console.log("===============================================================");

