import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { isCustomDomainHost } from '../../utils/tenantUtils';

/**
 * Synchronise une balise `<meta>` unique dans `document.head` sans interférer avec `data-rh` (`react-helmet-async`).
 */
function upsertSingleMetaTag(attrKey, attrVal, content) {
  if (typeof document === 'undefined' || content === undefined || content === null) return;
  const selector = `meta[${attrKey}="${attrVal}"]`;
  const helmetManaged = document.head.querySelector(`${selector}[data-rh="true"]`);
  if (helmetManaged) {
    document.head.querySelectorAll(`${selector}:not([data-rh])`).forEach((el) => el.remove());
    return;
  }
  const existing = Array.from(document.head.querySelectorAll(selector));
  if (existing.length === 0) {
    const meta = document.createElement('meta');
    meta.setAttribute(attrKey, attrVal);
    meta.setAttribute('content', String(content));
    document.head.appendChild(meta);
    return;
  }
  existing[0].setAttribute('content', String(content));
  existing.slice(1).forEach((el) => el.remove());
}

/**
 * Synchronise la balise `<link rel="canonical">` unique dans `document.head`.
 */
function upsertCanonicalLink(href) {
  if (typeof document === 'undefined' || !href) return;
  const helmetManaged = document.head.querySelector('link[rel="canonical"][data-rh="true"]');
  if (helmetManaged) {
    document.head.querySelectorAll('link[rel="canonical"]:not([data-rh])').forEach((el) => el.remove());
    return;
  }
  const existing = Array.from(document.head.querySelectorAll('link[rel="canonical"]'));
  if (existing.length === 0) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', href);
    document.head.appendChild(link);
    return;
  }
  existing[0].setAttribute('href', href);
  existing.slice(1).forEach((el) => el.remove());
}

/**
 * Calcule l'URL canonique publique alignée sur `serveDynamicApp` (sans `www.` sur domaine dédié).
 */
function resolveClientCanonicalUrl() {
  if (typeof window === 'undefined') return '';
  const rawHost = (window.location.hostname || '').trim().toLowerCase();
  if (!rawHost) return '';
  const cleanHost = rawHost.replace(/^www\./, '');
  const path = window.location.pathname || '/';
  if (isCustomDomainHost(cleanHost)) {
    const normPath = (!path || path === '/' || path === '/vitrine' || path === '/mostrador') ? '/' : path;
    return `https://${cleanHost}${normPath}`;
  }
  return `${window.location.protocol}//${rawHost}${path}`;
}

/**
 * Synchronisation SEO côté client (`react-helmet-async` + dédoublonnage `<head>`) pour la Vitrine (Mostrador).
 */
export default function PublicSeoHead({ publicTheme = {}, associationName = '', branding = {} }) {
  const cleanName = (associationName || publicTheme?.associationName || '').trim();
  const displayTitle = publicTheme?.seoTitle?.trim() || (cleanName ? `${cleanName} | Site Officiel` : 'O Girador');
  const displayDescription = publicTheme?.seoDescription?.trim()
    || publicTheme?.publicCatchphrase?.trim()
    || (cleanName
      ? `Découvrez ${cleanName} : actualités, prochaines dates, prestations et vie associative.`
      : 'Découvrez notre association sur O Girador, la plateforme dédiée aux groupes de percussions brésiliennes.');

  const userKeywords = publicTheme?.seoKeywords ? publicTheme.seoKeywords.trim() : '';
  const forcedSaasKeywords = 'O Girador, application de gestion associative, séquenceur musical, site vitrine, percussions brésiliennes, maracatu';
  const finalKeywords = userKeywords ? `${userKeywords}, ${forcedSaasKeywords}` : forcedSaasKeywords;
  const ogImage = publicTheme?.publicHeroImage || branding?.logoUrl || publicTheme?.logoUrl || branding?.combinedLogoUrl || '/og-girador-frame.png';
  const faviconUrl = branding?.logoUrl || publicTheme?.logoUrl || publicTheme?.branding?.logoUrl || '';
  const canonicalUrl = resolveClientCanonicalUrl();
  const siteName = cleanName || 'O Girador';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = displayTitle;
    upsertSingleMetaTag('name', 'title', displayTitle);
    upsertSingleMetaTag('name', 'description', displayDescription);
    upsertSingleMetaTag('property', 'og:site_name', siteName);
    upsertSingleMetaTag('property', 'og:title', displayTitle);
    upsertSingleMetaTag('property', 'og:description', displayDescription);
    upsertSingleMetaTag('property', 'og:image', ogImage);
    upsertSingleMetaTag('name', 'twitter:title', displayTitle);
    upsertSingleMetaTag('name', 'twitter:description', displayDescription);
    upsertSingleMetaTag('name', 'twitter:image', ogImage);
    if (canonicalUrl) {
      upsertCanonicalLink(canonicalUrl);
      upsertSingleMetaTag('property', 'og:url', canonicalUrl);
      upsertSingleMetaTag('name', 'twitter:url', canonicalUrl);
    }
    if (faviconUrl) {
      const fav = document.getElementById('favicon') || document.querySelector('link[rel="icon"]');
      if (fav) fav.setAttribute('href', faviconUrl);
      const apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (apple) apple.setAttribute('href', faviconUrl);
    }
  }, [displayTitle, displayDescription, ogImage, faviconUrl, siteName, canonicalUrl]);

  return (
    <Helmet prioritizeSeoTags>
      <title>{displayTitle}</title>
      <meta name="title" content={displayTitle} />
      <meta name="description" content={displayDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="generator" content="O Girador" />
      <meta name="author" content="O Girador" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:alt" content={displayTitle} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={displayTitle} />
      <meta name="twitter:description" content={displayDescription} />
      <meta name="twitter:image" content={ogImage} />
      {canonicalUrl && <meta name="twitter:url" content={canonicalUrl} />}
    </Helmet>
  );
}
