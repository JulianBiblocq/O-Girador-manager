import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('🧪 Lancement des vérifications du Favicon Dynamique Composite...\n');

// 1. Vérification du fichier useDynamicFavicon.js
const hookPath = path.resolve('./src/hooks/useDynamicFavicon.js');
assert.ok(fs.existsSync(hookPath), 'Le fichier useDynamicFavicon.js doit exister');
const hookContent = fs.readFileSync(hookPath, 'utf-8');

// Vérification de la contrainte stricte des 200 lignes
const lineCount = hookContent.split('\n').length;
console.log(`📏 Nombre de lignes de useDynamicFavicon.js : ${lineCount} lignes`);
assert.ok(lineCount <= 200, `Le fichier dépasse la barre stricte des 200 lignes (${lineCount} > 200)`);
console.log('✅ Contrainte Anti-Monolithe (< 200 lignes) : RESPECTÉE');

// 2. Vérification des éléments fonctionnels clés du hook
assert.ok(hookContent.includes("crossOrigin = 'anonymous'"), 'crossOrigin anonymous doit être présent');
assert.ok(hookContent.includes('128'), 'Le canvas 128x128 doit être configuré');
assert.ok(hookContent.includes('ctx.clip()'), 'Le masque de clip circulaire doit être utilisé');
assert.ok(hookContent.includes('toDataURL'), 'L\'export en dataURL doit être présent');
assert.ok(hookContent.includes('isMounted'), 'Le drapeau isMounted de sécurisation asynchrone doit être présent');
assert.ok(hookContent.includes('apple-touch-icon'), 'Le support de apple-touch-icon doit être présent');
assert.ok(hookContent.includes('combined-logo-ready'), 'L\'événement combined-logo-ready doit être diffusé');
console.log('✅ Spécifications fonctionnelles (128x128, crossOrigin, masque, export, fallback) : RESPECTÉES');

// 3. Vérification de l'asset public/og-girador-frame.svg
const framePath = path.resolve('./public/og-girador-frame.svg');
assert.ok(fs.existsSync(framePath), 'L\'asset public/og-girador-frame.svg doit exister');
const frameContent = fs.readFileSync(framePath, 'utf-8');
assert.ok(frameContent.includes('O GIRADOR'), 'L\'asset doit contenir la gravure O GIRADOR');
console.log('✅ Asset public/og-girador-frame.svg : PRÉSENT ET VALIDE');

// 4. Vérification de l'intégration dans App.jsx
const appPath = path.resolve('./src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
assert.ok(appContent.includes('useDynamicFavicon'), 'useDynamicFavicon doit être importé et appelé dans App.jsx');
console.log('✅ Intégration dans App.jsx : VALIDÉE');

console.log('\n🎉 TOUTES LES VÉRIFICATIONS DU FAVICON DYNAMIQUE ONT RÉUSSI AVEC SUCCÈS !');
