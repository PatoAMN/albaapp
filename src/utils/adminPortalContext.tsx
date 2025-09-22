import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AdminPortal, AdminPortalContextType } from '../types/simple';

const AdminPortalContext = createContext<AdminPortalContextType | undefined>(undefined);

interface AdminPortalProviderProps {
  children: ReactNode;
}

export const AdminPortalProvider: React.FC<AdminPortalProviderProps> = ({ children }) => {
  const [currentPortal, setCurrentPortal] = useState<AdminPortal>('member');

  const switchPortal = (portal: AdminPortal) => {
    console.log('🔄 [ADMIN] Cambiando portal de', currentPortal, 'a', portal);
    setCurrentPortal(portal);
  };

  const value: AdminPortalContextType = {
    currentPortal,
    switchPortal,
  };

  return (
    <AdminPortalContext.Provider value={value}>
      {children}
    </AdminPortalContext.Provider>
  );
};

export const useAdminPortal = (): AdminPortalContextType => {
  const context = useContext(AdminPortalContext);
  if (context === undefined) {
    throw new Error('useAdminPortal debe ser usado dentro de AdminPortalProvider');
  }
  return context;
};
