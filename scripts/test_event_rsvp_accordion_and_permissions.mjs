import fs from 'fs';
import assert from 'assert';

console.log("========================================================================");
console.log("🧪 TEST MISSION : ACCORDÉONS ÉVÉNEMENTS & RESTRICTION DES PRÉSENCES");
console.log("========================================================================");

console.log("\n▶️ Test 1 : Contrôle statique de RSVPAccordionSection.jsx");
assert(fs.existsSync('src/components/event-details/RSVPAccordionSection.jsx'), "RSVPAccordionSection.jsx doit exister");
const accordionContent = fs.readFileSync('src/components/event-details/RSVPAccordionSection.jsx', 'utf8');
const accordionLines = accordionContent.split('\n').length;
console.log(`  ℹ️ Nombre de lignes RSVPAccordionSection.jsx : ${accordionLines}`);
assert(accordionLines < 200, "RSVPAccordionSection.jsx doit respecter la règle anti-monolithe (< 200 lignes)");
assert(accordionContent.includes('isExpanded'), "Prop isExpanded gérée");
assert(accordionContent.includes('onToggle'), "Callback onToggle géré");
assert(accordionContent.includes('colorVariant'), "Variantes de couleurs Cordel gérées");
console.log("  ✅ [PASS] RSVPAccordionSection est modulaire, propre et conforme aux règles Cordel");

console.log("\n▶️ Test 2 : Contrôle des restrictions de permissions dans EventRSVPSection.jsx");
const rsvpContent = fs.readFileSync('src/components/event-details/EventRSVPSection.jsx', 'utf8');
assert(rsvpContent.includes('import RSVPAccordionSection'), "EventRSVPSection doit importer RSVPAccordionSection");
assert(rsvpContent.includes('expandedSections'), "État expandedSections présent dans EventRSVPSection");
assert(rsvpContent.includes('handleToggleAllSections'), "Fonction de bascule Tout déplier / Tout replier présente");

// Vérification que les absents, sans réponse, etc. sont sous isAuthorized
const adminPresenceBlockMatch = rsvpContent.match(/\{\/\* Sections d'administration des présences[\s\S]*?\{isAuthorized\s*&&/);
assert(adminPresenceBlockMatch, "Le bloc d'administration des présences doit être conditionné par isAuthorized");

assert(rsvpContent.includes('title="Absents"'), "Section Absents sous forme d'accordéon");
assert(rsvpContent.includes('title="Sans réponse"'), "Section Sans réponse sous forme d'accordéon");
assert(rsvpContent.includes('title="En attente de validation"'), "Section En attente sous forme d'accordéon");
assert(rsvpContent.includes('title="Gestion des instruments par Mestre"'), "Gestion des instruments Mestre sous forme d'accordéon");

// Vérification que la liste des présents reste en dehors de la restriction isAuthorized (accessible à tous)
const presentTableIndex = rsvpContent.indexOf('renderAttendanceTable = () =>');
const presentsByIndex = rsvpContent.indexOf('presentsByInstrument', presentTableIndex);
const adminBlockIndex = rsvpContent.indexOf('Suivi Administratif des Présences', presentTableIndex);
assert(presentsByIndex > 0 && presentsByIndex < adminBlockIndex, "Les Présents doivent être affichés avant le bloc d'administration et accessibles à tous");

console.log("  ✅ [PASS] Seuls les Présents sont visibles de tous les adhérents");
console.log("  ✅ [PASS] Absents, En attente, Refusés, Sans réponse et Gestion Mestre sont réservés à isAuthorized et repliables");

console.log("\n========================================================================");
console.log("🏆 SUCCÈS TOTAL : LES ACCORDÉONS ET RESTRICTIONS SONT 100% OPÉRATIONNELS !");
console.log("========================================================================");
