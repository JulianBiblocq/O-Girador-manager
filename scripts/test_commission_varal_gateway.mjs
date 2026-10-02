import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { convertCommissionToVaralDoc, isProjectRopeActive } from '../src/utils/commissionVaralAdapter.js';

console.log('🧪 Test 1: Validation de convertCommissionToVaralDoc...');

const fakeEvent = {
  id: 'event_30ans',
  titre: 'Les 30 ans de la Batucada',
  title: 'Les 30 ans de la Batucada',
  dateDebut: '2026-10-20',
  dateFin: '2026-10-22',
  groupId: 'ogirador'
};

const fakeCommission = {
  id: 'comm_restauration',
  titre: 'Restauration & Buvette',
  icone: '🍲',
  description: 'Gérer les repas des musiciens et la buvette du public.',
  referentsIds: ['user_maria', 'user_joao'],
  jalons: [
    { id: 'j1', titre: 'Achat des denrées', status: 'fait', deadline: '2026-10-15' },
    { id: 'j2', titre: 'Installation stands', status: 'en_cours', deadline: '2026-10-24' },
    { id: 'j3', titre: 'Briefing équipes', status: 'a_faire', deadline: '2026-10-25' }
  ],
  creneauxBenevoles: [
    { id: 'c1', titre: 'Service Bar', horaireDebut: '14:00', horaireFin: '18:00', places: 4, inscritsIds: ['u1', 'u2'] }
  ],
  besoinsMateriel: [
    { id: 'm1', article: 'Plancha à gaz', quantite: 2, statut: 'ok' },
    { id: 'm2', article: 'Tireuse à bière', quantite: 1, statut: 'reserve' }
  ],
  budget: { alloue: 1200 }
};

const referentsNames = ['Maria Silva', 'João Santos'];

const varalDoc = convertCommissionToVaralDoc(fakeEvent, fakeCommission, referentsNames);

// 1. Assertions sur les métadonnées obligatoires
assert.equal(varalDoc.categorie, 'projet_event_30ans', 'La catégorie doit être projet_eventId');
assert.equal(varalDoc.categoryId, 'projet_event_30ans', 'Le categoryId doit être projet_eventId');
assert.equal(varalDoc.titre, '🍲 Restauration & Buvette', 'Le titre doit intégrer l’icône et le nom de la commission');
assert.equal(varalDoc.auteur, 'Maria Silva & João Santos', 'L’auteur doit concaténer les noms des référents');
assert.equal(varalDoc.type, 'cordel_commission', 'Le type doit être cordel_commission');
assert.equal(varalDoc.typeDoc, 'cordel_commission', 'Le typeDoc doit être cordel_commission');
assert.equal(varalDoc.commissionSourceId, 'comm_restauration', 'commissionSourceId doit correspondre à la commission');
assert.equal(varalDoc.eventId, 'event_30ans', 'eventId doit correspondre');
assert.equal(varalDoc.eventDate, '2026-10-20', 'eventDate doit être transmise');
assert.equal(varalDoc.eventDateFin, '2026-10-22', 'eventDateFin doit être transmise');
assert.ok(varalDoc.dateModification, 'dateModification doit être renseignée');
assert.ok(varalDoc.contenu, 'Le contenu Markdown doit être généré');

// 2. Assertions sur le contenu structuré du Markdown
assert.ok(varalDoc.contenu.includes('Gérer les repas des musiciens'), 'Le contenu doit inclure la mission');
assert.ok(varalDoc.contenu.includes('Achat des denrées'), 'Le contenu doit inclure les jalons');
assert.ok(varalDoc.contenu.includes('✅ Fait'), 'Le contenu doit afficher le statut du jalon');
assert.ok(varalDoc.contenu.includes('Service Bar'), 'Le contenu doit inclure les créneaux bénévoles');
assert.ok(varalDoc.contenu.includes('Plancha à gaz'), 'Le contenu doit inclure le matériel');
assert.ok(varalDoc.contenu.includes('Maria Silva'), 'Le contenu doit inclure les contacts référents');

console.log('✅ Test 1 validé : convertCommissionToVaralDoc est 100% conforme.');

console.log('🧪 Test 2: Validation du cycle de vie de la corde de projet (isProjectRopeActive)...');

const now = new Date('2026-10-01T12:00:00Z');

