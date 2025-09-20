import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  loginUser,
  createUser,
  logoutUser,
  getCurrentUser,
  onAuthStateChange,
  getOrganizationByCommunityCode,
  getOrganizationById
} from './firebase';
import { Organization, LoginCredentials, User } from '../types';
import { useOrganization } from './organizationContext';
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  organization: Organization | null;
  switchOrganization: (orgId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  const { setCurrentOrganization } = useOrganization();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // No buscar automáticamente en todas las organizaciones
        // Solo permitir acceso a través del login con organización específica
        console.log('🔐 Usuario autenticado en Firebase, esperando login con organización');
        setUser(null);
      } else {
        setUser(null);
        setOrganization(null);
        setCurrentOrganization(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentOrganization]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);
      
      // Login with Firebase
      const firebaseUser = await loginUser(credentials.email, credentials.password);
      
      if (firebaseUser) {
        try {
          // Search for user by firebaseUid field
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('firebaseUid', '==', firebaseUser.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            
            // La organización se detecta automáticamente del usuario
            const userOrganizationId = userData.organizationId;
            
            if (!userOrganizationId) {
              throw new Error('Usuario no tiene una organización asignada. Contacta al administrador.');
            }
            
            const newUser: User = {
              id: userDoc.id,
              email: userData.email || firebaseUser.email || '',
              name: userData.name || 'Usuario',
              userType: userData.role || 'member',
              phone: userData.phone || '',
              homeAddress: userData.homeAddress || '',
              birthDate: userData.birthDate || '',
              homeNumber: userData.homeNumber || '',
              parkingSpot: userData.parkingSpot || '',
              buildingInfo: userData.buildingInfo || { tower: '', apartment: '' },
              residenceType: userData.residenceType || 'casa',
              vehicleInfo: userData.vehicleInfo || { plate: '', model: '', color: '' },
              emergencyContacts: userData.emergencyContacts || [],
              createdAt: userData.createdAt || new Date(),
              organizationId: userOrganizationId,
              isActive: userData.isActive || true
            };
            
            setUser(newUser);
            console.log('✅ Usuario logueado:', newUser.userType);
            console.log('🏘️ Organización detectada automáticamente:', newUser.organizationId);
            
            // Load organization automatically
            const org = await getOrganizationById(userOrganizationId);
            if (org) {
              // Type assertion para compatibilidad temporal
              const organizationData = org as unknown as Organization;
              setOrganization(organizationData);
              setCurrentOrganization(organizationData);
            } else {
              throw new Error('No se pudo cargar la información de la organización');
            }
          } else {
            console.log('❌ Usuario no encontrado en la colección users');
            throw new Error('Usuario no encontrado. Debe ser creado desde el portal web primero.');
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          throw new Error('Error al obtener datos del usuario');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Error en el login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setOrganization(null);
      setCurrentOrganization(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Error en el logout');
    }
  };

  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setError(null);
      setLoading(true);
      
      const firebaseUser = await createUser(email, password);
      
      if (firebaseUser) {
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userData.name || 'Usuario',
          userType: userData.userType || 'member', // Usar userType en lugar de role
          phone: userData.phone || '',
          createdAt: new Date(),
          organizationId: userData.organizationId || '',
          isActive: true
        };
        
        setUser(newUser);
        
        if (newUser.organizationId) {
          const org = await getOrganizationById(newUser.organizationId);
          if (org) {
            // Type assertion para compatibilidad temporal
            const organizationData = org as unknown as Organization;
            setOrganization(organizationData);
            setCurrentOrganization(organizationData);
          }
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      setError(error instanceof Error ? error.message : 'Error en el registro');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const org = await getOrganizationById(orgId);
      if (org) {
        // Type assertion para compatibilidad temporal
        const organizationData = org as unknown as Organization;
        setOrganization(organizationData);
        setCurrentOrganization(organizationData);
      }
    } catch (error) {
      console.error('Error switching organization:', error);
      setError('Error al cambiar de organización');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    organization,
    switchOrganization
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
