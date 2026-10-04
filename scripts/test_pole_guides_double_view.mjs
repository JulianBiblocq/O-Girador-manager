import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { agendaGuide, pedagogyGuide, logisticsGuide, forumGuide, treasuryGuide, secretariatGuide, studioGuide, POLE_GUIDES, getPoleGuide } from '../src/config/poleGuides.js';

console.log('==================================================================');
console.log('🧪 TEST : GUIDES CONTEXTUELS BILINGUES « DOUBLE VUE » (AGENDA, PÉDAGOGIE, LOGISTIQUE, FORUM, TRÉSORERIE, SECRÉTARIAT & STUDIO)');
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
// 3. Structure du guide Logistique & Vestiaire (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 3 : Validation de logisticsGuide (Vue Membre & Vue Gestionnaire)');

test('logisticsGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(logisticsGuide.id, 'logistics');
  assert.strictEqual(logisticsGuide.poleName.fr, 'Logistique, Matériel & Vestiaire');
  assert.strictEqual(logisticsGuide.poleName.pt, 'Logística, Instrumentos & Figurino');
});

test('logisticsGuide.memberGuide possède titre, résumé et 3 sections bilingues', () => {
  const mg = logisticsGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Gérer son équipement, ses tenues et ses réparations");
  assert.strictEqual(mg.title.pt, "Gerenciar seu equipamento, figurino e manutenção");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 3, 'Doit comporter 3 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('logisticsGuide.managerGuide possède titre, badge, résumé, 4 étapes et 2 vidéos', () => {
  const mg = logisticsGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Administrer le parc d'instruments et le vestiaire");
  assert.strictEqual(mg.title.pt, "Administrar o acervo de instrumentos e o figurino");
  assert.strictEqual(mg.roleBadge.fr, "Logistique • Lutherie • Costumerie");
  assert.strictEqual(mg.roleBadge.pt, "Logística • Luthieria • Figurino");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 4, 'Doit comporter 4 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_inventaire_instruments');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_gestion_costumes');
});

// -----------------------------------------------------------------------------
// 4. Structure du guide Porte-Voix & Vie du groupe (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 4 : Validation de forumGuide (Vue Membre & Vue Gestionnaire)');

test('forumGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(forumGuide.id, 'forum');
  assert.strictEqual(forumGuide.poleName.fr, 'Porte-Voix & Vie du groupe');
  assert.strictEqual(forumGuide.poleName.pt, 'Porta-Voz & Vida da Trupe');
});

test('forumGuide.memberGuide possède titre, résumé et 4 sections bilingues', () => {
  const mg = forumGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Comment échanger sur le Porte-Voix ?");
  assert.strictEqual(mg.title.pt, "Como participar das conversas no Porta-Voz?");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 4, 'Doit comporter 4 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('forumGuide.managerGuide possède titre, badge, résumé, 5 étapes et 2 vidéos', () => {
  const mg = forumGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Animer et modérer les espaces de discussion");
  assert.strictEqual(mg.title.pt, "Moderar e estruturar os canais de conversa");
  assert.strictEqual(mg.roleBadge.fr, "Modération • Bureau • Conseil d'Administration");
  assert.strictEqual(mg.roleBadge.pt, "Moderação • Diretoria • Conselho");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 5, 'Doit comporter 5 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_gestion_salons_droits');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_sondages_et_epingles');
});

// -----------------------------------------------------------------------------
// 5. Structure du guide Trésorerie & Finances (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 5 : Validation de treasuryGuide (Vue Membre & Vue Gestionnaire)');

test('treasuryGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(treasuryGuide.id, 'treasury');
  assert.strictEqual(treasuryGuide.poleName.fr, 'Trésorerie & Finances');
  assert.strictEqual(treasuryGuide.poleName.pt, 'Tesouraria & Finanças');
});

