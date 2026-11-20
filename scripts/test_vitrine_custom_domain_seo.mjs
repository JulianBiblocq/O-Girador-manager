import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  isLockedVitrineHost,
  sanitizeLockedVitrinePathname,
  extractVitrineSlugFromPath,
  resolveIsVitrineMode,
  buildOrganizadorMemberUrl
} from '../src/utils/vitrineLockUtils.js';

const require = createRequire(import.meta.url);
const {
  resolveIncomingHost,
  normalizeDomainHost,
  isInternalPlatformHost,
  scoreAssociationDoc,
  injectSeoIntoHtml
} = require('../functions/seoDynamicHelper.js');

console.log('🧪 DÉBUT DU TEST : VERROUILLAGE VITRINE & SEO DOMAINES PERSONNALISÉS (SAAS)...\n');

// 1. Résolution de l'hôte entrant (x-forwarded-host / x-fh-requested-host / hostname) et nettoyage www.
{
  const req1 = { headers: { 'x-forwarded-host': 'www.baque-do-sol.fr, o-girador-7828c.web.app' }, hostname: 'servedynamicapp-xyz.a.run.app' };
  const raw1 = resolveIncomingHost(req1);
  assert.equal(raw1, 'www.baque-do-sol.fr');
  assert.equal(normalizeDomainHost(raw1), 'baque-do-sol.fr');

  const req2 = { headers: { 'x-fh-requested-host': 'baque-do-sol.fr:443' }, hostname: 'o-girador-7828c.web.app' };
  assert.equal(resolveIncomingHost(req2), 'baque-do-sol.fr');

  assert.equal(isInternalPlatformHost('o-girador.com'), true);
  assert.equal(isInternalPlatformHost('organizador.o-girador.com'), true);
  assert.equal(isInternalPlatformHost('mostrador.o-girador.com'), true);
  assert.equal(isInternalPlatformHost('o-girador-7828c.web.app'), true);
  assert.equal(isInternalPlatformHost('baque-do-sol.fr'), false);
  assert.equal(isInternalPlatformHost('www.baque-do-sol.fr'), false);
  console.log('  ✅ [PASS] Détection d\'hôte entrant et filtrage domaines personnalisés vs internes');
}

// 2. Verrouillage strict du mode Vitrine sur les domaines personnalisés et mostrador.o-girador.com
{
  assert.equal(isLockedVitrineHost('baque-do-sol.fr'), true);
  assert.equal(isLockedVitrineHost('www.baque-do-sol.fr'), true);
  assert.equal(isLockedVitrineHost('mostrador.o-girador.com'), true);
  assert.equal(isLockedVitrineHost('organizador.o-girador.com'), false);
  assert.equal(isLockedVitrineHost('localhost'), false);

  for (const internalPath of ['/', '/app', '/dashboard', '/login', '/setup']) {
    assert.equal(
      resolveIsVitrineMode({ hostname: 'baque-do-sol.fr', pathname: internalPath, appMode: 'organizador' }),
      true,
      `Domaine personnalisé doit forcer Vitrine même sur ${internalPath}`
    );
    assert.equal(
      resolveIsVitrineMode({ hostname: 'www.baque-do-sol.fr', pathname: internalPath, appMode: 'organizador' }),
      true,
      `www. domaine personnalisé doit forcer Vitrine même sur ${internalPath}`
    );
    assert.equal(
      resolveIsVitrineMode({ hostname: 'mostrador.o-girador.com', pathname: internalPath, appMode: 'organizador' }),
      true,
      `mostrador.o-girador.com doit forcer Vitrine même sur ${internalPath}`
    );
  }

  assert.equal(sanitizeLockedVitrinePathname('baque-do-sol.fr', '/app'), '/');
  assert.equal(sanitizeLockedVitrinePathname('baque-do-sol.fr', '/dashboard'), '/');
  assert.equal(sanitizeLockedVitrinePathname('mostrador.o-girador.com', '/sambabulles'), '/sambabulles');
  assert.equal(sanitizeLockedVitrinePathname('mostrador.o-girador.com', '/app'), '/');

  assert.equal(extractVitrineSlugFromPath('/sambabulles', 'mostrador.o-girador.com'), 'sambabulles');
  assert.equal(extractVitrineSlugFromPath('/app', 'mostrador.o-girador.com'), null);
  assert.equal(extractVitrineSlugFromPath('/sambabulles', 'baque-do-sol.fr'), null);

  assert.equal(
    buildOrganizadorMemberUrl('BaqueSol', { isLocal: false, isDemo: false }),
    'https://organizador.o-girador.com/?groupe=BaqueSol',
    'Le bouton Espace Membre doit pointer vers https://organizador.o-girador.com/?groupe=${groupId}'
  );
  console.log('  ✅ [PASS] Verrouillage inconditionnel Mostrador & bouton Espace Membre (?groupe=...) validés');
}

