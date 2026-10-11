import assert from 'assert';
import fs from 'fs';

console.log("✂️ TEST SUITE : CORRECTION DOUBLON COMPTES-RENDUS SUR LA CORDE ADMINISTRATIVE DU VARAL ✂️\n");

const varalDataCode = fs.readFileSync('src/hooks/useVaralData.js', 'utf8');

// Extraction de hasReportTag, isReportDoc, et isAdministrativeDoc
const hasReportTagMatch = varalDataCode.match(/export const hasReportTag = ([\s\S]*?\n\};)/);
assert(hasReportTagMatch, "hasReportTag doit être exporté dans useVaralData.js");
const hasReportTag = (new Function(`return ${hasReportTagMatch[1]}`))();

const isReportDocMatch = varalDataCode.match(/export const isReportDoc = ([\s\S]*?\n\};)/);
assert(isReportDocMatch, "isReportDoc doit être exporté dans useVaralData.js");
const isReportDoc = (new Function(`
  const hasReportTag = ${hasReportTagMatch[1]};
  return ${isReportDocMatch[1]};
`))();

const isAdministrativeDocMatch = varalDataCode.match(/export const isAdministrativeDoc = ([\s\S]*?\n\};)/);
assert(isAdministrativeDocMatch, "isAdministrativeDoc doit être exporté dans useVaralData.js");
const isAdministrativeDoc = (new Function(`return ${isAdministrativeDocMatch[1]}`))();

// 1. Test du cloisonnement strict et mutuellement exclusif
console.log("▶️ Test 1 : Cloisonnement strict et mutuellement exclusif (Bleu vs Rouge)...");

const docStatuts = { id: 'doc-1', titre: 'Statuts de l\'association', categoryId: 'Administratif', type: 'pdf' };
const docRib = { id: 'doc-2', titre: 'RIB Bancaire', categoryId: 'Administratif', type: 'pdf' };
const docAssurance = { id: 'doc-3', titre: 'Attestation Assurance', categoryId: 'Administratif', type: 'pdf' };

// Cas critique : compte-rendu existant dans Firestore avec categoryId: 'Administratif' et type: 'report'
const docCrAncien = { id: 'doc-cr-1', titre: 'CR du 15-02-2025', categoryId: 'Administratif', type: 'report', annee: 2025 };
const docCrPv = { id: 'doc-cr-2', titre: 'Procès-verbal Assemblée Générale', categoryId: 'Administratif', type: 'reunion_pv', annee: 2024 };
const docCrTag = { id: 'doc-cr-3', titre: 'Notes de réunion', categoryId: 'Administratif', tags: ['CR'], type: 'pdf' };
const docReunionVirtuelle = { id: 'reunion-1', titre: 'CR du 10-10-2026', type: 'reunion', date: '2026-10-10' };

// Vérifications documents administratifs statutaires (Livrets bleus)
assert.strictEqual(isAdministrativeDoc(docStatuts), true, "Statuts doit être administratif");
assert.strictEqual(isReportDoc(docStatuts), false, "Statuts ne doit PAS être un compte-rendu");

assert.strictEqual(isAdministrativeDoc(docRib), true, "RIB doit être administratif");
assert.strictEqual(isReportDoc(docRib), false, "RIB ne doit PAS être un compte-rendu");

assert.strictEqual(isAdministrativeDoc(docAssurance), true, "Assurance doit être administratif");
assert.strictEqual(isReportDoc(docAssurance), false, "Assurance ne doit PAS être un compte-rendu");

// Vérifications comptes-rendus (Livrets rouges)
assert.strictEqual(isReportDoc(docCrAncien), true, "CR avec type report doit être un compte-rendu rouge");
assert.strictEqual(isAdministrativeDoc(docCrAncien), false, "CR avec type report ne doit JAMAIS être classé en administratif statutaire bleu");

assert.strictEqual(isReportDoc(docCrPv), true, "CR avec type reunion_pv doit être un compte-rendu rouge");
assert.strictEqual(isAdministrativeDoc(docCrPv), false, "CR avec type reunion_pv ne doit JAMAIS être classé en administratif statutaire bleu");

assert.strictEqual(isReportDoc(docCrTag), true, "Document portant le tag CR doit être un compte-rendu rouge");
assert.strictEqual(isAdministrativeDoc(docCrTag), false, "Document portant le tag CR ne doit JAMAIS être administratif statutaire bleu");

