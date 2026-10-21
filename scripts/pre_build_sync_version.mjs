/**
 * Script exécuté immédiatement avant `vite build` :
 * 1. Synchronise la version de package.json dans src/index.css (--v-release-bust)
 *    pour garantir un nouveau hash CSS Rollup à chaque changement de version.
 * 2. Synchronise public/version.json avant la compilation Vite.
 */

import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve('package.json');
const indexCssPath = path.resolve('src/index.css');
const publicVersionPath = path.resolve('public/version.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('⚠️ Fichier package.json introuvable.');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = pkg.version;

console.log(`=== PRÉPARATION PRÉ-BUILD VERSION ${version} ===`);

// 1. Synchronisation de src/index.css
if (fs.existsSync(indexCssPath)) {
  let css = fs.readFileSync(indexCssPath, 'utf-8');
  const initialCss = css;

  // Remplacement de l'en-tête de version
  css = css.replace(
    /\/\* O Girador Organizador - Feuille de styles principale v[0-9.]+ \*\//,
    `/* O Girador Organizador - Feuille de styles principale v${version} */`
  );

  // Remplacement de la variable CSS de cache-busting
  css = css.replace(
    /--v-release-bust:\s*['"][^'"]+['"];/,
    `--v-release-bust: '${version}';`
  );

  if (css !== initialCss) {
    fs.writeFileSync(indexCssPath, css, 'utf-8');
    console.log(`✅ src/index.css synchronisé avec la version ${version} (nouveau hash CSS garanti)`);
  } else {
    console.log(`ℹ️ src/index.css déjà aligné sur la version ${version}`);
  }
}

// 2. Synchronisation de public/version.json
const versionPayload = JSON.stringify({ version }, null, 2) + '\n';
fs.writeFileSync(publicVersionPath, versionPayload, 'utf-8');
console.log(`✅ public/version.json synchronisé avec la version ${version}\n`);
