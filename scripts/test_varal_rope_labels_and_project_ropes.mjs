/**
 * Test de validation automatisé : Varal — Étiquettes de cordes et cordes de projets
 * Vérifie :
 * 1. Résolution dynamique des cordes de projets (projet_${eventId}) -> 🎪 PROJET : ${TITRE.toUpperCase()}
 * 2. Cartouche de secours systématique (Fallback) : zéro titre vide si documents présents
 * 3. Normalisation et libellé visible pour les tutoriels d'instruments (Alfaia, Gonguê, Caixa, Agbê)
 * 4. Style Cordel et règle anti-monolithe (< 200 lignes)
 */

import assert from 'assert';
import fs from 'fs';
import {
  DEFAULT_VARAL_CATEGORIES,
  CATEGORY_ALIASES,
  normalizeVaralCategoryId,
  resolveProjectRopeLabel,
  resolveVaralCategoryLabel,
  getCategoryLabel
} from '../src/utils/documentCategories.js';

console.log('🎪 TEST SUITE : VARAL — ÉTIQUETTES DE CORDES & CORDES DE PROJETS 🎪\n');

// Mock i18n
const mockTranslations = {
  'documents.Documents administratifs': 'Documents administratifs',
  'documents.ComptesRendus': 'Documents administratifs',
  'documents.TutorielsVideo': 'Tutoriels Vidéo',
  'documents.Tutoriels': 'Tutoriels',
  'documents.Toadas': 'Toadas',
  'documents.Culture': 'Culture',
  'documents.TutosFabrication': 'Tutos Fabrication',
  'documents.PhotosPrestations': 'Photos Prestations'
};
const mockT = (key) => mockTranslations[key] || key;

// -------------------------------------------------------------
// Test 1 : Résolution dynamique des cordes de projet
// -------------------------------------------------------------
console.log('▶️ Test 1 : Résolution dynamique des cordes de projet (projet_${eventId})...');

// Cas 1a : Titre trouvé dans allEventsMap
const allEventsMap = {
  'evt_30ans': { id: 'evt_30ans', titre: '30 ans de l\'asso' },
  'evt_carnaval': { id: 'evt_carnaval', title: 'Carnaval de Recife 2026' }
};

const label1a = resolveProjectRopeLabel({
  category: { id: 'projet_evt_30ans' },
  documents: [],
  allEventsMap
});
assert.strictEqual(label1a, '🎪 PROJET : 30 ANS DE L\'ASSO', 'Le titre doit être résolu depuis allEventsMap et en majuscules');

// Cas 1b : Titre trouvé dans la liste des événements
const eventsList = [{ id: 'evt_gala', titre: 'Gala Annuel' }];
const label1b = resolveProjectRopeLabel({
  category: 'projet_evt_gala',
  events: eventsList
});
assert.strictEqual(label1b, '🎪 PROJET : GALA ANNUEL', 'Le titre doit être résolu depuis events');

// Cas 1c : Titre trouvé dans le premier livret (eventTitle)
const docsWithTitle = [{ id: 'doc_1', eventTitle: 'Fête de la Ria' }];
const label1c = resolveProjectRopeLabel({
  category: { id: 'projet_evt_ria' },
  documents: docsWithTitle
});
assert.strictEqual(label1c, '🎪 PROJET : FÊTE DE LA RIA', 'Le titre doit être résolu depuis les livrets de la corde');

// Cas 1d : Nettoyage des préfixes existants (🎪, Projet :, Chantier :)
const docsPrefixed = [{ id: 'doc_2', eventTitle: '🎪 Projet : Chantier : Rénovation Tambours' }];
const label1d = resolveProjectRopeLabel({
  category: { id: 'projet_evt_reno' },
  documents: docsPrefixed
});
assert.strictEqual(label1d, '🎪 PROJET : RÉNOVATION TAMBOURS', 'Les préfixes redondants doivent être nettoyés');

