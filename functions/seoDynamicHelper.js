/**
 * Utilitaires serveur d'injection SEO dynamique multi-associations (Mostrador & Organizador).
 * Zéro nom d'association codé en dur : résolution 100 % pilotée par Firestore (`associations`).
 */

const RESERVED_PATH_SEGMENTS = new Set([
  "api", "login", "setup", "app", "vitrine", "mostrador",
  "demo", "agenda", "events", "invite", "rejoindre", "assets", "brandings"
]);

/**
 * Échappe les caractères spéciaux HTML pour une injection sûre dans `<title>` et `content="..."`.
 */
function escapeHtmlMeta(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Nettoie d'éventuelles balises HTML issues d'un texte riche et normalise les espaces.
 */
function stripHtmlTags(str) {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrait l'hôte public réel demandé par le visiteur derrière Firebase Hosting / Cloud Run.
 */
function resolveIncomingHost(req) {
  const candidates = [
    req?.headers?.["x-fh-requested-host"],
    req?.headers?.["x-forwarded-host"],
    req?.hostname,
    req?.headers?.host
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const host = String(candidate).split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
    if (host && !host.endsWith(".a.run.app") && !host.endsWith(".cloudfunctions.net")) {
      return host;
    }
  }
  return String(req?.hostname || "").trim().toLowerCase().replace(/:\d+$/, "");
}

/**
 * Normalise un nom de domaine en retirant le port éventuel et le préfixe `www.`.
 */
function normalizeDomainHost(host) {
  return String(host || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

/**
 * Détermine si le domaine appartient à l'infrastructure interne O Girador / Firebase.
 */
function isInternalPlatformHost(host) {
  const h = normalizeDomainHost(host);
  if (!h || h === "localhost" || h === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(h)) return true;
  if (h === "o-girador.com" || h.endsWith(".o-girador.com")) return true;
  if (h.endsWith(".web.app") || h.endsWith(".firebaseapp.com")) return true;
  if (h.endsWith(".a.run.app") || h.endsWith(".cloudfunctions.net")) return true;
  return false;
}

/**
 * Évalue la complétude métier d'un document `associations/{id}` afin d'écarter tout squelette partiel.
 */
function scoreAssociationDoc(data) {
  if (!data || typeof data !== "object") return 0;
  const hasCoreIdentity = Boolean(data.nom || data.name || data.ownerUid || data.createdAt);
  return (hasCoreIdentity ? 1000 : 0) + Object.keys(data).length;
}

/**
 * Recherche dans Firestore l'association propriétaire d'un domaine personnalisé (`customDomains`).
 */
async function findAssociationByCustomDomain(db, rawHost) {
  const cleanHost = normalizeDomainHost(rawHost);
  if (!cleanHost || isInternalPlatformHost(cleanHost)) return null;

  const variants = Array.from(new Set([cleanHost, `www.${cleanHost}`, rawHost].filter(Boolean)));
  const associationsRef = db.collection("associations");

  const snap = await associationsRef.where("customDomains", "array-contains-any", variants).get();
  if (!snap.empty) {
    const sorted = [...snap.docs].sort((a, b) => scoreAssociationDoc(b.data()) - scoreAssociationDoc(a.data()));
    return sorted[0];
  }

  const singleSnap = await associationsRef.where("customDomain", "in", variants).get();
  if (!singleSnap.empty) {
    const sorted = [...singleSnap.docs].sort((a, b) => scoreAssociationDoc(b.data()) - scoreAssociationDoc(a.data()));
    return sorted[0];
  }

  return null;
}

/**
 * Résout un document `associations/{id}` avec tolérance multi-casse sans race condition.
 */
async function findAssociationByGroupId(db, rawGroupId) {
  const cleanId = String(rawGroupId || "").trim();
  if (!cleanId) return null;

  const lower = cleanId.toLowerCase();
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
  const candidates = Array.from(new Set([cleanId, lower, capitalized])).filter(Boolean);

  const settled = await Promise.allSettled(
    candidates.map((id) => db.collection("associations").doc(id).get())
  );

  const existing = settled
    .filter((r) => r.status === "fulfilled" && r.value && r.value.exists)
    .map((r) => r.value);

  if (existing.length > 0) {
    existing.sort((a, b) => scoreAssociationDoc(b.data()) - scoreAssociationDoc(a.data()));
    return existing[0];
  }

  const allAssocs = await db.collection("associations").get();
  for (const docSnap of allAssocs.docs) {
    const d = docSnap.data() || {};
    if (
      docSnap.id.toLowerCase() === lower ||
      String(d.nom || "").toLowerCase() === lower ||
      String(d.shortName || "").toLowerCase() === lower
    ) {
      return docSnap;
    }
  }
  return null;
}

/**
 * Extrait l'identifiant de groupe depuis les paramètres ou le chemin sur les domaines internes.
 */
function extractInternalGroupId({ cleanHost, urlPath, query }) {
  if (query.groupe || query.tenant || query.group || query.groupId || query.assoc) {
    return String(query.groupe || query.tenant || query.group || query.groupId || query.assoc).trim();
  }
  if ((urlPath.startsWith("/rejoindre/") || urlPath.startsWith("/invite/")) && urlPath.split("/")[2]) {
    return urlPath.split("/")[2].trim();
  }
  if (cleanHost.includes("mostrador")) {
    const pathTenant = urlPath.split("/").filter(Boolean)[0];
    if (pathTenant && !RESERVED_PATH_SEGMENTS.has(pathTenant.toLowerCase())) {
      return pathTenant.toLowerCase();
    }
    const parts = cleanHost.split(".");
    if (parts.length > 3 && parts[0] !== "mostrador" && parts[0] !== "organizador") {
      return parts[0];
    }
  } else if (cleanHost.includes("organizador.o-girador.com")) {
    const parts = cleanHost.split(".");
    if (parts.length > 3 && parts[0] !== "mostrador" && parts[0] !== "organizador") {
      return parts[0];
    }
  }
  return null;
}

/**
 * Injecte dynamiquement `<title>`, `<meta name="description">`, `<link rel="canonical">` et OpenGraph dans le HTML.
 */
function injectSeoIntoHtml(
  htmlContent,
  {
    seoTitle,
    seoDesc,
    seoImage,
    canonicalUrl,
    siteName = "O Girador",
    manifestHref = "",
    appleWebAppTitle = "",
    appleTouchIcon = ""
  }
) {
  const safeTitle = escapeHtmlMeta(seoTitle);
  const safeDesc = escapeHtmlMeta(seoDesc);
  const safeImage = escapeHtmlMeta(seoImage);
  const safeCanonical = escapeHtmlMeta(canonicalUrl);
  const safeSiteName = escapeHtmlMeta(siteName);

  const canonicalTag = `<link rel="canonical" href="${safeCanonical}" />`;
  const isDefaultSquareSeal = /og-girador-frame\.png|combined-logo\.png|logoOG/i.test(seoImage || "");
  const lowerImg = String(seoImage || "").toLowerCase();
  const mimeType = /\.jpe?g(?:\?|$)/.test(lowerImg)
    ? "image/jpeg"
    : (/\.webp(?:\?|$)/.test(lowerImg) ? "image/webp" : "image/png");

  const attrContent = `(?:content=(?:"[^"]*"|'[^']*'))`;
  let updated = htmlContent
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(new RegExp(`<meta\\s+name=(?:"title"|'title')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="title" content="${safeTitle}" />`)
    .replace(new RegExp(`<meta\\s+name=(?:"description"|'description')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="description" content="${safeDesc}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:site_name"|'og:site_name')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:site_name" content="${safeSiteName}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:url"|'og:url')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:url" content="${safeCanonical}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:title"|'og:title')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:title" content="${safeTitle}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:description"|'og:description')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:description" content="${safeDesc}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:image"|'og:image')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:image" content="${safeImage}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:image:secure_url"|'og:image:secure_url')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:image:secure_url" content="${safeImage}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:image:type"|'og:image:type')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:image:type" content="${mimeType}" />`)
    .replace(new RegExp(`<meta\\s+property=(?:"og:image:alt"|'og:image:alt')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta property="og:image:alt" content="${safeTitle}" />`)
    .replace(new RegExp(`<meta\\s+name=(?:"twitter:url"|'twitter:url')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="twitter:url" content="${safeCanonical}" />`)
    .replace(new RegExp(`<meta\\s+name=(?:"twitter:title"|'twitter:title')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(new RegExp(`<meta\\s+name=(?:"twitter:description"|'twitter:description')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="twitter:description" content="${safeDesc}" />`)
    .replace(new RegExp(`<meta\\s+name=(?:"twitter:image"|'twitter:image')\\s+${attrContent}\\s*\\/?>`, "i"), `<meta name="twitter:image" content="${safeImage}" />`);

  if (!isDefaultSquareSeal) {
    updated = updated
      .replace(new RegExp(`\\s*<meta\\s+property=(?:"og:image:width"|'og:image:width')\\s+${attrContent}\\s*\\/?>`, "i"), "")
      .replace(new RegExp(`\\s*<meta\\s+property=(?:"og:image:height"|'og:image:height')\\s+${attrContent}\\s*\\/?>`, "i"), "");
  }

  if (/<link\s+rel=(?:"canonical"|'canonical')[^>]*>/i.test(updated)) {
    updated = updated.replace(/<link\s+rel=(?:"canonical"|'canonical')[^>]*>/i, canonicalTag);
  } else {
    updated = updated.replace(
      new RegExp(`(<meta\\s+name=(?:"description"|'description')\\s+${attrContent}\\s*\\/?>)`, "i"),
      `$1\n    ${canonicalTag}`
    );
  }

  if (appleWebAppTitle) {
    const safeAppleTitle = escapeHtmlMeta(appleWebAppTitle);
    updated = updated.replace(
      new RegExp(`<meta\\s+name=(?:"apple-mobile-web-app-title"|'apple-mobile-web-app-title')\\s+${attrContent}\\s*\\/?>`, "i"),
      `<meta name="apple-mobile-web-app-title" content="${safeAppleTitle}" />`
    );
  }

  if (manifestHref) {
    const safeManifest = escapeHtmlMeta(manifestHref);
    updated = updated.replace(
      /<link\s+[^>]*rel=(?:"manifest"|'manifest')[^>]*>/i,
      `<link id="app-manifest" rel="manifest" href="${safeManifest}" />`
    );
  }

  if (appleTouchIcon) {
    const safeAppleIcon = escapeHtmlMeta(appleTouchIcon);
    updated = updated
      .replace(
        /<link\s+[^>]*rel=(?:"apple-touch-icon"|'apple-touch-icon')[^>]*>/i,
        `<link rel="apple-touch-icon" href="${safeAppleIcon}" />`
      )
      .replace(
        /<link\s+[^>]*id=(?:"favicon"|'favicon')[^>]*>/i,
        `<link id="favicon" rel="icon" type="image/png" sizes="192x192" href="${safeAppleIcon}" />`
      );
  }

  return updated;
}

module.exports = {
  escapeHtmlMeta,
  stripHtmlTags,
  resolveIncomingHost,
  normalizeDomainHost,
  isInternalPlatformHost,
  scoreAssociationDoc,
  findAssociationByCustomDomain,
  findAssociationByGroupId,
  extractInternalGroupId,
  injectSeoIntoHtml
};