// 3. Scoring des fiches associations & injection HTML complète
{
  const skeleton = { combinedLogoUrl: 'https://example.com/seal.png' };
  const complete = { nom: 'Baque do Sol', seoTitle: 'Baque do Sol — Percussions', customDomains: ['baque-do-sol.fr'] };
  assert.ok(scoreAssociationDoc(complete) > scoreAssociationDoc(skeleton));

  const templateHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
  const injected = injectSeoIntoHtml(templateHtml, {
    seoTitle: 'Baque do Sol — Percussions Brésiliennes | Association Culturelle',
    seoDesc: "Depuis 2005, l'association Baque do Sol anime vos événements avec percussions, chants et danses.",
    seoImage: 'https://cdn.baque-do-sol.fr/public_hero.jpg',
    canonicalUrl: 'https://baque-do-sol.fr/',
    siteName: 'Baque do Sol'
  });

  assert.ok(injected.includes('<title>Baque do Sol — Percussions Brésiliennes | Association Culturelle</title>'));
  assert.ok(injected.includes('<meta name="description" content="Depuis 2005, l\'association Baque do Sol anime vos événements avec percussions, chants et danses." />'));
  assert.ok(injected.includes('<link rel="canonical" href="https://baque-do-sol.fr/" />'));
  assert.ok(injected.includes('<meta property="og:title" content="Baque do Sol — Percussions Brésiliennes | Association Culturelle" />'));
  assert.ok(injected.includes('<meta property="og:description" content="Depuis 2005, l\'association Baque do Sol anime vos événements avec percussions, chants et danses." />'));
  assert.ok(injected.includes('<meta property="og:url" content="https://baque-do-sol.fr/" />'));
  assert.ok(injected.includes('<meta property="og:image" content="https://cdn.baque-do-sol.fr/public_hero.jpg" />'));
  assert.ok(injected.includes('<meta property="og:image:type" content="image/jpeg" />'));
  assert.ok(!injected.includes('og:image:width'), 'Les dimensions 512x512 du sceau carré doivent être retirées pour une bannière Hero paysage');
  console.log('  ✅ [PASS] Injection <title>, <meta name="description">, <link rel="canonical"> et OpenGraph dans index.html');
}

// 4. Vérification de la synchronisation client (react-helmet-async), App.jsx et post-build Hosting
{
  const seoHeadSrc = fs.readFileSync(path.resolve('src/components/public/PublicSeoHead.jsx'), 'utf-8');
  assert.ok(seoHeadSrc.includes("from 'react-helmet-async'"), 'PublicSeoHead doit utiliser react-helmet-async');
  assert.ok(seoHeadSrc.includes('<Helmet'), 'PublicSeoHead doit rendre <Helmet>');
  assert.ok(seoHeadSrc.includes('document.title = displayTitle'), 'PublicSeoHead doit synchroniser document.title');
  assert.ok(seoHeadSrc.includes("upsertSingleMetaTag('name', 'description', displayDescription)"), 'PublicSeoHead doit synchroniser meta description sans doublon');
  assert.ok(seoHeadSrc.includes('upsertCanonicalLink(canonicalUrl)'), 'PublicSeoHead doit synchroniser link rel="canonical"');

  const appSrc = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
  assert.ok(appSrc.includes('if (isVitrineMode || (typeof window !== \'undefined\' && isLockedVitrineHost(window.location.hostname)) || !user || !profileData) return;'), 'handleDeepLinkNavigation doit être verrouillé sur les domaines Vitrine');
  assert.ok(!appSrc.includes('Redirection vers l\'Espace Membre...'), 'Aucune redirection automatique vers l\'Espace Membre ne doit subsister sur les domaines Vitrine');

  const postBuildSrc = fs.readFileSync(path.resolve('scripts/post_build_prepare_hosting.mjs'), 'utf-8');
  assert.ok(postBuildSrc.includes('fs.unlinkSync(indexHtmlPath)'), 'post_build_prepare_hosting.mjs doit supprimer dist/index.html');
  assert.ok(postBuildSrc.includes('fs.unlinkSync(staticSitemapPath)'), 'post_build_prepare_hosting.mjs doit déléguer sitemap.xml à serveSitemap');
  console.log('  ✅ [PASS] Synchronisation client (react-helmet-async), gardes App.jsx et post-build Hosting conformes');
}

console.log('\n🎉 TOUS LES CONTRÔLES VITRINE & SEO MULTI-DOMAINES SONT 100 % VALIDÉS !');
