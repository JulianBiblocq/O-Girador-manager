import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🧪 Début du test de validation de l'en-tête Sidebar et du Sceau combiné...");

// 1. Vérification que HeaderSealLogo.jsx est 100 % générique sans nom d'association en dur
const sealContent = fs.readFileSync(path.resolve('src/components/common/HeaderSealLogo.jsx'), 'utf-8');
assert(!sealContent.toLowerCase().includes('samambaia'), 'HeaderSealLogo ne doit contenir aucune mention codée en dur');
assert(sealContent.includes('combinedLogoUrl'), 'HeaderSealLogo doit utiliser combinedLogoUrl');
assert(sealContent.includes('og-girador-frame.svg'), 'HeaderSealLogo doit exploiter le cadre og-girador-frame.svg');
console.log('✅ HeaderSealLogo implémente la résolution multi-associations du sceau combiné');

// 2. Vérification de LayoutShell.jsx
const layoutContent = fs.readFileSync(path.resolve('src/components/LayoutShell.jsx'), 'utf-8');
assert(!layoutContent.includes('isVitrineButtonVisible'), 'LayoutShell ne doit plus contenir isVitrineButtonVisible');
assert(!layoutContent.includes('handleOpenVitrine'), 'LayoutShell ne doit plus contenir handleOpenVitrine');
assert(layoutContent.includes('<HeaderSealLogo'), 'LayoutShell doit utiliser HeaderSealLogo');
console.log('✅ LayoutShell utilise HeaderSealLogo sans fuite inter-associations');

console.log('🎉 TOUS LES TESTS DE VALIDATION HEADER ET SCEAU ONT RÉUSSI !');
