import React, { useEffect } from 'react';
import PublicHome from '../PublicHome';
import PublicThemeProvider from '../PublicThemeProvider';
import TenantNotFound from '../TenantNotFound';
import ReloadPrompt from '../ReloadPrompt';
import LoadingSeal from '../common/LoadingSeal';
import DemoTopBanner from '../demo/DemoTopBanner';
import { isDemoMode } from '../../demo/demoManager';
import { DEMO_GROUP_ID } from '../../data/demoData';
import { isCustomDomainHost, getCachedDomainGroupId } from '../../utils/tenantUtils';
import {
  isLockedVitrineHost,
  extractVitrineSlugFromPath,
  buildOrganizadorMemberUrl
} from '../../utils/vitrineLockUtils';

/** Redirection racine `/` dans Organizador vers `/app` ou `/login` (hors domaines Mostrador). */
export function OrganizadorRedirector({ user, navigateToRoute, brandingStyle }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && isLockedVitrineHost(window.location.hostname)) return;
    const target = user ? '/app' : '/login';
    navigateToRoute(target);
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
        window.location.replace(target + window.location.search);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, navigateToRoute]);

  return (
    <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-cordel-bg">
      <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
      <span className="font-bold text-xs uppercase tracking-widest text-cordel-wood mb-4">
        Redirection vers l&apos;application...
      </span>
      <button
        type="button"
        onClick={() => navigateToRoute(user ? '/app' : '/login')}
        className="px-4 py-2 bg-cordel-wood text-white text-xs font-bold uppercase rounded shadow cursor-pointer"
      >
        Accéder à l&apos;application
      </button>
    </div>
  );
}

/** Redirection de la racine institutionnelle O Girador vers le portail principal. */
export function HubRootRedirector({ brandingStyle }) {
  useEffect(() => {
    window.location.href = 'https://www.o-girador.com';
  }, []);

  return (
    <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-cordel-bg">
      <div className="animate-spin text-4xl mb-4 select-none">⏳</div>
      <span className="font-bold text-xs uppercase tracking-widest text-cordel-wood">Redirection vers le portail...</span>
    </div>
  );
}

/** Enveloppe de rendu de la Vitrine publique (Mostrador) et des routes racines publiques. */
export default function VitrineRouteShell({
  appMode, isRootPath, isVitrineMode, isDemoVitrine, currentRoute,
  isTenantLoading, tenantError, urlGroupId,
  user, profileData, permissionsMatrice, userTags, isAdministrativeUser,
  associationData, associationName, branding, brandingStyle, navigateToRoute
}) {
  if (isTenantLoading) {
    return (
      <div style={brandingStyle} className="min-h-screen flex flex-col justify-center items-center py-12 bg-cordel-bg">
        <LoadingSeal associationData={associationData} branding={branding} associationName={associationName} currentGroupId={urlGroupId} size="small" className="mb-3" />
        <div className="animate-spin text-3xl mb-3 select-none">⏳</div>
        <span className="font-bold text-xs uppercase tracking-widest text-cordel-wood">Chargement de la vitrine...</span>
      </div>
    );
  }

  if (tenantError) return <TenantNotFound />;

  const hostname = typeof window !== 'undefined' ? (window.location.hostname || '') : '';
  const lockedVitrine = isLockedVitrineHost(hostname);

  if (!lockedVitrine && appMode === 'orquestrador' && isRootPath) {
    return <HubRootRedirector brandingStyle={brandingStyle} />;
  }
  if (!lockedVitrine && appMode === 'organizador' && isRootPath && !isVitrineMode) {
    return <OrganizadorRedirector user={user} navigateToRoute={navigateToRoute} brandingStyle={brandingStyle} />;
  }

  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const queryTenant = sp ? (sp.get('tenant') || sp.get('groupe') || sp.get('groupId') || sp.get('assoc')) : null;
  const pathGroupId = extractVitrineSlugFromPath(currentRoute, hostname);
  const publicGroupId = isDemoMode()
    ? DEMO_GROUP_ID
    : (isCustomDomainHost(hostname)
      ? (urlGroupId || getCachedDomainGroupId(hostname) || queryTenant || null)
      : (queryTenant || pathGroupId || urlGroupId || null));

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const handleOpenMemberSpace = () => {
    if (isLocal && !isDemoMode()) {
      navigateToRoute(user ? '/app' : '/login');
      return;
    }
    window.location.href = buildOrganizadorMemberUrl(publicGroupId || urlGroupId, { isLocal, isDemo: isDemoMode() });
  };

  return (
    <PublicThemeProvider groupId={publicGroupId}>
      {isDemoMode() && <DemoTopBanner isVitrine={isDemoVitrine} />}
      <PublicHome
        groupId={publicGroupId}
        user={user}
        profileData={profileData}
        permissionsMatrice={permissionsMatrice}
        effectiveUserTags={userTags}
        isAdministrativeUser={isAdministrativeUser}
        associationName={associationName || (isDemoMode() ? 'Maracatu Na Chuva' : '')}
        branding={branding}
        onNavigateToApp={handleOpenMemberSpace}
        onNavigateToLogin={handleOpenMemberSpace}
      />
      <ReloadPrompt />
    </PublicThemeProvider>
  );
}
