import React, { createContext, useContext } from 'react';
import useTenantResolver from '../hooks/useTenantResolver';

export const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const tenantState = useTenantResolver();

  return (
    <TenantContext.Provider value={tenantState}>
      {children}
    </TenantContext.Provider>
  );
}

const defaultTenantState = {
  appMode: 'organizador',
  groupId: 'Samambaia',
  tenantId: 'samambaia',
  isLocalhost: false,
  isTenantLoading: false,
  tenantError: null,
  error: null,
  notFound: false,
  urls: { mostrador: '', organizador: '' }
};

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    console.warn("useTenantContext appelé hors d'un TenantProvider, repli gracieux par défaut appliqué.");
    return defaultTenantState;
  }
  return context;
}