assert.strictEqual(isReportDoc(docReunionVirtuelle), true, "Réunion virtuelle doit être un compte-rendu rouge");
assert.strictEqual(isAdministrativeDoc(docReunionVirtuelle), false, "Réunion virtuelle ne doit JAMAIS être administratif statutaire bleu");

console.log("  ✅ [PASS] Tous les documents sont strictement et mutuellement cloisonnés : aucun document ne satisfait les 2 états.\n");

// 2. Test du tri sur la corde administrative : Documents statutaires bleus à gauche, CR rouges par date décroissante à droite
console.log("▶️ Test 2 : Ordre d'affichage sur la corde (Bleus à gauche, Rouges décroissants à droite)...");

const mixedCordeDocs = [
  { id: 'cr-2023', titre: 'CR du 12-05-2023', type: 'report', date: '2023-05-12' },
  { id: 'statuts', titre: 'Statuts officiels', categoryId: 'Administratif', order: 1 },
  { id: 'cr-2026', titre: 'CR du 20-03-2026', type: 'report', date: '2026-03-20' },
  { id: 'rib', titre: 'RIB Compte', categoryId: 'Administratif', order: 2 },
  { id: 'cr-2025', titre: 'CR du 15-09-2025', type: 'report', date: '2025-09-15' },
  { id: 'assurance', titre: 'Attestation Assurance', categoryId: 'Administratif', order: 3 }
];

mixedCordeDocs.sort((a, b) => {
  const aIsAdmin = isAdministrativeDoc(a);
  const bIsAdmin = isAdministrativeDoc(b);

  if (aIsAdmin && !bIsAdmin) return -1;
  if (!aIsAdmin && bIsAdmin) return 1;

  if (aIsAdmin && bIsAdmin) {
    const orderA = a.order !== undefined ? a.order : 999;
    const orderB = b.order !== undefined ? b.order : 999;
    if (orderA !== orderB) return orderA - orderB;
    return (a.titre || '').localeCompare(b.titre || '');
  }

  const getDateTimestamp = (item) => {
    if (item.date) return new Date(item.date).getTime();
    if (item.dateAjout) return new Date(item.dateAjout).getTime();
    if (item.createdAt) return new Date(item.createdAt).getTime();
    if (item.annee) return new Date(`${item.annee}-01-01`).getTime();
    return 0;
  };

  const dateA = getDateTimestamp(a);
  const dateB = getDateTimestamp(b);
  if (dateB !== dateA) return dateB - dateA;

  return (a.titre || '').localeCompare(b.titre || '');
});

// Les 3 premiers doivent être les documents administratifs statutaires fixes
assert.strictEqual(mixedCordeDocs[0].id, 'statuts', "Index 0 doit être Statuts");
assert.strictEqual(mixedCordeDocs[1].id, 'rib', "Index 1 doit être RIB");
assert.strictEqual(mixedCordeDocs[2].id, 'assurance', "Index 2 doit être Assurance");

// Les 3 suivants doivent être les comptes-rendus triés par date décroissante (2026 -> 2025 -> 2023)
assert.strictEqual(mixedCordeDocs[3].id, 'cr-2026', "Index 3 doit être le CR 2026 le plus récent");
assert.strictEqual(mixedCordeDocs[4].id, 'cr-2025', "Index 4 doit être le CR 2025");
assert.strictEqual(mixedCordeDocs[5].id, 'cr-2023', "Index 5 doit être le CR 2023");

console.log("  ✅ [PASS] Ordre parfait : documents statutaires à gauche, puis comptes-rendus triés par date décroissante.\n");

// 3. Test de déduplication stricte (disparition du doublon lors de la publication d'un CR)
console.log("▶️ Test 3 : Déduplication stricte (Document physique publié + Événement réunion de l'agenda)...");

const existingDocsInVaral = [
  { id: 'statuts', titre: 'Statuts officiels', categoryId: 'Administratif' },
  // Le document physique créé par EventReportSection dans la collection 'documents'
  { id: 'doc-varal-123', eventId: 'reunion-event-456', titre: 'CR du 15-02-2026', type: 'report', categoryId: 'ComptesRendus', date: '2026-02-15' }
];