// Cas 1e : Fallback propre avec l'ID d'événement si aucun titre n'est disponible
const label1e = resolveProjectRopeLabel({
  category: 'projet_event_inconnu',
  documents: []
});
assert.strictEqual(label1e, '🎪 PROJET : EVENT INCONNU', 'Doit afficher l\'ID en majuscule en cas d\'événement sans titre');

console.log('✅ Test 1 validé : Résolution dynamique des cordes de projet 100% conforme.\n');

// -------------------------------------------------------------
// Test 2 : Cartouche de secours systématique (Fallback)
// -------------------------------------------------------------
console.log('▶️ Test 2 : Cartouche de secours systématique (Zéro titre vide si documents)...');

// Cas 2a : Clé inconnue avec category.nom
const label2a = resolveVaralCategoryLabel({ id: 'custom_cat', nom: 'Chorégraphies & Pas' }, mockT, [{ id: 'd1' }]);
assert.strictEqual(label2a, 'CHORÉGRAPHIES & PAS', 'Doit utiliser category.nom en majuscules');

// Cas 2b : Clé inconnue avec category.label
const label2b = resolveVaralCategoryLabel({ id: 'autre_cat', label: 'Archives Sonores' }, mockT, [{ id: 'd1' }]);
assert.strictEqual(label2b, 'ARCHIVES SONORES', 'Doit utiliser category.label en majuscules');

// Cas 2c : Clé brute sans objet
const label2c = resolveVaralCategoryLabel('archives_presse', mockT, [{ id: 'd1' }]);
assert.strictEqual(label2c, 'ARCHIVES PRESSE', 'Doit formater la clé brute en remplaçant les underscores par des espaces');

// Cas 2d : Objet anonyme sans nom ni id mais avec documents
const label2d = resolveVaralCategoryLabel({}, mockT, [{ id: 'd1' }]);
assert.strictEqual(label2d, 'DOCUMENTS', 'Ne doit JAMAIS laisser un cartouche vide si des documents existent');

// Cas 2e : Corde de projet via resolveVaralCategoryLabel
const label2e = resolveVaralCategoryLabel({ id: 'projet_evt_30ans' }, mockT, [], [], allEventsMap);
assert.strictEqual(label2e, '🎪 PROJET : 30 ANS DE L\'ASSO', 'resolveVaralCategoryLabel doit déléguer proprement aux cordes de projet');

console.log('✅ Test 2 validé : Cartouche de secours systématique infaillible.\n');

// -------------------------------------------------------------
// Test 3 : Première corde (Vidéos / Pupitres / Instruments)
// -------------------------------------------------------------
console.log('▶️ Test 3 : Normalisation et étiquette visible pour les tutoriels d\'instruments...');

// Vérification de la normalisation des alias d'instruments et vidéos
const testAliases = ['tutos', 'Tutos', 'tutoriels', 'instruments', 'pupitres', 'videos', 'tutos_video', 'TutorielsVideo'];
testAliases.forEach(alias => {
  const norm = normalizeVaralCategoryId(alias);
  assert.strictEqual(norm, 'TutorielsVideo', `L'alias "${alias}" doit être normalisé en "TutorielsVideo"`);
});

// Vérification du libellé résolu pour les documents Alfaia, Gonguê, Caixa, Agbê
const docsInstruments = [
  { id: 'doc_alfaia', titre: 'Alfaia Marcante', categorie: 'tutos' },
  { id: 'doc_gongue', titre: 'Gonguê Cloche', categorie: 'instruments' },
  { id: 'doc_caixa', titre: 'Caixa de Guerra', categorie: 'pupitres' },
  { id: 'doc_agbe', titre: 'Agbê Rythmes', categorie: 'videos' }
];

docsInstruments.forEach(doc => {
  const normCat = normalizeVaralCategoryId(doc.categorie);
  const label = resolveVaralCategoryLabel({ id: normCat }, mockT, [doc]);
  assert.strictEqual(label, 'TUTORIELS VIDÉO', `Le document "${doc.titre}" doit afficher l'étiquette TUTORIELS VIDÉO`);
});

