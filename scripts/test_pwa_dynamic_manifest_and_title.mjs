import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { createRequire } from 'module';
import { buildDynamicManifestHref, extractGroupFromSearch } from '../src/hooks/useDynamicManifest.js';
import { generateCombinedSealCanvas } from '../src/utils/shareUtils.js';

const require = createRequire(import.meta.url);
const { loadImage, createCanvas } = require('canvas');
const { buildDynamicManifestPayload } = require('../functions/manifestDynamicHelper.js');
const { buildMulticastMessage, ANDROID_ALFAIA_BADGE_URL } = require('../functions/pushMessage.js');

console.log('🧪 DÉBUT DU TEST : MANIFEST PWA DYNAMIQUE ("Organizador" + DOUBLE SCEAU ANY/MASKABLE) & BADGE ALFAIA...');

// 1. Contrôle du repli statique public/manifest.json
const manifestPath = path.resolve('public/manifest.json');
assert(fs.existsSync(manifestPath), 'public/manifest.json doit exister');
const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
assert.strictEqual(manifestContent.short_name, 'Organizador', 'short_name statique doit être "Organizador"');
assert.strictEqual(manifestContent.name, 'Organizador', 'name statique doit être "Organizador"');
assert.strictEqual(manifestContent.start_url, '/', 'start_url statique doit être "/"');
assert.strictEqual(manifestContent.theme_color, '#8B2A1A', 'theme_color statique doit être "#8B2A1A"');
assert.strictEqual(manifestContent.background_color, '#F4ECD8', 'background_color statique doit être "#F4ECD8"');
assert(
  manifestContent.icons.every((i) => ['any', 'maskable', 'monochrome'].includes(i.purpose)),
  'Aucun cumul "any maskable" autorisé'
);
assert(
  manifestContent.icons.some((i) => i.src === '/icons/badge-alfaia-mono.png' && i.purpose === 'monochrome'),
  'public/manifest.json doit déclarer une entrée dédiée purpose="monochrome" vers /icons/badge-alfaia-mono.png'
);
console.log('✅ public/manifest.json : short_name="Organizador", start_url="/", entrées any/maskable/monochrome séparées');

// 2. Contrôle du générateur serveur serveDynamicManifest (manifestDynamicHelper.js)
{
  const neutralManifest = buildDynamicManifestPayload({
    effectiveHost: 'organizador.o-girador.com',
    isDedicatedMostrador: false
  });
  assert.strictEqual(neutralManifest.short_name, 'Organizador');
  assert.strictEqual(neutralManifest.name, 'Organizador');
  assert.strictEqual(neutralManifest.start_url, '/');
  assert.strictEqual(neutralManifest.theme_color, '#8B2A1A');
  assert.strictEqual(neutralManifest.background_color, '#F4ECD8');
  assert.strictEqual(neutralManifest.icons.length, 5);
  assert(neutralManifest.icons.some((i) => i.src.endsWith('/icon-192-v2.png') && i.purpose === 'any'));
  assert(neutralManifest.icons.some((i) => i.src.endsWith('/icon-512-maskable-v2.png') && i.purpose === 'maskable'));
  assert(neutralManifest.icons.some((i) => i.src.endsWith('/icons/badge-alfaia-mono.png') && i.purpose === 'monochrome'));

  const groupManifest = buildDynamicManifestPayload({
    effectiveHost: 'organizador.o-girador.com',
    isDedicatedMostrador: false,
    groupId: 'BaqueSol',
    assocData: {
      nom: 'Baque do Sol',
      branding: {
        combinedLogoUrl: 'https://cdn.example.com/brandings/BaqueSol/combined-logo.png',
        combinedLogoMaskableUrl: 'https://cdn.example.com/brandings/BaqueSol/combined-logo-maskable.png'
      }
    }
  });
  assert.strictEqual(groupManifest.short_name, 'Organizador');
  assert.strictEqual(groupManifest.name, 'Organizador — Baque do Sol');
  assert.strictEqual(groupManifest.start_url, '/?groupe=BaqueSol');
  assert.strictEqual(groupManifest.theme_color, '#8B2A1A');
  assert.strictEqual(groupManifest.background_color, '#F4ECD8');
  assert.strictEqual(groupManifest.icons.length, 5);
  assert(groupManifest.icons.every((i) => !i.purpose.includes(' ')), 'Interdiction formelle de cumuler "any maskable"');
  assert.deepStrictEqual(groupManifest.icons, [
    {
      src: 'https://cdn.example.com/brandings/BaqueSol/combined-logo.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: 'https://cdn.example.com/brandings/BaqueSol/combined-logo.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: 'https://cdn.example.com/brandings/BaqueSol/combined-logo-maskable.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: 'https://cdn.example.com/brandings/BaqueSol/combined-logo-maskable.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: 'https://organizador.o-girador.com/icons/badge-alfaia-mono.png',
      sizes: '96x96',
      type: 'image/png',
      purpose: 'monochrome'
    }
  ]);

  const fallbackIconManifest = buildDynamicManifestPayload({
    effectiveHost: 'organizador.o-girador.com',
    isDedicatedMostrador: false,
    groupId: 'TroupeTest',
    assocData: { nom: 'Troupe Test', branding: {} }
  });
  assert.strictEqual(fallbackIconManifest.short_name, 'Organizador');
  assert.strictEqual(fallbackIconManifest.name, 'Organizador — Troupe Test');
  assert(fallbackIconManifest.icons.some((i) => i.src === 'https://organizador.o-girador.com/icon-512-v2.png' && i.purpose === 'any'));
  assert(fallbackIconManifest.icons.some((i) => i.src === 'https://organizador.o-girador.com/icon-512-maskable-v2.png' && i.purpose === 'maskable'));
  console.log('✅ serveDynamicManifest : entrées any (détouré) + maskable (carré #8B2A1A) séparées et repli validés');
}

