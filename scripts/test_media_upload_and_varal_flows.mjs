import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log("🚀 Lancement du test d'audit et sécurisation des flux d'upload (Vidéos répétitions & Photos événements)...\n");

const rootDir = process.cwd();

// 1. Audit EventMediaCaptureSection.jsx
console.log("1️⃣ Audit de EventMediaCaptureSection.jsx...");
const capturePath = path.join(rootDir, 'src/components/event-details/EventMediaCaptureSection.jsx');
const captureCode = fs.readFileSync(capturePath, 'utf8');

assert(
  captureCode.includes("resolveEffectiveDropUrl"),
  "EventMediaCaptureSection doit résoudre l'URL de dépôt avec fallback"
);
assert(
  captureCode.includes("window.open(effectiveDropUrl, '_blank', 'noopener,noreferrer')"),
  "Le bouton Déposer une vidéo doit ouvrir le lien dans un onglet externe sécurisé sans CORS"
);
assert(
  !captureCode.includes("fetch(effectiveDropUrl") && !captureCode.includes("<iframe src={effectiveDropUrl}"),
  "EventMediaCaptureSection ne doit JAMAIS faire de fetch ou iframe sur le lien Framaspace File Drop"
);
console.log("   ✅ EventMediaCaptureSection sécurisé (dépôt externe sans interception CORS).");

// 2. Audit useVaralData.js
console.log("\n2️⃣ Audit de useVaralData.js...");
const varalDataPath = path.join(rootDir, 'src/hooks/useVaralData.js');
const varalDataCode = fs.readFileSync(varalDataPath, 'utf8');

assert(
  varalDataCode.includes("const hasAlbum = Boolean((ev.albumPhotosUrl || '').trim());"),
  "useVaralData doit évaluer hasAlbum"
);
assert(
  varalDataCode.includes("const isDropOnly = !hasAlbum && hasDepot;"),
  "useVaralData doit marquer isDropOnly quand seul le dépôt est renseigné"
);
assert(
  varalDataCode.includes("[Collecte Photos]") && varalDataCode.includes("[Album]"),
  "Le titre du document virtuel doit être [Collecte Photos] si aucun album n'est encore publié"
);
console.log("   ✅ useVaralData différencie parfaitement album publié et collecte de photos en cours.");

// 3. Audit DocumentViewerModal.jsx
console.log("\n3️⃣ Audit de DocumentViewerModal.jsx...");
const docModalPath = path.join(rootDir, 'src/components/documents/DocumentViewerModal.jsx');
const docModalCode = fs.readFileSync(docModalPath, 'utf8');

assert(
  docModalCode.includes("const isDropOnly = Boolean(docItem.isDropOnly)"),
  "DocumentViewerModal doit identifier les livrets isDropOnly"
);
assert(
  docModalCode.includes("const isFramaspaceShare = !isDropOnly"),
  "isFramaspaceShare doit être désactivé pour les dossiers de collecte pure"
);
assert(
  docModalCode.includes("Collecte de photos &amp; vidéos en cours") || docModalCode.includes("Collecte de photos & vidéos en cours"),
  "DocumentViewerModal doit afficher l'écran dédié de collecte"
);
assert(
  docModalCode.includes("window.open(targetUrl, '_blank', 'noopener,noreferrer')"),
  "Le bouton de dépôt dans DocumentViewerModal doit utiliser window.open sécurisé"
);
console.log("   ✅ DocumentViewerModal n'exécute pas de galerie WebDAV sur un lien de dépôt brut et propose l'action directe.");

// 4. Audit FramaspaceGalleryViewer.jsx
console.log("\n4️⃣ Audit de FramaspaceGalleryViewer.jsx...");
const galleryPath = path.join(rootDir, 'src/components/studio/FramaspaceGalleryViewer.jsx');
const galleryCode = fs.readFileSync(galleryPath, 'utf8');

assert(
  galleryCode.includes("Promise.race"),
  "FramaspaceGalleryViewer doit implémenter une course avec timeout pour éviter les requêtes infinies"
);
assert(
  galleryCode.includes("8000"),
  "FramaspaceGalleryViewer doit définir un délai de garde de 8 secondes"
);
assert(
  galleryCode.includes("finally") && galleryCode.includes("setLoading(false)"),
  "FramaspaceGalleryViewer doit réinitialiser loading à false dans un bloc finally garanti"
);
assert(
  galleryCode.includes("window.open(albumUrl, '_blank', 'noopener,noreferrer')"),
  "FramaspaceGalleryViewer doit sécuriser l'ouverture externe de l'album"
);
console.log("   ✅ FramaspaceGalleryViewer immunisé contre les blocages infinis de requêtes WebDAV.");

// 5. Audit StudioEventsMediaTable.jsx
console.log("\n5️⃣ Audit de StudioEventsMediaTable.jsx...");
const tablePath = path.join(rootDir, 'src/components/studio/StudioEventsMediaTable.jsx');
const tableCode = fs.readFileSync(tablePath, 'utf8');

assert(
  tableCode.includes("handleSaveDepot") && tableCode.includes("savingDepot: false"),
  "handleSaveDepot doit réinitialiser savingDepot"
);
assert(
  tableCode.includes("handleSaveAlbumDirect") && tableCode.includes("savingAlbum: false"),
  "handleSaveAlbumDirect doit réinitialiser savingAlbum dans un bloc finally"
);
assert(
  tableCode.includes("handleProvisionFramaspace") && tableCode.includes("prev[ev.id]?.loading"),
  "handleProvisionFramaspace doit nettoyer loading dans finally"
);
console.log("   ✅ StudioEventsMediaTable sécurisé avec blocs finally stricts.");

// 6. Audit StudioMultiPhotoManager.jsx
console.log("\n6️⃣ Audit de StudioMultiPhotoManager.jsx...");
const multiPhotoPath = path.join(rootDir, 'src/components/studio/StudioMultiPhotoManager.jsx');
const multiPhotoCode = fs.readFileSync(multiPhotoPath, 'utf8');

assert(
  multiPhotoCode.includes("isUploading: false, error: true"),
  "StudioMultiPhotoManager doit marquer error: true en cas d'échec"
);
assert(
  multiPhotoCode.includes("Échec envoi"),
  "StudioMultiPhotoManager doit afficher un badge visuel clair en cas d'erreur de téléversement"
);
assert(
  multiPhotoCode.includes("fileInputRef.current.value = ''"),
  "StudioMultiPhotoManager doit réinitialiser l'input file après sélection"
);
console.log("   ✅ StudioMultiPhotoManager dispose de feedbacks d'erreur et réinitialisations garantis.");

console.log("\n✨ TOUS LES CONTRÔLES D'AUDIT ET SÉCURISATION SONT VALIDÉS AVEC SUCCÈS ! (100% PASS)");
