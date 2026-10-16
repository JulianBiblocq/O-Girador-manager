/**
 * Script exécuté immédiatement après `vite build` :
 * 1. Renomme dist/index.html en dist/app.html et supprime dist/index.html afin d'empêcher
 *    Firebase Hosting de court-circuiter les rewrites dynamiques avec un fichier statique figé.
 * 2. Copie les sceaux officiels Samambaia et Samb'à Bulles dans dist/brandings/ pour service CDN direct.
 */

import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const appHtmlPath = path.join(distDir, 'app.html');

console.log('=== PRÉPARATION POST-BUILD FIREBASE HOSTING ===');

if (fs.existsSync(indexHtmlPath)) {
  // 1. Copie vers dist/app.html
  fs.copyFileSync(indexHtmlPath, appHtmlPath);
  console.log('✅ dist/index.html copié vers dist/app.html');

  // 2. Suppression de dist/index.html pour activer les rewrites sur / et ?groupe=
  fs.unlinkSync(indexHtmlPath);
  console.log('✅ dist/index.html supprimé (permet l\'interception Cloud Function serveDynamicApp)');
} else if (fs.existsSync(appHtmlPath)) {
  console.log('ℹ️ dist/app.html est déjà en place.');
} else {
  console.warn('⚠️ Aucun index.html ou app.html trouvé dans dist/ !');
}

// 3. Vérification des assets de branding
const distBrandingsDir = path.join(distDir, 'brandings');
if (!fs.existsSync(distBrandingsDir)) {
  fs.mkdirSync(distBrandingsDir, { recursive: true });
}

const brandingsToSync = ['logoOGSamambaia.png', 'logoOGSambabulles.png'];
for (const file of brandingsToSync) {
  const src = path.resolve('public/brandings', file);
  const dst = path.join(distBrandingsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`✅ Asset branding synchronisé dans dist : ${file}`);
  } else {
    console.warn(`⚠️ Asset branding source introuvable : ${src}`);
  }
}

console.log('🎉 Post-build terminé avec succès !\n');
