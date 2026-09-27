import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Lancement des tests de validation de la MISSION 2 : MODULE FEUILLE DE ROUTE...");

const rootDir = process.cwd();

// 1. Règle anti-monolithe (< 200 lignes)
const componentsToCheck = [
  'src/components/event-details/RoadbookModal.jsx',
  'src/components/event-details/RoadbookInteractiveContent.jsx',
  'src/components/event-details/RoadbookPrintView.jsx',
  'src/components/event-details/EventRoadbookFormSection.jsx',
  'src/components/event-details/EventRoadbookParcoursFields.jsx',
  'src/components/event-details/EventRoadbookContactsFields.jsx'
];

for (const relPath of componentsToCheck) {
  const fullPath = path.join(rootDir, relPath);
  assert(fs.existsSync(fullPath), `Le fichier ${relPath} doit exister.`);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lineCount = content.split('\n').length;
  console.log(`📏 [Anti-monolithe] ${relPath} : ${lineCount} lignes`);
  assert(
    lineCount < 200,
    `Le fichier ${relPath} (${lineCount} lignes) dépasse le seuil strict de 200 lignes !`
  );
}

// 2. Vérification des données dans EventDetails.jsx
const eventDetailsPath = path.join(rootDir, 'src/components/EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');

assert(
  eventDetailsContent.includes('RoadbookModal'),
  "EventDetails.jsx doit importer et utiliser RoadbookModal."
);
assert(
  eventDetailsContent.includes('showRoadbookModal'),
  "EventDetails.jsx doit gérer l'état showRoadbookModal."
);
assert(
  eventDetailsContent.includes('formatJeu:'),
  "buildEditFormFromEvent et updateDoc doivent intégrer formatJeu."
);
assert(
  eventDetailsContent.includes('parcours:'),
  "buildEditFormFromEvent et updateDoc doivent intégrer parcours."
);
assert(
  eventDetailsContent.includes('hebergement:'),
  "buildEditFormFromEvent et updateDoc doivent intégrer hebergement."
);
assert(
  eventDetailsContent.includes('logistiqueDepart:'),
  "buildEditFormFromEvent et updateDoc doivent intégrer logistiqueDepart."
);
assert(
  eventDetailsContent.includes('contactsJourJ:'),
  "buildEditFormFromEvent et updateDoc doivent intégrer contactsJourJ."
);

// 3. Vérification du formulaire EventEditForm.jsx
const eventEditFormPath = path.join(rootDir, 'src/components/event-details/EventEditForm.jsx');
const eventEditFormContent = fs.readFileSync(eventEditFormPath, 'utf8');
assert(
  eventEditFormContent.includes('EventRoadbookFormSection'),
  "EventEditForm.jsx doit intégrer EventRoadbookFormSection."
);
assert(
  eventEditFormContent.includes('allUsers'),
  "EventEditForm.jsx doit recevoir allUsers pour les chefs de pupitre."
);

// 4. Vérification de la structure de RoadbookInteractiveContent et RoadbookModal
const roadbookInteractivePath = path.join(rootDir, 'src/components/event-details/RoadbookInteractiveContent.jsx');
const roadbookInteractiveContent = fs.readFileSync(roadbookInteractivePath, 'utf8');

assert(
  roadbookInteractiveContent.includes('href={`tel:'),
  "RoadbookInteractiveContent doit comporter des liens d'appel direct tel:..."
);
assert(
  roadbookInteractiveContent.includes('parcours.urlFichierParcours'),
  "RoadbookInteractiveContent doit permettre d'ouvrir l'annexe du tracé PDF."
);

const roadbookModalPath = path.join(rootDir, 'src/components/event-details/RoadbookModal.jsx');
const roadbookModalContent = fs.readFileSync(roadbookModalPath, 'utf8');
assert(
  roadbookModalContent.includes('window.print()'),
  "RoadbookModal doit intégrer la commande d'impression window.print()."
);
assert(
  roadbookModalContent.includes('isStageLayoutPublished'),
  "RoadbookModal doit conditionner l'accès au plan de scène à son statut publié."
);
assert(
  roadbookModalContent.includes('RoadbookPrintView'),
  "RoadbookModal doit intégrer la vue RoadbookPrintView pour l'impression A4."
);

// 5. Vérification des traductions
const frPath = path.join(rootDir, 'src/locales/fr.js');
const ptPath = path.join(rootDir, 'src/locales/pt.js');
const frContent = fs.readFileSync(frPath, 'utf8');
const ptContent = fs.readFileSync(ptPath, 'utf8');

assert(frContent.includes('roadbook:'), "fr.js doit contenir la clé 'roadbook'.");
assert(ptContent.includes('roadbook:'), "pt.js doit contenir la clé 'roadbook'.");

console.log("✅ TOUS LES TESTS DE LA MISSION 2 SONT PASSÉS AVEC SUCCÈS !");