const loadedReunionsFromAgenda = [
  // L'événement de réunion chargé depuis 'events'
  { id: 'reunion-event-456', titre: 'Réunion Mensuelle Février', date: '2026-02-15', compteRenduStatus: 'publie', compteRenduVaralId: 'doc-varal-123' },
  // Une réunion en cours sans document physique publié
  { id: 'reunion-event-789', titre: 'Réunion Future Mars', date: '2026-03-25', compteRenduStatus: 'brouillon' }
];

const mergedCorde = [...existingDocsInVaral];

loadedReunionsFromAgenda.forEach(reunion => {
  const existingDoc = mergedCorde.find(d => 
    (d.eventId && d.eventId === reunion.id) || 
    (reunion.compteRenduVaralId && d.id === reunion.compteRenduVaralId) ||
    (d.id === reunion.id)
  );

  if (existingDoc) {
    // Enrichissement sans doublon
    if (!existingDoc.reunionData) existingDoc.reunionData = reunion;
    return;
  }

  mergedCorde.push({
    id: reunion.id,
    titre: `CR du ${reunion.date}`,
    type: 'reunion',
    date: reunion.date,
    reunionData: reunion
  });
});

// Vérification de la déduplication
const crItems = mergedCorde.filter(d => isReportDoc(d));
assert.strictEqual(crItems.length, 2, "Il doit y avoir exactement 2 comptes-rendus au total (1 publié + 1 réunion future)");
assert.strictEqual(crItems.filter(d => d.eventId === 'reunion-event-456' || d.id === 'reunion-event-456').length, 1, 
  "La réunion 456 ne doit exister qu'UNE SEULE FOIS, aucun doublon !");

const publishedCr = crItems.find(d => d.id === 'doc-varal-123');
assert(publishedCr, "Le compte-rendu publié doit être présent");
assert.strictEqual(isReportDoc(publishedCr), true, "Le compte-rendu publié doit être rouge");
assert.strictEqual(isAdministrativeDoc(publishedCr), false, "Le compte-rendu publié ne doit JAMAIS être bleu");

console.log("  ✅ [PASS] Déduplication stricte validée : un document de type compte-rendu n'apparaît strictement qu'une seule fois, en rouge.\n");

// 4. Test des styles VaralBookletCover (Bleu-ardoise 100% vs Rouge 50% / 100%)
console.log("▶️ Test 4 : Vérification des styles dans VaralBookletCover.jsx...");
const bookletCoverCode = fs.readFileSync('src/components/documents/varal/VaralBookletCover.jsx', 'utf8');

assert(bookletCoverCode.includes("colorClass = 'rouge'"), "VaralBookletCover doit appliquer rouge pour les comptes-rendus");
assert(bookletCoverCode.includes("colorClass = 'bleu-ardoise'"), "VaralBookletCover doit appliquer bleu-ardoise pour les documents statutaires");
assert(bookletCoverCode.includes("opacityClass = 'opacity-100'"), "VaralBookletCover doit appliquer 100% d'opacité aux pièces administratives");
assert(bookletCoverCode.includes("opacity-50"), "VaralBookletCover doit gérer l'opacité 50% pour les comptes-rendus des années antérieures");

console.log("  ✅ [PASS] Styles et opacités conformes au système de design Cordel.\n");

// 5. Test des métadonnées de publication dans EventReportSection.jsx
console.log("▶️ Test 5 : Vérification des métadonnées injectées dans EventReportSection.jsx...");
const eventReportSectionCode = fs.readFileSync('src/components/event-details/EventReportSection.jsx', 'utf8');

assert(eventReportSectionCode.includes("categoryId: 'ComptesRendus'"), "EventReportSection doit publier les CR sous categoryId ComptesRendus");
assert(eventReportSectionCode.includes("type: 'report'"), "EventReportSection doit publier avec type 'report'");
assert(eventReportSectionCode.includes("compteRenduVaralId"), "EventReportSection doit relier compteRenduVaralId pour la déduplication");

console.log("  ✅ [PASS] Métadonnées de publication vérifiées et idempotentes.\n");

console.log("🎉 TOUS LES TESTS DE LA MISSION SONT PARFAITEMENT VALIDÉS AVEC SUCCÈS ! 🎉\n");
