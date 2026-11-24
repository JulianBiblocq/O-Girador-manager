import assert from 'assert';
import fs from 'fs';
import path from 'path';
import {
  agendaGuide,
  pedagogyGuide,
  logisticsGuide,
  forumGuide,
  treasuryGuide,
  secretariatGuide,
  studioGuide,
  POLE_GUIDES,
  getPoleGuide
} from '../src/config/poleGuides.js';

console.log('==================================================================');
console.log('🧪 TEST : GUIDES CONTEXTUELS BILINGUES « DOUBLE VUE » (7 GRANDS PÔLES)');
console.log('==================================================================\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Erreur : ${err.message}`);
    process.exit(1);
  }
}

function assertDoubleGuide(guide, { id, poleFr, polePt, memberSections, managerSteps, videoIds }) {
  test(`${id} possède l'identifiant et le nom bilingue`, () => {
    assert.strictEqual(guide.id, id);
    assert.strictEqual(guide.poleName.fr, poleFr);
    assert.strictEqual(guide.poleName.pt, polePt);
  });

  test(`${id}.memberGuide possède titre, résumé et ${memberSections} sections bilingues`, () => {
    const mg = guide.memberGuide;
    assert.ok(mg, 'memberGuide doit exister');
    assert.ok(mg.title.fr && mg.title.pt, 'Titres FR/PT requis');
    assert.ok(mg.summary.fr && mg.summary.pt, 'Résumés FR/PT requis');
    assert.strictEqual(mg.sections.length, memberSections);
    mg.sections.forEach((sec, idx) => {
      assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
      assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
    });
  });

  test(`${id}.managerGuide possède titre, badge, résumé, ${managerSteps} étapes et ${videoIds.length} vidéos`, () => {
    const mg = guide.managerGuide;
    assert.ok(mg, 'managerGuide doit exister');
    assert.ok(mg.title.fr && mg.title.pt, 'Titres FR/PT requis');
    assert.ok(mg.roleBadge.fr && mg.roleBadge.pt, 'Badges de rôle FR/PT requis');
    assert.ok(mg.summary.fr && mg.summary.pt, 'Résumés FR/PT requis');
    assert.strictEqual(mg.workflowSteps.length, managerSteps);
    mg.workflowSteps.forEach((ws, idx) => {
      assert.strictEqual(ws.step, idx + 1);
      assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
      assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
    });
    assert.deepStrictEqual(mg.videoTutorials.map((v) => v.id), videoIds);
  });
}

assertDoubleGuide(agendaGuide, {
  id: 'agenda', poleFr: 'Agenda & Événements', polePt: 'Programação & Eventos',
  memberSections: 4, managerSteps: 5, videoIds: ['tuto_creer_evenement', 'tuto_regie_covoiturage']
});
assertDoubleGuide(pedagogyGuide, {
  id: 'pedagogy', poleFr: 'Pédagogie & Répertoire', polePt: 'Pedagogia & Repertório',
  memberSections: 4, managerSteps: 5, videoIds: ['tuto_creer_toada_repertoire', 'tuto_dashboard_pedagogique_pauta']
});
assertDoubleGuide(logisticsGuide, {
  id: 'logistics', poleFr: 'Logistique, Matériel & Vestiaire', polePt: 'Logística, Instrumentos & Figurino',
  memberSections: 3, managerSteps: 4, videoIds: ['tuto_inventaire_instruments', 'tuto_malles_et_convois']
});
assertDoubleGuide(forumGuide, {
  id: 'forum', poleFr: 'Porte-Voix & Vie du groupe', polePt: 'Porta-Voz & Vida da Trupe',
  memberSections: 4, managerSteps: 5, videoIds: ['tuto_gestion_salons_droits', 'tuto_sondages_et_epingles']
});
assertDoubleGuide(treasuryGuide, {
  id: 'treasury', poleFr: 'Trésorerie & Finances', polePt: 'Tesouraria & Finanças',
  memberSections: 4, managerSteps: 6, videoIds: ['tuto_pointage_cotisations_cautions', 'tuto_gestion_notes_de_frais', 'tuto_cloture_export_comptable']
});
assertDoubleGuide(secretariatGuide, {
  id: 'secretariat', poleFr: 'Secrétariat & Vie Statutaire', polePt: 'Secretaria & Vida Institucional',
  memberSections: 3, managerSteps: 4, videoIds: ['tuto_gestion_annuaire_exports', 'tuto_chartes_et_documents_officiels']
});
assertDoubleGuide(studioGuide, {
  id: 'studio', poleFr: 'Studio & Communication', polePt: 'Studio & Comunicação',
  memberSections: 3, managerSteps: 5, videoIds: ['tuto_gestion_galerie_vitrine', 'tuto_campagne_newsletter_brevo']
});

