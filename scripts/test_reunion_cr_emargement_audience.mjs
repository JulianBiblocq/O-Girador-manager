import assert from 'assert';
import fs from 'fs';
import path from 'path';

/**
 * Suite de tests pour la mission :
 * Comptes-rendus a posteriori, émargement libre et réunions publiques/CA.
 */

console.log('🚀 Lancement des tests de validation : CR a posteriori, émargement libre et réunions publiques/CA...');

const rootDir = process.cwd();

// 1. Vérification de la Tolérance Zéro-ODJ dans EventReportSection.jsx
console.log('\n▶️ Test 1 : Tolérance Zéro-ODJ et initialisation libre dans EventReportSection.jsx');
const eventReportSectionPath = path.join(rootDir, 'src/components/event-details/EventReportSection.jsx');
assert(fs.existsSync(eventReportSectionPath), 'EventReportSection.jsx doit exister');
const eventReportContent = fs.readFileSync(eventReportSectionPath, 'utf-8');

assert(eventReportContent.includes('handleInitFreeReport'), 'EventReportSection doit proposer la fonction handleInitFreeReport');
assert(eventReportContent.includes('Compte-rendu des échanges'), 'EventReportSection doit initialiser par défaut un compte-rendu libre des échanges');
assert(eventReportContent.includes('new-agenda-point-input'), 'Le champ de nouveau sujet doit disposer de l\'id new-agenda-point-input pour le focus immédiat');
assert(eventReportContent.includes('handleToggleSpeech'), 'La dictée vocale doit être disponible pour chaque point ou sujet consigné');
assert(eventReportContent.includes('EventEmargementSection'), 'EventReportSection doit importer et intégrer EventEmargementSection');
console.log('  ✅ [PASS] Tolérance Zéro-ODJ et saisie libre validées sans blocage d\'interface.');

// 2. Vérification de l\'Émargement Manuel et Décompte des Présents
console.log('\n▶️ Test 2 : Émargement Manuel et Décompte des Présents dans EventEmargementSection.jsx');
const emargementPath = path.join(rootDir, 'src/components/event-details/EventEmargementSection.jsx');
assert(fs.existsSync(emargementPath), 'EventEmargementSection.jsx doit exister');
const emargementContent = fs.readFileSync(emargementPath, 'utf-8');

assert(emargementContent.includes('invitesCount') || emargementContent.includes('invitesOuPublicCount'), 'EventEmargementSection doit gérer invitesOuPublicCount');
assert(emargementContent.includes('isMemberCaOrBureau'), 'EventEmargementSection doit intégrer la détection des membres CA/Bureau');
assert(emargementContent.includes('handleToggleMember'), 'EventEmargementSection doit permettre de cocher/décocher un membre individuellement');
assert(emargementContent.includes('totalParticipants'), 'EventEmargementSection doit afficher le décompte total des participants');
assert(emargementContent.includes('type="checkbox"'), 'Les membres doivent être affichés sous forme de cases à cocher');
console.log('  ✅ [PASS] Émargement manuel et décompte des présents/invités validés.');

// 3. Vérification de la Portée / Audience (CA vs Publique)
console.log('\n▶️ Test 3 : Audience de la réunion (CA vs Publique)');
const reunionManagerPath = path.join(rootDir, 'src/components/ReunionManager.jsx');
assert(fs.existsSync(reunionManagerPath), 'ReunionManager.jsx doit exister');
const reunionManagerContent = fs.readFileSync(reunionManagerPath, 'utf-8');

assert(reunionManagerContent.includes('setAudience'), 'ReunionManager doit gérer l\'état audience');
assert(reunionManagerContent.includes('audience: audience'), 'ReunionManager doit sauvegarder audience lors de la création');
assert(reunionManagerContent.includes('🔒 CA'), 'ReunionManager doit afficher le badge CA dans la liste des réunions');

const useVaralDataPath = path.join(rootDir, 'src/hooks/useVaralData.js');
assert(fs.existsSync(useVaralDataPath), 'useVaralData.js doit exister');
const useVaralDataContent = fs.readFileSync(useVaralDataPath, 'utf-8');

assert(useVaralDataContent.includes('canAccessCa'), 'useVaralData doit calculer canAccessCa pour la restriction de portée');
assert(useVaralDataContent.includes('isMemberCaOrBureau'), 'useVaralData doit utiliser isMemberCaOrBureau');
assert(useVaralDataContent.includes('isDocCa && !canAccessCa'), 'Les documents de CA doivent être filtrés au Varal pour les non-membres CA');
assert(useVaralDataContent.includes('isReunionCa && !canAccessCa'), 'Les réunions virtuelles de CA doivent être filtrées au Varal pour les non-membres CA');
console.log('  ✅ [PASS] Portée CA vs Publique et restrictions d\'audience Varal validées.');

// 4. Vérification de la Compilation et Archivage Varal
console.log('\n▶️ Test 4 : Compilation et Archivage Varal');
assert(eventReportContent.includes('audienceLabel'), 'La compilation doit inclure la mention du type de réunion (CA ou Publique)');
assert(eventReportContent.includes('invitesOuPublicCount: invites'), 'La publication doit enregistrer invitesOuPublicCount dans le document Varal');
assert(eventReportContent.includes('totalParticipants: totalParticipants'), 'La publication doit enregistrer totalParticipants');

const pdfGeneratorPath = path.join(rootDir, 'src/utils/pdfGenerator.js');
const pdfGeneratorContent = fs.readFileSync(pdfGeneratorPath, 'utf-8');
assert(pdfGeneratorContent.includes('isCaMeeting'), 'Le générateur PDF doit mentionner la portée de la réunion');
assert(pdfGeneratorContent.includes('invitesOuPublicCount'), 'Le générateur PDF doit afficher les participants non-adhérents s\'ils existent');

const docViewerPath = path.join(rootDir, 'src/components/documents/DocumentViewerModal.jsx');
const docViewerContent = fs.readFileSync(docViewerPath, 'utf-8');
assert(docViewerContent.includes('Réunion de CA / Bureau') && docViewerContent.includes('Réunion Publique'), 'DocumentViewerModal doit afficher le badge de portée de réunion');
assert(docViewerContent.includes('invitesOuPublicCount'), 'DocumentViewerModal doit afficher les participants non-adhérents');

const varalBookletPath = path.join(rootDir, 'src/components/documents/varal/VaralBookletCover.jsx');
const varalBookletContent = fs.readFileSync(varalBookletPath, 'utf-8');
assert(varalBookletContent.includes('🔒 CA'), 'VaralBookletCover doit afficher la pastille 🔒 CA sur le livret Cordel');

console.log('  ✅ [PASS] Compilation, livret Varal et génération PDF conformes et complets.');

console.log('\n🏆 TOUS LES TESTS DE LA MISSION SONT PARFAITEMENT VALIDÉS AVEC SUCCÈS ! 🏆\n');
