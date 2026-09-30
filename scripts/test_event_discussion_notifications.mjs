/**
 * Test unitaire et fonctionnel de la notification in-app sur les discussions d'événements.
 * Valide :
 * 1. La sélection et le filtrage des destinataires (inscrits confirmés + organisateurs - expéditeur)
 * 2. La troncature stricte à 80 caractères du message
 * 3. La structure et l'exhaustivité des payloads de notification Firestore
 * 4. La validité du lien de deep-linking /agenda?eventId=...&tab=discussion
 */

import assert from 'node:assert/strict';
import {
  getEventDiscussionRecipients,
  formatMessageExcerpt,
  buildEventDiscussionNotificationPayload
} from '../src/utils/eventDiscussionNotificationUtils.js';

console.log('🧪 Démarrage des tests de notifications in-app pour les discussions...');

// --- Test 1 : Troncature à 80 caractères ---
{
  const shortText = "Salut à tous, quelle heure le départ ?";
  assert.equal(formatMessageExcerpt(shortText, 80), shortText);

  const exact80Text = "A".repeat(80);
  assert.equal(formatMessageExcerpt(exact80Text, 80), exact80Text);
  assert.equal(formatMessageExcerpt(exact80Text, 80).length, 80);

  const longText = "Ceci est un message très long qui dépasse largement la limite autorisée des quatre-vingts caractères fixée par la spécification.";
  const truncated = formatMessageExcerpt(longText, 80);
  assert.equal(truncated.length, 80);
  assert.ok(truncated.endsWith('...'));
  console.log('✅ Test 1 (Troncature 80 caractères) réussi :', truncated);
}

// --- Test 2 : Identification des destinataires ---
{
  const mockEvent = {
    id: 'evt-123',
    titre: 'Carnaval Samambaia',
    createdBy: 'uid-createur',
    auteurId: 'uid-auteur',
    contactsJourJ: {
      referentGroupeId: 'uid-referent-groupe',
      referentsPupitres: [
        { userId: 'uid-ref-alfaia' },
        { id: 'uid-ref-caixa' }
      ]
    },
    inscriptions: [
      { userId: 'uid-participant-present-1', status: 'present' },
      { userId: 'uid-participant-confirm-2', status: 'confirm' },
      { userId: 'uid-participant-inscrit-3', status: 'inscrit' },
      { userId: 'uid-participant-absent-4', status: 'absent' },
      { userId: 'uid-participant-en-attente-5', status: 'a_confirmer' },
      { userId: 'uid-createur', status: 'present' } // Déjà présent comme créateur
    ]
  };

  // Scénario A : Le message est envoyé par un participant lambda
  const senderUid = 'uid-participant-present-1';
  const recipientsA = getEventDiscussionRecipients(mockEvent, senderUid);

  // Vérifications
  assert.ok(!recipientsA.includes(senderUid), "L'expéditeur ne doit pas s'auto-notifier");
  assert.ok(recipientsA.includes('uid-participant-confirm-2'), "L'inscrit confirmé doit être notifié");
  assert.ok(recipientsA.includes('uid-participant-inscrit-3'), "L'inscrit doit être notifié");
  assert.ok(!recipientsA.includes('uid-participant-absent-4'), "L'absent ne doit PAS être notifié");
  assert.ok(!recipientsA.includes('uid-participant-en-attente-5'), "Le membre non confirmé ne doit PAS être notifié");
  assert.ok(recipientsA.includes('uid-createur'), "Le créateur doit être notifié");
  assert.ok(recipientsA.includes('uid-auteur'), "L'auteur doit être notifié");
  assert.ok(recipientsA.includes('uid-referent-groupe'), "Le référent groupe Jour J doit être notifié");
  assert.ok(recipientsA.includes('uid-ref-alfaia'), "Le référent de pupitre doit être notifié");
  assert.ok(recipientsA.includes('uid-ref-caixa'), "Le second référent de pupitre doit être notifié");

  // Scénario B : Le message est envoyé par le créateur
  const recipientsB = getEventDiscussionRecipients(mockEvent, 'uid-createur');
  assert.ok(!recipientsB.includes('uid-createur'), "Le créateur expéditeur ne doit pas être notifié");
  assert.ok(recipientsB.includes('uid-participant-present-1'), "Le participant 1 doit recevoir la notification");

  console.log('✅ Test 2 (Identification des destinataires & exclusion expéditeur) réussi.');
}

// --- Test 3 : Structure du payload de notification ---
{
  const mockEvent = { id: 'carnaval-2026', titre: 'Grand Défilé' };
  const authorName = 'Maria Silva';
  const text = 'N’oubliez pas d’amener vos housses imperméables pour les alfaias en cas de pluie !';
  const excerpt = formatMessageExcerpt(text, 80);
  const recipientUid = 'uid-destinataire-test';

  const payload = {
    userId: recipientUid,
    type: 'event_discussion',
    title: `Nouveau message — ${mockEvent.titre}`,
    body: `${authorName} : ${excerpt}`,
    link: `/agenda?eventId=${mockEvent.id}&tab=discussion`,
    eventId: mockEvent.id,
    read: false,
    createdAt: new Date().toISOString()
  };

  assert.equal(payload.userId, 'uid-destinataire-test');
  assert.equal(payload.type, 'event_discussion');
  assert.equal(payload.title, 'Nouveau message — Grand Défilé');
  assert.equal(payload.body, `Maria Silva : ${excerpt}`);
  assert.equal(payload.link, '/agenda?eventId=carnaval-2026&tab=discussion');
  assert.equal(payload.eventId, 'carnaval-2026');
  assert.equal(payload.read, false);
  assert.ok(typeof payload.createdAt === 'string');

  console.log('✅ Test 3 (Structure conforme du payload de notification) réussi :');
  console.log(payload);
}

// --- Test 4 : Vérification de la fonction buildEventDiscussionNotificationPayload ---
{
  const testEvent = { id: 'stage-maracatu-2026', titre: 'Stage Immersion Maracatu' };
  const payload = buildEventDiscussionNotificationPayload({
    recipientUid: 'uid-participant-789',
    event: testEvent,
    authorName: 'Jean Dupont',
    text: 'Pensez à apporter de l’eau et vos sangles pour les tambours.',
    groupId: 'samambaia',
    createdAtIso: '2026-09-30T16:00:00.000Z'
  });

  assert.equal(payload.userId, 'uid-participant-789');
  assert.equal(payload.type, 'event_discussion');
  assert.equal(payload.title, 'Nouveau message — Stage Immersion Maracatu');
  assert.equal(payload.body, 'Jean Dupont : Pensez à apporter de l’eau et vos sangles pour les tambours.');
  assert.equal(payload.link, '/agenda?eventId=stage-maracatu-2026&tab=discussion');
  assert.equal(payload.targetUrl, '/agenda?eventId=stage-maracatu-2026&tab=discussion');
  assert.equal(payload.eventId, 'stage-maracatu-2026');
  assert.equal(payload.read, false);
  assert.equal(payload.isRead, false);
  assert.equal(payload.groupId, 'samambaia');
  assert.equal(payload.createdAt, '2026-09-30T16:00:00.000Z');

  console.log('✅ Test 4 (Génération via buildEventDiscussionNotificationPayload) réussi.');
}

console.log('🎉 Tous les tests unitaires et fonctionnels sont validés à 100% !');
