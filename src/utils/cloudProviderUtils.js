/**
 * Utilitaires de détection des fournisseurs Cloud (Organizador).
 * Permet de n'activer la galerie native que pour une vraie instance
 * Framaspace / Nextcloud et d'ouvrir proprement tout autre Cloud (Drive, Dropbox, kDrive…).
 */

// Domaines de Clouds externes qui ne sont jamais une instance Nextcloud / Framaspace
const EXTERNAL_CLOUD_DOMAINS = [
  'drive.google.com',
  'docs.google.com',
  'dropbox.com',
  '1drv.ms',
  'onedrive.live.com',
  'kdrive.infomaniak.com'
];

// Domaines Framaspace reconnus d'office
const FRAMASPACE_DOMAINS = ['frama.space', 'framaspace.org'];

const matchesDomain = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);

/**
 * Extrait le nom d'hôte normalisé d'une URL (chaîne vide si invalide).
 * @param {string} url
 * @returns {string}
 */
const getHostname = (url) => {
  try {
    return new URL(String(url || '').trim()).hostname.toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Indique si l'URL pointe vers un Cloud externe connu (Drive, Dropbox, OneDrive, kDrive).
 * @param {string} url
 * @returns {boolean}
 */
export const isExternalCloudUrl = (url) => {
  const host = getHostname(url);
  if (!host) return false;
  return EXTERNAL_CLOUD_DOMAINS.some((d) => matchesDomain(host, d)) || host.includes('onedrive');
};

/**
 * Indique si l'URL est un lien de partage Framaspace / Nextcloud (`/s/TOKEN`) dont
 * l'hôte est reconnu : frama.space, framaspace.org ou l'hôte exact du cloudRootUrl
 * de l'association (sauf s'il s'agit d'un Cloud externe connu).
 * @param {string} url - Lien d'album ou de dépôt
 * @param {string} [cloudRootUrl] - Dossier Cloud racine de l'association
 * @returns {boolean}
 */
export const isFramaspaceAlbumUrl = (url, cloudRootUrl = '') => {
  const host = getHostname(url);
  if (!host || isExternalCloudUrl(url)) return false;

  let parsedPath = '';
  try {
    parsedPath = new URL(String(url).trim()).pathname;
  } catch {
    return false;
  }
  if (!/\/s\/[a-zA-Z0-9_-]+/i.test(parsedPath)) return false;

  if (FRAMASPACE_DOMAINS.some((d) => matchesDomain(host, d))) return true;

  const rootHost = getHostname(cloudRootUrl);
  return Boolean(rootHost) && !isExternalCloudUrl(cloudRootUrl) && rootHost === host;
};

/**
 * Détermine si une association a configuré Framaspace (provisionnement automatique disponible).
 * @param {Object} [assoc] - Données de l'association (`hasFramaspaceApi`, `cloudRootUrl`, `framaspaceUrl`)
 * @returns {boolean}
 */
export const hasFramaspaceSetup = (assoc) => {
  if (!assoc) return false;
  if (assoc.hasFramaspaceApi === true) return true;
  const root = assoc.cloudRootUrl || assoc.framaspaceUrl || '';
  const host = getHostname(root);
  return Boolean(host) && FRAMASPACE_DOMAINS.some((d) => matchesDomain(host, d));
};
