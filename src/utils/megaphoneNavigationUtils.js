/**
 * Utilitaires centralisés de navigation interne et de Deep Linking pour le Mégaphone (WidgetAnnonces),
 * la cloche de notifications internes (NotificationCenter) et le routeur React (App.jsx).
 */

export const CUSTOM_EXTERNAL_LINK_VALUE = '__custom_external__';

/**
 * Liste officielle des destinations internes proposées dans le formulaire Admin du Mégaphone.
 */
export const MEGAPHONE_INTERNAL_DESTINATIONS = [
  { value: '/profil', label: '👤 Mon Profil', poleId: 'mon-espace', tabId: 'profil' },
  { value: '/agenda', label: '📅 Agenda', poleId: 'mon-espace', tabId: 'agenda' },
  { value: '/forum', label: '🗣️ Porte-Voix / Forum', poleId: 'mon-espace', tabId: 'forum' },
  { value: '/varal', label: '📜 Varal / Documents', poleId: 'mon-espace', tabId: 'varal' },
  { value: '/trombinoscope', label: '👥 Trombinoscope', poleId: 'mon-espace', tabId: 'trombinoscope' },
  { value: '/mon-parcours', label: '🎓 Mon Parcours', poleId: 'mon-espace', tabId: 'mon-parcours' },
  { value: '/materiel', label: '🥁 Matériel / Instruments', poleId: 'mon-espace', tabId: 'materiel' },
  { value: '/vestiaire', label: '👗 Vestiaire', poleId: 'mon-espace', tabId: 'vestiaire' },
  { value: '/treasury', label: '💰 Trésorerie / Cotisations', poleId: 'tresorerie', tabId: 'dashboard-finance' }
];

/**
 * Préfixes de routes internes d'Organizad'Or (ne doivent jamais être confondus avec une vitrine publique).
 */
export const INTERNAL_APP_ROUTE_PREFIXES = [
  '/events', '/agenda', '/forum', '/porte-voix', '/threads', '/profil', '/profile',
  '/treasury', '/tresorerie', '/frais-km', '/diffusion', '/mestre', '/logistique', '/logistics',
  '/mon-vestiaire', '/vestiaire', '/materiel', '/mon-parcours', '/newsletter', '/varal', '/trombinoscope',
  '/adhesions', '/cotisations', '/repertoire', '/pedagogie', '/inventaire',
  '/orders', '/commandes', '/documents', '/reunions', '/studio'
];

const TREASURY_TABS = ['frais-km', 'cotisations', 'commandes', 'events-finances', 'operations-diverses', 'reports-exports', 'dashboard-finance'];

/**
 * Vérifie si un lien d'action correspond à une URL externe (http:// ou https://).
 */
export function isExternalActionLink(link) {
  return typeof link === 'string' && /^https?:\/\//i.test(link.trim());
}

/**
 * Extrait la cible effective depuis une URL ou un chemin (supporte `/profil`, `/app/profil` et `/app?target=/profil`).
 */
export function extractDeepLinkTarget(rawUrlOrPath) {
  if (!rawUrlOrPath || typeof rawUrlOrPath !== 'string') {
    return { pathname: '', searchParams: new URLSearchParams(), targetFromQuery: null };
  }
  const trimmed = rawUrlOrPath.trim();
  const qIdx = trimmed.indexOf('?');
  let pathname = qIdx >= 0 ? trimmed.slice(0, qIdx) : trimmed;
  const searchParams = new URLSearchParams(qIdx >= 0 ? trimmed.slice(qIdx + 1) : '');
  const targetFromQuery =
    searchParams.get('target') || searchParams.get('redirect') || searchParams.get('url') || searchParams.get('destination') || null;

  if (targetFromQuery && !isExternalActionLink(targetFromQuery)) {
    const cleanTarget = targetFromQuery.trim();
    const nestedIdx = cleanTarget.indexOf('?');
    if (nestedIdx >= 0) {
      new URLSearchParams(cleanTarget.slice(nestedIdx + 1)).forEach((val, key) => {
        if (!searchParams.has(key)) searchParams.set(key, val);
      });
      pathname = cleanTarget.slice(0, nestedIdx);
    } else {
      pathname = cleanTarget;
    }
  }
  return { pathname, searchParams, targetFromQuery };
}

/**
 * Table de correspondance unifiée des destinations internes (Mégaphone, Cloche NotificationCenter et Deep Linking)
 * vers les identifiants réels de Pôles, d'Onglets et de paramètres contextuels React d'Organizad'Or.
 */
