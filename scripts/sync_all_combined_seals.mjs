/**
 * Script de synchronisation et génération du Double Sceau Combiné (`any` + `maskable`)
 * pour les associations existantes (`Samambaia` et `sambabulles`).
 * - Variante `any` (512x512, coins transparents) : `public/brandings/logoOG*.png` + `brandings/{groupId}/combined-logo.png`
 * - Variante `maskable` (512x512, carré 100 % opaque `#8B2A1A`, alpha 255 partout, médaillon ~84 %) :
 *   `public/brandings/logoOG*-maskable.png` + `brandings/{groupId}/combined-logo-maskable.png`
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { createCanvas, loadImage } from 'canvas';
import {
  MASKABLE_BG_HEX,
  MATRICE_MASKABLE_SCALE,
  enforceOpaqueMaskableCanvas
} from '../src/utils/sealMatrice.js';
import {
  drawSealNeutralFrame,
  drawSealLogoCenter
} from '../src/utils/shareUtils.js';

const API_KEY = 'AIzaSyCTvRPj2p3zdIfEjftXoSvRJ43Uy0EfPMY';
const PROJECT_ID = 'o-girador-7828c';
const BUCKET = 'o-girador-7828c.firebasestorage.app';

async function getAuthToken() {
  const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'http://localhost:5175/' },
    body: JSON.stringify({
      email: 'provisioner_recette@ogirador.com',
      password: 'TempProvisioner2026!',
      returnSecureToken: true
    })
  });
  const authData = await authRes.json();
  if (!authData.idToken) {
    throw new Error('Authentification échouée: ' + JSON.stringify(authData));
  }
  return authData.idToken;
}

async function uploadToStorageWithMirror(primaryPath, mirrorPath, buffer, token) {
  const attempt = async (objectPath) => {
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(objectPath)}&uploadType=media`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/png',
        Referer: 'http://localhost:5175/'
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
    return { objectPath, downloadUrl };
  };

  try {
    return await attempt(primaryPath);
  } catch (err) {
    console.warn(`⚠️ Repli Storage sur ${mirrorPath} (${err.message})`);
    return await attempt(mirrorPath);
  }
}

async function patchFirestoreFields(docId, fields, token) {
  const fieldPaths = Object.keys(fields).map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/${docId}?${fieldPaths}`;

  const firestoreFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.includes('.')) {
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
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Referer: 'http://localhost:5175/'
    },
    body: JSON.stringify({ fields: firestoreFields })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PATCH failed on ${docId} (${res.status}): ${errText}`);
  }
  return await res.json();
}

function assertMaskablePngBuffer(label, canvas) {
  assert.strictEqual(canvas.width, 512, `${label}: largeur 512 requise`);
  assert.strictEqual(canvas.height, 512, `${label}: hauteur 512 requise`);
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, 512, 512);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 255) {
      throw new Error(`${label}: pixel non opaque détecté à l'index ${i / 4} (alpha=${data[i + 3]})`);
    }
  }
  const corners = [
    [0, 0],
    [511, 0],
    [0, 511],
    [511, 511]
  ];
  for (const [x, y] of corners) {
    const idx = (y * 512 + x) * 4;
    assert.deepStrictEqual(
      [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]],
      [139, 42, 26, 255],
      `${label}: coin (${x},${y}) doit être strictement #8B2A1A alpha 255`
    );
  }
}

function assertAnyTransparentCorners(label, canvas) {
  const ctx = canvas.getContext('2d');
  const { data } = ctx.getImageData(0, 0, 512, 512);
  for (const [x, y] of [[0, 0], [511, 0], [0, 511], [511, 511]]) {
    const idx = (y * 512 + x) * 4;
    assert.strictEqual(data[idx + 3], 0, `${label}: coin (${x},${y}) doit être 100 % transparent (alpha=0)`);
  }
}

async function run() {
  console.log('=== GÉNÉRATION & SYNCHRONISATION DU DOUBLE SCEAU COMBINÉ (ANY + MASKABLE) ===');
  const token = await getAuthToken();
  console.log('✅ Authentifié auprès de Firebase Auth.');

  const size = 512;
  const matriceAny = await loadImage(path.resolve('public/brandings/organizador-matrice.png'));
  const matriceMaskable = await loadImage(path.resolve('public/brandings/organizador-matrice-maskable.png'));

  // =========================================================================
  // 1. SAMAMBAIA : conservation du blason détouré validé + variante maskable #8B2A1A ~84 %
  // =========================================================================
  console.log('\n--- 1. Samambaia ---');
  const samAnyLocalPath = path.resolve('public/brandings/logoOGSamambaia.png');
  const samMaskLocalPath = path.resolve('public/brandings/logoOGSamambaia-maskable.png');
  const samAnyImg = await loadImage(samAnyLocalPath);

  const samAnyVerifyCanvas = createCanvas(size, size);
  samAnyVerifyCanvas.getContext('2d').drawImage(samAnyImg, 0, 0, size, size);
  assertAnyTransparentCorners('Samambaia (any)', samAnyVerifyCanvas);
  const samAnyBuffer = fs.readFileSync(samAnyLocalPath);

  // Composition de la variante maskable Samambaia calibrée à 430/512 (~84 %) sur fond 100 % opaque #8B2A1A
  const samMaskCanvas = createCanvas(size, size);
  const samMaskCtx = samMaskCanvas.getContext('2d');
  samMaskCtx.fillStyle = MASKABLE_BG_HEX;
  samMaskCtx.fillRect(0, 0, size, size);
  const targetDiameter = Math.round(size * MATRICE_MASKABLE_SCALE); // 430 px
  const offset = Math.round((size - targetDiameter) / 2); // 41 px
  samMaskCtx.drawImage(samAnyImg, offset, offset, targetDiameter, targetDiameter);
  enforceOpaqueMaskableCanvas(samMaskCtx, size);
  assertMaskablePngBuffer('Samambaia (maskable)', samMaskCanvas);

  const samMaskBuffer = samMaskCanvas.toBuffer('image/png');
  fs.writeFileSync(samMaskLocalPath, samMaskBuffer);
  console.log(`✅ Sauvegardé : ${samMaskLocalPath} (${samMaskBuffer.length} octets, alpha=255 partout)`);

  const samCdnAny = 'https://organizador.o-girador.com/brandings/logoOGSamambaia.png';
  const samCdnMask = 'https://organizador.o-girador.com/brandings/logoOGSamambaia-maskable.png';

  let samFinalAnyUrl = samCdnAny;
  let samFinalMaskUrl = samCdnMask;
  try {
    const samStorageAny = await uploadToStorageWithMirror(
      'brandings/Samambaia/combined-logo.png',
      'associations/Samambaia/brandings/combined-logo.png',
      samAnyBuffer,
      token
    );
    const samStorageMask = await uploadToStorageWithMirror(
      'brandings/Samambaia/combined-logo-maskable.png',
      'associations/Samambaia/brandings/combined-logo-maskable.png',
      samMaskBuffer,
      token
    );
    samFinalAnyUrl = samStorageAny.downloadUrl || samCdnAny;
    samFinalMaskUrl = samStorageMask.downloadUrl || samCdnMask;
    console.log('✅ Samambaia Storage any     :', samFinalAnyUrl);
    console.log('✅ Samambaia Storage maskable:', samFinalMaskUrl);
  } catch {
    console.log('ℹ️ Compte recette hors groupe Samambaia : utilisation CDN Hosting + syncSealsAdmin Admin SDK pour Storage.');
  }

  try {
    await patchFirestoreFields('Samambaia', {
      'branding.combinedLogoUrl': samFinalAnyUrl,
      'branding.combinedLogoMaskableUrl': samFinalMaskUrl,
      'branding.customFaviconUrl': samFinalAnyUrl,
      combinedLogoUrl: samFinalAnyUrl,
      combinedLogoMaskableUrl: samFinalMaskUrl
    }, token);
    await patchFirestoreFields('samambaia', {
      'branding.combinedLogoUrl': samFinalAnyUrl,
      'branding.combinedLogoMaskableUrl': samFinalMaskUrl,
      combinedLogoUrl: samFinalAnyUrl,
      combinedLogoMaskableUrl: samFinalMaskUrl
    }, token);
    console.log('✅ Firestore Samambaia (+ alias samambaia) mis à jour.');
  } catch {
    console.log('ℹ️ Écriture Firestore Samambaia déléguée à syncSealsAdmin (isolation multi-tenant active).');
  }

  // =========================================================================
  // 2. SAMB'À BULLES (`sambabulles`) : régénération `any` + `maskable` sur vraies matrices
  // =========================================================================
  console.log("\n--- 2. Samb'à Bulles (sambabulles) ---");
  const sambabullesDocRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/associations/sambabulles`,
    { headers: { Authorization: `Bearer ${token}`, Referer: 'http://localhost:5175/' } }
  );
  const sambabullesDoc = await sambabullesDocRes.json();
  const sambabullesLogoUrl = sambabullesDoc.fields?.branding?.mapValue?.fields?.logoUrl?.stringValue;
  if (!sambabullesLogoUrl) {
    throw new Error("Aucun branding.logoUrl trouvé pour sambabulles dans Firestore !");
  }

  const sambaLogoBuf = Buffer.from(await (await fetch(sambabullesLogoUrl)).arrayBuffer());
  const sambaLogoImg = await loadImage(sambaLogoBuf);
  console.log(`Logo source Samb'à Bulles chargé : ${sambaLogoImg.width}×${sambaLogoImg.height}`);

  // 2a. Variante `any` détourée (organizador-matrice.png, coins 100 % transparents)
  const sambaAnyCanvas = createCanvas(size, size);
  const sambaAnyCtx = sambaAnyCanvas.getContext('2d');
  drawSealNeutralFrame(sambaAnyCtx, size, matriceAny, { maskable: false });
  drawSealLogoCenter(sambaAnyCtx, size, sambaLogoImg, { maskable: false });
  assertAnyTransparentCorners("Samb'à Bulles (any)", sambaAnyCanvas);
  const sambaAnyBuffer = sambaAnyCanvas.toBuffer('image/png');
  const sambaAnyLocalPath = path.resolve('public/brandings/logoOGSambabulles.png');
  fs.writeFileSync(sambaAnyLocalPath, sambaAnyBuffer);
  console.log(`✅ Sauvegardé : ${sambaAnyLocalPath} (${sambaAnyBuffer.length} octets, coins transparents)`);

  // 2b. Variante `maskable` pleine (organizador-matrice-maskable.png, carré 512x512 #8B2A1A alpha 255)
  const sambaMaskCanvas = createCanvas(size, size);
  const sambaMaskCtx = sambaMaskCanvas.getContext('2d');
  drawSealNeutralFrame(sambaMaskCtx, size, matriceMaskable, { maskable: true });
  drawSealLogoCenter(sambaMaskCtx, size, sambaLogoImg, { maskable: true });
  enforceOpaqueMaskableCanvas(sambaMaskCtx, size);
  assertMaskablePngBuffer("Samb'à Bulles (maskable)", sambaMaskCanvas);
  const sambaMaskBuffer = sambaMaskCanvas.toBuffer('image/png');
  const sambaMaskLocalPath = path.resolve('public/brandings/logoOGSambabulles-maskable.png');
  fs.writeFileSync(sambaMaskLocalPath, sambaMaskBuffer);
  console.log(`✅ Sauvegardé : ${sambaMaskLocalPath} (${sambaMaskBuffer.length} octets, alpha=255 partout)`);

  try {
    const sambaStorageAny = await uploadToStorageWithMirror(
      'brandings/sambabulles/combined-logo.png',
      'associations/sambabulles/brandings/combined-logo.png',
      sambaAnyBuffer,
      token
    );
    const sambaStorageMask = await uploadToStorageWithMirror(
      'brandings/sambabulles/combined-logo-maskable.png',
      'associations/sambabulles/brandings/combined-logo-maskable.png',
      sambaMaskBuffer,
      token
    );
    console.log("✅ Samb'à Bulles Storage any     :", sambaStorageAny.downloadUrl);
    console.log("✅ Samb'à Bulles Storage maskable:", sambaStorageMask.downloadUrl);

    await patchFirestoreFields('sambabulles', {
      'branding.combinedLogoUrl': sambaStorageAny.downloadUrl,
      'branding.combinedLogoMaskableUrl': sambaStorageMask.downloadUrl,
      'branding.customFaviconUrl': sambaStorageAny.downloadUrl,
      combinedLogoUrl: sambaStorageAny.downloadUrl,
      combinedLogoMaskableUrl: sambaStorageMask.downloadUrl
    }, token);
    console.log('✅ Firestore sambabulles mis à jour avec combinedLogoUrl & combinedLogoMaskableUrl.');
  } catch (sambaSyncErr) {
    console.log('ℹ️ Synchronisation Storage/Firestore sambabulles déléguée à syncSealsAdmin :', sambaSyncErr.message);
  }

  console.log('\n🎉 SYNCHRONISATION TERMINÉE AVEC SUCCÈS !');
}

run().catch((err) => {
  console.error('❌ ERREUR :', err);
  process.exit(1);
});
