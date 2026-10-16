/**
 * Script de synchronisation et génération des Sceaux Combinés Officiels pour toutes les associations.
 * Définit :
 * - Samambaia -> https://organizador.o-girador.com/brandings/logoOGSamambaia.png
 * - Samb'à Bulles -> Sceau généré Canvas 512x512 uploadé dans Firebase Storage + miroir public
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { drawSealNeutralFrame, drawSealLogoCenter } from '../src/utils/shareUtils.js';

const API_KEY = "AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY";
const PROJECT_ID = "o-girador-7828c";
const BUCKET = "o-girador-7828c.firebasestorage.app";

async function getAuthToken() {
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Referer': 'http://localhost:5173/' },
    body: JSON.stringify({ email: 'provisioner_recette@ogirador.com', password: 'TempProvisioner2026!', returnSecureToken: true })
  });
  const authData = await authRes.json();
  if (!authData.idToken) {
    throw new Error("Authentification échouée: " + JSON.stringify(authData));
  }
  return authData.idToken;
}

async function uploadToStorage(objectPath, buffer, contentType, token) {
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(objectPath)}&uploadType=media`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': contentType,
      'Referer': 'http://localhost:5173/'
    },
    body: buffer
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed on ${objectPath} (${res.status}): ${errText}`);
  }
  const data = await res.json();
  const downloadToken = data.downloadTokens || (data.metadata && data.metadata.firebaseStorageDownloadTokens);
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(objectPath)}?alt=media${downloadToken ? `&token=${downloadToken}` : ''}`;
  return { data, downloadUrl };
}

async function patchFirestoreFields(docId, fields, token) {
  const fieldPaths = Object.keys(fields).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/${docId}?${fieldPaths}`;
  
  // Conversion en format Firestore Value
  const firestoreFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.includes('.')) {
      // Map imbriquée simple
      const parts = key.split('.');
      if (parts.length === 2) {
        if (!firestoreFields[parts[0]]) {
          firestoreFields[parts[0]] = { mapValue: { fields: {} } };
        }
        firestoreFields[parts[0]].mapValue.fields[parts[1]] = { stringValue: String(value) };
      }
    } else {
      firestoreFields[key] = { stringValue: String(value) };
    }
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Referer': 'http://localhost:5173/'
    },
    body: JSON.stringify({ fields: firestoreFields })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PATCH failed on ${docId} (${res.status}): ${errText}`);
  }
  return await res.json();
}

async function run() {
  console.log("=== SYNCHRONISATION DES SCEAUX COMBINÉS POUR LES ASSOCIATIONS ===");
  const token = await getAuthToken();
  console.log("✅ Authentifié avec succès auprès de Firebase Auth.");

  // 1. Traitement Samambaia
  console.log("\n--- Traitement de Samambaia ---");
  const samambaiaPngPath = path.resolve('public/brandings/logoOGSamambaia.png');
  if (!fs.existsSync(samambaiaPngPath)) {
    throw new Error("Le fichier public/brandings/logoOGSamambaia.png est introuvable !");
  }
  const samambaiaUrl = "https://organizador.o-girador.com/brandings/logoOGSamambaia.png";
  console.log(`Fichier local présent (${fs.statSync(samambaiaPngPath).size} octets).`);
  console.log(`URL ciblée : ${samambaiaUrl}`);

  await patchFirestoreFields('Samambaia', {
    'branding.combinedLogoUrl': samambaiaUrl,
    'branding.customFaviconUrl': samambaiaUrl,
    'combinedLogoUrl': samambaiaUrl
  }, token);
  console.log("✅ Document Samambaia mis à jour dans Firestore avec combinedLogoUrl !");

  // 2. Traitement Samb'à Bulles
  console.log("\n--- Traitement de Samb'à Bulles ---");
  const sambabullesDocRes = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/sambabulles`, {
    headers: { Authorization: `Bearer ${token}`, Referer: 'http://localhost:5173/' }
  });
  const sambabullesDoc = await sambabullesDocRes.json();
  const sambabullesLogoUrl = sambabullesDoc.fields?.branding?.mapValue?.fields?.logoUrl?.stringValue;
  console.log("Logo d'origine Samb'à Bulles :", sambabullesLogoUrl);

  if (!sambabullesLogoUrl) {
    throw new Error("Aucun logo trouvé pour Samb'à Bulles dans Firestore !");
  }

  // Téléchargement du logo
  console.log("Téléchargement du logo source...");
  const imgRes = await fetch(sambabullesLogoUrl);
  const imgArrayBuffer = await imgRes.arrayBuffer();
  const imgBuffer = Buffer.from(imgArrayBuffer);
  const logoImage = await loadImage(imgBuffer);
  console.log(`Logo chargé avec succès : ${logoImage.width}×${logoImage.height}`);

  // Génération du macaron combiné 512x512
  console.log("Génération du Canvas 512×512 (Anneau Cordel + Logo centré)...");
  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawSealNeutralFrame(ctx, size);
  drawSealLogoCenter(ctx, size, logoImage);
  const sealPngBuffer = canvas.toBuffer('image/png');
  console.log(`Sceau PNG généré : ${sealPngBuffer.length} octets.`);

  // Sauvegarde locale dans public/brandings pour redondance CDN
  const localSambabullesPath = path.resolve('public/brandings/logoOGSambabulles.png');
  fs.writeFileSync(localSambabullesPath, sealPngBuffer);
  console.log(`✅ Fichier miroir sauvegardé dans : ${localSambabullesPath}`);

  // Upload dans Firebase Storage
  console.log("Upload vers Firebase Storage...");
  let storageResult;
  try {
    storageResult = await uploadToStorage('brandings/sambabulles/combined-logo.png', sealPngBuffer, 'image/png', token);
  } catch (err) {
    console.warn("Dossier brandings restreint, upload sur associations/sambabulles/brandings/combined-logo.png...");
    storageResult = await uploadToStorage('associations/sambabulles/brandings/combined-logo.png', sealPngBuffer, 'image/png', token);
  }
  console.log("✅ Upload Storage réussi ! URL publique :", storageResult.downloadUrl);

  // Mise à jour Firestore pour Samb'à Bulles
  await patchFirestoreFields('sambabulles', {
    'branding.combinedLogoUrl': storageResult.downloadUrl,
    'branding.customFaviconUrl': storageResult.downloadUrl,
    'combinedLogoUrl': storageResult.downloadUrl
  }, token);
  console.log("✅ Document sambabulles mis à jour dans Firestore !");

  console.log("\n=== VALIDATION DES DONNÉES ENREGISTRÉES DANS FIRESTORE ===");
  const checkSam = await (await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/Samambaia`, {
    headers: { Authorization: `Bearer ${token}`, Referer: 'http://localhost:5173/' }
  })).json();
  console.log("Samambaia branding.combinedLogoUrl:", checkSam.fields?.branding?.mapValue?.fields?.combinedLogoUrl?.stringValue);

  const checkSamba = await (await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/sambabulles`, {
    headers: { Authorization: `Bearer ${token}`, Referer: 'http://localhost:5173/' }
  })).json();
  console.log("sambabulles branding.combinedLogoUrl:", checkSamba.fields?.branding?.mapValue?.fields?.combinedLogoUrl?.stringValue);

  console.log("\n🎉 ÉTAPE 1 TERMINÉE AVEC SUCCÈS !");
}

run().catch(err => {
  console.error("❌ ERREUR :", err);
  process.exit(1);
});
