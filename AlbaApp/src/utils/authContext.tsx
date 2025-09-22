import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, loginUser, logoutUser } from './firebase';
import { Member, Guard, User } from '../types';
import NotificationService from './notifications';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: 'member' | 'guard') => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar notificaciones al cargar la app
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          console.log('Notificaciones push configuradas:', token);
        }
      } catch (error) {
        console.error('Error configurando notificaciones:', error);
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Use the userType from database or default to member
            const userWithId: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || '',
              userType: userData.userType || 'member',
              phone: userData.phone || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
              ...userData
            };
            setUser(userWithId);
          } else {
            // If no user document exists, create a basic user object
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              userType: 'member', // Default to member
              phone: '',
              createdAt: new Date(),
            };
            setUser(basicUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user object
          const basicUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            userType: 'member', // Default to member
            phone: '',
            createdAt: new Date(),
          };
          setUser(basicUser);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // Remove the dependency to prevent infinite loops

  const login = async (email: string, password: string, userType: 'member' | 'guard') => {
    try {
      console.log('Starting login for userType:', userType);
      setIsLoading(true);
      await loginUser(email, password);
      
      // Get the current Firebase user
      const currentUser = auth.currentUser;
      console.log('Current user after login:', currentUser?.uid);
      
      if (currentUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          console.log('User document exists:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data from Firestore:', userData);
            // Use the userType from login, not from database
            const userWithId: User = {
              id: currentUser.uid,
              email: currentUser.email || '',
              name: userData.name || '',
              userType: userType, // Use the userType from login
              phone: userData.phone || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
              ...userData
            };
            console.log('Setting user with userType:', userWithId.userType);
            setUser(userWithId);
          } else {
            // If no user document exists, create a basic user object with correct userType
            const basicUser: User = {
              id: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || 'User',
              userType: userType, // Use the userType from login
              phone: '',
              createdAt: new Date(),
            };
            console.log('Setting basic user with userType:', basicUser.userType);
            setUser(basicUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user object with correct userType
          const basicUser: User = {
            id: currentUser.uid,
            email: currentUser.email || '',
            name: currentUser.displayName || 'User',
            userType: userType, // Use the userType from login
            phone: '',
            createdAt: new Date(),
          };
          console.log('Setting fallback user with userType:', basicUser.userType);
          setUser(basicUser);
        }
      } else {
        // Fallback if no current user (shouldn't happen but just in case)
        console.warn('No current user after login');
        throw new Error('No se pudo obtener la información del usuario');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Reset loading state
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
