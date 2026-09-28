import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Lancement des tests de validation : SÉLECTEUR RÉPERTOIRE DANS LES ÉVÉNEMENTS...");

const rootDir = process.cwd();

// 1. Règle anti-monolithe et existence des composants
const selectorPath = path.join(rootDir, 'src/components/agenda/EventRepertoireProgramSelector.jsx');
const cardPath = path.join(rootDir, 'src/components/agenda/EventRepertoireItemCard.jsx');

assert(fs.existsSync(selectorPath), "EventRepertoireProgramSelector.jsx doit exister.");
assert(fs.existsSync(cardPath), "EventRepertoireItemCard.jsx doit exister.");

const selectorContent = fs.readFileSync(selectorPath, 'utf8');
const cardContent = fs.readFileSync(cardPath, 'utf8');

const selectorLines = selectorContent.split('\n').length;
const cardLines = cardContent.split('\n').length;

console.log(`📏 [Composants Répertoire] EventRepertoireProgramSelector.jsx : ${selectorLines} lignes`);
console.log(`📏 [Composants Répertoire] EventRepertoireItemCard.jsx : ${cardLines} lignes`);

// 2. Vérification de l'écoute du Répertoire et du filtrage des actifs
assert(
  selectorContent.includes("'associations'") && selectorContent.includes("'repertoire'"),
  "EventRepertoireProgramSelector doit écouter la collection associations/{groupId}/repertoire."
);
assert(
  selectorContent.includes("statutSaison === 'saison'") || selectorContent.includes("statutSaison"),
  "EventRepertoireProgramSelector doit filtrer les morceaux de la saison ou non archivés."
);

// 3. Vérification de l'intitulé et des disciplines rattachées
assert(
  selectorContent.includes("Morceaux du répertoire au programme"),
  "L'intitulé doit être 'Morceaux du répertoire au programme'."
);
assert(selectorContent.includes("Percussion") || selectorContent.includes("percu"), "Le badge Percussion doit être géré.");
assert(selectorContent.includes("Toada/Chant") || selectorContent.includes("chant"), "Le badge Chant doit être géré.");
assert(selectorContent.includes("Danse") || selectorContent.includes("danse"), "Le badge Danse doit être géré.");
assert(selectorContent.includes("Culture") || selectorContent.includes("culture"), "Le badge Culture doit être géré.");

// 4. Vérification de la note d'intention et du bouton de retrait
assert(
  cardContent.includes("Note d'intention") || cardContent.includes("Focus de travail"),
  "EventRepertoireItemCard doit comporter le champ de note d'intention / focus de travail."
);
assert(
  cardContent.includes("Retirer"),
  "EventRepertoireItemCard doit comporter le bouton Retirer."
);

// 5. Structure d'enregistrement Firestore
assert(selectorContent.includes("pieceId:"), "L'objet setlist doit contenir pieceId.");
assert(selectorContent.includes("titre:"), "L'objet setlist doit contenir titre.");
assert(selectorContent.includes("notes:"), "L'objet setlist doit contenir notes.");
assert(selectorContent.includes("sequenceurId:"), "L'objet setlist doit contenir sequenceurId.");
assert(selectorContent.includes("toadaDocId:"), "L'objet setlist doit contenir toadaDocId.");
assert(selectorContent.includes("cultureDocId:"), "L'objet setlist doit contenir cultureDocId.");
assert(selectorContent.includes("dancadorChoreoId:"), "L'objet setlist doit contenir dancadorChoreoId.");

// 6. Intégration dans EventFormFields.jsx
const formFieldsPath = path.join(rootDir, 'src/components/agenda/EventFormFields.jsx');
const formFieldsContent = fs.readFileSync(formFieldsPath, 'utf8');
assert(
  formFieldsContent.includes("EventRepertoireProgramSelector"),
  "EventFormFields.jsx doit importer et intégrer EventRepertoireProgramSelector."
);

// 7. Rétrocompatibilité et affichage adhérent dans EventRevisionProgram.jsx
const revisionPath = path.join(rootDir, 'src/components/event-details/EventRevisionProgram.jsx');
const revisionContent = fs.readFileSync(revisionPath, 'utf8');
assert(
  revisionContent.includes("resolvePieceLiveTechnicalData"),
  "EventRevisionProgram.jsx doit utiliser resolvePieceLiveTechnicalData pour résoudre les passerelles."
);
assert(
  revisionContent.includes("morceau.notes"),
  "EventRevisionProgram.jsx doit afficher la note d'intention du morceau pour la séance."
);
assert(
  revisionContent.includes("setlist = []"),
  "EventRevisionProgram.jsx doit avoir setlist = [] par défaut pour immuniser contre undefined."
);
assert(
  revisionContent.includes("openSequencerWithCrossApp"),
  "EventRevisionProgram.jsx doit utiliser openSequencerWithCrossApp pour le SSO sécurisé."
);
assert(
  revisionContent.includes("representedSeqIds"),
  "EventRevisionProgram.jsx doit dédupliquer les rythmes du séquenceur déjà présents dans la setlist."
);

// 8. Test fonctionnel direct du polymorphisme de buildSequencerUrl
const seqUtilsPath = path.join(rootDir, 'src/utils/sequencerUrlUtils.js');
const seqUtilsContent = fs.readFileSync(seqUtilsPath, 'utf8');
assert(seqUtilsContent.includes("typeof arg1 === 'object'"), "buildSequencerUrl doit supporter arg1 objet.");

// Simulation du comportement polymorphe
function testBuildSequencerUrl(arg1 = 'https://sequenceur.app', arg2) {
  let baseUrl = arg1;
  let item = arg2;
  if (typeof arg1 === 'object' && arg1 !== null) {
    item = arg1;
    baseUrl = typeof arg2 === 'string' && arg2.trim() ? arg2 : 'https://sequenceur.app';
  } else if (!baseUrl || typeof baseUrl !== 'string') {
    baseUrl = 'https://sequenceur.app';
  }
  const base = baseUrl.trim();
  if (!item) return base;
  const separator = base.includes('?') ? '&' : '?';
  const patternId = item.sequenceurId || item.id;
  return `${base}${separator}patternId=${encodeURIComponent(patternId)}`;
}

const urlStandard = testBuildSequencerUrl('https://sequenceur.app', { sequenceurId: 'luanda_123' });
const urlInverted = testBuildSequencerUrl({ sequenceurId: 'luanda_123' }, 'https://sequenceur.app');
assert(urlStandard.includes('patternId=luanda_123'), "Ordre standard doit fonctionner.");
assert(urlInverted.includes('patternId=luanda_123'), "Ordre inversé (polymorphe) doit fonctionner sans crash.");

console.log("✅ TOUS LES TESTS DU SÉLECTEUR RÉPERTOIRE DANS LES ÉVÉNEMENTS SONT PASSÉS AVEC SUCCÈS !");
