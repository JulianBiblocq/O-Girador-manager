/**
 * Générateur serveur du Web App Manifest PWA dynamique multi-associations (Organizador & Mostrador).
 * Zéro nom d'association codé en dur : résolution 100 % pilotée par Firestore (`associations/{groupId}`).
 */

const SHARE_TARGET_CONFIG = {
  action: "/app?share-target=1",
  method: "POST",
  enctype: "multipart/form-data",
  params: {
    title: "title",
    text: "text",
    url: "url",
    files: [
      {
        name: "media",
        accept: ["image/*", "application/pdf"]
      }
    ]
  }
};

/**
 * Normalise une URL d'icône (relative ou absolue) vers une URL HTTPS complète sur l'hôte courant.
 */
function toAbsoluteIconUrl(rawUrl, origin) {
  const trimmed = String(rawUrl || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * Déduit le type MIME de l'icône (image/png par défaut pour compatibilité WebAPK Android).
 */
function detectIconMimeType(url) {
  const lower = String(url || "").toLowerCase();
  if (/\.svg(?:\?|$)/.test(lower)) return "image/svg+xml";
  if (/\.webp(?:\?|$)/.test(lower)) return "image/webp";
  if (/\.jpe?g(?:\?|$)/.test(lower)) return "image/jpeg";
  return "image/png";
}

/**
 * Déduit l'URL du sceau combiné `maskable` (carré 100 % opaque `#8B2A1A`) d'une association :
 * 1. Champ explicite `branding.combinedLogoMaskableUrl` (ou `combinedLogoMaskableUrl`).
 * 2. Dérivation sûre si `combinedLogoUrl` pointe vers un asset CDN `/brandings/logoOG<Groupe>.png`.
 */
function resolveAssociationMaskableSealUrl(data, combinedLogoUrl, origin) {
  const explicitRaw = data
    ? String(data.branding?.combinedLogoMaskableUrl || data.combinedLogoMaskableUrl || "").trim()
    : "";
  if (explicitRaw) {
    return toAbsoluteIconUrl(explicitRaw, origin);
  }
  if (combinedLogoUrl && /\/brandings\/logoOG[A-Za-z0-9_-]+\.png(?:\?|$)/.test(combinedLogoUrl) && !combinedLogoUrl.includes("-maskable.png")) {
    return combinedLogoUrl.replace(/\.png(\?.*)?$/i, "-maskable.png$1");
  }
  return "";
}

/**
 * Construit le JSON du manifest PWA selon la cible (Organizador par défaut, ou Mostrador dédié).
 * Sur Organizador, sépare strictement `"purpose": "any"` (médaillon détouré) et `"purpose": "maskable"` (carré `#8B2A1A`).
 */
function buildDynamicManifestPayload({
  effectiveHost = "organizador.o-girador.com",
  isDedicatedMostrador = false,
  isCustomDomain = false,
  groupId = "",
  assocData = null
} = {}) {
  const origin = `https://${effectiveHost || "organizador.o-girador.com"}`;
  const cleanGroupId = String(groupId || "").trim();
  const data = assocData && typeof assocData === "object" ? assocData : null;

  const groupName = data
    ? String(data.nom || data.name || data.branding?.name || "").trim()
    : "";

  const rawCombinedLogo = data
    ? String(data.branding?.combinedLogoUrl || data.combinedLogoUrl || "").trim()
    : "";
  const combinedLogoUrl = toAbsoluteIconUrl(rawCombinedLogo, origin);
  const combinedLogoMaskableUrl = resolveAssociationMaskableSealUrl(data, combinedLogoUrl, origin);

  const rawPureLogo = data
    ? String(data.branding?.logoUrl || data.logoUrl || "").trim()
    : "";
  const pureLogoUrl = toAbsoluteIconUrl(rawPureLogo, origin);

  if (isDedicatedMostrador) {
    const vitrineIcon = pureLogoUrl || combinedLogoUrl || `${origin}/ecosystem/mostrador.png`;
    const vitrineMime = detectIconMimeType(vitrineIcon);
    const vitrineStartUrl = (!isCustomDomain && cleanGroupId)
      ? `/${encodeURIComponent(cleanGroupId)}`
      : "/";
    return {
      id: vitrineStartUrl,
      name: groupName || "Mostrador",
      short_name: groupName ? groupName.slice(0, 12) : "Mostrador",
      description: data?.description || "Portail public et actualités de l'association",
      start_url: vitrineStartUrl,
      scope: "/",
      display: "standalone",
      orientation: "any",
      background_color: "#F4ECD8",
      theme_color: "#8B2A1A",
      prefer_related_applications: false,
      icons: [
        { src: vitrineIcon, sizes: "192x192", type: vitrineMime, purpose: "any" },
        { src: vitrineIcon, sizes: "512x512", type: vitrineMime, purpose: "any" }
      ]
    };
  }

  // Cible Organizador : short_name TOUJOURS "Organizador", name "Organizador — ${groupName}" (ou "Organizador")
  const startUrl = cleanGroupId ? `/?groupe=${encodeURIComponent(cleanGroupId)}` : "/";
  const manifestName = groupName ? `Organizador — ${groupName}` : "Organizador";

  const anyIcon192 = combinedLogoUrl || `${origin}/icon-192-v2.png`;
  const anyIcon512 = combinedLogoUrl || `${origin}/icon-512-v2.png`;
  const maskableIcon192 = combinedLogoMaskableUrl || `${origin}/icon-192-maskable-v2.png`;
  const maskableIcon512 = combinedLogoMaskableUrl || `${origin}/icon-512-maskable-v2.png`;

  // Jamais de cumul "any maskable" sur une même entrée : entrées strictement séparées pour WebAPK Android
  const monochromeIcon = `${origin}/icons/badge-alfaia-mono.png`;
  const icons = [
    { src: anyIcon192, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: anyIcon512, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: maskableIcon192, sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: maskableIcon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: monochromeIcon, sizes: "96x96", type: "image/png", purpose: "monochrome" }
  ];

  return {
    id: startUrl,
    name: manifestName,
    short_name: "Organizador",
    description: groupName
      ? `Espace associatif ${groupName} sur Organizador`
      : "Application de gestion associative et musicale Organizador",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay"],
    orientation: "any",
    background_color: "#F4ECD8",
    theme_color: "#8B2A1A",
    prefer_related_applications: false,
    categories: ["music", "management", "productivity"],
    icons,
    share_target: SHARE_TARGET_CONFIG
  };
}

module.exports = {
  buildDynamicManifestPayload,
  resolveAssociationMaskableSealUrl,
  toAbsoluteIconUrl,
  detectIconMimeType
};