export function resolveInternalDestination(rawInput, { hasAccessTresorerie = true } = {}) {
  if (!rawInput || typeof rawInput !== 'string' || isExternalActionLink(rawInput)) return null;

  const { pathname, searchParams } = extractDeepLinkTarget(rawInput);
  const normalized = pathname.replace(/^\/app(?=\/|$)/i, '').replace(/^\/+/, '').replace(/\/+$/, '');
  const baseSegment = (normalized.toLowerCase().split('/')[0] || '');
  const tabParam = searchParams.get('tab');
  const poleParam = (searchParams.get('pole') || '').toLowerCase();

  // 1. Détection directe d'événement (/events/:id, /agenda?eventId=..., /app?eventId=...)
  const eventMatch = normalized.match(/^events\/([^/?#]+)/i);
  const eventId = searchParams.get('eventId') || (eventMatch ? eventMatch[1] : null);
  if (eventId || baseSegment === 'agenda' || baseSegment === 'events') {
    const focusComments = searchParams.get('focus') === 'comments' || tabParam === 'discussion';
    const eventTab = focusComments ? 'discussion' : (tabParam || null);
    return { poleId: 'mon-espace', tabId: 'agenda', viewName: 'agenda', eventId, eventTab, focusComments, searchParams };
  }

  // 2. Détection directe de discussion / forum (/forum, /porte-voix, /threads/:id, ?threadId=..., ?conversationId=...)
  const threadMatch = normalized.match(/^(?:threads|forum)\/([^/?#]+)/i);
  const threadId = searchParams.get('threadId') || (threadMatch ? threadMatch[1] : null);
  if (threadId || ['forum', 'porte-voix', 'threads'].includes(baseSegment)) {
    const conversationId = searchParams.get('conversationId') || null;
    const chatUserId = searchParams.get('chatUserId') || null;
    const forumInitialTab = threadId ? 'discussions' : (tabParam === 'direct' ? 'inbox' : (tabParam || null));
    return { poleId: 'mon-espace', tabId: 'forum', viewName: 'forum', threadId, forumInitialTab, conversationId, chatUserId, searchParams };
  }

  // 3. Destinations par segment ou paramètre explicite ?pole=...
  switch (baseSegment || poleParam) {
    case 'profil':
    case 'profile':
      return { poleId: 'mon-espace', tabId: 'profil', viewName: 'profil', scrollToId: tabParam === 'frais' ? 'member-expense-section' : null, searchParams };
    case 'varal':
    case 'documents':
      return { poleId: 'mon-espace', tabId: 'varal', viewName: 'varal', searchParams };
    case 'trombinoscope':
      return { poleId: 'mon-espace', tabId: 'trombinoscope', viewName: 'trombinoscope', searchParams };
    case 'mon-parcours':
    case 'parcours':
      return { poleId: 'mon-espace', tabId: 'mon-parcours', viewName: 'mon-parcours', searchParams };
    case 'materiel':
      return { poleId: 'mon-espace', tabId: 'materiel', viewName: 'materiel', searchParams };
    case 'vestiaire':
    case 'mon-vestiaire':
      return { poleId: 'mon-espace', tabId: 'vestiaire', viewName: 'vestiaire', searchParams };
    case 'frais-km':
      return hasAccessTresorerie
        ? { poleId: 'tresorerie', tabId: 'frais-km', viewName: 'kilometric-reimbursement', searchParams }
        : { poleId: 'mon-espace', tabId: 'profil', viewName: 'profil', scrollToId: 'member-expense-section', searchParams };
    case 'treasury':
    case 'tresorerie':
    case 'cotisations':
    case 'cotisation':
    case 'adhesions':
      return hasAccessTresorerie
        ? { poleId: 'tresorerie', tabId: TREASURY_TABS.includes(tabParam) ? tabParam : 'dashboard-finance', viewName: 'treasury', searchParams }
        : { poleId: 'mon-espace', tabId: 'cotisation', viewName: 'cotisation', searchParams };
    case 'mestre': {
      const mTab = (tabParam === 'casting' || tabParam === 'orientation' || tabParam === 'mestre-orientation')
        ? 'mestre-orientation'
        : (tabParam ? (tabParam.startsWith('mestre-') ? tabParam : `mestre-${tabParam}`) : 'mestre-repertoire');
      return { poleId: 'mestre', tabId: mTab, viewName: mTab, searchParams };
    }
    case 'logistics':
    case 'logistique':
    case 'inventaire':
    case 'inventory': {
      const lTab = (!tabParam || ['inventaire', 'inventory', 'instruments'].includes(tabParam))
        ? 'inventory'
        : (['commandes', 'orders'].includes(tabParam) ? 'orders' : tabParam);
      return { poleId: 'logistique', tabId: lTab, viewName: lTab, searchParams };
    }
    case 'diffusion': {
      const dTab = ['contacts', 'diffusion-contacts'].includes(tabParam) ? 'diffusion-contacts' : 'gigs-pipeline';
      return { poleId: 'diffusion', tabId: dTab, viewName: dTab, searchParams };
    }
    default:
      return null;
  }
}

/**
 * Exécute la navigation lors du clic sur un bouton d'action (CTA) du Mégaphone ou d'une alerte interne.
 */
export function triggerMegaphoneCtaNavigation(
  actionLink,
  { onNotificationNavigate = null, onNavigateToView = null, onNavigateToPole = null, hasAccessTresorerie = true } = {},
  event = null
) {
  if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
  const trimmed = typeof actionLink === 'string' ? actionLink.trim() : '';
  if (!trimmed) return false;

  if (isExternalActionLink(trimmed)) {
    if (typeof window !== 'undefined') window.open(trimmed, '_blank', 'noopener,noreferrer');
    return true;
  }

  const resolved = resolveInternalDestination(trimmed, { hasAccessTresorerie });
  if (typeof onNotificationNavigate === 'function') {
    onNotificationNavigate(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
    return true;
  }
  if (typeof onNavigateToView === 'function') {
    onNavigateToView(resolved ? resolved.viewName : trimmed.replace(/^\/+/, ''));
    return true;
  }
  if (resolved && typeof onNavigateToPole === 'function') {
    onNavigateToPole(resolved.poleId, resolved.tabId);
    return true;
  }
  return false;
}
