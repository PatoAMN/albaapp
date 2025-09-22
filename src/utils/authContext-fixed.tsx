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
  login: (credentials: LoginCredentials, organizationId?: string) => Promise<void>;
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
        try {
          // Buscar el usuario en todas las organizaciones
          let userData: User | null = null;
          
          // Primero buscar en miembros
          const organizationsRef = collection(db, 'organizations');
          const orgsSnapshot = await getDocs(organizationsRef);
          
          for (const orgDoc of orgsSnapshot.docs) {
            const orgId = orgDoc.id;
            
            // Buscar en miembros
            const membersRef = collection(db, 'organizations', orgId, 'members');
            const membersQuery = query(membersRef, where('uid', '==', firebaseUser.uid));
            const membersSnapshot = await getDocs(membersQuery);
            
            if (!membersSnapshot.empty) {
              const memberDoc = membersSnapshot.docs[0];
              const memberData = memberDoc.data();
              userData = {
                id: memberDoc.id, // ID del documento en Firestore
                uid: firebaseUser.uid, // UID de Firebase Auth
                email: memberData.email || firebaseUser.email || '',
                name: memberData.name || firebaseUser.displayName || '',
                userType: 'member',
                phone: memberData.phone || '',
                createdAt: memberData.createdAt || new Date(),
                organizationId: orgId,
                isActive: memberData.status === 'active'
              };
              break;
            }
            
            // Buscar en guardias
            const guardsRef = collection(db, 'organizations', orgId, 'guards');
            const guardsQuery = query(guardsRef, where('uid', '==', firebaseUser.uid));
            const guardsSnapshot = await getDocs(guardsQuery);
            
            if (!guardsSnapshot.empty) {
              const guardDoc = guardsSnapshot.docs[0];
              const guardData = guardDoc.data();
              userData = {
                id: guardDoc.id, // ID del documento en Firestore
                uid: firebaseUser.uid, // UID de Firebase Auth
                email: guardData.email || firebaseUser.email || '',
                name: guardData.name || firebaseUser.displayName || '',
                userType: 'guard',
                phone: guardData.phone || '',
                createdAt: guardData.createdAt || new Date(),
                organizationId: orgId,
                isActive: guardData.status === 'active'
              };
              break;
            }
          }
          
          if (userData) {
            setUser(userData);
            
            // Load organization if user has one
            if (userData.organizationId) {
              const org = await getOrganizationById(userData.organizationId);
              if (org) {
                setOrganization(org);
                setCurrentOrganization(org);
              }
            }
          } else {
            // Create basic user data if not found
            const userData: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Usuario',
              userType: 'member',
              phone: '',
              createdAt: new Date(),
              organizationId: '',
              isActive: true
            };
            setUser(userData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Set basic user data on error
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Usuario',
            userType: 'member',
            phone: '',
            createdAt: new Date(),
            organizationId: '',
            isActive: true
          };
          setUser(userData);
        }
      } else {
        setUser(null);
        setOrganization(null);
        setCurrentOrganization(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentOrganization]);

  const login = async (credentials: LoginCredentials, organizationId?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Login with Firebase
      const firebaseUser = await loginUser(credentials.email, credentials.password);
      
      // Get user data from Firestore users collection
      if (firebaseUser) {
        try {
          // First try to get user from users collection
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const newUser: User = {
              id: firebaseUser.uid,
              email: userData.email || firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || 'Usuario',
              userType: userData.userType || 'member',
              phone: userData.phone || '',
              createdAt: userData.createdAt || new Date(),
              organizationId: userData.organizationId || organizationId || '',
              isActive: userData.isActive || true
            };
            
            setUser(newUser);
            console.log('✅ Usuario logueado:', newUser.userType);
            
            // Load organization if user has one
            if (newUser.organizationId) {
              const org = await getOrganizationById(newUser.organizationId);
              if (org) {
                setOrganization(org);
                setCurrentOrganization(org);
              }
            }
          } else {
            // User not found in users collection, try to find in organizations
            let userData: User | null = null;
            
            // Search in all organizations
            const organizationsRef = collection(db, 'organizations');
            const orgsSnapshot = await getDocs(organizationsRef);
            
            for (const orgDoc of orgsSnapshot.docs) {
              const orgId = orgDoc.id;
              
              // Search in members
              const membersRef = collection(db, 'organizations', orgId, 'members');
              const membersQuery = query(membersRef, where('email', '==', credentials.email));
              const membersSnapshot = await getDocs(membersQuery);
              
              if (!membersSnapshot.empty) {
                const memberDoc = membersSnapshot.docs[0];
                const memberData = memberDoc.data();
                userData = {
                  id: memberDoc.id,
                  uid: firebaseUser.uid,
                  email: memberData.email || firebaseUser.email || '',
                  name: memberData.name || firebaseUser.displayName || '',
                  userType: 'member',
                  phone: memberData.phone || '',
                  createdAt: memberData.createdAt || new Date(),
                  organizationId: orgId,
                  isActive: memberData.status === 'active'
                };
                break;
              }
              
              // Search in guards
              const guardsRef = collection(db, 'organizations', orgId, 'guards');
              const guardsQuery = query(guardsRef, where('email', '==', credentials.email));
              const guardsSnapshot = await getDocs(guardsQuery);
              
              if (!guardsSnapshot.empty) {
                const guardDoc = guardsSnapshot.docs[0];
                const guardData = guardDoc.data();
                userData = {
                  id: guardDoc.id,
                  uid: firebaseUser.uid,
                  email: guardData.email || firebaseUser.email || '',
                  name: guardData.name || firebaseUser.displayName || '',
                  userType: 'guard',
                  phone: guardData.phone || '',
                  createdAt: guardData.createdAt || new Date(),
                  organizationId: orgId,
                  isActive: guardData.status === 'active'
                };
                break;
              }
            }
            
            if (userData) {
              setUser(userData);
              console.log('✅ Usuario encontrado en organización:', userData.userType);
              
              // Load organization
              if (userData.organizationId) {
                const org = await getOrganizationById(userData.organizationId);
                if (org) {
                  setOrganization(org);
                  setCurrentOrganization(org);
                }
              }
            } else {
              throw new Error('Usuario no encontrado en ninguna organización');
            }
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
          name: userData.name || firebaseUser.displayName || 'Usuario',
          userType: userData.userType || 'member',
          phone: userData.phone || '',
          createdAt: new Date(),
          organizationId: userData.organizationId || '',
          isActive: true
        };
        
        setUser(newUser);
        
        if (newUser.organizationId) {
          const org = await getOrganizationById(newUser.organizationId);
          if (org) {
            setOrganization(org);
            setCurrentOrganization(org);
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
        setOrganization(org);
        setCurrentOrganization(org);
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
