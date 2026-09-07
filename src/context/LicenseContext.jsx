import React, { createContext, useContext } from 'react';
import useLicenseGuard from '../hooks/useLicenseGuard';
import { TenantContext } from './TenantContext';
import { useAssociationSettings } from '../hooks/useAssociationSettings';

const LicenseContext = createContext(null);

export function LicenseProvider({ children, groupId: propGroupId, associationSettings: propSettings }) {
  // Récupération sécurisée du contexte Tenant (retourne null si hors TenantProvider, sans jeter d'erreur)
  const tenantCtx = useContext(TenantContext);
  const tenantGroupId = tenantCtx?.groupId || null;

  const effectiveGroupId = propGroupId || tenantGroupId;
  const { settings: fetchedSettings } = useAssociationSettings(effectiveGroupId);
  const effectiveSettings = propSettings || fetchedSettings;
  const licenseInfo = useLicenseGuard(effectiveSettings);

  return (
    <LicenseContext.Provider value={licenseInfo}>
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicenseContext() {
  const context = useContext(LicenseContext);
  if (context === null) {
    return {
      isReadOnly: false,
      status: 'exempt',
      plan: 'exempt',
      isTrial: false,
      message: null
    };
  }
  return context;
}

