const admin = require('firebase-admin');

// Initialize Firebase Admin (this will use the default credentials)
admin.initializeApp({
  projectId: 'asociacion-de-colonos'
});

const auth = admin.auth();
const db = admin.firestore();

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
  console.log('🚀 Setting up Firebase users with Admin SDK...');
  
  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.userData.name,
      });
      
      // Store additional user data in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        ...user.userData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uid: userRecord.uid
      });
      
      console.log(`✅ User ${user.email} created successfully with UID: ${userRecord.uid}`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User ${user.email} already exists, updating data...`);
        
        // Get existing user
        try {
          const userRecord = await auth.getUserByEmail(user.email);
          
          // Update existing user data
          await db.collection('users').doc(userRecord.uid).set({
            ...user.userData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
