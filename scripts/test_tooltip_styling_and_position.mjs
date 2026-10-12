import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 DÉBUT DU CONTRÔLE D\'INTÉGRITÉ DU COMPOSANT TOOLTIP (MAINTENANCE & CACHE)...\n');

// 1. Contrôle statique du composant Tooltip.jsx
console.log('▶️ 1. Vérification du code source de src/components/Tooltip.jsx...');
const tooltipPath = path.resolve('src/components/Tooltip.jsx');
assert.ok(fs.existsSync(tooltipPath), 'src/components/Tooltip.jsx doit exister');
const tooltipContent = fs.readFileSync(tooltipPath, 'utf-8');

// Vérification de la prop align
assert.ok(tooltipContent.includes('align'), 'Tooltip.jsx doit déclarer et gérer la prop align');

// Vérification de l'ancrage adapté aux éléments près du bord gauche (left-0 translate-x-0)
assert.ok(
  tooltipContent.includes('left-0 translate-x-0'),
  'Tooltip.jsx doit inclure left-0 translate-x-0 pour éviter le débordement hors écran à gauche'
);

// Vérification du calibrage de la flèche indicatrice sur l'icône ?
assert.ok(
  tooltipContent.includes('left-3 -translate-x-1/2'),
  'Tooltip.jsx doit aligner la flèche indicatrice sur le centre de l\'icône (?) (left-3 -translate-x-1/2)'
);

// Vérification de la casse normale (normal-case)
assert.ok(
  tooltipContent.includes('normal-case'),
  'Tooltip.jsx doit comporter normal-case pour neutraliser tout uppercase imposé par un élément parent'
);

// Vérification de la typographie compacte et interligne aéré
assert.ok(
  tooltipContent.includes('text-xs'),
  'Tooltip.jsx doit utiliser une typographie compacte text-xs'
);
assert.ok(
  tooltipContent.includes('leading-relaxed'),
  'Tooltip.jsx doit utiliser un interligne fluide leading-relaxed'
);

// Vérification des dimensions min/max
assert.ok(
  tooltipContent.includes('min-w-[240px]'),
  'Tooltip.jsx doit définir une largeur minimale min-w-[240px]'
);
assert.ok(
  tooltipContent.includes('max-w-xs'),
  'Tooltip.jsx doit limiter la largeur maximale max-w-xs pour cadrer le contenu'
);

console.log('  ✅ Propriétés CSS, ancrage et casse de Tooltip.jsx conformes.');

// 2. Vérification des contextes d\'appel (SystemAdminPanel et Trésorerie)
console.log('\n▶️ 2. Vérification des blocs Maintenance & Purge dans SystemAdminPanel et Trésorerie...');
const adminPath = path.resolve('src/components/SystemAdminPanel.jsx');
const adminContent = fs.readFileSync(adminPath, 'utf-8');
assert.ok(adminContent.includes('Maintenance & Cache'), 'SystemAdminPanel doit contenir le bloc Maintenance & Cache');
assert.ok(adminContent.includes('<Tooltip'), 'SystemAdminPanel doit utiliser le Tooltip pour la micro-aide');

const treasuryOpsPath = path.resolve('src/components/treasury/TreasuryOperations.jsx');
const treasuryOpsContent = fs.readFileSync(treasuryOpsPath, 'utf-8');
assert.ok(treasuryOpsContent.includes('Assainir HelloAsso') || treasuryOpsContent.includes('Nettoyer les doublons'), 'TreasuryOperations doit intégrer l\'outil de nettoyage HelloAsso');
assert.ok(treasuryOpsContent.includes('<Tooltip'), 'TreasuryOperations doit utiliser le Tooltip');

console.log('  ✅ Intégrations dans SystemAdminPanel et TreasuryOperations validées.');

console.log('\n=========================================================================');
console.log('🏆 TOUS LES CONTRÔLES DE L\'INFOBULLE TOOLTIP ONT RÉUSSI AVEC SUCCÈS !');
console.log('=========================================================================\n');
