import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - misma configuración que el panel web
const firebaseConfig = {
  apiKey: "AIzaSyC0GH4ijTwOns7Gxv5LrP3MxaJoc7jkRk8",
  authDomain: "safegate-system.firebaseapp.com",
  projectId: "safegate-system",
  storageBucket: "safegate-system.firebasestorage.app",
  messagingSenderId: "530344581834",
  appId: "1:530344581834:web:0c8875d5677f9665b7f233",
  measurementId: "G-3ECN4HQG98"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

// Auth functions
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Organization functions
export const createOrganization = async (orgData: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'organizations'), {
      ...orgData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

export const getOrganizationById = async (orgId: string) => {
  try {
    const docRef = doc(db, 'organizations', orgId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const orgData = docSnap.data();
      return {
        id: docSnap.id,
        name: orgData.name || '',
        displayName: orgData.displayName || orgData.name || '',
        address: orgData.address || '',
        city: orgData.city || '',
        state: orgData.state || '',
        country: orgData.country || '',
        zipCode: orgData.zipCode || '',
        phone: orgData.phone || '',
        email: orgData.email || '',
        website: orgData.website || '',
        description: orgData.description || '',
        logo: orgData.logo || '',
        settings: orgData.settings || {},
        createdAt: orgData.createdAt || new Date(),
        updatedAt: orgData.updatedAt || new Date(),
        status: orgData.status || 'active'
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting organization:', error);
    throw error;
  }
};

export const updateOrganization = async (orgId: string, updates: any) => {
  try {
    const docRef = doc(db, 'organizations', orgId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

export const getOrganizationByCommunityCode = async (communityCode: string) => {
  try {
    console.log('🔍 Buscando organización con código:', communityCode);
    
    const q = query(
      collection(db, 'organizations'), 
      where('settings.security.communityCode', '==', communityCode)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const orgData = doc.data();
      const organization = {
        id: doc.id,
        name: orgData.name || '',
        displayName: orgData.displayName || orgData.name || '',
        address: orgData.address || '',
        city: orgData.city || '',
        state: orgData.state || '',
        country: orgData.country || '',
        zipCode: orgData.zipCode || '',
        phone: orgData.phone || '',
        email: orgData.email || '',
        website: orgData.website || '',
        description: orgData.description || '',
        logo: orgData.logo || '',
        settings: orgData.settings || {},
        createdAt: orgData.createdAt || new Date(),
        updatedAt: orgData.updatedAt || new Date(),
        status: orgData.status || 'active'
      };
      console.log('✅ Organización encontrada:', organization.displayName || organization.name);
      return organization;
    } else {
      console.log('❌ No se encontró organización con código:', communityCode);
      return null;
    }
    
  } catch (error) {
    console.error('Error getting organization by community code:', error);
    throw error;
  }
};

// User functions (for members)
export const createUserMember = async (userData: any, organizationId: string): Promise<string> => {
  try {
    const userWithOrg = {
      ...userData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastUpdated: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'users'), userWithOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error creating user member:', error);
    throw error;
  }
};

export const getUserByQR = async (qrCode: string, organizationId: string) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('qrCodeHash', '==', qrCode),
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user by QR:', error);
    throw error;
  }
};

export const getAllUsers = async (organizationId: string) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Guard functions
export const createGuard = async (guardData: any, organizationId: string): Promise<string> => {
  try {
    const guardWithOrg = {
      ...guardData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'guards'), guardWithOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error creating guard:', error);
    throw error;
  }
};

export const getAllGuards = async (organizationId: string) => {
  try {
    const q = query(
      collection(db, 'guards'), 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all guards:', error);
    throw error;
  }
};

// Guest functions
export const createGuest = async (guestData: any, organizationId: string): Promise<string> => {
  try {
    const guestWithOrg = {
      ...guestData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'guests'), guestWithOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error creating guest:', error);
    throw error;
  }
};

export const getGuestsByOrganization = async (organizationId: string) => {
  try {
    const q = query(
      collection(db, 'guests'), 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting guests by organization:', error);
    throw error;
  }
};

// Access Point functions
export const createAccessPoint = async (accessPointData: any, organizationId: string): Promise<string> => {
  try {
    const accessPointWithOrg = {
      ...accessPointData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'accessPoints'), accessPointWithOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error creating access point:', error);
    throw error;
  }
};

export const getAccessPointsByOrganization = async (organizationId: string) => {
  try {
    const q = query(
      collection(db, 'accessPoints'), 
      where('organizationId', '==', organizationId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting access points by organization:', error);
    throw error;
  }
};

// Access Log functions
export const logAccess = async (accessData: any, organizationId: string): Promise<string> => {
  try {
    const accessLogWithOrg = {
      ...accessData,
      organizationId,
      timestamp: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'accessLogs'), accessLogWithOrg);
    return docRef.id;
  } catch (error) {
    console.error('Error logging access:', error);
    throw error;
  }
};

// QR Code generation
export const generateQRHash = (organizationId: string, memberData: any): string => {
  const data = `${organizationId}_${memberData.userType}_${memberData.name}_${memberData.address}_${new Date().getFullYear()}`;
  return `org_${data}`;
};

// User update functions
export const updateUser = async (userId: string, updates: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
      lastUpdated: new Date()
    });
    console.log('✅ User updated successfully:', userId);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profileData: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    console.log('🔄 Actualizando perfil de usuario:', userId);
    console.log('📊 Datos recibidos:', profileData);
    
    // Preparar los datos para actualizar
    const updateData: any = {
      updatedAt: new Date(),
      lastUpdated: new Date()
    };

    // Información personal básica
    if (profileData.name) updateData.name = profileData.name;
    if (profileData.phone) updateData.phone = profileData.phone;
    if (profileData.homeAddress) updateData.homeAddress = profileData.homeAddress;
    if (profileData.birthDate) updateData.birthDate = profileData.birthDate;

    // Información de residencia
    if (profileData.homeNumber) updateData.homeNumber = profileData.homeNumber;
    if (profileData.parkingSpot) updateData.parkingSpot = profileData.parkingSpot;

    // Información del edificio
    if (profileData.buildingInfo) {
      updateData.buildingInfo = {
        tower: profileData.buildingInfo.tower || '',
        apartment: profileData.buildingInfo.apartment || ''
      };
      console.log('🏢 Información de edificio a guardar:', updateData.buildingInfo);
    }

    // Tipo de residencia (para comunidades mixtas)
    if (profileData.residenceType) {
      updateData.residenceType = profileData.residenceType;
      console.log('🏠 Tipo de residencia a guardar:', profileData.residenceType);
    }

    // Información del vehículo
    if (profileData.vehicleInfo) {
      updateData.vehicleInfo = {
        plate: profileData.vehicleInfo.plate || '',
        model: profileData.vehicleInfo.model || '',
        color: profileData.vehicleInfo.color || '',
        year: profileData.vehicleInfo.year || ''
      };
      console.log('🚗 Información del vehículo a guardar:', updateData.vehicleInfo);
    }

    // Contactos de emergencia
    if (profileData.emergencyContacts) {
      updateData.emergencyContacts = profileData.emergencyContacts;
      console.log('📞 Contactos de emergencia a guardar:', profileData.emergencyContacts.length, 'contactos');
    }

    console.log('💾 Datos finales a actualizar en Firebase:', updateData);

    await updateDoc(userRef, updateData);
    console.log('✅ User profile updated successfully:', userId);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

// Función específica para actualizar contactos de emergencia
export const updateEmergencyContacts = async (userId: string, emergencyContacts: any[]): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      emergencyContacts: emergencyContacts,
      updatedAt: new Date(),
      lastUpdated: new Date()
    });
    
    console.log('✅ Emergency contacts updated successfully for user:', userId);
  } catch (error) {
    console.error('Error updating emergency contacts:', error);
    throw error;
  }
};

// Función para agregar un contacto de emergencia individual
export const addEmergencyContact = async (userId: string, contact: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Obtener contactos actuales
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentContacts = userDoc.data().emergencyContacts || [];
    const newContact = {
      ...contact,
      id: contact.id || Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedContacts = [...currentContacts, newContact];
    
    await updateDoc(userRef, {
      emergencyContacts: updatedContacts,
      updatedAt: new Date(),
      lastUpdated: new Date()
    });
    
    console.log('✅ Emergency contact added successfully for user:', userId);
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
};

// Función para actualizar un contacto de emergencia específico
export const updateEmergencyContact = async (userId: string, contactId: string, contactData: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Obtener contactos actuales
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentContacts = userDoc.data().emergencyContacts || [];
    const updatedContacts = currentContacts.map(contact => 
      contact.id === contactId 
        ? { ...contact, ...contactData, updatedAt: new Date() }
        : contact
    );
    
    await updateDoc(userRef, {
      emergencyContacts: updatedContacts,
      updatedAt: new Date(),
      lastUpdated: new Date()
    });
    
    console.log('✅ Emergency contact updated successfully for user:', userId);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
};

// Función para eliminar un contacto de emergencia
export const removeEmergencyContact = async (userId: string, contactId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Obtener contactos actuales
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentContacts = userDoc.data().emergencyContacts || [];
    const updatedContacts = currentContacts.filter(contact => contact.id !== contactId);
    
    await updateDoc(userRef, {
      emergencyContacts: updatedContacts,
      updatedAt: new Date(),
      lastUpdated: new Date()
    });
    
    console.log('✅ Emergency contact removed successfully for user:', userId);
  } catch (error) {
    console.error('Error removing emergency contact:', error);
    throw error;
  }
};

// Real-time listeners
export const listenToOrganization = (orgId: string, callback: (data: any) => void) => {
  const docRef = doc(db, 'organizations', orgId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

export const listenToUsers = (organizationId: string, callback: (data: any[]) => void) => {
  const q = query(
    collection(db, 'users'), 
    where('organizationId', '==', organizationId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

export const listenToAccessLogs = (organizationId: string, callback: (data: any[]) => void) => {
  const q = query(
    collection(db, 'accessLogs'), 
    where('organizationId', '==', organizationId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(logs);
  });
};

export { auth, db };
