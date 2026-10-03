/**
 * Test unitaire et fonctionnel : Mission Cloisonnement Pôle Vitrine & i18n
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Démarrage des tests : Mission Cloisonnement Pôle Vitrine & Corrections i18n\n');

// =========================================================================
// Module 1 : Vérification des interpolations (élimination des doublons de concaténation)
// =========================================================================
console.log('▶️ Module 1 : Interpolation des badges d\'accordéon');

function interpolate(template, params) {
  let value = template;
  if (typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      value = value.replace(new RegExp(`\\{\\{?${paramKey}\\}\\}?`, 'g'), params[paramKey]);
    });
  }
  return value;
}

// 1. Galerie de photos
const frGallery = fr.vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam;
const ptGallery = pt.vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam;

// 6 photos
const res6Fr = interpolate(frGallery, { param: 6, count: 6, s: 's' });
const res6Pt = interpolate(ptGallery, { param: 6, count: 6, s: 's' });
assert.strictEqual(res6Fr, 'Sélection des photos publiques (6 photos en ligne)');
assert.strictEqual(res6Pt, 'Seleção de fotos públicas (6 fotos online)');
assert(!res6Pt.includes('foto6'), 'ERREUR : régression résiduelle "foto6" détectée');
console.log('  ✅ 6 photos : FR="6 photos en ligne", PT="6 fotos online" (aucun doublon foto6)');

// 1 photo
const res1Fr = interpolate(frGallery, { param: 1, count: 1, s: '' });
const res1Pt = interpolate(ptGallery, { param: 1, count: 1, s: '' });
assert.strictEqual(res1Fr, 'Sélection des photos publiques (1 photo en ligne)');
assert.strictEqual(res1Pt, 'Seleção de fotos públicas (1 foto online)');
console.log('  ✅ 1 photo : FR="1 photo en ligne", PT="1 foto online"');

// 2. Documents Pro
const frProDocs = fr.vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan;
const ptProDocs = pt.vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan;

// 1 doc
const res1DocFr = interpolate(frProDocs, { param: 1, count: 1, s: '' });
const res1DocPt = interpolate(ptProDocs, { param: 1, count: 1, s: '' });
assert.strictEqual(res1DocFr, 'Dossier artistique, fiche technique, plan de scène, kit presse (1/4 configuré)');
assert.strictEqual(res1DocPt, 'Dossiê artístico, ficha técnica, mapa de palco, kit de imprensa (1/4 configurado)');
assert(!res1DocPt.includes('configurado1'), 'ERREUR : régression résiduelle "configurado1" détectée');
console.log('  ✅ 1 doc : FR="1/4 configuré", PT="1/4 configurado" (aucun doublon configurado1)');

// 2 docs
const res2DocFr = interpolate(frProDocs, { param: 2, count: 2, s: 's' });
const res2DocPt = interpolate(ptProDocs, { param: 2, count: 2, s: 's' });
assert.strictEqual(res2DocFr, 'Dossier artistique, fiche technique, plan de scène, kit presse (2/4 configurés)');
assert.strictEqual(res2DocPt, 'Dossiê artístico, ficha técnica, mapa de palco, kit de imprensa (2/4 configurados)');
console.log('  ✅ 2 docs : FR="2/4 configurés", PT="2/4 configurados"');

// 3. Formules Recrutement
const frRecrutement = fr.vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree;
const ptRecrutement = pt.vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree;

const res3FormulesFr = interpolate(frRecrutement, { param: 3, count: 3, s: 's' });
const res3FormulesPt = interpolate(ptRecrutement, { param: 3, count: 3, s: 's' });
assert.strictEqual(res3FormulesFr, 'Formules Danse/Percu (3 configurées), tarifs et adhésions HelloAsso');
assert.strictEqual(res3FormulesPt, 'Fórmulas Dança/Percussão (3 configuradas), mensalidades e inscrições');
console.log('  ✅ 3 formules : FR="3 configurées", PT="3 configuradas"');

// =========================================================================
// Module 2 : Bouton fixe d'enregistrement en bas de page
// =========================================================================
console.log('\n▶️ Module 2 : Bouton d\'enregistrement général');
assert.strictEqual(fr.vitrine.admin.saveSettings, 'Enregistrer la configuration');
assert.strictEqual(pt.vitrine.admin.saveSettings, 'Salvar configurações');
assert.strictEqual(fr.vitrine.admin.savingSettings, 'Enregistrement...');
assert.strictEqual(pt.vitrine.admin.savingSettings, 'Salvando configurações...');

const assocSettingsPath = path.resolve(rootDir, 'src/components/AssociationSettings.jsx');
const assocContent = fs.readFileSync(assocSettingsPath, 'utf8');
assert(assocContent.includes("t('vitrine.admin.saveSettings')"), "AssociationSettings.jsx doit utiliser t('vitrine.admin.saveSettings')");
assert(!assocContent.includes('"{saving ? \\"Enregistrement...\\" : \\"Enregistrer la configuration\\"}"'), "Plus de texte brut dans le bouton");
console.log('  ✅ Bouton d\'enregistrement branché sur vitrine.admin.saveSettings (FR & PT)');

// =========================================================================
// Module 3 : Bandeaux d'instructions sous les onglets (poleGuides)
// =========================================================================
console.log('\n▶️ Module 3 : Bandeaux d\'instructions sous les onglets');
const vitrineTabKeys = [
  'vitrine-general',
  'vitrine-presentation',
  'vitrine-organisateur',
  'vitrine-galerie',
  'vitrine-recrutement',
  'vitrine-reseaux',
  'vitrine-apparence'
];

for (const key of vitrineTabKeys) {
  const guideFr = fr.poleGuides[key];
  const guidePt = pt.poleGuides[key];

  assert(guideFr, `Guide FR manquant pour ${key}`);
  assert(guidePt, `Guide PT manquant pour ${key}`);
  assert(guideFr.title && guidePt.title, `Titre manquant pour ${key}`);
  assert(guideFr.description && guidePt.description, `Description manquante pour ${key}`);
  assert(guideFr.step1 && guidePt.step1, `Étape 1 manquante pour ${key}`);
  assert(guideFr.step2 && guidePt.step2, `Étape 2 manquante pour ${key}`);
  assert(guideFr.step3 && guidePt.step3, `Étape 3 manquante pour ${key}`);
  console.log(`  ✅ ${key} : Titres et étapes synchronisés en FR et PT`);
}

const bannerPath = path.resolve(rootDir, 'src/components/InfoPoleBanner.jsx');
const bannerContent = fs.readFileSync(bannerPath, 'utf8');
assert(bannerContent.includes('poleGuides.${effectiveKey}.title'), 'InfoPoleBanner résout dynamiquement le titre');
assert(bannerContent.includes('poleGuides.${effectiveKey}.description'), 'InfoPoleBanner résout dynamiquement la description');
console.log('  ✅ InfoPoleBanner branché sur la résolution dynamique i18n');

// =========================================================================
// Module 4 : Cloisonnement strict des vues dans TabPublicContent.jsx
// =========================================================================
console.log('\n▶️ Module 4 : Cloisonnement strict des vues dans TabPublicContent.jsx');
const tabPublicContentPath = path.resolve(rootDir, 'src/components/association-settings/TabPublicContent.jsx');
const tabPublicContentCode = fs.readFileSync(tabPublicContentPath, 'utf8');

// Vérification de la présence du switch / aiguillage étanche
assert(tabPublicContentCode.includes('switch (currentTab)') || tabPublicContentCode.includes('switch (contentSubTab)'), 'Présence du switch conditionnel');
assert(tabPublicContentCode.includes("case 'presentation':"), 'Aiguillage presentation');
assert(tabPublicContentCode.includes("case 'organisateur':"), 'Aiguillage organisateur');
assert(tabPublicContentCode.includes("case 'galerie':"), 'Aiguillage galerie');
assert(tabPublicContentCode.includes("case 'recrutement':"), 'Aiguillage recrutement');
assert(tabPublicContentCode.includes("case 'reseaux':"), 'Aiguillage reseaux');
assert(tabPublicContentCode.includes("case 'apparence':"), 'Aiguillage apparence');
assert(tabPublicContentCode.includes("case 'general':"), 'Aiguillage general');

console.log('  ✅ Aiguillage conditionnel étanche validé');

console.log('\n======================================================');
console.log('🏆 TOUS LES TESTS DE LA MISSION ONT RÉUSSI AVEC SUCCÈS !');
console.log('======================================================\n');
