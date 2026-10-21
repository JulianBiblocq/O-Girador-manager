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

// 4. Synchronisation automatique de version.json avec package.json
const packageJsonPath = path.resolve('package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const versionPayload = JSON.stringify({ version: pkg.version }, null, 2) + '\n';
    
    // Mise à jour de public/version.json
    fs.writeFileSync(path.resolve('public/version.json'), versionPayload, 'utf-8');
    console.log(`✅ public/version.json synchronisé avec la version ${pkg.version}`);

    // Mise à jour de dist/version.json si dist existe
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, 'version.json'), versionPayload, 'utf-8');
      console.log(`✅ dist/version.json synchronisé avec la version ${pkg.version}`);
    }
  } catch (err) {
    console.error('⚠️ Erreur lors de la synchronisation de version.json :', err);
  }
}

// 5. Sécurisation du Service Worker Workbox (synchronisation app.html dans le precache)
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  try {
    let swContent = fs.readFileSync(swPath, 'utf-8');
    if (swContent.includes('url:"index.html"') || swContent.includes('"url":"index.html"')) {
      swContent = swContent
        .replace(/url:"index\.html"/g, 'url:"app.html"')
        .replace(/"url":"index\.html"/g, '"url":"app.html"');
      fs.writeFileSync(swPath, swContent, 'utf-8');
      console.log('✅ dist/sw.js mis à jour : index.html remplacé par app.html dans le precache Workbox');
    } else {
      console.log('✅ dist/sw.js déjà aligné sur app.html');
    }
  } catch (err) {
    console.warn('⚠️ Erreur lors de la mise à jour de sw.js :', err);
  }
}

console.log('🎉 Post-build terminé avec succès !\n');