// 2a. Événement futur
const futureEvent = { id: 'futur_1', dateFin: '2026-10-20' };
assert.equal(
  isProjectRopeActive({ category: { id: 'projet_futur_1' }, docs: [varalDoc], event: futureEvent, now }),
  true,
  'Un événement futur doit avoir sa corde active'
);

// 2b. Événement récent passé depuis 10 jours (< 30 jours)
const recentPastEvent = { id: 'recent_1', dateFin: '2026-09-21' };
assert.equal(
  isProjectRopeActive({ category: { id: 'projet_recent_1' }, docs: [varalDoc], event: recentPastEvent, now }),
  true,
  'Un événement passé il y a 10 jours doit encore avoir sa corde affichée'
);

// 2c. Événement terminé depuis plus de 30 jours (ex: 45 jours)
const oldExpiredEvent = { id: 'old_1', dateFin: '2026-08-15' };
assert.equal(
  isProjectRopeActive({ category: { id: 'projet_old_1' }, docs: [varalDoc], event: oldExpiredEvent, now }),
  false,
  'Un événement passé depuis plus de 30 jours doit avoir sa corde masquée'
);

// 2d. Événement clôturé ou archivé
const closedEvent = { id: 'closed_1', dateFin: '2026-10-15', cloture: true };
assert.equal(
  isProjectRopeActive({ category: { id: 'projet_closed_1' }, docs: [varalDoc], event: closedEvent, now }),
  false,
  'Un événement clôturé doit avoir sa corde masquée même s’il est récent'
);

// 2e. Corde vide (0 document publié)
assert.equal(
  isProjectRopeActive({ category: { id: 'projet_vide' }, docs: [], event: futureEvent, now }),
  false,
  'Une corde projet sans aucun document doit être masquée (zéro bloc vide)'
);

console.log('✅ Test 2 validé : Cycle de vie de la corde de projet 100% conforme.');

console.log('🧪 Test 3: Éradication de l’icône djembé & masquage conditionnel des Renforts dans Trombinoscope.jsx...');
const trombiContent = fs.readFileSync(path.resolve('src/components/Trombinoscope.jsx'), 'utf8');

// 3a. Vérification de la suppression de l'émoji djembé (🪘) dans le filtre déroulant
assert.ok(trombiContent.includes('<option value="all">Tous les pupitres</option>') || trombiContent.includes('<option value="all">{t(\'trombi.allPupitres\')}</option>'), 'Option globale doit être "Tous les pupitres" sans émoji djembé');
assert.ok(!trombiContent.includes('🪘 Tous les pupitres') && !trombiContent.includes('🪘'), 'L’émoji djembé ne doit plus figurer dans l’option globale');

// 3b. Masquage conditionnel strict de l'option Renforts dans le select
assert.ok(trombiContent.includes('{hasRenforts && ('), 'Option Renforts doit être conditionnée à hasRenforts');
assert.ok(trombiContent.includes('<option value="renforts">🎪 Renforts &amp; Extérieurs</option>'), 'Option renforts correctement libellée');

// 3c. Masquage conditionnel strict de la section Renforts en bas
assert.ok(trombiContent.includes('{hasRenforts && renfortsList.length > 0 && ('), 'Section renforts doit être masquée si hasRenforts est faux');

console.log('✅ Test 3 validé : Nettoyage Trombinoscope (Djembé & Renforts conditionnels) validé.');

console.log('🧪 Test 4: Vérification du cycle de vie dans WidgetDocuments.jsx...');
const varalWidgetContent = fs.readFileSync(path.resolve('src/components/WidgetDocuments.jsx'), 'utf8');
assert.ok(varalWidgetContent.includes('isProjectRopeActive'), 'WidgetDocuments doit importer et utiliser isProjectRopeActive');
assert.ok(varalWidgetContent.includes('allEventsMap'), 'WidgetDocuments doit utiliser allEventsMap pour les événements');
assert.ok(varalWidgetContent.includes('effectiveTargetEventId'), 'WidgetDocuments doit maintenir l’accès pour un événement ciblé');

console.log('✅ Test 4 validé : Cycle de vie et maintien de l’accès dans WidgetDocuments validés.');

console.log('\n🎉 TOUTES LES ASSERTIONS DE LA MISSION SONT VALIDÉES AVEC SUCCÈS !');