// 3. Contrôle du hook client useDynamicManifest.js (URL HTTPS /manifest.webmanifest, zéro blob:)
{
  assert.strictEqual(buildDynamicManifestHref(''), '/manifest.webmanifest');
  assert.strictEqual(buildDynamicManifestHref('BaqueSol'), '/manifest.webmanifest?groupe=BaqueSol');
  assert.strictEqual(extractGroupFromSearch('?groupe=sambabulles&mode=signup'), 'sambabulles');
  const hookSrc = fs.readFileSync(path.resolve('src/hooks/useDynamicManifest.js'), 'utf-8');
  assert(!hookSrc.includes('createObjectURL'), 'useDynamicManifest ne doit jamais générer de blob URL');
  assert(hookSrc.includes('/manifest.webmanifest'), 'useDynamicManifest doit pointer vers /manifest.webmanifest');
  console.log('✅ useDynamicManifest.js pointe vers /manifest.webmanifest?groupe=... sans blob:');
}

// 4. Contrôle pixel par pixel de la génération Canvas duale (any transparent vs maskable 100 % opaque #8B2A1A)
{
  const canvasFactory = (w, h) => createCanvas(w, h);
  const matriceAny = await loadImage(path.resolve('public/brandings/organizador-matrice.png'));
  const matriceMask = await loadImage(path.resolve('public/brandings/organizador-matrice-maskable.png'));

  const anySeal = await generateCombinedSealCanvas(
    { nom: 'Troupe Test', branding: { colors: { primary: '#8B2A1A' } } },
    { size: 512, maskable: false, canvasFactory, matriceImage: matriceAny }
  );
  const anyPx = anySeal.canvas.getContext('2d').getImageData(0, 0, 512, 512).data;
  assert.strictEqual(anyPx[3], 0, 'Le coin supérieur gauche du sceau any doit être 100 % transparent');

  const maskSeal = await generateCombinedSealCanvas(
    { nom: 'Troupe Test', branding: { colors: { primary: '#8B2A1A' } } },
    { size: 512, maskable: true, canvasFactory, matriceImage: matriceMask }
  );
  const maskPx = maskSeal.canvas.getContext('2d').getImageData(0, 0, 512, 512).data;
  for (let i = 3; i < maskPx.length; i += 4) {
    if (maskPx[i] !== 255) assert.fail(`Pixel non opaque détecté dans le sceau maskable (alpha=${maskPx[i]})`);
  }
  assert.deepStrictEqual([maskPx[0], maskPx[1], maskPx[2], maskPx[3]], [139, 42, 26, 255]);

  for (const maskFile of ['public/brandings/organizador-matrice-maskable.png', 'public/brandings/logoOGSambabulles-maskable.png']) {
    const img = await loadImage(path.resolve(maskFile));
    assert.strictEqual(img.width, 512, `${maskFile} doit faire 512px de large`);
    assert.strictEqual(img.height, 512, `${maskFile} doit faire 512px de haut`);
    const c = createCanvas(512, 512);
    c.getContext('2d').drawImage(img, 0, 0);
    const d = c.getContext('2d').getImageData(0, 0, 512, 512).data;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] !== 255) assert.fail(`${maskFile}: pixel non opaque détecté (alpha=${d[i]})`);
    }
    assert.deepStrictEqual([d[0], d[1], d[2], d[3]], [139, 42, 26, 255], `${maskFile}: coin (0,0) doit être #8B2A1A`);
  }
  console.log('✅ Génération Canvas duale & assets maskable (alpha=255 #8B2A1A) validés');
}

