import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Début du test de validation de l\'en-tête Sidebar et du Sceau combiné...');

// 1. Vérification que public/brandings/logoOGSamambaia.png et public/logoOGSamambaia.png existent
assert(fs.existsSync(path.resolve('public/brandings/logoOGSamambaia.png')), 'public/brandings/logoOGSamambaia.png doit exister');
assert(fs.existsSync(path.resolve('public/logoOGSamambaia.png')), 'public/logoOGSamambaia.png doit exister');
console.log('✅ Asset sur-mesure d\'orfèvrerie logoOGSamambaia.png bien présent dans public/brandings/');

// 2. Vérification de HeaderSealLogo.jsx
const sealContent = fs.readFileSync(path.resolve('src/components/common/HeaderSealLogo.jsx'), 'utf-8');
assert(sealContent.includes('/brandings/logoOGSamambaia.png'), 'HeaderSealLogo doit utiliser /brandings/logoOGSamambaia.png pour Samambaia');
assert(sealContent.includes('og-girador-frame.svg'), 'HeaderSealLogo doit exploiter le cadre og-girador-frame.svg');
console.log('✅ HeaderSealLogo implémente la résolution du sceau combiné et l\'override Samambaia');

// 3. Vérification de LayoutShell.jsx
const layoutContent = fs.readFileSync(path.resolve('src/components/LayoutShell.jsx'), 'utf-8');
// Vérification absence du bouton VITRINE dans l'en-tête
assert(!layoutContent.includes('isVitrineButtonVisible'), 'LayoutShell ne doit plus contenir isVitrineButtonVisible');
assert(!layoutContent.includes('handleOpenVitrine'), 'LayoutShell ne doit plus contenir handleOpenVitrine');
assert(layoutContent.includes('<HeaderSealLogo'), 'LayoutShell doit utiliser HeaderSealLogo');
console.log('✅ LayoutShell ne contient plus aucun bouton VITRINE intempestif et utilise HeaderSealLogo');

console.log('🎉 TOUS LES TESTS DE VALIDATION HEADER ET SCEAU ONT RÉUSSI !');
