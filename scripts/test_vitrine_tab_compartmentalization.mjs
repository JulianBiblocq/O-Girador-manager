/**
 * Test de validation unitaire : Cloisonnement strict des vues par onglet du Pôle Vitrine & Corrections i18n
 * 
 * Vérifie :
 * 1. Le cloisonnement étanche dans TabPublicContent (1 onglet = son contenu exclusif)
 * 2. L'absence de doublons d'interpolation sur les badges d'accordéon (ex: "6 fotos online" et "1/4 configurado")
 * 3. La présence et parité des clés de sauvegarde (vitrine.admin.saveSettings, vitrine.admin.savingSettings)
 * 4. La résolution des bandeaux d'aide des onglets Vitrine (poleGuides.vitrine-*) en FR et PT
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

console.log('===============================================================');
console.log('🧪 VALIDATION : CLOISONNEMENT DES ONGLETS VITRINE & I18N');
console.log('===============================================================\n');

// -------------------------------------------------------------
// 1. Contrôle Statique du Commutateur d'Onglets (TabPublicContent.jsx)
// -------------------------------------------------------------
console.log('▶️ Test 1 : Cloisonnement strict du commutateur dans TabPublicContent.jsx');

const tabPublicContentPath = path.join(rootDir, 'src/components/association-settings/TabPublicContent.jsx');
assert(fs.existsSync(tabPublicContentPath), 'TabPublicContent.jsx doit exister');
const tabContentSource = fs.readFileSync(tabPublicContentPath, 'utf8');

// Vérification de la présence du switch conditionnel
assert(tabContentSource.includes('switch (currentTab)'), 'TabPublicContent doit utiliser switch (currentTab)');
assert(tabContentSource.includes('case \'presentation\':'), 'Doit gérer case "presentation"');
assert(tabContentSource.includes('case \'organisateur\':'), 'Doit gérer case "organisateur"');
assert(tabContentSource.includes('case \'galerie\':'), 'Doit gérer case "galerie"');
assert(tabContentSource.includes('case \'recrutement\':'), 'Doit gérer case "recrutement"');
assert(tabContentSource.includes('case \'reseaux\':'), 'Doit gérer case "reseaux"');
assert(tabContentSource.includes('case \'apparence\':'), 'Doit gérer case "apparence"');
assert(tabContentSource.includes('case \'general\':'), 'Doit gérer case "general"');

// Vérification de l'absence de retour JSX regroupant tous les accordéons
assert(!tabContentSource.includes('isHeroTargeted'), 'L\'ancien mode à pile complète avec isHeroTargeted doit être supprimé');
assert(!tabContentSource.includes('isRecruitmentTargeted'), 'L\'ancien mode avec isRecruitmentTargeted doit être supprimé');

console.log('  ✅ [PASS] Commutateur switch étanche et suppression totale de la pile d\'accordéons globale confirmés.');

// -------------------------------------------------------------
// 2. Correction des Variables Interpolées (Doublons de concaténation)
// -------------------------------------------------------------
console.log('\n▶️ Test 2 : Correction des variables interpolées');

function interpolate(dict, key, params) {
  let val = key.split('.').reduce((acc, k) => acc?.[k], dict);
  if (typeof val === 'string' && params) {
    Object.keys(params).forEach(k => {
      val = val.replace(new RegExp(`\\{\\{?${k}\\}\\}?`, 'g'), params[k]);
    });
  }
  return val;
}

// A. Badge Galerie en Portugais : "6 fotos online" et NON "6 foto6 online"
const ptGallerySub = interpolate(pt, 'vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam', {
  param: 6,
  count: 6,
  s: 's'
});
assert.strictEqual(ptGallerySub, 'Seleção de fotos públicas (6 fotos online)', `Attendu "Seleção de fotos públicas (6 fotos online)", obtenu : "${ptGallerySub}"`);
assert(!ptGallerySub.includes('foto6'), 'Le badge ne doit pas contenir de doublon "foto6"');

// B. Badge Galerie en Français : "6 photos en ligne"
const frGallerySub = interpolate(fr, 'vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam', {
  param: 6,
  count: 6,
  s: 's'
});
assert.strictEqual(frGallerySub, 'Sélection des photos publiques (6 photos en ligne)', `Attendu "Sélection des photos publiques (6 photos en ligne)", obtenu : "${frGallerySub}"`);

// C. Badge ProDocs en Portugais : "1/4 configurado" et NON "1/4 configurado1"
const ptProDocsSub1 = interpolate(pt, 'vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan', {
  param: 1,
  count: 1,
  s: ''
});
assert(ptProDocsSub1.includes('1/4 configurado'), `Doit contenir "1/4 configurado", obtenu : "${ptProDocsSub1}"`);
assert(!ptProDocsSub1.includes('configurado1'), 'Le badge ne doit pas contenir de doublon "configurado1"');

// D. Badge ProDocs en Français : "1/4 configuré"
const frProDocsSub1 = interpolate(fr, 'vitrine.admin.proDocs.proDocsAccordion.dossierArtistiqueFicheTechniquePlan', {
  param: 1,
  count: 1,
  s: ''
});
assert(frProDocsSub1.includes('1/4 configuré'), `Doit contenir "1/4 configuré", obtenu : "${frProDocsSub1}"`);

// E. Badge Recrutement en Portugais et Français
const ptRecrutementSub1 = interpolate(pt, 'vitrine.admin.recruitment.formulesRecrutementAccordion.formulesDansePercuParamConfiguree', {
  param: 1,
  count: 1,
  s: ''
});
assert(ptRecrutementSub1.includes('1 configurada'), `Doit contenir "1 configurada", obtenu : "${ptRecrutementSub1}"`);
assert(!ptRecrutementSub1.includes('configurada1'), 'Le badge ne doit pas contenir de doublon "configurada1"');

console.log('  ✅ [PASS] Tous les doublons d\'interpolation sont résolus avec accord parfait en nombre.');

// -------------------------------------------------------------
// 3. Clés de Sauvegarde (vitrine.admin.saveSettings)
// -------------------------------------------------------------
console.log('\n▶️ Test 3 : Bouton fixe d\'enregistrement et clés i18n');

assert(fr.vitrine?.admin?.saveSettings, 'fr.vitrine.admin.saveSettings doit être défini');
assert(pt.vitrine?.admin?.saveSettings, 'pt.vitrine.admin.saveSettings doit être défini');
assert.strictEqual(fr.vitrine.admin.saveSettings, 'Enregistrer la configuration');
assert.strictEqual(pt.vitrine.admin.saveSettings, 'Salvar configurações');

assert(fr.vitrine?.admin?.savingSettings, 'fr.vitrine.admin.savingSettings doit être défini');
assert(pt.vitrine?.admin?.savingSettings, 'pt.vitrine.admin.savingSettings doit être défini');

const assocSettingsPath = path.join(rootDir, 'src/components/AssociationSettings.jsx');
const assocSettingsSource = fs.readFileSync(assocSettingsPath, 'utf8');
assert(assocSettingsSource.includes("t('vitrine.admin.saveSettings')"), 'AssociationSettings doit appeler t(\'vitrine.admin.saveSettings\')');

console.log('  ✅ [PASS] Bouton d\'enregistrement branché sur vitrine.admin.saveSettings en FR et PT.');

// -------------------------------------------------------------
// 4. Bandeaux d'Instructions & Guides Bilingues
// -------------------------------------------------------------
console.log('\n▶️ Test 4 : Guides bilingues sous les onglets (poleGuides)');

const vitrineTabs = [
  'vitrine-general',
  'vitrine-presentation',
  'vitrine-organisateur',
  'vitrine-galerie',
  'vitrine-recrutement',
  'vitrine-reseaux',
  'vitrine-apparence'
];

for (const tab of vitrineTabs) {
  const guideFr = fr.poleGuides?.[tab];
  const guidePt = pt.poleGuides?.[tab];

  assert(guideFr, `fr.poleGuides['${tab}'] doit être défini`);
  assert(guidePt, `pt.poleGuides['${tab}'] doit être défini`);
  assert(guideFr.title && guideFr.title.length > 0, `fr.poleGuides['${tab}'].title manquant`);
  assert(guidePt.title && guidePt.title.length > 0, `pt.poleGuides['${tab}'].title manquant`);
  assert(guideFr.description && guideFr.description.length > 0, `fr.poleGuides['${tab}'].description manquant`);
  assert(guidePt.description && guidePt.description.length > 0, `pt.poleGuides['${tab}'].description manquant`);
  assert(guideFr.step1 && guidePt.step1, `step1 manquant pour '${tab}'`);
  assert(guideFr.step2 && guidePt.step2, `step2 manquant pour '${tab}'`);
  assert(guideFr.step3 && guidePt.step3, `step3 manquant pour '${tab}'`);
}

// Vérification de InfoPoleBanner.jsx
const bannerPath = path.join(rootDir, 'src/components/InfoPoleBanner.jsx');
const bannerSource = fs.readFileSync(bannerPath, 'utf8');
assert(bannerSource.includes('poleGuides.${lookupKey}.title') || bannerSource.includes('poleGuides.${effectiveKey}.title'), 'InfoPoleBanner doit résoudre dynamiquement les clés poleGuides');
assert(bannerSource.includes('t(\'common.understood\')'), 'Le bouton Compris / Masquer doit utiliser la clé t(\'common.understood\')');

console.log('  ✅ [PASS] Les 7 sous-onglets Vitrine possèdent des guides complets et traduits en FR et PT.');

console.log('\n===============================================================');
console.log('🏆 SUCCÈS TOTAL : LE PÔLE VITRINE EST 100% CONFORME ET CLOISONNÉ !');
console.log('===============================================================\n');
