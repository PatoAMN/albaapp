import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Organization, User } from '../types';

// Función helper para convertir timestamps de Firestore de forma segura
const safeTimestamp = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (timestamp && typeof timestamp === 'string') {
    return new Date(timestamp);
  } else if (timestamp && typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
};

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  isLoading: boolean;
  error: string | null;
  setCurrentOrganization: (org: Organization | null) => void;
  loadUserOrganizations: (userId: string) => Promise<void>;
  createOrganization: (orgData: Partial<Organization>) => Promise<string>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
  getOrganizationById: (orgId: string) => Promise<Organization | null>;
  getOrganizationMembers: (orgId: string) => Promise<User[]>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserOrganizations = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔄 loadUserOrganizations llamado para usuario:', userId);
    
    try {
      // Primero obtener el usuario para ver a qué organizaciones pertenece
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data();
      const userType = userData.userType;
      let orgIds: string[] = [];
      
      console.log('👤 Datos del usuario:', { userType, organizationId: userData.organizationId });

      if (userType === 'super_admin') {
        // Super admin puede ver todas las organizaciones
        const orgsQuery = query(collection(db, 'organizations'));
        const orgsSnapshot = await getDocs(orgsQuery);
        orgIds = orgsSnapshot.docs.map(doc => doc.id);
        console.log('👑 Super admin - organizaciones encontradas:', orgIds);
      } else if (userType === 'admin') {
        // Admin puede ver organizaciones que maneja
        orgIds = userData.managedOrganizations || [userData.organizationId];
        console.log('👨‍💼 Admin - organizaciones a manejar:', orgIds);
      } else {
        // Miembros y guardias solo ven su organización
        orgIds = [userData.organizationId];
        console.log('👤 Miembro/Guardia - organización asignada:', orgIds);
      }

      // Cargar las organizaciones
      const organizations: Organization[] = [];
      console.log('📥 Cargando organizaciones...');
      
      for (const orgId of orgIds) {
        console.log('🔍 Cargando organización:', orgId);
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          

          
          const org = {
            id: orgDoc.id,
            ...orgData,
            createdAt: safeTimestamp(orgData.createdAt),
            updatedAt: safeTimestamp(orgData.updatedAt),
          } as Organization;
          
          console.log('✅ Organización cargada:', org.name, 'Tipo:', org.communityType);
          organizations.push(org);
        } else {
          console.log('❌ Organización no encontrada:', orgId);
        }
      }

      setUserOrganizations(organizations);
      
      // Si solo hay una organización, establecerla como actual
      if (organizations.length === 1) {
        console.log('🏢 Estableciendo organización actual:', organizations[0].name, 'Tipo:', organizations[0].communityType);
        setCurrentOrganization(organizations[0]);
      } else if (organizations.length > 1) {
        console.log('🏢 Múltiples organizaciones encontradas, usando la primera');
        setCurrentOrganization(organizations[0]);
      } else {
        console.log('⚠️ No se encontraron organizaciones');
        setCurrentOrganization(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar organizaciones');
      console.error('Error loading organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createOrganization = async (orgData: Partial<Organization>): Promise<string> => {
    try {
      // Esta función se implementará cuando creemos el backend
      // Por ahora retornamos un ID mock
      const newOrgId = `org_${Date.now()}`;
      console.log('Creating organization:', { ...orgData, id: newOrgId });
      return newOrgId;
    } catch (err) {
      throw new Error('Error al crear organización');
    }
  };

  const updateOrganization = async (orgId: string, updates: Partial<Organization>): Promise<void> => {
    try {
      // Esta función se implementará cuando creemos el backend
      console.log('Updating organization:', orgId, updates);
    } catch (err) {
      throw new Error('Error al actualizar organización');
    }
  };

  const deleteOrganization = async (orgId: string): Promise<void> => {
    try {
      // Esta función se implementará cuando creemos el backend
      console.log('Deleting organization:', orgId);
    } catch (err) {
      throw new Error('Error al eliminar organización');
    }
  };

  const getOrganizationById = async (orgId: string): Promise<Organization | null> => {
    try {
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        

        
        return {
          id: orgDoc.id,
          ...orgData,
          createdAt: safeTimestamp(orgData.createdAt),
          updatedAt: safeTimestamp(orgData.updatedAt),
        } as Organization;
      }
      return null;
    } catch (err) {
      console.error('Error getting organization:', err);
      return null;
    }
  };

  const getOrganizationMembers = async (orgId: string): Promise<User[]> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', orgId),
        where('isActive', '==', true)
      );
      const usersSnapshot = await getDocs(usersQuery);
      

      
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: safeTimestamp(doc.data().createdAt),
      } as User));
    } catch (err) {
      console.error('Error getting organization members:', err);
      return [];
    }
  };

  const value: OrganizationContextType = {
    currentOrganization,
    userOrganizations,
    isLoading,
    error,
    setCurrentOrganization,
    loadUserOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationById,
    getOrganizationMembers,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
