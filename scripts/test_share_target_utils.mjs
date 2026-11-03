import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractUrlFromSharedText } from '../src/utils/shareTargetIdbUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Démarrage des tests Web Share Target API (Lot C4)...');

// 1. Validation de extractUrlFromSharedText — Cas YouTube (URL glissée dans text)
{
  const res = extractUrlFromSharedText(
    'Regarde ce baque de Nação Estrela Brilhante : https://youtu.be/dQw4w9WgXcQ?si=1234',
    ''
  );
  assert.equal(res.extractedUrl, 'https://youtu.be/dQw4w9WgXcQ?si=1234');
  assert.equal(res.cleanText, 'Regarde ce baque de Nação Estrela Brilhante');
  assert.equal(res.isYouTube, true);
  console.log('✅ Cas 1 (YouTube dans text) validé.');
}

// 2. Validation de extractUrlFromSharedText — Cas WhatsApp (texte + lien web + ponctuation finale)
{
  const res = extractUrlFromSharedText(
    'Voici le lieu du défilé demain : https://maps.example.com/place/recife.',
    ''
  );
  assert.equal(res.extractedUrl, 'https://maps.example.com/place/recife');
  assert.equal(res.cleanText, 'Voici le lieu du défilé demain');
  assert.equal(res.isYouTube, false);
  console.log('✅ Cas 2 (WhatsApp texte + lien + ponctuation) validé.');
}

// 3. Validation de extractUrlFromSharedText — Cas URL explicite + doublon dans text
{
  const res = extractUrlFromSharedText(
    'Super vidéo https://www.youtube.com/watch?v=abc123XYZ',
    'https://www.youtube.com/watch?v=abc123XYZ'
  );
  assert.equal(res.extractedUrl, 'https://www.youtube.com/watch?v=abc123XYZ');
  assert.equal(res.cleanText, 'Super vidéo');
  assert.equal(res.isYouTube, true);
  console.log('✅ Cas 3 (URL explicite dédoublonnée du texte) validé.');
}

// 4. Validation de public/manifest.json
{
  const manifestPath = path.join(ROOT, 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.share_target, 'Le bloc share_target doit exister dans public/manifest.json');
  assert.equal(manifest.share_target.action, '/app?share-target=1');
  assert.equal(manifest.share_target.method, 'POST');
  assert.equal(manifest.share_target.enctype, 'multipart/form-data');
  assert.equal(manifest.share_target.params?.title, 'title');
  assert.equal(manifest.share_target.params?.text, 'text');
  assert.equal(manifest.share_target.params?.url, 'url');
  assert.equal(manifest.share_target.params?.files?.[0]?.name, 'media');
  assert.deepEqual(manifest.share_target.params?.files?.[0]?.accept, ['image/*', 'application/pdf']);
  console.log('✅ Cas 4 (Structure share_target dans public/manifest.json) validé.');
}

// 5. Validation de la préservation du WebAPK dans src/App.jsx et des limites Anti-Monolithe
{
  const appCode = fs.readFileSync(path.join(ROOT, 'src', 'App.jsx'), 'utf8');
  assert.ok(!appCode.includes('manifestBlobUrl'), 'src/App.jsx ne doit plus écraser le manifest par un Blob URL');

  const filesToCheck = [
    ['public/share-target-sw.js', 90],
    ['src/utils/shareTargetIdbUtils.js', 100],
    ['src/hooks/useShareTarget.js', 110],
    ['src/utils/shareTargetDispatchUtils.js', 130],
    ['src/components/share/ShareTargetModal.jsx', 135]
  ];

  for (const [relPath, maxLines] of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    const lines = content.split(/\r?\n/).length;
    assert.ok(lines <= maxLines, `${relPath} dépasse la limite (${lines} > ${maxLines} lignes)`);
    console.log(`✅ Anti-Monolithe respecté : ${relPath} (${lines}/${maxLines} lignes)`);
  }
}

console.log('🎉 Tous les tests Web Share Target API sont passés avec succès !');

