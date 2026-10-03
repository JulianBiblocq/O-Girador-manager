import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { agendaGuide, pedagogyGuide, POLE_GUIDES, getPoleGuide } from '../src/config/poleGuides.js';

console.log('==================================================================');
console.log('🧪 TEST : GUIDES CONTEXTUELS BILINGUES « DOUBLE VUE » (AGENDA & PÉDAGOGIE)');
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

// -----------------------------------------------------------------------------
// 1. Structure du guide Agenda (Double Vue)
// -----------------------------------------------------------------------------
console.log('▶️ Test 1 : Validation de agendaGuide (Vue Membre & Vue Gestionnaire)');

test('agendaGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(agendaGuide.id, 'agenda');
  assert.strictEqual(agendaGuide.poleName.fr, 'Agenda & Événements');
  assert.strictEqual(agendaGuide.poleName.pt, 'Programação & Eventos');
});

test('agendaGuide.memberGuide possède titre, résumé et 4 sections bilingues', () => {
  const mg = agendaGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Comment utiliser l'Agenda ?");
  assert.strictEqual(mg.title.pt, "Como utilizar a Programação?");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 4, 'Doit comporter 4 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('agendaGuide.managerGuide possède titre, badge, résumé, 5 étapes et 2 vidéos', () => {
  const mg = agendaGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Piloter et animer un événement");
  assert.strictEqual(mg.title.pt, "Gerenciar e coordenar um evento");
  assert.strictEqual(mg.roleBadge.fr, "Secrétariat • Mestre • Logistique");
  assert.strictEqual(mg.roleBadge.pt, "Secretaria • Mestre • Logística");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 5, 'Doit comporter 5 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_creer_evenement');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_regie_covoiturage');
});

// -----------------------------------------------------------------------------
// 2. Structure du guide Pédagogie (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 2 : Validation de pedagogyGuide (Vue Membre & Vue Gestionnaire)');

test('pedagogyGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(pedagogyGuide.id, 'pedagogy');
  assert.strictEqual(pedagogyGuide.poleName.fr, 'Pédagogie & Répertoire');
  assert.strictEqual(pedagogyGuide.poleName.pt, 'Pedagogia & Repertório');
});

test('pedagogyGuide.memberGuide possède titre, résumé et 4 sections bilingues', () => {
  const mg = pedagogyGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Comment travailler les morceaux et progresser ?");
  assert.strictEqual(mg.title.pt, "Como praticar o repertório e evoluir?");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 4, 'Doit comporter 4 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('pedagogyGuide.managerGuide possède titre, badge, résumé, 5 étapes et 2 vidéos', () => {
  const mg = pedagogyGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Piloter la progression artistique et les répétitions");
  assert.strictEqual(mg.title.pt, "Coordenar a progressão artística e os ensaios");
  assert.strictEqual(mg.roleBadge.fr, "Mestre • Direction Artistique • Formateurs");
  assert.strictEqual(mg.roleBadge.pt, "Mestre • Direção Artística • Instrutores");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 5, 'Doit comporter 5 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_creer_toada_repertoire');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_dashboard_pedagogique_pauta');
});

// -----------------------------------------------------------------------------
// 3. Intégration dans POLE_GUIDES et résolution par getPoleGuide
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Intégration dans POLE_GUIDES et getPoleGuide');

test('POLE_GUIDES contient les clés agenda et pedagogy', () => {
  assert.strictEqual(POLE_GUIDES.agenda, agendaGuide);
  assert.strictEqual(POLE_GUIDES.pedagogy, pedagogyGuide);
  assert.strictEqual(POLE_GUIDES.pedagogie, pedagogyGuide);
  assert.strictEqual(POLE_GUIDES.repertoire, pedagogyGuide);
});

test('getPoleGuide résout agenda et repertoire même sous mon-espace', () => {
  assert.strictEqual(getPoleGuide('agenda', 'mon-espace'), agendaGuide);
  assert.strictEqual(getPoleGuide('repertoire', 'mon-espace'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('pedagogy'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('pedagogie'), pedagogyGuide);
});

test('getPoleGuide continue d\'exclure les espaces simples sans guide', () => {
  assert.strictEqual(getPoleGuide('profil', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('materiel', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('vestiaire', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('trombinoscope', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('forum', 'mon-espace'), null);
});

// -----------------------------------------------------------------------------
// 4. Respect du vocabulaire strict (Zéro Speed Trainer / Zéro Séquenciad'Or)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Respect du vocabulaire strict Cordel');

test('Aucune mention résiduelle de "Speed Trainer" ou "Séquenciad\'Or" dans poleGuides.js', () => {
  const content = fs.readFileSync(path.resolve('src/config/poleGuides.js'), 'utf8');
  assert.strictEqual(/speed\s*trainer/i.test(content), false, 'poleGuides.js ne doit pas contenir Speed Trainer');
  assert.strictEqual(/s[eé]quenciad['’]or/i.test(content), false, 'poleGuides.js ne doit pas contenir Séquenciad\'Or');
});

// -----------------------------------------------------------------------------
// 5. Validation du composant InfoPoleBanner
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Intégration dans InfoPoleBanner.jsx');

test('InfoPoleBanner supporte hasDoubleView, activeViewMode, resolveBilingual et commutateur de rôle', () => {
  const bannerSource = fs.readFileSync(path.resolve('src/components/InfoPoleBanner.jsx'), 'utf8');
  assert.ok(bannerSource.includes('hasDoubleView'), 'Doit détecter hasDoubleView');
  assert.ok(bannerSource.includes('isUserPoleManager'), 'Doit calculer isUserPoleManager');
  assert.ok(bannerSource.includes('activeViewMode'), 'Doit gérer activeViewMode');
  assert.ok(bannerSource.includes('resolveBilingual'), 'Doit implémenter resolveBilingual');
  assert.ok(bannerSource.includes('activeSubGuide'), 'Doit sélectionner activeSubGuide');
  assert.ok(bannerSource.includes('workflowSteps'), 'Doit afficher workflowSteps pour les gestionnaires');
  assert.ok(bannerSource.includes('videoTutorials'), 'Doit afficher videoTutorials pour les gestionnaires');
  assert.ok(bannerSource.includes('roleBadge'), 'Doit afficher roleBadge pour les gestionnaires');
  assert.ok(bannerSource.includes('sections'), 'Doit afficher sections pour les membres');
});

console.log('\n==================================================================');
console.log(`🏆 SUCCÈS TOTAL : ${passedTests} TESTS VALIDÉS AVEC SUCCÈS !`);
console.log('==================================================================');