test('treasuryGuide.memberGuide possède titre, résumé et 4 sections bilingues', () => {
  const mg = treasuryGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Suivre mes cotisations et mes remboursements");
  assert.strictEqual(mg.title.pt, "Acompanhar mensalidades e reembolsos");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 4, 'Doit comporter 4 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('treasuryGuide.managerGuide possède titre, badge, résumé, 6 étapes et 3 vidéos', () => {
  const mg = treasuryGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Piloter la comptabilité et la santé financière");
  assert.strictEqual(mg.title.pt, "Gerenciar a contabilidade e o fluxo financeiro");
  assert.strictEqual(mg.roleBadge.fr, "Trésorerie • Comptabilité • Bureau");
  assert.strictEqual(mg.roleBadge.pt, "Tesouraria • Contabilidade • Diretoria");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 6, 'Doit comporter 6 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 3, 'Doit comporter 3 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_pointage_cotisations_cautions');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_gestion_notes_de_frais');
  assert.strictEqual(mg.videoTutorials[2].id, 'tuto_cloture_export_comptable');
});

// -----------------------------------------------------------------------------
// 6. Structure du guide Secrétariat & Vie Statutaire (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 6 : Validation de secretariatGuide (Vue Membre & Vue Gestionnaire)');

test('secretariatGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(secretariatGuide.id, 'secretariat');
  assert.strictEqual(secretariatGuide.poleName.fr, 'Secrétariat & Vie Statutaire');
  assert.strictEqual(secretariatGuide.poleName.pt, 'Secretaria & Vida Institucional');
});

test('secretariatGuide.memberGuide possède titre, résumé et 3 sections bilingues', () => {
  const mg = secretariatGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Consulter ses documents administratifs et son statut");
  assert.strictEqual(mg.title.pt, "Consultar documentos administrativos e cadastro");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 3, 'Doit comporter 3 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('secretariatGuide.managerGuide possède titre, badge, résumé, 5 étapes et 2 vidéos', () => {
  const mg = secretariatGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Tenir le registre, les actes officiels et les bilans d'AG");
  assert.strictEqual(mg.title.pt, "Administrar o livro de registros, atas e relatórios da AG");
  assert.strictEqual(mg.roleBadge.fr, "Secrétariat • Bureau • Conseil d'Administration");
  assert.strictEqual(mg.roleBadge.pt, "Secretaria • Diretoria • Conselho");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 5, 'Doit comporter 5 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_gestion_annuaire_exports');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_bilans_cerfa_presentation_ag');
});

// -----------------------------------------------------------------------------
// 7. Structure du guide Studio (Double Vue)
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 7 : Validation de studioGuide (Vue Membre & Vue Gestionnaire)');

test('studioGuide possède l\'identifiant et le nom bilingue', () => {
  assert.strictEqual(studioGuide.id, 'studio');
  assert.strictEqual(studioGuide.poleName.fr, 'Studio & Communication');
  assert.strictEqual(studioGuide.poleName.pt, 'Studio & Comunicação');
});

test('studioGuide.memberGuide possède titre, résumé et 3 sections bilingues', () => {
  const mg = studioGuide.memberGuide;
  assert.ok(mg, 'memberGuide doit exister');
  assert.strictEqual(mg.title.fr, "Retrouver les souvenirs et suivre les actus de la troupe");
  assert.strictEqual(mg.title.pt, "Acessar as lembranças e acompanhar as novidades da trupe");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.sections.length, 3, 'Doit comporter 3 sections');
  mg.sections.forEach((sec, idx) => {
    assert.ok(sec.heading.fr && sec.heading.pt, `Section ${idx + 1} heading manquant`);
    assert.ok(sec.text.fr && sec.text.pt, `Section ${idx + 1} text manquant`);
  });
});

