import React, { createContext, useContext } from 'react';
import useTenantResolver from '../hooks/useTenantResolver';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const tenantState = useTenantResolver();

  return (
    <TenantContext.Provider value={tenantState}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext doit être utilisé à l\'intérieur d\'un TenantProvider');
  }
  return context;
}
