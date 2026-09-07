import React, { createContext, useContext } from 'react';
import useLicenseGuard from '../hooks/useLicenseGuard';
import { useTenantContext } from './TenantContext';
import { useAssociationSettings } from '../hooks/useAssociationSettings';

const LicenseContext = createContext(null);

export function LicenseProvider({ children, groupId: propGroupId, associationSettings: propSettings }) {
  let tenantGroupId = null;
  try {
    const tenantCtx = useTenantContext();
    tenantGroupId = tenantCtx?.groupId;
  } catch (_) {
    // Cas où LicenseProvider est utilisé hors TenantProvider
  }

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