test('POLE_GUIDES et getPoleGuide résolvent les 7 grands pôles et excluent les vues simples', () => {
  assert.strictEqual(POLE_GUIDES.agenda, agendaGuide);
  assert.strictEqual(POLE_GUIDES.pedagogy, pedagogyGuide);
  assert.strictEqual(POLE_GUIDES.pedagogie, pedagogyGuide);
  assert.strictEqual(POLE_GUIDES.repertoire, pedagogyGuide);
  assert.strictEqual(POLE_GUIDES.logistics, logisticsGuide);
  assert.strictEqual(POLE_GUIDES.logistique, logisticsGuide);
  assert.strictEqual(POLE_GUIDES.forum, forumGuide);
  assert.strictEqual(POLE_GUIDES['porte-voix'], forumGuide);
  assert.strictEqual(POLE_GUIDES.treasury, treasuryGuide);
  assert.strictEqual(POLE_GUIDES.tresorerie, treasuryGuide);
  assert.strictEqual(POLE_GUIDES.secretariat, secretariatGuide);
  assert.strictEqual(POLE_GUIDES.studio, studioGuide);
  assert.strictEqual(POLE_GUIDES.communication, studioGuide);

  assert.strictEqual(getPoleGuide('agenda', 'mon-espace'), agendaGuide);
  assert.strictEqual(getPoleGuide('repertoire', 'mon-espace'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('inventaire-inconnu', 'logistique'), logisticsGuide);
  assert.strictEqual(getPoleGuide('forum', 'mon-espace'), forumGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'tresorerie'), treasuryGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'secretariat'), secretariatGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'studio'), studioGuide);

  assert.strictEqual(getPoleGuide('profil', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('materiel', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('vestiaire', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('trombinoscope', 'mon-espace'), null);
});

test('Aucune mention résiduelle de "Speed Trainer" ou graphie interdite dans poleGuides et pole-guides/*', () => {
  const files = [
    path.resolve('src/config/poleGuides.js'),
    ...fs.readdirSync(path.resolve('src/config/pole-guides')).map((f) => path.resolve('src/config/pole-guides', f))
  ];
  for (const fp of files) {
    const content = fs.readFileSync(fp, 'utf8');
    assert.strictEqual(/speed\s*trainer/i.test(content), false, `${path.basename(fp)} ne doit pas contenir Speed Trainer`);
    assert.strictEqual(/s[eé]quenciad['’]or/i.test(content), false, `${path.basename(fp)} ne doit pas contenir de graphie avec apostrophe`);
  }
});

test('InfoPoleBanner supporte hasDoubleView, activeViewMode, resolveBilingual et commutateur de rôle', () => {
  const bannerSource = fs.readFileSync(path.resolve('src/components/InfoPoleBanner.jsx'), 'utf8');
  for (const token of ['hasDoubleView', 'isUserPoleManager', 'activeViewMode', 'resolveBilingual', 'activeSubGuide', 'workflowSteps', 'videoTutorials', 'roleBadge', 'sections']) {
    assert.ok(bannerSource.includes(token), `Doit contenir ${token}`);
  }
});

console.log(`\n🏆 SUCCÈS TOTAL : ${passedTests} TESTS VALIDÉS AVEC SUCCÈS !`);
