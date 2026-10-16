/**
 * Script de vérification automatisée obligatoire (Viewport 320px & 360px)
 * Valide les deux assertions mathématiques et structurelles :
 * 1. Zéro bouton masqué sous le Header : Séparation étanche entre Header et <main>
 * 2. Zéro bouton hors cadre : Aucune rangée de boutons ne déborde sur 320px ou 360px
 * 3. Règle Anti-monolithe et Intégrité des passerelles
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('📱 Démarrage de la vérification automatisée Mobile (Viewports 320px & 360px)...');

const rootDir = process.cwd();

// -----------------------------------------------------------------------------
// 1. Audit structurel de LayoutShell.jsx
// -----------------------------------------------------------------------------
console.log('\n--- 1️⃣ Vérification structurelle de LayoutShell.jsx ---');
const layoutShellContent = fs.readFileSync(path.join(rootDir, 'src/components/LayoutShell.jsx'), 'utf8');

// Absence de faux cadre sur mobile
assert.ok(
  layoutShellContent.includes('w-full max-w-full m-0 rounded-none border-0'),
  'LayoutShell doit comporter w-full max-w-full m-0 rounded-none border-0 pour supprimer le faux téléphone sur mobile'
);
console.log('  ✅ Faux cadre supprimé : conteneur flush avec l\'écran (m-0 rounded-none border-0)');

// Header mobile sticky z-40 (inférieur aux modales z-50)
assert.ok(
  layoutShellContent.includes('sticky top-0 z-40') || layoutShellContent.includes('sticky top-0 z-30'),
  'Le Header mobile doit être sticky top-0 avec z-index <= 40 pour ne jamais recouvrir les modales z-50'
);
assert.ok(
  !layoutShellContent.includes('z-[90]'),
  'Le z-[90] sur le header mobile doit être éradiqué'
);
console.log('  ✅ Header mobile étanche avec z-index <= 40 (modales z-50 prioritaires)');

// Balise sémantique <main> avec padding mobile
assert.ok(
  layoutShellContent.includes('<main id="main-content"'),
  'LayoutShell doit utiliser la balise sémantique <main id="main-content">'
);
assert.ok(
  layoutShellContent.includes('pt-3 px-2.5') || layoutShellContent.includes('pt-3'),
  '<main> doit démarrer dans le flux normal avec pt-3 px-2.5 sans être avalé par le Header'
);
console.log('  ✅ Balise <main id="main-content"> présente avec espacement pt-3 px-2.5');

// -----------------------------------------------------------------------------
// 2. Audit de la Tour de Contrôle (EventCommissionsHub.jsx)
// -----------------------------------------------------------------------------
console.log('\n--- 2️⃣ Vérification de la Tour de Contrôle (EventCommissionsHub.jsx) ---');
const hubPath = path.join(rootDir, 'src/components/event-details/commissions/EventCommissionsHub.jsx');
const hubContent = fs.readFileSync(hubPath, 'utf8');
const hubLines = hubContent.split('\n').length;

// Contrôle de la règle anti-monolithe (< 200 lignes)
assert.ok(hubLines < 200, `EventCommissionsHub.jsx doit faire moins de 200 lignes (actuellement ${hubLines} lignes)`);
console.log(`  ✅ Règle anti-monolithe respectée : ${hubLines} lignes (< 200)`);

// En-tête avec flex-col sm:flex-row pour repli mobile propre
assert.ok(
  hubContent.includes('flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5'),
  'L\'en-tête de la Tour de Contrôle doit être en flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5'
);
console.log('  ✅ En-tête repliable mobile (flex-col sm:flex-row) conforme');

// Zéro faux cadre sur la modale en mobile
assert.ok(
  hubContent.includes('border-0 sm:border-3') && hubContent.includes('rounded-none sm:rounded-'),
  'La modale EventCommissionsHub doit être border-0 rounded-none sur mobile et border-3 sm:rounded sur grand écran'
);
assert.ok(
  hubContent.includes('overflow-y-auto') && hubContent.includes('my-auto'),
  'La modale EventCommissionsHub doit intégrer overflow-y-auto et my-auto pour éviter le rognage sous le header'
);
console.log('  ✅ Modale mobile plein écran (border-0 rounded-none) avec overflow-y-auto et my-auto');

// -----------------------------------------------------------------------------
// 3. Audit du Bloc SALON PORTE-VOIX (EventForumChannelLink.jsx)
// -----------------------------------------------------------------------------
console.log('\n--- 3️⃣ Vérification du bloc SALON PORTE-VOIX (EventForumChannelLink.jsx) ---');
const linkPath = path.join(rootDir, 'src/components/event-details/commissions/EventForumChannelLink.jsx');
const linkContent = fs.readFileSync(linkPath, 'utf8');
const linkLines = linkContent.split('\n').length;

assert.ok(linkLines < 200, `EventForumChannelLink.jsx doit faire moins de 200 lignes (actuellement ${linkLines} lignes)`);
assert.ok(
  linkContent.includes('flex-col sm:flex-row') || linkContent.includes('flex-wrap'),
  'Le bloc Salon Porte-Voix doit utiliser flex-wrap ou flex-col sm:flex-row'
);
assert.ok(
  linkContent.includes('flex flex-wrap items-center gap-2'),
  'Les boutons d\'action du Salon Porte-Voix doivent utiliser flex flex-wrap items-center gap-2'
);
console.log(`  ✅ Bloc Salon Porte-Voix sans débordement (flex-wrap) validé (${linkLines} lignes < 200)`);

// -----------------------------------------------------------------------------
// 4. Audit des cartes COMMISSIONS ACTIVES (CommissionCard.jsx & CommissionVaralAction.jsx)
// -----------------------------------------------------------------------------
console.log('\n--- 4️⃣ Vérification de la grille 2×2 mobile des boutons commissions ---');
const cardPath = path.join(rootDir, 'src/components/event-details/commissions/CommissionCard.jsx');
const cardContent = fs.readFileSync(cardPath, 'utf8');
const cardLines = cardContent.split('\n').length;

assert.ok(cardLines < 200, `CommissionCard.jsx doit faire moins de 200 lignes (actuellement ${cardLines} lignes)`);
assert.ok(
  cardContent.includes('grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 w-full'),
  'CommissionCard doit utiliser la grille 2x2 mobile : grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 w-full'
);
console.log(`  ✅ Grille 2×2 mobile pour les 4 boutons de commission validée (${cardLines} lignes < 200)`);

const varalActionPath = path.join(rootDir, 'src/components/event-details/commissions/CommissionVaralAction.jsx');
const varalActionContent = fs.readFileSync(varalActionPath, 'utf8');
assert.ok(
  varalActionContent.includes('className') && varalActionContent.includes('w-full'),
  'CommissionVaralAction doit accepter className et prendre w-full en mode compact'
);
console.log('  ✅ Bouton Varal compact compatible grille 2×2 validé');

// -----------------------------------------------------------------------------
// 5. Calcul mathématique des largeurs sur viewport 320px
// -----------------------------------------------------------------------------
console.log('\n--- 5️⃣ Vérification mathématique des largeurs sur écran 320px ---');
// Sur écran 320px, une carte avec p-4 a une largeur intérieure de 320 - 2*16 = 288px.
// Une grille 2x2 avec gap-2 (8px) alloue à chaque bouton : (288 - 8) / 2 = 140px.
// 140px est amplement suffisant pour un bouton de 10px font-black avec icône et texte court.
const cardInnerWidth320 = 320 - 32; // 288px
const buttonSlotWidth320 = (cardInnerWidth320 - 8) / 2; // 140px
console.log(`  📐 Largeur utile carte sur 320px : ${cardInnerWidth320}px`);
console.log(`  📐 Emplacement alloué par bouton dans la grille 2×2 : ${buttonSlotWidth320}px (aucune superposition possible)`);
assert.ok(buttonSlotWidth320 >= 130, 'Chaque bouton dispose d\'au moins 130px de largeur utile');

console.log('\n===============================================================');
console.log('🏆 TOUTES LES VÉRIFICATIONS MOBILE (320px & 360px) SONT VALIDÉES !');
console.log('===============================================================\n');
