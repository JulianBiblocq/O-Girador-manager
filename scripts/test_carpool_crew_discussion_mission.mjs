import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Lancement des tests de validation de la MISSION : RETOUR DIRECT & DISCUSSION D'ÉQUIPAGE COVOITURAGE...");

const rootDir = process.cwd();

// 1. Règle anti-monolithe (< 200 lignes) pour tous les composants covoiturage créés ou refactorisés
const componentsToCheck = [
  'src/components/event-details/EventCarpoolSection.jsx',
  'src/components/event-details/CarCard.jsx',
  'src/components/event-details/CarDiscussionModal.jsx',
  'src/components/event-details/CarpoolSearchersQueue.jsx',
  'src/components/event-details/CarpoolProposerForm.jsx',
  'src/components/event-details/CarpoolAdminRefundPanel.jsx'
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

// 2. Vérification de l'option "Retour direct" (UI & modèle)
const carCardPath = path.join(rootDir, 'src/components/event-details/CarCard.jsx');
const carCardContent = fs.readFileSync(carCardPath, 'utf8');
assert(
  carCardContent.includes('⚡ Retour direct'),
  "CarCard.jsx doit afficher le badge '⚡ Retour direct' lorsque la voiture a retourDirect."
);
assert(
  carCardContent.includes('💬 Équipage'),
  "CarCard.jsx doit comporter le bouton '💬 Équipage'."
);
assert(
  carCardContent.includes('doitRentrerDirect'),
  "CarCard.jsx doit prendre en compte doitRentrerDirect pour les passagers."
);

const carpoolSearchersPath = path.join(rootDir, 'src/components/event-details/CarpoolSearchersQueue.jsx');
const carpoolSearchersContent = fs.readFileSync(carpoolSearchersPath, 'utf8');
assert(
  carpoolSearchersContent.includes('⚡ Retour direct après le jeu (impératif horaire)'),
  "CarpoolSearchersQueue.jsx doit proposer la case à cocher '⚡ Retour direct après le jeu (impératif horaire)'."
);
assert(
  carpoolSearchersContent.includes('⚡ Impératif retour direct'),
  "CarpoolSearchersQueue.jsx doit afficher la pastille '⚡ Impératif retour direct' pour les demandeurs."
);

const carpoolProposerPath = path.join(rootDir, 'src/components/event-details/CarpoolProposerForm.jsx');
const carpoolProposerContent = fs.readFileSync(carpoolProposerPath, 'utf8');
assert(
  carpoolProposerContent.includes('⚡ Retour direct après le jeu (impératif horaire)'),
  "CarpoolProposerForm.jsx doit proposer la case '⚡ Retour direct après le jeu (impératif horaire)'."
);
assert(
  carpoolProposerContent.includes('voitureForm.retourDirect'),
  "CarpoolProposerForm.jsx doit lier la case à voitureForm.retourDirect."
);

// 3. Vérification du composant CarDiscussionModal.jsx
const discussionModalPath = path.join(rootDir, 'src/components/event-details/CarDiscussionModal.jsx');
const discussionModalContent = fs.readFileSync(discussionModalPath, 'utf8');
assert(
  discussionModalContent.includes('onSendMessage'),
  "CarDiscussionModal.jsx doit appeler onSendMessage pour diffuser le message."
);
assert(
  discussionModalContent.includes('messagesEndRef'),
  "CarDiscussionModal.jsx doit faire défiler automatiquement le fil de discussion vers le bas."
);
assert(
  discussionModalContent.includes('Équipage de'),
  "CarDiscussionModal.jsx doit afficher le titre avec le nom du chauffeur."
);

// 4. Vérification du hook useEventCarpool.js
const hookPath = path.join(rootDir, 'src/hooks/useEventCarpool.js');
const hookContent = fs.readFileSync(hookPath, 'utf8');
assert(
  hookContent.includes('handleSendCarMessage'),
  "useEventCarpool.js doit implémenter et exporter handleSendCarMessage."
);
assert(
  hookContent.includes('retourDirect: Boolean(voitureForm.retourDirect)'),
  "useEventCarpool.js doit persister retourDirect dans l'objet voiture."
);
assert(
  hookContent.includes('doitRentrerDirect: Boolean(joinForm.doitRentrerDirect)'),
  "useEventCarpool.js doit persister doitRentrerDirect lors de l'inscription passager."
);
assert(
  hookContent.includes('doitRentrerDirect: Boolean(doitRentrerDirect)'),
  "useEventCarpool.js doit persister doitRentrerDirect lors de la recherche de place."
);

// 5. Vérification du câblage dans EventDetails.jsx et TabLogistics.jsx
const eventDetailsPath = path.join(rootDir, 'src/components/EventDetails.jsx');
const eventDetailsContent = fs.readFileSync(eventDetailsPath, 'utf8');
assert(
  eventDetailsContent.includes('handleSendCarMessage'),
  "EventDetails.jsx doit déstructurer et passer handleSendCarMessage."
);

const tabLogisticsPath = path.join(rootDir, 'src/components/event-details/tabs/TabLogistics.jsx');
const tabLogisticsContent = fs.readFileSync(tabLogisticsPath, 'utf8');
assert(
  tabLogisticsContent.includes('handleSendCarMessage'),
  "TabLogistics.jsx doit relayer handleSendCarMessage à EventCarpoolSection."
);

// 6. Vérification des traductions
const frPath = path.join(rootDir, 'src/locales/fr.js');
const ptPath = path.join(rootDir, 'src/locales/pt.js');
const frContent = fs.readFileSync(frPath, 'utf8');
const ptContent = fs.readFileSync(ptPath, 'utf8');

assert(frContent.includes('carpool:'), "fr.js doit contenir la clé 'carpool'.");
assert(frContent.includes('directReturnLabel'), "fr.js doit contenir directReturnLabel.");
assert(ptContent.includes('carpool:'), "pt.js doit contenir la clé 'carpool'.");
assert(ptContent.includes('directReturnLabel'), "pt.js doit contenir directReturnLabel.");

console.log("✅ TOUS LES TESTS DE LA MISSION RETOUR DIRECT & DISCUSSION D'ÉQUIPAGE SONT PASSÉS AVEC SUCCÈS !");
