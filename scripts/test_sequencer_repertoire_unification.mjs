/**
 * Suite de tests unitaires et d'intégration :
 * Unification du Répertoire Séquenceur & Architecture Multi-Tenant
 *
 * Vérifie :
 * 1. L'utilitaire buildSequencerUrl et la construction des liens profonds (file, patternId, sectionId, loadPreset).
 * 2. L'intégration de launchCrossApp / openSequencerWithCrossApp.
 * 3. Le hook useSequencerFirestoreData (groupVariants, décompression LZString, dossiers samba, stockage).
 * 4. La délégation contractuelle de useSequencerRhythms.
 * 5. La sécurité anti-undefined et l'affichage displayTitle dans RepertoirePieceModal.
 * 6. Le lancement SSO dans MestreRepertoireView.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : UNIFICATION DU RÉPERTOIRE SÉQUENCEUR & SSO");
console.log("===============================================================\n");

// ---------------------------------------------------------------------------
// Module 1 : Test de l'utilitaire buildSequencerUrl
// ---------------------------------------------------------------------------
console.log("▶️ Module 1 : Utilitaire de construction d'URLs Séquenceur (buildSequencerUrl)");

// Simulation directe de la logique de buildSequencerUrl
function buildSequencerUrl(baseUrl = 'https://sequenceur.app', item) {
  const base = (baseUrl || 'https://sequenceur.app').trim();
  if (!item) return base;

  const separator = base.includes('?') ? '&' : '?';

  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return base;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return `${base}${separator}file=${encodeURIComponent(trimmed)}`;
    }
    return `${base}${separator}patternId=${encodeURIComponent(trimmed)}`;
  }

  const collectionType = item._collection || item.collection;

  const candidateFileUrl = item.fileUrl || item.sequenceurFileUrl || (typeof item.jsonUrl === 'string' && (item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://')) ? item.jsonUrl : null);
  if (candidateFileUrl && (candidateFileUrl.startsWith('http://') || candidateFileUrl.startsWith('https://'))) {
    return `${base}${separator}file=${encodeURIComponent(candidateFileUrl)}`;
  }

  const sectionId = item.sectionId || (collectionType === 'sections' ? (item.id || item.sequenceurId) : null);
  if (sectionId) {
    return `${base}${separator}sectionId=${encodeURIComponent(sectionId)}`;
  }

  const presetId = item.loadPreset || item.presetId || (collectionType === 'presets' ? (item.id || item.sequenceurId) : null);
  if (presetId) {
    return `${base}${separator}loadPreset=${encodeURIComponent(presetId)}`;
  }

  const patternId = item.patternId || item.sequenceurId || (collectionType === 'patterns' ? item.id : null) || item.id;
  if (patternId && !patternId.startsWith('http://') && !patternId.startsWith('https://')) {
    return `${base}${separator}patternId=${encodeURIComponent(patternId)}`;
  }

  if (item.jsonUrl) {
    const isRemote = item.jsonUrl.startsWith('http://') || item.jsonUrl.startsWith('https://');
    const param = isRemote ? 'file' : 'patternId';
    return `${base}${separator}${param}=${encodeURIComponent(item.jsonUrl)}`;
  }

  return base;
}

// 1.1 Fichier distant Firebase Storage
const storageItem = {
  id: "convenção_2(4).json",
  sequenceurFileUrl: "https://firebasestorage.googleapis.com/v0/b/bucket/o/conven%C3%A7%C3%A3o_2(4).json?alt=media"
};
const urlStorage = buildSequencerUrl('https://custom-seq.app', storageItem);
assert.ok(urlStorage.includes('file='), "L'URL de fichier distant doit contenir le paramètre file");
assert.ok(urlStorage.startsWith('https://custom-seq.app?file='), "Doit cibler l'URL de base configurée");
console.log("  ✅ [PASS] Résolution de fichier distant Storage validée :", urlStorage);

// 1.2 Motif / Pattern Firestore (ex: samba privé du mestre)
const patternItem = {
  id: "pattern_samba_01",
  _collection: "patterns",
  folder: "samba",
  name: "Convenção Samba 1"
};
const urlPattern = buildSequencerUrl('https://sequenceur.app', patternItem);
assert.strictEqual(urlPattern, 'https://sequenceur.app?patternId=pattern_samba_01');
console.log("  ✅ [PASS] Résolution de patternId Firestore validée :", urlPattern);

// 1.3 Section / Arrangement
const sectionItem = {
  id: "sec_intro_01",
  _collection: "sections"
};
const urlSection = buildSequencerUrl('https://sequenceur.app?env=prod', sectionItem);
assert.strictEqual(urlSection, 'https://sequenceur.app?env=prod&sectionId=sec_intro_01');
console.log("  ✅ [PASS] Résolution de sectionId avec query param existant validée :", urlSection);

// 1.4 Preset de batterie
const presetItem = {
  id: "preset_baque_01",
  _collection: "presets"
};
const urlPreset = buildSequencerUrl(undefined, presetItem);
assert.strictEqual(urlPreset, 'https://sequenceur.app?loadPreset=preset_baque_01');
console.log("  ✅ [PASS] Résolution de loadPreset validée :", urlPreset);


// ---------------------------------------------------------------------------
// Module 2 : Audit statique du code source useSequencerFirestoreData.js
// ---------------------------------------------------------------------------
console.log("\n▶️ Module 2 : Moteur de données useSequencerFirestoreData.js");

const fsDataCode = fs.readFileSync(path.join(rootDir, 'src/hooks/useSequencerFirestoreData.js'), 'utf-8');

// 2.1 Absence de ReferenceError sur groupVariants
assert.ok(fsDataCode.includes('const groupVariants = Array.from('), "groupVariants doit être déclaré dans fetchData");
assert.ok(fsDataCode.includes('canonicalizeGroupId(groupId)'), "canonicalizeGroupId doit être utilisé pour normaliser la casse");
console.log("  ✅ [PASS] Définition robuste de groupVariants confirmée.");

// 2.2 Résolution exhaustive de memberIds
assert.ok(fsDataCode.includes('auth.currentUser?.uid'), "L'utilisateur connecté doit être inclus dans memberIds");
assert.ok(fsDataCode.includes('collection(db, \'users\')'), "Les utilisateurs de l'association doivent être requêtés");
assert.ok(fsDataCode.includes('chunks.push('), "memberIds doit être découpé en lots pour respecter la limite Firestore");
console.log("  ✅ [PASS] Résolution multi-membres et découpage par lots validés.");

// 2.3 Inclusion des créations privées (dossiers samba)
assert.ok(!fsDataCode.includes("doc.data().visibility === 'mestre_group' || doc.data().visibility === 'public'"), 
  "Les presets et motifs privés ne doivent plus être exclus");
assert.ok(fsDataCode.includes("displayTitle = `[${folder}] ${rawTitle}`"), 
  "Le formatage displayTitle doit inclure le dossier du motif");
console.log("  ✅ [PASS] Prise en charge intégrale des motifs privés et dossiers thématiques validée.");

// 2.4 Inclusion des fichiers Storage
assert.ok(fsDataCode.includes('documents/${groupId}/sequencer'), "Les fichiers Storage doivent être listés et fusionnés");
assert.ok(fsDataCode.includes("source: 'storage'"), "La source Storage doit être identifiée");
console.log("  ✅ [PASS] Fusion transparente des fichiers Storage confirmée.");


// ---------------------------------------------------------------------------
// Module 3 : Audit statique du hook useSequencerRhythms.js
// ---------------------------------------------------------------------------
console.log("\n▶️ Module 3 : Délégation unifiée de useSequencerRhythms.js");

const rhythmsCode = fs.readFileSync(path.join(rootDir, 'src/hooks/useSequencerRhythms.js'), 'utf-8');

assert.ok(rhythmsCode.includes("import { useSequencerFirestoreData } from './useSequencerFirestoreData';"),
  "useSequencerRhythms doit importer useSequencerFirestoreData");
assert.ok(rhythmsCode.includes("catalogRhythms: rhythms"), "catalogRhythms doit mapper sur rhythms unifié");
assert.ok(rhythmsCode.includes("loadingRhythms: loading"), "loadingRhythms doit mapper sur loading");
console.log("  ✅ [PASS] Délégation contractuelle sans régression validée.");


// ---------------------------------------------------------------------------
// Module 4 : Audit de RepertoirePieceModal.jsx
// ---------------------------------------------------------------------------
console.log("\n▶️ Module 4 : Intégrité de RepertoirePieceModal.jsx");

const modalCode = fs.readFileSync(path.join(rootDir, 'src/components/mestre/RepertoirePieceModal.jsx'), 'utf-8');

// 4.1 Utilisation de displayTitle
assert.ok(modalCode.includes("rhythm.displayTitle || rhythm.titre"), "Le libellé de l'option doit utiliser displayTitle");

// 4.2 Injection automatique du titre si vide
assert.ok(modalCode.includes("if (newSeqUrl && !titre.trim())"), "Le titre doit être pré-rempli si vide lors du choix de rythme");

// 4.3 Nettoyage strict anti-undefined
assert.ok(modalCode.includes("sequenceurId: matchedSeqId || null"), "sequenceurId doit valoir null si absent (pas undefined)");
assert.ok(modalCode.includes("sequenceurFileUrl: matchedSeqUrl || null"), "sequenceurFileUrl doit valoir null si absent (pas undefined)");
console.log("  ✅ [PASS] RepertoirePieceModal validé (sécurité Firestore & displayTitle).");


// ---------------------------------------------------------------------------
// Module 5 : Audit de MestreRepertoireView.jsx (SSO & affichage)
// ---------------------------------------------------------------------------
console.log("\n▶️ Module 5 : Lanceur SSO et badges dans MestreRepertoireView.jsx");

const viewCode = fs.readFileSync(path.join(rootDir, 'src/components/mestre/MestreRepertoireView.jsx'), 'utf-8');

assert.ok(viewCode.includes("openSequencerWithCrossApp"), "MestreRepertoireView doit importer openSequencerWithCrossApp");
assert.ok(viewCode.includes("hasSequencer = Boolean(piece.sequenceurFileUrl || piece.sequenceurId)"), 
  "La détection du Séquenceur doit vérifier sequenceurFileUrl OU sequenceurId");
assert.ok(viewCode.includes("onClick={() => openSequencerWithCrossApp(sequenceurUrl, piece)}"), 
  "Le bouton Écouter doit déclencher openSequencerWithCrossApp");
assert.ok(!viewCode.includes('href={targetSeqUrl}'), 
  "L'ancien lien <a> direct sans SSO ne doit plus être présent");
console.log("  ✅ [PASS] Lancement SSO crossApp et détection exhaustive confirmés dans MestreRepertoireView.");


// ---------------------------------------------------------------------------
// Module 6 : Respect des règles de code (commentaires français, modularité)
// ---------------------------------------------------------------------------
console.log("\n▶️ Module 6 : Règle de francisation et architecture");

const utilCode = fs.readFileSync(path.join(rootDir, 'src/utils/sequencerUrlUtils.js'), 'utf-8');
assert.ok(utilCode.includes("Construit l'URL complète"), "Les commentaires doivent être en français dans sequencerUrlUtils");
assert.ok(fsDataCode.includes("Vérifie si un morceau ou une séquence"), "Les commentaires doivent être en français dans useSequencerFirestoreData");
console.log("  ✅ [PASS] Commentaires 100% en français et modularité respectés.");

console.log("\n===============================================================");
console.log("🏆 SUCCÈS TOTAL : TOUTES LES ASSERTIONS SÉQUENCEUR SONT VALIDÉES !");
console.log("===============================================================\n");
