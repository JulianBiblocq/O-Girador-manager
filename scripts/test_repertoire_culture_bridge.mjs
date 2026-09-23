import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : PASSERELLE VIDÉO, HISTOIRE & VARAL CULTURE");
console.log("===============================================================\n");

const baseDir = process.cwd();

// --- Module 1 : Intégrité de CreateCultureFicheModal.jsx ---
console.log("▶️ Module 1 : Validation de CreateCultureFicheModal.jsx");
const modalPath = path.join(baseDir, 'src', 'components', 'mestre', 'CreateCultureFicheModal.jsx');
assert(fs.existsSync(modalPath), "Le fichier CreateCultureFicheModal.jsx doit exister");
const modalCode = fs.readFileSync(modalPath, 'utf8');

// Vérification de la structure des chapitres
assert(
  modalCode.includes('chapitres: [') &&
  modalCode.includes('sousTitre:') &&
  modalCode.includes('texte:'),
  "La structure des chapitres doit être un tableau d'objets avec sousTitre et texte"
);

// Vérification de groupId à la racine
assert(
  modalCode.includes('groupId: groupId'),
  "Le document doit contenir groupId à sa racine"
);

// Vérification du nettoyage anti-undefined
assert(
  modalCode.includes('cleanFirestorePayload'),
  "Le nettoyage anti-undefined doit être appliqué sur le payload"
);

// Vérification de la collection 'documents'
assert(
  modalCode.includes("collection(db, 'documents')"),
  "La cible de stockage doit être la collection racine 'documents'"
);

// Vérification de la liaison sur le morceau de répertoire
assert(
  modalCode.includes('cultureDocId: docRef.id'),
  "L'identifiant de la fiche culture doit être automatiquement lié au morceau (cultureDocId)"
);
console.log("  ✅ [PASS] CreateCultureFicheModal validé (chapitres, groupId racine, clean anti-undefined, liaison auto).");

// --- Module 2 : Intégrité de RepertoirePieceModal.jsx ---
console.log("\n▶️ Module 2 : Validation de RepertoirePieceModal.jsx");
const pieceModalPath = path.join(baseDir, 'src', 'components', 'mestre', 'RepertoirePieceModal.jsx');
const pieceModalCode = fs.readFileSync(pieceModalPath, 'utf8');

// Vérification de l'aspiration automatique
assert(
  pieceModalCode.includes('presetVideo') &&
  pieceModalCode.includes('setVideoUrl('),
  "L'aspiration de la vidéo YouTube doit être présente dans handleSequenceurChange"
);

assert(
  pieceModalCode.includes('presetHistoire') &&
  pieceModalCode.includes('setHistoire('),
  "L'aspiration de l'histoire/contexte doit être présente dans handleSequenceurChange"
);

// Vérification de la persistance Firestore assainie
assert(
  pieceModalCode.includes("videoUrl: (videoUrl || '').trim() || null"),
  "videoUrl doit être assaini contre les undefined"
);
assert(
  pieceModalCode.includes("contexteHistorique: (histoire || '').trim() || null"),
  "contexteHistorique doit être assaini contre les undefined"
);
assert(
  pieceModalCode.includes("histoire: (histoire || '').trim() || null"),
  "histoire doit être assaini contre les undefined"
);

// Vérification de la présence de la passerelle Varal Culture dans l'UI
assert(
  pieceModalCode.includes('CreateCultureFicheModal'),
  "RepertoirePieceModal doit intégrer CreateCultureFicheModal"
);
console.log("  ✅ [PASS] RepertoirePieceModal validé (aspiration vidéo/histoire, nettoyage Firestore, modale passerelle).");

// --- Module 3 : Intégrité de MestreRepertoireView.jsx ---
console.log("\n▶️ Module 3 : Validation de MestreRepertoireView.jsx");
const viewPath = path.join(baseDir, 'src', 'components', 'mestre', 'MestreRepertoireView.jsx');
const viewCode = fs.readFileSync(viewPath, 'utf8');

// Vérification du lecteur YouTube responsive
assert(
  viewCode.includes('parseYouTubeMedia') &&
  viewCode.includes('aspect-video'),
  "MestreRepertoireView doit intégrer un lecteur YouTube responsive via parseYouTubeMedia"
);

// Vérification de l'encart Contexte & Histoire
assert(
  viewCode.includes('contexteHistorique') &&
  viewCode.includes('Contexte &'),
  "MestreRepertoireView doit afficher un encart lisible pour le contexte & l'histoire"
);

// Vérification du bouton passerelle Varal Culture
assert(
  viewCode.includes('setPieceForCultureCreation') &&
  viewCode.includes('<CreateCultureFicheModal'),
  "MestreRepertoireView doit inclure le déclencheur et la modale CreateCultureFicheModal"
);
console.log("  ✅ [PASS] MestreRepertoireView validé (lecteur YouTube responsive, encart histoire, modale passerelle).");

// --- Module 4 : Gouvernance des règles Firebase ---
console.log("\n▶️ Module 4 : Gouvernance stricte des règles Firebase");
const firestoreRules = path.join(baseDir, 'firestore.rules');
const storageRules = path.join(baseDir, 'storage.rules');
assert(!fs.existsSync(firestoreRules), "Aucun fichier firestore.rules local ne doit exister");
assert(!fs.existsSync(storageRules), "Aucun fichier storage.rules local ne doit exister");
console.log("  ✅ [PASS] Gouvernance Firebase respectée (aucun fichier local de règles).");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES SPÉCIFICATIONS SONT VALIDÉES !");
console.log("===============================================================\n");