console.log('✅ Test 3 validé : Normalisation des catégories d\'instruments et libellé visible validés.\n');

// -------------------------------------------------------------
// Test 4 : Contrôle statique et Règle Anti-Monolithe (< 200 lignes)
// -------------------------------------------------------------
console.log('▶️ Test 4 : Contrôles de code source et règle anti-monolithe...');

// Contrôle taille src/utils/documentCategories.js
const docCatContent = fs.readFileSync('src/utils/documentCategories.js', 'utf8');
const docCatLines = docCatContent.trim().split('\n').length;
assert(docCatLines < 200, `documentCategories.js doit faire < 200 lignes (actuel: ${docCatLines})`);

// Contrôle présence de getCategoryLabel et resolveVaralCategoryLabel dans VaralCategoryRope.jsx
const ropeContent = fs.readFileSync('src/components/documents/varal/VaralCategoryRope.jsx', 'utf8');
assert(ropeContent.includes('resolveVaralCategoryLabel'), 'VaralCategoryRope.jsx doit utiliser resolveVaralCategoryLabel');
assert(ropeContent.includes('getCategoryLabel'), 'VaralCategoryRope.jsx doit contenir getCategoryLabel pour éviter ReferenceError');
assert(ropeContent.includes('theme-stamp-badge'), 'VaralCategoryRope.jsx doit utiliser theme-stamp-badge');
assert(ropeContent.includes('uppercase'), 'VaralCategoryRope.jsx doit forcer le style uppercase');

// Contrôle VaralEmptyRopeAdmin.jsx
const emptyRopeContent = fs.readFileSync('src/components/documents/varal/VaralEmptyRopeAdmin.jsx', 'utf8');
assert(emptyRopeContent.includes('resolveVaralCategoryLabel'), 'VaralEmptyRopeAdmin.jsx doit utiliser resolveVaralCategoryLabel');
assert(emptyRopeContent.includes('getCategoryLabel'), 'VaralEmptyRopeAdmin.jsx doit contenir getCategoryLabel');
assert(emptyRopeContent.includes('uppercase'), 'VaralEmptyRopeAdmin.jsx doit forcer le style uppercase');

// Contrôle WidgetDocuments.jsx
const widgetContent = fs.readFileSync('src/components/WidgetDocuments.jsx', 'utf8');
assert(widgetContent.includes('allEventsMap={allEventsMap}'), 'WidgetDocuments.jsx doit transmettre allEventsMap à VaralCategoryRope');

console.log('✅ Test 4 validé : Fichiers modulaires, classes Cordel et transmission allEventsMap vérifiées.\n');

// -------------------------------------------------------------
// Test 5 : Fonction getCategoryLabel (utilitaire universel)
// -------------------------------------------------------------
console.log('▶️ Test 5 : Fonction utilitaire getCategoryLabel (repli et résolution directe)...');

assert.strictEqual(getCategoryLabel('Toadas'), 'TOADAS');
assert.strictEqual(getCategoryLabel('tutos_fabrication'), 'TUTOS FABRICATION');
assert.strictEqual(getCategoryLabel('projet_30ans', '30 ans de l\'asso'), '🎪 PROJET : 30 ANS DE L\'ASSO');
assert.strictEqual(getCategoryLabel('projet_carnaval'), '🎪 PROJET : CARNAVAL');
assert.strictEqual(getCategoryLabel({ id: 'projet_gala', nom: 'Gala Annuel' }), '🎪 PROJET : GALA ANNUEL');
assert.strictEqual(getCategoryLabel(null), 'DOCUMENTS');
assert.strictEqual(getCategoryLabel(''), 'DOCUMENTS');

console.log('✅ Test 5 validé : getCategoryLabel fonctionne sur tous les cas de figure sans ReferenceError.\n');

console.log('🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS DU VARAL SONT VALIDÉES ! 🏆');