test('studioGuide.managerGuide possède titre, badge, résumé, 4 étapes et 2 vidéos', () => {
  const mg = studioGuide.managerGuide;
  assert.ok(mg, 'managerGuide doit exister');
  assert.strictEqual(mg.title.fr, "Piloter la communication externe, les médias et les newsletters");
  assert.strictEqual(mg.title.pt, "Gerenciar a comunicação externa, mídias e boletins");
  assert.strictEqual(mg.roleBadge.fr, "Communication • Relations Presse • Webmaster");
  assert.strictEqual(mg.roleBadge.pt, "Comunicação • Assessoria de Imprensa • Webmaster");
  assert.ok(mg.summary.fr && mg.summary.pt);
  assert.strictEqual(mg.workflowSteps.length, 4, 'Doit comporter 4 étapes de workflow');
  mg.workflowSteps.forEach((ws, idx) => {
    assert.strictEqual(ws.step, idx + 1);
    assert.ok(ws.title.fr && ws.title.pt, `Étape ${idx + 1} title manquant`);
    assert.ok(ws.desc.fr && ws.desc.pt, `Étape ${idx + 1} desc manquant`);
  });
  assert.strictEqual(mg.videoTutorials.length, 2, 'Doit comporter 2 tutoriels vidéo');
  assert.strictEqual(mg.videoTutorials[0].id, 'tuto_gestion_galerie_vitrine');
  assert.strictEqual(mg.videoTutorials[1].id, 'tuto_campagne_newsletter_brevo');
});

// -----------------------------------------------------------------------------
// 8. Intégration dans POLE_GUIDES et résolution par getPoleGuide
// -----------------------------------------------------------------------------
console.log('\n▶️ Test 8 : Intégration dans POLE_GUIDES et getPoleGuide');

test('POLE_GUIDES contient les clés des 7 grands pôles sans aucune valeur undefined', () => {
  const SEVEN_POLES = ['agenda', 'pedagogy', 'logistics', 'forum', 'treasury', 'secretariat', 'studio'];
  SEVEN_POLES.forEach(poleKey => {
    assert.ok(POLE_GUIDES[poleKey] !== undefined, `POLE_GUIDES['${poleKey}'] ne doit pas être undefined`);
    assert.strictEqual(typeof POLE_GUIDES[poleKey], 'object', `POLE_GUIDES['${poleKey}'] doit être un objet valide`);
  });
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
});

test('getPoleGuide résout agenda, repertoire, logistique, forum, trésorerie, secrétariat et studio', () => {
  assert.strictEqual(getPoleGuide('agenda', 'mon-espace'), agendaGuide);
  assert.strictEqual(getPoleGuide('repertoire', 'mon-espace'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('pedagogy'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('pedagogie'), pedagogyGuide);
  assert.strictEqual(getPoleGuide('logistics'), logisticsGuide);
  assert.strictEqual(getPoleGuide('logistique'), logisticsGuide);
  assert.strictEqual(getPoleGuide('inventaire-inconnu', 'logistique'), logisticsGuide);
  assert.strictEqual(getPoleGuide('forum', 'mon-espace'), forumGuide);
  assert.strictEqual(getPoleGuide('forum'), forumGuide);
  assert.strictEqual(getPoleGuide('porte-voix'), forumGuide);
  assert.strictEqual(getPoleGuide('treasury'), treasuryGuide);
  assert.strictEqual(getPoleGuide('tresorerie'), treasuryGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'tresorerie'), treasuryGuide);
  assert.strictEqual(getPoleGuide('secretariat'), secretariatGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'secretariat'), secretariatGuide);
  assert.strictEqual(getPoleGuide('studio'), studioGuide);
  assert.strictEqual(getPoleGuide('communication'), studioGuide);
  assert.strictEqual(getPoleGuide('inconnu', 'studio'), studioGuide);
});

test('getPoleGuide continue d\'exclure les espaces simples sans guide', () => {
  assert.strictEqual(getPoleGuide('profil', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('materiel', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('vestiaire', 'mon-espace'), null);
  assert.strictEqual(getPoleGuide('trombinoscope', 'mon-espace'), null);
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
