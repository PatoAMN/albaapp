import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔥 Firebase Configuration - Updated with your actual values
const firebaseConfig = {
  apiKey: "AIzaSyBD8myTk6GHmWq5Fv44O_sIk4cZ-nmJ5jU",
  authDomain: "asociacion-de-colonos.firebaseapp.com",
  projectId: "asociacion-de-colonos",
  storageBucket: "asociacion-de-colonos.firebasestorage.app",
  messagingSenderId: "396187509428",
  appId: "1:396187509428:web:383d5ab444a5908996ede1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Authentication functions
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const createUser = async (email: string, password: string, userData: any) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      uid: userCredential.user.uid
    });
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

// Member management functions
export const createMember = async (memberData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'members'), {
      ...memberData,
      createdAt: serverTimestamp(),
      qrCodeHash: generateQRHash(memberData.email, memberData.homeAddress),
      qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    return docRef;
  } catch (error) {
    throw error;
  }
};

export const getMemberByQR = async (qrCodeHash: string) => {
  try {
    const q = query(collection(db, 'members'), where('qrCodeHash', '==', qrCodeHash));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getAllMembers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'members'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw error;
  }
};

// Access logging functions
export const logAccess = async (accessData: any) => {
  try {
    await addDoc(collection(db, 'accessLogs'), {
      ...accessData,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};

// QR code generation helper
const generateQRHash = (email: string, address: string) => {
  const timestamp = Date.now();
  return `member_${email}_${address}_${timestamp}`;
};

// For development/testing - mock data
export const mockFirebaseData = {
  members: [
    {
      id: '1',
      email: 'john@community.com',
      name: 'John Smith',
      userType: 'member' as const,
      phone: '+1-555-0123',
      createdAt: new Date(),
      homeAddress: '123 Oak Street',
      vehicleInfo: 'Blue Honda Civic - ABC123',
      emergencyContacts: ['+1-555-0124', '+1-555-0125'],
      accessLevel: 'resident' as const,
      qrCodeHash: 'member_john_123_oak_street_2024',
      qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      email: 'sarah@community.com',
      name: 'Sarah Wilson',
      userType: 'member' as const,
      phone: '+1-555-0126',
      createdAt: new Date(),
      homeAddress: '456 Pine Avenue',
      vehicleInfo: 'Red Toyota Camry - XYZ789',
      emergencyContacts: ['+1-555-0127'],
      accessLevel: 'resident' as const,
      qrCodeHash: 'member_sarah_456_pine_avenue_2024',
      qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  ],
  guards: [
    {
      id: '1',
      email: 'guard@community.com',
      name: 'Mike Johnson',
      userType: 'guard' as const,
      phone: '+1-555-0200',
      createdAt: new Date(),
      badgeNumber: 'G001',
      shiftHours: '6 AM - 6 PM',
      accessLevel: 'guard' as const,
    }
  ]
};