// 5. Contrôle pixel par pixel du badge monochrome tambour Alfaia (96x96, #FFFFFF + rgba(0,0,0,0) exclusivement)
{
  const badgePath = path.resolve('public/icons/badge-alfaia-mono.png');
  assert(fs.existsSync(badgePath), 'public/icons/badge-alfaia-mono.png doit exister');
  const img = await loadImage(badgePath);
  assert.strictEqual(img.width, 96, 'Le badge Android doit faire 96px de large');
  assert.strictEqual(img.height, 96, 'Le badge Android doit faire 96px de haut');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  let whiteCount = 0;
  let transparentCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a === 0 && r === 0 && g === 0 && b === 0) transparentCount++;
    else if (a === 255 && r === 255 && g === 255 && b === 255) whiteCount++;
    else assert.fail(`Pixel non monochrome interdit détecté rgba(${r},${g},${b},${a})`);
  }
  assert(whiteCount > 1000 && transparentCount > 1000, 'La silhouette Alfaia doit comporter forme blanche et fond transparent');
  console.log(`✅ badge-alfaia-mono.png : 96x96 pur monochrome (${whiteCount} px #FFFFFF, ${transparentCount} px transparents)`);
}

// 6. Contrôle du payload FCM serveur & SW / Premier plan
{
  assert.strictEqual(ANDROID_ALFAIA_BADGE_URL, 'https://organizador.o-girador.com/icons/badge-alfaia-mono.png');
  const msg = buildMulticastMessage({
    dataPayload: { url: '/app/agenda' },
    groupId: 'BaqueSol',
    title: 'Baque do Sol | Répétition',
    body: 'Ce soir 20h',
    assoIcon: 'https://cdn.example.com/seal.png',
    tokens: ['tok_1']
  });
  assert.strictEqual(msg.webpush.notification.badge, 'https://organizador.o-girador.com/icons/badge-alfaia-mono.png');
  assert.strictEqual(msg.webpush.notification.icon, 'https://cdn.example.com/seal.png');
  assert.strictEqual(msg.webpush.notification.tag, 'organizador-alfaia');
  assert.strictEqual(msg.webpush.notification.renotify, true);
  assert.strictEqual(msg.android.notification.tag, 'organizador-alfaia');

  const swContent = fs.readFileSync(path.resolve('public/firebase-messaging-sw.js'), 'utf-8');
  assert(swContent.includes("'/icons/badge-alfaia-mono.png'"), 'firebase-messaging-sw.js doit référencer /icons/badge-alfaia-mono.png');
  assert(swContent.includes("'organizador-alfaia'"), 'firebase-messaging-sw.js doit imposer le tag unique organizador-alfaia');
  assert(swContent.includes('renotify: true'), 'firebase-messaging-sw.js doit activer renotify: true');

  const helperContent = fs.readFileSync(path.resolve('src/utils/pushNotificationHelper.js'), 'utf-8');
  assert(helperContent.includes("badge: '/icons/badge-alfaia-mono.png'"), 'pushNotificationHelper.js doit renseigner /icons/badge-alfaia-mono.png');
  console.log('✅ Payload FCM webpush.notification.badge, Service Worker et notifications premier plan validés');
}

console.log('🎉 TOUS LES CONTRÔLES MANIFEST DYNAMIQUE & DOUBLE SCEAU ONT RÉUSSI AVEC SUCCÈS !');
