const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// User data to create
const users = [
  {
    email: 'john@community.com',
    password: 'demo123',
    userData: {
      name: 'John Smith',
      userType: 'member',
      phone: '+1-555-0123',
      homeAddress: '123 Oak Street',
      vehicleInfo: 'Blue Honda Civic - ABC123',
      emergencyContacts: ['+1-555-0124', '+1-555-0125'],
      accessLevel: 'resident',
      qrCodeHash: 'member_john_123_oak_street_2024',
      qrCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  },
  {
    email: 'guard@community.com',
    password: 'demo123',
    userData: {
      name: 'Mike Johnson',
      userType: 'guard',
      phone: '+1-555-0200',
      badgeNumber: 'G001',
      shiftHours: '6 AM - 6 PM',
      accessLevel: 'guard',
    }
  }
];

async function setupUsers() {
  console.log('🚀 Setting up Firebase users...');
  
  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        user.email, 
        user.password
      );
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...user.userData,
        createdAt: serverTimestamp(),
        uid: userCredential.user.uid
      });
      
      console.log(`✅ User ${user.email} created successfully!`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${user.email} already exists, updating data...`);
        
        // Update existing user data
        try {
          await setDoc(doc(db, 'users', user.email), {
            ...user.userData,
            updatedAt: serverTimestamp(),
          }, { merge: true });
          console.log(`✅ User ${user.email} data updated successfully!`);
        } catch (updateError) {
          console.error(`❌ Error updating user ${user.email}:`, updateError.message);
        }
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('🎉 User setup complete!');
  console.log('\n📱 Test Credentials:');
  console.log('Member: john@community.com / demo123');
  console.log('Guard: guard@community.com / demo123');
}

// Run the setup
setupUsers().catch(console.error);
